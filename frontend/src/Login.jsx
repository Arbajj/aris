import { useState } from "react";
import axios from "axios";
import { API_URL } from "./config";
import { setToken } from "./auth";

export default function Login({ theme, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await axios.post(`${API_URL}${path}`, { email, password });
      setToken(res.data.token);
      onSuccess();
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const field = {
    width: "100%", padding: "12px 14px", marginBottom: "12px", borderRadius: "6px",
    background: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text,
    fontSize: "13px", fontFamily: "'DM Mono', monospace", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, color: theme.text }}>
      <div style={{ width: "100%", maxWidth: "380px", padding: "32px", background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "8px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ color: "#d4af37", fontSize: "28px", letterSpacing: "8px", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>◈ ARIS</div>
          <div style={{ color: theme.muted, fontSize: "11px", letterSpacing: "3px", marginTop: "6px" }}>
            {mode === "login" ? "HR LOGIN" : "CREATE HR ACCOUNT"}
          </div>
        </div>

        <input style={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          style={field} type="password" placeholder="Password (min 8 characters)" value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />

        {error && <div style={{ color: "#cd853f", fontSize: "12px", marginBottom: "12px" }}>⚠ {error}</div>}

        <button
          onClick={submit} disabled={loading}
          style={{ width: "100%", padding: "12px", border: "none", borderRadius: "4px", cursor: "pointer", background: "linear-gradient(135deg, #d4af37, #b8962e)", color: "#080808", fontWeight: 700, letterSpacing: "3px", fontSize: "12px", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "PLEASE WAIT..." : mode === "login" ? "LOGIN" : "REGISTER"}
        </button>

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: theme.muted }}>
          {mode === "login" ? "No account? " : "Already registered? "}
          <span
            style={{ color: "#d4af37", cursor: "pointer" }}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Register" : "Login"}
          </span>
        </div>
      </div>
    </div>
  );
}