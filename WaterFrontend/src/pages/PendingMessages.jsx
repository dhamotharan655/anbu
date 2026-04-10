import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { openWhatsApp, generateBookingMessage, normalizePhoneNumber } from "../utils/whatsappUtils";
import {
  IoCheckmarkCircle,
  IoSend,
  IoAlertCircle,
} from "react-icons/io5";

const PendingMessages = () => {
  const [pendingMessages, setPendingMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageTypeFilter, setMessageTypeFilter] = useState('assignment'); // 'booking', 'assignment'

  const fetchPendingMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("pending-whatsapp-messages/");
      if (res.data?.success) {
        setPendingMessages(res.data.complaints || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending messages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingMessages();
  }, [fetchPendingMessages]);

  const handleUpdateWhatsappStatus = async (complaintNo, field) => {
    try {
      const payload = { complaint_no: complaintNo, [field]: true };
      const res = await api.post("update-whatsapp-status/", payload);
      if (res.data?.success) {
        fetchPendingMessages();
      }
    } catch (error) {
      console.error("Failed to update WhatsApp status:", error);
    }
  };

  const sendToStaff = (item) => {
    if (!item.staff_phone) {
      window.alert("Staff phone number is missing.");
      return;
    }
    const sanitizedPhone = item.staff_phone.replace(/\D/g, "");
    if (!sanitizedPhone || sanitizedPhone.length < 10) {
      window.alert("Invalid staff phone number.");
      return;
    }
    const phoneWithCountryCode = sanitizedPhone.startsWith("91")
      ? sanitizedPhone
      : "91" + sanitizedPhone;

    const staffName = item.assigned_staff || item.staff_name || "Staff";
    const customerName = item.customer_name || "Customer";
    const complaintNo = item.complaint_no || "";
    const customerPhone = item.customer_phone || "";
    const address = item.address || "";
    const details = item.complaint_details || "";

    let googleMapsLink = null;
    let message;

    if (address && address.trim()) {
      const encodedAddress = encodeURIComponent(address);
      googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      message = `Hello ${staffName},\n\nA new service complaint has been assigned to you.\n\nComplaint ID: ${complaintNo}\nCustomer Name: ${customerName}\nComplaint Details: ${details}\nContact Number: ${customerPhone}\nCustomer Location:\n${googleMapsLink}\n\nAddress: ${address}\n\nPlease attend at the earliest.\n\nRuban Electricals - Your Trusted Partner`;
    } else {
      message = `Hello ${staffName},\n\nA new service complaint has been assigned to you.\n\nComplaint ID: ${complaintNo}\nCustomer Name: ${customerName}\nComplaint Details: ${details}\nContact Number: ${customerPhone}\n\nPlease attend at the earliest.\n\nRuban Electricals - Your Trusted Partner`;
    }

    const whatsappURL = `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  const sendToCustomer = (item) => {
    if (!item.customer_phone) {
      window.alert("Customer phone number is missing.");
      return;
    }
    const sanitizedPhone = item.customer_phone.replace(/\D/g, "");
    if (!sanitizedPhone || sanitizedPhone.length < 10) {
      window.alert("Invalid customer phone number.");
      return;
    }
    const phoneWithCountryCode = sanitizedPhone.startsWith("91")
      ? sanitizedPhone
      : "91" + sanitizedPhone;

    const customerName = item.customer_name || "Customer";
    const staffName = item.assigned_staff || item.staff_name || "Staff";
    const staffPhone = item.staff_phone || "";

    const message = `Hello ${customerName},\n\nYour service request has been assigned.\n\nStaff Name: ${staffName}\nStaff Phone: ${staffPhone}\n\nThey will contact you shortly.\n\nThank you.`;

    const whatsappURL = `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  const sendBookingWhatsApp = (item) => {
    if (!item.customer_phone) {
      window.alert("Customer phone number is missing.");
      return;
    }
    const normalizedPhone = normalizePhoneNumber(item.customer_phone);
    
    let productName = item.product_name || item.productName || "Service";
    
    try {
      if (typeof productName === 'string' && productName.trim().startsWith('[')) {
        const parsed = JSON.parse(productName);
        if (Array.isArray(parsed) && parsed.length > 0) {
          productName = parsed.map(p => {
             const name = p.productName || p.name || p.product_name || 'Product';
             const qty = p.quantity ? ` (Qty: ${p.quantity})` : '';
             return `${name}${qty}`;
          }).join(', ');
        }
      }
    } catch (e) {
      // Ignored: fallback to whatever string it originally was
    }
    const serviceType = item.service_type || "Service";
    const date = item.created_at 
      ? new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const message = generateBookingMessage(
      item.customer_name || "Customer",
      item.complaint_no,
      productName,
      serviceType,
      date
    );
    
    const whatsappURL = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <IoAlertCircle size={28} color="#fff" />
        </div>
        <div>
          <h1 style={styles.headerTitle}>Pending WhatsApp Messages</h1>
          <p style={styles.headerSubtitle}>
            Complaints where WhatsApp notifications have not been sent
          </p>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{pendingMessages.length}</span>
          <span style={styles.statLabel}>Pending</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'center' }}>
        <button
          onClick={() => setMessageTypeFilter('booking')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: messageTypeFilter === 'booking' ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' : '#e5e7eb',
            color: messageTypeFilter === 'booking' ? '#fff' : '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Booking Messages
        </button>
        <button
          onClick={() => setMessageTypeFilter('assignment')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: messageTypeFilter === 'assignment' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#e5e7eb',
            color: messageTypeFilter === 'assignment' ? '#fff' : '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Assignment Messages
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading pending messages...</p>
        </div>
      ) : (() => {
        // Filter messages based on selected tab
        const filteredMessages = pendingMessages.filter(item => {
          const isAssigned = item.assigned === true;
          const bookingSent = item.booking_whatsapp_sent === true;
          const customerSent = item.whatsapp_sent_to_customer === true;
          const staffSent = item.whatsapp_sent_to_staff === true;
          
          if (messageTypeFilter === 'booking') {
            // Show complaints where booking WhatsApp not sent, regardless of assignment status
            return !bookingSent;
          } else if (messageTypeFilter === 'assignment') {
            // Show ONLY assigned complaints where customer OR staff not sent
            return isAssigned && (!customerSent || !staffSent);
          }
          return false;
        });
        
        return filteredMessages.length === 0 ? (
        <div style={styles.emptyContainer}>
          <IoCheckmarkCircle size={72} color="#25D366" />
          <p style={styles.emptyTitle}>All messages sent!</p>
          <p style={styles.emptySubtext}>
            No pending WhatsApp notifications found
          </p>
        </div>
      ) : (
        <div style={styles.cardGrid}>
          {filteredMessages.map((item, index) => {
            const customerSent = item.whatsapp_sent_to_customer === true;
            const staffSent = item.whatsapp_sent_to_staff === true;
            const bookingSent = item.booking_whatsapp_sent === true;
            const isAssigned = item.assigned === true;
            const staffName = item.assigned_staff || item.staff_name || "-";

            return (
              <div key={item.id || item.complaint_no || index} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.complaintNo}>
                    {item.complaint_no}
                  </span>
                  <div style={styles.badgeRow}>
                    {messageTypeFilter === 'booking' && (
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: bookingSent ? "#d1fae5" : "#fef3c7",
                          color: bookingSent ? "#059669" : "#d97706",
                        }}
                      >
                        Booking: {bookingSent ? "Sent" : "Not Sent"}
                      </span>
                    )}
                    {messageTypeFilter === 'assignment' && isAssigned && (
                      <>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: customerSent ? "#d1fae5" : "#fee2e2",
                            color: customerSent ? "#059669" : "#dc2626",
                          }}
                        >
                          Customer: {customerSent ? "Sent" : "Not Sent"}
                        </span>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: staffSent ? "#d1fae5" : "#fee2e2",
                            color: staffSent ? "#059669" : "#dc2626",
                          }}
                        >
                          Staff: {staffSent ? "Sent" : "Not Sent"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Customer</span>
                    <span style={styles.infoValue}>
                      {item.customer_name || "-"}
                    </span>
                  </div>
                  {messageTypeFilter === 'assignment' && isAssigned && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Assigned Staff</span>
                      <span style={styles.infoValue}>{staffName}</span>
                    </div>
                  )}
                </div>

                <div style={styles.cardActions}>
                  {messageTypeFilter === 'booking' && (
                    <>
                      {!bookingSent && (
                    <button
                      style={{...styles.btnCustomer, background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'}}
                      onClick={() => {
                        sendBookingWhatsApp(item);
                        handleUpdateWhatsappStatus(
                          item.complaint_no,
                          "booking_whatsapp_sent"
                        );
                      }}
                    >
                      <IoSend size={15} />
                      Send Booking WhatsApp
                    </button>
                  )}
                  {bookingSent && (
                    <span style={styles.sentLabel}>
                      <IoCheckmarkCircle size={15} />
                      Booking Sent
                    </span>
                  )}
                    </>
                  )}

                  {messageTypeFilter === 'assignment' && isAssigned && (
                    <>
                      {!customerSent && (
                        <button
                          style={styles.btnCustomer}
                          onClick={() => {
                            sendToCustomer(item);
                            handleUpdateWhatsappStatus(
                              item.complaint_no,
                              "whatsapp_sent_to_customer"
                            );
                          }}
                        >
                          <IoSend size={15} />
                          Send to Customer
                        </button>
                      )}
                      {customerSent && (
                        <span style={styles.sentLabel}>
                          <IoCheckmarkCircle size={15} />
                          Customer Sent
                        </span>
                      )}

                      {!staffSent && (
                        <button
                          style={styles.btnStaff}
                          onClick={() => {
                            sendToStaff(item);
                            handleUpdateWhatsappStatus(
                              item.complaint_no,
                              "whatsapp_sent_to_staff"
                            );
                          }}
                        >
                          <IoSend size={15} />
                          Send to Staff
                        </button>
                      )}
                      {staffSent && (
                        <span style={styles.sentLabel}>
                          <IoCheckmarkCircle size={15} />
                          Staff Sent
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    padding: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    padding: "24px 28px",
    borderRadius: "20px",
    marginBottom: "20px",
    boxShadow: "0 8px 25px rgba(37,211,102,0.35)",
  },
  headerIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#fff",
    margin: 0,
    letterSpacing: "0.3px",
  },
  headerSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.85)",
    margin: "4px 0 0 0",
    fontWeight: "500",
  },
  statsRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "16px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    minWidth: "120px",
  },
  statNumber: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#dc2626",
  },
  statLabel: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "600",
    marginTop: "2px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "80px",
  },
  spinner: {
    border: "4px solid rgba(37,211,102,0.2)",
    borderTop: "4px solid #25D366",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    fontSize: "15px",
    color: "#6b7280",
    fontWeight: "500",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "80px",
  },
  emptyTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1f2937",
    marginTop: "16px",
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#9ca3af",
    marginTop: "8px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: "16px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "8px",
  },
  complaintNo: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#1f2937",
  },
  badgeRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  badge: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "10px",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  infoRow: {
    display: "flex",
    gap: "8px",
    fontSize: "13px",
  },
  infoLabel: {
    fontWeight: "600",
    color: "#6b7280",
    minWidth: "100px",
  },
  infoValue: {
    color: "#1f2937",
    fontWeight: "500",
  },
  cardActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "4px",
  },
  btnCustomer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(102,126,234,0.3)",
  },
  btnStaff: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(37,211,102,0.3)",
  },
  sentLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    backgroundColor: "#d1fae5",
    color: "#059669",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
  },
};

export default PendingMessages;
