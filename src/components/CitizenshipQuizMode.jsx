import { useState, useEffect } from "react";
import { citizenshipQuestions, categories, getQuestionsByCategory, getRandomQuestions } from "../utils/citizenshipQuestions";

export default function CitizenshipQuizMode({ language = "english" }) {
  const [mode, setMode] = useState("select"); // select, study, practice, review
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState({});
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("citizenship_progress");
    if (saved) setProgress(JSON.parse(saved));
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem("citizenship_progress", JSON.stringify(progress));
  }, [progress]);

  const startStudy = (category) => {
    setSelectedCategory(category);
    const qList = getQuestionsByCategory(category);
    setQuestions(qList);
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setMode("study");
  };

  const startPracticeTest = () => {
    const qList = getRandomQuestions(10);
    setQuestions(qList);
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setStats({ correct: 0, total: 0 });
    setMode("practice");
  };

  const markCorrect = () => {
    const q = questions[currentQuestionIndex];
    setProgress({ ...progress, [q.id]: "correct" });
    setStats({ ...stats, correct: stats.correct + 1, total: stats.total + 1 });
    nextQuestion();
  };

  const markIncorrect = () => {
    const q = questions[currentQuestionIndex];
    setProgress({ ...progress, [q.id]: "incorrect" });
    setStats({ ...stats, total: stats.total + 1 });
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
    } else {
      if (mode === "practice") {
        setMode("review");
      } else {
        setMode("select");
      }
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const mastered = Object.values(progress).filter(v => v === "correct").length;
  const needsWork = Object.values(progress).filter(v => v === "incorrect").length;

  const labelStyle = {
    fontFamily: "'Playfair Display',serif",
    fontWeight: 700,
    fontSize: "16px",
    color: "#2d4a18",
    marginBottom: "12px",
    display: "block"
  };

  const buttonStyle = {
    padding: "12px 20px",
    border: "1.5px solid #c8b888",
    borderRadius: "8px",
    background: "#fffef5",
    color: "#2c1a08",
    fontFamily: "Lora,serif",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: "8px",
    width: "100%",
    textAlign: "left"
  };

  if (mode === "select") {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 20px" }}>
        <h2 style={{
          fontFamily: "'Playfair Display',serif",
          fontWeight: 900,
          fontSize: "28px",
          color: "#2d4a18",
          marginBottom: "8px"
        }}>
          U.S. Citizenship Test Prep
        </h2>
        <p style={{
          fontFamily: "Lora,serif",
          fontSize: "14px",
          color: "#6a5a30",
          marginBottom: "28px"
        }}>
          Master all 100 civics questions. Practice by category or take a full practice test.
        </p>

        {/* Progress Summary */}
        <div style={{
          background: "#e8f4d8",
          border: "2px solid #4a8a2a",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px"
        }}>
          <div style={{ fontWeight: 600, color: "#2d4a18", marginBottom: "8px" }}>
            Your Progress
          </div>
          <div style={{ fontSize: "14px", color: "#4a5a20", lineHeight: "1.6" }}>
            ✓ Mastered: <strong>{mastered}</strong> questions<br/>
            ⚠ Need practice: <strong>{needsWork}</strong> questions<br/>
            ◯ Not started: <strong>{100 - mastered - needsWork}</strong> questions
          </div>
        </div>

        {/* Practice Test Button */}
        <button
          onClick={startPracticeTest}
          style={{
            ...buttonStyle,
            background: "#3a6a1a",
            color: "#f0ead8",
            border: "none",
            fontWeight: 600,
            marginBottom: "20px",
            fontSize: "15px"
          }}
        >
          📝 Full Practice Test (10 random questions)
        </button>

        {/* Category Study */}
        <label style={labelStyle}>Study by Category</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {categories.map(cat => {
            const catQuestions = getQuestionsByCategory(cat);
            const catMastered = catQuestions.filter(q => progress[q.id] === "correct").length;
            return (
              <button
                key={cat}
                onClick={() => startStudy(cat)}
                style={{
                  ...buttonStyle,
                  gridColumn: "span 1",
                  background: catMastered === catQuestions.length ? "#d4e8c8" : "#fffef5",
                  fontSize: "13px"
                }}
              >
                <div>{cat}</div>
                <div style={{ fontSize: "11px", color: "#8a7a50", marginTop: "4px" }}>
                  {catMastered}/{catQuestions.length} mastered
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === "study" || mode === "practice") {
    if (!currentQuestion) return null;

    return (
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={() => {
              setMode("select");
              setSelectedCategory(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#6b8e4a",
              cursor: "pointer",
              fontSize: "14px",
              marginBottom: "12px",
              fontFamily: "Lora,serif"
            }}
          >
            ← Back
          </button>
          <h2 style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 900,
            fontSize: "24px",
            color: "#2d4a18",
            margin: "0"
          }}>
            {mode === "practice" ? "Practice Test" : selectedCategory}
          </h2>
          <div style={{
            fontSize: "13px",
            color: "#8a7a50",
            marginTop: "8px"
          }}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          background: "#e8e0c8",
          height: "8px",
          borderRadius: "4px",
          marginBottom: "28px",
          overflow: "hidden"
        }}>
          <div style={{
            background: "#3a6a1a",
            height: "100%",
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            transition: "width 0.3s"
          }} />
        </div>

        {/* Question Card */}
        <div style={{
          background: "#fdfaf4",
          border: "1.5px solid #c8b888",
          borderRadius: "12px",
          padding: "32px 24px",
          marginBottom: "24px"
        }}>
          <div style={{
            fontFamily: "Lora,serif",
            fontSize: "18px",
            color: "#2c1a08",
            fontWeight: 600,
            lineHeight: 1.6,
            marginBottom: "24px"
          }}>
            {currentQuestion.question}
          </div>

          {/* Flashcard Flip */}
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            style={{
              width: "100%",
              padding: "20px",
              background: showAnswer ? "#e8f4d8" : "#fffef5",
              border: "2px solid #c8b888",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s",
              minHeight: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => e.target.style.background = showAnswer ? "#d4e8c8" : "#f0ebe0"}
            onMouseLeave={(e) => e.target.style.background = showAnswer ? "#e8f4d8" : "#fffef5"}
          >
            <div style={{
              fontFamily: "Lora,serif",
              fontSize: "16px",
              color: "#2c1a08",
              textAlign: "center",
              lineHeight: 1.6
            }}>
              {showAnswer ? (
                <>
                  <strong>{currentQuestion.answer}</strong>
                  <div style={{ fontSize: "12px", color: "#8a7a50", marginTop: "12px", fontStyle: "italic" }}>
                    {currentQuestion.explanation}
                  </div>
                </>
              ) : (
                <em style={{ color: "#8a7a50" }}>Click to reveal answer</em>
              )}
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        {mode === "practice" && showAnswer && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
            <button
              onClick={markIncorrect}
              style={{
                ...buttonStyle,
                background: "#f4e4d8",
                color: "#8a4a1a"
              }}
            >
              ✗ Got it wrong
            </button>
            <button
              onClick={markCorrect}
              style={{
                ...buttonStyle,
                background: "#e8f4d8",
                color: "#3a6a1a"
              }}
            >
              ✓ Got it right
            </button>
          </div>
        )}

        <button
          onClick={nextQuestion}
          style={{
            ...buttonStyle,
            background: "#3a6a1a",
            color: "#f0ead8",
            border: "none",
            fontWeight: 600
          }}
        >
          Next Question →
        </button>
      </div>
    );
  }

  if (mode === "review") {
    const passingScore = 6;
    const passed = stats.correct >= passingScore;

    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 20px", textAlign: "center" }}>
        <div style={{
          background: passed ? "#e8f4d8" : "#f4e4d8",
          border: `2px solid ${passed ? "#4a8a2a" : "#c8724a"}`,
          borderRadius: "12px",
          padding: "32px 24px",
          marginBottom: "24px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>
            {passed ? "🎉" : "📚"}
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 900,
            fontSize: "28px",
            color: passed ? "#2d4a18" : "#8a4a1a",
            margin: "0 0 12px"
          }}>
            {passed ? "You Passed!" : "Keep Practicing"}
          </h2>
          <div style={{
            fontSize: "20px",
            fontWeight: 600,
            color: passed ? "#3a6a1a" : "#8a5a2a",
            marginBottom: "12px"
          }}>
            {stats.correct} out of 10 correct
          </div>
          <div style={{
            fontSize: "14px",
            color: "#6a5a30",
            fontFamily: "Lora,serif"
          }}>
            {passed
              ? "You scored high enough to pass the real test! Continue studying to master all topics."
              : "You need 6 out of 10 to pass. Review the questions you missed and try again."}
          </div>
        </div>

        <button
          onClick={() => setMode("select")}
          style={{
            ...buttonStyle,
            background: "#3a6a1a",
            color: "#f0ead8",
            border: "none",
            fontWeight: 600,
            fontSize: "15px"
          }}
        >
          Back to Categories
        </button>
      </div>
    );
  }
}
