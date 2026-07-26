import { useState, useEffect } from "react";
import { trackEvent } from "../utils/analytics";
import { fetchWithCSRF } from "../utils/csrf";

export default function CitizenshipFlashcard() {
  const [userId] = useState(() => {
    // Get or create anonymous user ID for citizenship study
    let id = localStorage.getItem("sc_citizenship_user_id");
    if (!id) {
      id = `citizenship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("sc_citizenship_user_id", id);
    }
    return id;
  });

  const [filingDate, setFilingDate] = useState(null);
  const [phase, setPhase] = useState("intake"); // "intake" | "flashcards" | "complete"
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [masteryPercentage, setMasteryPercentage] = useState(0);
  const [showConversionPrompt, setShowConversionPrompt] = useState(false);

  // Initialize citizenship mode
  useEffect(() => {
    const storedFiling = localStorage.getItem("sc_citizenship_filing_date");
    if (storedFiling) {
      setFilingDate(storedFiling);
      loadFlashcards(storedFiling);
    }
  }, []);

  const handleFilingDateSelect = async (selected) => {
    setFilingDate(selected);
    localStorage.setItem("sc_citizenship_filing_date", selected);

    try {
      await fetchWithCSRF("/api/citizenship/initialize", {
        method: "POST",
        body: JSON.stringify({ userId, filingDate: selected }),
      });
    } catch (err) {
      console.error("Failed to initialize:", err);
    }

    loadFlashcards(selected);
  };

  const loadFlashcards = async (filing) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/citizenship/get-flashcards?userId=${encodeURIComponent(userId)}&limit=10`
      );
      const data = await res.json();
      setQuestions(data.questions || []);
      setPhase("flashcards");
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
    }
    setLoading(false);
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    setLoading(true);
    try {
      const current = questions[currentIndex];
      const res = await fetchWithCSRF("/api/citizenship/record-attempt", {
        method: "POST",
        body: JSON.stringify({
          userId,
          questionId: current.id,
          clueVariantId: null,
          userAnswer: userAnswer.trim(),
          mode: "flashcard",
        }),
      });

      const result = await res.json();
      setFeedback(result.attempt);
      setMasteryPercentage(result.session.masteryPercentage);

      if (result.session.showConversionPrompt) {
        setShowConversionPrompt(true);
      }

      trackEvent("citizenship_flashcard_answered", {
        correct: result.attempt.isCorrect,
        mastery: result.session.masteryPercentage,
      });

      // Move to next question after 2 seconds
      setTimeout(() => {
        setUserAnswer("");
        setFeedback(null);
        setIsFlipped(false);
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          loadFlashcards(filingDate);
        }
      }, 2000);
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
    setLoading(false);
  };

  if (phase === "intake") {
    return (
      <div style={container}>
        <div style={card}>
          <h1 style={heading}>📚 Citizenship Test Prep</h1>
          <p style={subtitle}>
            Free crossword puzzles + flashcards to master the civics test
          </p>

          <div style={section}>
            <h2 style={subheading}>When did you file your N-400?</h2>
            <p style={explanation}>
              Your filing date determines which civics test you'll take.
            </p>

            <div style={buttonGroup}>
              <button
                onClick={() => handleFilingDateSelect("before_oct_2025")}
                style={{ ...button, ...buttonPrimary }}
              >
                📅 Before October 20, 2025<br />
                <span style={buttonSmall}>(100 questions)</span>
              </button>
              <button
                onClick={() => handleFilingDateSelect("after_oct_2025")}
                style={{ ...button, ...buttonPrimary }}
              >
                📅 On or After October 20, 2025<br />
                <span style={buttonSmall}>(128 questions)</span>
              </button>
              <button
                onClick={() => handleFilingDateSelect("after_oct_2025")}
                style={{ ...button, ...buttonSecondary }}
              >
                ❓ Not sure
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || questions.length === 0) {
    return (
      <div style={container}>
        <div style={card}>
          <p style={{ textAlign: "center", color: "#888" }}>Loading flashcards...</p>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div style={container}>
      {showConversionPrompt && (
        <div style={conversionPrompt}>
          <h3>🎯 You're 60% There!</h3>
          <p>You've mastered many civics questions. You're on track to pass!</p>
          <p>
            Your kids could learn any school subject the same way—with crossword
            puzzles and smart spaced repetition.
          </p>
          <button
            onClick={() => setShowConversionPrompt(false)}
            style={{ ...button, ...buttonSmall }}
          >
            Learn More
          </button>
        </div>
      )}

      <div style={card}>
        <div style={progressBar}>
          <div style={{ ...progressFill, width: `${progress}%` }} />
        </div>
        <p style={progressText}>
          {masteryPercentage}% Mastered ({currentIndex + 1}/{questions.length})
        </p>

        {/* Flashcard */}
        <div
          style={flashcard}
          onClick={() => !feedback && setIsFlipped(!isFlipped)}
        >
          <div style={flashcardContent}>
            <p style={flashcardLabel}>{isFlipped ? "ANSWER" : "QUESTION"}</p>
            <p style={flashcardText}>
              {isFlipped ? current.answer : current.question}
            </p>
            {!isFlipped && !feedback && (
              <p style={flashcardHint}>Click to reveal answer</p>
            )}
          </div>
        </div>

        {/* Answer Input */}
        {isFlipped && !feedback && (
          <div style={inputSection}>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmitAnswer()}
              placeholder="Type your answer..."
              style={input}
              autoFocus
            />
            <button onClick={handleSubmitAnswer} style={{ ...button, ...buttonPrimary }}>
              Check Answer
            </button>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div
            style={{
              ...feedbackBox,
              background: feedback.isCorrect ? "#e8f5e9" : "#ffebee",
            }}
          >
            <p style={{ fontSize: "1.2rem", margin: 0 }}>
              {feedback.isCorrect ? "✅ Correct!" : "❌ Not quite"}
            </p>
            <p style={{ margin: "0.5rem 0 0", color: "#666" }}>
              Official answer: <strong>{feedback.officialAnswer}</strong>
            </p>
            <p style={{ fontSize: "0.9rem", color: "#999" }}>
              Next question in 2 seconds...
            </p>
          </div>
        )}

        <div style={categoryTag}>{current.category}</div>
      </div>
    </div>
  );
}

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "2rem 1rem",
  minHeight: "100vh",
  background: "#FDFAF4",
  fontFamily: "Lora, Georgia, serif",
};

const card = {
  background: "#fff",
  borderRadius: "12px",
  padding: "2rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  position: "relative",
};

const heading = {
  fontSize: "2rem",
  color: "#2D5A1A",
  textAlign: "center",
  margin: "0 0 0.5rem",
};

const subtitle = {
  textAlign: "center",
  color: "#666",
  fontSize: "1rem",
  marginBottom: "2rem",
};

const section = {
  marginBottom: "2rem",
};

const subheading = {
  fontSize: "1.3rem",
  color: "#2D5A1A",
  marginBottom: "0.5rem",
};

const explanation = {
  color: "#666",
  marginBottom: "1.5rem",
};

const buttonGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const button = {
  padding: "1rem",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontFamily: "Lora, Georgia, serif",
  fontSize: "1rem",
  fontWeight: 600,
  transition: "all 0.2s",
};

const buttonPrimary = {
  background: "#2D5A1A",
  color: "#fff",
};

const buttonSecondary = {
  background: "#f5f5f5",
  color: "#666",
  border: "1px solid #ddd",
};

const buttonSmall = {
  fontSize: "0.85rem",
  fontWeight: 400,
  display: "block",
  marginTop: "0.5rem",
  opacity: 0.9,
};

const progressBar = {
  width: "100%",
  height: "8px",
  background: "#eee",
  borderRadius: "4px",
  marginBottom: "1rem",
  overflow: "hidden",
};

const progressFill = {
  height: "100%",
  background: "#2D5A1A",
  transition: "width 0.3s",
};

const progressText = {
  textAlign: "center",
  color: "#666",
  fontSize: "0.9rem",
  marginBottom: "2rem",
};

const flashcard = {
  background: "linear-gradient(135deg, #fff8e8 0%, #f0f0f0 100%)",
  border: "2px solid #c0900a",
  borderRadius: "12px",
  padding: "3rem 2rem",
  textAlign: "center",
  cursor: "pointer",
  minHeight: "200px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "2rem",
  transition: "transform 0.6s, box-shadow 0.2s",
};

const flashcardContent = {
  width: "100%",
};

const flashcardLabel = {
  fontSize: "0.85rem",
  color: "#999",
  margin: "0 0 1rem",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const flashcardText = {
  fontSize: "1.3rem",
  color: "#2D5A1A",
  margin: "0",
  lineHeight: 1.6,
};

const flashcardHint = {
  fontSize: "0.9rem",
  color: "#c0900a",
  margin: "1rem 0 0",
  fontStyle: "italic",
};

const inputSection = {
  display: "flex",
  gap: "1rem",
  marginBottom: "2rem",
};

const input = {
  flex: 1,
  padding: "0.75rem",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "1rem",
  fontFamily: "Lora, Georgia, serif",
};

const feedbackBox = {
  padding: "1.5rem",
  borderRadius: "8px",
  marginBottom: "2rem",
  textAlign: "center",
};

const categoryTag = {
  display: "inline-block",
  background: "#e8f0d8",
  color: "#2D5A1A",
  padding: "0.5rem 1rem",
  borderRadius: "20px",
  fontSize: "0.85rem",
  fontWeight: 600,
};

const conversionPrompt = {
  position: "fixed",
  bottom: "2rem",
  left: "50%",
  transform: "translateX(-50%)",
  maxWidth: "400px",
  background: "#fff8e8",
  border: "2px solid #c0900a",
  borderRadius: "12px",
  padding: "1.5rem",
  textAlign: "center",
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  zIndex: 1000,
};
