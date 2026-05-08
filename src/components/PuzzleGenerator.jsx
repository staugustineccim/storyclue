import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { encodePuzzle } from "../utils/urlEncoder";
import { buildLayout } from "../utils/layoutBuilder";
import { buildDemoData, getDemoUrl, SERIES_DATA } from "../utils/demoData";

const GRADES = [
  { key:"k",  label:"Kindergarten" },
  { key:"1",  label:"1st Grade" },
  { key:"2",  label:"2nd Grade" },
  { key:"3",  label:"3rd Grade (default)" },
  { key:"4",  label:"4th Grade" },
  { key:"5",  label:"5th Grade" },
  { key:"6",  label:"6th Grade" },
];

const FAITH_TRADITIONS = [
  { key:"none",      label:"None / Secular" },
  { key:"christian", label:"Christian" },
  { key:"catholic",  label:"Catholic" },
  { key:"jewish",    label:"Jewish" },
];

export default function PuzzleGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState("3");
  const [seriesMode, setSeriesMode] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState("charlottes-web");
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [faith, setFaith] = useState("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle ?demo=cw param — load Charlotte's Web demo directly
  useEffect(() => {
    if (searchParams.get("demo") === "cw") {
      navigate(getDemoUrl("3"), { replace: true });
    }
  }, []);

  const seriesBooks = SERIES_DATA[selectedSeries]?.books || [];

  function toggleBook(book) {
    setSelectedBooks(prev =>
      prev.includes(book) ? prev.filter(b => b !== book) : [...prev, book]
    );
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");

    if (!text.trim() || text.trim().length < 50) {
      setError("Please paste at least a paragraph of text to generate a puzzle.");
      return;
    }

    setLoading(true);

    try {
      const body = {
        chapterText: text,
        grade,
        seriesMode,
        selectedBooks: seriesMode ? selectedBooks : [],
        seriesName: seriesMode ? SERIES_DATA[selectedSeries]?.name : "",
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Could not generate puzzle. Please try again.");
        setLoading(false);
        return;
      }

      if (!data.words || data.words.length < 10) {
        setError("No vocabulary found. Try pasting more chapter content.");
        setLoading(false);
        return;
      }

      // Build layout client-side
      const layout = buildLayout(data.words);

      if (!layout) {
        setError("Couldn't build a grid from this text. Try pasting more content or a different passage.");
        setLoading(false);
        return;
      }

      const puzzleData = {
        title: title.trim() || data.title || "StoryClue Puzzle",
        grade,
        rows: layout.rows,
        cols: layout.cols,
        words: layout.words,
      };

      const encoded = encodePuzzle(puzzleData);
      navigate("/play?p=" + encoded);
    } catch (err) {
      console.error(err);
      setError("Could not generate puzzle. Please try again.");
      setLoading(false);
    }
  }

  const inputStyle = {
    width:"100%", padding:"10px 12px",
    border:"1.5px solid #c8b888", borderRadius:"4px",
    fontFamily:"Lora,Georgia,serif", fontSize:"14px",
    background:"#fffef5", color:"#2c1a08",
    outline:"none",
  };

  const labelStyle = {
    display:"block", marginBottom:"6px",
    fontFamily:"'Playfair Display',serif", fontWeight:700,
    fontSize:"13px", color:"#4a3a18",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#faf7f0", fontFamily:"Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        textarea:focus,input:focus,select:focus{border-color:#5a8a2a!important;box-shadow:0 0 0 2px rgba(90,138,42,.2)}
        .grade-btn{padding:7px 14px;border:1.5px solid #c8b888;border-radius:4px;font-size:12px;font-family:'Playfair Display',serif;font-weight:700;cursor:pointer;background:transparent;color:#4a3a18;transition:all .15s}
        .grade-btn:hover{background:#e8e0cc}
        .grade-btn.on{background:#3a6a1a;color:#f0ead8;border-color:#3a6a1a}
        .book-check{display:flex;align-items:center;gap:8px;padding:5px 0;cursor:pointer;font-family:Lora,serif;font-size:13px;color:#2c1a08}
        .book-check input{accent-color:#3a6a1a;width:15px;height:15px;cursor:pointer}
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#2d4a18,#4a7a22)", padding:"14px 20px", borderBottom:"3px solid #8a7a30", display:"flex", alignItems:"center", gap:"14px" }}>
        <button onClick={() => navigate("/")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"28px", padding:0 }}>🕷️</button>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:"#f0ead8", lineHeight:1.1 }}>StoryClue</div>
          <div style={{ fontSize:"11px", color:"#a8d890", fontStyle:"italic" }}>Create a Crossword Puzzle</div>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth:"700px", margin:"0 auto", padding:"32px 20px" }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"28px", color:"#2d4a18", marginBottom:"8px" }}>
          Create Your Crossword
        </h1>
        <p style={{ fontFamily:"Lora,serif", fontSize:"15px", color:"#6a5a30", marginBottom:"32px", fontStyle:"italic" }}>
          Paste any chapter, passage, or topic description below. StoryClue extracts the vocabulary and builds your puzzle in seconds.
        </p>

        <form onSubmit={handleGenerate}>
          {/* Chapter Text */}
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>Chapter or Passage Text *</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste a chapter, passage, or topic description here. The more text you paste, the better the puzzle. Minimum one paragraph."
              rows={10}
              style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }}
              required
            />
            <div style={{ fontSize:"11px", color:"#8a7a5a", marginTop:"4px", fontFamily:"Lora,serif" }}>
              {text.length > 0 ? `${text.length.toLocaleString()} characters` : "Paste at least 200 characters for best results"}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>Puzzle Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Charlotte's Web — Chapter 1"
              style={inputStyle}
            />
          </div>

          {/* Grade Level */}
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>Grade Level for Clues</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {GRADES.map(g => (
                <button type="button" key={g.key}
                  className={`grade-btn${grade===g.key?" on":""}`}
                  onClick={() => setGrade(g.key)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Faith Tradition */}
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>Faith Tradition (optional)</label>
            <select
              value={faith}
              onChange={e => setFaith(e.target.value)}
              style={{ ...inputStyle, cursor:"pointer" }}
            >
              {FAITH_TRADITIONS.map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            {faith !== "none" && (
              <div style={{ fontSize:"12px", color:"#5a8a2a", marginTop:"6px", fontFamily:"Lora,serif", fontStyle:"italic" }}>
                Clues will be written with respect for {FAITH_TRADITIONS.find(f => f.key===faith)?.label} tradition.
              </div>
            )}
          </div>

          {/* Series Mode */}
          <div style={{ marginBottom:"28px", background:"#f4efe4", border:"1.5px solid #c8b888", borderRadius:"6px", padding:"16px" }}>
            <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", marginBottom:0 }}>
              <input
                type="checkbox"
                checked={seriesMode}
                onChange={e => setSeriesMode(e.target.checked)}
                style={{ accentColor:"#3a6a1a", width:"16px", height:"16px", cursor:"pointer" }}
              />
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", color:"#4a3a18" }}>
                Series Mode — Spoiler Protection
              </span>
            </label>
            <div style={{ fontSize:"12px", color:"#6a5a30", fontFamily:"Lora,serif", marginTop:"6px", marginLeft:"26px" }}>
              Select which books you've read. StoryClue will never reference events from unread books.
            </div>

            {seriesMode && (
              <div style={{ marginTop:"16px" }}>
                <div style={{ marginBottom:"10px" }}>
                  <label style={{ ...labelStyle, fontSize:"12px" }}>Select Series</label>
                  <select
                    value={selectedSeries}
                    onChange={e => { setSelectedSeries(e.target.value); setSelectedBooks([]); }}
                    style={{ ...inputStyle, fontSize:"13px" }}
                  >
                    {Object.entries(SERIES_DATA).map(([key, s]) => (
                      <option key={key} value={key}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom:"8px" }}>
                  <label style={{ ...labelStyle, fontSize:"12px" }}>Books I Have Read</label>
                  <div style={{ maxHeight:"200px", overflowY:"auto", background:"#fffef5", border:"1px solid #c8b888", borderRadius:"4px", padding:"8px 12px" }}>
                    {seriesBooks.map(book => (
                      <label key={book} className="book-check">
                        <input type="checkbox" checked={selectedBooks.includes(book)} onChange={() => toggleBook(book)} />
                        {book}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontSize:"11px", color:"#8a7a5a", marginTop:"4px", fontFamily:"Lora,serif" }}>
                    {selectedBooks.length} book{selectedBooks.length!==1?"s":""} selected
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:"#ffe0e0", border:"1px solid #e08080", borderRadius:"4px", padding:"10px 14px", marginBottom:"16px", fontFamily:"Lora,serif", fontSize:"13px", color:"#8b1010" }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:"100%", padding:"14px", fontSize:"16px",
              fontFamily:"'Playfair Display',serif", fontWeight:900,
              background: loading ? "#8a9a78" : "#3a6a1a",
              color:"#f0ead8", border:"none", borderRadius:"6px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "3px 3px 0 #1a3a08",
              transition:"all .2s",
              letterSpacing:"1px",
            }}
          >
            {loading ? "✨ Generating Puzzle..." : "✨ Generate Puzzle"}
          </button>

          {loading && (
            <div style={{ textAlign:"center", marginTop:"14px", fontFamily:"Lora,serif", fontSize:"13px", color:"#5a8a2a", fontStyle:"italic" }}>
              Claude is reading your chapter and writing clues... this takes about 10 seconds.
            </div>
          )}
        </form>

        {/* Demo link */}
        <div style={{ marginTop:"40px", padding:"20px", background:"#e8f0d8", border:"1px solid #b8d898", borderRadius:"6px", textAlign:"center" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"15px", color:"#2d4a18", marginBottom:"8px" }}>
            Want to see an example first?
          </div>
          <div style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#4a6a28", marginBottom:"12px" }}>
            Try the Charlotte's Web Chapter 1 demo — no text needed.
          </div>
          <button
            onClick={() => navigate(getDemoUrl("3"))}
            style={{ background:"transparent", border:"2px solid #3a6a1a", color:"#3a6a1a", padding:"8px 20px", borderRadius:"4px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", cursor:"pointer" }}
          >
            View Demo Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
