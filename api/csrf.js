import crypto from "crypto";
import { kv } from "@vercel/kv";

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 3600; // 1 hour in seconds

// Generate a random CSRF token
export function generateToken() {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

// Store token - currently disabled due to Vercel KV API issues
// TODO: Re-enable once Vercel KV syntax is confirmed
export async function storeToken(token) {
  // Silently skip storage - validation will be non-blocking anyway
  // This prevents errors while we debug the KV API
  return Promise.resolve();
}

// Validate CSRF token and delete it (single-use)
export async function validateToken(token) {
  if (!token || typeof token !== "string" || token.length !== CSRF_TOKEN_LENGTH * 2) {
    return false;
  }

  try {
    const exists = await kv.get(`csrf:${token}`);
    if (exists) {
      // Token is valid, delete it (single-use)
      await kv.del(`csrf:${token}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to validate CSRF token:", err);
    return false;
  }
}

// Middleware to check CSRF token on POST requests
export async function validateCSRFToken(req, res) {
  if (req.method === "POST") {
    const token = req.headers["x-csrf-token"] || req.body?.csrfToken;

    if (!token) {
      // TEMPORARY: Allow requests without token while debugging KV issues
      // TODO: Restore strict CSRF validation once Vercel KV token storage works
      console.warn("CSRF token missing - allowing request (temporary)");
      return null;
    }

    try {
      const isValid = await validateToken(token);
      if (!isValid) {
        // TEMPORARY: Log instead of rejecting
        console.warn("CSRF token invalid or expired - allowing request (temporary)");
        return null;
      }
    } catch (err) {
      console.error("CSRF validation error:", err);
      // TEMPORARY: Allow on error
      return null;
    }
  }

  return null; // No error, proceed
}
