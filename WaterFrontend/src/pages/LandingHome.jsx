import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SERVICES_CATEGORIES, CATEGORY_META } from "../utils/servicesData";
import { useBooking } from "../context/BookingContext";
import api from "../api";

/* ── helpers ── */
const CATEGORY_KEYS = Object.keys(CATEGORY_META);

const STATS = [
  { label: "Happy Customers", target: 10000, suffix: "+", icon: "👥" },
  { label: "Completed Services", target: 8000, suffix: "+", icon: "✅" },
  { label: "Installations", target: 5000, suffix: "+", icon: "🔧" },
  { label: "Satisfaction Rate", target: 98, suffix: "%", icon: "⭐" },
];

function useCountUp(target, active) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = Math.ceil(target / 80);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 18);
    return () => clearInterval(timer);
  }, [target, active]);
  return count;
}

function StatCard({ label, target, suffix, icon }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const count = useCountUp(target, visible);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="lh-stat-card">
      <div className="lh-stat-icon">{icon}</div>
      <div className="lh-stat-number">{count.toLocaleString()}{suffix}</div>
      <div className="lh-stat-label">{label}</div>
    </div>
  );
}

/* ── Category Card Component ── */
function CategoryCard({ catKey, onNavigate }) {
  const meta = CATEGORY_META[catKey];
  const [hovered, setHovered] = useState(false);
  const catData = SERVICES_CATEGORIES.find(c => c.id === meta.id);
  const serviceCount = catData ? catData.services.length : 0;

  return (
    <div
      className={`lh-cat-card ${hovered ? "hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Gradient top bar */}
      <div className="lh-cat-card-bar" style={{ background: meta.accent }} />

      <div className="lh-cat-card-icon" style={{
        background: `${meta.accent}15`,
        borderColor: `${meta.accent}40`,
        boxShadow: hovered ? `0 0 24px ${meta.accent}30` : "none",
      }}>
        <span>{meta.icon}</span>
      </div>

      <h3 className="lh-cat-card-title">{meta.title}</h3>
      <p className="lh-cat-card-tagline" style={{ color: meta.accent }}>{meta.tagline}</p>
      <p className="lh-cat-card-count">{serviceCount} services available</p>

      <div className="lh-cat-card-actions">
        <button className="lh-cat-btn" onClick={() => onNavigate("products", meta.title)}
          style={{ background: meta.accent, color: "#fff" }}>
          Products →
        </button>
        <button className="lh-cat-btn lh-cat-btn-outline" onClick={() => onNavigate("services", meta.title)}
          style={{ borderColor: meta.accent, color: meta.accent }}>
          Services →
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ── */
const LandingHome = () => {
  const navigate = useNavigate();
  const { toggleCart } = useBooking();
  const [contact, setContact] = useState({ whatsapp_number: "", contact_phone: "", contact_email: "" });
  const [heroIndex, setHeroIndex] = useState(0);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    api.get("/site-settings/").then(r => setContact(r.data)).catch(() => { });
    api.get("/branches/").then(r => {
      const list = r.data?.branches || r.data || [];
      setBranches(Array.isArray(list) ? list.filter(b => b.is_active) : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % CATEGORY_KEYS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const handleNavigate = (section, category) => {
    navigate(`/${section}?category=${encodeURIComponent(category)}`);
  };

  const heroMeta = CATEGORY_META[CATEGORY_KEYS[heroIndex]];

  return (
    <div className="lh-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .lh-root {
          --blue: #0b6678;
          --blue-light: #128299;
          --blue-dark: #044d5c;
          --bg: #FAFBFE;
          --bg-alt: #F0F4FA;
          --bg-card: #FFFFFF;
          --text-primary: #111827;
          --text-secondary: #4B5563;
          --text-tertiary: #9CA3AF;
          --border: #E5E7EB;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
          --shadow-md: 0 4px 20px rgba(0,0,0,0.08);
          --shadow-lg: 0 12px 40px rgba(0,0,0,0.06);
          --shadow-xl: 0 20px 60px rgba(0,0,0,0.08);
          --radius: 16px;
          --radius-lg: 24px;
          --radius-full: 100px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          -webkit-font-smoothing: antialiased;
        }

        /* ── Section Layout ── */
        .lh-section {
          padding: 100px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .lh-section-header {
          text-align: center;
          margin-bottom: 64px;
        }
        .lh-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(11, 102, 120, 0.1); color: var(--blue);
          font-size: 0.72rem; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; padding: 6px 16px; border-radius: var(--radius-full);
          margin-bottom: 20px;
        }
        .lh-title {
          font-size: clamp(2rem, 4.5vw, 3.5rem);
          font-weight: 900; color: var(--text-primary);
          line-height: 1.1; margin: 0 0 16px;
          letter-spacing: -0.03em;
        }
        .lh-subtitle {
          color: var(--text-secondary);
          font-size: 1.05rem; line-height: 1.7;
          max-width: 600px; margin: 0 auto;
        }

        /* ── HERO ── */
        .lh-hero {
          position: relative; min-height: 85vh;
          display: flex; align-items: center;
          background: linear-gradient(180deg, #E6F2F5 0%, #FAFBFE 100%);
          overflow: hidden;
        }
        .lh-hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(11,102,120,0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 80%, rgba(11,102,120,0.05) 0%, transparent 50%);
          pointer-events: none;
        }
        /* Subtle grid overlay */
        .lh-hero::after {
          content: ''; position: absolute; inset: 0;
          background-image: linear-gradient(rgba(11,102,120,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(11,102,120,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .lh-hero-inner {
          position: relative; z-index: 2;
          max-width: 1200px; margin: 0 auto; padding: 60px 24px;
          display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 80px; align-items: center;
        }
        @media (max-width: 900px) {
          .lh-hero-inner { grid-template-columns: 1fr; gap: 40px; }
          .lh-hero-right { display: none !important; }
        }

        .lh-hero-badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: #ffffff;
          border: 1px solid rgba(11, 102, 120, 0.15);
          padding: 8px 20px; border-radius: var(--radius-full);
          margin-bottom: 32px;
          box-shadow: 0 4px 12px rgba(11, 102, 120, 0.04);
        }
        .lh-hero-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #10B981; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        .lh-hero-badge span { color: var(--text-primary); font-size: 0.82rem; font-weight: 600; }

        .lh-hero-title {
          font-size: clamp(2.5rem, 5.5vw, 4.2rem); font-weight: 900;
          color: var(--text-primary); line-height: 1.08; margin: 0 0 20px;
          letter-spacing: -0.03em;
        }
        .lh-hero-title-accent { color: var(--blue); }
        .lh-hero-desc {
          color: var(--text-secondary); font-size: 1.1rem; line-height: 1.7;
          margin: 0 0 12px; max-width: 520px;
        }

        /* rotating category text */
        .lh-hero-rotating {
          display: inline-flex; align-items: center; gap: 10px;
          margin-bottom: 36px; height: 32px; overflow: hidden;
        }
        .lh-hero-rotating-label { color: var(--text-secondary); font-size: 0.88rem; }
        .lh-hero-rotating-value {
          font-weight: 850; font-size: 0.95rem;
          animation: slide-in 0.4s ease forwards;
        }
        @keyframes slide-in { from { transform: translateY(18px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .lh-hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; }
        .lh-btn-primary {
          padding: 15px 36px; border-radius: 14px; font-weight: 800; font-size: 1rem;
          background: var(--blue); color: #fff; border: none; cursor: pointer;
          box-shadow: 0 4px 20px rgba(11, 102, 120, 0.25);
          transition: all 0.25s ease;
        }
        .lh-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(11, 102, 120, 0.35); background: #044d5c; }
        .lh-btn-outline {
          padding: 15px 36px; border-radius: 14px; font-weight: 700; font-size: 1rem;
          background: #ffffff; color: var(--text-primary);
          border: 1px solid var(--border); cursor: pointer;
          transition: all 0.25s;
          box-shadow: var(--shadow-sm);
        }
        .lh-btn-outline:hover { background: #fafbfe; border-color: var(--blue); color: var(--blue); }

        .lh-hero-contact {
          display: flex; gap: 24px; margin-top: 28px; flex-wrap: wrap;
        }
        .lh-hero-contact a {
          color: var(--text-secondary); font-size: 0.85rem;
          text-decoration: none; display: flex; align-items: center; gap: 6px;
          transition: color 0.2s;
        }
        .lh-hero-contact a:hover { color: var(--blue); }

        /* Hero right showcase card */
        .lh-hero-right {
          display: flex; justify-content: center;
        }
        .lh-hero-showcase {
          background: #ffffff;
          border: 1px solid rgba(11, 102, 120, 0.12); border-radius: var(--radius-lg);
          padding: 40px 32px; width: 100%; max-width: 400px;
          box-shadow: 0 10px 40px rgba(11, 102, 120, 0.03);
        }
        .lh-hero-showcase-icon {
          font-size: 3.5rem; margin-bottom: 20px; display: block;
          animation: float-icon 3s ease-in-out infinite;
        }
        @keyframes float-icon { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .lh-hero-showcase-title { color: var(--text-primary); font-size: 1.5rem; font-weight: 800; margin-bottom: 6px; }
        .lh-hero-showcase-tag { font-size: 0.88rem; font-weight: 700; margin-bottom: 24px; }
        .lh-hero-showcase-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 0; border-bottom: 1px solid #F3F4F6;
          color: var(--text-secondary); font-size: 0.88rem;
        }
        .lh-hero-showcase-check { color: #10B981; font-weight: 750; }
        .lh-dots { display: flex; gap: 6px; margin-top: 24px; }
        .lh-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(11, 102, 120, 0.15); cursor: pointer; transition: all 0.3s;
        }
        .lh-dot.active { width: 28px; border-radius: 4px; }

        /* ── CATEGORIES SECTION ── */
        .lh-cats-section {
          padding: 100px 24px; background: var(--bg);
        }
        .lh-cats-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 24px; max-width: 1200px; margin: 0 auto;
        }
        @media (max-width: 700px) { .lh-cats-grid { grid-template-columns: 1fr; } }

        .lh-cat-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 32px 28px;
          display: flex; flex-direction: column; gap: 14px;
          position: relative; overflow: hidden;
          transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: var(--shadow-sm);
        }
        .lh-cat-card:hover, .lh-cat-card.hovered {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
          border-color: transparent;
        }
        .lh-cat-card-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 4px;
          border-radius: 24px 24px 0 0;
        }
        .lh-cat-card-icon {
          width: 64px; height: 64px; border-radius: 18px;
          border: 1px solid; display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem; transition: all 0.3s;
        }
        .lh-cat-card:hover .lh-cat-card-icon { transform: scale(1.08) rotate(-5deg); }
        .lh-cat-card-title { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .lh-cat-card-tagline { font-size: 0.82rem; font-weight: 600; margin: 0; }
        .lh-cat-card-count { color: var(--text-tertiary); font-size: 0.8rem; margin: 0; }
        .lh-cat-card-actions { display: flex; gap: 10px; margin-top: auto; padding-top: 8px; }
        .lh-cat-btn {
          flex: 1; padding: 10px 14px; border-radius: 12px; border: none;
          font-size: 0.82rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        }
        .lh-cat-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .lh-cat-btn-outline {
          background: transparent !important; border: 1.5px solid;
        }
        .lh-cat-btn-outline:hover { filter: none; opacity: 0.85; }

        /* ── STATS ── */
        .lh-stats-section {
          padding: 80px 24px;
          background: #F0F4FA;
        }
        .lh-stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 24px; max-width: 1200px; margin: 0 auto;
        }
        @media (max-width: 900px) { .lh-stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .lh-stats-grid { grid-template-columns: 1fr; } }
        .lh-stat-card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 36px 24px; text-align: center;
          transition: transform 0.3s;
          box-shadow: var(--shadow-sm);
        }
        .lh-stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
        .lh-stat-icon { font-size: 1.8rem; margin-bottom: 12px; }
        .lh-stat-number {
          font-size: 2.8rem; font-weight: 900; color: var(--blue);
          letter-spacing: -0.02em;
        }
        .lh-stat-label { color: var(--text-secondary); font-size: 0.9rem; margin-top: 6px; }

        /* ── WHY US ── */
        .lh-why-section { padding: 100px 24px; background: var(--bg-alt); }
        .lh-why-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px; max-width: 1200px; margin: 0 auto;
        }
        .lh-why-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 28px;
          transition: all 0.3s; cursor: default;
          box-shadow: var(--shadow-sm);
        }
        .lh-why-card:hover {
          transform: translateY(-4px); box-shadow: var(--shadow-lg);
          border-color: var(--blue);
        }
        .lh-why-card-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(11, 102, 120, 0.08); display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; margin-bottom: 16px;
        }
        .lh-why-card:hover .lh-why-card-icon { background: var(--blue); color: #fff; }
        .lh-why-card-title { font-size: 1.05rem; font-weight: 800; margin-bottom: 8px; color: var(--text-primary); }
        .lh-why-card-desc { color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6; }

        /* ── CTA (Redesigned "Ready to Book Service") ── */
        .lh-cta-section { padding: 100px 24px; background: var(--bg); }
        .lh-cta-band {
          max-width: 1100px; margin: 0 auto;
          background: linear-gradient(135deg, #E6F2F5 0%, #FAFBFE 100%);
          border: 1px solid rgba(11, 102, 120, 0.2);
          border-radius: var(--radius-lg); padding: 72px 48px;
          text-align: center; position: relative; overflow: hidden;
          box-shadow: 0 10px 40px rgba(11, 102, 120, 0.03);
        }
        .lh-cta-band::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 30% 50%, rgba(11, 102, 120, 0.08), transparent 60%);
          pointer-events: none;
        }
        .lh-cta-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; color: var(--text-primary); margin-bottom: 16px; position: relative; letter-spacing: -0.02em; }
        .lh-cta-desc { color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 36px; max-width: 580px; margin-left: auto; margin-right: auto; position: relative; line-height: 1.6; }
        .lh-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; }
        .lh-cta-wa {
          padding: 15px 32px; border-radius: 14px;
          background: #25D366; color: #fff; font-weight: 800; font-size: 1rem;
          text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.2s; border: none; cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.25);
        }
        .lh-cta-wa:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .lh-cta-call {
          padding: 15px 32px; border-radius: 14px;
          background: #ffffff; color: var(--blue); font-weight: 800; font-size: 1rem;
          text-decoration: none; border: 1.5px solid var(--blue);
          transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px;
          box-shadow: var(--shadow-sm);
        }
        .lh-cta-call:hover { background: rgba(11, 102, 120, 0.05); transform: translateY(-2px); }


        /* ── FOOTER ── */
        .lh-footer {
          background: #F3F4F6; border-top: 1px solid #E5E7EB;
          padding: 60px 24px 32px;
        }
        .lh-footer-grid {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px;
          margin-bottom: 48px;
        }
        @media (max-width: 768px) { .lh-footer-grid { grid-template-columns: 1fr; } }
        .lh-footer-brand { color: var(--blue); font-size: 1.4rem; font-weight: 900; margin-bottom: 16px; }
        .lh-footer-desc { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.7; max-width: 320px; }
        .lh-footer-heading { color: var(--text-primary); font-weight: 700; margin-bottom: 16px; font-size: 0.95rem; }
        .lh-footer-link {
          color: var(--text-secondary); text-decoration: none;
          display: block; margin-bottom: 10px; font-size: 0.88rem;
          transition: color 0.2s;
        }
        .lh-footer-link:hover { color: var(--blue-light); }
        .lh-footer-bottom {
          max-width: 1200px; margin: 0 auto;
          border-top: 1px solid #E5E7EB;
          padding-top: 24px; display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 16px;
        }
        .lh-footer-copy { color: #6B7280; font-size: 0.82rem; }
      `}</style>

      {/* ── HERO ── */}
      <section className="lh-hero">
        <div className="lh-hero-inner">
          {/* Left */}
          <div>
            <div className="lh-hero-badge">
              <span className="lh-hero-badge-dot" />
              <span>Tuticorin & Surrounding Areas</span>
            </div>

            <h1 className="lh-hero-title">
              Your One-Stop<br />
              <span className="lh-hero-title-accent">Home Appliance</span><br />
              Service Partner
            </h1>
            <p className="lh-hero-desc">
              ANBU ENTERPRISES — expert sales, installation, service & repairs for AC, Water Purifiers, Refrigerators, Washing Machines, Inverter Batteries, CCTV & Solar Systems.
            </p>

            <div className="lh-hero-rotating">
              <span className="lh-hero-rotating-label">Now showing:</span>
              <span className="lh-hero-rotating-value" key={heroIndex}
                style={{ color: heroMeta?.accent }}>
                {heroMeta?.icon} {heroMeta?.title}
              </span>
            </div>

            <div className="lh-hero-ctas">
              <button className="lh-btn-primary" onClick={toggleCart}>📋 Book a Service</button>
              <button className="lh-btn-outline" onClick={() => navigate("/services")}>Explore Services →</button>
            </div>

            <div className="lh-hero-contact">
              {contact.contact_phone && (
                <a href={`tel:${contact.contact_phone}`}>📞 {contact.contact_phone}</a>
              )}
              {contact.contact_email && (
                <a href={`mailto:${contact.contact_email}`}>✉️ {contact.contact_email}</a>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="lh-hero-right">
            <div className="lh-hero-showcase"
              style={{
                borderColor: `${heroMeta?.accent || "#0A84FF"}30`,
                boxShadow: `0 0 60px ${heroMeta?.accent || "#0A84FF"}15`
              }}>
              <span className="lh-hero-showcase-icon" key={`ic-${heroIndex}`}>{heroMeta?.icon}</span>
              <h3 className="lh-hero-showcase-title">{heroMeta?.title}</h3>
              <p className="lh-hero-showcase-tag" style={{ color: heroMeta?.accent }}>{heroMeta?.tagline}</p>
              {SERVICES_CATEGORIES.find(c => c.id === heroMeta?.id)?.services.slice(0, 4).map((svc, i) => (
                <div key={i} className="lh-hero-showcase-item">
                  <span className="lh-hero-showcase-check">✓</span>
                  {svc.name}
                </div>
              ))}
              <div className="lh-dots">
                {CATEGORY_KEYS.map((_, i) => (
                  <div key={i} className={`lh-dot ${i === heroIndex ? "active" : ""}`}
                    style={{ background: i === heroIndex ? (heroMeta?.accent || "#0A84FF") : "rgba(10, 132, 255, 0.15)" }}
                    onClick={() => setHeroIndex(i)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="lh-cats-section">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="lh-section-header">
            <div className="lh-badge">⚡ Our Expertise</div>
            <h2 className="lh-title">7 Service Categories</h2>
            <p className="lh-subtitle">
              We cover everything from installation to repairs and AMC. Click any category to explore.
            </p>
          </div>
          <div className="lh-cats-grid">
            {CATEGORY_KEYS.map(key => (
              <CategoryCard key={key} catKey={key} onNavigate={handleNavigate} />
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="lh-stats-section">
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <div className="lh-badge" style={{ background: "rgba(10,132,255,0.08)" }}>📊 Our Numbers</div>
          <h2 style={{ color: "var(--text-primary)", fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 900, marginBottom: "48px" }}>
            Trusted by Thousands
          </h2>
          <div className="lh-stats-grid">
            {STATS.map(s => <StatCard key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="lh-why-section">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="lh-section-header">
            <div className="lh-badge">✅ Why ANBU</div>
            <h2 className="lh-title">The Anbu Advantage</h2>
          </div>
          <div className="lh-why-grid">
            {[
              { icon: "⚡", title: "Same-Day Service", desc: "Book before noon and get a technician at your doorstep the same day." },
              { icon: "📱", title: "Real-Time Tracking", desc: "Track your technician live after booking via WhatsApp." },
              { icon: "🏠", title: "AMC Packages", desc: "Annual Maintenance Contracts for worry-free appliance upkeep." },
              { icon: "🌟", title: "All Brands Serviced", desc: "Samsung, LG, Daikin, Voltas, Kent, Aquaguard — we service them all." },
            ].map(item => (
              <div key={item.title} className="lh-why-card">
                <div className="lh-why-card-icon">{item.icon}</div>
                <h4 className="lh-why-card-title">{item.title}</h4>
                <p className="lh-why-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── CONTACT & BRANCHES ── */}
      <section style={{ padding: "60px 24px", background: "linear-gradient(135deg, #0b6678 0%, #044d5c 100%)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "6px 16px", borderRadius: "100px", marginBottom: "16px" }}>
              📍 Our Branches
            </div>
            <h2 style={{ color: "#ffffff", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.02em" }}>Find Us Near You</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem" }}>Visit any of our branch locations for sales & service</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {branches.length > 0 ? branches.map(b => (
              <div key={b.branch_id} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "16px", padding: "22px 20px" }}>
                <div style={{ color: "#7ee8fa", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "6px" }}>Branch</div>
                <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.05rem", marginBottom: "8px" }}>📍 {b.name}</div>
                {b.contact_number && (
                  <a href={`tel:${b.contact_number}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#7ee8fa", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none", marginBottom: "4px" }}>
                    📞 {b.contact_number}
                  </a>
                )}
                {b.whatsapp_number && (
                  <a href={`https://wa.me/${b.whatsapp_number.replace(/[+\s-]/g, "")}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#a7f3d0", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none", marginTop: "4px" }}>
                    💬 {b.whatsapp_number}
                  </a>
                )}
                {b.location && <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", marginTop: "6px" }}>{b.location}</div>}
              </div>
            )) : (
              ["Eral", "Pudukottai", "Sawyerpuram"].map(loc => (
                <div key={loc} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "16px", padding: "22px 20px" }}>
                  <div style={{ color: "#7ee8fa", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "6px" }}>Branch</div>
                  <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.05rem" }}>📍 {loc}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lh-cta-section">
        <div className="lh-cta-band">
          <h2 className="lh-cta-title">Ready to Book a Service?</h2>
          <p className="lh-cta-desc">
            Select your appliances, add services, and submit your request directly to our team via WhatsApp for instant processing.
          </p>
          <div className="lh-cta-btns">
            <button className="lh-btn-primary" onClick={() => navigate('booking')}>📅 Book a Service</button>
            {contact.whatsapp_number && (
              <a href={`https://wa.me/${contact.whatsapp_number?.replace(/[+\s-]/g, "")}`}
                target="_blank" rel="noreferrer" className="lh-cta-wa">
                💬 WhatsApp Booking
              </a>
            )}
            {contact.contact_phone && (
              <a href={`tel:${contact.contact_phone}`} className="lh-cta-call">📞 Call Service Team</a>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lh-footer">
        <div className="lh-footer-grid">
          <div>
            <div className="lh-footer-brand">ANBU ENTERPRISES</div>
            <p className="lh-footer-desc">
              Your complete home appliance partner. Sales, installation, service and repairs for AC, RO, Refrigerator, Washing Machine, Inverter Batteries, CCTV & Solar.
            </p>
          </div>
          <div>
            <div className="lh-footer-heading">Quick Links</div>
            <a className="lh-footer-link" href="/">Home</a>
            <a className="lh-footer-link" href="#/products">Products</a>
            <a className="lh-footer-link" href="#/services">Services</a>
          </div>
          <div>
            <div className="lh-footer-heading">Categories</div>
            {CATEGORY_KEYS.slice(0, 5).map(k => (
              <span key={k} className="lh-footer-link" style={{ cursor: "pointer" }}
                onClick={() => navigate(`/services?category=${encodeURIComponent(k)}`)}>
                {CATEGORY_META[k].icon} {CATEGORY_META[k].title}
              </span>
            ))}
          </div>
          <div>
            <div className="lh-footer-heading">Contact</div>
            <a className="lh-footer-link" href="tel:+917539970991" style={{ textDecoration: "none" }}>
              D. Anito B.Sc &nbsp;· 75399 70991
            </a>
            <a className="lh-footer-link" href="tel:+919600700677" style={{ textDecoration: "none" }}>
              D. Arnold B.Com · 96007 00677
            </a>
          </div>
        </div>
        <div className="lh-footer-bottom">
          <p className="lh-footer-copy">© {new Date().getFullYear()} Anbu Enterprises. All rights reserved.</p>
          <p className="lh-footer-copy">Tuticorin, Tamil Nadu</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingHome;
