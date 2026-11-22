import type { Session } from "@supabase/supabase-js";
import type { CustomerRecord } from "@/lib/supabase/services";

/**
 * Asks the server whether this session's account may use the site. Google accounts
 * always may; email/password accounts only after verifying their address.
 * Fails closed: if the check can't be completed, the account is treated as unverified.
 */
export async function isSessionVerified(session: Session | null | undefined): Promise<boolean> {
  if (!session?.user) return false;
  if (session.user.app_metadata?.provider !== "email") return true;
  return (await checkSession(session)).verified;
}

/**
 * Like isSessionVerified, but when it has to ask the server it also returns the
 * account's customers row, so login doesn't need a second request to read the role.
 */
export async function checkSession(
  session: Session | null | undefined
): Promise<{ verified: boolean; customer?: CustomerRecord | null }> {
  if (!session?.user) return { verified: false };
  const cacheKey = `polaris:verified:${session.user.id}`;
  try {
    if (sessionStorage.getItem(cacheKey) === "1") return { verified: true };
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
    // Google accounts are always allowed in; a failed check only stops email accounts.
    if (!res.ok && session.user.app_metadata?.provider !== "email") return { verified: true };
    return { verified, customer: verified ? data?.customer ?? null : null };
  } catch {
    return { verified: session.user.app_metadata?.provider !== "email" };
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
