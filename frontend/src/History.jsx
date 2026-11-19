import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "./config";


// Database ka time UTC hota hai, yahan local time mein badalte hain
function formatDate(utc) {
  const d = new Date(utc.replace(" ", "T") + "Z");
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function History({ theme, onOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/history`);
      setItems(res.data);
    } catch {
      setError("Could not load history. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openOne = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/history/${id}`);
      onOpen(res.data.results);
    } catch {
      setError("Could not open this screening.");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this screening permanently?")) return;
    try {
      await axios.delete(`${API_URL}/history/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      setError("Could not delete this screening.");
    }
  };

  return (
    <div
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: "8px",
        padding: "24px",
        marginBottom: "32px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ color: "#d4af37", letterSpacing: "3px", fontSize: "12px" }}>PAST SCREENINGS</span>
        <button
          onClick={onClose}
          style={{ background: "none", border: `1px solid ${theme.border}`, color: theme.muted, padding: "4px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}
        >
          ✕ CLOSE
        </button>
      </div>

      {error && <p style={{ color: "#cd853f", fontSize: "13px", marginBottom: "12px" }}>⚠ {error}</p>}
      {loading && <p style={{ color: theme.muted, fontSize: "13px" }}>Loading...</p>}
      {!loading && !error && items.length === 0 && (
        <p style={{ color: theme.muted, fontSize: "13px" }}>No screenings yet. Run one first.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((it) => (
          <div
            key={it.id}
            style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 16px", background: theme.rowBg, border: `1px solid ${theme.border}`, borderRadius: "6px" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.jd_preview.trim() || "(empty JD)"}
              </div>
              <div style={{ fontSize: "11px", color: theme.muted, marginTop: "4px" }}>
                {formatDate(it.created_at)} · {it.total} resume{it.total !== 1 ? "s" : ""} · avg {it.avg_score} · top {it.top_score}
              </div>
            </div>
            <button
              onClick={() => openOne(it.id)}
              style={{ background: "none", border: "1px solid rgba(212,175,55,0.4)", color: "#d4af37", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", letterSpacing: "1px" }}
            >
              OPEN
            </button>
            <button
              onClick={() => remove(it.id)}
              style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: "14px" }}
              title="Delete"
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}