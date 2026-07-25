import { generateToken, storeToken } from "./csrf.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = generateToken();
    await storeToken(token);

    // Return token — no cookie needed (token returned in JSON response)
    return res.status(200).json({ csrfToken: token });
  } catch (error) {
    console.error("CSRF token generation or storage failed:", error);
    return res.status(500).json({ error: "Failed to generate CSRF token", details: error.message });
  }
}
