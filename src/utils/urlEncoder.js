// Encodes puzzle data to a URL-safe base64 string and back.
// Puzzle shape: { title, grade, rows, cols, words: [{answer, clue, orientation, startx, starty, number}] }

export function encodePuzzle(puzzleData) {
  const json = JSON.stringify(puzzleData);
  // btoa needs latin1; encodeURIComponent handles unicode
  const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  ));
  // Make URL-safe
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function decodePuzzle(encoded) {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
    const json = decodeURIComponent(
      atob(padded).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
