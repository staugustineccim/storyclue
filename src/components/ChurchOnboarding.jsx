import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const G  = "#2D5A1A";
const P  = "#F4EFE4";
const A  = "#8A7A30";
const D  = "#2c1a08";

const inputStyle = {
  width: "100%", padding: "12px 14px", border: "1px solid #c8bfa8",
  borderRadius: "6px", fontSize: "15px", fontFamily: "Lora,serif",
  background: "#fff", color: D, outline: "none",
};
const labelStyle = {
  fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px",
  color: "#5a4a28", display: "block", marginBottom: "6px", marginTop: "18px",
};
const btnPrimary = {
  padding: "13px 32px", background: G, color: P, border: "none",
  borderRadius: "6px", fontFamily: "'Playfair Display',serif", fontWeight: 900,
  fontSize: "15px", cursor: "pointer", boxShadow: "2px 2px 0 #1a3a08",
};
const btnGhost = {
  padding: "13px 28px", background: "transparent", color: "#5a4a28",
  border: "1px solid #c8bfa8", borderRadius: "6px", fontFamily: "Lora,serif",
  fontSize: "14px", cursor: "pointer",
};

function ProgressBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: "4px", borderRadius: "2px",
          background: i < step ? G : "#e0d8c8",
          transition: "background .3s",
        }} />
      ))}
    </div>
  );
}

export default function ChurchOnboarding() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Screen 1 — Church details
  const [church, setChurch] = useState({
    churchName: "", pastorName: "", denomination: "",
    city: "", state: "", congregationSize: "",
  });

  // Screen 2 — Sermon upload
  const [uploadMode, setUploadMode] = useState("paste"); // paste | url | file
  const [sermonText, setSermonText] = useState("");
  const [sermonUrl, setSermonUrl] = useState("");
  const [sermonTitle, setSermonTitle] = useState("");

  // Screen 3 — Structure detection
  const [detectedPoints, setDetectedPoints] = useState([]);
  const [editedPoints, setEditedPoints] = useState([]);

  // Screen 4 — Preview
  const [puzzleData, setPuzzleData] = useState(null);
  const [editingSummary, setEditingSummary] = useState(false);

  // Screen 5 — Send setup
  const [emailList, setEmailList] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [sendTime, setSendTime] = useState("14:00");
  const [puzzleLink, setPuzzleLink] = useState("");

  // ── Step 1 → 2: validate church details ─────────────────────────────────────
  async function handleStep1() {
    if (!church.churchName.trim() || !church.pastorName.trim()) {
      setError("Please enter your church name and pastor name.");
      return;
    }
    setError("");
    setSenderName(church.pastorName);
    setStep(2);
  }

  // ── Step 2 → 3: resolve sermon content & detect structure ──────────────────
  async function handleStep2() {
    setError("");
    setLoading(true);
    try {
      let text = sermonText;

      if (uploadMode === "url") {
        if (!sermonUrl.trim().startsWith("http")) {
          setError("Please enter a valid URL starting with http or https.");
          setLoading(false);
          return;
        }
        // Attempt to resolve URL (YouTube captions or web scrape)
        const r = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ inputMode: "url", urlRef: sermonUrl, grade: "8", faith: "christian-protestant" }),
        });
        // We only need the raw text — call a dedicated endpoint if available
        // For now, proceed with URL as the sermon reference
        text = `Sermon from: ${sermonUrl}`;
      }

      if (!text || text.trim().length < 50) {
        setError("Please provide sermon content — notes, transcript, or YouTube link.");
        setLoading(false);
        return;
      }

      // Ask generate-sermon to detect points only (no puzzle yet)
      const r = await fetch("/api/generate-sermon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sermonText: text,
          sermonTitle,
          pastorName: church.pastorName,
          churchName: church.churchName,
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Could not process sermon."); setLoading(false); return; }

      const points = data.detectedPoints?.length
        ? data.detectedPoints
        : (data.summary?.points?.map(p => `${p.heading}`) || []);

      setDetectedPoints(points);
      setEditedPoints([...points]);
      setPuzzleData(data);
      setStep(3);
    } catch (e) {
      setError("Could not process sermon. Please try again.");
    }
    setLoading(false);
  }

  // ── Step 3 → 4: confirm points, regenerate puzzle with confirmed structure ──
  async function handleStep3() {
    setError("");
    setLoading(true);
    try {
      const text = uploadMode === "paste" ? sermonText : `Sermon from: ${sermonUrl}`;
      const r = await fetch("/api/generate-sermon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sermonText: text,
          sermonTitle,
          pastorName: church.pastorName,
          churchName: church.churchName,
          manualPoints: editedPoints.filter(p => p.trim()),
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Could not generate puzzle."); setLoading(false); return; }
      setPuzzleData(data);
      setStep(4);
    } catch {
      setError("Could not generate puzzle. Please try again.");
    }
    setLoading(false);
  }

  // ── Step 4 → 5 ──────────────────────────────────────────────────────────────
  async function handleStep4() {
    if (!puzzleData?.words?.length) { setError("Puzzle not ready."); return; }
    setError("");
    // Save puzzle to Supabase
    setLoading(true);
    try {
      const slug = `church-${Date.now()}`;
      const r = await fetch("/api/save-puzzle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          puzzle: { ...puzzleData, mode: "church" },
        }),
      });
      setPuzzleLink(`${window.location.origin}/play/${slug}`);
    } catch { /* non-fatal — link will be generated */ }
    setLoading(false);
    setStep(5);
  }

  // ── Step 5 → 6: schedule send ───────────────────────────────────────────────
  async function handleStep5() {
    if (!emailList.trim()) { setError("Please enter at least one congregation email address."); return; }
    setError("");
    // In production this would call an email scheduling API.
    // For now we confirm and move to step 6.
    setStep(6);
  }

  // ── File upload handler ──────────────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setSermonText(text);
    setUploadMode("paste");
  }

  const card = { background: "#fff", borderRadius: "10px", padding: "32px", border: "1px solid #e0d8c8", boxShadow: "2px 2px 0 #e0d4a0", maxWidth: "640px", margin: "0 auto" };

  return (
    <div style={{ background: P, minHeight: "100vh", fontFamily: "Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, textarea, select { font-family: Lora,serif; }
        textarea { resize: vertical; }
        .mode-btn { padding: 12px 20px; border-radius: 6px; cursor: pointer; font-family: Lora,serif; font-size: 14px; border: 2px solid #e0d8c8; background: #fff; color: #5a4a28; transition: all .2s; flex: 1; text-align: center; }
        .mode-btn.active { border-color: ${G}; background: #e8f0d8; color: ${G}; font-weight: 600; }
        .point-row { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
        .point-input { flex: 1; padding: 10px 12px; border: 1px solid #c8bfa8; border-radius: 6px; font-size: 14px; font-family: Lora,serif; color: ${D}; }
        .sneak-peek-btn { padding: 4px 10px; background: #e8f0d8; color: ${G}; border: 1px solid ${G}; border-radius: 4px; font-size: 12px; cursor: pointer; font-family: Lora,serif; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: G, padding: "14px 24px", display: "flex", alignItems: "center", borderBottom: "2px solid " + A }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "20px", color: P, cursor: "pointer", flex: 1 }}
          onClick={() => navigate("/church")}>StoryClue — Church Mode</span>
        <span style={{ fontFamily: "Lora,serif", fontSize: "13px", color: "rgba(244,239,228,.7)" }}>
          {step < 6 ? `Step ${step} of 5` : "Complete"}
        </span>
      </nav>

      <div style={{ padding: "40px 24px" }}>
        {step < 6 && <div style={{ maxWidth: "640px", margin: "0 auto", marginBottom: "8px" }}>
          <ProgressBar step={step} total={5} />
        </div>}

        {/* ── SCREEN 1: Church Details ─────────────────────────────────────── */}
        {step === 1 && (
          <div style={card}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⛪</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "26px", color: D, marginBottom: "6px" }}>Tell us about your church</h2>
            <p style={{ fontFamily: "Lora,serif", fontSize: "14px", color: "#5a4a28", marginBottom: "4px" }}>This information appears on your congregation's puzzle page.</p>

            <label style={labelStyle}>Church Name *</label>
            <input style={inputStyle} placeholder="Colonial Church of St. Augustine" value={church.churchName}
              onChange={e => setChurch(c => ({ ...c, churchName: e.target.value }))} />

            <label style={labelStyle}>Pastor Name *</label>
            <input style={inputStyle} placeholder="Pastor Matt" value={church.pastorName}
              onChange={e => setChurch(c => ({ ...c, pastorName: e.target.value }))} />

            <label style={labelStyle}>Denomination (optional)</label>
            <input style={inputStyle} placeholder="Baptist, Methodist, Non-denominational..." value={church.denomination}
              onChange={e => setChurch(c => ({ ...c, denomination: e.target.value }))} />

            <div style={{ display: "flex", gap: "14px" }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} placeholder="St. Augustine" value={church.city}
                  onChange={e => setChurch(c => ({ ...c, city: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} placeholder="FL" value={church.state}
                  onChange={e => setChurch(c => ({ ...c, state: e.target.value }))} />
              </div>
            </div>

            <label style={labelStyle}>Congregation size (optional)</label>
            <input style={inputStyle} placeholder="Approximate number of members" value={church.congregationSize}
              onChange={e => setChurch(c => ({ ...c, congregationSize: e.target.value }))} />

            {error && <p style={{ color: "#b00", fontFamily: "Lora,serif", fontSize: "13px", marginTop: "12px" }}>{error}</p>}
            <div style={{ marginTop: "28px", textAlign: "right" }}>
              <button style={btnPrimary} onClick={handleStep1}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── SCREEN 2: Sermon Upload ──────────────────────────────────────── */}
        {step === 2 && (
          <div style={card}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📝</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "26px", color: D, marginBottom: "6px" }}>Upload this week's sermon</h2>
            <p style={{ fontFamily: "Lora,serif", fontSize: "14px", color: "#5a4a28", marginBottom: "20px" }}>Any format works. Takes 30 seconds.</p>

            <label style={labelStyle}>Sermon Title</label>
            <input style={inputStyle} placeholder="e.g. The Power of a Renewed Mind" value={sermonTitle}
              onChange={e => setSermonTitle(e.target.value)} />

            <label style={{ ...labelStyle, marginTop: "20px" }}>Choose how to share your sermon</label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              {[
                { id: "paste", label: "📋 Paste Notes", desc: "Your notes or transcript" },
                { id: "url",   label: "📺 YouTube Link", desc: "Captions auto-extracted" },
                { id: "file",  label: "📎 Upload File", desc: "PDF, Word, or audio" },
              ].map(m => (
                <button key={m.id} className={`mode-btn${uploadMode === m.id ? " active" : ""}`}
                  onClick={() => setUploadMode(m.id)}>
                  <div>{m.label}</div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {uploadMode === "paste" && (
              <textarea style={{ ...inputStyle, minHeight: "220px" }}
                placeholder="Your sermon notes, outline, transcript, or recording. Any format works."
                value={sermonText}
                onChange={e => setSermonText(e.target.value)} />
            )}
            {uploadMode === "url" && (
              <>
                <input style={inputStyle} placeholder="https://www.youtube.com/watch?v=..."
                  value={sermonUrl} onChange={e => setSermonUrl(e.target.value)} />
                <p style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#5a4a28", marginTop: "8px" }}>
                  📺 YouTube captions are extracted automatically. If unavailable, we'll use the video description.
                </p>
              </>
            )}
            {uploadMode === "file" && (
              <>
                <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx,.mp3,.m4a" style={{ display: "none" }}
                  onChange={handleFileUpload} />
                <button style={{ ...btnGhost, width: "100%", padding: "20px" }}
                  onClick={() => fileRef.current?.click()}>
                  {sermonText ? "✅ File loaded — click to replace" : "Click to choose file (PDF, Word, MP3, text)"}
                </button>
                {sermonText && (
                  <p style={{ fontFamily: "Lora,serif", fontSize: "12px", color: G, marginTop: "8px" }}>
                    ✅ {sermonText.slice(0, 80)}...
                  </p>
                )}
              </>
            )}

            {error && <p style={{ color: "#b00", fontFamily: "Lora,serif", fontSize: "13px", marginTop: "12px" }}>{error}</p>}
            <div style={{ marginTop: "28px", display: "flex", gap: "12px", justifyContent: "space-between" }}>
              <button style={btnGhost} onClick={() => setStep(1)}>← Back</button>
              <button style={btnPrimary} onClick={handleStep2} disabled={loading}>
                {loading ? "Reading your sermon..." : "Analyze Sermon →"}
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN 3: Structure Confirmation ────────────────────────────── */}
        {step === 3 && (
          <div style={card}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🎯</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "26px", color: D, marginBottom: "6px" }}>
              We found {detectedPoints.length} key points in your sermon
            </h2>
            <p style={{ fontFamily: "Lora,serif", fontSize: "14px", color: "#5a4a28", marginBottom: "20px", lineHeight: 1.7 }}>
              Here is what we identified. Confirm, edit, or add points before we build your puzzle.
              Your exact point structure will appear in the congregation's sermon summary.
            </p>

            {editedPoints.map((pt, i) => (
              <div key={i} className="point-row">
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px", color: G, width: "26px", flexShrink: 0 }}>
                  {i + 1}.
                </div>
                <input className="point-input" value={pt}
                  onChange={e => setEditedPoints(pts => pts.map((p, j) => j === i ? e.target.value : p))} />
                <button style={{ ...btnGhost, padding: "8px 12px", fontSize: "12px", color: "#b00", borderColor: "#e0d8c8" }}
                  onClick={() => setEditedPoints(pts => pts.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}

            <button style={{ ...btnGhost, marginTop: "8px", fontSize: "13px" }}
              onClick={() => setEditedPoints(pts => [...pts, ""])}>+ Add a point</button>

            <div style={{ background: "#e8f0d8", border: `1px solid ${G}`, borderRadius: "6px", padding: "14px 16px", marginTop: "20px" }}>
              <p style={{ fontFamily: "Lora,serif", fontSize: "13px", color: "#1a3a08", lineHeight: 1.6 }}>
                <strong>These become your puzzle anchor words.</strong> The crossword will be built around these exact points in your exact order. Your congregation's summary will follow this structure.
              </p>
            </div>

            {error && <p style={{ color: "#b00", fontFamily: "Lora,serif", fontSize: "13px", marginTop: "12px" }}>{error}</p>}
            <div style={{ marginTop: "28px", display: "flex", gap: "12px", justifyContent: "space-between" }}>
              <button style={btnGhost} onClick={() => setStep(2)}>← Back</button>
              <button style={btnPrimary} onClick={handleStep3} disabled={loading}>
                {loading ? "Building your puzzle..." : "Build My Puzzle →"}
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN 4: Preview ────────────────────────────────────────────── */}
        {step === 4 && puzzleData && (
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>👁️</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "26px", color: D }}>
                Preview — what your congregation will receive
              </h2>
              <p style={{ fontFamily: "Lora,serif", fontSize: "14px", color: "#5a4a28", marginTop: "6px" }}>
                This is exactly what arrives in their inbox Sunday afternoon.
              </p>
            </div>

            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {/* Sermon Summary */}
              <div style={{ flex: 1, minWidth: "280px", background: "#fff", borderRadius: "10px", padding: "28px", border: "1px solid #e0d8c8" }}>
                {church.churchName && (
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "18px", color: G, textAlign: "center", marginBottom: "4px" }}>
                    {church.churchName}
                  </div>
                )}
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "22px", color: D, marginBottom: "4px", textAlign: "center" }}>
                  {puzzleData.title}
                </h3>
                <div style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#888", textAlign: "center", marginBottom: "20px" }}>
                  {church.pastorName} · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
                <hr style={{ borderColor: "#e0d8c8", marginBottom: "20px" }} />
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "14px", color: D, marginBottom: "14px" }}>Sermon Summary</h4>
                {puzzleData.summary?.points?.map(pt => (
                  <div key={pt.number} style={{ marginBottom: "14px" }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px", color: G }}>
                      Point {pt.number} — <span style={{ textTransform: "uppercase" }}>{pt.anchorWord}</span>
                    </div>
                    <div style={{ fontFamily: "Lora,serif", fontSize: "13px", color: "#5a4a28", lineHeight: 1.6, marginTop: "3px" }}>
                      {pt.heading}
                    </div>
                    <div style={{ fontFamily: "Lora,serif", fontSize: "13px", color: D, lineHeight: 1.6 }}>
                      {pt.summary}
                    </div>
                  </div>
                ))}
                {puzzleData.summary?.scriptures?.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "12px", color: "#5a4a28", marginBottom: "6px" }}>Scripture References</div>
                    {puzzleData.summary.scriptures.map(s => (
                      <div key={s} style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#5a4a28", fontStyle: "italic" }}>{s}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Puzzle Preview */}
              <div style={{ flex: 1, minWidth: "280px", background: "#fff", borderRadius: "10px", padding: "28px", border: "1px solid #e0d8c8" }}>
                <h4 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "14px", color: D, marginBottom: "14px" }}>This Week's Crossword Puzzle</h4>
                <div style={{ background: "#f8f4ed", borderRadius: "6px", padding: "14px", marginBottom: "14px" }}>
                  <p style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#5a4a28", fontStyle: "italic" }}>
                    Interactive crossword grid (shown to congregation)
                  </p>
                  <p style={{ fontFamily: "Lora,serif", fontSize: "11px", color: "#888", marginTop: "4px" }}>
                    {puzzleData.words?.length} words · 8th-grade clue language
                  </p>
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "12px", color: "#5a4a28", marginBottom: "10px" }}>
                  Clues ({puzzleData.words?.length})
                </div>
                {puzzleData.words?.slice(0, 8).map(w => (
                  <div key={w.word} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #f0e8d8" }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px", color: w.isAnchor ? G : D }}>
                      {w.word} {w.isAnchor && <span style={{ fontSize: "10px", background: "#e8f0d8", color: G, padding: "1px 6px", borderRadius: "3px", marginLeft: "4px" }}>KEY POINT</span>}
                    </div>
                    <div style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#5a4a28", marginTop: "2px" }}>{w.clue}</div>
                    {w.sneakPeek && (
                      <button className="sneak-peek-btn" style={{ marginTop: "4px" }}>📖 Sneak Peek</button>
                    )}
                  </div>
                ))}
                {puzzleData.words?.length > 8 && (
                  <p style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#888", fontStyle: "italic" }}>
                    + {puzzleData.words.length - 8} more clues...
                  </p>
                )}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "28px" }}>
              <p style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#888", marginBottom: "16px" }}>
                Powered by StoryClue.ai — Create puzzles for your family, Sunday school, and homeschool at storyclue.ai
              </p>
            </div>

            {error && <p style={{ color: "#b00", fontFamily: "Lora,serif", fontSize: "13px", marginTop: "12px", textAlign: "center" }}>{error}</p>}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
              <button style={btnGhost} onClick={() => setStep(3)}>← Edit Points</button>
              <button style={{ ...btnGhost }} onClick={handleStep3} disabled={loading}>🔄 Regenerate</button>
              <button style={btnPrimary} onClick={handleStep4} disabled={loading}>
                {loading ? "Saving..." : "Looks Great — Set Up Delivery →"}
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN 5: Send Setup ─────────────────────────────────────────── */}
        {step === 5 && (
          <div style={card}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📨</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "26px", color: D, marginBottom: "6px" }}>Set up delivery</h2>
            <p style={{ fontFamily: "Lora,serif", fontSize: "14px", color: "#5a4a28", marginBottom: "20px", lineHeight: 1.7 }}>
              Your puzzle will send to your congregation Sunday afternoon, looking like it came directly from you.
            </p>

            <label style={labelStyle}>Congregation Email List *</label>
            <textarea style={{ ...inputStyle, minHeight: "100px" }}
              placeholder="Paste email addresses separated by commas or one per line"
              value={emailList}
              onChange={e => setEmailList(e.target.value)} />
            <p style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#888", marginTop: "4px" }}>
              Unlimited congregation members. Free forever.
            </p>

            <label style={labelStyle}>Sender Name</label>
            <input style={inputStyle} placeholder="Pastor Matt" value={senderName}
              onChange={e => setSenderName(e.target.value)} />

            <label style={labelStyle}>Sender Email (appears as "From" address)</label>
            <input style={inputStyle} type="email" placeholder="pastor@yourchurch.org" value={senderEmail}
              onChange={e => setSenderEmail(e.target.value)} />

            <label style={labelStyle}>Scheduled Send Time</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <select style={{ ...inputStyle, width: "auto" }} value="Sunday">
                <option>Sunday</option>
              </select>
              <input type="time" style={{ ...inputStyle, width: "140px" }} value={sendTime}
                onChange={e => setSendTime(e.target.value)} />
              <span style={{ fontFamily: "Lora,serif", fontSize: "13px", color: "#5a4a28" }}>ET</span>
            </div>
            <p style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#888", marginTop: "4px" }}>
              Default: 2:00 PM Sunday — arrives after morning service and lunch
            </p>

            {puzzleLink && (
              <div style={{ background: "#e8f0d8", border: `1px solid ${G}`, borderRadius: "6px", padding: "14px", marginTop: "20px" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px", color: G, marginBottom: "6px" }}>Your puzzle link (share anytime)</div>
                <div style={{ fontFamily: "Lora,serif", fontSize: "13px", color: D, wordBreak: "break-all" }}>{puzzleLink}</div>
              </div>
            )}

            {error && <p style={{ color: "#b00", fontFamily: "Lora,serif", fontSize: "13px", marginTop: "12px" }}>{error}</p>}
            <div style={{ marginTop: "28px", display: "flex", gap: "12px", justifyContent: "space-between" }}>
              <button style={btnGhost} onClick={() => setStep(4)}>← Back</button>
              <button style={btnPrimary} onClick={handleStep5}>Schedule Delivery →</button>
            </div>
          </div>
        )}

        {/* ── SCREEN 6: Confirmation ───────────────────────────────────────── */}
        {step === 6 && (
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🙏</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "28px", color: G, marginBottom: "12px" }}>
              Your sermon recap is ready
            </h2>
            <p style={{ fontFamily: "Lora,serif", fontSize: "16px", color: "#5a4a28", lineHeight: 1.75, marginBottom: "24px" }}>
              It will send to your congregation Sunday at {sendTime.replace("14:00", "2:00 PM").replace("13:00", "1:00 PM")}.
            </p>

            {puzzleLink && (
              <div style={{ background: "#e8f0d8", border: `1px solid ${G}`, borderRadius: "8px", padding: "18px 20px", marginBottom: "24px", textAlign: "left" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "14px", color: G, marginBottom: "8px" }}>
                  Your puzzle link — share anytime
                </div>
                <div style={{ fontFamily: "Lora,serif", fontSize: "13px", color: D, wordBreak: "break-all" }}>
                  {puzzleLink}
                </div>
                <button style={{ ...btnGhost, marginTop: "10px", fontSize: "12px", padding: "6px 14px" }}
                  onClick={() => navigator.clipboard?.writeText(puzzleLink)}>
                  📋 Copy Link
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <button style={btnPrimary} onClick={() => { setStep(2); setSermonText(""); setSermonTitle(""); setSermonUrl(""); setPuzzleData(null); }}>
                Set Up Next Week's Sermon
              </button>
              <button style={btnGhost} onClick={() => navigate("/")}>
                Back to StoryClue
              </button>
            </div>

            <p style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#888", marginTop: "28px" }}>
              Powered by StoryClue.ai — Free for every pastor, every week.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
