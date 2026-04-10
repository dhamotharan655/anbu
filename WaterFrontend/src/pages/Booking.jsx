import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { API_BASE_URL } from "../config";
import {
  FiFileText,
  FiHash,
  FiUser,
  FiMail,
  FiList,
  FiCpu,
  FiPhone,
  FiMapPin,
  FiAlertCircle,
  FiSend,
  FiCheck,
  FiUserCheck,
  FiDollarSign,
  FiMessageSquare,
  FiCalendar,
  FiClock,
  FiImage,
  FiX,
  FiLoader,
  FiMessageCircle
} from "react-icons/fi"; // Import Feather icons
import { openWhatsAppWithDefaultMessage, generateBookingMessage, normalizePhoneNumber, generateWhatsAppLink } from "../utils/whatsappUtils";
import "../utils/whatsappUtils.css";
import { useLocation } from "react-router-dom";
import { useScrollToRef } from "../hooks/useScrollToRef";

// Helper function to format product names from JSON to readable format
const formatProductNames = (productNameField) => {
  if (!productNameField) return 'No Data';

  try {
    // Try parsing as JSON first (new format for multiple products)
    const parsed = JSON.parse(productNameField);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(p => {
        const name = p.productName || p.name || p.product_name;
        const qty = p.quantity || p.qty || 1;
        return qty > 1 ? `${name} (x${qty})` : name;
      }).join(', ');
    }
    // If it's an object, return as single-item
    if (typeof parsed === 'object') {
      const name = parsed.productName || parsed.name || parsed.product_name;
      const qty = parsed.quantity || parsed.qty || 1;
      return qty > 1 ? `${name} (x${qty})` : name;
    }
    return productNameField;
  } catch (e) {
    // If JSON parsing fails, it's a legacy string format
    return productNameField;
  }
};

// New Booking UI Styles
const bookingStyles = `
  .booking-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0e6ff 0%, #dceeff 40%, #ffe6f0 100%);
    position: relative;
    overflow-x: hidden;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .booking-blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(70px);
    pointer-events: none;
    opacity: 0.42;
    animation: blobFloat 10s ease-in-out infinite;
    z-index: 0;
  }

  .booking-blob1 { width: 500px; height: 500px; background: radial-gradient(circle, #c9a8ff, #a8d4ff); top: -150px; left: -100px; }
  .booking-blob2 { width: 400px; height: 400px; background: radial-gradient(circle, #ffd6ec, #ffecb3); bottom: -100px; right: -80px; animation-delay: -5s; }
  .booking-blob3 { width: 260px; height: 260px; background: radial-gradient(circle, #b3f0e0, #b3d9ff); top: 50%; right: 10%; animation-delay: -3s; }

  @keyframes blobFloat {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(20px,-25px) scale(1.03); }
    66% { transform: translate(-15px,18px) scale(0.97); }
  }

  .booking-page {
    max-width: 760px;
    margin: 0 auto;
    padding: 40px 24px 80px;
    position: relative;
    z-index: 1;
    animation: pageRise 0.7s cubic-bezier(0.16,1,0.3,1) both;
  }

  @keyframes pageRise { 
    from { opacity:0; transform:translateY(28px); } 
    to { opacity:1; transform:translateY(0); } 
  }

  .booking-hero-banner {
    border-radius: 24px;
    background: linear-gradient(135deg, #9b6fe8 0%, #6baee0 100%);
    padding: 32px 40px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(124,92,191,0.28);
  }

  .booking-hero-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='35' stroke='rgba(255,255,255,0.07)' stroke-width='1' fill='none'/%3E%3Ccircle cx='40' cy='40' r='20' stroke='rgba(255,255,255,0.05)' stroke-width='1' fill='none'/%3E%3C/svg%3E") repeat;
  }

  .booking-hero-banner::after {
    content: '';
    position: absolute;
    right: -60px;
    top: -60px;
    width: 250px;
    height: 250px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
  }

  .booking-hero-content {
    position: relative;
    z-index: 1;
  }

  .booking-hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.3);
    padding: 4px 14px;
    border-radius: 100px;
    font-size: 11px;
    color: rgba(255,255,255,0.9);
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .booking-hero-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
    animation: dp 2s ease-in-out infinite;
  }

  @keyframes dp { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(1.4);} }

  .booking-hero-title {
    font-family: 'Fraunces', serif;
    font-size: 30px;
    font-weight: 600;
    color: white;
    margin-bottom: 6px;
  }

  .booking-hero-title em { font-style: italic; opacity: 0.85; }
  .booking-hero-sub { font-size: 14px; color: rgba(255,255,255,0.72); }

  .booking-form-card {
    background: rgba(255,255,255,0.76);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.88);
    border-radius: 28px;
    box-shadow: 0 8px 40px rgba(124,92,191,0.13);
    overflow: hidden;
  }

  .booking-form-section {
    padding: 28px 32px;
    border-bottom: 1px solid rgba(124,92,191,0.07);
  }

  .booking-form-section:last-child { border-bottom: none; }

  .booking-section-label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 22px;
  }

  .booking-section-icon {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    flex-shrink: 0;
  }

  .booking-si-purple { background: linear-gradient(135deg, #e8d5ff, #d5c0ff); }
  .booking-si-blue { background: linear-gradient(135deg, #d5e8ff, #c0d5ff); }
  .booking-si-pink { background: linear-gradient(135deg, #ffd5e8, #ffc0d5); }

  .booking-section-title-text {
    font-family: 'Fraunces', serif;
    font-size: 17px;
    font-weight: 600;
    color: #1e1b2e;
  }

  .booking-section-subtitle {
    font-size: 12px;
    color: #8b85a1;
    margin-top: 1px;
  }

  .booking-fields-grid {
    display: grid;
    gap: 18px;
  }

  .booking-fields-grid.two-col {
    grid-template-columns: 1fr 1fr;
  }

  .booking-field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .booking-field label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #8b85a1;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .booking-required-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: linear-gradient(135deg, #9b6fe8, #6baee0);
    display: inline-block;
  }

  .booking-optional-tag {
    font-size: 10px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
    color: #b0a8c8;
    background: rgba(124,92,191,0.06);
    padding: 1px 7px;
    border-radius: 100px;
  }

  .booking-input-wrap { position: relative; }

  .booking-input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #b8aed8;
    pointer-events: none;
    transition: color 0.3s;
  }

  .booking-input-wrap:focus-within .booking-input-icon {
    color: #7c5cbf;
  }

  .booking-input, .booking-select, .booking-textarea {
    width: 100%;
    background: rgba(255,255,255,0.88);
    border: 1.5px solid rgba(180,160,220,0.2);
    border-radius: 14px;
    padding: 13px 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    color: #1e1b2e;
    outline: none;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(124,92,191,0.05);
    appearance: none;
    -webkit-appearance: none;
  }

  .booking-input.no-icon, .booking-select.no-icon, .booking-textarea.no-icon {
    padding-left: 16px;
  }

  .booking-input::placeholder, .booking-textarea::placeholder {
    color: #c0b8d8;
  }

  .booking-input:focus, .booking-select:focus, .booking-textarea:focus {
    border-color: rgba(124,92,191,0.45);
    background: #fff;
    box-shadow: 0 0 0 4px rgba(124,92,191,0.08), 0 2px 8px rgba(124,92,191,0.08);
  }

  .booking-phone-wrap { display: flex; gap: 10px; }

  .booking-phone-prefix {
    background: rgba(255,255,255,0.88);
    border: 1.5px solid rgba(180,160,220,0.2);
    border-radius: 14px;
    padding: 13px 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #1e1b2e;
    min-width: 70px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(124,92,191,0.05);
    flex-shrink: 0;
  }

  .booking-select-wrap { position: relative; }

  .booking-select-wrap::after {
    content: '';
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid #b8aed8;
    pointer-events: none;
    transition: border-color 0.3s;
  }

  .booking-select-wrap:focus-within::after {
    border-top-color: #7c5cbf;
  }

  .booking-select-wrap select {
    padding-right: 40px;
    cursor: pointer;
  }

  .booking-textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.6;
    padding-left: 16px;
  }

  .booking-file-upload-area {
    border: 2px dashed rgba(124,92,191,0.22);
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    background: rgba(124,92,191,0.03);
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .booking-file-upload-area:hover {
    border-color: rgba(124,92,191,0.45);
    background: rgba(124,92,191,0.06);
  }

  .booking-file-upload-area input[type="file"] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    box-shadow: none;
  }

  .booking-file-icon { font-size: 28px; margin-bottom: 8px; }
  .booking-file-label { font-size: 14px; font-weight: 600; color: #7c5cbf; margin-bottom: 3px; }
  .booking-file-hint { font-size: 12px; color: #8b85a1; }

  .booking-btn-gps {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 13px 20px;
    border-radius: 14px;
    border: 1.5px solid rgba(124,92,191,0.22);
    background: rgba(124,92,191,0.05);
    color: #7c5cbf;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .booking-btn-gps::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(155,111,232,0.08), rgba(107,174,224,0.08));
    opacity: 0;
    transition: opacity 0.3s;
  }

  .booking-btn-gps:hover {
    border-color: rgba(124,92,191,0.45);
    background: rgba(124,92,191,0.08);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(124,92,191,0.15);
  }

  .booking-btn-gps:hover::before { opacity: 1; }

  .booking-btn-gps svg { animation: gpsPulse 2s ease-in-out infinite; }

  @keyframes gpsPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.2);} }

  .booking-form-footer { padding: 24px 32px 32px; }

  .booking-btn-submit {
    width: 100%;
    padding: 16px 24px;
    border-radius: 18px;
    border: none;
    background: linear-gradient(135deg, #9b6fe8 0%, #6baee0 100%);
    color: white;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 8px 28px rgba(124,92,191,0.3);
    position: relative;
    overflow: hidden;
    transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
    letter-spacing: 0.2px;
  }

  .booking-btn-submit::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    transition: left 0.55s ease;
    transform: skewX(-20deg);
  }

  .booking-btn-submit:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 48px rgba(124,92,191,0.38);
  }

  .booking-btn-submit:hover::before { left: 160%; }

  .booking-btn-submit:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 4px 16px rgba(124,92,191,0.2);
  }

  .booking-btn-submit .arrow { transition: transform 0.3s; }
  .booking-btn-submit:hover .arrow { transform: translateX(5px); }

  @media (max-width: 640px) {
    .booking-fields-grid.two-col { grid-template-columns: 1fr; }
    .booking-form-section { padding: 22px 20px; }
    .booking-form-footer { padding: 20px 20px 28px; }
    .booking-hero-banner { padding: 24px 24px; }
    .booking-page { padding: 24px 12px 60px; }
  }
`;

// Define COLORS and SIZES
const COLORS = {
  background: "transparent",
  header: "#9b6fe8",
  panel: "rgba(155,111,232,0.08)",
  surface: "rgba(255,255,255,0.62)",
  primary: "#7c5cbf",
  accent: "#9b6fe8",
  success: "#2d9e6b",
  danger: "#eb5968",
  textPrimary: "#1e1b2e",
  textSecondary: "#8b85a1",
  muted: "#b0a8c8",
  border: "rgba(124,92,191,0.12)",
  white: "#ffffff",
};

const SIZES = {
  radius: 16,
  padding: 20,
  h1: 30,
  h2: 22,
  h3: 18,
  body: 14,
};

const Booking = () => {
  const location = useLocation();
  const reminderData = location.state;
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [productName, setProductName] = useState("");
  const [phone, setPhone] = useState("+91");
  const [phoneError, setPhoneError] = useState("");
  const [alternateNumber, setAlternateNumber] = useState("");
  const [alternateNumberError, setAlternateNumberError] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientIdError, setClientIdError] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [remarks, setRemarks] = useState("");
  const [formError, setFormError] = useState("");

  // ⭐ ADDED STATE
  const [customerType, setCustomerType] = useState("our_customer");

  // Service type: in_service (at customer location) or out_service (at service center)
  const [serviceType, setServiceType] = useState("in_service");

  // ⭐ NEW: Job Category - Normal Service, Motor Service, or Motor Sale
  const [jobCategory, setJobCategory] = useState("");

  // Phone verification states
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [customerFound, setCustomerFound] = useState(null); // null, true, or false

  // Client ID verification states
  const [isVerifyingClientId, setIsVerifyingClientId] = useState(false);
  const [clientIdFound, setClientIdFound] = useState(null); // null, true, or false

  // Alternate number verification states
  const [isVerifyingAlternateNumber, setIsVerifyingAlternateNumber] = useState(false);
  const [alternateNumberFound, setAlternateNumberFound] = useState(null); // null, true, or false

  // Booking details state
  const [bookingData, setBookingData] = useState(null);
  const [previousBookings, setPreviousBookings] = useState([]);

  // Warranty state
  const [warrantyPhoto, setWarrantyPhoto] = useState(null);
  const [warrantyDate, setWarrantyDate] = useState("");

  // Warranty image modal state
  const [warrantyModal, setWarrantyModal] = useState({ show: false, imageUrl: "", date: "" });
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);

  // Multi-product selection state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    productName: "",
    quantity: 1,
    discount_percent: 0,
    motor_brand: "",
    serial_no: ""
  });
  const [motorBrands, setMotorBrands] = useState([]);

  // Fetch stock items for multi-product selection
  const [stockItems, setStockItems] = useState([]);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", isError: false });

  // Validation warnings
  const [productNotAddedWarning, setProductNotAddedWarning] = useState(false);
  const [jobTypeError, setJobTypeError] = useState("");

  // Booking Success Modal state
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [showBookingSuccessModal, setShowBookingSuccessModal] = useState(false);

  /* --- Scroll Refs for Modals --- */
  const bookingSuccessModalRef = useScrollToRef(showBookingSuccessModal);
  const warrantyModalRef = useScrollToRef(warrantyModal.show);

  // Calculate discounted price - prevents loss (price cannot go below buying price or minimum price)
  const calculateFinalPrice = (sellingPrice, buyingPrice, discountPercent, minimumPrice = 0) => {
    if (!discountPercent || discountPercent <= 0) {
      return sellingPrice;
    }

    const discountedPrice = sellingPrice - (sellingPrice * discountPercent / 100);

    // Check minimum price first if set
    if (minimumPrice > 0 && discountedPrice < minimumPrice) {
      return null; // Indicates discount is too high (below minimum price)
    }

    // Ensure final price doesn't go below buying price
    if (discountedPrice < buyingPrice) {
      return null; // Indicates discount is too high
    }

    return parseFloat(discountedPrice.toFixed(2));
  };

  // Get maximum allowed discount for a product
  const getMaxDiscount = (sellingPrice, buyingPrice, minimumPrice = 0) => {
    if (!sellingPrice || sellingPrice <= 0) {
      return 0;
    }
    // Calculate based on minimum price if set
    if (minimumPrice > 0 && sellingPrice > minimumPrice) {
      return Math.floor(((sellingPrice - minimumPrice) / sellingPrice) * 100);
    }
    // Otherwise use buying price
    if (!buyingPrice || sellingPrice <= buyingPrice) {
      return 0;
    }
    return Math.floor(((sellingPrice - buyingPrice) / sellingPrice) * 100);
  };

  // Get minimum price for a product
  const getMinimumPrice = (productName, brandName = null) => {
    if (brandName) {
      const brandDetails = getMotorBrandDetails(productName, brandName);
      if (brandDetails) return brandDetails.minimum_price || 0;
    }
    const item = getStockItem(productName);
    return item?.minimum_price || 0;
  };

  // Get motor brands from stock items (Enhanced to return objects with IDs)
  const getMotorBrands = (productName) => {
    const item = getStockItem(productName);
    if (!item) return [];

    if (item.motor_brands && Array.isArray(item.motor_brands)) {
      // Return objects containing both name and id
      return item.motor_brands.map(brandObj => ({
        name: brandObj.brand_name || brandObj.brand,
        id: brandObj.id || brandObj.uid || brandObj._id
      })).filter(b => b.name);
    }

    // Fallback for old data format
    if (item.motor_brand) {
      if (typeof item.motor_brand === 'string') {
        return [{ name: item.motor_brand, id: null }];
      }
      if (Array.isArray(item.motor_brand)) {
        return item.motor_brand.map(b => ({ name: b, id: null }));
      }
    }
    return [];
  };

  // Get motor brand details (for auto-filling prices)
  const getMotorBrandDetails = (productName, brandName) => {
    const item = getStockItem(productName);
    if (!item || !item.motor_brands || !Array.isArray(item.motor_brands)) return null;

    return item.motor_brands.find(
      brandObj => (brandObj.brand_name || brandObj.brand) === brandName
    ) || null;
  };

  // Check if product is a motor
  const isMotorProduct = (prodName) => {
    if (!prodName) return false;
    const name = prodName.toLowerCase();
    // Use name-based detection to be safe
    const isMotor = name.includes('motor') || name.includes('winding') || name.includes('rewinding');
    if (isMotor) return true;

    // Check stock record as fallback
    const item = getStockItem(prodName);
    return item && item.is_motor === true;
  };



  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('products/');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  // Update selected product when productName changes
  useEffect(() => {
    if (productName) {
      const product = products.find(p => p.product_name === productName);
      setSelectedProduct(product);

      // Fetch stock information for the selected product
      fetchStockInfo(productName);
    } else {
      setSelectedProduct(null);
      setStockInfo(null);
    }
  }, [productName, products]);

  // Fetch stock information for a product
  const fetchStockInfo = async (productName) => {
    try {
      const response = await api.get('stocks/');
      const stockItems = response.data;

      // Find stock item by product name
      const stockItem = stockItems.find(item => item.name === productName);

      if (stockItem) {
        setStockInfo({
          quantity: stockItem.quantity,
          status: stockItem.status,
          unit: stockItem.unit,
          minimumThreshold: stockItem.minimum_threshold
        });
      } else {
        setStockInfo({
          quantity: 0,
          status: "Not Found",
          unit: "pcs",
          minimumThreshold: 0
        });
      }
    } catch (error) {
      console.error("Error fetching stock information:", error);
      setStockInfo(null);
    }
  };


  // Show toast notification
  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: "", isError: false }), 3500);
  };

  // Handle sending WhatsApp from booking success modal
  const handleSendBookingWhatsApp = async () => {
    if (!bookingSuccessData) return;
    
    const message = generateBookingMessage(
      bookingSuccessData.customer_name,
      bookingSuccessData.complaint_no,
      bookingSuccessData.product_name,
      bookingSuccessData.service_type,
      bookingSuccessData.date
    );
    
    const normalizedPhone = normalizePhoneNumber(bookingSuccessData.customer_phone);
    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    
    // Update the backend to mark booking WhatsApp as sent
    try {
      await api.post('update-whatsapp-status/', {
        complaint_no: bookingSuccessData.complaint_no,
        booking_whatsapp_sent: true
      });
    } catch (err) {
      console.error('Failed to update booking WhatsApp status:', err);
    }
  };

  // Handle proceed after booking
  const handleProceedAfterBooking = () => {
    setShowBookingSuccessModal(false);
    if (bookingSuccessData?.complaint_no) {
      const encodedComplaintNo = encodeURIComponent(bookingSuccessData.complaint_no);
      navigate(`/select-staff?complaintNo=${encodedComplaintNo}`);
    }
  };

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const response = await api.get('stocks/');
        setStockItems(response.data || []);
      } catch (error) {
        console.error("Error fetching stock items:", error);
        setStockItems([]);
      }
    };
    fetchStockItems();
  }, []);

  // Get stock item for a product
  const getStockItem = (productName) => {
    return stockItems.find(item => item.name === productName);
  };

  // Get selling price for a product
  const getSellingPrice = (productName, brandName = null) => {
    if (brandName) {
      const brandDetails = getMotorBrandDetails(productName, brandName);
      if (brandDetails) return brandDetails.selling_price || 0;
    }
    const item = getStockItem(productName);
    return item?.selling_price || 0;
  };

  // Get buying price for a product
  const getBuyingPrice = (productName, brandName = null) => {
    if (brandName) {
      const brandDetails = getMotorBrandDetails(productName, brandName);
      if (brandDetails) return brandDetails.purchase_price || 0;
    }
    const item = getStockItem(productName);
    return item?.buying_price || 0;
  };

  // Add product to selected products list
  const addProduct = () => {
    if (!newProduct.productName || newProduct.quantity < 1) return;

    // Check if already added
    const exists = selectedProducts.find(p => p.productName === newProduct.productName);
    if (exists) {
      showToast("⚠️ This product is already added", true);
      return;
    }

    // Get the selling price and buying price from stock (brand-aware)
    const sellingPrice = getSellingPrice(newProduct.productName, newProduct.motor_brand);
    const buyingPrice = getBuyingPrice(newProduct.productName, newProduct.motor_brand);
    const minimumPrice = getMinimumPrice(newProduct.productName, newProduct.motor_brand);
    const discountPercent = parseFloat(newProduct.discount_percent) || 0;

    // Calculate final price with discount validation
    let finalPrice = sellingPrice;
    if (discountPercent > 0) {
      const calculatedPrice = calculateFinalPrice(sellingPrice, buyingPrice, discountPercent, minimumPrice);
      if (calculatedPrice === null) {
        const maxDiscount = getMaxDiscount(sellingPrice, buyingPrice, minimumPrice);
        if (minimumPrice > 0) {
          showToast(`⚠️ Discount too high! Maximum allowed for ${newProduct.motor_brand || 'this product'} is ${maxDiscount}%. Price cannot be below minimum price (₹${minimumPrice}).`, true);
        } else {
          showToast(`⚠️ Discount too high! Maximum allowed is ${maxDiscount}%. Price cannot be below buying price (₹${buyingPrice}).`, true);
        }
        return;
      }
      finalPrice = calculatedPrice;
    }

    setSelectedProducts([...selectedProducts, {
      ...newProduct,
      quantity: parseInt(newProduct.quantity),
      selling_price: sellingPrice,
      buying_price: buyingPrice,
      discount_percent: discountPercent,
      final_price: finalPrice,
      total: finalPrice * parseInt(newProduct.quantity),
      motor_brand: newProduct.motor_brand || "",
      serial_no: newProduct.serial_no || ""
    }]);
    setNewProduct({ productName: "", quantity: 1, discount_percent: 0, motor_brand: "", serial_no: "" });
    setProductNotAddedWarning(false);
  };

  // Remove product from selected products list
  const removeProduct = (index) => {
    const updated = [...selectedProducts];
    updated.splice(index, 1);
    setSelectedProducts(updated);
    if (updated.length === 0) {
      setProductNotAddedWarning(false);
    }
  };

  // Calculate total products amount (with discount)
  const calculateTotalAmount = () => {
    return selectedProducts.reduce((total, prod) => {
      // Use final_price if available, otherwise fall back to selling_price
      const price = prod.final_price || prod.selling_price || getSellingPrice(prod.productName);
      return total + (price * prod.quantity);
    }, 0);
  };

  useEffect(() => {
    if (reminderData?.fromReminder) {
      setCustomerName(reminderData.customer_name || "");
      setCustomerEmail(reminderData.customer_email || "");
      setPhone("+91" + reminderData.phone || "+91");
      setAddress(reminderData.address || "");
      setProductName(reminderData.product_name || "");
      setDetails(reminderData.details || "");
    }

    // ⭐ NEW: Handle return from Motor Details page
    if (reminderData?.from_motor_details) {
      setCustomerName(reminderData.customer_name || "");
      setPhone("+91" + (reminderData.customer_phone?.replace('+91', '') || ""));
      setAddress(reminderData.address || "");
      setJobCategory(reminderData.job_category || "normal_service");
      // Set product name to include motor details
      if (reminderData.motor_serial_no) {
        setProductName(`Motor: ${reminderData.motor_company || ''} - ${reminderData.motor_make || ''} (S/N: ${reminderData.motor_serial_no})`);
      }
    }
  }, [reminderData]);




  // useEffect(() => {
  //   const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  //   setComplaintNo(`C-${random}`);
  // }, []);



  const handleEmailChange = (text) => {
    setCustomerEmail(text);
    if (text.endsWith("@gmail.com")) {
      setEmailError("");
    } else {
      setEmailError('Email must end with "@gmail.com"');
    }
  };

  const handlePhoneChange = async (text) => {
    if (text.startsWith("+91")) {
      const numberPart = text.slice(3);
      if (numberPart.length <= 10 && /^\d*$/.test(numberPart)) {
        setPhone(text);
        if (numberPart.length === 10) {
          setPhoneError("");
          // Verify phone number in database
          await verifyPhoneNumber(text);
        } else {
          setPhoneError("Phone number must be 10 digits.");
          setCustomerFound(null); // Reset verification status
        }
      }
    } else if (text === "+9" || text === "+" || text === "") {
      setPhone("+91");
      setCustomerFound(null); // Reset verification status
    }
  };

  const handleAlternateNumberChange = async (text) => {
    // Always allow typing, including partial input
    if (text === "" || text === "+" || text === "+9" || text === "+91") {
      setAlternateNumber(text);
      setAlternateNumberFound(null); // Reset verification status
      return;
    }

    // Only process if it starts with +91 and has valid digits
    if (text.startsWith("+91")) {
      const numberPart = text.slice(3);
      if (numberPart.length <= 10 && /^\d*$/.test(numberPart)) {
        setAlternateNumber(text);
        if (numberPart.length === 10) {
          setAlternateNumberError("");
          // Verify alternate number in database
          await verifyAlternateNumber(text);
        } else {
          setAlternateNumberError("Alternate number must be 10 digits.");
          setAlternateNumberFound(null); // Reset verification status
        }
      }
    } else {
      // Allow typing but don't set the state if it doesn't start with +91
      // This prevents the input from being cleared
      setAlternateNumber(text);
      setAlternateNumberFound(null); // Reset verification status
    }
  };

  const handleAlternateNumberBlur = async () => {
    const alternateNumberValue = alternateNumber.trim();

    // Only verify if it's a complete 10-digit number
    if (alternateNumberValue.slice(3).length === 10) {
      await verifyAlternateNumber(alternateNumberValue);
    }
  };

  const verifyPhoneNumber = async (phoneNumber) => {
    setIsVerifyingPhone(true);
    try {
      const response = await api.get(`customer-by-phone/?phone=${phoneNumber.slice(3)}`);
      if (response.data && response.data.found) {
        // Auto-fill customer details
        setCustomerName(response.data.customer_name || "");
        setAlternateNumber(response.data.alternate_number || "");
        setCustomerEmail(response.data.customer_email || "");
        setAddress(response.data.address || "");
        setPhone("+91" + (response.data.phone || ""));
        setCustomerType(response.data.customer_type || "our_customer");
        // Store previous bookings
        setPreviousBookings(Array.isArray(response.data.complaints) ? response.data.complaints : []);
        setCustomerFound(true);

        // Auto-scroll to previous bookings after a short delay to allow rendering
        setTimeout(() => {
          const previousBookingsSection = document.getElementById('previous-bookings-section');
          if (previousBookingsSection) {
            previousBookingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      } else {
        setPreviousBookings([]);
        setCustomerFound(false);
      }
    } catch (error) {
      console.error("Error verifying phone number:", error);
      setPreviousBookings([]);
      setCustomerFound(false);
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleClientIdChange = async (text) => {
    setClientId(text);
    if (text.trim()) {
      setClientIdError("");
      // Verify client ID in database
      await verifyClientId(text.trim());
    } else {
      setClientIdError("");
      setClientIdFound(null);
      setPreviousBookings([]);
    }
  };

  const verifyClientId = async (clientId) => {
    setIsVerifyingClientId(true);
    try {
      const response = await api.get(`customer-by-id/?customer_id=${clientId}`);
      if (response.data && response.data.found) {
        // Auto-fill customer details
        setCustomerName(response.data.customer_name || "");
        setCustomerEmail(response.data.customer_email || "");
        setPhone("+91" + (response.data.phone || ""));
        setAddress(response.data.address || "");
        setCustomerType(response.data.customer_type || "our_customer");
        // Store previous bookings
        setPreviousBookings(Array.isArray(response.data.complaints) ? response.data.complaints : []);
        setClientIdFound(true);
      } else {
        setPreviousBookings([]);
        setClientIdFound(false);
      }
    } catch (error) {
      console.error("Error verifying client ID:", error);
      setPreviousBookings([]);
      setClientIdFound(false);
    } finally {
      setIsVerifyingClientId(false);
    }
  };

  const verifyAlternateNumber = async (alternateNumber) => {
    setIsVerifyingAlternateNumber(true);
    try {
      const response = await api.get(
        `customer-by-phone/?phone=${alternateNumber.slice(3)}`
      );

      if (response.data && response.data.found) {
        setCustomerName(response.data.customer_name || "");
        setCustomerEmail(response.data.customer_email || "");
        setAddress(response.data.address || "");
        setCustomerType(response.data.customer_type || "our_customer");

        // ✅ MAIN PHONE AUTO-FILL
        if (response.data.phone) {
          setPhone(
            response.data.phone.startsWith("+91")
              ? response.data.phone
              : `+91${response.data.phone}`
          );
        }

        // ✅ CUSTOMER ID AUTO-FILL
        setClientId(response.data.customer_id || "");

        // ✅ KEEP ALTERNATE NUMBER AS-IS (DO NOT OVERWRITE)
        setAlternateNumber(
          alternateNumber.startsWith("+91")
            ? alternateNumber
            : `+91${alternateNumber}`
        );

        // ✅ PREVIOUS BOOKINGS
        setPreviousBookings(
          Array.isArray(response.data.complaints)
            ? response.data.complaints
            : []
        );

        setAlternateNumberFound(true);
      } else {
        setPreviousBookings([]);
        setAlternateNumberFound(false);
      }
    } catch (error) {
      console.error("Error verifying alternate number:", error);
      setPreviousBookings([]);
      setAlternateNumberFound(false);
    } finally {
      setIsVerifyingAlternateNumber(false);
    }
  };

  //   // include original complaint id if we came from a reminder
  // if (reminderData?.original_complaint_id) {
  //   formData.append('original_complaint_id', reminderData.original_complaint_id);
  // }




  const handleSubmit = async () => {
    const isPhoneValid =
      phone.startsWith("+91") &&
      phone.slice(3).length === 10 &&
      /^\d+$/.test(phone.slice(3));

    // Required Fields
    if (!customerName || !phone || !address || !details) {
      setFormError("Please fill all required fields.");
      return;
    }

    // Job Type validation (mandatory)
    if (!jobCategory || jobCategory === "") {
      setJobTypeError("Please select a Job Type");
      setFormError("Please select a Job Type");
      return;
    } else {
      setJobTypeError("");
    }

    // Product not added warning - show if product is selected but not added to list
    if (newProduct.productName && selectedProducts.length === 0) {
      setProductNotAddedWarning(true);
      setFormError('Please click "Add" to include the selected product');
      return;
    } else {
      setProductNotAddedWarning(false);
    }

    // Email NOT compulsory — only validate when entered
    if (customerEmail && !customerEmail.endsWith("@gmail.com")) {
      setEmailError('Email must end with "@gmail.com"');
      setFormError("Please enter a valid email address.");
      return;
    } else {
      setEmailError("");  // valid email or no email
    }

    // Phone validation
    if (!isPhoneValid) {
      setPhoneError("Phone number must be 10 digits.");
      setFormError("Please enter a valid phone number.");
      return;
    }

    setFormError("");
    setProductNotAddedWarning(false);
    setEmailError("");
    setPhoneError("");
    setIsSubmitting(true);

    // ---- Submit form with selected product ----
    // Prepare form data for file upload
    const formData = new FormData();
    if (reminderData?.original_complaint_id) {
      formData.append("original_complaint_id", reminderData.original_complaint_id);
    }

    formData.append('customer_name', customerName);
    formData.append('customer_email', customerEmail);
    formData.append('customer_phone', phone.slice(3)); // Send only the phone number without +91
    if (alternateNumber.trim()) {
      formData.append('alternate_number', alternateNumber.startsWith('+91') ? alternateNumber.slice(3) : alternateNumber);
    }
    formData.append('address', address);
    formData.append('complaint_details', details);
    formData.append('customer_type', customerType);
    formData.append('service_type', serviceType);
    // ⭐ NEW: Add job_type and job_category for motor services
    if (jobCategory && jobCategory !== 'normal_service') {
      formData.append('job_type', jobCategory);
      formData.append('job_category', jobCategory);
    }

    // Handle multiple products - store as JSON in product_name field
    if (selectedProducts.length > 0) {
      // Store all products as JSON string
      formData.append('product_name', JSON.stringify(selectedProducts));
      // Calculate total quantity
      const totalQty = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
      formData.append('product_quantity', totalQty);
    } else if (productName) {
      // Single product (backward compatibility)
      formData.append('product_name', productName);
      if (productQuantity && productQuantity > 0) {
        formData.append('product_quantity', productQuantity);
      }
    }

    // ⭐ NEW: Add motor details if this is a motor job from MotorDetails page
    if (reminderData?.from_motor_details && reminderData?.motor_serial_no) {
      formData.append('motor_data', JSON.stringify({
        serial_no: reminderData.motor_serial_no,
        company_name: reminderData.motor_company,
        motor_make: reminderData.motor_make,
        // ⭐ NEW: Include motor_brand from selectedProducts if available
        motor_brand: selectedProducts.find(p => p.productName?.toLowerCase().includes('motor'))?.motor_brand || reminderData.motor_brand || '',
        kw: reminderData.motor_kw,
        hp: reminderData.motor_hp,
        rpm: reminderData.motor_rpm,
        no_of_slots: reminderData.motor_no_of_slots,
        core_length: reminderData.motor_core_length,
        load_current: reminderData.motor_load_current,
        swg: reminderData.motor_swg,
        connection: reminderData.motor_connection,
        total_set: reminderData.motor_total_set,
        total_weight: reminderData.motor_total_weight,
        resistance_value: reminderData.motor_resistance_value,
        winder_name: reminderData.motor_winder_name,
        opening_date: reminderData.motor_opening_date,
        closing_date: reminderData.motor_closing_date,
        remarks: reminderData.motor_remarks,
        winding_details: reminderData.motor_winding_details
      }));
      // ⭐ NEW: Add motor_amount if provided
      if (reminderData.motor_amount) {
        formData.append('motor_amount', reminderData.motor_amount);
      }
      // ⭐ NEW: Add discount_percent for motor if provided
      if (reminderData.motor_discount_percent) {
        formData.append('motor_discount_percent', reminderData.motor_discount_percent);
      }
    }

    // Add remarks if provided
    if (remarks.trim()) {
      formData.append('remarks', remarks.trim());
    }

    // Add warranty data if customer is "our_customer"
    if (customerType === "our_customer") {
      if (warrantyPhoto) {
        formData.append('warranty_photo', warrantyPhoto);
      }
      if (warrantyDate) {
        formData.append('warranty_date', warrantyDate);
      }
    }

    // ⭐ ADDED customer_type TO PAYLOAD
    console.log('DEBUG: Submitting to bookservice/ with formData:', Object.fromEntries(formData));
    console.log('DEBUG: API_BASE_URL:', API_BASE_URL);
    try {
      const response = await api.post(`bookservice/`, formData);
      console.log('DEBUG: Response received:', response);

      if (response.status === 201 || response.status === 200) {
        console.log('Booking successful, response:', response.data);

        // Store booking data and show success modal
        const complaintNo = response.data?.complaint_no;
        if (complaintNo) {
          const productDisplay = selectedProducts.length > 0 
            ? formatProductNames(JSON.stringify(selectedProducts))
            : productName;
          
          setBookingSuccessData({
            complaint_no: complaintNo,
            customer_name: customerName,
            customer_phone: phone,
            product_name: productDisplay || 'Service',
            service_type: serviceType,
            date: new Date().toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })
          });
          setShowBookingSuccessModal(true);
        } else {
          console.error('complaint_no missing in response:', response.data);
          setFormError('Booking successful but complaint number is missing. Please contact support.');
        }
      } else {
        const errorData = response.data;
        console.error("Failed to book service:", errorData);
        setFormError(
          errorData.detail ||
          "Failed to submit service request. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting service request:", error);

      // Handle validation errors from backend
      if (error.response && error.response.status === 400) {
        const errorData = error.response.data;
        if (errorData.error) {
          setFormError(errorData.error);
        } else if (errorData.errors) {
          // Extract and display specific field errors from serializer
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, msgs]) => {
              const fieldLabel = field.replace(/_/g, ' ');
              const msgText = Array.isArray(msgs) ? msgs.join(', ') : msgs;
              return `${fieldLabel}: ${msgText}`;
            })
            .join(' | ');
          console.error("Serializer errors:", errorData.errors);
          setFormError(errorMessages || "Please check the form fields for errors.");
        } else {
          setFormError("Validation error occurred. Please check your input.");
        }
      } else {
        // Network error - add more debug info
        console.error("Network error details:", {
          message: error.message,
          code: error.code,
          config: error.config
        });
        setFormError(
          "Cannot connect to the server. Please check your connection."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    container: {
      flex: 1,
      minHeight: "100vh",
      backgroundColor: COLORS.background,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: SIZES.padding,
    },
    headerSection: {
      backgroundColor: COLORS.header,
      margin: "16px",
      padding: SIZES.padding,
      borderRadius: SIZES.radius,
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.12)",
      textAlign: "center",
      width: "calc(100% - 32px)",
      maxWidth: "600px",
      boxSizing: "border-box",
    },
    headerTitle: {
      fontSize: SIZES.h1,
      fontWeight: "bold",
      color: COLORS.white,
      textAlign: "center",
    },
    headerSubtitle: {
      fontSize: SIZES.body,
      color: COLORS.white,
      textAlign: "center",
      marginTop: "8px",
    },
    scrollWrapper: {
      width: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      flex: 1,
      overflow: "visible",
    },
    scrollContent: {
      padding: SIZES.padding,
      paddingBottom: "40px",
      alignItems: "center",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: "20px",
      flexWrap: "nowrap",
      width: "100%",
      boxSizing: "border-box",
    },
    leftSection: {
      flex: 1,
      minWidth: "300px",
      maxWidth: "600px",
      position: "relative",
      zIndex: 1,
      width: "100%",
      flexBasis: "600px",
    },
    rightSection: {
      flex: 1,
      minWidth: "300px",
      maxWidth: "800px",
      position: "relative",
      zIndex: 1,
      overflow: "visible",
      width: "100%",
      marginTop: "20px",
    },
    bookingDetailsCard: {
      backgroundColor: COLORS.surface,
      margin: "16px 0",
      padding: "24px",
      borderRadius: SIZES.radius,
      boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.1)",
      width: "100%",
      boxSizing: "border-box",
    },
    bookingDetailsTitle: {
      fontSize: SIZES.h2,
      fontWeight: "bold",
      color: COLORS.primary,
      marginBottom: "16px",
      textAlign: "center",
    },
    bookingDetailItem: {
      marginBottom: "12px",
      padding: "8px 0",
      borderBottom: `1px solid ${COLORS.border}`,
    },
    bookingDetailLabel: {
      fontSize: "14px",
      fontWeight: "600",
      color: COLORS.textSecondary,
      marginBottom: "4px",
    },
    bookingDetailValue: {
      fontSize: "16px",
      color: COLORS.textPrimary,
    },
    card: {
      backgroundColor: COLORS.surface,
      margin: "16px",
      padding: "28px",
      borderRadius: "16px",
      boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.08), 0px 1px 4px rgba(0, 0, 0, 0.04)",
      width: "calc(100% - 32px)",
      maxWidth: "600px",
      boxSizing: "border-box",
    },
    cardHeader: {
      display: "flex",
      alignItems: "center",
      marginBottom: "16px",
    },
    cardTitle: {
      fontSize: SIZES.h2,
      fontWeight: "bold",
      color: COLORS.primary,
      marginLeft: "12px",
    },
    welcomeText: {
      fontSize: SIZES.body,
      color: COLORS.textSecondary,
      marginBottom: "24px",
      textAlign: "center",
    },
    inputWrapper: {
      marginBottom: "20px",
      width: "100%",
    },
    inputLabel: {
      fontSize: "13px",
      fontWeight: "600",
      color: COLORS.textPrimary,
      marginBottom: "8px",
      display: "block",
      letterSpacing: "0.3px",
      textTransform: "uppercase",
    },
    inputContainer: {
      display: "flex",
      alignItems: "center",
      backgroundColor: COLORS.white,
      borderRadius: "10px",
      padding: "14px 16px",
      border: `2px solid ${COLORS.accent}20`,
      width: "100%",
      boxSizing: "border-box",
      outline: "none",
      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
      transition: "all 0.2s ease",
    },
    input: {
      flex: 1,
      fontSize: "15px",
      color: COLORS.textPrimary,
      border: "none",
      outline: "none",
      padding: 0,
      width: "100%",
      boxShadow: "none",
      background: "transparent",
      fontWeight: "500",
    },
    multiline: {
      minHeight: "100px",
      verticalAlign: "top",
      resize: "vertical",
      fontFamily: "inherit",
    },
    select: {
      flex: 1,
      fontSize: SIZES.body,
      color: COLORS.textPrimary,
      border: "No Data",
      outline: "No Data",
      padding: 0,
      width: "100%",
      backgroundColor: "transparent",
      appearance: "No Data",
    },
    submitButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.primary,
      padding: "16px",
      borderRadius: SIZES.radius,
      marginTop: "24px",
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
      border: "No Data",
      cursor: "pointer",
      width: "100%",
    },
    submitButtonText: {
      color: COLORS.white,
      fontWeight: "bold",
      fontSize: "16px",
      marginLeft: "8px",
    },
    errorText: {
      color: "#dc2626",
      fontSize: "14px",
      fontWeight: 600,
      marginTop: "8px",
      marginLeft: "8px",
      display: "block",
      backgroundColor: "#fef2f2",
      padding: "12px 16px",
      borderRadius: "8px",
      border: "2px solid #fca5a5",
      textAlign: "center",
    },
    "@keyframes spin": {
      "0%": { transform: "rotate(0deg)" },
      "100%": { transform: "rotate(360deg)" },
    },
  };

  return (
    <div className="booking-container">
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          padding: '14px 20px',
          borderRadius: '12px',
          background: toast.isError ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          border: `2px solid ${toast.isError ? '#fecaca' : '#bbf7d0'}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          color: toast.isError ? '#991b1b' : '#166534',
          fontWeight: 600,
          fontSize: '14px',
          maxWidth: '350px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.message}
        </div>
      )}
      {/* Animated Blobs */}
      <div className="booking-blob booking-blob1"></div>
      <div className="booking-blob booking-blob2"></div>
      <div className="booking-blob booking-blob3"></div>

      {/* Inject CSS styles */}
      <style>{bookingStyles}</style>

      <div className="booking-page">
        {/* HERO BANNER */}
        <div className="booking-hero-banner">
          <div className="booking-hero-content">
            <div className="booking-hero-eyebrow">
              <div className="booking-hero-dot"></div>
              Service Booking
            </div>
            <h1 className="booking-hero-title">Book a <em>New Service</em></h1>
            <p className="booking-hero-sub">Fill in the details below to submit your service request quickly and easily.</p>
          </div>
        </div>

        {/* FORM CARD */}
        <form className="booking-form-card" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* FORM SECTIONS */}
          <div style={styles.scrollWrapper}>
            <div style={styles.scrollContent}>
              <div style={styles.leftSection}>
                <div style={styles.card}>
                  <div className="form-desktop">
                    <div style={styles.inputWrapper}>
                      <label style={styles.inputLabel}>Phone Number (*)</label>
                      <div style={styles.inputContainer}>
                        <input
                          type="tel"
                          placeholder="Enter phone number"
                          style={styles.input}
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          maxLength={13}
                        />
                      </div>
                      {phoneError && <span style={styles.errorText}>{phoneError}</span>}
                      {isVerifyingPhone && (
                        <span style={{ color: COLORS.primary, fontSize: "12px", marginLeft: "8px" }}>
                          Verifying phone number...
                        </span>
                      )}
                      {customerFound === true && (
                        <span style={{ color: COLORS.success, fontSize: "12px", marginLeft: "8px" }}>
                          ✓ Customer details auto-filled
                        </span>
                      )}
                      {customerFound === false && (
                        <span style={{ color: COLORS.muted, fontSize: "12px", marginLeft: "8px" }}>
                          New customer - please fill details manually
                        </span>
                      )}
                    </div>

                    <div style={styles.inputWrapper}>
                      <label style={styles.inputLabel}>Alternate Number (Optional)</label>
                      <div style={styles.inputContainer}>
                        <input
                          type="tel"
                          placeholder="Enter alternate phone number"
                          style={styles.input}
                          value={alternateNumber}
                          onChange={(e) => handleAlternateNumberChange(e.target.value)}
                          onBlur={handleAlternateNumberBlur}
                          maxLength={13}
                        />
                      </div>
                      {alternateNumberError && <span style={styles.errorText}>{alternateNumberError}</span>}
                      {isVerifyingAlternateNumber && (
                        <span style={{ color: COLORS.primary, fontSize: "12px", marginLeft: "8px" }}>
                          Verifying alternate number...
                        </span>
                      )}
                      {alternateNumberFound === true && (
                        <span style={{ color: COLORS.success, fontSize: "12px", marginLeft: "8px" }}>
                          ✓ Customer details auto-filled
                        </span>
                      )}
                      {alternateNumberFound === false && (
                        <span style={{ color: COLORS.muted, fontSize: "12px", marginLeft: "8px" }}>
                          Alternate number not found - please fill details manually
                        </span>
                      )}
                    </div>



                    {/* ⭐ ADDED CUSTOMER TYPE FIELD */}
                    <div style={styles.inputWrapper}>
                      <label style={styles.inputLabel}>Customer Type</label>
                      <div style={styles.inputContainer}>
                        <select
                          style={styles.select}
                          value={customerType}
                          onChange={(e) => setCustomerType(e.target.value)}
                        >
                          <option value="our_customer">Our Customer</option>
                          <option value="external_customer">External Customer</option>
                        </select>
                      </div>
                    </div>

                    {/* ⭐ ADDED SERVICE TYPE FIELD */}
                    <div style={styles.inputWrapper}>
                      <label style={styles.inputLabel}>Service Type</label>
                      <div style={styles.inputContainer}>
                        <select
                          style={styles.select}
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                        >
                          <option value="in_service">In Service (Service Center)</option>
                          <option value="out_service">Out Service (Customer Location)</option>
                        </select>
                      </div>
                    </div>

                    {/* ⭐ NEW JOB CATEGORY FIELD */}
                    <div style={styles.inputWrapper}>
                      <label style={styles.inputLabel}>Job Type <span style={{color: '#dc2626'}}>*</span></label>
                      <div style={styles.inputContainer}>
                        <select
                          style={{
                            ...styles.select,
                            borderColor: jobTypeError ? '#dc2626' : styles.select.borderColor,
                            borderWidth: jobTypeError ? '2px' : '1px'
                          }}
                          value={jobCategory}
                          onChange={(e) => {
                            setJobCategory(e.target.value);
                            setJobTypeError("");
                          }}
                        >
                          <option value="">Select Job Type</option>
                          <option value="normal_service">Normal Service</option>
                          <option value="motor_service">Motor Service</option>
                          <option value="motor_sale">Motor Sale</option>
                        </select>
                      </div>
                      {jobTypeError && (
                        <p style={{color: '#dc2626', fontSize: '12px', marginTop: '4px', fontWeight: 500}}>
                          ⚠️ {jobTypeError}
                        </p>
                      )}
                    </div>

                    {/* ⭐ MOTOR DETAILS BUTTON - Show only for Motor Service */}
                    {jobCategory === "motor_service" && (
                      <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#fff3e0", borderRadius: SIZES.radius, border: "1px solid #ffb74d" }}>
                        <button
                          type="button"
                          onClick={() => {
                            // Navigate to Motor Details with customer data
                            navigate("/motor-details", {
                              state: {
                                customer_name: customerName,
                                customer_phone: phone,
                                address: address,
                                job_category: jobCategory
                              }
                            });
                          }}
                          style={{
                            ...styles.button,
                            backgroundColor: "#f57c00",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                          }}
                        >
                          🔧 Open Motor Details
                        </button>
                        <p style={{ fontSize: "12px", color: "#e65100", marginTop: "8px", textAlign: "center" }}>
                          Click to add motor details. A complaint will be auto-created when saved.
                        </p>
                      </div>
                    )}

                    {/* Warranty Section - Only show for Our Customer */}
                    {customerType === "our_customer" && (
                      <div style={{ marginBottom: "24px", padding: "20px", backgroundColor: COLORS.panel, borderRadius: SIZES.radius }}>
                        <h3 style={{ fontSize: SIZES.h3, fontWeight: "bold", color: COLORS.primary, marginBottom: "16px" }}>
                          Warranty Information
                        </h3>

                        <div style={styles.inputWrapper}>
                          <label style={styles.inputLabel}>Warranty Photo</label>
                          <div style={styles.inputContainer}>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ ...styles.input, padding: "4px" }}
                              onChange={(e) => setWarrantyPhoto(e.target.files[0])}
                            />
                          </div>
                          {warrantyPhoto && (
                            <div style={{ marginTop: "8px", fontSize: "12px", color: COLORS.success }}>
                              Selected: {warrantyPhoto.name}
                            </div>
                          )}
                        </div>

                        <div style={styles.inputWrapper}>
                          <label style={styles.inputLabel}>Warranty Expiry Date</label>
                          <div style={styles.inputContainer}>
                            <input
                              type="date"
                              style={styles.input}
                              value={warrantyDate}
                              onChange={(e) => setWarrantyDate(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}



                    <div style={styles.inputWrapper}>
                      <label style={styles.inputLabel}>Full Name (*)</label>
                      <div style={styles.inputContainer}>
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          style={styles.input}
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={styles.inputWrapper}>
                      <label style={styles.inputLabel}>Email Address</label>
                      <div style={styles.inputContainer}>
                        <input
                          type="email"
                          placeholder="Enter your email"
                          style={styles.input}
                          value={customerEmail}
                          onChange={(e) => handleEmailChange(e.target.value)}
                        />
                      </div>
                      {emailError && <span style={styles.errorText}>{emailError}</span>}
                    </div>

                    {/* Multi-Product Selection Section */}
                    <div style={{
                      marginTop: "16px",
                      padding: "16px",
                      background: "rgba(255,255,255,0.5)",
                      borderRadius: "12px",
                      border: "1px solid rgba(124,92,191,0.2)"
                    }}>
                      <h4 style={{ marginBottom: "12px", color: "#5a4a8a", fontSize: "14px", fontWeight: "600" }}>
                        Add Products
                      </h4>

                      {/* Selected Products List */}
                      {selectedProducts.length > 0 && (
                        <div style={{ marginBottom: "12px" }}>
                          <label style={{ fontSize: "12px", color: "#666", marginBottom: "8px", display: "block" }}>
                            Selected Products:
                          </label>
                          {selectedProducts.map((prod, index) => (
                            <div key={index} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 12px",
                              background: "white",
                              borderRadius: "8px",
                              marginBottom: "8px",
                              border: "1px solid #e5e7eb"
                            }}>
                              <div>
                                <span style={{ fontWeight: "600" }}>{prod.productName}</span>
                                <span style={{ marginLeft: "8px", color: "#666" }}>x {prod.quantity}</span>
                                {prod.discount_percent > 0 && (
                                  <span style={{ marginLeft: "8px", color: "#f59e0b", fontSize: "12px" }}>
                                    (-{prod.discount_percent}%)
                                  </span>
                                )}
                                <span style={{ marginLeft: "8px", color: "#059669", fontWeight: "600" }}>
                                  ₹{((prod.final_price || prod.selling_price) * prod.quantity).toFixed(2)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeProduct(index)}
                                style={{
                                  background: "#fee2e2",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "4px 8px",
                                  cursor: "pointer",
                                  color: "#dc2626"
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "12px",
                            background: "#059669",
                            color: "white",
                            borderRadius: "8px",
                            fontWeight: "600"
                          }}>
                            <span>Total:</span>
                            <span style={{ fontSize: "18px" }}>₹{calculateTotalAmount().toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {/* Add Product Form */}
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ flex: 2, minWidth: "200px" }}>
                          <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                            Product
                          </label>
                          <select
                            value={newProduct.productName}
                            onChange={(e) => {
                              const name = e.target.value;
                              setNewProduct({
                                productName: name,
                                quantity: 1,
                                discount_percent: 0,
                                motor_brand: ""
                              });
                              if (!name) {
                                setProductNotAddedWarning(false);
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              fontSize: "14px"
                            }}
                          >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.product_name}>
                                {product.product_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Motor Brand Selection */}
                        {isMotorProduct(newProduct.productName) && (
                          <div style={{ flex: 1, minWidth: "150px" }}>
                            <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                              Motor Brand (*)
                            </label>
                            <select
                              value={newProduct.motor_brand}
                              onChange={(e) => {
                                const selectedName = e.target.value;
                                // Find brand ID from our object-based list
                                const brandList = getMotorBrands(newProduct.productName);
                                const brandObj = brandList.find(b => b.name === selectedName);
                                const selectedId = brandObj ? brandObj.id : null;

                                setNewProduct({
                                  ...newProduct,
                                  motor_brand: selectedName,
                                  brand_name: selectedName,
                                  brand_id: selectedId,
                                  discount_percent: 0,
                                  motor_specs: (selectedName && jobCategory === 'motor_sale') ? (getStockItem(newProduct.productName)?.motor_specs || {}) : {}
                                });

                                // Immediate notification of brand-specific price
                                const brandDetails = getMotorBrandDetails(newProduct.productName, selectedName);
                                if (brandDetails && selectedName) {
                                  const bPrice = brandDetails.selling_price || 0;
                                  showToast(`✅ Brand ${selectedName} selected. Price: ₹${bPrice}`, false);
                                }
                              }}
                              disabled={!newProduct.productName}
                              style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #7c5cbf",
                                fontSize: "14px",
                                backgroundColor: "white",
                                fontWeight: "600"
                              }}
                            >
                              <option value="">-- Choose Brand --</option>
                              {getMotorBrands(newProduct.productName).map((brand, index) => (
                                <option key={index} value={brand.name}>{brand.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Serial No Input - Only for motor products */}
                        {isMotorProduct(newProduct.productName) && newProduct.motor_brand && (
                          <div style={{ flex: 1, minWidth: "150px" }}>
                            <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                              Serial No
                            </label>
                            <input
                              type="text"
                              value={newProduct.serial_no || ""}
                              onChange={(e) => setNewProduct({ ...newProduct, serial_no: e.target.value })}
                              placeholder="Enter motor serial no"
                              style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1.5px solid #F59E0B",
                                fontSize: "14px",
                                backgroundColor: "#FFFBEB"
                              }}
                            />
                          </div>
                        )}

                        <div style={{ width: "80px" }}>
                          <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={newProduct.quantity}
                            onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 1 })}
                            disabled={!newProduct.productName}
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              fontSize: "14px"
                            }}
                          />
                        </div>

                        <div style={{ width: "100px" }}>
                          <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                            Disc %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newProduct.discount_percent}
                            onChange={(e) => {
                              if (isMotorProduct(newProduct.productName) && !newProduct.motor_brand) {
                                showToast("⚠️ Please select a motor brand first to calculate correct discount.", true);
                                return;
                              }

                              const discount = parseFloat(e.target.value) || 0;
                              const sellingPrice = getSellingPrice(newProduct.productName, newProduct.motor_brand);
                              const minimumPrice = getMinimumPrice(newProduct.productName, newProduct.motor_brand);
                              const buyingPrice = getBuyingPrice(newProduct.productName, newProduct.motor_brand);

                              // Real-time minimum price validation
                              if (minimumPrice > 0 && sellingPrice > 0) {
                                const discountedPrice = sellingPrice - (sellingPrice * discount / 100);
                                if (discountedPrice < minimumPrice) {
                                  const maxAllowedDiscount = Math.floor(((sellingPrice - minimumPrice) / sellingPrice) * 100);
                                  const context = newProduct.motor_brand ? `for brand "${newProduct.motor_brand}"` : "";
                                  showToast(`⚠️ Discount too high ${context}! Price must stay above ₹${minimumPrice}. Max allowed: ${maxAllowedDiscount}%.`, true);
                                  setNewProduct({ ...newProduct, discount_percent: Math.max(0, maxAllowedDiscount) });
                                  return;
                                }
                              }

                              setNewProduct({ ...newProduct, discount_percent: Math.min(100, discount) });
                            }}
                            disabled={!newProduct.productName}
                            placeholder="0%"
                            style={{
                              width: "100%",
                              padding: "10px",
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                              fontSize: "14px"
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (isMotorProduct(newProduct.productName) && !newProduct.motor_brand) {
                              showToast("⚠️ Select a motor brand before adding.", true);
                              return;
                            }
                            addProduct();
                          }}
                          disabled={!newProduct.productName}
                          style={{
                            padding: "10px 16px",
                            background: newProduct.productName ? "#059669" : "#9ca3af",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: newProduct.productName ? "pointer" : "not-allowed",
                            fontWeight: "500",
                            whiteSpace: "nowrap"
                          }}
                        >
                          + Add Item
                        </button>
                      </div>

                      {/* Stock info for new product */}
                      {newProduct.productName && (() => {
                        const stockItem = getStockItem(newProduct.productName);
                        // Use brand-specific pricing if available
                        const sellingPrice = getSellingPrice(newProduct.productName, newProduct.motor_brand);
                        const buyingPrice = getBuyingPrice(newProduct.productName, newProduct.motor_brand);
                        const minimumPrice = getMinimumPrice(newProduct.productName, newProduct.motor_brand);
                        const maxDiscount = getMaxDiscount(sellingPrice, buyingPrice, minimumPrice);

                        return stockItem ? (
                          <div style={{
                            marginTop: "8px",
                            fontSize: "12px",
                            color: stockItem.quantity > 0 ? "#059669" : "#dc2626",
                            padding: "8px",
                            backgroundColor: "rgba(255,255,255,0.7)",
                            borderRadius: "6px",
                            border: "1px solid rgba(0,0,0,0.05)"
                          }}>
                            <strong>Stock Info {newProduct.motor_brand ? `(${newProduct.motor_brand})` : ''}:</strong><br />
                            Available: {stockItem.quantity} {stockItem.unit} |
                            Selling: ₹{sellingPrice} |
                            Min Price: ₹{minimumPrice} |
                            Max Discount: {maxDiscount}%
                          </div>
                        ) : null;
                      })()}
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
                            placeholder="Enter any additional remarks or notes about the service request"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows="3"
                            maxLength="500"
                          />
                        </div>
                      </div>
                    )}

                    <div style={styles.inputWrapper}>
                      <label style={styles.inputLabel}>Address (*)</label>
                      <div style={styles.inputContainer}>
                        <textarea
                          placeholder="Enter complete address or coordinates (e.g., 13.0827,80.2707)"
                          style={{ ...styles.input, ...styles.multiline }}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          rows={3}
                        />
                      </div>

                    </div>

                    <div style={styles.inputWrapper}>
                      <label style={styles.inputLabel}>Issue Description (*)</label>
                      <div style={styles.inputContainer}>
                        <textarea
                          placeholder="Describe the issue in detail"
                          style={{ ...styles.input, ...styles.multiline }}
                          value={details}
                          onChange={(e) => setDetails(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>

                  {formError && <span style={styles.errorText}>{formError}</span>}


                  <button
                    type="button"
                    style={{
                      ...styles.submitButton,
                      opacity: isSubmitting ? 0.7 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit();
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={styles.submitButtonText}>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <FiSend />
                        <span style={styles.submitButtonText}>Submit Service Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>


              {(previousBookings.length > 0 || bookingData) && (
                <div id="previous-bookings-section" style={styles.rightSection}>
                  {previousBookings.length > 0 && (
                    <div className="complaint-list">
                      <h2 style={{ fontSize: SIZES.h2, fontWeight: "bold", color: COLORS.primary, marginBottom: "16px", textAlign: "center" }}>
                        Previous Bookings
                      </h2>
                      {previousBookings.map((booking, index) => (
                        <div key={index} className="complaint-card completed">
                          <div className="card-header">
                            <span className="card-title">{booking.complaint_no}</span>
                            {/* ⭐ FEATURE 4: Display 'Initial' instead of 'Pending' for initial records */}
                            <div className={`status-badge ${booking.is_initial === true ? 'initial' : booking.status?.toLowerCase() === 'completed' ? 'completed' : booking.staff_name && booking.staff_name !== "No Data" ? 'assigned' : 'pending'}`}>
                              {booking.is_initial === true ? <FiFileText /> :
                                booking.status?.toLowerCase() === 'completed' ? <FiCheck /> :
                                  booking.staff_name && booking.staff_name !== "No Data" ? <FiUserCheck /> : <FiAlertCircle />}
                              <span>
                                {booking.is_initial === true ? 'Initial' :
                                  booking.status?.toLowerCase() === 'completed' ? 'Completed' :
                                    booking.staff_name && booking.staff_name !== "No Data" ? 'Assigned' : 'Pending'}
                              </span>
                            </div>
                          </div>

                          <div className="card-content">
                            <div className="info-row">
                              <span className="info-row-icon"><FiFileText size={16} /></span>
                              <span className="info-row-label">Product Name</span>
                              <span className="info-row-value">{(() => {
                                const isMotorComplaint = booking.job_category === 'motor_service' || booking.job_category === 'motor_sale' || booking.job_type === 'motor_service' || booking.job_type === 'motor_sale';
                                const isMotorAsProduct = booking.product_name && (typeof booking.product_name === 'string') && booking.product_name.startsWith('Motor:');
                                if (!booking.product_name || isMotorAsProduct || (isMotorComplaint && !booking.product_name)) {
                                  return 'No Data';
                                }
                                return formatProductNames(booking.product_name);
                              })()}</span>
                            </div>
                            {(booking.job_category === 'motor_service' || booking.job_category === 'motor_sale' || booking.job_type === 'motor_service' || booking.job_type === 'motor_sale') && (
                              <div className="info-row">
                                <span className="info-row-icon"><FiCpu size={16} /></span>
                                <span className="info-row-label">Service Type</span>
                                <span className="info-row-value" style={{ color: '#7c5cbf', fontWeight: 600 }}>
                                  {(booking.job_category || booking.job_type) === 'motor_sale' ? '⚡ Motor Sale' : '🔧 Motor Service'}
                                </span>
                              </div>
                            )}
                            <div className="info-row">
                              <span className="info-row-icon"><FiAlertCircle size={16} /></span>
                              <span className="info-row-label">Issue</span>
                              <span className="info-row-value">{booking.details || 'No Data'}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-row-icon"><FiUserCheck size={16} /></span>
                              <span className="info-row-label">Staff</span>
                              <span className="info-row-value">{booking.staff_name || "Not assigned"}</span>
                            </div>
                            {booking.date_created && (
                              <div className="info-row">
                                <span className="info-row-icon"><FiCalendar size={16} /></span>
                                <span className="info-row-label">Booking Date</span>
                                <span className="info-row-value">
                                  {(() => {
                                    try {
                                      return new Date(booking.date_created).toLocaleDateString();
                                    } catch (e) {
                                      return booking.date_created;
                                    }
                                  })()}
                                </span>
                              </div>
                            )}
                            {booking.assigned_at && (
                              <div className="info-row">
                                <span className="info-row-icon"><FiClock size={16} /></span>
                                <span className="info-row-label">Assigned At</span>
                                <span className="info-row-value">
                                  {(() => {
                                    try {
                                      return new Date(booking.assigned_at).toLocaleDateString();
                                    } catch (e) {
                                      return booking.assigned_at;
                                    }
                                  })()}
                                </span>
                              </div>
                            )}
                            {booking.assigned_completed_at && (
                              <div className="info-row">
                                <span className="info-row-icon"><FiCheck size={16} /></span>
                                <span className="info-row-label">Completed At</span>
                                <span className="info-row-value">
                                  {(() => {
                                    try {
                                      return new Date(booking.assigned_completed_at).toLocaleDateString();
                                    } catch (e) {
                                      return booking.assigned_completed_at;
                                    }
                                  })()}
                                </span>
                              </div>
                            )}
                            {booking.client_amount && (
                              <div className="info-row">
                                <span className="info-row-icon"><FiDollarSign size={16} /></span>
                                <span className="info-row-label">Service Amount</span>
                                <span className="info-row-value">{booking.client_amount}</span>
                              </div>
                            )}
                            {booking.next_service_date && (
                              <div className="info-row">
                                <span className="info-row-icon"><FiCalendar size={16} /></span>
                                <span className="info-row-label">Next Service</span>
                                <span className="info-row-value">
                                  {(() => {
                                    try {
                                      return new Date(booking.next_service_date).toLocaleDateString();
                                    } catch (e) {
                                      return booking.next_service_date;
                                    }
                                  })()}
                                </span>
                              </div>
                            )}
                            {booking.warranty_date && (
                              <div className="info-row">
                                <span className="info-row-icon"><FiImage size={16} /></span>
                                <span className="info-row-label">Warranty</span>
                                <span
                                  className="info-row-value warranty-link"
                                  onClick={() => setWarrantyModal({
                                    show: true,
                                    imageUrl: booking.warranty_photo ? `${api.defaults.baseURL.replace("/api/", "")}${booking.warranty_photo}` : null,
                                    date: booking.warranty_date
                                  })}
                                  style={{
                                    cursor: booking.warranty_photo ? 'pointer' : 'default',
                                    color: (() => {
                                      const today = new Date();
                                      const warrantyDate = new Date(booking.warranty_date);
                                      return warrantyDate < today ? COLORS.danger : (booking.warranty_photo ? COLORS.primary : COLORS.textSecondary);
                                    })()
                                  }}
                                >
                                  {booking.warranty_date ? new Date(booking.warranty_date).toLocaleDateString() : "No Data"}
                                  {booking.warranty_photo && ' (View Image)'}
                                </span>
                              </div>
                            )}
                            {booking.status?.toLowerCase() === 'completed' && (
                              <>
                                <div className="info-row">
                                  <span className="info-row-icon"><FiDollarSign size={16} /></span>
                                  <span className="info-row-label">Payment</span>
                                  <span className="info-row-value">{booking.payment_method || 'No Data'}</span>
                                </div>
                                <div className="info-row">
                                  <span className="info-row-icon"><FiMessageSquare size={16} /></span>
                                  <span className="info-row-label">Remarks</span>
                                  <span className="info-row-value">{booking.remarks || "No Data"}</span>
                                </div>
                                <div className="info-row">
                                  <button
                                    className="btn-generate-invoice"
                                    onClick={() => {
                                      const itemId = booking.complaint_no;
                                      navigate(`/invoice/${itemId}`);
                                    }}
                                    style={{
                                      marginTop: '10px',
                                      background: '#4CAF50',
                                      color: 'white',
                                      border: 'none',
                                      padding: '10px 20px',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      fontWeight: '600',
                                      width: '100%',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <FiFileText size={18} />
                                    Generate Invoice
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {bookingData && (
                    <div className="complaint-list">
                      <h2 style={{ fontSize: SIZES.h2, fontWeight: "bold", color: COLORS.primary, marginBottom: "16px", textAlign: "center" }}>
                        Current Booking Details
                      </h2>
                      <div className="complaint-card pending">
                        <div className="card-header">
                          <span className="card-title">{bookingData.complaint_no}</span>
                          {/* ⭐ FEATURE 4: Display 'Initial' instead of 'Pending' for initial records */}
                          <div className={`status-badge ${bookingData.is_initial === true ? 'initial' : bookingData.status?.toLowerCase() === 'completed' ? 'completed' : bookingData.staff_name && bookingData.staff_name !== "No Data" ? 'assigned' : 'pending'}`}>
                            {bookingData.is_initial === true ? <FiFileText /> :
                              bookingData.status?.toLowerCase() === 'completed' ? <FiCheck /> :
                                bookingData.staff_name && bookingData.staff_name !== "No Data" ? <FiUserCheck /> : <FiAlertCircle />}
                            <span>
                              {bookingData.is_initial === true ? 'Initial' :
                                bookingData.status?.toLowerCase() === 'completed' ? 'Completed' :
                                  bookingData.staff_name && bookingData.staff_name !== "No Data" ? 'Assigned' : 'Pending'}
                            </span>
                          </div>
                        </div>

                        <div className="card-content">
                          <div className="info-row">
                            <span className="info-row-icon"><FiFileText size={16} /></span>
                            <span className="info-row-label">Product Name</span>
                            <span className="info-row-value">{formatProductNames(bookingData.product_name)}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-row-icon"><FiPackage size={16} /></span>
                            <span className="info-row-label">Product Quantity</span>
                            <span className="info-row-value">{bookingData.product_quantity !== undefined && bookingData.product_quantity !== null && bookingData.product_quantity !== false ? bookingData.product_quantity : 1}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-row-icon"><FiAlertCircle size={16} /></span>
                            <span className="info-row-label">Issue</span>
                            <span className="info-row-value">{bookingData.details || 'No Data'}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-row-icon"><FiUserCheck size={16} /></span>
                            <span className="info-row-label">Staff</span>
                            <span className="info-row-value">{bookingData.staff_name || "Not assigned"}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-row-icon"><FiCalendar size={16} /></span>
                            <span className="info-row-label">Created</span>
                            <span className="info-row-value">
                              {(() => {
                                try {
                                  return new Date(bookingData.date_created).toLocaleDateString();
                                } catch (e) {
                                  return bookingData.date_created;
                                }
                              })()}
                            </span>
                          </div>
                          {bookingData.assigned_at && (
                            <div className="info-row">
                              <span className="info-row-icon"><FiClock size={16} /></span>
                              <span className="info-row-label">Assigned At</span>
                              <span className="info-row-value">
                                {(() => {
                                  try {
                                    return new Date(bookingData.assigned_at).toLocaleDateString();
                                  } catch (e) {
                                    return bookingData.assigned_at;
                                  }
                                })()}
                              </span>
                            </div>
                          )}
                          {bookingData.status?.toLowerCase() === 'completed' && (
                            <>
                              <div className="info-row">
                                <span className="info-row-icon"><FiDollarSign size={16} /></span>
                                <span className="info-row-label">Payment</span>
                                <span className="info-row-value">{bookingData.payment_method || 'No Data'}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-row-icon"><FiMessageSquare size={16} /></span>
                                <span className="info-row-label">Remarks</span>
                                <span className="info-row-value">{bookingData.remarks || 'No Data'}</span>
                              </div>
                              <div className="info-row">
                                <button
                                  className="btn-generate-invoice"
                                  onClick={() => {
                                    const itemId = bookingData.complaint_no;
                                    navigate(`/invoice/${itemId}`);
                                  }}
                                  style={{
                                    marginTop: '10px',
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: '600',
                                    width: '100%',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <FiFileText size={18} />
                                  Generate Invoice
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Warranty Image Modal */}
          {warrantyModal.show && (
            <div className="modal-backdrop">
              <div className="modal-content warranty-modal" ref={warrantyModalRef}>
                <div className="modal-header">
                  <h2 className="modal-title">Warranty Information</h2>
                  <button
                    className="close-button"
                    onClick={() => setWarrantyModal({ show: false, imageUrl: "", date: "" })}
                  >
                    <FiX />
                  </button>
                </div>

                <div className="modal-body">
                  {warrantyModal.date && (
                    <div className="warranty-info">
                      <h3>Warranty Expiry Date</h3>
                      <p>{new Date(warrantyModal.date).toLocaleDateString()}</p>
                    </div>
                  )}

                  {warrantyModal.imageUrl ? (
                    <div className="warranty-image-container">
                      <h3>Warranty Image</h3>
                      <img
                        src={warrantyModal.imageUrl}
                        alt="Warranty"
                        className="warranty-image"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.png'; // Fallback image
                          e.target.alt = 'Image not available';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="no-image">
                      <FiImage size={48} />
                      <p>No warranty image available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Booking Success Modal */}
      {showBookingSuccessModal && bookingSuccessData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => handleProceedAfterBooking()}
        >
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.3s ease-out'
          }}
          ref={bookingSuccessModalRef}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <FiCheck size={36} color="#166534" />
              </div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: '8px',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                Booking Confirmed!
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: 0
              }}>
                Your service request has been successfully submitted
              </p>
            </div>

            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600 }}>Complaint No</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: 0 }}>{bookingSuccessData.complaint_no}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600 }}>Customer</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', margin: 0 }}>{bookingSuccessData.customer_name}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600 }}>Product</p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>{bookingSuccessData.product_name}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600 }}>Service Type</p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>{bookingSuccessData.service_type}</p>
              </div>
            </div>

            <button
              onClick={handleSendBookingWhatsApp}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                border: 'none',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '12px',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
              }}
            >
              <FiMessageCircle size={18} />
              Send WhatsApp Notification
            </button>

            <button
              onClick={handleProceedAfterBooking}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                background: '#f3f4f6',
                color: '#374151',
                border: '2px solid #e5e7eb',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Proceed to Assign Staff
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
