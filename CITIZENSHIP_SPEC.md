# StoryClue Citizenship Mastery — Product Specification

**Version:** 1.0  
**Date:** July 26, 2026  
**Status:** Ready for Development

---

## 1. PRODUCT VISION

StoryClue Citizenship Mastery is a **free, pedagogically rigorous citizenship test preparation system** that combines:
- Adaptive crossword puzzles for engagement + context learning
- Flashcard drills for memorization + confidence
- Spaced repetition for long-term retention
- Oral practice for authentic exam simulation
- Granular mastery tracking for both individuals and institutions

**Target Users:**
- Individual immigrants preparing for US citizenship test (500K-800K annually)
- Adult education programs, churches, nonprofits, tutors
- Family members supporting older applicants

**Business Model:**
- **100% FREE citizenship prep** (all 100/128 questions, flashcards, crosswords, mock interviews, full mastery tracking)
- No paywalls, no premium citizenship features
- Acquisition funnel: Users see value → soft conversion prompt at 60% mastery → Premium for their kids' school work
- Institutional dashboards: Free (community benefit for nonprofits/education programs)

---

## 2. TEST CURRICULUM SUPPORT

### 2.1 Two Test Versions

| N-400 Filing Date | Question Bank | Oral Questions on Exam | Passing Score | StoryClue Support |
|---|---|---|---|---|
| Before Oct 20, 2025 | 100 questions | Up to 10 | 6/10 correct | ✅ Full |
| On/After Oct 20, 2025 | 128 questions | Up to 20 | 12/20 correct | ✅ Full |

### 2.2 Onboarding Question

**First screen:**
> "When did you file—or when will you file—your N-400 form?"
> 
> Options:
> - Before October 20, 2025 (100-question version)
> - On or after October 20, 2025 (128-question version)
> - Not sure / I'm exploring

→ This determines curriculum, practice test difficulty, and readiness threshold

### 2.3 Special Cases

**65/20 Applicants** (Age 65+, 20+ years permanent resident)
- Reduced 50-question subset
- Separate learning path
- Lower readiness threshold (10/20 across 3 consecutive sims)

**50/20 & 55/15 Applicants** (Language exemption eligible)
- Full curriculum
- Bilingual learning path (see 3.3)
- Can test in chosen language + bring interpreter

**Disability Accommodations**
- Flag for manual review in admin dashboard
- Do not auto-assign learning path
- Refer to USCIS official process

---

## 3. LEARNING PROGRESSION

### 3.1 Default Learning Path (Mandatory Flow)

**Phase 1: Foundation (Days 1-3)**
- **Mode:** Flashcard only
- **Language:** Native language explanation + English term
- **Content:** All 100 or 128 civics questions
- **Goal:** User sees every question once, builds basic vocabulary
- **Completion trigger:** User completes all questions in flashcard mode at least once

**Phase 2: Introduction (Days 4-7)**
- **Mode:** First crossword puzzle (5 questions max)
- **Difficulty:** Easy clues, story-connected context
- **Language:** English clues + English answers (monolingual)
- **UI Message:** "You've learned the basics. Now let's solve puzzles!"
- **Completion trigger:** User completes 3 crossword puzzles

**Phase 3: Adaptive Hybrid (Week 2+)**
- **Mode:** Spaced repetition drives content mix
  - 60% crossword puzzles (engagement)
  - 30% flashcard drills on weak areas (targeted drilling)
  - 10% mock oral interviews (interview prep)
- **Language:** Monolingual English (test language)
- **Adaptive trigger:** System identifies questions user missed → auto-creates flashcard drill

### 3.2 Flashcard Mode

**UI:**
```
[Flashcard front]
The document that lists your rights is the ___?

[User types or selects answer]

[Flashcard back - reveals]
ANSWER: Bill of Rights
EXPLANATION: The first 10 amendments protect your freedoms.
[Play audio pronunciation]
```

**Features:**
- Native language explanation available (toggle)
- English audio pronunciation
- Mark "know it" / "need more practice"
- Random order or adaptive (weakest first)
- Progress bar: "87/128 mastered"

### 3.3 Bilingual Scaffolding (For Native Language Learners)

**For 50/20, 55/15, 65/20 applicants only:**

**Flashcard Level 1:** Native language everything
- Explanation: Spanish
- Question: Spanish
- Answer: Spanish
- Audio: Spanish

**Crossword Level 1:** Bilingual
- Clues: Spanish
- Answers: Spanish/English mix
- UI: Toggle to show English translation

**Crossword Level 2:** Transitional
- Clues: English
- Answers: English required
- Native language hints available

**Crossword Level 3:** Monolingual English
- Full English, no translation available
- Matches actual test format

**Progression:** Automatic based on performance (80%+ accuracy → move to next level)

---

## 4. MASTERY STATE MODEL

Each question has a granular state (not just "% correct"):

**States:**
1. **Not Introduced** — User hasn't seen this question yet
2. **Introduced** — Seen in flashcard mode once
3. **Recognized** — Solved with clue help (in crossword)
4. **Answered Independently** — Solved without clue help (crossword)
5. **Answered Correctly Aloud** — Spoken answer in mock interview matches official answer
6. **Mastered** — Met all above + spaced repetition intervals complete
7. **Needs Review** — Mastered but spaced repetition interval expired

**Dashboard Display:**
```
Constitutional Basics: ████████░░ 92% (23/25 questions)
  - 5 Mastered
  - 8 Answered Aloud
  - 7 Answered Independently
  - 3 Need Review

Amendments: ██░░░░░░░░ 24% (3/12 questions)
  - 1 Mastered
  - 2 Recognized
  - 9 Not Yet Introduced
```

---

## 5. CROSSWORD MODE

### 5.1 Puzzle Generation

**Question Sourcing:**
- Use **exact wording** from official USCIS civics question bank (100 or 128 questions)
- Never paraphrase the official question itself
- Store original question + AI-generated clue variants

**Algorithm:**
```
1. Identify user's unmmastered questions (States 1-4)
2. Weight by: Red (< 50%) > Yellow (50-79%) > Green (80%+)
3. Generate 8-12 word crossword from weighted questions
4. For each question, select clue variant based on proficiency level
5. Validate grid connectivity, word placement
```

**Clue Variation (Pedagogical, Not Test Variation):**
Clues vary to force deeper understanding, not because the real test varies. Real officer may rephrase slightly, but we prepare users to understand the concept, not just memorize a phrase.

**Example Question + Clues:**
Official Question: "What are the first ten amendments to the Constitution called?"
Official Answer: "Bill of Rights"

Clue Level 1 (Beginner): "The first 10 amendments protect these"
Clue Level 2 (Intermediate): "James Madison wrote these to protect your freedoms"
Clue Level 3 (Advanced): "Document that limits government power over citizens"
Clue Level 4 (Expert): "Ratified in 1791 to secure liberties not covered by Constitution"

**Why variations work:**
- Clue 1 = memorization ("amendments")
- Clue 4 = deep understanding (history + purpose)
- When officer asks variations orally, user is prepared

### 5.2 Difficulty Levels

**Easy** (new learners):
- 5-6 word puzzles
- Simple, direct clues
- Helpful hint buttons

**Medium** (intermediate):
- 8-10 word puzzles
- Context clues requiring inference
- Limited hints (3 per puzzle)

**Hard** (advanced):
- 12-15 word puzzles
- Complex clues, interdependencies
- No hints

Auto-adjust based on user accuracy.

### 5.3 Puzzle Variants

**Focused Puzzle:** 8 questions on one weak topic (e.g., "Amendments Only")
**Mixed Puzzle:** Random 12 questions across all topics
**Review Puzzle:** Only previously-missed questions
**Readiness Puzzle:** 20 questions, simulates actual test format

---

## 6. SPACED REPETITION (SM2 ALGORITHM)

### 6.1 Scheduling Logic

**For each question, track:**
- `quality_of_response` (0-5 scale)
  - 5 = Perfect, confident
  - 3 = Correct but uncertain
  - 1 = Wrong, need review
  - 0 = Completely wrong
- `ease_factor` (difficulty, starts at 2.5)
- `interval` (days until next review)
- `next_review_date`

**SM2 Formula:**
```
if quality >= 3:
  if first_review:
    interval = 1 day
  else if second_review:
    interval = 3 days
  else:
    interval = interval * ease_factor
  ease_factor = max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
else:
  interval = 1 day
  ease_factor = max(1.3, ease_factor - 0.2)
```

**Result:** Missed questions reappear in 1-3 days. Mastered questions every 10-20 days.

### 6.2 User Transparency

Show user:
```
Bill of Rights: Mastered ✅
Next review: April 15, 2027 (45 days away)

Commerce Clause: Needs Review ⚠️
Next review: TODAY (overdue 2 days)

Felony Convictions: Learning 🔄
Next review: Tomorrow (1/3 learning cycles)
```

---

## 7. MOCK INTERVIEW MODE

### 7.1 Oral Practice

**Flow:**
1. System selects question from user's unmmastered list
2. AI reads question aloud (natural speech, conversational tone)
3. User records spoken answer (30 seconds max)
4. AI evaluates for:
   - Factual correctness (answer contains key concept, not word-for-word match)
   - Pronunciation clarity (understandable English)
   - Response time (< 15 seconds ideal for test)
5. Feedback: "Correct! Clear and confident." or "Close—you said '50 states,' which is correct. Next time try adding 'The United States has 50 states.'"

**Grading Logic (Mimics Real Officer Leniency):**
- **Correct answer:** Accept reasonable variations
  - "Bill of Rights" = "The first ten amendments" = "Ten amendments protecting our freedoms"
  - All marked as correct (5 points)
- **Correct concept, awkward phrasing:** 3 points ("You got it, but try to phrase it more clearly")
- **Wrong or completely off-topic:** 0 points
- **Bonus:** Confidence + natural speech = +1 point
- **Deduction:** Hesitation/filler words = -1 point

**Answer Validation:**
- Use semantic matching (not string matching)
- Compare user answer to official answer + acceptable synonyms
- Flag borderline cases for human review (for institutional users)

### 7.2 Simulated Test

**Readiness Exam:**
- 20 random questions from full curriculum
- Oral answers required (no multiple choice)
- Scored out of 20
- **User must pass 16/20 across 5 consecutive simulations before "Ready" status**
- This provides safety margin above legal minimum (12/20)

---

## 8. DYNAMIC CONTENT MANAGEMENT

### 8.1 Questions That Change

**Annual Updates Required:**
- President
- Vice President
- Senate (2 per state)
- House Representative (by district/ZIP code)
- State Governor
- State Legislature (legislative representatives)
- Speaker of the House
- Chief Justice

**Implementation:**
- Load from reliable data source (Congress.gov API, state legislative APIs)
- Questions store `[PLACEHOLDER_TYPE]` (e.g., `[CURRENT_PRESIDENT]`)
- On each puzzle generation, replace placeholders with current data
- Validate ZIP code when user enters location

**Database:**
```sql
civics_questions (
  qid INTEGER,
  question TEXT,  -- may contain [PLACEHOLDER_TYPE]
  official_answer TEXT,
  category TEXT,
  has_dynamic_content BOOLEAN
)

dynamic_sources (
  placeholder_type VARCHAR(50),
  api_endpoint TEXT,
  refresh_frequency TEXT, -- 'daily', 'weekly', 'on_election'
  last_updated TIMESTAMP
)
```

---

## 9. READINESS CALCULATION

### 9.1 "Ready to Test" Criteria

**For 128-question test (new applicants):**
- ✅ All 128 questions encountered at least once
- ✅ No major untested category (< 50% in any topic)
- ✅ At least 85% across recent mixed sessions (last 3 sessions)
- ✅ 16/20 correct across 5 consecutive simulated oral exams
- ✅ Recent success on previously-missed questions (80%+ in last week)

**For 100-question test (older applicants):**
- ✅ All 100 questions encountered at least once
- ✅ No major untested category (< 50% in any topic)
- ✅ At least 85% across recent mixed sessions
- ✅ 8/10 correct across 5 consecutive simulated oral exams
- ✅ Recent success on previously-missed questions (80%+ in last week)

**For 65/20 (50-question reduced set):**
- ✅ All 50 questions encountered
- ✅ 10/15 correct across 3 consecutive simulated oral exams
- ✅ 85%+ on mixed sessions

### 9.2 Dashboard Signal

```
🔴 NOT READY
You've mastered 64/128 questions.
You need: 25 more questions + 4 more passing simulations

🟡 ALMOST READY
You've mastered 120/128 questions.
You need: All 128 questions + 2 more passing simulations

🟢 READY TO TEST
You've met all criteria. You may schedule your interview.
Your safety margin: 16/20 (4 points above legal minimum)
```

---

## 10. CONVERSION CHECKPOINT (60% Mastery)

### 10.1 Soft Upsell Moment

**Trigger:** User reaches 60% mastered (approximately 77/128 or 60/100 questions)

**UI Modal (appears once, non-intrusive):**
```
🎯 You're 60% There!

You've mastered 77/128 civics questions.
You're on track to pass your test in 4-6 weeks.

Your kids could learn like this too.
Crossword puzzles + spaced repetition works 
for history, vocabulary, science, and more.

Try StoryClue Premium free for 7 days.
See how your family learns.

[Try Premium Free]  [Maybe Later]
```

### 10.2 Why 60%?

- User is invested (already spending 2-3 weeks studying)
- Proof point is clear (60% is real progress)
- Confidence is high (passing seems achievable)
- Psychological readiness to consider premium for kids
- Non-intrusive (only appears once, user can dismiss)

### 10.3 Premium Pitch

**Message:** NOT about citizenship features (those are free). About kids' education:
> "Your kids deserve the same learning method that helped you pass citizenship. Premium unlocks crossword puzzles for any school subject."

**Premium benefits (from main StoryClue):**
- Unlimited puzzles (not 3/month)
- All subjects (history, vocab, science, languages)
- Family accounts (up to 5 kids)
- Progress tracking per child

**Conversion goal:** 5-10% of users at 60% checkpoint convert to Premium

---

## 11. INDIVIDUAL DASHBOARD

**Top Section:**
- Mastery progress bar (85/128 mastered)
- Readiness status with missing criteria
- Next simulated test date

**Middle Section (by category):**
```
Constitutional Basics
████████░░ 92% mastered
Next review: Apr 8 (5 questions due)
Red (needs work): 2 questions
```

**Bottom Section:**
- Study streak (consistency reward)
- Recent activity log
- Export results (PDF for sharing with tutors/teachers)

---

## 12. INSTITUTIONAL DASHBOARD (Free Feature)

**For:** Adult education programs, nonprofits, tutors, churches

**Cost:** Free (community benefit, no paywall)

**Access Level:** Teacher/Admin can add students, track class progress

**Visibility:**
```
Class: "Monday Evening Citizenship Prep" (8 students)

Student | Mastered | Category Gaps | Ready? | Last Active
--------|----------|---------------|--------|-------------
Ahmed   | 112/128  | None          | 🟢 Yes | Today
Maria   | 87/128   | Rights (45%)   | 🔴 No  | 2 days ago
Juan    | 45/128   | Multiple      | 🔴 No  | 1 week ago
```

**Exports:**
- Individual progress reports (PDF)
- Class mastery heatmap by category
- Recommendations for struggling students

---

## 15. IMPLEMENTATION PHASES

### Phase 1 (Week 1-2): Core Engine
- Load 100 + 128 USCIS civics questions into database
- Implement SM2 spaced repetition algorithm
- Build filing date intake
- Create flashcard UI + mode

### Phase 2 (Week 3): Crossword Integration
- Integrate crossword generation from civics questions
- Create crossword UI
- Implement adaptive question weighting
- Add mastery state tracking

### Phase 3 (Week 4): Interview Practice
- Build mock interview mode
- Integrate speech recognition (Web Speech API or Claude)
- Create readiness calculation logic
- Build readiness dashboard

### Phase 4 (Week 5): Polish + Beta
- Bilingual scaffolding (Spanish + others)
- ZIP-code dynamic content loading
- Individual dashboard
- User testing with 50-100 immigrants

### Phase 5 (Week 6+): Conversion + Launch
- 60% mastery checkpoint conversion prompt (soft upsell)
- Institutional/teacher dashboard (free)
- Official launch as 100% free citizenship mode
- Monitor conversion rate to Premium StoryClue
- Iterate based on user feedback

---

## 13. PROGRESS TRACKING & SESSION PERSISTENCE

### 13.1 What Gets Tracked

**Per question, per user:**
- Mastery state (1-7: Not Introduced → Mastered)
- How many times seen
- How many times answered correctly
- Which clue variant was shown each time
- Time taken to answer
- Whether hints were used
- Next review date (SM2 algorithm)

**Database:**
```sql
user_question_progress (
  user_id, question_id,
  mastery_state, times_seen, times_correct,
  ease_factor, interval, next_review_date,
  proficiency_level (1-5)
)

user_question_attempts (
  user_id, question_id, clue_variant_id,
  attempt_date, answer_given, correct,
  time_taken, hint_used
)
```

### 13.2 Session Persistence

**Users can:**
- Close app mid-puzzle → progress syncs automatically
- Resume incomplete puzzle later → loads where they left off
- Switch devices → progress follows them (cloud sync)
- View attempt history → see every question they've practiced

**Session data:**
```
{
  user_id: "abc123",
  session_start: 2026-07-25T14:32Z,
  current_puzzle_id: "puzzle_2026_07_25_01",
  questions_answered: 8/12,
  score: 7/8,
  last_sync: 2026-07-25T14:45Z,
  device_id: "chrome_laptop_1"
}
```

### 13.3 Adaptive Content Selection

**Algorithm for next puzzle:**
```
1. Identify unmmastered questions (mastery_state < 6)
2. Load their next_review_date from SM2 algorithm
3. Weight by urgency:
   - OVERDUE (next_review < today) = RED priority
   - DUE SOON (next_review < 3 days) = YELLOW priority
   - OPTIONAL (next_review > 3 days) = GREEN priority
4. For each selected question:
   - If proficiency_level = 1: Use Clue Level 1 or 2
   - If proficiency_level = 2-3: Use Clue Level 2 or 3
   - If proficiency_level = 4+: Use Clue Level 3 or 4
5. If they got it wrong last time: Drop back to easier clue
6. Generate 8-12 word crossword from weighted questions
7. Record which clue variant was shown (for learning analytics)
```

**Example:**
```
User's last session: Answered "Bill of Rights" correctly (proficiency = 3)
Next session (1 week later): SM2 says "Bill of Rights" is due for review
System shows: Clue Level 3 ("Document that limits government power")
User answers correctly again
System upgrades: proficiency = 4, next review = 20 days
```

---

## 14. TECHNICAL REQUIREMENTS

**Frontend:**
- React component: `CitizenshipMastery.jsx`
- Flashcard component
- Crossword puzzle component
- Mock interview recorder
- Dashboard with mastery visualizations

**Backend:**
- `/api/citizenship/questions` — Load curriculum (100 or 128)
- `/api/citizenship/next-puzzle` — Generate adaptive crossword
- `/api/citizenship/evaluate-answer` — Check answer + update SM2
- `/api/citizenship/readiness` — Calculate readiness score
- `/api/citizenship/dynamic-content` — Fetch current ZIP-code answers

**Database:**
```
civics_questions
civics_user_progress
civics_attempts
civics_simulations
dynamic_sources
institutional_classes
```

**Third-Party:**
- Web Speech API (browser text-to-speech + speech recognition)
- Congress.gov API (current elected officials)
- State legislative data (governors, state reps)

---

## 16. SUCCESS METRICS

**Individual User:**
- 70%+ of new users complete Phase 1 (all questions in flashcard mode)
- 50%+ progress to Phase 2 (first crossword)
- 30%+ reach readiness (5 consecutive 16/20 sims)
- Average time to readiness: 6-8 weeks
- Pass rate on actual USCIS test: 90%+ (measure via follow-up survey)

**Business (Acquisition & Conversion):**
- 10K+ free signups in first month
- 60% of users reach 60% mastery checkpoint
- 5-10% conversion to Premium StoryClue at 60% checkpoint
- Average customer lifetime value: $60-120/year (kids' Premium subscriptions)

**Engagement:**
- 60%+ return rate (visit 2+ times per week)
- 20+ minutes average session length
- Daily puzzle completion rate

---

## 17. GO-TO-MARKET

**Launch Message:**
> "Citizenship prep that actually sticks. Crossword puzzles + spaced repetition = mastery—not cramming."

**Channels:**
- Organic SEO ("citizenship test prep crossword")
- Reddit immigration communities
- Partnerships with nonprofits + adult education
- Word-of-mouth (satisfied users tell friends)

**Positioning:**
- Free citizenship module as value builder
- Premium upsell: "Your kids deserve the same learning method that helped you pass"

---

**Approval:** Ready to proceed to Phase 1 development.
