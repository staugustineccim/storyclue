/**
 * SongsLibrary
 *
 * Browsable tile grid of pre-loaded K-2 songs. Shows when inputMode === "songs"
 * in the Early Learner interface. Tap a tile to select it — no other input needed.
 *
 * Props:
 *   grade          — "k" | "1" | "2"
 *   faithTradition — "none" | "christian-protestant" | "christian-catholic" | "jewish" | …
 *   completedIds   — Set<string> of song IDs the child has already finished
 *   selectedId     — currently selected song ID (or null)
 *   onSelect       — (song) => void — called when a tile is tapped
 */
import { useState } from "react";
import { getSongsForGrade, groupSongsByCategory } from "../utils/songsData";

const ACCENT = "#2D5A1A";

export default function SongsLibrary({ grade, faithTradition, completedIds = new Set(), selectedId, onSelect }) {
  const songs    = getSongsForGrade(grade, faithTradition);
  const groups   = groupSongsByCategory(songs);
  const [activeTab, setActiveTab] = useState("all");

  const displayGroups =
    activeTab === "all"
      ? groups
      : groups.filter(g => g.categoryId === activeTab);

  if (songs.length === 0) {
    return (
      <div style={{ padding:"20px", fontFamily:"Lora,serif", color:"#5a4a28", fontSize:"14px", textAlign:"center" }}>
        No songs available for this grade and faith tradition.
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .song-tab{
          padding:6px 14px; border-radius:20px; border:1.5px solid #c8b888;
          background:transparent; color:#4a3a18;
          font-family:'Playfair Display',serif; font-weight:700; font-size:12px;
          cursor:pointer; transition:all .15s; white-space:nowrap;
        }
        .song-tab.on{background:${ACCENT};color:#f0ead8;border-color:${ACCENT}}
        .song-tab:hover:not(.on){background:#e8e0cc}

        .song-tile{
          display:flex; flex-direction:column; align-items:center;
          padding:14px 10px; border-radius:12px;
          border:2px solid #e0d8c8; background:#fffef5;
          cursor:pointer; transition:all .15s;
          position:relative; text-align:center;
          min-width:0;
        }
        .song-tile:hover{border-color:${ACCENT};background:#f0f8e8;transform:translateY(-2px);box-shadow:0 4px 12px rgba(45,90,26,.15)}
        .song-tile.selected{border-color:${ACCENT};background:#e8f5d8;box-shadow:0 0 0 3px ${ACCENT}44}
        .song-tile.completed{border-color:#d4a820;background:#fffbe8}

        .song-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(120px,1fr));
          gap:10px;
        }
        @media(max-width:480px){
          .song-grid{grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px}
        }
      `}</style>

      {/* ── Category tabs ── */}
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"14px", overflowX:"auto", paddingBottom:"2px" }}>
        <button className={`song-tab${activeTab==="all"?" on":""}`} onClick={() => setActiveTab("all")}>
          🎵 All Songs
        </button>
        {groups.map(g => (
          <button key={g.categoryId}
            className={`song-tab${activeTab===g.categoryId?" on":""}`}
            onClick={() => setActiveTab(g.categoryId)}>
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      {/* ── Song tiles grouped by category ── */}
      {displayGroups.map(group => (
        <div key={group.categoryId} style={{ marginBottom:"20px" }}>
          <div style={{
            fontSize:"11px", color:"#8a7a5a", fontFamily:"Lora,serif",
            textTransform:"uppercase", letterSpacing:"0.6px",
            marginBottom:"8px", fontWeight:600,
          }}>
            {group.emoji} {group.label}
          </div>

          <div className="song-grid">
            {group.songs.map(song => {
              const isSelected  = song.id === selectedId;
              const isCompleted = completedIds.has(song.id);
              return (
                <button
                  key={song.id}
                  type="button"
                  className={`song-tile${isSelected?" selected":""}${isCompleted?" completed":""}`}
                  onClick={() => onSelect(song)}
                  title={song.title}
                >
                  {/* Gold star badge for completed songs */}
                  {isCompleted && (
                    <span style={{
                      position:"absolute", top:"-6px", right:"-6px",
                      fontSize:"16px", lineHeight:1, filter:"drop-shadow(0 1px 2px rgba(0,0,0,.25))",
                    }}>⭐</span>
                  )}

                  {/* Song emoji */}
                  <span style={{ fontSize:"2rem", lineHeight:1, marginBottom:"6px", display:"block" }}>
                    {song.emoji}
                  </span>

                  {/* Song title — truncate gracefully */}
                  <span style={{
                    fontFamily:"Lora,serif", fontWeight:600,
                    fontSize:"11px", color: isSelected ? ACCENT : "#2c1a08",
                    lineHeight:1.3,
                    overflow:"hidden", textOverflow:"ellipsis",
                    display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                  }}>
                    {song.title}
                  </span>

                  {/* Selected indicator */}
                  {isSelected && (
                    <span style={{
                      marginTop:"6px", fontSize:"10px", fontFamily:"Lora,serif",
                      fontWeight:700, color:ACCENT, display:"block",
                    }}>✓ Selected</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Count ── */}
      <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"#8a7a5a", marginTop:"4px" }}>
        {songs.length} songs available · {completedIds.size} completed
        {completedIds.size > 0 && " ⭐"}
      </div>
    </div>
  );
}
