import React, { useEffect, useState } from "react";
import api from "../api";
import mainLogo from "../assets/main_logo.jpg";
import anbuTextLogo from "../assets/anbu_text_logo.png";

const SERVICES = [
  {
    icon: "🔧",
    title: "RO System Installation",
    desc: "Secure, leakage-free mounting with pressure adjustment and initial TDS testing included.",
    duration: "1 – 1.5 Hours",
    color: "#0b6678",
  },
  {
    icon: "🔄",
    title: "Filter Replacement Service",
    desc: "Multi-stage filter swap (sediment, pre-carbon, post-carbon, UF membrane) with full cleaning.",
    duration: "45 – 60 Minutes",
    color: "#128299",
  },
  {
    icon: "📊",
    title: "TDS & Water Quality Test",
    desc: "Detailed analysis using calibrated TDS meters and pH indicators. Report provided instantly.",
    duration: "20 – 30 Minutes",
    color: "#2d9e6b",
  },
  {
    icon: "📅",
    title: "Annual Maintenance Contract",
    desc: "4 periodic visits, unlimited breakdown calls, and full replacement of consumable filters.",
    duration: "1-Year Validity",
    color: "#f1b32a",
  },
  {
    icon: "⚡",
    title: "Emergency Repair",
    desc: "Fast response for leaks, pressure drops, and pump failures. Same-day slots guaranteed.",
    duration: "Within 4 Hours",
    color: "#eb5968",
  },
  {
    icon: "🏗️",
    title: "Relocation Service",
    desc: "Safe dismantling, transport, and reinstallation of your RO system at a new address.",
    duration: "2 – 3 Hours",
    color: "#7c5cbf",
  },
];

const STEPS = [
  { n: "01", title: "Call to Book", desc: "Call or message our branch directly to schedule a visit at your convenience." },
  { n: "02", title: "Technician Dispatched", desc: "A certified technician from your nearest branch is assigned immediately." },
  { n: "03", title: "Diagnosis & Fix", desc: "TDS levels checked, fault isolated, and genuine parts installed." },
  { n: "04", title: "Quality Verified", desc: "Post-service water test confirms purity before the technician leaves." },
];

const Services = () => {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    // Fetch branches
    api.get("/branches/")
      .then((res) => {
        const d = res.data;
        setBranches(
          d && d.branches
            ? d.branches.filter((b) => b.is_active)
            : Array.isArray(d) ? d.filter((b) => b.is_active) : []
        );
      })
      .catch(() => {});
  }, []);

  const triggerCentralBooking = (serviceTitle) => {
    window.dispatchEvent(
      new CustomEvent("open-booking-modal", {
        detail: {
          product: "Other Service",
          issue: `I want to book the service: ${serviceTitle}`
        }
      })
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;1,9..144,700&display=swap');

        .svc-page {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: linear-gradient(168deg, #f0fafb 0%, #fefcf4 55%, #e9f6f8 100%);
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ---- HERO ---- */
        .svc-hero {
          position: relative;
          padding: 70px 28px 56px;
          text-align: center;
          overflow: hidden;
        }
        .svc-hero-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, rgba(11,102,120,0.08) 0%, transparent 70%);
          width: 600px; height: 600px;
          top: -180px; left: -160px;
          animation: orbF 14s ease-in-out infinite;
        }
        @keyframes orbF {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px,-30px) scale(1.04); }
        }
        .svc-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.6px; color: #0b6678;
          background: rgba(11,102,120,0.08); border: 1px solid rgba(11,102,120,0.16);
          padding: 5px 15px; border-radius: 100px; margin-bottom: 20px;
          animation: fadeUp 0.7s ease both;
        }
        .svc-hero-h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(2rem, 5.5vw, 3.4rem);
          font-weight: 800; line-height: 1.1; color: #0f172a;
          margin: 0 0 16px;
          animation: fadeUp 0.8s ease 0.1s both;
        }
        .svc-hero-h1 em {
          font-style: italic;
          background: linear-gradient(135deg, #0b6678 30%, #f1b32a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .svc-hero-sub {
          font-size: 1.05rem; color: #475569;
          max-width: 520px; margin: 0 auto 32px; line-height: 1.65;
          animation: fadeUp 0.9s ease 0.2s both;
        }

        /* ---- CONTACT STRIP ---- */
        .svc-contact-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          animation: fadeUp 1s ease 0.3s both;
        }
        .svc-contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 800;
          padding: 12px 28px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          transition: all 0.22s ease;
          box-shadow: 0 6px 20px rgba(11,102,120,0.3);
          color: #fff;
          background: linear-gradient(135deg, #0b6678, #128299);
        }
        .svc-contact-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(11,102,120,0.42);
        }

        /* ---- SECTION ---- */
        .svc-sec {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 28px 80px;
        }
        .svc-sec-hdr {
          border-bottom: 1.5px solid rgba(11,102,120,0.1);
          padding-bottom: 10px; margin-bottom: 28px;
        }
        .svc-sec-title {
          font-family: 'Fraunces', serif;
          font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0;
        }

        /* ---- STEPS TIMELINE ---- */
        .svc-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 28px;
          margin-bottom: 80px;
        }
        .svc-step {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(11,102,120,0.1);
          border-radius: 20px;
          padding: 24px 20px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.025);
          transition: all 0.26s ease;
        }
        .svc-step:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 32px rgba(11,102,120,0.11);
          border-color: rgba(11,102,120,0.2);
        }
        .svc-step-n {
          font-family: 'Fraunces', serif;
          font-size: 2.2rem; font-weight: 800;
          color: rgba(11,102,120,0.12); line-height: 1;
          margin-bottom: 10px;
        }
        .svc-step-title { font-size: 0.97rem; font-weight: 800; color: #0f172a; margin: 0 0 7px; }
        .svc-step-desc { font-size: 0.83rem; color: #64748b; line-height: 1.55; margin: 0; }

        /* ---- SERVICE CARDS ---- */
        .svc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 22px;
        }
        .svc-card {
          background: rgba(255,255,255,0.84);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 22px;
          padding: 26px 24px;
          display: flex; flex-direction: column;
          box-shadow: 0 4px 18px rgba(0,0,0,0.025);
          transition: all 0.28s ease;
          position: relative; overflow: hidden;
        }
        .svc-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--acc);
          border-radius: 22px 22px 0 0;
        }
        .svc-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(11,102,120,0.12);
          border-color: rgba(11,102,120,0.18);
        }
        .svc-card-icon {
          font-size: 1.8rem;
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .svc-card-title { font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
        .svc-card-desc { font-size: 0.84rem; color: #64748b; line-height: 1.55; margin: 0 0 18px; flex: 1; }
        .svc-card-footer {
          display: flex; justify-content: space-between; align-items: center;
          border-top: 1px dashed rgba(11,102,120,0.12);
          padding-top: 14px; gap: 8px;
        }
        .svc-card-meta { display: flex; flex-direction: column; gap: 2px; }
        .svc-card-dur { font-size: 12px; font-weight: 600; color: #94a3b8; }
        .svc-action-btn {
          display: inline-flex; align-items: center; gap: 4px;
          font-family: inherit; font-size: 12px; font-weight: 800;
          color: #fff; border: none;
          padding: 8px 18px; border-radius: 10px;
          cursor: pointer; text-decoration: none; white-space: nowrap;
          transition: opacity 0.2s, transform 0.18s;
          background: var(--acc);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .svc-action-btn:hover { opacity: 0.88; transform: translateY(-1px); }

        /* ---- BRANCHES ---- */
        .svc-branch-bg {
          background: linear-gradient(160deg, rgba(11,102,120,0.03), rgba(241,179,42,0.03));
          border-top: 1px solid rgba(11,102,120,0.07);
          border-bottom: 1px solid rgba(11,102,120,0.07);
        }
        .svc-branch-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .svc-branch-card {
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(11,102,120,0.1);
          border-radius: 16px; padding: 16px 18px;
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.02);
          transition: all 0.24s ease;
        }
        .svc-branch-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(11,102,120,0.1);
          border-color: rgba(11,102,120,0.2);
        }
        .svc-branch-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: linear-gradient(135deg, rgba(11,102,120,0.1), rgba(18,130,153,0.16));
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .svc-branch-name { font-size: 13.5px; font-weight: 800; color: #0f172a; margin: 0 0 2px; }
        .svc-branch-loc { font-size: 12px; color: #64748b; margin: 0; }

        /* ---- FOOTER ---- */
        .svc-footer {
          background: rgba(255,255,255,0.6);
          border-top: 1px solid rgba(11,102,120,0.07);
          padding: 20px 28px; text-align: center;
          font-size: 13px; color: #94a3b8;
        }

        @keyframes fadeUp {
          from { opacity:0; transform: translateY(18px); }
          to { opacity:1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .svc-steps { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .svc-steps { grid-template-columns: 1fr; padding: 0 18px; }
          .svc-hero { padding: 48px 18px 40px; }
          .svc-sec { padding: 0 16px 60px; }
          .svc-grid { grid-template-columns: 1fr; }
          .svc-branch-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="svc-page">

        {/* ===== BRAND HIGHLIGHT BANNER ===== */}
        <div style={{
          background: "linear-gradient(135deg, #020b18 0%, #061428 40%, #0a1e3a 70%, #020b18 100%)",
          borderBottom: "3px solid rgba(0,168,232,0.5)",
          padding: "36px 24px 32px",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: "16px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"500px",height:"200px",background:"radial-gradient(ellipse, rgba(0,168,232,0.18) 0%, transparent 70%)",pointerEvents:"none" }} />
          <div style={{ display:"flex",alignItems:"center",gap:"22px",flexWrap:"wrap",justifyContent:"center",zIndex:1 }}>
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute",inset:"-6px",borderRadius:"22px",background:"linear-gradient(135deg, #00a8e8, #f5d800, #00a8e8)",backgroundSize:"300% 300%",animation:"gradShift 3s ease infinite",opacity:0.75,filter:"blur(4px)" }} />
              <img src={mainLogo} alt="Anbu Logo" style={{ width:"90px",height:"90px",borderRadius:"16px",objectFit:"cover",border:"3px solid rgba(0,168,232,0.6)",display:"block",position:"relative",zIndex:1 }} />
            </div>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-start",gap:"5px" }}>
              <img src={anbuTextLogo} alt="ANBU" style={{ height:"5.5rem",width:"auto",objectFit:"contain",background:"none",filter:"drop-shadow(0 0 12px rgba(0,168,232,0.7))" }} />
              <span style={{ fontFamily:"'Bauhaus 93','Outfit','Arial Black',sans-serif",fontSize:"1.5rem",fontWeight:900,color:"#fff",letterSpacing:"5px",textTransform:"uppercase",textShadow:"0 0 20px rgba(0,168,232,0.6)",marginTop:"-10px",lineHeight:1 }}>ENTERPRISES</span>
              <span style={{ background:"linear-gradient(90deg,#f5d800,#ffaa00)",color:"#000",fontFamily:"'Arial Black',Arial,sans-serif",fontSize:"0.78rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"2px",padding:"5px 14px",borderRadius:"5px",boxShadow:"0 4px 12px rgba(245,216,0,0.5)",marginTop:"2px" }}>Sales &amp; Service</span>
            </div>
          </div>
          <p style={{ color:"rgba(0,168,232,0.9)",fontSize:"0.88rem",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,margin:0,letterSpacing:"0.5px",textAlign:"center",zIndex:1 }}>🔧 Expert Water Purification Services &amp; Repairs · Available 24/7</p>
          <style>{`@keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}`}</style>
        </div>

        {/* ===== HERO ===== */}
        <section className="svc-hero">
          <div className="svc-hero-orb" />
          <div className="svc-hero-eyebrow">🛠️ Our Capabilities</div>
          <h1 className="svc-hero-h1">Expert Water <em>Services</em></h1>
          <p className="svc-hero-sub">
            Certified diagnostics, filter replacements, repairs and yearly AMC contracts — backed by trained professionals.
          </p>

          <div className="svc-contact-strip">
            <button className="svc-contact-btn" onClick={() => triggerCentralBooking("General Service")}>
              ⚡ Book Service / Inquiry
            </button>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "40px 28px 20px" }}>
          <div className="svc-sec-hdr">
            <h2 className="svc-sec-title">How It Works</h2>
          </div>
        </div>
        <div className="svc-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="svc-step">
              <div className="svc-step-n">{s.n}</div>
              <h3 className="svc-step-title">{s.title}</h3>
              <p className="svc-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* ===== SERVICES ===== */}
        <div className="svc-sec">
          <div className="svc-sec-hdr">
            <h2 className="svc-sec-title">Our Services</h2>
          </div>
          <div className="svc-grid">
            {SERVICES.map((svc) => (
              <div key={svc.title} className="svc-card" style={{ "--acc": svc.color }}>
                <div
                  className="svc-card-icon"
                  style={{ background: `${svc.color}18` }}
                >
                  {svc.icon}
                </div>
                <h3 className="svc-card-title">{svc.title}</h3>
                <p className="svc-card-desc">{svc.desc}</p>
                <div className="svc-card-footer">
                  <div className="svc-card-meta">
                    <span className="svc-card-dur">⏱ {svc.duration}</span>
                  </div>
                  <button
                    className="svc-action-btn"
                    style={{ "--acc": svc.color }}
                    onClick={() => triggerCentralBooking(svc.title)}
                  >
                    ⚡ Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== BRANCHES ===== */}
        {branches.length > 0 && (
          <div className="svc-branch-bg">
            <div className="svc-sec" style={{ paddingTop: "56px" }}>
              <div className="svc-sec-hdr">
                <h2 className="svc-sec-title">Locate Nearest Service Center</h2>
              </div>
              <div className="svc-branch-grid">
                {branches.map((b) => (
                  <div key={b.branch_id || b.id} className="svc-branch-card">
                    <div className="svc-branch-icon">📍</div>
                    <div>
                      <p className="svc-branch-name">{b.name}</p>
                      <p className="svc-branch-loc">{b.location || "Location coming soon"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <footer className="svc-footer">
          © {new Date().getFullYear()} Anbu Enterprises — All rights reserved.
        </footer>
      </div>
    </>
  );
};

export default Services;
