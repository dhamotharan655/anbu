import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import '../App.css';
import '../index.css';
import {
  FiTrendingUp,
  FiPackage,
  FiUsers,
  FiArchive,
  FiSmile,
  FiCheckSquare,
  FiClipboard,
  FiChevronRight,
  FiUserCheck,
  FiAlertTriangle,
  FiShield,
} from "react-icons/fi";

/* ================= MENU CONFIG ================= */

const menuItems = [
  {
    key: "Customers",
    title: "Manage Customers",
    subtitle: "View and manage all customers",
    icon: <FiUserCheck />,
    destination: "/customers",
    permission: "customers",
    color: "purple",
  },
  {
    key: "Booking",
    title: "Book a New Service",
    subtitle: "Submit new complaints or service requests",
    icon: <FiPackage />,
    destination: "/booking",
    permission: "booking",
    color: "blue",
  },
  {
    key: "Staff",
    title: "Staff Management",
    subtitle: "Manage team members and assignments",
    icon: <FiUsers />,
    destination: "/staff",
    permission: "staff",
    color: "mint",
  },
  {
    key: "History",
    title: "Service History",
    subtitle: "View all completed service records",
    icon: <FiArchive />,
    destination: "/history",
    permission: "history",
    color: "pink",
  },
  {
    key: "Dashboard",
    title: "Detailed Dashboard",
    subtitle: "Monitor & manage service complaints",
    icon: <FiTrendingUp />,
    destination: "/dashboard",
    permission: "dashboard",
    color: "peach",
  },
];

/* ================= COMPONENT ================= */

const Home = () => {
  const navigate = useNavigate();

  // 🔐 Role & permissions
  const role = sessionStorage.getItem("role");
  const fullName = sessionStorage.getItem("full_name") || "Admin";
  const permissions = JSON.parse(sessionStorage.getItem("permissions") || "[]");

  const [stats, setStats] = useState({
    completed: "0",
    pending: "0",
    team: "0",
  });

  /* ================= PERMISSION CHECK ================= */

  const canAccess = (permission) => {
    if (role === "bigadmin") return true;
    return permissions.includes(permission);
  };

  /* ================= FETCH DASHBOARD STATS ================= */

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const complaintsRes = await api.get("complaints/");
        const complaints = Array.isArray(complaintsRes.data)
          ? complaintsRes.data
          : [];

        // Filter out initial records (created from Add Customer) which are not real jobs
        const realComplaints = complaints.filter((c) => !c.is_initial);

        const staffRes = await api.get("staff/");
        const staff = Array.isArray(staffRes.data) ? staffRes.data : [];

        setStats({
          completed: realComplaints
            .filter((c) => c.status?.toLowerCase() === "completed")
            .length.toString(),
          pending: realComplaints
            .filter((c) => c.status?.toLowerCase() === "pending")
            .length.toString(),
          team: staff.length.toString(),
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchDashboardStats();
  }, []);

  /* ================= QUICK STATS ================= */

  const quickStats = [
    {
      label: "Completed Tasks",
      value: stats.completed,
      icon: <FiCheckSquare />,
      className: "success",
      badge: "On track",
      badgeClass: "badge-green",
      destination: "/history",
      permission: "history",
    },
    {
      label: "Pending Tasks",
      value: stats.pending,
      icon: <FiClipboard />,
      className: "warning",
      badge: "In queue",
      badgeClass: "badge-orange",
      destination: "/dashboard",
      permission: "dashboard",
    },
    {
      label: "Team Members",
      value: stats.team,
      icon: <FiUsers />,
      className: "info",
      badge: "Active",
      badgeClass: "badge-blue",
      destination: "/staff",
      permission: "staff",
    },
  ].filter((stat) => canAccess(stat.permission));

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("permissions");
    navigate("/admin-login");
  };

  // Styles object
  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0e6ff 0%, #dceeff 40%, #ffe6f0 100%)",
      position: "relative",
      overflowX: "hidden",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    blob1: {
      position: "fixed",
      width: "500px",
      height: "500px",
      borderRadius: "50%",
      background: "radial-gradient(circle, #c9a8ff, #a8d4ff)",
      filter: "blur(70px)",
      pointerEvents: "none",
      opacity: 0.45,
      animation: "blobFloat 10s ease-in-out infinite",
      top: "-150px",
      left: "-100px",
    },
    blob2: {
      position: "fixed",
      width: "400px",
      height: "400px",
      borderRadius: "50%",
      background: "radial-gradient(circle, #ffd6ec, #ffecb3)",
      filter: "blur(70px)",
      pointerEvents: "none",
      opacity: 0.45,
      animation: "blobFloat 10s ease-in-out infinite",
      animationDelay: "-5s",
      bottom: "-100px",
      right: "-80px",
    },
    blob3: {
      position: "fixed",
      width: "280px",
      height: "280px",
      borderRadius: "50%",
      background: "radial-gradient(circle, #b3f0e0, #b3d9ff)",
      filter: "blur(70px)",
      pointerEvents: "none",
      opacity: 0.45,
      animation: "blobFloat 10s ease-in-out infinite",
      animationDelay: "-3s",
      top: "40%",
      right: "20%",
    },
    main: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "36px 40px 60px",
      position: "relative",
      zIndex: 1,
    },
    hero: {
      borderRadius: "24px",
      padding: "40px 48px",
      marginBottom: "40px",
      background: "linear-gradient(135deg, #9b6fe8 0%, #6baee0 60%, #a8d4ff 100%)",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 16px 48px rgba(124,92,191,0.3)",
      animation: "rise 0.6s cubic-bezier(0.16,1,0.3,1) both",
    },
    heroDeco1: {
      position: "absolute",
      right: "-60px",
      top: "-60px",
      width: "300px",
      height: "300px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.08)",
    },
    heroDeco2: {
      position: "absolute",
      right: "60px",
      bottom: "-40px",
      width: "180px",
      height: "180px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.06)",
    },
    heroContent: {
      position: "relative",
      zIndex: 1,
    },
    heroEyebrow: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "rgba(255,255,255,0.2)",
      border: "1px solid rgba(255,255,255,0.3)",
      padding: "5px 14px",
      borderRadius: "100px",
      fontSize: "12px",
      color: "rgba(255,255,255,0.9)",
      fontWeight: 600,
      letterSpacing: "1px",
      textTransform: "uppercase",
      marginBottom: "16px",
    },
    heroDot: {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: "#fff",
      animation: "dotpulse 2s ease-in-out infinite",
    },
    heroTitle: {
      fontFamily: "'Fraunces', serif",
      fontSize: "36px",
      fontWeight: 600,
      color: "white",
      lineHeight: 1.15,
      marginBottom: "10px",
    },
    heroSub: {
      fontSize: "15px",
      color: "rgba(255,255,255,0.75)",
      maxWidth: "480px",
      lineHeight: 1.6,
    },
    heroStats: {
      display: "flex",
      gap: "24px",
      marginTop: "28px",
    },
    heroStat: {
      background: "rgba(255,255,255,0.15)",
      border: "1px solid rgba(255,255,255,0.25)",
      borderRadius: "14px",
      padding: "12px 20px",
      backdropFilter: "blur(10px)",
      transition: "all 0.2s",
    },
    heroStatNum: {
      fontFamily: "'Fraunces', serif",
      fontSize: "24px",
      fontWeight: 600,
      color: "white",
      lineHeight: 1,
    },
    heroStatLabel: {
      fontSize: "11px",
      color: "rgba(255,255,255,0.7)",
      marginTop: "4px",
      fontWeight: 500,
    },
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "20px",
    },
    sectionTitle: {
      fontFamily: "'Fraunces', serif",
      fontSize: "22px",
      fontWeight: 600,
      color: "#1e1b2e",
    },
    sectionTitleSpan: {
      fontSize: "13px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontStyle: "normal",
      fontWeight: 500,
      color: "#8b85a1",
      marginLeft: "10px",
    },
    viewAll: {
      fontSize: "13px",
      color: "#7c5cbf",
      textDecoration: "none",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: "4px",
      transition: "gap 0.2s",
    },
    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "20px",
      marginBottom: "40px",
      animation: "rise 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both",
    },
    statCard: {
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.8)",
      borderRadius: "20px",
      padding: "24px 22px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      boxShadow: "0 4px 20px rgba(124,92,191,0.12)",
      transition: "all 0.25s ease",
      cursor: "pointer",
    },
    statIconWrap: {
      width: "44px",
      height: "44px",
      borderRadius: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
    },
    siGreen: {
      background: "linear-gradient(135deg, #d4f7e7, #b8f0d5)",
    },
    siOrange: {
      background: "linear-gradient(135deg, #ffe8cc, #ffd6aa)",
    },
    siRed: {
      background: "linear-gradient(135deg, #ffd5d5, #ffb8b8)",
    },
    siBlue: {
      background: "linear-gradient(135deg, #d5e8ff, #b8d5ff)",
    },
    statNum: {
      fontFamily: "'Fraunces', serif",
      fontSize: "32px",
      fontWeight: 600,
      lineHeight: 1,
      color: "#1e1b2e",
    },
    statLabel: {
      fontSize: "13px",
      color: "#8b85a1",
      fontWeight: 500,
    },
    statBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "11px",
      fontWeight: 600,
      padding: "3px 9px",
      borderRadius: "100px",
    },
    badgeGreen: {
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.8)",
      color: "#5a4a8a",
      boxShadow: "0 4px 20px rgba(124,92,191,0.12)",
    },
    badgeOrange: {
      background: "rgba(255,159,67,0.12)",
      color: "#c77b00",
    },
    badgeRed: {
      background: "rgba(255,99,99,0.12)",
      color: "#c74747",
    },
    badgeBlue: {
      background: "rgba(91,155,213,0.12)",
      color: "#3a7fc1",
    },
    servicesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "16px",
      animation: "rise 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both",
    },
    serviceCard: {
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.8)",
      borderRadius: "20px",
      padding: "22px 24px",
      display: "flex",
      alignItems: "center",
      gap: "18px",
      boxShadow: "0 4px 20px rgba(124,92,191,0.12)",
      textDecoration: "none",
      color: "inherit",
      transition: "all 0.25s ease",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
    },
    serviceCardBefore: {
      content: "",
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: "4px",
      background: "linear-gradient(180deg, #9b6fe8, #6baee0)",
      opacity: 0,
      transition: "opacity 0.25s",
      borderRadius: "4px 0 0 4px",
    },
    svcIcon: {
      width: "50px",
      height: "50px",
      borderRadius: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "22px",
      flexShrink: 0,
      transition: "transform 0.25s",
    },
    svcPurple: {
      background: "linear-gradient(135deg, #e8d5ff, #d5c0ff)",
    },
    svcBlue: {
      background: "linear-gradient(135deg, #d5e8ff, #c0d5ff)",
    },
    svcMint: {
      background: "linear-gradient(135deg, #d5ffe8, #c0ffd5)",
    },
    svcPink: {
      background: "linear-gradient(135deg, #ffd5e8, #ffc0d5)",
    },
    svcPeach: {
      background: "linear-gradient(135deg, #ffe8d5, #ffd5c0)",
    },
    svcInfo: {
      flex: 1,
    },
    svcTitle: {
      fontSize: "15px",
      fontWeight: 700,
      color: "#1e1b2e",
      marginBottom: "4px",
    },
    svcDesc: {
      fontSize: "13px",
      color: "#8b85a1",
    },
    svcArrow: {
      color: "#8b85a1",
      flexShrink: 0,
      transition: "all 0.25s",
    },
  };

  return (
    <>
      <style>{`
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.04); }
          66% { transform: translate(-15px, 20px) scale(0.97); }
        }
        @keyframes dotpulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .home-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(124,92,191,0.15);
          background: rgba(255,255,255,0.85);
        }
        .home-service-card:hover {
          transform: translateX(6px);
          background: rgba(255,255,255,0.88);
          box-shadow: 0 8px 32px rgba(124,92,191,0.15);
        }
        .home-service-card:hover::before {
          opacity: 1;
        }
        .home-service-card:hover .svc-icon {
          transform: scale(1.08);
        }
        .home-service-card:hover .svc-arrow {
          color: #7c5cbf;
          transform: translateX(4px);
        }
        .view-all:hover {
          gap: 8px;
        }
        .hero-stat:hover {
          background: rgba(255,255,255,0.22);
          transform: translateY(-2px);
        }
        @media (max-width: 900px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .services-grid { grid-template-columns: 1fr; }
          .hero-stats { flex-wrap: flex; }
          .main { padding: 24px 20px 48px; }
        }
      `}</style>
      <div style={styles.container}>
        {/* Animated blobs */}
        <div style={styles.blob1}></div>
        <div style={styles.blob2}></div>
        <div style={styles.blob3}></div>

        <main style={styles.main}>
          {/* HERO */}
          <div style={styles.hero}>
            <div style={styles.heroDeco1}></div>
            <div style={styles.heroDeco2}></div>
            <div style={styles.heroContent}>
              <div style={styles.heroEyebrow}>
                <div style={styles.heroDot}></div>
                Admin Portal
              </div>
              <h1 style={styles.heroTitle}>
                Welcome Back, <em>{fullName}</em> ✦
              </h1>
              <p style={styles.heroSub}>
                Manage your services with ease and efficiency. Everything you need is right here.
              </p>
              <div style={styles.heroStats}>
                <div style={styles.heroStat}>
                  <div style={styles.heroStatNum}>{stats.completed}</div>
                  <div style={styles.heroStatLabel}>Completed Tasks</div>
                </div>
                <div style={styles.heroStat}>
                  <div style={styles.heroStatNum}>{stats.pending}</div>
                  <div style={styles.heroStatLabel}>Pending Tasks</div>
                </div>
                <div style={styles.heroStat}>
                  <div style={styles.heroStatNum}>{stats.team}</div>
                  <div style={styles.heroStatLabel}>Team Members</div>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK OVERVIEW */}
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>
              Quick Overview
              <span style={styles.sectionTitleSpan}>({quickStats.length} items)</span>
            </div>
            <a href="#" style={styles.viewAll}>View all →</a>
          </div>

          <div style={styles.statGrid}>
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className="home-stat-card"
                style={styles.statCard}
                onClick={() => stat.destination && navigate(stat.destination)}
              >
                <div style={{
                  ...styles.statIconWrap,
                  ...(stat.className === "success" ? styles.siGreen : 
                      stat.className === "warning" ? styles.siOrange : 
                      stat.className === "danger" ? styles.siRed : styles.siBlue)
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={styles.statNum}>{stat.value}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </div>
                <div style={{
                  ...styles.statBadge,
                  ...(stat.badgeClass === "badge-green" ? styles.badgeGreen :
                      stat.badgeClass === "badge-orange" ? styles.badgeOrange :
                      stat.badgeClass === "badge-red" ? styles.badgeRed : styles.badgeBlue)
                }}>
                  {stat.badge === "On track" && "↑ "}
                  {stat.badge === "In queue" && "⏳ "}
                  {stat.badge === "All clear" && "✓ "}
                  {stat.badge}
                </div>
              </div>
            ))}
          </div>

          {/* MAIN SERVICES */}
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>Main Services</div>
          </div>

          <div style={styles.servicesGrid}>
            {menuItems
              .filter((item) => canAccess(item.permission))
              .map((item) => (
                <div
                  key={item.key}
                  className="home-service-card"
                  style={styles.serviceCard}
                  onClick={() => navigate(item.destination)}
                >
                  <div style={{
                    ...styles.svcIcon,
                    ...(item.color === "purple" ? styles.svcPurple :
                        item.color === "blue" ? styles.svcBlue :
                        item.color === "mint" ? styles.svcMint :
                        item.color === "pink" ? styles.svcPink : styles.svcPeach)
                  }}>
                    {item.icon}
                  </div>
                  <div style={styles.svcInfo}>
                    <div style={styles.svcTitle}>{item.title}</div>
                    <div style={styles.svcDesc}>{item.subtitle}</div>
                  </div>
                  <div style={styles.svcArrow}>
                    <FiChevronRight size={20} />
                  </div>
                </div>
              ))}
          </div>
        </main>
      </div>
    </>
  );
};

export default Home;
