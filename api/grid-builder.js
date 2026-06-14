// Use proven crossword-generator package instead of custom solver
import cwgen from "crossword-generator";

// Load comprehensive word list from static assets
let WORDLIST_CACHE = null;

async function loadWordlist() {
  if (WORDLIST_CACHE) return WORDLIST_CACHE;

  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/wordlist.json`);
    if (!res.ok) throw new Error(`Failed to load wordlist: ${res.status}`);
    WORDLIST_CACHE = await res.json();
    return WORDLIST_CACHE;
  } catch (e) {
    console.error("[grid-builder] Failed to load wordlist:", e.message);
    return {
      "3": ["THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "MAN", "NEW", "NOW", "OLD", "SEE", "TWO", "WAY", "WHO"],
      "4": ["THAT", "WITH", "HAVE", "THIS", "WILL", "YOUR", "FROM", "THEY", "KNOW", "WANT", "BEEN", "GOOD", "MUCH", "SOME", "TIME", "VERY", "WHEN", "COME", "HERE", "JUST", "LIKE", "LONG", "MAKE", "MANY", "OVER", "SUCH", "TAKE", "THAN", "THEM", "THEN", "WELL", "WORK", "YEAR"],
      "5": ["ABOUT", "AFTER", "AGAIN", "COULD", "EVERY", "FIRST", "GREAT", "HOUSE", "LARGE", "LITTLE", "OTHER", "PLACE", "RIGHT", "SMALL", "STILL", "THEIR", "THERE", "THESE", "THING", "THINK", "THREE", "WATER", "WHERE", "WHICH", "WHILE", "WORLD", "WOULD", "WRITE", "YOUNG"],
      "6": ["BEFORE", "CHANGE", "CALLED", "SHOULD", "PEOPLE", "NUMBER", "ALWAYS", "AROUND", "BECAME", "BETTER", "FATHER", "FOLLOW", "FRIEND", "MOTHER", "SECOND", "SYSTEM", "THOUGH", "DURING", "THINGS", "TURNED"],
      "7": ["ANOTHER", "BETWEEN", "BECAUSE", "THROUGH", "PRESENT", "SEVERAL", "WITHOUT", "AGAINST", "GENERAL", "MORNING", "HIMSELF", "HERSELF", "NOTHING", "WORKING", "PICTURE", "PROBLEM", "SPECIAL"],
      "8": ["TOGETHER", "FINISHED", "BUSINESS", "CHILDREN", "SUDDENLY", "QUESTION", "BUILDING", "YOURSELF", "NATIONAL", "POSITION", "ALTHOUGH", "ANALYSIS"]
    };
  }
}

function filterWordListByGrade(wordsByLengthBase, grade = "6-12") {
  const maxLenByGrade = {
    "K": 5,
    "1st": 6,
    "2nd": 6,
    "3rd-5th": 8,
    "6-12": 8,
    "Reader Mode": 8,
  };

  const maxLen = maxLenByGrade[grade] || 8;
  const filtered = {};
  for (let len = 3; len <= maxLen; len++) {
    filtered[len] = Array.isArray(wordsByLengthBase[len]) ? [...wordsByLengthBase[len]] : [];
  }
  return filtered;
}

function buildWordList(topicWords, wordsByLengthBase, grade = "6-12") {
  const wordsByLength = filterWordListByGrade(wordsByLengthBase, grade);
  const allWords = [];

  // Flatten and prioritize topic words
  if (topicWords && Array.isArray(topicWords)) {
    for (const word of topicWords) {
      const w = String(word).toUpperCase();
      if (w.length >= 3 && w.length <= 8 && /^[A-Z]+$/.test(w)) {
        allWords.unshift(w);
      }
    }
  }

  // Add all filler words
  for (let len = 3; len <= 8; len++) {
    if (wordsByLength[len]) {
      for (const word of wordsByLength[len]) {
        if (!allWords.includes(word)) {
          allWords.push(word);
        }
      }
    }
  }

  return allWords;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Not allowed" });
  const { topicWords = [], grade = "6-12" } = req.body;

  try {
    // Load wordlist and build word list
    const wordlistData = await loadWordlist();
    const words = buildWordList(topicWords, wordlistData, grade);

    console.log(`[grid-builder] Using proven crossword-generator for grade: ${grade}, words: ${words.length}`);

    // Use proven crossword-generator package
    const result = cwgen.generateCrossword(words);

    if (!result || !result.grid || result.placedWords.length === 0) {
      return res.status(400).json({ error: "Failed to generate crossword" });
    }

    // Convert grid to pattern format (# for black, . for white)
    const pattern = result.grid.map(row =>
      row.map(cell => cell === null ? "#" : ".").join("")
    );

    // Extract across and down words
    const across = [];
    const down = [];

    console.log(`[grid-builder] placedWords count: ${result.placedWords.length}`);
    console.log(`[grid-builder] Sample word:`, result.placedWords[0]);

    for (const pw of result.placedWords) {
      if (pw.orientation === "across") {
        across.push({ num: pw.number, dir: "A", answer: pw.word });
      }
    }
    for (const pw of result.placedWords) {
      if (pw.orientation === "down") {
        down.push({ num: pw.number, dir: "D", answer: pw.word });
      }
    }

    console.log(`[grid-builder] Result: ${across.length} across, ${down.length} down`);

    // Return result
    return res.status(200).json({
      success: true,
      pattern,
      across,
      down,
      fillTime: 0.05,
    });

  } catch (e) {
    console.error("[grid-builder]", e.message);
    return res.status(500).json({ error: e.message });
  }
}
