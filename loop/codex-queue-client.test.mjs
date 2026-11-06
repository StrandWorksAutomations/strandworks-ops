import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough, Writable } from 'node:stream';
import { CodexQueueClient, CodexQueueError, clientUserMessageIdFor } from './codex-queue-client.mjs';

function harness(handler = () => {}, { refuseClose = false } = {}) {
  const requests = [];
  const spawns = [];
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.killCount = 0;
  child.kill = () => {
    child.killCount++;
    queueMicrotask(() => child.emit('close', null, 'SIGTERM'));
    return true;
  };
  let buffer = '';
  const reply = (id, result) => child.stdout.write(`${JSON.stringify({ id, result })}\n`);
  const error = (id, code, message, data) => child.stdout.write(`${JSON.stringify({ id, error: { code, message, data } })}\n`);
  child.stdin = new Writable({
    write(chunk, encoding, callback) {
      buffer += chunk.toString();
      let newline;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const message = JSON.parse(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        requests.push(message);
        queueMicrotask(() => {
          if (message.method === 'initialize') reply(message.id, { userAgent: 'fake-codex' });
          else handler(message, { reply, error, child });
        });
      }
      callback();
    },
  });
  child.stdin.on('finish', () => {
    if (!refuseClose) queueMicrotask(() => child.emit('close', 0, null));
  });
  const spawnImpl = (...args) => { spawns.push(args); return child; };
  const client = new CodexQueueClient({ spawnImpl, command: 'C:\\Installed Codex\\codex.exe', timeoutMs: 200, closeTimeoutMs: 30 });
  return { client, child, requests, spawns, spawnImpl, reply, error };
}

function queueItem(id, text = id, clientUserMessageId = `client-${id}`) {
  return { id, clientUserMessageId, input: [{ type: 'text', text }] };
}

test('initializes once, passes argv without a shell, and only persists queue input', async t => {
  const h = harness((message, { reply }) => {
    if (message.method === 'thread/queue/add') reply(message.id, { queuedSubmission: queueItem('queue-1') });
  });
  t.after(() => h.client.close());
  const text = 'Owner said: "yes"\nKeep $() and `ticks` literal. 日本語';
  assert.equal(await h.client.enqueue({ threadId: 'existing-thread', text, clientUserMessageId: 'stable-id' }), 'queue-1');
  assert.equal(h.spawns.length, 1);
  assert.equal(h.spawns[0][0], 'C:\\Installed Codex\\codex.exe');
  assert.deepEqual(h.spawns[0][1], ['app-server', '--stdio']);
  assert.equal(h.spawns[0][2].shell, false);
  assert.equal(h.spawns[0][2].windowsHide, true);
  assert.equal(h.requests[0].params.capabilities.experimentalApi, true);
  assert.equal(h.requests[1].method, 'initialized');
  assert.deepEqual(h.requests[2].params, {
    threadId: 'existing-thread', input: [{ type: 'text', text }], clientUserMessageId: 'stable-id',
  });
  assert.ok(h.requests.every(message => !/^(thread\/(start|resume)|turn\/)/.test(message.method)));
});

test('queue/list follows all pages and supplies text for receipt matching', async t => {
  const h = harness((message, { reply }) => {
    if (message.method !== 'thread/queue/list') return;
    if (!message.params.cursor) reply(message.id, { data: [queueItem('a')], nextCursor: 'page-2' });
    else reply(message.id, { data: [queueItem('b', 'second')], nextCursor: null });
  });
  t.after(() => h.client.close());
  const items = await h.client.list({ threadId: 'thread' });
  assert.deepEqual(items.map(item => [item.id, item.text]), [['a', 'a'], ['b', 'second']]);
  assert.equal(items[1].clientUserMessageId, 'client-b');
  assert.deepEqual(h.requests.filter(message => message.method === 'thread/queue/list').map(message => message.params.cursor), [undefined, 'page-2']);
});

test('repeated pagination cursors fail rather than looping forever', async t => {
  const h = harness((message, { reply }) => {
    if (message.method === 'thread/queue/list') reply(message.id, { data: [queueItem('a')], nextCursor: 'same' });
  });
  t.after(() => h.client.close());
  await assert.rejects(h.client.list({ threadId: 'thread' }), error => error.code === 'PROTOCOL_ERROR');
  assert.equal(h.requests.filter(message => message.method === 'thread/queue/list').length, 2);
});

test('matches concurrent, out-of-order responses by request ID', async t => {
  const reads = [];
  const h = harness((message, { reply }) => {
    if (message.method !== 'thread/read') return;
    reads.push(message);
    if (reads.length === 2) for (const request of [...reads].reverse()) reply(request.id, { thread: { id: request.params.threadId } });
  });
  t.after(() => h.client.close());
  const values = await Promise.all([h.client.readThread({ threadId: 'first' }), h.client.readThread({ threadId: 'second' })]);
  assert.deepEqual(values.map(value => value.id), ['first', 'second']);
  assert.equal(h.requests.filter(message => message.method === 'initialize').length, 1);
  assert.ok(reads.every(message => message.params.includeTurns === false));
});

test('chunked UTF-8 stdout and notifications do not corrupt responses', async t => {
  const h = harness((message, { child }) => {
    if (message.method !== 'thread/read') return;
    const bytes = Buffer.from(`${JSON.stringify({ method: 'warning', params: { message: 'diagnostic' } })}\n${JSON.stringify({ id: message.id, result: { thread: { id: '🌲' } } })}\n`);
    const emojiStart = bytes.indexOf(Buffer.from('🌲'));
    child.stdout.write(bytes.subarray(0, emojiStart + 1));
    child.stdout.write(bytes.subarray(emojiStart + 1, emojiStart + 3));
    child.stdout.write(bytes.subarray(emojiStart + 3));
  });
  t.after(() => h.client.close());
  const notices = [];
  h.client.on('notification', notification => notices.push(notification.method));
  assert.equal((await h.client.readThread({ threadId: 'thread' })).id, '🌲');
  assert.deepEqual(notices, ['warning']);
});

test('protocol errors preserve code/data and are not silently treated as empty queues', async t => {
  const h = harness((message, { error }) => {
    if (message.method === 'thread/queue/list') error(message.id, -32600, 'thread not found', { type: 'missing' });
  });
  t.after(() => h.client.close());
  await assert.rejects(h.client.list({ threadId: 'missing' }), error => {
    assert.ok(error instanceof CodexQueueError);
    assert.equal(error.code, -32600);
    assert.deepEqual(error.data, { type: 'missing' });
    assert.equal(error.method, 'thread/queue/list');
    return true;
  });
});

test('malformed stdout rejects pending adds without echoing its private contents', async t => {
  const h = harness((message, { child }) => {
    if (message.method === 'thread/queue/add') child.stdout.write('PRIVATE malformed output\n');
  });
  t.after(() => h.client.close());
  await assert.rejects(h.client.enqueue({ threadId: 'thread', text: 'ruling', clientUserMessageId: 'id' }), error => {
    assert.equal(error.code, 'PROTOCOL_ERROR');
    assert.equal(error.mayHaveSucceeded, true);
    assert.doesNotMatch(error.message, /PRIVATE/);
    return true;
  });
  assert.equal(h.child.killCount, 1);
});

test('enqueue timeout reports uncertain delivery and never retries automatically', async t => {
  const h = harness();
  h.client.timeoutMs = 20;
  t.after(() => h.client.close());
  await assert.rejects(h.client.enqueue({ threadId: 'thread', text: 'ruling', clientUserMessageId: 'stable-id' }), error =>
    error.code === 'REQUEST_TIMEOUT' && error.mayHaveSucceeded === true);
  assert.equal(h.requests.filter(message => message.method === 'thread/queue/add').length, 1);
});

test('same client ID does not claim server dedupe or suppress explicit second adds', async t => {
  let count = 0;
  const h = harness((message, { reply }) => {
    if (message.method === 'thread/queue/add') reply(message.id, { queuedSubmission: queueItem(`queue-${++count}`, 'ruling', message.params.clientUserMessageId) });
  });
  t.after(() => h.client.close());
  const input = { threadId: 'thread', text: 'ruling', clientUserMessageId: 'same-client-id' };
  assert.equal(await h.client.enqueue(input), 'queue-1');
  assert.equal(await h.client.enqueue(input), 'queue-2');
  assert.equal(h.client.serverDeduplicatesClientUserMessageId, false);
  assert.equal(CodexQueueClient.serverDeduplicatesClientUserMessageId, false);
  assert.deepEqual(h.requests.filter(message => message.method === 'thread/queue/add').map(message => message.params.clientUserMessageId), ['same-client-id', 'same-client-id']);
});

test('history pagination returns only public messages and reads unloaded item pages', async t => {
  const h = harness((message, { reply }) => {
    if (message.method === 'thread/turns/list') {
      assert.equal(message.params.itemsView, 'full');
      if (!message.params.cursor) reply(message.id, { data: [{ id: 'new', status: 'completed', itemsView: 'notLoaded' }], nextCursor: 'older' });
      else reply(message.id, { data: [{ id: 'old', status: 'completed', items: [{ type: 'reasoning', text: 'never return this' }, { type: 'agentMessage', id: 'old-answer', text: 'older reply' }] }], nextCursor: null });
    } else if (message.method === 'thread/items/list') {
      if (!message.params.cursor) reply(message.id, { data: [{ turnId: 'new', item: { type: 'userMessage', id: 'u', content: [{ type: 'text', text: 'event marker' }] } }], nextCursor: 'more-items' });
      else reply(message.id, { data: [
        { turnId: 'new', item: { type: 'commandExecution', command: 'private command' } },
        { turnId: 'new', item: { type: 'agentMessage', id: 'a', text: 'Applied event marker', phase: 'final' } },
      ], nextCursor: null });
    }
  });
  t.after(() => h.client.close());
  const result = await h.client.latestMessages({ threadId: 'thread', limit: 2 });
  assert.equal(result.user.text, 'event marker');
  assert.equal(result.assistant.text, 'Applied event marker');
  assert.equal(result.assistant.phase, 'final');
  assert.deepEqual(result.turns.map(turn => turn.id), ['new', 'old']);
  assert.doesNotMatch(JSON.stringify(result), /never return|private command/);
  assert.ok(h.requests.every(message => !/^(thread\/(start|resume)|turn\/)/.test(message.method)));
});

test('flat history preserves latest commentary instead of claiming it is a final answer', async t => {
  const h = harness((message, { reply }) => {
    if (message.method === 'thread/turns/list') reply(message.id, { data: [{ id: 't', status: 'inProgress', items: [
      { type: 'userMessage', id: 'u', content: [{ type: 'text', text: 'ruling' }] },
      { type: 'agentMessage', id: 'c', text: 'Working on it', phase: 'commentary' },
    ] }], nextCursor: null });
  });
  t.after(() => h.client.close());
  const messages = await h.client.readMessages({ threadId: 'thread' });
  assert.deepEqual(messages.map(message => message.id), ['c', 'u']);
  const latest = await h.client.readLatestMessages({ threadId: 'thread' });
  assert.equal(latest.assistant.phase, 'commentary');
  assert.equal(latest.assistant.turnStatus, 'inProgress');
});

test('unsupported paginated history falls back to legacy read without resuming', async t => {
  const h = harness((message, { reply, error }) => {
    if (message.method === 'thread/turns/list') error(message.id, -32601, 'unsupported method');
    else if (message.method === 'thread/read') reply(message.id, { thread: { turns: [
      { id: 'old', items: [{ type: 'agentMessage', text: 'old' }] },
      { id: 'new', items: [{ type: 'agentMessage', text: 'new' }] },
    ] } });
  });
  t.after(() => h.client.close());
  const turns = await h.client.readHistory({ threadId: 'thread', limit: 1 });
  assert.equal(turns.length, 1);
  assert.equal(turns[0].id, 'new');
  assert.equal(h.requests.find(message => message.method === 'thread/read').params.includeTurns, true);
});

test('child exit rejects pending requests and clean close is idempotent', async () => {
  const h = harness((message, { child }) => {
    if (message.method === 'thread/read') child.emit('close', 7, null);
  });
  await assert.rejects(h.client.readThread({ threadId: 'thread' }), error => error.code === 'PROCESS_CLOSED');
  await h.client.close();
  await h.client.close();
  await assert.rejects(h.client.readThread({ threadId: 'thread' }), error => error.code === 'CLIENT_CLOSED');
});

test('close ends stdin gracefully and kills only an unresponsive owned transport', async () => {
  const graceful = harness();
  await graceful.client.connect();
  await graceful.client.close();
  assert.equal(graceful.child.stdin.writableEnded, true);
  assert.equal(graceful.child.killCount, 0);
  const stubborn = harness(() => {}, { refuseClose: true });
  await stubborn.client.connect();
  await stubborn.client.close();
  assert.equal(stubborn.child.killCount, 1);
});

test('rejects server approval requests rather than granting them', async t => {
  const h = harness((message, { child, reply }) => {
    if (message.method === 'thread/read') {
      child.stdout.write(`${JSON.stringify({ id: 'approval', method: 'item/commandExecution/requestApproval', params: {} })}\n`);
      reply(message.id, { thread: { id: 'thread' } });
    }
  });
  t.after(() => h.client.close());
  await h.client.readThread({ threadId: 'thread' });
  const rejection = h.requests.find(message => message.id === 'approval');
  assert.equal(rejection.error.code, -32601);
  assert.equal(rejection.result, undefined);
});

test('deterministic IDs are thread-scoped UUIDv8 and invalid input never spawns', async () => {
  const first = clientUserMessageIdFor({ threadId: 't', eventId: 'e' });
  assert.equal(first, clientUserMessageIdFor({ threadId: 't', eventId: 'e' }));
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(first, clientUserMessageIdFor({ threadId: 'different', eventId: 'e' }));
  const h = harness();
  await assert.rejects(h.client.enqueue({ threadId: 't', text: '', clientUserMessageId: first }), TypeError);
  await assert.rejects(h.client.readHistory({ threadId: 't', limit: 0 }), RangeError);
  assert.equal(h.spawns.length, 0);
  await h.client.close();
});

test('spawn failure is reported without retrying or invoking another executable', async () => {
  let count = 0;
  const client = new CodexQueueClient({ spawnImpl() { count++; throw new Error('not installed'); } });
  await assert.rejects(client.readThread({ threadId: 'thread' }), error => error.code === 'TRANSPORT_ERROR');
  await assert.rejects(client.readThread({ threadId: 'thread' }), error => error.code === 'TRANSPORT_ERROR');
  assert.equal(count, 1);
  await client.close();
});

test('missing enqueue acknowledgement is ambiguous, not a successful receipt', async t => {
  const h = harness((message, { reply }) => {
    if (message.method === 'thread/queue/add') reply(message.id, {});
  });
  t.after(() => h.client.close());
  await assert.rejects(h.client.enqueue({ threadId: 't', text: 'ruling', clientUserMessageId: 'stable' }), error =>
    error.code === 'PROTOCOL_ERROR' && error.mayHaveSucceeded === true);
});

test('an oversized unterminated stdout line fails with a bounded diagnostic', async t => {
  const h = harness((message, { child }) => {
    if (message.method === 'thread/read') child.stdout.write('x'.repeat(100));
  });
  h.client.maxLineBytes = 80;
  t.after(() => h.client.close());
  await assert.rejects(h.client.readThread({ threadId: 't' }), error =>
    error.code === 'PROTOCOL_ERROR' && /size limit/.test(error.message));
});

test('closing an in-flight add reports uncertain delivery and settles without a timeout', async () => {
  const h = harness();
  await h.client.connect();
  const pending = h.client.enqueue({ threadId: 't', text: 'ruling', clientUserMessageId: 'stable' });
  const rejection = assert.rejects(pending, error => error.code === 'CLIENT_CLOSED' && error.mayHaveSucceeded === true);
  await new Promise(resolve => setImmediate(resolve));
  await h.client.close();
  await rejection;
});
