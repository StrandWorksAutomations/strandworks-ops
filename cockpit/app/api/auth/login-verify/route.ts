import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { loadCredential, rpConfig } from "@/lib/passkey";
import {
  cookieNames,
  createSessionToken,
  sessionCookieOptions,
  verifyChallengeToken,
} from "@/lib/session";

export async function POST(req: NextRequest) {
  const cred = await loadCredential();
  if (!cred) return NextResponse.json({ error: "no passkey enrolled" }, { status: 409 });

  const challenge = await verifyChallengeToken(
    req.cookies.get(cookieNames.challenge)?.value,
    "auth"
  );
  if (!challenge) return NextResponse.json({ error: "challenge expired — retry" }, { status: 400 });

  const body = await req.json();
  const { rpID, origin } = rpConfig();

  let verified = false;
  try {
    const result = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: cred.id,
        publicKey: Buffer.from(cred.publicKey, "base64url"),
        counter: cred.counter,
        transports: cred.transports as AuthenticatorTransport[] | undefined,
      },
    });
    verified = result.verified;
  } catch {
    verified = false;
  }
  if (!verified) return NextResponse.json({ error: "passkey verification failed" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieNames.session, await createSessionToken(), sessionCookieOptions());
  res.cookies.delete(cookieNames.challenge);
  return res;
}
