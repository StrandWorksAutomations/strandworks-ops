"use client";
import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function login() {
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch("/api/auth/login-options", { method: "POST" });
      if (optRes.status === 409) {
        setError("No passkey enrolled yet. Owner setup: open /setup on the enrollment device.");
        return;
      }
      if (!optRes.ok) throw new Error(`could not start login (HTTP ${optRes.status})`);
      const options = await optRes.json();
      const assertion = await startAuthentication({ optionsJSON: options });
      const verifyRes = await fetch("/api/auth/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (!verifyRes.ok) {
        const detail = await verifyRes.json().then(d => d?.error).catch(() => null);
        throw new Error(detail ? `${detail} (HTTP ${verifyRes.status})` : `verification failed (HTTP ${verifyRes.status})`);
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      // Surface the DOMException name — "NotAllowedError: ..." tells us the
      // authenticator declined/timed out vs. a server-side verify failure.
      setError(e instanceof Error ? `${e.name !== "Error" ? e.name + ": " : ""}${e.message}` : "login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <div className="center-screen">
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Strandworks Cockpit</h1>
          <p style={{ color: "var(--muted)" }}>Owner-only. Passkey required.</p>
        </div>
        <button className="btn-primary" onClick={login} disabled={busy}>
          {busy ? "Waiting for passkey…" : "Unlock with passkey"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </div>
  );
}
