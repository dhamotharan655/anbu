import React, { useEffect, useState } from "react";
import api from "../api";
import { motion } from "framer-motion";
import { 
  FiDollarSign, FiPlusCircle, FiTrendingUp, FiTrendingDown, 
  FiFileText, FiTrash2, FiEdit2, FiFilter, FiActivity, FiBriefcase 
} from "react-icons/fi";

const COLORS = {
  primary: "#0b6678",
  secondary: "#128299",
  accent: "#f1b32a",
  success: "#2d9e6b",
  danger: "#eb5968",
  text: "#0f172a",
  muted: "#64748b",
  bg: "#f8fafc"
};

const glassCard = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(11, 102, 120, 0.12)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 8px 32px rgba(11, 102, 120, 0.04)",
  marginBottom: "24px"
};

const categories = {
  expense: [
    { key: "product_purchase", label: "Product Purchase" },
    { key: "staff_salary", label: "Staff Salary" },
    { key: "shop_rent", label: "Shop Rent" },
    { key: "staff_incentive", label: "Staff Incentive" },
    { key: "petrol", label: "Petrol" },
    { key: "other", label: "Other Business Expenses" }
  ],
  income: [
    { key: "product_selling", label: "Product Selling" },
    { key: "service_amount", label: "Service Amount" }
  ]
};

const InventoryFinancials = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [transactions, setTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("All");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("All");
  const [selectedYearFilter, setSelectedYearFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const months = [
    { value: "All", label: "All Months" },
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  const currentYear = new Date().getFullYear();
  const years = ["All", currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [formTxn, setFormTxn] = useState({
    type: "expense",
    category: "product_purchase",
    branch_name: "",
    amount: "",
    status: "paid",
    description: "",
    date: new Date().toISOString().substring(0, 10)
  });

  const fetchTransactions = () => {
    setLoading(true);
    api.get("/inventory-transactions/")
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error("Error loading transactions:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions();
    api.get("/branches/")
      .then((res) => {
        const d = res.data;
        const active = d && d.branches
          ? d.branches.filter((b) => b.is_active)
          : Array.isArray(d) ? d.filter((b) => b.is_active) : [];
        setBranches(active);
        if (active.length > 0) {
          setFormTxn((prev) => ({ ...prev, branch_name: active[0].name }));
        }
      })
      .catch(() => {});
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormTxn((prev) => {
      const updated = { ...prev, [name]: value };
      // Keep status logical when type switches
      if (name === "type") {
        updated.category = value === "expense" ? "product_purchase" : "product_selling";
        updated.status = value === "expense" ? "paid" : "received";
      }
      return updated;
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formTxn.branch_name || !formTxn.amount || Number(formTxn.amount) <= 0) {
      alert("Please enter a valid branch and positive amount.");
      return;
    }

    try {
      if (editingTxn) {
        await api.put(`/inventory-transactions/${editingTxn.transaction_id}/update/`, {
          ...formTxn,
          amount: parseFloat(formTxn.amount)
        });
      } else {
        await api.post("/inventory-transactions/create/", {
          ...formTxn,
          amount: parseFloat(formTxn.amount)
        });
      }
      fetchTransactions();
      setShowAddForm(false);
      setEditingTxn(null);
      setFormTxn({
        type: "expense",
        category: "product_purchase",
        branch_name: branches.length > 0 ? branches[0].name : "",
        amount: "",
        status: "paid",
        description: "",
        date: new Date().toISOString().substring(0, 10)
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction.");
    }
  };

  const handleEdit = (txn) => {
    setEditingTxn(txn);
    setFormTxn({
      type: txn.type,
      category: txn.category,
      branch_name: txn.branch_name,
      amount: txn.amount.toString(),
      status: txn.status,
      description: txn.description || "",
      date: txn.date ? txn.date.substring(0, 10) : new Date().toISOString().substring(0, 10)
    });
    setShowAddForm(true);
  };

  const handleDelete = async (transId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await api.delete(`/inventory-transactions/${transId}/delete/`);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction.");
    }
  };

  // Calculations
  const filteredTxns = transactions.filter((t) => {
    const matchesBranch = selectedBranchFilter === "All" || t.branch_name === selectedBranchFilter;
    if (!t.date) return matchesBranch && selectedMonthFilter === "All" && selectedYearFilter === "All";
    
    const parts = t.date.split("-");
    const txnYear = parseInt(parts[0]);
    const txnMonth = parseInt(parts[1]);
    
    const matchesYear = selectedYearFilter === "All" || txnYear === parseInt(selectedYearFilter);
    const matchesMonth = selectedMonthFilter === "All" || txnMonth === parseInt(selectedMonthFilter);
    
    return matchesBranch && matchesYear && matchesMonth;
  });

  const stats = filteredTxns.reduce(
    (acc, t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") {
        acc.totalIncome += amt;
        if (t.status === "received") {
          acc.receivedIncome += amt;
        } else if (t.status === "due") {
          acc.dueIncome += amt;
        }
      } else if (t.type === "expense") {
        acc.totalExpense += amt;
      }
      return acc;
    },
    { totalIncome: 0, receivedIncome: 0, dueIncome: 0, totalExpense: 0 }
  );

  const profitLossReceived = stats.receivedIncome - stats.totalExpense;
  const profitLossProjected = stats.totalIncome - stats.totalExpense;

  const getCategoryLabel = (type, catKey) => {
    const list = categories[type] || [];
    const found = list.find((c) => c.key === catKey);
    return found ? found.label : catKey;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.8rem", fontWeight: 800, color: COLORS.text, margin: "0 0 4px" }}>
            Finance &amp; Cash Flow Manager
          </h1>
          <p style={{ fontSize: "0.85rem", color: COLORS.muted, margin: 0 }}>
            Manage expenses, income, receivables and track profit &amp; loss statements by branch.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {/* Branch Filter dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(11,102,120,0.12)", borderRadius: "14px", padding: "6px 14px" }}>
            <FiFilter color={COLORS.primary} size={15} />
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.text }}>Branch:</span>
            <select
              style={{ border: "none", background: "transparent", fontSize: "0.85rem", fontWeight: 600, outline: "none", cursor: "pointer", color: COLORS.primary }}
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
            >
              <option value="All">All Branches</option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Month Filter dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(11,102,120,0.12)", borderRadius: "14px", padding: "6px 14px" }}>
            <FiFilter color={COLORS.primary} size={15} />
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.text }}>Month:</span>
            <select
              style={{ border: "none", background: "transparent", fontSize: "0.85rem", fontWeight: 600, outline: "none", cursor: "pointer", color: COLORS.primary }}
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Year Filter dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(11,102,120,0.12)", borderRadius: "14px", padding: "6px 14px" }}>
            <FiFilter color={COLORS.primary} size={15} />
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.text }}>Year:</span>
            <select
              style={{ border: "none", background: "transparent", fontSize: "0.85rem", fontWeight: 600, outline: "none", cursor: "pointer", color: COLORS.primary }}
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* METRIC CARD STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px", marginBottom: "28px" }}>
        {/* Total Income */}
        <div style={glassCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase" }}>Total Income</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(45,158,107,0.1)", display: "flex", alignItems: "center", justifycontent: "center" }}>
              <FiTrendingUp color={COLORS.success} style={{ margin: "auto" }} />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: 800, color: COLORS.text }}>
            ₹{stats.totalIncome.toLocaleString()}
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "6px", fontSize: "0.78rem" }}>
            <span style={{ color: COLORS.success, fontWeight: 700 }}>Recd: ₹{stats.receivedIncome.toLocaleString()}</span>
            <span style={{ color: COLORS.accent, fontWeight: 700 }}>Due: ₹{stats.dueIncome.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div style={glassCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase" }}>Total Expenses</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(235,89,104,0.1)", display: "flex", alignItems: "center", justifycontent: "center" }}>
              <FiTrendingDown color={COLORS.danger} style={{ margin: "auto" }} />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: 800, color: COLORS.text }}>
            ₹{stats.totalExpense.toLocaleString()}
          </div>
          <p style={{ fontSize: "0.75rem", color: COLORS.muted, margin: "6px 0 0" }}>Total paid &amp; committed costs</p>
        </div>

        {/* Realized Profit/Loss */}
        <div style={{ ...glassCard, borderLeft: `4px solid ${profitLossReceived >= 0 ? COLORS.success : COLORS.danger}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase" }}>Realized Profit/Loss</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: profitLossReceived >= 0 ? COLORS.success : COLORS.danger }}>
              {profitLossReceived >= 0 ? "SURPLUS" : "DEFICIT"}
            </span>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: 800, color: profitLossReceived >= 0 ? COLORS.success : COLORS.danger }}>
            ₹{profitLossReceived.toLocaleString()}
          </div>
          <p style={{ fontSize: "0.75rem", color: COLORS.muted, margin: "6px 0 0" }}>Based strictly on Cash Received</p>
        </div>

        {/* Projected Profit/Loss */}
        <div style={{ ...glassCard, borderLeft: `4px solid ${profitLossProjected >= 0 ? COLORS.secondary : COLORS.danger}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: COLORS.muted, textTransform: "uppercase" }}>Projected Profit/Loss</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.secondary }}>ESTIMATE</span>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: 800, color: profitLossProjected >= 0 ? COLORS.secondary : COLORS.danger }}>
            ₹{profitLossProjected.toLocaleString()}
          </div>
          <p style={{ fontSize: "0.75rem", color: COLORS.muted, margin: "6px 0 0" }}>Includes outstanding due invoices</p>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1.5px solid rgba(11,102,120,0.1)", marginBottom: "24px", paddingBottom: "8px" }}>
        <button
          style={{ border: "none", background: activeTab === "overview" ? "rgba(11,102,120,0.08)" : "transparent", color: activeTab === "overview" ? COLORS.primary : COLORS.muted, fontFamily: "inherit", fontWeight: 700, fontSize: "0.88rem", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => { setActiveTab("overview"); setShowAddForm(false); }}
        >
          🗂 Overview
        </button>
        <button
          style={{ border: "none", background: activeTab === "income" ? "rgba(11,102,120,0.08)" : "transparent", color: activeTab === "income" ? COLORS.primary : COLORS.muted, fontFamily: "inherit", fontWeight: 700, fontSize: "0.88rem", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => { setActiveTab("income"); setShowAddForm(false); }}
        >
          📈 Income Tracker
        </button>
        <button
          style={{ border: "none", background: activeTab === "expense" ? "rgba(11,102,120,0.08)" : "transparent", color: activeTab === "expense" ? COLORS.primary : COLORS.muted, fontFamily: "inherit", fontWeight: 700, fontSize: "0.88rem", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => { setActiveTab("expense"); setShowAddForm(false); }}
        >
          📉 Expenses Tracker
        </button>
      </div>

      {/* ADD/EDIT TRANSACTION FORM */}
      {showAddForm && (
        <motion.div style={glassCard} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem", fontWeight: 700, color: COLORS.text, margin: 0 }}>
              {editingTxn ? "📝 Edit Transaction" : "⚡ Record New Transaction"}
            </h3>
            <button
              onClick={() => { setShowAddForm(false); setEditingTxn(null); }}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, color: COLORS.danger }}
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {/* Type Selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: COLORS.text, marginBottom: "5px" }}>Transaction Type</label>
              <select
                style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "1.5px solid rgba(11,102,120,0.15)", background: "transparent" }}
                name="type"
                value={formTxn.type}
                onChange={handleFormChange}
                disabled={!!editingTxn}
              >
                <option value="expense">Expense (Debit)</option>
                <option value="income">Income (Credit)</option>
              </select>
            </div>

            {/* Category Selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: COLORS.text, marginBottom: "5px" }}>Category</label>
              <select
                style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "1.5px solid rgba(11,102,120,0.15)", background: "transparent" }}
                name="category"
                value={formTxn.category}
                onChange={handleFormChange}
              >
                {categories[formTxn.type].map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Branch Selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: COLORS.text, marginBottom: "5px" }}>Branch</label>
              <select
                style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "1.5px solid rgba(11,102,120,0.15)", background: "transparent" }}
                name="branch_name"
                value={formTxn.branch_name}
                onChange={handleFormChange}
                required
              >
                <option value="" disabled>Select Branch</option>
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: COLORS.text, marginBottom: "5px" }}>Amount (₹) *</label>
              <input
                style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "1.5px solid rgba(11,102,120,0.15)", background: "transparent" }}
                type="number"
                name="amount"
                value={formTxn.amount}
                onChange={handleFormChange}
                placeholder="e.g. 5000"
                required
              />
            </div>

            {/* Status (income -> received/due, expense -> paid/pending) */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: COLORS.text, marginBottom: "5px" }}>Status</label>
              <select
                style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "1.5px solid rgba(11,102,120,0.15)", background: "transparent" }}
                name="status"
                value={formTxn.status}
                onChange={handleFormChange}
              >
                {formTxn.type === "income" ? (
                  <>
                    <option value="received">Received (Paid)</option>
                    <option value="due">Due (Outstanding)</option>
                  </>
                ) : (
                  <>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending Payment</option>
                  </>
                )}
              </select>
            </div>

            {/* Transaction Date */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: COLORS.text, marginBottom: "5px" }}>Date</label>
              <input
                style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "1.5px solid rgba(11,102,120,0.15)", background: "transparent" }}
                type="date"
                name="date"
                value={formTxn.date}
                onChange={handleFormChange}
              />
            </div>

            {/* Description */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: COLORS.text, marginBottom: "5px" }}>Notes / Description</label>
              <input
                style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "1.5px solid rgba(11,102,120,0.15)", background: "transparent" }}
                type="text"
                name="description"
                value={formTxn.description}
                onChange={handleFormChange}
                placeholder="Optional notes e.g. Rent for Anna Nagar Anna tower branch"
              />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                style={{ background: COLORS.primary, color: "white", padding: "11px 24px", border: "none", borderRadius: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <FiPlusCircle /> {editingTxn ? "Save Changes" : "Record Transaction"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* OVERVIEW CONTENT VIEW */}
      {activeTab === "overview" && !showAddForm && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flexWrap: "wrap" }}>
          {/* Category Breakdown (Expenses) */}
          <div style={glassCard}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem", fontWeight: 700, color: COLORS.text, marginBottom: "18px" }}>
              Expenses by Category
            </h3>
            {filteredTxns.filter((t) => t.type === "expense").length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: COLORS.muted }}>No expenses recorded.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {categories.expense.map((cat) => {
                  const amt = filteredTxns
                    .filter((t) => t.type === "expense" && t.category === cat.key)
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                  const pct = stats.totalExpense > 0 ? (amt / stats.totalExpense) * 100 : 0;
                  return (
                    <div key={cat.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, color: COLORS.text, marginBottom: "4px" }}>
                        <span>{cat.label}</span>
                        <span>₹{amt.toLocaleString()} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "rgba(11,102,120,0.06)", borderRadius: "100px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: COLORS.danger, borderRadius: "100px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Income Status Break-up */}
          <div style={glassCard}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem", fontWeight: 700, color: COLORS.text, marginBottom: "18px" }}>
              Income Status Break-up
            </h3>
            {filteredTxns.filter((t) => t.type === "income").length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: COLORS.muted }}>No income recorded.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: COLORS.success, marginBottom: "4px" }}>
                    <span>💸 Received / Paid Income</span>
                    <span>₹{stats.receivedIncome.toLocaleString()}</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(45,158,107,0.1)", borderRadius: "100px", overflow: "hidden" }}>
                    <div style={{ width: `${stats.totalIncome > 0 ? (stats.receivedIncome / stats.totalIncome) * 100 : 0}%`, height: "100%", background: COLORS.success, borderRadius: "100px" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: COLORS.accent, marginBottom: "4px" }}>
                    <span>⏳ Outstanding Due Income</span>
                    <span>₹{stats.dueIncome.toLocaleString()}</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(241,179,42,0.1)", borderRadius: "100px", overflow: "hidden" }}>
                    <div style={{ width: `${stats.totalIncome > 0 ? (stats.dueIncome / stats.totalIncome) * 100 : 0}%`, height: "100%", background: COLORS.accent, borderRadius: "100px" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INCOME / EXPENSE LIST TABLES */}
      {!showAddForm && (activeTab === "income" || activeTab === "expense") && (
        <div style={glassCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem", fontWeight: 700, color: COLORS.text, margin: 0 }}>
              {activeTab === "income" ? "📈 Income Statement Transactions" : "📉 Business Expenditures list"}
            </h3>
            <button
              onClick={() => {
                setFormTxn((prev) => ({
                  ...prev,
                  type: activeTab,
                  category: activeTab === "income" ? "product_selling" : "product_purchase",
                  status: activeTab === "income" ? "received" : "paid"
                }));
                setShowAddForm(true);
              }}
              style={{ background: COLORS.primary, color: "white", padding: "8px 16px", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}
            >
              <FiPlusCircle /> Record {activeTab === "income" ? "Income" : "Expense"}
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid rgba(11,102,120,0.1)", textAlign: "left" }}>
                  <th style={{ padding: "12px", fontSize: "0.8rem", color: COLORS.muted }}>TXN ID / Date</th>
                  <th style={{ padding: "12px", fontSize: "0.8rem", color: COLORS.muted }}>Branch</th>
                  <th style={{ padding: "12px", fontSize: "0.8rem", color: COLORS.muted }}>Category / Notes</th>
                  <th style={{ padding: "12px", fontSize: "0.8rem", color: COLORS.muted }}>Amount</th>
                  <th style={{ padding: "12px", fontSize: "0.8rem", color: COLORS.muted }}>Status</th>
                  <th style={{ padding: "12px", fontSize: "0.8rem", color: COLORS.muted, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.filter((t) => t.type === activeTab).length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: COLORS.muted, fontSize: "0.85rem" }}>
                      No {activeTab} transactions found for this branch filter.
                    </td>
                  </tr>
                ) : (
                  filteredTxns
                    .filter((t) => t.type === activeTab)
                    .map((t) => (
                      <tr key={t.id} style={{ borderBottom: "1px solid rgba(11,102,120,0.06)" }}>
                        <td style={{ padding: "12px", fontSize: "0.84rem" }}>
                          <span style={{ fontWeight: 700, color: COLORS.primary, display: "block" }}>#{t.transaction_id}</span>
                          <span style={{ fontSize: "11px", color: COLORS.muted }}>{t.date ? t.date.substring(0, 10) : ""}</span>
                        </td>
                        <td style={{ padding: "12px", fontSize: "0.84rem", fontWeight: 700, color: COLORS.text }}>
                          {t.branch_name}
                        </td>
                        <td style={{ padding: "12px", fontSize: "0.84rem" }}>
                          <span style={{ fontWeight: 700, display: "block" }}>{getCategoryLabel(t.type, t.category)}</span>
                          <span style={{ fontSize: "11px", color: COLORS.muted }}>{t.description || "N/A"}</span>
                        </td>
                        <td style={{ padding: "12px", fontSize: "0.88rem", fontWeight: 800, color: t.type === "income" ? COLORS.success : COLORS.danger }}>
                          ₹{t.amount?.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: "100px",
                            textTransform: "uppercase",
                            color: t.status === "received" || t.status === "paid" ? COLORS.success : COLORS.accent,
                            background: t.status === "received" || t.status === "paid" ? "rgba(45,158,107,0.1)" : "rgba(241,179,42,0.1)"
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            {t.transaction_id?.startsWith("COMP-") || 
                             t.transaction_id?.startsWith("STOCK-") || 
                             t.transaction_id?.startsWith("STAFF-") ? (
                              <span style={{ fontSize: "11px", fontWeight: 600, color: COLORS.muted, background: "rgba(100,116,139,0.08)", padding: "4px 8px", borderRadius: "6px" }}>
                                {t.transaction_id?.startsWith("COMP-") ? "⚙️ Auto (Job)" :
                                 t.transaction_id?.startsWith("STOCK-") ? "⚙️ Auto (Stock)" :
                                 t.transaction_id?.startsWith("STAFF-PAYROLL-") ? "⚙️ Auto (Payroll)" : "⚙️ Auto (Job)"}
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEdit(t)}
                                  style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", cursor: "pointer", background: "rgba(11,102,120,0.06)", color: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <FiEdit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDelete(t.transaction_id)}
                                  style={{ width: "32px", height: "32px", borderRadius: "8px", border: "none", cursor: "pointer", background: "rgba(235,89,104,0.06)", color: COLORS.danger, display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryFinancials;
