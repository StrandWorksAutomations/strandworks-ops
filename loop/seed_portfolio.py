#!/usr/bin/env python3
"""Idempotently connect approved objectives to Linear and the shared control RPCs."""
import argparse
import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import urllib.request

HERE = Path(__file__).resolve().parent
loader = importlib.machinery.SourceFileLoader("swd_seed", str(HERE / "swd"))
spec = importlib.util.spec_from_loader(loader.name, loader)
swd = importlib.util.module_from_spec(spec)
loader.exec_module(swd)

def linear(query, variables=None):
    key = os.environ.get("LINEAR_API_KEY")
    if not key:
        raise RuntimeError("LINEAR_API_KEY is required; never use the retired embedded-key bridge")
    req = urllib.request.Request("https://api.linear.app/graphql", data=json.dumps({"query": query, "variables": variables or {}}).encode(), headers={"Content-Type": "application/json", "Authorization": key})
    with urllib.request.urlopen(req, timeout=25) as response:
        result = json.load(response)
    if result.get("errors"):
        raise RuntimeError("Linear request failed")
    return result["data"]

def seed(manifest):
    team = linear('query { teams { nodes { id key states { nodes { id name } } } } }')["teams"]["nodes"]
    team = next(t for t in team if t["key"] == "STR")
    todo = next(s["id"] for s in team["states"]["nodes"] if s["name"] == "Todo")
    receipts = []
    for objective in manifest["objectives"]:
        title = "Portfolio push Nov 2–4: " + objective["title"]
        found = linear('query($title:String!) { issues(filter:{title:{eq:$title}},first:10) { nodes { id identifier url } } }', {"title": title})["issues"]["nodes"]
        if len(found) > 1:
            raise RuntimeError("Duplicate exact-title issue; inspect before seeding")
        if found:
            issue = found[0]
        else:
            description = f'{objective["outcome"]}\n\nApproved portfolio push {manifest["id"]}. Work allocation {objective["allocation_percent"]}%.\n\nAcceptance: report actual results, validation, evidence, remaining work and dated next action through swd. Local completion, deployment and owner acceptance are distinct. Preserve existing product release and sending restrictions.\n\nShared objective: {objective["id"]}. Existing related issues remain canonical for their implementation scope; this issue tracks reset-window acceptance.'
            fields = {"teamId": team["id"], "projectId": objective["linear_project_id"], "stateId": todo, "title": title, "description": description, "dueDate": "2026-11-04", "priority": objective["priority"]}
            issue = linear('mutation($input:IssueCreateInput!) { issueCreate(input:$input) { success issue { id identifier url } } }', {"input": fields})["issueCreate"]["issue"]
        payload = {k: v for k, v in objective.items() if k != "allocation_percent"}
        payload["issue_ids"] = [issue["identifier"]]
        existing = swd.rpc("portfolio_focus", {"p_project": objective["project"]})
        current = next((o for o in existing["objectives"] if o["id"] == objective["id"]), None)
        if not current:
            swd.rpc("portfolio_objective_upsert", {"p_objective": payload})
        elif current.get("issue_ids") != payload["issue_ids"]:
            swd.rpc("portfolio_objective_upsert", {"p_objective": {**current, "issue_ids": payload["issue_ids"]}})
        receipts.append({"objective": objective["id"], "project": objective["project"], "issue": issue})
    return receipts

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=HERE / "portfolio-push.json")
    args = parser.parse_args()
    print(json.dumps(seed(json.loads(args.manifest.read_text())), indent=2))
