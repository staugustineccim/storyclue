# StoryClue Classic Crossword — Format Specification (v1)

**Status: Approved by Bob — June 12, 2026. This is the locked format for Classic mode. Do not deviate without explicit approval.**

## Architecture (non-negotiable)

Grid construction and clue writing are SEPARATE systems:

1. **Grid fill = code, not AI.** Constraint-satisfaction engine builds the grid. Never ask the LLM to generate or repair a filled grid.
2. **Clues = AI (Claude API).** The model receives the finished answer list and writes clues only.

Reference implementation (working, tested): `gridfill2.py` (indexed solver core), `gridfill4.py` (curated wordlist + blocklist), `gridfill6.py` (greedy symmetric pattern generator), `fill_v7.py` (least-constraining-value solver — this version is the one that works), `run15.py` (orchestration). Port these; do not rewrite from scratch.

## Grid rules (NYT standard)

- 15×15 (Classic), 180° rotational symmetry
- Every letter checked (appears in both an Across and a Down answer)
- Minimum word length 3; maximum word count 78; blocks ~32–42
- Max slot length 8–9 (keeps fill fast and quality high)
- All white squares connected
- Performance budget: pattern generation + fill **under 5 seconds**. Use LCV candidate ordering + forward checking + random restarts (4 × 6s caps). If no fill, regenerate pattern — never ship a partial grid.

## Topic coherence (CORE REQUIREMENT — this is what makes it StoryClue)

The majority of each puzzle must stay on topic, and clues must reference the source material whenever possible. Good writers expand on a subject; so do good StoryClue puzzles.

1. **Topic answer extraction (AI step, before fill).** From the source text/book/topic, Claude extracts a candidate answer list: characters, places, objects, vocabulary, and concepts — 3 to 9 letters, deduplicated, safety-filtered. This becomes the **topic wordlist**.
2. **Topic-weighted fill (code step).** Solver uses two tiers: topic words get a large priority boost in candidate ordering; the general curated list is connective glue only. Long slots (6+ letters) are the most visible real estate — fill them from the topic list first.
3. **QA gate: topic ratio.** Target ≥50% of answers on-topic, and ≥70% of answers of 6+ letters on-topic. Log the ratio on every build; if below target, regenerate the pattern/fill rather than shipping an off-topic grid.
4. **Clue sourcing rule.** If the answer appears in or relates to the source, the clue MUST come from the source context (the book mentions a city → clue it from the book's scene there, not generic geography). If the answer is glue fill: neutral clue, tied back to the topic whenever it can be done naturally.

## Wordlist (first-class asset, owned by Claude Code per standing content-safety rule)

- Frequency-scored base list (~50K words), tiered zipf floors by length (3-letter words need the highest familiarity floor — short junk fill is the #1 quality killer)
- **Blocklist is mandatory and grows forever.** Testing leaked CUCK, ANAL, DUI, REICH past three successive filters. Maintain `blocklist.txt` per audience tier (kids / general / Reader Mode). Every word in every generated grid passes the content safety filter BEFORE clue generation.
- No answer repeats within a puzzle.

## Clue mode (TWO options — user-selectable)

Every puzzle supports two clue sets generated from the same grid. The user picks via a toggle; the grid never changes, only which clue set is requested from the model.

- **Rich mode (DEFAULT).** StoryClue's longer teaching voice, 10–25 words. The product's signature. Spec below.
- **Classic mode.** Tight newspaper-style clues, terse fragments, NYT brevity (typically 1–6 words). For experienced solvers who want a crisp puzzle.

Implementation: store both clue sets with the puzzle (one extra API call at generation time) OR generate on demand when the user flips the toggle. Default the UI to Rich. The toggle label: "Clue style: Rich / Classic."

## Rich clue format (Bob's locked style — this is the default and overrides NYT brevity)

StoryClue Rich clues are LONGER and richer than newspaper clues. This is intentional and is the product's voice.

- **Length: roughly 10–25 words.** A full phrase or sentence, not a terse fragment.
- **Teach something.** Where natural, include one piece of real context — a fact, origin, or connection. ("This Belgian port city on the Scheldt River has been the center of the world's diamond trade for over 500 years" → ANTWERP)
- **Stay solvable.** The added words must point toward the answer, not pad around it. No trivia so obscure it stops helping.
- **Grade-adaptive.** Classic mode uses Reader Mode register by default; if a grade level is set, vocabulary and references must match it (existing StoryClue grade rules apply).
- **Never include the answer or a form of it in the clue.**
- Proper-name answers get identifying context, not bare fill-in-the-blanks, unless the blank itself is the friendliest path.

### Rich clue prompt template (Claude API call — default)

> You are writing crossword clues for StoryClue. SOURCE MATERIAL: {full text or detailed summary of the book/topic}. For each answer below, write one clue of 10–25 words in a warm, literate, lightly teaching voice. PRIORITY RULE: if the answer appears in or connects to the source material, the clue MUST reference the source — its scenes, characters, or facts — not generic knowledge. Only answers with no source connection get neutral clues, and even those should nod to the topic when natural. Never use the answer word or its root in the clue. Audience/grade: {tier}. Return JSON: [{"num":n,"dir":"A|D","answer":"WORD","clue":"...","on_topic":true|false}]. Answers: {list}

### Classic clue prompt template (Claude API call — optional mode)

> You are writing crossword clues for StoryClue in CLASSIC newspaper style. SOURCE MATERIAL: {summary}. For each answer below, write one tight clue, typically 1–6 words, in the terse style of a major daily crossword — a definition, synonym, or crisp fill-in-the-blank. If the answer ties to the source, lean on the source reference but keep it short. Never use the answer word or its root in the clue. Audience/grade: {tier}. Return JSON: [{"num":n,"dir":"A|D","answer":"WORD","clue":"...","on_topic":true|false}]. Answers: {list}

## Presentation layout (locked — Bob approved this render)

Use the layout from `storyclue-classic-15x15-demo.html`:
- Paper background, double-rule masthead, forest-green accent (StoryClue brand), Georgia serif body, Verdana utility
- CSS-grid puzzle, black blocks, small corner numbers, hidden letters with Reveal Solution toggle
- Two-column Across/Down clue lists (single column on mobile), answers right-aligned and hidden until reveal
- Spec line under the title: size · word count · block count · symmetry · fill time

## QA gates before a puzzle ships

1. Symmetry, connectivity, min-length, checked-letter validation (automated)
2. Topic ratio: ≥50% of all answers on-topic, ≥70% of 6+ letter answers on-topic (regenerate if below)
3. Every answer passes audience-tier blocklist
4. Every clue passes content safety filter and the no-answer-leak check
5. Fill time logged; alert if > 5s
