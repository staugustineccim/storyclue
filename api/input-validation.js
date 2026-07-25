// Input validation utilities for API endpoints

const MAX_CHAPTER_TEXT_SIZE = 100 * 1024; // 100KB
const MAX_BOOK_REF_LENGTH = 200;
const MAX_URL_LENGTH = 2048;

// Whitelisted domains for URL input (prevent SSRF attacks)
const WHITELISTED_DOMAINS = [
  "wikipedia.org",
  "en.wikipedia.org",
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "example.com",
  "github.com",
  "medium.com",
  "news.ycombinator.com",
  // Add more as needed
];

export function validateChapterText(text) {
  if (!text) return { valid: true, text: "" };

  const str = String(text).trim();

  if (str.length > MAX_CHAPTER_TEXT_SIZE) {
    return {
      valid: false,
      error: `Text exceeds maximum size of ${MAX_CHAPTER_TEXT_SIZE / 1024}KB`,
    };
  }

  if (str.length < 50) {
    return {
      valid: false,
      error: "Text must be at least 50 characters",
    };
  }

  return { valid: true, text: str };
}

export function validateBookRef(ref) {
  if (!ref) return { valid: false, error: "Book reference is required" };

  const str = String(ref).trim();

  if (str.length > MAX_BOOK_REF_LENGTH) {
    return {
      valid: false,
      error: `Book reference exceeds maximum length of ${MAX_BOOK_REF_LENGTH} characters`,
    };
  }

  if (str.length < 3) {
    return {
      valid: false,
      error: "Book reference must be at least 3 characters",
    };
  }

  // Allow letters, numbers, spaces, hyphens, commas, colons, periods
  if (!/^[a-zA-Z0-9\s\-,:.]+$/.test(str)) {
    return {
      valid: false,
      error: "Book reference contains invalid characters",
    };
  }

  return { valid: true, ref: str };
}

export function validateURL(url) {
  if (!url) return { valid: true, url: "" };

  const str = String(url).trim();

  if (str.length > MAX_URL_LENGTH) {
    return {
      valid: false,
      error: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters`,
    };
  }

  // Must start with http/https
  if (!str.startsWith("http://") && !str.startsWith("https://")) {
    return {
      valid: false,
      error: "URL must start with http:// or https://",
    };
  }

  // Check for valid URL format
  try {
    const urlObj = new URL(str);
    const domain = urlObj.hostname.toLowerCase();

    // Check if domain is whitelisted
    const isWhitelisted = WHITELISTED_DOMAINS.some(
      (wd) => domain === wd || domain.endsWith("." + wd)
    );

    if (!isWhitelisted) {
      return {
        valid: false,
        error: `Domain '${domain}' is not whitelisted. Supported: ${WHITELISTED_DOMAINS.join(", ")}`,
      };
    }

    return { valid: true, url: str };
  } catch (err) {
    return {
      valid: false,
      error: "Invalid URL format",
    };
  }
}

export function validateGrade(grade) {
  const validGrades = ["k", "1", "2", "3", "4", "5", "6", "7", "8", "9-10", "11-12", "adult"];
  if (!validGrades.includes(String(grade))) {
    return {
      valid: false,
      error: `Invalid grade: ${grade}. Must be one of: ${validGrades.join(", ")}`,
    };
  }
  return { valid: true, grade: String(grade) };
}

export function validateFaith(faith) {
  const validFaiths = [
    "none",
    "christian-protestant",
    "christian-catholic",
    "jewish",
    "islamic",
    "hindu",
    "buddhist",
    "other",
  ];
  if (!validFaiths.includes(String(faith))) {
    return {
      valid: false,
      error: `Invalid faith tradition: ${faith}`,
    };
  }
  return { valid: true, faith: String(faith) };
}

export function validateLanguage(language) {
  const validLanguages = [
    "english",
    "spanish",
    "french",
    "german",
    "portuguese",
    "italian",
    "mandarin",
    "japanese",
    "korean",
  ];
  if (!validLanguages.includes(String(language))) {
    return {
      valid: false,
      error: `Invalid language: ${language}`,
    };
  }
  return { valid: true, language: String(language) };
}

// Validate all inputs and return first error found
export function validateInputs(req) {
  const { inputMode, bookRef, chapterText, urlRef, grade, faith, language } = req.body || {};

  // Validate input mode
  const validModes = ["lookup", "paste", "url", "pdf", "songs"];
  if (!validModes.includes(inputMode)) {
    return { valid: false, error: "Invalid input mode" };
  }

  // Validate based on input mode
  if (inputMode === "lookup") {
    const bookValidation = validateBookRef(bookRef);
    if (!bookValidation.valid) return bookValidation;
  }

  if (inputMode === "paste" || inputMode === "pdf") {
    const textValidation = validateChapterText(chapterText);
    if (!textValidation.valid) return textValidation;
  }

  if (inputMode === "url") {
    const urlValidation = validateURL(urlRef);
    if (!urlValidation.valid) return urlValidation;
  }

  // Validate grade
  const gradeValidation = validateGrade(grade);
  if (!gradeValidation.valid) return gradeValidation;

  // Validate faith
  if (faith) {
    const faithValidation = validateFaith(faith);
    if (!faithValidation.valid) return faithValidation;
  }

  // Validate language
  if (language) {
    const langValidation = validateLanguage(language);
    if (!langValidation.valid) return langValidation;
  }

  return { valid: true };
}
