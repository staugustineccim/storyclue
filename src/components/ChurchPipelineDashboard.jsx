import { useState, useEffect } from "react";

export default function ChurchPipelineDashboard() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/dashboard-data?password=${encodeURIComponent(password)}`);
      if (!res.ok) {
        throw new Error("Invalid password");
      }
      const dashData = await res.json();
      setData(dashData);
      setIsAuthenticated(true);
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px" }}>
        <h1>🏘️ Church Pipeline Dashboard</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: "#2D5A1A",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        </form>
      </div>
    );
  }

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Georgia, serif" }}>
      <h1>📊 Church Outreach Pipeline</h1>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <MetricCard label="🏘️ Churches Identified" value={data.churches} />
        <MetricCard label="📝 Puzzles Created" value={data.puzzlesCreated} />
        <MetricCard label="📊 Per Church Avg" value={(data.puzzlesCreated / data.churches).toFixed(1)} />
      </div>

      {/* Churches Pipeline */}
      <section style={{ marginBottom: "30px" }}>
        <h2>Churches Pipeline</h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #d0d0d0",
          }}
        >
          <thead style={{ background: "#f5f5f5" }}>
            <tr>
              <th style={tableHeaderStyle}>Church</th>
              <th style={tableHeaderStyle}>Pastor</th>
              <th style={tableHeaderStyle}>Puzzles</th>
              <th style={tableHeaderStyle}>YouTube Channel</th>
              <th style={tableHeaderStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.churchStats.map((church) => (
              <tr key={church.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td style={tableCellStyle}>
                  <strong>{church.name}</strong>
                </td>
                <td style={tableCellStyle}>{church.pastor}</td>
                <td style={tableCellStyle}>{church.puzzles_created}</td>
                <td style={tableCellStyle}>
                  <a href={church.youtube_channel} target="_blank" rel="noopener noreferrer" style={{ color: "#2D5A1A" }}>
                    View
                  </a>
                </td>
                <td style={tableCellStyle}>
                  <StatusBadge status={church.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Recent Puzzles */}
      <section>
        <h2>Recent Puzzles Generated</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {data.recentPuzzles.length === 0 ? (
            <p style={{ color: "#999" }}>No puzzles generated yet.</p>
          ) : (
            data.recentPuzzles.map((puzzle) => (
              <PuzzleCard key={puzzle.id} puzzle={puzzle} />
            ))
          )}
        </div>
      </section>

      <button
        onClick={() => setIsAuthenticated(false)}
        style={{
          marginTop: "30px",
          padding: "10px 20px",
          background: "#ccc",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        background: "#f9f9f9",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
      }}
    >
      <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: "12px" }}>
        {label}
      </p>
      <p style={{ margin: "0", fontSize: "28px", fontWeight: "bold", color: "#2D5A1A" }}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    identified: { bg: "#fff3cd", text: "#856404" },
    active: { bg: "#d4edda", text: "#155724" },
    pending: { bg: "#e2e3e5", text: "#383d41" },
  };

  const color = colors[status] || colors.pending;

  return (
    <span
      style={{
        background: color.bg,
        color: color.text,
        padding: "6px 10px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PuzzleCard({ puzzle }) {
  return (
    <div
      style={{
        background: "#faf7f0",
        padding: "15px",
        borderRadius: "6px",
        border: "1px solid #e0d8c8",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <p style={{ margin: "0 0 5px 0", fontWeight: "bold", color: "#2D5A1A" }}>
          {puzzle.church_name}
        </p>
        <p style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#666" }}>
          "{puzzle.sermon_title}"
        </p>
        <p style={{ margin: "0", fontSize: "12px", color: "#999" }}>
          {new Date(puzzle.created_at).toLocaleDateString()} at {new Date(puzzle.created_at).toLocaleTimeString()}
        </p>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <a
          href={`/play/${puzzle.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
        >
          Preview
        </a>
        {puzzle.video_url && (
          <a
            href={puzzle.video_url}
            target="_blank"
            rel="noopener noreferrer"
            style={buttonStyle}
          >
            Sermon
          </a>
        )}
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: "12px",
  textAlign: "left",
  borderRight: "1px solid #d0d0d0",
  fontSize: "13px",
  fontWeight: "bold",
  color: "#333",
};

const tableCellStyle = {
  padding: "12px",
  borderRight: "1px solid #d0d0d0",
  fontSize: "14px",
};

const buttonStyle = {
  padding: "6px 12px",
  background: "#2D5A1A",
  color: "white",
  textDecoration: "none",
  borderRadius: "4px",
  fontSize: "12px",
  cursor: "pointer",
};
