import { readFile, mkdir, rename, readdir, open, unlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { CodexQueueClient, clientUserMessageIdFor } from './codex-queue-client.mjs';

export const DEFAULT_SUPABASE_URL = 'https://bniuiwbwumpymxiesyyt.supabase.co';
export const DEFAULT_DASHBOARD_URL = 'https://dashboard.strandautomationworks.com';
const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const REF = /^D-\d{4,}$/;
const STATES = new Set(['preparing', 'queued', 'ambiguous', 'started', 'delivered', 'blocked']);
const TERMINAL_ITEMS = new Set(['done', 'dropped']);

export class BridgeError extends Error {
  constructor(message, code = 'BRIDGE_ERROR') { super(message); this.name = 'BridgeError'; this.code = code; }
}
function requireUuid(value, name) {
  if (typeof value !== 'string' || !UUID.test(value)) throw new BridgeError(`${name} must be an exact UUID.`, 'INVALID_CONFIG');
  return value;
}
function hash(value) { return createHash('sha256').update(value).digest('hex'); }
function timestampKey(value) {
  const match = typeof value === 'string' && value.match(/^(.*T\d\d:\d\d:\d\d)(?:\.(\d{1,9}))?(Z|[+-]\d\d:\d\d)$/);
  if (!match) return null;
  const seconds = Date.parse(match[1] + match[3]);
  return Number.isFinite(seconds) ? `${seconds}:${(match[2] ?? '').padEnd(9, '0')}` : null;
}
function sameTimestamp(a, b) { const key = timestampKey(a); return key !== null && key === timestampKey(b); }
function text(value) { return typeof value === 'string' ? value : ''; }
function routeTarget(value) { return typeof value === 'string' ? value : value?.threadId; }
function errorCode(error) { return typeof error?.code === 'string' && /^[A-Z_\d-]{1,80}$/.test(error.code) ? error.code : 'OPERATION_FAILED'; }
export function eventMarker(eventId) { return `[[dashboard-response:${requireUuid(eventId, 'Response ID')}]]`; }

export function validateConfig(raw, configPath) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new BridgeError('Config must be an object.', 'INVALID_CONFIG');
  if (raw.version !== 1) throw new BridgeError('Config version must be 1.', 'INVALID_CONFIG');
  if (!['canary', 'routed'].includes(raw.mode)) throw new BridgeError('Select canary or explicitly allowlisted routed mode.', 'INVALID_CONFIG');
  const canaryThreadId = raw.mode === 'canary' ? requireUuid(raw.canaryThreadId, 'canaryThreadId') : null;
  const allowedThreadIds = raw.mode === 'canary' ? [canaryThreadId] : raw.allowedThreadIds;
  if (!Array.isArray(allowedThreadIds) || !allowedThreadIds.length) throw new BridgeError('Routed mode requires an explicit allowedThreadIds UUID list.', 'INVALID_CONFIG');
  for (const id of allowedThreadIds) requireUuid(id, 'Allowed thread');
  if (typeof raw.startAt !== 'string' || !/(?:Z|[+-]\d\d:\d\d)$/.test(raw.startAt) || !Number.isFinite(Date.parse(raw.startAt))) {
    throw new BridgeError('startAt must be an explicit timestamp with timezone; historical work is never implied.', 'INVALID_CONFIG');
  }
  const sessionRoutes = raw.sessionRoutes ?? {};
  const projectRoutes = raw.projectRoutes ?? {};
  for (const routes of [sessionRoutes, projectRoutes]) {
    if (!routes || typeof routes !== 'object' || Array.isArray(routes)) throw new BridgeError('Route maps must be objects.', 'INVALID_CONFIG');
    for (const [source, route] of Object.entries(routes)) {
      if (!source || !allowedThreadIds.includes(routeTarget(route))) throw new BridgeError('Every configured route must target an explicitly allowed UUID.', 'INVALID_CONFIG');
      requireUuid(routeTarget(route), 'Route target');
    }
  }
  if (!Object.keys(sessionRoutes).length && !Object.keys(projectRoutes).length) throw new BridgeError('At least one explicit route is required.', 'INVALID_CONFIG');
  const intervalSeconds = raw.intervalSeconds ?? 15;
  if (!Number.isInteger(intervalSeconds) || intervalSeconds < 5 || intervalSeconds > 3600) throw new BridgeError('intervalSeconds must be 5–3600.', 'INVALID_CONFIG');
  if (raw.includeUrgent === true) throw new BridgeError('Urgent responses remain owned by the legacy dispatcher in this canary.', 'INVALID_CONFIG');
  if (raw.agentCommandBase && (!Array.isArray(raw.agentCommandBase) || !raw.agentCommandBase.length || raw.agentCommandBase.some(x => typeof x !== 'string' || !x))) {
    throw new BridgeError('agentCommandBase must be a nonempty argument array.', 'INVALID_CONFIG');
  }
  const supabaseUrl = raw.supabaseUrl ?? DEFAULT_SUPABASE_URL;
  const url = new URL(supabaseUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new BridgeError('Supabase must use an HTTPS origin without embedded credentials.', 'INVALID_CONFIG');
  const dashboardUrl = new URL(raw.dashboardUrl ?? DEFAULT_DASHBOARD_URL);
  if (dashboardUrl.protocol !== 'https:' || dashboardUrl.username || dashboardUrl.password || dashboardUrl.search || dashboardUrl.hash) throw new BridgeError('Dashboard must use an HTTPS origin without embedded credentials.', 'INVALID_CONFIG');
  if (raw.rpcTransport && !['proxy', 'supabase'].includes(raw.rpcTransport)) throw new BridgeError('Unsupported owner-loop transport.', 'INVALID_CONFIG');
  return {
    ...raw, version: 1, mode: raw.mode, canaryThreadId, allowedThreadIds: [...new Set(allowedThreadIds)], sessionRoutes, projectRoutes, intervalSeconds,
    includeUrgent: false, startAt: new Date(raw.startAt).toISOString(), supabaseUrl: url.origin, dashboardUrl: dashboardUrl.origin, rpcTransport: raw.rpcTransport ?? 'proxy',
    stateDir: path.resolve(raw.stateDir ?? path.join(homedir(), '.cache', 'strandworks', 'dashboard-codex-bridge')),
    configPath: configPath ? path.resolve(configPath) : raw.configPath,
    agentCommandBase: raw.agentCommandBase ?? [process.execPath, fileURLToPath(import.meta.url)],
  };
}
export async function loadConfig(configPath) { return validateConfig(JSON.parse(await readFile(configPath, 'utf8')), configPath); }

/** Secrets are loaded only for the RPC request, never placed in config, receipts or errors. */
export function createOwnerLoopRpc({ env = process.env, home = homedir(), fetchImpl = fetch, baseUrl = DEFAULT_SUPABASE_URL, dashboardUrl = DEFAULT_DASHBOARD_URL, transport = 'proxy' } = {}) {
  return async function rpc(name, args = {}) {
    if (!/^owner_loop_[a-z_]+$/.test(name)) throw new BridgeError('Unsupported owner-loop operation.', 'INVALID_RPC');
    let token, apikey;
    try {
      token = env.OWNER_LOOP_TOKEN || (await readFile(path.join(home, '.config', 'strandworks', 'owner-loop.token'), 'utf8')).trim();
      if (transport === 'supabase') apikey = env.OWNER_LOOP_APIKEY || (await readFile(path.join(home, '.config', 'strandworks', 'owner-loop.apikey'), 'utf8')).trim();
    } catch { throw new BridgeError('Scoped owner-loop credentials are not installed.', 'CREDENTIALS_UNAVAILABLE'); }
    if (!token || (transport === 'supabase' && !apikey)) throw new BridgeError('Scoped owner-loop credentials are empty.', 'CREDENTIALS_UNAVAILABLE');
    let response;
    try {
      response = await fetchImpl(transport === 'supabase' ? `${baseUrl}/rest/v1/rpc/${name}` : `${dashboardUrl}/api/loop/agent`, {
        method: 'POST', headers: transport === 'supabase' ? { apikey, 'Content-Type': 'application/json' } : { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(transport === 'supabase' ? { ...args, p_token: token } : { function: name, args }), signal: AbortSignal.timeout(15000),
      });
    } catch { throw new BridgeError(`Dashboard operation ${name} was unavailable.`, 'DASHBOARD_UNAVAILABLE'); }
    if (!response.ok) throw new BridgeError(`Dashboard operation ${name} returned HTTP ${response.status}.`, 'DASHBOARD_RPC_FAILED');
    try { const body = await response.json(); if (transport === 'supabase') return body; if (!Object.hasOwn(body, 'result')) throw new Error(); return body.result; }
    catch { throw new BridgeError(`Dashboard operation ${name} returned invalid data.`, 'DASHBOARD_INVALID_DATA'); }
  };
}

export async function atomicJson(filename, value) {
  await mkdir(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.${process.pid}.${randomUUID()}.tmp`;
  const handle = await open(temporary, 'wx', 0o600);
  try { await handle.writeFile(JSON.stringify(value, null, 2) + '\n', 'utf8'); await handle.sync(); }
  finally { await handle.close(); }
  try { await rename(temporary, filename); }
  catch (error) { await unlink(temporary).catch(() => {}); throw error; }
}
async function readJson(filename, fallback = null) {
  try { return JSON.parse(await readFile(filename, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

/** A kernel-owned named pipe prevents duplicate Windows runners and releases on crash. */
export async function acquireProcessLock(stateDir) {
  const identity = hash(path.resolve(stateDir).toLowerCase()).slice(0, 24);
  const endpoint = process.platform === 'win32' ? `\\\\.\\pipe\\strandworks-dashboard-bridge-${identity}` : path.join(tmpdir(), `strandworks-bridge-${identity}.sock`);
  const server = createServer(socket => socket.destroy());
  await new Promise((resolve, reject) => {
    server.once('error', error => reject(new BridgeError(error.code === 'EADDRINUSE' ? 'Another bridge runner owns this state directory.' : 'The bridge process lock is unavailable.', 'BRIDGE_LOCKED')));
    server.listen(endpoint, resolve);
  });
  return () => new Promise(resolve => server.close(resolve));
}

export function routeFor(row, config) {
  const item = row.item ?? {};
  const session = text(item.origin_session);
  let route = session && Object.hasOwn(config.sessionRoutes, session) ? config.sessionRoutes[session] : undefined;
  if (!route && Object.hasOwn(config.projectRoutes, item.project)) route = config.projectRoutes[item.project];
  if (!route) return { ok: false, reason: session ? 'origin_session_not_routed' : 'project_not_routed' };
  const target = routeTarget(route);
  if (!config.allowedThreadIds.includes(target)) return { ok: false, reason: 'target_outside_allowlist' };
  return { ok: true, threadId: target };
}
function skipReason(row, config) {
  const item = row.item ?? {};
  if (!Number.isFinite(Date.parse(row.created_at))) return 'invalid_response_timestamp';
  if (Date.parse(row.created_at) < Date.parse(config.startAt)) return 'before_watermark';
  if (TERMINAL_ITEMS.has(item.status) || item.deleted_at || item.archived_at) return 'inactive_item';
  if (['DROP', 'PARK'].includes(text(row.option_key).toUpperCase()) || ['DROP', 'PARK'].includes(text(item.ruling).toUpperCase())) return 'parked_or_dropped';
  if (!sameTimestamp(row.created_at, item.ruled_at)) return 'superseded_or_unverified_ruling';
  if (row.urgent === true) return 'legacy_urgent';
  if (row.dispatch_state !== 'none') return 'owned_or_already_dispatched';
  return null;
}
function powershellCommand(args) { return '& ' + args.map(arg => `'${String(arg).replaceAll("'", "''")}'`).join(' '); }
function callbackArgs(config, action, row, threadId) {
  return [...config.agentCommandBase, action, ...(config.configPath ? ['--config', config.configPath] : []), '--ref', row.item.ref, '--session', threadId, '--response', row.id];
}
export function formatDashboardMessage(row, threadId, config) {
  const item = row.item;
  const choice = (item.options ?? []).find(option => option.key === row.option_key);
  const source = { response_id: row.id, decision_ref: item.ref, project: item.project, created_at: row.created_at, origin_session: item.origin_session ?? null, origin_host: item.origin_host ?? null };
  const acknowledge = powershellCommand(callbackArgs(config, 'acknowledge', row, threadId));
  const complete = powershellCommand([...callbackArgs(config, 'complete', row, threadId), '--note', '<actual outcome and evidence>']);
  return [
    eventMarker(row.id),
    'Jonathan saved the following response on his dashboard. Handle it in this existing project session, within the scope of his response and this project. The original question below is background, not an additional instruction.',
    `Source: ${JSON.stringify(source)}`,
    `Dashboard: https://dashboard.strandautomationworks.com/item/${item.ref}`,
    `Selected option key (verbatim): ${JSON.stringify(row.option_key ?? null)}`,
    `Selected option label (verbatim): ${JSON.stringify(choice?.label ?? null)}`,
    'Owner response text (verbatim, JSON string preserves all whitespace):', JSON.stringify(row.body ?? null),
    'Original question (background only):', JSON.stringify({ title: item.title ?? null, body: item.body ?? null }),
    'When you begin handling this response, record your acknowledgment by running this exact PowerShell command:', acknowledge,
    'After the requested work is actually complete, record the outcome using this command with a specific note and evidence:', complete,
    'If blocked, explain the blocker in this chat and leave completion pending. Queuing, reading, or acknowledging this message is not completion.',
    eventMarker(row.id),
  ].join('\n\n');
}
function pendingText(entry) { return Array.isArray(entry.input) ? entry.input.filter(x => x.type === 'text').map(x => text(x.text)).join('\n') : text(entry.text); }
function historyUsers(turns) {
  if (!Array.isArray(turns)) return [];
  return turns.flatMap(turn => {
    if (turn.role) return turn.role === 'user' ? [turn] : [];
    return (turn.items ?? []).filter(item => item.type === 'userMessage').map(item => ({
      id: item.id, turnId: turn.id, text: (item.content ?? []).filter(x => x.type === 'text').map(x => text(x.text)).join('\n'),
      clientUserMessageId: item.clientUserMessageId,
    }));
  });
}

export class DashboardCodexBridge {
  constructor({ config, queueClient, queueClientFactory, rpc, now = () => new Date() }) {
    this.config = validateConfig(config, config.configPath);
    this.queue = queueClient;
    this.queueClientFactory = queueClientFactory;
    this.rpc = rpc;
    this.now = now;
    this.receiptsDir = path.join(this.config.stateDir, 'receipts');
    this.healthFile = path.join(this.config.stateDir, 'health.json');
  }
  isoNow() { return new Date(this.now()).toISOString(); }
  receiptPath(id) { requireUuid(id, 'Response ID'); return path.join(this.receiptsDir, `${id}.json`); }
  async receipts() {
    await mkdir(this.receiptsDir, { recursive: true });
    const names = (await readdir(this.receiptsDir)).filter(name => UUID.test(name.replace(/\.json$/, '')) && name.endsWith('.json'));
    return Promise.all(names.map(name => readJson(path.join(this.receiptsDir, name))));
  }
  async save(receipt) { receipt.updatedAt = this.isoNow(); await atomicJson(this.receiptPath(receipt.eventId), receipt); return receipt; }
  async fetchRows() {
    const modes = ['linear', 'watch', 'dispatch'];
    const results = await Promise.allSettled(modes.map(p_mode => this.rpc('owner_loop_outbox', { p_mode })));
    if (results.some(result => result.status !== 'fulfilled' || !Array.isArray(result.value))) throw new BridgeError('The complete dashboard response queue could not be read.', 'DASHBOARD_READ_FAILED');
    const rows = new Map();
    for (const result of results) for (const row of result.value) {
      requireUuid(row?.id, 'Response ID');
      if (!row.item || !REF.test(row.item.ref)) throw new BridgeError('Dashboard returned an invalid response reference.', 'DASHBOARD_INVALID_DATA');
      rows.set(row.id, row);
    }
    return [...rows.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id));
  }
  async submit(row) {
    const existing = await readJson(this.receiptPath(row.id));
    if (existing) return existing;
    const route = routeFor(row, this.config);
    const base = { version: 1, eventId: row.id, ref: row.item.ref, project: row.item.project, eventCreatedAt: row.created_at, itemRuledAt: row.item.ruled_at ?? null, originSession: row.item.origin_session ?? null, marker: eventMarker(row.id) };
    if (!route.ok) return this.save({ ...base, state: 'blocked', reason: route.reason });
    const message = formatDashboardMessage(row, route.threadId, this.config);
    const receipt = await this.save({ ...base, targetThreadId: route.threadId, clientUserMessageId: clientUserMessageIdFor({ threadId: route.threadId, eventId: row.id }), messageSha256: hash(message), state: 'preparing', preparingAt: this.isoNow() });
    try {
      const queueId = await this.queue.enqueue({ threadId: route.threadId, text: message, clientUserMessageId: receipt.clientUserMessageId });
      if (typeof queueId !== 'string' || !queueId) throw new BridgeError('Queue add had an uncertain result.', 'QUEUE_ADD_UNCERTAIN');
      return this.save({ ...receipt, state: 'queued', queueId, submittedAt: this.isoNow() });
    } catch (error) {
      return this.save({ ...receipt, state: 'ambiguous', reason: 'submission_result_unknown', lastErrorCode: errorCode(error) });
    }
  }
  async reconcile(receipt) {
    if (receipt.state === 'blocked') return { ok: false, receipt };
    if (!this.config.allowedThreadIds.includes(receipt.targetThreadId)) return { ok: false, receipt: await this.save({ ...receipt, state: 'blocked', reason: 'receipt_target_outside_allowlist' }) };
    if (typeof receipt.messageSha256 !== 'string' || !/^[a-f\d]{64}$/.test(receipt.messageSha256)) return { ok: false, receipt: await this.save({ ...receipt, state: 'blocked', reason: 'receipt_payload_hash_missing' }) };
    const [pendingResult, historyResult] = await Promise.allSettled([
      this.queue.list({ threadId: receipt.targetThreadId }), this.queue.readHistory({ threadId: receipt.targetThreadId, limit: 100 }),
    ]);
    const history = historyResult.status === 'fulfilled' ? historyUsers(historyResult.value) : [];
    const observed = history.find(message => message.text.includes(receipt.marker) && hash(message.text) === receipt.messageSha256);
    if (observed) {
      let updated = await this.save({ ...receipt, state: receipt.backendDeliveredAt ? 'delivered' : 'started', observedAt: receipt.observedAt ?? this.isoNow(), observedUserMessageId: observed.id ?? null, observedTurnId: observed.turnId ?? null });
      if (!updated.backendDeliveredAt) {
        try {
          await this.rpc('owner_loop_outbox_mark', { p_id: updated.eventId, p_patch: { dispatch_state: 'delivered', dispatch_target: `codex session ${updated.targetThreadId}`, dispatch_note: 'Local bridge observed this response in persisted user-message history; agent acknowledgment and outcome are separate.' } });
          updated = await this.save({ ...updated, state: 'delivered', backendDeliveredAt: this.isoNow(), lastErrorCode: null });
        } catch (error) {
          updated = await this.save({ ...updated, lastErrorCode: errorCode(error) });
          return { ok: false, receipt: updated };
        }
      }
      return { ok: true, receipt: updated };
    }
    if (receipt.observedAt) return { ok: true, receipt }; // Previously persisted evidence remains valid after history pagination advances.
    if (pendingResult.status !== 'fulfilled' || !Array.isArray(pendingResult.value) || historyResult.status !== 'fulfilled') {
      return { ok: false, receipt: await this.save({ ...receipt, lastErrorCode: 'QUEUE_RECONCILIATION_UNAVAILABLE' }) };
    }
    const pending = pendingResult.value.filter(entry => {
      const content = pendingText(entry);
      return content.includes(receipt.marker) && hash(content) === receipt.messageSha256;
    });
    if (pending.length === 1) return { ok: true, receipt: await this.save({ ...receipt, state: 'queued', queueId: pending[0].id, lastErrorCode: null }) };
    return { ok: false, receipt: await this.save({ ...receipt, state: 'ambiguous', reason: pending.length > 1 ? 'duplicate_pending_submissions' : 'queue_absent_without_persisted_user_message', lastErrorCode: null }) };
  }
  async tick() {
    if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'tick', pid: process.pid, at: this.isoNow() }));
    if (!this.queueClientFactory) return this.tickWithQueue();
    this.queue = this.queueClientFactory();
    try { return await this.tickWithQueue(); }
    finally { await this.queue.close?.(); }
  }
  async tickWithQueue() {
    if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'reading_outbox', pid: process.pid, at: this.isoNow() }));
    let rows = [], sourceError = null, reconciliationOk = true;
    const skipped = {};
    try { rows = await this.fetchRows(); }
    catch (error) { sourceError = errorCode(error); }
    if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'outbox_read', pid: process.pid, at: this.isoNow(), sourceError }));
    const newestByItem = new Map(), tiedItems = new Set();
    for (const row of rows) {
      const key = row.item.id ?? row.item.ref;
      const prior = newestByItem.get(key);
      const currentTime = timestampKey(row.created_at), priorTime = prior && timestampKey(prior.created_at);
      if (!prior || (currentTime && (!priorTime || currentTime > priorTime))) { newestByItem.set(key, row); tiedItems.delete(key); }
      else if (currentTime && currentTime === priorTime && prior.id !== row.id) tiedItems.add(key);
    }
    if (!sourceError) for (const row of rows) {
      if (await readJson(this.receiptPath(row.id))) continue;
      const itemKey = row.item.id ?? row.item.ref;
      if (tiedItems.has(itemKey) || newestByItem.get(itemKey)?.id !== row.id) { const reason = tiedItems.has(itemKey) ? 'ambiguous_response_order' : 'superseded_response'; skipped[reason] = (skipped[reason] ?? 0) + 1; continue; }
      const reason = skipReason(row, this.config);
      if (reason) { skipped[reason] = (skipped[reason] ?? 0) + 1; continue; }
      await this.submit(row);
    }
    for (const receipt of await this.receipts()) {
      if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'reconcile', pid: process.pid, at: this.isoNow() }));
      if (!STATES.has(receipt.state)) throw new BridgeError('A local receipt has an unsupported state.', 'RECEIPT_INVALID');
      const result = await this.reconcile(receipt);
      reconciliationOk &&= result.ok;
    }
    const receipts = await this.receipts();
    const counts = Object.fromEntries([...STATES].map(state => [state, receipts.filter(receipt => receipt.state === state).length]));
    const prior = await readJson(this.healthFile, {});
    const health = { version: 1, ok: !sourceError && reconciliationOk, pid: process.pid, mode: this.config.mode, canaryThreadId: this.config.canaryThreadId, allowedThreadIds: this.config.allowedThreadIds, startAt: this.config.startAt, intervalSeconds: this.config.intervalSeconds, checkedAt: this.isoNow(), lastSuccessfulReadAt: !sourceError ? this.isoNow() : prior.lastSuccessfulReadAt ?? null, source: sourceError ? { available: false, errorCode: sourceError } : { available: true, responseCount: rows.length }, counts, skipped };
    await atomicJson(this.healthFile, health);
    if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'healthy_tick_saved', pid: process.pid, at: this.isoNow() }));
    return health;
  }
  async runOnce() { const release = await acquireProcessLock(this.config.stateDir); try { return await this.tick(); } finally { await release(); } }
  async runForever({ signal } = {}) {
    if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'acquiring_lock', pid: process.pid, at: this.isoNow() }));
    const release = await acquireProcessLock(this.config.stateDir);
    if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'lock_acquired', pid: process.pid, at: this.isoNow() }));
    try {
      while (!signal?.aborted) {
        try { await this.tick(); }
        catch (error) { await atomicJson(this.healthFile, { version: 1, ok: false, pid: process.pid, checkedAt: this.isoNow(), source: { available: false, errorCode: errorCode(error) }, errorCode: errorCode(error) }); }
        try { await delay(this.config.intervalSeconds * 1000, undefined, { signal }); }
        catch (error) { if (error.name !== 'AbortError') throw error; }
      }
    } finally { await release(); }
  }
  async status() {
    const health = await readJson(this.healthFile, { ok: false, source: { available: false, errorCode: 'NOT_STARTED' } });
    let processAlive = false;
    if (health.pid) { try { process.kill(health.pid, 0); processAlive = true; } catch {} }
    const ageSeconds = health.checkedAt ? Math.max(0, (new Date(this.now()).getTime() - Date.parse(health.checkedAt)) / 1000) : null;
    return { ...health, processAlive, stale: ageSeconds === null || ageSeconds > this.config.intervalSeconds * 3, receipts: (await this.receipts()).map(({ eventId, ref, project, targetThreadId, state, reason, observedAt, backendDeliveredAt, lastErrorCode }) => ({ eventId, ref, project, targetThreadId, state, reason, observedAt, backendDeliveredAt, lastErrorCode })) };
  }
  async transition({ action, ref, session, responseId, note, env = process.env }) {
    if (!['pickup', 'done'].includes(action) || !REF.test(ref)) throw new BridgeError('Invalid response acknowledgment.', 'INVALID_CALLBACK');
    requireUuid(session, 'Session');
    if (env.CODEX_THREAD_ID && env.CODEX_THREAD_ID !== session) throw new BridgeError('This callback belongs to a different Codex session.', 'CALLBACK_SESSION_MISMATCH');
    let matches = (await this.receipts()).filter(receipt => receipt.ref === ref && receipt.targetThreadId === session && receipt.state !== 'blocked');
    if (responseId) matches = matches.filter(receipt => receipt.eventId === responseId);
    if (matches.length !== 1) throw new BridgeError('The callback must match exactly one routed response receipt.', 'CALLBACK_RECEIPT_MISMATCH');
    let receipt = matches[0];
    const reconciled = await this.reconcile(receipt);
    receipt = reconciled.receipt;
    if (!receipt.observedAt) throw new BridgeError('This response has not been observed in the target session history.', 'CALLBACK_NOT_OBSERVED');
    if (action === 'done' && (typeof note !== 'string' || !note.trim() || note.length > 4000)) throw new BridgeError('Completion requires a specific outcome note under 4001 characters.', 'INVALID_CALLBACK');
    const current = await this.rpc('owner_loop_get', { p_ref: ref });
    const item = current?.item ?? current;
    if (item?.ref !== ref || item.deleted_at || item.archived_at || item.status === 'dropped' || ['DROP', 'PARK'].includes(text(item.ruling).toUpperCase())) throw new BridgeError('This dashboard item is no longer actionable.', 'CALLBACK_ITEM_CHANGED');
    if (receipt.itemRuledAt && !sameTimestamp(item.ruled_at, receipt.itemRuledAt)) throw new BridgeError('The owner changed this decision after the queued response.', 'CALLBACK_ITEM_CHANGED');
    const actor = `codex:${session}`;
    if (['picked_up', 'done'].includes(item.status) && item.picked_up_by !== actor) throw new BridgeError('A different worker owns this dashboard item.', 'CALLBACK_OWNERSHIP_MISMATCH');
    if (item.status === 'done' || (action === 'pickup' && item.status === 'picked_up')) return { ok: true, alreadyRecorded: true, ref, action, responseId: receipt.eventId };
    if (!['ruled', 'picked_up'].includes(item.status)) throw new BridgeError('This item has no actionable owner ruling.', 'CALLBACK_ITEM_CHANGED');
    if (action === 'done' && item.picked_up_by !== actor) throw new BridgeError('Record acknowledgment in this session before completion.', 'CALLBACK_OWNERSHIP_MISMATCH');
    await this.rpc('owner_loop_transition', { p_ref: ref, p_action: action, p_actor: actor, p_note: action === 'pickup' ? `Acknowledged dashboard response ${receipt.eventId} in the mapped project session.` : note, p_ruling: null });
    const result = { ok: true, ref, action, responseId: receipt.eventId, session, recordedAt: this.isoNow() };
    await atomicJson(path.join(this.config.stateDir, 'callbacks', `${receipt.eventId}-${action}.json`), result);
    return result;
  }
}

function parseArgs(args) {
  const options = { command: 'run' };
  if (args[0] && !args[0].startsWith('--')) options.command = args.shift();
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--once' || key === '--status') options[key.slice(2)] = true;
    else if (['--config', '--ref', '--session', '--response', '--note'].includes(key) && args[i + 1] !== undefined) options[key.slice(2)] = args[++i];
    else throw new BridgeError('Unknown or incomplete bridge option.', 'INVALID_ARGUMENTS');
  }
  if (!options.config) throw new BridgeError('Use --config with an explicit canary configuration.', 'INVALID_ARGUMENTS');
  return options;
}
export async function main(args = process.argv.slice(2)) {
  const options = parseArgs([...args]);
  const config = await loadConfig(options.config);
  const makeQueue = () => new CodexQueueClient({ command: config.codexCommand ?? process.env.CODEX_APP_RUNTIME_CLI_PATH ?? 'codex', cwd: config.codexCwd ?? path.dirname(config.configPath) });
  const queue = makeQueue();
  const bridge = new DashboardCodexBridge({ config, queueClient: queue, queueClientFactory: options.command === 'run' ? makeQueue : undefined, rpc: createOwnerLoopRpc({ baseUrl: config.supabaseUrl, dashboardUrl: config.dashboardUrl, transport: config.rpcTransport }) });
  try {
    if (options.status) { console.log(JSON.stringify(await bridge.status(), null, 2)); return; }
    if (options.command === 'acknowledge' || options.command === 'complete') {
      console.log(JSON.stringify(await bridge.transition({ action: options.command === 'acknowledge' ? 'pickup' : 'done', ref: options.ref, session: options.session, responseId: options.response, note: options.note }), null, 2));
      return;
    }
    if (options.command !== 'run') throw new BridgeError('Unsupported bridge command.', 'INVALID_ARGUMENTS');
    if (options.once) { const health = await bridge.runOnce(); console.log(JSON.stringify(health, null, 2)); if (!health.ok) process.exitCode = 1; return; }
    const controller = new AbortController();
    const stop = () => controller.abort();
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
    try { await bridge.runForever({ signal: controller.signal }); }
    finally { process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); }
  } finally { await queue.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(JSON.stringify({ ok: false, errorCode: errorCode(error), message: error instanceof BridgeError ? error.message : 'Bridge operation failed; inspect the local status receipt.' })); process.exitCode = 1; });
}
