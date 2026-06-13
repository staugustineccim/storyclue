import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";
import { loadProgress, getMasteryStats } from "../utils/wordProgress";

// ── VocabDashboard ─────────────────────────────────────────────────────────────
// Parent-facing vocabulary progress view, embedded in FamilyDashboard.
// Shows per-child mastery stats: mastered / learning / struggling counts,
// recently-mastered words ("Look what Emma learned!"), and struggling words
// so the parent knows what to reinforce at home.
//
// Data source: Supabase word_progress table (synced from localStorage after
// every puzzle). Falls back to localStorage stats when offline or anonymous.

const STATUS_COLORS = {
  mastered:   { bg: "#e8f5e9", text: "#1b5e20", border: "#66bb6a", label: "🏆 Mastered" },
  learning:   { bg: "#e3f2fd", text: "#0d47a1", border: "#42a5f5", label: "📚 Learning" },
  struggling: { bg: "#fce4ec", text: "#880e4f", border: "#ec407a", label: "🔴 Needs Help" },
};

function StatPill({ count, status }) {
  const c = STATUS_COLORS[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: c.bg, color: c.text, border: `1.5px solid ${c.border}`,
      borderRadius: "20px", padding: "3px 12px",
      fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px",
    }}>
      {c.label} <span style={{ fontFamily: "Lora,serif", fontWeight: 600 }}>{count}</span>
    </span>
  );
}

function ProgressBar({ pct, color = "#3a6a1a" }) {
  return (
    <div style={{ background: "#e0d8c8", borderRadius: "6px", height: "8px", overflow: "hidden", marginTop: "6px" }}>
      <div style={{ width: `${Math.max(2, pct)}%`, background: color, height: "100%", borderRadius: "6px", transition: "width .6s ease" }} />
    </div>
  );
}

function ChildVocabCard({ child, session }) {
  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (session?.access_token) {
        // Try server stats first (cross-device, most up-to-date)
        const res = await fetch(`/api/vocab-stats?childId=${child.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          setStats(await res.json());
          setLoading(false);
          return;
        }
      }
      // Fallback: read localStorage stats for this child
      const localStats = getMasteryStats(child.id);
      const localProgress = loadProgress(child.id);
      const strugglingWords = Object.values(localProgress)
        .filter(e => e.status === "struggling")
        .map(e => ({ word: e.word, grade: e.grade, encounters: e.encounters, lastSeen: e.lastSeenAt }));
      const recentlyMastered = Object.values(localProgress)
        .filter(e => e.status === "mastered" && e.masteredAt)
        .sort((a, b) => new Date(b.masteredAt) - new Date(a.masteredAt))
        .slice(0, 5)
        .map(e => ({ word: e.word, masteredAt: e.masteredAt }));
      setStats({
        ...localStats,
        masteredPct: localStats.total > 0 ? Math.round((localStats.mastered / localStats.total) * 100) : 0,
        strugglingWords,
        recentlyMastered,
        dueWords: [],
      });
    } catch (e) {
      setError("Could not load vocabulary data.");
    }
    setLoading(false);
  }, [child.id, session]);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) {
    return (
      <div style={{ padding: "12px 0", fontFamily: "Lora,serif", fontSize: "13px", color: "#8a7a5a" }}>
        Loading {child.name}'s words…
      </div>
    );
  }
  if (error || !stats) return null;
  if (stats.total === 0) {
    return (
      <div style={{ padding: "10px 0 4px", fontFamily: "Lora,serif", fontSize: "13px", color: "#8a7a5a", fontStyle: "italic" }}>
        {child.name} hasn't played any puzzles yet. Word progress will appear here after their first puzzle.
      </div>
    );
  }

  return (
    <div style={{ borderTop: "1px solid #e8e0d0", paddingTop: "14px", marginTop: "14px" }}>
      {/* Child name row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>{child.emoji || "⭐"}</span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "15px", color: "#2d4a18" }}>
            {child.name}
          </span>
          <span style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#6a5a30" }}>
            · {stats.total} word{stats.total !== 1 ? "s" : ""} total
          </span>
        </div>
        {stats.dueCount > 0 && (
          <span style={{
            background: "#fff3e0", color: "#e65100", border: "1.5px solid #ffa726",
            borderRadius: "20px", padding: "2px 10px",
            fontFamily: "Lora,serif", fontSize: "12px", fontWeight: 600,
          }}>
            ⏰ {stats.dueCount} word{stats.dueCount !== 1 ? "s" : ""} due for review
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#5a4a28", marginBottom: "2px" }}>
        Mastery progress — {stats.masteredPct}%
      </div>
      <ProgressBar pct={stats.masteredPct} />

      {/* Stat pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
        <StatPill count={stats.mastered}   status="mastered"   />
        <StatPill count={stats.learning}   status="learning"   />
        <StatPill count={stats.struggling} status="struggling" />
      </div>

      {/* Recently mastered highlight */}
      {stats.recentlyMastered?.length > 0 && (
        <div style={{ marginTop: "12px", background: "#e8f5e9", border: "1px solid #66bb6a", borderRadius: "8px", padding: "10px 14px" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px", color: "#1b5e20", marginBottom: "6px" }}>
            🌟 {child.name} recently mastered:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {stats.recentlyMastered.map(w => (
              <span key={w.word} style={{
                background: "#fff", border: "1.5px solid #66bb6a", borderRadius: "6px",
                padding: "2px 10px", fontFamily: "Lora,serif", fontSize: "13px",
                color: "#1b5e20", fontWeight: 600, letterSpacing: ".03em",
              }}>
                {w.word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Struggling words — most important for parents */}
      {stats.strugglingWords?.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "Lora,serif", fontSize: "13px", color: "#880e4f",
              textDecoration: "underline", padding: 0,
            }}
          >
            {expanded ? "▲ Hide" : "▼ Show"} {stats.strugglingWords.length} word{stats.strugglingWords.length !== 1 ? "s" : ""} that need extra practice
          </button>

          {expanded && (
            <div style={{ marginTop: "8px", background: "#fce4ec", border: "1px solid #ec407a", borderRadius: "8px", padding: "10px 14px" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px", color: "#880e4f", marginBottom: "8px" }}>
                🔴 Extra practice will help — StoryClue will keep giving {child.name} simpler clues for these:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {stats.strugglingWords.map(w => (
                  <div key={w.word} style={{
                    background: "#fff", border: "1.5px solid #ec407a", borderRadius: "6px",
                    padding: "4px 10px", fontFamily: "Lora,serif", fontSize: "13px",
                    color: "#880e4f", fontWeight: 600,
                  }}>
                    {w.word}
                    <span style={{ fontWeight: 400, fontSize: "11px", marginLeft: "5px", opacity: .7 }}>
                      ({w.encounters}×)
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "#6a5a30", marginTop: "8px", fontStyle: "italic" }}>
                💡 Try using these words in conversation at home to reinforce them!
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VocabDashboard({ children, user }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
  }, []);

  if (!children || children.length === 0) return null;

  return (
    <div style={{ background: "#fff", border: "1.5px solid #c8b888", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px" }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "16px", color: "#2d4a18", marginBottom: "4px" }}>
        📖 Vocabulary Progress
      </div>
      <div style={{ fontFamily: "Lora,serif", fontSize: "13px", color: "#6a5a30", lineHeight: 1.5, marginBottom: "4px" }}>
        StoryClue tracks every word across puzzles. Difficult words come back with simpler clues until mastered.
      </div>

      {children.map(child => (
        <ChildVocabCard key={child.id} child={child} session={session} />
      ))}
    </div>
  );
}
