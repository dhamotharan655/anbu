import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import api from "../api";

/* ── Product Card (Dynamic Promotion Card) ── */
function ProductCard({ promo }) {
  const { addItem } = useBooking();
  const [hovered, setHovered] = useState(false);

  const handleAdd = () => {
    addItem({
      name: promo.name,
      price: promo.price || "Contact for pricing",
      category: promo.job_type_name || "General",
      type: "product"
    });
  };

  const getMediaUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base = api.defaults.baseURL.replace("/api/", "").replace("/api", "");
    return `${base}${path}`;
  };

  const imgUrl = getMediaUrl(promo.photo_url);

  return (
    <div className={`p-card ${hovered ? "hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Accent top bar */}
      <div className="p-card-bar" />

      {/* Header: icon/tag + price */}
      <div className="p-card-header">
        <span className="p-card-cat-badge">
          🏷️ {promo.job_type_name || "General"}
        </span>
        {promo.price && (
          <span className="p-card-price">
            {promo.price}
          </span>
        )}
      </div>

      {/* Photo */}
      {imgUrl ? (
        <div className="p-card-img-wrap">
          <img src={imgUrl} alt={promo.name} className="p-card-img" />
        </div>
      ) : (
        <div className="p-card-img-placeholder">
          <span style={{ fontSize: "2.5rem" }}>🔧</span>
        </div>
      )}

      {/* Name + Desc */}
      <h3 className="p-card-name">{promo.name}</h3>
      <p className="p-card-desc">{promo.description}</p>

      {/* Buttons */}
      <div className="p-card-actions">
        <button className="p-card-btn-primary" onClick={handleAdd}>
          + Add to Booking
        </button>
        <button className="p-card-btn-secondary" onClick={() => {
          const msg = `Hi, I'm interested in: ${promo.name} (${promo.job_type_name || "General"}) - ${promo.price || ""}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
        }}>
          💬 Enquire
        </button>
      </div>
    </div>
  );
}

/* ── Main Products Page ── */
const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "All";
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [searchQuery, setSearchQuery] = useState("");

  const [jobTypes, setJobTypes] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
const [branches, setBranches] = useState([]);

  // Fetch job types and promotions
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/job-types/"),
      api.get("/promotions/")
    ])
      .then(([jtRes, promoRes]) => {
        setJobTypes(Array.isArray(jtRes.data) ? jtRes.data : []);
        setPromotions(Array.isArray(promoRes.data) ? promoRes.data : []);
      })
      .catch((err) => console.error("Error loading products data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch branches
  useEffect(() => {
    api.get("/branches/")
      .then(res => setBranches(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error loading branches:", err));
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

  const getFilteredProducts = () => {
    let results = [...promotions];

    // Filter by category (Job Type Name)
    if (activeCategory !== "All") {
      results = results.filter(p => p.job_type_name === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.job_type_name && p.job_type_name.toLowerCase().includes(q))
      );
    }
    return results;
  };

  const filtered = getFilteredProducts();

  return (
    <div className="p-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .p-root {
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
        .p-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

        /* Header */
        .p-header { text-align: center; margin-bottom: 40px; padding-top: 40px; }
        .p-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--blue); color: #fff;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; padding: 6px 16px;
          border-radius: 100px; margin-bottom: 16px;
        }
        .p-title {
          font-size: clamp(2rem, 4vw, 3rem); font-weight: 900;
          color: var(--text-primary); margin-bottom: 12px;
          letter-spacing: -0.03em;
        }
        .p-subtitle { color: var(--text-secondary); font-size: 1rem; max-width: 560px; margin: 0 auto; line-height: 1.6; }

        /* Search */
        .p-search-wrap { max-width: 480px; margin: 0 auto 32px; position: relative; }
        .p-search {
          width: 100%; padding: 14px 20px 14px 48px; border-radius: 14px;
          background: var(--bg-card); border: 1.5px solid var(--border);
          color: var(--text-primary); font-size: 0.95rem; font-family: inherit;
          box-shadow: var(--shadow-sm); transition: all 0.2s;
        }
        .p-search:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(11, 102, 120, 0.12); }
        .p-search::placeholder { color: var(--text-tertiary); }
        .p-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); font-size: 1.1rem; }

        /* Chips */
        .p-chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 48px; }
        .p-chip {
          padding: 10px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 700;
          cursor: pointer; transition: all 0.25s;
          border: 1.5px solid var(--border);
          background: var(--bg-card); color: var(--text-secondary);
          display: flex; align-items: center; gap: 8px; white-space: nowrap;
          box-shadow: var(--shadow-sm);
        }
        .p-chip:hover { border-color: var(--blue); color: var(--blue); }
        .p-chip.active { background: var(--blue); color: #fff; border-color: var(--blue); box-shadow: 0 4px 15px rgba(11, 102, 120, 0.25); }

        /* Category header */
        .p-cat-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
          padding: 16px 24px; border-radius: var(--radius);
          background: var(--bg-card); border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }
        .p-cat-header-icon { font-size: 1.2rem; }
        .p-cat-header-title { font-weight: 800; font-size: 1.1rem; color: var(--blue); }
        .p-cat-header-count {
          margin-left: auto; background: rgba(11, 102, 120, 0.08); color: var(--blue);
          padding: 4px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700;
        }

        /* Products grid */
        .p-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px; padding-bottom: 80px;
        }
        @media (max-width: 700px) { .p-grid { grid-template-columns: 1fr; } }

        /* Product Card */
        .p-card {
          background: var(--bg-card); border: 1.5px solid var(--border);
          border-radius: var(--radius-lg); padding: 28px 24px;
          display: flex; flex-direction: column; gap: 14px;
          position: relative; overflow: hidden;
          transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: var(--shadow-sm);
        }
        .p-card:hover, .p-card.hovered {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
          border-color: transparent;
        }
        .p-card-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--blue); }
        .p-card-header { display: flex; justify-content: space-between; align-items: center; }
        .p-card-cat-badge {
          background: rgba(11, 102, 120, 0.08); color: var(--blue);
          padding: 4px 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 700;
        }
        .p-card-price {
          background: rgba(16, 185, 129, 0.1); color: #10b981;
          padding: 4px 12px; border-radius: 8px; font-size: 0.82rem; font-weight: 800;
        }
        .p-card-img-wrap {
          width: 100%; height: 200px; border-radius: 12px; overflow: hidden;
          border: 1px solid var(--border);
        }
        .p-card-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.3s;
        }
        .p-card:hover .p-card-img { transform: scale(1.05); }
        .p-card-img-placeholder {
          width: 100%; height: 200px; border-radius: 12px;
          background: rgba(11, 102, 120, 0.04); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
        }
        .p-card-name { font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .p-card-desc { color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin: 0; }
        .p-card-actions { display: flex; gap: 10px; margin-top: auto; padding-top: 8px; }
        .p-card-btn-primary {
          flex: 1; padding: 11px; border-radius: 12px; border: none;
          background: var(--blue); color: #fff; font-size: 0.85rem; font-weight: 800; cursor: pointer;
          box-shadow: 0 4px 12px rgba(11, 102, 120, 0.15);
          transition: all 0.2s;
        }
        .p-card-btn-primary:hover { transform: translateY(-2px); background: var(--blue-light); }
        .p-card-btn-secondary {
          padding: 11px 16px; border-radius: 12px;
          background: #F0FDF4; border: 1px solid #BBF7D0;
          color: #16a34a; font-size: 0.85rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        }
        .p-card-btn-secondary:hover { background: #DCFCE7; }

        /* Empty */
        .p-empty { text-align: center; padding: 80px 24px; color: var(--text-tertiary); }
      `}</style>

      <div className="p-container">
        <div className="p-header">
          <div className="p-badge">🛍 Offers & Products</div>
          <h1 className="p-title">
            {activeCategory === "All" ? "Current Promotions" : `${activeCategory} Offers`}
          </h1>
          <p className="p-subtitle">Explore custom promotional bundles and add them directly to your service booking.</p>
        </div>

        <div className="p-search-wrap">
          <span className="p-search-icon">🔍</span>
          <input type="text" className="p-search" placeholder="Search products by name..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="p-chips">
          <button className={`p-chip ${activeCategory === "All" ? "active" : ""}`}
            onClick={() => handleCategoryChange("All")}>
            🏠 All
          </button>
          {jobTypes.map(jt => (
            <button key={jt.id}
              className={`p-chip ${activeCategory === jt.name ? "active" : ""}`}
              onClick={() => handleCategoryChange(jt.name)}
              style={activeCategory === jt.name ? { background: "var(--blue)", borderColor: "var(--blue)", boxShadow: `0 4px 15px rgba(11, 102, 120, 0.25)` } : {}}>
              🔧 {jt.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-secondary)" }}>
            <span style={{ fontSize: "1.1rem" }}>Loading products data...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-empty">
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>No promotions found</h3>
            <p>Try a different search or category.</p>
          </div>
        ) : activeCategory === "All" && !searchQuery ? (
          jobTypes.map(jt => {
            const promos = promotions.filter(p => p.job_type_id === jt.id || p.job_type_name === jt.name);
            if (promos.length === 0) return null;
            return (
              <div key={jt.id} style={{ marginBottom: "48px" }}>
                <div className="p-cat-header">
                  <span className="p-cat-header-icon">🔧</span>
                  <span className="p-cat-header-title">{jt.name}</span>
                  <span className="p-cat-header-count">{promos.length} promotions</span>
                </div>
                <div className="p-grid">
                  {promos.map(p => <ProductCard key={p.id} promo={p} />)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-grid">
            {filtered.map(p => <ProductCard key={p.id} promo={p} />)}
          </div>
        )}
      </div>

      {/* ── BRANCHES CONTACT ── */}
      <section style={{ padding: "60px 24px", background: "linear-gradient(135deg, #0b6678 0%, #044d5c 100%)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "6px 16px", borderRadius: "100px", marginBottom: "14px" }}>📍 Our Branches</div>
            <h3 style={{ color: "#ffffff", fontSize: "1.8rem", fontWeight: 900, margin: "0 0 8px" }}>Find Us Near You</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.92rem" }}>Visit any branch for sales, service & support</p>
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

export default Products;
