import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "./assets/main_logo.jpg";
import brandLogo from "./assets/image.png";
import { useBooking } from "./context/BookingContext";
import BookingCart from "./components/BookingCart";

const PublicLayout = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { cartItems, toggleCart } = useBooking();

  // Track screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .public-light-root {
          min-height: 100vh;
          background-color: #FAFBFE;
          color: #111827;
          position: relative;
          overflow-x: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }

        .public-light-root h1, 
        .public-light-root h2, 
        .public-light-root h3, 
        .public-light-root h4, 
        .public-light-root h5, 
        .public-light-root h6,
        .public-light-root button,
        .public-light-root input,
        .public-light-root select,
        .public-light-root textarea,
        .public-light-root span,
        .public-light-root p,
        .public-light-root a {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        .pnav-wrap {
          position: fixed !important;
          top: 0; left: 0; right: 0;
          z-index: 99999 !important;
          background: #0b6678 !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
        }
        .pnav-inner {
          max-width: 1200px; width: 100%; margin: 0 auto !important;
          padding: 0 24px !important; height: 84px !important;
          display: flex; align-items: center; justify-content: space-between;
        }
        .pnav-logo {
          display: flex; align-items: center; gap: 14px;
          text-decoration: none; flex-shrink: 0;
        }

        .pnav-logo-img {
          width: 54px; height: 54px; border-radius: 12px;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.4) !important;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.1) !important;
        }
        .pnav-links {
          display: flex; align-items: center; gap: 8px;
          margin-left: auto; margin-right: 20px;
        }
        .pnav-link {
          font-family: 'Inter', sans-serif !important;
          font-size: 0.92rem; font-weight: 600;
          color: rgba(255, 255, 255, 0.8) !important; text-decoration: none;
          padding: 8px 18px; border-radius: 10px;
          transition: all 0.18s ease; white-space: nowrap;
        }
        .pnav-link:hover { color: #ffffff !important; background: rgba(255, 255, 255, 0.08) !important; }
        .pnav-link.active { color: #ffffff !important; background: rgba(255, 255, 255, 0.16) !important; font-weight: 700; }

        .pnav-cta {
          font-family: 'Inter', sans-serif !important;
          font-size: 0.88rem; font-weight: 800;
          color: #0b6678 !important;
          background: #ffffff !important;
          border: none !important; padding: 10px 24px; border-radius: 100px;
          cursor: pointer; white-space: nowrap; flex-shrink: 0;
          transition: all 0.22s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1) !important;
        }
        .pnav-cta:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15) !important;
          background: #f3f4f6 !important;
        }

        .pnav-hamburger {
          display: none; background: none;
          border: 1.5px solid rgba(255, 255, 255, 0.3) !important;
          cursor: pointer; color: #ffffff !important; font-size: 22px;
          padding: 6px 12px; border-radius: 8px; margin-left: auto;
        }
        .pnav-drawer {
          display: none; flex-direction: column; gap: 4px;
          padding: 14px 24px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          background: #0b6678 !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .pnav-drawer.open { display: flex; }
        .pnav-drawer .pnav-link { font-size: 0.95rem; padding: 12px 16px; color: rgba(255, 255, 255, 0.8) !important; }
        .pnav-drawer .pnav-link:hover { color: #ffffff !important; background: rgba(255, 255, 255, 0.08) !important; }
        .pnav-drawer .pnav-link.active { color: #ffffff !important; background: rgba(255, 255, 255, 0.16) !important; }
        .pnav-drawer .pnav-cta {
          margin-top: 8px; text-align: center; width: 100%;
          padding: 13px; border-radius: 12px;
        }

        /* FAB */
        .fab-booking-btn {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          font-family: 'Inter', sans-serif;
          font-size: 0.92rem; font-weight: 800;
          color: #ffffff !important;
          background: linear-gradient(135deg, #0b6678 0%, #128299 100%) !important;
          border: none; padding: 14px 24px; border-radius: 100px;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          box-shadow: 0 8px 24px rgba(11, 102, 120, 0.25) !important;
          transition: all 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .fab-booking-btn:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 30px rgba(11, 102, 120, 0.35) !important;
          background: #044d5c !important;
        }
        .fab-booking-btn-pulse {
          position: absolute; inset: 0; border-radius: 100px;
          border: 2px solid rgba(11, 102, 120, 0.4);
          animation: fabPulse 2s infinite; pointer-events: none;
        }
        @keyframes fabPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.15); opacity: 0; }
        }

        @media (max-width: 700px) {
          .pnav-links, .pnav-inner .pnav-cta { display: none; }
          .pnav-hamburger { display: block; }
          .pnav-drawer .pnav-cta { display: block !important; }
        }
      `}</style>

      {/* Navigation Layout */}
      <div className="public-light-root">
        <div className="pnav-wrap">
          <div className="pnav-inner">
            {/* Logo */}
            <NavLink to="/" className="pnav-logo" onClick={() => setMenuOpen(false)}>
  <img src={logo} alt="Anbu" className="pnav-logo-img" />
  <span style={{ display: "flex", alignItems: "center" }}>
    <img src={brandLogo} alt="ANBU ENTERPRISES" className="pnav-brand-img" style={{ height: "3.5rem", width: "auto", objectFit: "contain" }} />
  </span>
</NavLink>

            {/* Desktop links */}
            <nav className="pnav-links">
              <NavLink to="/" end className="pnav-link">Home</NavLink>
              <NavLink to="/products" className="pnav-link">Products</NavLink>
              <NavLink to="/services" className="pnav-link">Services</NavLink>
              
              <NavLink to={token ? "/home" : "/admin-login"} className="pnav-link">
                {token ? "Dashboard" : "Admin Login"}
              </NavLink>

              <button className="pnav-cta" onClick={toggleCart} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Book Service</span>
                {cartItems.length > 0 && (
                  <span style={{
                    background: '#fff', color: '#0b6678',
                    padding: '2px 8px', borderRadius: '12px',
                    fontSize: '0.75rem', fontWeight: 800
                  }}>
                    {cartItems.length}
                  </span>
                )}
              </button>
            </nav>

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
            <NavLink to={token ? "/home" : "/admin-login"} className="pnav-link" onClick={() => setMenuOpen(false)}>
              {token ? "Dashboard" : "Admin Login"}
            </NavLink>
            <button className="pnav-cta" onClick={() => {
              toggleCart();
              setMenuOpen(false);
            }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>Book Service</span>
              {cartItems.length > 0 && (
                <span style={{
                  background: '#fff', color: '#0b6678',
                  padding: '2px 8px', borderRadius: '12px',
                  fontSize: '0.75rem', fontWeight: 800
                }}>
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div style={{ paddingTop: "84px", position: "relative", zIndex: 1 }}>
          <Outlet />
        </div>

        <BookingCart />

        {/* FAB Button */}
        <button className="fab-booking-btn" onClick={toggleCart} title="Book Service">
          <span className="fab-booking-btn-pulse" />
          ⚡ Book Service
          {cartItems.length > 0 && (
            <span style={{
              background: '#fff', color: '#0b6678',
              padding: '2px 8px', borderRadius: '12px',
              fontSize: '0.75rem', fontWeight: 800, marginLeft: '4px'
            }}>
              {cartItems.length}
            </span>
          )}
        </button>
      </div>
    </>
  );
};

export default PublicLayout;
