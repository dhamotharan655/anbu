import React, { useEffect, useState } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiSettings, FiUserPlus, FiTrash2, FiShield, FiCheck } from "react-icons/fi";

const COLORS = {
  primary: "#7c5cbf", secondary: "#6baee0", accent: "#9b6fe8",
  success: "#2d9e6b", danger: "#eb5968",
  text: "#1e1b2e", muted: "#8b85a1", white: "#ffffff",
  glass: "rgba(255,255,255,0.72)", glassBorder: "rgba(255,255,255,0.8)",
};

const glassCard = {
  background: COLORS.glass,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${COLORS.glassBorder}`,
  borderRadius: "20px",
  boxShadow: "0 4px 20px rgba(124,92,191,0.12)",
  padding: "1.75rem",
  marginBottom: "1.25rem",
};

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.88)",
  border: "1.5px solid rgba(124,92,191,0.15)", borderRadius: "14px",
  padding: "0.72rem 1rem", fontFamily: "'Plus Jakarta Sans',sans-serif",
  fontSize: "0.9rem", color: COLORS.text, outline: "none", boxSizing: "border-box",
};

const PAGE_ICONS = {
  dashboard: "📊", booking: "📋", staff: "👥", "add-staff": "➕",
  "staff-performance": "📈", history: "📂", customers: "🧑‍🤝‍🧑",
  "add-customer": "👤", "stock-management": "📦",
  invoices: "🧾", "motor-details": "🔧", "motor-history": "⚡", payroll: "💵", "holiday-management": "📅",
};

const PermissionPage = () => {
  const [activeTab, setActiveTab] = useState("permissions");
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [newUser, setNewUser] = useState({ full_name: "", password: "" });

  const availablePages = [
    "dashboard", "booking", "staff", "add-staff", "staff-performance",
    "history", "customers", "add-customer", "stock-management",
    "invoices", "motor-details", "motor-history", "payroll", "holiday-management",
  ];

  useEffect(() => {
    api.get("/users/")
      .then((res) => setAdmins(res.data))
      .catch((err) => console.error("Error loading admins:", err));
  }, []);

  const togglePermission = (page) => {
    setPermissions((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]
    );
  };

  const grantAllPermissions = () => setPermissions(availablePages);
  const removeAllPermissions = () => setPermissions([]);

  const savePermissions = async () => {
    if (!selectedAdmin) return alert("Please select an admin!");
    try {
      await api.put(`/update-permissions/${selectedAdmin}/`, { permissions });
      alert("Permissions updated successfully!");
      const currentUserId = sessionStorage.getItem("user_id");
      if (currentUserId && currentUserId === selectedAdmin) {
        sessionStorage.setItem("permissions", JSON.stringify(permissions));
      }
    } catch (err) {
      alert("Failed to update permissions!");
    }
  };

  const createUser = async () => {
    if (!newUser.full_name || !newUser.password) return alert("Please fill in both fields!");
    try {
      await api.post("/users/create/", newUser);
      alert("User created successfully!");
      setNewUser({ full_name: "", password: "" });
      const res = await api.get("/users/");
      setAdmins(res.data);
      const newUserData = res.data.find(u => u.full_name === newUser.full_name);
      if (newUserData) {
        setSelectedAdmin(newUserData.id);
        const userDetails = await api.get(`/user/${newUserData.id}/`);
        setPermissions(userDetails.data.permissions || []);
      }
      setActiveTab("permissions");
    } catch (err) {
      alert("Failed to create user!");
    }
  };

  const deleteUser = async (userId, userName) => {
    try {
      await api.delete(`/users/${userId}/delete/`);
      alert("User deleted successfully!");
      const res = await api.get("/users/");
      setAdmins(res.data);
      if (selectedAdmin === userId) { setSelectedAdmin(null); setPermissions([]); }
    } catch (err) {
      alert(`Failed to delete user: ${err.response?.data?.error || err.message}`);
    }
  };

  const tabs = [
    { id: "permissions", label: "Permissions", icon: <FiSettings /> },
    { id: "users", label: "Users", icon: <FiUserPlus /> },
  ];

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* HEADER */}
      <section className="page-section" style={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ textAlign: "center" }}>
          <h1 className="section-title">Admin Management</h1>
          <p className="section-subtitle">Manage user permissions and create admin accounts</p>
        </motion.div>
      </section>

      {/* TABS */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", margin: "0 auto", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", borderRadius: "100px", padding: "5px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 4px 20px rgba(124,92,191,0.1)", maxWidth: "360px" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.5rem", padding: "0.55rem 1.25rem", border: "none",
              borderRadius: "100px", fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", transition: "all 0.25s ease",
              background: activeTab === tab.id ? "linear-gradient(135deg,#9b6fe8,#6baee0)" : "transparent",
              color: activeTab === tab.id ? "white" : COLORS.muted,
              boxShadow: activeTab === tab.id ? "0 3px 12px rgba(124,92,191,0.32)" : "none",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </motion.div>

      {/* PERMISSIONS TAB */}
      {activeTab === "permissions" && (
        <div style={{ maxWidth: "680px", margin: "0 auto", width: "100%" }}>
          {/* Select admin */}
          <motion.div style={glassCard} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.15rem", fontWeight: 600, color: COLORS.text, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiUser color={COLORS.primary} /> Select Admin
            </h2>
            <select
              style={inputStyle}
              value={selectedAdmin || ""}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedAdmin(id);
                if (id) {
                  api.get(`/user/${id}/`).then((res) => setPermissions(res.data.permissions || []));
                } else {
                  setPermissions([]);
                }
              }}
            >
              <option value="">— Choose Admin —</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>{admin.full_name}</option>
              ))}
            </select>
          </motion.div>

          {/* Permissions */}
          <AnimatePresence>
            {selectedAdmin && (
              <motion.div style={glassCard} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.15rem", fontWeight: 600, color: COLORS.text, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FiShield color={COLORS.primary} /> Allowed Pages
                </h2>

                <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1.25rem" }}>
                  {availablePages.map((page) => {
                    const isOn = permissions.includes(page);
                    return (
                      <motion.div
                        key={page}
                        whileHover={{ scale: 1.015 }}
                        onClick={() => togglePermission(page)}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.75rem",
                          padding: "0.85rem 1rem", cursor: "pointer", borderRadius: "14px",
                          border: `1.5px solid ${isOn ? "rgba(124,92,191,0.3)" : "rgba(124,92,191,0.1)"}`,
                          background: isOn ? "linear-gradient(135deg,rgba(155,111,232,0.1),rgba(107,174,224,0.1))" : "rgba(255,255,255,0.5)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>{PAGE_ICONS[page] || "📄"}</span>
                        <span style={{ flex: 1, fontWeight: 600, color: COLORS.text, fontSize: "0.9rem", textTransform: "capitalize" }}>{page.replace(/-/g, " ")}</span>
                        <div style={{
                          width: "22px", height: "22px", borderRadius: "6px", border: `1.5px solid ${isOn ? "transparent" : "rgba(124,92,191,0.25)"}`,
                          background: isOn ? "linear-gradient(135deg,#9b6fe8,#6baee0)" : "white",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {isOn && <FiCheck size={13} color="white" strokeWidth={3} />}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button className="button-primary" style={{ flex: 1, minWidth: "120px" }} onClick={grantAllPermissions}>Grant All</button>
                  <button className="button-secondary" style={{ flex: 1, minWidth: "120px" }} onClick={removeAllPermissions}>Remove All</button>
                  <button className="button-primary" style={{ width: "100%", marginTop: "0.5rem" }} onClick={savePermissions}>Save Permissions</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div style={{ maxWidth: "680px", margin: "0 auto", width: "100%" }}>
          {/* Add user */}
          <motion.div style={glassCard} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.15rem", fontWeight: 600, color: COLORS.text, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiUserPlus color={COLORS.primary} /> Add New User
            </h2>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label">Username</label>
              <input className="form-input" type="text" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="Enter username" />
            </div>

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Enter password" />
            </div>

            <button className="button-primary" onClick={createUser} style={{ width: "100%" }}>
              <FiUserPlus /> Create User
            </button>
          </motion.div>

          {/* Existing users */}
          <motion.div style={glassCard} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.15rem", fontWeight: 600, color: COLORS.text, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiUser color={COLORS.primary} /> Existing Users
            </h2>

            {admins.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {admins.map((admin) => (
                  <motion.div
                    key={admin.id}
                    whileHover={{ scale: 1.012 }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem 1rem", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "14px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg,#9b6fe8,#6baee0)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>
                        {admin.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: COLORS.text, fontSize: "0.9rem" }}>{admin.full_name}</div>
                        <div style={{ fontSize: "0.75rem", color: COLORS.muted }}>
                          {admin.role === "bigadmin" ? "⭐ Super Admin" : "Admin"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => admin.role !== "bigadmin" && deleteUser(admin.id, admin.full_name)}
                      disabled={admin.role === "bigadmin"}
                      style={{
                        width: "36px", height: "36px", borderRadius: "50%", border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: admin.role === "bigadmin" ? "not-allowed" : "pointer",
                        background: admin.role === "bigadmin" ? "rgba(124,92,191,0.06)" : "rgba(235,89,104,0.1)",
                        color: admin.role === "bigadmin" ? "#b0a8c8" : COLORS.danger,
                        transition: "all 0.2s ease",
                      }}
                      title={admin.role === "bigadmin" ? "Cannot delete super admin" : "Delete user"}
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <FiUser size={36} />
                <p>No users found</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PermissionPage;
