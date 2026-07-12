// First-run enrollment only: refuses once a credential exists. Enrollment is
// an owner-performed setup step done BEFORE the app is exposed (SPEC item 2).
import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { loadCredential, rpConfig } from "@/lib/passkey";
import { createChallengeToken, challengeCookieOptions, cookieNames } from "@/lib/session";

export async function POST() {
  if (await loadCredential()) {
    return NextResponse.json({ error: "owner already enrolled" }, { status: 409 });
  }
  const { rpID, rpName } = rpConfig();
  const options = await generateRegistrationOptions({
    rpID,
    rpName,
    userName: "owner",
    userDisplayName: "Owner",
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
  });
  const res = NextResponse.json(options);
  res.cookies.set(
    cookieNames.challenge,
    await createChallengeToken(options.challenge, "register"),
    challengeCookieOptions()
  );
  return res;
}
