
import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useGlobalRefresh } from "../context/GlobalRefreshContext";
import { useScrollToRef } from "../hooks/useScrollToRef";
import {
  FiDatabase,
  FiAlertCircle,
  FiCheckSquare,
  FiSearch,
  FiPlusCircle,
  FiUser,
  FiClock,
  FiPhone,
  FiMail,
  FiCalendar,
  FiUserCheck,
  FiDollarSign,
  FiSave,
  FiXCircle,
  FiX,
  FiInbox,
  FiAlertTriangle,
  FiCheck,
  FiSmartphone,
  FiHash,
  FiMessageSquare,
  FiMessageCircle,
  FiShoppingBag,
  FiPackage,
  FiShoppingCart,
  FiAlertCircle as FiAlert,
  FiFileText,
  FiPlus,
  FiMinus
} from "react-icons/fi";
import StockAlerts from "../components/StockAlerts";
import { openWhatsAppWithDefaultMessage, generateStaffAssignmentMessage } from "../utils/whatsappUtils";
import { getDisplayStatus } from "../utils/statusUtils";
import "../utils/whatsappUtils.css";

/* ================= CSS STYLES ================= */
const styles = `
  /* New Dashboard UI Styles - Soft Pastel Background */
  .dashboard-container {
    min-height: 100vh;
    background: var(--gradient-bg);
    position: relative;
    overflow-x: hidden;
    font-family: var(--font-family-sans);
  }

  .dashboard-blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    opacity: 0.35;
    animation: blobFloat 12s ease-in-out infinite;
    z-index: 0;
  }

  .dashboard-blob1 { 
    width: 600px; height: 600px; 
    background: radial-gradient(circle, #b3dee6, #e6f7f9); 
    top: -200px; left: -150px; 
  }
  .dashboard-blob2 { 
    width: 500px; height: 500px; 
    background: radial-gradient(circle, #f9f0d1, #fcf8e8); 
    bottom: -150px; right: -100px; 
    animation-delay: -4s; 
  }
  .dashboard-blob3 { 
    width: 350px; height: 350px; 
    background: radial-gradient(circle, var(--color-gold, #f1b32a), #f9e6b3); 
    top: 50%; right: 10%; 
    opacity: 0.15;
    animation-delay: -8s; 
  }

  @keyframes blobFloat {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(30px,-35px) scale(1.05); }
    66% { transform: translate(-20px,25px) scale(0.95); }
  }

  @keyframes rise { 
    from { opacity:0; transform:translateY(30px); } 
    to { opacity:1; transform:translateY(0); } 
  }

  @keyframes cardShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .dashboard-page {
    max-width: 1300px;
    margin: 0 auto;
    padding: 40px 40px 80px;
    position: relative;
    z-index: 1;
  }

  .dashboard-top-bar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 32px;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) both;
    gap: 20px;
  }

  .dashboard-page-title {
    font-family: var(--font-family-heading);
    font-size: 32px;
    font-weight: 600;
    color: var(--color-text);
    letter-spacing: -0.5px;
  }

  .dashboard-page-title em {
    font-style: italic;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .dashboard-search-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .dashboard-search-container {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }

  .dashboard-search-wrap .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-primary-light);
    pointer-events: none;
    transition: color 0.3s;
    z-index: 2;
  }

  .dashboard-search-wrap:focus-within svg {
    color: var(--color-primary);
  }

  .dashboard-search-wrap input {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255,255,255,0.9);
    border-radius: 16px;
    padding: 14px 20px 14px 46px;
    font-family: var(--font-family-sans);
    font-size: 14px;
    color: var(--color-text);
    width: 280px;
    outline: none;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dashboard-search-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .dashboard-search-wrap input::placeholder { color: #9ca3af; }
  .dashboard-search-wrap input:focus {
    border-color: rgba(11, 102, 120, 0.5);
    background: rgba(255,255,255,0.95);
    box-shadow: 0 8px 30px rgba(11, 102, 120, 0.15), 0 0 0 4px rgba(11, 102, 120, 0.1);
    width: 320px;
  }

  .search-btn {
    background: var(--gradient-primary);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 14px 28px;
    font-family: var(--font-family-sans);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(11, 102, 120, 0.25);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
  }

  .search-btn:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 10px 25px rgba(11, 102, 120, 0.35);
    filter: brightness(1.1);
  }

  .search-btn:active {
    transform: translateY(-1px);
  }

  .search-btn svg {
    font-size: 16px;
  }

  .dashboard-advanced-search {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .advanced-search-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .search-field {
    position: relative;
  }

  .search-date-input,
  .search-amount-input {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(20px);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    padding: 10px 14px;
    font-family: var(--font-family-sans);
    font-size: 13px;
    color: var(--color-text);
    width: 130px;
    outline: none;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .search-date-input {
    width: 150px;
  }

  .search-date-input:focus,
  .search-amount-input:focus {
    border-color: rgba(11, 102, 120, 0.5);
    background: rgba(255,255,255,0.95);
    box-shadow: 0 8px 30px rgba(11, 102, 120, 0.15), 0 0 0 4px rgba(11, 102, 120, 0.1);
  }

  .search-date-input::placeholder,
  .search-amount-input::placeholder {
    color: var(--color-text-secondary);
    opacity: 0.6;
  }

  /* Remove spinner buttons from number inputs */
  .search-amount-input::-webkit-outer-spin-button,
  .search-amount-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .search-amount-input[type=number] {
    -moz-appearance: textfield;
  }

  .clear-search-btn {
    background: rgba(11, 102, 120, 0.15);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-primary);
    font-size: 14px;
    transition: all 0.2s;
  }

  .clear-search-btn:hover {
    background: rgba(11, 102, 120, 0.25);
    color: #084c5a;
  }

  @media (max-width: 768px) {
    .dashboard-top-bar {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    
    .dashboard-search-container {
      width: 100%;
      flex-direction: column;
    }
    
    .dashboard-search-wrap {
      width: 100%;
    }
    
    .dashboard-search-wrap input {
      width: 100%;
    }
    
    .dashboard-search-wrap input:focus {
      width: 100%;
    }
    
    .dashboard-advanced-search {
      width: 100%;
    }
    
    .advanced-search-row {
      flex-wrap: wrap;
      width: 100%;
    }
    
    .search-date-input,
    .search-amount-input {
      width: calc(50% - 4px);
    }
  }

  .dashboard-status-tabs {
    display: flex;
    align-items: center;
    gap: 14px;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both;
    margin-bottom: 36px;
    flex-wrap: wrap;
  }

  .dashboard-tab {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 24px;
    border-radius: 18px;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255,255,255,0.95);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
  }

  .dashboard-tab:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: var(--shadow-lg);
    background: rgba(255,255,255,0.95);
  }

  .dashboard-tab.active-tab {
    background: var(--gradient-primary);
    border-color: transparent;
    box-shadow: 0 12px 40px rgba(11, 102, 120, 0.3), 0 0 0 3px rgba(11, 102, 120, 0.1);
    transform: translateY(-2px);
  }

  .dashboard-tab-icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: transform 0.3s;
  }

  .dashboard-tab:hover .dashboard-tab-icon {
    transform: scale(1.1);
  }

  .dashboard-tab:not(.active-tab) .tab-icon-all { background: linear-gradient(135deg, #e6f7f9, #b3dee6); }
  .dashboard-tab:not(.active-tab) .tab-icon-pending { background: linear-gradient(135deg, rgba(241, 179, 42, 0.1), rgba(241, 179, 42, 0.2)); color: var(--color-secondary); }
  .dashboard-tab:not(.active-tab) .tab-icon-assigned { background: linear-gradient(135deg, #eef5f6, #d1e8eb); color: var(--color-primary); }
  .dashboard-tab:not(.active-tab) .tab-icon-completed { background: linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.2)); color: var(--color-success); }
  .dashboard-tab:not(.active-tab) .tab-icon-due { background: linear-gradient(135deg, #fff3cd, #ffeeba); color: #856404; }
  .dashboard-tab:not(.active-tab) .tab-icon-overdue { background: linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(220, 53, 69, 0.2)); color: var(--color-danger); }
  .dashboard-tab.active-tab .dashboard-tab-icon { background: rgba(255,255,255,0.2); }

  .dashboard-tab-info {
    display: flex;
    flex-direction: column;
  }

  .dashboard-tab-count {
    font-family: var(--font-family-heading);
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
    transition: all 0.3s;
  }

  .dashboard-tab-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
    transition: all 0.3s;
  }

  .dashboard-tab:not(.active-tab) .dashboard-tab-count { color: var(--color-text); }
  .dashboard-tab:not(.active-tab) .dashboard-tab-label { color: #6a7280; }
  .dashboard-tab.active-tab .dashboard-tab-count,
  .dashboard-tab.active-tab .dashboard-tab-label { color: white; }

  /* Complaint Cards - Enhanced Styling */
  .dashboard-complaints-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both;
  }

  .dashboard-comp-card {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--color-border);
    border-radius: 28px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .dashboard-comp-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 28px;
    padding: 2px;
    background: linear-gradient(135deg, rgba(11, 102, 120, 0.3), rgba(241, 179, 42, 0.3));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.4s;
  }

  .dashboard-comp-card:hover {
    transform: translateY(-8px) scale(1.01);
    box-shadow: var(--shadow-lg);
  }

  .dashboard-comp-card:hover::before {
    opacity: 1;
  }

  .dashboard-comp-card-strip {
    height: 6px;
    border-radius: 0;
    transition: height 0.3s;
  }

  .dashboard-comp-card:hover .dashboard-comp-card-strip {
    height: 8px;
  }

  .strip-assigned { 
    background: var(--gradient-primary); 
    background-size: 200% 100%;
    animation: cardShimmer 3s infinite linear;
  }
  .strip-completed { 
    background: linear-gradient(90deg, #48c78e, #3ab07a, #6dd3a0); 
    background-size: 200% 100%;
    animation: cardShimmer 3s infinite linear;
  }
  .strip-pending { 
    background: linear-gradient(90deg, #ffb347, #ff9500, #ffc56b); 
    background-size: 200% 100%;
    animation: cardShimmer 3s infinite linear;
  }

  .dashboard-comp-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 26px 18px;
    border-bottom: 1px solid rgba(11, 102, 120, 0.08);
  }

  .dashboard-comp-id {
    font-family: var(--font-family-heading);
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: 0.5px;
  }

  .dashboard-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    transition: all 0.3s;
  }

  .badge-assigned { 
    background: linear-gradient(135deg, #eef5f6, #d1e8eb); 
    color: #0b6678; 
    box-shadow: 0 2px 10px rgba(11, 102, 120, 0.15);
  }
  .badge-completed { 
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    color: #48c78e; 
    box-shadow: 0 4px 20px rgba(72, 199, 142, 0.12);
  }
  .badge-pending { 
    background: linear-gradient(135deg, #fff4e6, #ffe8cc); 
    color: #b86b00; 
    box-shadow: 0 2px 10px rgba(255,179,71,0.2);
  }
  .badge-due { 
    background: linear-gradient(135deg, #fff3cd, #ffeeba); 
    color: #856404; 
    box-shadow: 0 2px 10px rgba(255,193,7,0.2);
  }
  .badge-overdue { 
    background: linear-gradient(135deg, #f8d7da, #f5c6cb); 
    color: #721c24; 
    box-shadow: 0 2px 10px rgba(220,53,69,0.2);
  }

  .dashboard-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.2); }
  }

  .badge-assigned .dashboard-badge-dot { background: #0b6678; }
  .badge-completed .dashboard-badge-dot { background: #48c78e; }
  .badge-pending .dashboard-badge-dot { background: #f1b32a; }
  .badge-due .dashboard-badge-dot { background: #ffc107; }
  .badge-overdue .dashboard-badge-dot { background: #dc3545; }

  /* Payment Status Badges - Larger font for better visibility */
  .dashboard-payment-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    transition: all 0.3s;
    margin-top: 8px;
  }

  .payment-badge-paid { 
    background: linear-gradient(135deg, #d4edda, #c3e6cb); 
    color: #155724; 
    box-shadow: 0 2px 10px rgba(40, 167, 69, 0.2);
  }
  .payment-badge-due { 
    background: linear-gradient(135deg, #fff3cd, #ffeeba); 
    color: #856404; 
    box-shadow: 0 2px 10px rgba(255, 193, 7, 0.2);
  }
  .payment-badge-overdue { 
    background: linear-gradient(135deg, #f8d7da, #f5c6cb); 
    color: #721c24; 
    box-shadow: 0 2px 10px rgba(220, 53, 69, 0.2);
  }

  .payment-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .payment-badge-paid .payment-badge-dot { background: #28a745; }
  .payment-badge-due .payment-badge-dot { background: #ffc107; }
  .payment-badge-overdue .payment-badge-dot { background: #dc3545; }

  .dashboard-comp-body {
    padding: 20px 26px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .dashboard-info-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(11, 102, 120, 0.05);
    transition: background 0.3s;
    border-radius: 8px;
    margin: 0 -4px;
    padding-left: 8px;
    padding-right: 8px;
  }

  .dashboard-info-row:last-child { border-bottom: none; }

  .dashboard-info-row:hover {
    background: rgba(11, 102, 120, 0.04);
  }

  .dashboard-info-key {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #6a7280;
    min-width: 120px;
    flex-shrink: 0;
  }

  .dashboard-info-key svg { 
    color: var(--color-primary-light); 
    flex-shrink: 0;
    transition: transform 0.3s;
  }

  .dashboard-info-row:hover .dashboard-info-key svg {
    transform: scale(1.2);
    color: var(--color-primary);
  }

  .dashboard-info-val {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    text-align: right;
    line-height: 1.5;
    max-width: 60%;
  }

  .dashboard-info-val.mono { 
    font-family: var(--font-family-heading); 
    font-size: 15px; 
    color: #374151;
  }

  /* Products section */
  .dashboard-products-section {
    margin: 0 26px 20px;
    background: linear-gradient(135deg, rgba(11, 102, 120, 0.04), rgba(241, 179, 42, 0.04));
    border: 1px solid rgba(11, 102, 120, 0.1);
    border-radius: 18px;
    overflow: hidden;
  }

  .dashboard-products-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--color-primary);
    padding: 14px 20px 12px;
    border-bottom: 1px solid rgba(11, 102, 120, 0.08);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dashboard-product-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(11, 102, 120, 0.05);
    font-size: 14px;
    transition: background 0.3s;
  }

  .dashboard-product-item:last-child { border-bottom: none; }
  .dashboard-product-item:hover { background: rgba(11, 102, 120, 0.04); }
  
  .dashboard-product-name { 
    font-weight: 600; 
    color: var(--color-text); 
    display: flex; 
    align-items: center; 
    gap: 10px; 
  }
  .dashboard-product-name::before { 
    content: ''; 
    width: 8px; 
    height: 8px; 
    border-radius: 50%; 
    background: var(--gradient-primary); 
    flex-shrink: 0; 
  }
  .dashboard-product-qty { 
    font-size: 13px; 
    font-weight: 700; 
    color: white; 
    background: var(--gradient-primary); 
    padding: 4px 12px; 
    border-radius: 100px; 
    box-shadow: 0 2px 8px rgba(11, 102, 120, 0.2);
  }

  /* WhatsApp button */
  .dashboard-comp-footer { 
    padding: 0 26px 22px; 
  }

  .dashboard-btn-whatsapp {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 24px;
    border-radius: 16px;
    background: linear-gradient(135deg, #25d366, #1db954);
    color: white;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 24px rgba(37,211,102,0.35);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
    font-family: var(--font-family-sans);
  }

  .dashboard-btn-whatsapp:hover { 
    transform: translateY(-3px) scale(1.02); 
    box-shadow: 0 12px 36px rgba(37,211,102,0.45);
  }

  .dashboard-btn-whatsapp:active {
    transform: translateY(-1px) scale(1);
  }

  /* Amount chip */
  .dashboard-amount-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    color: var(--color-primary);
    font-weight: 700;
    font-size: 15px;
    padding: 5px 14px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(11, 102, 120, 0.12);
  }

  /* Responsive */
  @media (max-width: 1100px) {
    .dashboard-complaints-grid { grid-template-columns: 1fr; }
  }
  
  @media (max-width: 768px) {
    .dashboard-status-tabs { gap: 10px; }
    .dashboard-page { padding: 24px 20px 60px; }
    .dashboard-top-bar { flex-direction: column; gap: 16px; align-items: stretch; }
    .dashboard-search-wrap input { width: 100%; }
    .dashboard-search-wrap input:focus { width: 100%; }
  }

  /* Original Product Purchase Styles */
  .booked-product-section {
    background: #e8f5e9;
    border: 1px solid #c8e6c9;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .additional-product-section {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .section-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .product-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .product-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-label {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
  }

  .read-only-field {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
    color: #374151;
  }

  .product-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  .form-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 6px;
    font-size: 14px;
    background: white;
  }

  .form-input[disabled] {
    background-color: #e9ecef;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .stock-status-display {
    margin-top: 8px;
  }

  .stock-status {
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stock-status.available {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    color: var(--color-primary);
    box-shadow: 0 4px 20px rgba(11, 102, 120, 0.12);
  }

  .stock-status.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .payment-section {
    margin-bottom: 16px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
  }

  .form-input, .form-textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 8px 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 12px;
  }

  .complete-button {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 0.2s;
  }

  .complete-button:hover {
    opacity: 0.9;
  }

  .button-primary.complete-button {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    color: var(--color-primary);
    box-shadow: 0 4px 20px rgba(11, 102, 120, 0.12);
  }

  .button-primary.complete-button:hover {
    background: rgba(255, 255, 255, 0.85);
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Products Summary Styles */
  .products-summary {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
  }

  .products-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .product-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
  }

  .product-item.additional {
    background: #fffbeb;
    border-color: #f59e0b;
  }

  /* Selected Products List Styles */
  .selected-products-list {
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
  }

  .selected-product-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 8px;
  }

  .selected-product-item .product-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .selected-product-item .product-name {
    font-weight: 600;
    color: #374151;
  }

  .selected-product-item .product-qty {
    color: #6b7280;
    font-size: 14px;
  }

  .selected-product-item .product-price {
    color: #059669;
    font-weight: 600;
  }

  .remove-product-btn {
    background: #fee2e2;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-product-btn:hover {
    background: #fecaca;
  }

  .selected-products-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #059669;
    color: white;
    border-radius: 6px;
    font-weight: 600;
    margin-top: 8px;
  }

  .selected-products-total .total-amount {
    font-size: 18px;
  }

  /* Product Add Form Styles */
  .product-add-form {
    margin-top: 12px;
  }

  .add-product-btn {
    background: #059669;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 16px;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
  }

  .add-product-btn:hover:not(:disabled) {
    background: #047857;
  }

  .add-product-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .product-name {
    font-weight: 500;
    color: #374151;
  }

  .product-quantity {
    font-weight: 600;
    color: #059669;
  }

  .no-products {
    padding: 8px 12px;
    text-align: center;
    color: #6b7280;
    font-style: italic;
  }

  /* Enhanced Products Display Styles - Compact */
  .products-purchased-section {
    background: linear-gradient(135deg, rgba(11, 102, 120, 0.03), rgba(241, 179, 42, 0.03));
    border: 1px solid rgba(11, 102, 120, 0.1);
    border-radius: 8px;
    overflow: hidden;
    margin-top: 8px;
  }

  .products-purchased-header {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-primary);
    padding: 8px 10px;
    border-bottom: 1px solid rgba(11, 102, 120, 0.1);
    display: flex;
    alignItems: 'center';
    gap: 4px;
  }

  .product-detail-row {
    display: grid;
    grid-template-columns: 2fr 0.5fr 0.8fr 0.8fr;
    gap: 4px;
    padding: 6px 10px;
    font-size: 10px;
    border-bottom: 1px solid rgba(11, 102, 120, 0.05);
    align-items: center;
  }

  .product-detail-row:last-child {
    border-bottom: none;
  }

  .product-detail-row.header-row {
    background: rgba(11, 102, 120, 0.05);
    font-weight: 600;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-secondary);
    padding: 5px 10px;
  }

  .product-detail-name {
    font-weight: 600;
    color: #374151;
    font-size: 10px;
  }

  .product-detail-qty {
    color: #6b7280;
    text-align: center;
    font-size: 10px;
  }

  .product-detail-price {
    color: #6b7280;
    text-align: right;
    font-size: 10px;
  }

  .product-detail-subtotal {
    font-weight: 600;
    color: #059669;
    text-align: right;
    font-size: 10px;
  }

  .product-detail-row.booked {
    background: rgba(5,150,105,0.03);
  }

  .product-detail-row.additional {
    background: rgba(245,158,11,0.05);
  }

  .product-detail-row.additional .product-detail-subtotal {
    color: #d97706;
  }

  .products-total-section {
    border-top: 1px solid rgba(11, 102, 120, 0.1);
    padding: 8px 10px;
    background: rgba(11, 102, 120, 0.02);
  }

  .total-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 0;
    font-size: 10px;
  }

  .total-line.booking-total {
    color: #059669;
  }

  .total-line.additional-total {
    color: #d97706;
  }

  .total-line.client-amount {
    color: #0891b2;
  }

  .total-line.grand-total {
    border-top: 1px solid rgba(11, 102, 120, 0.1);
    margin-top: 8px;
    padding-top: 12px;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-primary);
  }

  .total-line.grand-total .total-value {
    font-size: 14px;
  }

  .total-value {
    font-weight: 600;
  }

  .products-category-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .products-category-label.booking {
    background: rgba(5,150,105,0.08);
    color: #059669;
  }

  .products-category-label.additional {
    background: rgba(245,158,11,0.08);
    color: #d97706;
  }
`;

/* ================= FILTER OPTIONS ================= */
const FILTER_OPTIONS = [
  { label: "Total", value: "all", icon: <FiDatabase /> },
  { label: "Pending", value: "pending", icon: <FiInbox /> },
  { label: "Assigned", value: "assigned", icon: <FiUserCheck /> },
  { label: "Completed", value: "completed", icon: <FiCheckSquare /> },
  { label: "Due", value: "due", icon: <FiClock /> },
  { label: "Overdue", value: "overdue", icon: <FiAlertCircle /> }
];

/* ================= REUSABLE INFO ROW ================= */
const InfoRow = ({ icon, label, value }) => (
  <div className="info-row">
    <span className="info-row-icon">{icon}</span>
    <span className="info-row-label">{label}</span>
    <span className="info-row-value">{value || "N/A"}</span>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { refreshTriggers } = useGlobalRefresh();

  const [complaints, setComplaints] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [client_amount, setclient_amount] = useState("");
  const [completed_remarks, setCompletedRemarks] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchAmountFrom, setSearchAmountFrom] = useState("");
  const [searchAmountTo, setSearchAmountTo] = useState("");
  const [showAddJobModal, setShowAddJobModal] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amountReceived: 0,
    paymentMode: '',
    paymentDueDate: ''
  });
  // New state for sequential payment tracking
  const [previousDueAmount, setPreviousDueAmount] = useState(0);
  // Dynamic calculated due (updates as user types)
  const [calculatedDue, setCalculatedDue] = useState(0);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // ⭐ NEW: Payment History Modal State
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [paymentHistoryData, setPaymentHistoryData] = useState(null);


  /* --- Scroll Refs for Modals --- */
  const paymentModalRef = useScrollToRef(showPaymentModal);
  const paymentHistoryModalRef = useScrollToRef(showPaymentHistoryModal);
  const addJobModalRef = useScrollToRef(showAddJobModal);

  const [newJob, setNewJob] = useState({
    complaint_no: "",
    customer_number: "",
    customer_name: "",
    customer_email: "",
    product_name: "",
    customer_address: "",
    complaint_details: "",
    assigned_staff: "",
  });

  // Product State
  const [products, setProducts] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  // Additional Product Purchase State (for completion) - Now supports multiple products
  const [selectedAdditionalProducts, setSelectedAdditionalProducts] = useState([]);
  const [additionalProductError, setAdditionalProductError] = useState("");

  // ✅ NEW: Staff Incentive state
  const [staffIncentive, setStaffIncentive] = useState("");

  // ✅ NEW: Expired / Scrap Items collected from customer
  const [expiredItems, setExpiredItems] = useState([]);
  const [newExpiredItem, setNewExpiredItem] = useState({ name: "", buying_price: "" });
  const [jobTypes, setJobTypes] = useState([]);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", isError: false });

  // Show toast notification
  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: "", isError: false }), 3500);
  };

  // Temporary state for adding a new additional product
  const [newAdditionalProduct, setNewAdditionalProduct] = useState({
    productName: "",
    quantity: 1,
    discount_value: 0,
    discount_type: "percentage",
    brand_name: "",
    brand_id: null,
    serial_no: ""
  });

  // Helper functions for discount calculation
  const getBuyingPriceForAdditional = (productName) => {
    const stockItem = getStockItemForAdditional(productName);
    return stockItem?.buying_price || 0;
  };

  // Get minimum price for a product from stock
  const getMinimumPriceForAdditional = (productName) => {
    const stockItem = getStockItemForAdditional(productName);
    return stockItem?.minimum_price || 0;
  };

  const calculateFinalPriceForAdditional = (sellingPrice, buyingPrice, discountValue, discountType = "percentage", minimumPrice = 0) => {
    if (!discountValue || discountValue <= 0) {
      return sellingPrice;
    }
    let discountedPrice = sellingPrice;
    if (discountType === "percentage") {
      discountedPrice = sellingPrice - (sellingPrice * discountValue / 100);
    } else if (discountType === "amount") {
      discountedPrice = sellingPrice - discountValue;
    }
    // Check against minimum price first, then buying price
    if (minimumPrice > 0 && discountedPrice < minimumPrice) {
      return null; // Indicates discount is too high (below minimum price)
    }
    if (discountedPrice < buyingPrice) {
      return null; // Indicates discount is too high (below buying price)
    }
    return parseFloat(discountedPrice.toFixed(2));
  };

  const getMaxDiscountForAdditional = (sellingPrice, buyingPrice, minimumPrice = 0, type = "percentage") => {
    if (!sellingPrice || sellingPrice <= 0) {
      return 0;
    }
    const minAllowedPrice = minimumPrice > 0 ? Math.max(minimumPrice, buyingPrice) : buyingPrice;
    if (sellingPrice <= minAllowedPrice) return 0;
    
    if (type === "amount") {
      return sellingPrice - minAllowedPrice;
    }
    return Math.floor(((sellingPrice - minAllowedPrice) / sellingPrice) * 100);
  };




  /* ================= FETCH COMPLAINTS ================= */
  const fetchComplaints = useCallback(async () => {
    try {
      const res = await api.get("complaints/");
      // Ensure we always have an array, even if database returns different format
      const data = res.data;
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch complaints error:", err);
      setComplaints([]); // Set empty array on error
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints, refreshTriggers.staff, refreshTriggers.customers, refreshTriggers.booking, refreshTriggers.dashboard, refreshTriggers.stock]);

  // Fetch job types for expired/scrap items dropdown
  useEffect(() => {
    const fetchJobTypes = async () => {
      try {
        const res = await api.get("job-types/");
        setJobTypes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Fetch job types error:", err);
      }
    };
    fetchJobTypes();
  }, []);

  // Fetch products and stock items for product purchase
  useEffect(() => {
    const fetchProductsAndStock = async () => {
      try {
        // Fetch products
        const productsRes = await api.get("products/");
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);

        // Fetch stock items - try both endpoints
        try {
          const stockRes = await api.get("stocks/");
          setStockItems(Array.isArray(stockRes.data) ? stockRes.data : []);
        } catch (stockErr) {
          console.warn("Stocks API failed, trying stock-items:", stockErr);
          try {
            const stockRes = await api.get("stock-items/");
            setStockItems(Array.isArray(stockRes.data) ? stockRes.data : []);
          } catch (stockItemsErr) {
            console.error("Both stock APIs failed:", stockItemsErr);
            setStockItems([]);
          }
        }
      } catch (err) {
        console.error("Fetch products/stock error:", err);
      }
    };

    fetchProductsAndStock();
  }, []);

  useEffect(() => {
    if (refreshTriggers.stock > 0) {
      const fetchProductsAndStock = async () => {
        try {
          const productsRes = await api.get("products/");
          setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
          try {
            const stockRes = await api.get("stocks/");
            setStockItems(Array.isArray(stockRes.data) ? stockRes.data : []);
          } catch (stockErr) {
            try {
              const stockRes = await api.get("stock-items/");
              setStockItems(Array.isArray(stockRes.data) ? stockRes.data : []);
            } catch (stockItemsErr) {
              setStockItems([]);
            }
          }
        } catch (err) {
          console.error("Fetch products/stock error:", err);
        }
      };
      fetchProductsAndStock();
    }
  }, [refreshTriggers.stock]);

  /* ================= SAFE UNIQUE ID ================= */
  // Enhanced to handle different database ID formats
  const getId = (item) => {
    // Try different ID formats that might come from different databases
    if (item.id) {
      // Direct string ID or ID object
      if (typeof item.id === 'string') return item.id;
      if (item.id.$oid) return item.id.$oid; // MongoDB ObjectId format
      if (item.id.toString) return item.id.toString();
    }
    if (item._id) {
      // Direct string _id
      if (typeof item._id === 'string') return item._id;
      // MongoDB ObjectId in older format
      if (item._id.$oid) return item._id.$oid;
      if (item._id.toString) return item._id.toString();
    }
    // Fallback to complaint number
    return item.complaint_no;
  };


  /* ================= ADD JOB ================= */
  const handleAddJob = async () => {
    for (const key in newJob) {
      if (!newJob[key]) {
        alert("Fill all fields");
        return;
      }
    }

    try {
      await api.post("complaints/", {
        ...newJob,
        customer_phone: newJob.customer_number,
        address: newJob.customer_address,
        status: "pending",
      });

      setShowAddJobModal(false);
      setNewJob({
        complaint_no: "",
        customer_number: "",
        customer_name: "",
        customer_email: "",
        product_name: "",
        customer_address: "",
        complaint_details: "",
        assigned_staff: "",
      });

      fetchComplaints();
      alert("Job Added!");
    } catch (err) {
      console.error(err);
      alert("Add Failed");
    }
  };

  /* ================= COMPLETE JOB ================= */
  const handleComplete = async (id, staff) => {

    // Find the current complaint to check if it has a product
    const currentComplaint = complaints.find(item => getId(item) === id);
    const hasBookedProduct = currentComplaint && currentComplaint.product_name;

    try {
      // Validate additional products stock before proceeding
      for (const prod of selectedAdditionalProducts) {
        const stockItem = getStockItem(prod.productName);
        if (!stockItem) {
          setAdditionalProductError(`Product "${prod.productName}" not found in stock`);
          return;
        }

        if (stockItem.quantity < prod.quantity) {
          setAdditionalProductError(`Insufficient stock for "${prod.productName}". Available: ${stockItem.quantity} units (Need ${prod.quantity - stockItem.quantity} more)`);
          return;
        }
      }

      // Prepare the update data
      const updateData = {
        status: "completed",
        client_amount: client_amount,
        staff_name: staff,
        completed_remarks: completed_remarks,
      };

      if (nextServiceDate) {
        updateData.next_service_date = nextServiceDate;
      }

      // Add booked product data if it exists
      if (hasBookedProduct) {
        updateData.product_name = currentComplaint.product_name;
        updateData.product_quantity = currentComplaint.product_quantity;
      }

      // Add additional products data if selected (store as JSON string for multiple products)
      if (selectedAdditionalProducts.length > 0) {
        // Store as JSON string to support multiple products
        updateData.additional_product = JSON.stringify(selectedAdditionalProducts);
        // Calculate total quantity
        const totalQty = selectedAdditionalProducts.reduce((sum, p) => sum + p.quantity, 0);
        updateData.additional_product_quantity = totalQty;
      }

      // ✅ NEW: Add staff incentive
      if (staffIncentive && parseFloat(staffIncentive) > 0) {
        updateData.staff_incentive = parseFloat(staffIncentive);
      }

      // ✅ NEW: Add expired/scrap items collected from customer
      const validExpiredItems = expiredItems.filter(ei => ei.name && ei.name.trim());
      if (validExpiredItems.length > 0) {
        updateData.expired_items = validExpiredItems;
      }

      await api.put(`complaints/${id}/`, updateData);

      setExpandedId(null);
      setPaymentMethod("");
      setclient_amount("");
      setCompletedRemarks("");
      setNextServiceDate("");
      setSelectedAdditionalProducts([]);
      setStaffIncentive("");
      setExpiredItems([]);
      setNewExpiredItem({ name: "", buying_price: "" });
      
      // Refresh list to show updated status and history
      fetchComplaints();
      alert("✅ Job completed successfully! Stock updated.");

    } catch (err) {
      console.error(err);
      alert("Update Failed");
    }
  };

  /* ================= CARD CLICK ================= */
  const handleCardClick = (item, isPending, isExpand) => {
    if (isPending && (!item.assigned_staff || item.assigned_staff === "N/A")) {
      // URL-encode the complaint number to handle special characters like '#'
      const encodedComplaintNo = encodeURIComponent(item.complaint_no);
      navigate(`/select-staff?complaintNo=${encodedComplaintNo}`);
    } else if (isPending) {
      setExpandedId(isExpand ? null : getId(item));
    }
  };

  /* ================= PAYMENT HANDLERS ================= */
  const getJobId = (job) => {
    return job._id || job.id || job._id?.$oid || job.complaint_no;
  };

  const openPaymentModal = (job) => {
    // Use grand_total from API directly (which is recalculated from product data)
    // This ensures consistency with Payment Due page
    
    // Calculate expired items total
    const expiredTotal = (job.expired_items || []).reduce((sum, ei) => sum + (parseFloat(ei.buying_price) || 0), 0);
    
    const calculatedGrandTotal = (job.grand_total || 0) - expiredTotal;

    // FIX: Use STORED DUE VALUE as source of truth
    // Priority: job.due_amount > payment_details.last_due_amount > (grand_total - amount_received)
    let prevDue = 0;

    if (job.due_amount !== undefined && job.due_amount !== null && job.due_amount > 0) {
      // Use stored due_amount directly (source of truth)
      prevDue = job.due_amount;
    } else if (job.payment_details && job.payment_details.length > 0) {
      // Try to get last due from payment history
      const lastPayment = job.payment_details[job.payment_details.length - 1];
      if (lastPayment && lastPayment.remaining_amount !== undefined) {
        prevDue = lastPayment.remaining_amount;
      }
    } else {
      // Fallback: calculate from grand_total - total paid
      prevDue = Math.max(0, calculatedGrandTotal - (job.amount_received || 0));
    }

    setPreviousDueAmount(prevDue);
    // Initialize calculatedDue to prevDue (no amount entered yet)
    setCalculatedDue(prevDue);

    // Preserve all job fields including due_amount when setting selected job
    setSelectedJobForPayment({
      ...job,
      grand_total: calculatedGrandTotal,
      due_amount: prevDue // Ensure due_amount is preserved
    });

    // Reset amount input to empty (user enters new payment amount)
    setPaymentFormData({
      amountReceived: '',
      paymentMode: '',
      paymentDueDate: job.payment_due_date ? job.payment_due_date.split('T')[0] : ''
    });

    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedJobForPayment(null);
    setPaymentFormData({
      amountReceived: 0,
      paymentMode: '',
      paymentDueDate: ''
    });
    setPreviousDueAmount(0);
    setCalculatedDue(0);
    setPaymentHistoryData(null);
  };

  const handleSavePayment = async () => {
    if (!selectedJobForPayment) return;

    // Get the job ID
    const jobId = getJobId(selectedJobForPayment);
    if (!jobId) {
      alert('Error: Unable to identify the job. Please refresh and try again.');
      return;
    }

    // Validate entered amount
    const enteredAmount = parseFloat(paymentFormData.amountReceived);
    if (isNaN(enteredAmount) || enteredAmount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    // ⭐ Safety check: prevent payment when due_amount is 0 or less
    if (previousDueAmount <= 0) {
      alert('Payment is already completed. No further payments can be made.');
      return;
    }

    if (!paymentFormData.paymentMode) {
      alert('Please select a Payment Mode');
      return;
    }

    // Cap the amount to previous due amount (prevent more than due)
    const actualAmount = Math.min(enteredAmount, previousDueAmount);

    setIsSavingPayment(true);
    try {
      // Backend ADDS this amount to existing amount_received
      const response = await api.put(
        `update-payment/${jobId}/`,
        {
          amount_received: actualAmount,
          payment_mode: paymentFormData.paymentMode,
          payment_due_date: paymentFormData.paymentDueDate || null
        }
      );

      if (response.data.success) {
        alert('Payment details saved successfully!');
        closePaymentModal();
        fetchComplaints(); // Refresh the data
      } else {
        alert('Failed to save payment: ' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Save payment error:', err);
      // More detailed error message
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert('Error saving payment: ' + errorMsg);
    } finally {
      setIsSavingPayment(false);
    }
  };

  /* ================= FILTER + SEARCH ================= */
  const filteredData = complaints.filter((item) => {
    // 1. Exclude initial records
    if (item.is_initial === true) return false;

    // 2. Status Filtering
    const displayStatus = getDisplayStatus(item).toLowerCase();
    const validStatuses = ["pending", "assigned", "completed", "due", "overdue"];
    
    let passesTab = false;
    if (searchQuery || filter === "all") {
      passesTab = validStatuses.includes(displayStatus);
    } else {
      passesTab = displayStatus === filter;
    }

    if (!passesTab) return false;

    // 3. Search Filtering (if any search criteria active)
    if (!searchQuery && !searchDate && !searchAmountFrom && !searchAmountTo) return true;

    const q = searchQuery ? searchQuery.toLowerCase().trim() : '';
    
    // Normalize phone numbers for search
    const normalizePhone = (phone) => phone ? phone.toString().replace(/\D/g, '') : '';
    // Only apply normalized phone matching if the query doesn't contain letters
    const containsLetters = /[a-z]/i.test(q);
    const searchNormalized = containsLetters ? '' : normalizePhone(q);
    const phoneNormalized = normalizePhone(item.customer_phone || '');
    const altPhoneNormalized = normalizePhone(item.alternate_number || '');

    // Normalize IDs for fuzzy matching
    const normalizeId = (id) => id ? id.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const idNormalized = normalizeId(item.complaint_no);
    const searchIdNormalized = normalizeId(q);

    // Date Filter
    let dateMatches = true;
    if (searchDate && item.date_created) {
      try {
        const itemDateStr = new Date(item.date_created).toISOString().split('T')[0];
        const searchDateStr = new Date(searchDate).toISOString().split('T')[0];
        dateMatches = itemDateStr === searchDateStr;
      } catch (e) {
        dateMatches = false;
      }
    }

    // Amount Filter
    let amountMatches = true;
    const grandTotal = parseFloat(item.grand_total) || 0;
    if (searchAmountFrom || searchAmountTo) {
      const from = searchAmountFrom ? parseFloat(searchAmountFrom) : 0;
      const to = searchAmountTo ? parseFloat(searchAmountTo) : Infinity;
      amountMatches = grandTotal >= from && grandTotal <= to;
    }

    // Text Search Filter
    const textMatches = !q || (
      (item.complaint_no?.toString().toLowerCase() || '').includes(q) ||
      (searchIdNormalized && idNormalized.includes(searchIdNormalized)) ||
      (item.customer_name?.toString().toLowerCase() || '').includes(q) ||
      (searchNormalized && phoneNormalized.includes(searchNormalized)) ||
      (searchNormalized && altPhoneNormalized.includes(searchNormalized)) ||
      (item.product_name?.toString().toLowerCase() || '').includes(q) ||
      (item.status?.toString().toLowerCase() || '').includes(q) ||
      (item.address?.toString().toLowerCase() || '').includes(q) ||
      (item.assigned_staff?.toString().toLowerCase() || '').includes(q) ||
      (item.complaint_details?.toString().toLowerCase() || '').includes(q) ||
      (item.remarks?.toString().toLowerCase() || '').includes(q) ||
      (item.completed_remarks?.toString().toLowerCase() || '').includes(q) ||
      (item.client_amount?.toString() || '').includes(q) ||
      (item.grand_total?.toString() || '').includes(q) ||
      (item.additional_product?.toString().toLowerCase() || '').includes(q) ||
      (item.expired_items && JSON.stringify(item.expired_items).toLowerCase().includes(q))
    );

    return dateMatches && amountMatches && textMatches;
  });

  /* ================= COUNTS ================= */
  // ⭐ FEATURE 5: Exclude initial records from Dashboard counts
  const nonInitialComplaints = complaints.filter((c) => c.is_initial !== true);

  const bookingCount = nonInitialComplaints.filter((c) => getDisplayStatus(c) === "Pending").length;
  const assignedCount = nonInitialComplaints.filter((c) => getDisplayStatus(c) === "Assigned").length;
  const completedCount = nonInitialComplaints.filter((c) => getDisplayStatus(c) === "Completed").length;
  const dueCount = nonInitialComplaints.filter((c) => getDisplayStatus(c) === "Due").length;
  const overdueCount = nonInitialComplaints.filter((c) => getDisplayStatus(c) === "Overdue").length;

  const filterCounts = {
    all: bookingCount + assignedCount + completedCount + dueCount + overdueCount,
    pending: bookingCount,
    assigned: assignedCount,
    completed: completedCount,
    due: dueCount,
    overdue: overdueCount,
  };

  // Get stock item for selected product
  const getStockItem = (productName) => {
    return stockItems.find(item => item.name === productName);
  };

  // Enhanced stock item matching for additional product purchase
  const getStockItemForAdditional = (productName) => {
    if (!productName || !stockItems || stockItems.length === 0) {
      return null;
    }

    // Try exact match first
    let stockItem = stockItems.find(item => item.name === productName);
    if (stockItem) return stockItem;

    // Try case-insensitive match
    stockItem = stockItems.find(item => item.name.toLowerCase() === productName.toLowerCase());
    if (stockItem) return stockItem;

    // Try partial match (substring)
    stockItem = stockItems.find(item => item.name.toLowerCase().includes(productName.toLowerCase()));
    if (stockItem) return stockItem;

    // Try reverse partial match (in case stock name is shorter)
    stockItem = stockItems.find(item => productName.toLowerCase().includes(item.name.toLowerCase()));
    if (stockItem) return stockItem;

    return null;
  };


  // Get stock item by product ID for more reliable matching
  const getStockItemByProductId = (productId) => {
    if (!productId || !stockItems || stockItems.length === 0) {
      return null;
    }

    // Try to find stock item that matches the product ID
    // This assumes stock items might have a product_id field
    let stockItem = stockItems.find(item => item.product_id === productId);
    if (stockItem) return stockItem;

    // Fallback to name matching using the product ID to get the name
    const product = products.find(p => p.id === productId);
    if (product) {
      return getStockItemForAdditional(product.product_name);
    }

    return null;
  };

  // Get selling price from stock item
  const getSellingPrice = (productName) => {
    const stockItem = getStockItemForAdditional(productName);
    return stockItem?.selling_price || 0;
  };

  // Calculate total amount for additional products (with discount)
  const calculateAdditionalProductsTotal = () => {
    return selectedAdditionalProducts.reduce((total, item) => {
      // Use final_price if available, otherwise fall back to selling_price
      const price = item.final_price || item.selling_price || getSellingPrice(item.productName);
      return total + (price * item.quantity);
    }, 0);
  };

  // Add additional product to selection
  const addAdditionalProduct = () => {
    if (!newAdditionalProduct.productName || newAdditionalProduct.quantity < 1) {
      setAdditionalProductError("Please select a product and quantity");
      return;
    }


    // Check if product already exists (consider brand for motors)
    const exists = selectedAdditionalProducts.find(
      p => p.productName === newAdditionalProduct.productName &&
        (p.brand_name === newAdditionalProduct.brand_name || (!p.brand_name && !newAdditionalProduct.brand_name))
    );
    if (exists) {
      setAdditionalProductError("This product variant is already added. Please remove it first to change details.");
      return;
    }

    // Check stock availability
    const stockItem = getStockItemForAdditional(newAdditionalProduct.productName);
    if (!stockItem) {
      setAdditionalProductError("Product not found in stock");
      return;
    }

    if (stockItem.quantity < newAdditionalProduct.quantity) {
      setAdditionalProductError(`Insufficient stock. Available: ${stockItem.quantity} units`);
      return;
    }


    const discountValue = parseFloat(newAdditionalProduct.discount_value) || 0;

    // Calculate final price with discount validation
    let finalPrice = sellingPrice;
    if (discountValue > 0) {
      const calculatedPrice = calculateFinalPriceForAdditional(sellingPrice, buyingPrice, discountValue, newAdditionalProduct.discount_type || "percentage", minimumPrice);
      if (calculatedPrice === null) {
        const maxDiscount = getMaxDiscountForAdditional(sellingPrice, buyingPrice, minimumPrice, newAdditionalProduct.discount_type || "percentage");
        const typeStr = newAdditionalProduct.discount_type === "amount" ? "₹" : "%";
        setAdditionalProductError(`Discount too high! Maximum allowed for this brand is ${maxDiscount}${typeStr}.`);
        return;
      }
      finalPrice = calculatedPrice;
    }

    setSelectedAdditionalProducts([
      ...selectedAdditionalProducts,
      {
        ...newAdditionalProduct,
        quantity: parseInt(newAdditionalProduct.quantity),
        selling_price: sellingPrice,
        buying_price: buyingPrice,
        discount_value: discountValue,
        discount_type: newAdditionalProduct.discount_type || "percentage",
        final_price: finalPrice,
        serial_no: newAdditionalProduct.serial_no || ""
      }
    ]);
    // Reset state
    setNewAdditionalProduct({ productName: "", quantity: 1, discount_value: 0, discount_type: "percentage", brand_name: "", brand_id: null, serial_no: "" });
    setAdditionalProductError("");
  };

  // Remove additional product from selection
  const removeAdditionalProduct = (index) => {
    const updated = [...selectedAdditionalProducts];
    updated.splice(index, 1);
    setSelectedAdditionalProducts(updated);
  };

  // Parse additional product field (supports both JSON array and legacy string)
  const parseAdditionalProducts = (additionalProductField) => {
    if (!additionalProductField) return [];
    try {
      // Try parsing as JSON first (new format for multiple products)
      const parsed = JSON.parse(additionalProductField);
      if (Array.isArray(parsed)) {
        const products = parsed.map(p => ({
          productName: p.productName || p.name || p.product_name,
          quantity: p.quantity || p.qty || 1,
          selling_price: p.selling_price || 0,
          buying_price: p.buying_price || 0,
          // Handle both camelCase and snake_case for discount
          discount_value: p.discount_value || p.discount_percent || p.discountPercent || 0,
          discount_type: p.discount_type || "percentage",
          final_price: p.final_price || p.selling_price || 0,
          final_price: p.final_price || p.selling_price || 0
        }));

        return products;
      }
      // If it's an object, return as single-item array
      const prodName = parsed.productName || parsed.name || additionalProductField;

      return [{
        productName: prodName,
        quantity: parsed.quantity || 1
      }];
    } catch (e) {
      // If JSON parsing fails, it's a legacy string format
      return [{ productName: additionalProductField, quantity: 1 }];
    }
  };

  // Parse booked product_name field (supports both JSON array and legacy string)
  const parseBookedProducts = (productNameField, productQuantity) => {
    if (!productNameField) return [];
    try {
      // Try parsing as JSON first (new format for multiple products)
      const parsed = JSON.parse(productNameField);
      if (Array.isArray(parsed)) {
        const products = parsed.map(p => ({
          productName: p.productName || p.name || p.product_name,
          quantity: p.quantity || p.qty || 1,
          selling_price: p.selling_price || 0,
          buying_price: p.buying_price || 0,
          discount_value: p.discount_value || p.discount_percent || p.discountPercent || 0,
          discount_type: p.discount_type || "percentage",
          final_price: p.final_price || p.selling_price || 0
        }));

        return products;
      }
      // If it's an object, return as single-item array
      const prodObj = parsed;
      const productName = prodObj.productName || prodObj.name || productNameField;


      return [{
        productName: productName,
        quantity: prodObj.quantity || productQuantity || 1
      }];
    } catch (e) {
      // If JSON parsing fails, it's a legacy string format
      return [{ productName: productNameField, quantity: productQuantity || 1 }];
    }
  };


  // Get price for a product from stock (with discount support)
  const getProductPrice = (productName, productData = {}) => {
    // Use final_price if available (product already has discount applied)
    if (productData.final_price !== undefined && productData.final_price > 0) {
      return productData.final_price;
    }
    // Handle discount for regular products
    const discountValue = productData.discount_value || productData.discount_percent || productData.discountPercent || 0;
    const discountType = productData.discount_type || "percentage";
    
    if (discountValue > 0 && productData.selling_price) {
      const sellingPrice = parseFloat(productData.selling_price);
      let discountAmount = 0;
      if (discountType === "percentage") {
        discountAmount = sellingPrice * (discountValue / 100);
      } else if (discountType === "amount") {
        discountAmount = discountValue;
      }
      return sellingPrice - discountAmount;
    }
    const stockItem = getStockItemForAdditional(productName);
    return stockItem?.selling_price || 0;
  };

  // Calculate total price for a list of parsed products
  const calculateProductsTotal = (productsList) => {
    return productsList.reduce((total, prod) => {
      return total + (getProductPrice(prod.productName, prod) * prod.quantity);
    }, 0);
  };


  /* ================= UI ================= */
  return (
    <div className="dashboard-container">
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
      <div className="dashboard-blob dashboard-blob1"></div>
      <div className="dashboard-blob dashboard-blob2"></div>
      <div className="dashboard-blob dashboard-blob3"></div>

      <StockAlerts />

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="modal-backdrop">
          <div className="modal-content" ref={paymentModalRef}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>Payment Details</h3>
              <button
                onClick={closePaymentModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Job Info */}
            <div style={{ marginBottom: '20px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Job ID:</strong> {selectedJobForPayment.complaint_no}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Customer:</strong> {selectedJobForPayment.customer_name}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Phone:</strong> {selectedJobForPayment.customer_phone}</p>
            </div>

            {/* Total Amount - Read Only */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                Total Amount (Grand Total)
              </label>
              <input
                type="text"
                value={`₹${(selectedJobForPayment.grand_total || 0).toFixed(2)}`}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f5f5f5',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              />
            </div>

            {/* Amount Received - Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                Amount Received
              </label>
              {previousDueAmount <= 0 ? (
                <div style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: '#d1fae5',
                  border: '1px solid #10b981',
                  color: '#065f46',
                  fontSize: '16px',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  ✓ Payment is completed
                </div>
              ) : (
                <input
                  type="number"
                  value={paymentFormData.amountReceived}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setPaymentFormData({ ...paymentFormData, amountReceived: e.target.value });
                    // Calculate dynamic due: previousDueAmount - entered amount
                    const newDue = previousDueAmount - value;
                    setCalculatedDue(newDue > 0 ? newDue : 0);
                  }}
                  placeholder="Enter amount received"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '16px'
                  }}
                />
              )}
            </div>

            {/* Payment Mode - Select */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                Payment Mode <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={paymentFormData.paymentMode}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMode: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select Payment Mode</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>

            {/* Payment Due Date - Date Picker */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                Payment Due Date
              </label>
              <input
                type="date"
                value={paymentFormData.paymentDueDate}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDueDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Due Amount Display - Below Amount Received with enhanced UI */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: calculatedDue <= 0 ? '#e8f5e9' : '#fff3f3',
                border: calculatedDue <= 0 ? '1px solid #4CAF50' : '1px solid #f44336',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: calculatedDue <= 0 ? '#2e7d32' : '#c62828'
                }}>
                  Remaining Due:
                </span>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: calculatedDue <= 0 ? '#2e7d32' : '#c62828'
                }}>
                  ₹{calculatedDue.toFixed(2)}
                </span>
              </div>
              {/* Payment Status Label - Based on calculatedDue (dynamic value) */}
              <div style={{
                marginTop: '8px',
                padding: '8px',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                background: calculatedDue <= 0 ? '#4CAF50' : '#f44336',
                color: 'white'
              }}>
                {calculatedDue <= 0 ? '✓ Payment Completed' : 'Payment Due'}
              </div>

            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={closePaymentModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  background: 'white',
                  color: '#333',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePayment}
                disabled={isSavingPayment || !paymentFormData.amountReceived || parseFloat(paymentFormData.amountReceived) <= 0 || previousDueAmount <= 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isSavingPayment || !paymentFormData.amountReceived || parseFloat(paymentFormData.amountReceived) <= 0 || previousDueAmount <= 0 ? '#ccc' : '#4CAF50',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSavingPayment || !paymentFormData.amountReceived || parseFloat(paymentFormData.amountReceived) <= 0 || previousDueAmount <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {isSavingPayment ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT HISTORY MODAL */}
      {showPaymentHistoryModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '800px' }} ref={paymentHistoryModalRef}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>Payment History</h3>
              <button
                onClick={() => {
                  setShowPaymentHistoryModal(false);
                  setPaymentHistoryData(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Job Info with Grand Total */}
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Job ID:</strong> {(paymentHistoryData || selectedJobForPayment).complaint_no}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Customer:</strong> {(paymentHistoryData || selectedJobForPayment).customer_name}</p>
              <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>
                <strong>GRAND TOTAL:</strong> ₹{((paymentHistoryData || selectedJobForPayment).grand_total || 0).toFixed(2)}
              </p>
            </div>

            {/* ⭐ Enhanced Payment History List */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {(() => {
                const jobData = paymentHistoryData || selectedJobForPayment;
                const expiredTotal = (jobData.expired_items || []).reduce((sum, ei) => sum + (parseFloat(ei.buying_price) || 0), 0);
                const grandTotal = (jobData.grand_total || 0) - expiredTotal;
                const rawPayments = jobData.payment_details || [];

                // STEP 1: Sort by date ASCENDING
                const sortedPayments = [...rawPayments].sort((a, b) => {
                  const dateA = a.payment_date ? new Date(a.payment_date) : new Date(0);
                  const dateB = b.payment_date ? new Date(b.payment_date) : new Date(0);
                  return dateA - dateB;
                });

                // STEP 2: Calculate running remaining
                let remaining = grandTotal;
                const processedPayments = sortedPayments.map(payment => {
                  const paidAmount = payment.amount_paid || 0;
                  remaining = remaining - paidAmount;
                  return {
                    ...payment,
                    paidAmount,
                    remaining: Math.max(0, remaining)
                  };
                });

                if (processedPayments.length === 0) {
                  return <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No payment history available</p>;
                }

                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <thead>
                      <tr style={{ background: '#1e40af' }}>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#fff' }}>Date</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#fff' }}>Mode</th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#fff' }}>Amount Paid</th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#fff' }}>Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedPayments.map((payment, index) => {
                        const isLastPayment = index === processedPayments.length - 1;
                        const isCompleted = payment.remaining === 0;
                        return (
                          <tr key={index} style={{ borderBottom: '1px solid #e5e7eb', background: isCompleted ? '#f0fdf4' : 'transparent' }}>
                            <td style={{ padding: '10px', fontSize: '14px' }}>
                              {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-IN') : '-'}
                            </td>
                            <td style={{ padding: '10px', fontSize: '14px', textTransform: 'capitalize' }}>
                              {payment.payment_mode || 'Not Specified'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#059669' }}>
                              ₹{payment.paidAmount.toFixed(2)}
                            </td>
                            <td style={{
                              padding: '10px',
                              textAlign: 'right',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: isCompleted ? '#059669' : '#dc2626'
                            }}>
                              ₹{payment.remaining.toFixed(2)}
                              {isCompleted && ' - Completed'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Close Button */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setShowPaymentHistoryModal(false);
                  setPaymentHistoryData(null);
                }}
                style={{
                  padding: '10px 24px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ADD JOB MODAL */}
      {showAddJobModal && (
        <div className="modal-backdrop">
          <div className="modal-content" ref={addJobModalRef}>
            {/* ... Add Job Modal Content ... */}
          </div>
        </div>
      )}

      {/* Inject CSS styles */}
      <style>{styles}</style>

      <div className="page-container dashboard-page">
        <div className="dashboard-top-bar">
          <h1 className="dashboard-page-title">Service <em>Dashboard</em></h1>
          <div className="dashboard-search-container">
            <div className="dashboard-search-wrap">
              <div style={{ position: 'relative' }}>
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search complaints…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="search-btn">
                <FiSearch />
                <span>Search</span>
              </button>
            </div>
            <div className="dashboard-advanced-search">
              <div className="advanced-search-row">
                <div className="search-field">
                  <input
                    type="date"
                    placeholder="Date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="search-date-input"
                  />
                </div>
                <div className="search-field">
                  <input
                    type="number"
                    placeholder="Amount From"
                    value={searchAmountFrom}
                    onChange={(e) => setSearchAmountFrom(e.target.value)}
                    className="search-amount-input"
                    min="0"
                  />
                </div>
                <div className="search-field">
                  <input
                    type="number"
                    placeholder="Amount To"
                    value={searchAmountTo}
                    onChange={(e) => setSearchAmountTo(e.target.value)}
                    className="search-amount-input"
                    min="0"
                  />
                </div>
                {(searchDate || searchAmountFrom || searchAmountTo) && (
                  <button
                    className="clear-search-btn"
                    onClick={() => {
                      setSearchDate("");
                      setSearchAmountFrom("");
                      setSearchAmountTo("");
                    }}
                    title="Clear filters"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-status-tabs">
          {FILTER_OPTIONS.map((op) => (
            <div
              key={op.value}
              className={`dashboard-tab ${filter === op.value ? "active-tab" : ""}`}
              onClick={() => setFilter(op.value)}
            >
              <div className={`dashboard-tab-icon tab-icon-${op.value}`}>
                {op.icon}
              </div>
              <div className="dashboard-tab-info">
                <div className="dashboard-tab-count">{filterCounts[op.value]}</div>
                <div className="dashboard-tab-label">{op.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-complaints-grid">
          {filteredData.length ? (
            filteredData.map((item) => {
              const displayStatus = getDisplayStatus(item);
              const isPending = displayStatus === "Pending" || displayStatus === "Assigned";
              const isExpand = expandedId === getId(item);

              return (
                <div
                  key={getId(item)}
                  className={`complaint-card ${isPending ? "pending" : "completed"}`}
                >
                  <div
                    className="card-header"
                    onClick={() => handleCardClick(item, isPending, isExpand)}
                  >
                    <span className="card-title">
                      {item.complaint_no}
                    </span>

                    <div
                      className={`status-badge badge-${displayStatus.toLowerCase()}`}
                    >
                      {displayStatus === "Pending" ? (
                        <FiAlertTriangle />
                      ) : displayStatus === "Assigned" ? (
                        <FiUserCheck />
                      ) : displayStatus === "Due" ? (
                        <FiClock />
                      ) : displayStatus === "Overdue" ? (
                        <FiAlertTriangle />
                      ) : (
                        <FiCheck />
                      )}
                      <span>{displayStatus}</span>
                    </div>
                  </div>

                  <div className="card-content">
                    <InfoRow icon={<FiUser />} label="Customer" value={item.customer_name} />
                    <InfoRow icon={<FiPhone />} label="Phone" value={item.customer_phone} />
                    <InfoRow icon={<FiCalendar />} label="Address" value={item.address} />
                    <InfoRow icon={<FiAlertCircle />} label="Issue" value={item.complaint_details} />
                    <InfoRow icon={<FiUserCheck />} label="Assigned" value={item.assigned_staff} />

                    {item.date_created && (
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

                    {item.assigned_at && (
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

                    {item.client_amount && (
                      <InfoRow
                        icon={<FiDollarSign />}
                        label="Service Amount"
                        value={`₹${item.client_amount}`}
                      />
                    )}


                    {item.remarks && (
                      <InfoRow
                        icon={<FiMessageSquare />}
                        label="Remarks"
                        value={item.remarks}
                      />
                    )}

                    {!isPending && (
                      <InfoRow
                        icon={<FiCheck />}
                        label="Completed Date"
                        value={(() => {
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

                    {/* Action Buttons Grid - 2x2 Layout */}
                    {!isPending && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                        marginTop: '8px'
                      }}>
                        {/* WhatsApp Button */}
                        {(() => {
                          const isSent = item.whatsapp_sent_to_customer === true;
                          return (
                          <button
                            className="whatsapp-button"
                            disabled={isSent}
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsAppWithDefaultMessage(
                                item.customer_phone,
                                item.customer_name,
                                item.complaint_no
                              );
                              // Update WhatsApp status on backend
                              (async () => {
                                try {
                                  await api.post('update-whatsapp-status/', {
                                    complaint_no: item.complaint_no,
                                    whatsapp_sent_to_customer: true
                                  });
                                  fetchComplaints();
                                } catch (err) {
                                  console.error('Failed to update WhatsApp status:', err);
                                }
                              })();
                            }}
                            title={isSent ? "Message already sent" : "Send WhatsApp Message"}
                            style={{
                              padding: '6px 8px',
                              fontSize: '10px',
                              width: '100%',
                              justifyContent: 'center',
                              ...(isSent ? { background: '#25D366', cursor: 'not-allowed' } : {})
                            }}
                          >
                            <FiMessageCircle size={12} />
                            <span>{isSent ? "Sent ✓" : "WhatsApp"}</span>
                          </button>
                        );})()}

                        {/* Invoice Button */}
                        <a
                          href={`#/invoice/${encodeURIComponent(item.complaint_no)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          style={{
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontWeight: '600',
                            fontSize: '10px',
                            textDecoration: 'none'
                          }}
                          title="Generate Invoice"
                        >
                          <FiFileText size={12} />
                          <span>Invoice</span>
                        </a>

                        {/* Payment Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPaymentModal(item);
                          }}
                          style={{
                            background: '#FF9800',
                            color: 'white',
                            border: 'none',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontWeight: '600',
                            fontSize: '10px',
                            width: '100%'
                          }}
                          title="Payment Details"
                        >
                          <FiDollarSign size={12} />
                          <span>Payment</span>
                        </button>

                        {/* ⭐ NEW: History Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Always use item for history - it contains payment_details
                            setPaymentHistoryData(item);
                            setShowPaymentHistoryModal(true);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontWeight: '600',
                            fontSize: '10px',
                            width: '100%'
                          }}
                          title="View Payment History"
                        >
                          <FiDatabase size={12} />
                          <span>History</span>
                        </button>


                      </div>
                    )}


                    {/* Total Products Purchased - Only for completed jobs */}
                    {!isPending && (
                      <div className="products-purchased-section">
                        <div className="products-purchased-header">
                          <FiShoppingBag size={16} />
                          Products Purchased
                        </div>

                        {/* Header Row */}
                        <div className="product-detail-row header-row">
                          <span>Product Name</span>
                          <span style={{ textAlign: 'center' }}>Qty</span>
                          <span style={{ textAlign: 'right' }}>Price</span>
                          <span style={{ textAlign: 'right' }}>Subtotal</span>
                        </div>

                        {item.product_name && (() => {
                          let bookedProds = parseBookedProducts(item.product_name, item.product_quantity);


                          if (bookedProds.length === 0) return null;

                          return bookedProds.map((prod, idx) => {
                            const price = getProductPrice(prod.productName, prod);
                            const subtotal = price * prod.quantity;
                            const hasDiscount = (prod.discount_value && prod.discount_value > 0) || (prod.discount_percent && prod.discount_percent > 0);
                            return (
                              <div key={`booked-${idx}`} className="product-detail-row booked">
                                <span className="product-detail-name">
                                  {prod.productName}
                                  {prod.motor_brand && <span style={{ color: '#6366f1', fontSize: '11px', fontWeight: '700', marginLeft: '5px' }}>({prod.motor_brand})</span>}
                                  {hasDiscount && <span style={{ color: '#f59e0b', fontSize: '10px', marginLeft: '4px' }}>(-{prod.discount_value || prod.discount_percent}{prod.discount_type === 'amount' ? '₹' : '%'})</span>}
                                </span>
                                <span className="product-detail-qty">{prod.quantity}</span>
                                <span className="product-detail-price">
                                  {price > 0 ? `₹${price.toFixed(2)}` : '-'}
                                </span>
                                <span className="product-detail-subtotal">
                                  {subtotal > 0 ? `₹${subtotal.toFixed(2)}` : '-'}
                                </span>
                              </div>
                            );
                          });
                        })()}

                        {/* Additional Products */}
                        {item.additional_product && (() => {
                          const additionalProds = parseAdditionalProducts(item.additional_product);
                          return additionalProds.map((prod, idx) => {
                            const price = getProductPrice(prod.productName, prod);
                            const subtotal = price * prod.quantity;
                            const hasDiscount = (prod.discount_value && prod.discount_value > 0) || (prod.discount_percent && prod.discount_percent > 0);
                            return (
                              <div key={`additional-${idx}`} className="product-detail-row additional">
                                <span className="product-detail-name">
                                  {prod.productName}
                                  {prod.motor_brand && <span style={{ color: '#6366f1', fontSize: '11px', fontWeight: '700', marginLeft: '5px' }}>({prod.motor_brand})</span>}
                                  {hasDiscount && <span style={{ color: '#f59e0b', fontSize: '10px', marginLeft: '4px' }}>(-{prod.discount_value || prod.discount_percent}{prod.discount_type === 'amount' ? '₹' : '%'})</span>}
                                </span>
                                <span className="product-detail-qty">{prod.quantity}</span>
                                <span className="product-detail-price">
                                  {price > 0 ? `₹${price.toFixed(2)}` : '-'}
                                </span>
                                <span className="product-detail-subtotal">
                                  {subtotal > 0 ? `₹${subtotal.toFixed(2)}` : '-'}
                                </span>
                              </div>
                            );
                          });
                        })()}

                        {/* Expired Items Collected */}
                        {item.expired_items && item.expired_items.length > 0 && (
                          <>
                            <div className="product-detail-row" style={{ background: 'rgba(220, 38, 38, 0.05)', fontWeight: '700', color: '#dc2626', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              <span>Expired Items Collected (-)</span>
                              <span></span>
                              <span></span>
                              <span style={{ textAlign: 'right' }}>Value</span>
                            </div>
                            {item.expired_items.map((ei, idx) => (
                              <div key={`expired-${idx}`} className="product-detail-row" style={{ background: 'rgba(220, 38, 38, 0.02)', color: '#991b1b' }}>
                                <span className="product-detail-name">{ei.name}</span>
                                <span className="product-detail-qty">-</span>
                                <span className="product-detail-price">-</span>
                                <span className="product-detail-subtotal" style={{ color: '#dc2626' }}>-₹{parseFloat(ei.buying_price || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Totals Section - show when products exist OR client_amount exists */}
                        {(() => {
                          const bookedProds = item.product_name ? parseBookedProducts(item.product_name, item.product_quantity) : [];
                          const additionalProds = item.additional_product ? parseAdditionalProducts(item.additional_product) : [];
                          const hasProducts = bookedProds.length > 0 || additionalProds.length > 0;
                          const hasClientAmount = item.client_amount && parseFloat(item.client_amount) > 0;

                          if (!hasProducts && !hasClientAmount) return null;

                          return (() => {

                            // Calculate booking total (for breakdown display only)
                            const bookingTotal = bookedProds.reduce((sum, prod) => {
                              const price = prod.final_price || prod.selling_price || getProductPrice(prod.productName, prod);
                              return sum + (price * prod.quantity);
                            }, 0);

                            // Calculate additional total (using final_price with discount)
                            const additionalTotal = additionalProds.reduce((sum, prod) => {
                              const price = prod.final_price || prod.selling_price || getProductPrice(prod.productName, prod);
                              return sum + (price * prod.quantity);
                            }, 0);

                            // Get client amount (service charge)
                            const clientAmount = item.client_amount ? parseFloat(item.client_amount) : 0;

                            // Calculate expired items total
                            const expiredTotal = (item.expired_items || []).reduce((sum, ei) => sum + (parseFloat(ei.buying_price) || 0), 0);

                            // ✅ FIX: Use grand_total from API (includes motor_total for motor sales)
                            // This ensures consistency with Payment Modal, Payment History, and Payment Due page
                            // Fallback to local calculation if API value is not available
                            const grandTotal = (item.grand_total !== undefined && item.grand_total !== null && item.grand_total !== 0) ? parseFloat(item.grand_total) : (bookingTotal + additionalTotal + clientAmount - expiredTotal);

                            return (grandTotal > 0 || expiredTotal > 0) ? (
                              <div className="products-total-section">
                                {bookingTotal > 0 && (
                                  <div className="total-line booking-total">
                                    <span>Booking Products Total:</span>
                                    <span className="total-value">₹{bookingTotal.toFixed(2)}</span>
                                  </div>
                                )}
                                {additionalTotal > 0 && (
                                  <div className="total-line additional-total">
                                    <span>Additional Products Total:</span>
                                    <span className="total-value">₹{additionalTotal.toFixed(2)}</span>
                                  </div>
                                )}
                                {clientAmount > 0 && (
                                  <div className="total-line client-amount">
                                    <span>Service Amount:</span>
                                    <span className="total-value">₹{clientAmount.toFixed(2)}</span>
                                  </div>
                                )}
                                {expiredTotal > 0 && (
                                  <div className="total-line" style={{ color: '#dc2626', fontWeight: '600' }}>
                                    <span>Expired Items Deduction:</span>
                                    <span className="total-value">-₹{expiredTotal.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="total-line grand-total">
                                  <span>Grand Total:</span>
                                  <span className="total-value">₹{grandTotal.toFixed(2)}</span>
                                </div>

                                {/* Payment Status Badge - Moved to END of card (below Grand Total) */}
                                {item.payment_indicator && item.payment_indicator !== 'unknown' ? (
                                  <div className={`dashboard-payment-badge payment-badge-${item.payment_indicator}`} style={{ marginTop: '10px' }}>
                                    <span className="payment-badge-dot"></span>
                                    {item.payment_indicator === 'paid' && 'Paid'}
                                    {item.payment_indicator === 'due' && 'Due'}
                                    {item.payment_indicator === 'overdue' && 'Overdue'}
                                  </div>
                                ) : item.payment_status ? (
                                  <div style={{
                                    marginTop: '10px',
                                    padding: '8px 16px',
                                    borderRadius: '100px',
                                    background: item.payment_status === 'Completed' ? '#4CAF50' : '#f44336',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textTransform: 'uppercase'
                                  }}>
                                    {item.payment_status}
                                  </div>
                                ) : null}

                                {/* Due Amount - Moved to END of card (below Grand Total) */}
                                {item.due_amount > 0 && (
                                  <div style={{
                                    marginTop: '10px',
                                    padding: '10px 14px',
                                    background: 'rgba(255, 152, 0, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 152, 0, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}>
                                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#e65100' }}>
                                      Due Amount:
                                    </span>
                                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#e65100' }}>
                                      ₹{item.due_amount}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : null
                          })()
                        })()}

                        {/* No products message - only show when both products and client_amount are empty */}
                        {(() => {
                          const bookedProds = item.product_name ? parseBookedProducts(item.product_name, item.product_quantity) : [];
                          const additionalProds = item.additional_product ? parseAdditionalProducts(item.additional_product) : [];
                          const hasProducts = bookedProds.length > 0 || additionalProds.length > 0;
                          const hasClientAmount = item.client_amount && parseFloat(item.client_amount) > 0;

                          if (!hasProducts && !hasClientAmount) {
                            return (
                              <div className="no-products">
                                <span>No products purchased</span>
                              </div>
                            );
                          }

                          if (!hasProducts && hasClientAmount) {
                            return (
                              <div className="no-products" style={{ color: '#059669' }}>
                                <span>Service Charge: ₹{parseFloat(item.client_amount).toFixed(2)}</span>
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                    )}
                  </div>

                  {isPending && isExpand && filter !== "pending" && (
                    <div className="card-actions">
                      <label className="form-label">Complete This Job</label>

                      {/* Booked Product Section (Read Only) */}
                      {(() => {
                        const products = parseBookedProducts(item.product_name, item.product_quantity);
                        return products.length > 0 ? (
                          <div className="booked-product-section">
                            <h4 className="section-title">Booked Product</h4>
                            {products.map((prod, idx) => (
                              <div key={idx} className="product-info" style={{ marginBottom: "8px" }}>
                                <div className="product-field">
                                  <label className="field-label">Product Name</label>
                                  <div className="read-only-field">{prod.productName}</div>
                                </div>
                                <div className="product-field">
                                  <label className="field-label">Quantity</label>
                                  <div className="read-only-field">{prod.quantity}</div>
                                </div>
                                {getProductPrice(prod.productName, prod) > 0 && (
                                  <div className="product-field">
                                    <label className="field-label">Price</label>
                                    <div className="read-only-field" style={{ color: "#059669", fontWeight: "600" }}>
                                      ₹{(getProductPrice(prod.productName, prod) * prod.quantity).toFixed(2)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null
                      })()}

                      {/* Additional Product Purchase Section (Optional) - MINIMIZED */}
                      <div className="additional-product-section" style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h5 style={{ margin: 0, fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiPackage size={14} />
                            Additional Products
                            {selectedAdditionalProducts.length > 0 && (
                              <span style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                                {selectedAdditionalProducts.length}
                              </span>
                            )}
                          </h5>
                          {selectedAdditionalProducts.length > 0 && (
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                              ₹{calculateAdditionalProductsTotal().toFixed(2)}
                            </span>
                          )}
                        </div>

                        {additionalProductError && (
                          <div className="error-message" style={{ fontSize: '11px', padding: '6px', marginBottom: '8px' }}>
                            <FiAlert />
                            <span>{additionalProductError}</span>
                          </div>
                        )}

                        {/* Compact Selected Products List */}
                        {selectedAdditionalProducts.length > 0 && (
                          <div className="selected-products-list" style={{ marginBottom: '10px' }}>
                            {selectedAdditionalProducts.map((prod, index) => (
                              <div key={index} className="selected-product-item" style={{ padding: '6px 8px', marginBottom: '4px', background: 'white', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 500 }}>{prod.productName}</span>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>x{prod.quantity}</span>
                                  {(prod.discount_value > 0 || prod.discount_percent > 0) && (
                                    <span style={{ color: '#f59e0b', fontSize: '10px', background: '#fef3c7', padding: '1px 4px', borderRadius: '3px' }}>-{prod.discount_value || prod.discount_percent}{prod.discount_type === 'amount' ? '₹' : '%'}</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600 }}>₹{((prod.final_price || prod.selling_price) * prod.quantity).toFixed(2)}</span>
                                  <button
                                    type="button"
                                    className="remove-product-btn"
                                    onClick={() => removeAdditionalProduct(index)}
                                    style={{ padding: '2px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                  >
                                    <FiX size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Compact Add Product Form */}
                        <div className="product-add-form" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end' }}>
                          <div className="form-group" style={{ flex: 3, marginBottom: 0, minWidth: '150px' }}>
                            <select
                              className="form-select"
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                              value={newAdditionalProduct.productName}
                              onChange={(e) => {
                                setNewAdditionalProduct({
                                  ...newAdditionalProduct,
                                  productName: e.target.value,
                                  quantity: 1,
                                  brand_name: "",
                                  brand_id: null
                                });
                                setAdditionalProductError("");
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



                          <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: '60px' }}>
                            <label style={{ fontSize: '9px', display: 'block', marginBottom: '2px', color: '#666' }}>Qty</label>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              style={{ fontSize: '12px', padding: '6px 8px', textAlign: 'center' }}
                              value={newAdditionalProduct.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 1;
                                setNewAdditionalProduct({
                                  ...newAdditionalProduct,
                                  quantity: qty
                                });
                                setAdditionalProductError("");
                              }}
                              disabled={!newAdditionalProduct.productName}
                            />
                          </div>

                          <div className="form-group" style={{ flex: 1.5, marginBottom: 0, minWidth: '80px', display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '9px', display: 'block', marginBottom: '2px', color: '#666' }}>Disc</label>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              <input
                                type="number"
                                min="0"
                                className="form-input"
                                style={{ fontSize: '12px', padding: '6px 4px', textAlign: 'center', flex: 2, minWidth: '40px' }}
                                value={newAdditionalProduct.discount_value || ''}
                                onChange={(e) => {
                                  const discount = parseFloat(e.target.value) || 0;

                                  // Get prices based on brand if selected
                                  let sellingPrice = getSellingPrice(newAdditionalProduct.productName);
                                  let buyingPrice = getBuyingPriceForAdditional(newAdditionalProduct.productName);
                                  let minimumPrice = getMinimumPriceForAdditional(newAdditionalProduct.productName);

                                  const maxDiscount = getMaxDiscountForAdditional(sellingPrice, buyingPrice, minimumPrice, newAdditionalProduct.discount_type || "percentage");

                                  // Validation check
                                  if (discount > maxDiscount && maxDiscount > 0) {
                                    const typeStr = newAdditionalProduct.discount_type === "amount" ? "₹" : "%";
                                    showToast(`⚠️ Max discount for this variant is ${maxDiscount}${typeStr}.`, true);
                                    setNewAdditionalProduct({ ...newAdditionalProduct, discount_value: maxDiscount });
                                  } else {
                                    setNewAdditionalProduct({ ...newAdditionalProduct, discount_value: discount });
                                  }
                                }}
                                disabled={!newAdditionalProduct.productName}
                                placeholder="0"
                              />
                              <select
                                className="form-input"
                                style={{ fontSize: '11px', padding: '6px 2px', flex: 1, minWidth: '40px' }}
                                value={newAdditionalProduct.discount_type || 'percentage'}
                                onChange={(e) => {
                                  const type = e.target.value;
                                  let sellingPrice = getSellingPrice(newAdditionalProduct.productName);
                                  let buyingPrice = getBuyingPriceForAdditional(newAdditionalProduct.productName);
                                  let minimumPrice = getMinimumPriceForAdditional(newAdditionalProduct.productName);
                                  const maxDiscount = getMaxDiscountForAdditional(sellingPrice, buyingPrice, minimumPrice, type);
                                  
                                  setNewAdditionalProduct({ 
                                    ...newAdditionalProduct, 
                                    discount_type: type,
                                    discount_value: Math.min(newAdditionalProduct.discount_value || 0, maxDiscount > 0 ? maxDiscount : Infinity)
                                  });
                                }}
                                disabled={!newAdditionalProduct.productName}
                              >
                                <option value="percentage">%</option>
                                <option value="amount">₹</option>
                              </select>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="add-product-btn"
                            style={{ padding: '8px 16px', fontSize: '12px', flexShrink: 0 }}
                            onClick={addAdditionalProduct}
                            disabled={!newAdditionalProduct.productName || newAdditionalProduct.quantity < 1}
                          >
                            <FiPlus size={12} /> Add
                          </button>
                        </div>

                        {/* Compact Stock Status */}
                        {newAdditionalProduct.productName && (
                          <div className="stock-status-display" style={{ marginTop: '8px', fontSize: '11px' }}>
                            {(() => {
                              const stockItem = getStockItemForAdditional(newAdditionalProduct.productName);
                              if (!stockItem) {
                                return (
                                  <span style={{ color: '#ef4444' }}>⚠ Not in stock</span>
                                );
                              }

                              let available = stockItem.quantity;
                              let price = stockItem.selling_price || 0;
                              let buyingPrice = stockItem.buying_price || 0;
                              let minimumPrice = stockItem.minimum_price || 0;


                              const maxDiscount = getMaxDiscountForAdditional(price, buyingPrice, minimumPrice);
                              return (
                                <span style={{ color: available > 0 ? '#059669' : '#ef4444' }}>
                                  {available > 0 ? '✓' : '✗'} Stock: {available} | ₹{price} | Variant Max Disc: {maxDiscount}%
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Payment Section - MINIMIZED */}
                      <div className="payment-section" style={{ display: 'flex', gap: '10px', marginTop: '12px', padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Service Amount:</span>
                        </div>

                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <input
                            type="number"
                            className="form-input"
                            style={{ fontSize: '12px', padding: '6px 10px' }}
                            placeholder="Enter Amount"
                            value={client_amount}
                            onChange={(e) => setclient_amount(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* <div className="form-group">
                        <label className="form-label">Completed Remarks</label>
                        <textarea
                          className="form-textarea"
                          placeholder="Enter Remarks..."
                          value={completed_remarks}
                          onChange={(e) => setCompletedRemarks(e.target.value)}
                        />
                      </div> */}

                      {/* ✅ NEW: Staff Incentive Section */}
                      <div style={{ marginTop: '10px', padding: '10px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '6px' }}>💰 Staff Incentive / Commission</div>
                        <input
                          type="number"
                          className="form-input"
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                          placeholder="Enter incentive amount (₹)"
                          value={staffIncentive}
                          onChange={(e) => setStaffIncentive(e.target.value)}
                          min="0"
                        />
                      </div>

                      {/* ✅ NEW: Collected Expired / Scrap Items */}
                      <div style={{ marginTop: '10px', padding: '10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b', marginBottom: '8px' }}>🔧 Expired/Scrap Items Collected from Customer</div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                          <select
                            className="form-select"
                            style={{ flex: 2, fontSize: '12px', padding: '6px 8px' }}
                            value={newExpiredItem.name}
                            onChange={(e) => setNewExpiredItem({ ...newExpiredItem, name: e.target.value })}
                          >
                            <option value="">Select Expired Item Type</option>
                            {jobTypes.map((job) => (
                              <option key={job.id} value={job.name}>
                                {job.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            className="form-input"
                            style={{ flex: 1, fontSize: '12px', padding: '6px 8px' }}
                            placeholder="Buy price ₹"
                            value={newExpiredItem.buying_price}
                            onChange={(e) => setNewExpiredItem({ ...newExpiredItem, buying_price: e.target.value })}
                            min="0"
                          />
                          <button
                            type="button"
                            style={{ padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}
                            onClick={() => {
                              if (!newExpiredItem.name.trim()) return;
                              setExpiredItems([...expiredItems, { ...newExpiredItem }]);
                              setNewExpiredItem({ name: '', buying_price: '' });
                            }}
                          >+ Add</button>
                        </div>
                        {expiredItems.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {expiredItems.map((ei, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '5px 8px', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '11px' }}>
                                <span style={{ fontWeight: 500 }}>{ei.name}</span>
                                <span style={{ color: '#6b7280' }}>₹{ei.buying_price || 0}</span>
                                <button type="button" onClick={() => setExpiredItems(expiredItems.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 700 }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ✅ NEW: Next Service Date for Reminders */}
                      <div style={{ marginTop: '10px', padding: '10px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1d4ed8', marginBottom: '6px' }}>📅 Next Service Date (For Reminder)</div>
                        <input
                          type="date"
                          className="form-input"
                          style={{ fontSize: '12px', padding: '6px 10px', width: '100%', boxSizing: 'border-box' }}
                          value={nextServiceDate}
                          onChange={(e) => setNextServiceDate(e.target.value)}
                        />
                      </div>

                      <button
                        className="button-primary complete-button"
                        onClick={() => handleComplete(getId(item), item.assigned_staff)}
                      >
                        <FiCheckSquare />
                        <span>Mark Completed</span>
                      </button>

                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <FiInbox />
              <p>No complaints</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
