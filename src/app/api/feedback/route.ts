import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { getSupabaseAdmin, getUserFromRequest, isSupabaseAdminConfigured } from "@/lib/supabase/server";

/**
 * Feedback from the mobile app (or any other client).
 *
 * POST /api/feedback
 *   Authorization: Bearer <Supabase access token>   (optional; links the feedback to the signed-in user)
 *   {
 *     message: string,          required, max 2000 chars
 *     rating?: 1-5,
 *     category?: 'general' | 'service' | 'bug' | 'feature' | 'other',
 *     name?: string, email?: string,
 *     platform?: 'ios' | 'android' | 'web',
 *     device?: 'mobile' | 'tablet' | 'desktop',
 *     screen?: string,          the app screen it was sent from
 *     app_version?: string
 *   }
 * -> 201 { id }
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const CATEGORIES = new Set(["general", "service", "bug", "feature", "other"]);
const PLATFORMS = new Set(["ios", "android", "web"]);
const DEVICES = new Set(["mobile", "tablet", "desktop"]);

const str = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
};

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: CORS_HEADERS });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const message = str(body?.message, 2000);
  if (!message) return json({ error: "message is required" }, 400);

  const ratingNum = Number(body?.rating);
  const rating = Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5 ? ratingNum : null;

  const category = str(body?.category, 40)?.toLowerCase() || "general";
  const platform = str(body?.platform, 20)?.toLowerCase() || null;
  const device = str(body?.device, 20)?.toLowerCase() || "mobile";

  const email = str(body?.email, 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "email is not valid" }, 400);

  // Link to the signed-in user when the app sends its Supabase access token.
  let user: Awaited<ReturnType<typeof getUserFromRequest>> = null;
  if (isSupabaseAdminConfigured) {
    try {
      user = await getUserFromRequest(req);
    } catch {
      user = null;
    }
  }

  const row = {
    customer_id: user?.id || null,
    name: str(body?.name, 120) || (user?.user_metadata?.full_name as string | undefined) || null,
    email: email || user?.email || null,
    rating,
    category: CATEGORIES.has(category) ? category : "other",
    message,
    source: "mobile_app",
    platform: platform && PLATFORMS.has(platform) ? platform : null,
    device: DEVICES.has(device) ? device : "mobile",
    page: str(body?.screen ?? body?.page, 200),
    app_version: str(body?.app_version, 40),
    user_agent: str(req.headers.get("user-agent"), 500),
    status: "new",
  };

  const db = isSupabaseAdminConfigured ? getSupabaseAdmin() : supabase;
  const { data, error } = await db.from("feedback").insert([row]).select("id").single();
  if (error) {
    console.error("insert into feedback failed:", error.code, error.message);
    const missingTable = error.code === "42P01" || error.code === "PGRST205";
    return json({ error: missingTable ? "Feedback table is not set up yet" : "Could not save feedback" }, 500);
  }

  return json({ id: data.id }, 201);
}
