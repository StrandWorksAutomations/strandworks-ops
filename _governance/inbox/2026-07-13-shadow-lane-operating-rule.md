# 2026-07-13 — Shadow worker-lane operating rule (owner-approved reasoning capture)

> NOT directive until it passes Intake into SPEC. Captured from the owner
> session of 2026-07-13 (Shadow VM first launch) so the reasoning isn't lost.

## Owner decision (plain words)

Shadow PC is the **wake-on-demand heavy worker**, not an always-on server.
The **DO droplet (claude-ops) stays the always-on tier**. No keep-alive
hacks on Shadow. Owner token phrase: "that sounds like a better plan."

## The reasoning (why no keep-alive)

1. Shadow shuts down on **stream disconnect**, not network idle — a ping does
   nothing; keep-alive would mean a 24/7 connected streaming client.
2. ToS/fair-use risk: unattended 24/7 server workloads on a consumer cloud-PC
   plan invite suspension of a subscription the owner wants to keep.
3. Unreliable regardless: Windows updates / datacenter maintenance kill
   sessions; the fabric must tolerate Shadow being offline (VISION: "24/7
   does not require every machine online").
4. Security floor: a perpetually streamed, logged-in desktop is a standing
   attack surface.

## The pattern

- Work moves through git; the WS-C dispatch loop is checkpointed, so Shadow
  sleeping mid-lane pauses the lane and resumes on next boot. Nothing lost.
- Occasional manual keep-alive (owner leaves the stream up for a long render
  or sprint night) is fine as an owner choice, never the standing design.
- Fabric status surfaces honestly which machines are online (already a
  VISION line).

## Facts observed at first launch (2026-07-13)

- Shadow VM booted successfully from the Mac client; Windows desktop live.
- NOT a blank VM: Character Creator 5, iClone 8.73, Reallusion Hub, Chrome,
  Edge, Tenetrix installers, cc3base.Fbx + textures already present — it was
  previously provisioned for the 3D-character pipeline.
- Worker-tier provisioning begun by owner in-session: Git, GitHub CLI,
  Tailscale, Claude Code (native Windows), clone of strandworks-ops.
- Open test: confirm post-disconnect shutdown timing (disconnect 15 min,
  reconnect, check session survival).

## Suggested intake shape (when the owner wants it as law)

One SPEC line under Layer-1: "Shadow = wake-on-demand worker; claude-ops
droplet = always-on tier; no unattended keep-alive on Shadow; dispatch lanes
targeting Shadow must be checkpoint-resumable."
