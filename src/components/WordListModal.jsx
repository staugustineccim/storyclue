/**
 * WordListModal — Word List with Clues and Answers
 *
 * Props:
 *   words  — [{ number, orientation, clue, answer }]
 *   grade  — grade string
 *   onClose — function
 */
export default function WordListModal({ words, grade, onClose }) {
  const isEarlyLearner = ["k","1","2"].includes(String(grade));

  // Separate and sort words by orientation
  const acrossWords = words
    .filter(w => w.orientation === "across")
    .sort((a, b) => a.number - b.number);

  const downWords = words
    .filter(w => w.orientation === "down")
    .sort((a, b) => a.number - b.number);

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,.65)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:9600, padding:"12px",
    }}>
      <div style={{
        background:"#fdfaf4", borderRadius:"16px",
        padding:"24px 22px",
        maxWidth:"520px", width:"100%",
        maxHeight:"85vh", overflowY:"auto",
        fontFamily:"Lora,Georgia,serif",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
          <h2 style={{ margin:0, fontSize:"22px", color:"#2D5A1A", fontFamily:"'Playfair Display',serif", fontWeight:700 }}>
            📚 Word List
          </h2>
          <button
            onClick={onClose}
            style={{
              background:"none", border:"none", fontSize:"24px", cursor:"pointer", color:"#666", padding:0,
            }}
          >
            ✕
          </button>
        </div>

        {acrossWords.length > 0 && (
          <div style={{ marginBottom:"24px" }}>
            <h3 style={{ fontSize:"14px", fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 12px" }}>
              Across
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {acrossWords.map((word, idx) => (
                <div key={idx} style={{ paddingBottom:"8px", borderBottom:"1px solid #e0d7cc" }}>
                  <div style={{ fontSize:"11px", color:"#8a7a50", marginBottom:"2px" }}>
                    {word.number}. {word.clue}
                  </div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:"#2D5A1A" }}>
                    {word.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {downWords.length > 0 && (
          <div>
            <h3 style={{ fontSize:"14px", fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 12px" }}>
              Down
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {downWords.map((word, idx) => (
                <div key={idx} style={{ paddingBottom:"8px", borderBottom:"1px solid #e0d7cc" }}>
                  <div style={{ fontSize:"11px", color:"#8a7a50", marginBottom:"2px" }}>
                    {word.number}. {word.clue}
                  </div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:"#2D5A1A" }}>
                    {word.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop:"20px", width:"100%",
            padding:"10px", background:"#2D5A1A", color:"white",
            border:"none", borderRadius:"8px", fontFamily:"Lora,Georgia,serif",
            fontSize:"14px", fontWeight:600, cursor:"pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
