import { useNavigate } from "react-router-dom";

const G = "#2D5A1A";
const P = "#F4EFE4";

export default function ChurchMode() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight:"100vh", background:P, fontFamily:"Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
      `}</style>

      {/* Header */}
      <div style={{ background:G, padding:"14px 24px", display:"flex", alignItems:"center", gap:"12px", borderBottom:"2px solid #8A7A30" }}>
        <img src="/logo.jpg" alt="StoryClue" style={{ width:"32px", height:"32px", borderRadius:"6px", objectFit:"cover" }} />
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:P, flex:1 }}>StoryClue</span>
        <button onClick={() => navigate("/")} style={{ background:"none", border:"1px solid rgba(255,255,255,.4)", borderRadius:"4px", color:P, padding:"6px 14px", fontFamily:"Lora,serif", fontSize:"13px", cursor:"pointer" }}>
          Back to StoryClue
        </button>
      </div>

      {/* Hero */}
      <div style={{ background:`linear-gradient(160deg,${G} 0%,#4a7a22 100%)`, padding:"72px 24px", textAlign:"center" }}>
        <div style={{ fontSize:"3rem", marginBottom:"16px" }}>✝️</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(28px,5vw,48px)", color:P, lineHeight:1.2, marginBottom:"16px" }}>
          Church Mode
        </h1>
        <p style={{ fontFamily:"Lora,serif", fontSize:"clamp(15px,2vw,19px)", color:"#c8e8a8", lineHeight:1.7, maxWidth:"600px", margin:"0 auto 32px" }}>
          Every Sunday, StoryClue turns your sermon into a crossword puzzle and sends it straight to you — ready to share with your congregation.
        </p>
        <button
          onClick={() => navigate("/church/setup")}
          style={{ background:P, color:G, border:"none", borderRadius:"6px", padding:"16px 40px", fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"18px", cursor:"pointer", boxShadow:"0 4px 16px rgba(0,0,0,.2)" }}
        >
          Set Up My Church →
        </button>
        <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"rgba(200,232,168,.8)", marginTop:"12px" }}>
          Free forever for pastors
        </p>
      </div>

      {/* How it works */}
      <div style={{ maxWidth:"800px", margin:"0 auto", padding:"64px 24px" }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"30px", color:"#2c1a08", textAlign:"center", marginBottom:"48px" }}>
          How It Works
        </h2>
        <div style={{ display:"flex", gap:"32px", flexWrap:"wrap", justifyContent:"center" }}>
          {[
            { step:"1", icon:"⛪", title:"Connect Your Church", desc:"Tell us your church name, your email, and your YouTube channel. Takes 2 minutes." },
            { step:"2", icon:"📖", title:"Sermon Detected", desc:"Every Sunday after your service, StoryClue finds your latest sermon on YouTube and builds a crossword from it." },
            { step:"3", icon:"📧", title:"You Get the Puzzle", desc:"We email you the puzzle link. You forward it to your congregation however you normally communicate — email, bulletin, text." },
            { step:"4", icon:"✅", title:"Congregation Engages", desc:"Your people play the puzzle, reinforce the key points of your message, and come back next week." },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} style={{ flex:"1", minWidth:"200px", maxWidth:"340px", textAlign:"center" }}>
              <div style={{ width:"48px", height:"48px", background:G, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", color:P, fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px" }}>{step}</div>
              <div style={{ fontSize:"2rem", marginBottom:"8px" }}>{icon}</div>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"18px", color:"#2c1a08", marginBottom:"8px" }}>{title}</h3>
              <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", marginTop:"56px" }}>
          <button
            onClick={() => navigate("/church/setup")}
            style={{ background:G, color:P, border:"none", borderRadius:"6px", padding:"16px 40px", fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"18px", cursor:"pointer", boxShadow:"3px 3px 0 #1a3a08" }}
          >
            Get Started — It's Free →
          </button>
        </div>
      </div>
    </div>
  );
}
