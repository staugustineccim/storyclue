// SM2 Spaced Repetition Algorithm
// Based on: https://en.wikipedia.org/wiki/SuperMemo#Algorithm_SM-2
// For citizenship prep: tracks when to next review each question

/**
 * Calculate next review interval using SM2 algorithm
 * @param {number} quality - Quality of response (0-5)
 *   5 = Perfect, immediate recall
 *   4 = Correct with hesitation
 *   3 = Correct, but required significant effort
 *   2 = Incorrect, but familiar
 *   1 = Incorrect, little familiarity
 *   0 = Completely forgotten
 * @param {number} easeFactor - Difficulty factor (starts at 2.5)
 * @param {number} interval - Current interval in days
 * @param {number} repetitions - Number of successful repetitions
 * @returns {object} { nextInterval, nextEaseFactor, nextRepetitions, nextReviewDate }
 */
function calculateSM2(quality, easeFactor, interval, repetitions) {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // SM2 formula for ease factor
  if (quality >= 3) {
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    newEaseFactor = easeFactor - 0.2;
  }

  // Minimum ease factor is 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor);

  // Calculate interval
  if (quality < 3) {
    // Failed: reset to review tomorrow
    newInterval = 1;
    newRepetitions = 0;
  } else if (repetitions === 0) {
    // First successful review: 1 day
    newInterval = 1;
    newRepetitions = 1;
  } else if (repetitions === 1) {
    // Second successful review: 3 days
    newInterval = 3;
    newRepetitions = 2;
  } else {
    // Subsequent reviews: multiply by ease factor
    newInterval = Math.round(interval * newEaseFactor);
    newRepetitions = repetitions + 1;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    nextInterval: newInterval,
    nextEaseFactor: parseFloat(newEaseFactor.toFixed(2)),
    nextRepetitions: newRepetitions,
    nextReviewDate: nextReviewDate.toISOString().split('T')[0],
  };
}

/**
 * Evaluate user's answer for correctness
 * Returns quality score (0-5) based on accuracy
 * @param {string} userAnswer - User's spoken/typed answer
 * @param {string} officialAnswer - Official correct answer
 * @returns {number} quality (0-5)
 */
function evaluateAnswer(userAnswer, officialAnswer) {
  const user = userAnswer.toLowerCase().trim();
  const official = officialAnswer.toLowerCase().trim();

  // Exact match
  if (user === official) return 5;

  // Check if answer contains key words from official answer
  const officialWords = official.split(/\s+/);
  const matchedWords = officialWords.filter(word => user.includes(word)).length;
  const wordMatchRatio = matchedWords / officialWords.length;

  if (wordMatchRatio >= 0.8) return 4;  // 80%+ word match
  if (wordMatchRatio >= 0.6) return 3;  // 60%+ word match (correct but imprecise)
  if (wordMatchRatio >= 0.4) return 2;  // 40%+ word match (partially correct)
  if (wordMatchRatio > 0) return 1;     // Some familiarity
  return 0;                              // Completely wrong
}

/**
 * Determine which clue difficulty to show based on proficiency
 * @param {number} proficiencyLevel - 1-5
 * @param {boolean} lastAttemptCorrect - Did they get it right last time?
 * @returns {number} difficulty (1-4)
 */
function selectClueLevel(proficiencyLevel, lastAttemptCorrect) {
  if (!lastAttemptCorrect) {
    // Failed last time: drop back to easier clue
    return Math.max(1, proficiencyLevel - 1);
  }

  // Graduated difficulty based on proficiency
  if (proficiencyLevel === 1) return Math.random() > 0.5 ? 1 : 2;
  if (proficiencyLevel === 2) return Math.random() > 0.5 ? 2 : 3;
  if (proficiencyLevel === 3) return Math.random() > 0.5 ? 2 : 3;
  if (proficiencyLevel === 4) return Math.random() > 0.5 ? 3 : 4;
  return 4;
}

/**
 * Weight questions for next study session
 * Higher score = higher priority
 * @param {object} questionProgress - { mastery_state, next_review_date, times_seen }
 * @returns {number} weight (0-100)
 */
function calculateQuestionWeight(questionProgress) {
  const { mastery_state, next_review_date, times_seen } = questionProgress;
  const today = new Date().toISOString().split('T')[0];

  let weight = 0;

  // Factor 1: Mastery state (unmmastered questions = higher priority)
  if (mastery_state < 3) weight += 40;  // Never seen or just introduced
  else if (mastery_state < 6) weight += 30;  // Learning but not mastered
  else weight += 10;  // Already mastered

  // Factor 2: Review urgency (overdue reviews = highest priority)
  if (next_review_date <= today) {
    weight += 50;  // OVERDUE - highest priority
  } else {
    const daysUntilReview = Math.ceil(
      (new Date(next_review_date) - new Date(today)) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilReview <= 3) weight += 30;  // Due soon
    else if (daysUntilReview <= 7) weight += 15;  // Due this week
    else weight += 5;  // Optional
  }

  return Math.min(100, weight);
}

export { calculateSM2, evaluateAnswer, selectClueLevel, calculateQuestionWeight };
