// Generate small crossword puzzles (7×7) using CSP solver
import { Anthropic } from "@anthropic-ai/sdk";
import CSPSolver from "./csp-solver.js";
import { generateGrid, findSlots } from "./grid-generator.js";

const client = new Anthropic();

// Base word list for filling
const WORD_LIST = {
  3: ['THE', 'AND', 'FOR', 'ARE', 'YOU', 'ALL', 'NOT', 'BUT', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE'],
  4: ['THAT', 'WITH', 'HAVE', 'THIS', 'WILL', 'YOUR', 'FROM', 'THEY', 'KNOW', 'WANT', 'BEEN', 'GOOD', 'MUCH', 'SOME', 'TIME', 'VERY', 'WHEN', 'COME', 'HERE', 'JUST', 'LIKE', 'LONG', 'MAKE', 'MANY', 'OVER', 'SUCH', 'TAKE', 'THAN', 'THEM', 'THEN', 'WELL', 'WORK', 'YEAR'],
  5: ['ABOUT', 'AFTER', 'AGAIN', 'COULD', 'EVERY', 'FIRST', 'GREAT', 'HOUSE', 'LARGE', 'LITTLE', 'OTHER', 'PLACE', 'RIGHT', 'SMALL', 'STILL', 'THEIR', 'THERE', 'THESE', 'THING', 'THINK', 'THREE', 'WATER', 'WHERE', 'WHICH', 'WHILE', 'WORLD', 'WOULD', 'WRITE', 'YOUNG', 'STORY', 'MUSIC', 'PLANT', 'QUICK', 'SMILE'],
  6: ['BEFORE', 'CHANGE', 'CALLED', 'SHOULD', 'PEOPLE', 'NUMBER', 'ALWAYS', 'AROUND', 'BECAME', 'BETTER', 'FATHER', 'FOLLOW', 'FRIEND', 'MOTHER', 'SECOND', 'SYSTEM', 'THOUGH', 'DURING', 'THINGS', 'TURNED'],
  7: ['ANOTHER', 'BETWEEN', 'BECAUSE', 'THROUGH', 'PRESENT', 'SEVERAL', 'WITHOUT', 'AGAINST', 'GENERAL', 'MORNING', 'HIMSELF', 'HERSELF', 'NOTHING', 'WORKING', 'PICTURE', 'PROBLEM', 'SPECIAL', 'CHAPTER'],
  8: ['TOGETHER', 'FINISHED', 'BUSINESS', 'CHILDREN', 'SUDDENLY', 'QUESTION', 'BUILDING', 'YOURSELF', 'NATIONAL', 'POSITION', 'ALTHOUGH', 'ANALYSIS']
};

// Generate topic words using Claude
async function generateTopicWords(content, grade = "6") {
  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Extract 40 key vocabulary words from this content for a crossword puzzle.

Content: "${content}"

Return ONLY a comma-separated list of words (3-8 letters), no other text.
Make them crossword-friendly and related to the content.

Format: WORD1, WORD2, WORD3, ...`
        }
      ]
    });

    const text = message.content[0].text;
    const words = text
      .split(',')
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length >= 3 && w.length <= 8 && /^[A-Z]+$/.test(w));

    return words.slice(0, 40);
  } catch (error) {
    console.error("[generate-crossword] Error generating topic words:", error.message);
    return [];
  }
}

// Generate clues using Claude
async function generateClues(answers) {
  try {
    const answerList = answers.map(a => a.answer).join(', ');
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Generate brief crossword clues for these words: ${answerList}

Return one line per word in format: WORD: clue
Make clues 5-15 words max.
Be engaging but not obscure.`
        }
      ]
    });

    const clues = {};
    const lines = message.content[0].text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const [word, clue] = line.split(':').map(s => s.trim());
      if (word && clue) {
        clues[word] = clue;
      }
    }
    return clues;
  } catch (error) {
    console.error("[generate-crossword] Error generating clues:", error.message);
    return {};
  }
}

// Build word list by length
function buildWordsByLength(topicWords) {
  const byLength = {};

  // Start with base dictionary
  for (const len in WORD_LIST) {
    byLength[len] = [...WORD_LIST[len]];
  }

  // Add topic words at front (higher priority)
  for (const word of topicWords) {
    const len = word.length;
    if (!byLength[len]) byLength[len] = [];
    if (!byLength[len].includes(word)) {
      byLength[len].unshift(word);
    }
  }

  return byLength;
}

// Main handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { content = "", grade = "6", gridSize = 7 } = req.body;

  if (!content || content.trim().length < 10) {
    return res.status(400).json({ error: "Content too short (minimum 10 characters)" });
  }

  try {
    console.log(`[generate-crossword] Generating ${gridSize}×${gridSize} puzzle for grade ${grade}`);

    // Step 1: Generate topic words
    console.log(`[generate-crossword] Getting topic words...`);
    const topicWords = await generateTopicWords(content, grade);
    console.log(`[generate-crossword] Generated ${topicWords.length} topic words`);

    // Step 2: Generate grid
    console.log(`[generate-crossword] Generating grid...`);
    const grid = generateGrid(gridSize);
    const { across, down } = findSlots(grid);
    console.log(`[generate-crossword] Found ${across.length} across, ${down.length} down slots`);

    // Step 3: Build word list
    const wordsByLength = buildWordsByLength(topicWords);

    // Step 4: Solve with CSP
    console.log(`[generate-crossword] Running solver...`);
    const solver = new CSPSolver(grid, across, down, wordsByLength);
    const puzzle = solver.run();

    if (!puzzle) {
      console.warn(`[generate-crossword] Failed to fill grid (${solver.iterations} iterations)`);
      return res.status(500).json({
        error: "Could not generate puzzle grid. Try different content or larger grid size.",
        iterations: solver.iterations
      });
    }

    console.log(`[generate-crossword] Grid filled in ${solver.iterations} iterations`);

    // Step 5: Generate clues
    console.log(`[generate-crossword] Generating clues...`);
    const allAnswers = [...puzzle.answers.across, ...puzzle.answers.down];
    const clues = await generateClues(allAnswers);

    // Add clues to puzzle
    for (const answer of allAnswers) {
      const clueText = clues[answer.answer] || `Crossword clue`;
      puzzle.clues[`${answer.num}${answer.direction === 'across' ? 'A' : 'D'}`] = clueText;
    }

    console.log(`[generate-crossword] ✓ Puzzle generated successfully`);

    return res.status(200).json({
      success: true,
      puzzle: {
        ...puzzle,
        gridSize,
        grade,
        stats: {
          wordCount: allAnswers.length,
          blockCount: grid.flat().filter(c => c === '#').length,
          fillTime: solver.iterations / 10, // Rough estimate
          topicWordsUsed: topicWords.length
        }
      }
    });

  } catch (error) {
    console.error("[generate-crossword]", error.message);
    return res.status(500).json({ error: error.message || "Failed to generate crossword" });
  }
}
