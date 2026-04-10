import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import rumahLogo from "./assets/Ruban-Electricals-Logo.jpeg";

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
    { to: "/home", text: "Home", access: "all", icon: "🏠" },
    { to: "/dashboard", text: "Dashboard", access: "dashboard", icon: "📊" },
    { to: "/payment-due", text: "Payment Due", access: "dashboard", icon: "💰" },
    { to: "/booking", text: "Booking", access: "booking", icon: "📅" },
    { to: "/staff", text: "Staff", access: "staff", icon: "👥" },
    { to: "/payroll", text: "Payroll", access: "payroll", icon: "💵" },
    { to: "/customers", text: "Customers", access: "customers", icon: "👤" },
    { to: "/staff-performance", text: "Performance", access: "staff-performance", icon: "📈" },
    { to: "/stock-management", text: "Stock", access: "stock-management", icon: "📦" },
    { to: "/invoices", text: "Invoices", access: "invoices", icon: "🧾" },
    { to: "/whatsapp-pending", text: "Pending Messages", access: "all", icon: "💬" },
    { to: "/motor-history", text: "Motor History", access: "motor-history", icon: "⚡" },
    { to: "/permissions", text: "Permissions", access: "bigadmin", icon: "🔐" },
  ];

  const renderLink = (link, sidebar = false) => {
    const cls = sidebar
      ? ({ isActive }) => (isActive ? "sidebar-nav-item active" : "sidebar-nav-item")
      : ({ isActive }) => (isActive ? "mobile-nav-item active" : "mobile-nav-item");

    const onClick = sidebar ? () => setIsMobileMenuOpen(false) : undefined;

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
            <img src={rumahLogo} alt="Ruban Electricals Logo" className="sidebar-logo" />
            <span className="sidebar-title">
              <span className="title-line">Ruban</span>
              <span className="title-line">Electricals</span>
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
        className="mobile-menu-button"
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
              <img src={rumahLogo} alt="Logo" className="mobile-menu-logo" />
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
