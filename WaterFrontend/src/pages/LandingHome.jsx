import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import mainLogo from "../assets/main_logo.jpg";
import anbuTextLogo from "../assets/anbu_text_logo.png";

const LandingHome = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    // API returns { success: true, branches: [...] }
    api.get("/branches/")
      .then((res) => {
        const data = res.data;
        if (data && data.branches) {
          setBranches(data.branches.filter((b) => b.is_active));
        } else if (Array.isArray(data)) {
          setBranches(data.filter((b) => b.is_active));
        }
      })
      .catch(() => { });
  }, []);

  const features = [
    { icon: "💧", title: "RO Purification Systems", desc: "7-stage certified filtration removing TDS, bacteria and heavy metals. Crystal clean water, guaranteed." },
    { icon: "🔧", title: "Expert Maintenance", desc: "Our certified technicians handle filter replacements, pressure checks and AMC contracts promptly." },
    { icon: "⚡", title: "Fast Doorstep Service", desc: "Book online and receive a qualified technician within hours — same-day slots available." },
    { icon: "🌿", title: "Eco-Friendly Design", desc: "Advanced reject-reduction technology cuts water wastage by up to 50% compared to standard systems." },
    { icon: "🏆", title: "Trusted Since 2022", desc: "8+ years serving thousands of households and businesses with a 98% satisfaction rate." },
    { icon: "📞", title: "24/7 Customer Care", desc: "Round-the-clock support from every branch. Help is always one call away." },
  ];

  const stats = [
    { num: "5,000+", label: "Happy Customers" },
    { num: "8+", label: "Years Experience" },
    { num: "98%", label: "Satisfaction Rate" },
    { num: "24/7", label: "Support Available" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,700&display=swap');

        .lhome {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: linear-gradient(168deg, #f0fafb 0%, #fefcf4 55%, #e9f6f8 100%);
          overflow-x: hidden;
        }

        /* ====== HERO ====== */
        .lhome-hero {
          position: relative;
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 70px 24px 50px;
          overflow: hidden;
        }
        .lhome-orb1 {
          position: absolute;
          width: 680px; height: 680px;
          background: radial-gradient(circle, rgba(11,102,120,0.09) 0%, transparent 70%);
          border-radius: 50%;
          top: -180px; left: -200px;
          pointer-events: none;
          animation: orbFloat 15s ease-in-out infinite;
        }
        .lhome-orb2 {
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(241,179,42,0.08) 0%, transparent 70%);
          border-radius: 50%;
          bottom: -100px; right: -120px;
          pointer-events: none;
          animation: orbFloat 11s ease-in-out infinite reverse;
        }
        .lhome-orb3 {
          position: absolute;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(18,130,153,0.06) 0%, transparent 70%);
          border-radius: 50%;
          top: 40%; right: 10%;
          pointer-events: none;
          animation: orbFloat 9s ease-in-out infinite 3s;
        }
        @keyframes orbFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(25px,-35px) scale(1.04); }
          66% { transform: translate(-18px,22px) scale(0.96); }
        }
        .lhome-hero-content { position: relative; z-index: 2; max-width: 780px; }
        .lhome-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.6px;
          color: #0b6678;
          background: rgba(11,102,120,0.08);
          border: 1px solid rgba(11,102,120,0.16);
          padding: 5px 15px;
          border-radius: 100px;
          margin-bottom: 24px;
          animation: fadeUp 0.7s ease both;
        }
        .lhome-badge-dot {
          width: 6px; height: 6px;
          background: #0b6678;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(11,102,120,0.6);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.4)} }
        .lhome-h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(2.4rem, 6vw, 4rem);
          font-weight: 800;
          line-height: 1.08;
          color: #0f172a;
          margin: 0 0 20px;
          animation: fadeUp 0.8s ease 0.1s both;
        }
        .lhome-h1 em {
          font-style: italic;
          background: linear-gradient(135deg, #0b6678 30%, #f1b32a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lhome-sub {
          font-size: 1.08rem;
          color: #475569;
          max-width: 520px;
          margin: 0 auto 38px;
          line-height: 1.7;
          animation: fadeUp 0.9s ease 0.2s both;
        }
        .lhome-ctas {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          animation: fadeUp 1s ease 0.3s both;
        }
        .lhome-btn-p {
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #0b6678, #128299);
          border: none;
          padding: 14px 30px;
          border-radius: 100px;
          cursor: pointer;
          box-shadow: 0 6px 22px rgba(11,102,120,0.32);
          transition: all 0.24s ease;
          letter-spacing: 0.01em;
        }
        .lhome-btn-p:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(11,102,120,0.42); }
        .lhome-btn-s {
          font-family: inherit;
          font-size: 0.93rem;
          font-weight: 700;
          color: #0b6678;
          background: rgba(11,102,120,0.07);
          border: 1.5px solid rgba(11,102,120,0.2);
          padding: 13px 28px;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.22s ease;
        }
        .lhome-btn-s:hover { background: rgba(11,102,120,0.13); transform: translateY(-2px); }

        @keyframes fadeUp {
          from { opacity:0; transform: translateY(20px); }
          to { opacity:1; transform: translateY(0); }
        }

        /* ====== STATS BAND ====== */
        .lhome-stats-band {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(11,102,120,0.08);
          border-bottom: 1px solid rgba(11,102,120,0.08);
          padding: 26px 24px;
        }
        .lhome-stats-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 18px;
        }
        .lhome-stat { text-align: center; }
        .lhome-stat-n {
          font-family: 'Fraunces', serif;
          font-size: 2.1rem;
          font-weight: 800;
          color: #0b6678;
          line-height: 1;
          margin-bottom: 5px;
        }
        .lhome-stat-l {
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        /* ====== GENERIC SECTION ====== */
        .lhome-sec {
          max-width: 1140px;
          margin: 0 auto;
          padding: 80px 28px;
        }
        .lhome-sec-eyebrow {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #0b6678;
          text-align: center;
          margin-bottom: 10px;
        }
        .lhome-sec-h {
          font-family: 'Fraunces', serif;
          font-size: clamp(1.7rem, 4vw, 2.3rem);
          font-weight: 800;
          color: #0f172a;
          text-align: center;
          margin: 0 0 10px;
          line-height: 1.15;
        }
        .lhome-sec-p {
          font-size: 0.96rem;
          color: #64748b;
          text-align: center;
          max-width: 520px;
          margin: 0 auto 52px;
          line-height: 1.65;
        }

        /* ====== FEATURES ====== */
        .lhome-feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 22px;
        }
        .lhome-feat-card {
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 22px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.025);
          transition: all 0.28s ease;
        }
        .lhome-feat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 36px rgba(11,102,120,0.11);
          border-color: rgba(11,102,120,0.18);
        }
        .lhome-feat-icon { font-size: 2.1rem; margin-bottom: 14px; }
        .lhome-feat-title { font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0 0 7px; }
        .lhome-feat-desc { font-size: 0.855rem; color: #64748b; line-height: 1.58; margin: 0; }

        /* ====== BRANCHES ====== */
        .lhome-branches-bg {
          background: linear-gradient(160deg, rgba(11,102,120,0.03), rgba(241,179,42,0.03));
          border-top: 1px solid rgba(11,102,120,0.07);
          border-bottom: 1px solid rgba(11,102,120,0.07);
        }
        .lhome-branch-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 18px;
        }
        .lhome-branch-card {
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(11,102,120,0.1);
          border-radius: 18px;
          padding: 18px 20px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          box-shadow: 0 2px 14px rgba(0,0,0,0.025);
          transition: all 0.24s ease;
        }
        .lhome-branch-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 26px rgba(11,102,120,0.1);
          border-color: rgba(11,102,120,0.22);
        }
        .lhome-branch-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(11,102,120,0.1), rgba(18,130,153,0.16));
          display: flex; align-items: center; justify-content: center;
          font-size: 19px;
          flex-shrink: 0;
        }
        .lhome-branch-name { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 3px; }
        .lhome-branch-loc { font-size: 12.5px; color: #64748b; margin: 0; line-height: 1.45; }
        .lhome-branch-pill {
          display: inline-block;
          margin-top: 7px;
          font-size: 10px;
          font-weight: 700;
          color: #2d9e6b;
          background: rgba(45,158,107,0.1);
          padding: 2px 9px;
          border-radius: 100px;
        }

        /* ====== CTA BANNER ====== */
        .lhome-cta-wrap {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 28px 90px;
        }
        .lhome-cta-box {
          background: linear-gradient(135deg, #0b6678 0%, #0d7a90 50%, #128299 100%);
          border-radius: 28px;
          padding: 56px 52px;
          text-align: center;
          color: #fff;
          box-shadow: 0 20px 56px rgba(11,102,120,0.32);
          position: relative;
          overflow: hidden;
        }
        .lhome-cta-box::before {
          content: "";
          position: absolute;
          top: -90px; right: -90px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          pointer-events: none;
        }
        .lhome-cta-box::after {
          content: "";
          position: absolute;
          bottom: -70px; left: -70px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: rgba(241,179,42,0.1);
          pointer-events: none;
        }
        .lhome-cta-h {
          font-family: 'Fraunces', serif;
          font-size: clamp(1.5rem, 4vw, 2.1rem);
          font-weight: 800;
          margin: 0 0 10px;
          position: relative; z-index: 1;
        }
        .lhome-cta-p {
          font-size: 0.96rem;
          opacity: 0.82;
          margin: 0 0 30px;
          position: relative; z-index: 1;
        }
        .lhome-cta-btns {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          position: relative; z-index: 1;
        }
        .lhome-cta-btn-w {
          font-family: inherit;
          font-size: 0.92rem;
          font-weight: 800;
          color: #0b6678;
          background: #fff;
          border: none;
          padding: 13px 28px;
          border-radius: 100px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          transition: all 0.22s ease;
        }
        .lhome-cta-btn-w:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,0.18); }
        .lhome-cta-btn-o {
          font-family: inherit;
          font-size: 0.92rem;
          font-weight: 700;
          color: #fff;
          background: rgba(255,255,255,0.14);
          border: 1.5px solid rgba(255,255,255,0.35);
          padding: 12px 26px;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.22s ease;
        }
        .lhome-cta-btn-o:hover { background: rgba(255,255,255,0.22); transform: translateY(-2px); }

        /* ====== FOOTER ====== */
        .lhome-footer {
          background: rgba(255,255,255,0.6);
          border-top: 1px solid rgba(11,102,120,0.07);
          padding: 22px 28px;
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        @media (max-width: 680px) {
          .lhome-hero { padding: 50px 18px 40px; min-height: auto; }
          .lhome-cta-box { padding: 38px 24px; }
          .lhome-sec { padding: 56px 18px; }
        }

        /* Hero Grid Layout */
        .lhome-hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 40px;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
          width: 100%;
        }
        .lhome-hero-left {
          text-align: left;
          animation: fadeUp 0.8s ease both;
        }
        .lhome-hero-left .lhome-sub {
          margin-left: 0;
        }
        .lhome-hero-left .lhome-ctas {
          justify-content: flex-start;
        }
        .lhome-trust-badges {
          display: flex;
          gap: 20px;
          margin-top: 30px;
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
          animation: fadeUp 1.1s ease 0.4s both;
        }
        
        /* Showcase Styles */
        .lhome-hero-right {
          display: flex;
          justify-content: center;
          align-items: center;
          animation: fadeUp 1s ease 0.2s both;
        }
        .lhome-showcase-container {
          position: relative;
          width: 100%;
          max-width: 380px;
        }
        .lhome-showcase-glow {
          position: absolute;
          inset: -20px;
          background: radial-gradient(circle, rgba(0,168,232,0.2) 0%, transparent 70%);
          filter: blur(15px);
          pointer-events: none;
          animation: pulseGlow 4s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        .lhome-showcase-card {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(11, 102, 120, 0.15);
          border-radius: 32px;
          padding: 40px 30px;
          box-shadow: 0 20px 50px rgba(11, 102, 120, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          position: relative;
          animation: floatShowcase 6s ease-in-out infinite;
        }
        @keyframes floatShowcase {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .logo-ring-glow {
          position: relative;
          padding: 8px;
          border-radius: 32px;
          background: linear-gradient(135deg, rgba(0,168,232,0.15), rgba(241,179,42,0.15));
          border: 1.5px solid rgba(0,168,232,0.25);
          box-shadow: 0 10px 30px rgba(0,168,232,0.12);
        }
        .showcase-logo-img {
          width: 140px;
          height: 140px;
          border-radius: 24px;
          object-fit: cover;
          display: block;
          border: 2px solid white;
        }
        .showcase-name-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: 100%;
        }
        .showcase-text-logo {
          height: 4.8rem;
          width: auto;
          object-fit: contain;
          background: none;
        }
        .showcase-enterprises {
          font-family: 'Bauhaus 93', 'Outfit', 'Arial Black', sans-serif;
          font-size: 1.6rem;
          font-weight: 900;
          color: #0b6678;
          letter-spacing: 6px;
          text-transform: uppercase;
          line-height: 1;
          margin-top: -6px;
        }
        .showcase-badge-sales {
          background: linear-gradient(135deg, #f5d800 0%, #e5c300 100%);
          color: #000;
          font-family: 'Arial Black', Arial, sans-serif;
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          padding: 4px 14px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(245,216,0,0.25);
          margin-top: 6px;
        }
        .showcase-floating-pill {
          position: absolute;
          bottom: -15px;
          background: linear-gradient(135deg, #0b6678 0%, #128299 100%);
          color: white;
          font-weight: 700;
          font-size: 0.78rem;
          padding: 6px 16px;
          border-radius: 100px;
          box-shadow: 0 6px 20px rgba(11,102,120,0.3);
          border: 1.5px solid rgba(255,255,255,0.2);
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .lhome-hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
          }
          .lhome-hero-left {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .lhome-hero-left .lhome-sub {
            margin: 0 auto 30px;
          }
          .lhome-hero-left .lhome-ctas {
            justify-content: center;
          }
          .lhome-trust-badges {
            justify-content: center;
          }
          .showcase-logo-img {
            width: 120px;
            height: 120px;
          }
        }
      `}</style>

      <div className="lhome">

        {/* ===== HERO ===== */}
        <section className="lhome-hero">
          <div className="lhome-orb1" />
          <div className="lhome-orb2" />
          <div className="lhome-orb3" />
          
          <div className="lhome-hero-grid">
            {/* Left Column: Text & CTA */}
            <div className="lhome-hero-left">
              <div className="lhome-badge">
                <span className="lhome-badge-dot" />
                Pure Water Experts Since 2022
              </div>
              <h1 className="lhome-h1">
                Clean Water for a<br /><em>Healthier Tomorrow</em>
              </h1>
              <p className="lhome-sub">
                Anbu Enterprises delivers certified RO purification systems, professional servicing, and genuine spare parts — straight to your doorstep.
              </p>
              <div className="lhome-ctas">
                <button className="lhome-btn-p" onClick={() => navigate("/products")}>Explore Products →</button>
                <button className="lhome-btn-s" onClick={() => navigate("/services")}>Our Services</button>
              </div>
              
              <div className="lhome-trust-badges">
                <span>🏆 Certified Experts</span>
                <span>⭐ 4.9/5 Rating</span>
                <span>👥 5k+ Clients</span>
              </div>
            </div>
            
            {/* Right Column: Premium Glowing Logo Showcase */}
            <div className="lhome-hero-right">
              <div className="lhome-showcase-container">
                <div className="lhome-showcase-glow" />
                <div className="lhome-showcase-card">
                  {/* Glowing Ring around Main Logo */}
                  <div className="logo-ring-glow">
                    <img src={mainLogo} alt="Anbu Logo" className="showcase-logo-img" />
                  </div>
                  
                  {/* Stacked Name Logo */}
                  <div className="showcase-name-block">
                    <img src={anbuTextLogo} alt="ANBU" className="showcase-text-logo" />
                    <span className="showcase-enterprises">ENTERPRISES</span>
                    <span className="showcase-badge-sales">Sales &amp; Service</span>
                  </div>
                  
                  {/* Floating Micro Badge */}
                  <div className="showcase-floating-pill">
                    💧 Pure Water Guaranteed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS BAND ===== */}
        <div className="lhome-stats-band">
          <div className="lhome-stats-inner">
            {stats.map((s, i) => (
              <div key={i} className="lhome-stat">
                <div className="lhome-stat-n">{s.num}</div>
                <div className="lhome-stat-l">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== FEATURES ===== */}
        <section className="lhome-sec">
          <div className="lhome-sec-eyebrow">Why Choose Us</div>
          <h2 className="lhome-sec-h">Everything for pure, safe water</h2>
          <p className="lhome-sec-p">From installation to annual maintenance, we cover every aspect of your water purification needs.</p>
          <div className="lhome-feat-grid">
            {features.map((f, i) => (
              <div key={i} className="lhome-feat-card">
                <div className="lhome-feat-icon">{f.icon}</div>
                <h3 className="lhome-feat-title">{f.title}</h3>
                <p className="lhome-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== BRANCHES ===== */}
        <div className="lhome-branches-bg">
          <section className="lhome-sec">
            <div className="lhome-sec-eyebrow">Our Locations</div>
            <h2 className="lhome-sec-h">Service Centers Near You</h2>
            <p className="lhome-sec-p">We operate from multiple branches. Walk in or call — we're always close by.</p>

            {branches.length > 0 ? (
              <div className="lhome-branch-grid">
                {branches.map((b) => (
                  <div key={b.branch_id || b.id} className="lhome-branch-card">
                    <div className="lhome-branch-icon">📍</div>
                    <div>
                      <h4 className="lhome-branch-name">{b.name}</h4>
                      <p className="lhome-branch-loc">{b.location || "Location details coming soon"}</p>
                      <span className="lhome-branch-pill">✓ Operational</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "28px", color: "#94a3b8", fontSize: "14px", background: "rgba(255,255,255,0.5)", borderRadius: "18px", border: "1px dashed rgba(11,102,120,0.15)" }}>
                Loading branch locations…
              </div>
            )}
          </section>
        </div>

        {/* ===== CTA BANNER ===== */}
        <div className="lhome-cta-wrap">
          <div className="lhome-cta-box">
            <h2 className="lhome-cta-h">Ready to experience pure water?</h2>
            <p className="lhome-cta-p">Browse our product range or book a service with one click.</p>
            <div className="lhome-cta-btns">
              <button className="lhome-cta-btn-w" onClick={() => navigate("/products")}>View Products & Deals</button>
              <button
                className="lhome-cta-btn-o"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-booking-modal", {
                      detail: { product: "RO Purifier", issue: "Service Request from Home Page" }
                    })
                  );
                }}
              >
                Book a Service
              </button>
            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <footer className="lhome-footer">
          © {new Date().getFullYear()} Anbu Enterprises — Sales &amp; Service. All rights reserved.
        </footer>
      </div>
    </>
  );
};

export default LandingHome;
