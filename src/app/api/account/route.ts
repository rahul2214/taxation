import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSupabaseAdmin, getUserClaimsFromRequest, isSupabaseAdminConfigured } from "@/lib/supabase/server";
import { ensureCustomerRow } from "@/lib/email/auth-mail";
import { applyReferralCode, listReferrals } from "@/lib/server/referrals";
import { deleteDocument, DocumentError, removeSupersededDocuments, replaceDocumentFile } from "@/lib/server/documents";

// A customer row this young counts as a brand-new signup (referral code may still be applied).
const NEW_ACCOUNT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Signed-in customer actions that need more than the customer's own rows, so they
 * run here with the service role instead of in the browser.
 * Authorization: Bearer <Supabase access token>. POST { action, ... }:
 *   ensure-profile       { referralCode?, heardAbout? } -> { customer, isAdmin, bonus }
 *                        Creates the customers row if missing (Google signups), applies a
 *                        referral code to a brand-new account, saves heard_about.
 *   referrals            -> { referrals }   (people this customer referred)
 *   ensure-referral-code -> { code }
 *   delete-document      { id } -> { deleted }      (own uploads only; also deletes the R2 file)
 *   replace-document-file { id, fileUrl, documentName? } -> { document }  (deletes the old R2 file)
 *   remove-superseded-documents { id } -> { removed }  (after a new one-per-year upload)
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server." }, { status: 503 });
  }
  const user = await getUserClaimsFromRequest(req).catch(() => null);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const action = String(body?.action || "");
  const db = getSupabaseAdmin();
  const actor = { kind: "customer" as const, userId: user.id };

  try {
    switch (action) {
      case "ensure-profile": {
        const email = (user.email || "").toLowerCase();
        // Admins sign in through /admin/login; don't give them a customer row by accident.
        const { data: own } = await db.from("customers").select("*").eq("id", user.id).maybeSingle();
        if (!own && email) {
          const { data: adm } = await db.from("admins").select("id").ilike("email", email).maybeSingle();
          if (adm) return NextResponse.json({ customer: null, isAdmin: true, bonus: 0 });
        }

        let customer = own || (await ensureCustomerRow(user));
        if (!customer) return NextResponse.json({ customer: null, isAdmin: false, bonus: 0 });

        let bonus = 0;
        const stamp = customer.created_at || customer.signup_date;
        const isNew = stamp && Date.now() - new Date(stamp).getTime() < NEW_ACCOUNT_WINDOW_MS;
        const referralCode = String(body?.referralCode || "").trim().slice(0, 40);
        const heardAbout = String(body?.heardAbout || "").trim().slice(0, 200);

        if (isNew && referralCode && customer.id === user.id) {
          try {
            const result = await applyReferralCode(db, user.id, referralCode);
            if (result.applied) bonus = Number(result.amount || 0);
          } catch (err) {
            console.warn("ensure-profile referral notice:", err);
          }
        }
        if (heardAbout && !customer.heard_about && customer.id === user.id) {
          await db.from("customers").update({ heard_about: heardAbout }).eq("id", user.id);
        }
        if (bonus > 0 || heardAbout) {
          const { data: fresh } = await db.from("customers").select("*").eq("id", customer.id).maybeSingle();
          if (fresh) customer = fresh;
        }
        return NextResponse.json({ customer, isAdmin: false, bonus });
      }

      case "referrals": {
        return NextResponse.json({ referrals: await listReferrals(db, user.id) });
      }

      case "ensure-referral-code": {
        const { data: cust } = await db.from("customers").select("id, first_name, email, referral_code").eq("id", user.id).maybeSingle();
        if (!cust) return NextResponse.json({ error: "Customer profile not found." }, { status: 404 });
        if (cust.referral_code) return NextResponse.json({ code: cust.referral_code });
        const base = String(cust.first_name || cust.email || "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5) || "POLARIS";
        for (let i = 0; i < 4; i++) {
          const code = `${base}-${randomBytes(2).toString("hex").toUpperCase()}`;
          const { error } = await db.from("customers").update({ referral_code: code }).eq("id", user.id);
          if (!error) return NextResponse.json({ code });
          if (error.code !== "23505") throw error;
        }
        return NextResponse.json({ error: "Could not create a referral code." }, { status: 500 });
      }

      case "delete-document": {
        return NextResponse.json(await deleteDocument(db, actor, String(body?.id || "")));
      }

      case "replace-document-file": {
        const document = await replaceDocumentFile(db, actor, String(body?.id || ""), {
          fileUrl: String(body?.fileUrl || ""),
          documentName: String(body?.documentName || ""),
        });
        return NextResponse.json({ document });
      }

      case "remove-superseded-documents": {
        return NextResponse.json(await removeSupersededDocuments(db, actor, String(body?.id || "")));
      }

      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof DocumentError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(`/api/account ${action} error:`, err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
