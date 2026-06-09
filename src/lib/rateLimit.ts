import { createClient } from "@/lib/supabase/server";

export interface RateLimitResult {
  allowed: boolean;
}

/**
 * Check and atomically increment the per-user rate limit for an endpoint.
 * Uses the check_rate_limit Postgres function so the read+write is atomic.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests = 5,
  windowSeconds = 60
): Promise<RateLimitResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    // On DB error, allow the request rather than blocking legitimate users
    console.error("[rateLimit] RPC error:", error.message);
    return { allowed: true };
  }

  return { allowed: data === true };
}

export function rateLimitResponse() {
  return Response.json(
    { error: "Too many requests. Please wait a minute and try again." },
    { status: 429, headers: { "Retry-After": "60" } }
  );
}
