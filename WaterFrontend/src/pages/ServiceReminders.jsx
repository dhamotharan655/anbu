import React, { useEffect, useState } from "react";
import api from "../api";
import {
  FiAlertTriangle, FiUser, FiPhone, FiMail, FiMapPin, FiTool, FiCalendar, FiUserCheck, FiEdit, FiX
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";


const ServiceReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [newDate, setNewDate] = useState("");

  // Fetch service reminders from API
  const fetchReminders = async () => {
    try {
      const res = await api.get("service-reminders/");
      setReminders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching service reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const navigate = useNavigate();

  const handleRescheduleClick = (item) => {
    setSelectedReminder(item);
    let dateVal = "";
    if (item.next_service_date) {
      dateVal = item.next_service_date.split(" ")[0];
    }
    setNewDate(dateVal);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate) return;
    try {
      const res = await api.put(`update-complaint/${selectedReminder.id}/`, {
        next_service_date: newDate
      });
      if (res.data) {
        fetchReminders();
        setShowRescheduleModal(false);
        setSelectedReminder(null);
      }
    } catch (err) {
      console.error("Error updating next service date:", err);
      alert("Failed to reschedule service");
    }
  };

const handleScheduleService = (item) => {
  navigate("/booking", {
    state: {
      fromReminder: true,
      original_complaint_id: item.complaint_no,
      customer_name: item.customer_name,
      customer_email: item.customer_email,
      phone: item.phone,
      address: item.address,
      product_name: item.product_name,
      details: item.details,
      service_due_date: item.next_service_date
    }
  });
};


  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <FiAlertTriangle />
          <p>Loading service reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container service-reminders-page">
      {/* HEADER */}
      <section className="page-section">
        <h1 className="section-title">Service Reminders</h1>
        <p className="section-subtitle">
          Complaints that require immediate service attention (next service date has passed)
        </p>
      </section>

      {/* LIST */}
      <section className="page-section">
        <div className="reminder-list">
          {reminders.length > 0 ? (
            reminders.map((item) => (
              <div key={item.id} className="reminder-card overdue">
                <div className="card-header">
                  <span className="card-title">#{item.complaint_no}</span>
                  <div className="status-badge overdue">
                    <FiAlertTriangle />
                    <span>Service Due</span>
                  </div>
                </div>

                <div className="card-content">
                  <div className="info-row">
                    <span className="info-row-icon"><FiUser /></span>
                    <span className="info-row-label">Customer</span>
                    <span className="info-row-value">{item.customer_name}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-row-icon"><FiPhone /></span>
                    <span className="info-row-label">Phone</span>
                    <span className="info-row-value">{item.phone}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-row-icon"><FiMail /></span>
                    <span className="info-row-label">Email</span>
                    <span className="info-row-value">{item.customer_email || "N/A"}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-row-icon"><FiMapPin /></span>
                    <span className="info-row-label">Address</span>
                    <span className="info-row-value">{item.address}</span>
                  </div>

                  <div className="info-row" style={{ alignItems: 'flex-start' }}>
                    <span className="info-row-icon"><FiTool /></span>
                    <span className="info-row-label">Product Name</span>
                    <span className="info-row-value">
                      {(() => {
                        if (!item.product_name) return "N/A";
                        try {
                          const parsed = JSON.parse(item.product_name);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {parsed.map((p, idx) => (
                                  <div key={idx} style={{ 
                                    padding: '4px 8px', 
                                    background: 'rgba(11, 102, 120, 0.05)', 
                                    borderRadius: '6px',
                                    border: '1px solid rgba(11, 102, 120, 0.1)',
                                    fontSize: '0.85rem'
                                  }}>
                                    <strong>{p.productName || p.product_name || "Unknown"}</strong>
                                    {p.quantity && <span style={{ marginLeft: '6px', color: 'var(--color-text-secondary)' }}>x{p.quantity}</span>}
                                    {p.serial_no && <span style={{ marginLeft: '6px', color: 'var(--color-primary)', fontStyle: 'italic' }}>(S/N: {p.serial_no})</span>}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        } catch (e) {
                          // Fallback to raw string
                        }
                        return item.product_name;
                      })()}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-row-icon"><FiCalendar /></span>
                    <span className="info-row-label">Next Service Date</span>
                    <span className="info-row-value overdue-date" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.next_service_date}
                      <button
                        type="button"
                        onClick={() => handleRescheduleClick(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary, #0b6678)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(11, 102, 120, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Reschedule Service"
                      >
                        <FiEdit size={14} />
                      </button>
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-row-icon"><FiUserCheck /></span>
                    <span className="info-row-label">Assigned Staff</span>
                    <span className="info-row-value">{item.staff_name || "Not Assigned"}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-row-icon"><FiAlertTriangle /></span>
                    <span className="info-row-label">Issue</span>
                    <span className="info-row-value">{item.details}</span>
                  </div>
                </div>

                <div className="card-actions">
                  
                  <button
                    className="button-secondary action-button"
                    onClick={() => handleScheduleService(item)}
                  >
                    Schedule Service
                  </button>

                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FiAlertTriangle />
              <p>No service reminders at this time</p>
            </div>
          )}
        </div>
      </section>

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && selectedReminder && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="modal-icon-badge" style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'rgba(11, 102, 120, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--color-primary, #0b6678)'
                }}>
                  <FiCalendar size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text)' }}>Reschedule Service</h2>
                  <p className="modal-subtitle" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Complaint #{selectedReminder.complaint_no}
                  </p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowRescheduleModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="modal-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>Customer Name</label>
                <input
                  type="text"
                  value={selectedReminder.customer_name}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--color-border)',
                    background: 'rgba(0,0,0,0.03)',
                    color: 'var(--color-text-secondary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>Current Next Service Date</label>
                <input
                  type="text"
                  value={selectedReminder.next_service_date}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--color-border)',
                    background: 'rgba(0,0,0,0.03)',
                    color: 'var(--color-text-secondary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>New Next Service Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-white, #fff)',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowRescheduleModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--color-border)',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--gradient-primary, #0b6678)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Save Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceReminders;
