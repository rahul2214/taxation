import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/server/admin-auth";
import { adminOps, opErrorMessage } from "@/lib/server/admin-ops";

/**
 * Admin console data. POST { op, args } with the admin session cookie.
 * `op` is one of the names in src/lib/server/admin-ops.ts. -> { data }
 */
export async function POST(req: NextRequest) {
  const admin = getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Not signed in as an administrator." }, { status: 401 });
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server." }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const op = String(body?.op || "");
  const handler = Object.prototype.hasOwnProperty.call(adminOps, op) ? adminOps[op] : undefined;
  if (!handler) return NextResponse.json({ error: "Unknown operation." }, { status: 400 });

  try {
    const data = await handler(getSupabaseAdmin(), body?.args || {}, admin);
    return NextResponse.json({ data: data ?? null });
  } catch (err) {
    console.error(`/api/admin/data ${op} error:`, err);
    return NextResponse.json(opErrorMessage(err), { status: 400 });
  }
}
