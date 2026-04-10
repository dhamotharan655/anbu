import React, { useState, useEffect } from 'react';
import api from '../api';
import { useScrollToRef } from "../hooks/useScrollToRef";
import { FiDownload, FiAward, FiClock, FiFileText, FiX, FiSend, FiMessageCircle, FiFilePlus } from 'react-icons/fi';
import { openWhatsAppWithDefaultMessage } from '../utils/whatsappUtils';
import logoImage from '../assets/Ruban-Electricals-Logo.jpeg';
import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

/* ================= CSS STYLES ================= */
const styles = `
  /* Payroll UI Styles - Soft Pastel Background */
  .payroll-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5e6ff 0%, #e6f0ff 50%, #ffe6f5 100%);
    position: relative;
    overflow-x: hidden;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .payroll-blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    opacity: 0.35;
    animation: blobFloat 12s ease-in-out infinite;
    z-index: 0;
  }

  .payroll-blob1 { 
    width: 600px; height: 600px; 
    background: radial-gradient(circle, #e0d4ff, #d4e4ff); 
    top: -200px; left: -150px; 
  }
  .payroll-blob2 { 
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

  .payroll-content {
    max-width: 1300px;
    margin: 0 auto;
    padding: 40px 40px 80px;
    position: relative;
    z-index: 1;
  }

  .payroll-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) both;
  }

  .payroll-title {
    font-family: 'Fraunces', serif;
    font-size: 32px;
    font-weight: 600;
    color: #2d2440;
    letter-spacing: -0.5px;
  }

  .payroll-title em {
    font-style: italic;
    background: linear-gradient(135deg, #9b6fe8, #6baee0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .payroll-controls {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
  }

  .payroll-select {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255,255,255,0.9);
    border-radius: 12px;
    padding: 12px 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    color: #2d2440;
    outline: none;
    box-shadow: 0 4px 20px rgba(124,92,191,0.08);
    transition: all 0.3s;
    cursor: pointer;
  }

  .payroll-select:focus {
    border-color: rgba(155,111,232,0.5);
    box-shadow: 0 8px 30px rgba(124,92,191,0.15);
  }

  .payroll-tabs {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 28px;
    animation: rise 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both;
  }

  .payroll-tab {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    border-radius: 16px;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255,255,255,0.95);
    box-shadow: 0 4px 20px rgba(124,92,191,0.08);
    cursor: pointer;
    transition: all 0.35s;
    font-weight: 600;
    color: #6b7280;
  }

  .payroll-tab:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(124,92,191,0.15);
    color: #9b6fe8;
  }

  .payroll-tab.active-tab {
    background: linear-gradient(135deg, #9b6fe8 0%, #7c5cbf 100%);
    color: white;
    border-color: transparent;
    box-shadow: 0 8px 25px rgba(124,92,191,0.3);
  }

  .payroll-tab svg {
    font-size: 18px;
  }

  .payroll-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .payroll-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 14px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .payroll-btn-primary {
    background: linear-gradient(135deg, #9b6fe8 0%, #7c5cbf 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(124,92,191,0.3);
  }

  .payroll-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(124,92,191,0.4);
  }

  .payroll-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .payroll-btn-secondary {
    background: rgba(255,255,255,0.9);
    color: #6b7280;
    border: 2px solid rgba(255,255,255,0.9);
  }

  .payroll-btn-secondary:hover {
    background: white;
    color: #9b6fe8;
    border-color: #9b6fe8;
  }

  .payroll-btn-success {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }

  .payroll-btn-success:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
  }

  .payroll-btn-success:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* Enhanced Modern Card Styles */
  .payroll-card {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 28px;
    padding: 28px;
    box-shadow: 0 8px 32px rgba(124,92,191,0.1), 0 2px 8px rgba(0,0,0,0.04);
    border: 1px solid rgba(255,255,255,0.95);
    margin-bottom: 24px;
    animation: rise 0.5s cubic-bezier(0.16,1,0.3,1);
    position: relative;
    overflow: hidden;
  }

  .payroll-card::before {
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

  .payroll-card:hover::before {
    opacity: 1;
  }

  /* Enhanced Summary Cards */
  .payroll-summary {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .payroll-summary-item {
    flex: 1;
    min-width: 140px;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 20px 24px;
    border: 1px solid rgba(255,255,255,0.95);
    box-shadow: 0 8px 24px rgba(124,92,191,0.1);
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .payroll-summary-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #9b6fe8, #6baee0);
  }

  .payroll-summary-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(124,92,191,0.2);
  }

  .payroll-summary-item.staff { background: linear-gradient(135deg, rgba(155,111,232,0.1) 0%, rgba(107,174,224,0.1) 100%); }
  .payroll-summary-item.present { background: linear-gradient(135deg, rgba(72,199,142,0.1) 0%, rgba(109,211,160,0.1) 100%); }
  .payroll-summary-item.halfday { background: linear-gradient(135deg, rgba(255,179,71,0.1) 0%, rgba(255,197,107,0.1) 100%); }
  .payroll-summary-item.leave { background: linear-gradient(135deg, rgba(244,114,182,0.1) 0%, rgba(252,165,211,0.1) 100%); }
  .payroll-summary-item.salary { background: linear-gradient(135deg, rgba(124,92,191,0.15) 0%, rgba(107,174,224,0.15) 100%); }

  .payroll-summary-item.staff::before { background: linear-gradient(90deg, #9b6fe8, #7c5cbf); }
  .payroll-summary-item.present::before { background: linear-gradient(90deg, #48c78e, #3ab07a); }
  .payroll-summary-item.halfday::before { background: linear-gradient(90deg, #ffb347, #ff9500); }
  .payroll-summary-item.leave::before { background: linear-gradient(90deg, #f472b6, #ec4899); }
  .payroll-summary-item.salary::before { background: linear-gradient(90deg, #9b6fe8, #6baee0); }

  .payroll-summary-label {
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .payroll-summary-value {
    font-family: 'Fraunces', serif;
    font-size: 26px;
    font-weight: 700;
    color: #2d2440;
  }

  /* Enhanced Table Styles */
  .payroll-table-container {
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(24px);
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(124,92,191,0.1), 0 2px 8px rgba(0,0,0,0.04);
    border: 1px solid rgba(255,255,255,0.95);
    position: relative;
  }

  .payroll-table-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 28px;
    padding: 2px;
    background: linear-gradient(135deg, rgba(155,111,232,0.2), rgba(107,174,224,0.2));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .payroll-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  .payroll-table thead {
    background: linear-gradient(135deg, #f5e6ff 0%, #e6f0ff 100%);
  }

  .payroll-table th {
    padding: 18px 20px;
    text-align: left;
    font-weight: 700;
    color: #2d2440;
    border-bottom: 2px solid rgba(124,92,191,0.2);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .payroll-table td {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(124,92,191,0.08);
    color: #4b5563;
    transition: all 0.2s;
  }

  .payroll-table tbody tr {
    transition: all 0.2s;
  }

  .payroll-table tbody tr:hover td {
    background: rgba(124,92,191,0.04);
  }

  .payroll-table tbody tr:hover {
    background: linear-gradient(135deg, rgba(155,111,232,0.03) 0%, rgba(107,174,224,0.03) 100%);
  }

  .payroll-table .staff-name {
    font-weight: 600;
    color: #2d2440;
    font-size: 15px;
  }

  .payroll-table .amount {
    font-weight: 700;
    color: #059669;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px;
  }

  .payroll-table .negative {
    color: #dc2626;
  }

  .payroll-table .attendance-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    padding: 6px 12px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 13px;
  }

  .payroll-table .present-badge {
    background: linear-gradient(135deg, rgba(72,199,142,0.15) 0%, rgba(109,211,160,0.15) 100%);
    color: #059669;
  }

  .payroll-table .halfday-badge {
    background: linear-gradient(135deg, rgba(255,179,71,0.15) 0%, rgba(255,197,107,0.15) 100%);
    color: #d97706;
  }

  .payroll-table .leave-badge {
    background: linear-gradient(135deg, rgba(244,114,182,0.15) 0%, rgba(252,165,211,0.15) 100%);
    color: #db2777;
  }

  .payroll-table .absent-badge {
    background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(252,129,129,0.15) 100%);
    color: #dc2626;
  }

  .payroll-input {
    background: rgba(255,255,255,0.9);
    border: 2px solid rgba(124,92,191,0.15);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    width: 90px;
    outline: none;
    transition: all 0.3s;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .payroll-input:focus {
    border-color: #9b6fe8;
    box-shadow: 0 0 0 4px rgba(124,92,191,0.1);
  }

  .payroll-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
    background: linear-gradient(135deg, rgba(124,92,191,0.1) 0%, rgba(107,174,224,0.1) 100%);
    color: #7c5cbf;
  }

  .payroll-action-btn:hover {
    background: linear-gradient(135deg, #9b6fe8 0%, #7c5cbf 100%);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(124,92,191,0.3);
  }

  .payroll-empty {
    text-align: center;
    padding: 80px 40px;
    color: #6b7280;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(20px);
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.95);
  }

  .payroll-empty-icon {
    font-size: 56px;
    margin-bottom: 20px;
    opacity: 0.4;
    color: #9b6fe8;
  }

  .payroll-message {
    padding: 18px 24px;
    border-radius: 16px;
    margin-bottom: 24px;
    font-weight: 500;
    font-size: 14px;
  }

  .payroll-message.success {
    background: rgba(16,185,129,0.1);
    color: #059669;
    border: 1px solid rgba(16,185,129,0.2);
    box-shadow: 0 4px 16px rgba(16,185,129,0.1);
  }

  .payroll-message.error {
    background: rgba(239,68,68,0.1);
    color: #dc2626;
    border: 1px solid rgba(239,68,68,0.2);
    box-shadow: 0 4px 16px rgba(239,68,68,0.1);
  }

  .payroll-message.info {
    background: rgba(59,130,246,0.1);
    color: #3b82f6;
    border: 1px solid rgba(59,130,246,0.2);
    box-shadow: 0 4px 16px rgba(59,130,246,0.1);
  }

  .payroll-section-title {
    font-family: 'Fraunces', serif;
    font-size: 20px;
    font-weight: 600;
    color: #2d2440;
    margin-bottom: 20px;
  }

  /* Ranking Badge Styles */
  .payroll-rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 18px;
    font-weight: 700;
  }

  .payroll-rank-badge.gold {
    background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }

  .payroll-rank-badge.silver {
    background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%);
    box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
  }

  .payroll-rank-badge.bronze {
    background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
    box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
  }

  .payroll-rank-badge.default {
    background: rgba(124, 92, 191, 0.1);
    color: #7c5cbf;
  }

  .payroll-attendance-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 13px;
  }

  .payroll-attendance-badge.excellent {
    background: linear-gradient(135deg, rgba(72,199,142,0.15) 0%, rgba(109,211,160,0.15) 100%);
    color: #059669;
  }

  .payroll-attendance-badge.good {
    background: linear-gradient(135deg, rgba(255,179,71,0.15) 0%, rgba(255,197,107,0.15) 100%);
    color: #d97706;
  }

  .payroll-attendance-badge.poor {
    background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(252,129,129,0.15) 100%);
    color: #dc2626;
  }

  .payroll-row-highlight {
    background: linear-gradient(135deg, rgba(155,111,232,0.05) 0%, rgba(107,174,224,0.05) 100%) !important;
  }

  .payroll-row-gold {
    background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,183,0,0.1) 100%) !important;
  }

  .payroll-row-silver {
    background: linear-gradient(135deg, rgba(192,192,192,0.1) 0%, rgba(168,168,168,0.1) 100%) !important;
  }

  .payroll-row-bronze {
    background: linear-gradient(135deg, rgba(205,127,50,0.1) 0%, rgba(184,115,51,0.1) 100%) !important;
  }
`;

const Payroll = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payrollData, setPayrollData] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingId, setEditingId] = useState(null);
  const [bonus, setBonus] = useState({});
  const [deduction, setDeduction] = useState({});
  const [activeTab, setActiveTab] = useState('calculate'); // calculate, history, ranking
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [payslipData, setPayslipData] = useState(null);
  const [payslipHtml, setPayslipHtml] = useState('');

  // Scroll Refs for modals
  const payslipModalRef = useScrollToRef(showPayslipModal);

  // Generate month options
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Generate year options
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const fetchPayrollHistory = async () => {
    try {
      const response = await api.get(`/payroll/history/?month=${month}&year=${year}`);
      if (response.data.success) {
        setPayrollHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payroll history:', error);
    }
  };

  const fetchRanking = async () => {
    try {
      const response = await api.get(`/payroll/ranking/?month=${month}&year=${year}`);
      if (response.data.success) {
        setRankingData(response.data.rankings);
      }
    } catch (error) {
      console.error('Error fetching ranking:', error);
    }
  };

  const calculatePayroll = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await api.get(`/payroll/calculate/?month=${month}&year=${year}`);
      console.log('Payroll API response:', response.data);
      if (response.data.success) {
        if (response.data.payroll && response.data.payroll.length > 0) {
          setPayrollData(response.data.payroll);
        } else {
          setPayrollData([]);
          setMessage({ type: 'info', text: 'No staff found or no attendance data for selected month/year' });
        }
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to calculate payroll' });
      }
    } catch (error) {
      console.error('Payroll error:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error calculating payroll' });
    }
    setLoading(false);
  };

  // Export payroll to Excel with styled formatting
  const exportToExcel = () => {
    if (payrollData.length === 0) {
      setMessage({ type: 'error', text: 'No payroll data to export' });
      return;
    }

    try {
      // Prepare data for Excel
      // Base Salary = monthly_salary from staff profile
      // Net Salary = total_salary (calculated salary) + bonus - deduction
      const exportData = payrollData.map(staff => {
        const perDaySalary = staff.per_day_salary || 0;
        const monthlySalary = staff.monthly_salary || 0;  // Base monthly salary from staff profile
        const totalSalary = staff.total_salary || 0;  // Calculated salary (per_day × multiplier)
        const bonus = staff.bonus || 0;
        const deduction = staff.deduction || 0;
        const netSalary = totalSalary + bonus - deduction;
        
        return {
          'Name': staff.staff_name,
          'Phone': staff.phone || '',
          'Per Day Salary (₹)': perDaySalary,
          'Present Days': staff.present_days || 0,
          'Half Days': staff.half_days || 0,
          'Holiday Days': staff.holiday_days || 0,
          'Leave Days': staff.leave_days || 0,
          'Absent Days': staff.absent_days || 0,
          'Total Multiplier': staff.total_multiplier || 0,
          'Base Salary (₹)': monthlySalary,  // From staff profile
          'Calculated Salary (₹)': Math.round(totalSalary * 100) / 100,
          'Bonus (₹)': bonus,
          'Deduction (₹)': deduction,
          'Net Salary (₹)': Math.round(netSalary * 100) / 100
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Get the range of the worksheet
      const wsRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');

      // Helper function to create cell style
      const createStyle = (bgColor, fontColor, bold = false) => ({
        fill: { fgColor: { rgb: bgColor } },
        font: { color: { rgb: fontColor }, bold: bold, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      });

      // Apply header styles - Indigo
      const headerStyle = createStyle('4F46E5', 'FFFFFF', true);
      // Salary header - Green
      const salaryHeaderStyle = createStyle('059669', 'FFFFFF', true);
      // Salary columns - Light green
      const salaryCellStyle = createStyle('D1FAE5', '000000');
      // Regular cells - Light gray
      const cellStyle = createStyle('F3F4F6', '000000');
      // Currency formatting
      const currencyFormat = '₹#,##0.00';

      // Apply header styles to first row
      const headerRow = 1;
      for (let col = wsRange.s.c; col <= wsRange.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c: col });
        if (ws[cellAddr]) {
          const colLetter = XLSX.utils.encode_col(col);
          // Columns J, K, L, M, N are salary columns
          if (['J', 'K', 'L', 'M', 'N'].includes(colLetter)) {
            ws[cellAddr].s = salaryHeaderStyle;
          } else {
            ws[cellAddr].s = headerStyle;
          }
        }
      }

      // Apply data styles to remaining rows
      for (let row = headerRow + 1; row <= wsRange.e.r; row++) {
        for (let col = wsRange.s.c; col <= wsRange.e.c; col++) {
          const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[cellAddr]) {
            const colLetter = XLSX.utils.encode_col(col);
            // Columns J, K, L, M, N are salary columns
            if (['J', 'K', 'L', 'M', 'N'].includes(colLetter)) {
              ws[cellAddr].s = { ...salaryCellStyle, numFmt: currencyFormat };
            } else {
              ws[cellAddr].s = cellStyle;
            }
          }
        }
      }

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 13 }, { wch: 11 },
        { wch: 11 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 20 },
        { wch: 12 }, { wch: 12 }, { wch: 18 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Payroll Report');

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[parseInt(month) - 1] || month;
      const fileName = `Payroll_Report_${monthName}_${year}.xlsx`;

      XLSX.writeFile(wb, fileName);

      setMessage({ type: 'success', text: 'Payroll report exported to Excel successfully!' });
    } catch (error) {
      console.error('Excel export error:', error);
      setMessage({ type: 'error', text: 'Failed to export Excel file' });
    }
  };

  const savePayroll = async () => {
    if (payrollData.length === 0) {
      setMessage({ type: 'error', text: 'Please calculate payroll first' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      // Update payrollData with current bonus/deduction values before saving
      const updatedPayrollData = payrollData.map(staff => {
        const currentBonus = bonus[staff.staff_id] !== undefined ? parseFloat(bonus[staff.staff_id]) || 0 : (staff.bonus || 0);
        const currentDeduction = deduction[staff.staff_id] !== undefined ? parseFloat(deduction[staff.staff_id]) || 0 : (staff.deduction || 0);
        const calculatedFinalSalary = (staff.total_salary || 0) + currentBonus - currentDeduction;
        return {
          ...staff,
          bonus: currentBonus,
          deduction: currentDeduction,
          final_salary: calculatedFinalSalary
        };
      });
      
      const response = await api.post('/payroll/save/', {
        month,
        year,
        payroll: updatedPayrollData,
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        fetchPayrollHistory();
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to save payroll' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error saving payroll' });
    }
    setSaving(false);
  };

  const handleBonusChange = (staffId, value) => {
    setBonus(prev => ({ ...prev, [staffId]: value }));
    setEditingId(staffId);
  };

  const handleDeductionChange = (staffId, value) => {
    setDeduction(prev => ({ ...prev, [staffId]: value }));
    setEditingId(staffId);
  };

  const updateAdjustments = async (staffId, payrollId) => {
    const bonusValue = parseFloat(bonus[staffId]) || 0;
    const deductionValue = parseFloat(deduction[staffId]) || 0;

    try {
      const response = await api.put('/payroll/update-adjustments/', {
        payroll_id: payrollId,
        bonus: bonusValue,
        deduction: deductionValue,
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Adjustments updated successfully' });
        calculatePayroll();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating adjustments' });
    }
    setEditingId(null);
  };

  const downloadPayslip = async (staff) => {
    try {
      // Get full payroll details
      const response = await api.get(`/payroll/by-staff/?staff_id=${staff.staff_id}&month=${month}&year=${year}`);
      if (response.data.success) {
        const data = response.data.data;
        
        // Create a clean professional HTML payslip with white background and black borders
        const payslipHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Payslip - ${data.staff_name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
      padding: 15px;
      background: #f5f5f5;
      font-size: 12px;
      line-height: 1.4;
      color: #000;
    }
    
    .payslip-container {
      width: 100%;
      max-width: 180mm;
      margin: 0 auto;
      background: #fff;
      border: 2px solid #000;
    }
    
    .header {
      background: #fff;
      color: #000;
      padding: 20px 24px;
      text-align: center;
      border-bottom: 2px solid #000;
    }
    
    .header img {
      height: 55px;
      margin-bottom: 12px;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    
    .header p {
      font-size: 12px;
      color: #333;
    }
    
    .header .subtitle {
      font-size: 14px;
      font-weight: 600;
      margin-top: 10px;
      padding: 8px 20px;
      border: 1px solid #000;
      display: inline-block;
    }
    
    .payslip-title {
      background: #fff;
      color: #000;
      padding: 14px;
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 3px;
      border-bottom: 2px solid #000;
    }
    
    .info-section {
      padding: 18px 24px;
      border-bottom: 1px solid #000;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .info-box {
      background: #fff;
      padding: 14px;
      border: 1px solid #000;
    }
    
    .info-box label {
      font-size: 10px;
      color: #444;
      text-transform: uppercase;
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .info-box .value {
      font-size: 15px;
      font-weight: 700;
      color: #000;
    }
    
    .section {
      padding: 18px 24px;
    }
    
    .section-title {
      font-size: 12px;
      color: #000;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #000;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    
    th {
      background: #fff;
      color: #000;
      padding: 12px 10px;
      text-align: left;
      font-weight: 700;
      border: 1px solid #000;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 12px 10px;
      text-align: left;
      border: 1px solid #000;
      color: #000;
    }
    
    td.amount {
      text-align: right;
      font-weight: 600;
      color: #000;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    
    tr:last-child td {
      font-size: 16px;
      font-weight: 700;
      color: #000;
      background: #fff;
      border: 2px solid #000;
    }
    
    .bonus { color: #16a34a !important; font-weight: 600; }
    .deduction { color: #dc2626 !important; font-weight: 600; }
    
    .amount.bonus { color: #16a34a !important; }
    .amount.deduction { color: #dc2626 !important; }
    
    .summary-box {
      background: #fff;
      border: 2px solid #000;
      padding: 16px;
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .summary-box .label {
      font-size: 12px;
      color: #000;
      font-weight: 700;
    }
    
    .summary-box .amount {
      font-size: 22px;
      font-weight: 700;
      color: #000;
    }
    
    .footer {
      background: #fff;
      padding: 16px;
      text-align: center;
      font-size: 10px;
      color: #333;
      border-top: 2px solid #000;
    }
    
    .footer .company {
      color: #000;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    @page { 
      size: A4; 
      margin: 0; 
    }
    
    @media print {
      body { padding: 0; background: #fff; }
      .payslip-container { border: 2px solid #000; }
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    <div class="header">
      <h1>RUBAN ELECTRICALS</h1>
      <p>Service Management System</p>
      <div class="subtitle">Payslip - ${months.find(m => m.value === parseInt(month))?.label} ${year}</div>
    </div>
    
    <div class="payslip-title">
      PAY SLIP
    </div>
    
    <div class="info-section">
      <div class="info-grid">
        <div class="info-box">
          <label>Employee Name</label>
          <div class="value">${data.staff_name}</div>
        </div>
        <div class="info-box">
          <label>Phone Number</label>
          <div class="value">${data.phone || 'N/A'}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h3 class="section-title">📅 Attendance</h3>
      <table>
        <thead>
          <tr>
            <th>Present</th>
            <th>Half Day</th>
            <th>Holiday (Paid)</th>
            <th>Leave</th>
            <th>Absent</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color:#16a34a">${data.present_days}</strong></td>
            <td><strong style="color:#f59e0b">${data.half_days}</strong></td>
            <td><strong style="color:#6366f1">${data.holiday_days || 0}</strong></td>
            <td><strong>${data.leave_days}</strong></td>
            <td><strong style="color:#dc2626">${data.absent_days}</strong></td>
            <td><strong>${data.present_days + (data.half_days || 0) + (data.holiday_days || 0) + data.leave_days + data.absent_days}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <h3 class="section-title">💰 Salary Details</h3>
      <table>
        <tbody>
          <tr>
            <td>Base Salary (Monthly)</td>
            <td class="amount">₹${parseFloat(data.monthly_salary || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Per Day Salary</td>
            <td class="amount">₹${parseFloat(data.per_day_salary).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total Salary (${data.present_days} Present + ${data.half_days} Half + ${data.holiday_days || 0} Holiday)</td>
            <td class="amount">₹${parseFloat(data.total_salary).toFixed(2)}</td>
          </tr>
          <tr>
            <td class="bonus">+ Bonus</td>
            <td class="amount bonus">₹${parseFloat(data.bonus || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td class="deduction">- Deduction</td>
            <td class="amount deduction">₹${parseFloat(data.deduction || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>NET PAYABLE</td>
            <td class="amount">₹${parseFloat(data.final_salary).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${data.special_days && data.special_days.length > 0 ? `
    <div class="section">
      <h3 class="section-title">🌟 Special Adjustments (Multipliers)</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Multiplier</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          ${data.special_days.map(day => `
            <tr>
              <td>${day.date}</td>
              <td><strong>${day.multiplier}x</strong></td>
              <td>${day.reason}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <div class="footer">
      <div class="company">RUBAN ELECTRICALS</div>
      Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
    </div>
  </div>
</body>
</html>
        `;
        
        // Set payslip data and show modal
        setPayslipData(data);
        setPayslipHtml(payslipHTML);
        setShowPayslipModal(true);
      }
    } catch (error) {
      console.error('Payslip error:', error);
      alert('Error loading payslip: ' + (error.response?.data?.error || error.message));
    }
  };

  // Download payslip as PDF using jsPDF directly
  const handleDownloadPayslip = () => {
    if (!payslipData) return;
    
    try {
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = 210; // A4 width in mm
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let y = 15;
      
      // Helper function for drawing borders
      const drawBorder = (x, y, w, h) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(x, y, w, h);
      };
      
      // Helper function to format currency
      const formatCurrency = (amount) => {
        const num = parseFloat(amount || 0);
        return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };
      
      // Header Section
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 45, 'F');
      drawBorder(margin, y, contentWidth, 40);
      
      // Add Logo
      try {
        doc.addImage(logoImage, 'JPEG', pageWidth / 2 - 10, y + 2, 20, 16);
      } catch (e) {
        console.log('Logo not loaded, using text only');
      }
      
      // Company Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('RUBAN ELECTRICALS', pageWidth / 2, y + 24, { align: 'center' });
      
      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text('Service Management System', pageWidth / 2, y + 29, { align: 'center' });
      
      // Month/Year
      const monthName = months.find(m => m.value === parseInt(month))?.label || month;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Payslip - ${monthName} ${year}`, pageWidth / 2, y + 36, { align: 'center' });
      
      // PAY SLIP title
      y = 52;
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentWidth, y);
      doc.line(margin, y + 8, margin + contentWidth, y + 8);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PAY SLIP', pageWidth / 2, y + 5.5, { align: 'center' });
      
      y += 12;
      
      // Employee Info Section
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 26, 'F');
      drawBorder(margin, y, contentWidth, 26);
      doc.line(margin + (contentWidth / 2), y, margin + (contentWidth / 2), y + 26);
      
      // Left column - Employee Name
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('EMPLOYEE NAME', margin + 5, y + 7);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(String(payslipData.staff_name || 'N/A'), margin + 5, y + 15);
      
      // Right column - Phone
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('PHONE NUMBER', margin + (contentWidth / 2) + 5, y + 7);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(String(payslipData.phone || 'N/A'), margin + (contentWidth / 2) + 5, y + 15);
      
      y += 24;
      
      // Attendance Section Title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('ATTENDANCE', margin, y);
      doc.line(margin, y + 3, margin + 35, y + 3);
      
      y += 10;
      
      // Attendance Table
      const tableWidth = contentWidth;
      const colW = tableWidth / 6;
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, tableWidth, 22, 'F');
      drawBorder(margin, y, tableWidth, 22);
      
      // Table Header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, tableWidth, 8, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(margin, y + 8, margin + tableWidth, y + 8);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('PRESENT', margin + 3, y + 5.5);
      doc.text('HALF DAY', margin + colW + 3, y + 5.5);
      doc.text('HOLIDAY', margin + (colW * 2) + 3, y + 5.5);
      doc.text('LEAVE', margin + (colW * 3) + 3, y + 5.5);
      doc.text('ABSENT', margin + (colW * 4) + 3, y + 5.5);
      doc.text('TOTAL', margin + (colW * 5) + 3, y + 5.5);
      
      // Vertical lines
      for (let i = 1; i < 6; i++) {
        doc.line(margin + (colW * i), y, margin + (colW * i), y + 22);
      }
      
      // Table Data
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      const present = payslipData.present_days || 0;
      const halfDay = payslipData.half_days || 0;
      const holiday = payslipData.holiday_days || 0;
      const leave = payslipData.leave_days || 0;
      const absent = payslipData.absent_days || 0;
      const total = present + halfDay + holiday + leave + absent;
      
      doc.text(String(present), margin + 3, y + 15);
      doc.text(String(halfDay), margin + colW + 3, y + 15);
      doc.text(String(holiday), margin + (colW * 2) + 3, y + 15);
      doc.text(String(leave), margin + (colW * 3) + 3, y + 15);
      doc.text(String(absent), margin + (colW * 4) + 3, y + 15);
      doc.text(String(total), margin + (colW * 5) + 3, y + 15);
      
      y += 26;
      
      // Salary Details Section Title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('SALARY DETAILS', margin, y);
      doc.line(margin, y + 3, margin + 40, y + 3);
      
      y += 10;
      
      // Salary Table with proper borders
      const salaryTableHeight = 50;
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, tableWidth, salaryTableHeight, 'F');
      drawBorder(margin, y, tableWidth, salaryTableHeight);
      
      // Table Header row
      const headerHeight = 8;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, tableWidth, headerHeight, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(margin, y + headerHeight, margin + tableWidth, y + headerHeight);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('DESCRIPTION', margin + 3, y + 5.5);
      doc.text('AMOUNT', margin + contentWidth - 3, y + 5.5, { align: 'right' });
      
      // Vertical line dividing columns
      doc.line(margin + contentWidth - 50, y, margin + contentWidth - 50, y + salaryTableHeight);
      
      // Data rows
      let rowY = y + headerHeight;
      const dataRowHeight = 7;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Base Salary
      doc.text('Base Salary (Monthly)', margin + 3, rowY + 4);
      doc.text('Rs. ' + formatCurrency(payslipData.monthly_salary), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      // Per Day Salary
      doc.text('Per Day Salary', margin + 3, rowY + 4);
      doc.text('Rs. ' + formatCurrency(payslipData.per_day_salary), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      // Total Salary
      doc.text(`Total Salary (${present} Present + ${halfDay} Half + ${holiday} Holiday)`, margin + 3, rowY + 4);
      doc.text('Rs. ' + formatCurrency(payslipData.total_salary), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      // Bonus
      doc.setTextColor(22, 163, 74);
      doc.text('Bonus', margin + 3, rowY + 4);
      doc.text('+ Rs. ' + formatCurrency(payslipData.bonus), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      // Deduction
      doc.setTextColor(220, 38, 38);
      doc.text('Deduction', margin + 3, rowY + 4);
      doc.text('- Rs. ' + formatCurrency(payslipData.deduction), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      // NET PAYABLE row (wider row)
      const netPayableHeight = 12;
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, rowY, tableWidth, netPayableHeight, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(0.8);
      doc.rect(margin, rowY, tableWidth, netPayableHeight);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('NET PAYABLE', margin + 3, rowY + 8);
      doc.text('Rs. ' + formatCurrency(payslipData.final_salary), margin + contentWidth - 3, rowY + 8, { align: 'right' });
      
      y = rowY + netPayableHeight + 15; // Set y to below the salary table to avoid overlap
      
      // Special Days Section in PDF
      if (payslipData.special_days && payslipData.special_days.length > 0) {
        if (y > 250) { // Check for page break higher on the page to fit more on one page
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('SPECIAL ADJUSTMENTS', margin, y);
        doc.line(margin, y + 3, margin + 50, y + 3);
        y += 10;

        const specTableWidth = contentWidth;
        const specColW = [30, 30, specTableWidth - 60];
        
        // Header
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, specTableWidth, 8, 'F');
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, specTableWidth, 8);
        
        doc.setFontSize(8);
        doc.text('DATE', margin + 3, y + 5.5);
        doc.text('MULTIPLIER', margin + specColW[0] + 3, y + 5.5);
        doc.text('REASON', margin + specColW[0] + specColW[1] + 3, y + 5.5);
        
        y += 8;
        
        // Rows
        doc.setFont('helvetica', 'normal');
        payslipData.special_days.forEach(day => {
          const rowH = 7;
          if (y + rowH > 280) {
            doc.addPage();
            y = 20;
          }
          doc.setDrawColor(0);
          doc.rect(margin, y, specTableWidth, rowH);
          doc.text(day.date, margin + 3, y + 4.5);
          doc.text(day.multiplier + 'x', margin + specColW[0] + 3, y + 4.5);
          doc.text(day.reason, margin + specColW[0] + specColW[1] + 3, y + 4.5);
          y += rowH;
        });
        
        y += 8;
      }
      
      y = Math.min(y + 10, 265); // Dynamic footer position with safety margin for bottom of page
      
      // Footer
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 16, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(1);
      doc.line(margin, y, margin + contentWidth, y);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('RUBAN ELECTRICALS', pageWidth / 2, y + 6, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      doc.text(`Generated on ${today}`, pageWidth / 2, y + 12, { align: 'center' });
      
      // Save the PDF
      const filename = `Payslip_${String(payslipData.staff_name).replace(/\s+/g, '_')}_${month}_${year}.pdf`;
      doc.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + error.message);
    }
  };

  // Send payslip via WhatsApp - generates PDF and opens WhatsApp
  const handleSendPayslipWhatsApp = async () => {
    if (!payslipData) return;
    
    try {
      // First generate the PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = 210;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let y = 15;
      
      const formatCurrency = (amount) => {
        const num = parseFloat(amount || 0);
        return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };
      
      // Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(margin, y, contentWidth, 40);
      
      try {
        doc.addImage(logoImage, 'JPEG', pageWidth / 2 - 10, y + 2, 20, 16);
      } catch (e) {}
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('RUBAN ELECTRICALS', pageWidth / 2, y + 24, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text('Service Management System', pageWidth / 2, y + 29, { align: 'center' });
      
      const monthName = months.find(m => m.value === parseInt(month))?.label || month;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Payslip - ${monthName} ${year}`, pageWidth / 2, y + 36, { align: 'center' });
      
      y = 52;
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentWidth, y);
      doc.line(margin, y + 8, margin + contentWidth, y + 8);
      doc.setFontSize(11);
      doc.text('PAY SLIP', pageWidth / 2, y + 5.5, { align: 'center' });
      
      y += 12;
      // Employee Info
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 26, 'F');
      doc.rect(margin, y, contentWidth, 26);
      doc.line(margin + (contentWidth / 2), y, margin + (contentWidth / 2), y + 26);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('EMPLOYEE NAME', margin + 5, y + 7);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(String(payslipData.staff_name || 'N/A'), margin + 5, y + 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('PHONE NUMBER', margin + (contentWidth / 2) + 5, y + 7);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(String(payslipData.phone || 'N/A'), margin + (contentWidth / 2) + 5, y + 15);
      
      y += 24;
      // Attendance
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ATTENDANCE', margin, y);
      doc.line(margin, y + 3, margin + 35, y + 3);
      y += 10;
      
      const tableWidth = contentWidth;
      const colW = tableWidth / 6;
      doc.rect(margin, y, tableWidth, 22, 'F');
      doc.rect(margin, y, tableWidth, 22);
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, tableWidth, 8, 'F');
      doc.line(margin, y + 8, margin + tableWidth, y + 8);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('PRESENT', margin + 3, y + 5.5);
      doc.text('HALF DAY', margin + colW + 3, y + 5.5);
      doc.text('HOLIDAY', margin + (colW * 2) + 3, y + 5.5);
      doc.text('LEAVE', margin + (colW * 3) + 3, y + 5.5);
      doc.text('ABSENT', margin + (colW * 4) + 3, y + 5.5);
      doc.text('TOTAL', margin + (colW * 5) + 3, y + 5.5);
      
      for (let i = 1; i < 6; i++) {
        doc.line(margin + (colW * i), y, margin + (colW * i), y + 22);
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const present = payslipData.present_days || 0;
      const halfDay = payslipData.half_days || 0;
      const holiday = payslipData.holiday_days || 0;
      const leave = payslipData.leave_days || 0;
      const absent = payslipData.absent_days || 0;
      const total = present + halfDay + holiday + leave + absent;
      
      doc.text(String(present), margin + 3, y + 15);
      doc.text(String(halfDay), margin + colW + 3, y + 15);
      doc.text(String(holiday), margin + (colW * 2) + 3, y + 15);
      doc.text(String(leave), margin + (colW * 3) + 3, y + 15);
      doc.text(String(absent), margin + (colW * 4) + 3, y + 15);
      doc.text(String(total), margin + (colW * 5) + 3, y + 15);
      
      y += 26;
      // Salary Details
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SALARY DETAILS', margin, y);
      doc.line(margin, y + 3, margin + 40, y + 3);
      y += 10;
      
      const salaryTableHeight = 50;
      doc.rect(margin, y, tableWidth, salaryTableHeight, 'F');
      doc.rect(margin, y, tableWidth, salaryTableHeight);
      
      const headerHeight = 8;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, tableWidth, headerHeight, 'F');
      doc.line(margin, y + headerHeight, margin + tableWidth, y + headerHeight);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('DESCRIPTION', margin + 3, y + 5.5);
      doc.text('AMOUNT', margin + contentWidth - 3, y + 5.5, { align: 'right' });
      doc.line(margin + contentWidth - 50, y, margin + contentWidth - 50, y + salaryTableHeight);
      
      let rowY = y + headerHeight;
      const dataRowHeight = 7;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      doc.text('Base Salary (Monthly)', margin + 3, rowY + 4);
      doc.text('Rs. ' + formatCurrency(payslipData.monthly_salary), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      doc.text('Per Day Salary', margin + 3, rowY + 4);
      doc.text('Rs. ' + formatCurrency(payslipData.per_day_salary), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      doc.text(`Total Salary (${present} Present + ${halfDay} Half + ${holiday} Holiday)`, margin + 3, rowY + 4);
      doc.text('Rs. ' + formatCurrency(payslipData.total_salary), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      doc.setTextColor(22, 163, 74);
      doc.text('Bonus', margin + 3, rowY + 4);
      doc.text('+ Rs. ' + formatCurrency(payslipData.bonus), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      doc.setTextColor(220, 38, 38);
      doc.text('Deduction', margin + 3, rowY + 4);
      doc.text('- Rs. ' + formatCurrency(payslipData.deduction), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      const netPayableHeight = 12;
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, rowY, tableWidth, netPayableHeight, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(0.8);
      doc.rect(margin, rowY, tableWidth, netPayableHeight);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('NET PAYABLE', margin + 3, rowY + 8);
      doc.text('Rs. ' + formatCurrency(payslipData.final_salary), margin + contentWidth - 3, rowY + 8, { align: 'right' });
      
      y = rowY + netPayableHeight + 15; // Set y to below the salary table to avoid overlap

      // Special Days Section in WhatsApp PDF
      if (payslipData.special_days && payslipData.special_days.length > 0) {
        if (y > 250) { // Check for page break
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('SPECIAL ADJUSTMENTS', margin, y);
        doc.line(margin, y + 3, margin + 50, y + 3);
        y += 10;

        const specTableWidth = contentWidth;
        const specColW = [30, 30, specTableWidth - 60];
        
        // Header
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, specTableWidth, 8, 'F');
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, specTableWidth, 8);
        
        doc.setFontSize(8);
        doc.text('DATE', margin + 3, y + 5.5);
        doc.text('MULTIPLIER', margin + specColW[0] + 3, y + 5.5);
        doc.text('REASON', margin + specColW[0] + specColW[1] + 3, y + 5.5);
        
        y += 8;
        
        // Rows
        doc.setFont('helvetica', 'normal');
        payslipData.special_days.forEach(day => {
          const rowH = 7;
          if (y + rowH > 280) {
            doc.addPage();
            y = 20;
          }
          doc.setDrawColor(0);
          doc.rect(margin, y, specTableWidth, rowH);
          doc.text(day.date, margin + 3, y + 4.5);
          doc.text(day.multiplier + 'x', margin + specColW[0] + 3, y + 4.5);
          doc.text(day.reason, margin + specColW[0] + specColW[1] + 3, y + 4.5);
          y += rowH;
        });
        
        y += 8;
      }

      y = Math.min(y + 10, 265);

      // Footer
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 16, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(1);
      doc.line(margin, y, margin + contentWidth, y);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('RUBAN ELECTRICALS', pageWidth / 2, y + 6, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const todayText = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      doc.text(`Generated on ${todayText}`, pageWidth / 2, y + 12, { align: 'center' });
      
      // Generate PDF blob
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create WhatsApp message with payslip details
      let specialDaysText = '';
      if (payslipData.special_days && payslipData.special_days.length > 0) {
        specialDaysText = `*Special Adjustments:*%0A`;
        payslipData.special_days.forEach(day => {
          specialDaysText += `• ${day.date}: ${day.multiplier}x (${day.reason})%0A`;
        });
        specialDaysText += `%0A`;
      }

      const message = `*PAY SLIP - ${monthName} ${year}*%0A%0A` +
        `*Employee:* ${payslipData.staff_name}%0A` +
        `*Present:* ${present} | *Half Day:* ${halfDay}%0A` +
        `*Base Salary:* Rs.${formatCurrency(payslipData.monthly_salary)}%0A` +
        `*Total Salary:* Rs.${formatCurrency(payslipData.total_salary)}%0A` +
        `*Bonus:* Rs.${formatCurrency(payslipData.bonus)}%0A` +
        `*Deduction:* Rs.${formatCurrency(payslipData.deduction)}%0A` +
        specialDaysText +
        `*NET PAYABLE:* Rs.${formatCurrency(payslipData.final_salary)}%0A%0A` +
        `Please find the payslip PDF attached.%0A%0A` +
        `Thank you!`;
      
      if (payslipData.phone) {
        // Open WhatsApp with message
        const phoneNumber = payslipData.phone.replace(/\D/g, '');
        const waUrl = `https://wa.me/${phoneNumber}?text=${message}`;
        window.open(waUrl, '_blank');
        
        // Also download the PDF so user can attach it
        const filename = `Payslip_${payslipData.staff_name.replace(/\s+/g, '_')}_${month}_${year}.pdf`;
        doc.save(filename);
        
        // Show instruction
        setTimeout(() => {
          alert('PDF downloaded! Please attach it to the WhatsApp message.');
        }, 1000);
      } else {
        alert('Staff phone number not available');
      }
      
    } catch (error) {
      console.error('Error sending payslip via WhatsApp:', error);
      alert('Error generating payslip. Please try again.');
    }
  };

  const getTotalSalary = () => {
    return payrollData.reduce((sum, staff) => {
      const currentBonus = bonus[staff.staff_id] !== undefined ? parseFloat(bonus[staff.staff_id]) || 0 : (staff.bonus || 0);
      const currentDeduction = deduction[staff.staff_id] !== undefined ? parseFloat(deduction[staff.staff_id]) || 0 : (staff.deduction || 0);
      return sum + ((staff.total_salary || 0) + currentBonus - currentDeduction);
    }, 0);
  };

  const getTotalPresent = () => {
    return payrollData.reduce((sum, staff) => sum + (staff.present_days || 0), 0);
  };

  const getTotalHalfDays = () => {
    return payrollData.reduce((sum, staff) => sum + (staff.half_days || 0), 0);
  };

  const getTotalLeaveDays = () => {
    return payrollData.reduce((sum, staff) => sum + (staff.leave_days || 0), 0);
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPayrollHistory();
    } else if (activeTab === 'ranking') {
      fetchRanking();
    }
  }, [activeTab, month, year]);

  return (
    <div className="payroll-page">
      {/* Payslip Modal */}
      {showPayslipModal && payslipData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          ref={payslipModalRef}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h2 style={{
                color: '#fff',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                Payslip - {payslipData.staff_name}
              </h2>
              <button
                onClick={() => setShowPayslipModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FiX size={20} color="#fff" />
              </button>
            </div>
            
            {/* Modal Content - Payslip Preview */}
            <div 
              className="payslip-modal-content"
              style={{
                padding: '20px',
                background: '#fff',
                margin: '20px',
                borderRadius: '12px'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: payslipHtml }} />
            </div>
            
            {/* Modal Footer - Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '16px 20px',
              borderTop: '1px solid rgba(255,255,255,0.2)'
            }}>
              <button
                onClick={handleDownloadPayslip}
                style={{
                  flex: 1,
                  background: '#fff',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <FiDownload size={18} />
                Download Payslip
              </button>
              <button
                onClick={handleSendPayslipWhatsApp}
                style={{
                  flex: 1,
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <FiMessageCircle size={18} />
                Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="payroll-blob payroll-blob1"></div>
      <div className="payroll-blob payroll-blob2"></div>
      <style>{styles}</style>
      
      <div className="payroll-content">
        <div className="payroll-header">
          <h1 className="payroll-title">Payroll <em>Management</em></h1>
          
          <div className="payroll-controls">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="payroll-select"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="payroll-select"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="payroll-tabs">
          <button
            onClick={() => setActiveTab('calculate')}
            className={`payroll-tab ${activeTab === 'calculate' ? 'active-tab' : ''}`}
          >
            <FiFileText />
            Calculate Payroll
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`payroll-tab ${activeTab === 'history' ? 'active-tab' : ''}`}
          >
            <FiClock />
            Payroll History
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`payroll-tab ${activeTab === 'ranking' ? 'active-tab' : ''}`}
          >
            <FiAward />
            Staff Ranking
          </button>
        </div>

      {/* Calculate Payroll Tab */}
      {activeTab === 'calculate' && (
        <>
          <div className="payroll-actions">
            <button
              onClick={calculatePayroll}
              disabled={loading}
              className="payroll-btn payroll-btn-primary"
            >
              {loading ? 'Calculating...' : 'Calculate Payroll'}
            </button>

            <button
              onClick={savePayroll}
              disabled={saving || payrollData.length === 0}
              className="payroll-btn payroll-btn-primary"
            >
              {saving ? 'Saving...' : 'Generate & Save Payroll'}
            </button>

            <button
              onClick={exportToExcel}
              disabled={payrollData.length === 0}
              className="payroll-btn payroll-btn-success"
            >
              <FiFilePlus style={{ marginRight: '8px' }} />
              Export to Excel
            </button>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`payroll-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Summary Cards */}
          {payrollData.length > 0 && (
            <div className="payroll-summary">
              <div className="payroll-summary-item staff">
                <div className="payroll-summary-label">Total Staff</div>
                <div className="payroll-summary-value">{payrollData.length}</div>
              </div>
              <div className="payroll-summary-item present">
                <div className="payroll-summary-label">Total Present</div>
                <div className="payroll-summary-value">{getTotalPresent()}</div>
              </div>
              <div className="payroll-summary-item halfday">
                <div className="payroll-summary-label">Total Half Days</div>
                <div className="payroll-summary-value">{getTotalHalfDays()}</div>
              </div>
              <div className="payroll-summary-item leave">
                <div className="payroll-summary-label">Total Leave</div>
                <div className="payroll-summary-value">{getTotalLeaveDays()}</div>
              </div>
              <div className="payroll-summary-item salary">
                <div className="payroll-summary-label">Total Salary</div>
                <div className="payroll-summary-value">₹{getTotalSalary().toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Payroll Table */}
          {payrollData.length > 0 ? (
            <div className="payroll-table-container" style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Per Day</th>
                    <th>Present</th>
                    <th>Half Day</th>
                    <th>Holiday</th>
                    <th>Multiplier ℹ️</th>
                    <th>Leave</th>
                    <th>Absent</th>
                    <th>Bonus</th>
                    <th>Deduction</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.map((staff, index) => (
                    <tr key={index}>
                      <td className="staff-name">{staff.staff_name}</td>
                      <td>₹{staff.per_day_salary}</td>
                      <td><span className="attendance-badge present-badge">{staff.present_days}</span></td>
                      <td><span className="attendance-badge halfday-badge">{staff.half_days}</span></td>
                      <td><span className="attendance-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>{staff.holiday_days || 0}</span></td>
                      <td>
                        {staff.total_multiplier > 0 ? (
                           <span title="Total multiplier includes Present days, Half days (0.5), and Paid Holidays/Weekly Offs" style={{ 
                            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
                            cursor: 'help'
                          }}>
                            {staff.total_multiplier}x
                          </span>
                        ) : '-'}
                      </td>
                      <td><span className="attendance-badge leave-badge">{staff.leave_days}</span></td>
                      <td><span className="attendance-badge absent-badge">{staff.absent_days}</span></td>
                      <td>
                        <input
                          type="number"
                          value={bonus[staff.staff_id] !== undefined ? bonus[staff.staff_id] : staff.bonus}
                          onChange={(e) => handleBonusChange(staff.staff_id, e.target.value)}
                          className="payroll-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={deduction[staff.staff_id] !== undefined ? deduction[staff.staff_id] : staff.deduction}
                          onChange={(e) => handleDeductionChange(staff.staff_id, e.target.value)}
                          className="payroll-input"
                        />
                      </td>
                      <td className="amount">₹{((staff.total_salary || 0) + (bonus[staff.staff_id] !== undefined ? parseFloat(bonus[staff.staff_id]) || 0 : staff.bonus || 0) - (deduction[staff.staff_id] !== undefined ? parseFloat(deduction[staff.staff_id]) || 0 : staff.deduction || 0)).toLocaleString()}</td>
                      <td>
                        <button
                          onClick={() => downloadPayslip(staff)}
                          className="payroll-action-btn"
                        >
                          <FiDownload /> Payslip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="payroll-empty">
              <div className="payroll-empty-icon">📊</div>
              <p>No payroll data. Select month and year, then click "Calculate Payroll"</p>
            </div>
          )}
        </>
      )}

      {/* Payroll History Tab */}
      {activeTab === 'history' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <h2 className="payroll-section-title" style={{ margin: 0 }}>Payroll History</h2>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="payroll-select"
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="payroll-select"
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => fetchPayrollHistory()}
              className="btn-primary"
              style={{ padding: '8px 16px', borderRadius: '6px' }}
            >
              Search
            </button>
          </div>
          <p style={{ marginTop: '-10px', marginBottom: '20px', color: '#666', fontSize: '14px' }}>
            Showing payroll history for: <strong>{months.find(m => m.value === parseInt(month))?.label} {year}</strong>
          </p>
          {payrollHistory.length > 0 ? (
            <div className="payroll-table-container" style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Present</th>
                    <th>Half Day</th>
                    <th>Holiday</th>
                    <th>Leave</th>
                    <th>Absent</th>
                    <th>Bonus</th>
                    <th>Deduction</th>
                    <th>Final Salary</th>
                    <th>Generated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollHistory.map((record, index) => (
                    <tr key={index}>
                      <td className="staff-name">{record.staff_name}</td>
                      <td><span className="attendance-badge present-badge">{record.present_days}</span></td>
                      <td><span className="attendance-badge halfday-badge">{record.half_days}</span></td>
                      <td><span className="attendance-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>{record.holiday_days || 0}</span></td>
                      <td><span className="attendance-badge leave-badge">{record.leave_days}</span></td>
                      <td><span className="attendance-badge absent-badge">{record.absent_days}</span></td>
                      <td style={{ color: '#16a34a', fontWeight: '600' }}>₹{record.bonus || 0}</td>
                      <td style={{ color: '#dc2626', fontWeight: '600' }}>₹{record.deduction || 0}</td>
                      <td className="amount">₹{((record.total_salary || 0) + (record.bonus || 0) - (record.deduction || 0)).toLocaleString()}</td>
                      <td style={{ fontSize: '12px' }}>{record.generated_at}</td>
                      <td>
                        <button
                          onClick={() => downloadPayslip(record)}
                          className="payroll-action-btn"
                        >
                          <FiDownload /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="payroll-empty">
              <div className="payroll-empty-icon">📁</div>
              <p>No payroll history found for this month.</p>
              <p>Generate payroll from "Calculate Payroll" tab first.</p>
            </div>
          )}
        </>
      )}

      {/* Staff Ranking Tab */}
      {activeTab === 'ranking' && (
        <>
          <h2 className="payroll-section-title">Staff Attendance Ranking - {months.find(m => m.value === parseInt(month))?.label} {year}</h2>
          {rankingData.length > 0 ? (
            <div className="payroll-table-container" style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Staff Name</th>
                    <th>Present</th>
                    <th>Half Day</th>
                    <th>Holiday</th>
                    <th>Leave</th>
                    <th>Absent</th>
                    <th>Total Worked</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingData.map((staff, index) => (
                    <tr className={staff.rank <= 3 ? `payroll-row-${staff.rank === 1 ? 'gold' : staff.rank === 2 ? 'silver' : 'bronze'}` : ''}>
                      <td>
                        <span className={`payroll-rank-badge ${staff.rank === 1 ? 'gold' : staff.rank === 2 ? 'silver' : staff.rank === 3 ? 'bronze' : 'default'}`}>
                          {staff.rank}
                        </span>
                      </td>
                      <td className="staff-name">{staff.staff_name}</td>
                      <td><span className="attendance-badge present-badge">{staff.present_days}</span></td>
                      <td><span className="attendance-badge halfday-badge">{staff.half_days}</span></td>
                      <td><span className="attendance-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>{staff.holiday_days || 0}</span></td>
                      <td><span className="attendance-badge leave-badge">{staff.leave_days}</span></td>
                      <td><span className="attendance-badge absent-badge">{staff.absent_days}</span></td>
                      <td style={{ fontWeight: '600' }}>{staff.total_worked_days}</td>
                      <td>
                        <span className={`payroll-attendance-badge ${staff.attendance_percentage >= 80 ? 'excellent' : staff.attendance_percentage >= 60 ? 'good' : 'poor'}`}>
                          {staff.attendance_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <p>No attendance data found for this month.</p>
            </div>
          )}
        </>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        borderLeft: '4px solid #1976d2'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>How Payroll Works:</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#333' }}>
          <li><strong>Set Salary:</strong> Go to Staff page to set monthly/per-day salary for each staff</li>
          <li><strong>Mark Attendance:</strong> Daily attendance with Leave, Half Day, and Special Day options</li>
          <li><strong>Calculate:</strong> Click "Calculate Payroll" to compute salary based on attendance</li>
          <li><strong>Generate:</strong> Click "Generate & Save Payroll" to store as history</li>
          <li><strong>Export:</strong> Click "Export to Excel" to download payroll report</li>
          <li><strong>Download:</strong> Click "Payslip" to download individual staff payslip</li>
          <li><strong>Ranking:</strong> View staff attendance ranking to identify best performers</li>
        </ul>
      </div>
      </div>
    </div>
  );
};

export default Payroll;
