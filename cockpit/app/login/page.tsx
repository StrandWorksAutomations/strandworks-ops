"use client";
import { useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { signInWithPasskey } from "@/lib/passkey-login";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function login() {
    setBusy(true);
    setError(null);
    try {
      await signInWithPasskey();
      router.push("/operate");
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
    <>
    <AppHeader title="Sign in" locked />
    <main className="gate" id="main-content" tabIndex={-1}>
      <div className="center-screen">
        <div>
          <h1 className="sw-wordmark gate-title">STRANDWORKS <span>// COCKPIT</span></h1>
          <p style={{ color: "var(--muted)" }}>Owner-only. Passkey required.</p>
        </div>
        <button className="btn-primary" onClick={login} disabled={busy}>
          {busy ? "Waiting for passkey…" : "Unlock with passkey"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </main>
    </>
  );
}
