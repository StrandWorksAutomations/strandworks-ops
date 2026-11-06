import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  DashboardCodexBridge, validateConfig, createOwnerLoopRpc, eventMarker,
  acquireProcessLock, atomicJson, routeFor,
} from './dashboard-codex-bridge.mjs';

const THREAD = '01a1ae46-28d6-7f91-8f60-1483a4175703';
const OTHER_THREAD = '01a1b0df-c7ce-78c0-8049-81c15e95b664';
const EVENT = '5fca7210-d88c-4c89-9f26-a59ac8e3dfe1';
const NOW = '2026-11-06T15:00:00.000Z';
const START = '2026-11-06T14:59:00.000Z';

function row(overrides = {}) {
  return {
    id: EVENT, created_at: NOW, urgent: false, dispatch_state: 'none', option_key: 'A', body: '  Keep the exact wording.\nSecond line.  ',
    item: { id: '424cc86f-6a17-4bba-9d8c-7df5536ed9c3', ref: 'D-0999', project: 'bridge-canary', status: 'ruled', ruling: 'A', ruled_at: NOW, origin_session: THREAD, origin_agent: 'codex', origin_host: 'old-mac', origin_cwd: '/Users/example/PROJECTS/test', title: 'Verify delivery?', body: 'Background, not an instruction.', options: [{key:'A',label:'Continue the connection test'}] },
    ...overrides,
  };
}
async function harness(t, overrides = {}) {
  const stateDir = await mkdtemp(path.join(os.tmpdir(), 'strandworks-bridge-test-'));
  t.after(async () => {
    const resolved = path.resolve(stateDir);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('strandworks-bridge-test-'));
    await rm(resolved, { recursive: true, force: true });
  });
  const config = validateConfig({ version:1,mode:'canary',canaryThreadId:THREAD,startAt:START,stateDir,sessionRoutes:{[THREAD]:THREAD},projectRoutes:{},agentCommandBase:['C:\\node.exe','C:\\bridge\\dashboard-codex-bridge.mjs'],configPath:'C:\\bridge\\config.json',...overrides.config });
  const data = { rows: overrides.rows ?? [row()], enqueues: [], pending: [], history: [], marks: [], transitions: [], reads: [], callbackItem: row().item };
  const queue = {
    async enqueue(input) {
      data.enqueues.push(input);
      if (overrides.onEnqueue) return overrides.onEnqueue(input, data, config);
      const id = `queue-${data.enqueues.length}`;
      data.pending.push({id,clientUserMessageId:input.clientUserMessageId,input:[{type:'text',text:input.text}]});
      return id;
    },
    async list() { if (overrides.failQueueRead) throw new Error('offline'); return structuredClone(data.pending); },
    async readHistory() { if (overrides.failHistoryRead) throw new Error('offline'); return structuredClone(data.history); },
  };
  const rpc = async (name,args) => {
    if (name === 'owner_loop_outbox') { data.reads.push(args.p_mode); if (overrides.failMode === args.p_mode) throw new Error('read failed'); return structuredClone(data.rows); }
    if (name === 'owner_loop_outbox_mark') { if (overrides.failMark) throw new Error('mark failed'); data.marks.push(args); return {}; }
    if (name === 'owner_loop_get') return structuredClone(data.callbackItem);
    if (name === 'owner_loop_transition') { data.transitions.push(args); return {}; }
    throw new Error(`Unexpected RPC ${name}`);
  };
  const bridge = new DashboardCodexBridge({config,queueClient:queue,rpc,now:()=>new Date(NOW)});
  return {bridge,config,data,queue,rpc,stateDir};
}
async function getReceipt(h,id=EVENT) { return JSON.parse(await readFile(h.bridge.receiptPath(id),'utf8')); }
function observe(h, source = h.data.enqueues[0].text) {
  h.data.pending = [];
  h.data.history = [{id:'turn-observed',status:'completed',items:[{type:'userMessage',id:'user-observed',content:[{type:'text',text:source}]}]}];
}

test('ordinary response is durably prepared before add and queued exactly once across ticks',async t=>{
  const h=await harness(t,{onEnqueue:async(input,data,config)=>{
    const receipt=JSON.parse(await readFile(path.join(config.stateDir,'receipts',`${EVENT}.json`),'utf8'));
    assert.equal(receipt.state,'preparing');
    data.pending.push({id:'q1',clientUserMessageId:input.clientUserMessageId,input:[{type:'text',text:input.text}]});return 'q1';
  }});
  const first=await h.bridge.runOnce();
  assert.equal(first.ok,true); assert.equal(first.counts.queued,1);
  await h.bridge.runOnce();
  assert.equal(h.data.enqueues.length,1);
  assert.deepEqual(new Set(h.data.reads),new Set(['linear','watch','dispatch']));
  assert.equal(h.data.marks.length,0); assert.equal(h.data.transitions.length,0);
});

test('handoff preserves exact owner text, option, source IDs and explicit callback commands',async t=>{
  const h=await harness(t);await h.bridge.runOnce();
  const message=h.data.enqueues[0].text;
  assert.ok(message.includes(JSON.stringify(h.data.rows[0].body)));
  assert.ok(message.includes('Selected option key (verbatim): "A"'));
  assert.ok(message.includes(EVENT)); assert.ok(message.includes('D-0999'));
  assert.ok(message.includes(THREAD)); assert.ok(message.includes('acknowledge'));
  assert.ok(message.includes('complete')); assert.ok(message.includes('--response'));
  assert.equal(h.data.enqueues[0].threadId,THREAD);
});

test('partial failed outbox read is unavailable, never an empty successful queue',async t=>{
  const h=await harness(t,{failMode:'watch'});const health=await h.bridge.runOnce();
  assert.equal(health.ok,false);assert.equal(health.source.available,false);
  assert.equal(health.source.errorCode,'DASHBOARD_READ_FAILED');
  assert.equal(h.data.enqueues.length,0);assert.equal(health.lastSuccessfulReadAt,null);
});

test('ordinary response remains queued until matching persisted USER history exists',async t=>{
  const h=await harness(t);await h.bridge.runOnce();
  assert.equal(h.data.marks.length,0);
  observe(h);await h.bridge.runOnce();
  const receipt=await getReceipt(h);
  assert.equal(receipt.state,'delivered');assert.ok(receipt.observedAt);
  assert.equal(h.data.marks[0].p_patch.dispatch_state,'delivered');
  assert.equal(h.data.transitions.length,0);
});

test('queue removed without persisted history is ambiguous, not delivered or retransmitted',async t=>{
  const h=await harness(t);await h.bridge.runOnce();h.data.pending=[];
  const health=await h.bridge.runOnce();
  assert.equal(health.ok,false);assert.equal((await getReceipt(h)).state,'ambiguous');
  assert.equal(h.data.marks.length,0);
  await h.bridge.runOnce();assert.equal(h.data.enqueues.length,1);
});

test('assistant quotation of an event marker is not evidence of receipt',async t=>{
  const h=await harness(t);await h.bridge.runOnce();h.data.pending=[];
  h.data.history=[{id:'turn',items:[{type:'agentMessage',id:'assistant',text:eventMarker(EVENT)}]}];
  await h.bridge.runOnce();assert.equal((await getReceipt(h)).state,'ambiguous');assert.equal(h.data.marks.length,0);
});

test('uncertain add with pending evidence is reconciled without retry',async t=>{
  const h=await harness(t,{onEnqueue:async(input,data)=>{
    data.pending.push({id:'accepted-before-disconnect',clientUserMessageId:input.clientUserMessageId,input:[{type:'text',text:input.text}]});
    throw new Error('Connection closed after accepting');
  }});
  await h.bridge.runOnce();assert.equal((await getReceipt(h)).state,'queued');
  await h.bridge.runOnce();assert.equal(h.data.enqueues.length,1);
});

test('uncertain add with no pending/history evidence stays blocked from retransmission after restart',async t=>{
  const h=await harness(t,{onEnqueue:async()=>{throw new Error('Unknown result');}});
  await h.bridge.runOnce();
  const restarted=new DashboardCodexBridge({config:h.config,queueClient:h.queue,rpc:h.rpc,now:()=>new Date(NOW)});
  await restarted.runOnce();
  assert.equal(h.data.enqueues.length,1);assert.equal((await getReceipt(h)).state,'ambiguous');
});

test('restart after durable preparing receipt reconciles existing pending marker without add',async t=>{
  const h=await harness(t);
  await atomicJson(h.bridge.receiptPath(EVENT),{version:1,eventId:EVENT,ref:'D-0999',project:'bridge-canary',eventCreatedAt:NOW,targetThreadId:THREAD,clientUserMessageId:'existing-id',marker:eventMarker(EVENT),messageSha256:createHash('sha256').update(eventMarker(EVENT)).digest('hex'),state:'preparing'});
  h.data.pending=[{id:'existing-queue',input:[{type:'text',text:eventMarker(EVENT)}]}];
  await h.bridge.runOnce();assert.equal(h.data.enqueues.length,0);assert.equal((await getReceipt(h)).queueId,'existing-queue');
});

test('unmapped remote origin is visibly blocked and never creates or starts a new session',async t=>{
  const source=row();source.item.origin_session=OTHER_THREAD;
  const h=await harness(t,{rows:[source]});const health=await h.bridge.runOnce();
  assert.equal(health.counts.blocked,1);assert.equal(h.data.enqueues.length,0);
  assert.equal(health.ok,false);assert.equal(health.source.available,true);
  assert.equal((await getReceipt(h)).reason,'origin_session_not_routed');assert.equal(h.data.marks.length,0);
});

test('project fallback is possible only when explicitly mapped',async t=>{
  const source=row();source.item.origin_session=OTHER_THREAD;
  const h=await harness(t,{rows:[source],config:{projectRoutes:{'bridge-canary':THREAD}}});
  assert.equal(routeFor(source,h.config).threadId,THREAD);
  await h.bridge.runOnce();assert.equal(h.data.enqueues.length,1);
});

test('legacy urgent responses are excluded even with an explicit route',async t=>{
  const h=await harness(t,{rows:[row({urgent:true,dispatch_state:'queued'})]});const health=await h.bridge.runOnce();
  assert.equal(h.data.enqueues.length,0);assert.equal(health.skipped.legacy_urgent,1);assert.equal(h.data.marks.length,0);
});

test('watermark prevents old backlog and inactive or parked decisions never dispatch',async t=>{
  const cases=[row({created_at:'2026-11-01T00:00:00Z'}),row({item:{...row().item,status:'done'}}),row({item:{...row().item,status:'dropped'}}),row({item:{...row().item,deleted_at:NOW}}),row({item:{...row().item,archived_at:NOW}}),row({item:{...row().item,ruling:'PARK'}}),row({option_key:'DROP'})];
  for(let i=0;i<cases.length;i++)cases[i].id=`5fca7210-d88c-4c89-9f26-a59ac8e3df${String(i+10)}`;
  const h=await harness(t,{rows:cases});await h.bridge.runOnce();assert.equal(h.data.enqueues.length,0);assert.equal((await h.bridge.receipts()).length,0);
});

test('queue/history read failure does not claim delivery or produce a second submission',async t=>{
  const h=await harness(t,{failHistoryRead:true});const health=await h.bridge.runOnce();
  assert.equal(health.ok,false);assert.equal(h.data.enqueues.length,1);assert.equal(h.data.marks.length,0);
  await h.bridge.runOnce();assert.equal(h.data.enqueues.length,1);
});

test('backend delivery mark failure retains observed evidence and retries mark only',async t=>{
  const h=await harness(t,{failMark:true});await h.bridge.runOnce();observe(h);
  const health=await h.bridge.runOnce();assert.equal(health.ok,false);
  const receipt=await getReceipt(h);assert.equal(receipt.state,'started');assert.ok(receipt.observedAt);assert.equal(receipt.backendDeliveredAt,undefined);
  await h.bridge.runOnce();assert.equal(h.data.enqueues.length,1);
});

test('agent acknowledgment and completion require matching receipt/thread and observed history',async t=>{
  const h=await harness(t);await h.bridge.runOnce();
  await assert.rejects(h.bridge.transition({action:'pickup',ref:'D-0999',session:THREAD,responseId:EVENT,env:{}}),{code:'CALLBACK_NOT_OBSERVED'});
  observe(h);await h.bridge.runOnce();
  await assert.rejects(h.bridge.transition({action:'pickup',ref:'D-0999',session:OTHER_THREAD,responseId:EVENT,env:{}}),{code:'CALLBACK_RECEIPT_MISMATCH'});
  await h.bridge.transition({action:'pickup',ref:'D-0999',session:THREAD,responseId:EVENT,env:{}});
  assert.equal(h.data.transitions[0].p_action,'pickup');
  assert.equal(h.data.transitions[0].p_actor,`codex:${THREAD}`);
  h.data.callbackItem.status='picked_up';
  h.data.callbackItem.picked_up_by=`codex:${THREAD}`;
  await h.bridge.transition({action:'done',ref:'D-0999',session:THREAD,responseId:EVENT,note:'Confirmed the event reached this session.',env:{}});
  assert.equal(h.data.transitions[1].p_action,'done');assert.equal(h.data.transitions[1].p_note,'Confirmed the event reached this session.');
});

test('callback refuses stale owner revision or a different actual session environment',async t=>{
  const h=await harness(t);await h.bridge.runOnce();observe(h);await h.bridge.runOnce();
  await assert.rejects(h.bridge.transition({action:'pickup',ref:'D-0999',session:THREAD,responseId:EVENT,env:{CODEX_THREAD_ID:OTHER_THREAD}}),{code:'CALLBACK_SESSION_MISMATCH'});
  h.data.callbackItem.ruled_at='2026-11-06T15:01:00Z';
  await assert.rejects(h.bridge.transition({action:'done',ref:'D-0999',session:THREAD,responseId:EVENT,note:'Finished',env:{}}),{code:'CALLBACK_ITEM_CHANGED'});
  assert.equal(h.data.transitions.length,0);
});

test('canary configuration rejects additional target threads and implicit historical watermark',()=>{
  const base={version:1,mode:'canary',canaryThreadId:THREAD,startAt:START,sessionRoutes:{[THREAD]:THREAD}};
  assert.throws(()=>validateConfig({...base,startAt:null}),{code:'INVALID_CONFIG'});
  assert.throws(()=>validateConfig({...base,sessionRoutes:{[THREAD]:OTHER_THREAD}}),{code:'INVALID_CONFIG'});
  assert.throws(()=>validateConfig({...base,includeUrgent:true}),{code:'INVALID_CONFIG'});
});

test('second process lock is refused and lock is released cleanly',async t=>{
  const h=await harness(t);const release=await acquireProcessLock(h.stateDir);
  try {await assert.rejects(acquireProcessLock(h.stateDir),{code:'BRIDGE_LOCKED'});}finally{await release();}
  const releaseAgain=await acquireProcessLock(h.stateDir);await releaseAgain();
});

test('production proxy requires token only, sends no caller-controlled p_token, unwraps result',async()=>{
  let request;
  const rpc=createOwnerLoopRpc({env:{OWNER_LOOP_TOKEN:'FAKE_TEST_TOKEN'},home:'missing-home',fetchImpl:async(url,options)=>{request={url,options};return {ok:true,json:async()=>({result:[{id:EVENT}]})};}});
  const result=await rpc('owner_loop_outbox',{p_mode:'watch'});
  assert.equal(request.url,'https://dashboard.strandautomationworks.com/api/loop/agent');
  assert.equal(request.options.headers.Authorization,'Bearer FAKE_TEST_TOKEN');
  assert.deepEqual(JSON.parse(request.options.body),{function:'owner_loop_outbox',args:{p_mode:'watch'}});
  assert.equal(result[0].id,EVENT);
});

test('proxy errors never expose upstream response bodies or scoped token',async()=>{
  const rpc=createOwnerLoopRpc({env:{OWNER_LOOP_TOKEN:'FAKE_TEST_TOKEN'},fetchImpl:async()=>({ok:false,status:502,text:async()=> 'FAKE_TEST_TOKEN private upstream details'})});
  await assert.rejects(rpc('owner_loop_outbox',{p_mode:'watch'}),error=>error.code==='DASHBOARD_RPC_FAILED'&&!error.message.includes('FAKE_TEST_TOKEN')&&!error.message.includes('private'));
});

test('matching marker or client correlation with different text is never accepted as the actual handoff',async t=>{
  const h=await harness(t);await h.bridge.runOnce();
  h.data.pending=[{id:'unrelated',clientUserMessageId:h.data.enqueues[0].clientUserMessageId,input:[{type:'text',text:`A diagnostic quoting ${eventMarker(EVENT)}`}]}];
  observe(h,`Someone pasted only ${eventMarker(EVENT)} into a different user message.`);
  h.data.pending=[{id:'unrelated',clientUserMessageId:h.data.enqueues[0].clientUserMessageId,input:[{type:'text',text:`A diagnostic quoting ${eventMarker(EVENT)}`}]}];
  await h.bridge.runOnce();
  assert.equal((await getReceipt(h)).state,'ambiguous');assert.equal(h.data.marks.length,0);assert.equal(h.data.enqueues.length,1);
});

test('only newest response matching the current ruling is queued when old and new responses arrive together',async t=>{
  const currentItem={...row().item,ruling:'B',ruled_at:NOW};
  const old=row({id:'5fca7210-d88c-4c89-9f26-a59ac8e3dfe2',created_at:'2026-11-06T14:59:59Z',body:'Old answer',item:currentItem});
  const newest=row({option_key:'B',body:'Newest answer',item:currentItem});
  const h=await harness(t,{rows:[old,newest]});const health=await h.bridge.runOnce();
  assert.equal(h.data.enqueues.length,1);assert.ok(h.data.enqueues[0].text.includes('Newest answer'));assert.ok(!h.data.enqueues[0].text.includes('Old answer'));
  assert.equal(health.skipped.superseded_response,1);
});

test('current ruling timestamp check preserves sub-millisecond precision',async t=>{
  const source=row({created_at:'2026-11-06T15:00:00.000001Z',item:{...row().item,ruled_at:'2026-11-06T15:00:00.000002+00:00'}});
  const h=await harness(t,{rows:[source]});const health=await h.bridge.runOnce();
  assert.equal(h.data.enqueues.length,0);assert.equal(health.skipped.superseded_or_unverified_ruling,1);
});

test('callback refuses to acknowledge or finish work already owned by another worker',async t=>{
  const h=await harness(t);await h.bridge.runOnce();observe(h);await h.bridge.runOnce();
  h.data.callbackItem.status='picked_up';h.data.callbackItem.picked_up_by=`codex:${OTHER_THREAD}`;
  for(const action of ['pickup','done'])await assert.rejects(h.bridge.transition({action,ref:'D-0999',session:THREAD,responseId:EVENT,note:'Finished',env:{}}),{code:'CALLBACK_OWNERSHIP_MISMATCH'});
  assert.equal(h.data.transitions.length,0);
});

test('completion cannot skip the target session acknowledgment',async t=>{
  const h=await harness(t);await h.bridge.runOnce();observe(h);await h.bridge.runOnce();
  await assert.rejects(h.bridge.transition({action:'done',ref:'D-0999',session:THREAD,responseId:EVENT,note:'Finished',env:{}}),{code:'CALLBACK_OWNERSHIP_MISMATCH'});
  assert.equal(h.data.transitions.length,0);
});

test('routed mode requires an exact target UUID whitelist and never guesses a destination',async t=>{
  const h=await harness(t,{config:{mode:'routed',allowedThreadIds:[OTHER_THREAD],sessionRoutes:{[THREAD]:OTHER_THREAD}}});
  await h.bridge.runOnce();assert.equal(h.data.enqueues[0].threadId,OTHER_THREAD);
  assert.throws(()=>validateConfig({...h.config,allowedThreadIds:[THREAD]}),{code:'INVALID_CONFIG'});
  assert.throws(()=>validateConfig({...h.config,allowedThreadIds:[]}),{code:'INVALID_CONFIG'});
});

test('production-style fresh clients close each tick and recover after transport failure without a duplicate add',async t=>{
  const h=await harness(t);let created=0,closed=0;
  const bridge=new DashboardCodexBridge({config:h.config,rpc:h.rpc,now:()=>new Date(NOW),queueClientFactory:()=>{
    const number=++created;
    return {...h.queue,async readHistory(){if(number===1)throw new Error('Transport disconnected');return h.queue.readHistory();},async close(){closed++;}};
  }});
  assert.equal((await bridge.runOnce()).ok,false);
  assert.equal((await bridge.runOnce()).ok,true);
  assert.equal(created,2);assert.equal(closed,2);assert.equal(h.data.enqueues.length,1);
});
