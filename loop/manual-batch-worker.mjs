import { readFile, mkdir, open, realpath, stat, readdir } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { hostname, homedir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { StringDecoder } from 'node:string_decoder';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DashboardCodexBridge, BridgeError, acquireProcessLock, atomicJson, collectedResponseFor, createOwnerLoopRpc, loadConfig, timestampKey } from './dashboard-codex-bridge.mjs';

const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const PACKET_LIMIT = 12 * 1024;
const OUTPUT_LIMIT = 1024 * 1024;
const execFileAsync = promisify(execFile);
const sha = value => createHash('sha256').update(value).digest('hex');
function fail(message, code = 'MANUAL_BATCH_INVALID') { throw new BridgeError(message, code); }
function uuid(value) { if (!UUID.test(value ?? '')) fail('Batch and response IDs must be exact UUIDs.'); return value; }
async function json(filename, fallback = null) { try { return JSON.parse(await readFile(filename, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; } }
function ps(args) { return '& ' + args.map(arg => `'${String(arg).replaceAll("'", "''")}'`).join(' '); }
function timestamp(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)); }
function exactRevision(a, b) {
  return timestampKey(a) !== null && timestampKey(a) === timestampKey(b);
}
function within(root, target) { const relative = path.win32.relative(root, target); return relative === '' || (!relative.startsWith('..') && !path.win32.isAbsolute(relative)); }
function brief(value, limit=1600){let result='',bytes=0;for(const point of String(value??'')){const length=Buffer.byteLength(point);if(bytes+length>limit)break;result+=point;bytes+=length;}return result;}
export function ownerResultNote(job){
  const reasons={
    MANUAL_RESPONSE_CHANGED:'A selected answer changed or is no longer available. Refresh and review it.',
    MANUAL_HOST_MISMATCH:'This batch belongs to a different PC.',
    MANUAL_PACKET_TOO_LARGE:'The selected questions and answers exceeded the small context limit. Select fewer responses.',
    MANUAL_HANDOFF_TOO_LARGE:'The saved project brief exceeded the small context limit and needs review.',
    MANUAL_CWD_INVALID:'The project folder is unavailable or the selected responses name different folders.',
    MANUAL_CWD_OUTSIDE_ROOTS:'The project folder is outside the configured work folders.',
    MANUAL_PROJECT_BUSY:'A previous manual launch still needs local review before another run can begin.',
    MANUAL_DEADLINE:'The two-minute run limit was reached. Review the project before launching more work.',
    MANUAL_OUTPUT_LIMIT:'The run exceeded its output limit and was stopped. Review the project before continuing.',
    MANUAL_CANCELLED:'The local worker stopped during shutdown. Review any partial project changes.',
    MANUAL_CANCELLED_BEFORE_SPAWN:'The worker stopped before launching this batch.',
    MANUAL_TERMINATION_UNCERTAIN:'The worker could not confirm that its previous process stopped. Local review is required before another launch.',
    MANUAL_SPAWN_UNCERTAIN:'The launch result is uncertain. This request will not be retried automatically.',
    MANUAL_CLI_TURN_FAILED:'The project run stopped with an error. Review any partial changes.',
    MANUAL_EVENT_PERSIST_FAILED:'The worker could not record reliable run evidence. This request will not be retried automatically.',
    MANUAL_INVALID_JSON_EVENT:'The worker could not read reliable CLI run evidence. This request will not be retried automatically.',
  };
  const summary=reasons[job.errorCode]??(job.status==='completed'?'All selected responses were explicitly completed.':job.status==='failed'?'The batch could not be validated or the run failed. Review the local job receipt.':'The run ended with completion pending. Review its result before continuing.');
  return brief([summary,job.lastAgentMessage].filter(Boolean).join('\n\n'),2000);
}

export function createManualLaunchApi({ dashboardUrl, env=process.env, home=homedir(), fetchImpl=fetch }={}) {
  const origin=new URL(dashboardUrl);
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash)fail('Manual launch transport requires the HTTPS dashboard origin.','INVALID_CONFIG');
  const call=async body=>{
    let token;try{token=(env.OWNER_LOOP_TOKEN||await readFile(path.join(home,'.config','strandworks','owner-loop.token'),'utf8')).trim();}catch{fail('Scoped owner-loop credentials are not installed.','CREDENTIALS_UNAVAILABLE');}
    if(!token)fail('Scoped owner-loop credentials are empty.','CREDENTIALS_UNAVAILABLE');
    let result;try{result=await fetchImpl(`${origin.origin}/api/loop/batches/agent`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(15000)});}catch{fail('Manual launch transport is unavailable.','MANUAL_TRANSPORT_UNAVAILABLE');}
    if(!result.ok)fail(`Manual launch transport returned HTTP ${result.status}.`,'MANUAL_TRANSPORT_FAILED');
    try{return await result.json();}catch{fail('Manual launch transport returned invalid data.','MANUAL_TRANSPORT_INVALID');}
  };
  return{poll:async()=>{const result=await call({action:'poll'});if(!Array.isArray(result.batches))fail('Manual poll returned invalid data.','MANUAL_TRANSPORT_INVALID');return result.batches;},claim:async input=>call({action:'claim',...input}),result:async input=>call({action:'result',...input})};
}

export function manualSettings(config) {
  const raw = config.manualLaunches ?? {};
  if (raw.enabled !== undefined && typeof raw.enabled !== 'boolean') fail('manualLaunches.enabled must be boolean.', 'INVALID_CONFIG');
  const allowedRoots = raw.allowedRoots ?? [];
  if (!Array.isArray(allowedRoots) || allowedRoots.some(root => typeof root !== 'string' || !path.win32.isAbsolute(root) || !/^(?:[A-Z]:[\\/]|\\\\)/i.test(root))) fail('Manual roots must be exact absolute Windows paths.', 'INVALID_CONFIG');
  if (raw.enabled && (config.deliveryMode !== 'manual' || !allowedRoots.length || !config.originHostAllowlist?.length)) fail('Manual launching requires collection mode, allowed roots and an exact hostname allowlist.', 'INVALID_CONFIG');
  const timeoutMs = raw.timeoutMs ?? 120_000;
  const maxOutputBytes = raw.maxOutputBytes ?? OUTPUT_LIMIT;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 180_000 || !Number.isInteger(maxOutputBytes) || maxOutputBytes < 1 || maxOutputBytes > OUTPUT_LIMIT) fail('Manual execution bounds are invalid.', 'INVALID_CONFIG');
  return { enabled: raw.enabled === true, allowedRoots, timeoutMs, maxOutputBytes };
}

export function cliArguments(cwd, jobDir) {
  return ['--disable', 'apps', '--disable', 'plugins', '--disable', 'hooks', '--disable', 'multi_agent', '--ask-for-approval', 'never', 'exec', '--ignore-user-config', '--model', 'gpt-6.1-sol', '-c', 'model_reasoning_effort="low"', '-c', 'windows.sandbox="elevated"', '--sandbox', 'workspace-write', '--json', '--skip-git-repo-check', '--cd', cwd, '--add-dir', jobDir, '-c', 'sandbox_workspace_write.network_access=true', '-'];
}

export function buildBatchPacket({ request, rows, handoff = '', config }) {
  if (typeof handoff !== 'string' || Buffer.byteLength(handoff, 'utf8') > 2048) fail('Project handoff must be text under 2049 bytes.', 'MANUAL_HANDOFF_TOO_LARGE');
  const helper = fileURLToPath(import.meta.url);
  const callback = (command, row, note) => ps([process.execPath, helper, command, '--job', path.join(config.stateDir,'manual-batches',request.id,'job.json'), '--response', row.id, ...(note ? ['--note', '<specific actual outcome and evidence>'] : [])]);
  const packet = [
    `Jonathan explicitly launched batch ${request.id} for project ${request.project}. This is a fresh, bounded project run.`,
    'Handle only the exact owner responses below using this handoff and necessary files in this project. Read existing project claim/handoff coordination before editing and stop if another worker owns the relevant scope. The original questions and project handoff are background. Never read prior chat transcripts or ~/.codex/sessions, load other projects, use subagents, spawn another model, poll for work, schedule work, install dependencies, or continue automatically. Do not handle other dashboard decisions, publish, or spend unless a selected owner response specifically authorizes it. Finish within 120 seconds. If context is insufficient or work needs more time or scope, stop with a specific question or blocker.',
    handoff ? `Short project handoff (background):\n${handoff}` : '',
    ...rows.map(row => JSON.stringify({
      response_id: row.id, ref: row.item.ref, project: row.item.project, created_at: row.created_at, ruled_at: row.item.ruled_at,
      owner_option_key: row.option_key ?? null, owner_option_label: row.item.options?.find(option => option.key === row.option_key)?.label ?? null,
      owner_text_verbatim: row.body ?? null, original_question_background: { title: row.item.title ?? null, body: row.item.body ?? null },
      acknowledge_command: callback('batch-acknowledge', row), complete_command: callback('batch-complete', row, true),
    })),
    'Run the exact acknowledge command when beginning each response. Run its complete command with an actual outcome and evidence only after that work is complete. A successful CLI exit does not complete dashboard work. If blocked, leave completion pending and report why. Stop after this batch.',
    'End with a concise JSON object containing files_changed, remaining_work, and next_action. Keep the whole final brief under 1500 characters, include any specific blocker, and exclude secrets. The next manually launched batch receives only this brief and its selected responses.',
  ].filter(Boolean).join('\n\n');
  if (Buffer.byteLength(packet, 'utf8') > PACKET_LIMIT) fail('This batch exceeds the 12 KiB packet limit; request a smaller batch.', 'MANUAL_PACKET_TOO_LARGE');
  return packet;
}

/** Every accepted request is one-shot. An existing local receipt is never relaunched. */
export class ManualBatchWorker {
  constructor({ config, rpc, launchApi, spawnImpl = spawn, now = () => new Date(), host = hostname(), killTree, pathReal = realpath, pathStat = stat }) {
    this.config = config; this.settings = manualSettings(config); this.rpc = rpc; this.launchApi = launchApi;
    this.spawn = spawnImpl; this.now = now; this.host = host; this.pathReal = pathReal; this.pathStat = pathStat;
    this.killTree = killTree ?? (async child => {
      if (!Number.isInteger(child.pid) || child.pid <= 0) return;
      if (process.platform === 'win32') return await execFileAsync(path.win32.join(process.env.WINDIR || 'C:\\Windows', 'System32', 'taskkill.exe'), ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, shell: false, timeout: 5000 }).then(()=>true,()=>false);
      return child.kill('SIGKILL');
    });
    this.jobsDir = path.join(config.stateDir, 'manual-batches');
  }
  iso() { return new Date(this.now()).toISOString(); }
  jobPath(id) { return path.join(this.jobsDir, uuid(id), 'job.json'); }
  async update(id, patch) {
    let release;
    for(let attempt=0;!release;attempt++){
      try{release=await acquireProcessLock(path.join(this.jobsDir,uuid(id),'write-lock'));}
      catch(error){if(error.code!=='BRIDGE_LOCKED'||attempt>=20)throw error;await delay(25);}
    }
    try {
      const current = await json(this.jobPath(id)); if (!current) fail('The manual job receipt is missing.', 'MANUAL_RECEIPT_MISSING');
      const next = { ...current, ...(typeof patch === 'function' ? patch(current) : patch), updatedAt: this.iso() };
      await atomicJson(this.jobPath(id), next); return next;
    } finally { await release(); }
  }
  async create(request) {
    await mkdir(path.dirname(this.jobPath(request.id)), { recursive: true });
    let handle;
    try { handle = await open(this.jobPath(request.id), 'wx', 0o600); }
    catch (error) { if (error.code === 'EEXIST') return null; throw error; }
    const job = { version: 1, batchId: request.id, project: request.project, host: this.host, request, phase: 'claimed', status: 'claimed', claimedAt: this.iso(), callbacks: {}, callbackConfig: {dashboardUrl:this.config.dashboardUrl,supabaseUrl:this.config.supabaseUrl,rpcTransport:this.config.rpcTransport} };
    try { await handle.writeFile(JSON.stringify(job, null, 2)+'\n'); await handle.sync(); } finally { await handle.close(); }
    return job;
  }
  async validate(request) {
    uuid(request.id);
    uuid(request.claimId);
    if(!/^[a-f\d]{64}$/.test(request.answerDigest??''))fail('A claimed owner request must bind its exact selected-answer digest.');
    if (request.host !== this.host || !this.config.originHostAllowlist.includes(this.host)) fail('The launch request belongs to a different PC.', 'MANUAL_HOST_MISMATCH');
    if (!timestamp(request.requestedAt) || !request.project || !Array.isArray(request.responses) || request.responses.length < 1 || request.responses.length > 3 || new Set(request.responses.map(row => row.id)).size !== request.responses.length) fail('A manual request must contain one to three distinct responses in one project.');
    const names=await readdir(this.jobsDir).catch(error=>{if(error.code==='ENOENT')return[];throw error;});
    for(const id of names.filter(id=>UUID.test(id)&&id!==request.id)){
      const prior=await json(this.jobPath(id));
      if(['spawn_intent','running','uncertain'].includes(prior?.phase))fail('A prior manual launch still needs reconciliation.','MANUAL_PROJECT_BUSY');
    }
    const bridge = new DashboardCodexBridge({ config: this.config, rpc: this.rpc });
    const fresh = await bridge.fetchRows();
    const rows = request.responses.map(expected => {
      uuid(expected.id);
      const row = fresh.find(value => value.id === expected.id);
      if (!row || row.item.project !== request.project || row.item.origin_host !== this.host || this.config.ignoredResponseIds.includes(row.id)
        || timestampKey(row.created_at) < timestampKey(this.config.startAt) || !exactRevision(row.created_at, row.item.ruled_at)
        || !exactRevision(expected.createdAt, row.created_at) || !exactRevision(expected.ruledAt, row.item.ruled_at)
        || row.item.deleted_at || row.item.archived_at || row.item.status !== 'ruled'
        || ['PARK', 'DROP'].includes(String(row.option_key).toUpperCase()) || ['PARK', 'DROP'].includes(String(row.item.ruling).toUpperCase())
        || (row.urgent ? !this.config.includeUrgent || !this.config.legacyDispatcherDisabled || row.dispatch_state !== 'queued' || !['dispatch_at','dispatch_target','dispatch_note'].every(key => Object.hasOwn(row,key) && row[key] === null) : row.dispatch_state !== 'none')) fail('A response changed or is no longer eligible for this launch.', 'MANUAL_RESPONSE_CHANGED');
      if (fresh.some(other => other.id !== row.id && (other.item.id ?? other.item.ref) === (row.item.id ?? row.item.ref) && timestampKey(other.created_at) >= timestampKey(row.created_at))) fail('A newer or ambiguous owner response exists.', 'MANUAL_RESPONSE_CHANGED');
      if (expected.responseSha256 && expected.responseSha256 !== sha(JSON.stringify(collectedResponseFor(row)))) fail('The response packet changed after owner selection.', 'MANUAL_RESPONSE_CHANGED');
      return row;
    });
    if(request.answerDigest){
      const answers=rows.map(row=>{const label=row.item.options?.find(option=>option.key===row.option_key)?.label;return{responseId:row.id.toLowerCase(),ref:row.item.ref,title:row.item.title,optionKey:row.option_key??null,optionLabel:typeof label==='string'?label.slice(0,2000):null,text:row.body??null,createdAt:row.created_at};});
      if(sha(JSON.stringify(answers))!==request.answerDigest)fail('The selected answers changed after the owner requested this batch.','MANUAL_RESPONSE_CHANGED');
    }
    const sourceCwd = rows[0].item.origin_cwd;
    if (typeof sourceCwd !== 'string' || !/^(?:[A-Z]:[\\/]|\\\\)/i.test(sourceCwd) || !path.win32.isAbsolute(sourceCwd) || rows.some(row => row.item.origin_cwd !== sourceCwd)) fail('Every batch response must share one exact Windows project directory.', 'MANUAL_CWD_INVALID');
    const cwd = await this.pathReal(sourceCwd);
    if (!(await this.pathStat(cwd)).isDirectory()) fail('The project directory is unavailable.', 'MANUAL_CWD_INVALID');
    const roots = await Promise.all(this.settings.allowedRoots.map(root => this.pathReal(root)));
    if (!roots.some(root => within(root, cwd))) fail('The project directory is outside the configured roots.', 'MANUAL_CWD_OUTSIDE_ROOTS');
    const prior = await json(path.join(this.config.stateDir, 'projects', `${sha(request.project)}.json`));
    const handoff = prior?.handoff ?? '';
    const packet = buildBatchPacket({ request, rows, handoff, config: this.config });
    return { rows, cwd, packet };
  }
  async execute(request, { signal } = {}) {
    if (!this.settings.enabled) return { skipped: 'manual_launches_disabled' };
    const existing = await json(this.jobPath(request.id));
    if (existing) return existing;
    const release = await acquireProcessLock(path.join(this.config.stateDir, 'manual-project-locks', sha(request.project)));
    try {
      if (!(await this.create(request))) return await json(this.jobPath(request.id));
      let validated;
      try { validated = await this.validate(request); }
      catch (error) { return await this.update(request.id, { phase: 'finished', status: 'failed', errorCode: error.code ?? 'MANUAL_VALIDATION_FAILED', finishedAt: this.iso() }); }
      const { rows, cwd, packet } = validated;
      await this.update(request.id, { phase: 'spawn_intent', status: 'ambiguous', spawnIntentAt: this.iso(), cwd, packetSha256: sha(packet), packetBytes: Buffer.byteLength(packet), responses: rows.map(row => ({ id: row.id, ref: row.item.ref, createdAt: row.created_at, ruledAt: row.item.ruled_at, responseSha256: sha(JSON.stringify(collectedResponseFor(row))) })) });
      if(signal?.aborted)return await this.update(request.id,{phase:'finished',status:'failed',errorCode:'MANUAL_CANCELLED_BEFORE_SPAWN',finishedAt:this.iso()});
      return await this.runChild(request, cwd, packet, signal);
    } finally { await release(); }
  }
  async runChild(request, cwd, packet, signal) {
    let child;
    try { child = this.spawn(this.config.codexCommand ?? process.env.CODEX_APP_RUNTIME_CLI_PATH ?? 'codex', cliArguments(cwd, path.dirname(this.jobPath(request.id))), { cwd, shell: false, windowsHide: true, stdio: ['pipe','pipe','pipe'] }); }
    catch { return await this.update(request.id, { phase: 'finished', status: 'ambiguous', errorCode: 'MANUAL_SPAWN_UNCERTAIN', finishedAt: this.iso() }); }
    let bytes=0, buffer='', stopped=null, eventError=null, chain=Promise.resolve(), seenTurn=false, resolveStopped, closed=false, terminationUncertain=false;
    const decoder=new StringDecoder('utf8');
    const stoppedResult=new Promise(resolve=>{resolveStopped=resolve;});
    const stop = code => { if (stopped) return; stopped=code; void Promise.resolve(this.killTree(child)).then(killed=>{terminationUncertain=killed===false&&!closed;},()=>{terminationUncertain=!closed;}).finally(()=>resolveStopped({stopped:true})); };
    const event = value => {
      if (value.type === 'thread.started') {
        uuid(value.thread_id);
        chain=chain.then(()=>this.update(request.id,current=>{
          if (current.threadId && current.threadId !== value.thread_id) fail('CLI changed thread identity.', 'MANUAL_THREAD_CHANGED');
          return { phase:'running',status:'launched',threadId:value.thread_id,launchedAt:current.launchedAt??this.iso() };
        })).then(async job=>{if(this.launchApi&&request.claimId)await this.launchApi.result({id:request.id,claimId:request.claimId,status:'launched',threadId:job.threadId});});
      } else if (value.type === 'turn.completed') {
        seenTurn=true;
        const keys=['input_tokens','cached_input_tokens','output_tokens'];
        const usage=keys.every(key=>Number.isSafeInteger(value.usage?.[key])&&value.usage[key]>=0&&value.usage[key]<=1_000_000_000)&&value.usage.cached_input_tokens<=value.usage.input_tokens?Object.fromEntries(keys.map(key=>[key,value.usage[key]])):null;
        chain=chain.then(()=>this.update(request.id,{usage,turnCompletedAt:this.iso()}));
      } else if(value.type==='item.completed'&&value.item?.type==='agent_message'&&typeof value.item.text==='string'){
        const lastAgentMessage=brief(value.item.text);
        chain=chain.then(()=>this.update(request.id,{lastAgentMessage}));
      } else if (value.type === 'turn.failed' || value.type === 'error') eventError='MANUAL_CLI_TURN_FAILED';
      chain=chain.catch(()=>{eventError='MANUAL_EVENT_PERSIST_FAILED';stop(eventError);});
    };
    child.stdout.on('data', chunk=>{
      bytes+=chunk.length;if(bytes>this.settings.maxOutputBytes){stop('MANUAL_OUTPUT_LIMIT');return;}
      buffer+=decoder.write(chunk);
      let index;while((index=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);if(line.trim())try{event(JSON.parse(line));}catch{eventError='MANUAL_INVALID_JSON_EVENT';stop(eventError);}}
    });
    child.stderr.on('data',chunk=>{bytes+=chunk.length;if(bytes>this.settings.maxOutputBytes)stop('MANUAL_OUTPUT_LIMIT');});
    const timer=setTimeout(()=>stop('MANUAL_DEADLINE'),this.settings.timeoutMs);
    const abort=()=>stop('MANUAL_CANCELLED');signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
    const outcome=await Promise.race([stoppedResult,new Promise(resolve=>{child.once('error',()=>resolve({error:true}));child.once('close',(code,signal)=>{closed=true;resolve({code,signal});});child.stdin.on('error',()=>{});child.stdin.end(packet);})]);
    clearTimeout(timer);signal?.removeEventListener('abort',abort);child.stdout.removeAllListeners('data');child.stderr.removeAllListeners('data');
    if(outcome.stopped){child.stdout.destroy?.();child.stderr.destroy?.();child.stdin.destroy?.();child.unref?.();}
    buffer+=decoder.end();await chain;
    if(buffer.trim()&&!stopped)try{event(JSON.parse(buffer));await chain;}catch{eventError='MANUAL_INVALID_JSON_EVENT';}
    const final=await this.update(request.id,current=>{
      const completed=current.responses.every(row=>current.callbacks?.[row.id]?.doneAt);
      const status=terminationUncertain?'ambiguous':completed?'completed':stopped||eventError?'needs_attention':outcome.error||!current.threadId?'ambiguous':outcome.code===0&&seenTurn?'needs_attention':'failed';
      return {phase:terminationUncertain?'uncertain':'finished',status,finishedAt:this.iso(),exitCode:Number.isInteger(outcome.code)?outcome.code:null,errorCode:terminationUncertain?'MANUAL_TERMINATION_UNCERTAIN':stopped??eventError??(outcome.error?'MANUAL_SPAWN_UNCERTAIN':null),outputBytes:bytes};
    });
    await this.saveHandoff(final);
    return final;
  }
  async saveHandoff(job){
    const statuses=job.responses.map(row=>`${row.ref}: ${job.callbacks?.[row.id]?.doneAt?'Completed.':'Completion pending.'}`).join('\n');
    const outcomeBrief=job.lastAgentMessage??job.responses.map(row=>job.callbacks?.[row.id]?.outcome??'').filter(Boolean).join('\n');
    const handoff=brief([statuses,outcomeBrief].filter(Boolean).join('\n\n'),2048);
    await atomicJson(path.join(this.config.stateDir,'projects',`${sha(job.project)}.json`),{version:1,project:job.project,batchId:job.batchId,updatedAt:this.iso(),handoff});
  }
  async pollOnce({ signal }={}) {
    if (!this.settings.enabled) return { skipped: 'manual_launches_disabled' };
    const release=await acquireProcessLock(path.join(this.config.stateDir,'manual-execution'));
    try{return await this.pollClaimed({signal});}finally{await release();}
  }
  async pollClaimed({signal}={}){
    if(signal?.aborted)return null;
    const pending = await this.launchApi.poll();
    if (!pending?.length) return null;
    const request = pending[0];
    const claimId=randomUUID();
    const claim = await this.launchApi.claim({ id: request.id, claimId });
    if (!claim?.claimed||!claim.batch) return null;
    const batch=claim.batch;
    if(batch.id!==request.id||!Array.isArray(batch.answers)||!Array.isArray(batch.responseIds)||sha(JSON.stringify(batch.answers))!==batch.answerDigest)fail('The claimed batch snapshot is invalid.','MANUAL_CLAIM_INVALID');
    const job = await this.execute({id:batch.id,project:batch.project,host:this.host,requestedAt:batch.createdAt,claimId,answerDigest:batch.answerDigest,responses:batch.responseIds.map(id=>{const answer=batch.answers.find(value=>value.responseId===id);return{id,createdAt:answer?.createdAt,ruledAt:answer?.createdAt};})},{signal});
    await this.launchApi.result({ id: request.id, claimId, status: job.status, ...(job.threadId?{threadId:job.threadId}:{}), ...(job.usage?{usage:job.usage}:{}), note:ownerResultNote(job) });
    return job;
  }
  async callback({ action, batchId, responseId, note, env=process.env }) {
    if (!['pickup','done'].includes(action)) fail('Unsupported batch callback.', 'INVALID_CALLBACK');
    const job=await json(this.jobPath(batchId));
    const response=job?.responses?.find(row=>row.id===responseId);
    if (!job || !response || !['running','finished'].includes(job.phase) || !UUID.test(job.threadId??'') || env.CODEX_THREAD_ID!==job.threadId) fail('The callback must match the actual fresh batch thread.', 'CALLBACK_SESSION_MISMATCH');
    if (action==='done'&&(typeof note!=='string'||!note.trim()||note.length>4000)) fail('Completion requires a specific outcome note under 4001 characters.', 'INVALID_CALLBACK');
    const current=await this.rpc('owner_loop_get',{p_ref:response.ref});const item=current?.item??current;
    const actor=`codex:${job.threadId}`;
    if(item?.ref!==response.ref||item.project!==job.project||item.origin_host!==job.host||item.deleted_at||item.archived_at||!exactRevision(item.ruled_at,response.ruledAt)||['PARK','DROP'].includes(String(item.ruling).toUpperCase())||!['ruled','picked_up','done'].includes(item.status))fail('This owner ruling changed after batch launch.','CALLBACK_ITEM_CHANGED');
    if(['picked_up','done'].includes(item.status)&&item.picked_up_by!==actor)fail('Another worker owns this dashboard item.','CALLBACK_OWNERSHIP_MISMATCH');
    if(action==='done'&&(!job.callbacks?.[responseId]?.pickupAt||item.picked_up_by!==actor))fail('Acknowledge the response before completing it.','CALLBACK_OWNERSHIP_MISMATCH');
    if(item.status!=='done'&&!(action==='pickup'&&item.status==='picked_up'))await this.rpc('owner_loop_transition',{p_ref:response.ref,p_action:action,p_actor:actor,p_note:action==='pickup'?`Acknowledged explicitly launched batch ${batchId}, response ${responseId}.`:note,p_ruling:null});
    const at=this.iso();
    await this.update(batchId,current=>{
      const callbacks={...current.callbacks,[responseId]:{...current.callbacks?.[responseId],[action==='pickup'?'pickupAt':'doneAt']:at,...(action==='done'?{outcome:note}:{})}};
      return{callbacks,...(current.responses.every(row=>callbacks[row.id]?.doneAt)?{status:'completed'}:{})};
    });
    await atomicJson(path.join(path.dirname(this.jobPath(batchId)),`${uuid(responseId)}-${action}.json`),{batchId,responseId,action,threadId:job.threadId,recordedAt:at});
    return{ok:true,batchId,responseId,action,threadId:job.threadId,recordedAt:at};
  }
}

export async function main(args=process.argv.slice(2)) {
  const command=args.shift()??'run';const options={};
  for(let i=0;i<args.length;i++){if(args[i]==='--once')options.once=true;else if(['--config','--job','--response','--note'].includes(args[i])&&args[i+1]!==undefined)options[args[i].slice(2)]=args[++i];else fail('Unknown or incomplete manual worker option.','INVALID_ARGUMENTS');}
  let config,batchId;
  if(command==='batch-acknowledge'||command==='batch-complete'){
    const jobFile=path.resolve(options.job??'');batchId=uuid(path.basename(path.dirname(jobFile)));
    if(path.basename(jobFile)!=='job.json'||path.basename(path.dirname(path.dirname(jobFile)))!=='manual-batches')fail('The callback requires an exact per-batch job receipt.','INVALID_CALLBACK');
    const job=await json(jobFile);if(job?.batchId!==batchId)fail('The batch job receipt does not match.','INVALID_CALLBACK');
    config={...job.callbackConfig,stateDir:path.dirname(path.dirname(path.dirname(jobFile))),manualLaunches:{}};
  }else{if(!options.config)fail('Use an explicit manual bridge configuration.','INVALID_ARGUMENTS');config=await loadConfig(options.config);}
  const rpc=createOwnerLoopRpc({baseUrl:config.supabaseUrl,dashboardUrl:config.dashboardUrl,transport:config.rpcTransport});
  const worker=new ManualBatchWorker({config,rpc,launchApi:createManualLaunchApi({dashboardUrl:config.dashboardUrl})});
  if(command==='batch-acknowledge'||command==='batch-complete'){console.log(JSON.stringify(await worker.callback({action:command==='batch-acknowledge'?'pickup':'done',batchId,responseId:options.response,note:options.note})));return;}
  if(command!=='run')fail('Unsupported manual worker command.','INVALID_ARGUMENTS');
  if(!worker.settings.enabled){console.log(JSON.stringify({ok:true,skipped:'manual_launches_disabled'}));return;}
  const release=await acquireProcessLock(path.join(config.stateDir,'manual-runner'));
  const controller=new AbortController();const stop=()=>controller.abort();process.once('SIGINT',stop);process.once('SIGTERM',stop);
  try{do{try{const result=await worker.pollOnce({signal:controller.signal});if(result)console.log(JSON.stringify({batchId:result.batchId,status:result.status}));}catch(error){console.error(JSON.stringify({ok:false,errorCode:error.code??'MANUAL_OPERATION_FAILED'}));if(options.once)throw error;}if(!options.once&&!controller.signal.aborted)try{await delay(config.intervalSeconds*1000,undefined,{signal:controller.signal});}catch(error){if(error.name!=='AbortError')throw error;}}while(!options.once&&!controller.signal.aborted);}finally{process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);await release();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(JSON.stringify({ok:false,errorCode:error.code??'MANUAL_OPERATION_FAILED',message:error instanceof BridgeError?error.message:'Manual batch operation failed.'}));process.exitCode=1;});
