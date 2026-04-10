import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useGlobalRefresh } from "../context/GlobalRefreshContext";
import { useScrollToRef } from "../hooks/useScrollToRef";
import {
    FiDollarSign,
    FiUser,
    FiPhone,
    FiCalendar,
    FiAlertCircle,
    FiCheckCircle,
    FiRefreshCw,
    FiX,
    FiClock,
    FiCreditCard,
    FiDownload,
    FiSearch,
    FiXCircle,
    FiDatabase
} from "react-icons/fi";

/* ================= CSS STYLES ================= */
const styles = `
  /* Payment Due UI Styles - Soft Pastel Background */
  .paymentdue-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5e6ff 0%, #e6f0ff 50%, #ffe6f5 100%);
    position: relative;
    overflow-x: hidden;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .paymentdue-blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    opacity: 0.35;
    animation: blobFloat 12s ease-in-out infinite;
    z-index: 0;
  }

  .paymentdue-blob1 { 
    width: 600px; height: 600px; 
    background: radial-gradient(circle, #e0d4ff, #d4e4ff); 
    top: -200px; left: -150px; 
  }
  .paymentdue-blob2 { 
    width: 500px; height: 500px; 
    background: radial-gradient(circle, #ffe4ec, #fff4d4); 
    bottom: -150px; right: -100px; 
    animation-delay: -4s; 
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

  .paymentdue-content {
    max-width: 1300px;
    margin: 0 auto;
    padding: 40px 40px 80px;
    position: relative;
    z-index: 1;
  }

  /* Header Styles */
  .paymentdue-header {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 28px;
    padding: 28px 32px;
    margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(124,92,191,0.1), 0 2px 8px rgba(0,0,0,0.04);
    border: 1px solid rgba(255,255,255,0.95);
    position: relative;
    overflow: hidden;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1);
  }

  .paymentdue-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #9b6fe8, #6baee0, #f472b6);
    background-size: 200% 100%;
    animation: cardShimmer 3s infinite linear;
  }

  .paymentdue-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }

  .paymentdue-title {
    font-family: 'Fraunces', serif;
    font-size: 28px;
    font-weight: 600;
    color: #2d2440;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .paymentdue-title-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #9b6fe8 0%, #7c5cbf 100%);
    color: white;
    font-size: 24px;
    box-shadow: 0 6px 20px rgba(124,92,191,0.3);
  }

  .paymentdue-subtitle {
    margin: 8px 0 0 0;
    color: #6b7280;
    font-size: 14px;
  }

  .paymentdue-refresh-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    background: linear-gradient(135deg, #9b6fe8 0%, #7c5cbf 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 6px 20px rgba(124,92,191,0.3);
  }

  .paymentdue-refresh-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(124,92,191,0.4);
  }

  .paymentdue-export-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    background: linear-gradient(135deg, #48c78e 0%, #3ab07a 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 6px 20px rgba(72,199,142,0.3);
  }

  .paymentdue-export-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(72,199,142,0.4);
  }

  .paymentdue-header-actions {
    display: flex;
    gap: 12px;
  }

  /* Search Bar Styles */
  .paymentdue-search-container {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(24px);
    border-radius: 20px;
    padding: 20px 24px;
    margin-bottom: 24px;
    box-shadow: 0 8px 32px rgba(124,92,191,0.1);
    border: 1px solid rgba(255,255,255,0.95);
    animation: rise 0.5s cubic-bezier(0.16,1,0.3,1);
  }

  .paymentdue-search-main {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .paymentdue-search-input-wrapper {
    flex: 1;
    min-width: 250px;
    position: relative;
  }

  .paymentdue-search-input {
    width: 100%;
    padding: 14px 16px 14px 48px;
    border-radius: 14px;
    border: 2px solid rgba(124,92,191,0.15);
    font-size: 15px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.3s;
    background: rgba(255,255,255,0.9);
  }

  .paymentdue-search-input:focus {
    outline: none;
    border-color: #9b6fe8;
    box-shadow: 0 0 0 4px rgba(124,92,191,0.1);
  }

  .paymentdue-search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-size: 18px;
  }

  .paymentdue-filter-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    background: linear-gradient(135deg, rgba(124,92,191,0.1) 0%, rgba(107,174,224,0.1) 100%);
    border: 2px solid rgba(124,92,191,0.15);
    border-radius: 14px;
    color: #7c5cbf;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
  }

  .paymentdue-filter-toggle:hover {
    background: linear-gradient(135deg, rgba(124,92,191,0.2) 0%, rgba(107,174,224,0.2) 100%);
    border-color: #9b6fe8;
  }

  .paymentdue-filter-toggle.active {
    background: linear-gradient(135deg, #9b6fe8 0%, #7c5cbf 100%);
    color: white;
    border-color: transparent;
  }

  .paymentdue-filters-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(124,92,191,0.1);
  }

  .paymentdue-filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .paymentdue-filter-label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .paymentdue-filter-input {
    padding: 12px 14px;
    border-radius: 10px;
    border: 2px solid rgba(124,92,191,0.15);
    font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.3s;
    background: rgba(255,255,255,0.9);
  }

  .paymentdue-filter-input:focus {
    outline: none;
    border-color: #9b6fe8;
    box-shadow: 0 0 0 4px rgba(124,92,191,0.1);
  }

  .paymentdue-filter-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .paymentdue-filter-row .paymentdue-filter-input {
    flex: 1;
  }

  .paymentdue-filter-separator {
    color: #6b7280;
    font-weight: 600;
    padding-top: 24px;
  }

  .paymentdue-clear-filters {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: rgba(239,68,68,0.1);
    border: none;
    border-radius: 10px;
    color: #dc2626;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 13px;
    margin-top: 8px;
  }

  .paymentdue-clear-filters:hover {
    background: rgba(239,68,68,0.2);
  }

  .paymentdue-results-info {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 16px;
  }

  .paymentdue-results-info strong {
    color: #2d2440;
  }

  /* Error Message */
  .paymentdue-error {
    background: rgba(239,68,68,0.1);
    color: #dc2626;
    padding: 18px 24px;
    border-radius: 16px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    border: 1px solid rgba(239,68,68,0.2);
    box-shadow: 0 4px 16px rgba(239,68,68,0.1);
    animation: rise 0.5s cubic-bezier(0.16,1,0.3,1);
  }

  /* Loading State */
  .paymentdue-loading {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(24px);
    border-radius: 28px;
    padding: 80px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(124,92,191,0.1);
    border: 1px solid rgba(255,255,255,0.95);
    animation: rise 0.5s cubic-bezier(0.16,1,0.3,1);
  }

  .paymentdue-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(155,111,232,0.2);
    border-top: 4px solid #9b6fe8;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Empty State */
  .paymentdue-empty {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(24px);
    border-radius: 28px;
    padding: 80px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(124,92,191,0.1);
    border: 1px solid rgba(255,255,255,0.95);
    animation: rise 0.5s cubic-bezier(0.16,1,0.3,1);
  }

  .paymentdue-empty-icon {
    font-size: 72px;
    margin-bottom: 20px;
    color: #48c78e;
  }

  .paymentdue-empty-title {
    font-family: 'Fraunces', serif;
    font-size: 24px;
    font-weight: 600;
    color: #2d2440;
    margin: 0 0 12px 0;
  }

  .paymentdue-empty-text {
    color: #6b7280;
    margin: 0 0 24px 0;
  }

  .paymentdue-dashboard-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px;
    background: linear-gradient(135deg, #9b6fe8 0%, #7c5cbf 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 6px 20px rgba(124,92,191,0.3);
  }

  .paymentdue-dashboard-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(124,92,191,0.4);
  }

  /* Jobs Grid */
  .paymentdue-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 24px;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both;
  }

  /* Job Card */
  .paymentdue-card {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 28px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(124,92,191,0.1), 0 2px 8px rgba(0,0,0,0.04);
    border: 1px solid rgba(255,255,255,0.95);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .paymentdue-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 28px;
    padding: 2px;
    background: linear-gradient(135deg, rgba(155,111,232,0.3), rgba(107,174,224,0.3));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.4s;
    pointer-events: none;
  }

  .paymentdue-card:hover {
    transform: translateY(-8px) scale(1.01);
    box-shadow: 0 20px 60px rgba(124,92,191,0.2), 0 8px 20px rgba(0,0,0,0.08);
  }

  .paymentdue-card:hover::before {
    opacity: 1;
  }

  .paymentdue-card-strip {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    transition: height 0.3s;
  }

  .paymentdue-card:hover .paymentdue-card-strip {
    height: 8px;
  }

  .paymentdue-card-strip.overdue { 
    background: linear-gradient(90deg, #ef4444, #dc2626, #f87171); 
    background-size: 200% 100%;
    animation: cardShimmer 2s infinite linear;
  }
  .paymentdue-card-strip.due { 
    background: linear-gradient(90deg, #f59e0b, #d97706, #fbbf24); 
    background-size: 200% 100%;
    animation: cardShimmer 2s infinite linear;
  }

  /* Card Header */
  .paymentdue-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding-top: 8px;
  }

  .paymentdue-complaint-badge {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    background: linear-gradient(135deg, rgba(25,118,210,0.1) 0%, rgba(66,165,245,0.1) 100%);
    color: #1976d2;
  }

  .paymentdue-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
  }

  .paymentdue-status-badge.overdue {
    background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(252,129,129,0.15) 100%);
    color: #dc2626;
  }

  .paymentdue-status-badge.due {
    background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.15) 100%);
    color: #d97706;
  }

  /* Customer Info */
  .paymentdue-customer {
    margin-bottom: 20px;
  }

  .paymentdue-customer-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  .paymentdue-customer-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(155,111,232,0.1) 0%, rgba(107,174,224,0.1) 100%);
    color: #7c5cbf;
  }

  .paymentdue-customer-name {
    font-weight: 700;
    color: #2d2440;
    font-size: 15px;
  }

  .paymentdue-customer-phone {
    color: #6b7280;
    font-size: 14px;
  }

  /* Payment Details Card */
  .paymentdue-details {
    background: linear-gradient(135deg, rgba(124,92,191,0.04) 0%, rgba(107,174,224,0.04) 100%);
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid rgba(124,92,191,0.08);
  }

  .paymentdue-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
  }

  .paymentdue-detail-row:not(:last-child) {
    border-bottom: 1px solid rgba(124,92,191,0.08);
  }

  .paymentdue-detail-label {
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
  }

  .paymentdue-detail-value {
    font-weight: 700;
    font-size: 15px;
  }

  .paymentdue-detail-value.total {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    color: #2d2440;
  }

  .paymentdue-detail-value.received {
    color: #059669;
  }

  .paymentdue-detail-value.due {
    color: #dc2626;
  }

  .paymentdue-due-date {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
  }

  .paymentdue-due-date.overdue {
    background: rgba(239,68,68,0.1);
    color: #dc2626;
  }

  .paymentdue-due-date.due {
    background: rgba(245,158,11,0.1);
    color: #d97706;
  }

  /* Update Button */
  .paymentdue-update-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #9b6fe8 0%, #7c5cbf 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.3s;
    box-shadow: 0 6px 20px rgba(124,92,191,0.3);
  }

  .paymentdue-update-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(124,92,191,0.4);
  }

  /* Modal Styles */
  .paymentdue-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(45,36,64,0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .paymentdue-modal {
    background: white;
    border-radius: 24px;
    padding: 32px;
    width: 480px;
    max-width: 95%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 24px 80px rgba(124,92,191,0.3);
    animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1);
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Custom scrollbar for modal */
  .paymentdue-modal::-webkit-scrollbar {
    width: 8px;
  }

  .paymentdue-modal::-webkit-scrollbar-track {
    background: rgba(124,92,191,0.1);
    border-radius: 4px;
  }

  .paymentdue-modal::-webkit-scrollbar-thumb {
    background: rgba(124,92,191,0.3);
    border-radius: 4px;
  }

  .paymentdue-modal::-webkit-scrollbar-thumb:hover {
    background: rgba(124,92,191,0.5);
  }

  .paymentdue-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .paymentdue-modal-title {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    font-weight: 600;
    color: #2d2440;
    margin: 0;
  }

  .paymentdue-modal-close {
    background: rgba(124,92,191,0.1);
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #6b7280;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }

  .paymentdue-modal-close:hover {
    background: rgba(239,68,68,0.1);
    color: #dc2626;
  }

  .paymentdue-modal-info {
    background: linear-gradient(135deg, rgba(124,92,191,0.06) 0%, rgba(107,174,224,0.06) 100%);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .paymentdue-modal-info p {
    margin: 8px 0;
    font-size: 14px;
    color: #4b5563;
  }

  .paymentdue-modal-info strong {
    color: #2d2440;
  }

  .paymentdue-form-group {
    margin-bottom: 20px;
  }

  .paymentdue-form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2d2440;
    font-size: 14px;
  }

  .paymentdue-form-input {
    width: 100%;
    padding: 14px 16px;
    border-radius: 12px;
    border: 2px solid rgba(124,92,191,0.15);
    font-size: 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.3s;
    background: rgba(255,255,255,0.9);
  }

  .paymentdue-form-input:focus {
    outline: none;
    border-color: #9b6fe8;
    box-shadow: 0 0 0 4px rgba(124,92,191,0.1);
  }

  .paymentdue-form-input:read-only {
    background: linear-gradient(135deg, rgba(124,92,191,0.06) 0%, rgba(107,174,224,0.06) 100%);
    color: #2d2440;
    font-weight: 600;
  }

  .paymentdue-modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 28px;
  }

  .paymentdue-modal-save {
    flex: 1;
    padding: 16px 24px;
    background: linear-gradient(135deg, #9b6fe8 0%, #7c5cbf 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .paymentdue-modal-save:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(124,92,191,0.4);
  }

  .paymentdue-modal-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .paymentdue-modal-cancel {
    padding: 16px 24px;
    background: rgba(124,92,191,0.1);
    color: #6b7280;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .paymentdue-modal-cancel:hover {
    background: rgba(239,68,68,0.1);
    color: #dc2626;
  }

  /* Modern Dashboard Tabs */
  .paymentdue-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    background: rgba(243, 244, 246, 0.8);
    backdrop-filter: blur(12px);
    padding: 6px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }
  .paymentdue-tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px 20px;
    border-radius: 16px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    border: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: transparent;
    color: #6b7280;
    position: relative;
    overflow: hidden;
  }
  .paymentdue-tab-btn:hover {
    color: #2d2440;
    background: rgba(255, 255, 255, 0.5);
  }
  .paymentdue-tab-btn.active.tab-all {
    background: white;
    color: #7c5cbf;
    box-shadow: 0 4px 12px rgba(124,92,191,0.15);
  }
  .paymentdue-tab-btn.active.tab-overdue {
    background: white;
    color: #dc2626;
    box-shadow: 0 4px 12px rgba(239,68,68,0.15);
  }
  .paymentdue-tab-btn.active.tab-due {
    background: white;
    color: #d97706;
    box-shadow: 0 4px 12px rgba(245,158,11,0.15);
  }
  
  .paymentdue-badge-count {
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
  }
  .paymentdue-tab-btn.active.tab-all .paymentdue-badge-count {
    background: rgba(124,92,191,0.15);
    color: #7c5cbf;
  }
  .paymentdue-tab-btn.active.tab-overdue .paymentdue-badge-count {
    background: rgba(239,68,68,0.15);
    color: #dc2626;
  }
  .paymentdue-tab-btn.active.tab-due .paymentdue-badge-count {
    background: rgba(245,158,11,0.15);
    color: #d97706;
  }
  .paymentdue-tab-btn:not(.active) .paymentdue-badge-count {
    background: rgba(0,0,0,0.06);
    color: #9ca3af;
  }
`;

const PaymentDue = () => {
    const navigate = useNavigate();
    const { refreshTriggers, triggerRefresh } = useGlobalRefresh();

    const [paymentDueJobs, setPaymentDueJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search/Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    // Tab State
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'overdue', 'due'

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedJobForPayment, setSelectedJobForPayment] = useState(null);
    const [paymentFormData, setPaymentFormData] = useState({
        amountReceived: 0,
        paymentMode: '',
        paymentDueDate: ''
    });
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    // Payment history modal state
    const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);

    // New state for sequential payment tracking
    const [previousDueAmount, setPreviousDueAmount] = useState(0);
    // Dynamic calculated due (updates as user types)
    const [calculatedDue, setCalculatedDue] = useState(0);

    /* --- Scroll Refs for Modals --- */
    const paymentModalRef = useScrollToRef(showPaymentModal);
    const paymentHistoryModalRef = useScrollToRef(showPaymentHistoryModal);

    // Fetch payment due jobs (now includes both due and overdue)
    const fetchPaymentDueJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get("payment-due-jobs/");
            if (response.data.success) {
                // ⭐ FEATURE 5: Exclude initial records from payment flow
                // Filter out jobs where is_initial === true
                const filterOutInitial = (jobs) => jobs.filter(job => job.is_initial !== true);
                
                // Use the new API response format with overdue and due sections
                const overdueJobs = filterOutInitial(response.data.overdue_jobs || []);
                const dueJobs = filterOutInitial(response.data.due_jobs || []);
                // Combine for backward compatibility
                setPaymentDueJobs(filterOutInitial(response.data.all_jobs || response.data.jobs || []));
                // Store separate arrays for UI display
                setOverdueJobs(overdueJobs);
                setDueJobs(dueJobs);
            } else {
                setError(response.data.error || "Failed to fetch payment due jobs");
            }
        } catch (err) {
            console.error("Fetch payment due jobs error:", err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // State for overdue and due jobs (NEW)
    const [overdueJobs, setOverdueJobs] = useState([]);
    const [dueJobs, setDueJobs] = useState([]);

    useEffect(() => {
        fetchPaymentDueJobs();
    }, [refreshTriggers.dashboard, refreshTriggers.booking]);

    // Helper function to calculate grand_total the same way as Dashboard
    // Now uses the API's grand_total directly (which is recalculated from product data)
    const calculateGrandTotal = (job) => {
        // Use grand_total from API directly - it's now calculated consistently
        // Formula: booking_total + additional_total + client_amount + motor_total
        if (job.grand_total && job.grand_total > 0) {
            return job.grand_total;
        }
        // Fallback calculation if grand_total is not available
        const clientAmount = job.client_amount ? parseFloat(job.client_amount) : 0;
        const bookingTotal = job.booking_total || 0;
        const additionalTotal = job.additional_total || 0;
        const motorTotal = job.motor_total || 0;
        return bookingTotal + additionalTotal + clientAmount + motorTotal;
    };

    // Open payment modal for updating payment
    const openPaymentModal = (job) => {
        // Calculate correct grand_total using the same formula as Dashboard
        const correctGrandTotal = calculateGrandTotal(job);
        
        // FIX: Use STORED DUE VALUE as source of truth (same as Dashboard)
        // Priority: job.due_amount > payment_details.last_due_amount > (grand_total - amount_received)
        let prevDue = 0;
        
        if (job.due_amount !== undefined && job.due_amount !== null && job.due_amount > 0) {
            prevDue = job.due_amount;
        } else if (job.payment_details && job.payment_details.length > 0) {
            const lastPayment = job.payment_details[job.payment_details.length - 1];
            if (lastPayment && lastPayment.remaining_amount !== undefined) {
                prevDue = lastPayment.remaining_amount;
            }
        } else {
            prevDue = Math.max(0, correctGrandTotal - (job.amount_received || 0));
        }
        
        setPreviousDueAmount(prevDue);
        setCalculatedDue(prevDue);
        
        setSelectedJobForPayment({
            ...job,
            grand_total: correctGrandTotal,
            due_amount: prevDue
        });
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
    };

    const handleSavePayment = async () => {
        if (!selectedJobForPayment) return;

        // Get the complaint ID - use same logic as Dashboard for consistency
        const complaintId = selectedJobForPayment._id ||
                           selectedJobForPayment.id ||
                           selectedJobForPayment._id?.$oid ||
                           selectedJobForPayment.complaint_no;
        
        if (!complaintId) {
            alert('Error: Cannot identify the job. Please refresh and try again.');
            return;
        }

        // Safety check: Prevent payment if due_amount is already 0 or less
        if (previousDueAmount <= 0) {
            alert('Payment is already completed. No further payments can be made.');
            return;
        }

        // Validate entered amount (same as Dashboard)
        const enteredAmount = parseFloat(paymentFormData.amountReceived);
        if (isNaN(enteredAmount) || enteredAmount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }

        if (!paymentFormData.paymentMode) {
            alert('Please select a Payment Mode');
            return;
        }

        // Cap the amount to previous due amount (prevent more than due) - same as Dashboard
        const actualAmount = Math.min(enteredAmount, previousDueAmount);

        setIsSavingPayment(true);
        try {
            const response = await api.put(
                `update-payment/${complaintId}/`,
                {
                    amount_received: actualAmount,
                    payment_mode: paymentFormData.paymentMode,
                    payment_due_date: paymentFormData.paymentDueDate || null,
                    // Include complaint_id in body as fallback for cached frontend
                    complaint_id: complaintId,
                    complaint_no: selectedJobForPayment.complaint_no
                }
            );

            if (response.data.success) {
                alert('Payment details saved successfully!');
                closePaymentModal();
                fetchPaymentDueJobs();
                triggerRefresh('dashboard');
            } else {
                alert('Failed to save payment: ' + (response.data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Save payment error:', err);
            alert('Error saving payment: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsSavingPayment(false);
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Check if date is overdue
    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        return today > due;
    };

    // Export payment due list to Excel
    const exportToExcel = () => {
        if (filteredJobs.length === 0) return;

        // Create CSV content
        const headers = ['Complaint No', 'Customer Name', 'Phone', 'Grand Total', 'Amount Received', 'Due Amount', 'Payment Due Date', 'Status'];
        const rows = filteredJobs.map(job => [
            job.complaint_no || '',
            job.customer_name || '',
            job.phone || job.customer_phone || '',
            (job.grand_total || 0).toFixed(2),
            (job.amount_received || 0).toFixed(2),
            (job.due_amount || 0).toFixed(2),
            formatDate(job.payment_due_date),
            isOverdue(job.payment_due_date) ? 'Overdue' : 'Due'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `PaymentDue_List_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Filter jobs based on search criteria
    const filteredJobs = paymentDueJobs.filter(job => {
        // Search by customer name
        if (searchQuery) {
            const name = (job.customer_name || '').toLowerCase();
            const phone = (job.phone || job.customer_phone || '').toLowerCase();
            const complaint = (job.complaint_no || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            if (!name.includes(query) && !phone.includes(query) && !complaint.includes(query)) {
                return false;
            }
        }

        // Filter by date
        if (searchDate) {
            const jobDate = job.payment_due_date ? job.payment_due_date.split('T')[0] : '';
            if (jobDate !== searchDate) {
                return false;
            }
        }

        // Filter by amount range
        const dueAmount = job.due_amount || 0;
        if (minAmount && dueAmount < parseFloat(minAmount)) {
            return false;
        }
        if (maxAmount && dueAmount > parseFloat(maxAmount)) {
            return false;
        }

        return true;
    });

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setSearchDate('');
        setMinAmount('');
        setMaxAmount('');
        setShowFilters(false);
    };

    // Check if any filters are active
    const hasActiveFilters = searchQuery || searchDate || minAmount || maxAmount;

    // Apply Tab Filtering
    const displayJobs = filteredJobs.filter(job => {
        if (activeTab === 'all') return true;
        const overdue = isOverdue(job.payment_due_date);
        if (activeTab === 'overdue') return overdue;
        if (activeTab === 'due') return !overdue;
        return true;
    });

    // Sub-counts for the tabs based on current filters
    const filterOverdueCount = filteredJobs.filter(job => isOverdue(job.payment_due_date)).length;
    const filterDueCount = filteredJobs.filter(job => !isOverdue(job.payment_due_date)).length;

    return (
        <div className="paymentdue-page">
            <div className="paymentdue-blob paymentdue-blob1"></div>
            <div className="paymentdue-blob paymentdue-blob2"></div>
            <style>{styles}</style>
            
            <div className="paymentdue-content">
                {/* Header */}
                <div className="paymentdue-header">
                    <div className="paymentdue-header-row">
                        <div>
                            <h1 className="paymentdue-title">
                                <span className="paymentdue-title-icon">
                                    <FiDollarSign />
                                </span>
                                Payment Due
                            </h1>
                            <p className="paymentdue-subtitle">
                                Jobs with pending payments
                            </p>
                            {/* Header counts moved to specific feature tabs below */}
                        </div>

                        <div className="paymentdue-header-actions">
                            {paymentDueJobs.length > 0 && (
                                <button
                                    onClick={exportToExcel}
                                    className="paymentdue-export-btn"
                                >
                                    <FiDownload />
                                    Export Excel
                                </button>
                            )}
                            <button
                                onClick={fetchPaymentDueJobs}
                                className="paymentdue-refresh-btn"
                            >
                                <FiRefreshCw />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="paymentdue-search-container">
                    <div className="paymentdue-search-main">
                        <div className="paymentdue-search-input-wrapper">
                            <FiSearch className="paymentdue-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by customer name, phone, or complaint no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="paymentdue-search-input"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`paymentdue-filter-toggle ${showFilters ? 'active' : ''}`}
                        >
                            <FiCalendar />
                            {showFilters ? 'Hide Filters' : 'More Filters'}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="paymentdue-filters-panel">
                            <div className="paymentdue-filter-group">
                                <label className="paymentdue-filter-label">Due Date</label>
                                <input
                                    type="date"
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                    className="paymentdue-filter-input"
                                />
                            </div>
                            <div className="paymentdue-filter-group">
                                <label className="paymentdue-filter-label">Due Amount Range (₹)</label>
                                <div className="paymentdue-filter-row">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={minAmount}
                                        onChange={(e) => setMinAmount(e.target.value)}
                                        className="paymentdue-filter-input"
                                        min="0"
                                    />
                                    <span className="paymentdue-filter-separator">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={maxAmount}
                                        onChange={(e) => setMaxAmount(e.target.value)}
                                        className="paymentdue-filter-input"
                                        min="0"
                                    />
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="paymentdue-clear-filters">
                                    <FiXCircle size={16} />
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Dashboard-like Tabs */}
                <div className="paymentdue-tabs">
                    <button 
                        className={`paymentdue-tab-btn tab-all ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <FiDatabase /> All
                        <span className="paymentdue-badge-count">{filteredJobs.length}</span>
                    </button>
                    <button 
                        className={`paymentdue-tab-btn tab-overdue ${activeTab === 'overdue' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overdue')}
                    >
                        <FiAlertCircle /> Overdue
                        <span className="paymentdue-badge-count">{filterOverdueCount}</span>
                    </button>
                    <button 
                        className={`paymentdue-tab-btn tab-due ${activeTab === 'due' ? 'active' : ''}`}
                        onClick={() => setActiveTab('due')}
                    >
                        <FiClock /> Due
                        <span className="paymentdue-badge-count">{filterDueCount}</span>
                    </button>
                </div>

                {/* Results Info */}
                {hasActiveFilters && (
                    <div className="paymentdue-results-info">
                        Showing <strong>{displayJobs.length}</strong> of <strong>{paymentDueJobs.length}</strong> payment due jobs
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="paymentdue-error">
                        <FiAlertCircle size={24} />
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="paymentdue-loading">
                        <div className="paymentdue-spinner" />
                        Loading payment due jobs...
                    </div>
                ) : paymentDueJobs.length === 0 ? (
                    /* No Payment Due Jobs */
                    <div className="paymentdue-empty">
                        <div className="paymentdue-empty-icon">
                            <FiCheckCircle />
                        </div>
                        <h2 className="paymentdue-empty-title">All Payments Completed!</h2>
                        <p className="paymentdue-empty-text">
                            There are no pending payments at the moment.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="paymentdue-dashboard-btn"
                        >
                            <FiDollarSign />
                            Go to Dashboard
                        </button>
                    </div>
                ) : (
                    /* Payment Due Jobs List */
                    <div className="paymentdue-grid">
                        {displayJobs.map((job) => (
                            <div
                                key={job._id}
                                className="paymentdue-card"
                            >
                                {/* Color Strip */}
                                <div className={`paymentdue-card-strip ${isOverdue(job.payment_due_date) ? 'overdue' : 'due'}`} />

                                {/* Job Header */}
                                <div className="paymentdue-card-header">
                                    <span className="paymentdue-complaint-badge">
                                        {job.complaint_no}
                                    </span>
                                    <span className={`paymentdue-status-badge ${isOverdue(job.payment_due_date) ? 'overdue' : 'due'}`}>
                                        {isOverdue(job.payment_due_date) ? 'Overdue' : 'Due'}
                                    </span>
                                </div>

                                {/* Customer Info */}
                                <div className="paymentdue-customer">
                                    <div className="paymentdue-customer-row">
                                        <div className="paymentdue-customer-icon">
                                            <FiUser size={18} />
                                        </div>
                                        <span className="paymentdue-customer-name">{job.customer_name}</span>
                                    </div>
                                    <div className="paymentdue-customer-row">
                                        <div className="paymentdue-customer-icon" style={{ background: 'linear-gradient(135deg, rgba(72,199,142,0.1) 0%, rgba(109,211,160,0.1) 100%)', color: '#059669' }}>
                                            <FiPhone size={18} />
                                        </div>
                                        <span className="paymentdue-customer-phone">{job.phone || job.customer_phone}</span>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div className="paymentdue-details">
                                    <div className="paymentdue-detail-row">
                                        <span className="paymentdue-detail-label">Grand Total</span>
                                        <span className="paymentdue-detail-value total">
                                            ₹{calculateGrandTotal(job).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="paymentdue-detail-row">
                                        <span className="paymentdue-detail-label">Amount Received</span>
                                        <span className="paymentdue-detail-value received">
                                            ₹{(job.amount_received || 0).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="paymentdue-detail-row">
                                        <span className="paymentdue-detail-label">Due Amount</span>
                                        <span className="paymentdue-detail-value due">
                                            ₹{(calculateGrandTotal(job) - (job.amount_received || 0)).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className={`paymentdue-due-date ${isOverdue(job.payment_due_date) ? 'overdue' : 'due'}`}>
                                        <FiCalendar size={18} />
                                        Due Date: {formatDate(job.payment_due_date)}
                                    </div>
                                </div>

                                {/* Action Buttons Container */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                    <button
                                        onClick={() => openPaymentModal(job)}
                                        className="paymentdue-update-btn"
                                        style={{ padding: '12px 8px', fontSize: '13px' }}
                                    >
                                        <FiCreditCard size={16} />
                                        Update
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedJobForPayment(job);
                                            setShowPaymentHistoryModal(true);
                                        }}
                                        style={{
                                            padding: '12px 8px',
                                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '14px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 6px 20px rgba(99,102,241,0.3)'
                                        }}
                                        title="View Payment History"
                                    >
                                        <FiDatabase size={16} />
                                        History
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Payment Update Modal */}
                {showPaymentModal && selectedJobForPayment && (
                    <div className="paymentdue-modal-overlay" onClick={closePaymentModal}>
                        <div className="paymentdue-modal" ref={paymentModalRef} onClick={e => e.stopPropagation()}>
                            <div className="paymentdue-modal-header">
                                <h3 className="paymentdue-modal-title">Update Payment</h3>
                                <button
                                    onClick={closePaymentModal}
                                    className="paymentdue-modal-close"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Job Info */}
                            <div className="paymentdue-modal-info">
                                <p><strong>Job ID:</strong> {selectedJobForPayment.complaint_no}</p>
                                <p><strong>Customer:</strong> {selectedJobForPayment.customer_name}</p>
                                <p><strong>Phone:</strong> {selectedJobForPayment.phone || selectedJobForPayment.customer_phone}</p>
                            </div>

                            {/* Total Amount - Read Only */}
                            <div className="paymentdue-form-group">
                                <label className="paymentdue-form-label">
                                    Total Amount (Grand Total)
                                </label>
                                <input
                                    type="text"
                                    value={`₹${(selectedJobForPayment.grand_total || 0).toFixed(2)}`}
                                    readOnly
                                    className="paymentdue-form-input"
                                />
                            </div>

                            {/* Amount Received - Input */}
                            <div className="paymentdue-form-group">
                                <label className="paymentdue-form-label">
                                    Amount Received
                                </label>
                                {previousDueAmount <= 0 ? (
                                    <div style={{
                                        padding: '14px 16px',
                                        borderRadius: '12px',
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
                                            // Calculate dynamic due: previousDueAmount - entered amount (same as Dashboard)
                                            const newDue = previousDueAmount - value;
                                            setCalculatedDue(newDue > 0 ? newDue : 0);
                                        }}
                                        placeholder="Enter amount received"
                                        min="0"
                                        step="0.01"
                                        className="paymentdue-form-input"
                                    />
                                )}
                            </div>

                            {/* Payment Mode - Select */}
                            <div className="paymentdue-form-group">
                                <label className="paymentdue-form-label">
                                    Payment Mode <span style={{ color: 'red' }}>*</span>
                                </label>
                                <select
                                    value={paymentFormData.paymentMode}
                                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMode: e.target.value })}
                                    className="paymentdue-form-input"
                                >
                                    <option value="">Select Payment Mode</option>
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Card">Card</option>
                                </select>
                            </div>

                            {/* Payment Due Date - Date Picker */}
                            <div className="paymentdue-form-group">
                                <label className="paymentdue-form-label">
                                    Payment Due Date
                                </label>
                                <input
                                    type="date"
                                    value={paymentFormData.paymentDueDate}
                                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDueDate: e.target.value })}
                                    className="paymentdue-form-input"
                                />
                            </div>

                            {/* Payment Status - Dynamic calculation (same as Dashboard) */}
                            <div className="paymentdue-form-group">
                                <label className="paymentdue-form-label">
                                    Payment Status
                                </label>
                                <div style={{
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: calculatedDue <= 0 ? '2px solid #059669' : '2px solid #dc2626',
                                    background: calculatedDue <= 0 ? '#ecfdf5' : '#fef2f2',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: calculatedDue <= 0 ? '#059669' : '#dc2626'
                                }}>
                                    {calculatedDue <= 0 ? '✓ Payment Completed' : 'Payment Due'}
                                </div>
                                <div style={{
                                    marginTop: '12px',
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
                            </div>

                            {/* Buttons */}
                            <div className="paymentdue-modal-actions">
                                <button
                                    onClick={closePaymentModal}
                                    className="paymentdue-modal-cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePayment}
                                    disabled={isSavingPayment || !paymentFormData.amountReceived || parseFloat(paymentFormData.amountReceived) <= 0 || previousDueAmount <= 0}
                                    className="paymentdue-modal-save"
                                    style={{
                                        opacity: isSavingPayment || !paymentFormData.amountReceived || parseFloat(paymentFormData.amountReceived) <= 0 || previousDueAmount <= 0 ? 0.6 : 1,
                                        cursor: isSavingPayment || !paymentFormData.amountReceived || parseFloat(paymentFormData.amountReceived) <= 0 || previousDueAmount <= 0 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isSavingPayment ? 'Saving...' : 'Save Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment History Modal */}
            {showPaymentHistoryModal && selectedJobForPayment && (
                <div className="paymentdue-modal-overlay" onClick={() => setShowPaymentHistoryModal(false)}>
                    <div className="paymentdue-modal" ref={paymentHistoryModalRef} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="paymentdue-modal-header">
                            <h3 className="paymentdue-modal-title">Payment History</h3>
                            <button
                                onClick={() => setShowPaymentHistoryModal(false)}
                                className="paymentdue-modal-close"
                            >
                                ×
                            </button>
                        </div>

                        {/* Job Info with Grand Total */}
                        <div className="paymentdue-modal-info" style={{ marginBottom: '16px' }}>
                            <p><strong>Job ID:</strong> {selectedJobForPayment.complaint_no}</p>
                            <p><strong>Customer:</strong> {selectedJobForPayment.customer_name}</p>
                            <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>
                                <strong>GRAND TOTAL:</strong> ₹{(selectedJobForPayment.grand_total || 0).toFixed(2)}
                            </p>
                        </div>

                        {/* Enhanced Payment History List */}
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {(() => {
                                const grandTotal = selectedJobForPayment.grand_total || 0;
                                const rawPayments = selectedJobForPayment.payment_details || [];
                                
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
                                onClick={() => setShowPaymentHistoryModal(false)}
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
        </div>
    );
};

export default PaymentDue;
