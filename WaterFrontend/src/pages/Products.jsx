import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import mainLogo from "../assets/main_logo.jpg";
import anbuTextLogo from "../assets/anbu_text_logo.png";

const BASE = api.defaults.baseURL.replace("/api/", "");

const Products = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waNumber, setWaNumber] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/promotions/"),
      api.get("/branches/"),
      api.get("/site-settings/"),
    ]).then(([promoRes, branchRes, settingsRes]) => {
      setPromotions(Array.isArray(promoRes.data) ? promoRes.data : []);
      const bd = branchRes.data;
      setBranches(
        bd && bd.branches
          ? bd.branches.filter((b) => b.is_active)
          : Array.isArray(bd) ? bd.filter((b) => b.is_active) : []
      );
      setWaNumber(settingsRes.data.whatsapp_number || "");
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const imgSrc = (url) =>
    !url ? null : url.startsWith("http") ? url : `${BASE}${url}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;1,9..144,700&display=swap');

        .prod-page {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: linear-gradient(168deg, #f0fafb 0%, #fefcf4 55%, #e9f6f8 100%);
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ---- HERO ---- */
        .prod-hero {
          position: relative;
          padding: 70px 28px 56px;
          text-align: center;
          overflow: hidden;
        }
        .prod-hero-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .prod-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.6px;
          color: #0b6678;
          background: rgba(11,102,120,0.08);
          border: 1px solid rgba(11,102,120,0.16);
          padding: 5px 15px;
          border-radius: 100px;
          margin-bottom: 20px;
          animation: fadeUp 0.7s ease both;
        }
        .prod-hero-h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(2rem, 5.5vw, 3.4rem);
          font-weight: 800;
          line-height: 1.1;
          color: #0f172a;
          margin: 0 0 16px;
          animation: fadeUp 0.8s ease 0.1s both;
        }
        .prod-hero-h1 em {
          font-style: italic;
          background: linear-gradient(135deg, #0b6678 30%, #f1b32a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .prod-hero-sub {
          font-size: 1rem;
          color: #475569;
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.65;
          animation: fadeUp 0.9s ease 0.2s both;
        }

        /* ---- SECTION WRAPPER ---- */
        .prod-sec {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 28px 80px;
        }
        .prod-sec-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          border-bottom: 1.5px solid rgba(11,102,120,0.1);
          padding-bottom: 10px;
          margin-bottom: 28px;
        }
        .prod-sec-title {
          font-family: 'Fraunces', serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .prod-sec-count {
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 2px;
        }

        /* ---- PROMO GRID ---- */
        .prod-promo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        /* ---- PROMO CARD ---- */
        .prod-promo-card {
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(11,102,120,0.1);
          border-radius: 22px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0,0,0,0.025);
          transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
        }
        .prod-promo-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 16px 40px rgba(11,102,120,0.14);
          border-color: rgba(11,102,120,0.22);
        }
        .prod-promo-img-wrap {
          height: 210px;
          width: 100%;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(11,102,120,0.06), rgba(241,179,42,0.06));
        }
        .prod-promo-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.45s ease;
        }
        .prod-promo-card:hover .prod-promo-img { transform: scale(1.06); }
        .prod-promo-no-img {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 56px;
          background: linear-gradient(135deg, rgba(11,102,120,0.05), rgba(241,179,42,0.05));
        }
        .prod-promo-badge {
          position: absolute;
          top: 14px; left: 14px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #fff;
          background: linear-gradient(135deg, #0b6678, #128299);
          padding: 3px 11px;
          border-radius: 100px;
          box-shadow: 0 3px 10px rgba(11,102,120,0.35);
        }
        .prod-promo-body {
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .prod-promo-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px;
          line-height: 1.3;
        }
        .prod-promo-desc {
          font-size: 0.83rem;
          color: #64748b;
          line-height: 1.55;
          margin: 0 0 16px;
          flex: 1;
        }
        .prod-promo-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px dashed rgba(11,102,120,0.12);
          padding-top: 14px;
          gap: 10px;
        }
        .prod-promo-price {
          font-size: 1.15rem;
          font-weight: 800;
          color: #2d9e6b;
        }
        .prod-promo-price-req {
          font-size: 0.78rem;
          font-weight: 600;
          color: #94a3b8;
          font-style: italic;
        }
        .prod-inquire-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 700;
          color: #fff;
          background: #25D366;
          border: none;
          padding: 7px 14px;
          border-radius: 10px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .prod-inquire-btn:hover { background: #1aab54; }

        /* ---- EMPTY STATE ---- */
        .prod-empty {
          text-align: center;
          padding: 60px 24px;
          background: rgba(255,255,255,0.6);
          border: 1px dashed rgba(11,102,120,0.15);
          border-radius: 20px;
          color: #94a3b8;
          font-size: 15px;
        }
        .prod-empty-icon { font-size: 48px; margin-bottom: 12px; }

        /* ---- BRANCHES ---- */
        .prod-branch-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .prod-branch-card {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(11,102,120,0.1);
          border-radius: 16px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.02);
          transition: all 0.24s ease;
        }
        .prod-branch-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(11,102,120,0.1);
          border-color: rgba(11,102,120,0.2);
        }
        .prod-branch-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(11,102,120,0.1), rgba(18,130,153,0.16));
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .prod-branch-name { font-size: 13.5px; font-weight: 800; color: #0f172a; margin: 0 0 2px; }
        .prod-branch-loc { font-size: 12px; color: #64748b; margin: 0; }

        /* ---- FOOTER ---- */
        .prod-footer {
          background: rgba(255,255,255,0.6);
          border-top: 1px solid rgba(11,102,120,0.07);
          padding: 20px 28px;
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
        }

        @keyframes fadeUp {
          from { opacity:0; transform: translateY(18px); }
          to { opacity:1; transform: translateY(0); }
        }

        @media (max-width: 680px) {
          .prod-hero { padding: 48px 18px 40px; }
          .prod-sec { padding: 0 16px 60px; }
          .prod-promo-grid { grid-template-columns: 1fr; }
          .prod-branch-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="prod-page">

        {/* ===== HERO ===== */}
        <section className="prod-hero" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", background: "rgba(11, 102, 120, 0.06)", border: "1px solid rgba(11, 102, 120, 0.15)", borderRadius: "100px", padding: "6px 16px" }}>
            <img src={mainLogo} alt="Logo" style={{ width: "24px", height: "24px", borderRadius: "6px" }} />
            <span style={{ fontSize: "0.82rem", fontWeight: "800", letterSpacing: "1.2px", color: "var(--primary)" }}>ANBU ENTERPRISES</span>
          </div>
          <div className="prod-hero-eyebrow">🛒 Catalog &amp; Deals</div>
          <h1 className="prod-hero-h1">Our <em>Promotions</em> &amp; Offers</h1>
          <p className="prod-hero-sub">
            Exclusive deals on RO water purifiers and servicing packages — curated directly by Anbu Enterprises for you.
          </p>
        </section>

        {/* ===== PROMOTIONS ===== */}
        <div className="prod-sec">
          <div className="prod-sec-header">
            <h2 className="prod-sec-title">Active Promotions</h2>
            {!loading && <span className="prod-sec-count">{promotions.length} deal{promotions.length !== 1 ? "s" : ""} available</span>}
          </div>

          {loading ? (
            <div className="prod-empty">
              <div className="prod-empty-icon">⏳</div>
              <p>Loading promotions…</p>
            </div>
          ) : promotions.length > 0 ? (
            <div className="prod-promo-grid">
              {promotions.map((promo) => {
                  const src = imgSrc(promo.photo_url);
                  const waLink = waNumber
                    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, I'm interested in the promotion "${promo.name}".`)}`
                    : null;
                return (
                  <div key={promo.id} className="prod-promo-card">
                    <div className="prod-promo-img-wrap">
                      {src
                        ? <img src={src} alt={promo.name} className="prod-promo-img" />
                        : <div className="prod-promo-no-img">🏷️</div>
                      }
                      <span className="prod-promo-badge">Special Offer</span>
                    </div>
                    <div className="prod-promo-body">
                      <h3 className="prod-promo-name">{promo.name}</h3>
                      <p className="prod-promo-desc">{promo.description}</p>
                      <div className="prod-promo-footer">
                        {promo.price
                          ? <span className="prod-promo-price">{promo.price.startsWith("₹") ? promo.price : `₹${promo.price}`}</span>
                          : <span className="prod-promo-price-req">Price on Request</span>
                        }
                        <button
                          className="prod-inquire-btn"
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent("open-booking-modal", {
                                detail: {
                                  product: "RO Purifier",
                                  issue: `I want to inquire about the promotion: ${promo.name}`
                                }
                              })
                            );
                          }}
                        >
                          💬 Inquire
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="prod-empty">
              <div className="prod-empty-icon">🎁</div>
              <p>No active promotions right now. Check back soon for exciting offers!</p>
            </div>
          )}
        </div>

        {/* ===== BRANCHES ===== */}
        {branches.length > 0 && (
          <div style={{ background: "rgba(11,102,120,0.03)", borderTop: "1px solid rgba(11,102,120,0.07)", borderBottom: "1px solid rgba(11,102,120,0.07)" }}>
            <div className="prod-sec" style={{ paddingTop: "56px" }}>
              <div className="prod-sec-header">
                <h2 className="prod-sec-title">Available at Our Branches</h2>
              </div>
              <div className="prod-branch-grid">
                {branches.map((b) => (
                  <div key={b.branch_id || b.id} className="prod-branch-card">
                    <div className="prod-branch-icon">🏢</div>
                    <div>
                      <p className="prod-branch-name">{b.name}</p>
                      <p className="prod-branch-loc">{b.location || "Location coming soon"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <footer className="prod-footer">
          © {new Date().getFullYear()} Anbu Enterprises — All rights reserved.
        </footer>
      </div>
    </>
  );
};

export default Products;
