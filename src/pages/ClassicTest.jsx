import { useState } from "react";

// ── ClassicTest ────────────────────────────────────────────────────────────
// Minimal test page for Classic Crossword engine
// Calls /api/generate-classic with sample content, displays results

const JONAH_TEXT = `The Tale of Jonah: A prophet named Jonah was called by God to preach to the city of Nineveh. But Jonah didn't want to go, so he ran away and sailed on a ship across the sea. A great storm came, and Jonah knew it was because of him. He asked the sailors to throw him overboard. When they did, a great fish swallowed him. Inside the fish for three days and nights, Jonah prayed to God. The fish then spit Jonah out on shore, and he finally went to Nineveh.`;

export default function ClassicTest() {
  const [source, setSource] = useState(JONAH_TEXT);
  const [grade, setGrade] = useState("6-12");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [clueMode, setClueMode] = useState("rich");

  async function generatePuzzle() {
    setLoading(true);
    setError(null);
    setPuzzle(null);

    try {
      const res = await fetch("/api/generate-classic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          grade,
          theme: "Test",
          contentType: "text",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Generation failed");
        return;
      }

      setPuzzle(data.puzzle);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", fontFamily: "Georgia,serif", color: "#17150f" }}>
      <h1>🧪 Classic Crossword Engine Test</h1>

      {/* Input form */}
      <div style={{ background: "#f5f3ee", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Source Text</label>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "10px",
              fontFamily: "monospace",
              fontSize: "12px",
              border: "1px solid #c8b888",
              borderRadius: "4px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Grade Level</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            style={{ padding: "8px", fontFamily: "Georgia,serif" }}
          >
            <option value="k">Kindergarten</option>
            <option value="1">1st Grade</option>
            <option value="2">2nd Grade</option>
            <option value="3">3rd Grade</option>
            <option value="6-12">6th-12th Grade</option>
            <option value="adult">Reader Mode</option>
          </select>
        </div>

        <button
          onClick={generatePuzzle}
          disabled={loading}
          style={{
            padding: "10px 24px",
            background: "#1e4d2b",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontFamily: "Georgia,serif",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Generating..." : "Generate Puzzle"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#fce4ec", border: "2px solid #ec407a", borderRadius: "8px", padding: "15px", marginBottom: "20px", color: "#c2185b" }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {puzzle && (
        <div>
          <div style={{ background: "#e8f5e9", border: "2px solid #66bb6a", borderRadius: "8px", padding: "15px", marginBottom: "20px" }}>
            <strong>✅ Puzzle generated!</strong>
            <ul style={{ marginTop: "10px", fontSize: "14px" }}>
              <li>Words: {puzzle.stats.wordCount}</li>
              <li>Blocks: {puzzle.stats.blockCount}</li>
              <li>Fill time: {puzzle.stats.fillTime.toFixed(2)}s</li>
              <li>Topic ratio: {(puzzle.stats.topicRatio * 100).toFixed(0)}% ({puzzle.stats.onTopicWords} on-topic)</li>
              <li>Clues: {puzzle.clues.length}</li>
            </ul>
          </div>

          {/* Clue mode toggle */}
          <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => setClueMode("rich")}
              style={{
                padding: "8px 16px",
                background: clueMode === "rich" ? "#1e4d2b" : "#fff",
                color: clueMode === "rich" ? "#fff" : "#1e4d2b",
                border: "2px solid #1e4d2b",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "Georgia,serif",
              }}
            >
              Rich Clues
            </button>
            <button
              onClick={() => setClueMode("classic")}
              style={{
                padding: "8px 16px",
                background: clueMode === "classic" ? "#1e4d2b" : "#fff",
                color: clueMode === "classic" ? "#fff" : "#1e4d2b",
                border: "2px solid #1e4d2b",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "Georgia,serif",
              }}
            >
              Classic Clues
            </button>
          </div>

          {/* Grid visualization */}
          <div style={{ marginBottom: "20px", overflow: "auto" }}>
            <h3>Grid (15×15)</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(15, 32px)",
                gap: "1px",
                background: "#17150f",
                padding: "4px",
                width: "fit-content",
              }}
            >
              {puzzle.pattern.map((row, r) =>
                row.split("").map((cell, c) => (
                  <div
                    key={`${r},${c}`}
                    style={{
                      width: "32px",
                      height: "32px",
                      background: cell === "#" ? "#17150f" : "#fff",
                      border: "1px solid #ddd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sample clues */}
          <div>
            <h3>Sample Clues ({clueMode === "rich" ? "Rich" : "Classic"} mode)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <h4>Across</h4>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {puzzle.clues
                    .filter((c) => c.dir === "A")
                    .slice(0, 10)
                    .map((clue) => (
                      <li key={`${clue.num}A`} style={{ marginBottom: "8px", fontSize: "13px" }}>
                        <strong>{clue.num}.</strong> {clueMode === "rich" ? clue.clue_rich : clue.clue_classic}
                        {clue.on_topic && <span style={{ marginLeft: "8px", color: "#1e4d2b", fontWeight: "bold" }}>★</span>}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <h4>Down</h4>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {puzzle.clues
                    .filter((c) => c.dir === "D")
                    .slice(0, 10)
                    .map((clue) => (
                      <li key={`${clue.num}D`} style={{ marginBottom: "8px", fontSize: "13px" }}>
                        <strong>{clue.num}.</strong> {clueMode === "rich" ? clue.clue_rich : clue.clue_classic}
                        {clue.on_topic && <span style={{ marginLeft: "8px", color: "#1e4d2b", fontWeight: "bold" }}>★</span>}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "#888" }}>★ = topic-connected clue</p>
          </div>
        </div>
      )}
    </div>
  );
}
