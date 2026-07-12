"use client";
// Owner enrollment — first run only. The server refuses registration once a
// credential exists, so this page is inert after setup.
import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

export default function SetupPage() {
  const [error, setError] = useState<string | null>(null);
  const [envValue, setEnvValue] = useState<string | null>(null);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function enroll() {
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch("/api/auth/register-options", {
        method: "POST",
        headers: { "x-setup-code": setupCode },
      });
      if (optRes.status === 409) {
        setError("Owner already enrolled — this page is disabled.");
        return;
      }
      if (optRes.status === 403) {
        setError("Setup code missing or invalid.");
        return;
      }
      if (!optRes.ok) throw new Error("could not start enrollment");
      const options = await optRes.json();
      const attestation = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch("/api/auth/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-setup-code": setupCode },
        body: JSON.stringify(attestation),
      });
      if (!verifyRes.ok) throw new Error("enrollment verification failed");
      const json = await verifyRes.json();
      setEnvValue(json.envValue);
      setSavedTo(json.savedTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "enrollment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <div className="center-screen">
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Owner setup</h1>
          <p style={{ color: "var(--muted)" }}>
            One-time passkey enrollment. Requires the SETUP_CODE from env and
            works only while no owner passkey exists.
          </p>
        </div>
        {envValue ? (
          <div style={{ textAlign: "left" }}>
            <p className="ok-text">
              Enrolled.
              {savedTo
                ? ` Credential saved locally at ${savedTo}.`
                : " This server cannot store it — finish by setting the env var below."}
            </p>
            <p style={{ fontSize: 13 }}>
              For the Vercel deployment (owner step): set env var <b>OWNER_PASSKEY</b> to:
            </p>
            <p className="mono card">{envValue}</p>
            <a href="/">Enter the cockpit →</a>
          </div>
        ) : (
          <>
            <input
              type="password"
              placeholder="Setup code"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
              autoComplete="off"
              style={{ padding: "10px 12px", fontSize: 15 }}
            />
            <button className="btn-primary" onClick={enroll} disabled={busy || !setupCode}>
              {busy ? "Waiting for passkey…" : "Enroll owner passkey"}
            </button>
          </>
        )}
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </div>
  );
}
