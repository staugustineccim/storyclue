import { useState } from "react";

const STAR_COLORS = ["", "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"];
const GRADE_LABELS = {
  k: "Kindergarten", "1": "Grade 1", "2": "Grade 2", "3": "Grade 3",
  "4": "Grade 4", "5": "Grade 5", "6": "Grade 6", "7": "Grade 7",
  "8": "Grade 8", "9-10": "Grades 9-10", "11-12": "Grades 11-12",
  adult: "Reader Mode",
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ password }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function load() {
    if (data) return; // already loaded
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-analytics", {
        headers: { "x-admin-password": password },
      });
      if (!res.ok) { setError("Could not load analytics."); setLoading(false); return; }
      setData(await res.json());
    } catch {
      setError("Network error loading analytics.");
    }
    setLoading(false);
  }

  // Load on first mount of this tab
  if (!data && !loading && !error) { load(); }

  if (loading) return <p style={{ textAlign:"center", color:"#888", padding:"3rem" }}>Loading analytics…</p>;
  if (error)   return <p style={{ textAlign:"center", color:"#c0392b", padding:"2rem" }}>{error} <button onClick={load} style={reloadBtn}>Retry</button></p>;
  if (!data)   return null;

  const completionPct = data.completionRate + "%";

  return (
    <div>
      {/* ── KPI Cards ── */}
      <div style={cardRow}>
        <div style={card}>
          <div style={cardNum}>{data.visitorsToday.toLocaleString()}</div>
          <div style={cardLabel}>Visitors Today</div>
        </div>
        <div style={card}>
          <div style={cardNum}>{data.visitorsWeek.toLocaleString()}</div>
          <div style={cardLabel}>Visitors This Week</div>
        </div>
        <div style={card}>
          <div style={cardNum}>{data.puzzlesGenerated.toLocaleString()}</div>
          <div style={cardLabel}>Puzzles Generated</div>
        </div>
        <div style={card}>
          <div style={cardNum}>{completionPct}</div>
          <div style={cardLabel}>Completion Rate</div>
        </div>
        <div style={card}>
          <div style={cardNum}>{data.hintsUsed.toLocaleString()}</div>
          <div style={cardLabel}>Hints Used</div>
        </div>
        <div style={card}>
          <div style={cardNum}>{data.answersRevealed.toLocaleString()}</div>
          <div style={cardLabel}>Answers Revealed</div>
        </div>
        <div style={card}>
          <div style={cardNum}>{data.shareClicks.toLocaleString()}</div>
          <div style={cardLabel}>Share Clicks</div>
        </div>
      </div>

      {/* ── Top Books & Grades ── */}
      <div style={{ display:"flex", gap:"1rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {/* Top Books */}
        <div style={{ ...tableWrap, flex:"1 1 320px", padding:"1rem 1.2rem" }}>
          <h3 style={sectionHead}>📚 Most Popular Books</h3>
          {data.topBooks.length === 0
            ? <p style={emptyNote}>No data yet</p>
            : (
              <table style={{ ...table, marginTop:"0.5rem" }}>
                <thead>
                  <tr>
                    <th style={th}>Book / Title</th>
                    <th style={{ ...th, width:"60px", textAlign:"right" }}>Puzzles</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topBooks.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf7" }}>
                      <td style={td}>{row.book || "—"}</td>
                      <td style={{ ...td, textAlign:"right", fontWeight:700, color:"#2D5A1A" }}>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

        {/* Top Grades */}
        <div style={{ ...tableWrap, flex:"1 1 260px", padding:"1rem 1.2rem" }}>
          <h3 style={sectionHead}>🎓 Grade Levels</h3>
          {data.topGrades.length === 0
            ? <p style={emptyNote}>No data yet</p>
            : (
              <table style={{ ...table, marginTop:"0.5rem" }}>
                <thead>
                  <tr>
                    <th style={th}>Grade</th>
                    <th style={{ ...th, width:"60px", textAlign:"right" }}>Puzzles</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topGrades.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf7" }}>
                      <td style={td}>{row.label || row.grade || "—"}</td>
                      <td style={{ ...td, textAlign:"right", fontWeight:700, color:"#2D5A1A" }}>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>

      {/* ── Last 50 Generation Events ── */}
      <div style={tableWrap}>
        <h3 style={{ ...sectionHead, padding:"1rem 1.2rem 0.5rem" }}>
          🕷️ Last 50 Puzzle Generations
        </h3>
        {data.recentGenerations.length === 0
          ? <p style={{ ...emptyNote, padding:"1rem 1.2rem" }}>No puzzles generated yet</p>
          : (
            <div style={{ overflowX:"auto" }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>When</th>
                    <th style={th}>Book / Title</th>
                    <th style={th}>Grade</th>
                    <th style={th}>Input</th>
                    <th style={th}>Faith</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentGenerations.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf7" }}>
                      <td style={{ ...td, whiteSpace:"nowrap", fontSize:"0.8rem", color:"#888" }}>{formatDate(row.timestamp)}</td>
                      <td style={{ ...td, maxWidth:"220px", wordBreak:"break-word" }}>{row.book_title || "—"}</td>
                      <td style={td}>{GRADE_LABELS[row.grade] || row.grade || "—"}</td>
                      <td style={{ ...td, textTransform:"capitalize" }}>{row.input_method || "—"}</td>
                      <td style={{ ...td, fontSize:"0.8rem", color:"#666" }}>{row.faith && row.faith !== "none" ? row.faith : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      <div style={{ textAlign:"right", marginTop:"0.75rem" }}>
        <button onClick={() => { setData(null); load(); }} style={reloadBtn}>↻ Refresh</button>
      </div>
    </div>
  );
}

// ── Feedback Tab ──────────────────────────────────────────────────────────────
function FeedbackTab({ records, total }) {
  const [filterStars, setFilterStars] = useState(0);
  const [filterPay,   setFilterPay]   = useState("all");

  const filtered = records.filter(r => {
    if (filterStars > 0 && r.stars !== filterStars) return false;
    if (filterPay === "yes" && r.wouldPay !== true)  return false;
    if (filterPay === "no"  && r.wouldPay !== false) return false;
    if (filterPay === "unanswered" && r.wouldPay !== null) return false;
    return true;
  });

  const avgStars    = records.length ? (records.reduce((s,r) => s + r.stars, 0) / records.length).toFixed(1) : "—";
  const yesCount    = records.filter(r => r.wouldPay === true).length;
  const noCount     = records.filter(r => r.wouldPay === false).length;
  const answeredPay = yesCount + noCount;

  return (
    <div>
      <div style={cardRow}>
        <div style={card}>
          <div style={cardNum}>{total}</div>
          <div style={cardLabel}>Total Responses</div>
        </div>
        <div style={card}>
          <div style={cardNum}>{avgStars} ★</div>
          <div style={cardLabel}>Average Rating</div>
        </div>
        <div style={card}>
          <div style={cardNum}>{answeredPay > 0 ? Math.round(yesCount / answeredPay * 100) + "%" : "—"}</div>
          <div style={cardLabel}>Would Pay ({yesCount}/{answeredPay})</div>
        </div>
        <div style={card}>
          <div style={cardNum}>{records.filter(r => r.comment?.trim()).length}</div>
          <div style={cardLabel}>With Comments</div>
        </div>
      </div>

      <div style={filterRow}>
        <label style={filterLabel}>Stars:</label>
        {[0,1,2,3,4,5].map(n => (
          <button key={n} onClick={() => setFilterStars(n)}
            style={{ ...filterBtn, background: filterStars===n ? "#2D5A1A" : "#eee", color: filterStars===n ? "#fff" : "#333" }}>
            {n === 0 ? "All" : "★".repeat(n)}
          </button>
        ))}
        <span style={{ margin:"0 0.5rem", color:"#ccc" }}>|</span>
        <label style={filterLabel}>Would Pay:</label>
        {[["all","All"],["yes","Yes"],["no","No"],["unanswered","N/A"]].map(([val,label]) => (
          <button key={val} onClick={() => setFilterPay(val)}
            style={{ ...filterBtn, background: filterPay===val ? "#2D5A1A" : "#eee", color: filterPay===val ? "#fff" : "#333" }}>
            {label}
          </button>
        ))}
        <span style={{ marginLeft:"auto", color:"#888", fontSize:"0.85rem" }}>
          Showing {filtered.length} of {total}
        </span>
      </div>

      {filtered.length === 0
        ? <p style={{ textAlign:"center", color:"#888", padding:"2rem" }}>No records match your filters.</p>
        : (
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Date</th>
                  <th style={th}>Puzzle</th>
                  <th style={th}>Grade</th>
                  <th style={th}>Stars</th>
                  <th style={th}>Comment</th>
                  <th style={th}>Revealed?</th>
                  <th style={th}>Would Pay?</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r,i) => (
                  <tr key={i} style={{ background: i%2===0 ? "#fff" : "#fafaf7" }}>
                    <td style={td}>{formatDate(r.date)}</td>
                    <td style={{ ...td, maxWidth:"200px", wordBreak:"break-word" }}>{r.puzzleTitle||"—"}</td>
                    <td style={td}>{GRADE_LABELS[r.grade]||r.grade||"—"}</td>
                    <td style={{ ...td, color:STAR_COLORS[r.stars]||"#333", fontWeight:700, whiteSpace:"nowrap" }}>
                      {"★".repeat(r.stars)}{"☆".repeat(5-r.stars)}
                    </td>
                    <td style={{ ...td, maxWidth:"220px", wordBreak:"break-word", fontStyle:r.comment?"normal":"italic", color:r.comment?"#333":"#bbb" }}>
                      {r.comment||"No comment"}
                    </td>
                    <td style={{ ...td, textAlign:"center" }}>{r.wasRevealed?"Yes":"No"}</td>
                    <td style={{ ...td, textAlign:"center", fontWeight:600, color:r.wouldPay===true?"#2D5A1A":r.wouldPay===false?"#c0392b":"#aaa" }}>
                      {r.wouldPay===true?"Yes":r.wouldPay===false?"No":"—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authed,   setAuthed]   = useState(false);
  const [records,  setRecords]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [tab,      setTab]      = useState("analytics"); // "analytics" | "feedback"

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-feedback", {
        headers: { "x-admin-password": password },
      });
      if (!res.ok) { setError("Wrong password."); setLoading(false); return; }
      const data = await res.json();
      setRecords(data.records || []);
      setTotal(data.total || 0);
      setAuthed(true);
    } catch {
      setError("Could not connect. Try again.");
    }
    setLoading(false);
  }

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={page}>
        <div style={loginBox}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.5rem" }}>🔐</div>
          <h1 style={loginHeading}>StoryClue Admin</h1>
          <p style={loginSub}>Marketing & Analytics Dashboard</p>
          <form onSubmit={login}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              style={loginInput}
              autoFocus
            />
            {error && <p style={errorMsg}>{error}</p>}
            <button type="submit" disabled={loading || !password} style={loginBtn}>
              {loading ? "Checking…" : "Enter Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div style={page}>
      <div style={dashWrap}>
        {/* Header */}
        <div style={dashHeader}>
          <div>
            <h1 style={dashTitle}>📊 StoryClue Marketing Admin</h1>
            <p style={dashSub}>storyclue.ai analytics & feedback</p>
          </div>
          <button onClick={() => setAuthed(false)} style={logoutBtn}>Log out</button>
        </div>

        {/* Tab Selector */}
        <div style={tabBar}>
          <button
            onClick={() => setTab("analytics")}
            style={{ ...tabBtn, ...(tab === "analytics" ? tabBtnActive : {}) }}
          >
            📈 Analytics
          </button>
          <button
            onClick={() => setTab("feedback")}
            style={{ ...tabBtn, ...(tab === "feedback" ? tabBtnActive : {}) }}
          >
            💬 Feedback ({total})
          </button>
        </div>

        {/* Tab Content */}
        {tab === "analytics" && <AnalyticsTab password={password} />}
        {tab === "feedback"  && <FeedbackTab  records={records} total={total} />}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const page = {
  minHeight: "100vh", background: "#F4EFE4",
  fontFamily: "Lora, Georgia, serif",
  display: "flex", justifyContent: "center",
  padding: "2rem 1rem",
};

const loginBox = {
  background: "#fff", borderRadius: "16px",
  padding: "2.5rem", maxWidth: "360px", width: "100%",
  boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
  textAlign: "center", alignSelf: "flex-start",
  marginTop: "4rem",
};

const loginHeading = { color: "#2D5A1A", margin: "0 0 0.3rem", fontSize: "1.6rem" };
const loginSub     = { color: "#888", margin: "0 0 1.5rem" };
const loginInput   = {
  width: "100%", boxSizing: "border-box",
  padding: "0.65rem 0.9rem", fontSize: "1rem",
  border: "1px solid #ddd", borderRadius: "8px",
  marginBottom: "0.8rem", fontFamily: "Lora, Georgia, serif",
};
const loginBtn = {
  width: "100%", background: "#2D5A1A", color: "#fff",
  border: "none", borderRadius: "8px",
  padding: "0.7rem", fontSize: "1rem",
  fontWeight: 600, cursor: "pointer",
  fontFamily: "Lora, Georgia, serif",
};
const errorMsg = { color: "#c0392b", margin: "0 0 0.8rem", fontSize: "0.9rem" };

const dashWrap = { maxWidth: "1100px", width: "100%" };

const dashHeader = {
  display: "flex", alignItems: "center",
  justifyContent: "space-between", marginBottom: "1.2rem",
  flexWrap: "wrap", gap: "0.5rem",
};
const dashTitle = { color: "#2D5A1A", margin: 0, fontSize: "1.7rem" };
const dashSub   = { color: "#888", margin: "0.2rem 0 0", fontSize: "0.85rem" };
const logoutBtn = {
  background: "none", border: "1px solid #ccc", borderRadius: "6px",
  padding: "0.4rem 0.9rem", cursor: "pointer", color: "#666",
  fontFamily: "Lora, Georgia, serif", fontSize: "0.85rem",
};

const tabBar = {
  display: "flex", gap: "0.5rem", marginBottom: "1.5rem",
  borderBottom: "2px solid #e0d8c8", paddingBottom: "0",
};
const tabBtn = {
  padding: "0.6rem 1.4rem", border: "none", background: "transparent",
  fontFamily: "Lora, Georgia, serif", fontSize: "0.95rem",
  cursor: "pointer", color: "#666", borderRadius: "6px 6px 0 0",
  borderBottom: "2px solid transparent", marginBottom: "-2px",
  transition: "all 0.15s",
};
const tabBtnActive = {
  background: "#fff", color: "#2D5A1A", fontWeight: 700,
  borderBottom: "2px solid #2D5A1A",
};

const cardRow  = { display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" };
const card     = {
  flex: "1 1 130px", background: "#fff", borderRadius: "12px",
  padding: "1.2rem 1.5rem", textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
};
const cardNum   = { fontSize: "1.8rem", fontWeight: 700, color: "#2D5A1A" };
const cardLabel = { fontSize: "0.75rem", color: "#888", marginTop: "0.3rem" };

const sectionHead = { margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#2D5A1A" };
const emptyNote   = { color: "#aaa", fontStyle: "italic", fontSize: "0.85rem", margin: "0.5rem 0" };

const filterRow = {
  display: "flex", alignItems: "center", flexWrap: "wrap",
  gap: "0.4rem", marginBottom: "1rem",
  background: "#fff", borderRadius: "10px",
  padding: "0.75rem 1rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};
const filterLabel = { fontSize: "0.85rem", color: "#666", marginRight: "0.2rem", whiteSpace: "nowrap" };
const filterBtn   = {
  border: "none", borderRadius: "6px", padding: "0.3rem 0.7rem",
  fontSize: "0.8rem", cursor: "pointer", fontFamily: "Lora, Georgia, serif",
  transition: "background 0.15s",
};

const tableWrap = {
  background: "#fff", borderRadius: "12px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  overflow: "auto", marginBottom: "1rem",
};

const table = { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" };

const th = {
  background: "#2D5A1A", color: "#fff",
  padding: "0.65rem 0.9rem", textAlign: "left",
  fontWeight: 600, whiteSpace: "nowrap",
};

const td = { padding: "0.55rem 0.9rem", borderBottom: "1px solid #f0ece3" };

const reloadBtn = {
  background: "none", border: "1px solid #ccc", borderRadius: "6px",
  padding: "0.3rem 0.8rem", cursor: "pointer", color: "#666",
  fontFamily: "Lora, Georgia, serif", fontSize: "0.82rem",
};
