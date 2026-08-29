// Projects-register write endpoint. Owner session required by middleware; every
// edit is one commit to registers/projects.csv (dev: dry-run to the checkout).
import { NextRequest, NextResponse } from "next/server";
import { readRepoFile } from "@/lib/repo";
import { commitFileUpdate } from "@/lib/git-write";
import { applyProjectEdit, EditError, type ProjectEdit } from "@/lib/project-edit";

const REGISTER = "registers/projects.csv";

export async function POST(req: NextRequest) {
  let body: Partial<ProjectEdit>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.slug || typeof body.slug !== "string" || !/^[a-z0-9-]{1,80}$/.test(body.slug)) {
    return NextResponse.json({ error: "missing slug" }, { status: 400 });
  }
  if (!body.fields || typeof body.fields !== "object") {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const csv = await readRepoFile(REGISTER);
  if (csv === null) return NextResponse.json({ error: "projects register not found" }, { status: 404 });
  try {
    const { csv: updated, summary } = applyProjectEdit(csv, body as ProjectEdit);
    const result = await commitFileUpdate(REGISTER, updated, `projects: ${summary} (source: cockpit)`);
    return NextResponse.json({ ok: true, summary, ...result });
  } catch (e) {
    if (e instanceof EditError) return NextResponse.json({ error: e.message }, { status: 422 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "write failed" }, { status: 502 });
  }
}
