import crypto from "crypto";
import { kv } from "@vercel/kv";

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 3600; // 1 hour in seconds

// Generate a random CSRF token
export function generateToken() {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

// Store token in Redis (via Vercel KV) with expiry
export async function storeToken(token) {
  try {
    await kv.setex(`csrf:${token}`, CSRF_TOKEN_EXPIRY, "1");
  } catch (err) {
    console.error("Failed to store CSRF token:", err);
    // If KV fails, token validation will fail - this is intentional (fail secure)
  }
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
      return res.status(403).json({ error: "CSRF token missing" });
    }

    const isValid = await validateToken(token);
    if (!isValid) {
      return res.status(403).json({ error: "CSRF token invalid or expired" });
    }
  }

  return null; // No error, proceed
}
