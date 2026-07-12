// First-run enrollment only: refuses once a credential exists, AND requires
// the one-time SETUP_CODE from env (review 2026-07-12, flag 1). Enrollment is
// an owner-performed setup step done BEFORE the app is exposed (SPEC item 2).
import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { loadCredential, rpConfig } from "@/lib/passkey";
import { isSetupCodeValid, SETUP_CODE_HEADER } from "@/lib/setup-code";
import { createChallengeToken, challengeCookieOptions, cookieNames } from "@/lib/session";

export async function POST(req: NextRequest) {
  if (!isSetupCodeValid(req.headers.get(SETUP_CODE_HEADER))) {
    return NextResponse.json({ error: "setup code missing or invalid" }, { status: 403 });
  }
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
