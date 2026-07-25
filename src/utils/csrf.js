let cachedToken = null;

export async function getCSRFToken() {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  try {
    const res = await fetch("/api/csrf-token");
    if (res.ok) {
      const data = await res.json();
      cachedToken = data.csrfToken;
      return cachedToken;
    }
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
  }

  // If token fetch fails, return null - requests will fail with 403
  return null;
}

export function clearToken() {
  cachedToken = null;
}

export async function withCSRFToken(body) {
  const token = await getCSRFToken();
  return {
    ...body,
    csrfToken: token,
  };
}

// Add CSRF token to fetch headers
export async function fetchWithCSRF(url, options = {}) {
  const token = await getCSRFToken();

  const headers = {
    "Content-Type": "application/json",
    "X-CSRF-Token": token || "",
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
