import { useNavigate } from "react-router-dom";
import { getDemoUrl } from "../utils/demoData";

const G  = "#2D5A1A";   // forest green
const P  = "#F4EFE4";   // parchment cream
const A  = "#8A7A30";   // antique gold
const D  = "#2c1a08";   // dark text

export default function LandingPage() {
  const navigate = useNavigate();
  const demoUrl  = getDemoUrl("3");

  return (
    <div style={{ background:P, fontFamily:"Georgia,serif", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .cta-btn{display:inline-block;padding:14px 32px;border-radius:5px;font-family:'Playfair Display',serif;font-weight:900;font-size:16px;letter-spacing:.5px;cursor:pointer;border:none;transition:all .2s;text-decoration:none}
        .cta-primary{background:${G};color:${P};box-shadow:3px 3px 0 #1a3a08}
        .cta-primary:hover{background:#4a8a2a;transform:translateY(-2px)}
        .cta-ghost{background:rgba(255,255,255,.12);color:${P};border:2px solid rgba(255,255,255,.5)!important;border-radius:5px;padding:14px 32px;font-family:'Playfair Display',serif;font-weight:900;font-size:16px;cursor:pointer;transition:all .2s}
        .cta-ghost:hover{background:rgba(255,255,255,.22)}
        .step-card{background:#fff;border-radius:8px;padding:28px;flex:1;min-width:200px;border:1px solid #e0d8c8;box-shadow:2px 2px 0 #e0d4a0}
        .feature-card{background:#fff;border-radius:8px;padding:24px 20px;flex:1;min-width:220px;border:1px solid #e0d8c8;border-top:3px solid ${G}}
        .audience-card{background:#fff;border-radius:8px;padding:28px 24px;flex:1;min-width:240px;border:1px solid #e0d8c8}
        .faq-item{border-bottom:1px solid #e0d8c8;padding:18px 0}
        .faq-q{font-family:'Playfair Display',serif;font-weight:700;font-size:16px;color:${D};margin-bottom:8px}
        .faq-a{font-family:Lora,serif;font-size:14px;color:#5a4a28;line-height:1.7}
        nav a{font-family:'Playfair Display',serif;font-weight:700;font-size:13px;color:rgba(240,234,216,.85);text-decoration:none;transition:color .15s}
        nav a:hover{color:#fff}
        h2.section{font-family:'Playfair Display',serif;font-weight:900;font-size:32px;color:${D};margin-bottom:12px;line-height:1.2}
        .section-sub{font-family:Lora,serif;font-size:16px;color:#5a4a28;line-height:1.7;margin-bottom:32px;max-width:600px}
        .pill{display:inline-block;padding:5px 13px;border-radius:20px;font-family:Lora,serif;font-size:12px;margin:3px}
        .pill-green{background:#e8f0d8;color:${G};border:1px solid ${A}}
        .pill-white{background:rgba(255,255,255,.15);color:${P};border:1px solid rgba(255,255,255,.3)}
        .input-mode{display:flex;align-items:flex-start;gap:14px;background:#fff;border-radius:8px;padding:18px 20px;border:1px solid #e0d8c8;margin-bottom:12px}
        .input-mode-icon{font-size:26px;flex-shrink:0;margin-top:2px}
        .faith-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-top:16px}
        .faith-item{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:12px 16px;font-family:Lora,serif;font-size:13px;color:${P};display:flex;align-items:center;gap:10px}
      `}</style>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav style={{ background:G, padding:"14px 24px", display:"flex", alignItems:"center", gap:"20px", position:"sticky", top:0, zIndex:100, borderBottom:"2px solid "+A }}>
        <span style={{ fontSize:"24px" }}>🕷️</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"20px", color:P, flex:1 }}>StoryClue</span>
        <a href="#how-it-works">How It Works</a>
        <a href="#features">Features</a>
        <a href="#who-its-for">Who It's For</a>
        <a href="#faq">FAQ</a>
        <button className="cta-btn" style={{ background:P, color:G, padding:"8px 20px", fontSize:"13px", fontFamily:"'Playfair Display',serif", fontWeight:900, borderRadius:"4px", border:"none", cursor:"pointer" }}
          onClick={() => navigate("/create")}>
          Create Puzzle →
        </button>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ background:`linear-gradient(160deg,${G} 0%,#4a7a22 60%,#3a6018 100%)`, padding:"80px 24px 72px", textAlign:"center" }}>
        <div style={{ maxWidth:"820px", margin:"0 auto" }}>
          <div style={{ fontSize:"56px", marginBottom:"16px" }}>🕷️</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(30px,5vw,52px)", color:P, lineHeight:1.15, marginBottom:"20px" }}>
            AI Crossword Puzzles From Any Book,<br/>Chapter, Website, or Faith Text
          </h1>
          <p style={{ fontFamily:"Lora,serif", fontSize:"clamp(15px,2vw,19px)", color:"#c8e8a8", lineHeight:1.7, marginBottom:"16px", maxWidth:"620px", margin:"0 auto 16px" }}>
            Name a book. Paste text. Drop in a URL. StoryClue builds a crossword puzzle in seconds — with clues written at exactly the right grade level for your student, in English or Spanish.
          </p>
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap", marginBottom:"32px" }}>
            {["Grades K–12 + Reader Mode","Printable Worksheets","8 Faith Traditions","English & Spanish","Spoiler Protection","No Account Needed"].map(t => (
              <span key={t} className="pill pill-white">{t}</span>
            ))}
          </div>
          <div style={{ display:"flex", gap:"14px", justifyContent:"center", flexWrap:"wrap" }}>
            <button className="cta-btn cta-primary" onClick={() => navigate("/create")}>
              ✨ Create a Puzzle Free
            </button>
            <button className="cta-ghost" onClick={() => navigate(demoUrl)}>
              See a Demo Puzzle
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding:"72px 24px", maxWidth:"1000px", margin:"0 auto" }}>
        <h2 className="section" style={{ textAlign:"center" }}>How StoryClue Works</h2>
        <p className="section-sub" style={{ textAlign:"center", margin:"0 auto 40px" }}>
          Three steps. Any source. Any grade. Any tradition.
        </p>
        <div style={{ display:"flex", gap:"20px", flexWrap:"wrap" }}>
          {[
            { n:"1", icon:"📖", title:"Choose Your Source", body:"Name any book or chapter and let Claude fetch the content — or paste your own text — or drop in a URL from any article or website. StoryClue handles all three." },
            { n:"2", icon:"🎓", title:"Set Grade, Language & Tradition", body:"Pick Kindergarten through Reader Mode. Choose English or Spanish. Select your faith tradition from 8 options. StoryClue writes every clue in exactly the right voice for your audience." },
            { n:"3", icon:"⚡", title:"Play, Print, or Share in Seconds", body:"Your interactive crossword appears immediately. Play it on screen with hints, check your answers, print a clean worksheet, or share the puzzle link with anyone." },
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

      {/* ── THREE INPUT MODES ─────────────────────────────────────────────── */}
      <section style={{ background:"#f0ead8", padding:"64px 24px", borderTop:"1px solid #e0d0b0", borderBottom:"1px solid #e0d0b0" }}>
        <div style={{ maxWidth:"760px", margin:"0 auto" }}>
          <h2 className="section" style={{ textAlign:"center" }}>Four Ways to Create a Puzzle</h2>
          <p className="section-sub" style={{ textAlign:"center", margin:"0 auto 32px" }}>
            No matter where your content lives, StoryClue can build a puzzle from it.
          </p>
          <div className="input-mode">
            <div className="input-mode-icon">📚</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"5px" }}>Name a Book or Chapter</div>
              <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7 }}>
                Type any title — <em>Book of Jonah, Charlotte's Web Chapter 1, Romeo and Juliet Act 1, Harry Potter and the Philosopher's Stone Chapter 3</em> — and Claude uses its knowledge to build vocabulary clues. No pasting required.
              </div>
            </div>
          </div>
          <div className="input-mode">
            <div className="input-mode-icon">📋</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"5px" }}>Paste Your Own Text</div>
              <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7 }}>
                Copy and paste any chapter, passage, sermon, lesson plan, or vocabulary list. Works with any text from any source — fiction, non-fiction, religious, academic, or original writing.
              </div>
            </div>
          </div>
          <div className="input-mode">
            <div className="input-mode-icon">🌐</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"5px" }}>Paste a URL</div>
              <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7 }}>
                Drop in any article or web page link. StoryClue fetches the content automatically, strips all the ads and navigation, and builds your puzzle from the readable text. If a site blocks access, we tell you so you can paste the text directly instead.
              </div>
            </div>
          </div>
          <div className="input-mode">
            <div className="input-mode-icon">📄</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"5px" }}>Upload a PDF</div>
              <div style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7 }}>
                Drag and drop any PDF — sermon notes, textbook chapters, articles, worksheets. StoryClue extracts the text entirely in your browser (nothing is sent to a server) and builds a puzzle from it. Works with any text-based PDF.
              </div>
            </div>
          </div>
          <div style={{ textAlign:"center", marginTop:"28px" }}>
            <button className="cta-btn cta-primary" onClick={() => navigate("/create")}>
              Try All Four Modes Free
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────────── */}
      <section id="features" style={{ padding:"72px 24px", maxWidth:"1100px", margin:"0 auto" }}>
        <h2 className="section" style={{ textAlign:"center" }}>Everything StoryClue Can Do</h2>
        <p className="section-sub" style={{ textAlign:"center", margin:"0 auto 40px" }}>
          Built for classrooms, homeschools, faith communities, book clubs, and anyone who loves words.
        </p>
        <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>

          <div className="feature-card">
            <div style={{ fontSize:"30px", marginBottom:"10px" }}>🎓</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"8px" }}>Grades K Through Reader Mode</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#5a4a28", lineHeight:1.7 }}>
              13 grade levels from Kindergarten through 11th–12th and an adult Reader Mode. The same vocabulary, the same grid — clues rewritten in the exact voice for each level.
            </p>
            <div style={{ marginTop:"10px", display:"flex", flexWrap:"wrap", gap:"4px" }}>
              {["K","1st","2nd","3rd","4th","5th","6th","7th","8th","9–10","11–12","Reader"].map(g => (
                <span key={g} className="pill pill-green">{g}</span>
              ))}
            </div>
          </div>

          <div className="feature-card">
            <div style={{ fontSize:"30px", marginBottom:"10px" }}>🌍</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"8px" }}>English & Spanish Puzzles</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#5a4a28", lineHeight:1.7 }}>
              Generate puzzles entirely in Spanish with Claude's built-in validation pass for correct spelling and grammar. Three bilingual modes pair English clues with Spanish answers — or vice versa — for language learning.
            </p>
            <div style={{ marginTop:"10px" }}>
              <span className="pill pill-green">🇺🇸 English</span>
              <span className="pill pill-green">🇪🇸 Spanish</span>
              <span className="pill pill-green">Bilingual Mode</span>
            </div>
          </div>

          <div className="feature-card">
            <div style={{ fontSize:"30px", marginBottom:"10px" }}>✝️</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"8px" }}>8 Faith Traditions</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#5a4a28", lineHeight:1.7 }}>
              Select your tradition and StoryClue tailors the clue language appropriately — Hebrew terms for Jewish content, Quran vocabulary for Islamic, Sanskrit context for Hindu — all in modern plain English. No King James archaic language.
            </p>
            <div style={{ marginTop:"10px", display:"flex", flexWrap:"wrap", gap:"4px" }}>
              {["Protestant","Catholic","Jewish","Islamic","Hindu","Buddhist","Other","Secular"].map(f => (
                <span key={f} className="pill pill-green">{f}</span>
              ))}
            </div>
          </div>

          <div className="feature-card">
            <div style={{ fontSize:"30px", marginBottom:"10px" }}>📚</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"8px" }}>Series Mode — Spoiler Protection</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#5a4a28", lineHeight:1.7 }}>
              Check off which books in a series you've read. StoryClue will never reference events, deaths, or plot points from books — or chapters — you haven't reached yet. Works with Harry Potter, Narnia, Reacher, Wimpy Kid, and more.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ fontSize:"30px", marginBottom:"10px" }}>💡</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"8px" }}>Hints — Two Types</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#5a4a28", lineHeight:1.7 }}>
              Stuck? Each puzzle includes 3 hints. Choose <strong>Simpler Clue</strong> to rewrite the clue in plainer language, or <strong>Reveal a Letter</strong> to uncover the first empty letter in your selected word. No more throwing the puzzle down in frustration.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ fontSize:"30px", marginBottom:"10px" }}>🖨️</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"8px" }}>Print-Ready Worksheets</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#5a4a28", lineHeight:1.7 }}>
              Every puzzle generates a clean printable worksheet — full grid, two-column clue layout, and Name / Grade / Date fields for classroom use. No reformatting needed. Just click Print.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ fontSize:"30px", marginBottom:"10px" }}>🔗</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"8px" }}>Share Any Puzzle</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#5a4a28", lineHeight:1.7 }}>
              Every puzzle gets a unique shareable link. Send it to students, co-op families, or book club members. No account required on either end — just click and play.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ fontSize:"30px", marginBottom:"10px" }}>✅</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"16px", color:D, marginBottom:"8px" }}>Clue Validation Built In</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#5a4a28", lineHeight:1.7 }}>
              Before your puzzle renders, Claude reviews every word-clue pair to confirm each clue accurately describes its exact answer word. A clue for SHEPHERD will always be about a shepherd — never about a whale.
            </p>
          </div>

        </div>
      </section>


      {/* ── WHO IT'S FOR ──────────────────────────────────────────────────── */}
      <section id="who-its-for" style={{ padding:"72px 24px", maxWidth:"1100px", margin:"0 auto" }}>
        <h2 className="section" style={{ textAlign:"center" }}>Built for Everyone Who Loves Books</h2>
        <p className="section-sub" style={{ textAlign:"center", margin:"0 auto 40px" }}>
          StoryClue was designed for the people who teach with books, read with faith, and learn with curiosity.
        </p>
        <div style={{ display:"flex", gap:"20px", flexWrap:"wrap" }}>

          <div className="audience-card">
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>🏠</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"19px", color:D, marginBottom:"10px" }}>Homeschool Families</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7, marginBottom:"12px" }}>
              Turn any curriculum chapter into a vocabulary crossword in seconds — no prep time, no subscription needed. Works with any homeschool curriculum, including faith-based programs.
            </p>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#7a6a40", fontStyle:"italic" }}>
              Especially loved by Christian, Catholic, and Jewish homeschool co-ops who share tools virally through curriculum networks.
            </p>
          </div>

          <div className="audience-card">
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>✏️</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"19px", color:D, marginBottom:"10px" }}>Classroom Teachers</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7, marginBottom:"12px" }}>
              Generate a print-ready vocabulary worksheet on the fly. Paste the chapter, pick a grade level, print. No more spending Sunday night hand-crafting crosswords for Monday's class.
            </p>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#7a6a40", fontStyle:"italic" }}>
              Works for English, history, science, literature, social studies — any subject with a text.
            </p>
          </div>

          <div className="audience-card">
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>✝️</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"19px", color:D, marginBottom:"10px" }}>Faith Communities</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7, marginBottom:"12px" }}>
              Bible study groups, Torah portion classes, Quran study circles, Sunday school, and youth groups. StoryClue creates tradition-aware crosswords in modern plain language that works for any translation.
            </p>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#7a6a40", fontStyle:"italic" }}>
              Just name the passage — Book of Jonah, Genesis Chapter 1, Psalm 23 — and StoryClue does the rest.
            </p>
          </div>

          <div className="audience-card">
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>📖</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"19px", color:D, marginBottom:"10px" }}>Book Clubs & Seniors</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7, marginBottom:"12px" }}>
              A puzzle built from the exact book you're reading — not a generic word game. Create a recall exercise from the chapter you just finished. Beloved by book clubs, memory care, and occupational therapists.
            </p>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#7a6a40", fontStyle:"italic" }}>
              Carole, 84-year-old research librarian, treated the first StoryClue puzzle as a cognitive recall exercise without being asked.
            </p>
          </div>

          <div className="audience-card">
            <div style={{ fontSize:"36px", marginBottom:"12px" }}>🇪🇸</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"19px", color:D, marginBottom:"10px" }}>Spanish Language Learners</h3>
            <p style={{ fontFamily:"Lora,serif", fontSize:"14px", color:"#5a4a28", lineHeight:1.7, marginBottom:"12px" }}>
              Generate full Spanish puzzles for native speakers, or use Bilingual Mode to pair English clues with Spanish answers — a powerful vocabulary building tool for language classes at any grade level.
            </p>
            <p style={{ fontFamily:"Lora,serif", fontSize:"13px", color:"#7a6a40", fontStyle:"italic" }}>
              Claude validates Spanish spelling and grammar before rendering. A disclaimer recommends fluent speaker review for classroom use.
            </p>
          </div>

        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding:"72px 24px", maxWidth:"780px", margin:"0 auto" }}>
        <h2 className="section" style={{ textAlign:"center" }}>Frequently Asked Questions</h2>
        <p className="section-sub" style={{ textAlign:"center", margin:"0 auto 36px" }}>
          Everything you need to know about StoryClue's AI crossword puzzle generator.
        </p>
        {[
          { q:"How do I make a crossword puzzle from a book chapter?", a:"Three ways: type the book title and chapter name, paste the chapter text directly, or paste a URL from any website. Claude AI extracts vocabulary words and writes grade-appropriate clues. Your crossword is ready in about 10 seconds." },
          { q:"What grade levels are supported?", a:"StoryClue supports Kindergarten through 12th grade, plus an adult Reader Mode for book clubs and seniors. Every grade has its own clue voice — Kindergarten clues are simple picture-clue sentences; 11th–12th grade clues use AP-level analytical language." },
          { q:"Can I create crossword puzzles in Spanish?", a:"Yes. Select Spanish under the Language setting and Claude generates all vocabulary and clues in Spanish with a built-in spelling and grammar validation pass. You can also use Bilingual Mode to pair English clues with Spanish answer words, or Spanish clues with English answers — perfect for language learning." },
          { q:"What faith traditions are supported?", a:"StoryClue supports eight faith traditions: Christian (Protestant), Christian (Catholic), Jewish, Islamic, Hindu, Buddhist, Other Faith Tradition, and None/Secular. Each tradition gets tailored clue language in modern plain English — never archaic King James or scripture-specific phrasing." },
          { q:"How do I create a Bible crossword puzzle?", a:"Just type the passage name — Book of Jonah, Genesis Chapter 1, Psalm 23 — and select your faith tradition. StoryClue writes clues in modern everyday English that works with any Bible translation. No pasting required." },
          { q:"What is the Hint system?", a:"Each puzzle starts with 3 hints. You can use a Simpler Clue hint, which rewrites the current clue in plainer, more accessible language, or a Reveal a Letter hint, which shows the first empty letter in your selected word. Hints help without giving away the whole answer." },
          { q:"Can I print a crossword puzzle I made online?", a:"Yes. Every StoryClue puzzle includes a Print button that generates a clean black-and-white worksheet with Name, Grade, and Date fields at the top, the full grid, and two-column clue lists — ready for classroom or home use." },
          { q:"How does Series Mode spoiler protection work?", a:"Select a book series and check off which books you've read. StoryClue passes your reading history to Claude with strict instructions never to reference plot points, characters, or events from books you haven't read. New: you can also enter your current chapter number for chapter-level protection within a single book." },
          { q:"Can I make a crossword puzzle for free?", a:"Yes. StoryClue lets you create and play crossword puzzles at no cost. No account required to get started." },
          { q:"What is the best AI crossword puzzle maker for homeschool?", a:"StoryClue was built with homeschool families in mind. It supports any curriculum, works with faith-based texts, generates print-ready worksheets, adapts clues to any grade level from K through 12, and includes Series Mode for families reading book series together." },
        ].map(({ q, a }) => (
          <div key={q} className="faq-item">
            <div className="faq-q">{q}</div>
            <div className="faq-a">{a}</div>
          </div>
        ))}
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{ background:G, padding:"64px 24px", textAlign:"center" }}>
        <div style={{ fontSize:"40px", marginBottom:"14px" }}>🌟</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"30px", color:P, marginBottom:"14px" }}>
          Your First Puzzle Takes 30 Seconds
        </h2>
        <p style={{ fontFamily:"Lora,serif", fontSize:"16px", color:"#c8e8a8", marginBottom:"28px", maxWidth:"500px", margin:"0 auto 28px" }}>
          No account. No credit card. Name a book, paste a chapter, or drop in a URL — and get a crossword puzzle your readers will actually want to solve.
        </p>
        <button className="cta-btn cta-primary" style={{ fontSize:"18px", padding:"16px 40px" }} onClick={() => navigate("/create")}>
          Create a Free Puzzle Now
        </button>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
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
