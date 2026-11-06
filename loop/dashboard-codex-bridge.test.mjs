import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  DashboardCodexBridge, validateConfig, createOwnerLoopRpc, eventMarker,
  acquireProcessLock, atomicJson, routeFor, createHeartbeatPublisher,
  createDesktopReadinessProbe, desktopReadyFromProcesses,
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
  const bridge = new DashboardCodexBridge({config,queueClient:queue,rpc,now:()=>new Date(NOW),heartbeatPublisher:overrides.heartbeatPublisher,desktopReadyProbe:overrides.desktopReadyProbe});
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

test('manual collection persists exact response evidence without opening, enqueuing or starting a chat',async t=>{
  let probes=0,factories=0;
  const h=await harness(t,{config:{deliveryMode:'manual',publishHeartbeat:true},heartbeatPublisher:async()=>{},desktopReadyProbe:async()=>{probes++;return true;}});
  h.bridge.queueClientFactory=()=>{factories++;throw new Error('Manual collection must not create a queue client');};
  h.bridge.queue=new Proxy({}, {get(){throw new Error('Manual collection must not use a queue client');}});
  const health=await h.bridge.runOnce();
  const receipt=await getReceipt(h);
  assert.equal(health.ok,true);assert.equal(health.deliveryMode,'manual');assert.equal(health.counts.awaiting_launch,1);
  assert.equal(receipt.state,'awaiting_launch');assert.equal(receipt.deliveryMode,'manual');
  assert.equal(receipt.collectedResponse.body,h.data.rows[0].body);
  assert.equal(receipt.collectedResponse.option_key,'A');
  assert.equal(receipt.collectedResponse.item.options[0].label,h.data.rows[0].item.options[0].label);
  assert.equal(receipt.originHost,'old-mac');assert.equal(receipt.itemRuledAt,NOW);
  assert.match(receipt.responseSha256,/^[a-f\d]{64}$/);
  assert.equal(Object.hasOwn(receipt,'targetThreadId'),false);assert.equal(Object.hasOwn(receipt,'clientUserMessageId'),false);
  assert.equal(factories,0);assert.equal(probes,0);assert.equal(h.data.enqueues.length,0);
  assert.equal(h.data.marks.length,0);assert.equal(h.data.transitions.length,0);
  await h.bridge.runOnce();
  assert.deepEqual(await getReceipt(h),receipt);
});

test('manual receipts stay inert after restart and after switching back to automatic configuration',async t=>{
  const h=await harness(t,{config:{deliveryMode:'manual'}});
  await h.bridge.runOnce();
  const collected=await getReceipt(h);
  const restarted=new DashboardCodexBridge({config:{...h.config,deliveryMode:'automatic'},queueClient:h.queue,rpc:h.rpc,now:()=>new Date(NOW)});
  assert.equal((await restarted.runOnce()).ok,true);
  assert.deepEqual(await getReceipt(h),collected);assert.equal(h.data.enqueues.length,0);
  await assert.rejects(restarted.transition({action:'pickup',ref:'D-0999',session:THREAD,responseId:EVENT,env:{}}),{code:'CALLBACK_RECEIPT_MISMATCH'});
});

test('manual collection preserves uncertain legacy receipts and makes no legacy queue or dashboard writes',async t=>{
  const h=await harness(t,{config:{deliveryMode:'manual'}});
  const legacy={version:1,eventId:EVENT,ref:'D-0999',project:'bridge-canary',eventCreatedAt:NOW,targetThreadId:THREAD,marker:eventMarker(EVENT),messageSha256:createHash('sha256').update(eventMarker(EVENT)).digest('hex'),state:'ambiguous',reason:'submission_result_unknown'};
  await atomicJson(h.bridge.receiptPath(EVENT),legacy);
  h.bridge.queue=new Proxy({}, {get(){throw new Error('Manual mode must not inspect a legacy chat');}});
  const health=await h.bridge.runOnce();
  assert.equal(health.ok,false);assert.equal(health.counts.ambiguous,1);
  assert.deepEqual(await getReceipt(h),legacy);assert.equal(h.data.enqueues.length,0);assert.equal(h.data.marks.length,0);
});

test('manual collection retains host, watermark, exclusion and current-revision gates',async t=>{
  const cases=[
    {config:{originHostAllowlist:['this-pc']},reason:'origin_host_not_allowed'},
    {config:{startAt:'2026-11-06T15:01:00Z'},reason:'before_watermark'},
    {config:{ignoredResponseIds:[EVENT]},reason:'owner_excluded_response'},
    {rows:[row({item:{...row().item,ruled_at:'2026-11-06T15:01:00Z'}})],reason:'superseded_or_unverified_ruling'},
  ];
  for(const entry of cases){
    const h=await harness(t,{...entry,config:{deliveryMode:'manual',...entry.config}});
    const health=await h.bridge.runOnce();
    assert.equal(health.skipped[entry.reason],1);assert.equal((await h.bridge.receipts()).length,0);assert.equal(h.data.enqueues.length,0);
  }
});

test('legacy configuration keeps automatic delivery and rejects unsupported delivery modes',()=>{
  const base={version:1,mode:'canary',canaryThreadId:THREAD,startAt:START,sessionRoutes:{[THREAD]:THREAD}};
  assert.equal(validateConfig(base).deliveryMode,'automatic');
  assert.throws(()=>validateConfig({...base,deliveryMode:'auto-launch'}),{code:'INVALID_CONFIG'});
});

test('manual collection uses source host instead of original-chat routes and counts only current eligible answers',async t=>{
  const source=row({item:{...row().item,origin_session:OTHER_THREAD}});
  const h=await harness(t,{rows:[source],config:{deliveryMode:'manual',mode:'routed',allowedThreadIds:[],sessionRoutes:{},originHostAllowlist:['old-mac']}});
  assert.equal((await h.bridge.runOnce()).counts.awaiting_launch,1);assert.equal((await getReceipt(h)).targetThreadId,undefined);
  h.data.rows[0].item.status='picked_up';
  assert.equal((await h.bridge.runOnce()).counts.awaiting_launch,0);
  assert.equal((await getReceipt(h)).state,'awaiting_launch');assert.equal(h.data.enqueues.length,0);
});

test('manual collection watermark retains microseconds',async t=>{
  const source=row({created_at:'2026-11-06T15:00:00.000001Z',item:{...row().item,ruled_at:'2026-11-06T15:00:00.000001Z'}});
  const h=await harness(t,{rows:[source],config:{deliveryMode:'manual',startAt:'2026-11-06T15:00:00.000002Z'}});
  assert.equal(h.config.startAt,'2026-11-06T15:00:00.000002Z');
  const health=await h.bridge.runOnce();assert.equal(health.skipped.before_watermark,1);assert.equal(health.counts.awaiting_launch,0);
});

test('manual polling stays single-flight while collection continues and receives the shutdown signal',async t=>{
  const h=await harness(t,{config:{deliveryMode:'manual',manualLaunches:{enabled:true}}});
  const controller=new AbortController();let polls=0,seenSignal,finish;
  h.bridge.manualWorker={pollOnce:async({signal})=>{polls++;seenSignal=signal;return new Promise(resolve=>{finish=resolve;});}};
  h.bridge.pollManual(controller.signal);await new Promise(resolve=>setImmediate(resolve));
  h.bridge.pollManual(controller.signal);
  const health=await h.bridge.runOnce();assert.equal(health.ok,true);assert.equal(health.manualLaunches.running,true);assert.equal(polls,1);assert.equal(seenSignal,controller.signal);
  controller.abort();assert.equal(seenSignal.aborted,true);finish();await h.bridge.manualPoll;
  assert.equal(h.bridge.manualPoll,null);h.bridge.pollManual(controller.signal);assert.equal(polls,1);
});

test('manual heartbeat publishes only aggregate waiting count and launch-error boolean',async()=>{
  let payload;
  const publish=createHeartbeatPublisher({env:{OWNER_LOOP_TOKEN:'FAKE'},fetchImpl:async(_url,options)=>{payload=JSON.parse(options.body);return{ok:true};}});
  await publish({health:{deliveryMode:'manual',checkedAt:NOW,intervalSeconds:30,source:{available:true},counts:{awaiting_launch:2},manualLaunches:{errorCode:'PRIVATE_LOCAL_ERROR'}},receipts:[]});
  assert.equal(payload.deliveryMode,'manual');assert.equal(payload.counts.awaiting_launch,2);assert.equal(payload.manualLaunchError,true);
  assert.equal(JSON.stringify(payload).includes('PRIVATE_LOCAL_ERROR'),false);
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

test('confirmed delivered receipts reuse durable evidence without any further queue or history requests',async t=>{
  const h=await harness(t);await h.bridge.runOnce();observe(h);await h.bridge.runOnce();
  const confirmed=await getReceipt(h);assert.equal(confirmed.state,'delivered');assert.ok(confirmed.backendDeliveredAt);assert.ok(confirmed.observedAt);
  h.queue.list=async()=>{assert.fail('Completed delivery must not query pending messages');};
  h.queue.readHistory=async()=>{assert.fail('Completed delivery must not reload thread history');};
  const marks=h.data.marks.length;
  const health=await h.bridge.runOnce();
  assert.equal(health.ok,true);assert.equal(health.counts.delivered,1);
  assert.deepEqual(await getReceipt(h),confirmed);assert.equal(h.data.marks.length,marks);assert.equal(h.data.enqueues.length,1);
});

test('durable observed evidence retries a pending backend mark after history advances without another enqueue or history read',async t=>{
  const h=await harness(t);await h.bridge.runOnce();observe(h);
  let markAttempts=0,queueReads=0,historyReads=0;
  h.bridge.rpc=async(name,args)=>{
    if(name==='owner_loop_outbox_mark' && ++markAttempts<=2)throw Object.assign(new Error('backend unavailable'),{code:'DASHBOARD_UNAVAILABLE'});
    return h.rpc(name,args);
  };
  const first=await h.bridge.runOnce();
  const observed=await getReceipt(h);
  assert.equal(first.ok,false);assert.equal(observed.state,'started');
  assert.ok(observed.observedAt);assert.ok(observed.messageSha256);assert.equal(observed.backendDeliveredAt,undefined);
  assert.equal(markAttempts,1);
  h.data.history=[];
  h.queue.list=async()=>{queueReads++;throw new Error('queue unavailable');};
  h.queue.readHistory=async()=>{historyReads++;throw new Error('history unavailable after its window advanced');};
  const stillPending=await h.bridge.runOnce();
  assert.equal(stillPending.ok,false);assert.equal(markAttempts,2);
  assert.equal((await getReceipt(h)).lastErrorCode,'DASHBOARD_UNAVAILABLE');
  const recovered=await h.bridge.runOnce();
  const delivered=await getReceipt(h);
  assert.equal(recovered.ok,true);assert.equal(recovered.counts.delivered,1);
  assert.equal(markAttempts,3);assert.equal(h.data.marks.length,1);
  assert.equal(delivered.state,'delivered');assert.ok(delivered.backendDeliveredAt);
  assert.equal(delivered.observedAt,observed.observedAt);assert.equal(delivered.messageSha256,observed.messageSha256);
  assert.equal(delivered.lastErrorCode,null);assert.equal(queueReads,0);assert.equal(historyReads,0);
  assert.equal(h.data.enqueues.length,1);
});

test('a newly explicit route recovers only an untouched block from a fresh current response',async t=>{
  const source=row();source.item.origin_session=OTHER_THREAD;
  const h=await harness(t,{rows:[source]});
  assert.equal((await h.bridge.runOnce()).ok,false);
  const blocked=await getReceipt(h);
  const routed=new DashboardCodexBridge({config:{...h.config,sessionRoutes:{[OTHER_THREAD]:THREAD}},queueClient:h.queue,rpc:h.rpc,now:()=>new Date(NOW)});
  const health=await routed.runOnce();
  assert.equal(health.ok,true);assert.equal(health.counts.queued,1);assert.equal(h.data.enqueues.length,1);
  const recovered=await getReceipt(h);
  assert.deepEqual(recovered.routeBlockedHistory,[{state:'blocked',reason:'origin_session_not_routed',recordedAt:blocked.updatedAt}]);
  assert.equal(recovered.routeRecoveredAt,NOW);
  await routed.runOnce();assert.equal(h.data.enqueues.length,1);
});

test('a route update cannot recover a block when the complete outbox is unavailable or the response is absent',async t=>{
  for(const condition of ['unavailable','absent']){
    const source=row();source.item.origin_session=OTHER_THREAD;
    const h=await harness(t,{rows:[source]});await h.bridge.runOnce();
    const before=await getReceipt(h);
    if(condition==='absent')h.data.rows=[];
    const rpc=condition==='unavailable'?async(name,args)=>{if(name==='owner_loop_outbox'&&args.p_mode==='watch')throw new Error('offline');return h.rpc(name,args);}:h.rpc;
    const routed=new DashboardCodexBridge({config:{...h.config,sessionRoutes:{[OTHER_THREAD]:THREAD}},queueClient:h.queue,rpc,now:()=>new Date(NOW)});
    assert.equal((await routed.runOnce()).ok,false);
    assert.equal(h.data.enqueues.length,0);assert.deepEqual(await getReceipt(h),before);
  }
});

test('a route update cannot recover a superseded, closed, archived or foreign-host response',async t=>{
  for(const condition of ['superseded','closed','archived','host']){
    const source=row();source.item.origin_session=OTHER_THREAD;
    const h=await harness(t,{rows:[source]});await h.bridge.runOnce();
    const before=await getReceipt(h);
    if(condition==='superseded')h.data.rows[0].item.ruled_at='2026-11-06T15:00:01Z';
    if(condition==='closed')h.data.rows[0].item.status='done';
    if(condition==='archived')h.data.rows[0].item.archived_at=NOW;
    const config={...h.config,sessionRoutes:{[OTHER_THREAD]:THREAD},...(condition==='host'?{originHostAllowlist:['different-pc']}:{})};
    const routed=new DashboardCodexBridge({config,queueClient:h.queue,rpc:h.rpc,now:()=>new Date(NOW)});
    await routed.runOnce();assert.equal(h.data.enqueues.length,0);assert.deepEqual(await getReceipt(h),before);
  }
});

test('explicit response exclusion skips new input and preserves a prior route block as ignored evidence',async t=>{
  const source=row();source.item.origin_session=OTHER_THREAD;
  const h=await harness(t,{rows:[source]});await h.bridge.runOnce();
  const before=await getReceipt(h);
  const excluded=new DashboardCodexBridge({config:{...h.config,ignoredResponseIds:[EVENT],sessionRoutes:{[OTHER_THREAD]:THREAD}},queueClient:h.queue,rpc:h.rpc,now:()=>new Date(NOW)});
  const health=await excluded.runOnce();
  assert.equal(health.ok,true);assert.equal(health.counts.ignored,1);assert.equal(health.counts.blocked,0);
  assert.equal(health.skipped.owner_excluded_response,1);assert.equal(h.data.enqueues.length,0);
  const receipt=await getReceipt(h);
  assert.equal(receipt.state,'ignored');assert.equal(receipt.reason,'owner_excluded_response');assert.equal(receipt.ignoredAt,NOW);
  assert.deepEqual(receipt.ignoredFrom,{state:'blocked',reason:before.reason,recordedAt:before.updatedAt});
  for(const key of ['eventId','ref','project','eventCreatedAt','originSession','marker'])assert.equal(receipt[key],before[key]);
  await excluded.runOnce();assert.deepEqual(await getReceipt(h),receipt);
  assert.equal(h.data.marks.length,0);assert.equal(h.data.transitions.length,0);
  const fresh=await harness(t,{config:{ignoredResponseIds:[EVENT]}});
  const freshHealth=await fresh.bridge.runOnce();
  assert.equal(freshHealth.skipped.owner_excluded_response,1);assert.equal((await fresh.bridge.receipts()).length,0);assert.equal(fresh.data.enqueues.length,0);
});

test('exclusion or new route configuration never ignores or resubmits an attempted delivery',async t=>{
  for(const state of ['queued','ambiguous','delivered']){
    const h=await harness(t,{...(state==='ambiguous'?{onEnqueue:async()=>{throw new Error('Unknown add result');}}:{})});
    await h.bridge.runOnce();
    if(state==='delivered'){observe(h);await h.bridge.runOnce();}
    const excluded=new DashboardCodexBridge({config:{...h.config,ignoredResponseIds:[EVENT],projectRoutes:{'bridge-canary':THREAD}},queueClient:h.queue,rpc:h.rpc,now:()=>new Date(NOW)});
    await excluded.runOnce();const receipt=await getReceipt(h);
    assert.equal(receipt.state,state);assert.equal(receipt.ignoredAt,undefined);assert.equal(h.data.enqueues.length,1);
  }
});

test('urgent delivery requires explicit disabled-legacy ownership and only accepts an unclaimed queued row',async t=>{
  const base={version:1,mode:'canary',canaryThreadId:THREAD,startAt:START,sessionRoutes:{[THREAD]:THREAD},includeUrgent:true};
  for(const legacyDispatcherDisabled of [undefined,false,'true'])assert.throws(()=>validateConfig({...base,legacyDispatcherDisabled}),{code:'INVALID_CONFIG'});
  const config={includeUrgent:true,legacyDispatcherDisabled:true};
  const source=row({urgent:true,dispatch_state:'queued',dispatch_at:null,dispatch_target:null,dispatch_note:null});
  const h=await harness(t,{rows:[source],config});
  const health=await h.bridge.runOnce();
  assert.equal(health.ok,true);assert.equal(h.data.enqueues.length,1);assert.equal(health.counts.queued,1);
  await h.bridge.runOnce();assert.equal(h.data.enqueues.length,1);
});

test('urgent opt-in preserves exclusions for claimed, attempted, unknown or already dispatched rows',async t=>{
  const cases=[
    {dispatch_state:'none'}, {dispatch_state:'delivering'}, {dispatch_state:'spawned'}, {dispatch_state:'delivered'}, {dispatch_state:'failed'},
    {dispatch_at:NOW}, {dispatch_target:'another worker'}, {dispatch_note:'previous attempt'}, {missing:'dispatch_at'}, {missing:'dispatch_target'}, {missing:'dispatch_note'},
  ];
  for(const candidate of cases){
    const source=row({urgent:true,dispatch_state:'queued',dispatch_at:null,dispatch_target:null,dispatch_note:null,...candidate});
    if(candidate.missing)delete source[candidate.missing];
    const h=await harness(t,{rows:[source],config:{includeUrgent:true,legacyDispatcherDisabled:true}});
    await h.bridge.runOnce();assert.equal(h.data.enqueues.length,0);assert.equal((await h.bridge.receipts()).length,0);
  }
});

test('origin hostname allowlist excludes a mismatched or missing origin even when the session is routed',async t=>{
  for(const host of ['old-mac',undefined]){
    const source=row({item:{...row().item,origin_host:host}});
    const h=await harness(t,{rows:[source],config:{originHostAllowlist:['DESKTOP-U6OA95F']}});
    const health=await h.bridge.runOnce();
    assert.equal(health.ok,true);assert.equal(health.skipped.origin_host_not_allowed,1);
    assert.equal(h.data.enqueues.length,0);assert.equal((await h.bridge.receipts()).length,0);
  }
  const h=await harness(t,{rows:[row({item:{...row().item,origin_host:'DESKTOP-U6OA95F'}})],config:{originHostAllowlist:['DESKTOP-U6OA95F']}});
  await h.bridge.runOnce();assert.equal(h.data.enqueues.length,1);
  for(const originHostAllowlist of [[],[''],[' DESKTOP-U6OA95F'],[null],'DESKTOP-U6OA95F'])assert.throws(()=>validateConfig({...h.config,originHostAllowlist}),{code:'INVALID_CONFIG'});
});

test('heartbeat publisher authenticates to the same dashboard origin and sends aggregate allowlisted fields only',async()=>{
  let request;
  const publish=createHeartbeatPublisher({env:{OWNER_LOOP_TOKEN:'FAKE_PRIVATE_TOKEN'},host:'TEST-PC',dashboardUrl:'https://dashboard.example.test/some-view',fetchImpl:async(url,options)=>{
    request={url,options};return {ok:true,json(){assert.fail('Heartbeat response bodies must not be read');},text(){assert.fail('Heartbeat response bodies must not be read');}};
  }});
  await publish({health:{checkedAt:NOW,intervalSeconds:15,source:{available:true,private:'do not send'},counts:{queued:2,preparing:1,ambiguous:1,blocked:0,started:3,delivered:4,ignored:99},allowedThreadIds:[THREAD],secret:'do not send'},desktopReady:true,receipts:[
    {state:'queued',submittedAt:'2026-11-06T14:50:00Z',preparingAt:'2026-11-06T14:49:00Z',eventId:EVENT,body:'do not send'},
    {state:'preparing',preparingAt:'2026-11-06T14:40:00Z'},
    {state:'queued',submittedAt:'invalid',eventCreatedAt:'2026-11-06T14:30:00Z'},
    {state:'delivered',submittedAt:'2026-11-01T00:00:00Z'},
  ]});
  assert.equal(request.url,'https://dashboard.example.test/api/loop/agent/heartbeat');
  assert.equal(request.options.method,'POST');assert.equal(request.options.redirect,'error');
  assert.equal(request.options.headers.Authorization,'Bearer FAKE_PRIVATE_TOKEN');
  assert.ok(request.options.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(request.options.body),{version:1,host:'TEST-PC',checkedAt:NOW,sourceAvailable:true,desktopReady:true,intervalSeconds:15,counts:{queued:3,ambiguous:1,blocked:0,started:3,delivered:4},oldestQueuedAt:'2026-11-06T14:30:00.000Z'});
  assert.doesNotMatch(request.options.body,/FAKE_PRIVATE_TOKEN|do not send|allowedThreadIds|eventId|project|session/);
});

test('heartbeat payload sanitizes invalid counts, preserves unknown readiness and excludes inactive backlog ages',async()=>{
  let payload;
  const publish=createHeartbeatPublisher({env:{OWNER_LOOP_TOKEN:'FAKE'},host:'TEST-PC',fetchImpl:async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true};}});
  await publish({health:{checkedAt:NOW,intervalSeconds:15,source:{available:'yes'},counts:{queued:-2,ambiguous:Infinity,blocked:'4',started:1.5,delivered:2}},desktopReady:undefined,receipts:[{state:'ambiguous',eventCreatedAt:NOW},{state:'delivered',submittedAt:NOW}]});
  assert.equal(payload.sourceAvailable,false);assert.equal(payload.desktopReady,null);assert.equal(payload.oldestQueuedAt,null);
  assert.deepEqual(payload.counts,{queued:0,ambiguous:0,blocked:0,started:0,delivered:2});
});

test('heartbeat HTTP, fetch and credential failures never expose token or upstream response text',async()=>{
  const snapshot={health:{checkedAt:NOW,intervalSeconds:15,source:{available:true},counts:{}}};
  const token='FAKE_PRIVATE_TOKEN';
  const http=createHeartbeatPublisher({env:{OWNER_LOOP_TOKEN:token},fetchImpl:async()=>({ok:false,status:503,text:async()=>token+' private response'})});
  await assert.rejects(http(snapshot),error=>error.code==='HEARTBEAT_HTTP_ERROR'&&!error.message.includes(token)&&!error.message.includes('private response'));
  const offline=createHeartbeatPublisher({env:{OWNER_LOOP_TOKEN:token},fetchImpl:async()=>{throw new Error(token+' private network body');}});
  await assert.rejects(offline(snapshot),error=>error.code==='HEARTBEAT_UNAVAILABLE'&&!error.message.includes(token));
  const missing=createHeartbeatPublisher({env:{},home:path.join(os.tmpdir(),'missing-heartbeat-home-'+EVENT),fetchImpl:async()=>assert.fail('Missing credentials must not send')});
  await assert.rejects(missing(snapshot),{code:'HEARTBEAT_CREDENTIALS_UNAVAILABLE'});
  assert.throws(()=>createHeartbeatPublisher({dashboardUrl:'https://user:password@example.test'}),{code:'HEARTBEAT_INVALID_ORIGIN'});
});

test('heartbeat fetch has a bounded abort deadline',async()=>{
  let aborted=false;
  const publish=createHeartbeatPublisher({env:{OWNER_LOOP_TOKEN:'FAKE'},timeoutMs:10,fetchImpl:async(_url,{signal})=>new Promise((resolve,reject)=>{
    const guard=setTimeout(()=>reject(new Error('deadline not enforced')),500);
    signal.addEventListener('abort',()=>{aborted=true;clearTimeout(guard);reject(signal.reason);},{once:true});
  })});
  await assert.rejects(publish({health:{checkedAt:NOW,intervalSeconds:15}}),{code:'HEARTBEAT_UNAVAILABLE'});
  assert.equal(aborted,true);
});

function desktopSnapshot(overrides={}) {
  const main={Name:'ChatGPT.exe',ProcessId:10,ParentProcessId:1,SessionId:1,ExecutablePath:'C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.1029.7803.0_x64__publisher\\app\\ChatGPT.exe',CommandLine:'"C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.1029.7803.0_x64__publisher\\app\\ChatGPT.exe"'};
  const backend={Name:'codex.exe',ProcessId:11,ParentProcessId:10,SessionId:1,ExecutablePath:'C:\\Codex\\codex.exe',CommandLine:'C:\\Codex\\codex.exe app-server --analytics-default-enabled'};
  return {sessionId:1,processes:[main,backend],...overrides};
}

test('desktop readiness requires the packaged main and its own stdio backend, never a renderer or bridge CLI client',()=>{
  const snapshot=desktopSnapshot();
  assert.equal(desktopReadyFromProcesses(snapshot),true);
  assert.equal(desktopReadyFromProcesses({sessionId:1,processes:[]}),false);
  const [main,backend]=snapshot.processes;
  const cases=[
    [backend],
    [{...main,CommandLine:main.CommandLine+' --type=renderer'},backend],
    [{...main,ExecutablePath:'C:\\SomeOtherChatGPT\\ChatGPT.exe'},backend],
    [main,{...backend,ParentProcessId:999}],
    [main,{...backend,CommandLine:'codex.exe exec --json'}],
    [main,{...backend,CommandLine:'codex.exe app-server --listen ws://127.0.0.1:9000'}],
    [main,{...backend,SessionId:2}],
  ];
  for(const processes of cases)assert.equal(desktopReadyFromProcesses({sessionId:1,processes}),false);
  assert.equal(desktopReadyFromProcesses({sessionId:1,processes:[main,{...backend,CommandLine:'codex.exe app-server --stdio'}]}),true);
  assert.equal(desktopReadyFromProcesses({sessionId:1,processes:[main,{...backend,CommandLine:'codex.exe app-server --listen=stdio://'}]}),true);
  assert.equal(desktopReadyFromProcesses({sessionId:1,processes:[{...main,CommandLine:null},backend]}),null);
  assert.equal(desktopReadyFromProcesses({processes:[]}),null);
});

test('desktop probe uses a hidden bounded native PowerShell argv and treats probe failures as unknown',async()=>{
  let invocation;
  const probe=createDesktopReadinessProbe({platform:'win32',env:{WINDIR:'C:\\Windows'},execFileImpl:async(...args)=>{invocation=args;return {stdout:JSON.stringify(desktopSnapshot())};}});
  assert.equal(await probe(),true);
  assert.equal(invocation[0],'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
  assert.deepEqual(invocation[1].slice(0,3),['-NoProfile','-NonInteractive','-Command']);
  assert.match(invocation[1][3],/Name='ChatGPT.exe' OR Name='codex.exe'/);
  assert.equal(invocation[2].shell,false);assert.equal(invocation[2].windowsHide,true);assert.equal(invocation[2].timeout,3000);
  assert.equal(await createDesktopReadinessProbe({platform:'linux',execFileImpl:async()=>assert.fail('Non-Windows must not spawn')})(),null);
  assert.equal(await createDesktopReadinessProbe({platform:'win32',execFileImpl:async()=>{throw new Error('private stderr');}})(),null);
  assert.equal(await createDesktopReadinessProbe({platform:'win32',execFileImpl:async()=>({stdout:'not JSON'})})(),null);
});

test('heartbeat is disabled by default with no publisher or desktop/queue readiness cost',async t=>{
  const h=await harness(t,{heartbeatPublisher:async()=>assert.fail('Heartbeat must be opt-in'),desktopReadyProbe:async()=>assert.fail('No probe while disabled')});
  h.queue.readThread=async()=>assert.fail('No readiness RPC while disabled');
  const health=await h.bridge.runOnce();
  assert.equal(health.ok,true);assert.equal(health.heartbeatPublishedAt,undefined);
  assert.throws(()=>validateConfig({...h.config,publishHeartbeat:'true'}),{code:'INVALID_CONFIG'});
});

test('heartbeat publishing failure preserves delivery health and cannot prevent delivery or enqueue twice',async t=>{
  let attempts=0;
  const h=await harness(t,{config:{publishHeartbeat:true},desktopReadyProbe:async()=>true,heartbeatPublisher:async()=>{
    if(++attempts<3)throw Object.assign(new Error('FAKE_PRIVATE_TOKEN'),{code:'FAKE_PRIVATE_TOKEN'});
  }});
  const queued=await h.bridge.runOnce();
  assert.equal(queued.ok,false);assert.equal(queued.deliveryOk,true);assert.equal(queued.source.available,true);
  assert.equal(queued.counts.queued,1);assert.equal(queued.heartbeatErrorCode,'HEARTBEAT_PUBLISH_FAILED');
  assert.equal(queued.desktopReady,null); // No fake readThread API means unknown, not green.
  observe(h);const delivered=await h.bridge.runOnce();
  assert.equal(delivered.ok,false);assert.equal(delivered.deliveryOk,true);assert.equal(delivered.counts.delivered,1);
  assert.equal(h.data.marks.length,1);assert.equal(h.data.enqueues.length,1);
  const recovered=await h.bridge.runOnce();
  assert.equal(recovered.ok,true);assert.equal(recovered.heartbeatErrorCode,null);assert.equal(recovered.heartbeatPublishedAt,NOW);
  assert.equal((await h.bridge.status()).heartbeatErrorCode,null);
  assert.doesNotMatch(JSON.stringify(recovered),/FAKE_PRIVATE_TOKEN/);assert.equal(h.data.enqueues.length,1);
});

test('combined readiness confirms the exact local thread and caches both checks for at most 30 seconds',async t=>{
  const h=await harness(t,{config:{publishHeartbeat:true},heartbeatPublisher:async()=>{},desktopReadyProbe:async()=>true});
  let clock=Date.parse(NOW),probeCalls=0,threadReads=0;
  h.bridge.now=()=>new Date(clock);
  h.bridge.desktopReadyProbe=async()=>{probeCalls++;return true;};
  h.queue.readThread=async({threadId})=>{threadReads++;assert.equal(threadId,THREAD);return {id:THREAD,cwd:'C:\\CreativeWork\\Project'};};
  assert.equal((await h.bridge.runOnce()).desktopReady,true);
  clock+=15_000;assert.equal((await h.bridge.runOnce()).desktopReady,true);
  assert.equal(probeCalls,1);assert.equal(threadReads,1);
  clock+=15_000;h.queue.readThread=async()=>{threadReads++;return {id:THREAD,cwd:'/Users/old-mac/project'};};
  assert.equal((await h.bridge.runOnce()).desktopReady,false);assert.equal(probeCalls,2);assert.equal(threadReads,2);
  clock+=30_000;h.queue.readThread=async()=>{throw new Error('transport unavailable');};
  assert.equal((await h.bridge.runOnce()).desktopReady,null);
});

test('heartbeat keeps the last publication receipt on failure and reports outbox unavailability accurately',async t=>{
  const snapshots=[];let fail=false;
  const controls={config:{publishHeartbeat:true},heartbeatPublisher:async snapshot=>{snapshots.push(structuredClone(snapshot));if(fail)throw new Error('private');},desktopReadyProbe:async()=>false};
  const h=await harness(t,controls);const first=await h.bridge.runOnce();assert.equal(first.heartbeatPublishedAt,NOW);
  fail=true;controls.failMode='watch';h.bridge.now=()=>new Date('2026-11-06T15:01:00Z');
  const failed=await h.bridge.runOnce();
  assert.equal(failed.ok,false);assert.equal(failed.source.available,false);assert.equal(failed.source.errorCode,'DASHBOARD_READ_FAILED');
  assert.equal(failed.heartbeatPublishedAt,NOW);assert.equal(failed.lastSuccessfulReadAt,NOW);
  assert.equal(snapshots[1].health.source.available,false);assert.equal(snapshots[1].desktopReady,false);
  assert.equal((await h.bridge.status()).heartbeatErrorCode,'HEARTBEAT_PUBLISH_FAILED');
});
