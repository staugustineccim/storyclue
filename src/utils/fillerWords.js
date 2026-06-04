// ── Grade-appropriate filler words for Classic Crossword second pass ──────────
// Update 5 — used when puzzleStyle = "classic" for 6th grade and above.
// Clues for filler words are simple grade-appropriate definitions NOT connected
// to the puzzle theme.
//
// K–5: no filler words (Topic Focus only — this file is never called for those grades).
// 6th–8th: common words an 8th grader knows
// 9th–12th: words a high schooler knows
// Reader Mode: common adult vocabulary

export const FILLER_WORDS = {
  "middle": [
    { word: "AREA",  clue: "A region or section of space" },
    { word: "OPEN",  clue: "Not closed; available to enter" },
    { word: "IDEA",  clue: "A thought or plan in your mind" },
    { word: "EDGE",  clue: "The outer boundary of something" },
    { word: "EVEN",  clue: "Flat and level; also means fair" },
    { word: "IRON",  clue: "A strong metal; also smooths clothes" },
    { word: "ABLE",  clue: "Having the power or skill to do something" },
    { word: "AGED",  clue: "Having grown old over time" },
    { word: "ELSE",  clue: "In addition; other than what was mentioned" },
    { word: "OVER",  clue: "Above or finished; done" },
    { word: "ALSO",  clue: "In addition; too" },
    { word: "ONLY",  clue: "Just one; nothing more" },
    { word: "BOTH",  clue: "The two together; not just one" },
    { word: "SUCH",  clue: "Of this kind or degree" },
    { word: "MANY",  clue: "A large number of things or people" },
    { word: "GIVE",  clue: "To hand something to another person" },
    { word: "LIVE",  clue: "To be alive; to make your home somewhere" },
    { word: "MOVE",  clue: "To go from one place to another" },
    { word: "WORK",  clue: "Effort put toward a task or job" },
    { word: "TURN",  clue: "To rotate or change direction" },
  ],
  "high": [
    { word: "STORY", clue: "A narrative account of events" },
    { word: "PLACE", clue: "A particular location or position" },
    { word: "LIGHT", clue: "Illumination; the opposite of darkness" },
    { word: "WATER", clue: "The clear liquid essential to life" },
    { word: "POWER", clue: "The ability to act or influence events" },
    { word: "WORLD", clue: "The earth and all its people and places" },
    { word: "HUMAN", clue: "Relating to people; of or for mankind" },
    { word: "CIVIL", clue: "Relating to citizens or polite conduct" },
    { word: "MORAL", clue: "Concerned with right and wrong behavior" },
    { word: "LOGIC", clue: "Reasoning based on sound principles" },
    { word: "TRUTH", clue: "A statement that matches reality" },
    { word: "BRAVE", clue: "Showing courage in the face of danger" },
    { word: "NOBLE", clue: "Having high moral character; dignified" },
    { word: "VITAL", clue: "Absolutely necessary; essential" },
    { word: "CLEAR", clue: "Easy to understand; transparent" },
    { word: "SHARP", clue: "Having a fine edge; quick-witted" },
    { word: "BROAD", clue: "Wide in extent; covering many things" },
    { word: "SOLID", clue: "Firm and stable; not hollow" },
    { word: "SOUND", clue: "Free from error; also a noise you hear" },
    { word: "FLUID", clue: "Able to flow freely; not fixed" },
  ],
  "adult": [
    { word: "PROSE",  clue: "Written language in ordinary form, not verse" },
    { word: "NOVEL",  clue: "A book-length work of fiction" },
    { word: "VERSE",  clue: "Writing arranged in rhythmic lines; poetry" },
    { word: "SCENE",  clue: "A sequence of action in a play or story" },
    { word: "THEME",  clue: "The central subject or message of a work" },
    { word: "VALOR",  clue: "Great bravery in the face of danger" },
    { word: "GRACE",  clue: "Elegance and ease of movement or manner" },
    { word: "IRONY",  clue: "When words mean the opposite of what is said" },
    { word: "DRAMA",  clue: "A play; also intense or exciting events" },
    { word: "HONOR",  clue: "Great respect or high moral character" },
    { word: "SWIFT",  clue: "Moving or happening very quickly" },
    { word: "POISE",  clue: "Calm confidence in manner and bearing" },
    { word: "CRAFT",  clue: "Skill and artistry in making something" },
    { word: "DEPTH",  clue: "The quality of being deep or profound" },
    { word: "SCOPE",  clue: "The range or extent of something" },
    { word: "TENOR",  clue: "The general meaning or tone of something" },
    { word: "VIVID",  clue: "Producing strong, clear mental images" },
    { word: "LUCID",  clue: "Clear and easy to understand" },
    { word: "TERSE",  clue: "Brief and direct; using few words" },
    { word: "VITAL",  clue: "Absolutely essential; full of energy" },
  ],
};

// Map grade keys to filler tier
function getFillerTier(grade) {
  if (grade === "adult") return "adult";
  if (["9-10","11-12"].includes(String(grade))) return "high";
  if (["6","7","8"].includes(String(grade))) return "middle";
  return null; // K–5 never get filler words
}

// Returns an array of filler word objects [{word, clue}] for a given grade.
// Returns only as many as needed (numFiller), shuffled so repeats vary.
export function getFillerWords(grade, numFiller = 8) {
  const tier = getFillerTier(grade);
  if (!tier) return [];
  const pool = [...FILLER_WORDS[tier]];
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, numFiller);
}
