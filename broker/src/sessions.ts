/**
 * Session manager backed by tmux.
 *
 * tmux IS the persistence layer: the broker holds no session state of its
 * own, so sessions survive broker restarts and the broker "reattaches" simply
 * by listing / attaching to whatever tmux sessions are alive. All tmux
 * invocations go through an injected exec function so tests never need a real
 * tmux server.
 */

export interface ExecResult {
  stdout: string;
  stderr: string;
}

/** Injected process runner (argv-style; never a shell string). */
export type ExecFn = (cmd: string, args: string[]) => Promise<ExecResult>;

export type SessionKind = "shell" | "claude";

export interface SessionInfo {
  name: string;
  /** "attached" when at least one client is attached, else "detached". */
  status: "attached" | "detached";
  /** Unix epoch seconds when tmux created the session. */
  createdAt: number;
  ageSeconds: number;
}

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;

export class SessionNameError extends Error {
  constructor(name: string) {
    super(
      `invalid session name ${JSON.stringify(name)} — use 1-32 chars of [A-Za-z0-9_-], starting alphanumeric`,
    );
    this.name = "SessionNameError";
  }
}

export function validateSessionName(name: string): string {
  if (!NAME_RE.test(name)) throw new SessionNameError(name);
  return name;
}

function isNoServerError(err: unknown): boolean {
  const text = [
    err instanceof Error ? err.message : String(err),
    (err as { stderr?: string })?.stderr ?? "",
  ].join("\n");
  return /no server running|error connecting to .*No such file or directory/i.test(text);
}

const LIST_FORMAT = "#{session_name}\t#{session_created}\t#{session_attached}";

export class SessionManager {
  private readonly exec: ExecFn;
  private readonly nowSeconds: () => number;

  constructor(exec: ExecFn, nowSeconds: () => number = () => Math.floor(Date.now() / 1000)) {
    this.exec = exec;
    this.nowSeconds = nowSeconds;
  }

  /** All live tmux sessions. Empty list when the tmux server is not running. */
  async list(): Promise<SessionInfo[]> {
    let stdout: string;
    try {
      ({ stdout } = await this.exec("tmux", ["list-sessions", "-F", LIST_FORMAT]));
    } catch (err) {
      if (isNoServerError(err)) return [];
      throw err;
    }
    const now = this.nowSeconds();
    const sessions: SessionInfo[] = [];
    for (const line of stdout.split("\n")) {
      if (!line.trim()) continue;
      const [name, created, attached] = line.split("\t");
      if (!name || created === undefined) continue;
      const createdAt = Number(created);
      sessions.push({
        name,
        status: Number(attached) > 0 ? "attached" : "detached",
        createdAt,
        ageSeconds: Math.max(0, now - createdAt),
      });
    }
    return sessions.sort((a, b) => a.createdAt - b.createdAt || a.name.localeCompare(b.name));
  }

  async exists(name: string): Promise<boolean> {
    validateSessionName(name);
    return (await this.list()).some((s) => s.name === name);
  }

  /**
   * Create a detached session (`tmux new-session -d`). kind "shell" runs the
   * user's default shell; kind "claude" runs the `claude` CLI.
   */
  async create(name: string, kind: SessionKind = "shell"): Promise<SessionInfo> {
    validateSessionName(name);
    const args = ["new-session", "-d", "-s", name];
    if (kind === "claude") args.push("claude");
    await this.exec("tmux", args);
    const created = (await this.list()).find((s) => s.name === name);
    return (
      created ?? { name, status: "detached", createdAt: this.nowSeconds(), ageSeconds: 0 }
    );
  }

  /** Kill a session by exact name (`=` prevents tmux prefix-matching). */
  async kill(name: string): Promise<void> {
    validateSessionName(name);
    await this.exec("tmux", ["kill-session", "-t", `=${name}`]);
  }

  /** argv for attaching a pty to a session — used by the websocket bridge. */
  attachArgs(name: string): { cmd: string; args: string[] } {
    validateSessionName(name);
    return { cmd: "tmux", args: ["attach-session", "-t", `=${name}`] };
  }
}
