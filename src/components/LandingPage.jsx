import { useNavigate } from "react-router-dom";
import { getDemoUrl } from "../utils/demoData";

const G = "#2D5A1A";   // forest green
const P = "#F4EFE4";   // parchment cream
const A = "#8A7A30";   // antique gold
const D = "#2c1a08";   // dark text

export default function LandingPage() {
  const navigate = useNavigate();
  const demoUrl = getDemoUrl("3");

  return (
    <div style={{ background:P, fontFamily:"Georgia,serif", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .cta-btn{display:inline-block;padding:14px 32px;border-radius:5px;font-family:'Playfair Display',serif;font-weight:900;font-size:16px;letter-spacing:.5px;cursor:pointer;border:none;transition:all .2s;text-decoration:none}
        .cta-primary{background:${G};color:${P};box-shadow:3px 3px 0 #1a3a08}
        .cta-primary:hover{background:#4a8a2a;transform:translateY(-2px)}
        .cta-secondary{background:transparent;color:${G};border:2px solid ${G}!important;border:none}
        .cta-secondary:hover{background:rgba(45,90,26,.08)}
        .step-card{background:#fff;border-radius:8px;padding:28px;flex:1;min-width:200px;border:1px solid #e0d8c8;box-shadow:2px 2px 0 #e0d4a0}
        .audience-card{background:#fff;border-radius:8px;padding:28px 24px;flex:1;min-width:240px;border:1px solid #e0d8c8}
        .faq-item{border-bottom:1px solid #e0d8c8;padding:18px 0}
        .faq-q{font-family:'Playfair Display',serif;font-weight:700;font-size:16px;color:${D};margin-bottom:8px}
        .faq-a{font-family:Lora,serif;font-size:14px;color:#5a4a28;line-height:1.7}
        nav a{font-family:'Playfair Display',serif;font-weight:700;font-size:13px;color:rgba(240,234,216,.85);text-decoration:none;transition:color .15s}
        nav a:hover{color:#fff}
        h2.section{font-family:'Playfair Display',serif;font-weight:900;font-size:32px;color:${D};margin-bottom:12px;line-height:1.2}
        .section-sub{font-family:Lora,serif;font-size:16px;color:#5a4a28;line-height:1.7;margin-bottom:32px;max-width:600px}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background:G, padding:"14px 24px", display:"flex", alignItems:"center", gap:"20px", position:"sticky", top:0, zIndex:100, borderBottom:"2px solid "+A }}>
        <span style={{ fontSize:"24px" }}>🕷️</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:P, flex:1 }}>StoryClue</span>
        <a href="#how-it-works">How It Works</a>
        <a href="#who-its-for">Who It's For</a>
        <a href="#faq">FAQ</a>
        <button className="cta-btn" style={{ background:P, color:G, padding:"8px 20px", fontSize:"13px", fontFamily:"'Playfair Display',serif", fontWeight:900, borderRadius:"4px", border:"none", cursor:"pointer" }}
          onClick={() => navigate("/create")}>
          Create Puzzle →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background:`linear-gradient(160deg,${G} 0%,#4a7a22 60%,#3a6018 100%)`, padding:"80px 24px 72px", textAlign:"center" }}>
        <div style={{ maxWidth:"780px", margin:"0 auto" }}>
          <div style={{ fontSize:"56px", marginBottom:"16px" }}>🕷️</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(32px,5vw,52px)", color:P, lineHeight:1.15, marginBottom:"20px" }}>
            The AI Crossword Puzzle Maker<br/>That Reads Your Chapter
          </h1>
          <p style={{ fontFamily:"Lora,serif", fontSize:"clamp(16px,2vw,20px)", color:"#c8e8a8", lineHeight:1.7, marginBottom:"36px", maxWidth:"580px", margin:"0 auto 36px" }}>
            Paste any chapter. Select a grade level. Get a crossword puzzle in seconds — with clues written at exactly the right reading level.
          </p>
          <div style={{ display:"flex", gap:"14px", justifyContent:"center", flexWrap:"wrap" }}>
            <button className="cta-btn cta-primary" onClick={() => navigate("/create")}>
              ✨ Create a Puzzle Free
            </button>
            <button className="cta-btn cta-secondary"
              style={{ background:"rgba(255,255,255,.12)", color:P, border:"2px solid rgba(255,255,255,.5)", borderRadius:"5px", padding:"14px 32px", fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"16px", cursor:"pointer" }}
              onClick={() => navigate(demoUrl)}>
              See a Demo Puzzle
            </button>
          </div>
          <p style={{ fontFamily:"Lora,serif", fontSize:"12px", color:"rgba(200,232,168,.7)", marginTop:"16px", fontStyle:"italic" }}>
            No account required · Grades K–6 · Printable worksheets · Bible crosswords
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding:"72px 24px", maxWidth:"1000px", margin:"0 auto" }}>
        <h2 className="section" style={{ textAlign:"center" }}>How to Make a Crossword Puzzle with StoryClue</h2>
        <p className="section-sub" style={{ textAlign:"center", margin:"0 auto 40px" }}>
          Three steps. Any chapter. Any grade. Any book.
        </p>
        <div style={{ display:"flex", gap:"20px", flexWrap:"wrap" }}>
          {[
            { n:"1", icon:"📋", title:"Paste Your Chapter Text", body:"Copy and paste any chapter, passage, or vocabulary list. Works with any book — fiction, non-fiction, religious texts, or your own writing. No special format required." },
            { n:"2", icon:"🎓", title:"Select a Grade Level for Your Crossword Puzzle", body:"Choose Kindergarten through 6th grade. StoryClue rewrites every clue in language appropriate for that reading level. Same words, same grid — just the right vocabulary for your student." },
            { n:"3", icon:"⚡", title:"Get Your Printable Crossword in Seconds", body:"Claude AI extracts vocabulary and writes grade-perfect clues. Your crossword appears immediately — interactive on screen or print-ready as a worksheet." },
          ].map(s => (
            <div key={s.n} className="step-card">
              <div style={{ width:"44px", height:"44px", background:G, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:P, marginBottom:"14px" }}>{s.n}</div>
              <div style={{ fontSize:"28px", marginBottom:"10px" }}>{s.icon}</div>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"17px", color:D, marginBottom:"10px", lineHeight:1.3 }}>{s.title}</h3>
              <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GRADE ADAPTER CALLOUT ── */}
      <section style={{ background:G, padding:"56px 24px" }}>
        <div style={{ maxWidth:"800px", margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:"36px", marginBottom:"12px" }}>🎓</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"28px", color:P, marginBottom:"14px" }}>
            Grade-Level Clue Adapter — K Through 6th
          </h2>
          <p style={{ fontFamily:"Lora,serif", fontSize:"16px", color:"#c8e8a8", lineHeight:1.7, marginBottom:"28px", maxWidth:"620px", margin:"0 auto 28px" }}>
            No other crossword maker does this. The same vocabulary words. The same grid. But the clue language changes for each grade level — from simple picture-clue sentences for Kindergarten to analytical literary descriptions for 6th grade.
          </p>
          <div style={{ display:"flex", gap:"10px", justifyContent:"center", flexWrap:"wrap", marginBottom:"28px" }}>
            {["Kindergarten","1st Grade","2nd Grade","3rd Grade","4th Grade","5th Grade","6th Grade"].map(g => (
              <span key={g} style={{ background:"rgba(255,255,255,.15)", color:P, padding:"6px 14px", borderRadius:"20px", fontFamily:"Lora,serif", fontSize:"13px", border:"1px solid rgba(255,255,255,.3)" }}>{g}</span>
            ))}
          </div>
          <button className="cta-btn" style={{ background:P, color:G, padding:"12px 28px" }} onClick={() => navigate("/create")}>
            Try Grade-Adaptive Clues Free
          </button>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section id="who-its-for" style={{ padding:"72px 24px", maxWidth:"1100px", margin:"0 auto" }}>
        <h2 className="section" style={{ textAlign:"center" }}>Perfect for Homeschool, Classroom, and Beyond</h2>
        <p className="section-sub" style={{ textAlign:"center", margin:"0 auto 40px" }}>
          StoryClue was built for the people who love books and the people who teach with them.
        </p>
        <div style={{ display:"flex", gap:"20px", flexWrap:"wrap" }}>

          <div className="audience-card">
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>🏠</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"19px", color:D, marginBottom:"10px" }}>Homeschool Crossword Puzzle Maker</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7, marginBottom:"12px" }}>
              3.3 million homeschool families in the US. StoryClue turns any curriculum chapter into a vocabulary crossword in seconds — no prep time, no subscription needed to start.
            </p>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#7a6a40", fontStyle:"italic" }}>
              Especially loved by Christian, Catholic, and Jewish homeschool co-ops who share tools virally through curriculum networks.
            </p>
          </div>

          <div className="audience-card">
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>✏️</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"19px", color:D, marginBottom:"10px" }}>Crossword Puzzle Maker for Teachers</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7, marginBottom:"12px" }}>
              Generate a print-ready vocabulary worksheet on the fly. No more spending Sunday night hand-crafting crosswords. Paste the chapter, pick a grade, print.
            </p>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#7a6a40", fontStyle:"italic" }}>
              Used by teachers on Teachers Pay Teachers who need fast, professional crossword worksheets for any reading level.
            </p>
          </div>

          <div className="audience-card">
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>✝️</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"19px", color:D, marginBottom:"10px" }}>Bible Crossword Puzzle Maker</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7, marginBottom:"12px" }}>
              Bible chapter vocabulary, Torah portion study, and Catholic saints — StoryClue creates faith-appropriate crosswords with respectful, tradition-aware clues. King James Version is public domain and fully supported.
            </p>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#7a6a40", fontStyle:"italic" }}>
              David and Goliath, Genesis, Noah, Exodus, and more — paste any passage from the KJV.
            </p>
          </div>

          <div className="audience-card">
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>📖</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"19px", color:D, marginBottom:"10px" }}>Crossword Puzzles for Seniors</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7, marginBottom:"12px" }}>
              A puzzle built from the book you're currently reading. Not a generic brain-training app — a recall exercise drawn from vocabulary you just encountered. Beloved by book clubs, memory care, and occupational therapists.
            </p>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#7a6a40", fontStyle:"italic" }}>
              Carole, 84-year-old research librarian, tested the first StoryClue puzzle and treated it as a cognitive recall exercise without being asked.
            </p>
          </div>

        </div>
      </section>

      {/* ── SERIES MODE ── */}
      <section style={{ background:"#f0ead8", padding:"56px 24px", borderTop:"1px solid #e0d0b0", borderBottom:"1px solid #e0d0b0" }}>
        <div style={{ maxWidth:"720px", margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:"36px", marginBottom:"12px" }}>📚</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"26px", color:D, marginBottom:"12px" }}>
            Series Mode — Spoiler-Safe Puzzles
          </h2>
          <p style={{ fontFamily:"Lora,serif", fontSize:"15px", color:"#5a4a28", lineHeight:1.7, marginBottom:"20px" }}>
            Harry Potter, Jack Reacher, Diary of a Wimpy Kid, The Chronicles of Narnia — check off which books you've read. StoryClue will <em>never</em> reference events from books you haven't reached yet.
          </p>
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap", marginBottom:"24px" }}>
            {["Harry Potter","Jack Reacher","Charlotte's Web","Wimpy Kid","Narnia","The Bible","Nancy Drew"].map(s => (
              <span key={s} style={{ background:"#e8f0d8", color:G, padding:"5px 12px", borderRadius:"20px", fontFamily:"Lora,serif", fontSize:"12px", border:`1px solid ${A}` }}>{s}</span>
            ))}
          </div>
          <button className="cta-btn cta-primary" onClick={() => navigate("/create")}>
            Try Series Mode
          </button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding:"72px 24px", maxWidth:"780px", margin:"0 auto" }}>
        <h2 className="section" style={{ textAlign:"center" }}>Frequently Asked Questions</h2>
        <p className="section-sub" style={{ textAlign:"center", margin:"0 auto 36px" }}>
          Everything you need to know about StoryClue's AI crossword puzzle generator.
        </p>
        {[
          { q:"How do I make a crossword puzzle from a book chapter?", a:"Paste the chapter text into StoryClue, choose your grade level, and click Generate. Claude AI extracts vocabulary words from your chapter and writes grade-appropriate clues. Your crossword is ready in about 10 seconds." },
          { q:"What is the best AI crossword puzzle maker for teachers?", a:"StoryClue is built specifically for educational use. It generates grade-adapted clues (K–6), produces print-ready worksheets, and works from any text — making it the fastest crossword worksheet tool available." },
          { q:"Can I make a crossword puzzle for free?", a:"Yes. StoryClue lets you create and play crossword puzzles at no cost. No account required to get started." },
          { q:"How do I create a homeschool crossword puzzle?", a:"Paste any chapter from your curriculum — history, science, literature, Bible study — and StoryClue builds a crossword with clues written at your child's grade level. Works with any homeschool curriculum." },
          { q:"How do I make a Bible crossword puzzle?", a:"Paste any passage from the King James Bible (public domain) into StoryClue. Select a grade level. Enable the Christian, Catholic, or Jewish tradition setting for faith-appropriate clues. StoryClue will never reproduce full scripture passages — it extracts vocabulary only." },
          { q:"Can I print a crossword puzzle I made online?", a:"Yes. Every StoryClue puzzle includes a Print button that generates a clean black-and-white worksheet with Name, Grade, and Date fields — ready for classroom or home use." },
          { q:"How do I make a crossword puzzle for seniors?", a:"Paste a chapter from the book your senior is currently reading, choose the appropriate difficulty level, and generate the puzzle. StoryClue creates vocabulary recall exercises that feel like a puzzle about a book, not a brain training app." },
          { q:"What is the best crossword puzzle maker for kids?", a:"StoryClue is designed for K–6 with grade-level clue language. Kindergarten clues use simple picture-clue sentences. 6th grade clues use analytical literary descriptions. The same puzzle adapts to the child — not the other way around." },
          { q:"Does StoryClue work with spoiler protection for book series?", a:"Yes. Series Mode lets you check off which books in a series you've read. StoryClue's AI will only use vocabulary and references from those books — it never spoils plot points from books you haven't finished." },
        ].map(({ q, a }) => (
          <div key={q} className="faq-item">
            <div className="faq-q">{q}</div>
            <div className="faq-a">{a}</div>
          </div>
        ))}
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background:G, padding:"64px 24px", textAlign:"center" }}>
        <div style={{ fontSize:"40px", marginBottom:"14px" }}>🌟</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"30px", color:P, marginBottom:"14px" }}>
          Your First Puzzle Takes 30 Seconds
        </h2>
        <p style={{ fontFamily:"Lora,serif", fontSize:"16px", color:"#c8e8a8", marginBottom:"28px", maxWidth:"500px", margin:"0 auto 28px" }}>
          No account. No credit card. Paste any chapter and get a crossword puzzle your students will actually want to solve.
        </p>
        <button className="cta-btn cta-primary" style={{ fontSize:"18px", padding:"16px 40px" }} onClick={() => navigate("/create")}>
          Create a Free Puzzle Now
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"#1a2e0a", padding:"28px 24px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"18px", color:P, marginBottom:"8px" }}>
          🕷️ StoryClue
        </div>
        <div style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"rgba(240,234,216,.6)", marginBottom:"12px", fontStyle:"italic" }}>
          AI Generated Crossword Puzzle Maker · StoryClue.ai
        </div>
        <div style={{ display:"flex", gap:"20px", justifyContent:"center", flexWrap:"wrap" }}>
          {[
            ["Create a Puzzle", "/create"],
            ["Charlotte's Web Demo", demoUrl],
          ].map(([label, href]) => (
            <button key={label}
              onClick={() => navigate(href)}
              style={{ background:"none", border:"none", color:"rgba(200,232,168,.7)", fontFamily:"Lora,serif", fontSize:"12px", cursor:"pointer", textDecoration:"underline" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ fontFamily:"Lora,serif", fontSize:"11px", color:"rgba(240,234,216,.3)", marginTop:"16px" }}>
          Built in Duck Key, Florida · May 2026 · StoryClue.ai
        </div>
      </footer>
    </div>
  );
}
