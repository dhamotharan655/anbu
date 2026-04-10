import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { FiMapPin, FiNavigation, FiUserPlus, FiArrowLeft, FiSave, FiLoader } from "react-icons/fi";
import { useGlobalRefresh } from "../../context/GlobalRefreshContext";
import "./Customers.css";

const AddCustomer = () => {
  const navigate = useNavigate();
  const { triggerRefresh } = useGlobalRefresh();

  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    alternate_number: "",
    address: "",
    customer_email: "",
    customer_type: "our_customer",
    product_name: "",
    product_quantity: 1,
    product_discount_percent: 0,
    job_type: "",
    remarks: "",
    next_service_date: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [products, setProducts] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // GPS Location state
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('products/');
        setProducts(response.data);
        setStockItems(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
    setSuccess("");

    // Clear phone-specific error when user starts typing
    if (name === "phone") {
      setPhoneError("");
    }
  };

  // Update selected product when product_name changes
  useEffect(() => {
    if (formData.product_name) {
      // Use stockItems which has complete price data from the API
      const product = stockItems.find(p => p.product_name === formData.product_name);
      setSelectedProduct(product);
    } else {
      setSelectedProduct(null);
    }
  }, [formData.product_name, stockItems]);

  const handlePhoneBlur = async () => {
    const phone = formData.phone.trim();

    // Only check if phone is valid format and not empty
    if (phone && /^[0-9]{10}$/.test(phone)) {
      setPhoneChecking(true);
      setPhoneError("");

      try {
        const exists = await checkPhoneExists(phone);
        if (exists) {
          setPhoneError("This phone number is already registered to another customer");
        }
      } catch (error) {
        console.error("Error checking phone:", error);
        // Don't show error for API failures, let backend handle it
      } finally {
        setPhoneChecking(false);
      }
    }
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) {
      setError("Customer name is required");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (formData.phone.length < 10) {
      setError("Phone number must be at least 10 digits");
      return false;
    }
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError("Phone number must contain only digits (10 characters)");
      return false;
    }
    if (!formData.address.trim()) {
      setError("Address is required");
      return false;
    }
    if (formData.customer_email && !/\S+@\S+\.\S+/.test(formData.customer_email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  // Reverse geocoding function to convert GPS coordinates to address
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const services = [
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`,
        `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`,
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      ];

      for (const serviceUrl of services) {
        try {
          const response = await fetch(serviceUrl, {
            headers: { 'User-Agent': 'RubanElectricals/1.0' }
          });
          
          if (!response.ok) continue;
          
          const data = await response.json();
          
          if (data && data.address) {
            const address = data.address;
            const components = [];
            
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
            
            const uniqueComponents = [];
            const seen = new Set();
            
            components.forEach(component => {
              if (component && component.trim() && !seen.has(component.toLowerCase())) {
                seen.add(component.toLowerCase());
                uniqueComponents.push(component);
              }
            });
            
            let detailedAddress = uniqueComponents.join(', ');
            
            if (detailedAddress) {
              return {
                fullAddress: detailedAddress,
                latitude,
                longitude
              };
            }
          }
        } catch (e) {
          console.error('Geocoding service error:', e);
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  // Capture GPS location and convert to address automatically
  const captureLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsCapturingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationData = { latitude, longitude };
        setGpsLocation(locationData);
        
        // Convert GPS coordinates to address
        const addressFromGPS = await reverseGeocode(latitude, longitude);
        
        if (addressFromGPS && addressFromGPS.fullAddress) {
          setFormData(prev => ({ ...prev, address: addressFromGPS.fullAddress }));
          setLocationError("");
        } else {
          setFormData(prev => ({ ...prev, address: `GPS Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
          setLocationError("Unable to convert GPS to address. Please enter address manually.");
        }
        
        setIsCapturingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsCapturingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please allow location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const checkPhoneExists = async (phone) => {
    try {
      const response = await api.get(`/customer-by-phone/?phone=${phone}`);
      return response.data.found;
    } catch (error) {
      // If customer not found (404), it's available
      if (error.response && error.response.status === 404) {
        return false;
      }
      // For other errors, assume it's available to not block the form
      console.error("Error checking phone number:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    // Prepare data for BookService serializer
    const serviceData = {
      customer_name: formData.customer_name,
      customer_phone: formData.phone, // Map phone to customer_phone
      alternate_number: formData.alternate_number || "",
      address: formData.address,
      customer_email: formData.customer_email || "",
      customer_type: formData.customer_type,
      product_name: formData.product_name || "",
      product_quantity: formData.product_quantity || 1,
      product_discount_percent: formData.product_discount_percent || 0,
      job_type: formData.job_type || "",
      remarks: formData.remarks || "",
      next_service_date: formData.next_service_date || null,
      complaint_details: "", // Empty since this is just customer addition
      status: "pending",
      is_initial: true // Mark as initial record
    };

    try {
      await api.post("/customers/", serviceData);
      setSuccess("Customer added successfully!");
      // Trigger global refresh for customers list
      triggerRefresh('customers');
      setTimeout(() => {
        navigate("/customers");
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to add customer";
      if (errorMessage.includes("phone")) {
        setError("This phone number is already registered. Please use a different number.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/customers");
  };

  return (
    <div className="add-customer-page-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Add New Customer</h1>
          <p className="page-subtitle">Register a new customer to your database</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleCancel}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FiArrowLeft /> Back to Customers
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}

      {/* Form Card */}
      <div className="modern-form-card">
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon-badge">
              <FiUserPlus />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#1e1b2e', margin: 0 }}>Customer Information</h2>
              <p className="modal-subtitle">Fill in all required fields marked with *</p>
            </div>
          </div>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Customer Name */}
            <div className="form-group">
              <label>Customer Name *</label>
              <input
                id="customer_name"
                name="customer_name"
                type="text"
                placeholder="Enter full name"
                value={formData.customer_name}
                onChange={handleChange}
                required
                maxLength="100"
              />
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={phoneError ? 'error' : ''}
                placeholder="Enter 10-digit phone number"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handlePhoneBlur}
                required
                maxLength="15"
                pattern="[0-9]{10,15}"
              />
              {phoneChecking && (
                <div className="field-status checking" style={{ fontSize: '11px', marginTop: '4px' }}>
                  <FiLoader className="spinner" /> Checking...
                </div>
              )}
            </div>

            {/* Alternate Number */}
            <div className="form-group">
              <label>Alternate Number</label>
              <input
                id="alternate_number"
                name="alternate_number"
                type="tel"
                placeholder="Optional alternate phone number"
                value={formData.alternate_number}
                onChange={handleChange}
                maxLength="15"
                pattern="[0-9]{10,15}"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email Address</label>
              <input
                id="customer_email"
                name="customer_email"
                type="email"
                placeholder="Enter email address"
                value={formData.customer_email}
                onChange={handleChange}
                maxLength="100"
              />
            </div>

            {/* Customer Type */}
            <div className="form-group">
              <label>Customer Type *</label>
              <select
                id="customer_type"
                name="customer_type"
                value={formData.customer_type}
                onChange={handleChange}
                required
              >
                <option value="our_customer">Our Customer</option>
                <option value="external_customer">External Customer</option>
              </select>
            </div>

            {/* Product */}
            <div className="form-group">
              <label>Product</label>
              <select
                id="product_name"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.product_name}>
                    {product.product_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Quantity */}
            <div className="form-group">
              <label>Quantity</label>
              <input
                id="product_quantity"
                name="product_quantity"
                type="number"
                placeholder="Enter quantity"
                value={formData.product_quantity}
                onChange={handleChange}
                min="1"
              />
            </div>

            {/* Product Discount */}
            {formData.product_name && selectedProduct && (
              <div className="form-group">
                <label>Discount %</label>
                <input
                  id="product_discount_percent"
                  name="product_discount_percent"
                  type="number"
                  placeholder="Enter discount %"
                  value={formData.product_discount_percent}
                  onChange={handleChange}
                  min="0"
                  max="100"
                />
                {selectedProduct.selling_price > 0 && (
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    <span>Selling Price: ₹{selectedProduct.selling_price}</span>
                    {formData.product_discount_percent > 0 && (
                      <span style={{ marginLeft: '10px', color: '#f59e0b' }}>
                        - {formData.product_discount_percent}% = ₹{(selectedProduct.selling_price * (1 - formData.product_discount_percent / 100)).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Job Type */}
            <div className="form-group">
              <label>Job Type</label>
              <select
                id="job_type"
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
              >
                <option value="">Select job type...</option>
                <option value="motor_sale">Motor Sale</option>
                <option value="motor_service">Motor Service</option>
                <option value="general_service">General Service</option>
              </select>
            </div>
          </div>

          {/* Product Features Box */}
          {selectedProduct && (
            <div className="feature-box">
              <h3>Product Features</h3>
              <p>{selectedProduct.description || "No description available for this product."}</p>

              {/* Remarks Field - Show when product is selected */}
              <div className="form-group" style={{ marginTop: "20px" }}>
                <label className="form-label" htmlFor="remarks">
                  Remarks <span className="optional">(Optional)</span>
                </label>
                <textarea
                  id="remarks"
                  name="remarks"
                  className="form-textarea"
                  placeholder="Enter any additional remarks or notes about the customer"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="3"
                  maxLength="500"
                />
              </div>
            </div>
          )}

          {/* Address - Full Width */}
          <div className="form-group">
            <label className="form-label" htmlFor="address">
              Address <span className="required">*</span>
            </label>
            <div className="input-with-button">
              <textarea
                id="address"
                name="address"
                placeholder="Enter complete address or click GPS button"
                value={formData.address}
                onChange={handleChange}
                required
                rows="3"
                maxLength="500"
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
            {locationError && (
              <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                {locationError}
              </span>
            )}
            {gpsLocation && !locationError && (
              <span style={{ color: '#28a745', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                ✓ GPS Location captured: {gpsLocation.latitude.toFixed(4)}, {gpsLocation.longitude.toFixed(4)}
              </span>
            )}
          </div>

          {/* Next Service Date */}
          <div className="form-group">
            <label>Next Service Date</label>
            <input
              id="next_service_date"
              name="next_service_date"
              type="date"
              value={formData.next_service_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </div>

        {/* Form Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
          >
            {loading ? <FiLoader className="spinner" /> : <FiSave />}
            {loading ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  </div>
);
};

export default AddCustomer;
