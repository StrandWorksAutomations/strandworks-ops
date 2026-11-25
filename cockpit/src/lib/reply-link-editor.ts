import { DRAFT_MAX, type KcJobLink } from "./kc-replies";

const DISCLOSURE = "I run Kinetic Clinician.";
const KC_HOST = /^(?:www\.)?kineticclinician\.com$/i;
const URL_TOKENS = /(?:https?:\/\/[^\s<>"“”]+|\b(?:www\.)?kineticclinician\.com\/[^\s<>"“”]*)/gi;

export function httpsUrl(raw?: string): URL | null {
  try {
    const url = new URL(raw ?? "");
    return url.protocol === "https:" && !url.username && !url.password ? url : null;
  } catch { return null; }
}

export function sourceIdForLink(raw: string): string | null {
  const url = httpsUrl(raw);
  if (!url || !KC_HOST.test(url.host) || !url.pathname.startsWith("/j/")) return null;
  const parts = url.pathname.slice(3).replace(/\/$/, "").split("/");
  if (parts.length < 3 || parts.length > 8 || parts.some(p => !p)) return null;
  try {
    const id = parts.map(decodeURIComponent).join(":");
    return id.length <= 600 && !/[\x00-\x1f\x7f]/.test(id) ? id : null;
  } catch { return null; }
}

export function outgoingLink(link: KcJobLink): string {
  const short = httpsUrl(link.share_url);
  const original = httpsUrl(link.url);
  return short && original && KC_HOST.test(original.host) && short.hostname === "kineticclinician.com" && !short.port &&
    /^\/r\/[0-9a-f]{10,64}$/.test(short.pathname) && !short.search && !short.hash && short.href.length < link.url.length
    ? short.href : link.url;
}

function urlKey(raw: string, ignoreTracking: boolean): string | null {
  const url = httpsUrl(raw.replace(/^(?:www\.)?kineticclinician\.com(?=\/)/i, "https://kineticclinician.com"));
  if (!url) return null;
  if (KC_HOST.test(url.host)) {
    url.hostname = "kineticclinician.com";
    url.pathname = url.pathname.replace(/\/$/, "");
    if (ignoreTracking) {
      for (const key of [...url.searchParams.keys()]) if (/^utm_/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
  }
  return url.href;
}

function tokens(text: string) {
  return Array.from(text.matchAll(URL_TOKENS), m => {
    let value = m[0].replace(/[.,;:!?…’']+$/g, "");
    // Leave sentence punctuation around a URL in place, including balanced URL path parentheses.
    while (value.endsWith(")") && value.split(")").length > value.split("(").length) value = value.slice(0, -1);
    while (value.endsWith("]") && value.split("]").length > value.split("[").length) value = value.slice(0, -1);
    return { value, start: m.index!, end: m.index! + value.length };
  });
}

function matches(text: string, link: KcJobLink, ignoreTracking = true) {
  const id = sourceIdForLink(link.url);
  const original = id && link.job?.source_id === id && link.original_url === link.job.source_url ? link.original_url : undefined;
  const aliases = [link.url, outgoingLink(link), original].filter((s): s is string => !!s).map(s => urlKey(s, ignoreTracking));
  return tokens(text).filter(t => {
    const key = urlKey(t.value, ignoreTracking);
    return key !== null && aliases.includes(key);
  });
}

export function containsReplyLink(text: string, link: KcJobLink): boolean {
  return matches(text, link).length > 0;
}

export function containsWebLink(text: string): boolean {
  return tokens(text).length > 0 || /\b(?:www\.|[\w-]+\.(?:com|org|net|io|co|app)\b)/i.test(text);
}

export function approvalLinkIssue(text: string, policy: "allowed" | "prohibited" | "unknown"): string | null {
  if (!containsWebLink(text)) return null;
  if (policy !== "allowed") return (policy === "prohibited" ? "This group prohibits links." : "This group’s link rule is unconfirmed.") + " You can save this draft. Remove its links to approve and copy it.";
  return /\bI run Kinetic Clinician\b/i.test(text) ? null : "Include “I run Kinetic Clinician” to approve a group reply with links.";
}

export function shortenReplyLink(text: string, link: KcJobLink): string {
  const short = outgoingLink(link);
  if (short === link.url) return text;
  for (const t of matches(text, link, false).reverse()) {
    if (t.value.length > short.length) text = text.slice(0, t.start) + short + text.slice(t.end);
  }
  return text;
}

function removeSpan(text: string, start: number, end: number): string {
  if ((text[start - 1] === "(" && text[end] === ")") || (text[start - 1] === "[" && text[end] === "]")) {
    start--;
    end++;
  }
  const left = text.slice(0, start), right = text.slice(end);
  if ((start === 0 || left.endsWith("\n")) && (right === "" || right.startsWith("\n"))) {
    return start === 0 ? right.replace(/^\n/, "") : left.slice(0, -1) + right;
  }
  if (left.endsWith(" ") && /^[.,;:!?]/.test(right)) return left.slice(0, -1) + right;
  return left + (left.endsWith(" ") && right.startsWith(" ") ? right.slice(1) : right);
}

/** All changes are made against the current textarea value. Only a disclosure this editor added can be removed. */
export function toggleReplyLink(draft: string, link: KcJobLink, group: boolean, autoDisclosure: boolean) {
  const found = matches(draft, link);
  if (found.length) {
    let text = draft;
    for (const t of found.reverse()) text = removeSpan(text, t.start, t.end);
    if (autoDisclosure && !containsWebLink(text)) {
      const exact = [...text.matchAll(/^I run Kinetic Clinician\.$/gm)];
      if (exact.length === 1) text = removeSpan(text, exact[0].index!, exact[0].index! + DISCLOSURE.length);
      autoDisclosure = false;
    }
    return { draft: text, autoDisclosure, error: "" };
  }
  const disclose = group && !/\bI run Kinetic Clinician\b/i.test(draft);
  const added = [disclose && DISCLOSURE, outgoingLink(link)].filter(Boolean).join("\n");
  const text = draft ? draft + "\n" + added : added;
  if (text.length > DRAFT_MAX) return { draft, autoDisclosure, error: `Adding this link would exceed ${DRAFT_MAX} characters.` };
  return { draft: text, autoDisclosure: autoDisclosure || disclose, error: "" };
}
