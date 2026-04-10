import React, { useState } from "react";
import api from "../api";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logoImage from "../assets/Ruban-Electricals-Logo.jpeg";

import { FiLogIn, FiUser, FiLock, FiShield, FiPackage, FiFileText, FiBarChart2, FiEye, FiEyeOff } from "react-icons/fi";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setUsernameError("");
    setPasswordError("");

    try {
      const response = await api.post(`login/`, {
        full_name: username,
        password,
      });

      console.log("Login successful:", response.data);

      const token = response.data.token;
      const role = response.data.role;
      const permissions = response.data.permissions || [];

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user_id", response.data.user_id);
      sessionStorage.setItem("role", response.data.role);
      sessionStorage.setItem("full_name", username);
      sessionStorage.setItem("permissions", JSON.stringify(response.data.permissions));

      if (role === 'admin' || role === 'bigadmin') {
        try {
          const attendanceResponse = await api.get('staff-attendance/today/');
          const attendanceData = attendanceResponse.data;
          
          if (!attendanceData.attendance_marked) {
            sessionStorage.setItem('showAttendanceReminder', 'true');
          }
        } catch (attendanceError) {
          console.error('Error checking attendance status:', attendanceError);
        }
      }
      
      navigate("/Home");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.detail;

        if (errorMessage === "Invalid username") {
          setUsernameError(errorMessage);
        } else if (errorMessage === "password incorrect") {
          setPasswordError(errorMessage);
        } else {
          setPasswordError(errorMessage || "An unexpected error occurred.");
        }
      } else {
        setPasswordError("Network error or unexpected issue.");
      }
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
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
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(36px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pill:hover {
          background: rgba(255,255,255,0.85);
          transform: translateX(4px);
          box-shadow: 0 4px 16px rgba(124,92,191,0.1);
        }
        .btn-signin:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(124,92,191,0.38);
        }
        .btn-signin:active {
          transform: translateY(0);
        }
        .btn-signin::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transition: left 0.5s ease;
        }
        .btn-signin:hover::before {
          left: 100%;
        }
        .remember input:checked ~ .cb-box {
          background: linear-gradient(135deg, #9b6fe8, #6baee0);
          border-color: transparent;
        }
        .remember input:checked ~ .cb-box::after {
          content: '';
          width: 5px;
          height: 9px;
          border: 2px solid white;
          border-top: none;
          border-left: none;
          transform: rotate(45deg) translateY(-1px);
          display: block;
        }
        @media (max-width: 680px) {
          .left-panel { display: none !important; }
          .right-panel { width: 100% !important; }
        }
      `}</style>
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0e6ff 0%, #dceeff 40%, #ffe6f0 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* Animated blobs */}
        <div style={{
          position: "fixed",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #c9a8ff, #a8d4ff)",
          filter: "blur(70px)",
          top: "-150px",
          left: "-100px",
          opacity: 0.55,
          animation: "blobFloat 10s ease-in-out infinite",
          pointerEvents: "none",
        }}></div>
        <div style={{
          position: "fixed",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #ffd6ec, #ffecb3)",
          filter: "blur(70px)",
          bottom: "-100px",
          right: "-80px",
          opacity: 0.55,
          animation: "blobFloat 10s ease-in-out infinite",
          animationDelay: "-5s",
          pointerEvents: "none",
        }}></div>
        <div style={{
          position: "fixed",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #b3f0e0, #b3d9ff)",
          filter: "blur(70px)",
          top: "40%",
          right: "20%",
          opacity: 0.55,
          animation: "blobFloat 10s ease-in-out infinite",
          animationDelay: "-3s",
          pointerEvents: "none",
        }}></div>
        
        {/* Decorative circles */}
        <div style={{
          position: "fixed",
          borderRadius: "50%",
          border: "1.5px solid rgba(124,92,191,0.1)",
          pointerEvents: "none",
          width: "300px",
          height: "300px",
          top: "5%",
          left: "5%",
        }}></div>
        <div style={{
          position: "fixed",
          borderRadius: "50%",
          border: "1.5px solid rgba(124,92,191,0.1)",
          pointerEvents: "none",
          width: "180px",
          height: "180px",
          bottom: "10%",
          left: "15%",
        }}></div>
        <div style={{
          position: "fixed",
          borderRadius: "50%",
          border: "1.5px solid rgba(124,92,191,0.1)",
          pointerEvents: "none",
          width: "120px",
          height: "120px",
          top: "20%",
          right: "10%",
        }}></div>

        <div style={{
          display: "flex",
          width: "880px",
          maxWidth: "95vw",
          minHeight: "560px",
          borderRadius: "32px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 32px 80px rgba(124,92,191,0.18), 0 0 0 1px rgba(255,255,255,0.5)",
          position: "relative",
          zIndex: 10,
          animation: "rise 0.75s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {/* Left Panel */}
          <div className="left-panel" style={{
            flex: 1,
            background: "linear-gradient(160deg, rgba(200,170,255,0.3) 0%, rgba(170,210,255,0.2) 100%)",
            padding: "52px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid rgba(255,255,255,0.6)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                width: "70px",
                height: "70px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #9b6fe8, #6baee0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
                boxShadow: "0 8px 24px rgba(124,92,191,0.3)",
                overflow: "hidden",
              }}>
                <img src={logoImage} alt="Ruban Electricals Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
              </div>
              <div style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "28px",
                fontWeight: 600,
                letterSpacing: "-0.5px",
                lineHeight: 1.15,
                marginBottom: "6px",
                background: "linear-gradient(135deg, #6a3eb8, #3a7fc1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>Ruban Electricals</div>
              <div style={{ fontSize: "13px", color: "#8b85a1" }}>Admin Control Portal</div>
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#8b85a1",
                marginBottom: "16px",
                fontWeight: 600,
              }}>What you can manage</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="pill" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px 16px",
                  background: "rgba(255,255,255,0.65)",
                  border: "1px solid rgba(255,255,255,0.85)",
                  borderRadius: "14px",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.25s ease",
                  cursor: "pointer",
                }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #e8d5ff, #d5c0ff)",
                  }}>
                    <FiPackage size={18} color="#7c5cbf" />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#1e1b2e" }}>
                    Inventory Control
                    <span style={{ display: "block", fontSize: "11px", color: "#8b85a1", fontWeight: 400, marginTop: "1px" }}>Track stock, products & categories</span>
                  </div>
                </div>
                <div className="pill" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px 16px",
                  background: "rgba(255,255,255,0.65)",
                  border: "1px solid rgba(255,255,255,0.85)",
                  borderRadius: "14px",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.25s ease",
                  cursor: "pointer",
                }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #d5e8ff, #c0d5ff)",
                  }}>
                    <FiFileText size={18} color="#5b9bd5" />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#1e1b2e" }}>
                    Orders & Invoices
                    <span style={{ display: "block", fontSize: "11px", color: "#8b85a1", fontWeight: 400, marginTop: "1px" }}>Manage customer orders in real-time</span>
                  </div>
                </div>
                <div className="pill" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px 16px",
                  background: "rgba(255,255,255,0.65)",
                  border: "1px solid rgba(255,255,255,0.85)",
                  borderRadius: "14px",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.25s ease",
                  cursor: "pointer",
                }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #ffd5e8, #ffc0d5)",
                  }}>
                    <FiBarChart2 size={18} color="#d55b9b" />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#1e1b2e" }}>
                    Reports & Analytics
                    <span style={{ display: "block", fontSize: "11px", color: "#8b85a1", fontWeight: 400, marginTop: "1px" }}>Sales insights and performance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="right-panel" style={{
            width: "370px",
            padding: "52px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            <div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#7c5cbf",
                fontWeight: 700,
                marginBottom: "14px",
              }}>
                <div style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #9b6fe8, #6baee0)",
                  animation: "dotpulse 2s ease-in-out infinite",
                }}></div>
                Admin Access
              </div>
              <div style={{
                fontFamily: "'Fraunces', serif",
                fontSize: "32px",
                fontWeight: 600,
                lineHeight: 1.2,
                marginBottom: "6px",
              }}>
                Hello, <em style={{
                  fontStyle: "italic",
                  background: "linear-gradient(135deg, #9b6fe8, #6baee0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>Admin!</em>
              </div>
              <div style={{ fontSize: "14px", color: "#8b85a1", marginBottom: "36px" }}>Sign in to continue to your dashboard</div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div style={{ marginBottom: "18px" }}>
                <label style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#8b85a1",
                  marginBottom: "8px",
                }}>Username</label>
                <div style={{ position: "relative" }}>
                  <FiUser size={18} style={{
                    position: "absolute",
                    left: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#b0a8c8",
                    pointerEvents: "none",
                    transition: "color 0.3s",
                  }} />
                  <input
                    type="text"
                    placeholder="Enter username"
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.85)",
                      border: usernameError ? "1.5px solid #eb5968" : "1.5px solid rgba(180,160,220,0.25)",
                      borderRadius: "14px",
                      padding: "13px 16px 13px 44px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "15px",
                      color: "#1e1b2e",
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 8px rgba(124,92,191,0.06)",
                      boxSizing: "border-box",
                    }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                {usernameError && <span style={{ color: "#eb5968", fontSize: "12px", marginTop: "4px", marginLeft: "16px" }}>{usernameError}</span>}
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#8b85a1",
                  marginBottom: "8px",
                }}>Password</label>
                <div style={{ position: "relative" }}>
                  <FiLock size={18} style={{
                    position: "absolute",
                    left: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#b0a8c8",
                    pointerEvents: "none",
                    transition: "color 0.3s",
                  }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.85)",
                      border: passwordError ? "1.5px solid #eb5968" : "1.5px solid rgba(180,160,220,0.25)",
                      borderRadius: "14px",
                      padding: "13px 16px 13px 44px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "15px",
                      color: "#1e1b2e",
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 8px rgba(124,92,191,0.06)",
                      boxSizing: "border-box",
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#c0b8d8",
                    transition: "color 0.3s",
                    padding: "4px",
                    lineHeight: 0,
                  }} onClick={togglePassword}>
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {passwordError && <span style={{ color: "#eb5968", fontSize: "12px", marginTop: "4px", marginLeft: "16px" }}>{passwordError}</span>}
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}>
                <label className="remember" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#8b85a1",
                  userSelect: "none",
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ display: "none" }}
                  />
                  <div className="cb-box" style={{
                    width: "17px",
                    height: "17px",
                    border: "1.5px solid rgba(124,92,191,0.3)",
                    borderRadius: "5px",
                    background: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}></div>
                  Remember me
                </label>
                <a href="#" style={{ fontSize: "13px", color: "#7c5cbf", textDecoration: "none", fontWeight: 500, transition: "opacity 0.2s" }}>Forgot password?</a>
              </div>

              <button type="submit" className="btn-signin" style={{
                width: "100%",
                padding: "15px",
                border: "none",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #9b6fe8 0%, #6baee0 100%)",
                color: "white",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 6px 24px rgba(124,92,191,0.3)",
                position: "relative",
                overflow: "hidden",
              }}>
                <FiLogIn size={18} />
                Sign In to Dashboard
              </button>
            </form>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "20px 0",
              color: "#8b85a1",
              fontSize: "12px",
            }}>
              <span style={{ flex: 1, height: "1px", background: "rgba(124,92,191,0.12)" }}></span>
              <span>protected access</span>
              <span style={{ flex: 1, height: "1px", background: "rgba(124,92,191,0.12)" }}></span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "12px",
              color: "#8b85a1",
            }}>
              <FiShield size={13} />
              Your data is protected & encrypted
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
