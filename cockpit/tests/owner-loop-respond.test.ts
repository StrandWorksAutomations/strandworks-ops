import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { cookieNames, createSessionToken } from "@/lib/session";

vi.mock("@/lib/supabase-rest", () => ({ sbRpc: vi.fn(), sbUpdate: vi.fn() }));

import { POST as respond } from "../app/api/loop/respond/route";
import { POST as action } from "../app/api/loop/action/route";
import { sbRpc } from "@/lib/supabase-rest";
import { explicitBriefSlug, matchBriefNames } from "@/lib/brief-links";
import { groupOwnerLoopItems, projectFolder, type OwnerLoopItem } from "@/lib/owner-loop";

const rpc = vi.mocked(sbRpc);
function request(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.cookie = `${cookieNames.session}=${token}`;
  return new NextRequest(`http://localhost${path}`, { method: "POST", headers, body: JSON.stringify(body) });
}

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ ref: "D-0001" });
});

describe("owner responses", () => {
  it("requires the owner's session", async () => {
    expect((await respond(request("/api/loop/respond", { ref: "D-0001", text: "go" }))).status).toBe(401);
    expect((await action(request("/api/loop/action", { ref: "D-0001", action: "archive" }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sends the option, message and urgency to the database", async () => {
    const res = await respond(request("/api/loop/respond", { ref: "D-0001", option: "A", text: " go ", urgent: true }, await createSessionToken()));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("owner_loop_respond", { p_ref: "D-0001", p_option: "A", p_text: "go", p_urgent: true });
  });

  it("rejects an empty response and turns a response about an objective into a note", async () => {
    const token = await createSessionToken();
    expect((await respond(request("/api/loop/respond", { ref: "D-0001", text: " " }, token))).status).toBe(400);
    const res = await respond(request("/api/loop/respond", { project: "wobble-ward", title: "Deliver: loop", detail: "Late", text: "Move it" }, token));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("owner_loop_note", expect.objectContaining({ p_project: "wobble-ward", p_title: "Deliver: loop", p_text: "Move it" }));
  });

  it("allows only known owner actions and valid edits", async () => {
    const token = await createSessionToken();
    expect((await action(request("/api/loop/action", { ref: "D-0001", action: "pickup" }, token))).status).toBe(400);
    expect((await action(request("/api/loop/action", { ref: "D-0001", action: "edit", due_at: "soon" }, token))).status).toBe(400);
    expect((await action(request("/api/loop/action", { ref: "D-0001", action: "edit", title: "New", due_at: null }, token))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("owner_loop_owner_action", { p_ref: "D-0001", p_action: "edit", p_args: { title: "New", due_at: null } });
  });
});

describe("items", () => {
  const item = (over: Partial<OwnerLoopItem>): OwnerLoopItem => ({
    id: "1", ref: "D-0001", kind: "alert", project: "wobble-ward", title: "Tenetrix narration activities", body: null, options: [], recommended: null,
    origin_agent: "claude", due_at: null, status: "open", ruling: null, ruling_note: null, ruled_via: null, ruled_at: null, picked_up_at: null, picked_up_by: null,
    outcome_note: null, done_at: null, repeat_count: 1, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z", ...over,
  });

  it("lists saved items without removing them from their own section", () => {
    const groups = groupOwnerLoopItems([item({ saved_at: "2026-11-02T00:00:00Z" })], new Date("2026-11-04T00:00:00Z"));
    expect(groups.saved).toHaveLength(1);
    expect(groups.alerts).toHaveLength(1);
  });

  it("finds an attached brief, a linked brief, and only strong filename matches", () => {
    expect(explicitBriefSlug(item({ brief_slug: "abc" }))).toBe("abc");
    expect(explicitBriefSlug(item({ body: "See /briefings/2026-11-02-073101-laptop-tenetrix-roadmap for more." }))).toBe("2026-11-02-073101-laptop-tenetrix-roadmap");
    const names = ["2026-11-02-073101-laptop-tenetrix-narration-and-activities.md", "2026-11-02-073104-laptop-tenetrix-course-roadmap.md"];
    expect(matchBriefNames(item({}), names)).toEqual(["2026-11-02-073101-laptop-tenetrix-narration-and-activities"]);
  });

  it("names the agent's folder, falling back to the project", () => {
    expect(projectFolder(item({ origin_cwd: "/x/y" }))).toBe("/x/y");
    expect(projectFolder(item({}))).toBe("/Users/jonathanbouren/PROJECTS/wobble-ward");
    expect(projectFolder(item({ project: "portfolio" }))).toBe("/Users/jonathanbouren/PROJECTS");
  });
});
