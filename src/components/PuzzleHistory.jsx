import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function PuzzleHistory() {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("sc_puzzle_history") || "[]");
    setPuzzles(history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setLoading(false);
  }, []);

  const deletePuzzle = (slug) => {
    const updated = puzzles.filter(p => p.slug !== slug);
    setPuzzles(updated);
    localStorage.setItem("sc_puzzle_history", JSON.stringify(updated));
  };

  if (loading) return <div style={container}><p>Loading...</p></div>;

  return (
    <div style={container}>
      <h1 style={heading}>Puzzle History</h1>
      {puzzles.length === 0 ? (
        <p style={empty}>No puzzles yet. <Link to="/create" style={link}>Create one now</Link></p>
      ) : (
        <div style={grid}>
          {puzzles.map(p => (
            <div key={p.slug} style={card}>
              <h3 style={cardTitle}>{p.title}</h3>
              <p style={cardMeta}>Grade {p.grade} • {new Date(p.createdAt).toLocaleDateString()}</p>
              <div style={cardButtons}>
                <Link to={`/play/${p.slug}`} style={btnPlay}>Play</Link>
                <button onClick={() => deletePuzzle(p.slug)} style={btnDelete}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const container = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "2rem 1rem",
  minHeight: "100vh",
  background: "#FDFAF4",
  fontFamily: "Lora, Georgia, serif",
};

const heading = {
  fontSize: "2rem",
  color: "#2D5A1A",
  marginBottom: "2rem",
  textAlign: "center",
};

const empty = {
  textAlign: "center",
  color: "#666",
  fontSize: "1.1rem",
  marginTop: "3rem",
};

const link = {
  color: "#c0900a",
  textDecoration: "none",
  fontWeight: 600,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "1.5rem",
};

const card = {
  background: "#fff",
  border: "1px solid #e0c860",
  borderRadius: "8px",
  padding: "1.5rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const cardTitle = {
  fontSize: "1.1rem",
  color: "#2D5A1A",
  margin: "0 0 0.5rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const cardMeta = {
  fontSize: "0.9rem",
  color: "#999",
  margin: "0 0 1rem",
};

const cardButtons = {
  display: "flex",
  gap: "0.75rem",
};

const btnPlay = {
  flex: 1,
  padding: "0.5rem 1rem",
  background: "#2D5A1A",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  textAlign: "center",
  fontFamily: "Lora, Georgia, serif",
  transition: "background 0.2s",
};

const btnDelete = {
  padding: "0.5rem 1rem",
  background: "#f5f5f5",
  color: "#666",
  border: "1px solid #ddd",
  borderRadius: "4px",
  fontSize: "0.9rem",
  cursor: "pointer",
  fontFamily: "Lora, Georgia, serif",
  transition: "background 0.2s",
};
