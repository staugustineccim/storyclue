import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const G  = "#2D5A1A";
const P  = "#F4EFE4";
const A  = "#8A7A30";
const D  = "#2c1a08";

export default function PastorDashboard() {
  const navigate = useNavigate();
  const [sermons, setSermons] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSermons();
  }, []);

  async function fetchSermons() {
    setLoading(true);
    try {
      // Fetch past sermons from Supabase
      const { createClient } = await import("@supabase/supabase-js");
      // Use the public anon key here (RLS protects data)
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      const { data } = await supabase
        .from("church_sermons")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setSermons(data || []);
      if (data?.length) setSelected(data[0]);
    } catch {
      // Show demo data if Supabase unavailable
      const demo = getDemoData();
      setSermons(demo);
      setSelected(demo[0]);
    }
    setLoading(false);
  }

  const stat = (label, value, sub) => (
    <div style={{ background: "#fff", borderRadius: "8px", padding: "18px 20px", border: "1px solid #e0d8c8", textAlign: "center" }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "28px", color: G }}>{value}</div>
      <div style={{ fontFamily: "Lora,serif", fontSize: "12px", color: D, fontWeight: 600, marginTop: "4px" }}>{label}</div>
      {sub && <div style={{ fontFamily: "Lora,serif", fontSize: "11px", color: "#888", marginTop: "2px" }}>{sub}</div>}
    </div>
  );

  const engagement = selected?.engagement || getDemoEngagement();

  return (
    <div style={{ background: P, minHeight: "100vh", fontFamily: "Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sermon-row { padding: 12px 16px; border-radius: 6px; cursor: pointer; transition: background .15s; border-bottom: 1px solid #e0d8c8; }
        .sermon-row:hover { background: #f0ead8; }
        .sermon-row.active { background: #e8f0d8; border-left: 3px solid ${G}; }
        .point-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .bar-track { flex: 1; height: "8px"; background: #e0d8c8; borderRadius: "4px"; overflow: "hidden"; }
        .member-row { display: flex; align-items: center; gap: 12px; padding: "8px 0"; border-bottom: "1px solid #f0e8d8"; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: G, padding: "14px 24px", display: "flex", alignItems: "center", gap: "20px", borderBottom: "2px solid " + A }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "18px", color: P, flex: 1, cursor: "pointer" }}
          onClick={() => navigate("/church")}>⛪ Pastor Dashboard</span>
        <button style={{ padding: "8px 18px", background: P, color: G, border: "none", borderRadius: "5px", fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "13px", cursor: "pointer" }}
          onClick={() => navigate("/church/setup")}>
          + New Sermon
        </button>
      </nav>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px", fontFamily: "Lora,serif", color: "#5a4a28" }}>Loading your sermons...</div>
      ) : (
        <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto", padding: "24px", gap: "24px" }}>

          {/* Sermon List */}
          <div style={{ width: "280px", flexShrink: 0 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "14px", color: D, marginBottom: "12px" }}>Past Sermons</h3>
            {sermons.length === 0 ? (
              <div style={{ fontFamily: "Lora,serif", fontSize: "13px", color: "#888", padding: "20px 0" }}>
                No sermons yet. <span style={{ color: G, cursor: "pointer" }} onClick={() => navigate("/church/setup")}>Upload your first sermon →</span>
              </div>
            ) : sermons.map(s => (
              <div key={s.id} className={`sermon-row${selected?.id === s.id ? " active" : ""}`}
                onClick={() => setSelected(s)}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px", color: D }}>
                  {s.sermon_title || "Untitled Sermon"}
                </div>
                <div style={{ fontFamily: "Lora,serif", fontSize: "11px", color: "#888", marginTop: "2px" }}>
                  {s.created_at ? new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                  {s.status === "ready_to_send" && <span style={{ color: A, marginLeft: "8px" }}>· Scheduled</span>}
                  {s.status === "sent" && <span style={{ color: G, marginLeft: "8px" }}>· Sent</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Main Dashboard */}
          {selected && (
            <div style={{ flex: 1 }}>
              <div style={{ background: "#fff", borderRadius: "10px", padding: "24px", border: "1px solid #e0d8c8", marginBottom: "20px" }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "22px", color: D, marginBottom: "4px" }}>
                  {selected.sermon_title || "Untitled Sermon"}
                </h2>
                <div style={{ fontFamily: "Lora,serif", fontSize: "13px", color: "#888" }}>
                  {selected.created_at ? new Date(selected.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : ""}
                  {selected.congregation_size && ` · ${selected.congregation_size} members`}
                </div>
              </div>

              {/* Email Stats */}
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "14px", color: D, marginBottom: "12px" }}>Email Delivery</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                {stat("Sent To", engagement.sent, "congregation members")}
                {stat("Opened", `${engagement.openRate}%`, `${engagement.opened} members`)}
                {stat("Puzzles Started", `${engagement.startRate}%`, `${engagement.started} members`)}
                {stat("Completed", `${engagement.completeRate}%`, `${engagement.completed} members`)}
                {stat("Avg. Time", engagement.avgTime, "to complete")}
              </div>

              {/* Per-Point Success */}
              {engagement.pointSuccess?.length > 0 && (
                <>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "14px", color: D, marginBottom: "12px" }}>
                    Key Point Recall
                    <span style={{ fontFamily: "Lora,serif", fontWeight: 400, fontSize: "12px", color: "#888", marginLeft: "8px" }}>
                      How well each point landed
                    </span>
                  </h3>
                  <div style={{ background: "#fff", borderRadius: "8px", padding: "20px", border: "1px solid #e0d8c8", marginBottom: "24px" }}>
                    {engagement.pointSuccess.map((pt, i) => (
                      <div key={i} className="point-bar">
                        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "12px", color: G, width: "100px", flexShrink: 0 }}>
                          {pt.word}
                        </div>
                        <div style={{ flex: 1, height: "8px", background: "#e0d8c8", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${pt.rate}%`, height: "100%", background: pt.rate >= 80 ? G : pt.rate >= 60 ? A : "#c0392b", borderRadius: "4px", transition: "width .5s" }} />
                        </div>
                        <div style={{ fontFamily: "Lora,serif", fontSize: "12px", color: D, width: "40px", textAlign: "right" }}>{pt.rate}%</div>
                        <div style={{ fontFamily: "Lora,serif", fontSize: "11px", color: "#888", width: "80px" }}>
                          {pt.rate >= 80 ? "✅ Landed" : pt.rate >= 60 ? "⚠️ Partial" : "❌ Struggled"}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Mastered vs Struggle */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                {engagement.masteredWords?.length > 0 && (
                  <div style={{ flex: 1, background: "#fff", borderRadius: "8px", padding: "18px 20px", border: "1px solid #e0d8c8", borderTop: `3px solid ${G}` }}>
                    <h4 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px", color: G, marginBottom: "10px" }}>
                      ✅ These points really landed
                    </h4>
                    {engagement.masteredWords.map(w => (
                      <div key={w} style={{ fontFamily: "Lora,serif", fontSize: "13px", color: D, marginBottom: "6px" }}>• {w}</div>
                    ))}
                  </div>
                )}
                {engagement.struggleWords?.length > 0 && (
                  <div style={{ flex: 1, background: "#fff", borderRadius: "8px", padding: "18px 20px", border: "1px solid #e0d8c8", borderTop: "3px solid #c0392b" }}>
                    <h4 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px", color: "#c0392b", marginBottom: "10px" }}>
                      📌 Worth revisiting next week
                    </h4>
                    {engagement.struggleWords.map(w => (
                      <div key={w} style={{ fontFamily: "Lora,serif", fontSize: "13px", color: D, marginBottom: "6px" }}>• {w}</div>
                    ))}
                    <p style={{ fontFamily: "Lora,serif", fontSize: "11px", color: "#888", marginTop: "10px", lineHeight: 1.6 }}>
                      Consider reinforcing these concepts in your next sermon or study.
                    </p>
                  </div>
                )}
              </div>

              {/* Puzzle link */}
              {selected.puzzle_slug && (
                <div style={{ background: "#e8f0d8", borderRadius: "8px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontFamily: "Lora,serif", fontSize: "13px", color: D, flex: 1 }}>
                    🔗 {window.location.origin}/play/{selected.puzzle_slug}
                  </span>
                  <button style={{ padding: "6px 14px", background: G, color: P, border: "none", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontFamily: "Lora,serif" }}
                    onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/play/${selected.puzzle_slug}`)}>
                    Copy Link
                  </button>
                  <button style={{ padding: "6px 14px", background: "transparent", color: G, border: `1px solid ${G}`, borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontFamily: "Lora,serif" }}
                    onClick={() => navigate(`/play/${selected.puzzle_slug}`)}>
                    View Puzzle
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getDemoEngagement() {
  return {
    sent: 47, opened: 38, started: 29, completed: 22,
    openRate: 81, startRate: 62, completeRate: 47, avgTime: "8 min",
    pointSuccess: [
      { word: "CONFORM",      rate: 100 },
      { word: "TRANSFORM",    rate: 100 },
      { word: "DISCIPLINE",   rate: 75 },
      { word: "BATTLEFIELD",  rate: 62 },
      { word: "DISCERNMENT",  rate: 88 },
    ],
    masteredWords: ["CONFORM — the world's pressure is clear and memorable", "TRANSFORM — the call to change resonated deeply"],
    struggleWords: ["BATTLEFIELD — consider a follow-up illustration next week", "DISCIPLINE — the daily practice concept may need reinforcement"],
  };
}

function getDemoData() {
  return [
    {
      id: "demo-1",
      sermon_title: "The Power of a Renewed Mind — Romans 12",
      created_at: new Date().toISOString(),
      status: "sent",
      congregation_size: 47,
      puzzle_slug: null,
      engagement: getDemoEngagement(),
    },
  ];
}
