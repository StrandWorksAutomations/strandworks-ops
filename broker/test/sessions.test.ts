import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  SessionManager,
  SessionNameError,
  type ExecFn,
  type ExecResult,
} from "../src/sessions.ts";

interface Call {
  cmd: string;
  args: string[];
}

function fakeExec(
  handler: (cmd: string, args: string[]) => ExecResult | Error,
): { exec: ExecFn; calls: Call[] } {
  const calls: Call[] = [];
  const exec: ExecFn = async (cmd, args) => {
    calls.push({ cmd, args });
    const out = handler(cmd, args);
    if (out instanceof Error) throw out;
    return out;
  };
  return { exec, calls };
}

const NOW = 1_800_000_000; // fixed clock (epoch seconds)

describe("SessionManager.list", () => {
  test("parses tmux list-sessions output into name/status/age", async () => {
    const { exec, calls } = fakeExec(() => ({
      stdout: `swb-claude-0712\t${NOW - 90}\t1\nops-shell\t${NOW - 3600}\t0\n`,
      stderr: "",
    }));
    const mgr = new SessionManager(exec, () => NOW);
    const list = await mgr.list();

    assert.deepEqual(calls[0], {
      cmd: "tmux",
      args: ["list-sessions", "-F", "#{session_name}\t#{session_created}\t#{session_attached}"],
    });
    assert.equal(list.length, 2);
    // sorted oldest first
    assert.deepEqual(list[0], {
      name: "ops-shell",
      status: "detached",
      createdAt: NOW - 3600,
      ageSeconds: 3600,
    });
    assert.deepEqual(list[1], {
      name: "swb-claude-0712",
      status: "attached",
      createdAt: NOW - 90,
      ageSeconds: 90,
    });
  });

  test("returns empty list when the tmux server is not running", async () => {
    const err = Object.assign(new Error("Command failed: tmux"), {
      stderr: "no server running on /tmp/tmux-1000/default",
    });
    const { exec } = fakeExec(() => err);
    const mgr = new SessionManager(exec, () => NOW);
    assert.deepEqual(await mgr.list(), []);
  });

  test("returns empty list when the tmux socket does not exist", async () => {
    const err = Object.assign(new Error("Command failed"), {
      stderr: "error connecting to /tmp/tmux-1000/default (No such file or directory)",
    });
    const { exec } = fakeExec(() => err);
    const mgr = new SessionManager(exec, () => NOW);
    assert.deepEqual(await mgr.list(), []);
  });

  test("propagates unrelated tmux errors", async () => {
    const { exec } = fakeExec(() => Object.assign(new Error("boom"), { stderr: "server exploded" }));
    const mgr = new SessionManager(exec, () => NOW);
    await assert.rejects(() => mgr.list(), /boom/);
  });

  test("skips blank lines and never returns negative ages", async () => {
    const { exec } = fakeExec(() => ({
      stdout: `\nfresh\t${NOW + 5}\t0\n\n`,
      stderr: "",
    }));
    const mgr = new SessionManager(exec, () => NOW);
    const list = await mgr.list();
    assert.equal(list.length, 1);
    assert.equal(list[0].ageSeconds, 0);
  });
});

describe("SessionManager.create", () => {
  test("shell session uses tmux new-session -d -s <name>", async () => {
    const { exec, calls } = fakeExec((_cmd, args) =>
      args[0] === "list-sessions"
        ? { stdout: `work\t${NOW}\t0\n`, stderr: "" }
        : { stdout: "", stderr: "" },
    );
    const mgr = new SessionManager(exec, () => NOW);
    const info = await mgr.create("work", "shell");
    assert.deepEqual(calls[0], { cmd: "tmux", args: ["new-session", "-d", "-s", "work"] });
    assert.equal(info.name, "work");
    assert.equal(info.status, "detached");
  });

  test("claude session appends the claude CLI as the command", async () => {
    const { exec, calls } = fakeExec((_cmd, args) =>
      args[0] === "list-sessions"
        ? { stdout: `ai\t${NOW}\t0\n`, stderr: "" }
        : { stdout: "", stderr: "" },
    );
    const mgr = new SessionManager(exec, () => NOW);
    await mgr.create("ai", "claude");
    assert.deepEqual(calls[0], {
      cmd: "tmux",
      args: ["new-session", "-d", "-s", "ai", "claude"],
    });
  });

  test("rejects invalid names before any tmux call", async () => {
    const { exec, calls } = fakeExec(() => ({ stdout: "", stderr: "" }));
    const mgr = new SessionManager(exec, () => NOW);
    for (const bad of ["", "has space", "semi;colon", "-leadingdash", "x".repeat(33), "a/b", "$(rm)"]) {
      await assert.rejects(() => mgr.create(bad), SessionNameError);
    }
    assert.equal(calls.length, 0);
  });

  test("propagates tmux duplicate-session errors", async () => {
    const { exec } = fakeExec((_cmd, args) =>
      args[0] === "new-session"
        ? Object.assign(new Error("Command failed: tmux\nduplicate session: work"), {
            stderr: "duplicate session: work",
          })
        : { stdout: "", stderr: "" },
    );
    const mgr = new SessionManager(exec, () => NOW);
    await assert.rejects(() => mgr.create("work"), /duplicate session/);
  });
});

describe("SessionManager.kill", () => {
  test("kills by exact-match target (= prefix)", async () => {
    const { exec, calls } = fakeExec(() => ({ stdout: "", stderr: "" }));
    const mgr = new SessionManager(exec, () => NOW);
    await mgr.kill("work");
    assert.deepEqual(calls[0], { cmd: "tmux", args: ["kill-session", "-t", "=work"] });
  });

  test("rejects invalid names without calling tmux", async () => {
    const { exec, calls } = fakeExec(() => ({ stdout: "", stderr: "" }));
    const mgr = new SessionManager(exec, () => NOW);
    await assert.rejects(() => mgr.kill("../etc"), SessionNameError);
    assert.equal(calls.length, 0);
  });
});

describe("SessionManager.exists / attachArgs", () => {
  test("exists reflects the live tmux list", async () => {
    const { exec } = fakeExec(() => ({ stdout: `work\t${NOW}\t0\n`, stderr: "" }));
    const mgr = new SessionManager(exec, () => NOW);
    assert.equal(await mgr.exists("work"), true);
    assert.equal(await mgr.exists("nope"), false);
  });

  test("attachArgs builds an exact-match tmux attach argv", () => {
    const { exec } = fakeExec(() => ({ stdout: "", stderr: "" }));
    const mgr = new SessionManager(exec, () => NOW);
    assert.deepEqual(mgr.attachArgs("work"), {
      cmd: "tmux",
      args: ["attach-session", "-t", "=work"],
    });
    assert.throws(() => mgr.attachArgs("bad name"), SessionNameError);
  });
});
