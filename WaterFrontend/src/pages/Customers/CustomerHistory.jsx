import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api";
import {
  FiArrowLeft,
  FiFileText,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiCheckSquare,
  FiDollarSign,
  FiMessageSquare,
  FiAlertCircle,
  FiCheck,
  FiClock,
  FiUserCheck,
  FiShield,
  FiImage,
  FiHash,
  FiPackage,
  FiEdit,
  FiSave,
  FiX,
  FiMessageCircle,
  FiPlusCircle,
  FiSearch,
  FiXCircle,
  FiCreditCard
} from "react-icons/fi";
import { openWhatsAppWithDefaultMessage } from "../../utils/whatsappUtils";
import "../../utils/whatsappUtils.css";

/* -------------------------------
   HELPER FUNCTION TO PARSE PRODUCT DATA
-------------------------------- */
const parseProductData = (productData) => {
  if (!productData) return null;
  
  // If it's already an array
  if (Array.isArray(productData)) {
    return productData;
  }
  
  // If it's a JSON string
  if (typeof productData === 'string') {
    try {
      const parsed = JSON.parse(productData);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      // Not JSON, return as single item
      return [{ productName: productData, quantity: 1 }];
    }
  }
  
  return null;
};

/* -------------------------------
   FORMAT PRODUCTS FOR DISPLAY
-------------------------------- */
const formatProducts = (productData) => {
  const products = parseProductData(productData);
  if (!products || products.length === 0) return null;
  
  const totalQty = products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
  const totalPrice = products.reduce((sum, p) => sum + (
    parseFloat(p.price) ||
    parseFloat(p.amount) ||
    parseFloat(p.motorAmount) ||
    parseFloat(p.total) ||
    parseFloat(p.product_price) ||
    0
  ), 0);
  const productNames = products.map(p => p.productName).join(', ');
  
  if (totalPrice > 0) {
    return `${productNames} (Qty: ${totalQty}) - ₹${totalPrice.toFixed(2)}`;
  }
  return `${productNames} (Qty: ${totalQty})`;
};

/* -------------------------------
   GET TOTAL AMOUNT FROM PRODUCTS
-------------------------------- */
const getTotalAmount = (productData) => {
  const products = parseProductData(productData);
  if (!products || products.length === 0) return 0;
  
  return products.reduce((sum, p) => {
    const price = 
      parseFloat(p.price) ||
      parseFloat(p.amount) ||
      parseFloat(p.motorAmount) ||
      parseFloat(p.total) ||
      parseFloat(p.product_price) ||
      0;
    return sum + price;
  }, 0);
};

/* -------------------------------
   COMPUTE PAYMENT INFO FROM COMPLAINT DATA
-------------------------------- */
const computePaymentInfo = (complaint) => {
  const grandTotal = parseFloat(complaint.grand_total) || 0;
  const paymentDetails = complaint.payment_details || [];

  let totalPaid = 0;
  if (Array.isArray(paymentDetails) && paymentDetails.length > 0) {
    totalPaid = paymentDetails.reduce(
      (sum, p) => sum + (parseFloat(p.amount_paid) || 0),
      0
    );
  } else {
    totalPaid = parseFloat(complaint.amount_received) || 0;
  }

  const dueAmount = Math.max(0, grandTotal - totalPaid);

  let paymentStatus = "Due";
  if (grandTotal > 0 && dueAmount <= 0) {
    paymentStatus = "Paid";
  } else if (dueAmount > 0 && complaint.payment_due_date) {
    try {
      const dueDate = new Date(complaint.payment_due_date);
      const now = new Date();
      if (now > dueDate) {
        paymentStatus = "Overdue";
      }
    } catch {
      paymentStatus = "Due";
    }
  }

  return { totalPaid, dueAmount, paymentStatus, grandTotal };
};

/* -------------------------------
   PAYMENT STATUS HELPERS
-------------------------------- */
const getPaymentStatusColor = (status) => {
  switch (status) {
    case "Paid":
      return "#059669";
    case "Due":
      return "#d97706";
    case "Overdue":
      return "#dc2626";
    default:
      return "#666";
  }
};

const getPaymentStatusBg = (status) => {
  switch (status) {
    case "Paid":
      return "#d1fae5";
    case "Due":
      return "#fef3c7";
    case "Overdue":
      return "#fee2e2";
    default:
      return "#f3f4f6";
  }
};

/* -------------------------------
   REUSABLE INFO ROW
-------------------------------- */
const InfoRow = ({ icon, label, value }) => (
  <div className="info-row">
    <span className="info-row-icon">{icon}</span>
    <span className="info-row-label">{label}</span>
    <span className="info-row-value">{value || "-"}</span>
  </div>
);

/* -------------------------------
   EDIT FORM COMPONENT
-------------------------------- */
const EditForm = ({ form, onChange, onSave, onCancel, complaintId, products }) => (
  <div className="edit-form">
    <div className="form-group">
      <label>Product</label>
      <select
        value={form.product_name || ''}
        onChange={(e) => onChange('product_name', e.target.value)}
      >
        <option value="">Select product</option>
        {products.map(product => (
          <option key={product.id} value={product.product_name}>
            {product.product_name}
          </option>
        ))}
      </select>
    </div>

    <div className="form-group">
      <label>Remarks</label>
      <input
        type="text"
        value={form.remarks}
        onChange={(e) => onChange('remarks', e.target.value)}
        placeholder="Enter remarks..."
      />
    </div>

    <div className="form-group">
      <label>Additional Product</label>
      <input
        type="text"
        value={form.additional_product || ''}
        onChange={(e) => onChange('additional_product', e.target.value)}
        placeholder="Enter additional product..."
      />
    </div>

    <div className="form-group">
      <label>Service Amount</label>
      <input
        type="number"
        value={form.client_amount}
        onChange={(e) => onChange('client_amount', e.target.value)}
        placeholder="Enter amount..."
      />
    </div>

    <div className="form-group">
      <label>Payment Method</label>
      <select
        value={form.payment_method}
        onChange={(e) => onChange('payment_method', e.target.value)}
      >
        <option value="">Select method</option>
        <option value="Cash">Cash</option>
        <option value="Online">Online</option>
        <option value="Card">Card</option>
      </select>
    </div>

    <div className="form-group">
      <label>Status</label>
      <select
        value={form.status}
        onChange={(e) => onChange('status', e.target.value)}
      >
        <option value="pending">Pending</option>
        <option value="assigned">Assigned</option>
        <option value="completed">Completed</option>
        <option value="initial">Initial</option>
      </select>
    </div>

    <div className="form-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
      <button className="button-primary" onClick={() => onSave(complaintId)}>
        <FiSave /> Save Changes
      </button>
      <button className="button-secondary" onClick={onCancel}>
        <FiX /> Cancel
      </button>
    </div>
  </div>
);

const CustomerHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const customer = location.state?.customer || null;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  // Helper function to get selling price from stock
  const getSellingPrice = (productName) => {
    const item = stockItems.find(s => s.name === productName);
    return item?.selling_price || 0;
  };

  // Format products with stock price fallback
  const formatProductsWithStock = (productData) => {
    const products = parseProductData(productData);
    if (!products || products.length === 0) return null;
    
    const totalQty = products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
    const totalPrice = products.reduce((sum, p) => {
      // Use stored price if available, otherwise get from stock
      const storedPrice = 
        parseFloat(p.price) ||
        parseFloat(p.amount) ||
        parseFloat(p.motorAmount) ||
        parseFloat(p.total) ||
        parseFloat(p.product_price) ||
        0;
      if (storedPrice > 0) {
        return sum + storedPrice;
      }
      // Fallback to getting from stock
      return sum + getSellingPrice(p.productName);
    }, 0);
    const productNames = products.map(p => p.productName).join(', ');
    
    if (totalPrice > 0) {
      return `${productNames} (Qty: ${totalQty}) - ₹${totalPrice.toFixed(2)}`;
    }
    return `${productNames} (Qty: ${totalQty})`;
  };

  /* -------------------------------
     FETCH CUSTOMER HISTORY
  -------------------------------- */
  useEffect(() => {
    if (!customer) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch service history by customer_id from BookServiceComplaint
    if (customer.customer_id) {
      api
        .get("/complaintperson/", { params: { customer_id: customer.customer_id } })
        .then(res => {
          setHistory(Array.isArray(res.data?.complaints) ? res.data.complaints : []);
        })
        .catch(err => {
          console.error("Failed to fetch history:", err);
          setHistory([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [customer]);

  /* -------------------------------
     FETCH PRODUCTS
  -------------------------------- */
  useEffect(() => {
    api
      .get("/products/")
      .then(res => {
        setProducts(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      });
  }, []);

  /* -------------------------------
     FETCH STOCK ITEMS
   -------------------------------- */
  useEffect(() => {
    api
      .get('/stocks/')
      .then(res => {
        setStockItems(res.data || []);
      })
      .catch(err => {
        console.error("Failed to fetch stock items:", err);
        setStockItems([]);
      });
  }, []);

  /* -------------------------------
     EDIT HANDLERS
  -------------------------------- */
  const handleEditClick = (complaint) => {
    setEditingComplaint(complaint.id || complaint.complaint_no);
    setEditForm({
      product_name: complaint.product_name || '',
      remarks: complaint.remarks || '',
      completed_remarks: complaint.completed_remarks || '',
      additional_product: complaint.additional_product || '',
      client_amount: complaint.client_amount || '',
      payment_method: complaint.payment_method || '',
      status: complaint.status || 'pending'
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async (complaintId) => {
    try {
      const response = await api.put(`/complaints/${complaintId}/`, editForm);
      
      // Update local history
      setHistory(prev => prev.map(item => 
        (item.id === complaintId || item.complaint_no === complaintId) 
          ? { ...item, ...response.data }
          : item
      ));
      
      setEditingComplaint(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to update complaint:', error);
      alert('Failed to update complaint. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingComplaint(null);
    setEditForm({});
  };

  /* -------------------------------
     STATUS HELPERS
  -------------------------------- */
  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <FiCheck />;
      case "assigned":
        return <FiUserCheck />;
      case "pending":
        return <FiClock />;
      case "initial":
        return <FiAlertCircle />;
      default:
        return <FiAlertCircle />;
    }
  };

  const getStatusClass = status => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "completed";
      case "assigned":
        return "assigned";
      case "pending":
        return "pending";
      case "initial":
        return "initial";
      default:
        return "default";
    }
  };

  /* -------------------------------
     FILTER LOGIC
  -------------------------------- */
  const filteredHistory = history.filter(item => {
    // Search by complaint number or details
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const complaintNo = (item.complaint_no || '').toLowerCase();
      const details = (item.details || '').toLowerCase();
      const productName = (item.product_name || '').toLowerCase();
      if (!complaintNo.includes(query) && !details.includes(query) && !productName.includes(query)) {
        return false;
      }
    }

    // Filter by specific date
    if (filterDate) {
      const itemDate = item.date_created ? new Date(item.date_created).toISOString().split('T')[0] : '';
      if (itemDate !== filterDate) return false;
    }

    // Filter by month
    if (filterMonth) {
      const itemDate = item.date_created ? new Date(item.date_created) : null;
      if (!itemDate || !itemDate.toISOString().startsWith(filterMonth)) {
        return false;
      }
    }

    // Filter by product name
    if (productSearch) {
      const products = parseProductData(item.product_name);
      if (!products || !products.some(p => (p.productName || '').toLowerCase().includes(productSearch.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterDate('');
    setFilterMonth('');
    setProductSearch('');
    setShowFilters(false);
  };

  const hasActiveFilters = searchQuery || filterDate || filterMonth || productSearch;

  /* -------------------------------
     EMPTY CUSTOMER
  -------------------------------- */
  if (!customer) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <FiUser size={48} />
          <p>No customer selected</p>
          <button className="btn-primary" onClick={() => navigate("/customers")}>
            <FiArrowLeft /> Back to Customers
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------
     LOADING STATE
  -------------------------------- */
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <FiFileText size={48} />
          <p>Loading customer history...</p>
        </div>
      </div>
    );
  }

  /* -------------------------------
     MAIN UI
  -------------------------------- */
  return (
    <div className="page-container customer-history-page">
      {/* HEADER */}
      <section className="page-section">
        <button
          className="btn-secondary back-button"
          onClick={() => navigate("/customers")}
        >
          <FiArrowLeft /> Back to Customers
        </button>

        <h1 className="section-title">Service History</h1>

        <div className="customer-summary">
          <h2>{customer.customer_name}</h2>

          <div className="customer-summary-details">
            <InfoRow
              icon={<FiHash />}
              label="Customer ID"
              value={customer.customer_id}
            />
            <InfoRow icon={<FiPhone />} label="Phone" value={customer.phone} />
            {customer.alternate_number && (
              <InfoRow icon={<FiPhone />} label="Alternate Number" value={customer.alternate_number} />
            )}
            <InfoRow icon={<FiMapPin />} label="Address" value={customer.address} />
          </div>
        </div>
      </section>

      {/* PAYMENT SUMMARY */}
      {history.length > 0 && (() => {
        const nonInitialComplaints = history.filter(c => c.is_initial !== true && (c.grand_total || c.client_amount));
        if (nonInitialComplaints.length === 0) return null;
        const totalGrand = nonInitialComplaints.reduce((s, c) => s + (parseFloat(c.grand_total) || parseFloat(c.client_amount) || 0), 0);
        const totalPaidAll = nonInitialComplaints.reduce((s, c) => {
          const info = computePaymentInfo(c);
          return s + info.totalPaid;
        }, 0);
        const totalDueAll = Math.max(0, totalGrand - totalPaidAll);
        const paidCount = nonInitialComplaints.filter(c => computePaymentInfo(c).paymentStatus === "Paid").length;
        const overdueCount = nonInitialComplaints.filter(c => computePaymentInfo(c).paymentStatus === "Overdue").length;
        return (
          <section className="page-section" style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              background: 'rgba(255,255,255,0.95)',
              padding: '16px 20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '14px', color: '#475569' }}>
                <FiCreditCard size={16} />
                <span>Payment Summary</span>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Total: <strong style={{ color: '#1e293b' }}>₹{totalGrand.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Paid: <strong style={{ color: '#059669' }}>₹{totalPaidAll.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Due: <strong style={{ color: totalDueAll > 0 ? '#dc2626' : '#059669' }}>₹{totalDueAll.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                <span style={{ background: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', fontSize: '12px' }}>{paidCount} Paid</span>
                {' '}
                {overdueCount > 0 && (
                  <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', fontSize: '12px' }}>{overdueCount} Overdue</span>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* SEARCH AND FILTERS */}
      <section className="page-section" style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.9)',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search by complaint no, details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: showFilters ? 'none' : '1px solid #ddd',
              background: showFilters ? '#9b6fe8' : 'white',
              color: showFilters ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            {showFilters ? 'Hide Filters' : 'More Filters'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#fee2e2',
                color: '#dc2626',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#666' }}>Specific Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#666' }}>Filter by Month</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#666' }}>Product Name</label>
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
            Showing <strong>{filteredHistory.length}</strong> of <strong>{history.length}</strong> jobs
          </div>
        )}
      </section>

      {/* HISTORY LIST */}
      <section className="page-section">
        <div className="complaint-list">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item, index) => {
              const isPending = item.status === "pending" || item.status === "initial";
              const formattedProducts = formatProductsWithStock(item.product_name);
              const formattedAdditional = formatProductsWithStock(item.additional_product);
              return (
                <div
                  key={item.id || index}
                  className={`complaint-card ${getStatusClass(item.status)}`}
                >
                  <div className="card-header">
                  <span className="card-title">
                    #{item.complaint_no || `Complaint ${index + 1}`}
                  </span>
                  {/* ⭐ FEATURE 4 & 6: Display 'Initial' for initial records */}
                  <span className={`status-badge ${item.is_initial === true ? 'initial' : getStatusClass(item.status)}`}>
                    {item.is_initial === true ? <FiFileText /> : getStatusIcon(item.status)}
                    {item.is_initial === true ? 'Initial' : (item.status || "Unknown")}
                  </span>
                </div>

                <div className="card-content">
                  <InfoRow icon={<FiUser />} label="Customer" value={customer.customer_name} />
                  <InfoRow icon={<FiPhone />} label="Phone" value={customer.phone} />
                  {customer.alternate_number && (
                    <InfoRow icon={<FiPhone />} label="Alternate" value={customer.alternate_number} />
                  )}
                  <InfoRow icon={<FiHash />} label="Customer ID" value={customer.customer_id} />
                  <InfoRow icon={<FiMapPin />} label="Address" value={customer.address} />

                  {item.details && (
                    <InfoRow icon={<FiAlertCircle />} label="Issue" value={item.details} />
                  )}

                  {item.product_name && (
                    <InfoRow icon={<FiPackage />} label="Product Purchased" value={formattedProducts || item.product_name} />
                  )}

                  {/* ⭐ FEATURE 6: Show product_quantity and job_type for initial records */}
                  {item.is_initial === true && item.product_quantity > 0 && (
                    <InfoRow icon={<FiPackage />} label="Quantity" value={item.product_quantity} />
                  )}

                  {item.is_initial === true && item.job_type && (
                    <InfoRow icon={<FiFileText />} label="Job Type" 
                      value={
                        item.job_type === 'motor_sale' ? 'Motor Sale' :
                        item.job_type === 'motor_service' ? 'Motor Service' :
                        item.job_type === 'general_service' ? 'General Service' :
                        item.job_type
                      } 
                    />
                  )}

                  {item.additional_product && (
                    <InfoRow icon={<FiPlusCircle />} label="Additional Product" value={formattedAdditional || item.additional_product} />
                  )}

                  {item.assigned_staff && (
                    <InfoRow
                      icon={<FiUserCheck />}
                      label="Assigned To"
                      value={item.assigned_staff}
                    />
                  )}

                  {(item.date_created || item.date_created === 0) && (
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

                  {(item.assigned_at || item.assigned_at === 0) && (
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

                  {!isPending && (
                    <InfoRow
                      icon={<FiCheck />}
                      label="Completed Date"
                      value={(() => {
                        console.log("assigned_completed_at:", item.assigned_completed_at);
                        if (item.assigned_completed_at) {
                          try {
                            return new Date(item.assigned_completed_at).toLocaleDateString();
                          } catch (e) {
                            return item.assigned_completed_at;
                          }
                        }
                        return "N/A";
                      })()}
                    />
                  )}

                  {/* Hide price for initial records - they don't have payment */}
                  {item.is_initial !== true && item.client_amount && (
                    <InfoRow
                      icon={<FiDollarSign />}
                      label="Service Amount"
                      value={`₹${item.client_amount}`}
                    />
                  )}

                  {item.is_initial !== true && (item.grand_total || item.client_amount) && (
                    <InfoRow
                      icon={<FiDollarSign />}
                      label="Grand Total"
                      value={`₹${item.grand_total || item.client_amount}`}
                      style={{ fontWeight: '700', color: '#059669' }}
                    />
                  )}

                  {/* PAYMENT INFO SECTION */}
                  {item.is_initial !== true && (item.grand_total || item.client_amount) && (() => {
                    const paymentInfo = computePaymentInfo(item);
                    return (
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginTop: '6px',
                        marginBottom: '4px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '8px',
                          fontWeight: '600',
                          fontSize: '13px',
                          color: '#475569'
                        }}>
                          <FiCreditCard size={14} />
                          <span>Payment Info</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <div style={{ fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>Paid: </span>
                            <span style={{ fontWeight: '600', color: '#059669' }}>
                              ₹{paymentInfo.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>Due: </span>
                            <span style={{ fontWeight: '600', color: paymentInfo.dueAmount > 0 ? '#dc2626' : '#059669' }}>
                              ₹{paymentInfo.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            color: getPaymentStatusColor(paymentInfo.paymentStatus),
                            background: getPaymentStatusBg(paymentInfo.paymentStatus)
                          }}>
                            {paymentInfo.paymentStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Hide payment method for initial records - they don't have payment */}
                  {item.is_initial !== true && item.payment_method && (
                    <InfoRow
                      icon={<FiCheckSquare />}
                      label="Payment Method"
                      value={item.payment_method}
                    />
                  )}

                  {/* EDIT BUTTON */}
                  <div className="edit-actions" style={{ marginTop: '0.5rem' }}>
                    <button className="action-button edit" onClick={() => handleEditClick(item)}>
                      <FiEdit /> Edit
                    </button>
                  </div>

                  {/* WhatsApp Button - Only for completed jobs */}
                  {!isPending && (
                    <div className="whatsapp-actions">
                      <button
                        className="whatsapp-button"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          openWhatsAppWithDefaultMessage(
                            customer.phone,
                            customer.customer_name,
                            item.complaint_no
                          );
                        }}
                        title="Send WhatsApp Message"
                      >
                        <FiMessageCircle />
                        <span>Send WhatsApp</span>
                      </button>
                    </div>
                  )}

                  {/* EDIT FORM - INLINE */}
                  {editingComplaint === (item.id || item.complaint_no) && (
                    <EditForm
                      form={editForm}
                      onChange={handleEditChange}
                      onSave={handleSaveEdit}
                      onCancel={handleCancelEdit}
                      complaintId={item.id || item.complaint_no}
                      products={products}
                    />
                  )}

                  {/* WARRANTY */}
                  {(item.warranty_date || item.warranty_photo) && (
                    <div className="warranty-section">
                      <h4>
                        <FiShield /> Warranty
                      </h4>

                      {item.warranty_date && (
                        <InfoRow
                          icon={<FiCalendar />}
                          label="Warranty Date"
                          value={(() => {
                            const warrantyDate = new Date(item.warranty_date);
                            const currentDate = new Date();
                            const isExpired = warrantyDate < currentDate;
                            
                            return (
                              <span style={{ color: isExpired ? 'red' : 'inherit' }}>
                                {warrantyDate.toLocaleDateString()}
                                {isExpired && <span style={{ marginLeft: '8px', color: 'red' }}>(Expired)</span>}
                              </span>
                            );
                          })()}
                        />
                      )}

                      {item.warranty_photo && (
                        <div className="warranty-photo-row">
                          <FiImage />
                          <a
                            href={item.warranty_photo.startsWith("http") ? item.warranty_photo : `http://127.0.0.1:8000${item.warranty_photo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Warranty Photo
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <FiFileText size={48} />
              <p>No service history found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CustomerHistory;
