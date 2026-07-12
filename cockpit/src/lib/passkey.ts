// Single-owner passkey (WebAuthn) credential store. No database:
//  - prod: OWNER_PASSKEY env var (base64url of the credential JSON — a PUBLIC
//    key + id, not a secret, but still never rendered or logged).
//  - dev: cockpit/data/owner-passkey.json (gitignored), written by /setup.
// Enrollment (/setup) only works while NO credential is configured — the
// owner enrolls before the app is exposed anywhere; adding devices later is
// an owner step (re-run setup locally, update the env var).
import fs from "node:fs/promises";
import path from "node:path";

export type StoredCredential = {
  id: string; // base64url credential id
  publicKey: string; // base64url COSE public key
  counter: number;
  transports?: string[];
};

const LOCAL_PATH = path.join(process.cwd(), "data", "owner-passkey.json");

export function rpConfig() {
  const rpID = process.env.COCKPIT_RP_ID ?? "localhost";
  const origin = process.env.COCKPIT_ORIGIN ?? "http://localhost:3111";
  return { rpID, origin, rpName: "Strandworks Cockpit" };
}

export async function loadCredential(): Promise<StoredCredential | null> {
  const env = process.env.OWNER_PASSKEY;
  if (env) {
    try {
      return JSON.parse(Buffer.from(env, "base64url").toString("utf-8"));
    } catch {
      throw new Error("OWNER_PASSKEY env var is not valid base64url JSON");
    }
  }
  try {
    return JSON.parse(await fs.readFile(LOCAL_PATH, "utf-8"));
  } catch {
    return null;
  }
}

// Local-dev persistence only; on Vercel the owner sets OWNER_PASSKEY instead.
// The "wx" flag makes the write exclusive-create: it closes the
// check-then-save race — a concurrent enrollment that lost the race fails
// with EEXIST instead of silently overwriting the winner's credential.
export async function saveCredentialLocally(
  cred: StoredCredential,
  filePath: string = LOCAL_PATH
): Promise<string> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(cred, null, 2) + "\n", {
    encoding: "utf-8",
    flag: "wx",
  });
  return filePath;
}

export function credentialToEnvValue(cred: StoredCredential): string {
  return Buffer.from(JSON.stringify(cred)).toString("base64url");
}
