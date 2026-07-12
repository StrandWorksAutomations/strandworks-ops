"use client";
// One pending decision as a card with the six owner-token buttons. A tap arms
// the token; a second, explicit CONFIRM tap sends it — fat-thumb protection
// for actions that become commits.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_TOKENS, type OwnerToken } from "@/lib/decisions";

export function DecisionCard(props: {
  id: string;
  filename: string;
  filed: string;
  filedBy: string;
  question: string;
  bodyHtml: string;
  dryRun: boolean;
}) {
  const [armed, setArmed] = useState<OwnerToken | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const router = useRouter();

  async function sendRuling(token: OwnerToken) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/decisions/rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: props.filename, ruling: token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "ruling failed");
      setDone(
        json.mode === "dry-run"
          ? `${token} recorded (dry-run, local only)`
          : `${token} committed (${String(json.commitSha).slice(0, 7)})`
      );
      setTimeout(() => router.refresh(), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ruling failed");
      setArmed(null);
    } finally {
      setBusy(false);
    }
  }

  const tokenClass = (t: OwnerToken) =>
    t === "APPROVE" ? "approve" : t === "BLESSED" ? "blessed" : t === "HALT" ? "halt" : "";

  return (
    <div className="card">
      <h3>{props.question || props.id}</h3>
      <div className="meta">
        filed {props.filed} by {props.filedBy}
      </div>
      <div className="prose" dangerouslySetInnerHTML={{ __html: props.bodyHtml }} />

      {done ? (
        <p className="ok-text">{done}</p>
      ) : armed ? (
        <div className="confirm-row">
          <button
            className={`token-btn ${tokenClass(armed)}`}
            disabled={busy}
            onClick={() => sendRuling(armed)}
          >
            {busy ? "…" : `CONFIRM ${armed}`}
          </button>
          <button className="token-btn" disabled={busy} onClick={() => setArmed(null)}>
            cancel
          </button>
        </div>
      ) : (
        <div className="tokens">
          {OWNER_TOKENS.map((t) => (
            <button key={t} className={`token-btn ${tokenClass(t)}`} onClick={() => setArmed(t)}>
              {t}
            </button>
          ))}
        </div>
      )}
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
