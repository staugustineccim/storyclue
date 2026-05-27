import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// encodePuzzle no longer used — new puzzles get persistent slug URLs via api/save-puzzle
import { buildLayout } from "../utils/layoutBuilder";
import { buildDemoData, getDemoUrl, SERIES_DATA } from "../utils/demoData";
import { savePrefs, loadPrefs } from "../utils/prefs";
import { trackEvent } from "../utils/analytics";
import { useAuth } from "../context/AuthContext";
import { authEnabled } from "../utils/supabase";
import AudienceSelector from "./AudienceSelector";
import SongsLibrary from "./SongsLibrary";
import AuthButton from "./AuthButton";

// ── Audience cookie helpers ────────────────────────────────────────────────
// Audience values: "early-learner" | "elementary" | "middle-high" | "adult"
const AUDIENCE_COOKIE = "sc_audience";
const AUDIENCE_TTL_DAYS = 90;

function getAudienceCookie() {
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${AUDIENCE_COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}
function setAudienceCookie(value) {
  const exp = new Date(Date.now() + AUDIENCE_TTL_DAYS * 864e5).toUTCString();
  document.cookie = `${AUDIENCE_COOKIE}=${value};expires=${exp};path=/;SameSite=Lax`;
}
function clearAudienceCookie() {
  document.cookie = `${AUDIENCE_COOKIE}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// Grade lists per audience (mirrors GRADE_GROUPS structure keys)
const AUDIENCE_GRADES = {
  "early-learner": ["k", "1", "2"],
  "elementary":    ["3", "4", "5"],
  "middle-high":   ["6", "7", "8", "9-10", "11-12"],
  "adult":         ["adult"],
};
const AUDIENCE_DEFAULT_GRADE = {
  "early-learner": "k",
  "elementary":    "3",
  "middle-high":   "6",
  "adult":         "adult",
};

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
  const { user } = useAuth();

  // Track how many puzzles generated this session (for "save your puzzles" nudge)
  const [sessionPuzzleCount, setSessionPuzzleCount] = useState(0);

  // ── Audience — read from cookie (null = not yet chosen → show selector) ──
  const [audience, setAudience] = useState(() => getAudienceCookie());

  // ── Load saved prefs as initial state ──────────────────────────────────
  const saved = loadPrefs() || {};

  const [inputMode, setInputMode]       = useState(saved.inputMode   || "lookup");
  const [bookRef, setBookRef]           = useState("");
  const [text, setText]                 = useState("");
  const [urlRef, setUrlRef]             = useState("");
  const [pdfStatus, setPdfStatus]       = useState(""); // "", "loading", "ready", "error"
  const [pdfFileName, setPdfFileName]   = useState("");
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

  // ── K-2 Early Learner features ────────────────────────────────────────────
  const [phonicsMode, setPhonicsMode] = useState(false);
  const [pictureMode, setPictureMode] = useState(false);

  // ── Songs & Rhymes ────────────────────────────────────────────────────────
  const [selectedSong, setSelectedSong] = useState(null); // { id, title, emoji }
  // Completed song IDs stored in localStorage — persist across sessions
  const [completedSongIds, setCompletedSongIds] = useState(() => {
    try {
      const raw = localStorage.getItem("sc_songs_done");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  function markSongCompleted(songId) {
    setCompletedSongIds(prev => {
      const next = new Set(prev);
      next.add(songId);
      try { localStorage.setItem("sc_songs_done", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

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

  // Reset K-2 features when grade moves above 2nd
  useEffect(() => {
    if (!["k","1","2"].includes(grade)) {
      setPhonicsMode(false);
      setPictureMode(false);
    }
  }, [grade]);

  useEffect(() => {
    if (searchParams.get("demo") === "cw") {
      navigate(getDemoUrl(grade), { replace: true });
    }
  }, []);

  const seriesBooks = SERIES_DATA[selectedSeries]?.books || [];

  // ── Audience selection ─────────────────────────────────────────────────────
  function chooseAudience(aud) {
    setAudienceCookie(aud);
    setAudience(aud);
    // Snap grade to audience default if current grade is outside this audience
    const allowed = AUDIENCE_GRADES[aud] || [];
    setGrade(prev => (allowed.includes(prev) ? prev : (AUDIENCE_DEFAULT_GRADE[aud] || "3")));
    // Early learners start in lookup mode; others keep saved mode
    if (aud === "early-learner") setInputMode("lookup");
  }

  function changeAudience() {
    clearAudienceCookie();
    setAudience(null);
  }

  // Derived audience properties
  const allowedGrades   = audience ? (AUDIENCE_GRADES[audience] || []) : null;
  const isEarlyAudience = audience === "early-learner";
  const isAdultAudience = audience === "adult";
  // Series Mode hidden for early learners
  const showSeriesMode  = audience !== "early-learner";
  // PDF upload hidden for early learners (they don't upload documents)
  const showPdfMode     = audience !== "early-learner";

  // ── Show audience selector if no audience chosen yet ──────────────────────
  if (!audience) {
    return <AudienceSelector onSelect={chooseAudience} />;
  }

  function copyLink(which, url) {
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedLink(which);
      setTimeout(() => setCopiedLink(""), 2000);
    }).catch(() => {
      setCopiedLink(which + "-fail");
      setTimeout(() => setCopiedLink(""), 2500);
    });
    // Track every share click (both student and teacher links)
    if (generatedPuzzle) {
      trackEvent("puzzle_shared", {
        book_title:  generatedPuzzle.title,
        grade_level: grade,
        link_type:   which, // "student" | "teacher"
      });
    }
  }

  function toggleBook(book) {
    setSelectedBooks(prev =>
      prev.includes(book) ? prev.filter(b => b !== book) : [...prev, book]
    );
  }

  // ── PDF extraction (PDF.js, runs entirely in browser) ────────────────────
  async function loadPdfFile(file) {
    if (!file || file.type !== "application/pdf") {
      setPdfStatus("error");
      return;
    }
    setPdfStatus("loading");
    setPdfFileName(file.name);
    try {
      // Lazy-load PDF.js from the CDN — free, no API key, no server call
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload  = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let allText = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page    = await pdf.getPage(p);
        const content = await page.getTextContent();
        const pageText = content.items.map(i => i.str).join(" ");
        allText += pageText + "\n";
        if (allText.length > 60000) break; // cap at ~60k chars — more than enough
      }
      const extracted = allText.trim();
      if (extracted.length < 50) {
        setPdfStatus("error");
        return;
      }
      setText(extracted);
      setPdfStatus("ready");
    } catch {
      setPdfStatus("error");
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");

    if (inputMode === "songs") {
      if (!selectedSong) {
        setError("Please choose a song from the library first.");
        return;
      }
    }
    if (inputMode === "paste" && text.trim().length < 50) {
      setError("Please paste at least a paragraph of text to generate a puzzle.");
      return;
    }
    if (inputMode === "pdf") {
      if (pdfStatus !== "ready" || text.trim().length < 50) {
        setError("Please upload a PDF first — or switch to Paste mode to type/paste text directly.");
        return;
      }
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
      const isK2 = ["k","1","2"].includes(grade);
      const body = {
        // PDF/songs mode: both resolve to lookup on the server (no chapterText needed)
        inputMode: inputMode === "pdf" ? "paste" : inputMode === "songs" ? "lookup" : inputMode,
        bookRef: inputMode === "songs" ? selectedSong.title : resolvedBookRef,
        chapterText: text,
        songsMode: inputMode === "songs",
        songId: inputMode === "songs" ? selectedSong.id : null,
        urlRef: urlRef.trim(),
        grade,
        faith,
        language: language === "spanish" && bilingualMode ? "english" : language,
        bilingualMode: language === "spanish" ? bilingualMode : "",
        seriesMode,
        selectedBooks: seriesMode ? selectedBooks : [],
        seriesName: seriesMode ? SERIES_DATA[selectedSeries]?.name : "",
        currentChapter: seriesMode ? currentChapter : "",
        phonicsMode: isK2 && phonicsMode,
        pictureMode: isK2 && pictureMode,
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

      if (!data.words || data.words.length < 3) {
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

      // Items 1 + 6: save puzzle to Postgres, get back a permanent readable slug
      const saveRes = await fetch("/api/save-puzzle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title:       puzzleData.title,
          grade,
          faith,
          language:    data.language || "english",
          rows:        layout.rows,
          cols:        layout.cols,
          words:       layout.words,
          phonicsMode: isK2 && phonicsMode,
          pictureMode: isK2 && pictureMode,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.slug) {
        setError(saveData.error || "Could not save puzzle to database. Make sure Vercel Postgres is connected in your project settings.");
        setLoading(false);
        return;
      }

      const origin = window.location.origin;
      // Songs puzzles append ?song=id so CrosswordPuzzle can show the reward card
      const songParam = (inputMode === "songs" && selectedSong) ? `?song=${selectedSong.id}` : "";
      setGeneratedPuzzle({
        title:      puzzleData.title,
        studentUrl: `${origin}/play/${saveData.slug}${songParam}`,
        teacherUrl: `${origin}/play/${saveData.slug}?t=1`,
        playPath:   `/play/${saveData.slug}${songParam}`,
        slug:       saveData.slug,
      });
      setSessionPuzzleCount(n => n + 1);

      // Track puzzle generation
      trackEvent("puzzle_generated", {
        book_title:      puzzleData.title,
        grade_level:     grade,
        faith_tradition: faith,
        language:        data.language || "english",
        input_method:    inputMode,
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
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:"#f0ead8", lineHeight:1.1 }}>StoryClue</div>
          <div style={{ fontSize:"11px", color:"#a8d890", fontStyle:"italic" }}>AI Generated Crossword Puzzle Maker</div>
        </div>
        {/* Safety badge */}
        <div style={{ background:"rgba(255,255,255,.15)", border:"1.5px solid rgba(255,255,255,.4)", borderRadius:"20px", padding:"4px 10px", display:"flex", alignItems:"center", gap:"5px", flexShrink:0 }}>
          <span style={{ fontSize:"13px" }}>🛡️</span>
          <span style={{ fontFamily:"Lora,serif", fontSize:"10px", color:"#f0ead8", fontWeight:600, lineHeight:1.2 }}>Safe for<br/>K-12</span>
        </div>
        {/* Sign-in button (hidden when auth is not configured) */}
        <AuthButton isFirstPuzzle={sessionPuzzleCount === 1 && !user} />
      </div>

      <div style={{ maxWidth:"700px", margin:"0 auto", padding:"32px 20px" }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"28px", color:"#2d4a18", marginBottom:"8px" }}>
          Create Your Crossword
        </h1>
        <p style={{ fontFamily:"Lora,serif", fontSize:"15px", color:"#6a5a30", marginBottom:"28px", fontStyle:"italic" }}>
          Name any book and chapter, paste your own text, drop in a URL, or paste a YouTube video link. StoryClue builds the puzzle in seconds.
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
              <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#4a6a28", marginBottom:"14px", fontStyle:"italic" }}>
                {generatedPuzzle.title}
              </div>

              {/* Save-this-link warning — required by spec */}
              <div style={{ background:"#fff8e8", border:"2px solid #d4a020", borderRadius:"8px", padding:"12px 14px", marginBottom:"20px" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:"#7a5000", marginBottom:"4px" }}>
                  🔗 Your puzzle is ready — bookmark or copy the link below
                </div>
                <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#9a6820", lineHeight:1.6 }}>
                  This link works forever and never expires. Copy it now so you can come back any time — puzzles are stored permanently but we can't look them up by name.
                </div>
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

            {/* Gentle sign-in nudge — shown only when auth is on and user is signed out */}
            {authEnabled && !user && (
              <SaveNudge />
            )}
          </div>
        )}

        <form onSubmit={handleGenerate} style={{ display: generatedPuzzle ? "none" : "block" }}>

          {/* ── Audience banner ─────────────────────────────────────────── */}
          {(() => {
            const AUDIENCE_LABEL = {
              "early-learner": "🐣 Early Learners (K–2)",
              "elementary":    "📚 Elementary (3rd–5th)",
              "middle-high":   "🎒 Middle & High School (6th–12th)",
              "adult":         "📖 Adult & Seniors",
            };
            return (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#e8f0d8", border: "1px solid #b8d898", borderRadius: "8px",
                padding: "8px 14px", marginBottom: "20px", flexWrap: "wrap", gap: "8px",
              }}>
                <span style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#2D5A1A", fontWeight:600 }}>
                  {AUDIENCE_LABEL[audience] || audience}
                </span>
                <button type="button" onClick={changeAudience} style={{
                  background: "none", border: "1px solid #8a7a5a", borderRadius: "4px",
                  padding: "3px 10px", fontFamily:"Lora,serif", fontSize:"12px",
                  color: "#5a4a28", cursor: "pointer",
                }}>
                  Change Audience
                </button>
              </div>
            );
          })()}

          {/* ── Mode Toggle ─────────────────────────────────────────────── */}
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>How would you like to create your puzzle?</label>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
              {/* Songs mode — Early Learner audience only */}
              {isEarlyAudience && (
                <button type="button" className={`mode-btn${inputMode==="songs"?" on":""}`}
                  onClick={() => setInputMode("songs")}>
                  🎵 Songs &amp; Rhymes
                </button>
              )}
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
                🌐 URL or YouTube
              </button>
              {showPdfMode && (
                <button type="button" className={`mode-btn${inputMode==="pdf"?" on":""}`}
                  onClick={() => setInputMode("pdf")}>
                  📄 Upload PDF
                </button>
              )}
            </div>
          </div>

          {/* ── SONGS MODE ──────────────────────────────────────────────── */}
          {inputMode === "songs" && (
            <div style={{ marginBottom:"24px" }}>
              <label style={labelStyle}>Choose a Song</label>
              <SongsLibrary
                grade={grade}
                faithTradition={faith}
                completedIds={completedSongIds}
                selectedId={selectedSong?.id}
                onSelect={song => {
                  setSelectedSong(song);
                  // Pre-fill the title with the song name
                  setTitle(`${song.title} — Crossword Puzzle`);
                }}
              />
              {selectedSong && (
                <div style={{
                  marginTop:"12px", padding:"12px 16px",
                  background:"#e8f5d8", border:"2px solid #66bb6a", borderRadius:"8px",
                  display:"flex", alignItems:"center", gap:"12px",
                }}>
                  <span style={{ fontSize:"2rem" }}>{selectedSong.emoji}</span>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", color:"#1b5e20" }}>
                      Ready: {selectedSong.title}
                    </div>
                    <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#2e7d32", marginTop:"2px" }}>
                      Clues will be fill-in-the-blank lyrics from the song
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
              <label style={labelStyle}>URL, YouTube Video, or Web Page</label>
              <input
                type="url"
                value={urlRef}
                onChange={e => setUrlRef(e.target.value)}
                placeholder="Paste anything — a YouTube video, sermon, article, Wikipedia page, or any URL"
                style={{ ...inputStyle, fontSize:"14px", padding:"12px 14px" }}
              />
              <div style={{ marginTop:"10px", padding:"10px 12px", background:"#e8f0d8", borderRadius:"4px", border:"1px solid #b8d898" }}>
                <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#3a5a18", lineHeight:1.7 }}>
                  <strong>YouTube videos</strong> (sermons, lectures, documentaries) — StoryClue extracts the captions automatically.<br/>
                  <strong>Web articles</strong> — StoryClue fetches and reads the page text.<br/>
                  <strong>Vimeo videos</strong> — title and description are used for puzzle generation.<br/>
                  <span style={{ color:"#7a5500" }}>Note: If a site blocks access, paste the text directly using the Paste option instead.</span>
                </div>
              </div>
              {urlRef.trim() && /youtube\.com|youtu\.be/.test(urlRef) && (
                <div style={{ marginTop:"8px", padding:"8px 12px", background:"#fff3e0", border:"1px solid #ffb74d", borderRadius:"4px" }}>
                  <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#e65100" }}>
                    📺 YouTube video detected — StoryClue will extract the captions automatically.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PDF MODE ────────────────────────────────────────────────── */}
          {inputMode === "pdf" && (
            <div style={{ marginBottom:"24px" }}>
              <label style={labelStyle}>Upload a PDF</label>
              <div style={{
                border: "2px dashed #b8d898", borderRadius: "8px",
                padding: "24px 20px", textAlign: "center",
                background: pdfStatus === "ready" ? "#e8f5e9" : "#fafff5",
                cursor: "pointer", transition: "background 0.2s",
              }}
                onClick={() => document.getElementById("pdf-file-input").click()}
                onDragOver={e => e.preventDefault()}
                onDrop={async e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) await loadPdfFile(file);
                }}
              >
                {pdfStatus === "" && (
                  <>
                    <div style={{ fontSize:"2rem", marginBottom:"8px" }}>📄</div>
                    <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#3a5a18", fontWeight:600 }}>
                      Click to choose a PDF, or drag and drop it here
                    </div>
                    <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#7a8a6a", marginTop:"6px" }}>
                      Sermons, chapters, articles, worksheets — any PDF up to 20 MB
                    </div>
                  </>
                )}
                {pdfStatus === "loading" && (
                  <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#3a5a18" }}>
                    ⏳ Reading PDF…
                  </div>
                )}
                {pdfStatus === "ready" && (
                  <>
                    <div style={{ fontSize:"1.8rem", marginBottom:"6px" }}>✅</div>
                    <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#1b5e20", fontWeight:600 }}>
                      {pdfFileName}
                    </div>
                    <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#3a5a18", marginTop:"4px" }}>
                      {text.length.toLocaleString()} characters extracted — ready to generate
                    </div>
                    <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#7a5500", marginTop:"6px" }}>
                      Click to choose a different file
                    </div>
                  </>
                )}
                {pdfStatus === "error" && (
                  <>
                    <div style={{ fontSize:"1.8rem", marginBottom:"6px" }}>⚠️</div>
                    <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#b71c1c" }}>
                      Could not read that PDF. Try a different file or paste the text directly.
                    </div>
                  </>
                )}
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display:"none" }}
                  onChange={async e => {
                    const file = e.target.files[0];
                    if (file) await loadPdfFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
              <div style={{ marginTop:"10px", padding:"10px 12px", background:"#e8f0d8", borderRadius:"4px", border:"1px solid #b8d898" }}>
                <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#3a5a18", lineHeight:1.6 }}>
                  PDF text is extracted entirely <strong>in your browser</strong> — nothing is uploaded to a server.
                  Works with sermons, textbook chapters, articles, and any text-based PDF.
                  <em style={{ color:"#7a5500" }}> Scanned images without OCR text won't work.</em>
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
          {/* Adult audience: grade is fixed to "adult" — no selector shown */}
          {!isAdultAudience && (
          <div style={{ marginBottom:"24px" }}>
            <label style={labelStyle}>Grade Level for Clues</label>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {GRADE_GROUPS
                // Filter groups to only show grades allowed by the current audience
                .map(group => ({
                  ...group,
                  grades: allowedGrades
                    ? group.grades.filter(g => allowedGrades.includes(g.key))
                    : group.grades,
                }))
                .filter(group => group.grades.length > 0)
                .map(group => (
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
          )}

          {/* ── K-2 Early Learner Features ──────────────────────────────── */}
          {["k","1","2"].includes(grade) && (
            <div style={{ marginBottom:"24px", background:"#f0fdf4", border:"2px solid #66bb6a", borderRadius:"8px", padding:"16px" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", color:"#2d4a18", marginBottom:"12px" }}>
                ✨ Early Learner Features — {grade === "k" ? "Kindergarten" : grade === "1" ? "1st Grade" : "2nd Grade"}
              </div>

              {/* Phonics Mode */}
              <label style={{ display:"flex", alignItems:"flex-start", gap:"10px", cursor:"pointer", marginBottom:"12px" }}>
                <input type="checkbox" checked={phonicsMode} onChange={e => setPhonicsMode(e.target.checked)}
                  style={{ accentColor:"#3a6a1a", width:"16px", height:"16px", marginTop:"3px", flexShrink:0, cursor:"pointer" }} />
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:"#2d4a18" }}>🔤 Phonics Mode</div>
                  <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#4a6a28", marginTop:"2px", lineHeight:1.5 }}>
                    Sound-based clues for early readers — rhymes, beginning sounds, and phonics patterns instead of definitions.
                    {grade === "k" && " (K: beginning sounds & rhymes)"}
                    {grade === "1" && " (1st: ending sounds & blends)"}
                    {grade === "2" && " (2nd: vowel sounds & digraphs)"}
                  </div>
                </div>
              </label>

              {/* Picture Mode */}
              <label style={{ display:"flex", alignItems:"flex-start", gap:"10px", cursor:"pointer" }}>
                <input type="checkbox" checked={pictureMode} onChange={e => setPictureMode(e.target.checked)}
                  style={{ accentColor:"#3a6a1a", width:"16px", height:"16px", marginTop:"3px", flexShrink:0, cursor:"pointer" }} />
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:"#2d4a18" }}>🖼️ Picture Mode</div>
                  <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#4a6a28", marginTop:"2px", lineHeight:1.5 }}>
                    Adds a picture emoji to each clue. Perfect for children still developing reading fluency (ages 5–7).
                    Works together with Phonics Mode.
                  </div>
                </div>
              </label>
            </div>
          )}

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

          {/* ── Series Mode (hidden for Early Learners) ─────────────────── */}
          {showSeriesMode && <div style={{ marginBottom:"28px", background:"#f4efe4", border:"1.5px solid #c8b888", borderRadius:"6px", padding:"16px" }}>
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
          </div>}

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
                  ? "Fetching the page and writing clues — this usually takes under 30 seconds."
                  : inputMode === "pdf"
                    ? `Claude is reading "${pdfFileName}" and writing clues…`
                    : inputMode === "songs"
                      ? `Claude is writing lyric clues for "${selectedSong?.title}"…`
                      : `Claude is reading ${inputMode === "lookup" ? `"${bookRef}"` : "your text"} and writing clues…`}
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
          <button onClick={() => navigate(getDemoUrl(grade))}
            style={{ background:"transparent", border:"2px solid #3a6a1a", color:"#3a6a1a", padding:"8px 20px", borderRadius:"4px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>
            View Demo Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SaveNudge ─────────────────────────────────────────────────────────────────
// Gentle non-popup banner shown after first puzzle if user is signed out.
// Spec: "Save your puzzles and lock in a founding member discount. Sign in with
// Google — it takes 10 seconds."
function SaveNudge() {
  const { signInWithGoogle } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{
      marginTop: "18px",
      padding: "14px 16px",
      background: "linear-gradient(135deg,#f0f8e8,#e8f4d8)",
      border: "1.5px solid #4a8a2a",
      borderRadius: "10px",
      display: "flex", alignItems: "center", gap: "12px",
      fontFamily: "Lora, Georgia, serif",
      position: "relative",
    }}>
      <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🔒</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "13px", color: "#2d4a18", marginBottom: "2px" }}>
          Save your puzzles &amp; lock in a founding member discount
        </div>
        <div style={{ fontSize: "12px", color: "#5a7a30", lineHeight: 1.4 }}>
          Sign in with Google — it takes 10 seconds.
        </div>
      </div>
      <button
        onClick={signInWithGoogle}
        style={{
          background: "#2d4a18", color: "#f0ead8",
          border: "none", borderRadius: "6px",
          padding: "7px 14px", fontSize: "12px",
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
        }}
      >
        Sign in
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{ position: "absolute", top: "6px", right: "8px", background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: "12px", lineHeight: 1, padding: "2px" }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
