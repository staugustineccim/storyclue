import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#faf7f0", fontFamily:"Georgia,serif", padding:"40px 24px", textAlign:"center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;1,400&display=swap');`}</style>
      <div style={{ fontSize:"64px", marginBottom:"16px" }}>🕷️</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"80px", color:"#2d4a18", lineHeight:1, marginBottom:"8px" }}>404</div>
      <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"26px", color:"#2c1a08", marginBottom:"12px" }}>
        Charlotte couldn't find this page either
      </h1>
      <p style={{ fontFamily:"Lora,serif", fontSize:"15px", color:"#6a5a30", marginBottom:"32px", maxWidth:"400px", lineHeight:1.7 }}>
        The page you're looking for doesn't exist. But a great crossword puzzle is just one click away.
      </p>
      <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", justifyContent:"center" }}>
        <button
          onClick={() => navigate("/")}
          style={{ background:"#3a6a1a", color:"#f0ead8", border:"none", borderRadius:"4px", padding:"12px 28px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", cursor:"pointer", boxShadow:"3px 3px 0 #1a3a08" }}
        >
          Go to StoryClue Home
        </button>
        <button
          onClick={() => navigate("/create")}
          style={{ background:"transparent", color:"#3a6a1a", border:"2px solid #3a6a1a", borderRadius:"4px", padding:"12px 28px", fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"14px", cursor:"pointer" }}
        >
          Create a Puzzle
        </button>
      </div>
    </div>
  );
}
