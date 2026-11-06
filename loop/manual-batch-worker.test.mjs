import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import os from 'node:os';
import { ManualBatchWorker, buildBatchPacket, createManualLaunchApi, cliArguments, ownerResultNote } from './manual-batch-worker.mjs';
import { validateConfig, atomicJson } from './dashboard-codex-bridge.mjs';

const BATCH='80ae5272-8a87-4ed8-8ef8-dfb420090ac2',CLAIM='0e40c8ee-d3c5-408a-b86e-6fba70c9576a';
const EVENT='5fca7210-d88c-4c89-9f26-a59ac8e3dfe1',THREAD='01a1ae46-28d6-7f91-8f60-1483a4175703';
const FRESH='01a1b0df-c7ce-78c0-8049-81c15e95b664',NOW='2026-11-06T15:00:00.000Z',HOST='this-pc';
const sha=value=>createHash('sha256').update(value).digest('hex');
const snapshot=row=>({responseId:row.id,ref:row.item.ref,title:row.item.title,optionKey:row.option_key,optionLabel:row.item.options[0].label,text:row.body,createdAt:row.created_at});
async function readJob(worker,id=BATCH){return JSON.parse(await readFile(worker.jobPath(id),'utf8'));}
async function until(predicate){for(let i=0;i<100;i++){if(await predicate())return;await delay(5);}throw new Error('Fixture did not reach expected state');}

async function harness(t,options={}){
  const temp=await mkdtemp(path.join(os.tmpdir(),'strandworks-manual-test-'));
  t.after(async()=>{const target=path.resolve(temp);assert.equal(path.dirname(target),path.resolve(os.tmpdir()));assert.ok(path.basename(target).startsWith('strandworks-manual-test-'));await rm(target,{recursive:true,force:true});});
  const cwd=path.join(temp,'project');await mkdir(cwd);
  const source={id:EVENT,created_at:NOW,urgent:false,dispatch_state:'none',option_key:'A',body:'  Exact owner words.\nSecond line.  ',item:{id:'424cc86f-6a17-4bba-9d8c-7df5536ed9c3',ref:'D-0999',project:'test-project',status:'ruled',ruling:'A',ruled_at:NOW,origin_session:THREAD,origin_host:HOST,origin_cwd:cwd,title:'Original question?',body:'Background question only.',options:[{key:'A',label:'The selected choice'}]}};
  const config=validateConfig({version:1,mode:'canary',canaryThreadId:THREAD,startAt:'2026-11-06T14:59:00Z',sessionRoutes:{[THREAD]:THREAD},deliveryMode:'manual',originHostAllowlist:[HOST],stateDir:path.join(temp,'state'),configPath:path.join(temp,'config.json'),manualLaunches:{enabled:true,allowedRoots:[temp],...options.settings},...options.config});
  const answers=[snapshot(source)];
  const request={id:BATCH,claimId:CLAIM,host:HOST,project:source.item.project,requestedAt:NOW,answerDigest:sha(JSON.stringify(answers)),responses:[{id:EVENT,createdAt:NOW,ruledAt:NOW}]};
  const data={spawns:[],kills:[],rows:[source],transitions:[],results:[],answers};
  const rpc=async(name,args)=>{
    if(name==='owner_loop_outbox')return structuredClone(data.rows);
    if(name==='owner_loop_get')return structuredClone(data.rows[0].item);
    if(name==='owner_loop_transition'){data.transitions.push(args);data.rows[0].item.status=args.p_action==='pickup'?'picked_up':'done';data.rows[0].item.picked_up_by=args.p_actor;return{};}
    throw new Error('Unexpected RPC');
  };
  let worker;
  const spawnImpl=(command,args,spawnOptions)=>{
    const child=new EventEmitter();child.pid=54321;child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();child.unref=()=>{};
    let packet='';child.stdin.on('data',chunk=>packet+=chunk.toString());
    data.spawns.push({command,args,options:spawnOptions,child});
    child.stdin.on('finish',()=>setImmediate(async()=>{
      try{
        assert.equal((await readJob(worker)).phase,'spawn_intent');
        if(options.fixture)return await options.fixture({child,packet,worker,data});
        child.stdout.write(JSON.stringify({type:'thread.started',thread_id:FRESH})+'\n');
        child.stdout.write(JSON.stringify({type:'turn.completed',usage:{input_tokens:44,cached_input_tokens:12,output_tokens:9}})+'\n');
        child.emit('close',0,null);
      }catch(error){child.emit('error',error);}
    }));
    if(options.throwSpawn)throw new Error('Unknown launch result');
    return child;
  };
  worker=new ManualBatchWorker({config,rpc,spawnImpl,now:()=>new Date(NOW),host:HOST,killTree:async child=>{data.kills.push(child.pid);child.emit('close',null,'SIGKILL');},...options.worker});
  return{worker,config,data,request,source,cwd,temp,rpc};
}

test('disabled launching performs no HTTP polling or CLI work',async t=>{
  const h=await harness(t,{settings:{enabled:false},worker:{launchApi:new Proxy({}, {get(){throw new Error('Must not poll');}})}});
  assert.deepEqual(await h.worker.pollOnce(),{skipped:'manual_launches_disabled'});
  assert.deepEqual(await h.worker.execute(h.request),{skipped:'manual_launches_disabled'});assert.equal(h.data.spawns.length,0);
});

test('fresh bounded exec records spawn intent first, exact packet, actual thread and usage; CLI exit alone does not complete',async t=>{
  const h=await harness(t);const job=await h.worker.execute(h.request);
  assert.equal(job.status,'needs_attention');assert.equal(job.phase,'finished');assert.equal(job.threadId,FRESH);
  assert.deepEqual(job.usage,{input_tokens:44,cached_input_tokens:12,output_tokens:9});
  assert.equal(h.data.spawns.length,1);assert.equal(h.data.transitions.length,0);
  const call=h.data.spawns[0];assert.deepEqual(call.args,cliArguments(job.cwd,path.dirname(h.worker.jobPath(BATCH))));
  assert.equal(call.args.includes('resume'),false);assert.equal(call.args.includes('queue'),false);assert.equal(call.options.windowsHide,true);assert.equal(call.options.shell,false);
  assert.equal(call.args[call.args.indexOf('--add-dir')+1],path.dirname(h.worker.jobPath(BATCH)));
  const packet=await h.worker.validate(h.request);assert.ok(packet.packet.includes(JSON.stringify(h.source.body)));assert.ok(packet.packet.includes('Original question?'));assert.ok(packet.packet.includes('--job'));assert.ok(!packet.packet.includes('--config'));
  assert.ok(job.packetBytes<=12*1024);
  assert.equal((await h.worker.execute(h.request)).threadId,FRESH);assert.equal(h.data.spawns.length,1);
});

test('uncertain spawn intent is durable across restart and never automatically retried',async t=>{
  const h=await harness(t,{throwSpawn:true});const first=await h.worker.execute(h.request);assert.equal(first.status,'ambiguous');
  const restarted=new ManualBatchWorker({config:h.config,rpc:h.rpc,host:HOST,spawnImpl:()=>{throw new Error('Must not relaunch');}});
  assert.deepEqual(await restarted.execute(h.request),first);assert.equal(h.data.spawns.length,1);
});

test('current host, exclusions, watermark, ruling revision, exact answer digest, path roots and batch size gate launch',async t=>{
  const cases=[
    h=>h.request.host='other-pc',h=>h.config.ignoredResponseIds.push(EVENT),h=>h.config.startAt='2026-11-06T15:01:00Z',
    h=>h.source.item.ruled_at='2026-11-06T15:01:00Z',h=>h.source.body+='changed',h=>h.worker.settings.allowedRoots=['C:\\outside'],
    h=>h.request.responses=[...h.request.responses,...Array(3).fill(h.request.responses[0])],h=>delete h.request.claimId,
    h=>{h.source.item.status='picked_up';h.source.item.picked_up_by=`codex:${THREAD}`;},
  ];
  for(const change of cases){const h=await harness(t);change(h);const job=await h.worker.execute(h.request);assert.equal(job.status,'failed');assert.equal(h.data.spawns.length,0);}
});

test('packet and short handoff size are bounded without truncating owner text',async t=>{
  const h=await harness(t);h.source.body='x'.repeat(13*1024);h.request.answerDigest=sha(JSON.stringify([snapshot(h.source)]));
  const job=await h.worker.execute(h.request);assert.equal(job.errorCode,'MANUAL_PACKET_TOO_LARGE');assert.equal(h.data.spawns.length,0);
  assert.throws(()=>buildBatchPacket({request:h.request,rows:[h.source],handoff:'x'.repeat(2049),config:h.config}),{code:'MANUAL_HANDOFF_TOO_LARGE'});
});

test('an unfinished same-project receipt blocks another owner launch after process restart',async t=>{
  const h=await harness(t);const prior='c8ab27f8-a661-4dc4-a95c-12e1465b904a';
  await atomicJson(h.worker.jobPath(prior),{batchId:prior,project:h.request.project,phase:'spawn_intent',status:'ambiguous'});
  const result=await h.worker.execute(h.request);assert.equal(result.errorCode,'MANUAL_PROJECT_BUSY');assert.equal(h.data.spawns.length,0);
});

test('callbacks bind the fresh actual CLI session, record pickup and actual outcome, and only explicit completion completes a batch',async t=>{
  const h=await harness(t,{fixture:async({child,worker})=>{
    child.stdout.write(JSON.stringify({type:'thread.started',thread_id:FRESH})+'\n');
    await until(async()=>(await readJob(worker)).threadId===FRESH);
    await assert.rejects(worker.callback({action:'pickup',batchId:BATCH,responseId:EVENT,env:{CODEX_THREAD_ID:THREAD}}),{code:'CALLBACK_SESSION_MISMATCH'});
    await assert.rejects(worker.callback({action:'done',batchId:BATCH,responseId:EVENT,note:'Finished',env:{CODEX_THREAD_ID:FRESH}}),{code:'CALLBACK_OWNERSHIP_MISMATCH'});
    await worker.callback({action:'pickup',batchId:BATCH,responseId:EVENT,env:{CODEX_THREAD_ID:FRESH}});
    await worker.callback({action:'done',batchId:BATCH,responseId:EVENT,note:'Updated project file; verification passed.',env:{CODEX_THREAD_ID:FRESH}});
    child.stdout.write(JSON.stringify({type:'turn.completed',usage:{input_tokens:5,output_tokens:2,cached_input_tokens:0}})+'\n');child.emit('close',0,null);
  }});
  const job=await h.worker.execute(h.request);assert.equal(job.status,'completed');assert.equal(h.data.transitions.length,2);
  assert.ok(job.callbacks[EVENT].pickupAt);assert.ok(job.callbacks[EVENT].doneAt);
  assert.equal(h.data.transitions[1].p_note,'Updated project file; verification passed.');
  const handoff=JSON.parse(await readFile(path.join(h.config.stateDir,'projects',`${sha(h.request.project)}.json`),'utf8'));assert.ok(handoff.handoff.includes('verification passed'));
});

test('callback rejects an owner revision changed after launch',async t=>{
  const h=await harness(t);await h.worker.execute(h.request);h.source.item.ruled_at='2026-11-06T15:00:00.000001Z';
  await assert.rejects(h.worker.callback({action:'pickup',batchId:BATCH,responseId:EVENT,env:{CODEX_THREAD_ID:FRESH}}),{code:'CALLBACK_ITEM_CHANGED'});assert.equal(h.data.transitions.length,0);
});

test('deadline and bounded output terminate only the spawned child tree and never retry',async t=>{
  for(const settings of [{timeoutMs:20},{maxOutputBytes:40}]){
    const h=await harness(t,{settings,fixture:async({child})=>{if(settings.maxOutputBytes)child.stdout.write('x'.repeat(41));}});
    const job=await h.worker.execute(h.request);assert.equal(job.status,'needs_attention');assert.ok(['MANUAL_DEADLINE','MANUAL_OUTPUT_LIMIT'].includes(job.errorCode));assert.deepEqual(h.data.kills,[54321]);
    await h.worker.execute(h.request);assert.equal(h.data.spawns.length,1);
  }
});

test('shutdown abort cancels only the active CLI child without waiting for its normal deadline',async t=>{
  const controller=new AbortController();
  const h=await harness(t,{fixture:async()=>{controller.abort();}});
  const result=await h.worker.execute(h.request,{signal:controller.signal});
  assert.equal(result.errorCode,'MANUAL_CANCELLED');assert.deepEqual(h.data.kills,[54321]);assert.equal(h.data.spawns.length,1);
});

test('incomplete runs save only a bounded latest agent brief for the next manual batch',async t=>{
  const last='{"files_changed":["project.txt"],"remaining_work":"Review the result","next_action":"Ask owner to verify"}';
  const h=await harness(t,{fixture:async({child})=>{
    for(const event of [{type:'thread.started',thread_id:FRESH},{type:'item.completed',item:{type:'agent_message',text:'Earlier chat text that must not carry forward.'}},{type:'item.completed',item:{type:'agent_message',text:last}},{type:'turn.completed',usage:{input_tokens:5,cached_input_tokens:0,output_tokens:2}}])child.stdout.write(JSON.stringify(event)+'\n');
    child.emit('close',0,null);
  }});
  const job=await h.worker.execute(h.request);assert.equal(job.lastAgentMessage,last);
  const handoff=JSON.parse(await readFile(path.join(h.config.stateDir,'projects',`${sha(h.request.project)}.json`),'utf8')).handoff;
  assert.ok(handoff.includes(last));assert.ok(!handoff.includes('Earlier chat'));assert.ok(Buffer.byteLength(handoff)<=2048);
  assert.ok(ownerResultNote({errorCode:'MANUAL_DEADLINE'}).includes('two-minute'));
  assert.ok(!ownerResultNote({errorCode:'MANUAL_DEADLINE'}).includes('MANUAL_DEADLINE'));
});

test('uncertain process termination blocks subsequent launches across projects',async t=>{
  const h=await harness(t,{settings:{timeoutMs:20},fixture:async()=>{},worker:{killTree:async()=>false}});
  const first=await h.worker.execute(h.request);assert.equal(first.phase,'uncertain');assert.equal(first.status,'ambiguous');
  const next={...h.request,id:'c8ab27f8-a661-4dc4-a95c-12e1465b904a',project:'another-project'};
  const second=await h.worker.execute(next);assert.equal(second.errorCode,'MANUAL_PROJECT_BUSY');assert.equal(h.data.spawns.length,1);
});

test('manual transport uses only authenticated action payloads and never exposes upstream bodies',async()=>{
  const calls=[];const api=createManualLaunchApi({dashboardUrl:'https://dashboard.example.com',env:{OWNER_LOOP_TOKEN:'FAKE'},fetchImpl:async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({batches:[]})};}});
  assert.deepEqual(await api.poll(),[]);await api.claim({id:BATCH,claimId:CLAIM});await api.result({id:BATCH,claimId:CLAIM,status:'needs_attention'});
  assert.equal(calls[0].url,'https://dashboard.example.com/api/loop/batches/agent');assert.equal(calls[0].options.headers.Authorization,'Bearer FAKE');assert.deepEqual(JSON.parse(calls[1].options.body),{action:'claim',id:BATCH,claimId:CLAIM});
  const broken=createManualLaunchApi({dashboardUrl:'https://dashboard.example.com',env:{OWNER_LOOP_TOKEN:'FAKE'},fetchImpl:async()=>({ok:false,status:502,text:async()=>'FAKE private upstream'})});
  await assert.rejects(broken.poll(),error=>error.code==='MANUAL_TRANSPORT_FAILED'&&!error.message.includes('FAKE')&&!error.message.includes('private'));
});

test('poll claims one durable owner request once, publishes launch then terminal state, and never retries a lost claim',async t=>{
  const h=await harness(t);let claims=0;
  const batch={version:1,id:BATCH,project:h.request.project,createdAt:NOW,responseIds:[EVENT],answers:h.data.answers,answerDigest:h.request.answerDigest};
  h.worker.launchApi={poll:async()=>[batch],claim:async()=>++claims===1?{claimed:true,batch}:{claimed:false,batch:null},result:async value=>h.data.results.push(value)};
  const job=await h.worker.pollOnce();assert.equal(job.status,'needs_attention');assert.deepEqual(h.data.results.map(value=>value.status),['launched','needs_attention']);
  assert.equal(await h.worker.pollOnce(),null);assert.equal(h.data.spawns.length,1);
});
