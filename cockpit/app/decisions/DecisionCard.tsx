"use client";
// One pending decision as a card. Two answer surfaces:
//   1. If the decision body offers lettered options (A / B / C), each option
//      gets a one-tap button that arms APPROVE with that answer — matching
//      how decisions are actually phrased ("Reply A / B / C").
//   2. The six owner tokens. Arming REVISE opens a free-text field for the
//      owner's own rule; the text rides along as `answer:` in the frontmatter.
// Every send still requires a second explicit CONFIRM tap — fat-thumb
// protection for actions that become commits.
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
  options: string[];
  dryRun: boolean;
}) {
  const [armed, setArmed] = useState<OwnerToken | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const router = useRouter();

  async function sendRuling(token: OwnerToken, answerText: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/decisions/rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: props.filename,
          ruling: token,
          ...(answerText ? { answer: answerText } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "ruling failed");
      const label = answerText ? `${token} · ${answerText}` : token;
      setDone(
        json.mode === "dry-run"
          ? `${label} recorded (dry-run, local only)`
          : `${label} committed (${String(json.commitSha).slice(0, 7)})`
      );
      setTimeout(() => router.refresh(), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ruling failed");
      setArmed(null);
      setAnswer("");
    } finally {
      setBusy(false);
    }
  }

  function arm(token: OwnerToken, answerText = "") {
    setArmed(token);
    setAnswer(answerText);
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
        <div>
          {armed === "REVISE" ? (
            <textarea
              className="answer-input"
              placeholder="Your rule — recorded as the answer"
              value={answer}
              maxLength={300}
              rows={2}
              disabled={busy}
              onChange={(e) => setAnswer(e.target.value)}
            />
          ) : null}
          <div className="confirm-row">
            <button
              className={`token-btn ${tokenClass(armed)}`}
              disabled={busy || (armed === "REVISE" && answer.trim() === "")}
              onClick={() => sendRuling(armed, answer.trim())}
            >
              {busy ? "…" : `CONFIRM ${armed}${answer && armed !== "REVISE" ? ` · ${answer}` : ""}`}
            </button>
            <button
              className="token-btn"
              disabled={busy}
              onClick={() => {
                setArmed(null);
                setAnswer("");
              }}
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {props.options.length > 0 ? (
            <div className="tokens" style={{ marginBottom: 0 }}>
              {props.options.map((o) => (
                <button
                  key={o}
                  className="token-btn approve"
                  onClick={() => arm("APPROVE", o)}
                >
                  {o}
                </button>
              ))}
            </div>
          ) : null}
          <div className="tokens">
            {OWNER_TOKENS.map((t) => (
              <button key={t} className={`token-btn ${tokenClass(t)}`} onClick={() => arm(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
