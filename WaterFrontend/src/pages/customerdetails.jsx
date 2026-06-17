import React, { useEffect, useState } from "react";
import api from "../api";

const CustomerDetails = () => {
  const [active, setActive] = useState("our_customer");
  const [customers, setCustomers] = useState([]);

  const fetchData = async (type) => {
    try {
      const res = await api.get(`/customers/?type=${type}`);
      setCustomers(res.data);
    } catch (err) {
      console.error("❌ Error:", err);
    }
  };

  useEffect(() => {
    fetchData("our_customer");
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto", fontFamily: "var(--font-family-sans)" }}>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        
        <button
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 100,
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.88rem",
            background: active === "our_customer" ? "var(--gradient-primary)" : "rgba(255,255,255,0.72)",
            color: active === "our_customer" ? "#fff" : "var(--color-text-secondary)",
            boxShadow: active === "our_customer" ? "var(--shadow-primary)" : "var(--shadow-sm)",
            transition: "all 0.25s ease",
            fontFamily: "var(--font-family-sans)",
          }}
          onClick={() => {
            setActive("our_customer");
            fetchData("our_customer");
          }}
        >
          Our Customers
        </button>

        <button
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 100,
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.88rem",
            background: active === "external_customer" ? "var(--gradient-primary)" : "rgba(255,255,255,0.72)",
            color: active === "external_customer" ? "#fff" : "var(--color-text-secondary)",
            boxShadow: active === "external_customer" ? "var(--shadow-primary)" : "var(--shadow-sm)",
            transition: "all 0.25s ease",
            fontFamily: "var(--font-family-sans)",
          }}
          onClick={() => {
            setActive("external_customer");
            fetchData("external_customer");
          }}
        >
          External Customers
        </button>

      </div>

      {/* LIST */}
      {customers.map((c, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: 20,
            borderRadius: 20,
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
            marginBottom: 12,
            transition: "all 0.25s ease",
          }}
        >
          <p style={{ color: "#1e1b2e", margin: "0 0 6px" }}><b>Client ID:</b> {c.customer_id}</p>
          <p style={{ color: "#1e1b2e", margin: "0 0 6px" }}><b>Name:</b> {c.name}</p>
          <p style={{ color: "#1e1b2e", margin: "0 0 6px" }}><b>Phone:</b> {c.phone}</p>
          <p style={{ color: "#1e1b2e", margin: 0 }}><b>Address:</b> {c.address}</p>
        </div>
      ))}

    </div>
  );
};

export default CustomerDetails;
