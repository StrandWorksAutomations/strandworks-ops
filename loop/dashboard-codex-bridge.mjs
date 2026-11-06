import { readFile, mkdir, rename, readdir, open, unlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { homedir, tmpdir, hostname } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { CodexQueueClient, clientUserMessageIdFor } from './codex-queue-client.mjs';

export const DEFAULT_SUPABASE_URL = 'https://bniuiwbwumpymxiesyyt.supabase.co';
export const DEFAULT_DASHBOARD_URL = 'https://dashboard.strandautomationworks.com';
const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const REF = /^D-\d{4,}$/;
const STATES = new Set(['awaiting_launch', 'preparing', 'queued', 'ambiguous', 'started', 'delivered', 'blocked', 'ignored']);
const TERMINAL_ITEMS = new Set(['done', 'dropped']);
const ROUTE_BLOCK_REASONS = new Set(['origin_session_not_routed', 'project_not_routed', 'target_outside_allowlist']);
const execFileAsync = promisify(execFile);
const READINESS_CACHE_MS = 30_000;

export class BridgeError extends Error {
  constructor(message, code = 'BRIDGE_ERROR') { super(message); this.name = 'BridgeError'; this.code = code; }
}
function requireUuid(value, name) {
  if (typeof value !== 'string' || !UUID.test(value)) throw new BridgeError(`${name} must be an exact UUID.`, 'INVALID_CONFIG');
  return value;
}
function hash(value) { return createHash('sha256').update(value).digest('hex'); }
export function timestampKey(value) {
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
  const deliveryMode = raw.deliveryMode ?? 'automatic';
  if (!['automatic', 'manual'].includes(deliveryMode)) throw new BridgeError('deliveryMode must be automatic or manual.', 'INVALID_CONFIG');
  if (!['canary', 'routed'].includes(raw.mode)) throw new BridgeError('Select canary or explicitly allowlisted routed mode.', 'INVALID_CONFIG');
  const canaryThreadId = raw.mode === 'canary' && (deliveryMode !== 'manual' || raw.canaryThreadId) ? requireUuid(raw.canaryThreadId, 'canaryThreadId') : null;
  const allowedThreadIds = raw.mode === 'canary' ? (canaryThreadId ? [canaryThreadId] : []) : raw.allowedThreadIds ?? (deliveryMode === 'manual' ? [] : undefined);
  if (!Array.isArray(allowedThreadIds) || (!allowedThreadIds.length && deliveryMode !== 'manual')) throw new BridgeError('Routed mode requires an explicit allowedThreadIds UUID list.', 'INVALID_CONFIG');
  for (const id of allowedThreadIds) requireUuid(id, 'Allowed thread');
  if (timestampKey(raw.startAt)===null) {
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
  if (deliveryMode !== 'manual' && !Object.keys(sessionRoutes).length && !Object.keys(projectRoutes).length) throw new BridgeError('At least one explicit route is required.', 'INVALID_CONFIG');
  const intervalSeconds = raw.intervalSeconds ?? 15;
  if (!Number.isInteger(intervalSeconds) || intervalSeconds < 5 || intervalSeconds > 3600) throw new BridgeError('intervalSeconds must be 5–3600.', 'INVALID_CONFIG');
  if (raw.includeUrgent === true && raw.legacyDispatcherDisabled !== true) throw new BridgeError('Urgent delivery requires explicit legacyDispatcherDisabled: true ownership confirmation.', 'INVALID_CONFIG');
  if (raw.publishHeartbeat !== undefined && typeof raw.publishHeartbeat !== 'boolean') throw new BridgeError('publishHeartbeat must be a boolean.', 'INVALID_CONFIG');
  const ignoredResponseIds = raw.ignoredResponseIds ?? [];
  if (!Array.isArray(ignoredResponseIds)) throw new BridgeError('ignoredResponseIds must be an explicit UUID list.', 'INVALID_CONFIG');
  for (const id of ignoredResponseIds) requireUuid(id, 'Ignored response');
  const originHostAllowlist = raw.originHostAllowlist;
  if (originHostAllowlist !== undefined && (!Array.isArray(originHostAllowlist) || !originHostAllowlist.length
    || originHostAllowlist.some(host => typeof host !== 'string' || !host || host.length > 255 || host.trim() !== host))) {
    throw new BridgeError('originHostAllowlist must be a nonempty exact hostname list.', 'INVALID_CONFIG');
  }
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
    ...raw, version: 1, mode: raw.mode, deliveryMode, canaryThreadId, allowedThreadIds: [...new Set(allowedThreadIds)], sessionRoutes, projectRoutes, intervalSeconds,
    includeUrgent: raw.includeUrgent === true, legacyDispatcherDisabled: raw.legacyDispatcherDisabled === true,
    publishHeartbeat: raw.publishHeartbeat === true,
    ignoredResponseIds: [...new Set(ignoredResponseIds)], originHostAllowlist: originHostAllowlist ? [...new Set(originHostAllowlist)] : undefined,
    startAt: raw.startAt, supabaseUrl: url.origin, dashboardUrl: dashboardUrl.origin, rpcTransport: raw.rpcTransport ?? 'proxy',
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

function validCount(value) { return Number.isSafeInteger(value) && value >= 0 ? value : 0; }
function oldestQueuedAt(receipts) {
  const timestamps = receipts.filter(receipt => ['queued', 'preparing'].includes(receipt?.state)).map(receipt => {
    for (const field of ['submittedAt', 'preparingAt', 'eventCreatedAt']) {
      if (typeof receipt[field] === 'string' && Number.isFinite(Date.parse(receipt[field]))) return Date.parse(receipt[field]);
    }
    return null;
  }).filter(value => value !== null);
  return timestamps.length ? new Date(timestamps.reduce((oldest, value) => Math.min(oldest, value), Infinity)).toISOString() : null;
}

/** Publish only aggregate operational data; never forward local receipt contents. */
export function createHeartbeatPublisher({ env = process.env, home = homedir(), fetchImpl = fetch,
  dashboardUrl = DEFAULT_DASHBOARD_URL, host = hostname(), timeoutMs = 10000 } = {}) {
  let origin;
  try {
    const url = new URL(dashboardUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error();
    origin = url.origin;
  } catch { throw new BridgeError('Heartbeat requires an HTTPS dashboard origin.', 'HEARTBEAT_INVALID_ORIGIN'); }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) throw new BridgeError('Heartbeat timeout is invalid.', 'INVALID_CONFIG');
  if (typeof host !== 'string' || !host || host.length > 255 || /\s/.test(host)) throw new BridgeError('Heartbeat hostname is invalid.', 'INVALID_CONFIG');
  return async function publish({ health, receipts = [], desktopReady = null }) {
    if (!health || typeof health.checkedAt !== 'string' || !Number.isFinite(Date.parse(health.checkedAt))
      || !Number.isInteger(health.intervalSeconds) || health.intervalSeconds < 5 || health.intervalSeconds > 3600 || !Array.isArray(receipts)) {
      throw new BridgeError('Heartbeat snapshot is invalid.', 'HEARTBEAT_INVALID_SNAPSHOT');
    }
    const counts = health.counts ?? {};
    const payload = {
      version: 1, host, checkedAt: health.checkedAt, sourceAvailable: health.source?.available === true,
      desktopReady: desktopReady === true ? true : desktopReady === false ? false : null,
      intervalSeconds: health.intervalSeconds,
      counts: {
        queued: Math.min(Number.MAX_SAFE_INTEGER, validCount(counts.queued) + validCount(counts.preparing)),
        ambiguous: validCount(counts.ambiguous), blocked: validCount(counts.blocked),
        started: validCount(counts.started), delivered: validCount(counts.delivered),
      },
      oldestQueuedAt: oldestQueuedAt(receipts),
    };
    if(health.deliveryMode==='manual'){
      payload.deliveryMode='manual';
      payload.counts.awaiting_launch=validCount(counts.awaiting_launch);
      payload.manualLaunchError=Boolean(health.manualLaunches?.errorCode);
    }
    let token;
    try { token = (env.OWNER_LOOP_TOKEN || await readFile(path.join(home, '.config', 'strandworks', 'owner-loop.token'), 'utf8')).trim(); }
    catch { throw new BridgeError('Scoped heartbeat credentials are not installed.', 'HEARTBEAT_CREDENTIALS_UNAVAILABLE'); }
    if (!token) throw new BridgeError('Scoped heartbeat credentials are empty.', 'HEARTBEAT_CREDENTIALS_UNAVAILABLE');
    let response;
    try {
      response = await fetchImpl(`${origin}/api/loop/agent/heartbeat`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
      });
    } catch { throw new BridgeError('Dashboard heartbeat was unavailable.', 'HEARTBEAT_UNAVAILABLE'); }
    // Discard response bytes rather than parsing or retaining upstream details.
    try { await response?.body?.cancel?.(); } catch {}
    if (!response || typeof response.ok !== 'boolean') throw new BridgeError('Dashboard heartbeat returned invalid data.', 'HEARTBEAT_INVALID_RESPONSE');
    if (!response.ok) throw new BridgeError(`Dashboard heartbeat returned HTTP ${response.status}.`, 'HEARTBEAT_HTTP_ERROR');
  };
}

/** Distinguish the packaged Desktop root from Electron children and CLI clients. */
export function desktopReadyFromProcesses(snapshot) {
  if (!snapshot || !Number.isInteger(snapshot.sessionId) || !Array.isArray(snapshot.processes)) return null;
  const processes = snapshot.processes.filter(process => process?.SessionId === snapshot.sessionId);
  const candidates = processes.filter(process => /^ChatGPT\.exe$/i.test(process.Name ?? ''));
  const packagePath = /^[A-Z]:\\Program Files\\WindowsApps\\OpenAI\.Codex_[^\\]+\\app\\ChatGPT\.exe$/i;
  const mains = candidates.filter(process => packagePath.test(process.ExecutablePath ?? '')
    && typeof process.CommandLine === 'string' && process.CommandLine.length > 0
    && !/(?:^|\s)--type(?:=|\s|$)/i.test(process.CommandLine));
  if (!mains.length) return candidates.some(process => !process.ExecutablePath || !process.CommandLine) ? null : false;
  const children = processes.filter(process => /^codex\.exe$/i.test(process.Name ?? '')
    && mains.some(main => main.ProcessId === process.ParentProcessId));
  const ready = children.some(process => {
    if (typeof process.CommandLine !== 'string' || !/(?:^|\s)"?app-server"?(?:\s|$)/i.test(process.CommandLine)) return false;
    const listen = process.CommandLine.match(/(?:^|\s)--listen(?:=|\s+)(?:"([^"]+)"|(\S+))/i);
    return !listen || (listen[1] ?? listen[2]) === 'stdio://';
  });
  return ready ? true : children.some(process => !process.CommandLine) ? null : false;
}

export function createDesktopReadinessProbe({ platform = process.platform, env = process.env,
  execFileImpl = execFileAsync, timeoutMs = 3000 } = {}) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3000) throw new BridgeError('Desktop probe timeout is invalid.', 'INVALID_CONFIG');
  const script = String.raw`$ErrorActionPreference='Stop'; $session=[System.Diagnostics.Process]::GetCurrentProcess().SessionId; $processes=@(Get-CimInstance -Query "SELECT ProcessId,ParentProcessId,Name,ExecutablePath,CommandLine,SessionId FROM Win32_Process WHERE Name='ChatGPT.exe' OR Name='codex.exe'" | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,CommandLine,SessionId); [pscustomobject]@{sessionId=$session;processes=$processes} | ConvertTo-Json -Depth 4 -Compress`;
  return async function probe() {
    if (platform !== 'win32') return null;
    try {
      const { stdout } = await execFileImpl(path.win32.join(env.WINDIR || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
        ['-NoProfile', '-NonInteractive', '-Command', script],
        { windowsHide: true, shell: false, timeout: timeoutMs, maxBuffer: 128 * 1024, encoding: 'utf8' });
      return desktopReadyFromProcesses(JSON.parse(stdout.replace(/^\uFEFF/, '').trim()));
    } catch { return null; }
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
  if (config.ignoredResponseIds.includes(row.id)) return 'owner_excluded_response';
  if (config.originHostAllowlist && !config.originHostAllowlist.includes(item.origin_host)) return 'origin_host_not_allowed';
  if (!Number.isFinite(Date.parse(row.created_at))) return 'invalid_response_timestamp';
  if (timestampKey(row.created_at) < timestampKey(config.startAt)) return 'before_watermark';
  if (TERMINAL_ITEMS.has(item.status) || item.deleted_at || item.archived_at) return 'inactive_item';
  if(config.deliveryMode==='manual'&&item.status!=='ruled')return 'item_not_available_for_manual_launch';
  if (['DROP', 'PARK'].includes(text(row.option_key).toUpperCase()) || ['DROP', 'PARK'].includes(text(item.ruling).toUpperCase())) return 'parked_or_dropped';
  if (!sameTimestamp(row.created_at, item.ruled_at)) return 'superseded_or_unverified_ruling';
  if (row.urgent === true) {
    if (!config.includeUrgent) return 'legacy_urgent';
    // v3 creates urgent responses as queued, with no claim metadata. Any
    // delivering/spawned/failed state or previous dispatch evidence belongs to
    // another delivery attempt and must not be adopted by this runner.
    if (row.dispatch_state !== 'queued') return 'owned_or_already_dispatched';
    if (!['dispatch_at', 'dispatch_target', 'dispatch_note'].every(key => Object.hasOwn(row, key) && row[key] === null)) return 'urgent_claim_evidence_present_or_missing';
    return null;
  }
  if (row.dispatch_state !== 'none') return 'owned_or_already_dispatched';
  return null;
}
function untouchedRouteBlock(receipt) {
  return receipt?.state === 'blocked' && ROUTE_BLOCK_REASONS.has(receipt.reason)
    && !['preparingAt', 'submittedAt', 'queueId', 'clientUserMessageId', 'messageSha256', 'observedAt', 'backendDeliveredAt'].some(key => Object.hasOwn(receipt, key));
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
/** Local source evidence only; collecting this packet never launches an AI worker. */
export function collectedResponseFor(row) {
  const item = row.item;
  return {
    id: row.id, created_at: row.created_at, option_key: row.option_key ?? null, body: row.body ?? null, urgent: row.urgent === true,
    item: {
      id: item.id ?? null, ref: item.ref, project: item.project, status: item.status, ruling: item.ruling ?? null,
      ruled_at: item.ruled_at ?? null, origin_session: item.origin_session ?? null, origin_host: item.origin_host ?? null,
      origin_cwd: item.origin_cwd ?? null, title: item.title ?? null, body: item.body ?? null,
      options: Array.isArray(item.options) ? item.options.map(option => ({ key: option.key, label: option.label ?? null })) : [],
    },
  };
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
  constructor({ config, queueClient, queueClientFactory, rpc, now = () => new Date(), heartbeatPublisher, desktopReadyProbe, manualWorker }) {
    this.config = validateConfig(config, config.configPath);
    this.queue = queueClient;
    this.queueClientFactory = queueClientFactory;
    this.rpc = rpc;
    this.now = now;
    this.heartbeatPublisher = this.config.publishHeartbeat ? heartbeatPublisher ?? createHeartbeatPublisher({ dashboardUrl: this.config.dashboardUrl }) : null;
    this.desktopReadyProbe = desktopReadyProbe ?? createDesktopReadinessProbe();
    this.readinessCheckedAt = null;
    this.readiness = null;
    this.receiptsDir = path.join(this.config.stateDir, 'receipts');
    this.healthFile = path.join(this.config.stateDir, 'health.json');
    this.manualWorker = manualWorker;
    this.manualPoll = null;
    this.manualErrorCode = null;
  }
  isoNow() { return new Date(this.now()).toISOString(); }
  async desktopReady() {
    const nowMs = new Date(this.now()).getTime();
    const age = this.readinessCheckedAt === null ? Infinity : nowMs - this.readinessCheckedAt;
    if (age >= 0 && age < READINESS_CACHE_MS) return this.readiness;
    let ready = null;
    try {
      ready = await this.desktopReadyProbe();
      if (ready === true) {
        if (typeof this.queue?.readThread !== 'function') ready = null;
        else {
          const threadId = this.config.allowedThreadIds[0];
          const metadata = await this.queue.readThread({ threadId });
          ready = metadata?.id === threadId && typeof metadata.cwd === 'string'
            && /^(?:[A-Z]:[\\/]|\\\\[^\\/]+[\\/][^\\/]+)/i.test(metadata.cwd);
        }
      }
    } catch { ready = null; }
    this.readiness = ready === true ? true : ready === false ? false : null;
    this.readinessCheckedAt = new Date(this.now()).getTime();
    return this.readiness;
  }
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
  async submit(row, { reconsiderRoute = false } = {}) {
    const existing = await readJson(this.receiptPath(row.id));
    if (existing && !(reconsiderRoute && untouchedRouteBlock(existing))) return existing;
    const route = this.config.deliveryMode==='manual' ? {ok:true} : routeFor(row, this.config);
    if (existing && !route.ok) return existing;
    const routingEvidence = existing ? {
      routeRecoveredAt: this.isoNow(),
      routeBlockedHistory: [...(existing.routeBlockedHistory ?? []), { state: existing.state, reason: existing.reason, recordedAt: existing.updatedAt ?? null }],
    } : {};
    const base = { version: 1, eventId: row.id, ref: row.item.ref, project: row.item.project, eventCreatedAt: row.created_at, itemRuledAt: row.item.ruled_at ?? null, originSession: row.item.origin_session ?? null, originHost: row.item.origin_host ?? null, marker: eventMarker(row.id), ...routingEvidence };
    if (!route.ok) return this.save({ ...base, state: 'blocked', reason: route.reason });
    if (this.config.deliveryMode === 'manual') {
      const collectedResponse = collectedResponseFor(row);
      return this.save({ ...base, deliveryMode: 'manual', state: 'awaiting_launch', collectedAt: this.isoNow(),
        collectedResponse, responseSha256: hash(JSON.stringify(collectedResponse)) });
    }
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
    if (receipt.state === 'ignored') return { ok: true, receipt };
    // These receipts never belonged to an existing chat. A config change or
    // runner restart must not reinterpret them as permission to enqueue.
    if (receipt.state === 'awaiting_launch') return { ok: true, receipt };
    // Switching to manual mode suspends legacy delivery reconciliation as well:
    // collection must not open old chats or mark an uncertain prior submission.
    if (this.config.deliveryMode === 'manual') return { ok: receipt.state === 'delivered', receipt };
    if (this.config.ignoredResponseIds.includes(receipt.eventId) && untouchedRouteBlock(receipt)) {
      return { ok: true, receipt: await this.save({
        ...receipt, state: 'ignored', reason: 'owner_excluded_response', ignoredAt: this.isoNow(),
        ignoredFrom: { state: receipt.state, reason: receipt.reason, recordedAt: receipt.updatedAt ?? null },
      }) };
    }
    if (receipt.state === 'blocked') return { ok: false, receipt };
    if (!this.config.allowedThreadIds.includes(receipt.targetThreadId)) return { ok: false, receipt: await this.save({ ...receipt, state: 'blocked', reason: 'receipt_target_outside_allowlist' }) };
    if (typeof receipt.messageSha256 !== 'string' || !/^[a-f\d]{64}$/.test(receipt.messageSha256)) return { ok: false, receipt: await this.save({ ...receipt, state: 'blocked', reason: 'receipt_payload_hash_missing' }) };
    if (receipt.state === 'delivered' && receipt.backendDeliveredAt && receipt.observedAt) return { ok: true, receipt };
    // Exact persisted-history evidence is durable. A failed dashboard mark must
    // keep retrying independently of transport availability or history windows.
    if (receipt.observedAt) return this.markObservedDelivery(receipt);
    const [pendingResult, historyResult] = await Promise.allSettled([
      this.queue.list({ threadId: receipt.targetThreadId }), this.queue.readHistory({ threadId: receipt.targetThreadId, limit: 100 }),
    ]);
    const history = historyResult.status === 'fulfilled' ? historyUsers(historyResult.value) : [];
    const observed = history.find(message => message.text.includes(receipt.marker) && hash(message.text) === receipt.messageSha256);
    if (observed) {
      const updated = await this.save({ ...receipt, state: receipt.backendDeliveredAt ? 'delivered' : 'started', observedAt: this.isoNow(), observedUserMessageId: observed.id ?? null, observedTurnId: observed.turnId ?? null });
      return this.markObservedDelivery(updated);
    }
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
  async markObservedDelivery(receipt) {
    if (receipt.backendDeliveredAt) {
      return { ok: true, receipt: receipt.state === 'delivered' ? receipt : await this.save({ ...receipt, state: 'delivered' }) };
    }
    try {
      await this.rpc('owner_loop_outbox_mark', { p_id: receipt.eventId, p_patch: { dispatch_state: 'delivered', dispatch_target: `codex session ${receipt.targetThreadId}`, dispatch_note: 'Local bridge observed this response in persisted user-message history; agent acknowledgment and outcome are separate.' } });
      return { ok: true, receipt: await this.save({ ...receipt, state: 'delivered', backendDeliveredAt: this.isoNow(), lastErrorCode: null }) };
    } catch (error) {
      return { ok: false, receipt: await this.save({ ...receipt, state: 'started', lastErrorCode: errorCode(error) }) };
    }
  }
  async tick() {
    if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'tick', pid: process.pid, at: this.isoNow() }));
    if (this.config.deliveryMode === 'manual' || !this.queueClientFactory) return this.tickWithQueue();
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
      const existing = await readJson(this.receiptPath(row.id));
      if (existing && !untouchedRouteBlock(existing)) continue;
      const itemKey = row.item.id ?? row.item.ref;
      if (tiedItems.has(itemKey) || newestByItem.get(itemKey)?.id !== row.id) { const reason = tiedItems.has(itemKey) ? 'ambiguous_response_order' : 'superseded_response'; skipped[reason] = (skipped[reason] ?? 0) + 1; continue; }
      const reason = skipReason(row, this.config);
      if (reason) { skipped[reason] = (skipped[reason] ?? 0) + 1; continue; }
      if (existing && this.config.deliveryMode!=='manual' && !routeFor(row, this.config).ok) continue;
      // Only a fresh complete outbox read, latest current ruling and newly
      // explicit route can recover a block that never attempted submission.
      await this.submit(row, { reconsiderRoute: Boolean(existing) });
    }
    for (const receipt of await this.receipts()) {
      if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'reconcile', pid: process.pid, at: this.isoNow() }));
      if (!STATES.has(receipt.state)) throw new BridgeError('A local receipt has an unsupported state.', 'RECEIPT_INVALID');
      const result = await this.reconcile(receipt);
      reconciliationOk &&= result.ok;
    }
    const receipts = await this.receipts();
    const counts = Object.fromEntries([...STATES].map(state => [state, receipts.filter(receipt => receipt.state === state).length]));
    if(this.config.deliveryMode==='manual')counts.awaiting_launch=sourceError?0:receipts.filter(receipt=>{
      if(receipt.state!=='awaiting_launch')return false;
      const row=rows.find(row=>row.id===receipt.eventId);if(!row)return false;
      const itemKey=row.item.id??row.item.ref;
      return !tiedItems.has(itemKey)&&newestByItem.get(itemKey)?.id===row.id&&!skipReason(row,this.config);
    }).length;
    const prior = await readJson(this.healthFile, {});
    const health = { version: 1, ok: !sourceError && reconciliationOk, pid: process.pid, mode: this.config.mode, deliveryMode: this.config.deliveryMode, canaryThreadId: this.config.canaryThreadId, allowedThreadIds: this.config.allowedThreadIds, startAt: this.config.startAt, intervalSeconds: this.config.intervalSeconds, checkedAt: this.isoNow(), lastSuccessfulReadAt: !sourceError ? this.isoNow() : prior.lastSuccessfulReadAt ?? null, source: sourceError ? { available: false, errorCode: sourceError } : { available: true, responseCount: rows.length }, counts, skipped };
    if(this.config.deliveryMode==='manual')health.manualLaunches={enabled:this.config.manualLaunches?.enabled===true,running:this.manualPoll!==null,errorCode:this.manualErrorCode};
    if (this.config.publishHeartbeat) {
      health.deliveryOk = health.ok;
      health.desktopReady = this.config.deliveryMode === 'manual' ? null : await this.desktopReady();
      health.heartbeatPublishedAt = prior.heartbeatPublishedAt ?? null;
      try {
        await this.heartbeatPublisher({ health, receipts, desktopReady: health.desktopReady });
        health.heartbeatPublishedAt = this.isoNow();
        health.heartbeatErrorCode = null;
      } catch (error) {
        health.heartbeatErrorCode = ['HEARTBEAT_CREDENTIALS_UNAVAILABLE', 'HEARTBEAT_UNAVAILABLE', 'HEARTBEAT_HTTP_ERROR', 'HEARTBEAT_INVALID_RESPONSE', 'HEARTBEAT_INVALID_SNAPSHOT'].includes(error?.code)
          ? error.code : 'HEARTBEAT_PUBLISH_FAILED';
        health.ok = false;
      }
    }
    await atomicJson(this.healthFile, health);
    if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'healthy_tick_saved', pid: process.pid, at: this.isoNow() }));
    return health;
  }
  async runOnce() { const release = await acquireProcessLock(this.config.stateDir); try { return await this.tick(); } finally { await release(); } }
  pollManual(signal){
    if(this.config.deliveryMode!=='manual'||this.config.manualLaunches?.enabled!==true||!this.manualWorker||this.manualPoll||signal?.aborted)return;
    this.manualPoll=Promise.resolve().then(()=>this.manualWorker.pollOnce({signal})).then(()=>{this.manualErrorCode=null;},error=>{this.manualErrorCode=errorCode(error);}).finally(()=>{this.manualPoll=null;});
  }
  async runForever({ signal } = {}) {
    if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'acquiring_lock', pid: process.pid, at: this.isoNow() }));
    const release = await acquireProcessLock(this.config.stateDir);
    if (this.config.diagnostics) console.error(JSON.stringify({ bridgeStage: 'lock_acquired', pid: process.pid, at: this.isoNow() }));
    try {
      while (!signal?.aborted) {
        try { await this.tick(); }
        catch (error) { await atomicJson(this.healthFile, { version: 1, ok: false, pid: process.pid, checkedAt: this.isoNow(), source: { available: false, errorCode: errorCode(error) }, errorCode: errorCode(error) }); }
        this.pollManual(signal);
        try { await delay(this.config.intervalSeconds * 1000, undefined, { signal }); }
        catch (error) { if (error.name !== 'AbortError') throw error; }
      }
    } finally { await this.manualPoll; await release(); }
  }
  async status() {
    const health = await readJson(this.healthFile, { ok: false, source: { available: false, errorCode: 'NOT_STARTED' } });
    let processAlive = false;
    if (health.pid) { try { process.kill(health.pid, 0); processAlive = true; } catch {} }
    const ageSeconds = health.checkedAt ? Math.max(0, (new Date(this.now()).getTime() - Date.parse(health.checkedAt)) / 1000) : null;
    return { ...health, processAlive, stale: ageSeconds === null || ageSeconds > this.config.intervalSeconds * 3, receipts: (await this.receipts()).map(({ eventId, ref, project, targetThreadId, deliveryMode, state, reason, originHost, collectedAt, responseSha256, observedAt, backendDeliveredAt, lastErrorCode, ignoredAt, ignoredFrom }) => ({ eventId, ref, project, targetThreadId, deliveryMode, state, reason, originHost, collectedAt, responseSha256, observedAt, backendDeliveredAt, lastErrorCode, ignoredAt, ignoredFrom })) };
  }
  async transition({ action, ref, session, responseId, note, env = process.env }) {
    if (!['pickup', 'done'].includes(action) || !REF.test(ref)) throw new BridgeError('Invalid response acknowledgment.', 'INVALID_CALLBACK');
    requireUuid(session, 'Session');
    if (env.CODEX_THREAD_ID && env.CODEX_THREAD_ID !== session) throw new BridgeError('This callback belongs to a different Codex session.', 'CALLBACK_SESSION_MISMATCH');
    let matches = (await this.receipts()).filter(receipt => receipt.ref === ref && receipt.targetThreadId === session && !['blocked', 'ignored'].includes(receipt.state));
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
  const queue = config.deliveryMode === 'manual' ? null : makeQueue();
  const rpc=createOwnerLoopRpc({ baseUrl: config.supabaseUrl, dashboardUrl: config.dashboardUrl, transport: config.rpcTransport });
  let manualWorker;
  if(config.deliveryMode==='manual'&&config.manualLaunches?.enabled===true){
    const {ManualBatchWorker,createManualLaunchApi}=await import('./manual-batch-worker.mjs');
    manualWorker=new ManualBatchWorker({config,rpc,launchApi:createManualLaunchApi({dashboardUrl:config.dashboardUrl})});
  }
  const bridge = new DashboardCodexBridge({ config, queueClient: queue, queueClientFactory: options.command === 'run' ? makeQueue : undefined, rpc,manualWorker });
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
  } finally { await queue?.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(JSON.stringify({ ok: false, errorCode: errorCode(error), message: error instanceof BridgeError ? error.message : 'Bridge operation failed; inspect the local status receipt.' })); process.exitCode = 1; });
}
