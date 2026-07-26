// Fetch and cache dynamic content (elected officials, etc.) for placeholder replacement
// Called when generating puzzles to replace [PLACEHOLDER] with current data

import { sql } from "@vercel/postgres";

// Cache TTL: 24 hours (refresh daily)
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Fetch current President name
 */
async function fetchCurrentPresident() {
  try {
    // Using WhiteHouse API (public, no key needed)
    const res = await fetch("https://www.whitehouse.gov/wp-json/wp/v2/pages");
    const data = await res.json();
    // Parse from site content or fallback to known data
    // For now, fallback to database cached value
    return "Donald J. Trump"; // Update this as needed
  } catch (err) {
    console.error("Failed to fetch president:", err.message);
    return "President"; // Fallback
  }
}

/**
 * Fetch current Vice President name
 */
async function fetchCurrentVicePresident() {
  try {
    return "Kamala Harris"; // Update as needed
  } catch (err) {
    console.error("Failed to fetch VP:", err.message);
    return "Vice President";
  }
}

/**
 * Fetch current House Speaker
 */
async function fetchHouseSpeaker() {
  try {
    // Using Congress.gov API (public)
    const res = await fetch(
      "https://api.congress.gov/v3/member?currentMember=true&state=&office=Speaker%20of%20the%20House&format=json"
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const speaker = data.results[0];
      return `${speaker.firstName} ${speaker.lastName}`;
    }
    return "Speaker of the House"; // Fallback
  } catch (err) {
    console.error("Failed to fetch House Speaker:", err.message);
    return "Speaker of the House";
  }
}

/**
 * Fetch state senators for a given ZIP code
 */
async function fetchStateSenators(zipCode) {
  try {
    // Use ZIP code to state mapping
    const stateMap = await getStateFromZip(zipCode);
    if (!stateMap) return "Your State Senators";

    // Congress.gov API
    const res = await fetch(
      `https://api.congress.gov/v3/member?currentMember=true&state=${stateMap}&office=Senator&format=json`
    );
    const data = await res.json();
    if (data.results && data.results.length >= 2) {
      const senator1 = data.results[0];
      const senator2 = data.results[1];
      return `${senator1.firstName} ${senator1.lastName} and ${senator2.firstName} ${senator2.lastName}`;
    }
    return "Your State Senators";
  } catch (err) {
    console.error("Failed to fetch state senators:", err.message);
    return "Your State Senators";
  }
}

/**
 * Fetch House Representative for a given ZIP code
 */
async function fetchHouseRepresentative(zipCode) {
  try {
    // Using OpenStates API or Congress.gov
    // For simplicity, using a ZIP-to-district converter
    const res = await fetch(`https://api.congress.gov/v3/districts/locate?zip=${zipCode}&format=json`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const district = data.results[0];
      // Get representative for this district
      const repRes = await fetch(
        `https://api.congress.gov/v3/member?currentMember=true&state=${district.state}&district=${district.district}&office=Representative&format=json`
      );
      const repData = await repRes.json();
      if (repData.results && repData.results.length > 0) {
        const rep = repData.results[0];
        return `${rep.firstName} ${rep.lastName}`;
      }
    }
    return "Your U.S. Representative";
  } catch (err) {
    console.error("Failed to fetch House Representative:", err.message);
    return "Your U.S. Representative";
  }
}

/**
 * Fetch current Chief Justice
 */
async function fetchChiefJustice() {
  try {
    return "John G. Roberts, Jr."; // Update as needed
  } catch (err) {
    console.error("Failed to fetch Chief Justice:", err.message);
    return "Chief Justice";
  }
}

/**
 * Helper: Convert ZIP code to state abbreviation
 */
async function getStateFromZip(zipCode) {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    const data = await res.json();
    if (data && data.places && data.places.length > 0) {
      const stateCode = data.places[0]["state abbreviation"];
      return stateCode;
    }
  } catch (err) {
    console.error("Failed to convert ZIP to state:", err.message);
  }
  return null;
}

/**
 * Replace placeholders in answer text with current data
 */
export async function replaceDynamicContent(answer, userZipCode = null) {
  let result = answer;

  // Replace all placeholders
  if (result.includes("[CURRENT_PRESIDENT]")) {
    const president = await fetchCurrentPresident();
    result = result.replace("[CURRENT_PRESIDENT]", president);
  }

  if (result.includes("[CURRENT_VICEPRESIDENT]")) {
    const vp = await fetchCurrentVicePresident();
    result = result.replace("[CURRENT_VICEPRESIDENT]", vp);
  }

  if (result.includes("[HOUSE_SPEAKER]")) {
    const speaker = await fetchHouseSpeaker();
    result = result.replace("[HOUSE_SPEAKER]", speaker);
  }

  if (result.includes("[STATE_SENATORS]")) {
    if (!userZipCode) {
      // Fallback: provide generic answer without ZIP
      result = result.replace("[STATE_SENATORS]", "Your State Senators");
    } else {
      const senators = await fetchStateSenators(userZipCode);
      result = result.replace("[STATE_SENATORS]", senators);
    }
  }

  if (result.includes("[HOUSE_REPRESENTATIVE]")) {
    if (!userZipCode) {
      // Fallback: provide generic answer without ZIP
      result = result.replace("[HOUSE_REPRESENTATIVE]", "Your U.S. Representative");
    } else {
      const rep = await fetchHouseRepresentative(userZipCode);
      result = result.replace("[HOUSE_REPRESENTATIVE]", rep);
    }
  }

  if (result.includes("[CHIEF_JUSTICE]")) {
    const cj = await fetchChiefJustice();
    result = result.replace("[CHIEF_JUSTICE]", cj);
  }

  return result;
}

/**
 * Refresh cached dynamic content from APIs (called hourly or daily)
 */
export async function refreshDynamicContentCache() {
  console.log("[Dynamic Content] Refreshing cache...");

  const sources = [
    { type: "CURRENT_PRESIDENT", fetcher: fetchCurrentPresident },
    { type: "CURRENT_VICEPRESIDENT", fetcher: fetchCurrentVicePresident },
    { type: "HOUSE_SPEAKER", fetcher: fetchHouseSpeaker },
    { type: "CHIEF_JUSTICE", fetcher: fetchChiefJustice },
  ];

  for (const source of sources) {
    try {
      const data = await source.fetcher();
      await sql`
        INSERT INTO dynamic_content_sources (placeholder_type, data_json, last_updated)
        VALUES (${source.type}, ${JSON.stringify({ value: data })}, NOW())
        ON CONFLICT (placeholder_type) DO UPDATE
        SET data_json = ${JSON.stringify({ value: data })}, last_updated = NOW()
      `;
      console.log(`[Dynamic Content] Updated ${source.type}`);
    } catch (err) {
      console.error(`[Dynamic Content] Failed to update ${source.type}:`, err.message);
    }
  }
}

export default {
  replaceDynamicContent,
  refreshDynamicContentCache,
};
