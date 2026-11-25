export async function signInWithPasskey() {
  const options = await fetch("/api/auth/login-options", { method: "POST" });
  if (options.status === 409) throw new Error("No passkey enrolled yet. Open /setup on the enrollment device.");
  if (!options.ok) throw new Error(`Could not start sign-in (HTTP ${options.status}).`);
  const { startAuthentication } = await import("@simplewebauthn/browser");
  const assertion = await startAuthentication({ optionsJSON: await options.json() });
  const verified = await fetch("/api/auth/login-verify", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(assertion),
  });
  if (!verified.ok) {
    const detail = await verified.json().then(d => d?.error).catch(() => null);
    throw new Error(`${detail || "Verification failed"} (HTTP ${verified.status}).`);
  }
}
