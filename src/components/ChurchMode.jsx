import { useNavigate } from "react-router-dom";

const G  = "#2D5A1A";
const P  = "#F4EFE4";
const A  = "#8A7A30";
const D  = "#2c1a08";

export default function ChurchMode() {
  const navigate = useNavigate();

  return (
    <div style={{ background: P, fontFamily: "Georgia,serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .church-cta {
          display: inline-block; padding: 16px 40px; background: ${G}; color: ${P};
          font-family: 'Playfair Display', serif; font-weight: 900; font-size: 18px;
          border-radius: 6px; border: none; cursor: pointer; transition: all .2s;
          box-shadow: 3px 3px 0 #1a3a08; letter-spacing: .3px;
        }
        .church-cta:hover { background: #4a8a2a; transform: translateY(-2px); }
        .step-card {
          background: #fff; border-radius: 10px; padding: 32px 28px;
          flex: 1; min-width: 220px; border: 1px solid #e0d8c8;
          box-shadow: 2px 2px 0 #e0d4a0;
        }
        .step-num {
          width: 40px; height: 40px; border-radius: 50%; background: ${G}; color: ${P};
          font-family: 'Playfair Display', serif; font-weight: 900; font-size: 18px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .receive-item {
          display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px;
        }
        .receive-icon {
          font-size: 22px; flex-shrink: 0; margin-top: 2px;
        }
        .why-item {
          background: #fff; border-radius: 8px; padding: 22px 20px;
          border-left: 4px solid ${G}; margin-bottom: 16px;
        }
        nav a {
          font-family: 'Playfair Display', serif; font-weight: 700; font-size: 13px;
          color: rgba(240,234,216,.85); text-decoration: none; transition: color .15s;
        }
        nav a:hover { color: #fff; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: G, padding: "14px 24px", display: "flex", alignItems: "center", gap: "20px", position: "sticky", top: 0, zIndex: 100, borderBottom: "2px solid " + A }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "20px", color: P, flex: 1, cursor: "pointer" }}
          onClick={() => navigate("/")}>StoryClue</span>
        <a href="#how-it-works">How It Works</a>
        <a href="#what-they-receive">What They Receive</a>
        <a href="#why">Why It Works</a>
        <button className="church-cta" style={{ padding: "8px 20px", fontSize: "13px" }}
          onClick={() => navigate("/church/setup")}>
          Set Up Your Church →
        </button>
      </nav>

      {/* HERO */}
      <section style={{ background: `linear-gradient(160deg,${G} 0%,#4a7a22 60%,#3a6018 100%)`, padding: "88px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ fontSize: "52px", marginBottom: "18px" }}>⛪</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "clamp(28px,5vw,50px)", color: P, lineHeight: 1.15, marginBottom: "22px" }}>
            Your sermon. Your words.<br />A Sunday evening your congregation will actually remember.
          </h1>
          <p style={{ fontFamily: "Lora,serif", fontSize: "clamp(16px,2vw,20px)", color: "rgba(244,239,228,.88)", lineHeight: 1.75, marginBottom: "36px", maxWidth: "660px", margin: "0 auto 36px" }}>
            StoryClue turns your weekly sermon into an engaging crossword puzzle recap — automatically.
            <strong style={{ color: P }}> Free for every pastor. Every week. No strings attached.</strong>
          </p>
          <button className="church-cta" onClick={() => navigate("/church/setup")}>
            Set Up Your Church — It's Free →
          </button>
          <p style={{ fontFamily: "Lora,serif", fontSize: "13px", color: "rgba(244,239,228,.6)", marginTop: "16px" }}>
            No credit card. No trial period. No catch.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: "72px 24px", background: P }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "32px", color: D, textAlign: "center", marginBottom: "12px" }}>
            How it works
          </h2>
          <p style={{ fontFamily: "Lora,serif", fontSize: "16px", color: "#5a4a28", textAlign: "center", marginBottom: "48px" }}>
            Three steps. Thirty seconds of your time.
          </p>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {[
              {
                n: "1",
                title: "Upload your sermon",
                body: "Paste your notes, upload your transcript, or drop in your YouTube link. Takes 30 seconds.",
                icon: "📝",
              },
              {
                n: "2",
                title: "StoryClue builds the recap",
                body: "The AI reads your sermon structure, finds your key points, and builds a crossword puzzle around your exact message. Your words. Your points. Your structure.",
                icon: "⚙️",
              },
              {
                n: "3",
                title: "Send it Sunday afternoon",
                body: "One click sends the puzzle and sermon summary to your entire congregation. Looks like it came from you — because it did.",
                icon: "📨",
              },
            ].map(s => (
              <div key={s.n} className="step-card">
                <div className="step-num">{s.n}</div>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{s.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "18px", color: D, marginBottom: "10px" }}>{s.title}</h3>
                <p style={{ fontFamily: "Lora,serif", fontSize: "14px", color: "#5a4a28", lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT CONGREGATION RECEIVES */}
      <section id="what-they-receive" style={{ padding: "72px 24px", background: "#fff" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "32px", color: D, marginBottom: "12px" }}>
            What your congregation receives
          </h2>
          <p style={{ fontFamily: "Lora,serif", fontSize: "16px", color: "#5a4a28", marginBottom: "36px", lineHeight: 1.7 }}>
            A clean email from their pastor Sunday afternoon containing:
          </p>
          {[
            { icon: "📋", title: "Your sermon title and date", desc: "Clearly attributed. Looks like it came directly from you." },
            { icon: "🎯", title: "Your key points — in your own language", desc: "A structured summary following your exact numbered structure. Not an AI reorganization. Your outline." },
            { icon: "🧩", title: "A crossword puzzle built from your sermon vocabulary", desc: "Every answer word comes from your message. Every clue references what you preached." },
            { icon: "📖", title: "Sneak Peek on every clue", desc: "Each clue has a Sneak Peek button that highlights the exact passage from your sermon containing the answer. Sends them back to your words." },
          ].map(r => (
            <div key={r.title} className="receive-item">
              <div className="receive-icon">{r.icon}</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "16px", color: D, marginBottom: "4px" }}>{r.title}</div>
                <div style={{ fontFamily: "Lora,serif", fontSize: "14px", color: "#5a4a28", lineHeight: 1.7 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY PASTORS USE IT */}
      <section id="why" style={{ padding: "72px 24px", background: P }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "32px", color: D, marginBottom: "12px" }}>
            Why pastors use it
          </h2>
          <p style={{ fontFamily: "Lora,serif", fontSize: "16px", color: "#5a4a28", marginBottom: "32px", lineHeight: 1.75 }}>
            Your congregation heard your message Sunday morning. By Sunday evening most have forgotten the key points.
            StoryClue gives them a reason to revisit your message — not as homework, but as something genuinely enjoyable.
          </p>
          {[
            { label: "The puzzle reinforces your points.", desc: "Every answer word is an anchor from your sermon structure." },
            { label: "The summary brings back what they heard.", desc: "Structured exactly the way you preached it." },
            { label: "The Sneak Peek sends them back to your words.", desc: "For every answer they don't know, they look it up in your sermon." },
            { label: "It is not a test. It is a recap.", desc: "No grades. No pressure. Just engagement with what you preached." },
          ].map(w => (
            <div key={w.label} className="why-item">
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "15px", color: D, marginBottom: "6px" }}>{w.label}</div>
              <div style={{ fontFamily: "Lora,serif", fontSize: "14px", color: "#5a4a28", lineHeight: 1.7 }}>{w.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COST */}
      <section style={{ background: G, padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🙏</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "30px", color: P, marginBottom: "20px" }}>
            Completely free for every pastor
          </h2>
          <p style={{ fontFamily: "Lora,serif", fontSize: "16px", color: "rgba(244,239,228,.88)", lineHeight: 1.8, marginBottom: "36px" }}>
            One sermon puzzle per week. Unlimited congregation members.<br />
            No credit card. No trial period. No catch.<br />
            <strong style={{ color: P }}>We believe in what you do.</strong>
          </p>
          <button className="church-cta" style={{ background: P, color: G, boxShadow: "3px 3px 0 #1a3a08" }}
            onClick={() => navigate("/church/setup")}>
            Set Up Your Church →
          </button>
        </div>
      </section>

      {/* QUIET FOOTER */}
      <footer style={{ background: "#1a3a08", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "Lora,serif", fontSize: "12px", color: "rgba(244,239,228,.5)", lineHeight: 1.7 }}>
          StoryClue.ai also creates grade-adaptive crossword puzzles for Sunday school lessons, homeschool families, and Bible study groups.{" "}
          <span style={{ color: "rgba(244,239,228,.7)", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/")}>Learn more</span>
        </p>
      </footer>
    </div>
  );
}
