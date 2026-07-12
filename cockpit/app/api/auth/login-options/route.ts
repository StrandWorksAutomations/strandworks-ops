import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { loadCredential, rpConfig } from "@/lib/passkey";
import { createChallengeToken, challengeCookieOptions, cookieNames } from "@/lib/session";

export async function POST() {
  const cred = await loadCredential();
  if (!cred) {
    return NextResponse.json({ error: "no passkey enrolled — run owner setup" }, { status: 409 });
  }
  const { rpID } = rpConfig();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: [
      { id: cred.id, transports: cred.transports as AuthenticatorTransport[] | undefined },
    ],
  });
  const res = NextResponse.json(options);
  res.cookies.set(
    cookieNames.challenge,
    await createChallengeToken(options.challenge, "auth"),
    challengeCookieOptions()
  );
  return res;
}
