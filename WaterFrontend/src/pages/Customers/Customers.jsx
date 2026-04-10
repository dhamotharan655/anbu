import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./Customers.css";
import { useGlobalRefresh } from "../../context/GlobalRefreshContext";
import {
  FiUsers,
  FiExternalLink,
  FiSearch,
  FiUser,
  FiPhone,
  FiMapPin,
  FiArrowRight,
  FiHash,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiAlertTriangle,
  FiNavigation,
  FiX,
  FiLoader,
  FiMessageCircle,
  FiTool,
  FiHome
} from "react-icons/fi";
import { openWhatsAppWithDefaultMessage } from "../../utils/whatsappUtils";
import "../../utils/whatsappUtils.css";

/* INFO ROW */
const InfoRow = ({ icon, label, value, onLocationClick }) => (
  <div className="info-row">
    <span className="info-row-icon">{icon}</span>
    <span className="info-row-label">{label}</span>
    <div className="info-row-value-container">
      <span className="info-row-value">{value || "-"}</span>
      {label === "Address" && value && (
        <button
          className="location-btn"
          onClick={onLocationClick}
          title="View on Map"
        >
          <FiNavigation size={16} />
        </button>
      )}
    </div>
  </div>
);

const Customers = () => {
  const navigate = useNavigate();

  // Use global refresh context
  const { refreshTriggers, triggerRefresh } = useGlobalRefresh();

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all"); // our_customer, external_customer

  // Get permissions
  const permissions = JSON.parse(sessionStorage.getItem("permissions") || "[]");

  // Filter options with permission check
  const FILTER_OPTIONS = [
    { label: "All Customers", value: "all", icon: <FiUsers /> },
    { label: "In Service (Service Center)", value: "in_service", icon: <FiHome /> },
    { label: "Out Service (Customer Location)", value: "out_service", icon: <FiTool /> },
    ...(permissions.includes("add-customer") ? [{ label: "Add Customer", value: "add_customer", icon: <FiPlus /> }] : []),
  ];

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customer_name: "",
    phone: "",
    alternate_number: "",
    address: "",
    customer_email: "",
    customer_type: "our_customer"
  });

  // GPS capture state for edit modal
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  // Add customer modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    customer_name: "",
    phone: "",
    alternate_number: "",
    address: "",
    customer_email: "",
    customer_type: "our_customer",
    job_type: ""
  });

  // Multi-product selection state (like Booking page)
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    productName: "",
    quantity: 1
  });
  const [products, setProducts] = useState([]);
  const [addFormLoading, setAddFormLoading] = useState(false);
  const [addFormError, setAddFormError] = useState("");
  const [addFormSuccess, setAddFormSuccess] = useState("");
  const [addGpsLocation, setAddGpsLocation] = useState(null);
  const [addIsCapturingLocation, setAddIsCapturingLocation] = useState(false);
  const [addGpsError, setAddGpsError] = useState("");

  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationCustomer, setLocationCustomer] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  // Handle location click
  const handleLocationClick = (customer, e) => {
    e.stopPropagation(); // Prevent card click
    setLocationCustomer(customer);
    setShowLocationModal(true);
    setLocationLoading(true);
    setLocationError("");

    // Create Google Maps URL - Prioritize GPS coordinates for exact pinpointing with label
    let mapsUrl = "";
    if (customer.location && customer.location.latitude && customer.location.longitude) {
      // Use coordinates with search API and label for exact pinpoint
      const label = encodeURIComponent(`${customer.customer_name} @ `);
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${label}${customer.location.latitude},${customer.location.longitude}`;
    } else {
      // Fallback to address
      const address = encodeURIComponent(customer.address);
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
    }
    
    setMapUrl(mapsUrl);
    setLocationLoading(false);
  };

  /* FETCH CUSTOMERS */
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Build query params for service_type filter
        let queryParams = "";
        if (filter === "in_service" || filter === "out_service") {
          queryParams = `?service_type=${filter}`;
        }

        const res = await api.get(`/customers/${queryParams}`);
        setCustomers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [refreshTriggers.customers, filter]);

  /* FETCH PRODUCTS */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/');
        setProducts(res.data || []);
      } catch (err) {
        console.error("Fetch products failed", err);
      }
    };
    fetchProducts();
  }, []);

  /* FILTER + SEARCH */
  useEffect(() => {
    let data = [...customers];

    // Only show customers with status === 'online'
    data = data.filter(c => c.status === 'online');

    // For customer_type filters (handled client-side)
    // in_service and out_service are handled server-side, so skip client-side filtering
    if (filter !== "all" && filter !== "in_service" && filter !== "out_service") {
      data = data.filter(c => c.customer_type === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(c =>
        c.customer_name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.alternate_number?.includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.customer_id?.toLowerCase().includes(q)
      );
    }

    // Filter by customer type (our_customer / external_customer)
    if (customerTypeFilter !== "all") {
      data = data.filter(c => c.customer_type === customerTypeFilter);
    }

    setFilteredCustomers(data);
  }, [customers, filter, searchQuery, customerTypeFilter]);

  // Filter counts - service type counts come from server-filtered results
  const filterCounts = {
    all: customers.length,
    our_customer: customers.filter(c => c.customer_type === "our_customer").length,
    external_customer: customers.filter(c => c.customer_type === "external_customer").length,
    in_service: "-",
    out_service: "-",
  };

  // Handle edit customer
  const handleEditCustomer = (customer, e) => {
    e.stopPropagation(); // Prevent card click
    setEditingCustomer(customer);
    setEditFormData({
      customer_name: customer.customer_name || "",
      phone: customer.phone || "",
      alternate_number: customer.alternate_number || "",
      address: customer.address || "",
      customer_email: customer.customer_email || "",
      customer_type: customer.customer_type || "our_customer"
    });
    setGpsLocation(null);
    setGpsError("");
    setShowEditModal(true);
  };

  // Enhanced reverse geocoding function to convert GPS coordinates to detailed address (matching Booking.jsx)
  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Try multiple geocoding services as fallbacks
      const services = [
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`,
        `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`,
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      ];

      for (const serviceUrl of services) {
        try {
          const response = await fetch(serviceUrl, {
            headers: {
              'User-Agent': 'RubanElectricals/1.0'
            }
          });

          if (!response.ok) continue;

          const data = await response.json();

          if (data && data.address) {
            const address = data.address;

            // Build detailed address components
            const components = [];

            // Most specific to least specific
            if (address.house_number) components.push(address.house_number);
            if (address.road) components.push(address.road);
            if (address.neighbourhood) components.push(address.neighbourhood);
            if (address.suburb) components.push(address.suburb);
            if (address.city_district) components.push(address.city_district);
            if (address.city) components.push(address.city);
            if (address.town) components.push(address.town);
            if (address.village) components.push(address.village);
            if (address.state) components.push(address.state);
            if (address.postcode) components.push(address.postcode);
            if (address.country) components.push(address.country);

            // Remove duplicates and empty values
            const uniqueComponents = [];
            const seen = new Set();

            components.forEach(component => {
              if (component && component.trim() && !seen.has(component.toLowerCase())) {
                seen.add(component.toLowerCase());
                uniqueComponents.push(component);
              }
            });

            // Create detailed address
            let detailedAddress = uniqueComponents.join(', ');

            if (detailedAddress) {
              return detailedAddress;
            }
          }
        } catch (e) {
          console.error('Geocoding service error:', e);
          continue;
        }
      }

      // Fallback to coordinates if all services fail
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  // Capture GPS location for edit modal - automatically converts to address
  const captureLocation = async () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }

    setIsCapturingLocation(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLocation({ latitude, longitude });

        // Get address from coordinates - automatic conversion
        const address = await reverseGeocode(latitude, longitude);
        setEditFormData(prev => ({
          ...prev,
          address: address
        }));
        setIsCapturingLocation(false);
      },
      (error) => {
        console.error("GPS Error:", error);
        setIsCapturingLocation(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError("Location access denied. Please allow location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setGpsError("Location request timed out.");
            break;
          default:
            setGpsError("An unknown error occurred.");
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer, e) => {
    // Stop event propagation and prevent default to stop parent card click
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Delete button clicked for:", customer.customer_id);
    setDeletingCustomer(customer);
    setShowDeleteConfirm(true);
  };

  // Submit edit form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put("/customers/", {
        customer_id: editingCustomer.customer_id,
        ...editFormData
      });

      if (response.data.success) {
        // Update the customer in the list
        setCustomers(prev => prev.map(c =>
          c.customer_id === editingCustomer.customer_id
            ? { ...c, ...editFormData }
            : c
        ));
        setShowEditModal(false);
        setEditingCustomer(null);
        // Trigger global refresh
        triggerRefresh('customers');
      }
    } catch (error) {
      console.error("Edit failed:", error);
      alert("Failed to update customer");
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    console.log("Delete customer:", deletingCustomer?.customer_id);
    console.log("Full customer object:", deletingCustomer);

    if (!deletingCustomer || !deletingCustomer.customer_id) {
      alert("Error: Customer ID is missing");
      return;
    }

    try {
      const customerId = deletingCustomer.customer_id;
      const url = `/customers/?customer_id=${encodeURIComponent(customerId)}`;
      console.log("Delete URL:", url);

      const response = await api.delete(url);
      console.log("Delete response:", response);

      if (response.data.success) {
        // Remove the customer from the list
        setCustomers(prev => prev.filter(c => c.customer_id !== deletingCustomer.customer_id));
        setShowDeleteConfirm(false);
        setDeletingCustomer(null);
        // Trigger global refresh
        triggerRefresh('customers');
      }
    } catch (error) {
      console.error("Delete failed:", error);
      console.error("Error response:", error.response);
      // Handle both 400 errors (validation) and other errors
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Unknown error";
      alert("Failed to delete customer: " + errorMessage);
    }
  };

  // Handle add customer form change
  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({ ...prev, [name]: value }));
    setAddFormError("");
    setAddFormSuccess("");
  };

  // Handle new product field change
  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  // Add product to selected products list
  const addProduct = () => {
    if (!newProduct.productName || newProduct.quantity < 1) return;

    // Check if already added
    const exists = selectedProducts.find(p => p.productName === newProduct.productName);
    if (exists) {
      setAddFormError("This product is already added");
      return;
    }

    setSelectedProducts([...selectedProducts, { 
      ...newProduct, 
      quantity: parseInt(newProduct.quantity)
    }]);
    setNewProduct({ productName: "", quantity: 1 });
    setAddFormError("");
  };

  // Remove product from selected products list
  const removeProduct = (index) => {
    const updated = [...selectedProducts];
    updated.splice(index, 1);
    setSelectedProducts(updated);
  };

  // Calculate total quantity
  const calculateTotalQuantity = () => {
    return selectedProducts.reduce((total, prod) => total + prod.quantity, 0);
  };

  // Capture GPS location for add modal
  const captureAddLocation = async () => {
    if (!navigator.geolocation) {
      setAddGpsError("Geolocation is not supported by this browser.");
      return;
    }

    setAddIsCapturingLocation(true);
    setAddGpsError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setAddGpsLocation({ latitude, longitude });

        // Get address from coordinates - automatic conversion
        const address = await reverseGeocode(latitude, longitude);
        setAddFormData(prev => ({
          ...prev,
          address: address
        }));
        setAddIsCapturingLocation(false);
      },
      (error) => {
        console.error("GPS Error:", error);
        setAddIsCapturingLocation(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setAddGpsError("Location access denied. Please allow location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setAddGpsError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setAddGpsError("Location request timed out.");
            break;
          default:
            setAddGpsError("An unknown error occurred.");
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Submit add customer form
  const handleAddFormSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!addFormData.customer_name.trim()) {
      setAddFormError("Customer name is required");
      return;
    }
    if (!addFormData.phone.trim()) {
      setAddFormError("Phone number is required");
      return;
    }
    if (addFormData.phone.length < 10) {
      setAddFormError("Phone number must be at least 10 digits");
      return;
    }
    if (!addFormData.address.trim()) {
      setAddFormError("Address is required");
      return;
    }

    setAddFormLoading(true);
    setAddFormError("");
    setAddFormSuccess("");

    try {
      // Prepare product data - store as JSON if multiple products
      let productNameData = "";
      let productQuantityData = 0;
      
      if (selectedProducts.length > 0) {
        // Store all products as JSON string
        productNameData = JSON.stringify(selectedProducts);
        // Calculate total quantity
        productQuantityData = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
      }

      const response = await api.post("/customers/", {
        customer_name: addFormData.customer_name,
        customer_phone: addFormData.phone,
        alternate_number: addFormData.alternate_number || "",
        address: addFormData.address,
        customer_email: addFormData.customer_email || "",
        customer_type: addFormData.customer_type,
        status: "pending",
        product_name: productNameData,
        product_quantity: productQuantityData,
        job_type: addFormData.job_type || ""
      });

      if (response.data.success || response.data.customer_id) {
        setAddFormSuccess("Customer added successfully!");
        // Refresh customers list
        triggerRefresh('customers');
        // Close modal after short delay
        setTimeout(() => {
          setShowAddModal(false);
          setAddFormData({
            customer_name: "",
            phone: "",
            alternate_number: "",
            address: "",
            customer_email: "",
            customer_type: "our_customer",
            job_type: ""
          });
          setSelectedProducts([]);
          setNewProduct({ productName: "", quantity: 1 });
          setAddGpsLocation(null);
          setAddFormError("");
          setAddFormSuccess("");
        }, 1500);
      }
    } catch (error) {
      console.error("Add customer failed:", error);
      const errorMessage = error.response?.data?.error || "Failed to add customer";
      if (errorMessage.includes("phone")) {
        setAddFormError("This phone number is already registered. Please use a different number.");
      } else {
        setAddFormError(errorMessage);
      }
    } finally {
      setAddFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <FiUsers size={48} />
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="page-container customers-page">
      {/* HEADER */}
      <section className="page-section">
        <h1 className="section-title">Customer Management</h1>

        <div className="dashboard-controls">
          <div className="filter-group">
            {FILTER_OPTIONS.map(op => (
              <button
                key={op.value}
                className={`filter-button ${filter === op.value ? "active" : ""}`}
                onClick={() => {
                  if (op.value === "add_customer") {
                    navigate("/add-customer");
                  } else {
                    setFilter(op.value);
                  }
                }}
              >
                {op.icon}
                <span>{op.label}</span>
                {op.value !== "add_customer" && (
                  <span className="filter-count">{filterCounts[op.value]}</span>
                )}
              </button>
            ))}
          </div>

          <div className="search-bar">
            <FiSearch />
            <input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="customer-type-filter"
            value={customerTypeFilter}
            onChange={e => setCustomerTypeFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none',
              marginLeft: '10px',
              height: '38px'
            }}
          >
            <option value="all" style={{color: '#333'}}>All Types</option>
            <option value="our_customer" style={{color: '#333'}}>Our Customers</option>
            <option value="external_customer" style={{color: '#333'}}>External Customers</option>
          </select>

          <button
            className="add-customer-header-btn"
            onClick={() => setShowAddModal(true)}
            title="Add New Customer"
          >
            <FiPlus />
            Add Customer
          </button>
        </div>
      </section>

      {/* CUSTOMER LIST */}
      <section className="page-section">
        <div className="customers-list">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => (
              <div
                key={customer.customer_id}
                className="customer-card"
                onClick={() =>
                  navigate("/customerhistory", { state: { customer } })
                }
              >
                <div className="card-header">
                  <h3 className="card-title">{customer.customer_name}</h3>
                  <div className="card-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={(e) => handleEditCustomer(customer, e)}
                      title="Edit Customer"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => handleDeleteCustomer(customer, e)}
                      title="Delete Customer"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  <span className={`status-badge ${customer.customer_type === 'our_customer' ? 'Our_customer' : 'External_customer'}`}>
                    {customer.customer_type === 'our_customer' ? 'Our Customer' : 'External Customer'}
                  </span>
                </div>

                <div className="card-content">
                  <InfoRow icon={<FiPhone />} label="Phone" value={customer.phone} />
                  {customer.alternate_number && (
                    <InfoRow icon={<FiPhone />} label="Alternate" value={customer.alternate_number} />
                  )}
                  <InfoRow
                    icon={<FiMapPin />}
                    label="Address"
                    value={customer.address}
                    onLocationClick={(e) => handleLocationClick(customer, e)}
                  />
                </div>

                <button className="action-button">
                  View History <FiArrowRight />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FiUsers size={48} />
              <p>No customers found</p>
            </div>
          )}
        </div>
      </section>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-icon-badge">
                  <FiEdit />
                </div>
                <div>
                  <h2>Edit Customer</h2>
                  <p className="modal-subtitle">Update existing customer information</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-body">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={editFormData.customer_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Alternate Number</label>
                <input
                  type="text"
                  value={editFormData.alternate_number}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, alternate_number: e.target.value }))}
                  placeholder="Optional alternate phone number"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <div className="input-with-button">
                  <textarea
                    value={editFormData.address}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                    rows="3"
                    placeholder="Enter address or click GPS button"
                  />
                  <button
                    type="button"
                    className="gps-action-button"
                    onClick={captureLocation}
                    disabled={isCapturingLocation}
                    title="Capture GPS Location"
                  >
                    {isCapturingLocation ? (
                      <FiLoader className="spinner" />
                    ) : (
                      <FiNavigation />
                    )}
                  </button>
                </div>
                {gpsError && (
                  <small className="gps-error" style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>
                    {gpsError}
                  </small>
                )}
                {gpsLocation && !gpsError && (
                  <small className="gps-coords" style={{ color: '#28a745', display: 'block', marginTop: '5px' }}>
                    ✓ GPS: {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editFormData.customer_email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Customer Type</label>
                <select
                  value={editFormData.customer_type}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, customer_type: e.target.value }))}
                >
                  <option value="our_customer">Our Customer</option>
                  <option value="external_customer">External Customer</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiAlertTriangle style={{ marginRight: '0.5rem', color: '#e53e3e' }} />
                Confirm Delete
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete customer <strong>{deletingCustomer?.customer_name}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteConfirm}
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION MODAL */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal-content location-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiNavigation style={{ marginRight: '0.5rem' }} />
                Location Map
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowLocationModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {locationError && (
                <div className="error-message">
                  <p>{locationError}</p>
                </div>
              )}
              {locationLoading ? (
                <div className="loading-map">
                  <FiLoader style={{ animation: 'spin 1s linear infinite' }} />
                  <p>Loading map...</p>
                </div>
              ) : (
                <>
                  <div className="customer-info">
                    <h3>{locationCustomer?.customer_name}</h3>
                    <p><strong>Address:</strong> {locationCustomer?.address}</p>
                  </div>
                  <div className="map-actions">
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary map-link"
                    >
                      Open in Google Maps
                    </a>
                    <button
                      onClick={() => {
                        // Create a route from current location to customer address
                        const currentLocationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationCustomer.address)}`;
                        window.open(currentLocationUrl, '_blank');
                      }}
                      className="btn-secondary route-btn"
                    >
                      Get Directions
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content add-customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-icon-badge">
                  <FiUserPlus />
                </div>
                <div>
                  <h2>Add New Customer</h2>
                  <p className="modal-subtitle">Register a new customer to your database</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowAddModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleAddFormSubmit} className="modal-body">
              {addFormError && (
                <div className="alert alert-error" style={{ marginBottom: '15px' }}>
                  {addFormError}
                </div>
              )}
              {addFormSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '15px' }}>
                  {addFormSuccess}
                </div>
              )}
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={addFormData.customer_name}
                  onChange={handleAddFormChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="text"
                  name="phone"
                  value={addFormData.phone}
                  onChange={handleAddFormChange}
                  placeholder="Enter 10-digit phone number"
                  required
                  maxLength="15"
                />
              </div>
              <div className="form-group">
                <label>Alternate Number</label>
                <input
                  type="text"
                  name="alternate_number"
                  value={addFormData.alternate_number}
                  onChange={handleAddFormChange}
                  placeholder="Optional alternate phone number"
                />
              </div>
              <div className="form-group">
                <label>Address *</label>
                <div className="input-with-button">
                  <textarea
                    name="address"
                    value={addFormData.address}
                    onChange={handleAddFormChange}
                    rows="3"
                    placeholder="Enter address or click GPS button"
                    required
                  />
                  <button
                    type="button"
                    className="gps-action-button"
                    onClick={captureAddLocation}
                    disabled={addIsCapturingLocation}
                    title="Capture GPS Location"
                  >
                    {addIsCapturingLocation ? (
                      <FiLoader className="spinner" />
                    ) : (
                      <FiNavigation />
                    )}
                  </button>
                </div>
                {addGpsError && (
                  <small className="gps-error" style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>
                    {addGpsError}
                  </small>
                )}
                {addGpsLocation && !addGpsError && (
                  <small className="gps-coords" style={{ color: '#28a745', display: 'block', marginTop: '5px' }}>
                    ✓ GPS: {addGpsLocation.latitude.toFixed(6)}, {addGpsLocation.longitude.toFixed(6)}
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="customer_email"
                  value={addFormData.customer_email}
                  onChange={handleAddFormChange}
                  placeholder="Enter email address (optional)"
                />
              </div>
              <div className="form-group">
                <label>Customer Type</label>
                <select
                  name="customer_type"
                  value={addFormData.customer_type}
                  onChange={handleAddFormChange}
                >
                  <option value="our_customer">Our Customer</option>
                  <option value="external_customer">External Customer</option>
                </select>
              </div>
              {/* Multi-Product Selection (like Booking page) */}
              <div className="form-group">
                <label>Products <span className="optional">(Optional - Select multiple)</span></label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <select
                    name="productName"
                    value={newProduct.productName}
                    onChange={handleNewProductChange}
                    style={{ flex: 2 }}
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.product_name}>
                        {product.product_name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="quantity"
                    value={newProduct.quantity}
                    onChange={handleNewProductChange}
                    min="1"
                    placeholder="Qty"
                    style={{ flex: 1, width: '70px' }}
                  />
                  <button
                    type="button"
                    onClick={addProduct}
                    disabled={!newProduct.productName}
                    style={{ 
                      flex: 1,
                      padding: '8px 12px',
                      background: newProduct.productName ? '#28a745' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: newProduct.productName ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Add
                  </button>
                </div>
                {/* Selected Products List */}
                {selectedProducts.length > 0 && (
                  <div className="selected-products-container">
                    {selectedProducts.map((prod, index) => (
                      <div key={index} className="product-item">
                        <span>
                          <strong>{prod.productName}</strong> × {prod.quantity}
                        </span>
                        <button
                          type="button"
                          className="product-remove-btn"
                          onClick={() => removeProduct(index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div style={{ 
                      marginTop: '1rem', 
                      paddingTop: '0.75rem', 
                      borderTop: '1px solid #e2daff',
                      fontWeight: '800',
                      color: '#7c5cbf',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>Total Items</span>
                      <span>{calculateTotalQuantity()}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Job Type <span className="optional">(Optional)</span></label>
                <select
                  name="job_type"
                  value={addFormData.job_type}
                  onChange={handleAddFormChange}
                >
                  <option value="">Select job type</option>
                  <option value="motor_sale">Motor Sale</option>
                  <option value="motor_service">Motor Service</option>
                  <option value="general_service">General Service</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={addFormLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={addFormLoading}
                >
                  {addFormLoading ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
