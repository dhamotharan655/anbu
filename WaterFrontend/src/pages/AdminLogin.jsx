import React, { useState } from "react";
import api from "../api";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logoImage from "../assets/main_logo.jpg";
import anbuLogo from "../assets/anbu_text_logo.png";
import { FiLogIn, FiUser, FiLock, FiEye, FiEyeOff, FiShield, FiZap, FiUsers, FiTrendingUp } from "react-icons/fi";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setUsernameError("");
    setPasswordError("");
    setIsLoading(true);

    try {
      const response = await api.post(`login/`, {
        full_name: username,
        password,
      });

      const token = response.data.token;
      const role = response.data.role;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user_id", response.data.user_id);
      sessionStorage.setItem("role", role);
      sessionStorage.setItem("full_name", username);
      sessionStorage.setItem("permissions", JSON.stringify(response.data.permissions));

      if (role === "admin" || role === "bigadmin") {
        try {
          const attendanceResponse = await api.get("staff-attendance/today/");
          if (!attendanceResponse.data.attendance_marked) {
            sessionStorage.setItem("showAttendanceReminder", "true");
          }
        } catch (e) {
          console.error("Attendance check failed:", e);
        }
      }

      navigate("/Home");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const msg = error.response.data.detail;
        if (msg === "Invalid username") setUsernameError(msg);
        else setPasswordError(msg || "An unexpected error occurred.");
      } else {
        setPasswordError("Network error or unexpected issue.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { icon: <FiUsers size={18} />, label: "Staff Managed", value: "50+" },
    { icon: <FiTrendingUp size={18} />, label: "Daily Jobs", value: "30+" },
    { icon: <FiZap size={18} />, label: "Uptime", value: "99.9%" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,600;1,600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.06); }
          66% { transform: translate(-20px, 25px) scale(0.95); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.7; }
          50%  { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 0.7; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          padding: 15px 18px 15px 48px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          color: #ffffff;
          outline: none;
          transition: all 0.3s ease;
          -webkit-text-fill-color: #ffffff;
        }
        .login-input::placeholder { color: rgba(255,255,255,0.35); }
        .login-input:focus {
          border-color: #0e8fa8;
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 4px rgba(14,143,168,0.25);
        }
        .login-input.error {
          border-color: rgba(239,68,68,0.7);
          box-shadow: 0 0 0 4px rgba(239,68,68,0.15);
        }
        .btn-login {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #0e8fa8 0%, #0b6678 100%);
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 28px rgba(14,143,168,0.3);
          position: relative;
          overflow: hidden;
          letter-spacing: -0.01em;
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 40px rgba(14,143,168,0.45);
          background: linear-gradient(135deg, #128299 0%, #0e8fa8 100%);
        }
        .btn-login:active:not(:disabled) { transform: translateY(0); }
        .btn-login:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-login::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .btn-login:hover::after { transform: translateX(100%); }

        .stat-chip:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(14,143,168,0.4) !important;
        }

        @media (max-width: 900px) {
          .login-left { display: none !important; }
          .login-card { width: 100% !important; max-width: 440px !important; border-radius: 28px !important; }
          .login-wrapper { padding: 1rem !important; }
        }
        @media (max-width: 480px) {
          .login-card { border-radius: 20px !important; }
        }
      `}</style>

      {/* Full-screen container */}
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #071e26 0%, #0b3a4a 40%, #0d4d61 70%, #0b3a4a 100%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }} className="login-wrapper">

        {/* Animated background orbs */}
        {[
          { size: 600, top: "-200px", left: "-150px", color: "#0e8fa8", delay: "0s", opacity: 0.18 },
          { size: 450, bottom: "-150px", right: "-100px", color: "#f1b32a", delay: "-4s", opacity: 0.12 },
          { size: 300, top: "40%", right: "18%", color: "#0b6678", delay: "-2s", opacity: 0.22 },
        ].map((orb, i) => (
          <div key={i} style={{
            position: "fixed",
            width: orb.size, height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: "blur(80px)",
            top: orb.top, bottom: orb.bottom,
            left: orb.left, right: orb.right,
            opacity: orb.opacity,
            animation: `floatOrb ${10 + i * 3}s ease-in-out infinite`,
            animationDelay: orb.delay,
            pointerEvents: "none",
          }} />
        ))}

        {/* Decorative grid dots */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }} />

        {/* Spinning ring accent */}
        <div style={{
          position: "fixed", width: "700px", height: "700px",
          border: "1px solid rgba(241,179,42,0.06)",
          borderRadius: "50%", top: "-200px", right: "-200px",
          animation: "spin-slow 60s linear infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed", width: "450px", height: "450px",
          border: "1px solid rgba(11,102,120,0.1)",
          borderRadius: "50%", bottom: "-100px", left: "-100px",
          animation: "spin-slow 40s linear infinite reverse",
          pointerEvents: "none",
        }} />

        {/* Main card */}
        <div className="login-card" style={{
          display: "flex",
          width: "900px",
          maxWidth: "96vw",
          minHeight: "580px",
          borderRadius: "36px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          position: "relative",
          zIndex: 10,
          animation: "fadeSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) both",
        }}>

          {/* ── LEFT BRANDING PANEL ── */}
          <div className="login-left" style={{
            flex: 1,
            padding: "56px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(160deg, rgba(11,102,120,0.25) 0%, rgba(7,30,38,0.4) 100%)",
            position: "relative",
            overflow: "hidden",
            animation: "fadeSlideRight 0.9s cubic-bezier(0.16,1,0.3,1) both",
          }}>

            {/* Gold top accent line */}
            <div style={{
              position: "absolute", top: 0, left: "48px", right: "48px",
              height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(241,179,42,0.6), transparent)",
            }} />

            {/* Logo & brand */}
            <div>
              <div style={{
                width: "76px", height: "76px",
                borderRadius: "22px",
                background: "#ffffff",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "28px",
                boxShadow: "0 12px 32px rgba(11,102,120,0.4)",
                overflow: "hidden",
                position: "relative",
                padding: "8px", // add padding so the logo breathes
              }}>
                <img src={logoImage} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                {/* Pulse ring */}
                <div style={{
                  position: "absolute", inset: "-8px",
                  borderRadius: "28px",
                  border: "1.5px solid rgba(14,143,168,0.4)",
                  animation: "pulse-ring 2.5s ease-in-out infinite",
                }} />
              </div>

              <div className="sidebar-title-styled" style={{ marginBottom: "24px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                <img src={anbuLogo} alt="ANBU" style={{ height: "4.5rem", width: "auto", objectFit: "contain" }} />
                <span className="styled-enterprises" style={{ fontSize: "1.6rem", marginTop: "-10px" }}>ENTERPRISES</span>
                <span className="styled-sales-service" style={{ fontSize: "0.85rem", padding: "4px 10px", marginTop: "2px" }}>Sales & Service</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", marginBottom: "48px" }}>
                Admin Control Portal
              </p>

              {/* Feature list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { title: "Workforce Management", desc: "Track attendance, payroll & performance", color: "#0e8fa8" },
                  { title: "Customer & Orders", desc: "Manage bookings, invoices & reminders", color: "#f1b32a" },
                  { title: "Stock & Inventory", desc: "Real-time product tracking & alerts", color: "#10b981" },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    transition: "all 0.25s ease",
                  }}>
                    <div style={{
                      width: "10px", height: "10px",
                      borderRadius: "50%",
                      background: item.color,
                      marginTop: "5px",
                      flexShrink: 0,
                      boxShadow: `0 0 10px ${item.color}`,
                    }} />
                    <div>
                      <div style={{ color: "white", fontWeight: 700, fontSize: "13.5px", marginBottom: "2px" }}>{item.title}</div>
                      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "12px", marginTop: "36px" }}>
              {stats.map((s, i) => (
                <div key={i} className="stat-chip" style={{
                  flex: 1, textAlign: "center",
                  padding: "12px 8px",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  transition: "all 0.25s ease",
                  cursor: "default",
                }}>
                  <div style={{ color: "#f1b32a", marginBottom: "4px", display: "flex", justifyContent: "center" }}>{s.icon}</div>
                  <div style={{ color: "white", fontWeight: 800, fontSize: "16px" }}>{s.value}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT FORM PANEL ── */}
          <div style={{
            width: "380px",
            padding: "56px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>

            {/* Back to Home button */}
            <div style={{ marginBottom: "28px" }}>
              <button
                type="button"
                onClick={() => navigate("/")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.75)",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "100px",
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.22s ease",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                }}
              >
                ← Back to Home
              </button>
            </div>

            {/* Header */}
            <div style={{ marginBottom: "36px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "rgba(241,179,42,0.1)",
                border: "1px solid rgba(241,179,42,0.25)",
                borderRadius: "100px",
                padding: "5px 14px",
                marginBottom: "20px",
              }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f1b32a", boxShadow: "0 0 8px #f1b32a" }} />
                <span style={{ color: "#f1b32a", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px" }}>
                  Secure Access
                </span>
              </div>

              <h2 style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "30px",
                fontWeight: 600,
                color: "white",
                lineHeight: 1.2,
                marginBottom: "8px",
                letterSpacing: "-0.3px",
              }}>
                Welcome back
              </h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
                Sign in to your admin dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>

              {/* Username field */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{
                  display: "block", color: "rgba(255,255,255,0.55)",
                  fontSize: "11px", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "1.2px",
                  marginBottom: "8px",
                }}>Username</label>
                <div style={{ position: "relative" }}>
                  <FiUser size={17} style={{
                    position: "absolute", left: "16px", top: "50%",
                    transform: "translateY(-50%)",
                    color: usernameError ? "#ef4444" : "#0b6678",
                    pointerEvents: "none",
                  }} />
                  <input
                    type="text"
                    placeholder="Enter your username"
                    className={`login-input ${usernameError ? "error" : ""}`}
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setUsernameError(""); }}
                    autoComplete="username"
                  />
                </div>
                {usernameError && (
                  <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", paddingLeft: "4px" }}>
                    ⚠ {usernameError}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "block", color: "rgba(255,255,255,0.55)",
                  fontSize: "11px", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "1.2px",
                  marginBottom: "8px",
                }}>Password</label>
                <div style={{ position: "relative" }}>
                  <FiLock size={17} style={{
                    position: "absolute", left: "16px", top: "50%",
                    transform: "translateY(-50%)",
                    color: passwordError ? "#ef4444" : "#0b6678",
                    pointerEvents: "none",
                  }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`login-input ${passwordError ? "error" : ""}`}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                    autoComplete="current-password"
                    style={{ paddingRight: "48px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: "14px", top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "#6b7280", padding: "4px",
                      lineHeight: 0, transition: "color 0.2s",
                    }}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {passwordError && (
                  <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", paddingLeft: "4px" }}>
                    ⚠ {passwordError}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button type="submit" className="btn-login" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div style={{
                      width: "18px", height: "18px",
                      border: "2px solid rgba(0,0,0,0.3)",
                      borderTopColor: "#1a0a00",
                      borderRadius: "50%",
                      animation: "spin-slow 0.7s linear infinite",
                    }} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <FiLogIn size={18} />
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div style={{
              marginTop: "32px",
              padding: "16px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "rgba(255,255,255,0.35)",
              fontSize: "12px",
            }}>
              <FiShield size={13} color="rgba(241,179,42,0.6)" />
              Your data is encrypted &amp; secured
            </div>
          </div>

        </div>

        {/* Bottom brand tag */}
        <div style={{
          position: "fixed", bottom: "20px",
          color: "rgba(255,255,255,0.18)",
          fontSize: "11px", fontWeight: 500,
          letterSpacing: "0.5px",
          zIndex: 20,
        }}>
          © 2025 Anbu Enterprises — All rights reserved
        </div>

      </div>
    </>
  );
};

export default AdminLogin;
