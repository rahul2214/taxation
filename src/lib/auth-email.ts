import type { Session } from "@supabase/supabase-js";

/**
 * Asks the server whether this session's account may use the site. Google accounts
 * always may; email/password accounts only after verifying their address.
 * Fails closed: if the check can't be completed, the account is treated as unverified.
 */
export async function isSessionVerified(session: Session | null | undefined): Promise<boolean> {
  if (!session?.user) return false;
  if (session.user.app_metadata?.provider !== "email") return true;
  const cacheKey = `polaris:verified:${session.user.id}`;
  try {
    if (sessionStorage.getItem(cacheKey) === "1") return true;
  } catch {
    // Storage blocked: just ask the server.
  }
  try {
    const res = await fetch("/api/auth/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: "session-check" }),
    });
    const data = await res.json().catch(() => ({}));
    const verified = res.ok && data?.verified === true;
    if (verified) {
      try {
        sessionStorage.setItem(cacheKey, "1");
      } catch {
        // Storage blocked: the next page load asks again.
      }
    }
    return verified;
  } catch {
    return false;
  }
}

/** Client wrapper for /api/auth/email (verification and password reset emails, sent with Resend). */
export async function emailAuthApi<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("/api/auth/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Something went wrong. Please try again.");
  return data as T;
}
