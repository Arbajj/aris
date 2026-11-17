import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import History from "./History";

const API_URL = "http://127.0.0.1:8000";

// ─── PARTICLE CANVAS ───────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.alpha})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212,175,55,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ─── INTRO SCREEN ──────────────────────────────────────────────────
function IntroScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  // phase 0: particles only → phase 1: logo appears → phase 2: subtitle → phase 3: fade out
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 3800);
    const t4 = setTimeout(() => onDone(), 4800);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      ...introStyles.root,
      opacity: phase === 3 ? 0 : 1,
      transition: phase === 3 ? "opacity 1s ease" : "none",
    }}>
      <ParticleCanvas />
      <div style={introStyles.center}>
        {/* Hexagon ring */}
        <div style={{ ...introStyles.ring, opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(-45deg)" }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <polygon points="70,8 128,39 128,101 70,132 12,101 12,39" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="1.5" />
            <polygon points="70,20 116,46 116,94 70,120 24,94 24,46" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" />
          </svg>
          <div style={introStyles.ringInner}>◈</div>
        </div>

        {/* Logo */}
        <div style={{ ...introStyles.logoWrap, opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(20px)" }}>
          <h1 style={introStyles.logoText}>ARIS</h1>
          <div style={introStyles.logoDivider} />
        </div>

        {/* Subtitle */}
        <p style={{ ...introStyles.subtitle, opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "translateY(0)" : "translateY(10px)" }}>
          AI RECRUITMENT INTELLIGENCE SYSTEM
        </p>
        <p style={{ ...introStyles.subtext, opacity: phase >= 2 ? 1 : 0 }}>
          Initializing neural screening engine...
        </p>

        {/* Progress bar */}
        <div style={{ ...introStyles.progressWrap, opacity: phase >= 2 ? 1 : 0 }}>
          <div style={{ ...introStyles.progressBar, width: phase >= 2 ? "100%" : "0%" }} />
        </div>
      </div>
    </div>
  );
}

// ─── CIRCULAR PROGRESS ─────────────────────────────────────────────
function CircularProgress({ score, animate }) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (displayScore / 100) * circumference;
  const color = displayScore >= 70 ? "#d4af37" : displayScore >= 40 ? "#c0932a" : "#8b4513";

  useEffect(() => {
    if (!animate) { setDisplayScore(score); return; }
    let start = 0;
    const step = score / 60;
    const interval = setInterval(() => {
      start += step;
      if (start >= score) { setDisplayScore(score); clearInterval(interval); }
      else setDisplayScore(Math.floor(start));
    }, 16);
    return () => clearInterval(interval);
  }, [score, animate]);

  return (
    <div style={{ position: "relative", width: 96, height: 96 }}>
      <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="6" />
        <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={progress} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 6px ${color}80)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "18px", fontWeight: "800", color, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{displayScore}</span>
        <span style={{ fontSize: "9px", color: "rgba(212,175,55,0.5)", letterSpacing: "1px" }}>/ 100</span>
      </div>
    </div>
  );
}

// ─── VERDICT BADGE ─────────────────────────────────────────────────
function VerdictBadge({ verdict }) {
  const config = {
    "Selected":  { bg: "rgba(212,175,55,0.15)", border: "rgba(212,175,55,0.5)", color: "#d4af37", icon: "◆" },
    "Waitlist":  { bg: "rgba(192,147,42,0.1)",  border: "rgba(192,147,42,0.4)", color: "#c0932a", icon: "◇" },
    "Rejected":  { bg: "rgba(139,69,19,0.15)",  border: "rgba(139,69,19,0.4)", color: "#cd853f", icon: "✕" },
  };
  const c = config[verdict] || config["Waitlist"];
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, borderRadius: "4px", padding: "3px 12px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", fontFamily: "'Cormorant Garamond', serif" }}>
      {c.icon} {(verdict || "N/A").toUpperCase()}
    </span>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────
export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [jd, setJd] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [animateScores, setAnimateScores] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

  const theme = darkMode ? dark : light;

  useEffect(() => {
    if (uploaded && results.length > 0) {
      setTimeout(() => setAnimateScores(true), 300);
    }
  }, [uploaded, results]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    if (!dropped.length) { setError("Only PDF files allowed."); return; }
    setError(""); setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.type === "application/pdf");
    if (!selected.length) { setError("Only PDF files allowed."); return; }
    setError(""); setFiles(prev => [...prev, ...selected]);
  };

  const handleUpload = async () => {
    if (!files.length) { setError("Please add at least one PDF resume."); return; }
    if (!jd.trim()) { setError("Please enter a Job Description."); return; }
    setLoading(true); setError(""); setResults([]);
    const formData = new FormData();
    formData.append("jd", jd);
    files.forEach(f => formData.append("files", f));
    try {
      const res = await axios.post(`${API_URL}/upload-resumes`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      const sorted = [...res.data.results].sort((a, b) => (b.score || 0) - (a.score || 0));
      setResults(sorted); setUploaded(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Server error. Make sure backend is running.");
    } finally { setLoading(false); }
  };

  const handleReset = () => { setFiles([]); setResults([]); setUploaded(false); setError(""); setJd(""); setAnimateScores(false); };

  const exportCSV = () => {
    const headers = ["Rank","Filename","Score","Verdict","Matched Skills","Missing Skills","Summary"];
    const rows = results.map((r, i) => [i+1, r.filename, r.score||0, r.verdict||"N/A", (r.skills||[]).join("; "), (r.missing_skills||[]).join("; "), `"${(r.summary||"").replace(/"/g,"'")}"`]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], {type:"text/csv"})), download: "ARIS_Report.csv" });
    a.click();
  };

  if (showIntro) return <IntroScreen onDone={() => setShowIntro(false)} />;

  return (
    <div style={{ ...appStyles.root, background: theme.bg, color: theme.text }}>
      <ParticleCanvas />

      {/* Header */}
      <header style={{ ...appStyles.header, borderBottom: `1px solid ${theme.border}`, background: theme.headerBg }}>
        <div style={appStyles.headerLeft}>
          <span style={{ color: "#d4af37", fontSize: "20px" }}>◈</span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: "700", color: "#d4af37", letterSpacing: "6px" }}>ARIS</span>
          <span style={{ fontSize: "11px", color: theme.muted, letterSpacing: "2px" }}>AI RECRUITMENT INTELLIGENCE</span>
        </div>
        <div style={appStyles.headerRight}>
          <div style={{ ...appStyles.onlineDot, background: "#d4af37" }} />
          <span style={{ fontSize: "11px", color: theme.muted, letterSpacing: "1px" }}>GROQ ENGINE ONLINE</span>
                    <button onClick={() => setShowHistory(true)} style={{ ...appStyles.toggleBtn, background: theme.cardBg, border: `1px solid ${theme.border}`, color: "#d4af37" }}>
            ◈ History
          </button>
          <button onClick={() => setDarkMode(!darkMode)} style={{ ...appStyles.toggleBtn, background: theme.cardBg, border: `1px solid ${theme.border}`, color: theme.text }}>
            {darkMode ? "☀ Light" : "◑ Dark"}
          </button>
        </div>
      </header>

      <main style={appStyles.main}>
                {showHistory && (
          <History
            theme={theme}
            onClose={() => setShowHistory(false)}
            onOpen={(res) => {
              setResults(res);
              setUploaded(true);
              setAnimateScores(false);
              setShowHistory(false);
            }}
          />
        )}
        {/* Hero */}
        <div style={appStyles.hero}>
          <div style={appStyles.heroEyebrow}>
            <span style={appStyles.eyebrowLine} />
            <span style={{ fontSize: "11px", color: "#d4af37", letterSpacing: "4px" }}>INTELLIGENCE PLATFORM</span>
            <span style={appStyles.eyebrowLine} />
          </div>
          <h1 style={{ ...appStyles.heroTitle, color: theme.text }}>
            Screen Smarter.<br />
            <span style={{ color: "#d4af37" }}>Hire Better.</span>
          </h1>
          <p style={{ ...appStyles.heroSub, color: theme.muted }}>
            AI-powered resume analysis against job descriptions — scored, ranked, and ready.
          </p>
        </div>

        {!uploaded && (
          <div style={appStyles.formGrid}>
            {/* Left: Upload */}
            <div style={{ ...appStyles.panel, background: theme.cardBg, border: `1px solid ${theme.border}` }}>
              <div style={appStyles.panelLabel}>
                <span style={{ color: "#d4af37" }}>01</span>
                <span style={{ color: theme.muted, letterSpacing: "3px", fontSize: "11px" }}>UPLOAD RESUMES</span>
              </div>

              <div
                style={{ ...appStyles.dropZone, border: `2px dashed ${dragging ? "#d4af37" : theme.border}`, background: dragging ? "rgba(212,175,55,0.04)" : "transparent" }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>{dragging ? "⬇" : "📄"}</div>
                <p style={{ color: theme.muted, fontSize: "14px", marginBottom: "12px" }}>
                  {dragging ? "Release to upload" : "Drag & drop PDF resumes"}
                </p>
                <label style={{ ...appStyles.browseBtn, border: `1px solid rgba(212,175,55,0.4)`, color: "#d4af37" }}>
                  Browse Files
                  <input type="file" accept=".pdf" multiple onChange={handleFileInput} style={{ display: "none" }} />
                </label>
              </div>

              {files.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ ...appStyles.fileItem, background: theme.rowBg, border: `1px solid ${theme.border}` }}>
                      <span style={{ color: "#d4af37" }}>◈</span>
                      <span style={{ flex: 1, fontSize: "12px", color: theme.text, fontFamily: "monospace" }}>{f.name}</span>
                      <span style={{ fontSize: "11px", color: theme.muted }}>{(f.size/1024).toFixed(1)}KB</span>
                      <button onClick={() => setFiles(p => p.filter((_,j)=>j!==i))} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: JD */}
            <div style={{ ...appStyles.panel, background: theme.cardBg, border: `1px solid ${theme.border}` }}>
              <div style={appStyles.panelLabel}>
                <span style={{ color: "#d4af37" }}>02</span>
                <span style={{ color: theme.muted, letterSpacing: "3px", fontSize: "11px" }}>JOB DESCRIPTION</span>
              </div>
              <textarea
                style={{ ...appStyles.textarea, background: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text }}
                placeholder="Paste the full job description here. The AI will extract required skills and match each resume against these requirements..."
                value={jd}
                onChange={e => setJd(e.target.value)}
                rows={10}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <span style={{ fontSize: "11px", color: theme.muted }}>{jd.length} characters</span>
                {jd.length > 0 && <span style={{ fontSize: "11px", color: "#d4af37" }}>✓ Ready</span>}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ ...appStyles.errorBox, border: "1px solid rgba(205,133,63,0.4)" }}>
            ⚠ {error}
          </div>
        )}

        {/* Analyze Button */}
        {!uploaded && (
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <button
              style={{ ...appStyles.analyzeBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? (
                <span>◈ ANALYZING {files.length} RESUME{files.length !== 1 ? "S" : ""}...</span>
              ) : (
                <span>◈ BEGIN SCREENING — {files.length} RESUME{files.length !== 1 ? "S" : ""}</span>
              )}
            </button>
            {loading && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ height: "2px", background: "rgba(212,175,55,0.1)", borderRadius: "1px", overflow: "hidden", maxWidth: "400px", margin: "0 auto" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg, transparent, #d4af37, transparent)", animation: "shimmer 1.5s infinite" }} />
                </div>
                <p style={{ fontSize: "12px", color: theme.muted, marginTop: "10px", letterSpacing: "2px" }}>NEURAL ENGINE PROCESSING...</p>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop: "48px" }}>
            {/* Results Header */}
            <div style={appStyles.resultsHeader}>
              <div>
                <h2 style={{ fontSize: "28px", fontWeight: "700", fontFamily: "'Cormorant Garamond', serif", color: theme.text }}>
                  Screening <span style={{ color: "#d4af37" }}>Results</span>
                </h2>
                <p style={{ fontSize: "12px", color: theme.muted, letterSpacing: "2px" }}>{results.length} CANDIDATES ANALYZED</p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button style={{ ...appStyles.outlineBtn, border: `1px solid ${theme.border}`, color: theme.muted }} onClick={exportCSV}>⬇ EXPORT CSV</button>
                <button style={{ ...appStyles.outlineBtn, border: "1px solid rgba(212,175,55,0.4)", color: "#d4af37" }} onClick={handleReset}>＋ NEW BATCH</button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ ...appStyles.statsRow, borderBottom: `1px solid ${theme.border}`, borderTop: `1px solid ${theme.border}` }}>
              {[
                { v: results.length, l: "TOTAL" },
                { v: results.filter(r=>r.verdict==="Selected").length, l: "SELECTED", c: "#d4af37" },
                { v: results.filter(r=>r.verdict==="Waitlist").length, l: "WAITLIST", c: "#c0932a" },
                { v: results.filter(r=>r.verdict==="Rejected").length, l: "REJECTED", c: "#cd853f" },
                { v: Math.round(results.reduce((a,r)=>a+(r.score||0),0)/results.length), l: "AVG SCORE" },
              ].map((s, i) => (
                <div key={i} style={appStyles.statCell}>
                  <span style={{ fontSize: "32px", fontWeight: "800", fontFamily: "'Cormorant Garamond', serif", color: s.c || theme.text }}>{s.v}</span>
                  <span style={{ fontSize: "10px", color: theme.muted, letterSpacing: "2px" }}>{s.l}</span>
                </div>
              ))}
            </div>

            {/* Candidate Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  ...appStyles.card,
                  background: theme.cardBg,
                  border: i === 0 ? "1px solid rgba(212,175,55,0.5)" : `1px solid ${theme.border}`,
                  boxShadow: i === 0 ? "0 0 30px rgba(212,175,55,0.08)" : "none",
                }}>
                  {/* Top badge */}
                  {i === 0 && (
                    <div style={appStyles.topBadge}>
                      ◆ TOP CANDIDATE — RECOMMENDED FOR INTERVIEW
                    </div>
                  )}

                  <div style={appStyles.cardBody}>
                    {/* Left */}
                    <div style={appStyles.cardInfo}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "28px", fontWeight: "800", color: "rgba(212,175,55,0.3)", fontFamily: "'Cormorant Garamond', serif" }}>
                          {String(i+1).padStart(2, "0")}
                        </span>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: theme.text, fontFamily: "monospace", marginBottom: "6px" }}>
                            📄 {r.filename}
                          </div>
                          <VerdictBadge verdict={r.verdict} />
                        </div>
                      </div>

                      {r.summary && (
                        <p style={{ fontSize: "13px", color: theme.muted, lineHeight: "1.7", marginBottom: "16px", borderLeft: "2px solid rgba(212,175,55,0.3)", paddingLeft: "12px", fontStyle: "italic" }}>
                          {r.summary}
                        </p>
                      )}

                      {/* Skills */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {r.skills?.length > 0 && (
                          <div>
                            <div style={{ fontSize: "10px", color: "#d4af37", letterSpacing: "2px", marginBottom: "8px" }}>✦ MATCHED SKILLS</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {r.skills.map((s, j) => (
                                <span key={j} style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", color: "#d4af37", borderRadius: "3px", padding: "3px 10px", fontSize: "11px", letterSpacing: "0.5px" }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {r.missing_skills?.length > 0 && (
                          <div>
                            <div style={{ fontSize: "10px", color: "#cd853f", letterSpacing: "2px", marginBottom: "8px" }}>✦ MISSING SKILLS</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {r.missing_skills.map((s, j) => (
                                <span key={j} style={{ background: "rgba(139,69,19,0.1)", border: "1px solid rgba(139,69,19,0.3)", color: "#cd853f", borderRadius: "3px", padding: "3px 10px", fontSize: "11px", letterSpacing: "0.5px" }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {r.interview_questions?.length > 0 && (
                          <div>
                            <div style={{ fontSize: "10px", color: theme.muted, letterSpacing: "2px", marginBottom: "8px" }}>✦ INTERVIEW QUESTIONS</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {r.interview_questions.slice(0, 3).map((q, j) => (
                                <div key={j} style={{ fontSize: "12px", color: theme.muted, paddingLeft: "12px", borderLeft: `1px solid ${theme.border}` }}>
                                  {j+1}. {q}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Score */}
                    <div style={appStyles.cardScore}>
                      <CircularProgress score={r.score || 0} animate={animateScores} />
                      <div style={{ fontSize: "10px", color: theme.muted, letterSpacing: "2px", marginTop: "8px" }}>MATCH SCORE</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ ...appStyles.footer, borderTop: `1px solid ${theme.border}`, color: theme.muted }}>
        ARIS v3.0 &nbsp;◈&nbsp; Powered by Groq AI + Llama 3.3 70B &nbsp;◈&nbsp; Final Year Project &nbsp;◈&nbsp; BSc CS (AI/ML)
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea:focus { outline: none; border-color: rgba(212,175,55,0.5) !important; }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}

// ─── THEMES ────────────────────────────────────────────────────────
const dark = {
  bg: "#080808",
  text: "#f0ead6",
  muted: "#6b6050",
  border: "rgba(212,175,55,0.12)",
  cardBg: "rgba(255,255,255,0.02)",
  rowBg: "rgba(255,255,255,0.02)",
  inputBg: "rgba(255,255,255,0.02)",
  headerBg: "rgba(8,8,8,0.95)",
};
const light = {
  bg: "#faf8f2",
  text: "#1a1410",
  muted: "#8a7560",
  border: "rgba(139,100,20,0.15)",
  cardBg: "rgba(255,255,255,0.8)",
  rowBg: "rgba(0,0,0,0.02)",
  inputBg: "#ffffff",
  headerBg: "rgba(250,248,242,0.95)",
};

// ─── INTRO STYLES ──────────────────────────────────────────────────
const introStyles = {
  root: { position: "fixed", inset: 0, background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, fontFamily: "'Cormorant Garamond', serif" },
  center: { textAlign: "center", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" },
  ring: { transition: "all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  ringInner: { position: "absolute", fontSize: "32px", color: "#d4af37", filter: "drop-shadow(0 0 12px rgba(212,175,55,0.8))" },
  logoWrap: { transition: "all 1s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  logoText: { fontSize: "72px", fontWeight: "800", color: "#d4af37", letterSpacing: "16px", lineHeight: 1, textShadow: "0 0 40px rgba(212,175,55,0.4)" },
  logoDivider: { width: "200px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)" },
  subtitle: { transition: "all 0.8s ease", fontSize: "13px", color: "rgba(212,175,55,0.6)", letterSpacing: "6px" },
  subtext: { transition: "all 0.8s ease 0.2s", fontSize: "11px", color: "rgba(212,175,55,0.3)", letterSpacing: "3px" },
  progressWrap: { transition: "opacity 0.5s ease 0.4s", width: "200px", height: "1px", background: "rgba(212,175,55,0.1)", borderRadius: "1px", overflow: "hidden" },
  progressBar: { height: "100%", background: "linear-gradient(90deg, transparent, #d4af37)", transition: "width 1.8s ease 0.2s" },
};

// ─── APP STYLES ────────────────────────────────────────────────────
const appStyles = {
  root: { minHeight: "100vh", fontFamily: "'DM Mono', monospace", position: "relative", overflow: "hidden" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 48px", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  onlineDot: { width: "6px", height: "6px", borderRadius: "50%", animation: "pulse 2s infinite" },
  toggleBtn: { padding: "6px 14px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", letterSpacing: "1px", fontFamily: "'DM Mono', monospace" },
  main: { maxWidth: "1100px", margin: "0 auto", padding: "60px 32px 80px", position: "relative", zIndex: 1 },
  hero: { textAlign: "center", marginBottom: "64px" },
  heroEyebrow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "24px" },
  eyebrowLine: { flex: 1, maxWidth: "80px", height: "1px", background: "rgba(212,175,55,0.3)" },
  heroTitle: { fontSize: "clamp(40px, 6vw, 72px)", fontWeight: "700", fontFamily: "'Cormorant Garamond', serif", lineHeight: "1.1", marginBottom: "20px" },
  heroSub: { fontSize: "15px", letterSpacing: "0.5px", maxWidth: "500px", margin: "0 auto" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  panel: { borderRadius: "8px", padding: "28px" },
  panelLabel: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  dropZone: { borderRadius: "6px", padding: "40px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.3s" },
  browseBtn: { display: "inline-block", padding: "8px 24px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", letterSpacing: "2px", fontFamily: "'DM Mono', monospace", background: "transparent" },
  fileItem: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "4px", marginBottom: "6px" },
  textarea: { width: "100%", resize: "vertical", borderRadius: "6px", padding: "14px", fontSize: "12px", lineHeight: "1.7", letterSpacing: "0.3px", fontFamily: "'DM Mono', monospace", transition: "border 0.2s" },
  analyzeBtn: { background: "linear-gradient(135deg, #d4af37, #b8962e)", border: "none", color: "#080808", padding: "16px 48px", fontSize: "13px", fontWeight: "700", letterSpacing: "3px", borderRadius: "4px", cursor: "pointer", fontFamily: "'DM Mono', monospace", transition: "opacity 0.2s", boxShadow: "0 8px 32px rgba(212,175,55,0.25)" },
  errorBox: { background: "rgba(139,69,19,0.1)", color: "#cd853f", borderRadius: "4px", padding: "12px 20px", marginTop: "16px", fontSize: "13px", letterSpacing: "0.5px" },
  resultsHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" },
  outlineBtn: { padding: "8px 18px", borderRadius: "4px", background: "transparent", fontSize: "11px", cursor: "pointer", letterSpacing: "2px", fontFamily: "'DM Mono', monospace" },
  statsRow: { display: "flex", padding: "24px 0", marginBottom: "32px" },
  statCell: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  card: { borderRadius: "8px", padding: "28px", transition: "box-shadow 0.3s" },
  topBadge: { display: "inline-block", fontSize: "10px", color: "#d4af37", letterSpacing: "3px", marginBottom: "20px", padding: "6px 16px", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "3px", background: "rgba(212,175,55,0.05)" },
  cardBody: { display: "flex", justifyContent: "space-between", gap: "24px" },
  cardInfo: { flex: 1 },
  cardScore: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: "4px", minWidth: "100px" },
  footer: { textAlign: "center", padding: "24px", fontSize: "10px", letterSpacing: "2px", position: "relative", zIndex: 1 },
};
