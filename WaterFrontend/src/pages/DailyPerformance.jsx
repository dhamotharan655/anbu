import React, { useEffect, useState } from "react";
import api from "../api";
import {
  FiTrendingUp, FiDollarSign, FiCheckSquare,
  FiCalendar, FiUser, FiSearch, FiFilter, FiX,
} from "react-icons/fi";

const COLORS = {
  primary: "#7c5cbf", secondary: "#6baee0", accent: "#9b6fe8",
  success: "#2d9e6b", danger: "#eb5968", warning: "#c77b00",
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
  padding: "1.5rem",
  marginBottom: "1rem",
};

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.88)",
  border: "1.5px solid rgba(124,92,191,0.15)", borderRadius: "14px",
  padding: "0.7rem 1rem", fontFamily: "'Plus Jakarta Sans',sans-serif",
  fontSize: "0.9rem", color: COLORS.text, outline: "none", boxSizing: "border-box",
};

const DailyPerformance = () => {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffNameFilter, setStaffNameFilter] = useState("");
  const [daysFilter, setDaysFilter] = useState(7);
  const [filtersApplied, setFiltersApplied] = useState(false);

  useEffect(() => { fetchDailyPerformance(); }, []);

  const fetchDailyPerformance = async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.staffName) params.append("staff_name", filters.staffName);
      if (filters.days)      params.append("days", filters.days);
      const url = `daily-performance/${params.toString() ? "?" + params.toString() : ""}`;
      const response = await api.get(url);
      setDailyData(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load daily performance data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    fetchDailyPerformance({ staffName: staffNameFilter.trim(), days: daysFilter });
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setStaffNameFilter(""); setDaysFilter(30);
    setFiltersApplied(false);
    fetchDailyPerformance();
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", weekday: "short" });

  if (loading) return (
    <div className="page-container">
      <div className="loading-state"><FiTrendingUp size={48} /><p>Loading daily performance data...</p></div>
    </div>
  );

  if (error) return (
    <div className="page-container">
      <div className="empty-state">
        <FiTrendingUp size={48} style={{ color: COLORS.danger }} />
        <p>{error}</p>
        <button className="button-primary" onClick={fetchDailyPerformance}>Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* HEADER */}
      <section className="page-section">
        <h1 className="section-title">Daily Performance Report</h1>
        <p className="section-subtitle">Track daily team performance and productivity</p>
      </section>

      {/* FILTERS */}
      <section className="page-section">
        <div style={glassCard}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "'Fraunces',serif", color: COLORS.text, marginBottom: "1.25rem", fontSize: "1.1rem" }}>
            <FiFilter color={COLORS.primary} />
            Filters
            {filtersApplied && (
              <span style={{ background: "linear-gradient(135deg,#9b6fe8,#6baee0)", color: "white", padding: "2px 10px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700, marginLeft: "4px" }}>Active</span>
            )}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: COLORS.muted, marginBottom: "0.45rem" }}>Staff Name</label>
              <input style={inputStyle} type="text" placeholder="Search by staff name..." value={staffNameFilter} onChange={(e) => setStaffNameFilter(e.target.value)} onKeyPress={(e) => e.key === "Enter" && applyFilters()} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: COLORS.muted, marginBottom: "0.45rem" }}>Days to Show</label>
              <select style={inputStyle} value={daysFilter} onChange={(e) => setDaysFilter(parseInt(e.target.value))}>
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button className="button-secondary" onClick={clearFilters}><FiX /> Clear</button>
            <button className="button-primary" onClick={applyFilters}><FiSearch /> Apply</button>
          </div>
        </div>
      </section>

      {/* DAILY CARDS */}
      {dailyData.length === 0 ? (
        <div className="empty-state">
          <FiTrendingUp size={48} />
          <p>No Daily Performance Data</p>
          <p className="empty-subtitle">No completed jobs found for the selected period.</p>
        </div>
      ) : (
        dailyData.map((day) => {
          const dateObj = new Date(day.date);
          const dayOfMonth = dateObj.getDate();
          const monthName = dateObj.toLocaleDateString("en-IN", { month: "short" });

          return (
            <section key={day.date} className="page-section">
              <div style={glassCard}>
                {/* Day header */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(124,92,191,0.1)" }}>
                  <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#9b6fe8,#6baee0)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", marginRight: "1.25rem", flexShrink: 0, boxShadow: "0 6px 20px rgba(124,92,191,0.3)" }}>
                    <span style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>{dayOfMonth}</span>
                    <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>{monthName}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.15rem", color: COLORS.text, margin: "0 0 0.5rem" }}>{formatDate(day.date)}</h3>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      {[
                        { icon: <FiCheckSquare size={13} />, label: "jobs", val: day.total_jobs, color: COLORS.success },
                        { icon: <FiDollarSign size={13} />, label: "from clients", val: formatCurrency(day.total_client_payments), color: COLORS.primary },
                        { icon: <FiDollarSign size={13} />, label: "to staff", val: formatCurrency(day.total_company_payments), color: COLORS.secondary },
                      ].map((s, i) => (
                        <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: COLORS.muted }}>
                          <span style={{ color: s.color }}>{s.icon}</span>
                          <strong style={{ color: s.color }}>{s.val}</strong> {s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Staff breakdown */}
                <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "0.85rem" }}>
                  <FiUser size={13} color={COLORS.primary} /> Staff Performance Breakdown
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: "0.75rem" }}>
                  {Object.entries(day.staff_breakdown).map(([staffName, staffData]) => (
                    <div key={staffName} style={{ background: "rgba(255,255,255,0.62)", border: "1px solid rgba(124,92,191,0.12)", borderRadius: "16px", padding: "1rem" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: COLORS.text, marginBottom: "0.65rem" }}>{staffName}</div>
                      {[
                        { label: "Jobs", val: staffData.jobs },
                        { label: "Client ₹", val: formatCurrency(staffData.client_payments) },
                        { label: "Company ₹", val: formatCurrency(staffData.company_payments) },
                      ].map((m, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                          <span style={{ color: COLORS.muted }}>{m.label}</span>
                          <strong style={{ color: COLORS.primary }}>{m.val}</strong>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
};

export default DailyPerformance;
