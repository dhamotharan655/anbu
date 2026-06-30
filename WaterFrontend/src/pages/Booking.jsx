import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  FiMessageCircle,
  FiPlusCircle,
  FiPackage
} from "react-icons/fi"; // Import Feather icons
import { openWhatsAppWithDefaultMessage, generateBookingMessage, normalizePhoneNumber, generateWhatsAppLink } from "../utils/whatsappUtils";
import "../utils/whatsappUtils.css";
import { useLocation } from "react-router-dom";
import { useScrollToRef } from "../hooks/useScrollToRef";
import { useGlobalRefresh } from "../context/GlobalRefreshContext";

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
    background: linear-gradient(135deg, #f0f7f8 0%, #e0ecee 40%, #f9f5ea 100%);
    position: relative;
    overflow-x: hidden;
    font-family: var(--font-family-sans);
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

  .booking-blob1 { width: 500px; height: 500px; background: radial-gradient(circle, #b3dee6, #e6f7f9); top: -150px; left: -100px; }
  .booking-blob2 { width: 400px; height: 400px; background: radial-gradient(circle, #f9f0d1, #fcf8e8); bottom: -100px; right: -80px; animation-delay: -5s; }
  .booking-blob3 { width: 260px; height: 260px; background: radial-gradient(circle, #f1b32a, #f9e6b3); top: 50%; right: 10%; animation-delay: -3s; }

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
    background: var(--gradient-primary);
    padding: 32px 40px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(11, 102, 120, 0.25);
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
    font-family: var(--font-family-heading);
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
    box-shadow: 0 8px 40px rgba(11, 102, 120, 0.1);
    overflow: hidden;
  }

  .booking-form-section {
    padding: 28px 32px;
    border-bottom: 1px solid rgba(11, 102, 120, 0.07);
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

  .booking-si-teal { background: rgba(11, 102, 120, 0.12); }
  .booking-si-gold { background: rgba(241, 179, 42, 0.12); }
  .booking-si-primary { background: rgba(11, 102, 120, 0.1); }

  .booking-section-title-text {
    font-family: var(--font-family-heading);
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text);
  }

  .booking-section-subtitle {
    font-size: 12px;
    color: var(--color-text-secondary);
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
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .booking-required-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-primary);
    display: inline-block;
  }

  .booking-optional-tag {
    font-size: 10px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
    color: var(--color-text-secondary);
    background: rgba(11, 102, 120, 0.06);
    padding: 1px 7px;
    border-radius: 100px;
  }

  .booking-input-wrap { position: relative; }

  .booking-input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-primary-light);
    pointer-events: none;
    transition: color 0.3s;
  }

  .booking-input-wrap:focus-within .booking-input-icon {
    color: var(--color-primary);
  }

  .booking-input, .booking-select, .booking-textarea {
    width: 100%;
    background: rgba(255,255,255,0.88);
    border: 1.5px solid var(--color-border);
    border-radius: 14px;
    padding: 13px 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    color: var(--color-text);
    outline: none;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(11, 102, 120, 0.05);
    appearance: none;
    -webkit-appearance: none;
  }

  .booking-input-wrap .booking-input {
    padding-left: 42px;
  }

  .booking-input.no-icon, .booking-select.no-icon, .booking-textarea.no-icon {
    padding-left: 16px;
  }

  .booking-input::placeholder, .booking-textarea::placeholder {
    color: var(--color-text-secondary);
    opacity: 0.6;
  }

  .booking-input:focus, .booking-select:focus, .booking-textarea:focus {
    border-color: rgba(11, 102, 120, 0.45);
    background: #fff;
    box-shadow: 0 0 0 4px rgba(11, 102, 120, 0.08), 0 2px 8px rgba(11, 102, 120, 0.08);
  }

  .booking-phone-wrap { display: flex; gap: 10px; }

  .booking-phone-prefix {
    background: rgba(255,255,255,0.88);
    border: 1.5px solid var(--color-border);
    border-radius: 14px;
    padding: 13px 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    min-width: 70px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(11, 102, 120, 0.05);
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
    border-top: 6px solid var(--color-primary-light);
    pointer-events: none;
    transition: border-color 0.3s;
  }

  .booking-select-wrap:focus-within::after {
    border-top-color: var(--color-primary);
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
    border: 2px dashed rgba(11, 102, 120, 0.22);
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    background: rgba(11, 102, 120, 0.03);
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .booking-file-upload-area:hover {
    border-color: rgba(11, 102, 120, 0.45);
    background: rgba(11, 102, 120, 0.06);
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

  .booking-file-icon { font-size: 28px; margin-bottom: 8px; color: var(--color-primary); }
  .booking-file-label { font-size: 14px; font-weight: 600; color: var(--color-primary); margin-bottom: 3px; }
  .booking-file-hint { font-size: 12px; color: #6a7280; }

  .booking-btn-gps {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 13px 20px;
    border-radius: 14px;
    border: 1.5px solid rgba(11, 102, 120, 0.22);
    background: rgba(11, 102, 120, 0.05);
    color: var(--color-primary);
    font-family: var(--font-family-sans);
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
    background: linear-gradient(135deg, rgba(11, 102, 120, 0.08), rgba(241, 179, 42, 0.08));
    opacity: 0;
    transition: opacity 0.3s;
  }

  .booking-btn-gps:hover {
    border-color: rgba(11, 102, 120, 0.45);
    background: rgba(11, 102, 120, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(11, 102, 120, 0.15);
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
    background: var(--gradient-primary);
    color: white;
    font-family: var(--font-family-sans);
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 8px 28px rgba(11, 102, 120, 0.3);
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
    box-shadow: 0 16px 48px rgba(11, 102, 120, 0.38);
  }

  .booking-btn-submit:hover::before { left: 160%; }

  .booking-btn-submit:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 4px 16px rgba(11, 102, 120, 0.2);
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
  header: "var(--color-primary)",
  panel: "rgba(11, 102, 120, 0.08)",
  surface: "rgba(255,255,255,0.62)",
  primary: "var(--color-primary)",
  accent: "var(--color-gold)",
  success: "var(--color-success)",
  danger: "var(--color-danger)",
  textPrimary: "var(--color-text)",
  textSecondary: "var(--color-text-secondary)",
  muted: "var(--color-text-secondary)",
  border: "var(--color-border)",
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
  const { branches } = useGlobalRefresh();
  const [branchName, setBranchName] = useState(
    sessionStorage.getItem('role') !== 'admin' && sessionStorage.getItem('role') !== 'bigadmin'
      ? sessionStorage.getItem('branch_name') || ''
      : ''
  );

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
  const [jobCategory, setJobCategory] = useState(["normal_service"]);


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
    discount_value: 0,
    discount_type: "percentage",
    serial_no: ""
  });

  // Clear selected product when branch changes
  useEffect(() => {
    setNewProduct(prev => ({
      ...prev,
      productName: ""
    }));
    setLowStockWarning(null);
  }, [branchName]);

  // Fetch stock items for multi-product selection
  const [stockItems, setStockItems] = useState([]);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", isError: false });

  // Low stock alert state
  const [lowStockWarning, setLowStockWarning] = useState(null);

  // Validation warnings
  const [productNotAddedWarning, setProductNotAddedWarning] = useState(false);
  const [jobTypeError, setJobTypeError] = useState("");

  // Booking Success Modal state
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [showBookingSuccessModal, setShowBookingSuccessModal] = useState(false);

  // Job Types state
  const [jobTypes, setJobTypes] = useState([]);

  // Fetch job types
  useEffect(() => {
    const fetchJobTypes = async () => {
      try {
        const response = await api.get('/job-types/');
        setJobTypes(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching job types:', error);
      }
    };
    fetchJobTypes();
  }, []);

  /* --- Scroll Refs for Modals --- */
  const bookingSuccessModalRef = useScrollToRef(showBookingSuccessModal);
  const warrantyModalRef = useScrollToRef(warrantyModal.show);

  // Calculate discounted price - prevents loss (price cannot go below buying price or minimum price)
  const calculateFinalPrice = (sellingPrice, buyingPrice, discountValue, discountType = "percentage", minimumPrice = 0) => {
    if (!discountValue || discountValue <= 0) {
      return sellingPrice;
    }

    let discountedPrice = sellingPrice;
    if (discountType === "percentage") {
      discountedPrice = sellingPrice - (sellingPrice * discountValue / 100);
    } else if (discountType === "amount") {
      discountedPrice = sellingPrice - discountValue;
    }

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
  const getMaxDiscount = (sellingPrice, buyingPrice, minimumPrice = 0, type = "percentage") => {
    if (!sellingPrice || sellingPrice <= 0) {
      return 0;
    }
    const minAllowedPrice = minimumPrice > 0 ? Math.max(minimumPrice, buyingPrice) : buyingPrice;

    if (sellingPrice <= minAllowedPrice) return 0;

    if (type === "amount") {
      return sellingPrice - minAllowedPrice;
    }
    // percentage
    return Math.floor(((sellingPrice - minAllowedPrice) / sellingPrice) * 100);
  };
  // Get minimum price for a product
  const getMinimumPrice = (productName) => {
    const item = getStockItem(productName);
    return item?.minimum_price || 0;
  };

  // Check if product is a motor
  const isMotorProduct = (prodName) => {
    if (!prodName) return false;
    const name = prodName.toLowerCase();
    return name.includes('motor') || name.includes('winding') || name.includes('rewinding');
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

  // Update selected product and check stock when newProduct.productName changes
  useEffect(() => {
    if (newProduct.productName) {
      const targetBranch = branchName || "Main Branch";
      const stockItem = stockItems.find(item =>
        item.name === newProduct.productName &&
        (item.branch_name || "Main Branch") === targetBranch
      );

      if (stockItem) {
        const isLow = stockItem.quantity <= stockItem.minimum_threshold;
        const isOut = stockItem.quantity === 0;

        if (isOut) {
          setLowStockWarning({
            type: 'danger',
            message: `CRITICAL: ${newProduct.productName} is currently OUT OF STOCK!`,
            available: 0
          });
        } else if (isLow) {
          setLowStockWarning({
            type: 'warning',
            message: `LOW STOCK ALERT: Only ${stockItem.quantity} ${stockItem.unit} remaining (Minimum: ${stockItem.minimum_threshold})`,
            available: stockItem.quantity
          });
        } else {
          setLowStockWarning(null);
        }
      } else {
        setLowStockWarning(null);
      }
    } else {
      setLowStockWarning(null);
    }
  }, [newProduct.productName, stockItems, branchName]);

  // Check if requested quantity exceeds available stock
  useEffect(() => {
    if (newProduct.productName && newProduct.quantity > 0) {
      const targetBranch = branchName || "Main Branch";
      const stockItem = stockItems.find(item =>
        item.name === newProduct.productName &&
        (item.branch_name || "Main Branch") === targetBranch
      );
      if (stockItem && newProduct.quantity > stockItem.quantity) {
        setLowStockWarning({
          type: 'danger',
          message: `INSUFFICIENT STOCK: You requested ${newProduct.quantity} but only ${stockItem.quantity} are available!`,
          available: stockItem.quantity
        });
      } else if (stockItem) {
        // Re-check low stock if not over-requested
        const isLow = stockItem.quantity <= stockItem.minimum_threshold;
        if (isLow) {
          setLowStockWarning({
            type: 'warning',
            message: `LOW STOCK ALERT: Only ${stockItem.quantity} ${stockItem.unit} remaining (Minimum: ${stockItem.minimum_threshold})`,
            available: stockItem.quantity
          });
        } else {
          setLowStockWarning(null);
        }
      }
    }
  }, [newProduct.quantity, newProduct.productName, stockItems, branchName]);

  // Fetch stock information for a product
  const fetchStockInfo = async (productName) => {
    try {
      const response = await api.get('stocks/');
      const stockItems = response.data;

      // Find stock item by product name and branch
      const targetBranch = branchName || "Main Branch";
      const stockItem = stockItems.find(item =>
        item.name === productName &&
        (item.branch_name || "Main Branch") === targetBranch
      );

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

  // Get stock item for a product (branch-aware)
  const getStockItem = (productName) => {
    const targetBranch = branchName || "Main Branch";
    return stockItems.find(item =>
      item.name === productName &&
      (item.branch_name || "Main Branch") === targetBranch
    );
  };

  // Get selling price for a product
  const getSellingPrice = (productName, brandName = null) => {
    const item = getStockItem(productName);
    return item?.selling_price || 0;
  };

  // Get buying price for a product
  const getBuyingPrice = (productName, brandName = null) => {
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

    // ⭐ NEW: Stock Minimum Threshold Validation
    const stockItem = getStockItem(newProduct.productName);
    if (stockItem) {
      const currentQty = stockItem.quantity || 0;
      const minThreshold = stockItem.minimum_threshold || 0;
      const requestedQty = parseInt(newProduct.quantity) || 0;

      if (currentQty - requestedQty < minThreshold) {
        showToast(`⚠️ Cannot add product. Stock level would fall below the minimum threshold of ${minThreshold}. Current stock: ${currentQty}`, true);
        return;
      }
    }

    // Get the selling price and buying price from stock
    const sellingPrice = getSellingPrice(newProduct.productName);
    const buyingPrice = getBuyingPrice(newProduct.productName);
    const minimumPrice = getMinimumPrice(newProduct.productName);
    const maxDiscount = getMaxDiscount(sellingPrice, buyingPrice, minimumPrice, newProduct.discount_type || "percentage");
    const discountValue = parseFloat(newProduct.discount_value) || 0;

    // Calculate final price with discount validation
    let finalPrice = sellingPrice;
    if (discountValue > 0) {
      const calculatedPrice = calculateFinalPrice(sellingPrice, buyingPrice, discountValue, newProduct.discount_type || "percentage", minimumPrice);
      if (calculatedPrice === null) {
        const typeStr = newProduct.discount_type === "amount" ? "₹" : "%";
        showToast(`⚠️ Discount too high! Maximum allowed is ${maxDiscount}${typeStr}. Price cannot be below buying price (₹${buyingPrice}).`, true);
        return;
      }
      finalPrice = calculatedPrice;
    }

    setSelectedProducts([...selectedProducts, {
      ...newProduct,
      quantity: parseInt(newProduct.quantity),
      selling_price: sellingPrice,
      buying_price: buyingPrice,
      discount_value: discountValue,
      discount_type: newProduct.discount_type || "percentage",
      final_price: finalPrice,
      total: finalPrice * parseInt(newProduct.quantity),
      serial_no: newProduct.serial_no || ""
    }]);
    setNewProduct({ productName: "", quantity: 1, discount_value: 0, discount_type: "percentage", serial_no: "" });
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
    formData.append('job_category', Array.isArray(jobCategory) ? jobCategory.join(', ') : jobCategory);
    if (branchName) formData.append('branch_name', branchName);

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
      border: "none",
      outline: "none",
      padding: 0,
      width: "100%",
      backgroundColor: "transparent",
      appearance: "none",
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
      border: "none",
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
          <motion.div
            className="booking-form-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="booking-section-label">
              <div className="booking-section-icon booking-si-teal">
                <FiUser />
              </div>
              <div className="booking-section-title-wrap">
                <div className="booking-section-title-text">Customer Information</div>
                <div className="booking-section-subtitle">Basic details about the service Requester</div>
              </div>
            </div>

            <div className="booking-fields-grid two-col">
              <div className="booking-field">
                <label>Phone Number <div className="booking-required-dot"></div></label>
                <div className="booking-input-wrap">
                  <div className="booking-input-icon"><FiPhone size={16} /></div>
                  <input
                    className="booking-input"
                    type="tel"
                    placeholder="10 digit mobile number"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    maxLength={13}
                  />
                </div>
                {phoneError && <span className="booking-error-hint">{phoneError}</span>}
                {isVerifyingPhone && <span className="booking-status-hint">Verifying...</span>}
              </div>

              <div className="booking-field">
                <label>Full Name <div className="booking-required-dot"></div></label>
                <div className="booking-input-wrap">
                  <div className="booking-input-icon"><FiUser size={16} /></div>
                  <input
                    className="booking-input"
                    type="text"
                    placeholder="Enter full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="booking-fields-grid two-col" style={{ marginTop: '18px' }}>
              <div className="booking-field">
                <label>Email Address <span className="booking-optional-tag">Optional</span></label>
                <div className="booking-input-wrap">
                  <div className="booking-input-icon"><FiMail size={16} /></div>
                  <input
                    className="booking-input"
                    type="email"
                    placeholder="example@gmail.com"
                    value={customerEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                  />
                </div>
                {emailError && <span className="booking-error-hint">{emailError}</span>}
              </div>

              <div className="booking-field">
                <label>Alternate Number <span className="booking-optional-tag">Optional</span></label>
                <div className="booking-input-wrap">
                  <div className="booking-input-icon"><FiPhone size={16} /></div>
                  <input
                    className="booking-input"
                    type="tel"
                    placeholder="Secondary contact"
                    value={alternateNumber}
                    onChange={(e) => handleAlternateNumberChange(e.target.value)}
                    onBlur={handleAlternateNumberBlur}
                    maxLength={13}
                  />
                </div>
              </div>
            </div>

            <div className="booking-fields-grid two-col" style={{ marginTop: '18px' }}>
              <div className="booking-field">
                <label>Customer Type</label>
                <div className="booking-select-wrap">
                  <select
                    className="booking-select"
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                  >
                    <option value="our_customer">Our Customer</option>
                    <option value="external_customer">External Customer</option>
                  </select>
                </div>
              </div>

              <div className="booking-field">
                <label>Branch</label>
                <div className="booking-select-wrap">
                  <select
                    className="booking-select"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                  >
                    <option value="">Default: Main Branch</option>
                    {branches?.map(b => (
                      <option key={b.branch_id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="booking-form-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="booking-section-label">
              <div className="booking-section-icon booking-si-gold">
                <FiPackage />
              </div>
              <div className="booking-section-title-wrap">
                <div className="booking-section-title-text">Service Details</div>
                <div className="booking-section-subtitle">Information about the job and products</div>
              </div>
            </div>

            <div className="booking-fields-grid two-col">
              <div className="booking-field">
                <label>Service Type</label>
                <div className="booking-select-wrap">
                  <select
                    className="booking-select"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    <option value="in_service">At Service Center</option>
                    <option value="out_service">At Customer Location</option>
                  </select>
                </div>
              </div>

              <div className="booking-field" style={{ width: '100%' }}>
                <label>Job Type <div className="booking-required-dot"></div></label>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginTop: '6px'
                }}>
                  {jobTypes.map((type) => {
                    const isSelected = Array.isArray(jobCategory) ? jobCategory.includes(type.name) : jobCategory === type.name;
                    return (
                      <button
                        key={type.id || type.name}
                        type="button"
                        onClick={() => {
                          let currentSelected = Array.isArray(jobCategory) ? [...jobCategory] : [jobCategory];
                          if (currentSelected.includes(type.name)) {
                            currentSelected = currentSelected.filter(name => name !== type.name);
                          } else {
                            currentSelected.push(type.name);
                          }
                          setJobCategory(currentSelected);
                          setJobTypeError("");
                        }}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '20px',
                          border: isSelected ? '2px solid var(--color-primary, #0b6678)' : '1.5px solid var(--color-border, #e5e7eb)',
                          background: isSelected ? 'rgba(11, 102, 120, 0.1)' : 'var(--color-white, #fff)',
                          color: isSelected ? 'var(--color-primary, #0b6678)' : 'var(--color-text, #1f2937)',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 10px rgba(11, 102, 120, 0.15)' : 'none'
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{type.name}
                      </button>
                    );
                  })}
                </div>
                {jobTypeError && <span className="booking-error-hint">{jobTypeError}</span>}
              </div>
            </div>


            {/* Warranty Section - Only show for Our Customer */}
            {customerType === "our_customer" && (
              <div className="booking-form-card" style={{
                background: 'rgba(212, 175, 55, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                padding: '24px',
                marginTop: '20px',
                marginBottom: '20px'
              }}>
                <div className="booking-section-label" style={{ marginBottom: '20px' }}>
                  <div className="booking-section-icon booking-si-gold">
                    <FiImage />
                  </div>
                  <div className="booking-section-title-wrap">
                    <div className="booking-section-title-text" style={{ color: 'var(--color-gold)' }}>Warranty details</div>
                    <div className="booking-section-subtitle">Add proof for our registered customers</div>
                  </div>
                </div>

                <div className="booking-fields-grid two-col">
                  <div className="booking-field">
                    <label>Warranty Photo</label>
                    <div className="booking-file-upload-area">
                      <FiImage className="booking-file-icon" />
                      <div className="booking-file-label">
                        {warrantyPhoto ? warrantyPhoto.name : 'Choose Warranty Photo'}
                      </div>
                      <div className="booking-file-hint">PNG, JPG or JPEG (Max 5MB)</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setWarrantyPhoto(e.target.files[0])}
                      />
                    </div>
                  </div>

                  <div className="booking-field">
                    <label>Expiry Date</label>
                    <div className="booking-input-wrap">
                      <div className="booking-input-icon"><FiCalendar size={16} /></div>
                      <input
                        className="booking-input"
                        type="date"
                        value={warrantyDate}
                        onChange={(e) => setWarrantyDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Add Products */}
            <div className="booking-field" style={{ marginTop: '22px' }}>
              <label>Products & Parts <span className="booking-optional-tag">Optional</span></label>
              <div className="product-selection-modern" style={{
                background: 'rgba(11, 102, 120, 0.04)',
                borderRadius: '18px',
                padding: '24px',
                border: '1px solid rgba(11, 102, 120, 0.08)'
              }}>
                {/* Selected Products List */}
                {selectedProducts.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    {selectedProducts.map((prod, index) => (
                      <div key={index} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "white",
                        borderRadius: "14px",
                        marginBottom: "10px",
                        boxShadow: "var(--shadow-sm)",
                        border: "1px solid rgba(11, 102, 120, 0.1)"
                      }}>
                        <div>
                          <span style={{ fontWeight: "700", color: 'var(--color-text)' }}>{prod.productName}</span>
                          <span style={{ marginLeft: "10px", color: 'var(--color-text-secondary)', fontSize: '13px' }}>× {prod.quantity}</span>
                          <span style={{ marginLeft: "10px", color: 'var(--color-success)', fontWeight: "700" }}>
                            ₹{((prod.final_price || prod.selling_price) * prod.quantity).toFixed(2)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "none",
                            borderRadius: "100px",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#ef4444"
                          }}
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ))}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      background: "var(--gradient-primary)",
                      color: "white",
                      borderRadius: "16px",
                      fontWeight: "700",
                      boxShadow: "0 8px 20px rgba(11, 102, 120, 0.2)"
                    }}>
                      <span>Estimated Total</span>
                      <span style={{ fontSize: "20px" }}>₹{calculateTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="product-input-grid" style={{ display: 'grid', gap: '14px' }}>
                  <div className="booking-field">
                    <select
                      className="booking-select"
                      value={newProduct.productName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setNewProduct({
                          productName: name,
                          quantity: 1,
                          discount_value: 0,
                          discount_type: "percentage"
                        });
                      }}
                    >
                      <option value="">— Select Product —</option>
                      {stockItems
                        .filter(si => (si.branch_name || "Main Branch") === (branchName || "Main Branch"))
                        .map((stock) => (
                          <option key={stock.stock_id || stock.id} value={stock.name}>
                            {stock.name} {stock.quantity > 0 ? `(${stock.quantity} ${stock.unit || 'pcs'} available)` : '(Out of Stock)'}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* LOW STOCK ALERT MESSAGE */}
                  {lowStockWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: lowStockWarning.type === 'danger' ? '#fee2e2' : '#fef3c7',
                        border: `1px solid ${lowStockWarning.type === 'danger' ? '#fecaca' : '#fde68a'}`,
                        color: lowStockWarning.type === 'danger' ? '#991b1b' : '#92400e',
                        fontSize: '13px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '4px'
                      }}
                    >
                      <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
                      <span>{lowStockWarning.message}</span>
                    </motion.div>
                  )}

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="booking-field" style={{ flex: 1 }}>
                      <input
                        className="booking-input"
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={newProduct.quantity}
                        onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 1 })}
                        disabled={!newProduct.productName}
                      />
                    </div>
                    <div className="booking-field" style={{ flex: 1, display: 'flex', flexDirection: 'row', gap: '4px' }}>
                      <input
                        className="booking-input"
                        type="number"
                        placeholder="Disc"
                        value={newProduct.discount_value || ''}
                        onChange={(e) => {
                          const discount = parseFloat(e.target.value) || 0;
                          setNewProduct({ ...newProduct, discount_value: newProduct.discount_type === 'percentage' ? Math.min(100, discount) : discount });
                        }}
                        disabled={!newProduct.productName}
                        style={{ flex: 2, paddingRight: '4px', minWidth: '40px' }}
                      />
                      <select
                        className="booking-select"
                        value={newProduct.discount_type || 'percentage'}
                        onChange={(e) => {
                          const type = e.target.value;
                          const maxVal = type === 'percentage' ? 100 : Infinity;
                          setNewProduct({
                            ...newProduct,
                            discount_type: type,
                            discount_value: Math.min(newProduct.discount_value || 0, maxVal)
                          });
                        }}
                        disabled={!newProduct.productName}
                        style={{ flex: 1, paddingLeft: '8px', paddingRight: '20px', minWidth: '55px' }}
                      >
                        <option value="percentage">%</option>
                        <option value="amount">₹</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      className="booking-btn-gps"
                      style={{ width: 'auto', flex: 1 }}
                      onClick={addProduct}
                      disabled={!newProduct.productName}
                    >
                      <FiPlusCircle /> Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="booking-form-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="booking-section-label">
              <div className="booking-section-icon booking-si-primary">
                <FiMapPin />
              </div>
              <div className="booking-section-title-wrap">
                <div className="booking-section-title-text">Location & Description</div>
                <div className="booking-section-subtitle">Where and what needs to be fixed</div>
              </div>
            </div>

            <div className="booking-fields-grid">
              <div className="booking-field">
                <label>Address <div className="booking-required-dot"></div></label>
                <textarea
                  className="booking-textarea"
                  placeholder="Enter full address for service"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="booking-field">
                <label>Issue Description <div className="booking-required-dot"></div></label>
                <textarea
                  className="booking-textarea"
                  placeholder="Tell us what the problem is..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <div className="booking-field">
                <label>Remarks <span className="booking-optional-tag">Optional</span></label>
                <input
                  className="booking-input"
                  placeholder="Any additional notes?"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '14px',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <FiAlertCircle /> {formError}
              </div>
            )}
          </motion.div>

          <div className="booking-form-footer">
            <button
              type="submit"
              className="booking-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit Service Booking <FiSend className="arrow" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* PREVIOUS BOOKINGS SECTION */}
        {(previousBookings.length > 0 || bookingData) && (
          <section className="previous-bookings-modern" style={{ marginTop: '40px' }}>
            <h2 className="booking-hero-title" style={{ color: 'var(--color-primary)', fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
              Booking <em>History</em>
            </h2>
            <div className="booking-fields-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {previousBookings.map((booking, index) => (
                <div key={index} className="booking-form-card" style={{ marginBottom: '0' }}>
                  <div className="booking-form-section" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--color-primary)' }}>{booking.complaint_no}</span>
                      <div className={`status-badge-modern ${booking.status?.toLowerCase() === 'completed' ? 'success' : 'pending'}`} style={{
                        padding: '4px 12px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: booking.status?.toLowerCase() === 'completed' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(241, 179, 42, 0.1)',
                        color: booking.status?.toLowerCase() === 'completed' ? '#28a745' : '#f1b32a'
                      }}>
                        {booking.status || 'Pending'}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                        <FiPackage color="var(--color-primary-light)" />
                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>Product:</span>
                        <span style={{ color: 'var(--color-text)' }}>{formatProductNames(booking.product_name)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                        <FiAlertCircle color="var(--color-primary-light)" />
                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>Issue:</span>
                        <span style={{ color: 'var(--color-text)' }}>{booking.details}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '13px' }}>
                        <FiCalendar color="var(--color-primary-light)" />
                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600' }}>Date:</span>
                        <span style={{ color: 'var(--color-text)' }}>{new Date(booking.date_created).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {booking.status?.toLowerCase() === 'completed' && (
                      <button
                        className="booking-btn-gps"
                        style={{ marginTop: '20px', padding: '10px' }}
                        onClick={() => navigate(`/invoice/${booking.complaint_no}`)}
                      >
                        <FiFileText /> View Invoice
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
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
