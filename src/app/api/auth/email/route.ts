import { NextRequest, NextResponse } from "next/server";
import {
  applyResetCode,
  applyVerifyCode,
  checkResetCode,
  configError,
  findAccount,
  friendlyError,
  isAccountVerified,
  isAuthMailConfigured,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email/auth-mail";
import { getUserFromRequest } from "@/lib/supabase/server";

/**
 * Email verification and password reset, sent with Resend and applied to the
 * Supabase account. One route, picked by `action`:
 *   send-verification { email }
 *   forgot-password   { email }
 *   verify-email      { oobCode }
 *   check-reset       { oobCode }            -> { email }
 *   reset-password    { oobCode, password }
 *   session-check     (Authorization: Bearer <Supabase access token>) -> { verified }
 */
export async function POST(req: NextRequest) {
  if (!isAuthMailConfigured) {
    return NextResponse.json({ error: configError() }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const action = String(body?.action || "");
  const email = String(body?.email || "").trim().toLowerCase();
  const oobCode = String(body?.oobCode || "");

  try {
    switch (action) {
      case "send-verification": {
        if (!email) return bad("Email is required.");
        const account = await findAccount(email);
        // Same answer whether or not the account exists, so this can't be used to probe emails.
        if (!account) return NextResponse.json({ sent: true });
        if (account.customer.email_verified === true) return NextResponse.json({ sent: false, alreadyVerified: true });
        await sendVerificationEmail(email, req);
        return NextResponse.json({ sent: true, alreadyVerified: false });
      }

      case "forgot-password": {
        if (!email) return bad("Email is required.");
        const account = await findAccount(email);
        if (account) await sendPasswordResetEmail(account.authUser, req);
        return NextResponse.json({ sent: true });
      }

      case "verify-email": {
        if (!oobCode) return bad("Missing code.");
        const verifiedEmail = await applyVerifyCode(oobCode);
        return NextResponse.json({ verified: true, email: verifiedEmail });
      }

      case "check-reset": {
        if (!oobCode) return bad("Missing code.");
        return NextResponse.json({ email: await checkResetCode(oobCode) });
      }

      case "reset-password": {
        const password = String(body?.password || "");
        if (!oobCode) return bad("Missing code.");
        if (password.length < 8) return bad("Password must be at least 8 characters.");
        const resetEmail = await applyResetCode(oobCode, password);
        return NextResponse.json({ reset: true, email: resetEmail });
      }

      case "session-check": {
        // Is the signed-in account (from its access token) allowed in? Decided here, not in the browser.
        const authUser = await getUserFromRequest(req);
        if (!authUser) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
        const verified = await isAccountVerified(authUser);
        return NextResponse.json({ verified, email: authUser.email });
      }

      default:
        return bad("Unknown action.");
    }
  } catch (err) {
    console.error(`/api/auth/email ${action} error:`, err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 400 });
  }
}

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}
