/**
 * Persistent Client-Side Auth Cache
 * Provides instant, zero-latency synchronous access to the active authenticated user
 * and role. Eliminates loading flashes and redundant network checks on page loads
 * and navigation.
 */

export interface CachedUser {
  uid: string;
  id?: string;
  email: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  role?: string;
  role_id?: number;
  isAdmin?: boolean;
  user_metadata?: any;
  cachedAt?: number;
}

const USER_SESSION_KEY = "polaris_user_session";
const ADMIN_SESSION_KEY = "polaris_admin_session";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getCachedAuth(): {
  user: CachedUser | null;
  role: string | null;
  isAdmin: boolean;
} {
  if (typeof window === "undefined") {
    return { user: null, role: null, isAdmin: false };
  }

  try {
    // 1. Check custom cached customer session
    const rawUser = localStorage.getItem(USER_SESSION_KEY);
    if (rawUser) {
      const parsed: CachedUser = JSON.parse(rawUser);
      if (parsed && (parsed.uid || parsed.id)) {
        const isAdmin =
          parsed.role === "admin" ||
          parsed.role === "superadmin" ||
          parsed.role_id === 1 ||
          parsed.role_id === 3 ||
          parsed.isAdmin === true;
        return {
          user: parsed,
          role: parsed.role || (isAdmin ? "admin" : "customer"),
          isAdmin,
        };
      }
    }

    // 2. Check custom cached admin session
    const rawAdmin = localStorage.getItem(ADMIN_SESSION_KEY);
    if (rawAdmin) {
      const parsedAdmin = JSON.parse(rawAdmin);
      if (parsedAdmin && (parsedAdmin.id || parsedAdmin.uid)) {
        const adminUser: CachedUser = {
          uid: parsedAdmin.id || parsedAdmin.uid,
          id: parsedAdmin.id || parsedAdmin.uid,
          email: parsedAdmin.email || null,
          displayName: parsedAdmin.name || "Admin",
          role: "admin",
          role_id: 1,
          isAdmin: true,
        };
        return { user: adminUser, role: "admin", isAdmin: true };
      }
    }

    // 3. Fallback: Parse Supabase native auth token from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const rawSb = localStorage.getItem(key);
        if (rawSb) {
          const parsedSb = JSON.parse(rawSb);
          const sbUser = parsedSb?.user;
          if (sbUser && sbUser.id) {
            const role = sbUser.user_metadata?.role || "customer";
            const isAdmin = role === "admin" || role === "superadmin";
            const mappedUser: CachedUser = {
              uid: sbUser.id,
              id: sbUser.id,
              email: sbUser.email || null,
              displayName: sbUser.user_metadata?.first_name
                ? `${sbUser.user_metadata.first_name} ${sbUser.user_metadata.last_name || ""}`.trim()
                : sbUser.email?.split("@")[0] || null,
              phoneNumber: sbUser.user_metadata?.phone || null,
              role,
              isAdmin,
              user_metadata: sbUser.user_metadata,
            };
            return { user: mappedUser, role, isAdmin };
          }
        }
      }
    }
  } catch (err) {
    console.warn("Auth cache retrieval error:", err);
  }

  return { user: null, role: null, isAdmin: false };
}

export function setCachedAuth(user: CachedUser | null, role?: string): void {
  if (typeof window === "undefined") return;

  try {
    if (!user) {
      clearCachedAuth();
      return;
    }

    const isAdmin =
      role === "admin" ||
      role === "superadmin" ||
      user.role === "admin" ||
      user.role === "superadmin" ||
      user.role_id === 1 ||
      user.role_id === 3 ||
      user.isAdmin === true;

    const payload: CachedUser = {
      ...user,
      uid: user.uid || user.id || "",
      id: user.id || user.uid || "",
      role: role || user.role || (isAdmin ? "admin" : "customer"),
      isAdmin,
      cachedAt: Date.now(),
    };

    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(payload));

    // Sync cookies for server-side / middleware awareness
    if (typeof document !== "undefined") {
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `polaris_auth_session=1; path=/; max-age=${maxAge}; SameSite=Lax`;
      if (isAdmin) {
        document.cookie = `polaris_admin_session=1; path=/; max-age=${maxAge}; SameSite=Lax`;
      }
    }

    if (isAdmin) {
      localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({
          id: payload.uid,
          email: payload.email,
          name: payload.displayName || "Admin",
          role: payload.role,
        })
      );
    }
  } catch (err) {
    console.warn("Auth cache set warning:", err);
  }
}

export function clearCachedAuth(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);

    if (typeof document !== "undefined") {
      document.cookie = "polaris_auth_session=; path=/; max-age=0";
      document.cookie = "polaris_admin_session=; path=/; max-age=0";
    }

    window.dispatchEvent(new Event("polaris_admin_auth_changed"));
    window.dispatchEvent(new Event("polaris_auth_changed"));
  } catch (err) {
    console.warn("Auth cache clear warning:", err);
  }
}

export function getUserRedirectPath(): string | null {
  const { user, isAdmin } = getCachedAuth();
  if (!user) return null;
  return isAdmin ? "/admin" : "/dashboard";
}
