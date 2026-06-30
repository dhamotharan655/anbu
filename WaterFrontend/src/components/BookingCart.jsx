import React from "react";
import { useBooking } from "../context/BookingContext";
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag } from "react-icons/fi";
import api from "../api";
import { useEffect, useState } from "react";

const BookingCart = () => {
  const { cartItems, isCartOpen, toggleCart, updateQuantity, removeItem, clearCart, bookingForm, updateForm, addItem } = useBooking();
  const [branches, setBranches] = useState([]);
  const [globalContact, setGlobalContact] = useState({ whatsapp_number: "" });
  const [availableServices, setAvailableServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [activeJobType, setActiveJobType] = useState("All");

  const uniqueJobTypes = ["All", ...new Set(availableServices.map(s => s.job_type_name).filter(Boolean))];
  const filteredServices = activeJobType === "All" ? availableServices : availableServices.filter(s => s.job_type_name === activeJobType);

  useEffect(() => {
    api.get("/branches/").then(res => {
      const active = res.data?.branches?.filter(b => b.is_active) || res.data?.filter(b => b.is_active) || [];
      setBranches(active);
      if (active.length > 0 && !bookingForm.branchId) {
        updateForm("branchId", active[0].branch_id);
      }
    }).catch(() => {});

    api.get("/site-settings/").then(res => {
      setGlobalContact({ whatsapp_number: res.data.whatsapp_number || "" });
    }).catch(() => {});

    setLoadingServices(true);
    api.get("/services/")
      .then(res => setAvailableServices(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, []);

  if (!isCartOpen) return null;

  const handleAddService = (svc) => {
    addItem({
      name: svc.name,
      price: svc.price || "Contact for pricing",
      category: svc.job_type_name || "General",
      type: "service"
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.phone) {
      alert("Please fill in Name and Phone.");
      return;
    }
    if (cartItems.length === 0) {
      alert("Your booking cart is empty.");
      return;
    }

    const selectedBranch = branches.find(b => b.branch_id === bookingForm.branchId);
    const waDest = selectedBranch?.whatsapp_number || globalContact.whatsapp_number;

    if (!waDest) {
      alert("No WhatsApp number configured.");
      return;
    }

    let textMessage = `*New Service Booking Request*\n`;
    textMessage += `----------------------------\n`;
    textMessage += `*Name:* ${bookingForm.name}\n`;
    textMessage += `*Phone:* ${bookingForm.phone}\n`;
    textMessage += `*Alternate:* ${bookingForm.alternatePhone || "None"}\n`;
    textMessage += `*Pref Date:* ${bookingForm.prefDate || "Anytime"}\n`;
    textMessage += `*Pref Time:* ${bookingForm.prefTime}\n`;
    textMessage += `*Address:* ${bookingForm.address || "Call Back"}\n\n`;
    textMessage += `*Items Booked:*\n`;
    
    cartItems.forEach((item, index) => {
      textMessage += `  ${index + 1}. [${item.type.toUpperCase()}] ${item.name} (Qty: ${item.quantity})\n`;
      if (item.price) textMessage += `     Price: ${item.price}\n`;
    });

    if (bookingForm.specialNotes) {
      textMessage += `\n*Notes:* ${bookingForm.specialNotes}\n`;
    }

    const waUrl = `https://wa.me/${waDest.replace(/[+\s-]/g, "")}?text=${encodeURIComponent(textMessage)}`;
    window.open(waUrl, "_blank");
    clearCart();
    toggleCart();
  };

  return (
    <>
      <style>{`
        .cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 100000;
        }
        .cart-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 450px;
          max-width: 100vw;
          background: #ffffff;
          border-left: 1px solid #e5e7eb;
          z-index: 100001;
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 30px rgba(0,0,0,0.05);
          animation: slideInRight 0.3s forwards;
          font-family: 'Inter', sans-serif;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: #fafbfe;
        }
        .cart-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0b6678;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }
        .cart-close-btn {
          background: rgba(0,0,0,0.05);
          border: none;
          color: #374151;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        .cart-close-btn:hover {
          background: #ef4444;
          color: #fff;
        }
        .cart-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .cart-item {
          background: #fafbfe;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cart-item-header {
          display: flex;
          justify-content: space-between;
        }
        .cart-item-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .cart-item-meta {
          font-size: 0.78rem;
          color: #6b7280;
          margin: 4px 0 0;
          text-transform: uppercase;
        }
        .cart-item-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .qty-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0,0,0,0.04);
          padding: 4px 10px;
          border-radius: 20px;
        }
        .qty-btn {
          background: none;
          border: none;
          color: #0b6678;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          font-weight: bold;
        }
        .remove-btn {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s;
        }
        .remove-btn:hover {
          background: rgba(239, 68, 68, 0.15);
        }
        .cart-form-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px dashed #e5e7eb;
        }
        .form-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }
        .form-input {
          width: 100%;
          background: #fafbfe;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 14px;
          color: #111827;
          margin-bottom: 16px;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: #0b6678;
          outline: none;
        }
        .cart-footer {
          padding: 20px 24px;
          background: #fafbfe;
          border-top: 1px solid #e5e7eb;
        }
        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #0b6678 0%, #128299 100%);
          color: #fff;
          font-weight: 800;
          font-size: 1rem;
          padding: 14px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(11, 102, 120, 0.25);
          transition: transform 0.2s, background 0.2s;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          background: #044d5c;
        }
      `}</style>
      <div className="cart-overlay" onClick={toggleCart} />
      <div className="cart-panel">
        <div className="cart-header">
          <h2 className="cart-title">
            <FiShoppingBag /> Booking Cart ({cartItems.length})
          </h2>
          <button className="cart-close-btn" onClick={toggleCart}>
            <FiX size={18} />
          </button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ textAlign: "center", color: "#6b7280", background: "rgba(11, 102, 120, 0.04)", padding: "16px", borderRadius: "12px", border: "1px dashed rgba(11, 102, 120, 0.2)" }}>
                <FiShoppingBag size={32} style={{ marginBottom: "8px", color: "#0b6678" }} />
                <h4 style={{ color: "#111827", margin: "0 0 4px 0", fontWeight: 700, fontSize: "0.95rem" }}>Your cart is empty</h4>
                <p style={{ fontSize: "0.82rem", margin: 0 }}>Select a service from below to start booking.</p>
              </div>

              <div>
                <h3 style={{ color: "#111827", margin: "0 0 12px 0", fontSize: "1rem", fontWeight: 800 }}>Available Services</h3>
                
                {/* Job Type Tabs */}
                {uniqueJobTypes.length > 1 && (
                  <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "4px", msOverflowStyle: "none", scrollbarWidth: "none" }}>
                    {uniqueJobTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setActiveJobType(type)}
                        style={{
                          background: activeJobType === type ? "#0b6678" : "#f3f4f6",
                          color: activeJobType === type ? "#fff" : "#4b5563",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "100px",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "0.2s"
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}

                {loadingServices ? (
                  <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Loading services catalog...</p>
                ) : filteredServices.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
                    {filteredServices.map(svc => (
                      <div key={svc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafbfe", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", transition: "all 0.2s" }}>
                        <div style={{ flex: 1, marginRight: "12px" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111827" }}>{svc.name}</div>
                          <div style={{ fontSize: "0.74rem", color: "#6b7280", display: "flex", gap: "8px", marginTop: "2px" }}>
                            <span>{svc.job_type_name}</span>
                            {svc.time && <span>• {svc.time}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#16a34a" }}>{svc.price || "Free"}</span>
                          <button 
                            onClick={() => handleAddService(svc)}
                            style={{ background: "#0b6678", color: "#ffffff", border: "none", borderRadius: "6px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "0.2s" }}
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>No services available right now.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-header">
                      <div>
                        <h4 className="cart-item-title">{item.name}</h4>
                        <p className="cart-item-meta">{item.category} • {item.type}</p>
                      </div>
                      <div style={{ color: "#0b6678", fontWeight: 800, fontSize: "0.95rem" }}>
                        {item.price}
                      </div>
                    </div>
                    <div className="cart-item-controls">
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}><FiMinus /></button>
                        <span style={{ color: "#111827", fontWeight: 700, width: "20px", textAlign: "center", fontSize: "0.9rem" }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}><FiPlus /></button>
                      </div>
                      <button className="remove-btn" onClick={() => removeItem(item.id)}>
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-form-section">
                <h3 style={{ color: "#111827", margin: "0 0 20px 0", fontSize: "1.05rem", fontWeight: 800 }}>Booking Details</h3>
                
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" required 
                  value={bookingForm.name} onChange={e => updateForm("name", e.target.value)} />

                <label className="form-label">Phone Number *</label>
                <input type="tel" className="form-input" required 
                  value={bookingForm.phone} onChange={e => updateForm("phone", e.target.value)} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="form-label">Preferred Date</label>
                    <input type="date" className="form-input" 
                      value={bookingForm.prefDate} onChange={e => updateForm("prefDate", e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Preferred Time</label>
                    <select className="form-input" 
                      value={bookingForm.prefTime} onChange={e => updateForm("prefTime", e.target.value)}>
                      <option>Morning (9 AM - 12 PM)</option>
                      <option>Afternoon (12 PM - 4 PM)</option>
                      <option>Evening (4 PM - 8 PM)</option>
                    </select>
                  </div>
                </div>

                <label className="form-label">Address</label>
                <textarea className="form-input" rows="3" 
                  value={bookingForm.address} onChange={e => updateForm("address", e.target.value)} />

                <label className="form-label">Branch</label>
                <select className="form-input" 
                  value={bookingForm.branchId} onChange={e => updateForm("branchId", e.target.value)}>
                  {branches.map(b => (
                    <option key={b.branch_id} value={b.branch_id}>{b.name}</option>
                  ))}
                </select>

                <label className="form-label">Special Notes (Optional)</label>
                <textarea className="form-input" rows="2" 
                  value={bookingForm.specialNotes} onChange={e => updateForm("specialNotes", e.target.value)} />
              </div>
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <button className="submit-btn" onClick={handleSubmit}>
              Submit Booking on WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default BookingCart;
