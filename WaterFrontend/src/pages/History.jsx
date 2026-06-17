
import React, { useEffect, useState } from "react";
import api from "../api";
import {
  FiCheck,
  FiSearch,
  FiUser,
  FiMail,
  FiAlertCircle,
  FiCreditCard,
  FiMessageSquare,
  FiCalendar,
  FiCheckCircle,
  FiPhone,
  FiUserCheck,
  FiDollarSign,
  FiClock
} from "react-icons/fi";

// Reusable component to display a row of info
const InfoRow = ({ icon, label, value }) => (
  <div className="info-row">
    <span className="info-row-icon">{icon}</span>
    <span className="info-row-label">{label}</span>
    <span className="info-row-value">{value}</span>
  </div>
);

const History = () => {
  const [completedComplaints, setCompletedComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCompletedComplaints();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString.replace(/\+00:00$/, "Z"));
    return date.toLocaleString();
  };

  const fetchCompletedComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get(`complaints/`);
      const completed = Array.isArray(res.data)
        ? res.data.filter((c) => {
            // ⭐ FEATURE 5: Exclude initial records from general History
            // Initial records should only appear in CustomerHistory
            if (c.is_initial === true) return false;
            return c.status?.toLowerCase() === "completed";
          })
        : [];
      setCompletedComplaints(completed);
      setFilteredComplaints(completed);
    } catch (err) {
      console.error("Failed to fetch completed complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter complaints based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredComplaints(completedComplaints);
      return;
    }

    const lowerText = searchQuery.toLowerCase();
    const filtered = completedComplaints.filter((item) => {
      const searchFields = [
        item.complaint_no,
        item.customer_name,
        item.customer_phone,
        item.customer_email,
        item.complaint_details,
        item.payment_method,
        item.remarks,
        item.assigned_staff,
        formatDate(item.date_created || item.created_at || null),
      ].join(" ").toLowerCase();

      return searchFields.includes(lowerText);
    });

    setFilteredComplaints(filtered);
  }, [completedComplaints, searchQuery]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <FiCheckCircle size={48} />
          <p>Loading service history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container history-page">
      {/* HEADER */}
      <section className="page-section">
        <div className="header-flex" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
          <div className="header-icon-box" style={{ 
            width: '56px', 
            height: '56px', 
            background: 'var(--gradient-primary)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <FiClock />
          </div>
          <div>
            <h1 className="section-title" style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>Service History</h1>
            <p className="section-subtitle" style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>Completed service records and payment details</p>
          </div>
        </div>

        <div className="dashboard-controls" style={{ marginTop: '2rem' }}>
          <div className="search-bar" style={{ maxWidth: '500px' }}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search by complaint, customer, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* HISTORY LIST */}
      <section className="page-section">
        <div className="complaint-list">
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map((item) => (
              <div
                key={item.id || item.complaint_no}
                className="complaint-card completed"
              >
                <div className="card-header">
                  <span className="card-title">{item.complaint_no}</span>
                  <div className="status-badge completed">
                    <FiCheck />
                    <span>Completed</span>
                  </div>
                </div>

                <div className="card-content">
                  <InfoRow icon={<FiUser />} label="Customer" value={item.customer_name} />
                  <InfoRow icon={<FiPhone />} label="Phone" value={item.customer_phone} />
                  {item.customer_email && <InfoRow icon={<FiMail />} label="Email" value={item.customer_email} />}
                  <InfoRow icon={<FiAlertCircle />} label="Issue" value={item.complaint_details} />
                  {item.assigned_staff && <InfoRow icon={<FiUserCheck />} label="Staff" value={item.assigned_staff} />}
                  {item.date_created && (
                    <InfoRow
                      icon={<FiCalendar />}
                      label="Booking Date"
                      value={(() => {
                        try {
                          return new Date(item.date_created).toLocaleDateString();
                        } catch (e) {
                          return item.date_created;
                        }
                      })()}
                    />
                  )}
                  {item.assigned_at && (
                    <InfoRow
                      icon={<FiUserCheck />}
                      label="Assigned Date"
                      value={(() => {
                        try {
                          return new Date(item.assigned_at).toLocaleDateString();
                        } catch (e) {
                          return item.assigned_at;
                        }
                      })()}
                    />
                  )}
                  {item.payment_method && <InfoRow icon={<FiDollarSign />} label="Payment" value={item.payment_method} />}
                  {item.remarks && <InfoRow icon={<FiMessageSquare />} label="Remarks" value={item.remarks} />}
                  {item.completed_remarks && <InfoRow icon={<FiMessageSquare />} label="Completed Remarks" value={item.completed_remarks} />}
                  <InfoRow
                    icon={<FiCheck />}
                    label="Completed Date"
                    value={(() => {
                      if (item.assigned_completed_at) {
                        try {
                          return new Date(item.assigned_completed_at).toLocaleDateString();
                        } catch (e) {
                          return item.assigned_completed_at;
                        }
                      } else {
                        // Fallback for completed complaints without assigned_completed_at
                        return new Date().toLocaleDateString();
                      }
                    })()}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FiCheckCircle size={48} />
              <p>No completed services found</p>
              <p className="empty-subtitle">
                {searchQuery ? "Try adjusting your search terms" : "No services have been completed yet"}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default History;
