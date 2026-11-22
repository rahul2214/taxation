import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server";
import {
  AdminSession,
  clearAdminCookie,
  getAdminSession,
  hashAdminPassword,
  isHashedPassword,
  setAdminCookie,
  verifyAdminPassword,
} from "@/lib/server/admin-auth";

/**
 * Admin console session.
 *   GET    -> { admin } for a valid admin cookie, else 401
 *   POST   { email, password } -> checks the password on the server, sets the cookie, { admin }
 *   DELETE -> clears the cookie
 */
export async function GET(req: NextRequest) {
  const admin = getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Not signed in as an administrator." }, { status: 401 });
  return NextResponse.json({ admin });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearAdminCookie(res);
  return res;
}

export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server." }, { status: 503 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

  const fail = () => NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });

  try {
    const db = getSupabaseAdmin();
    const { data: adminRow } = await db.from("admins").select("*").ilike("email", email).maybeSingle();

    let session: AdminSession | null = null;

    if (adminRow?.password && String(adminRow.password).trim() !== "") {
      // Password kept in the admins table: a scrypt hash, or legacy plaintext.
      const stored = String(adminRow.password);
      if (!verifyAdminPassword(stored, password)) return fail();
      if (!isHashedPassword(stored)) {
        // Replace the plaintext with a hash now that we know the password.
        const { error: upErr } = await db
          .from("admins")
          .update({ password: hashAdminPassword(password), updated_at: new Date().toISOString() })
          .eq("id", adminRow.id);
        if (upErr) console.error("Could not upgrade admin password hash:", upErr.message);
      }
      session = toSession(adminRow.id, adminRow.email, adminRow.name, adminRow.role, adminRow.role_id);
    } else {
      // Otherwise the password must be the account's Supabase Auth password.
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data: auth, error } = await authClient.auth.signInWithPassword({ email, password });
      if (error || !auth.user) return fail();
      await authClient.auth.signOut().catch(() => {});

      if (adminRow) {
        session = toSession(adminRow.id, adminRow.email, adminRow.name, adminRow.role, adminRow.role_id);
      } else {
        const { data: byId } = await db.from("admins").select("*").eq("id", auth.user.id).maybeSingle();
        if (byId) {
          session = toSession(byId.id, byId.email, byId.name, byId.role, byId.role_id);
        } else {
          const { data: cust } = await db.from("customers").select("*").eq("id", auth.user.id).maybeSingle();
          const isAdm =
            cust && (cust.role === "admin" || cust.role === "superadmin" || cust.role_id === 1 || cust.role_id === 3);
          if (!isAdm) {
            return NextResponse.json(
              { error: "This account is not authorized as an administrator." },
              { status: 403 }
            );
          }
          session = toSession(
            auth.user.id,
            auth.user.email || email,
            cust.first_name || "Admin",
            cust.role === "superadmin" || cust.role_id === 3 ? "superadmin" : "admin",
            cust.role_id
          );
        }
      }
    }

    await hashRemainingPlaintextPasswords(db);

    const res = NextResponse.json({ admin: session });
    setAdminCookie(res, session);
    return res;
  } catch (err) {
    console.error("/api/admin/session login error:", err);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}

/**
 * One-time cleanup for rows written before hashing existed: the stored plaintext
 * IS the password, so it can be hashed in place. Runs after any admin login; a no-op
 * once every row is hashed.
 */
async function hashRemainingPlaintextPasswords(db: ReturnType<typeof getSupabaseAdmin>) {
  try {
    const { data: rows } = await db
      .from("admins")
      .select("id, password")
      .not("password", "is", null)
      .not("password", "like", "scrypt$%");
    for (const row of rows || []) {
      const plain = String(row.password || "");
      if (!plain.trim() || isHashedPassword(plain)) continue;
      await db.from("admins").update({ password: hashAdminPassword(plain) }).eq("id", row.id);
    }
  } catch (err) {
    console.error("Admin password hashing sweep failed:", err);
  }
}

function toSession(id: unknown, email: unknown, name: unknown, role: unknown, roleId: unknown): AdminSession {
  const r = role === "superadmin" || roleId === 3 ? "superadmin" : "admin";
  return {
    id: String(id || `admin-${email}`),
    email: String(email || "").toLowerCase(),
    name: String(name || "Administrator"),
    role: r,
    role_id: r === "superadmin" ? 3 : 1,
  };
}
