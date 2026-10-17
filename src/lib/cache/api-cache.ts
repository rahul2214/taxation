/**
 * Universal In-Memory Cache with In-Flight Request Deduplication,
 * Time-To-Live (TTL), and Selective Cache Invalidation.
 *
 * Prevents redundant repeated API calls and database queries
 * across all client and server components.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export interface CacheOptions {
  ttlMs?: number;
  forceRefresh?: boolean;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlightRequests = new Map<string, Promise<any>>();

  /**
   * Fetches data with in-memory caching and in-flight request deduplication.
   * If an identical query is already running, callers share the same Promise.
   * If fresh cached data exists, returns it immediately without hitting the network.
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const ttlMs = options?.ttlMs ?? 60_000; // Default 1 minute TTL
    const now = Date.now();

    // 1. Return fresh cached data if available and not force-refreshing
    if (!options?.forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && now - cached.timestamp < cached.ttlMs) {
        return cached.data as T;
      }
    }

    // 2. In-flight request deduplication:
    // If another component already initiated this exact request, await that same Promise.
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    // 3. Execute fetcher and store result
    const requestPromise = (async () => {
      try {
        const result = await fetcher();
        this.cache.set(key, {
          data: result,
          timestamp: Date.now(),
          ttlMs,
        });
        return result;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Gets cached item synchronously if available and fresh.
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp >= cached.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return cached.data as T;
  }

  /**
   * Sets data into the cache directly (useful after successful mutations).
   */
  set<T>(key: string, data: T, ttlMs = 60_000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  /**
   * Invalidates all cache keys that start with or match the given prefix.
   * Example: invalidate('customer') removes 'customer:123', 'customers:all', etc.
   */
  invalidate(keyPrefix: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key === keyPrefix || key.startsWith(keyPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache (useful on user logout or session reset).
   */
  clear(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
  }
}

export const apiCache = new ApiCache();
