import { generateToken, storeToken } from "./csrf.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = generateToken();
    await storeToken(token);

    // Set SameSite=Strict on cookies for CSRF protection
    res.setHeader("Set-Cookie", `csrf=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600; Path=/`);

    return res.status(200).json({ csrfToken: token });
  } catch (error) {
    console.error("CSRF token generation failed:", error);
    return res.status(500).json({ error: "Failed to generate CSRF token" });
  }
}
