import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useGlobalRefresh } from "../context/GlobalRefreshContext";
import {
  FiArrowLeft, FiSave, FiUserPlus, FiEdit, FiUser,
  FiPhone, FiMail, FiMapPin, FiCamera, FiAward, FiCreditCard
} from "react-icons/fi";
import "./Staff.css";

const AddStaff = () => {
  const navigate = useNavigate();
  const { id: editingId } = useParams(); // present when editing
  const fileInputRef = useRef(null);
  const { triggerRefresh, branches } = useGlobalRefresh();

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [branchName, setBranchName] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [perDaySalary, setPerDaySalary] = useState("");
  const [weeklyOffDays, setWeeklyOffDays] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fetchingStaff, setFetchingStaff] = useState(false);

  // If editing, load existing staff data
  useEffect(() => {
    if (editingId) {
      setFetchingStaff(true);
      api.get(`staff/${editingId}/`)
        .then(res => {
          const s = res.data;
          setName(s.name || "");
          setPhone(s.phone || "");
          setEmail(s.email || "");
          setLocation(s.location || "");
          setBranchName(s.branch_name || "");
          setMonthlySalary(s.monthly_salary != null ? String(s.monthly_salary) : "");
          setPerDaySalary(s.per_day_salary != null ? String(s.per_day_salary) : "");
          setWeeklyOffDays(s.weekly_off_days || []);
          if (s.photo_url) {
            const base = api.defaults.baseURL.replace("/api/", "");
            setPhotoPreviewUrl(`${base}${s.photo_url}`);
          }
        })
        .catch(() => setError("Failed to load staff details."))
        .finally(() => setFetchingStaff(false));
    }
  }, [editingId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleDay = (day) => {
    setWeeklyOffDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const validate = () => {
    if (!name.trim()) { setError("Full name is required."); return false; }
    if (!phone.trim()) { setError("Phone number is required."); return false; }
    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      setError("Phone number must be exactly 10 digits."); return false;
    }
    if (!location.trim()) { setError("Home location is required."); return false; }
    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address."); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validate()) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("location", location);
    if (branchName) formData.append("branch_name", branchName);
    if (monthlySalary) formData.append("monthly_salary", monthlySalary);
    if (perDaySalary) formData.append("per_day_salary", perDaySalary);
    formData.append("weekly_off_days", JSON.stringify(weeklyOffDays));
    if (photoFile) formData.append("photo", photoFile);

    try {
      if (editingId) {
        await api.put(`staff/${editingId}/edit/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Staff profile updated successfully!");
      } else {
        await api.post(`staff/add/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("New team member added successfully!");
      }
      triggerRefresh("staff");
      triggerRefresh("attendance");
      setTimeout(() => navigate("/staff"), 1500);
    } catch (err) {
      console.error("Failed to save staff:", err);
      setError(err.response?.data?.error || "Failed to save staff. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (fetchingStaff) {
    return (
      <div className="staff-page-container">
        <div className="loading-state" style={{ minHeight: "60vh" }}>
          <div className="bm-spinner-mini" style={{ width: "40px", height: "40px", borderTopColor: "var(--staff-primary)" }}></div>
          <p style={{ marginTop: "1rem", fontWeight: 600, color: "var(--staff-primary)" }}>Loading staff details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-page-container">

      {/* ── Page Header ── */}
      <header className="staff-page-header">
        <div className="header-left">
          <div className="header-icon-box">
            {editingId ? <FiEdit /> : <FiUserPlus />}
          </div>
          <div className="header-title-info">
            <h2>{editingId ? "Update Team Profile" : "Add Team Member"}</h2>
            <p>{editingId ? "Edit the team member's details below" : "Register a new member in your workforce"}</p>
          </div>
        </div>
        <button
          type="button"
          className="staff-btn-secondary"
          onClick={() => navigate("/staff")}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <FiArrowLeft /> Back to Staff
        </button>
      </header>

      {/* ── Status Messages ── */}
      {error && (
        <div style={{
          background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: "14px",
          padding: "1rem 1.5rem", marginBottom: "1.5rem",
          color: "#991b1b", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.75rem"
        }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{
          background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: "14px",
          padding: "1rem 1.5rem", marginBottom: "1.5rem",
          color: "#166534", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.75rem"
        }}>
          ✅ {success}
        </div>
      )}

      {/* ── Form Card ── */}
      <form onSubmit={handleSubmit}>

        {/* Section 1: Identity & Contact */}
        <div className="form-section-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-section-title"><FiUser /> Identity &amp; Contact</div>
          <div className="staff-form-grid">

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: "var(--staff-text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Full Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Ravi Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ border: "1.5px solid var(--staff-border)", borderRadius: "12px", padding: "0.8rem 1rem" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: "var(--staff-text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Phone Number <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <FiPhone style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--staff-primary)", opacity: 0.6 }} />
                <input
                  className="form-input"
                  type="tel"
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={10}
                  required
                  style={{ border: "1.5px solid var(--staff-border)", borderRadius: "12px", padding: "0.8rem 1rem 0.8rem 2.8rem" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: "var(--staff-text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <FiMail style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--staff-primary)", opacity: 0.6 }} />
                <input
                  className="form-input"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ border: "1.5px solid var(--staff-border)", borderRadius: "12px", padding: "0.8rem 1rem 0.8rem 2.8rem" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: "var(--staff-text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Home Location <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <FiMapPin style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--staff-primary)", opacity: 0.6 }} />
                <input
                  className="form-input"
                  type="text"
                  placeholder="City, Area"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                  style={{ border: "1.5px solid var(--staff-border)", borderRadius: "12px", padding: "0.8rem 1rem 0.8rem 2.8rem" }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Assignment & Pay */}
        <div className="form-section-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-section-title"><FiAward /> Assignment &amp; Remuneration</div>
          <div className="staff-form-grid">

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: "var(--staff-text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Assign Branch
              </label>
              <select
                className="form-input"
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
                style={{ border: "1.5px solid var(--staff-border)", borderRadius: "12px", padding: "0.8rem 1rem" }}
              >
                <option value="">Main Hub (Default)</option>
                {branches?.map(b => <option key={b.branch_id} value={b.name}>{b.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: "var(--staff-text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Monthly Salary (₹)
              </label>
              <div style={{ position: "relative" }}>
                <FiCreditCard style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--staff-primary)", opacity: 0.6 }} />
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 15000"
                  value={monthlySalary}
                  onChange={e => {
                    setMonthlySalary(e.target.value);
                    if (e.target.value) setPerDaySalary(String(Math.round(e.target.value / 30)));
                  }}
                  style={{ border: "1.5px solid var(--staff-border)", borderRadius: "12px", padding: "0.8rem 1rem 0.8rem 2.8rem" }}
                />
              </div>
              {monthlySalary && (
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--staff-text-muted)" }}>
                  Per-day rate: ₹{perDaySalary || "—"}
                </p>
              )}
            </div>

            {/* Weekly Off - full width */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" style={{ fontWeight: 700, color: "var(--staff-text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                Weekly Off Days
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                {DAYS.map(day => (
                  <div
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`day-chip ${weeklyOffDays.includes(day) ? "selected" : ""}`}
                    style={{ minWidth: "56px", textAlign: "center", cursor: "pointer" }}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Photo Upload */}
        <div className="form-section-card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-section-title"><FiCamera /> Team Portrait</div>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
            <div
              className="avatar-upload-box"
              onClick={() => fileInputRef.current.click()}
              style={{ width: "140px", height: "140px", borderRadius: "20px" }}
            >
              {photoPreviewUrl ? (
                <img src={photoPreviewUrl} alt="Preview" className="avatar-preview" />
              ) : (
                <FiCamera size={32} color="var(--staff-primary)" />
              )}
              <div className="upload-overlay">Change Photo</div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, color: "var(--staff-primary)", fontSize: "1rem" }}>Upload Team Portrait</p>
              <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--staff-text-muted)", maxWidth: "320px" }}>
                A clear photo is used for attendance verification and ID cards. Supported formats: JPG, PNG, WEBP.
              </p>
              {photoPreviewUrl && (
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreviewUrl(""); }}
                  style={{ marginTop: "10px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "0.4rem 0.9rem", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Form Actions ── */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: "1rem",
          padding: "1.5rem", background: "white",
          borderRadius: "20px", border: "1.5px solid var(--staff-border)",
          boxShadow: "var(--staff-shadow-sm)"
        }}>
          <button
            type="button"
            className="staff-btn-secondary"
            onClick={() => navigate("/staff")}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="staff-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <div className="bm-spinner-mini" style={{ width: "18px", height: "18px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
            ) : (
              <FiSave />
            )}
            {loading ? "Saving..." : (editingId ? "Update Profile" : "Create Profile")}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddStaff;
