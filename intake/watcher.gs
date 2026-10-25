// Strandworks inbox watcher — Google Apps Script, one copy per Gmail account.
// Every 15 minutes: sends new inbox mail (Primary/Updates only, never Promotions,
// Social or Forums) to the owner intake in Supabase, then carries out what the
// dashboard asked for this mailbox: sends replies Jonathan approved and archives
// handled mail with a label. It never deletes mail and never sends anything that
// was not approved on the dashboard.
//
// Install: see intake/README.md. Run setup() once: it makes this mailbox's own
// access token (kept in Script Properties, never shown) and logs only its SHA-256
// fingerprint, which is registered on the dashboard side. Then run test().

const SUPABASE = 'https://bniuiwbwumpymxiesyyt.supabase.co/rest/v1/rpc/';
// Publishable key: public by design (it also ships in kineticclinician.com's pages);
// every call is authorised by the mailbox token, not by this key.
const APIKEY = 'sb_publishable_6ddcYmFiLrHFewt-a1A5NQ_FwMsN43X';
const SEARCH = 'in:inbox newer_than:2d -label:SW-seen -category:promotions -category:social -category:forums -from:me';
const MAX_THREADS = 40;
const BODY_LIMIT = 12000;
const LABELS = { seen: 'SW-seen', handled: 'SW-handled', jobs: 'KC/Jobs scanned' };

function prop_(name) {
  const v = PropertiesService.getScriptProperties().getProperty(name);
  if (!v) throw new Error('Missing script property ' + name);
  return v;
}

function account_() {
  return Session.getEffectiveUser().getEmail().toLowerCase();
}

function rpc_(fn, args) {
  const res = UrlFetchApp.fetch(SUPABASE + fn, {
    method: 'post',
    contentType: 'application/json',
    headers: { apikey: APIKEY },
    payload: JSON.stringify(Object.assign({ p_token: prop_('SW_TOKEN') }, args)),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code >= 300) throw new Error(fn + ' ' + code + ': ' + res.getContentText().slice(0, 300));
  const text = res.getContentText();
  return text ? JSON.parse(text) : null;
}

function label_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function category_(msg) {
  try {
    const ids = Gmail.Users.Messages.get('me', msg.getId(), { format: 'minimal' }).labelIds || [];
    const c = ids.find((l) => l.indexOf('CATEGORY_') === 0);
    return c ? c.replace('CATEGORY_', '').toLowerCase() : null;
  } catch (e) {
    return null; // Advanced Gmail service not enabled: the search already excludes the noisy tabs.
  }
}

function parseFrom_(from) {
  const m = /^(.*?)\s*<([^>]+)>$/.exec(from || '');
  return m ? { name: m[1].replace(/^"|"$/g, ''), addr: m[2] } : { name: '', addr: from || '' };
}

function collect_() {
  const account = account_();
  const seen = label_(LABELS.seen);
  const threads = GmailApp.search(SEARCH, 0, MAX_THREADS);
  const items = [];
  threads.forEach((thread) => {
    thread.getMessages().forEach((msg) => {
      if (!msg.isInInbox() || msg.getDate() < new Date(Date.now() - 3 * 86400000)) return;
      const from = parseFrom_(msg.getFrom());
      if (from.addr.toLowerCase() === account) return;
      items.push({
        account,
        message_id: msg.getId(),
        thread_id: thread.getId(),
        received_at: msg.getDate().toISOString(),
        from_addr: from.addr,
        from_name: from.name,
        to_addr: msg.getTo(),
        subject: msg.getSubject(),
        snippet: msg.getPlainBody().slice(0, 300),
        body_text: msg.getPlainBody().slice(0, BODY_LIMIT),
        gmail_category: category_(msg),
      });
    });
  });
  for (let i = 0; i < items.length; i += 20) rpc_('intake_add', { p_items: items.slice(i, i + 20) });
  threads.forEach((t) => t.addLabel(seen)); // only after a successful upload
  return items.length;
}

function outbox_() {
  const work = rpc_('intake_outbox', { p_account: account_() });
  (work.send || []).forEach((job) => {
    try {
      GmailApp.getMessageById(job.message_id).reply(job.body);
      rpc_('intake_report', { p_id: job.id, p_event: 'sent' });
    } catch (e) {
      rpc_('intake_report', { p_id: job.id, p_event: 'send_failed', p_error: String(e) });
    }
  });
  const handled = label_(LABELS.handled);
  const jobs = label_(LABELS.jobs);
  (work.archive || []).forEach((job) => {
    try {
      const msg = GmailApp.getMessageById(job.message_id);
      const thread = msg.getThread();
      thread.addLabel(job.job_alert ? jobs : handled);
      thread.moveToArchive();
      rpc_('intake_report', { p_id: job.id, p_event: 'archived' });
    } catch (e) {
      // Message deleted or moved by hand: nothing to archive.
      rpc_('intake_report', { p_id: job.id, p_event: 'archived' });
    }
  });
}

/** Trigger entry point. */
function run() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    collect_();
    outbox_();
  } finally {
    lock.releaseLock();
  }
}

function sha256Hex_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map((b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

/** Run once: creates this mailbox's token, the labels and the 15-minute trigger. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty('SW_TOKEN');
  if (!token) {
    token = 'wt_' + Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('SW_TOKEN', token);
  }
  Object.values(LABELS).forEach(label_);
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'run').forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('run').timeBased().everyMinutes(15).create();
  Logger.log('Mailbox: ' + account_());
  Logger.log('Token fingerprint (register this): ' + sha256Hex_(token));
}

/** After the fingerprint is registered: one run now, logging what happened. */
function test() {
  Logger.log('Uploaded ' + collect_() + ' message(s) from ' + account_());
  outbox_();
  Logger.log('Outbox checked.');
}
