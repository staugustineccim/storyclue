import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { encodePuzzle } from "../utils/urlEncoder";
import { buildLayout } from "../utils/layoutBuilder";
import { buildDemoData, getDemoUrl, SERIES_DATA } from "../utils/demoData";
import { savePrefs, loadPrefs } from "../utils/prefs";

const GRADE_GROUPS = [
  { label: "Early Learners", grades: [
    { key:"k", label:"K" },
    { key:"1", label:"1st" },
    { key:"2", label:"2nd" },
  ]},
  { label: "Elementary", grades: [
    { key:"3", label:"3rd" },
    { key:"4", label:"4th" },
    { key:"5", label:"5th" },
  ]},
  { label: "Middle School", grades: [
    { key:"6", label:"6th" },
    { key:"7", label:"7th" },
    { key:"8", label:"8th" },
  ]},
  { label: "High School", grades: [
    { key:"9-10",  label:"9th–10th" },
    { key:"11-12", label:"11th–12th" },
  ]},
  { label: "Adult & Seniors", grades: [
    { key:"adult", label:"Reader Mode" },
  ]},
];

const FAITH_TRADITIONS = [
  { key:"none",                 label:"None / Secular" },
  { key:"christian-protestant", label:"Christian — Protestant" },
  { key:"christian-catholic",   label:"Christian — Catholic" },
  { key:"jewish",               label:"Jewish" },
  { key:"islamic",              label:"Islamic" },
  { key:"hindu",                label:"Hindu" },
  { key:"buddhist",             label:"Buddhist" },
  { key:"other",                label:"Other Faith Tradition" },
];

const BOOK_EXAMPLES = [
  "Book of Jonah",
  "Charlotte's Web, Chapter 1",
  "Genesis Chapter 1",
  "The Gettysburg Address",
  "Romeo and Juliet, Act 1 Scene 1",
  "The Lion the Witch and the Wardrobe, Chapter 1",
  "Harry Potter and the Philosopher's Stone, Chapter 1",
  "Jack Reacher: Killing Floor, Chapter 1",
];

export default function PuzzleGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Load saved prefs as initial state ──────────────────────────────────
  const saved = loadPrefs() || {};

  const [inputMode, setInputMode]       = useState(saved.inputMode   || "lookup");
  const [bookRef, setBookRef]           = useState("");
  const [text, setText]                 = useState("");
  const [urlRef, setUrlRef]             = useState("");
  const [title, setTitle]               = useState("");
  const [grade, setGrade]               = useState(saved.grade       || "3");
  const [faith, setFaith]               = useState(saved.faith       || "none");
  const [language, setLanguage]         = useState(saved.language    || "english");
  const [bilingualMode, setBilingual]   = useState(saved.bilingualMode || "");
  const [seriesMode, setSeriesMode]     = useState(false);
  const [selectedSeries, setSelectedSeries] = useState("charlottes-web");
  const [selectedBooks, setSelectedBooks]   = useState([]);
  const [currentChapter, setCurrentChapter] = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  // ── Items 11 & 12: version detection & grade advisory ─────────────────────
  const [versionCheckDone, setVersionCheckDone] = useState(false);
  const [versionData,      setVersionData]      = useState(null);   // API response
  const [selectedVersion,  setSelectedVersion]  = useState(null);   // chosen version id
  const [otherVersionText, setOtherVersionText] = useState("");

  // ── Item 6: generated puzzle links ────────────────────────────────────────
  const [generatedPuzzle, setGeneratedPuzzle] = useState(null); // {title, studentUrl, teacherUrl, playPath}
  const [copiedLink,      setCopiedLink]      = useState("");   // "student" | "teacher" | ""

  // ── Persist prefs whenever they change ─────────────────────────────────
  useEffect(() => {
    savePrefs({ inputMode, grade, faith, language, bilingualMode });
  }, [inputMode, grade, faith, language, bilingualMode]);

  // Reset version check whenever book reference or grade changes
  useEffect(() => {
    setVersionCheckDone(false);
    setVersionData(null);
    setSelectedVersion(null);
    setOtherVersionText("");
  }, [bookRef, grade]);

  useEffect(() => {
    if (searchParams.get("demo") === "cw") {
      navigate(getDemoUrl("3"), { replace: true });
    }
  }, []);

  const seriesBooks = SERIES_DATA[selectedSeries]?.books || [];

  function copyLink(which, url) {
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedLink(which);
      setTimeout(() => setCopiedLink(""), 2000);
    }).catch(() => {
      setCopiedLink(which + "-fail");
      setTimeout(() => setCopiedLink(""), 2500);
    });
  }

  function toggleBook(book) {
    setSelectedBooks(prev =>
      prev.includes(book) ? prev.filter(b => b !== book) : [...prev, book]
    );
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");

    if (inputMode === "paste" && text.trim().length < 50) {
      setError("Please paste at least a paragraph of text to generate a puzzle.");
      return;
    }
    if (inputMode === "lookup" && bookRef.trim().length < 3) {
      setError("Please enter a book name or chapter reference.");
      return;
    }
    if (inputMode === "url") {
      const u = urlRef.trim();
      if (!u.startsWith("http")) {
        setError("Please enter a valid URL starting with http or https.");
        return;
      }
    }

    // ── Item 11: Version check (lookup mode only, first time per book+grade) ──
    if (inputMode === "lookup" && !versionCheckDone) {
      setLoading(true);
      try {
        const vRes = await fetch("/api/check-versions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ bookRef: bookRef.trim(), grade }),
        });
        const vData = await vRes.json();
        setVersionCheckDone(true);
        if (vData.needsSelection && vData.versions?.length) {
          setVersionData(vData);
          setLoading(false);
          return; // Pause — show version picker to user
        }
        // No version ambiguity — fall through to generation below
      } catch {
        setVersionCheckDone(true); // Don't block on check failure
      }
    }

    // ── Item 11: Version selected? ───────────────────────────────────────────
    if (versionData && !selectedVersion) {
      setError("Please select which version you're using before generating.");
      return;
    }
    if (selectedVersion === "other" && !otherVersionText.trim()) {
      setError("Please type the exact title of the version you are using.");
      return;
    }

    // Build the final book reference with version appended
    let resolvedBookRef = bookRef.trim();
    if (selectedVersion && selectedVersion !== "other") {
      const v = versionData?.versions.find(v => v.id === selectedVersion);
      if (v) resolvedBookRef = `${bookRef.trim()} — ${v.name}`;
    } else if (selectedVersion === "other" && otherVersionText.trim()) {
      resolvedBookRef = `${bookRef.trim()} — ${otherVersionText.trim()}`;
    }

    setLoading(true);

    try {
      const body = {
        inputMode,
        bookRef: resolvedBookRef,
        chapterText: text,
        urlRef: urlRef.trim(),
        grade,
        faith,
        language: language === "spanish" && bilingualMode ? "english" : language,
        bilingualMode: language === "spanish" ? bilingualMode : "",
        seriesMode,
        selectedBooks: seriesMode ? selectedBooks : [],
        seriesName: seriesMode ? SERIES_DATA[selectedSeries]?.name : "",
        currentChapter: seriesMode ? currentChapter : "",
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
        setError("No vocabulary found. Try being more specific about the book and chapter.");
        setLoading(false);
        return;
      }

      const layout = buildLayout(data.words, grade);

      if (!layout) {
        setError("Couldn't build a grid from this content. Try a different chapter or paste the text directly.");
        setLoading(false);
        return;
      }

      const puzzleData = {
        title: title.trim() || data.title || "StoryClue Puzzle",
        grade,
        language: data.language || "english",
        rows: layout.rows,
        cols: layout.cols,
        words: layout.words,
      };

      // Item 6: show confirmation screen with both student and teacher links
      const pParam = encodePuzzle(puzzleData);
      const origin = window.location.origin;
      setGeneratedPuzzle({
        title:      puzzleData.title,
        studentUrl: `${origin}/play?p=${pParam}`,
        teacherUrl: `${origin}/play?p=${pParam}&t=1`,
        playPath:   `/play?p=${pParam}`,
      });
      setLoading(false);
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

  const isSpanish = language === "spanish";

  return (
    <div style={{ minHeight:"100vh", background:"#faf7f0", fontFamily:"Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        textarea:focus,input:focus,select:focus{border-color:#5a8a2a!important;box-shadow:0 0 0 2px rgba(90,138,42,.2)}
        .grade-btn{padding:7px 14px;border:1.5px solid #c8b888;border-radius:4px;font-size:12px;font-family:'Playfair Display',serif;font-weight:700;cursor:pointer;background:transparent;color:#4a3a18;transition:all .15s}
        .grade-btn:hover{background:#e8e0cc}
        .grade-btn.on{background:#3a6a1a;color:#f0ead8;border-color:#3a6a1a}
        .mode-btn{flex:1;padding:10px 8px;border:1.5px solid #c8b888;border-radius:4px;font-family:'Playfair Display',serif;font-weight:700;font-size:12px;cursor:pointer;transition:all .15s;text-align:center}
        .mode-btn.on{background:#3a6a1a;color:#f0ead8;border-color:#3a6a1a}
        .mode-btn:not(.on){background:#fffef5;color:#4a3a18}
        .mode-btn:not(.on):hover{background:#e8e0cc}
        .lang-btn{padding:8px 18px;border:1.5px solid #c8b888;border-radius:4px;font-size:13px;font-family:'Playfair Display',serif;font-weight:700;cursor:pointer;transition:all .15s}
        .lang-btn.on{background:#3a6a1a;color:#f0ead8;border-color:#3a6a1a}
        .lang-btn:not(.on){background:#fffef5;color:#4a3a18}
        .lang-btn:not(.on):hover{background:#e8e0cc}
        .book-check{display:flex;align-items:center;gap:8px;padding:5px 0;cursor:pointer;font-family:Lora,serif;font-size:13px;color:#2c1a08}
        .book-check input{accent-color:#3a6a1a;width:15px;height:15px;cursor:pointer}
        .example-chip{display:inline-block;padding:5px 10px;margin:3px;border:1px solid #c8b888;border-radius:20px;font-family:Lora,serif;font-size:12px;color:#4a3a18;cursor:pointer;background:#fffef5;transition:all .15s}
        .example-chip:hover{background:#e8f0d8;border-color:#5a8a2a;color:#2d4a18}
        .bilingual-btn{flex:1;padding:7px 6px;border:1.5px solid #c8b888;border-radius:4px;font-family:Lora,serif;font-size:11px;cursor:pointer;transition:all .15s;text-align:center;line-height:1.4}
        .bilingual-btn.on{background:#3a6a1a;color:#f0ead8;border-color:#3a6a1a}
        .bilingual-btn:not(.on){background:#fffef5;color:#4a3a18}
        .bilingual-btn:not(.on):hover{background:#e8e0cc}
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#2d4a18,#4a7a22)", padding:"14px 20px", borderBottom:"3px solid #8a7a30", display:"flex", alignItems:"center", gap:"14px" }}>
        <button onClick={() => navigate("/")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"28px", padding:0 }}>🕷️</button>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:"#f0ead8", lineHeight:1.1 }}>StoryClue</div>
          <div style={{ fontSize:"11px", color:"#a8d890", fontStyle:"italic" }}>AI Generated Crossword Puzzle Maker</div>
        </div>
      </div>

      <div style={{ maxWidth:"700px", margin:"0 auto", padding:"32px 20px" }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"28px", color:"#2d4a18", marginBottom:"8px" }}>
          Create Your Crossword
        </h1>
        <p style={{ fontFamily:"Lora,serif", fontSize:"15px", color:"#6a5a30", marginBottom:"28px", fontStyle:"italic" }}>
          Name any book and chapter, paste your own text, or drop in a URL. StoryClue builds the puzzle in seconds.
        </p>

        {/* ── Item 6: Puzzle-ready confirmation screen ──────────────── */}
        {generatedPuzzle && (
          <div style={{ animation:"fadeIn .4s ease" }}>
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
            <div style={{ background:"#e8f4d8", border:"2px solid #4a8a2a", borderRadius:"10px", padding:"22px 20px", marginBottom:"28px" }}>
              <div style={{ fontSize:"2rem", marginBottom:"8px" }}>🎉</div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1.4rem", color:"#2d4a18", margin:"0 0 6px" }}>
                Puzzle Ready!
              </h2>
              <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#4a6a28", marginBottom:"20px", fontStyle:"italic" }}>
                {generatedPuzzle.title}
              </div>

              {/* Student Link */}
              <div style={{ marginBottom:"16px" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:"#2d4a18", marginBottom:"6px" }}>
                  🎒 Student Link
                </div>
                <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                  <input
                    readOnly
                    value={generatedPuzzle.studentUrl}
                    style={{ flex:1, padding:"8px 10px", border:"1.5px solid #b8d898", borderRadius:"4px", fontFamily:"Lora,Georgia,serif", fontSize:"12px", background:"#fffef5", color:"#2c1a08", outline:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                    onClick={e => e.target.select()}
                  />
                  <button
                    onClick={() => copyLink("student", generatedPuzzle.studentUrl)}
                    style={{ padding:"8px 12px", background: copiedLink==="student" ? "#4a8a2a" : "#3a6a1a", color:"#f0ead8", border:"none", borderRadius:"4px", fontFamily:"Lora,serif", fontSize:"12px", fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}
                  >
                    {copiedLink === "student" ? "✓ Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => navigate(generatedPuzzle.playPath)}
                    style={{ padding:"8px 12px", background:"#3a6a1a", color:"#f0ead8", border:"none", borderRadius:"4px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"12px", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, boxShadow:"2px 2px 0 #1a3a08" }}
                  >
                    ▶ Play
                  </button>
                </div>
              </div>

              {/* Teacher Link */}
              <div style={{ background:"#fffbe8", border:"1.5px solid #d4a020", borderRadius:"6px", padding:"12px 14px" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:"#7a5000", marginBottom:"4px" }}>
                  🔑 Teacher Link — <span style={{ fontWeight:400 }}>only share this with yourself</span>
                </div>
                <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#9a7030", marginBottom:"8px" }}>
                  This link unlocks Answer Key printing. Never share it with students.
                </div>
                <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                  <input
                    readOnly
                    value={generatedPuzzle.teacherUrl}
                    style={{ flex:1, padding:"8px 10px", border:"1.5px solid #d4a020", borderRadius:"4px", fontFamily:"Lora,Georgia,serif", fontSize:"12px", background:"#fffef5", color:"#2c1a08", outline:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                    onClick={e => e.target.select()}
                  />
                  <button
                    onClick={() => copyLink("teacher", generatedPuzzle.teacherUrl)}
                    style={{ padding:"8px 12px", background: copiedLink==="teacher" ? "#8a7000" : "#c0900a", color:"#fff", border:"none", borderRadius:"4px", fontFamily:"Lora,serif", fontSize:"12px", fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}
                  >
                    {copiedLink === "teacher" ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setGeneratedPuzzle(null);
                setVersionCheckDone(false);
                setVersionData(null);
                setSelectedVersion(null);
                setOtherVersionText("");
              }}
              style={{ width:"100%", padding:"12px", background:"transparent", border:"2px solid #3a6a1a", color:"#3a6a1a", borderRadius:"6px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", cursor:"pointer", letterSpacing:"0.5px" }}
            >
              ✦ Generate Another Puzzle
            </button>
          </div>
        )}

        <form onSubmit={handleGenerate} style={{ display: generatedPuzzle ? "none" : "block" }}>

          {/* ── Mode Toggle ─────────────────────────────────────────────── */}
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>How would you like to create your puzzle?</label>
            <div style={{ display:"flex", gap:"8px" }}>
              <button type="button" className={`mode-btn${inputMode==="lookup"?" on":""}`}
                onClick={() => setInputMode("lookup")}>
                📚 Name a Book or Chapter
              </button>
              <button type="button" className={`mode-btn${inputMode==="paste"?" on":""}`}
                onClick={() => setInputMode("paste")}>
                📋 Paste Your Own Text
              </button>
              <button type="button" className={`mode-btn${inputMode==="url"?" on":""}`}
                onClick={() => setInputMode("url")}>
                🌐 Paste a URL
              </button>
            </div>
          </div>

          {/* ── LOOKUP MODE ─────────────────────────────────────────────── */}
          {inputMode === "lookup" && (
            <div style={{ marginBottom:"24px" }}>
              <label style={labelStyle}>Book, Chapter, or Topic</label>
              <input
                type="text"
                value={bookRef}
                onChange={e => setBookRef(e.target.value)}
                placeholder="e.g. Book of Jonah, Charlotte's Web Chapter 1, Genesis Chapter 1"
                style={{ ...inputStyle, fontSize:"15px", padding:"12px 14px" }}
              />
              <div style={{ marginTop:"10px" }}>
                <div style={{ fontSize:"11px", color:"#8a7a5a", fontFamily:"Lora,serif", marginBottom:"6px" }}>
                  Try one of these:
                </div>
                <div>
                  {BOOK_EXAMPLES.map(ex => (
                    <span key={ex} className="example-chip" onClick={() => setBookRef(ex)}>{ex}</span>
                  ))}
                </div>
              </div>
              <div style={{ marginTop:"10px", padding:"10px 12px", background:"#e8f0d8", borderRadius:"4px", border:"1px solid #b8d898" }}>
                <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#3a5a18", lineHeight:1.6 }}>
                  <strong>Works best with:</strong> any faith tradition, classic literature, children's books, and well-known stories. For modern copyrighted books, Claude uses its knowledge of the story to create vocabulary-rich clues.
                </div>
              </div>
            </div>
          )}

          {/* ── PASTE MODE ──────────────────────────────────────────────── */}
          {inputMode === "paste" && (
            <div style={{ marginBottom:"24px" }}>
              <label style={labelStyle}>Chapter or Passage Text *</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste a chapter, passage, or topic description here. The more text you paste, the better the puzzle."
                rows={10}
                style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }}
              />
              <div style={{ fontSize:"11px", color:"#8a7a5a", marginTop:"4px", fontFamily:"Lora,serif" }}>
                {text.length > 0 ? `${text.length.toLocaleString()} characters` : "Paste at least 200 characters for best results"}
              </div>
            </div>
          )}

          {/* ── URL MODE ────────────────────────────────────────────────── */}
          {inputMode === "url" && (
            <div style={{ marginBottom:"24px" }}>
              <label style={labelStyle}>Article or Web Page URL</label>
              <input
                type="url"
                value={urlRef}
                onChange={e => setUrlRef(e.target.value)}
                placeholder="https://example.com/article"
                style={{ ...inputStyle, fontSize:"15px", padding:"12px 14px" }}
              />
              <div style={{ marginTop:"10px", padding:"10px 12px", background:"#e8f0d8", borderRadius:"4px", border:"1px solid #b8d898" }}>
                <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#3a5a18", lineHeight:1.6 }}>
                  StoryClue will fetch the article and extract the text automatically. <strong>Note:</strong> Some websites block outside access — if that happens, copy and paste the article text directly using the Paste option instead.
                </div>
              </div>
            </div>
          )}

          {/* ── Title ───────────────────────────────────────────────────── */}
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>Puzzle Title (optional — we'll generate one if blank)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Book of Jonah — Vocabulary Crossword"
              style={inputStyle}
            />
          </div>

          {/* ── Grade Level ─────────────────────────────────────────────── */}
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>Grade Level for Clues</label>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {GRADE_GROUPS.map(group => (
                <div key={group.label}>
                  <div style={{ fontSize:"11px", color:"#8a7a5a", fontFamily:"Lora,serif", marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{group.label}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                    {group.grades.map(g => (
                      <button type="button" key={g.key}
                        className={`grade-btn${grade===g.key?" on":""}`}
                        onClick={() => setGrade(g.key)}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Faith Tradition ─────────────────────────────────────────── */}
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>Faith Tradition (optional)</label>
            <select value={faith} onChange={e => setFaith(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
              {FAITH_TRADITIONS.map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* ── Language ────────────────────────────────────────────────── */}
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>Language</label>
            <div style={{ display:"flex", gap:"8px", marginBottom: isSpanish ? "12px" : 0 }}>
              <button type="button" className={`lang-btn${!isSpanish?" on":""}`} onClick={() => { setLanguage("english"); setBilingual(""); }}>
                🇺🇸 English
              </button>
              <button type="button" className={`lang-btn${isSpanish?" on":""}`} onClick={() => setLanguage("spanish")}>
                🇪🇸 Spanish
              </button>
            </div>

            {isSpanish && (
              <div style={{ marginTop:"10px" }}>
                <div style={{ fontSize:"11px", color:"#8a7a5a", fontFamily:"Lora,serif", marginBottom:"6px" }}>
                  Bilingual Mode (optional)
                </div>
                <div style={{ display:"flex", gap:"6px" }}>
                  <button type="button" className={`bilingual-btn${bilingualMode===""?" on":""}`} onClick={() => setBilingual("")}>
                    Spanish only
                  </button>
                  <button type="button" className={`bilingual-btn${bilingualMode==="en-clue-es-word"?" on":""}`} onClick={() => setBilingual("en-clue-es-word")}>
                    English clues<br/>Spanish answers
                  </button>
                  <button type="button" className={`bilingual-btn${bilingualMode==="es-clue-en-word"?" on":""}`} onClick={() => setBilingual("es-clue-en-word")}>
                    Spanish clues<br/>English answers
                  </button>
                </div>
                <div style={{ marginTop:"8px", padding:"8px 10px", background:"#fff8e8", border:"1px solid #e0c860", borderRadius:"4px" }}>
                  <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#7a5500", lineHeight:1.6 }}>
                    ⚠️ AI-generated Spanish content. We recommend review by a fluent Spanish speaker for classroom use.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Series Mode ─────────────────────────────────────────────── */}
          <div style={{ marginBottom:"28px", background:"#f4efe4", border:"1.5px solid #c8b888", borderRadius:"6px", padding:"16px" }}>
            <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", marginBottom:0 }}>
              <input type="checkbox" checked={seriesMode} onChange={e => setSeriesMode(e.target.checked)}
                style={{ accentColor:"#3a6a1a", width:"16px", height:"16px", cursor:"pointer" }} />
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", color:"#4a3a18" }}>
                Series Mode — Spoiler Protection
              </span>
            </label>
            <div style={{ fontSize:"12px", color:"#6a5a30", fontFamily:"Lora,serif", marginTop:"6px", marginLeft:"26px" }}>
              Select which books you've read. StoryClue will never reference events from unread books or chapters.
            </div>

            {seriesMode && (
              <div style={{ marginTop:"16px" }}>
                <div style={{ marginBottom:"10px" }}>
                  <label style={{ ...labelStyle, fontSize:"12px" }}>Select Series</label>
                  <select value={selectedSeries} onChange={e => { setSelectedSeries(e.target.value); setSelectedBooks([]); }}
                    style={{ ...inputStyle, fontSize:"13px" }}>
                    {Object.entries(SERIES_DATA).map(([key, s]) => (
                      <option key={key} value={key}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom:"10px" }}>
                  <label style={{ ...labelStyle, fontSize:"12px" }}>Books I Have Read</label>
                  <div style={{ maxHeight:"200px", overflowY:"auto", background:"#fffef5", border:"1px solid #c8b888", borderRadius:"4px", padding:"8px 12px" }}>
                    {seriesBooks.map(book => (
                      <label key={book} className="book-check">
                        <input type="checkbox" checked={selectedBooks.includes(book)} onChange={() => toggleBook(book)} />
                        {book}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Chapter-level protection */}
                <div style={{ marginBottom:"4px" }}>
                  <label style={{ ...labelStyle, fontSize:"12px" }}>
                    I'm currently on Chapter (optional — for chapter-level spoiler protection)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={currentChapter}
                    onChange={e => setCurrentChapter(e.target.value)}
                    placeholder="e.g. 5"
                    style={{ ...inputStyle, fontSize:"13px", width:"120px" }}
                  />
                  {currentChapter && (
                    <div style={{ fontSize:"11px", color:"#3a5a18", fontFamily:"Lora,serif", marginTop:"4px" }}>
                      Puzzle will only use vocabulary from Chapters 1–{currentChapter}.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Items 11 & 12: Version picker & grade advisory ──────────── */}
          {versionData && inputMode === "lookup" && (
            <div style={{ marginBottom:"24px" }}>
              {/* Version picker */}
              <div style={{ background:"#f4efe4", border:"2px solid #c8a830", borderRadius:"8px", padding:"18px" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"17px", color:"#2d4a18", marginBottom:"4px" }}>
                  {versionData.promptFor}
                </div>
                <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#6a5a30", marginBottom:"14px" }}>
                  Different versions use very different vocabulary. Selecting the right one gives the best clues for your grade.
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {versionData.versions.map(v => {
                    const isSelected = selectedVersion === v.id;
                    return (
                      <label key={v.id} style={{ display:"flex", alignItems:"flex-start", gap:"10px", padding:"10px 12px", borderRadius:"6px", border:`2px solid ${isSelected ? "#3a6a1a" : "#c8b888"}`, background: isSelected ? "#e8f0d8" : "#fffef5", cursor:"pointer", transition:"all .15s" }}>
                        <input type="radio" name="version" value={v.id} checked={isSelected} onChange={() => { setSelectedVersion(v.id); setOtherVersionText(""); }} style={{ accentColor:"#3a6a1a", marginTop:"3px", flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", color:"#2c1a08" }}>{v.name}</span>
                            {v.popular && (
                              <span style={{ background:"#3a6a1a", color:"#f0ead8", fontSize:"10px", fontFamily:"Lora,serif", fontWeight:600, padding:"2px 7px", borderRadius:"10px", letterSpacing:"0.5px" }}>Most Popular</span>
                            )}
                          </div>
                          {v.id !== "other" && (
                            <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#6a5a30", marginTop:"2px" }}>{v.description}</div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Other: free-text input */}
                {selectedVersion === "other" && (
                  <div style={{ marginTop:"10px" }}>
                    <input
                      type="text"
                      value={otherVersionText}
                      onChange={e => setOtherVersionText(e.target.value)}
                      placeholder="Type the exact title of the version you are using"
                      autoFocus
                      style={{ width:"100%", padding:"10px 12px", border:"2px solid #3a6a1a", borderRadius:"4px", fontFamily:"Lora,Georgia,serif", fontSize:"14px", background:"#fffef5", color:"#2c1a08", outline:"none" }}
                    />
                  </div>
                )}
              </div>

              {/* Item 12: Grade advisory — shown immediately when mismatch version is selected */}
              {selectedVersion && selectedVersion !== "other" && (() => {
                const v = versionData.versions.find(v => v.id === selectedVersion);
                if (!v || v.gradeMatch === "excellent" || v.gradeMatch === "good" || v.gradeMatch === "unknown") return null;
                const isSlight = v.gradeMatch === "slight-mismatch";
                return (
                  <div style={{ marginTop:"10px", padding:"12px 14px", background: isSlight ? "#fffbe8" : "#fff3e0", border:`2px solid ${isSlight ? "#d4a020" : "#d07010"}`, borderRadius:"6px" }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color: isSlight ? "#7a5000" : "#8a3800", marginBottom:"4px" }}>
                      {isSlight ? "⚠️ Grade Level Advisory" : "⚠️ Grade Level Warning"}
                    </div>
                    <div style={{ fontFamily:"Lora,serif", fontSize:"13px", color: isSlight ? "#7a5000" : "#8a3800", lineHeight:1.55 }}>
                      {v.mismatchNote}
                    </div>
                    {v.alternativeName && (
                      <div style={{ marginTop:"8px", fontFamily:"Lora,serif", fontSize:"12px", color:"#3a6a1a", fontWeight:600 }}>
                        Better match for your grade: {v.alternativeName}
                      </div>
                    )}
                    <div style={{ marginTop:"6px", fontFamily:"Lora,serif", fontSize:"11px", color:"#8a7a50", fontStyle:"italic" }}>
                      You can still generate with your selected version — this is advisory only.
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Error ───────────────────────────────────────────────────── */}
          {error && (
            <div style={{ background:"#ffe0e0", border:"1px solid #e08080", borderRadius:"4px", padding:"10px 14px", marginBottom:"16px", fontFamily:"Lora,serif", fontSize:"13px", color:"#8b1010" }}>
              {error}
            </div>
          )}

          {/* ── Submit ──────────────────────────────────────────────────── */}
          <button type="submit" disabled={loading} style={{
            width:"100%", padding:"14px", fontSize:"16px",
            fontFamily:"'Playfair Display',serif", fontWeight:900,
            background: loading ? "#8a9a78" : "#3a6a1a",
            color:"#f0ead8", border:"none", borderRadius:"6px",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "3px 3px 0 #1a3a08",
            transition:"all .2s", letterSpacing:"1px",
          }}>
            {loading ? "✨ Generating Puzzle..." : "✨ Generate Puzzle"}
          </button>

          {loading && (
            <div style={{ textAlign:"center", marginTop:"14px", fontFamily:"Lora,serif", fontSize:"13px", color:"#5a8a2a", fontStyle:"italic" }}>
              {!versionCheckDone && inputMode === "lookup"
                ? "Checking for version options..."
                : inputMode === "url"
                  ? "Fetching article and writing clues... about 15 seconds."
                  : `Claude is reading ${inputMode === "lookup" ? `"${bookRef}"` : "your text"} and writing clues... about 10 seconds.`}
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
          <button onClick={() => navigate(getDemoUrl("3"))}
            style={{ background:"transparent", border:"2px solid #3a6a1a", color:"#3a6a1a", padding:"8px 20px", borderRadius:"4px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>
            View Demo Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
