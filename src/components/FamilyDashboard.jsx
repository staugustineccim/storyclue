import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";
import VoiceSetup from "./VoiceSetup";
import VocabDashboard from "./VocabDashboard";

// ── FamilyDashboard ───────────────────────────────────────────────────────────
// Shown to signed-in users before audience selection.
// Displays each child as a large colorful tile. Tap a tile → load that child's
// configured interface. Includes Add Child and parent settings links.

const GRADE_LABEL = {
  k:"Kindergarten", "1":"1st Grade","2":"2nd Grade","3":"3rd Grade",
  "4":"4th Grade","5":"5th Grade","6":"6th Grade","7":"7th Grade",
  "8":"8th Grade","9-10":"9th–10th","11-12":"11th–12th","adult":"Reader Mode",
};

const TILE_COLORS = [
  { bg:"#e8f5e9", border:"#66bb6a", text:"#1b5e20" },
  { bg:"#e3f2fd", border:"#42a5f5", text:"#0d47a1" },
  { bg:"#fce4ec", border:"#ec407a", text:"#880e4f" },
  { bg:"#fff8e1", border:"#ffa726", text:"#e65100" },
  { bg:"#f3e5f5", border:"#ab47bc", text:"#4a148c" },
];

const AUDIENCE_MAP = {
  k:"early-learner","1":"early-learner","2":"early-learner",
  "3":"elementary","4":"elementary","5":"elementary",
  "6":"middle-high","7":"middle-high","8":"middle-high",
  "9-10":"middle-high","11-12":"middle-high",
  "adult":"adult",
};

const DEFAULT_EMOJIS = ["⭐","🌟","🦁","🐬","🦋","🌈","🚀","🎨","🎵","🌺"];

export default function FamilyDashboard({ onSelectChild, onSkipToAudience }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [children,    setChildren]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName,     setNewName]     = useState("");
  const [newGrade,    setNewGrade]    = useState("3");
  const [newEmoji,    setNewEmoji]    = useState("⭐");
  const [saving,      setSaving]      = useState(false);
  const [showVoice,    setShowVoice]    = useState(false);
  const [voiceProfiles, setVoiceProfiles] = useState([]); // {id, label, is_active, is_deployed}

  useEffect(() => {
    if (!supabase || !user) { setLoading(false); return; }
    // Load children and existing voice profiles in parallel
    Promise.all([
      supabase.from("child_profiles").select("*").eq("parent_id", user.id).order("created_at", { ascending: true }),
      supabase.from("voice_profiles").select("id,label,is_active,is_deployed").eq("parent_id", user.id).eq("is_active", true),
    ]).then(([{ data: kids, error: kErr }, { data: voices, error: vErr }]) => {
      if (!kErr && kids)   setChildren(kids);
      if (!vErr && voices) setVoiceProfiles(voices);
      setLoading(false);
    });
  }, [user]);

  async function addChild(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const child = {
      parent_id: user.id,
      name:      newName.trim(),
      grade:     newGrade,
      audience:  AUDIENCE_MAP[newGrade] || "elementary",
      emoji:     newEmoji,
    };
    const { data, error } = await supabase
      .from("child_profiles")
      .insert([child])
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setChildren(prev => [...prev, data]);
      setNewName(""); setNewGrade("3"); setNewEmoji("⭐");
      setShowAddForm(false);
    }
  }

  function selectChild(child) {
    // Store selected child in sessionStorage so PuzzleGenerator can read it
    try {
      sessionStorage.setItem("sc_active_child", JSON.stringify({
        id: child.id, name: child.name, grade: child.grade, audience: child.audience, emoji: child.emoji,
      }));
    } catch {}
    onSelectChild(child);
  }

  const name = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div style={{ minHeight:"100vh", background:"#faf7f0", fontFamily:"Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .child-tile{border-radius:16px;padding:28px 20px;cursor:pointer;transition:transform .15s,box-shadow .15s;border:2px solid;text-align:center;position:relative}
        .child-tile:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.12)}
        .grade-opt{padding:5px 10px;border:1.5px solid #c8b888;border-radius:4px;font-size:12px;font-family:'Playfair Display',serif;font-weight:700;cursor:pointer;background:transparent;color:#4a3a18;transition:all .15s}
        .grade-opt.on{background:#3a6a1a;color:#f0ead8;border-color:#3a6a1a}
        .emoji-opt{padding:6px;border-radius:6px;border:2px solid transparent;cursor:pointer;font-size:22px;transition:all .1s}
        .emoji-opt.on{border-color:#3a6a1a;background:#e8f0d8}
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#2d4a18,#4a7a22)", padding:"14px 20px", borderBottom:"3px solid #8a7a30", display:"flex", alignItems:"center", gap:"14px" }}>
        <button onClick={() => navigate("/")} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
          <img src="/icon-192.png" alt="StoryClue" style={{ width:"34px", height:"34px", borderRadius:"7px" }} />
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:"#f0ead8" }}>StoryClue</div>
          <div style={{ fontSize:"11px", color:"#a8d890", fontStyle:"italic" }}>AI Generated Crossword Puzzle Maker</div>
        </div>
        {user?.user_metadata?.avatar_url && (
          <img src={user.user_metadata.avatar_url} alt="" style={{ width:32, height:32, borderRadius:"50%", border:"2px solid rgba(255,255,255,.4)" }} referrerPolicy="no-referrer" />
        )}
        <button onClick={signOut} style={{ background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.3)", borderRadius:"4px", padding:"5px 12px", color:"#f0ead8", fontFamily:"Lora,serif", fontSize:"12px", cursor:"pointer" }}>
          Sign out
        </button>
      </div>

      <div style={{ maxWidth:"900px", margin:"0 auto", padding:"40px 20px" }}>

        {/* Welcome */}
        <div style={{ marginBottom:"36px" }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"28px", color:"#2d4a18", marginBottom:"6px" }}>
            Welcome back, {name}! 👋
          </h1>
          <p style={{ fontFamily:"Lora,serif", fontSize:"15px", color:"#6a5a30" }}>
            Who's doing a puzzle today?
          </p>
        </div>

        {/* Child tiles */}
        {loading ? (
          <div style={{ fontFamily:"Lora,serif", color:"#888", padding:"20px 0" }}>Loading your family…</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"16px", marginBottom:"28px" }}>

            {children.map((child, i) => {
              const color = TILE_COLORS[i % TILE_COLORS.length];
              return (
                <div
                  key={child.id}
                  className="child-tile"
                  style={{ background:color.bg, borderColor:color.border }}
                  onClick={() => selectChild(child)}
                >
                  <div style={{ fontSize:"44px", marginBottom:"10px" }}>{child.emoji || "⭐"}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:color.text, marginBottom:"4px" }}>
                    {child.name}
                  </div>
                  <div style={{ fontFamily:"Lora,serif", fontSize:"13px", color:color.text, opacity:.8, marginBottom:"10px" }}>
                    {GRADE_LABEL[child.grade] || child.grade}
                  </div>
                  {child.last_puzzle_title && (
                    <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:color.text, opacity:.65, fontStyle:"italic" }}>
                      Last: {child.last_puzzle_title}
                    </div>
                  )}
                  <div style={{ position:"absolute", bottom:"10px", right:"12px", fontFamily:"Lora,serif", fontSize:"11px", color:color.text, opacity:.5 }}>
                    {child.puzzle_count || 0} puzzle{child.puzzle_count !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}

            {/* Add Child tile */}
            <div
              className="child-tile"
              style={{ background:"#f0ead8", borderColor:"#c8b888", borderStyle:"dashed" }}
              onClick={() => setShowAddForm(true)}
            >
              <div style={{ fontSize:"36px", marginBottom:"10px", opacity:.5 }}>➕</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"15px", color:"#6a5a30" }}>
                Add Child
              </div>
            </div>

          </div>
        )}

        {/* Add child form */}
        {showAddForm && (
          <div style={{ background:"#fff", border:"2px solid #b8d898", borderRadius:"12px", padding:"24px", marginBottom:"28px" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"18px", color:"#2d4a18", marginBottom:"18px" }}>
              Add a Child Profile
            </h3>
            <form onSubmit={addChild}>
              {/* Name */}
              <div style={{ marginBottom:"16px" }}>
                <label style={{ display:"block", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:"#4a3a18", marginBottom:"6px" }}>
                  Child's Name
                </label>
                <input
                  type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Emma, Jack, Journey"
                  required
                  style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #c8b888", borderRadius:"4px", fontFamily:"Lora,serif", fontSize:"14px", background:"#fffef5" }}
                />
              </div>

              {/* Grade */}
              <div style={{ marginBottom:"16px" }}>
                <label style={{ display:"block", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:"#4a3a18", marginBottom:"8px" }}>
                  Grade Level
                </label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {[
                    {key:"k",label:"K"},{key:"1",label:"1st"},{key:"2",label:"2nd"},
                    {key:"3",label:"3rd"},{key:"4",label:"4th"},{key:"5",label:"5th"},
                    {key:"6",label:"6th"},{key:"7",label:"7th"},{key:"8",label:"8th"},
                    {key:"9-10",label:"9–10"},{key:"11-12",label:"11–12"},{key:"adult",label:"Reader"},
                  ].map(g => (
                    <button type="button" key={g.key}
                      className={`grade-opt${newGrade===g.key?" on":""}`}
                      onClick={() => setNewGrade(g.key)}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji */}
              <div style={{ marginBottom:"20px" }}>
                <label style={{ display:"block", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:"#4a3a18", marginBottom:"8px" }}>
                  Profile Emoji
                </label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                  {DEFAULT_EMOJIS.map(em => (
                    <button type="button" key={em}
                      className={`emoji-opt${newEmoji===em?" on":""}`}
                      onClick={() => setNewEmoji(em)}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display:"flex", gap:"10px" }}>
                <button type="submit" disabled={saving} style={{ padding:"10px 24px", background:"#2d4a18", color:"#f0ead8", border:"none", borderRadius:"6px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
                  {saving ? "Saving…" : "Add Child"}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ padding:"10px 20px", background:"transparent", border:"1.5px solid #c8b888", borderRadius:"6px", fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", cursor:"pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Parent Voice Settings */}
        <div style={{ background:"#fff", border:"1.5px solid #c8b888", borderRadius:"12px", padding:"20px 24px", marginBottom:"24px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:"#2d4a18", marginBottom:"4px" }}>
                🎙️ Parent Voice Settings
              </div>
              {voiceProfiles.length === 0 ? (
                <div style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#6a5a30", lineHeight:1.5 }}>
                  Record your voice so your child hears <em>you</em> reading their puzzle clues — even when you're away.
                  Mom, Dad, Grandma, and Grandpa each get their own voice.
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#6a5a30", lineHeight:1.5, marginBottom:"8px" }}>
                    {voiceProfiles.map(v => (
                      <span key={v.id} style={{ display:"inline-flex", alignItems:"center", gap:"4px", marginRight:"12px", color:"#2d4a18", fontWeight:600 }}>
                        ✅ {v.label}{v.is_deployed ? " 🎖️" : ""}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#8a7a5a" }}>
                    <strong>{voiceProfiles[0].label}'s voice</strong> is the default. Add another voice or re-record any time.
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowVoice(true)}
              style={{ padding:"10px 22px", background:"#2d4a18", color:"#f0ead8", border:"none", borderRadius:"8px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", cursor:"pointer", whiteSpace:"nowrap" }}
            >
              {voiceProfiles.length === 0 ? "Set Up Voice →" : "Add / Update Voice →"}
            </button>
          </div>
        </div>

        {/* Vocabulary Progress — only show when children exist */}
        {children.length > 0 && (
          <VocabDashboard children={children} user={user} />
        )}

        {/* Parent / no-child option */}
        <div style={{ textAlign:"center", paddingTop:"16px", borderTop:"1px solid #e0d8c8" }}>
          <button
            onClick={onSkipToAudience}
            style={{ background:"none", border:"none", fontFamily:"Lora,serif", fontSize:"13px", color:"#8a7a5a", cursor:"pointer", textDecoration:"underline" }}
          >
            Continue as myself (no child profile)
          </button>
        </div>

      </div>

      {/* Voice Setup overlay */}
      {showVoice && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:1000, overflowY:"auto" }}>
          <VoiceSetup children={children} existingVoices={voiceProfiles} onClose={() => { setShowVoice(false); /* reload voices after setup */ supabase?.from("voice_profiles").select("id,label,is_active,is_deployed").eq("parent_id", user.id).eq("is_active", true).then(({ data }) => { if (data) setVoiceProfiles(data); }); }} />
        </div>
      )}

    </div>
  );
}
