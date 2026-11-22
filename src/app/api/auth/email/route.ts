import { NextRequest, NextResponse } from "next/server";
import {
  applyResetCode,
  applyVerifyCode,
  checkResetCode,
  configError,
  createUnconfirmedUser,
  ensureCustomerRow,
  findAccount,
  friendlyError,
  isAccountVerified,
  isAuthMailConfigured,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email/auth-mail";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/supabase/server";
import { applyReferralCode } from "@/lib/server/referrals";

/**
 * Email verification and password reset, sent with Resend and applied to the
 * Supabase account. One route, picked by `action`:
 *   signup            { email, password, metadata, referredByCode? } -> { userId, sent, welcomeBonus }
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
      case "signup": {
        // The account stays unconfirmed in Supabase (no session, no login) until the link is clicked.
        const password = String(body?.password || "");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Please enter a valid email address.");
        if (password.length < 8) return bad("Password must be at least 8 characters.");
        const meta = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};
        const clean = (v: unknown, max = 100) => String(v ?? "").trim().slice(0, max);
        const user = await createUnconfirmedUser(email, password, {
          first_name: clean(meta.first_name),
          last_name: clean(meta.last_name),
          phone: clean(meta.phone, 30),
          referral_code: clean(meta.referral_code, 40),
          heard_about: clean(meta.heard_about, 200),
        });

        // The new account has no session, so its customers row and referral bonus are
        // written here with the service role (the browser can't write them under RLS).
        let welcomeBonus = 0;
        try {
          const customer = await ensureCustomerRow(user);
          if (customer && customer.id === user.id) {
            const fill: Record<string, unknown> = {};
            if (!customer.phone && clean(meta.phone, 30)) fill.phone = clean(meta.phone, 30);
            if (!customer.heard_about && clean(meta.heard_about, 200)) fill.heard_about = clean(meta.heard_about, 200);
            if (Object.keys(fill).length) {
              await getSupabaseAdmin().from("customers").update(fill).eq("id", user.id);
            }
            const referredWith = clean(body?.referredByCode, 40);
            if (referredWith) {
              const result = await applyReferralCode(getSupabaseAdmin(), user.id, referredWith);
              if (result.applied) welcomeBonus = Number(result.amount || 0);
            }
          }
        } catch (profileErr) {
          // The login exists; the profile is re-created on first sign-in if this failed.
          console.error("Signup profile/referral error:", profileErr);
        }

        let sent = false;
        try {
          await sendVerificationEmail(email, req);
          sent = true;
        } catch (mailErr) {
          // The account exists either way; the login page can resend the link.
          console.error("Signup verification email error:", mailErr);
        }
        return NextResponse.json({ userId: user.id, sent, welcomeBonus });
      }

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
