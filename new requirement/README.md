# StoryClue Classic Crossword Engine

Working reference implementation. Hand this folder to Claude Code with CLASSIC_MODE_SPEC.md.
Instruction: "Implement Classic Crossword mode per CLASSIC_MODE_SPEC.md. Port these engine
files into StoryClue's stack — do not rewrite the solver from scratch."

## Architecture (the whole point)
Grid construction = CODE (constraint satisfaction). Clue writing = AI (Claude API).
Never ask the model to build or repair a filled grid.

## Files (load order)
- gridfill2.py  — indexed solver core: slot extraction, letter-position index, base fill
- gridfill4.py  — curated wordlist loader + BLOCKLIST (content safety at the source)
- gridfill6.py  — greedy symmetric block-pattern generator (valid at every step)
- fill_v7.py    — THE working solver: least-constraining-value ordering + forward checking
                  (this LCV version is what made fills succeed — earlier versions timed out)
- run15.py      — orchestration: generate dense patterns, fill, output grid15.json

## Run
    pip install wordfreq --break-system-packages
    python3 run15.py     # produces grid15.json (pattern + across/down answers)

## Two things to carry forward into production
1. TOPIC WEIGHTING — extract answers from the book/topic first, give them priority in the
   solver's candidate ordering. Target >=50% on-topic answers (>=70% for 6+ letter answers).
2. WORDLIST IS A PRODUCT ASSET — the curated, frequency-scored, blocklisted list per audience
   tier. Testing leaked CUCK/ANAL/DUI/REICH past three filters; the blocklist grows forever.

## Dual clue mode
Same grid, two clue sets: Rich (10-25 words, teaching voice, DEFAULT) and Classic (1-6 words,
newspaper brevity). Just two different prompt templates — see CLASSIC_MODE_SPEC.md.

## Performance
Budget: pattern + fill under 5 seconds. LCV ordering is what hits it. If a pattern won't fill
in ~6s, regenerate the pattern rather than grinding — never ship a partial grid.
