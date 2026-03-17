import { useState, useEffect, useRef } from "react";

// ── tiny inline CSS injected once ──────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .ll-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #eef2ff;
    color: #1e1b4b;
    overflow-x: hidden;
  }

  /* ── scroll reveal ── */
  .reveal { opacity: 0; transform: translateY(22px); transition: opacity .6s ease, transform .6s ease; }
  .reveal.in  { opacity: 1; transform: translateY(0); }

  /* ── hero entrance ── */
  @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  .hu1 { animation: fadeUp .65s ease .05s both; }
  .hu2 { animation: fadeUp .65s ease .18s both; }
  .hu3 { animation: fadeUp .65s ease .30s both; }
  .hu4 { animation: fadeUp .65s ease .42s both; }
  .hu5 { animation: fadeUp .65s ease .54s both; }

  /* ── float ── */
  @keyframes bob  { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-9px)} }
  @keyframes bob2 { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-6px)} }
  .bob  { animation: bob  5s ease-in-out infinite; }
  .bob2 { animation: bob2 6.5s ease-in-out 1.2s infinite; }

  /* ── live dot ── */
  @keyframes livePulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,.45); }
    60%     { box-shadow: 0 0 0 5px rgba(34,197,94,0);  }
  }
  .live-dot {
    width:8px; height:8px; border-radius:50%;
    background:#22c55e;
    display:inline-block;
    animation: livePulse 1.8s ease infinite;
  }

  /* ── chat message slide ── */
  @keyframes msgSlide { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  .m1 { animation: msgSlide .35s ease 1.4s both; }
  .m2 { animation: msgSlide .35s ease 2.0s both; }
  .m3 { animation: msgSlide .35s ease 2.6s both; }

  /* ── nav scroll ── */
  .nav-base {
    background: rgba(238,242,255,.82);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid transparent;
    transition: background .3s, border-color .3s, box-shadow .3s;
  }
  .nav-scrolled {
    background: rgba(255,255,255,.92) !important;
    border-color: rgba(99,102,241,.1) !important;
    box-shadow: 0 2px 18px rgba(99,102,241,.08) !important;
  }

  /* ── buttons ── */
  .btn-solid {
    background: #4f46e5;
    color: #fff;
    border: 1.5px solid #4f46e5;
    transition: background .2s, transform .2s, box-shadow .2s;
  }
  .btn-solid:hover { background: #4338ca; border-color:#4338ca; transform:translateY(-1px); box-shadow:0 6px 18px rgba(79,70,229,.28); }

  .btn-outline {
    background: #fff;
    color: #4f46e5;
    border: 1.5px solid #c7d2fe;
    transition: background .2s, border-color .2s, transform .2s;
  }
  .btn-outline:hover { background:#f0f4ff; border-color:#818cf8; transform:translateY(-1px); }

  .btn-white {
    background: #fff;
    color: #4338ca;
    border: 1.5px solid #fff;
    transition: background .2s, transform .2s, box-shadow .2s;
  }
  .btn-white:hover { background:#eef2ff; transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.12); }

  .btn-ghost-inv {
    background: rgba(255,255,255,.12);
    color: #fff;
    border: 1.5px solid rgba(255,255,255,.3);
    transition: background .2s, transform .2s;
  }
  .btn-ghost-inv:hover { background:rgba(255,255,255,.2); transform:translateY(-1px); }

  /* ── cards ── */
  .feat-card {
    background:#fff; border:1px solid #e0e7ff;
    border-radius:18px; padding:26px;
    transition: transform .3s ease, box-shadow .3s ease, border-color .3s;
  }
  .feat-card:hover { transform:translateY(-5px); box-shadow:0 14px 40px rgba(99,102,241,.12); border-color:#c7d2fe; }

  .role-card {
    background:#fff; border-radius:22px; padding:36px;
    border:1.5px solid #e0e7ff;
    box-shadow: 0 4px 24px rgba(99,102,241,.07);
    transition: transform .3s ease, box-shadow .3s;
  }
  .role-card:hover { transform:translateY(-4px); box-shadow:0 14px 44px rgba(99,102,241,.14); }

  .step-card {
    background:#fff; border-radius:18px; padding:28px;
    border:1px solid #e0e7ff;
    box-shadow: 0 2px 16px rgba(99,102,241,.06);
  }

  .testi-card {
    background:#fff; border-radius:18px; padding:28px;
    border:1px solid #e0e7ff;
    box-shadow: 0 2px 14px rgba(99,102,241,.06);
    transition: transform .3s ease;
  }
  .testi-card:hover { transform:translateY(-4px); }

  /* ── video tile ── */
  .vtile {
    border-radius:12px; overflow:hidden; position:relative;
    background: linear-gradient(135deg,#1e1b4b,#2e2770);
  }
  .vtile::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.45) 100%);
  }

  /* ── toolbar btn ── */
  .tb { width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .18s,background .18s; }
  .tb:hover { transform:scale(1.08); }
  .tb-on  { background:rgba(79,70,229,.12); color:#4f46e5; }
  .tb-off { background:rgba(239,68,68,.1);  color:#ef4444; }
  .tb-end { background:#ef4444; color:#fff; }
  .tb-neu { background:rgba(99,102,241,.09); color:#4f46e5; }

  /* ── avatar ── */
  .av { border-radius:50%; display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;border:2px solid #fff;flex-shrink:0; }

  /* ── section label ── */
  .sec-label { font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6366f1; }

  /* ── gradient text ── */
  .gt { background:linear-gradient(130deg,#4f46e5,#818cf8); -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent; }

  /* ── stat badge ── */
  .stat-b { background:#fff;border-radius:14px;padding:16px 22px;text-align:center;border:1px solid #e0e7ff;box-shadow:0 2px 14px rgba(99,102,241,.07); }

  /* ── badge pill ── */
  .pill { display:inline-flex;align-items:center;gap:6px;background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.18);color:#4f46e5;padding:5px 14px;border-radius:999px;font-size:12.5px;font-weight:600; }

  /* ── check ── */
  .chk { width:22px;height:22px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px; }

  /* ── float label (mockup) ── */
  .fl-lbl { background:#fff;border-radius:11px;padding:8px 13px;font-size:11.5px;font-weight:600;display:flex;align-items:center;gap:6px;box-shadow:0 6px 20px rgba(0,0,0,.1); }

  /* ── dashed connector ── */
  .dashed { border-left:2px dashed rgba(99,102,241,.2);height:36px;margin-left:20px; }

  /* ── feature icon bg ── */
  .fi { width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;margin-bottom:16px; }

  /* ── step number ── */
  .snum { width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:17px;flex-shrink:0;background:linear-gradient(135deg,#4f46e5,#6d28d9); }

  /* ── footer ── */
  .footer-link { font-size:13.5px;color:#6b7280;transition:color .2s;display:block;margin-bottom:10px; }
  .footer-link:hover { color:#4f46e5; }

  /* ── mobile menu ── */
  .mob-menu { background:rgba(255,255,255,.96);backdrop-filter:blur(16px);border-top:1px solid #e0e7ff;padding:16px 24px 20px; }
`;

// ── inject styles once ──────────────────────────────────────────
function useStyles() {
  useEffect(() => {
    if (document.getElementById("ll-styles")) return;
    const tag = document.createElement("style");
    tag.id = "ll-styles";
    tag.textContent = globalStyles;
    document.head.appendChild(tag);
  }, []);
}

// ── scroll reveal hook ──────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ── small SVG icons ─────────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = "currentColor", sw = 2, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const Check = ({ color = "#4f46e5" }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>
);

// ── Avatar component ─────────────────────────────────────────────
const Av = ({ label, bg, size = 38, fontSize = 12 }) => (
  <div className="av" style={{ width: size, height: size, background: bg, fontSize }}>{label}</div>
);

// ── Navbar ───────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 28);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = ["Features", "How It Works", "Roles"];

  const scrollTo = (id) => {
    document.getElementById(id.toLowerCase().replace(/ /g, "-"))?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <nav className={`nav-base ${scrolled ? "nav-scrolled" : ""}`}
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#4f46e5,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <span style={{ fontSize: 19, fontWeight: 800, color: "#1e1b4b", letterSpacing: "-0.025em" }}>ACADLY</span>
        </a>

        {/* Desktop links */}
        <div style={{ display: "flex", gap: 30 }} className="nav-links">
          {links.map((l) => (
            <button key={l} onClick={() => scrollTo(l)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#64748b", fontFamily: "inherit", transition: "color .2s" }}
              onMouseEnter={e => e.target.style.color = "#4f46e5"}
              onMouseLeave={e => e.target.style.color = "#64748b"}>
              {l}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 10 }} className="nav-ctas">
          <a href="/login" className="btn-outline" style={{ padding: "8px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", fontFamily: "inherit" }}>Sign In</a>
          <a href="/register" className="btn-solid" style={{ padding: "8px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", fontFamily: "inherit" }}>Get Started</a>
        </div>

        {/* Hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "none" }}
          className="hamburger">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e1b4b" strokeWidth={2.2} strokeLinecap="round">
            {mobileOpen
              ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mob-menu">
          {links.map((l) => (
            <button key={l} onClick={() => scrollTo(l)}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "10px 0", fontSize: 14.5, fontWeight: 500, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}>
              {l}
            </button>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <a href="/login" className="btn-outline" style={{ flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none", fontFamily: "inherit" }}>Sign In</a>
            <a href="/register" className="btn-solid" style={{ flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none", fontFamily: "inherit" }}>Get Started</a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 820px) { .nav-links, .nav-ctas { display: none !important; } }
        @media (min-width: 821px) { .hamburger { display: none !important; } }
      `}</style>
    </nav>
  );
}

// ── Classroom Mockup ─────────────────────────────────────────────
function ClassroomMockup() {
  return (
    <div className="bob" style={{ filter: "drop-shadow(0 24px 48px rgba(99,102,241,.16))", position: "relative" }}>
      <div style={{ background: "#fff", borderRadius: 24, border: "1.5px solid #e0e7ff", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: "#f8f8ff", borderBottom: "1px solid #e8eaf6", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#4f46e5,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.3}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Advanced Mathematics</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
                <span className="live-dot" />
                <span style={{ fontWeight: 600, color: "#16a34a" }}>LIVE</span>
                <span>·</span>
                <span>Code: <b style={{ color: "#4f46e5" }}>MATH-4F2A</b></span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#ecfdf5", color: "#15803d", padding: "4px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, border: "1px solid #bbf7d0" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            24 joined
          </div>
        </div>

        {/* Video grid */}
        <div style={{ padding: 14, background: "#eef2ff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
            {/* Teacher tile */}
            <div className="vtile" style={{ height: 150 }}>
              <div style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Av label="PS" bg="linear-gradient(135deg,#4f46e5,#6d28d9)" size={50} fontSize={17} />
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, padding: "8px 10px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div style={{ background: "#fff", borderRadius: 8, padding: "4px 9px", fontSize: 10.5, fontWeight: 600, color: "#1e1b4b", display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="#4f46e5"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /></svg>Prof. Sarah K.
                </div>
                <div style={{ background: "rgba(79,70,229,.9)", borderRadius: 7, padding: "3px 8px", fontSize: 9.5, fontWeight: 700, color: "#fff", display: "flex", gap: 4, alignItems: "center" }}>
                  <span className="live-dot" style={{ width: 5, height: 5 }} />HOST
                </div>
              </div>
            </div>

            {/* Student tiles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[{ label: "AR", bg: "linear-gradient(135deg,#0ea5e9,#4f46e5)", name: "Alex R." }, { label: "MP", bg: "linear-gradient(135deg,#22c55e,#0ea5e9)", name: "Maya P." }].map(s => (
                <div key={s.label} className="vtile" style={{ height: 70 }}>
                  <div style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Av label={s.label} bg={s.bg} size={30} fontSize={10} /></div>
                  <div style={{ position: "absolute", bottom: 5, left: 7, zIndex: 2, fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,.75)" }}>{s.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 2px 10px rgba(99,102,241,.09)" }}>
            {[
              { cls: "tb-on",  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>, title: "Mic" },
              { cls: "tb-on",  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>, title: "Cam" },
              { cls: "tb-neu", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, title: "Screen" },
              { cls: "tb-neu", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title: "Chat" },
              { cls: "tb-neu", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, title: "React" },
              { cls: "tb-end", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07C8.44 17.44 5.8 14.79 4.19 11.61a19.73 19.73 0 0 1-3.07-8.67A2 2 0 0 1 3.1 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.07 8.9"/><line x1="23" y1="1" x2="1" y2="23"/></svg>, title: "End" },
            ].map((t) => (
              <div key={t.title} className={`tb ${t.cls}`} title={t.title}>{t.icon}</div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ background: "#f8f8ff", borderRadius: 16, padding: 12, border: "1px solid #e8eaf6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.09em" }}>Live Chat</span>
              <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>24 online</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { cls: "m1", av: { label: "AR", bg: "linear-gradient(135deg,#0ea5e9,#4f46e5)" }, name: "Alex", msg: "Great explanation! 🙌", nameColor: "#0ea5e9", bubble: "#fff", textColor: "#374151" },
                { cls: "m2", av: { label: "JD", bg: "linear-gradient(135deg,#f59e0b,#ef4444)" }, name: "Jay", msg: "Can you share your screen?", nameColor: "#f59e0b", bubble: "#fff", textColor: "#374151" },
                { cls: "m3", av: { label: "PS", bg: "linear-gradient(135deg,#4f46e5,#6d28d9)" }, name: "Prof", msg: "Sure! One second 👍", nameColor: "#4f46e5", bubble: "linear-gradient(135deg,#4f46e5,#6d28d9)", textColor: "#fff" },
              ].map((m) => (
                <div key={m.name} className={m.cls} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  <Av label={m.av.label} bg={m.av.bg} size={22} fontSize={8} />
                  <div style={{ background: m.bubble, borderRadius: "9px 9px 9px 2px", padding: "5px 9px", fontSize: 11, color: m.textColor, boxShadow: m.bubble === "#fff" ? "0 1px 4px rgba(0,0,0,.06)" : "0 2px 8px rgba(79,70,229,.25)" }}>
                    <b style={{ color: m.nameColor }}>{m.name}: </b>{m.msg}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
              <div style={{ flex: 1, background: "#fff", border: "1px solid #e0e7ff", borderRadius: 10, padding: "7px 11px", fontSize: 11.5, color: "#94a3b8" }}>Type a message...</div>
              <button style={{ width: 32, height: 32, borderRadius: 10, background: "#4f46e5", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating code badge */}
      <div className="bob2 fl-lbl" style={{ position: "absolute", top: -14, right: -14, zIndex: 10, border: "1.5px solid #e0e7ff", boxShadow: "0 8px 20px rgba(99,102,241,.18)" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth={2.2} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        <span style={{ color: "#374151" }}>Code: </span>
        <span style={{ color: "#4f46e5", fontWeight: 800, letterSpacing: "0.04em" }}>MATH-4F2A</span>
      </div>

      {/* Floating students badge */}
      <div className="bob fl-lbl" style={{ position: "absolute", bottom: -14, left: -14, zIndex: 10, border: "1.5px solid #bbf7d0", boxShadow: "0 8px 20px rgba(34,197,94,.14)" }}>
        <span className="live-dot" />
        <span style={{ color: "#16a34a", fontWeight: 700 }}>24 students live</span>
      </div>
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ minHeight: "100vh", paddingTop: 96, paddingBottom: 80, display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
      {/* bg blobs */}
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(99,102,241,.1)", filter: "blur(90px)", top: -100, right: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "rgba(139,92,246,.07)", filter: "blur(80px)", bottom: 60, left: -80, pointerEvents: "none" }} />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", width: "100%", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="hero-grid">

          {/* Left */}
          <div>
            <div className="hu1 pill" style={{ marginBottom: 22, display: "inline-flex" }}>
              <span className="live-dot" />
              WebRTC · Real-Time Learning
            </div>

            <h1 className="hu2" style={{ fontSize: "clamp(2.5rem,4.5vw,3.6rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.035em", color: "#0f172a", marginBottom: 20 }}>
              Where Students<br />&amp; Teachers
              <br />
              <span style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontWeight: 600 }} className="gt">
                Connect Live
              </span>
            </h1>

            <p className="hu3" style={{ fontSize: 17, color: "#64748b", lineHeight: 1.7, maxWidth: 440, marginBottom: 32, fontWeight: 400 }}>
              Real-time video classrooms with screen sharing, live chat, and reactions. Teachers go live, students join with a code.
            </p>

            <div className="hu4" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
              <a href="/register?role=teacher" className="btn-solid"
                style={{ padding: "12px 26px", borderRadius: 13, fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 15V9l7 3.5z" /></svg>
                Start Teaching Free
              </a>
              <a href="/register?role=student" className="btn-outline"
                style={{ padding: "12px 26px", borderRadius: 13, fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                Join as Student
              </a>
            </div>

            {/* Social proof */}
            <div className="hu5" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex" }}>
                {[
                  { label: "SK", bg: "linear-gradient(135deg,#4f46e5,#6d28d9)" },
                  { label: "AR", bg: "linear-gradient(135deg,#0ea5e9,#4f46e5)" },
                  { label: "MP", bg: "linear-gradient(135deg,#f59e0b,#ef4444)" },
                  { label: "JD", bg: "linear-gradient(135deg,#22c55e,#0ea5e9)" },
                ].map((a, i) => (
                  <Av key={a.label} label={a.label} bg={a.bg} size={36} fontSize={11}
                    style={{ marginLeft: i === 0 ? 0 : -8 }} />
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 1, marginBottom: 2 }}>{"★★★★★".split("").map((s, i) => <span key={i} style={{ color: "#f59e0b", fontSize: 13 }}>{s}</span>)}</div>
                <div style={{ fontSize: 12.5, color: "#94a3b8", fontWeight: 500 }}>
                  Trusted by <span style={{ color: "#4f46e5", fontWeight: 700 }}>50,000+</span> students &amp; teachers
                </div>
              </div>
            </div>
          </div>

          {/* Right: mockup */}
          <div style={{ position: "relative" }}>
            <ClassroomMockup />
          </div>
        </div>

        {/* ── Stats Cards — COMMENTED OUT ──
        <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 64 }}>
          {[
            { val: "50K+", label: "Active Students" },
            { val: "8,000+", label: "Classes Created" },
            { val: "<50ms", label: "Stream Latency" },
            { val: "99.9%", label: "Uptime" },
          ].map((s) => (
            <div key={s.label} className="stat-b">
              <div className="gt" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 3 }}>{s.val}</div>
              <div style={{ fontSize: 12.5, color: "#94a3b8", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
        ── Stats Cards End ── */}

      </div>

      <style>{`
        @media (max-width: 820px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}

// ── Features ─────────────────────────────────────────────────────
const featuresData = [
  // { title: "HD Video & Audio", desc: "Peer-to-peer WebRTC streaming with sub-50ms latency. Crystal-clear quality, no plugins, no downloads.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth={1.8} strokeLinecap="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>, bg: "rgba(79,70,229,.08)", border: "rgba(79,70,229,.14)" },
  // { title: "Screen Sharing", desc: "Share your entire screen, a window, or browser tab. Perfect for presentations, slides, and code demos.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth={1.8} strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>, bg: "rgba(124,58,237,.08)", border: "rgba(124,58,237,.14)" },
  { title: "Live Chat", desc: "Real-time messaging for every classroom. Students ask questions, teachers respond — all without interrupting.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth={1.8} strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, bg: "rgba(14,165,233,.08)", border: "rgba(14,165,233,.14)" },
  { title: "Session Codes", desc: "Teachers get a unique 8-digit code. Students paste it and join — zero friction, no linking required.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>, bg: "rgba(245,158,11,.08)", border: "rgba(245,158,11,.14)" },
  { title: "Role-Based Access", desc: "JWT-secured auth with Teacher/Student/Admin roles. Each role has distinct permissions and a tailored dashboard.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.8} strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, bg: "rgba(239,68,68,.08)", border: "rgba(239,68,68,.14)" },
  { title: "White Board", desc: "Students send emoji reactions in real-time. Teachers instantly gauge who's engaged, confused, or excited.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>, bg: "rgba(34,197,94,.08)", border: "rgba(34,197,94,.14)" },
  { title: "Poll Doubt", desc: "Students send emoji reactions in real-time. Teachers instantly gauge who's engaged, confused, or excited.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>, bg: "rgba(34,197,94,.08)", border: "rgba(34,197,94,.14)" },
    { title: "Transcript", desc: "Students send emoji reactions in real-time. Teachers instantly gauge who's engaged, confused, or excited.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>, bg: "rgba(34,197,94,.08)", border: "rgba(34,197,94,.14)" },


];

function Features() {
  return (
    <section id="features" style={{ padding: "96px 0", position: "relative" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="sec-label" style={{ marginBottom: 10 }}>Platform Features</div>
          <h2 style={{ fontSize: "clamp(1.9rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: 14 }}>
            Everything for a{" "}
            <span style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontWeight: 600 }} className="gt">perfect class</span>
          </h2>
          <p style={{ color: "#64748b", maxWidth: 480, margin: "0 auto", lineHeight: 1.7, fontSize: 15.5 }}>
            Built for the student–teacher relationship. Every tool designed to make live learning effortless.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }} className="feat-grid reveal">
          {featuresData.map((f) => (
            <div key={f.title} className="feat-card">
              <div className="fi" style={{ background: f.bg, border: `1px solid ${f.border}` }}>{f.icon}</div>
              <h3 style={{ fontSize: 15.5, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:900px){.feat-grid{grid-template-columns:1fr 1fr!important;}} @media(max-width:580px){.feat-grid{grid-template-columns:1fr!important;}}`}</style>
    </section>
  );
}

// ── Roles ────────────────────────────────────────────────────────
const teacherPoints = [
  "Create a class and get a unique Session Code instantly",
  "Stream HD video, audio & share your screen for presentations",
  "See live reactions & chat from all students in real-time",
  "Manage, edit, and delete your classes from the Dashboard",
];
const studentPoints = [
  "Enter the teacher's Session Code to join any live class",
  "Watch live video and screen share in real-time",
  "Ask questions via chat or send emoji reactions",
  "View all enrolled classes on your personal Dashboard",
];

function Roles() {
  return (
    <section id="roles" style={{ padding: "96px 0", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent,rgba(99,102,241,.025) 50%,transparent)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="sec-label" style={{ marginBottom: 10 }}>Built For Everyone</div>
          <h2 style={{ fontSize: "clamp(1.9rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: 14 }}>
            One platform,{" "}
            <span style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontWeight: 600 }} className="gt">two experiences</span>
          </h2>
          <p style={{ color: "#64748b", maxWidth: 420, margin: "0 auto", lineHeight: 1.7, fontSize: 15.5 }}>
            Whether you're teaching or learning, LearnLive is designed to work perfectly for your role.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="roles-grid reveal">
          {/* Teacher */}
          <div className="role-card">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 15, background: "linear-gradient(135deg,#4f46e5,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 15V9l7 3.5z" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>For Teachers</div>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Host live classrooms with full control</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {teacherPoints.map((p) => (
                <div key={p} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div className="chk" style={{ background: "rgba(79,70,229,.1)" }}><Check color="#4f46e5" /></div>
                  <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>{p}</p>
                </div>
              ))}
            </div>
            <a href="/register?role=teacher" className="btn-solid"
              style={{ marginTop: 28, padding: "11px 24px", borderRadius: 13, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit" }}>
              Register as Teacher
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>

          {/* Student */}
          <div className="role-card" style={{ borderColor: "#c7d2fe" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 15, background: "linear-gradient(135deg,#0ea5e9,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>For Students</div>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Join live classes in seconds</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {studentPoints.map((p) => (
                <div key={p} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div className="chk" style={{ background: "rgba(14,165,233,.1)" }}><Check color="#0ea5e9" /></div>
                  <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>{p}</p>
                </div>
              ))}
            </div>
            <a href="/register?role=student"
              style={{ marginTop: 28, padding: "11px 24px", borderRadius: 13, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit", background: "rgba(79,70,229,.07)", color: "#4f46e5", border: "1.5px solid #c7d2fe", transition: "background .2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(79,70,229,.13)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(79,70,229,.07)"}>
              Register as Student
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:700px){.roles-grid{grid-template-columns:1fr!important;}}`}</style>
    </section>
  );
}

// ── How It Works ─────────────────────────────────────────────────
const teacherSteps = [
  { n: 1, title: "Register as Teacher", desc: "Create your account and select the Teacher role. Unlock class creation and full session controls." },
  { n: 2, title: "Create a Class", desc: "Click 'Create Class' on your dashboard. Instantly receive an 8-character session code to share." },
  { n: 3, title: "Go Live!", desc: "Enter the classroom, enable camera & mic, share your screen. Students connect via WebRTC automatically." },
];
const studentSteps = [
  { n: 1, title: "Register as Student", desc: "Create your account with the Student role. Access your personal class dashboard right away." },
  { n: 2, title: "Enter Session Code", desc: "Your teacher shares the code. Paste it in the 'Join Class' field on your dashboard and hit join." },
  { n: 3, title: "Start Learning!", desc: "Watch the live stream, participate in chat, and send reactions. Fully interactive learning." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "96px 0" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="sec-label" style={{ marginBottom: 10 }}>How It Works</div>
          <h2 style={{ fontSize: "clamp(1.9rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: 14 }}>
            Go live in{" "}
            <span style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontWeight: 600 }} className="gt">under a minute</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="steps-grid reveal">
          {[
            { label: "👩‍🏫 Teacher Flow", steps: teacherSteps, numBg: "linear-gradient(135deg,#4f46e5,#6d28d9)" },
            { label: "👨‍🎓 Student Flow", steps: studentSteps, numBg: "linear-gradient(135deg,#0ea5e9,#4f46e5)" },
          ].map((flow) => (
            <div key={flow.label}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>{flow.label}</div>
              <div>
                {flow.steps.map((s, i) => (
                  <div key={s.n}>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div className="snum" style={{ background: flow.numBg }}>{s.n}</div>
                        {i < flow.steps.length - 1 && <div className="dashed" />}
                      </div>
                      <div style={{ paddingBottom: i < flow.steps.length - 1 ? 24 : 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>{s.title}</div>
                        <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}>{s.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:680px){.steps-grid{grid-template-columns:1fr!important;}}`}</style>
    </section>
  );
}

// ── Testimonials ─────────────────────────────────────────────────
const testiData = [
  { av: { label: "SK", bg: "linear-gradient(135deg,#4f46e5,#6d28d9)" }, name: "Sarah Kim", role: "Mathematics Teacher", stars: 5, quote: "The session code system is brilliant. I create a class, share the code on WhatsApp, and within seconds all my students are in the live room. Zero friction." },
  { av: { label: "AR", bg: "linear-gradient(135deg,#0ea5e9,#4f46e5)" }, name: "Alex Rodriguez", role: "Software Engineering Tutor", stars: 5, quote: "Screen sharing for coding tutorials is flawless. Students see my IDE in real-time and the live chat lets them ask questions without interrupting my flow.", highlight: true },
  { av: { label: "MP", bg: "linear-gradient(135deg,#22c55e,#0ea5e9)" }, name: "Maya Patel", role: "CS Student, Year 2", stars: 5, quote: "I just enter a code and I'm in. The reactions feature makes class feel alive — sending a 🔥 when a concept clicks is so much better than just staring at a screen." },
];

function Testimonials() {
  return (
    <section id="testimonials" style={{ padding: "96px 0", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 40% at 50% 50%,rgba(99,102,241,.04),transparent)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 52 }}>
          <div className="sec-label" style={{ marginBottom: 10 }}>Testimonials</div>
          <h2 style={{ fontSize: "clamp(1.9rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a" }}>
            Loved by teachers &amp;{" "}
            <span style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontWeight: 600 }} className="gt">students alike</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }} className="testi-grid reveal">
          {testiData.map((t) => (
            <div key={t.name} className="testi-card" style={t.highlight ? { borderColor: "#c7d2fe", boxShadow: "0 6px 28px rgba(99,102,241,.12)" } : {}}>
              <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>{"★".repeat(t.stars).split("").map((s, i) => <span key={i} style={{ color: "#f59e0b", fontSize: 14 }}>{s}</span>)}</div>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, marginBottom: 18 }}>"{t.quote}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Av label={t.av.label} bg={t.av.bg} size={38} fontSize={12} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:820px){.testi-grid{grid-template-columns:1fr!important;}}`}</style>
    </section>
  );
}

// ── CTA Banner ───────────────────────────────────────────────────
function CTABanner() {
  return (
    <section style={{ padding: "0 24px 96px" }}>
      <div className="reveal" style={{ maxWidth: 1120, margin: "0 auto", background: "linear-gradient(135deg,#4f46e5,#6d28d9)", borderRadius: 28, padding: "60px 40px", textAlign: "center", boxShadow: "0 20px 60px rgba(79,70,229,.28)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", marginBottom: 12 }}>Start Today — It's Free</div>
        <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 12 }}>
          Ready to go{" "}
          <span style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontWeight: 600 }}>live?</span>
        </h2>
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: 16, lineHeight: 1.7, maxWidth: 400, margin: "0 auto 32px" }}>
          Create your first classroom in under 60 seconds. Or join as a student with a session code.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/register?role=teacher" className="btn-white"
            style={{ padding: "12px 28px", borderRadius: 13, fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 15V9l7 3.5z" /></svg>
            Start as Teacher
          </a>
          <a href="/register?role=student" className="btn-ghost-inv"
            style={{ padding: "12px 28px", borderRadius: 13, fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
            Join as Student
          </a>
        </div>
        <p style={{ color: "rgba(255,255,255,.35)", fontSize: 12, marginTop: 18 }}>No credit card required · Free plan available</p>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { heading: "Product", links: [["Features", "#features"], ["How It Works", "#how-it-works"], ["Changelog", "#"]] },
    { heading: "Roles", links: [["For Teachers", "/register?role=teacher"], ["For Students", "/register?role=student"], ["For Institutes", "#"]] },
    { heading: "Links", links: [["GitHub", "#"], ["Sign In", "/login"], ["Privacy Policy", "#"]] },
  ];
  return (
    <footer style={{ borderTop: "1px solid #e0e7ff", padding: "60px 24px 40px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }} className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#4f46e5,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 09 3 12 0v-5" /></svg>
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>LearnLive</span>
            </div>
            <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.75 }}>Real-time video classrooms for students &amp; teachers.</p>
          </div>
          {cols.map((c) => (
            <div key={c.heading}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>{c.heading}</div>
              {c.links.map(([label, href]) => (
                <a key={label} href={href} className="footer-link">{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #e0e7ff", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>© 2025 Acadly.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="live-dot" style={{ width: 7, height: 7 }} />
            <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>All systems operational</span>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:700px){.footer-grid{grid-template-columns:1fr 1fr!important;}} @media(max-width:420px){.footer-grid{grid-template-columns:1fr!important;}}`}</style>
    </footer>
  );
}

// ── Main Export ──────────────────────────────────────────────────
export default function LandingPage() {
  useStyles();
  useReveal();

  return (
    <div className="ll-root">
      <Navbar />
      <Hero />
      <Features />
      <Roles />
      <HowItWorks />
      {/* ── Testimonials Section — COMMENTED OUT ──
      <Testimonials />
      ── Testimonials Section End ── */}
      <CTABanner />
      <Footer />
    </div>
  );
}