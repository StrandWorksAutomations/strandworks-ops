#!/usr/bin/env python3
"""Validate, view and read-only check the website register. Python standard library only."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from html import escape
import json
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

ROOT = Path(__file__).resolve().parent
DEFAULT_REGISTER = ROOT / "websites.json"
SCHEMA = ROOT / "websites.schema.json"
TOKEN = ":path*"


def schema_errors(value, schema, root=None, path="$"):
    """The small, explicit JSON Schema subset used by websites.schema.json."""
    root = schema if root is None else root
    if "$ref" in schema:
        target = root
        for part in schema["$ref"].removeprefix("#/").split("/"):
            target = target[part]
        return schema_errors(value, target, root, path)
    errors = []
    types = {"object": dict, "array": list, "string": str, "integer": int,
             "boolean": bool, "null": type(None)}
    allowed = schema.get("type")
    if allowed:
        allowed = [allowed] if isinstance(allowed, str) else allowed
        if not any(isinstance(value, types[t]) and not (t == "integer" and isinstance(value, bool)) for t in allowed):
            return [f"{path}: expected {' or '.join(allowed)}"]
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: value is outside allowed enum")
    if isinstance(value, dict):
        for key in schema.get("required", []):
            if key not in value:
                errors.append(f"{path}: missing {key}")
        properties = schema.get("properties", {})
        for key, child in value.items():
            if key in properties:
                errors += schema_errors(child, properties[key], root, f"{path}.{key}")
            elif schema.get("additionalProperties") is False:
                errors.append(f"{path}: unknown field {key}")
    elif isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            errors.append(f"{path}: too few items")
        if schema.get("uniqueItems") and len({json.dumps(x, sort_keys=True) for x in value}) != len(value):
            errors.append(f"{path}: duplicate items")
        for i, child in enumerate(value):
            errors += schema_errors(child, schema.get("items", {}), root, f"{path}[{i}]")
    elif isinstance(value, str):
        if len(value) < schema.get("minLength", 0):
            errors.append(f"{path}: empty value")
        if "pattern" in schema and not re.search(schema["pattern"], value):
            errors.append(f"{path}: invalid format")
    return errors


def valid_url(url, *, template=False):
    try:
        p = urlsplit(url)
        return (p.scheme == "https" and bool(p.hostname) and not p.username and not p.password
                and p.port is None and (template or TOKEN not in url)
                and not re.search(r"[\s\\]", url))
    except (ValueError, TypeError):
        return False


def domain_owners(data):
    owners = {}
    for site in data["sites"]:
        hosts = list(site["aliases"])
        if site["canonical_url"]:
            hosts.append(urlsplit(site["canonical_url"]).hostname)
        for host in hosts:
            owners.setdefault(host, []).append(site["id"])
    return owners


def path_match(pattern, path):
    if pattern.endswith("/" + TOKEN):
        prefix = pattern[:-len(TOKEN)]
        if path == prefix.rstrip("/"):
            return ""
        return path[len(prefix):] if path.startswith(prefix) else None
    # Corporate anchor routes also cover /about/ and /contact/.
    return "" if pattern.rstrip("/") == path.rstrip("/") else None


def resolve_redirect(data, url):
    """Specific exact paths win; then longest wildcard prefix. Unknown hosts do nothing."""
    parsed = urlsplit(url)
    candidates = []
    for rule in data["redirect_rules"]:
        if parsed.hostname not in rule["source_hosts"]:
            continue
        capture = path_match(rule["source_path"], parsed.path or "/")
        if capture is not None:
            exact = TOKEN not in rule["source_path"]
            candidates.append((exact, len(rule["source_path"]), rule, capture))
    if not candidates:
        return None
    _, _, rule, capture = max(candidates, key=lambda x: x[:2])
    target = urlsplit(rule["target_url"].replace(TOKEN, capture))
    query = parsed.query if rule["preserve_query"] else target.query
    return rule, urlunsplit((target.scheme, target.netloc, target.path or "/", query, target.fragment))


def redirect_errors(data):
    errors, seeds, signatures = [], set(), set()
    owners = domain_owners(data)
    private_sites = {s["id"] for s in data["sites"] if s["visibility"] != "public"}
    for rule in data["redirect_rules"]:
        source = rule["source_path"]
        if not source.startswith("/") or "?" in source or "#" in source or (":" in source and not source.endswith("/" + TOKEN)):
            errors.append(f"{rule['id']}: invalid source path pattern")
        if not valid_url(rule["target_url"], template=True):
            errors.append(f"{rule['id']}: invalid target URL")
        target = urlsplit(rule["target_url"])
        if target.hostname not in owners:
            errors.append(f"{rule['id']}: unknown internal target {target.hostname}")
        elif any(site_id in private_sites for site_id in owners[target.hostname]):
            errors.append(f"{rule['id']}: redirect to private/conditional site")
        if TOKEN in rule["target_url"] and TOKEN not in source:
            errors.append(f"{rule['id']}: target wildcard has no source capture")
        if TOKEN in rule["target_url"] and not target.path.endswith("/" + TOKEN):
            errors.append(f"{rule['id']}: wildcard must be a trailing path capture")
        for host in rule["source_hosts"]:
            signature = (host, source.rstrip("/") if TOKEN not in source else source)
            if signature in signatures:
                errors.append(f"{rule['id']}: duplicate redirect source {host}{source}")
            signatures.add(signature)
            if host not in owners:
                errors.append(f"{rule['id']}: unregistered source host {host}")
            paths = [source] if TOKEN not in source else [source.replace(TOKEN, ""), source.replace(TOKEN, "__registry_probe__")]
            seeds.update(f"https://{host}{path}" for path in paths)
    # Include every declared critical path on each host to catch policy routing loops.
    for site in data["sites"]:
        hosts = site["aliases"] + ([urlsplit(site["canonical_url"]).hostname] if site["canonical_url"] else [])
        seeds.update(f"https://{host}{path}" for host in hosts for path in site["critical_paths"])
    for start in sorted(seeds):
        current, seen = start, set()
        for _ in range(2 * len(data["redirect_rules"]) + 2):
            p = urlsplit(current)
            key = (p.hostname, p.path or "/", p.query)
            if key in seen:
                errors.append(f"redirect cycle from {start}")
                break
            seen.add(key)
            resolved = resolve_redirect(data, current)
            if resolved is None:
                break
            _, current = resolved
        else:
            errors.append(f"nonterminating redirect chain from {start}")
    return sorted(set(errors))


def validate(data):
    errors = schema_errors(data, json.loads(SCHEMA.read_text()), path="$")
    if errors:
        return errors
    sites = {site["id"]: site for site in data["sites"]}
    if len(sites) != len(data["sites"]):
        errors.append("duplicate site ID")
    for group in ("redirect_rules", "links"):
        if len({x["id"] for x in data[group]}) != len(data[group]):
            errors.append(f"duplicate ID in {group}")
    for host, ids in domain_owners(data).items():
        if not re.fullmatch(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}", host or "") or ".." in host:
            errors.append(f"invalid domain {host}")
        if len(ids) != 1:
            errors.append(f"duplicate domain owner for {host}: {', '.join(ids)}")
    for site in sites.values():
        url = site["canonical_url"]
        if site["visibility"] == "public" and not url:
            errors.append(f"{site['id']}: public site needs canonical URL")
        if url and (not valid_url(url) or urlsplit(url).path not in ("", "/") or urlsplit(url).query or urlsplit(url).fragment):
            errors.append(f"{site['id']}: canonical URL must be an HTTPS origin")
        if site["observed"]["canonical_url"] and not valid_url(site["observed"]["canonical_url"]):
            errors.append(f"{site['id']}: invalid observed URL")
        for path in site["critical_paths"] + site["policy_paths"]:
            if not path.startswith("/") or path.startswith("//") or re.search(r"[?#\s\\]", path):
                errors.append(f"{site['id']}: invalid critical/policy path {path}")
        for path in site["policy_paths"]:
            if path not in site["critical_paths"]:
                errors.append(f"{site['id']}: missing critical policy path {path}")
        check = site["last_verification"]
        if check["at"]:
            try:
                datetime.fromisoformat(check["at"].replace("Z", "+00:00"))
            except ValueError:
                errors.append(f"{site['id']}: invalid last verification timestamp")
        if site["observed"]["status"] == "live_verified" and (check["method"] not in {"http_check", "browser_check"} or not check["at"]):
            errors.append(f"{site['id']}: live_verified requires dated HTTP or browser evidence")
    for link in data["links"]:
        source, target = sites.get(link["source_site"]), sites.get(link["target_site"])
        if not source or not target:
            errors.append(f"{link['id']}: unknown internal link target/source")
            continue
        if source["visibility"] == "public" and target["visibility"] != "public":
            errors.append(f"{link['id']}: public link to private/conditional site")
        if link["target_path"] not in target["critical_paths"]:
            errors.append(f"{link['id']}: target path is not registered as critical")
    errors += redirect_errors(data)
    try:
        routing_export(data)
    except ValueError as exc:
        errors.append(str(exc))
    return errors


def routing_export(data):
    sites = {s["id"]: s for s in data["sites"]}
    profile = data["routing_export"]
    digital, corporate = sites.get(profile["digital_site"]), sites.get(profile["corporate_site"])
    if not digital or not corporate:
        raise ValueError("routing export references unknown site")
    fallback = next((r for r in data["redirect_rules"] if r["id"] == profile["legacy_default_rule"]), None)
    if not fallback or fallback["source_path"] != "/:path*" or fallback["target_url"] != digital["canonical_url"].rstrip("/") + "/:path*":
        raise ValueError("legacy default must preserve all remaining paths to digital canonical origin")
    hosts = fallback["source_hosts"]
    for rule in data["redirect_rules"]:
        if set(rule["source_hosts"]) == set(hosts) or set(rule["source_hosts"]) & set(digital["aliases"]):
            if rule["status_code"] != 308 or not rule["preserve_query"]:
                raise ValueError("exported digital routing requires 308 and preserved queries")
    exact = {r["source_path"]: r["target_url"] for r in data["redirect_rules"]
             if set(r["source_hosts"]) == set(hosts) and TOKEN not in r["source_path"]}
    origin = corporate["canonical_url"].rstrip("/")
    for path, expected in {"/": origin + "/", "/about": origin + "/#about", "/contact": origin + "/#contact"}.items():
        if exact.get(path) != expected:
            raise ValueError(f"legacy exact route {path} must resolve to {expected}")
    return {"canonicalHost": urlsplit(digital["canonical_url"]).hostname,
            "canonicalAliases": digital["aliases"], "legacyHosts": hosts,
            "corporateOrigin": origin, "legacyExactRoutes": exact,
            "legacyDefaultOrigin": digital["canonical_url"].rstrip("/"),
            "generated_from": "strandworks-ops/registers/websites.json",
            "registry_version": data["registry_version"]}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def fetch_url(url, timeout):
    """One GET, no redirect following, no cookies/auth, no response body retained."""
    request = Request(url, headers={"User-Agent": "Strandworks-Website-Registry/1.0"})
    try:
        with build_opener(NoRedirect()).open(request, timeout=timeout) as response:
            return {"status": response.status, "location": response.headers.get("Location"), "error": None}
    except HTTPError as exc:
        result = {"status": exc.code, "location": exc.headers.get("Location"), "error": None}
        exc.close()
        return result
    except (URLError, OSError, ValueError) as exc:
        return {"status": None, "location": None, "error": str(exc)}


def live_check(data, max_requests=20, timeout=5, fetch=fetch_url):
    if not 1 <= max_requests <= 40 or not .2 <= timeout <= 10:
        raise ValueError("live limits: 1–40 requests; timeout 0.2–10 seconds")
    probes = {}
    private_hosts = {host for host, ids in domain_owners(data).items()
                     if any(s["id"] in ids and s["visibility"] != "public" for s in data["sites"])}
    def add(url):
        if urlsplit(url).hostname not in private_hosts:
            expected = resolve_redirect(data, url)
            probes[url] = {"status": expected[0]["status_code"], "location": expected[1]} if expected else {"status": 200, "location": None}
    # Route migrations first, then every site's critical paths. Coverage stays explicit.
    skipped_rules = []
    for rule in data["redirect_rules"]:
        if rule["desired_status"] == "paused":
            skipped_rules.append({"id": rule["id"], "reason": rule["note"]})
            continue
        path = rule["source_path"].replace(TOKEN, "")
        for host in rule["source_hosts"]:
            add(f"https://{host}{path}")
    for site in data["sites"]:
        if site["visibility"] == "public" and site["canonical_url"]:
            for path in site["critical_paths"]:
                add(site["canonical_url"].rstrip("/") + path)
    results = []
    for url, expected in list(probes.items())[:max_requests]:
        observed = fetch(url, timeout)
        location = observed.get("location")
        if location and location.startswith("/"):
            p = urlsplit(url)
            location = f"{p.scheme}://{p.netloc}{location}"
        okay = observed.get("status") == expected["status"] and location == expected["location"] and not observed.get("error")
        results.append({"url": url, "expected": expected, "observed": observed, "drift": not okay})
    return {"checked_at": datetime.now(timezone.utc).isoformat(), "registry_version": data["registry_version"],
            "read_only": True, "coverage": "complete" if len(probes) <= max_requests else "partial",
            "planned_checks": len(probes), "checked": len(results),
            "pending_urls": list(probes)[max_requests:], "drift_count": sum(r["drift"] for r in results),
            "skipped_rules": skipped_rules, "results": results}


def render_html(data):
    sites = {s["id"]: s for s in data["sites"]}
    cards = []
    for site in sites.values():
        rows = [("Legal operator", site["legal_operator"] or "Unverified legal entity"), ("Brand", site["brand"]),
                ("Source", site["source_repo"] or "Unknown"),
                ("Hosting", f"{site['hosting']['provider'] or 'Unknown'} · {site['hosting']['project'] or 'Unknown'}"),
                ("Desired", f"{site['desired_status']} · {site['canonical_url'] or 'No public canonical URL'}"),
                ("Observed", f"{site['observed']['status']} · {site['observed']['canonical_url'] or 'Not live verified'}"),
                ("Last verification", site["last_verification"]["at"] or "Not live verified")]
        detail = "".join(f"<dt>{escape(label)}</dt><dd>{escape(value)}</dd>" for label, value in rows)
        cards.append(f"<article data-site='{escape(site['id'])}'><h2>{escape(site['name'])}</h2><p class='pill'>{escape(site['visibility'])}</p><dl>{detail}</dl><p class='note'>{escape(site['notes'])}</p><details><summary>Aliases and critical paths</summary><p>{escape(', '.join(site['aliases']) or 'No aliases')}</p><code>{escape(', '.join(site['critical_paths']) or 'Private; no public probes')}</code></details></article>")
    links = "".join(f"<tr><td>{escape(sites[e['source_site']]['name'])}</td><td>→ {escape(sites[e['target_site']]['name'] + e['target_path'])}</td><td>{escape(e['desired_status'])}</td><td>{escape(e['observed_status'])}</td></tr>" for e in data["links"])
    routes = "".join(f"<tr><td>{escape(', '.join(r['source_hosts']))}<br><code>{escape(r['source_path'])}</code></td><td>→ <code>{escape(r['target_url'])}</code></td><td>{r['status_code']}<br>{escape(r['desired_status'])} / {escape(r['observed_status'])}</td></tr>" for r in sorted(data["redirect_rules"], key=lambda r: (TOKEN in r["source_path"], -len(r["source_path"]))))
    return f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'"><title>Strandworks website register</title><style>
    :root{{color-scheme:light;--ink:#192b32;--muted:#50646c;--line:#cbd8d8;--paper:#f4f7f4;--accent:#136d64}}*{{box-sizing:border-box}}body{{margin:0;color:var(--ink);background:var(--paper);font:16px/1.5 system-ui,sans-serif}}main{{max-width:1240px;margin:auto;padding:40px 24px}}header{{border-top:8px solid var(--accent);padding:24px 0}}h1{{font:600 clamp(2rem,4vw,3.4rem)/1.1 Georgia,serif;margin:8px 0}}header p{{max-width:76ch;color:var(--muted)}}.meta{{font:12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.06em}}input{{font:inherit;padding:12px;border:1px solid var(--line);border-radius:6px;width:min(100%,460px)}}.cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:18px;margin:24px 0 48px}}article{{background:white;border:1px solid var(--line);padding:22px;border-radius:8px}}h2{{margin:0;font-size:1.3rem}}.pill{{font-size:.75rem;display:inline-block;background:#e5f2ec;padding:3px 8px;border-radius:4px}}dl{{display:grid;grid-template-columns:100px 1fr;gap:8px 14px;font-size:.88rem}}dt{{color:var(--muted)}}dd{{margin:0;overflow-wrap:anywhere}}.note,details{{font-size:.85rem;color:var(--muted)}}summary{{cursor:pointer}}code{{font-size:.82rem;overflow-wrap:anywhere}}.scroll{{overflow-x:auto;margin-bottom:36px}}table{{border-collapse:collapse;width:100%;background:white;font-size:.88rem}}th,td{{padding:14px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}}th{{background:#e5eeea}}.warning{{border-left:4px solid #a77024;padding:12px 16px;background:#fff8eb}}[hidden]{{display:none}}@media print{{input{{display:none}}article{{break-inside:avoid}}}}
    </style><main><header><div class="meta">Local operations register · {escape(data['registry_version'])}</div><h1>One map for the websites.</h1><p>Who operates each site, where its source lives, and how visitors should move between domains.</p><p class="warning">Desired routing is a plan. “Not live verified” means no current HTTP verification is recorded. Generating this view changes no hosting, DNS, accounts, or public websites. Private investor material has no public link.</p></header><label for="filter">Find a site or domain</label><br><input id="filter" type="search" placeholder="Tenetrix, Medical, domain…"><section class="cards">{''.join(cards)}</section><h2>Connections between sites</h2><div class="scroll"><table><thead><tr><th>From</th><th>Destination</th><th>Desired</th><th>Observed</th></tr></thead><tbody>{links}</tbody></table></div><h2>Redirect map</h2><p>Exact paths take precedence over wildcard rules. Queries are preserved. Unknown hosts have no redirect.</p><div class="scroll"><table><thead><tr><th>Incoming host and path</th><th>Desired destination</th><th>Status / observed</th></tr></thead><tbody>{routes}</tbody></table></div><p class="meta">Source: registers/websites.json · validate and regenerate after edits</p></main><script>document.getElementById('filter').addEventListener('input',function(){{const q=this.value.toLowerCase();document.querySelectorAll('article').forEach(card=>card.hidden=!card.textContent.toLowerCase().includes(q));}});</script></html>'''


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["validate", "render", "export-routing"], nargs="?", default="validate")
    parser.add_argument("--register", type=Path, default=DEFAULT_REGISTER)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--live", action="store_true", help="read-only bounded HTTP checks; never edits observations")
    parser.add_argument("--max-requests", type=int, default=20)
    parser.add_argument("--timeout", type=float, default=5)
    args = parser.parse_args(argv)
    if args.live and args.action != "validate":
        parser.error("--live is only available with validate")
    try:
        data = json.loads(args.register.read_text())
        errors = validate(data)
        if errors:
            print("\n".join(errors), file=sys.stderr)
            return 1
        if args.live:
            report = live_check(data, args.max_requests, args.timeout)
            print(json.dumps(report, indent=2))
            return 2 if report["drift_count"] else 3 if report["coverage"] == "partial" else 0
        if args.action == "render":
            output = args.output or ROOT / "websites.html"
            output.write_text(render_html(data), encoding="utf-8")
            print(f"Rendered local view: {output}")
        elif args.action == "export-routing":
            if not args.output:
                parser.error("export-routing requires an explicit --output path")
            args.output.write_text(json.dumps(routing_export(data), indent=2) + "\n", encoding="utf-8")
            print(f"Exported routing: {args.output}")
        else:
            print(f"Website register valid: {len(data['sites'])} sites, {len(domain_owners(data))} domains, {len(data['redirect_rules'])} routing rules, {len(data['links'])} links. No live checks performed.")
        return 0
    except (OSError, ValueError, TypeError, KeyError) as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
