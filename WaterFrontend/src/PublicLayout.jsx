import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "./assets/main_logo.jpg";
import anbuLogo from "./assets/anbu_text_logo.png";
import api from "./api";

const PublicLayout = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);

  // Booking Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [globalContact, setGlobalContact] = useState({ whatsapp_number: "", contact_phone: "" });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [bookingMethod, setBookingMethod] = useState(""); // "call" or "whatsapp" or empty

  // WhatsApp Form States
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    alternateNumber: "",
    product: "RO Purifier",
    issue: "",
    selectedBranchId: ""
  });

  // Track screen size for mobile/desktop layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch branches and global settings
  useEffect(() => {
    api.get("/branches/")
      .then((res) => {
        const d = res.data;
        const active = d && d.branches
          ? d.branches.filter((b) => b.is_active)
          : Array.isArray(d) ? d.filter((b) => b.is_active) : [];
        setBranches(active);
        if (active.length > 0) {
          setFormData((prev) => ({ ...prev, selectedBranchId: active[0].branch_id }));
        }
      })
      .catch(() => { });

    api.get("/site-settings/")
      .then((res) => {
        setGlobalContact({
          whatsapp_number: res.data.whatsapp_number || "",
          contact_phone: res.data.contact_phone || ""
        });
      })
      .catch(() => { });

    // Listen to custom booking events triggered by children
    const handleOpenEvent = (e) => {
      const selectedProduct = (e.detail && e.detail.product) || "RO Purifier";
      const selectedIssue = (e.detail && e.detail.issue) || "";
      setFormData((prev) => ({
        ...prev,
        product: selectedProduct,
        issue: selectedIssue
      }));

      // If desktop, go directly to whatsapp form. If mobile, let user choose Call or WhatsApp.
      if (window.innerWidth >= 768) {
        setBookingMethod("whatsapp");
      } else {
        setBookingMethod("");
      }
      setIsModalOpen(true);
    };

    window.addEventListener("open-booking-modal", handleOpenEvent);
    return () => window.removeEventListener("open-booking-modal", handleOpenEvent);
  }, []);

  const openBookingModal = () => {
    // If desktop, go directly to whatsapp form. If mobile, let user choose Call or WhatsApp.
    if (window.innerWidth >= 768) {
      setBookingMethod("whatsapp");
    } else {
      setBookingMethod(""); // Let them choose
    }
    setIsModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsModalOpen(false);
    setBookingMethod("");
    setFormData({
      name: "",
      phoneNumber: "",
      alternateNumber: "",
      product: "RO Purifier",
      issue: "",
      selectedBranchId: branches.length > 0 ? branches[0].branch_id : ""
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendWhatsApp = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phoneNumber || !formData.issue) {
      alert("Please fill in all required fields.");
      return;
    }

    const selectedBranch = branches.find((b) => b.branch_id === formData.selectedBranchId);
    // Use selected branch's whatsapp number, fallback to global settings whatsapp number
    const waDest = (selectedBranch && selectedBranch.whatsapp_number) || globalContact.whatsapp_number;

    if (!waDest) {
      alert("No WhatsApp number is configured for booking at this time. Please contact a branch directly.");
      return;
    }

    // Format the WhatsApp message text
    const textMessage = `*New Service Booking Request*
----------------------------
*Name:* ${formData.name}
*Phone:* ${formData.phoneNumber}
*Alternate Phone:* ${formData.alternateNumber || "None"}
*Product:* ${formData.product}
*Issue/Requirement:* ${formData.issue}
*Preferred Branch:* ${selectedBranch ? selectedBranch.name : "Any"}`;

    const waUrl = `https://wa.me/${waDest.replace(/[+\s-]/g, "")}?text=${encodeURIComponent(textMessage)}`;
    window.open(waUrl, "_blank");
    closeBookingModal();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,600&display=swap');

        * { box-sizing: border-box; }

        .pnav-wrap {
          position: sticky;
          top: 0;
          z-index: 9999;
          background: rgba(8, 20, 40, 0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 2px solid rgba(0,168,232,0.25);
          box-shadow: 0 4px 30px rgba(0,0,0,0.4);
        }
        .pnav-inner {
          max-width: 100%;
          width: 100%;
          margin: 0 auto;
          padding: 0 40px;
          height: 80px;
          display: flex;
          align-items: center;
          gap: 0;
        }
        .pnav-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .pnav-logo-img {
          width: 54px;
          height: 54px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid rgba(0,168,232,0.45);
          box-shadow: 0 0 20px rgba(0,168,232,0.35);
        }
        /* Brand stacked block */
        .pnav-brand-block {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
        }
        .pnav-brand-anbu {
          height: 2.4rem;
          width: auto;
          object-fit: contain;
          display: block;
          background: none;
        }
        .pnav-brand-ent {
          font-family: 'Bauhaus 93', 'Outfit', 'Arial Black', Arial, sans-serif;
          font-size: 0.92rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 3px;
          text-transform: uppercase;
          line-height: 1;
          text-shadow: 1px 1px 4px rgba(0,0,0,0.6);
        }
        .pnav-brand-sub {
          background: #f5d800;
          color: #000;
          font-family: 'Arial Black', Arial, sans-serif;
          font-size: 0.55rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          padding: 3px 9px;
          border-radius: 4px;
          display: inline-block;
          box-shadow: 1px 1px 4px rgba(0,0,0,0.3);
          line-height: 1.4;
        }
        .pnav-logo-text {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: #ffffff;
          line-height: 1.1;
        }
        .pnav-logo-sub {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          display: block;
        }
        .pnav-links {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          margin-right: 20px;
        }
        .pnav-link {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          padding: 8px 18px;
          border-radius: 10px;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .pnav-link:hover {
          color: #00a8e8;
          background: rgba(0,168,232,0.1);
        }
        .pnav-link.active {
          color: #00a8e8;
          background: rgba(0,168,232,0.13);
          font-weight: 700;
        }
        .pnav-cta {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #00a8e8 0%, #0b6678 100%);
          border: none;
          padding: 10px 24px;
          border-radius: 100px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.22s ease;
          box-shadow: 0 4px 18px rgba(0,168,232,0.38);
          letter-spacing: 0.01em;
        }
        .pnav-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,168,232,0.55);
        }
        .pnav-hamburger {
          display: none;
          background: none;
          border: 1.5px solid rgba(0,168,232,0.45);
          cursor: pointer;
          color: #00a8e8;
          font-size: 22px;
          padding: 6px 12px;
          border-radius: 8px;
          margin-left: auto;
        }
        .pnav-drawer {
          display: none;
          flex-direction: column;
          gap: 4px;
          padding: 14px 24px 20px;
          border-top: 1px solid rgba(0,168,232,0.15);
          background: rgba(8,20,40,0.99);
        }
        .pnav-drawer.open { display: flex; }
        .pnav-drawer .pnav-link {
          font-size: 0.95rem;
          padding: 12px 16px;
        }
        .pnav-drawer .pnav-cta {
          margin-top: 8px;
          text-align: center;
          width: 100%;
          padding: 13px;
          border-radius: 12px;
        }

        /* --- FLOATING BOOKING BUTTON --- */
        .fab-booking-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 800;
          color: #fff;
          background: linear-gradient(135deg, #0b6678 0%, #128299 100%);
          border: none;
          padding: 14px 24px;
          border-radius: 100px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 30px rgba(11,102,120,0.4);
          transition: all 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .fab-booking-btn:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 36px rgba(11,102,120,0.5);
        }
        .fab-booking-btn-pulse {
          position: absolute;
          inset: 0;
          border-radius: 100px;
          border: 2px solid rgba(11,102,120,0.4);
          animation: fabPulse 2s infinite;
          pointer-events: none;
        }
        @keyframes fabPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.15); opacity: 0; }
        }

        /* --- MODAL DIALOG --- */
        .bk-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.25s ease-out;
        }
        .bk-card {
          background: #ffffff;
          border-radius: 24px;
          max-width: 520px;
          width: 100%;
          box-shadow: 0 24px 64px rgba(11,102,120,0.18);
          overflow: hidden;
          animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }
        .bk-header {
          padding: 24px 28px 18px;
          border-bottom: 1px solid rgba(11,102,120,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .bk-title {
          font-family: 'Fraunces', serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .bk-close {
          background: rgba(11,102,120,0.06);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          transition: background 0.2s;
        }
        .bk-close:hover { background: rgba(11,102,120,0.12); color: #0f172a; }
        .bk-body {
          padding: 24px 28px 28px;
          overflow-y: auto;
          flex: 1;
        }

        /* Method Selector */
        .bk-methods-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .bk-method-btn {
          background: rgba(11,102,120,0.04);
          border: 1.5px solid rgba(11,102,120,0.12);
          border-radius: 18px;
          padding: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: left;
          transition: all 0.24s ease;
        }
        .bk-method-btn:hover {
          background: rgba(11,102,120,0.07);
          border-color: rgba(11,102,120,0.3);
          transform: translateY(-2px);
        }
        .bk-method-icon {
          font-size: 2.2rem;
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .bk-method-title {
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .bk-method-desc {
          font-size: 0.82rem;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        /* Form Controls */
        .bk-form-group {
          margin-bottom: 16px;
        }
        .bk-label {
          display: block;
          font-size: 0.84rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .bk-input, .bk-select, .bk-textarea {
          width: 100%;
          font-family: inherit;
          font-size: 0.88rem;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1.5px solid rgba(11,102,120,0.15);
          background: rgba(11,102,120,0.02);
          outline: none;
          transition: border-color 0.2s;
        }
        .bk-input:focus, .bk-select:focus, .bk-textarea:focus {
          border-color: #0b6678;
          background: #ffffff;
        }
        .bk-textarea {
          resize: vertical;
          min-height: 70px;
        }
        .bk-btn-submit {
          width: 100%;
          font-family: inherit;
          font-size: 0.94rem;
          font-weight: 800;
          color: #fff;
          background: #25D366;
          border: none;
          padding: 12px;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 16px rgba(37,211,102,0.3);
          transition: all 0.22s ease;
        }
        .bk-btn-submit:hover {
          background: #1aab54;
          transform: translateY(-2px);
        }

        /* Branch Call List */
        .bk-call-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bk-call-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: rgba(11,102,120,0.04);
          border: 1px solid rgba(11,102,120,0.1);
          border-radius: 14px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .bk-call-item:hover {
          background: rgba(11,102,120,0.08);
          border-color: rgba(11,102,120,0.22);
          transform: translateY(-1px);
        }
        .bk-call-name { font-size: 0.9rem; font-weight: 800; color: #0f172a; }
        .bk-call-no { font-size: 0.8rem; color: #64748b; margin-top: 2px; }
        .bk-call-badge {
          background: linear-gradient(135deg, #0b6678, #128299);
          color: white;
          padding: 5px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
        }

        /* Back Link */
        .bk-back {
          background: none;
          border: none;
          color: #0b6678;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 18px;
          padding: 0;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 700px) {
          .pnav-links, .pnav-inner .pnav-cta { display: none; }
          .pnav-hamburger { display: block; }
          .pnav-drawer .pnav-cta { display: block !important; }
        }
      `}</style>

      {/* Floating Booking Button */}
      <button className="fab-booking-btn" onClick={openBookingModal}>
        <span className="fab-booking-btn-pulse" />
        ⚡ Book Service
      </button>

      {/* Booking Dialog Overlay */}
      {isModalOpen && (
        <div className="bk-overlay" onClick={closeBookingModal}>
          <div className="bk-card" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header">
              <h3 className="bk-title">
                {bookingMethod === "call" ? "Call to Book" : "WhatsApp Service Booking"}
              </h3>
              <button className="bk-close" onClick={closeBookingModal}>✕</button>
            </div>

            <div className="bk-body">
              {/* Back Button if method selected and mobile */}
              {isMobile && bookingMethod !== "" && (
                <button className="bk-back" onClick={() => setBookingMethod("")}>
                  ← Back to Selection
                </button>
              )}

              {/* STEP 1: Method Selector (Only shown on mobile when no method selected) */}
              {isMobile && bookingMethod === "" && (
                <div className="bk-methods-grid">
                  <button className="bk-method-btn" onClick={() => setBookingMethod("whatsapp")}>
                    <div className="bk-method-icon" style={{ color: "#25D366" }}>💬</div>
                    <div>
                      <h4 className="bk-method-title">WhatsApp Booking</h4>
                      <p className="bk-method-desc">Send details instantly to your branch WhatsApp number.</p>
                    </div>
                  </button>

                  <button className="bk-method-btn" onClick={() => setBookingMethod("call")}>
                    <div className="bk-method-icon" style={{ color: "#0b6678" }}>📞</div>
                    <div>
                      <h4 className="bk-method-title">Direct Call Booking</h4>
                      <p className="bk-method-desc">Get connected instantly via voice call.</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Call List UI */}
              {bookingMethod === "call" && (
                <div className="bk-call-list">
                  <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
                    Select a branch nearest to you to place a direct call request:
                  </p>
                  {branches.length > 0 ? (
                    branches.map((b) => {
                      const num = b.contact_number || globalContact.contact_phone;
                      if (!num) return null;
                      return (
                        <a key={b.branch_id} href={`tel:${num}`} className="bk-call-item">
                          <div>
                            <div className="bk-call-name">{b.name}</div>
                            <div className="bk-call-loc" style={{ fontSize: "11.5px", color: "#94a3b8", display: "flex", gap: "4px", alignItems: "center", marginTop: "2px" }}>
                              📍 {b.location || "Branch Address"}
                            </div>
                            <div className="bk-call-no">{num}</div>
                          </div>
                          <span className="bk-call-badge">📞 Call</span>
                        </a>
                      );
                    })
                  ) : (
                    globalContact.contact_phone ? (
                      <a href={`tel:${globalContact.contact_phone}`} className="bk-call-item">
                        <div>
                          <div className="bk-call-name">Anbu Service Helpline</div>
                          <div className="bk-call-no">{globalContact.contact_phone}</div>
                        </div>
                        <span className="bk-call-badge">📞 Call</span>
                      </a>
                    ) : (
                      <p style={{ fontSize: "0.82rem", color: "#e53e3e", fontStyle: "italic" }}>No contact number configured.</p>
                    )
                  )}
                </div>
              )}

              {/* WhatsApp Form UI */}
              {bookingMethod === "whatsapp" && (
                <form onSubmit={handleSendWhatsApp}>
                  <div className="bk-form-group">
                    <label className="bk-label">Your Name *</label>
                    <input
                      className="bk-input"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="bk-form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="bk-label">Phone Number *</label>
                      <input
                        className="bk-input"
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleFormChange}
                        placeholder="Primary number"
                        required
                      />
                    </div>
                    <div>
                      <label className="bk-label">Alternate Number</label>
                      <input
                        className="bk-input"
                        type="tel"
                        name="alternateNumber"
                        value={formData.alternateNumber}
                        onChange={handleFormChange}
                        placeholder="Optional alternate"
                      />
                    </div>
                  </div>

                  <div className="bk-form-group">
                    <label className="bk-label">Select Product *</label>
                    <select
                      className="bk-select"
                      name="product"
                      value={formData.product}
                      onChange={handleFormChange}
                    >
                      <option value="RO Purifier">RO Purifier Unit</option>
                      <option value="Filters / Consumables">Filter cartridges &amp; Spares</option>
                      <option value="AMC Contract">Annual Maintenance Contract</option>
                      <option value="Other Service">General Repair / Consultation</option>
                    </select>
                  </div>

                  <div className="bk-form-group">
                    <label className="bk-label">Issue or Requirement *</label>
                    <textarea
                      className="bk-textarea"
                      name="issue"
                      value={formData.issue}
                      onChange={handleFormChange}
                      placeholder="Explain your request, eg. system leaking, taste bad, filters due..."
                      required
                    />
                  </div>

                  <div className="bk-form-group">
                    <label className="bk-label">Preferred Branch *</label>
                    <select
                      className="bk-select"
                      name="selectedBranchId"
                      value={formData.selectedBranchId}
                      onChange={handleFormChange}
                      required
                    >
                      {branches.map((b) => (
                        <option key={b.branch_id} value={b.branch_id}>
                          {b.name} ({b.location || "Online"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="bk-btn-submit">
                    💬 Send via WhatsApp
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Layout Bar */}
      <div className="pnav-wrap">
        <div className="pnav-inner">
          {/* Logo */}
          <NavLink to="/" className="pnav-logo" onClick={() => setMenuOpen(false)}>
            <img src={logo} alt="Anbu" className="pnav-logo-img" />
            <span className="sidebar-title-styled" style={{ display: "flex", flexDirection: "column" }}>
              <img src={anbuLogo} alt="ANBU" style={{ height: "2.2rem", width: "auto", objectFit: "contain" }} />
              <span className="styled-enterprises" style={{ fontSize: "0.9rem", marginTop: "-4px" }}>ENTERPRISES</span>
              <span className="styled-sales-service" style={{ fontSize: "0.55rem", padding: "2px 5px", marginTop: "1px" }}>Sales & Service</span>
            </span>
          </NavLink>

          {/* Desktop links */}
          <nav className="pnav-links">
            <NavLink to="/" end className="pnav-link">Home</NavLink>
            <NavLink to="/products" className="pnav-link">Products</NavLink>
            <NavLink to="/services" className="pnav-link">Services</NavLink>
          </nav>

          {/* CTA */}
          <button className="pnav-cta" onClick={() => navigate(token ? "/home" : "/admin-login")}>
            {token ? "Dashboard →" : "Admin Login"}
          </button>

          {/* Mobile hamburger */}
          <button className="pnav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={`pnav-drawer ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" end className="pnav-link" onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/products" className="pnav-link" onClick={() => setMenuOpen(false)}>Products</NavLink>
          <NavLink to="/services" className="pnav-link" onClick={() => setMenuOpen(false)}>Services</NavLink>
          <button className="pnav-cta" onClick={() => { setMenuOpen(false); navigate(token ? "/home" : "/admin-login"); }}>
            {token ? "Dashboard →" : "Admin Login"}
          </button>
        </div>
      </div>

      <Outlet />
    </>
  );
};

export default PublicLayout;
