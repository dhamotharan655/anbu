import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "./assets/main_logo.jpg";
import anbuLogo from "./assets/anbu_text_logo.png";
import {
  FiHome,
  FiBarChart2,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiUser,
  FiTrendingUp,
  FiPackage,
  FiFileText,
  FiMessageSquare,
  FiGrid,
  FiShield,
  FiClock,
  FiSettings,

} from "react-icons/fi";

const Layout = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  console.log('Layout rendering - checking auth');
  const token = sessionStorage.getItem('token');
  console.log('Token in Layout:', token ? 'exists' : 'missing');

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("permissions");
    navigate("/admin-login");
  };

  const role = sessionStorage.getItem("role");
  const permissions = JSON.parse(sessionStorage.getItem("permissions") || "[]");

  const canAccess = (page) => {
    if (role === "bigadmin") return true;
    return permissions.includes(page);
  };

  const navLinks = [
    { to: "/home", text: "Home", access: "all", icon: <FiHome /> },
    { to: "/products", text: "Products", access: "all", icon: <FiPackage /> },
    { to: "/services", text: "Services", access: "all", icon: <FiSettings /> },
    { to: "/dashboard", text: "Dashboard", access: "dashboard", icon: <FiBarChart2 /> },
    { to: "/service-reminders", text: "Reminders", access: "dashboard", icon: <FiClock /> },
    { to: "/payment-due", text: "Payment Due", access: "bigadmin", icon: <FiDollarSign /> },
    { to: "/booking", text: "Booking", access: "booking", icon: <FiCalendar /> },
    { to: "/staff", text: "Staff", access: "staff", icon: <FiUsers /> },

    { to: "/payroll", text: "Payroll", access: "bigadmin", icon: <FiBriefcase /> },
    { to: "/customers", text: "Customers", access: "customers", icon: <FiUser /> },
    { to: "/staff-performance", text: "Performance", access: "staff-performance", icon: <FiTrendingUp /> },
    { to: "/stock-management", text: "Stock", access: "stock-management", icon: <FiPackage /> },
    { to: "/invoices", text: "Invoices", access: "bigadmin", icon: <FiFileText /> },
    { to: "/whatsapp-pending", text: "Pending Msg", access: "all", icon: <FiMessageSquare /> },
    { to: "/branch-management", text: "Branches", access: "bigadmin", icon: <FiGrid /> },
    { to: "/inventory-financials", text: "Finance & Profit", access: "bigadmin", icon: <FiDollarSign /> },
    { to: "/permissions", text: "Permissions", access: "bigadmin", icon: <FiShield /> },
  ];

  const renderLink = (link, sidebar = false) => {
    const cls = sidebar
      ? ({ isActive }) => (isActive ? "sidebar-nav-item active" : "sidebar-nav-item")
      : ({ isActive }) => (isActive ? "mobile-nav-item active" : "mobile-nav-item");

    const onClick = () => setIsMobileMenuOpen(false);

    if (link.access === "all") {
      return (
        <NavLink key={link.to} to={link.to} className={cls} onClick={onClick}>
          <span className="nav-icon">{link.icon}</span>
          <span className="nav-text">{link.text}</span>
        </NavLink>
      );
    }
    if (link.access === "bigadmin" && role === "bigadmin") {
      return (
        <NavLink key={link.to} to={link.to} className={cls} onClick={onClick}>
          <span className="nav-icon">{link.icon}</span>
          <span className="nav-text">{link.text}</span>
        </NavLink>
      );
    }
    if (canAccess(link.access)) {
      return (
        <NavLink key={link.to} to={link.to} className={cls} onClick={onClick}>
          <span className="nav-icon">{link.icon}</span>
          <span className="nav-text">{link.text}</span>
        </NavLink>
      );
    }
    return null;
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <NavLink to="/home" className="sidebar-logo-link">
            <div className="sidebar-logo-container">
              <img src={logo} alt="Anbu Logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
            </div>
            <span className="sidebar-title-styled">
              <img src={anbuLogo} alt="ANBU" className="anbu-logo-img" />
              <span className="styled-enterprises">ENTERPRISES</span>
              <span className="styled-sales-service">Sales &amp; Service</span>
            </span>
          </NavLink>
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* SIDEBAR NAV */}
        <nav className="sidebar-nav">
          {navLinks.map((link) => renderLink(link, true))}
        </nav>

        {/* SIDEBAR LOGOUT */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-button" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HAMBURGER - Visible only on mobile */}
      <button
        className={`mobile-menu-button ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle mobile menu"
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* MOBILE MENU - Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="mobile-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={logo} alt="Anbu Logo" style={{ width: "28px", height: "28px", objectFit: "cover", borderRadius: "6px" }} />
                <span className="sidebar-title-styled">
                  <img src={anbuLogo} alt="ANBU" className="anbu-logo-img" style={{ height: "2rem" }} />
                  <span className="styled-enterprises" style={{ fontSize: "0.85rem", marginTop: "-4px" }}>ENTERPRISES</span>
                  <span className="styled-sales-service" style={{ fontSize: "0.5rem", padding: "2px 5px", marginTop: "1px" }}>Sales & Service</span>
                </span>
              </div>
              <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
            </div>
            {navLinks.map((link) => renderLink(link, false))}
            <button className="mobile-logout-button" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* PAGE CONTENT */}
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
