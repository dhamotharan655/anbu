import React, { useEffect, useState } from "react";
import api from "../api";
import ProductHistory from "../components/ProductHistory";
import {
  FiTrendingUp,
  FiDollarSign,
  FiCheckSquare,
  FiCalendar,
  FiSearch,
  FiFilter,
  FiX,
  FiEye,
  FiUser,
  FiMapPin,
  FiPhone,
  FiPackage,
  FiFileText,
  FiCreditCard,
  FiClock,
} from "react-icons/fi";

/* -------------------- CONSTANTS -------------------- */
const COLORS = {
  primary: "#7c5cbf",
  secondary: "#6baee0",
  accent: "#9b6fe8",
  success: "#2d9e6b",
  danger: "#eb5968",
  warning: "#c77b00",
  text: "#1e1b2e",
  muted: "#8b85a1",
  white: "#ffffff",
  glass: "rgba(255,255,255,0.72)",
  glassBorder: "rgba(255,255,255,0.8)",
};

const glassCard = {
  background: COLORS.glass,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${COLORS.glassBorder}`,
  borderRadius: "20px",
  boxShadow: "0 4px 20px rgba(124,92,191,0.12)",
};

/* -------------------- COMPONENT -------------------- */
const StaffPerformance = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [staffNameFilter, setStaffNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersApplied, setFiltersApplied] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Scroll to top when modal opens
  useEffect(() => {
    if (showModal) {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  }, [showModal]);

  useEffect(() => { fetchStaffPerformance(); }, []);

  const fetchStaffPerformance = async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.staffName) params.append("staff_name", filters.staffName);
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      const url = `staff-performance/${params.toString() ? "?" + params.toString() : ""}`;
      const response = await api.get(url);
      setPerformanceData(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load staff performance");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    fetchStaffPerformance({ staffName: staffNameFilter.trim(), startDate, endDate });
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setStaffNameFilter(""); setStartDate(""); setEndDate("");
    setFiltersApplied(false);
    fetchStaffPerformance();
  };

  const fetchDailyJobs = async (staffName, date) => {
    try {
      setModalLoading(true);
      const response = await api.get(`staff-daily-jobs/?staff_name=${encodeURIComponent(staffName)}&date=${date}`);
      setModalData(response.data);
      setShowModal(true);
    } catch (err) {
      alert("Failed to load job details");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => { setShowModal(false); setModalData(null); };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount || 0);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  if (loading) return (
    <div className="page-container">
      <div className="loading-state">
        <FiTrendingUp size={48} />
        <p>Loading staff performance...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="page-container">
      <div className="empty-state">
        <FiTrendingUp size={48} />
        <p style={{ color: COLORS.danger }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <style>{`
        .perf-day-card:hover {
          background: linear-gradient(135deg, #9b6fe8, #6baee0) !important;
          color: white !important;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(124,92,191,0.28) !important;
        }
        .perf-day-card:hover p { color: rgba(255,255,255,0.85) !important; }
      `}</style>

      <div className="page-container">
        {/* HEADER */}
        <section className="page-section">
          <h1 className="section-title">Staff Performance Report</h1>
          <p className="section-subtitle">Daily work &amp; payment summary per staff member</p>
        </section>

        {/* FILTER */}
        <section className="page-section">
          <div style={{ ...glassCard, padding: "1.5rem" }}>
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
                <input
                  style={{ width: "100%", background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(124,92,191,0.15)", borderRadius: "14px", padding: "0.7rem 1rem", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "0.9rem", color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                  placeholder="Search staff name..."
                  value={staffNameFilter}
                  onChange={(e) => setStaffNameFilter(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: COLORS.muted, marginBottom: "0.45rem" }}>Start Date</label>
                <input type="date" style={{ width: "100%", background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(124,92,191,0.15)", borderRadius: "14px", padding: "0.7rem 1rem", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "0.9rem", color: COLORS.text, outline: "none", boxSizing: "border-box" }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: COLORS.muted, marginBottom: "0.45rem" }}>End Date</label>
                <input type="date" style={{ width: "100%", background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(124,92,191,0.15)", borderRadius: "14px", padding: "0.7rem 1rem", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "0.9rem", color: COLORS.text, outline: "none", boxSizing: "border-box" }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button className="button-secondary" onClick={clearFilters}><FiX /> Clear</button>
              <button className="button-primary" onClick={applyFilters}><FiSearch /> Apply</button>
            </div>
          </div>
        </section>

        {/* STAFF CARDS */}
        {performanceData.length === 0 ? (
          <div className="empty-state">
            <FiTrendingUp size={48} />
            <p>No performance data found</p>
            <p className="empty-subtitle">Try adjusting your filters or date range</p>
          </div>
        ) : (
          performanceData.map((staff, index) => (
            <section key={staff.staff_name} className="page-section">
              <div style={{ ...glassCard, padding: "1.5rem" }}>
                {/* Staff name */}
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "1.3rem", fontWeight: 600, color: COLORS.text, marginBottom: "1rem" }}>
                  <span style={{ background: "linear-gradient(135deg,#9b6fe8,#6baee0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginRight: "0.5rem" }}>#{index + 1}</span>
                  {staff.staff_name}
                </h2>

                {/* Summary pills */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                  {[
                    { icon: <FiCheckSquare />, label: "Jobs", val: staff.total_jobs_completed, col: "rgba(45,158,107,0.12)", text: "#2d9e6b" },
                    { icon: <FiDollarSign />, label: "Company", val: formatCurrency(staff.company_payments), col: "rgba(124,92,191,0.1)", text: "#7c5cbf" },
                    { icon: <FiDollarSign />, label: "Client", val: formatCurrency(staff.client_payments), col: "rgba(58,127,193,0.1)", text: "#3a7fc1" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: s.col, borderRadius: "14px", padding: "0.75rem 1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: s.text }}>{s.icon}</span>
                      <div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: COLORS.muted }}>{s.label}</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: "1.1rem", fontWeight: 600, color: COLORS.text }}>{s.val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Daily performance */}
                <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "0.9rem" }}>
                  <FiCalendar color={COLORS.primary} size={14} /> Daily Performance
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: "0.75rem" }}>
                  {Object.entries(staff.daily_work_completion)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .map(([date, day]) => (
                      <div
                        key={date}
                        className="perf-day-card"
                        onClick={() => fetchDailyJobs(staff.staff_name, date)}
                        style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(124,92,191,0.12)", borderRadius: "16px", padding: "1rem", textAlign: "center", cursor: "pointer", transition: "all 0.25s ease", position: "relative" }}
                      >
                        <FiEye style={{ position: "absolute", top: "10px", right: "10px", opacity: 0.5 }} size={14} />
                        <strong style={{ display: "block", fontSize: "0.9rem", color: "inherit", marginBottom: "0.4rem" }}>{formatDate(date)}</strong>
                        <p style={{ fontSize: "0.83rem", color: COLORS.muted, margin: "0.2rem 0" }}>{day.jobs} jobs</p>
                        <p style={{ fontSize: "0.78rem", color: COLORS.muted, margin: "0.1rem 0" }}>Co: {formatCurrency(day.company_payments)}</p>
                        <p style={{ fontSize: "0.78rem", color: COLORS.muted, margin: "0.1rem 0" }}>Cl: {formatCurrency(day.client_payments)}</p>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '900px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1.5px solid #E5E7EB'
              }}
            >
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1E1B4B',
                  margin: 0
                }}
              >
                {modalData?.staff_name} — {formatDate(modalData?.date)}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
        <p style={{ color: COLORS.muted, marginBottom: "1rem", fontSize: "0.88rem" }}>Total Jobs: <strong style={{ color: COLORS.text }}>{modalData?.total_jobs}</strong></p>
        {modalLoading ? (
          <div className="loading-state"><FiClock size={32} /><p>Loading job details...</p></div>
        ) : modalData?.jobs?.length > 0 ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            {modalData.jobs.map((job, index) => (
              <div key={job.complaint_no} style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(124,92,191,0.12)", borderRadius: "16px", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                  <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: "1rem", color: COLORS.primary, margin: 0 }}>#{index + 1} — {job.complaint_no}</h3>
                  <span style={{ background: job.status === "completed" ? "rgba(45,158,107,0.12)" : "rgba(124,92,191,0.12)", color: job.status === "completed" ? "#2d9e6b" : "#7c5cbf", padding: "0.25rem 0.7rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>{job.status}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "0.65rem" }}>
                  {[
                    { icon: <FiUser />, label: "Customer", val: job.customer_name },
                    { icon: <FiPhone />, label: "Phone", val: job.customer_phone },
                    { icon: <FiMapPin />, label: "Address", val: job.address },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.85rem" }}>
                      <span style={{ color: COLORS.primary, marginTop: "2px", flexShrink: 0 }}>{r.icon}</span>
                      <div><span style={{ color: COLORS.muted, fontSize: "0.78rem" }}>{r.label}</span><div style={{ color: COLORS.text, fontWeight: 600 }}>{r.val}</div></div>
                    </div>
                  ))}
                </div>

                {/* Products Section */}
                {(job.product_name || job.additional_product) && (
                  <div style={{ marginTop: "0.85rem" }}>
                    {job.product_name && (
                      <ProductHistory
                        products={job.product_name}
                        title="Products Purchased"
                        showTotal={false}
                        isCompact={true}
                        showPrice={false}
                      />
                    )}
                    {job.additional_product && (
                      <div style={{ marginTop: job.product_name ? '8px' : '0' }}>
                        <ProductHistory
                          products={job.additional_product}
                          title="Additional Products"
                          showTotal={false}
                          isCompact={true}
                          showPrice={false}
                        />
                      </div>
                    )}
                  </div>
                )}
                <div style={{ marginTop: "0.85rem", fontSize: "0.85rem", color: COLORS.text }}>
                  <FiFileText color={COLORS.muted} style={{ marginRight: "0.4rem" }} /><strong>Issue:</strong> {job.details}
                </div>
                <div style={{ marginTop: "0.85rem", display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
                  <div><FiCreditCard color="#2d9e6b" style={{ marginRight: "0.4rem" }} /><strong>Client:</strong> {formatCurrency(job.client_payment)}</div>
                  <div><FiCreditCard color={COLORS.primary} style={{ marginRight: "0.4rem" }} /><strong>Company:</strong> {formatCurrency(job.company_payment)}</div>
                  <div><FiClock color={COLORS.muted} style={{ marginRight: "0.4rem" }} /><strong>Completed:</strong> {new Date(job.completed_at).toLocaleString("en-IN")}</div>
                </div>
                {job.remarks && <div style={{ marginTop: "0.75rem", padding: "0.65rem", background: "rgba(124,92,191,0.06)", borderRadius: "10px", fontSize: "0.84rem" }}><strong>Remarks:</strong> {job.remarks}</div>}
                {job.completed_remarks && <div style={{ marginTop: "0.5rem", padding: "0.65rem", background: "rgba(45,158,107,0.06)", borderRadius: "10px", fontSize: "0.84rem" }}><strong>Completed Remarks:</strong> {job.completed_remarks}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><FiFileText size={40} /><p>No jobs found for this date</p></div>
        )}
      </div>
    </div>
    </div>
    )}
    </div>
  );
};

export default StaffPerformance;
