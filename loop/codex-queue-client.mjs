import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';

/**
 * Persistence client for an existing Codex thread's queue. This process never
 * resumes threads, starts turns, or executes model-generated commands.
 *
 * In Codex 0.166.0-alpha.6, clientUserMessageId is correlation metadata, NOT an
 * idempotency key: every thread/queue/add inserts another queue record. Reconcile
 * pending messages AND persisted user messages before retrying an uncertain add.
 * Source: openai/codex, codex-rs/state/src/runtime/queued_items.rs at that tag.
 */
export class CodexQueueError extends Error {
  constructor(message, { code = 'CODEX_QUEUE_ERROR', method, data, mayHaveSucceeded = false, cause } = {}) {
    super(message, { cause });
    this.name = 'CodexQueueError';
    this.code = code;
    this.method = method;
    this.data = data;
    this.mayHaveSucceeded = mayHaveSucceeded;
  }
}

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be a non-empty string`);
  return value;
}

function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(`${name} must be a positive integer`);
  return value;
}

/** Stable UUIDv8 for reconciliation; it does not make server-side adds idempotent. */
export function clientUserMessageIdFor({ threadId, eventId }) {
  requiredString(threadId, 'threadId');
  requiredString(eventId, 'eventId');
  const bytes = createHash('sha256')
    .update(JSON.stringify(['strandworks-codex-queue-v1', threadId, eventId]))
    .digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function protocolError(message, method) {
  return new CodexQueueError(message, { code: 'PROTOCOL_ERROR', method });
}

function unsupportedMethod(error) {
  return error instanceof CodexQueueError && (error.code === -32601 ||
    (error.code === -32600 && /unsupported|unknown (?:method|variant)/i.test(error.message)));
}

function publicItems(items) {
  return items.filter(item => item && (item.type === 'userMessage' || item.type === 'agentMessage'));
}

function messageText(item) {
  if (item.type === 'agentMessage') return typeof item.text === 'string' ? item.text : '';
  return (Array.isArray(item.content) ? item.content : [])
    .filter(part => part?.type === 'text' && typeof part.text === 'string')
    .map(part => part.text).join('\n');
}

function normalizeMessage(item, turn) {
  return {
    id: item.id, turnId: turn.id, role: item.type === 'userMessage' ? 'user' : 'assistant',
    text: messageText(item), phase: item.phase, turnStatus: turn.status,
    clientUserMessageId: item.clientUserMessageId ?? item.client_id,
  };
}

export class CodexQueueClient extends EventEmitter {
  static serverDeduplicatesClientUserMessageId = false;

  constructor({
    command = process.env.CODEX_APP_RUNTIME_CLI_PATH || 'codex',
    cwd,
    env,
    spawnImpl = spawn,
    transport,
    timeoutMs = 30_000,
    closeTimeoutMs = 1_000,
    maxLineBytes = 16 * 1024 * 1024,
  } = {}) {
    super();
    requiredString(command, 'command');
    positiveInteger(timeoutMs, 'timeoutMs');
    positiveInteger(closeTimeoutMs, 'closeTimeoutMs');
    positiveInteger(maxLineBytes, 'maxLineBytes');
    this.command = command;
    this.cwd = cwd;
    this.env = env ? { ...process.env, ...env } : process.env;
    this.spawnImpl = spawnImpl;
    this.transport = transport;
    this.timeoutMs = timeoutMs;
    this.closeTimeoutMs = closeTimeoutMs;
    this.maxLineBytes = maxLineBytes;
    this.serverDeduplicatesClientUserMessageId = false;
    this._pending = new Map();
    this._nextId = 1;
    this._buffer = '';
    this._closed = false;
    this._exited = false;
    this._failure = null;
    this._connectPromise = null;
    this._closePromise = null;
  }

  async connect() {
    if (this._closed) throw new CodexQueueError('Codex queue client is closed', { code: 'CLIENT_CLOSED' });
    if (this._failure) throw this._failure;
    if (!this._connectPromise) this._connectPromise = this._initialize();
    return this._connectPromise;
  }

  async _initialize() {
    try {
      const child = this.transport || this.spawnImpl(this.command, ['app-server', '--stdio'], {
        cwd: this.cwd,
        env: this.env,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        windowsHide: true,
      });
      if (!child?.stdin?.write || !child?.stdout?.on || !child?.on) {
        throw protocolError('Transport must provide child-process stdin, stdout and lifecycle events');
      }
      this._child = child;
      this._exitPromise = new Promise(resolve => { this._resolveExit = resolve; });
      child.stdout.setEncoding?.('utf8');
      child.stdout.on('data', chunk => this._receive(String(chunk)));
      child.stdout.on('error', error => this._fail(new CodexQueueError('Codex stdout failed', { code: 'TRANSPORT_ERROR', cause: error })));
      child.stdout.on('end', () => {
        if (this._buffer.trim() && !this._closed && !this._failure) {
          this._receive('\n');
        }
      });
      // Drain diagnostics without copying possible private data into errors or logs.
      child.stderr?.resume?.();
      child.stderr?.on?.('error', () => {});
      child.stdin.on?.('error', error => this._fail(new CodexQueueError('Codex stdin failed', { code: 'TRANSPORT_ERROR', cause: error })));
      child.on('error', error => this._fail(new CodexQueueError('Could not start Codex app-server', { code: 'SPAWN_ERROR', cause: error })));
      child.on('close', (code, signal) => {
        this._exited = true;
        this._resolveExit?.();
        if (!this._closed) this._fail(new CodexQueueError(
          `Codex app-server closed (code ${code ?? 'none'}, signal ${signal ?? 'none'})`,
          { code: 'PROCESS_CLOSED' },
        ));
      });
      this.serverInfo = await this._requestRaw('initialize', {
        clientInfo: { name: 'strandworks_dashboard_queue', title: 'Strandworks dashboard queue', version: '0.1.0' },
        capabilities: { experimentalApi: true },
      });
      this._write({ method: 'initialized' });
      if (this._failure) throw this._failure;
      return this.serverInfo;
    } catch (error) {
      const failure = error instanceof CodexQueueError ? error : new CodexQueueError(
        'Could not initialize Codex queue transport', { code: 'TRANSPORT_ERROR', cause: error },
      );
      this._fail(failure);
      throw failure;
    }
  }

  _write(message) {
    this._child.stdin.write(`${JSON.stringify(message)}\n`, 'utf8', error => {
      if (error) this._fail(new CodexQueueError('Writing Codex request failed', { code: 'TRANSPORT_ERROR', cause: error }));
    });
  }

  _receive(chunk) {
    if (this._failure || this._closed) return;
    this._buffer += chunk;
    let newline;
    while ((newline = this._buffer.indexOf('\n')) !== -1) {
      const line = this._buffer.slice(0, newline).replace(/\r$/, '');
      this._buffer = this._buffer.slice(newline + 1);
      if (Buffer.byteLength(line, 'utf8') > this.maxLineBytes) {
        this._fail(protocolError('Codex stdout line exceeded the configured size limit'));
        return;
      }
      if (!line.trim()) continue;
      let message;
      try { message = JSON.parse(line); }
      catch { this._fail(protocolError('Codex stdout contained malformed JSON')); return; }
      if (!message || typeof message !== 'object' || Array.isArray(message)) {
        this._fail(protocolError('Codex stdout contained an invalid protocol message')); return;
      }
      if (typeof message.method === 'string') {
        if (Object.hasOwn(message, 'id')) {
          // This client cannot approve actions or answer questions on a worker's behalf.
          try { this._write({ id: message.id, error: { code: -32601, message: 'This persistence client does not handle server requests' } }); }
          catch (error) { this._fail(new CodexQueueError('Writing Codex response failed', { code: 'TRANSPORT_ERROR', cause: error })); return; }
        } else {
          this.emit('notification', { method: message.method, params: message.params });
        }
        continue;
      }
      if (!Object.hasOwn(message, 'id') || Object.hasOwn(message, 'result') === Object.hasOwn(message, 'error')) {
        this._fail(protocolError('Codex stdout contained an invalid response envelope')); return;
      }
      const pending = this._pending.get(message.id);
      // A late response after a timed-out request is valid, but is not retried.
      if (!pending) continue;
      clearTimeout(pending.timer);
      this._pending.delete(message.id);
      if (Object.hasOwn(message, 'error')) {
        if (!message.error || typeof message.error.code !== 'number' || typeof message.error.message !== 'string') {
          pending.reject(new CodexQueueError('Codex returned a malformed protocol error', {
            code: 'PROTOCOL_ERROR', method: pending.method,
            mayHaveSucceeded: pending.method === 'thread/queue/add',
          }));
        } else {
          pending.reject(new CodexQueueError(message.error.message, {
            code: message.error.code, method: pending.method, data: message.error.data,
          }));
        }
      } else pending.resolve(message.result);
    }
    if (Buffer.byteLength(this._buffer, 'utf8') > this.maxLineBytes) {
      this._fail(protocolError('Codex stdout line exceeded the configured size limit'));
    }
  }

  _requestRaw(method, params) {
    if (this._failure) return Promise.reject(this._failure);
    if (this._closed) return Promise.reject(new CodexQueueError('Codex queue client is closed', { code: 'CLIENT_CLOSED', method }));
    const id = this._nextId++;
    return new Promise((resolve, reject) => {
      const pending = { resolve, reject, method, sent: false };
      pending.timer = setTimeout(() => {
        this._pending.delete(id);
        reject(new CodexQueueError(`Codex request timed out: ${method}`, {
          code: 'REQUEST_TIMEOUT', method,
          mayHaveSucceeded: method === 'thread/queue/add' && pending.sent,
        }));
      }, this.timeoutMs);
      this._pending.set(id, pending);
      try {
        pending.sent = true;
        this._write({ id, method, params });
      } catch (error) {
        this._fail(new CodexQueueError('Writing Codex request failed', { code: 'TRANSPORT_ERROR', cause: error }));
      }
    });
  }

  _fail(error) {
    if (this._failure) return;
    this._failure = error;
    for (const pending of this._pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new CodexQueueError(error.message, {
        code: error.code, method: pending.method, cause: error,
        mayHaveSucceeded: pending.sent && pending.method === 'thread/queue/add',
      }));
    }
    this._pending.clear();
    if (!this._exited) this._child?.kill?.();
  }

  async _request(method, params) {
    await this.connect();
    return this._requestRaw(method, params);
  }

  async enqueue({ threadId, text, clientUserMessageId }) {
    requiredString(threadId, 'threadId');
    requiredString(text, 'text');
    requiredString(clientUserMessageId, 'clientUserMessageId');
    const result = await this._request('thread/queue/add', {
      threadId, input: [{ type: 'text', text }], clientUserMessageId,
    });
    if (typeof result?.queuedSubmission?.id !== 'string' || !result.queuedSubmission.id) {
      throw new CodexQueueError('Codex queue acknowledgement did not include a queue ID', {
        code: 'PROTOCOL_ERROR', method: 'thread/queue/add', mayHaveSucceeded: true,
      });
    }
    return result.queuedSubmission.id;
  }

  async _pages(method, params, { limit = Infinity } = {}) {
    const items = [];
    const cursors = new Set();
    let cursor;
    do {
      const result = await this._request(method, {
        ...params, ...(cursor === undefined ? {} : { cursor }),
      });
      if (!Array.isArray(result?.data)) throw protocolError('Codex pagination response did not contain data', method);
      items.push(...result.data.slice(0, limit - items.length));
      cursor = result.nextCursor;
      if (cursor !== null && cursor !== undefined && (typeof cursor !== 'string' || !cursor)) {
        throw protocolError('Codex returned an invalid pagination cursor', method);
      }
      if (cursor && cursors.has(cursor)) throw protocolError('Codex repeated a pagination cursor', method);
      if (cursor) cursors.add(cursor);
    } while (cursor && items.length < limit);
    return items;
  }

  async list({ threadId }) {
    requiredString(threadId, 'threadId');
    const items = await this._pages('thread/queue/list', { threadId, limit: 100 });
    return items.map(item => {
      if (!item || typeof item.id !== 'string' || !Array.isArray(item.input)) {
        throw protocolError('Codex queue/list contained an invalid queued submission', 'thread/queue/list');
      }
      return {
        ...item,
        text: item.input.filter(part => part?.type === 'text' && typeof part.text === 'string')
          .map(part => part.text).join('\n'),
      };
    });
  }

  /** Runtime status is local to this persistence process, not the Desktop worker. */
  async readThread({ threadId }) {
    requiredString(threadId, 'threadId');
    const result = await this._request('thread/read', { threadId, includeTurns: false });
    if (!result?.thread || typeof result.thread !== 'object') throw protocolError('Codex thread/read omitted thread', 'thread/read');
    return result.thread;
  }

  /** Newest-first turns; only user/agent messages are returned, never reasoning. */
  async readHistory({ threadId, limit = 100 }) {
    requiredString(threadId, 'threadId');
    positiveInteger(limit, 'limit');
    let turns;
    try {
      turns = await this._pages('thread/turns/list', {
        threadId, limit: Math.min(limit, 100), sortDirection: 'desc', itemsView: 'full',
      }, { limit });
    } catch (error) {
      if (!unsupportedMethod(error)) throw error;
      const result = await this._request('thread/read', { threadId, includeTurns: true });
      if (!Array.isArray(result?.thread?.turns)) throw protocolError('Codex legacy history omitted turns', 'thread/read');
      turns = result.thread.turns.slice(-limit).reverse();
    }
    const safeTurns = [];
    for (const turn of turns) {
      if (!turn || typeof turn.id !== 'string') throw protocolError('Codex history contained an invalid turn', 'thread/turns/list');
      let items = turn.items;
      if (!Array.isArray(items) || turn.itemsView === 'notLoaded' || turn.itemsView === 'summary') {
        const entries = await this._pages('thread/items/list', {
          threadId, turnId: turn.id, limit: 100, sortDirection: 'asc',
        });
        items = entries.map(entry => entry?.item);
      }
      safeTurns.push({
        id: turn.id, status: turn.status, startedAt: turn.startedAt, completedAt: turn.completedAt,
        items: publicItems(items),
      });
    }
    return safeTurns;
  }

  async latestMessages(options) {
    const turns = await this.readHistory(options);
    let user = null;
    let assistant = null;
    for (const turn of turns) {
      for (const item of [...turn.items].reverse()) {
        const message = normalizeMessage(item, turn);
        if (message.role === 'user' && !user) user = message;
        if (message.role === 'assistant' && !assistant) assistant = message;
      }
      if (user && assistant) break;
    }
    return { user, assistant, turns };
  }

  readLatestMessages(options) { return this.latestMessages(options); }

  /** Flat public-message view, newest first. Commentary is explicitly identified. */
  async readMessages(options) {
    const turns = await this.readHistory(options);
    return turns.flatMap(turn => [...turn.items].reverse().map(item => normalizeMessage(item, turn)));
  }

  async close() {
    if (this._closePromise) return this._closePromise;
    this._closed = true;
    for (const pending of this._pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new CodexQueueError('Codex queue client closed during request', {
        code: 'CLIENT_CLOSED', method: pending.method,
        mayHaveSucceeded: pending.sent && pending.method === 'thread/queue/add',
      }));
    }
    this._pending.clear();
    this._closePromise = (async () => {
      if (!this._child || this._exited) return;
      const waitForExit = async () => {
        let timer;
        try {
          return await Promise.race([
            this._exitPromise.then(() => true),
            new Promise(resolve => { timer = setTimeout(() => resolve(false), this.closeTimeoutMs); }),
          ]);
        } finally { clearTimeout(timer); }
      };
      try { this._child.stdin.end(); }
      catch { this._child.kill?.(); }
      if (await waitForExit()) return;
      this._child.kill?.();
      if (!(await waitForExit())) {
        throw new CodexQueueError('Codex app-server did not close after termination', { code: 'CLOSE_TIMEOUT' });
      }
    })();
    return this._closePromise;
  }
}
