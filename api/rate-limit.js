import { kv } from "@vercel/kv";

const FREE_TIER_LIMIT = 10; // 10 requests per minute
const PREMIUM_TIER_LIMIT = 60; // 60 requests per minute
const RATE_LIMIT_WINDOW = 60; // seconds

// ── Admin Whitelist ────────────────────────────────────────────────────────────
// Add IP addresses here to exempt from rate limiting. Format: "XXX.XXX.XXX.XXX"
// Update this list to grant extended access to testers like Phyllis.
// Redeploy after adding/removing IPs.
const WHITELISTED_IPS = [
  // "192.168.1.100", // Example: Phyllis's IP (replace with actual IP)
];

// Get client IP address (works with Vercel)
function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
         req.headers["x-real-ip"] ||
         req.socket?.remoteAddress ||
         "unknown";
}

// Check rate limit for an IP or user
export async function checkRateLimit(req, isPremium = false) {
  const clientIP = getClientIP(req);

  // Skip rate limiting for whitelisted IPs (testers, admins, etc.)
  if (WHITELISTED_IPS.includes(clientIP)) {
    return {
      allowed: true,
      current: 1,
      limit: Infinity,
      remaining: Infinity,
      resetIn: 0,
      whitelisted: true,
    };
  }

  const key = `rate-limit:${clientIP}`;
  const limit = isPremium ? PREMIUM_TIER_LIMIT : FREE_TIER_LIMIT;

  try {
    const current = await kv.incr(key);

    // Set expiry on first request in the window
    if (current === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW);
    }

    return {
      allowed: current <= limit,
      current,
      limit,
      remaining: Math.max(0, limit - current),
      resetIn: RATE_LIMIT_WINDOW,
    };
  } catch (err) {
    console.error("Rate limit check failed:", err);
    // If KV fails, allow the request (don't break the app)
    return { allowed: true, current: 1, limit, remaining: limit - 1, resetIn: RATE_LIMIT_WINDOW };
  }
}

// Return a 429 response with rate limit headers
export function tooManyRequests(res, rateInfo) {
  res.setHeader("X-RateLimit-Limit", rateInfo.limit.toString());
  res.setHeader("X-RateLimit-Current", rateInfo.current.toString());
  res.setHeader("X-RateLimit-Remaining", rateInfo.remaining.toString());
  res.setHeader("X-RateLimit-Reset", (Math.floor(Date.now() / 1000) + rateInfo.resetIn).toString());
  res.setHeader("Retry-After", rateInfo.resetIn.toString());

  return res.status(429).json({
    error: "Too many requests. Please try again later.",
    retryAfter: rateInfo.resetIn,
    rateLimit: {
      limit: rateInfo.limit,
      current: rateInfo.current,
      remaining: rateInfo.remaining,
      resetIn: rateInfo.resetIn,
    },
  });
}
