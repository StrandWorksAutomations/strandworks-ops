// Enrollment gate (review 2026-07-12, flag 1): registering the owner passkey
// requires a one-time SETUP_CODE from env IN ADDITION to "no credential
// exists yet". Without the env var, enrollment is disabled entirely — the
// window between deploy and the owner's first /setup visit is closed.
export const SETUP_CODE_HEADER = "x-setup-code";

export function isSetupCodeValid(
  provided: string | null | undefined,
  expected: string | undefined = process.env.SETUP_CODE
): boolean {
  if (!expected || !provided) return false;
  if (provided.length !== expected.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
