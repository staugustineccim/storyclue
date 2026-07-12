import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";

const G = "#2D5A1A";
const P = "#F4EFE4";

export default function ChurchSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ pastorName:"", churchName:"", email:"", youtubeChannel:"", sendTime:"14:00" });
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [error, setError] = useState("");

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.pastorName || !form.churchName || !form.email) {
      setError("Please fill in your name, church name, and email.");
      return;
    }
    setStatus("saving");
    setError("");
    try {
      const { error: dbError } = await supabase.from("church_accounts").insert({
        pastor_name: form.pastorName,
        church_name: form.churchName,
        sender_email: form.email,
        youtube_channel: form.youtubeChannel || null,
        send_time: form.sendTime,
      });
      if (dbError) throw dbError;
      setStatus("done");
    } catch (err) {
      console.error("church signup error:", err);
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div style={{ minHeight:"100vh", background:P, fontFamily:"Georgia,serif", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
        <div style={{ maxWidth:"480px", textAlign:"center" }}>
          <div style={{ fontSize:"4rem", marginBottom:"16px" }}>✅</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"28px", color:"#2c1a08", marginBottom:"12px" }}>You're all set, Pastor {form.pastorName}!</h1>
          <p style={{ fontFamily:"Lora,serif", fontSize:"16px", color:"#5a4a28", lineHeight:1.7, marginBottom:"32px" }}>
            We'll watch your YouTube channel every Sunday. After your service, we'll generate a crossword from your sermon and email it to <strong>{form.email}</strong> by {form.sendTime === "14:00" ? "2:00 PM" : form.sendTime}.
          </p>
          <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#8a7a5a", marginBottom:"32px" }}>
            Forward that link to your congregation however you normally reach them — email, church bulletin, text message.
          </p>
          <button onClick={() => navigate("/")} style={{ background:G, color:P, border:"none", borderRadius:"6px", padding:"14px 32px", fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"16px", cursor:"pointer" }}>
            Back to StoryClue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:P, fontFamily:"Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .field{display:flex;flex-direction:column;gap:6px;margin-bottom:20px}
        .field label{font-family:'Playfair Display',serif;font-weight:700;font-size:14px;color:#2c1a08}
        .field input,.field select{padding:10px 14px;border:1.5px solid #c8b870;border-radius:6px;font-family:Lora,serif;font-size:15px;background:#fff;color:#2c1a08;outline:none}
        .field input:focus,.field select:focus{border-color:${G}}
        .field .hint{font-family:Lora,serif;font-size:12px;color:#8a7a5a;font-style:italic}
      `}</style>

      {/* Header */}
      <div style={{ background:G, padding:"14px 24px", display:"flex", alignItems:"center", gap:"12px", borderBottom:"2px solid #8A7A30" }}>
        <img src="/logo.jpg" alt="StoryClue" style={{ width:"32px", height:"32px", borderRadius:"6px", objectFit:"cover" }} />
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:P, flex:1 }}>StoryClue — Church Setup</span>
        <button onClick={() => navigate("/church")} style={{ background:"none", border:"1px solid rgba(255,255,255,.4)", borderRadius:"4px", color:P, padding:"6px 14px", fontFamily:"Lora,serif", fontSize:"13px", cursor:"pointer" }}>
          Back
        </button>
      </div>

      <div style={{ maxWidth:"520px", margin:"0 auto", padding:"48px 24px" }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"28px", color:"#2c1a08", marginBottom:"8px" }}>Set Up Church Mode</h1>
        <p style={{ fontFamily:"Lora,serif", fontSize:"15px", color:"#5a4a28", lineHeight:1.7, marginBottom:"32px" }}>
          Tell us about your church and we'll handle everything automatically each Sunday.
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Your Name *</label>
            <input value={form.pastorName} onChange={e => set("pastorName", e.target.value)} placeholder="Pastor Matt" />
          </div>
          <div className="field">
            <label>Church Name *</label>
            <input value={form.churchName} onChange={e => set("churchName", e.target.value)} placeholder="Colonial Church of St. Augustine" />
          </div>
          <div className="field">
            <label>Your Email *</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="pastor@yourchurch.com" />
            <span className="hint">We'll send the puzzle link here every Sunday</span>
          </div>
          <div className="field">
            <label>YouTube Channel URL</label>
            <input value={form.youtubeChannel} onChange={e => set("youtubeChannel", e.target.value)} placeholder="https://www.youtube.com/@YourChurch" />
            <span className="hint">We'll watch this for new Sunday sermons. You can also paste sermon text manually.</span>
          </div>
          <div className="field">
            <label>Send puzzle to you by</label>
            <select value={form.sendTime} onChange={e => set("sendTime", e.target.value)}>
              <option value="13:00">1:00 PM Sunday</option>
              <option value="14:00">2:00 PM Sunday</option>
              <option value="15:00">3:00 PM Sunday</option>
              <option value="16:00">4:00 PM Sunday</option>
              <option value="17:00">5:00 PM Sunday</option>
            </select>
          </div>

          {error && (
            <div style={{ background:"#fde8e8", border:"1px solid #f48a8a", borderRadius:"6px", padding:"10px 14px", fontFamily:"Lora,serif", fontSize:"14px", color:"#b00020", marginBottom:"16px" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={status === "saving"} style={{ width:"100%", background:G, color:P, border:"none", borderRadius:"6px", padding:"16px", fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"18px", cursor:"pointer", boxShadow:"3px 3px 0 #1a3a08", opacity: status === "saving" ? 0.7 : 1 }}>
            {status === "saving" ? "Setting up…" : "Set Up My Church →"}
          </button>

          <p style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"#8a7a5a", textAlign:"center", marginTop:"12px" }}>
            Free forever for pastors. No credit card required.
          </p>
        </form>
      </div>
    </div>
  );
}
