import "server-only";

/**
 * Rate-limit contract. Real implementation depends on the chosen backend
 * (Vercel KV, Upstash, etc.) and is out of scope until the intake locks one.
 */
export interface RateLimitInput {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(_input: RateLimitInput): Promise<RateLimitResult> {
  // TODO(F5): wire concrete backend once selected during feature work.
  return { success: true, remaining: Number.POSITIVE_INFINITY, resetAt: 0 };
}
