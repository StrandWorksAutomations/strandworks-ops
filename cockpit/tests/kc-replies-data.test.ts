import { beforeEach, describe, expect, it, vi } from "vitest";

const rest = vi.hoisted(() => ({ sbSelect: vi.fn(), sbInsert: vi.fn(), sbUpdate: vi.fn(), supabaseConfigured: vi.fn(() => true) }));
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/supabase-rest", () => rest);
import { queueReplyAction } from "../src/lib/kc-replies-data";
import { KINETIC_PAGE_ID, ReplyAccessError } from "../src/lib/kc-replies";

const id = "0123456789abcdef01234567";
const groupReply = { source_kind: "public_group", source_url: "https://www.facebook.com/groups/1/posts/2/" };
const action = { id, action: "approve" as const, revision: 1, draft: "Useful answer." };
const access = { status: "ready", actor_id: KINETIC_PAGE_ID, checked_at: new Date().toISOString(), proof_url: groupReply.source_url, composer_label: "Comment as Kinetic Clinician", note: "" };

beforeEach(() => vi.clearAllMocks());

describe("reply actions enforce Page access on the server", () => {
  it.each(["approve", "posted"] as const)("blocks %s for personal-only or unchecked groups without queueing", async (kind) => {
    rest.sbSelect.mockResolvedValueOnce([groupReply]).mockResolvedValueOnce([{ id: "1", stats: {} }]);
    await expect(queueReplyAction({ ...action, action: kind })).rejects.toBeInstanceOf(ReplyAccessError);
    expect(rest.sbInsert).not.toHaveBeenCalled();
  });
  it("requires the checked Page composer in the same group", async () => {
    rest.sbSelect.mockResolvedValueOnce([groupReply]).mockResolvedValueOnce([{ id: "1", stats: { page_access: { ...access, proof_url: "https://www.facebook.com/groups/2/" } } }]);
    await expect(queueReplyAction(action)).rejects.toBeInstanceOf(ReplyAccessError);
    expect(rest.sbInsert).not.toHaveBeenCalled();
  });
  it("queues an approval only after current group access is read back", async () => {
    rest.sbSelect.mockResolvedValueOnce([groupReply]).mockResolvedValueOnce([{ id: "1", stats: { page_access: access } }]);
    await queueReplyAction(action);
    expect(rest.sbSelect).toHaveBeenCalledTimes(2);
    expect(rest.sbInsert).toHaveBeenCalledWith("kc_fb_reply_actions", expect.objectContaining({ item_id: id, action: "approve", draft: "Useful answer." }));
  });
  it("accepts a numeric permalink only when it is a verified alias of the checked group", async () => {
    rest.sbSelect.mockResolvedValueOnce([{ ...groupReply, source_url: "https://www.facebook.com/groups/307401089297853/posts/123/" }])
      .mockResolvedValueOnce([{ id: "Complexmedicine", stats: { group_aliases: ["307401089297853"], page_access: { ...access, proof_url: "https://www.facebook.com/groups/Complexmedicine/" } } }]);
    await queueReplyAction(action);
    expect(rest.sbInsert).toHaveBeenCalledTimes(1);
  });
  it("does not infer an alias from an unrelated ready group", async () => {
    rest.sbSelect.mockResolvedValueOnce([{ ...groupReply, source_url: "https://www.facebook.com/groups/999/posts/123/" }])
      .mockResolvedValueOnce([{ id: "Complexmedicine", stats: { group_aliases: ["307401089297853"], page_access: { ...access, proof_url: "https://www.facebook.com/groups/Complexmedicine/" } } }]);
    await expect(queueReplyAction(action)).rejects.toBeInstanceOf(ReplyAccessError);
    expect(rest.sbInsert).not.toHaveBeenCalled();
  });
  it("preserves saves and dismissals while group access is blocked", async () => {
    await queueReplyAction({ ...action, action: "save" });
    await queueReplyAction({ ...action, action: "dismiss" });
    expect(rest.sbSelect).not.toHaveBeenCalled();
    expect(rest.sbInsert).toHaveBeenCalledTimes(2);
  });
  it("does not apply the group gate to owned Page comments", async () => {
    rest.sbSelect.mockResolvedValueOnce([{ ...groupReply, source_kind: "owned_page" }]);
    await queueReplyAction(action);
    expect(rest.sbSelect).toHaveBeenCalledTimes(1);
    expect(rest.sbInsert).toHaveBeenCalledTimes(1);
  });
});
