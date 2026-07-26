# StoryClue Citizenship Mastery — Implementation Guide

## Overview

This directory contains the backend for StoryClue's free citizenship test preparation system. It includes:

- **Database schema** for tracking user progress with SM2 spaced repetition
- **API endpoints** for flashcards, attempts, and initialization
- **SM2 algorithm** for adaptive scheduling
- **Dynamic content system** for answers that change (elected officials)
- **Seed data** and seeding script to populate the database

## Setup

### 1. Database Tables

Tables are created automatically by API endpoints, but you can manually run the schema:

```bash
# In your Vercel/Postgres environment:
psql $DATABASE_URL < api/citizenship/schema.sql
```

### 2. Seed the Database

Load all 100/128 USCIS civics questions with clue variants:

```bash
# Call the seed endpoint (requires admin token)
curl -X POST https://storyclue.ai/api/citizenship/seed \
  -H "x-admin-token: $CITIZENSHIP_SEED_TOKEN"
```

**Set the admin token** in your Vercel environment variables:
```
CITIZENSHIP_SEED_TOKEN=your_secret_token_here
```

### 3. Verify

Check that questions loaded:

```sql
SELECT COUNT(*) FROM civics_questions WHERE test_version = '100';
-- Should return: 100

SELECT COUNT(*) FROM civics_questions WHERE test_version = '128';
-- Should return: 128

SELECT COUNT(*) FROM clue_variants;
-- Should return: 400-512 (4 clues per question)
```

## API Endpoints

### POST `/api/citizenship/initialize`

Initialize citizenship mode for a new user.

```json
{
  "userId": "user_123",
  "filingDate": "before_oct_2025" | "after_oct_2025"
}
```

Response:
```json
{
  "message": "User initialized successfully",
  "testVersion": "100" | "128",
  "totalQuestions": 100 | 128,
  "currentPhase": 1
}
```

### GET `/api/citizenship/get-flashcards?userId=USER_ID&limit=10`

Load next flashcard questions for a user (ordered by priority).

Response:
```json
{
  "userId": "user_123",
  "testVersion": "128",
  "currentPhase": 1,
  "questions": [
    {
      "id": 42,
      "question": "What is the supreme law of the land?",
      "answer": "The Constitution",
      "category": "Constitution",
      "masteryState": 1,
      "proficiencyLevel": 1,
      "timesSeen": 0,
      "timesCorrect": 0,
      "clues": [
        { "id": 1, "level": 1, "text": "What is the supreme law of the land?" },
        { "id": 2, "level": 2, "text": "The supreme law of the land that..." },
        ...
      ]
    }
  ],
  "totalQuestions": 10
}
```

### POST `/api/citizenship/record-attempt`

Record a flashcard/interview attempt and update SM2 scores.

```json
{
  "userId": "user_123",
  "questionId": 42,
  "clueVariantId": 2,
  "userAnswer": "The Constitution",
  "mode": "flashcard",
  "timeTakenSeconds": 5,
  "hintUsed": false,
  "userZipCode": "90210"
}
```

Response:
```json
{
  "success": true,
  "attempt": {
    "isCorrect": true,
    "quality": 5,
    "userAnswer": "The Constitution",
    "officialAnswer": "The Constitution"
  },
  "progress": {
    "nextReviewDate": "2026-07-26",
    "nextInterval": 1,
    "newMasteryState": 3,
    "newProficiencyLevel": 1
  },
  "session": {
    "phase1Complete": false,
    "masteryPercentage": 5,
    "showConversionPrompt": false
  }
}
```

## Dynamic Content (Elected Officials)

Questions with dynamic content use placeholders:

```
[CURRENT_PRESIDENT]
[CURRENT_VICEPRESIDENT]
[HOUSE_SPEAKER]
[STATE_SENATORS]
[HOUSE_REPRESENTATIVE]
[CHIEF_JUSTICE]
[PRESIDENT_PARTY]
```

### How It Works

1. **Questions stored with placeholders**: "Who is the president now?" → Answer: `[CURRENT_PRESIDENT]`
2. **At answer time**: `replaceDynamicContent(answer)` fetches current data from APIs
3. **User's answer validated** against current data
4. **Never stale**: New elections automatically update the answers

### Data Sources

- **President/VP**: WhiteHouse API or manual config
- **House Speaker**: Congress.gov API
- **Senators/Representatives**: Congress.gov API + Zippopotam (ZIP→State conversion)
- **Chief Justice**: Manual config (stable position, updated rarely)

### Refreshing Cache

Refresh dynamic content cache daily (via cron):

```bash
curl -X POST https://storyclue.ai/api/citizenship/refresh-dynamic-content \
  -H "x-admin-token: $CITIZENSHIP_SEED_TOKEN"
```

Or call programmatically:

```javascript
import { refreshDynamicContentCache } from "./fetch-dynamic-content.js";
await refreshDynamicContentCache();
```

## SM2 Algorithm

Spaced repetition intervals automatically adjust based on performance:

- **Quality 5 (perfect)**: Next review in 3 days, 9 days, 27 days... (exponential)
- **Quality 3 (correct but slow)**: Next review in 1 day, 3 days, 9 days...
- **Quality <3 (wrong)**: Reset to 1 day, start over

Proficiency levels auto-escalate as users master questions:

- **Level 1**: Gets Clue Level 1 (beginner)
- **Level 3**: Gets Clue Level 2-3 (intermediate)
- **Level 5**: Gets Clue Level 3-4 (expert)

## Learning Progression

**Phase 1: Flashcard Introduction (Days 1-3)**
- User sees all 100/128 questions in flashcard mode
- Native language explanations available
- Goal: build confidence and vocabulary

**Phase 2: Hybrid Learning (Weeks 2+)**
- 60% crossword puzzles (engagement)
- 30% flashcard drills on weak areas
- 10% mock interviews
- System automatically switches when Phase 1 complete

**Conversion Prompt**
- Shows at 60% mastery (approaching passing score)
- Pitches Premium StoryClue for their kids' schoolwork
- Non-intrusive: appears once, user can dismiss

## Testing

### Test with Sample Data

```javascript
// In Node.js:
import seedDatabase from "./api/citizenship/seed-database.js";
await seedDatabase();
// Database now has all civics questions + clues
```

### Test Dynamic Content

```javascript
import { replaceDynamicContent } from "./api/citizenship/fetch-dynamic-content.js";

const answer = "[CURRENT_PRESIDENT] is the current President";
const replaced = await replaceDynamicContent(answer);
console.log(replaced); // "Joseph R. Biden Jr. is the current President"
```

### Test SM2 Algorithm

```javascript
import { calculateSM2, evaluateAnswer } from "./api/citizenship/sm2.js";

const quality = evaluateAnswer("The Constitution", "The Constitution");
// quality = 5

const sm2 = calculateSM2(5, 2.5, 0, 0);
// { nextInterval: 1, nextEaseFactor: 2.6, nextReviewDate: "2026-07-26" }
```

## Troubleshooting

### Questions not loading after seed

- Check `CITIZENSHIP_SEED_TOKEN` is set in Vercel environment
- Verify database connection with `psql $DATABASE_URL`
- Run seed endpoint again (idempotent)

### Dynamic content not replacing

- Verify Congress.gov API is accessible (check firewalls)
- Check `dynamic_content_sources` table has recent entries
- Call `refreshDynamicContentCache` manually to update

### SM2 intervals seem wrong

- Verify quality score calculation (0-5 range)
- Check ease_factor doesn't go below 1.3
- Confirm interval is being multiplied by ease_factor

## Next Steps

- [ ] Add ZIP code capture to user session (for geo-specific questions)
- [ ] Implement 60% mastery checkpoint UI
- [ ] Build crossword puzzle generator from civics questions
- [ ] Create mock interview mode with audio
- [ ] Add institutional dashboard for teachers/nonprofits
- [ ] Integrate into main StoryClue landing page
