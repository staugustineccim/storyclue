import { useState, useRef, useEffect } from "react";

const WORD_DATA = [
  { word: "WILBUR",        dir: "across", row: 9,  col: 0,  clue: "The runt pig Fern saves from being killed" },
  { word: "FERN",          dir: "down",   row: 8,  col: 9,  clue: "The brave 8-year-old girl who rescues the pig" },
  { word: "RUNT",          dir: "down",   row: 8,  col: 4,  clue: "The smallest, weakest animal in a litter" },
  { word: "INJUSTICE",     dir: "across", row: 10, col: 14, clue: "Fern says killing a small pig because of its size is this" },
  { word: "AVERY",         dir: "across", row: 9,  col: 7,  clue: "Fern's older brother who also wants a pig" },
  { word: "LITTER",        dir: "down",   row: 10, col: 12, clue: "A group of baby animals born at the same time" },
  { word: "BOTTLE",        dir: "across", row: 6,  col: 6,  clue: "Fern fed baby Wilbur from one of these" },
  { word: "BARN",          dir: "across", row: 13, col: 5,  clue: "The farm building where animals live" },
  { word: "APPETITE",      dir: "down",   row: 0,  col: 8,  clue: "Wilbur had a good one — he loved to eat" },
  { word: "AX",            dir: "down",   row: 11, col: 10, clue: "The sharp tool Mr. Arable was carrying" },
  { word: "ARABLE",        dir: "down",   row: 13, col: 6,  clue: "Fern's family last name" },
  { word: "BREAKFAST",     dir: "across", row: 15, col: 0,  clue: "The meal being prepared when Fern sees her father" },
  { word: "SOAKING",       dir: "down",   row: 6,  col: 14, clue: "The wet condition of the early morning ground" },
  { word: "PIGPEN",        dir: "across", row: 18, col: 2,  clue: "The enclosure where the pigs are kept on the farm" },
  { word: "DETERMINATION", dir: "across", row: 11, col: 2,  clue: "Fern showed great ____ in saving Wilbur" },
  { word: "JEALOUS",       dir: "across", row: 20, col: 5,  clue: "How Avery felt when Fern got a pet pig" },
  { word: "FARMER",        dir: "down",   row: 8,  col: 7,  clue: "What Mr. Arable is — he works the land" },
  { word: "SPRING",        dir: "across", row: 15, col: 10, clue: "The season when the story begins — new life everywhere" },
  { word: "MERCY",         dir: "down",   row: 5,  col: 11, clue: "What Fern begged her father to show the runt pig" },
  { word: "PROMISE",       dir: "down",   row: 15, col: 11, clue: "Mr. Arable made Fern this — she must care for Wilbur" },
];

const GRADE_CLUES = {
  "2": [
    "The little pink pig Fern saves",
    "The girl who saves the baby pig",
    "The tiniest, weakest baby pig",
    "Fern says this is happening when something is not fair",
    "Fern's big brother",
    "All the baby animals born together",
    "Fern fed Wilbur from one of these",
    "Where the animals live on the farm",
    "Wilbur loves to eat — he has a big one",
    "The sharp tool daddy was carrying",
    "Fern's family last name",
    "The morning meal Fern's mom was making",
    "Very wet — like the grass in the morning",
    "Where the pigs live outside",
    "Fern really wanted to save Wilbur — she had ____",
    "How Avery felt — he wanted a pig too",
    "Someone who grows food and raises animals",
    "The season with baby animals and new flowers",
    "Fern asked her dad to be kind — to show ____",
    "Daddy made Fern a ____ — she had to feed Wilbur herself",
  ],
  "3": [
    "The runt pig Fern saves from being killed",
    "The brave 8-year-old girl who rescues the pig",
    "The smallest, weakest animal in a litter",
    "Fern says killing a small pig because of its size is this",
    "Fern's older brother who also wants a pig",
    "A group of baby animals born at the same time",
    "Fern fed baby Wilbur from one of these",
    "The farm building where animals live",
    "Wilbur had a good one — he loved to eat",
    "The sharp tool Mr. Arable was carrying",
    "Fern's family last name",
    "The meal being prepared when Fern sees her father",
    "The wet condition of the early morning ground",
    "The enclosure where the pigs are kept on the farm",
    "Fern showed great ____ in saving Wilbur",
    "How Avery felt when Fern got a pet pig",
    "What Mr. Arable is — he works the land",
    "The season when the story begins — new life everywhere",
    "What Fern begged her father to show the runt pig",
    "Mr. Arable made Fern this — she must care for Wilbur",
  ],
  "4": [
    "The undersized piglet whose survival depends on Fern's intervention",
    "The determined young girl whose sense of justice drives the story",
    "The smallest and weakest offspring in a litter, often at risk",
    "Treating someone unfairly because of their size or weakness",
    "Fern's older brother whose jealousy adds tension at breakfast",
    "The collective birth group from which Wilbur emerged as the weakest",
    "The feeding tool Fern used to nurse Wilbur at the breakfast table",
    "The farm structure that becomes Wilbur's permanent home",
    "The vigorous hunger that proved Wilbur could thrive despite his size",
    "The implement Mr. Arable carried to end the runt's life",
    "The family surname — also means land fit for growing crops",
    "The morning meal interrupted by Fern's moral stand",
    "The wet early-morning condition that greeted Fern outside",
    "The outdoor enclosure where farm pigs are kept",
    "The fierce resolve Fern showed in protecting a helpless animal",
    "The emotion Avery displayed when Fern received special treatment",
    "What Mr. Arable is by trade — he cultivates the land",
    "The season of new beginnings in which the story opens",
    "The compassion Fern pleaded for on behalf of the runt",
    "The commitment Mr. Arable extracted from Fern before surrendering Wilbur",
  ],
  "5": [
    "The vulnerable runt whose survival Fern fights to ensure",
    "The protagonist whose moral conviction saves an innocent life",
    "Term for the smallest, weakest offspring in an animal litter",
    "The absence of fairness — what Fern accuses her father of",
    "The sibling whose opportunistic jealousy contrasts with Fern's principled stand",
    "The collective group of animals born to one mother at one time",
    "The instrument of nurture Fern employed to sustain the fragile piglet",
    "The pastoral structure central to the story's primary setting",
    "The strong desire for food that signaled Wilbur's will to survive",
    "The instrument whose appearance sets the moral conflict in motion",
    "The family name that doubles as a word for arable farmland",
    "The morning meal whose routine is shattered by Fern's moral outrage",
    "The saturated morning conditions that frame the story's dramatic opening",
    "The outdoor enclosure symbolic of Wilbur's vulnerable early existence",
    "The unwavering resolve Fern demonstrates in confronting her father's authority",
    "The resentful emotion Avery harbors toward Fern's privileged treatment",
    "The agricultural identity of Mr. Arable — one who cultivates land",
    "The season of renewal and new life in which the narrative begins",
    "The compassion and leniency Fern implores her father to extend",
    "The binding commitment Mr. Arable extracts before relinquishing the piglet",
  ],
};

const GRADES = [
  { key: "2", label: "2nd Grade" },
  { key: "3", label: "3rd Grade" },
  { key: "4", label: "4th Grade" },
  { key: "5", label: "5th Grade" },
];

const ROWS = 22;
const COLS = 23;

function buildGrid() {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  WORD_DATA.forEach(({ word, dir, row, col }) => {
    for (let i = 0; i < word.length; i++) {
      if (dir === "across" && col + i < COLS) g[row][col + i] = word[i];
      else if (dir === "down" && row + i < ROWS) g[row + i][col] = word[i];
    }
  });
  return g;
}

function buildNums(grid) {
  const nums = {};
  let n = 1;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c]) continue;
      const isA = (c === 0 || !grid[r][c - 1]) && c + 1 < COLS && grid[r][c + 1];
      const isD = (r === 0 || !grid[r - 1]?.[c]) && r + 1 < ROWS && grid[r + 1]?.[c];
      if (isA || isD) nums[`${r},${c}`] = n++;
    }
  }
  return nums;
}

const SOLUTION = buildGrid();
const NUMBERING = buildNums(SOLUTION);

function getNumbered(grade) {
  const clues = GRADE_CLUES[grade];
  return WORD_DATA.map((w, i) => ({
    ...w, clue: clues[i],
    number: NUMBERING[`${w.row},${w.col}`] || 0,
  }));
}

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function App() {
  const [grade, setGrade] = useState("3");
  const [cells, setCells] = useState(() => Array.from({ length: ROWS }, () => Array(COLS).fill("")));
  const [sel, setSel] = useState(null);
  const [activeWord, setActiveWord] = useState(null);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [won, setWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [clueTab, setClueTab] = useState("across");
  const [shareMsg, setShareMsg] = useState("");
  const refs = useRef({});
  const timerRef = useRef(null);
  const activeClueRef = useRef(null);

  const numbered = getNumbered(grade);
  const ACROSS = numbered.filter(w => w.dir === "across").sort((a, b) => a.number - b.number);
  const DOWN   = numbered.filter(w => w.dir === "down").sort((a, b) => a.number - b.number);

  // Timer
  useEffect(() => {
    if (timerActive && !won) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerActive, won]);

  // Scroll active clue into view
  useEffect(() => {
    activeClueRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeWord]);

  function wordAt(r, c, prefDir) {
    const hits = numbered.filter(w =>
      w.dir === "across"
        ? w.row === r && c >= w.col && c < w.col + w.word.length
        : w.col === c && r >= w.row && r < w.row + w.word.length
    );
    if (!hits.length) return null;
    if (hits.length === 1) return hits[0];
    return hits.find(h => h.dir === prefDir) || hits[0];
  }

  function focus(r, c) { refs.current[`${r},${c}`]?.focus(); }

  function clickCell(r, c) {
    if (!SOLUTION[r][c]) return;
    if (!timerActive) setTimerActive(true);
    if (sel?.r === r && sel?.c === c && activeWord) {
      const other = numbered.find(w => w !== activeWord && (
        w.dir === "across"
          ? w.row === r && c >= w.col && c < w.col + w.word.length
          : w.col === c && r >= w.row && r < w.row + w.word.length
      ));
      if (other) { setActiveWord(other); setClueTab(other.dir); }
    } else {
      setSel({ r, c });
      const w = wordAt(r, c, activeWord?.dir || "across");
      setActiveWord(w);
      if (w) setClueTab(w.dir);
    }
    focus(r, c);
  }

  function keyDown(r, c, e) {
    if (!timerActive) setTimerActive(true);
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = cells.map(row => [...row]);
      if (next[r][c]) { next[r][c] = ""; setCells(next); setChecked(false); }
      else if (activeWord) {
        const nr = r + (activeWord.dir === "down" ? -1 : 0);
        const nc = c + (activeWord.dir === "across" ? -1 : 0);
        if (SOLUTION[nr]?.[nc]) { setSel({ r: nr, c: nc }); focus(nr, nc); }
      }
      return;
    }
    const arrows = { ArrowRight:[0,1,"across"], ArrowLeft:[0,-1,"across"], ArrowDown:[1,0,"down"], ArrowUp:[-1,0,"down"] };
    if (arrows[e.key]) {
      e.preventDefault();
      const [dr, dc, d] = arrows[e.key];
      const nr = r+dr, nc = c+dc;
      if (SOLUTION[nr]?.[nc]) { setSel({r:nr,c:nc}); setActiveWord(wordAt(nr,nc,d)); focus(nr,nc); }
      return;
    }
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      const next = cells.map(row => [...row]);
      if (next[r][c] && next[r][c] !== letter) setMistakes(m => m + 1);
      next[r][c] = letter;
      setCells(next); setChecked(false);
      if (activeWord) {
        const nr = r + (activeWord.dir === "down" ? 1 : 0);
        const nc = c + (activeWord.dir === "across" ? 1 : 0);
        if (SOLUTION[nr]?.[nc]) { setSel({r:nr,c:nc}); setActiveWord(wordAt(nr,nc,activeWord.dir)); focus(nr,nc); }
      }
    }
  }

  function check() {
    setChecked(true);
    const allOk = SOLUTION.every((row, r) => row.every((cell, c) => !cell || cells[r][c] === cell));
    if (allOk) { setWon(true); setTimerActive(false); }
  }

  function reveal() {
    setCells(SOLUTION.map(row => row.map(c => c || "")));
    setRevealed(true); setChecked(false); setTimerActive(false);
  }

  function reset() {
    setCells(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
    setChecked(false); setRevealed(false); setWon(false);
    setSel(null); setActiveWord(null);
    setSeconds(0); setTimerActive(false); setMistakes(0);
  }

  function share() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setShareMsg("Copied!"); setTimeout(() => setShareMsg(""), 2000);
    }).catch(() => { setShareMsg("Copy URL from browser"); setTimeout(() => setShareMsg(""), 3000); });
  }

  function cellClass(r, c) {
    const parts = ["ci"];
    if (sel?.r === r && sel?.c === c) parts.push("sel");
    else if (activeWord) {
      const aw = activeWord;
      const inW = aw.dir === "across"
        ? aw.row === r && c >= aw.col && c < aw.col + aw.word.length
        : aw.col === c && r >= aw.row && r < aw.row + aw.word.length;
      if (inW) parts.push("hi");
    }
    if (revealed) parts.push("rev");
    else if (checked && SOLUTION[r][c]) {
      if (!cells[r][c]) parts.push("mt");
      else parts.push(cells[r][c] === SOLUTION[r][c] ? "ok" : "err");
    }
    return parts.join(" ");
  }

  const totalCells = SOLUTION.flat().filter(Boolean).length;
  const correct = cells.flat().filter((v, i) => {
    const r = Math.floor(i / COLS), c = i % COLS;
    return SOLUTION[r][c] && v === SOLUTION[r][c];
  }).length;
  const pct = totalCells ? Math.round(correct / totalCells * 100) : 0;

  const clueList = clueTab === "across" ? ACROSS : DOWN;

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      height:"100vh", overflow:"hidden",
      background:"#faf7f0", fontFamily:"Georgia,serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;overflow:hidden}

        /* Cell size — big enough to read on iPad */
        :root{--cs:42px;--fs:17px;--ns:9px}
        @media(max-width:480px){:root{--cs:30px;--fs:13px;--ns:7px}}

        .ci{
          width:var(--cs);height:var(--cs);
          border:1.5px solid #8a7a5a;background:#fffef5;
          text-align:center;font-size:var(--fs);font-weight:700;
          font-family:Lora,Georgia,serif;color:#1a1008;
          text-transform:uppercase;cursor:pointer;outline:none;
          caret-color:transparent;padding:0;transition:background .1s;
        }
        .ci.hi{background:#e8f0d8}
        .ci.sel{background:#5a8a2a!important;color:#fff}
        .ci.ok{background:#bff0b0!important;color:#1a6010}
        .ci.err{background:#ffb0b0!important;color:#8b1010}
        .ci.rev{background:#fff3b0!important;color:#7a5500}
        .ci.mt{background:#ffe8a0!important}
        .blk{width:var(--cs);height:var(--cs);background:#2a1a08;display:block}
        .cwrap{position:relative;display:inline-block;width:var(--cs);height:var(--cs)}
        .cnum{
          position:absolute;top:2px;left:2px;
          font-size:var(--ns);color:#5a4010;font-weight:700;
          font-family:Lora,Georgia,serif;pointer-events:none;z-index:2;line-height:1;
        }

        /* Clues */
        .clue{
          padding:8px 10px;border-radius:5px;
          font-size:14px;line-height:1.55;
          cursor:pointer;transition:background .1s;
          font-family:Lora,Georgia,serif;color:#2c1a08;
          border-left:3px solid transparent;
        }
        .clue:hover{background:#ede0c0}
        .clue.act{background:#e8f0d8;font-weight:600;border-left-color:#5a8a2a}
        .cn{font-weight:700;color:#6a4a10;margin-right:5px;font-size:13px}

        /* Buttons */
        .btn{
          font-family:'Playfair Display',Georgia,serif;font-weight:700;
          border:none;border-radius:4px;cursor:pointer;transition:all .15s;font-size:13px;
        }
        .bg{background:#3a6a1a;color:#f0ead8;padding:9px 18px;box-shadow:2px 2px 0 #1a3a08}
        .bg:hover{background:#5a8a2a;transform:translateY(-1px)}
        .bo{background:transparent;color:#4a3a18;border:1.5px solid #8a7a5a;padding:8px 14px}
        .bo:hover{background:#e8e0cc}

        /* Grade tabs */
        .gtab{
          padding:7px 14px;border:1.5px solid #8a7a5a;border-radius:4px;
          font-size:12px;font-family:'Playfair Display',Georgia,serif;font-weight:700;
          cursor:pointer;background:transparent;color:#4a3a18;transition:all .15s;white-space:nowrap;
        }
        .gtab:hover{background:#e8e0cc}
        .gtab.on{background:#3a6a1a;color:#f0ead8;border-color:#3a6a1a}

        /* Clue tabs */
        .ctab{
          flex:1;padding:10px;border:none;
          border-bottom:3px solid transparent;
          background:transparent;
          font-family:'Playfair Display',serif;font-weight:700;
          font-size:13px;letter-spacing:1px;text-transform:uppercase;
          color:#6a5a30;cursor:pointer;transition:all .15s;
        }
        .ctab.on{border-bottom-color:#3a6a1a;color:#3a6a1a}

        /* Progress */
        .ptrack{height:6px;background:#e0d8c8;border-radius:3px;overflow:hidden}
        .pfill{height:100%;background:#3a6a1a;border-radius:3px;transition:width .4s ease}

        /* Win */
        @keyframes pop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
        .win{animation:pop .45s cubic-bezier(.175,.885,.32,1.275)}

        /* Print */
        @media print{
          .no-print{display:none!important}
          html,body,#root{height:auto;overflow:visible}
          .grid-scroll{overflow:visible!important}
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="no-print" style={{background:"linear-gradient(135deg,#2d4a18,#4a7a22)",padding:"10px 16px",borderBottom:"3px solid #8a7a30",display:"flex",alignItems:"center",gap:"12px",flexShrink:0}}>
        <span style={{fontSize:"26px"}}>🕷️</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"17px",color:"#f0ead8",lineHeight:1.2}}>
            Charlotte's Web — Chapter 1
          </div>
          <div style={{fontSize:"10px",color:"#a8d890",fontStyle:"italic",letterSpacing:"1px"}}>
            Before Breakfast · 20 Words
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"12px",flexShrink:0}}>
          <div style={{textAlign:"right",color:"#f0ead8"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"18px",letterSpacing:"2px"}}>
              {formatTime(seconds)}
            </div>
            <div style={{fontSize:"10px",color:"#a8d890"}}>{mistakes} mistake{mistakes!==1?"s":""}</div>
          </div>
          <button
            onClick={()=>{ if(!document.fullscreenElement){document.documentElement.requestFullscreen?.()}else{document.exitFullscreen?.()} }}
            style={{background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:"6px",color:"#f0ead8",padding:"7px 11px",cursor:"pointer",fontSize:"18px",lineHeight:1,flexShrink:0}}
            title="Toggle fullscreen"
          >⛶</button>
        </div>
      </div>

      {/* ── COMPACT TOOLBAR ── */}
      <div className="no-print" style={{background:"#f0ead8",borderBottom:"1px solid #c8b888",padding:"6px 10px",flexShrink:0,display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
        {/* Grade selector — compact */}
        <div style={{display:"flex",gap:"4px",background:"rgba(0,0,0,.06)",borderRadius:"5px",padding:"3px"}}>
          {GRADES.map(g=>(
            <button key={g.key}
              onClick={()=>setGrade(g.key)}
              style={{padding:"4px 10px",border:"none",borderRadius:"4px",fontSize:"11px",fontFamily:"'Playfair Display',serif",fontWeight:700,cursor:"pointer",transition:"all .15s",
                background:grade===g.key?"#3a6a1a":"transparent",
                color:grade===g.key?"#f0ead8":"#4a3a18"}}>
              {g.key}{g.key==="2"?"nd":g.key==="3"?"rd":"th"}
            </button>
          ))}
        </div>
        <div style={{width:"1px",height:"24px",background:"#c8b888",flexShrink:0}}/>
        <button className="btn bg" onClick={check} style={{padding:"5px 14px",fontSize:"12px"}}>Check</button>
        <button className="btn bo" onClick={reveal} style={{padding:"4px 12px",fontSize:"12px"}}>Reveal</button>
        <button className="btn bo" onClick={reset} style={{padding:"4px 12px",fontSize:"12px"}}>Restart</button>
        <button className="btn bo" onClick={()=>window.print()} style={{padding:"4px 10px",fontSize:"12px"}}>🖨️</button>
        <button className="btn bo" onClick={share} style={{padding:"4px 10px",fontSize:"12px"}}>🔗</button>
        {shareMsg && <span style={{fontSize:"11px",color:"#3a6a1a",fontFamily:"Lora,serif",fontStyle:"italic"}}>{shareMsg}</span>}
        {checked && !won && !revealed && <span style={{fontSize:"11px",color:"#7a5a00",fontFamily:"Lora,serif",fontStyle:"italic"}}>🟢 ok · 🔴 wrong · 🟡 empty</span>}
      </div>

      {/* ── PROGRESS BAR ── */}
      <div className="no-print" style={{padding:"6px 14px",background:"#f0ead8",borderBottom:"1px solid #c8b888",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#6a5a30",fontFamily:"Lora,serif",marginBottom:"3px"}}>
          <span>Progress</span><span>{pct}%</span>
        </div>
        <div className="ptrack"><div className="pfill" style={{width:pct+"%"}}/></div>
      </div>

      {/* ── WIN BANNER ── */}
      {won && (
        <div className="win no-print" style={{background:"linear-gradient(135deg,#2d5a1a,#4a8a2a)",color:"#f0ead8",padding:"12px 20px",textAlign:"center",flexShrink:0}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px"}}>🌟 Solved! Time: {formatTime(seconds)} · Mistakes: {mistakes} 🌟</div>
          <div style={{fontSize:"12px",fontFamily:"Lora,serif",fontStyle:"italic",marginTop:"3px"}}>Just like Fern saved Wilbur — you did it!</div>
        </div>
      )}

      {/* ── GRID PANEL (scrollable) ── */}
      <div className="grid-scroll" style={{flex:"1 1 60%",minHeight:0,overflowX:"auto",overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"10px",background:"#faf7f0"}}>
        <div style={{display:"inline-block",background:"rgba(255,254,245,.98)",border:"2px solid #8a7a5a",borderRadius:"6px",padding:"12px",boxShadow:"3px 4px 0 #c8b870"}}>
          <table style={{borderCollapse:"collapse"}}>
            <tbody>
              {Array.from({length:ROWS},(_,r)=>(
                <tr key={r}>
                  {Array.from({length:COLS},(_,c)=>{
                    const letter = SOLUTION[r][c];
                    if (!letter) return <td key={c} style={{padding:0}}><div className="blk"/></td>;
                    const num = NUMBERING[`${r},${c}`];
                    const val = revealed ? letter : (cells[r][c] || "");
                    return (
                      <td key={c} style={{padding:0}}>
                        <div className="cwrap">
                          {num && <span className="cnum">{num}</span>}
                          <input
                            ref={el=>{refs.current[`${r},${c}`]=el}}
                            type="text" maxLength={1}
                            className={cellClass(r,c)}
                            value={val}
                            readOnly={revealed}
                            onChange={()=>{}}
                            onClick={()=>clickCell(r,c)}
                            onKeyDown={e=>keyDown(r,c,e)}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="no-print" style={{height:"4px",background:"linear-gradient(90deg,#3a6a1a,#8a7a5a,#3a6a1a)",flexShrink:0}}/>

      {/* ── CLUE PANEL (scrollable bottom) ── */}
      <div className="no-print" style={{flex:"0 0 35%",display:"flex",flexDirection:"column",background:"#fff",borderTop:"none",minHeight:0}}>

        {/* Active clue highlight */}
        {activeWord && (
          <div style={{background:"#e8f0d8",borderBottom:"1px solid #c8d8a8",padding:"8px 14px",flexShrink:0}}>
            <span style={{fontWeight:700,color:"#6a4a10",fontFamily:"'Playfair Display',serif",fontSize:"13px",marginRight:"6px"}}>
              {activeWord.number} {activeWord.dir.toUpperCase()}
            </span>
            <span style={{fontFamily:"Lora,serif",fontSize:"13px",color:"#2c1a08"}}>{activeWord.clue}</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"2px solid #e0d8c8",flexShrink:0}}>
          <button className={`ctab${clueTab==="across"?" on":""}`} onClick={()=>setClueTab("across")}>
            Across ({ACROSS.length})
          </button>
          <button className={`ctab${clueTab==="down"?" on":""}`} onClick={()=>setClueTab("down")}>
            Down ({DOWN.length})
          </button>
        </div>

        {/* Scrollable clue list */}
        <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",flex:1,padding:"4px 8px"}}>
          {clueList.map(w => {
            const isActive = activeWord?.number===w.number && activeWord?.dir===clueTab;
            return (
              <div
                key={`${clueTab}${w.number}`}
                ref={isActive ? activeClueRef : null}
                className={`clue${isActive?" act":""}`}
                onClick={()=>{setSel({r:w.row,c:w.col});setActiveWord(w);focus(w.row,w.col)}}
              >
                <span className="cn">{w.number}.</span>{w.clue}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
