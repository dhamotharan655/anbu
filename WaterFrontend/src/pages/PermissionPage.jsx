import React, { useEffect, useState } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiSettings, FiUserPlus, FiTrash2, FiShield, FiCheck, FiTag, FiPlusCircle } from "react-icons/fi";

const COLORS = {
  primary: "var(--color-primary, #0b6678)",
  secondary: "var(--color-primary-light, #128299)",
  accent: "var(--color-gold, #f1b32a)",
  success: "#2d9e6b",
  danger: "#eb5968",
  text: "var(--color-text, #1a1a1a)",
  muted: "var(--color-text-secondary, #5a5a5a)",
  white: "#ffffff",
  glass: "rgba(255,255,255,0.72)",
  glassBorder: "var(--color-border, rgba(255,255,255,0.8))",
};

const glassCard = {
  background: COLORS.glass,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${COLORS.glassBorder}`,
  borderRadius: "20px",
  boxShadow: "var(--shadow-md, 0 4px 20px rgba(11, 102, 120, 0.12))",
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
  dashboard: "📊", 
  "dashboard-all": "📊 ➔ All Tab", 
  "dashboard-pending": "📥 ➔ Pending Tab", 
  "dashboard-assigned": "👥 ➔ Assigned Tab",
  "dashboard-completed": "✅ ➔ Completed Tab", 
  "dashboard-due": "⏰ ➔ Due Tab", 
  "dashboard-overdue": "⚠️ ➔ Overdue Tab",
  booking: "📋", staff: "👥", "add-staff": "➕",
  "staff-performance": "📈", history: "📂", customers: "🧑‍🤝‍🧑",
  "add-customer": "👤", "stock-management": "📦",
  invoices: "🧾", payroll: "💵", "holiday-management": "📅",
};

const PermissionPage = () => {
  const [activeTab, setActiveTab] = useState("permissions");
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [newUser, setNewUser] = useState({ full_name: "", password: "", role: "admin" });

  // Job Types state
  const [jobTypes, setJobTypes] = useState([]);
  const [newJobTypeName, setNewJobTypeName] = useState("");
  const [jobTypeLoading, setJobTypeLoading] = useState(false);

  // Promotions state
  const [promotions, setPromotions] = useState([]);
  const [newPromo, setNewPromo] = useState({ name: "", description: "", price: "" });
  const [newPromoPhoto, setNewPromoPhoto] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const fetchPromotions = () => {
    api.get("/promotions/")
      .then((res) => setPromotions(res.data))
      .catch((err) => console.error("Error loading promotions:", err));
  };

  // Contact / Site Settings state
  const [contactSettings, setContactSettings] = useState({ whatsapp_number: "", contact_phone: "" });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  const fetchContactSettings = () => {
    api.get("/site-settings/")
      .then((res) => setContactSettings({ whatsapp_number: res.data.whatsapp_number || "", contact_phone: res.data.contact_phone || "" }))
      .catch(() => {});
  };

  const saveContactSettings = async () => {
    setContactSaving(true);
    try {
      await api.post("/site-settings/update/", contactSettings);
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 3000);
    } catch (e) {
      alert("Failed to save settings");
    } finally {
      setContactSaving(false);
    }
  };


  const availablePages = [
    "dashboard", 
    "dashboard-all", 
    "dashboard-pending", 
    "dashboard-assigned", 
    "dashboard-completed", 
    "dashboard-due", 
    "dashboard-overdue",
    "booking", "staff", "add-staff", "staff-performance",
    "history", "customers", "add-customer", "stock-management",
    "invoices", "payroll", "holiday-management",
  ];

  useEffect(() => {
    api.get("/users/")
      .then((res) => setAdmins(res.data))
      .catch((err) => console.error("Error loading admins:", err));

    // Fetch job types
    api.get("/job-types/")
      .then((res) => setJobTypes(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Error loading job types:", err));

    fetchPromotions();
    fetchContactSettings();
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
      setNewUser({ full_name: "", password: "", role: "admin" });
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

  const addJobType = async () => {
    if (!newJobTypeName.trim()) return alert("Enter a job type name");
    setJobTypeLoading(true);
    try {
      const res = await api.post("/job-types/", { name: newJobTypeName.trim() });
      setJobTypes([...jobTypes, res.data.data]);
      setNewJobTypeName("");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add job type");
    } finally {
      setJobTypeLoading(false);
    }
  };

  const addPromotion = async () => {
    if (!newPromo.name.trim() || !newPromo.description.trim()) {
      return alert("Please fill in both Name and Description!");
    }
    setPromoLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", newPromo.name.trim());
      formData.append("description", newPromo.description.trim());
      if (newPromo.price) {
        formData.append("price", newPromo.price.trim());
      }
      if (newPromoPhoto) {
        formData.append("photo", newPromoPhoto);
      }

      await api.post("/promotions/create/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Promotion added successfully!");
      setNewPromo({ name: "", description: "", price: "" });
      setNewPromoPhoto(null);
      const fileInput = document.getElementById("promo-photo-input");
      if (fileInput) fileInput.value = "";
      
      fetchPromotions();
    } catch (err) {
      alert("Failed to add promotion!");
    } finally {
      setPromoLoading(false);
    }
  };

  const deletePromotion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await api.delete(`/promotions/${id}/delete/`);
      alert("Promotion deleted successfully!");
      fetchPromotions();
    } catch (err) {
      alert("Failed to delete promotion!");
    }
  };

  const tabs = [
    { id: "permissions", label: "Permissions", icon: <FiSettings /> },
    { id: "users", label: "Users", icon: <FiUserPlus /> },
    { id: "job-types", label: "Job Types", icon: <FiTag /> },
    { id: "promotions", label: "Promotions", icon: <FiPlusCircle /> },
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
        style={{ display: "flex", margin: "0 auto", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", borderRadius: "100px", padding: "5px", border: "1px solid var(--color-border)", boxShadow: "0 4px 20px rgba(11, 102, 120, 0.1)", maxWidth: "360px" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.5rem", padding: "0.55rem 1.25rem", border: "none",
              borderRadius: "100px", fontFamily: "var(--font-family-sans)",
              fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", transition: "all 0.25s ease",
              background: activeTab === tab.id ? "var(--gradient-primary)" : "transparent",
              color: activeTab === tab.id ? "white" : COLORS.muted,
              boxShadow: activeTab === tab.id ? "var(--shadow-primary)" : "none",
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
                          border: `1.5px solid ${isOn ? "rgba(11, 102, 120, 0.3)" : "rgba(11, 102, 120, 0.1)"}`,
                          background: isOn ? "linear-gradient(135deg,rgba(11, 102, 120,0.1),rgba(241,179,42,0.1))" : "rgba(255,255,255,0.5)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>{PAGE_ICONS[page] || "📄"}</span>
                        <span style={{ flex: 1, fontWeight: 600, color: COLORS.text, fontSize: "0.9rem", textTransform: "capitalize" }}>{page.replace(/-/g, " ")}</span>
                        <div style={{
                          width: "22px", height: "22px", borderRadius: "6px", border: `1.5px solid ${isOn ? "transparent" : "rgba(11, 102, 120, 0.25)"}`,
                          background: isOn ? "var(--gradient-primary)" : "white",
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

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label">Role</label>
              <select
                className="form-input"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.88)",
                  border: "1.5px solid rgba(124,92,191,0.15)",
                  borderRadius: "14px",
                  padding: "0.72rem 1rem",
                  fontSize: "0.9rem"
                }}
                value={newUser.role || "admin"}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="bigadmin">Super Admin (bigadmin)</option>
              </select>
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
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem 1rem", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(11, 102, 120, 0.12)", borderRadius: "14px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>
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

      {/* JOB TYPES TAB */}
      {activeTab === "job-types" && (
        <div style={{ maxWidth: "680px", margin: "0 auto", width: "100%" }}>
          <motion.div style={glassCard} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.15rem", fontWeight: 600, color: COLORS.text, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiTag color={COLORS.primary} /> Add Job Type
            </h2>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                type="text"
                value={newJobTypeName}
                onChange={(e) => setNewJobTypeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addJobType()}
                placeholder="e.g. AC Service, Pump Repair..."
              />
              <button
                className="button-primary"
                onClick={addJobType}
                disabled={jobTypeLoading}
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}
              >
                <FiPlusCircle /> Add
              </button>
            </div>
          </motion.div>

          <motion.div style={glassCard} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.15rem", fontWeight: 600, color: COLORS.text, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiTag color={COLORS.primary} /> Existing Job Types
            </h2>
            {jobTypes.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {jobTypes.map((jt) => (
                  <motion.div
                    key={jt.id}
                    whileHover={{ scale: 1.012 }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem 1rem", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(11,102,120,0.12)", borderRadius: "14px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FiTag size={15} color="white" />
                      </div>
                      <span style={{ fontWeight: 600, color: COLORS.text, fontSize: "0.9rem" }}>{jt.name}</span>
                    </div>
                    <button
                      onClick={() => deleteJobType(jt.id)}
                      style={{ width: "34px", height: "34px", borderRadius: "50%", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(235,89,104,0.1)", color: COLORS.danger }}
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <FiTag size={36} />
                <p>No job types yet. Add your first one above.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* PROMOTIONS TAB */}
      {activeTab === "promotions" && (
        <div style={{ maxWidth: "680px", margin: "0 auto", width: "100%" }}>


          {/* Add Promotion form */}
          <motion.div style={glassCard} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.15rem", fontWeight: 600, color: COLORS.text, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiPlusCircle color={COLORS.primary} /> Add New Promotion
            </h2>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label">Promotion Name *</label>
              <input 
                className="form-input" 
                type="text" 
                value={newPromo.name} 
                onChange={(e) => setNewPromo({ ...newPromo, name: e.target.value })} 
                placeholder="e.g. Monsoon Sparkle Combo" 
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label">Price (Optional)</label>
              <input 
                className="form-input" 
                type="text" 
                value={newPromo.price} 
                onChange={(e) => setNewPromo({ ...newPromo, price: e.target.value })} 
                placeholder="e.g. ₹999 or Free with Service" 
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="form-label">Description *</label>
              <textarea 
                className="form-input" 
                rows="3"
                style={{ resize: "vertical", minHeight: "80px", background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(124,92,191,0.15)", borderRadius: "14px", padding: "0.72rem 1rem", fontSize: "0.9rem", boxSizing: "border-box", width: "100%" }}
                value={newPromo.description} 
                onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })} 
                placeholder="Enter discount details, terms and conditions..." 
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Photo (Optional)</label>
              <input 
                id="promo-photo-input"
                className="form-input" 
                type="file" 
                accept="image/*" 
                onChange={(e) => setNewPromoPhoto(e.target.files[0])} 
              />
            </div>

            <button className="button-primary" onClick={addPromotion} disabled={promoLoading} style={{ width: "100%" }}>
              <FiPlusCircle /> {promoLoading ? "Adding..." : "Add Promotion"}
            </button>
          </motion.div>

          {/* Existing promotions */}
          <motion.div style={glassCard} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.15rem", fontWeight: 600, color: COLORS.text, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiTag color={COLORS.primary} /> Active Promotions
            </h2>

            {promotions.length > 0 ? (
               <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {promotions.map((promo) => (
                  <motion.div
                    key={promo.id}
                    whileHover={{ scale: 1.012 }}
                    style={{ 
                      display: "flex", 
                      gap: "1rem", 
                      padding: "1rem", 
                      background: "rgba(255,255,255,0.6)", 
                      border: "1px solid rgba(11, 102, 120, 0.12)", 
                      borderRadius: "16px",
                      alignItems: "center"
                    }}
                  >
                    {promo.photo_url ? (
                      <img 
                        src={promo.photo_url.startsWith("http") ? promo.photo_url : `${api.defaults.baseURL.replace('/api/', '')}${promo.photo_url}`} 
                        alt={promo.name} 
                        style={{ width: "70px", height: "70px", borderRadius: "12px", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(0,0,0,0.05)" }}
                      />
                    ) : (
                      <div style={{ width: "70px", height: "70px", borderRadius: "12px", background: "rgba(11, 102, 120, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", flexShrink: 0 }}>
                        <FiTag size={24} />
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: COLORS.text, fontSize: "0.95rem", marginBottom: "4px" }}>{promo.name}</div>
                      <p style={{ fontSize: "0.8rem", color: COLORS.muted, margin: "0 0 6px 0", lineHeight: "1.3" }}>{promo.description}</p>
                      {promo.price && (
                        <span style={{ fontSize: "0.82rem", fontWeight: "700", color: COLORS.success, background: "rgba(45,158,107,0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                           {promo.price}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => deletePromotion(promo.id)}
                      style={{ 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "50%", 
                        border: "none", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        cursor: "pointer", 
                        background: "rgba(235,89,104,0.1)", 
                        color: COLORS.danger,
                        transition: "all 0.2s ease" 
                      }}
                      title="Delete promotion"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <FiTag size={36} />
                <p>No active promotions found</p>
               </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PermissionPage;
