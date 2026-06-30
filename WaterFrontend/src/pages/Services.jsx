import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CATEGORY_META } from "../utils/servicesData";
import { useBooking } from "../context/BookingContext";
import api from "../api";

// Helper to get category metadata with defaults
function getCategoryMeta(title) {
  const defaults = {
    id: title.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    title: title,
    icon: "🔧",
    accent: "#0b6678",
    tagline: "Expert Appliance Solutions"
  };
  return CATEGORY_META[title] || defaults;
}

/* ── Service Card ── */
function ServiceCard({ service }) {
  const { addItem } = useBooking();
  const meta = getCategoryMeta(service.job_type_name || "General");
  const [hovered, setHovered] = useState(false);

  const handleAdd = () => {
    addItem({
      name: `${service.name} (${service.job_type_name || "General"})`,
      price: service.price || "Contact for pricing",
      category: service.job_type_name || "General",
      type: "service",
    });
  };

  return (
    <div className={`s-card ${hovered ? "hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Accent left bar */}
      <div className="s-card-bar" style={{ background: meta.accent }} />

      {/* Header */}
      <div className="s-card-header">
        <div className="s-card-icon" style={{
          background: `${meta.accent}12`,
          borderColor: `${meta.accent}35`,
          boxShadow: hovered ? `0 0 18px ${meta.accent}25` : "none"
        }}>
          {meta.icon}
        </div>
        <div className="s-card-info">
          <h3 className="s-card-name">{service.name}</h3>
          <span className="s-card-cat">{service.job_type_name || "General"}</span>
        </div>
      </div>

      {/* Desc */}
      <p className="s-card-desc">{service.desc || "Professional service and diagnostic visit."}</p>

      {/* Badges */}
      <div className="s-card-badges">
        <span className="s-card-price-badge" style={{ background: `${meta.accent}10`, color: meta.accent, borderColor: `${meta.accent}25` }}>
          {service.price || "Call for Quote"}
        </span>
        {service.time && <span className="s-card-time-badge">⏱ {service.time}</span>}
      </div>

      {/* Actions */}
      <div className="s-card-actions">
        <button className="s-card-btn-primary" onClick={handleAdd}
          style={{ background: meta.accent }}>
          📋 Book Now
        </button>
        <button className="s-card-btn-secondary" onClick={handleAdd}>
          + Add
        </button>
      </div>
    </div>
  );
}

/* ── Main Services Page ── */
const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "All";
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [searchQuery, setSearchQuery] = useState("");

  const [jobTypes, setJobTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);

  // Fetch job types and services from the database
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/job-types/"),
      api.get("/services/")
    ])
      .then(([jtRes, srvRes]) => {
        setJobTypes(Array.isArray(jtRes.data) ? jtRes.data : []);
        setServices(Array.isArray(srvRes.data) ? srvRes.data : []);
      })
      .catch((err) => console.error("Error loading services data:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get("/branches/").then(r => {
      const list = r.data?.branches || r.data || [];
      setBranches(Array.isArray(list) ? list.filter(b => b.is_active) : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const c = searchParams.get("category");
    if (c) setActiveCategory(c);
    else setActiveCategory("All");
  }, [searchParams]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    if (cat === "All") setSearchParams({});
    else setSearchParams({ category: cat });
  };

  const getFiltered = () => {
    let results = [...services];

    // Filter by active category
    if (activeCategory !== "All") {
      results = results.filter(s => s.job_type_name === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.desc && s.desc.toLowerCase().includes(q)) ||
        (s.job_type_name && s.job_type_name.toLowerCase().includes(q))
      );
    }
    return results;
  };

  const filtered = getFiltered();

  return (
    <div className="s-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .s-root {
          --blue: #0b6678;
          --blue-light: #128299;
          --bg: #FAFBFE;
          --bg-card: #FFFFFF;
          --text-primary: #111827;
          --text-secondary: #6B7280;
          --text-tertiary: #9CA3AF;
          --border: #E5E7EB;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
          --shadow-lg: 0 12px 40px rgba(0,0,0,0.1);
          --shadow-xl: 0 20px 60px rgba(0,0,0,0.12);
          --radius: 16px;
          --radius-lg: 24px;
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
          padding-top: 32px;
          -webkit-font-smoothing: antialiased;
        }
        .s-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

        /* Header */
        .s-header { text-align: center; margin-bottom: 40px; padding-top: 40px; }
        .s-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--blue); color: #fff;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; padding: 6px 16px;
          border-radius: 100px; margin-bottom: 16px;
        }
        .s-title {
          font-size: clamp(2rem, 4vw, 3rem); font-weight: 900;
          color: var(--text-primary); margin-bottom: 12px;
          letter-spacing: -0.03em;
        }
        .s-subtitle { color: var(--text-secondary); font-size: 1rem; max-width: 580px; margin: 0 auto; line-height: 1.6; }

        /* Search */
        .s-search-wrap { max-width: 480px; margin: 0 auto 32px; position: relative; }
        .s-search {
          width: 100%; padding: 14px 20px 14px 48px; border-radius: 14px;
          background: var(--bg-card); border: 1.5px solid var(--border);
          color: var(--text-primary); font-size: 0.95rem; font-family: inherit;
          box-shadow: var(--shadow-sm); transition: all 0.2s;
        }
        .s-search:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(11, 102, 120, 0.12); }
        .s-search::placeholder { color: var(--text-tertiary); }
        .s-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); font-size: 1.1rem; }

        /* Chips */
        .s-chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 48px; }
        .s-chip {
          padding: 10px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 700;
          cursor: pointer; transition: all 0.25s;
          border: 1.5px solid var(--border);
          background: var(--bg-card); color: var(--text-secondary);
          display: flex; align-items: center; gap: 8px; white-space: nowrap;
          box-shadow: var(--shadow-sm);
        }
        .s-chip:hover { border-color: var(--blue); color: var(--blue); }
        .s-chip.active { background: var(--blue); color: #fff; border-color: var(--blue); box-shadow: 0 4px 15px rgba(11, 102, 120, 0.25); }

        /* Category section header */
        .s-cat-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
          padding: 16px 24px; border-radius: var(--radius);
          background: var(--bg-card); border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }
        .s-cat-header-icon { font-size: 1.2rem; }
        .s-cat-header-title { font-weight: 800; font-size: 1.1rem; }
        .s-cat-header-count {
          margin-left: auto; background: #F3F4F6; color: var(--text-secondary);
          padding: 4px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700;
        }

        /* Grid */
        .s-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px; padding-bottom: 80px;
        }
        @media (max-width: 700px) { .s-grid { grid-template-columns: 1fr; } }

        /* Card */
        .s-card {
          background: var(--bg-card); border: 1.5px solid var(--border);
          border-radius: var(--radius-lg); padding: 28px;
          display: flex; flex-direction: column; gap: 18px;
          position: relative; overflow: hidden;
          transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: var(--shadow-sm);
        }
        .s-card:hover, .s-card.hovered {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
          border-color: transparent;
        }
        .s-card-bar { position: absolute; top: 0; left: 0; bottom: 0; width: 5px; }
        .s-card-header { display: flex; align-items: center; gap: 16px; }
        .s-card-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; border: 1px solid transparent;
          transition: all 0.3s;
        }
        .s-card-info { display: flex; flex-direction: column; gap: 2px; }
        .s-card-name { font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .s-card-cat { font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .s-card-desc { color: var(--text-secondary); font-size: 0.88rem; line-height: 1.55; margin: 0; }
        .s-card-badges { display: flex; gap: 8px; flex-wrap: wrap; }
        .s-card-price-badge {
          font-size: 0.8rem; font-weight: 800; padding: 4px 12px; border-radius: 8px; border: 1px solid transparent;
        }
        .s-card-time-badge {
          background: #F3F4F6; color: var(--text-secondary);
          font-size: 0.8rem; font-weight: 700; padding: 4px 12px; border-radius: 8px;
        }
        .s-card-actions { display: flex; gap: 10px; margin-top: auto; }
        .s-card-btn-primary {
          flex: 1; padding: 12px; border-radius: 12px; border: none;
          color: #fff; font-size: 0.85rem; font-weight: 800; cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .s-card-btn-primary:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .s-card-btn-secondary {
          padding: 12px 18px; border-radius: 12px;
          background: #F3F4F6; border: 1px solid #E5E7EB;
          color: var(--text-primary); font-size: 0.85rem; font-weight: 800; cursor: pointer;
          transition: all 0.2s;
        }
        .s-card-btn-secondary:hover { background: #E5E7EB; }

        /* Empty state */
        .s-empty { text-align: center; padding: 80px 24px; color: var(--text-tertiary); }
      `}</style>

      <div className="s-container">
        <div className="s-header">
          <div className="s-badge">🛠 Professional Maintenance</div>
          <h1 className="s-title">
            {activeCategory === "All" ? "Appliance Services" : `${activeCategory} Services`}
          </h1>
          <p className="s-subtitle">
            Reliable sales, maintenance, repair & install services for all categories.
          </p>
        </div>

        <div className="s-search-wrap">
          <span className="s-search-icon">🔍</span>
          <input type="text" className="s-search" placeholder="Search services..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="s-chips">
          <button className={`s-chip ${activeCategory === "All" ? "active" : ""}`}
            onClick={() => handleCategoryChange("All")}>
            🏠 All
          </button>
          {jobTypes.map(jt => (
            <button key={jt.id}
              className={`s-chip ${activeCategory === jt.name ? "active" : ""}`}
              onClick={() => handleCategoryChange(jt.name)}
              style={activeCategory === jt.name ? { background: "var(--blue)", borderColor: "var(--blue)", boxShadow: `0 4px 15px rgba(11, 102, 120, 0.25)` } : {}}>
              🔧 {jt.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-secondary)" }}>
            <span style={{ fontSize: "1.1rem" }}>Loading services from database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="s-empty">
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>No services found</h3>
            <p>Try searching for something else or switch categories.</p>
          </div>
        ) : activeCategory === "All" && !searchQuery ? (
          jobTypes.map(jt => {
            const list = services.filter(s => s.job_type_id === jt.id || s.job_type_name === jt.name);
            if (list.length === 0) return null;
            const meta = getCategoryMeta(jt.name);
            return (
              <div key={jt.id} style={{ marginBottom: "48px" }}>
                <div className="s-cat-header">
                  <span className="s-cat-header-icon">{meta.icon}</span>
                  <span className="s-cat-header-title" style={{ color: meta.accent }}>{jt.name}</span>
                  <span className="s-cat-header-count">{list.length} services available</span>
                </div>
                <div className="s-grid">
                  {list.map(s => <ServiceCard key={s.id} service={s} />)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="s-grid">
            {filtered.map(s => <ServiceCard key={s.id} service={s} />)}
          </div>
        )}
      </div>

      {/* ── BRANCHES CONTACT ── */}
      <section style={{ padding: "60px 24px", background: "linear-gradient(135deg, #0b6678 0%, #044d5c 100%)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "6px 16px", borderRadius: "100px", marginBottom: "14px" }}>📍 Our Branches</div>
            <h3 style={{ color: "#ffffff", fontSize: "1.8rem", fontWeight: 900, margin: "0 0 8px" }}>Find Us Near You</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.92rem" }}>Visit any branch for service, repairs & consultations</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "16px" }}>
            {branches.length > 0 ? branches.map(b => (
              <div key={b.branch_id} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ color: "#7ee8fa", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "6px" }}>Branch</div>
                <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "1rem", marginBottom: "8px" }}>📍 {b.name}</div>
                {b.contact_number && (
                  <a href={`tel:${b.contact_number}`} style={{ display: "block", color: "#7ee8fa", fontWeight: 600, fontSize: "0.92rem", textDecoration: "none", marginBottom: "4px" }}>📞 {b.contact_number}</a>
                )}
                {b.whatsapp_number && (
                  <a href={`https://wa.me/${b.whatsapp_number.replace(/[+\s-]/g, "")}`} target="_blank" rel="noreferrer" style={{ display: "block", color: "#a7f3d0", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none" }}>💬 {b.whatsapp_number}</a>
                )}
                {b.location && <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", marginTop: "6px" }}>{b.location}</div>}
              </div>
            )) : ["Eral", "Pudukottai", "Sawyerpuram"].map(loc => (
              <div key={loc} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ color: "#7ee8fa", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "6px" }}>Branch</div>
                <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "1rem" }}>📍 {loc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
