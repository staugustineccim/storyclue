import { useState, useRef, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useAuth } from "../context/AuthContext";

// ── VoiceSetup ────────────────────────────────────────────────────────────────
// Parent voice recording and cloning flow (Updates 9 & 10).
// Shown inside account settings for Family Plan subscribers.
//
// Steps:
//   1. Quick Preview — parent reads one sentence, generates 3 preview phrases
//   2. Decision — approve or re-record
//   3. Full recording session (celebration + deployment messages)
//   4. Generate personalized phrases per child
//   5. Voice slot selection (Mom/Dad/Grandma/Grandpa)
//
// Falls back to Web Speech API for non-subscribers (free tier).

const G = "#2D5A1A";
const P = "#F4EFE4";

const VOICE_LABELS = ["Mom", "Dad", "Grandma", "Grandpa"];

const PREVIEW_SCRIPT =
  "Amazing job! You got it right — I am so proud of you!";

const DEPLOYMENT_PHRASES = [
  "I am so proud of you — say your child's name.",
  "I love you so much and I think about you every single day.",
  "You finished the puzzle — I wish I could be there to celebrate with you.",
  "Keep working hard — that makes me so happy.",
  "You never give up — that is one of the things I love most about you.",
  "Daddy loves you more than anything in the world.",
];

export default function VoiceSetup({ children = [], onClose }) {
  const { user } = useAuth();
  const [step,           setStep]           = useState("intro");     // intro → recording → preview → approve → phrases → deploy-q → deploy-record → done
  const [voiceLabel,     setVoiceLabel]     = useState("Mom");
  const [recording,      setRecording]      = useState(false);
  const [audioBlob,      setAudioBlob]      = useState(null);
  const [audioURL,       setAudioURL]       = useState(null);
  const [working,        setWorking]        = useState(false);
  const [error,          setError]          = useState("");
  const [previewAudios,  setPreviewAudios]  = useState([]);          // [{phrase, audioBase64}]
  const [voiceId,        setVoiceId]        = useState(null);
  const [phrases,        setPhrases]        = useState([]);          // personalized child phrases
  const [isDeployed,     setIsDeployed]     = useState(false);       // "away" mode
  const [deployBlob,     setDeployBlob]     = useState(null);
  const [deployURL,      setDeployURL]      = useState(null);
  const [deployRecording, setDeployRecording] = useState(false);
  const [deployPlaying,  setDeployPlaying]  = useState(false);
  const [photoFile,      setPhotoFile]      = useState(null);
  const [photoPreview,   setPhotoPreview]   = useState(null);
  const [savedVoiceId,   setSavedVoiceId]   = useState(null);

  const mediaRef      = useRef(null);
  const chunksRef     = useRef([]);
  const audioRef      = useRef(null);
  const deployAudioRef = useRef(null);
  const deployMediaRef = useRef(null);
  const deployChunksRef = useRef([]);

  // ── Recording helpers ──────────────────────────────────────────────────────
  async function startRecording(isDeployMsg = false) {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      if (isDeployMsg) {
        deployChunksRef.current = [];
        deployMediaRef.current = mr;
        mr.ondataavailable = e => { if (e.data.size > 0) deployChunksRef.current.push(e.data); };
        mr.onstop = () => {
          const blob = new Blob(deployChunksRef.current, { type: mr.mimeType });
          setDeployBlob(blob);
          setDeployURL(URL.createObjectURL(blob));
          setDeployRecording(false);
        };
        setDeployRecording(true);
      } else {
        chunksRef.current = [];
        mediaRef.current = mr;
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType });
          setAudioBlob(blob);
          setAudioURL(URL.createObjectURL(blob));
          setRecording(false);
        };
        setRecording(true);
      }
      mr.start();
    } catch (err) {
      setError("Could not access microphone. Please allow microphone access and try again.");
    }
  }

  function stopRecording(isDeployMsg = false) {
    if (isDeployMsg) {
      deployMediaRef.current?.stop();
      deployMediaRef.current?.stream?.getTracks().forEach(t => t.stop());
    } else {
      mediaRef.current?.stop();
      mediaRef.current?.stream?.getTracks().forEach(t => t.stop());
    }
  }

  // ── Convert blob to base64 ─────────────────────────────────────────────────
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ── Step: Submit preview recording to ElevenLabs ──────────────────────────
  async function submitPreview() {
    if (!audioBlob) return;
    setWorking(true);
    setError("");
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const res = await fetch("/api/voice?action=clone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ audioBase64, label: voiceLabel, previewOnly: true }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.fallback) {
          setError("Voice cloning requires a Family Plan subscription. You can upgrade from your account settings.");
        } else {
          setError(data.error || "Could not process recording. Please try again.");
        }
        setWorking(false);
        return;
      }
      setVoiceId(data.voiceId);
      setPreviewAudios(data.previews || []);
      setStep("preview");
    } catch (err) {
      console.error("[VoiceSetup] submitPreview error:", err);
      setError("Could not connect to voice service: " + (err?.message || String(err)));
    }
    setWorking(false);
  }

  // ── Step: Approve preview → generate personalized phrases ─────────────────
  async function approvePreview() {
    if (!voiceId || !children.length) {
      // No children yet — save voice and skip phrases
      await saveVoiceToSupabase(voiceId);
      setStep("deploy-q");
      return;
    }
    setWorking(true);
    setError("");
    // Generate personalized phrases for the first child (or all children)
    const allPhrases = [];
    for (const child of children.slice(0, 3)) {
      const res = await fetch("/api/voice?action=generate-phrases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voiceId, childName: child.name, parentLabel: voiceLabel }),
      });
      const data = await res.json();
      if (data.phrases?.length) {
        allPhrases.push({ child, phrases: data.phrases });
      }
    }
    setPhrases(allPhrases);
    await saveVoiceToSupabase(voiceId);
    setWorking(false);
    setStep("phrases");
  }

  // ── Save voice profile to Supabase ─────────────────────────────────────────
  async function saveVoiceToSupabase(vid) {
    if (!supabase || !user || !vid) return;
    try {
      // Set all other voices for this parent to inactive
      await supabase.from("voice_profiles")
        .update({ is_active: false })
        .eq("parent_id", user.id);

      const { data } = await supabase.from("voice_profiles").insert([{
        parent_id: user.id,
        label: voiceLabel,
        elevenlabs_voice_id: vid,
        is_active: true,
        is_deployed: false,
      }]).select().single();
      if (data) setSavedVoiceId(data.id);
    } catch {}
  }

  // ── Step: Handle deployment messages ──────────────────────────────────────
  async function submitDeploymentMessage() {
    if (!deployBlob || !savedVoiceId || !children.length) {
      setStep("done");
      return;
    }
    setWorking(true);
    try {
      // ── SECURITY: Upload to PRIVATE bucket — store file PATH not public URL ──
      // Playback uses short-lived signed URLs generated on demand (1 hour expiry).
      // A permanent public URL would allow anyone with the link to download and
      // re-use the parent's voice recording — we never do that.
      const fileName = `${user.id}/deploy_${Date.now()}.webm`;
      let audioPath = null;
      if (supabase) {
        const { data: upData } = await supabase.storage
          .from("voice-recordings-private") // PRIVATE bucket — configure in Supabase Storage
          .upload(fileName, deployBlob, { contentType: deployBlob.type, upsert: true });
        if (upData) audioPath = upData.path;
      }

      // Handle photo upload — also private
      let photoPath = null;
      if (photoFile && supabase) {
        const photoName = `${user.id}/deploy_photo_${Date.now()}.jpg`;
        const { data: photoUp } = await supabase.storage
          .from("voice-recordings-private")
          .upload(photoName, photoFile, { contentType: photoFile.type, upsert: true });
        if (photoUp) photoPath = photoUp.path;
      }

      // Save deployment messages for each child — store FILE PATHS not public URLs
      if (supabase && savedVoiceId) {
        for (const child of children) {
          await supabase.from("deployment_messages").insert([{
            voice_profile_id: savedVoiceId,
            child_profile_id: child.id,
            audio_path: audioPath,   // private storage path — signed URL generated at playback time
            photo_path: photoPath,   // private storage path
          }]);
        }
        // Mark voice as deployed
        await supabase.from("voice_profiles")
          .update({ is_deployed: true })
          .eq("id", savedVoiceId);
      }
    } catch {}
    setWorking(false);
    setStep("done");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const baseStyle = {
    position:"fixed", inset:0, background:"rgba(0,0,0,.6)",
    display:"flex", alignItems:"center", justifyContent:"center",
    zIndex:9500, padding:"1rem",
  };
  const modalStyle = {
    background:"#FDFAF4", borderRadius:"16px", padding:"28px 24px",
    maxWidth:"500px", width:"100%",
    boxShadow:"0 20px 60px rgba(0,0,0,.3)",
    fontFamily:"Lora,Georgia,serif",
    maxHeight:"90vh", overflowY:"auto", position:"relative",
  };
  const heading = { fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:G, marginBottom:"10px" };
  const sub     = { fontSize:"14px", color:"#555", lineHeight:1.6, marginBottom:"16px" };
  const btn     = { padding:"11px 24px", background:G, color:P, border:"none", borderRadius:"8px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", cursor:"pointer", marginRight:"10px" };
  const btnGhost = { ...btn, background:"transparent", color:G, border:`2px solid ${G}` };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === "intro") return (
    <div style={baseStyle}><div style={modalStyle}>
      <button onClick={onClose} style={{ position:"absolute", top:12, right:14, background:"none", border:"none", fontSize:"18px", cursor:"pointer", color:"#aaa" }}>✕</button>
      <div style={{ fontSize:"3rem", marginBottom:"12px" }}>🎤</div>
      <h2 style={heading}>Set Up Your Voice</h2>
      <p style={sub}>When your child does a puzzle, they'll hear your voice — not a robot. You'll record a quick sample and we'll use it for all celebration messages.</p>

      {/* Voice label selection */}
      <div style={{ marginBottom:"20px" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:"#4a3a18", marginBottom:"8px" }}>
          Which voice profile is this?
        </div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {VOICE_LABELS.map(label => (
            <button key={label} type="button"
              onClick={() => setVoiceLabel(label)}
              style={{ padding:"7px 16px", border:`2px solid ${voiceLabel===label ? G : "#c8b888"}`, borderRadius:"20px", background: voiceLabel===label ? G : "transparent", color: voiceLabel===label ? P : "#4a3a18", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ ...sub, background:"#e8f0d8", padding:"12px 14px", borderRadius:"8px", border:"1px solid #b8d898" }}>
        <strong>Step 1:</strong> Read one sentence out loud — that's all we need to learn your voice. Then you'll hear a preview before we save anything.
      </p>
      <button style={btn} onClick={() => setStep("recording")}>Let's Record →</button>
    </div></div>
  );

  // ── RECORDING ─────────────────────────────────────────────────────────────
  if (step === "recording") return (
    <div style={baseStyle}><div style={modalStyle}>
      <button onClick={onClose} style={{ position:"absolute", top:12, right:14, background:"none", border:"none", fontSize:"18px", cursor:"pointer", color:"#aaa" }}>✕</button>
      <div style={{ fontSize:"3rem", marginBottom:"12px" }}>{recording ? "🔴" : "🎤"}</div>
      <h2 style={heading}>Read This Sentence Aloud</h2>
      <div style={{ background:"#fff8e8", border:"2px solid #ffa726", borderRadius:"12px", padding:"18px", marginBottom:"20px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"17px", color:"#2c1a08", lineHeight:1.5, textAlign:"center" }}>
        "{PREVIEW_SCRIPT}"
      </div>
      <p style={sub}>Speak naturally in the voice your child knows — no need to sound "radio perfect." Just talk like you normally would.</p>

      {recording ? (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#c0392b", marginBottom:"14px", animation:"blink 1s infinite" }}>
            🔴 Recording… speak clearly
          </div>
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
          <button style={{ ...btn, background:"#c0392b" }} onClick={() => stopRecording(false)}>
            Stop Recording
          </button>
        </div>
      ) : audioURL ? (
        <div>
          <div style={{ marginBottom:"12px" }}>
            <audio ref={audioRef} src={audioURL} controls style={{ width:"100%", borderRadius:"8px" }} />
          </div>
          <p style={{ fontSize:"12px", color:"#888", marginBottom:"14px" }}>Sounds good? Click Continue to hear your voice preview. Or re-record.</p>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            <button style={btn} onClick={submitPreview} disabled={working}>
              {working ? "Processing…" : "Continue →"}
            </button>
            <button style={btnGhost} onClick={() => { setAudioBlob(null); setAudioURL(null); }}>
              Re-record
            </button>
          </div>
          {error && <div style={{ color:"#c0392b", fontSize:"13px", marginTop:"10px" }}>{error}</div>}
        </div>
      ) : (
        <button style={btn} onClick={() => startRecording(false)}>
          🎤 Start Recording
        </button>
      )}
    </div></div>
  );

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  if (step === "preview") return (
    <div style={baseStyle}><div style={modalStyle}>
      <div style={{ fontSize:"3rem", marginBottom:"12px" }}>👂</div>
      <h2 style={heading}>Listen to Your Voice Preview</h2>
      <p style={sub}>This is exactly what your child will hear when they complete a puzzle. Listen to all three, then decide.</p>

      {previewAudios.map((p, i) => (
        <div key={i} style={{ marginBottom:"12px", padding:"12px 14px", background:"#f9f5ec", borderRadius:"8px", border:"1px solid #e0d8c8" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"13px", color:G, marginBottom:"6px" }}>
            "{p.phrase}"
          </div>
          <audio src={p.audioBase64} controls style={{ width:"100%" }} />
        </div>
      ))}

      <div style={{ display:"flex", gap:"10px", marginTop:"20px", flexWrap:"wrap" }}>
        <button style={btn} onClick={approvePreview} disabled={working}>
          {working ? "Saving…" : "That sounds like me — Save My Voice ✓"}
        </button>
        <button style={btnGhost} onClick={() => { setVoiceId(null); setPreviewAudios([]); setAudioBlob(null); setAudioURL(null); setStep("recording"); }}>
          Try Again
        </button>
      </div>
      {error && <div style={{ color:"#c0392b", fontSize:"13px", marginTop:"10px" }}>{error}</div>}
    </div></div>
  );

  // ── PHRASES (personalized per child) ──────────────────────────────────────
  if (step === "phrases") return (
    <div style={baseStyle}><div style={modalStyle}>
      <div style={{ fontSize:"3rem", marginBottom:"12px" }}>✨</div>
      <h2 style={heading}>Personalized Celebration Phrases</h2>
      <p style={sub}>Here are your child's celebration messages — each one uses their name in your voice.</p>

      {phrases.map(({ child, phrases: ps }) => (
        <div key={child.id} style={{ marginBottom:"20px" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"15px", color:G, marginBottom:"10px" }}>
            {child.emoji} {child.name}
          </div>
          {ps.slice(0,3).map((p, i) => (
            <div key={i} style={{ marginBottom:"8px", padding:"10px 12px", background:"#f0f8e8", borderRadius:"8px", border:"1px solid #b8d898" }}>
              <div style={{ fontSize:"12px", color:"#4a6a28", marginBottom:"5px", fontStyle:"italic" }}>"{p.phrase}"</div>
              <audio src={p.audioBase64} controls style={{ width:"100%", height:"32px" }} />
            </div>
          ))}
        </div>
      ))}

      {phrases.length === 0 && (
        <p style={{ ...sub, color:"#888" }}>Add child profiles to generate personalized messages.</p>
      )}

      <button style={btn} onClick={() => setStep("deploy-q")}>
        Continue →
      </button>
    </div></div>
  );

  // ── DEPLOYMENT QUESTION ────────────────────────────────────────────────────
  if (step === "deploy-q") return (
    <div style={baseStyle}><div style={modalStyle}>
      <div style={{ fontSize:"3rem", marginBottom:"12px" }}>🎖️</div>
      <h2 style={heading}>One Optional Question</h2>
      <p style={sub}>Are you currently away from home, deployed, or about to travel for an extended time?</p>
      <p style={{ fontSize:"13px", color:"#888", lineHeight:1.6, marginBottom:"20px" }}>
        If yes, you can record a special personal message for your child to hear when they complete a puzzle — just for those moments when you can't be there.
      </p>
      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
        <button style={btn} onClick={() => { setIsDeployed(true); setStep("deploy-record"); }}>
          Yes — I'd like to record a special message
        </button>
        <button style={btnGhost} onClick={() => setStep("done")}>
          No — all done
        </button>
      </div>
    </div></div>
  );

  // ── DEPLOYMENT RECORDING ───────────────────────────────────────────────────
  if (step === "deploy-record") return (
    <div style={baseStyle}><div style={modalStyle}>
      <div style={{ fontSize:"3rem", marginBottom:"12px" }}>💌</div>
      <h2 style={heading}>Record Your Special Message</h2>
      <p style={sub}>Say anything from your heart. Here are some phrases that mean a lot — use them exactly, mix them, or say something completely your own.</p>

      <div style={{ background:"#fff8e8", border:"1px solid #ffa726", borderRadius:"10px", padding:"14px", marginBottom:"18px" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"12px", color:"#7a5000", marginBottom:"8px" }}>SUGGESTED PHRASES</div>
        {DEPLOYMENT_PHRASES.map((phrase, i) => (
          <div key={i} style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#2c1a08", marginBottom:"6px", lineHeight:1.5 }}>
            • {phrase}
          </div>
        ))}
      </div>

      {/* Optional photo upload */}
      <div style={{ marginBottom:"16px" }}>
        <label style={{ display:"block", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"12px", color:"#4a3a18", marginBottom:"6px" }}>
          Optional: Add a photo to show during your message
        </label>
        <input
          type="file" accept="image/*"
          onChange={e => {
            const f = e.target.files[0];
            if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
          }}
          style={{ fontFamily:"Lora,serif", fontSize:"13px" }}
        />
        {photoPreview && (
          <img src={photoPreview} alt="Preview" style={{ marginTop:"8px", maxWidth:"120px", maxHeight:"120px", borderRadius:"8px", objectFit:"cover" }} />
        )}
      </div>

      {/* Recording controls */}
      {deployRecording ? (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#c0392b", marginBottom:"14px" }}>
            🔴 Recording… speak from the heart
          </div>
          <button style={{ ...btn, background:"#c0392b" }} onClick={() => stopRecording(true)}>
            Stop Recording
          </button>
        </div>
      ) : deployURL ? (
        <div>
          <audio ref={deployAudioRef} src={deployURL} controls style={{ width:"100%", marginBottom:"12px" }} />
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            <button style={btn} onClick={submitDeploymentMessage} disabled={working}>
              {working ? "Saving…" : "Save Message ✓"}
            </button>
            <button style={btnGhost} onClick={() => { setDeployBlob(null); setDeployURL(null); }}>
              Re-record
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button style={btn} onClick={() => startRecording(true)}>
            🎤 Start Recording
          </button>
          <button style={{ ...btnGhost, marginLeft:"10px" }} onClick={() => setStep("done")}>
            Skip
          </button>
        </div>
      )}

      <div style={{ marginTop:"16px", padding:"10px 12px", background:"#f0f0f0", borderRadius:"8px", fontSize:"11px", color:"#666", lineHeight:1.6 }}>
        🔒 Privacy: Your voice recording is processed by ElevenLabs and stored securely. You can delete it at any time from your account settings.
      </div>
    </div></div>
  );

  // ── DONE ───────────────────────────────────────────────────────────────────
  if (step === "done") return (
    <div style={baseStyle}><div style={modalStyle}>
      <div style={{ textAlign:"center", padding:"20px 0" }}>
        <div style={{ fontSize:"4rem", marginBottom:"12px" }}>🎉</div>
        <h2 style={heading}>Voice Set Up!</h2>
        <p style={sub}>
          {voiceLabel}'s voice is ready. Every time {children[0]?.name || "your child"} completes a puzzle, they'll hear your voice celebrating with them.
        </p>
        {isDeployed && (
          <p style={{ ...sub, background:"#e8f0d8", padding:"12px", borderRadius:"8px", border:"1px solid #b8d898" }}>
            💌 Your special deployment message has been saved. It will play when {children[0]?.name || "your child"} completes a puzzle.
          </p>
        )}
        <button style={{ ...btn, marginRight:0 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div></div>
  );

  return null;
}
