import React, { useEffect, useState } from "react";
import api from "../api";
import {
  FiAlertTriangle, FiUser, FiPhone, FiMail, FiMapPin, FiTool, FiCalendar, FiUserCheck
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";


const ServiceReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

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

                  <div className="info-row">
                    <span className="info-row-icon"><FiTool /></span>
                    <span className="info-row-label">Product Name</span>
                    <span className="info-row-value">{item.product_name || "N/A"}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-row-icon"><FiCalendar /></span>
                    <span className="info-row-label">Next Service Date</span>
                    <span className="info-row-value overdue-date">{item.next_service_date}</span>
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
    </div>
  );
};

export default ServiceReminders;
