import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import {
  credentialToEnvValue,
  loadCredential,
  rpConfig,
  saveCredentialLocally,
  type StoredCredential,
} from "@/lib/passkey";
import {
  cookieNames,
  createSessionToken,
  sessionCookieOptions,
  verifyChallengeToken,
} from "@/lib/session";

export async function POST(req: NextRequest) {
  if (await loadCredential()) {
    return NextResponse.json({ error: "owner already enrolled" }, { status: 409 });
  }
  const challenge = await verifyChallengeToken(
    req.cookies.get(cookieNames.challenge)?.value,
    "register"
  );
  if (!challenge) return NextResponse.json({ error: "challenge expired — retry" }, { status: 400 });

  const body = await req.json();
  const { rpID, origin } = rpConfig();

  const result = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });
  if (!result.verified || !result.registrationInfo) {
    return NextResponse.json({ error: "registration verification failed" }, { status: 400 });
  }

  const info = result.registrationInfo;
  const stored: StoredCredential = {
    id: info.credential.id,
    publicKey: Buffer.from(info.credential.publicKey).toString("base64url"),
    counter: info.credential.counter,
    transports: info.credential.transports,
  };
  const savedTo = await saveCredentialLocally(stored);

  const res = NextResponse.json({
    ok: true,
    savedTo,
    // Owner pastes this into Vercel as OWNER_PASSKEY when connecting the
    // deployment (owner step, after review). It is a public key, not a secret.
    envValue: credentialToEnvValue(stored),
  });
  res.cookies.set(cookieNames.session, await createSessionToken(), sessionCookieOptions());
  res.cookies.delete(cookieNames.challenge);
  return res;
}
