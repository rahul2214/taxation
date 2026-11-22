import { NextRequest, NextResponse } from "next/server";
import { getSignedDownloadUrl, isR2Configured, keyFromStoredUrl } from "@/lib/cloudflare/r2";
import { getAdminSession } from "@/lib/server/admin-auth";
import { getUserClaimsFromRequest, isSupabaseAdminConfigured } from "@/lib/supabase/server";

// Signed links expire after this many seconds; the stored /api/files/<key> link never does.
const LINK_TTL_SECONDS = 300;

/**
 * GET /api/files/<key>: hands out a short-lived signed link to a file in the private bucket.
 *   - Admins (admin session cookie) can open any file.
 *   - Customers (Authorization: Bearer <Supabase access token>) can open their own uploads
 *     (customers/<uid>/...), files the team uploaded for them (admin_uploads/<uid>/...),
 *     and the site tax forms (global_forms/...).
 * By default it redirects to the signed link (works as a plain link for admins).
 * With ?json=1 it returns { url } instead, for the customer portal, which sends a Bearer token.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await ctx.params;
  const key = keyFromStoredUrl(`/api/files/${(parts || []).join("/")}`);
  if (!key) return NextResponse.json({ error: "File not found." }, { status: 404 });

  let allowed = false;
  if (getAdminSession(req)) {
    allowed = true;
  } else if (isSupabaseAdminConfigured) {
    const user = await getUserClaimsFromRequest(req).catch(() => null);
    if (user) {
      allowed =
        key.startsWith(`customers/${user.id}/`) ||
        key.startsWith(`admin_uploads/${user.id}/`) ||
        key.startsWith("global_forms/");
    } else {
      return NextResponse.json({ error: "Please sign in to open this file." }, { status: 401 });
    }
  }
  if (!allowed) return NextResponse.json({ error: "You don't have access to this file." }, { status: 403 });

  if (!isR2Configured) {
    return NextResponse.json({ error: "File storage is not configured." }, { status: 503 });
  }

  try {
    const url = await getSignedDownloadUrl(key, LINK_TTL_SECONDS);
    const res = req.nextUrl.searchParams.get("json")
      ? NextResponse.json({ url, expiresIn: LINK_TTL_SECONDS })
      : NextResponse.redirect(url, 302);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (err) {
    console.error("/api/files error:", err);
    return NextResponse.json({ error: "Could not open the file. Please try again." }, { status: 500 });
  }
}
