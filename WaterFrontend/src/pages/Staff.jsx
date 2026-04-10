import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import api from "../api";
import { useGlobalRefresh } from "../context/GlobalRefreshContext";
import { useScrollToRef } from "../hooks/useScrollToRef";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiTrash2,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiRefreshCcw,
  FiSave,
  FiXCircle,
  FiCamera,
  FiEdit,
  FiEdit2,
  FiSearch,
  FiPlusCircle,
  FiUserCheck,
  FiCalendar,
  FiCheckCircle,
  FiXCircle as FiXCircleIcon,
  FiAlertTriangle,
  FiBell,
  FiClock,
  FiDollarSign,
  FiPlus,
  FiX,
  FiCheck,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";

// Filter options for staff
const FILTER_OPTIONS = [
  { label: "Active Staff", value: "active", icon: <FiUsers /> },
  { label: "Deleted Staff", value: "deleted", icon: <FiTrash2 /> },
];

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

// Reusable component to display a row of info
const InfoRow = ({ icon, label, value }) => (
  <div className="info-row">
    <span className="info-row-icon">{icon}</span>
    <span className="info-row-label">{label}</span>
    <span className="info-row-value">{value}</span>
  </div>
);

const Staff = () => {
  const [staffs, setStaffs] = useState([]);
  const [deletedStaffs, setDeletedStaffs] = useState([]);
  const [filteredStaffs, setFilteredStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState(null);

  // Use global refresh context
  const { refreshTriggers, triggerRefresh } = useGlobalRefresh();

  // Attendance states
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceType, setAttendanceType] = useState({}); // For leave/present/absent
  const [workType, setWorkType] = useState({}); // For full_day/half_day
  const [salaryMultiplier, setSalaryMultiplier] = useState({}); // For special days multiplier
  const [salaryMultiplierReason, setSalaryMultiplierReason] = useState({}); // For multiplier reason
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [todayHolidays, setTodayHolidays] = useState([]);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);

  // History states
  const [historyFilter, setHistoryFilter] = useState('date'); // 'date', 'month', 'staff'
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [historyStaffName, setHistoryStaffName] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [historySummary, setHistorySummary] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Present/Absent staff details states
  const [presentStaffDetails, setPresentStaffDetails] = useState([]);
  const [absentStaffDetails, setAbsentStaffDetails] = useState([]);
  const [showPresentDetails, setShowPresentDetails] = useState(false);
  const [showAbsentDetails, setShowAbsentDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [editingStaffId, setEditingStaffId] = useState(null);
  
  // Salary states
  const [monthlySalary, setMonthlySalary] = useState("");
  const [perDaySalary, setPerDaySalary] = useState("");
  const [weeklyOffDays, setWeeklyOffDays] = useState([]);

  // Tab state
  const [activeStaffTab, setActiveStaffTab] = useState("attendance");

  // Holiday Calendar states (Ported from HolidayManagement)
  const [holidays, setHolidays] = useState([]);
  const [holidayCurrentDate, setHolidayCurrentDate] = useState(new Date());
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayFormData, setHolidayFormData] = useState({
    date: "",
    name: "",
    type: "company_holiday",
    staff_id: "",
    is_paid: true
  });
  // Manage body scroll when modal opens/closes
  useEffect(() => {
    if (showAttendanceHistory || showForm || showPresentDetails || showAbsentDetails || showHolidayModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showAttendanceHistory, showForm, showPresentDetails, showAbsentDetails, showHolidayModal]);

  // Removed manual scroll-to-top useEffect as useScrollToRef handles it


  const fileInputRef = useRef(null);

  // Scroll Refs for modals
  const addStaffRef = useScrollToRef(showForm);
  const presentDetailsRef = useScrollToRef(showPresentDetails);
  const absentDetailsRef = useScrollToRef(showAbsentDetails);
  const holidayModalRef = useScrollToRef(showHolidayModal);
  const attendanceHistoryRef = useScrollToRef(showAttendanceHistory);

  // Listen for global refresh triggers
  useEffect(() => {
    // Refresh staff data when trigger is fired
    if (refreshTriggers.staff > 0) {
      fetchStaffs();
      fetchDeletedStaffs();
      checkAttendanceStatus();
    }
  }, [refreshTriggers.staff]);

  useEffect(() => {
    fetchStaffs();
    fetchDeletedStaffs();
    checkAttendanceStatus();

    // Check if attendance reminder should be shown from login
    const showReminderFromLogin = sessionStorage.getItem('showAttendanceReminder');
    if (showReminderFromLogin === 'true') {
      setShowReminder(true);
      sessionStorage.removeItem('showAttendanceReminder'); // Clear the flag
    }
    fetchTodayHolidays();
  }, []);

  const fetchTodayHolidays = async () => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const res = await api.get(`holiday-calendar/?month=${month}&year=${year}`);
      if (res.data && res.data.success) {
        const todayStr = today.toISOString().split('T')[0];
        const hols = res.data.data.filter(h => h.date.split('T')[0] === todayStr);
        setTodayHolidays(hols);
      }
    } catch (error) {
      console.error('Error fetching today\'s holidays:', error);
    }
  };

  const fetchMonthHolidays = useCallback(async () => {
    try {
      const month = holidayCurrentDate.getMonth() + 1;
      const year = holidayCurrentDate.getFullYear();
      const res = await api.get(`holiday-calendar/?month=${month}&year=${year}`);
      if (res.data.success) {
        setHolidays(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  }, [holidayCurrentDate]);

  useEffect(() => {
    if (activeStaffTab === "holidays") {
      fetchMonthHolidays();
    }
  }, [activeStaffTab, fetchMonthHolidays]);

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...holidayFormData };
      if (data.staff_id === "" || data.type === 'company_holiday') data.staff_id = null;

      if (editingHoliday) {
        await api.put(`holiday-calendar/${editingHoliday.id}/`, data);
      } else {
        await api.post("holiday-calendar/", data);
      }
      setShowHolidayModal(false);
      setEditingHoliday(null);
      setHolidayFormData({ date: "", name: "", type: "company_holiday", staff_id: "", is_paid: true });
      fetchMonthHolidays();
    } catch (error) {
      alert("Error saving holiday. Please check if date is already taken for this staff member.");
    }
  };

  const handleHolidayDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        await api.delete(`holiday-calendar/${id}/`);
        fetchMonthHolidays();
      } catch (error) {
        alert("Error deleting holiday.");
      }
    }
  };

  const renderHolidayCalendar = () => {
    const year = holidayCurrentDate.getFullYear();
    const month = holidayCurrentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust firstDayOfMonth for Monday start
    const adjustedStart = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);
    
    const days = [];
    // Padding for prev month
    for (let i = 0; i < adjustedStart; i++) {
        days.push(<div key={`pad-${i}`} className="calendar-day padding"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayHolidays = holidays.filter(h => h.date.split('T')[0] === dateStr);
        const isWeeklyOff = dayHolidays.some(h => h.type === 'weekly_off');
        const isHoliday = dayHolidays.some(h => h.type !== 'weekly_off');

        days.push(
            <motion.div 
                key={d} 
                className={`calendar-day ${isHoliday ? 'has-holiday' : ''} ${isWeeklyOff && !isHoliday ? 'has-weekly-off' : ''}`}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                    setHolidayFormData({ ...holidayFormData, date: dateStr });
                    setShowHolidayModal(true);
                }}
            >
                <span className="day-number">{d}</span>
                <div className="holiday-badges">
                    {dayHolidays.map(h => (
                        <div 
                            key={h.id} 
                            className={`holiday-badge ${h.type} ${!h.is_paid ? 'unpaid' : ''}`}
                            title={`${h.name}${!h.is_paid ? ' (Unpaid)' : ''}`}
                        >
                            {h.type === 'company_holiday' ? <FiUsers size={10} /> : <FiUser size={10} />}
                            <span className="h-name">{h.name === 'Sunday' && h.type === 'weekly_off' ? 'Week Off' : h.name}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        );
    }

    return days;
  };

  // Attendance functions
  const checkAttendanceStatus = async () => {
    try {
      const res = await api.get('staff-attendance/today/');
      setAttendanceSummary(res.data);
      setAttendanceSubmitted(res.data.attendance_marked);

      // Show reminder if attendance not marked and user is admin
      const userRole = sessionStorage.getItem('role');
      if (userRole && (userRole === 'admin' || userRole === 'bigadmin') && !res.data.attendance_marked) {
        setShowReminder(true);
      }
    } catch (error) {
      console.error('Error checking attendance status:', error);
    }
  };

  // Fetch attendance history with filters
  const fetchAttendanceHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();

      if (historyFilter === 'date') {
        params.append('date', historyDate);
      } else if (historyFilter === 'month') {
        params.append('month', historyMonth);
      } else if (historyFilter === 'range') {
        if (historyStartDate && historyEndDate) {
          params.append('start_date', historyStartDate);
          params.append('end_date', historyEndDate);
        }
      } else if (historyFilter === 'staff') {
        params.append('staff_name', historyStaffName);
      }

      const res = await api.get(`staff-attendance/list/?${params.toString()}`);
      setHistoryData(res.data.attendance_data || []);
      setHistorySummary(res.data.summary || null);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      setHistoryData([]);
      setHistorySummary(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAttendanceChange = (staffId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [staffId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    // Check current attendance status before submission
    try {
      const statusRes = await api.get('staff-attendance/today/');
      if (statusRes.data.attendance_marked) {
        alert('Attendance already marked for today');
        setAttendanceSubmitted(true);
        setShowReminder(false);
        return;
      }
    } catch (error) {
      console.error('Error checking attendance status:', error);
    }

    const attendanceList = staffs.map(staff => ({
      staff_id: staff.id,
      staff_name: staff.name,
      status: attendanceData[staff.id] || 'Absent',
      attendance_type: attendanceType[staff.id] || 'present', // present/absent/leave
      work_type: workType[staff.id] || 'full_day', // full_day/half_day
      salary_multiplier: parseFloat(salaryMultiplier[staff.id]) || 1, // 1, 1.5, 2, etc.
      salary_multiplier_reason: salaryMultiplierReason[staff.id] || '', // Legacy field
      override_reason: salaryMultiplierReason[staff.id] || '' // New logic layer field
    }));

    try {
      setAttendanceLoading(true);

      // Get user info from sessionStorage
      const userRole = sessionStorage.getItem('role');
      const userName = sessionStorage.getItem('user_id'); // Using user_id as fallback for name

      console.log('Attendance submission debug:', {
        userRole,
        userName,
        attendanceList,
        headers: {
          'X-User-Role': userRole || 'admin',
          'X-User-Name': userName || 'Unknown Admin'
        }
      });

      const headers = {
        'X-User-Role': userRole || 'admin',
        'X-User-Name': userName || 'Unknown Admin'
      };

      // Use direct axios call to avoid Bearer token interference
      const res = await axios.post(`${api.defaults.baseURL}staff-attendance/mark/`, {
        attendance: attendanceList
      }, {
        headers: {
          ...headers,
          'Authorization': undefined  // Remove Bearer token for this specific endpoint
        },
        withCredentials: true
      });

      console.log('Attendance submission response:', res.data);

      // Handle success response
      if (res.data && res.data.success) {
        alert(`✅ ${res.data.message}`);
        setAttendanceSubmitted(true);
        setShowReminder(false);
        checkAttendanceStatus();
      } else {
        alert('Attendance marked, but response format unexpected. Please refresh the page.');
        setAttendanceSubmitted(true);
        setShowReminder(false);
        checkAttendanceStatus();
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        request: error.request
      });

      if (error.response) {
        // Server responded with error status
        alert(`Failed to submit attendance. Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        alert('Failed to submit attendance. Network error. Please check your connection.');
      } else {
        // Something else happened
        alert('Failed to submit attendance. Please try again.');
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleRefreshAttendance = () => {
    checkAttendanceStatus();
    setAttendanceData({});
  };

  // Functions to fetch present/absent staff details
  const fetchPresentStaffDetails = async () => {
    try {
      setDetailsLoading(true);
      const res = await api.get('staff-attendance/present/');
      // API returns { staff: [...], present_count: X }
      setPresentStaffDetails(res.data.staff || []);
      setShowPresentDetails(true);
    } catch (error) {
      console.error('Error fetching present staff details:', error);
      alert('Failed to fetch present staff details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchAbsentStaffDetails = async () => {
    try {
      setDetailsLoading(true);
      const res = await api.get('staff-attendance/absent/');
      // API returns { staff: [...], absent_count: X }
      setAbsentStaffDetails(res.data.staff || []);
      setShowAbsentDetails(true);
    } catch (error) {
      console.error('Error fetching absent staff details:', error);
      alert('Failed to fetch absent staff details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAttendanceFilter = (status) => {
    // Toggle behavior: clicking same filter again resets it
    if (attendanceFilter === status) {
      setAttendanceFilter(null);
      fetchStaffs(null);
    } else {
      setAttendanceFilter(status);
      fetchStaffs(status);
    }
  };

  const fetchStaffs = async (attendanceStatus = null) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (attendanceStatus) {
        params.append('attendance_status', attendanceStatus);
      }

      const queryString = params.toString();
      const endpoint = `staff/${queryString ? '?' + queryString : ''}`;

      const res = await api.get(endpoint);
      const updatedData = res.data.map((item) => ({
        ...item,
        photo_url: item.photo_url
          ? `${api.defaults.baseURL.replace("/api/", "")}${item.photo_url}`
          : null,
      }));
      setStaffs(updatedData);
      setFilteredStaffs(updatedData);
    } catch (error) {
      console.error("Error loading staff:", error);
      // Don't show alert on filter failure - just reset to all staff
      if (attendanceStatus) {
        // If filtering failed, fetch all staff instead
        try {
          const res = await api.get('staff/');
          const updatedData = res.data.map((item) => ({
            ...item,
            photo_url: item.photo_url
              ? `${api.defaults.baseURL.replace("/api/", "")}${item.photo_url}`
              : null,
          }));
          setStaffs(updatedData);
          setFilteredStaffs(updatedData);
          setAttendanceFilter(null);
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }
      } else {
        alert("Failed to load staff data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedStaffs = async () => {
    try {
      const res = await api.get(`staff/deleted-staffs/`);
      setDeletedStaffs(res.data);
    } catch (error) {
      console.error("Error loading deleted staff:", error);
    }
  };

  // Filter staff based on type, search, and attendance status
  useEffect(() => {
    let filtered = filter === "active" ? staffs : deletedStaffs;

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerText = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(lowerText) ||
        c.phone?.toLowerCase().includes(lowerText) ||
        c.email?.toLowerCase().includes(lowerText) ||
        c.location?.toLowerCase().includes(lowerText)
      );
    }

    // Filter by attendance status if set
    if (attendanceFilter) {
      filtered = filtered.filter(staff => {
        // For now, we'll rely on the backend to handle attendance filtering
        // This frontend filter is a fallback in case we need it
        return true; // Backend handles the actual filtering
      });
    }

    setFilteredStaffs(filtered);
  }, [staffs, deletedStaffs, filter, searchQuery, attendanceFilter]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const pickImage = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !location.trim()) {
      alert("Please fill all required fields");
      return;
    }
    if (phone.length !== 10) {
      alert("Phone number must be 10 digits");
      return;
    }
    // Email validation only if provided
    if (email.trim() && !email.trim().endsWith("@gmail.com")) {
      alert("Please enter a valid Gmail address");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("location", location);
    
    // Add salary fields
    if (monthlySalary) {
      formData.append("monthly_salary", monthlySalary);
    }
    if (perDaySalary) {
      formData.append("per_day_salary", perDaySalary);
    }
    
    // Add weekly off days as JSON string
    formData.append("weekly_off_days", JSON.stringify(weeklyOffDays));

    if (photoFile) {
      formData.append("photo", photoFile);
    }

    try {
      if (editingStaffId) {
        await api.put(`staff/${editingStaffId}/edit/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Staff updated successfully!");
      } else {
        await api.post(`staff/add/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Staff added successfully!");
      }
      // Trigger global refresh for all components
      triggerRefresh('staff');
      triggerRefresh('attendance');
      fetchStaffs();
      resetForm();
    } catch (error) {
      console.error("Failed to save staff:", error);
      alert("Failed to save staff. Check console for details.");
    }
  };

  const handleEdit = (staff) => {
    setEditingStaffId(staff.id);
    setName(staff.name);
    setEmail(staff.email || "");
    setPhone(staff.phone);
    setLocation(staff.location);
    setPhotoPreviewUrl(staff.photo_url || "");
    setPhotoFile(null);
    // Populate salary fields
    setMonthlySalary(staff.monthly_salary || staff.monthly_salary === 0 ? String(staff.monthly_salary) : "");
    setPerDaySalary(staff.per_day_salary || staff.per_day_salary === 0 ? String(staff.per_day_salary) : "");
    setWeeklyOffDays(staff.weekly_off_days || []);
    setShowForm(true);
  };

  const handleDelete = async (staffId) => {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return;
    }
    try {
      await api.delete(`staff/${staffId}/delete/`);
      alert("Staff deleted successfully!");
      // Trigger global refresh for all components
      triggerRefresh('staff');
      triggerRefresh('attendance');
      fetchStaffs();
    } catch (error) {
      console.error("Failed to delete staff:", error);
      alert("Failed to delete staff. Check console for details.");
    }
  };

  const resetForm = () => {
    setEditingStaffId(null);
    setName("");
    setEmail("");
    setPhone("");
    setLocation("");
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    // Clear salary fields
    setMonthlySalary("");
    setPerDaySalary("");
    setWeeklyOffDays([]);
    setShowForm(false);
  };

  const getFilterCounts = () => {
    return {
      active: staffs.length,
      deleted: deletedStaffs.length,
    };
  };

  const filterCounts = getFilterCounts();

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <FiUsers size={48} />
          <p>Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container staff-page">
      {/* PAGE TABS */}
      <div className="staff-tabs" style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.4)',
        borderRadius: '16px',
        width: 'fit-content',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
        backdropFilter: 'blur(10px)'
      }}>
        <button 
          className={`tab-button ${activeStaffTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveStaffTab('attendance')}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: activeStaffTab === 'attendance' ? 'transparent' : 'rgba(255, 255, 255, 0.8)',
            background: activeStaffTab === 'attendance' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255, 255, 255, 0.7)',
            color: activeStaffTab === 'attendance' ? 'white' : '#475569',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: activeStaffTab === 'attendance' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
          }}
        >
          <FiUserCheck />
          Attendance
        </button>
        <button 
          className={`tab-button ${activeStaffTab === 'holidays' ? 'active' : ''}`}
          onClick={() => setActiveStaffTab('holidays')}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: activeStaffTab === 'holidays' ? 'transparent' : 'rgba(255, 255, 255, 0.8)',
            background: activeStaffTab === 'holidays' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.7)',
            color: activeStaffTab === 'holidays' ? 'white' : '#475569',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: activeStaffTab === 'holidays' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
          }}
        >
          <FiCalendar />
          Holiday Calendar
        </button>
        <button 
          className={`tab-button ${activeStaffTab === 'management' ? 'active' : ''}`}
          onClick={() => setActiveStaffTab('management')}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: activeStaffTab === 'management' ? 'transparent' : 'rgba(255, 255, 255, 0.8)',
            background: activeStaffTab === 'management' ? 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' : 'rgba(255, 255, 255, 0.7)',
            color: activeStaffTab === 'management' ? 'white' : '#475569',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: activeStaffTab === 'management' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
          }}
        >
          <FiUsers />
          Staff Management
        </button>
      </div>

      {activeStaffTab === 'attendance' && (
        <>
          {/* ATTENDANCE REMINDER */}
          {showReminder && (
            <section className="page-section">
              <div className="reminder-banner">
                <div className="reminder-content">
                  <FiBell className="reminder-icon" />
                  <div className="reminder-text">
                    <h3>Attendance Reminder</h3>
                    <p>Today's staff attendance has not been marked yet. Please mark attendance for all staff members.</p>
                  </div>
                  <button
                    className="reminder-close"
                    onClick={() => setShowReminder(false)}
                  >
                    <FiXCircleIcon />
                  </button>
                </div>
              </div>
            </section>
          )}
      {/* ATTENDANCE SUMMARY CARDS */}
      <section className="page-section">
        <h2 className="section-title">Daily Attendance</h2>
        <p className="section-subtitle">Mark attendance for today's staff</p>

        <div className="attendance-summary-cards">
          <div className="summary-card">
            <div className="card-icon">
              <FiUsers />
            </div>
            <div className="card-content">
              <h3>Active Staff</h3>
              <p className="card-value">{attendanceSummary?.total_staff || staffs.length}</p>
            </div>
          </div>

          <div className={`summary-card ${attendanceFilter === 'present' ? 'active-filter' : ''}`}>
            <div className="card-icon present">
              <FiCheckCircle />
            </div>
            <div className="card-content">
              <h3>Present Today</h3>
              <p className="card-value present">{attendanceSummary?.present_count || 0}</p>
            </div>
          </div>

          <div className={`summary-card ${attendanceFilter === 'absent' ? 'active-filter' : ''}`}>
            <div className="card-icon absent">
              <FiXCircleIcon />
            </div>
            <div className="card-content">
              <h3>Absent Today</h3>
              <p className="card-value absent">{attendanceSummary?.absent_count || 0}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">
              <FiCalendar />
            </div>
            <div className="card-content">
              <h3>Status</h3>
              <p className={`card-value ${attendanceSubmitted ? 'completed' : 'pending'}`}>
                {attendanceSubmitted ? 'Marked' : 'Not Marked'}
              </p>
            </div>
          </div>
        </div>

        {/* ATTENDANCE ACTIONS */}
        <div className="attendance-actions">
          <button
            className="button-secondary"
            onClick={handleRefreshAttendance}
            disabled={attendanceLoading}
          >
            <FiRefreshCcw />
            <span>Refresh</span>
          </button>

          <button
            className="button-secondary"
            onClick={() => {
              setShowAttendanceHistory(!showAttendanceHistory);
              if (!showAttendanceHistory) {
                fetchAttendanceHistory();
              }
            }}
          >
            <FiCalendar />
            <span>Attendance History</span>
          </button>

          {!attendanceSubmitted && (
            <button
              className="button-primary"
              onClick={handleSubmitAttendance}
              disabled={attendanceLoading}
            >
              <FiSave />
              <span>Submit Attendance</span>
            </button>
          )}
        </div>

        {/* DAILY ATTENDANCE LIST */}
        {filter === "active" && (
          <div className="attendance-list">
            <h3>Staff Attendance for Today</h3>
            {attendanceSubmitted ? (
              <div className="attendance-locked-message">
                <FiClock />
                <p>Attendance already marked for today. You can view the history in the attendance section.</p>
              </div>
            ) : (
              <div className="attendance-grid">
                {staffs.map((staff) => (
                  <div key={staff.id} className="attendance-row">
                    <div className="staff-info">
                      {staff.photo_url && (
                        <img src={staff.photo_url} alt={staff.name} className="staff-avatar" />
                      )}
                      <div className="staff-details">
                        <span className="staff-name">{staff.name}</span>
                        <span className="staff-phone">{staff.phone}</span>
                      </div>
                    </div>
                    {/* Resolution Indicators (Intelligent Layer) */}
                    <div className="attendance-resolution-hints" style={{ display: 'flex', gap: '8px', marginBottom: '8px', paddingLeft: '56px' }}>
                      {/* Check for Global Holiday */}
                      {todayHolidays.some(h => !h.staff_id) && (
                        <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', border: '1px solid #F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiCalendar size={12} />
                          Holiday: {todayHolidays.find(h => !h.staff_id).name}
                        </span>
                      )}
                      
                      {/* Check for Staff Specific Holiday */}
                      {todayHolidays.some(h => h.staff_id === staff.id) && (
                        <span style={{ fontSize: '11px', background: '#DBEAFE', color: '#1E40AF', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', border: '1px solid #3B82F6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiCalendar size={12} />
                          Personal Holiday: {todayHolidays.find(h => h.staff_id === staff.id).name}
                        </span>
                      )}

                      {/* Check for Weekly Off */}
                      {staff.weekly_off_days && staff.weekly_off_days.includes(new Date().toLocaleDateString('en-US', { weekday: 'long' })) && (
                        <span style={{ fontSize: '11px', background: '#F3E8FF', color: '#6B21A8', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', border: '1px solid #8B5CF6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiClock size={12} />
                          Week Off ({new Date().toLocaleDateString('en-US', { weekday: 'long' })})
                        </span>
                      )}
                    </div>
                    <div className="attendance-controls">
                      <label className="attendance-option">
                        <input
                          type="radio"
                          name={`attendance-${staff.id}`}
                          value="Present"
                          checked={attendanceData[staff.id] === 'Present'}
                          onChange={() => handleAttendanceChange(staff.id, 'Present')}
                        />
                        <span className="attendance-label present">Present</span>
                      </label>
                      <label className="attendance-option">
                        <input
                          type="radio"
                          name={`attendance-${staff.id}`}
                          value="Absent"
                          checked={attendanceData[staff.id] === 'Absent' || !attendanceData[staff.id]}
                          onChange={() => handleAttendanceChange(staff.id, 'Absent')}
                        />
                        <span className="attendance-label absent">Absent</span>
                      </label>
                      {/* Leave Option */}
                      <label className="attendance-option">
                        <input
                          type="radio"
                          name={`attendance-${staff.id}`}
                          value="Leave"
                          checked={attendanceType[staff.id] === 'leave'}
                          onChange={() => {
                            setAttendanceType(prev => ({ ...prev, [staff.id]: 'leave' }));
                            setAttendanceData(prev => ({ ...prev, [staff.id]: 'Present' })); // Mark as present but leave type
                          }}
                        />
                        <span className="attendance-label" style={{ backgroundColor: '#9c27b0', color: 'white' }}>Leave</span>
                      </label>
                    </div>
                    {/* Work Type and Salary Multiplier */}
                    {(attendanceData[staff.id] === 'Present' || attendanceType[staff.id] === 'leave') && (
                      <div className="payroll-options" style={{ 
                        marginTop: '12px', 
                        display: 'flex', 
                        gap: '16px', 
                        flexWrap: 'wrap',
                        padding: '14px 16px',
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label style={{ 
                            fontSize: '13px', 
                            color: '#fff',
                            fontWeight: '600',
                            background: 'linear-gradient(135deg, #5B4FE9 0%, #7C3AED 100%)',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(91, 79, 238, 0.4)'
                          }}>
                            <FiClock size={14} />
                            Work
                          </label>
                          <select
                            value={workType[staff.id] || 'full_day'}
                            onChange={(e) => setWorkType(prev => ({ ...prev, [staff.id]: e.target.value }))}
                            style={{ 
                              padding: '8px 14px', 
                              fontSize: '13px', 
                              borderRadius: '8px', 
                              border: '2px solid #5B4FE9',
                              background: '#fff',
                              color: '#1e1b4b',
                              fontWeight: '600',
                              cursor: 'pointer',
                              outline: 'none',
                              minWidth: '120px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                          >
                            <option value="full_day" style={{color: '#333'}}>Full Day</option>
                            <option value="half_day" style={{color: '#333'}}>Half Day</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label style={{ 
                            fontSize: '13px', 
                            color: '#fff',
                            fontWeight: '600',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                          }}>
                            <FiDollarSign size={14} />
                            Multiplier
                          </label>
                          <select
                            value={salaryMultiplier[staff.id] || '1'}
                            onChange={(e) => setSalaryMultiplier(prev => ({ ...prev, [staff.id]: e.target.value }))}
                            style={{ 
                              padding: '8px 14px', 
                              fontSize: '13px', 
                              borderRadius: '8px', 
                              border: '2px solid #10B981',
                              background: '#fff',
                              color: '#1e1b4b',
                              fontWeight: '600',
                              cursor: 'pointer',
                              outline: 'none',
                              minWidth: '90px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                          >
                            <option value="1" style={{color: '#333'}}>1x</option>
                            <option value="1.5" style={{color: '#333'}}>1.5x</option>
                            <option value="2" style={{color: '#333'}}>2x</option>
                            <option value="2.5" style={{color: '#333'}}>2.5x</option>
                            <option value="3" style={{color: '#333'}}>3x</option>
                          </select>
                        </div>

                        {/* Multiplier Reason Input */}
                        {(parseFloat(salaryMultiplier[staff.id]) > 1) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
                            <label style={{ 
                              fontSize: '11px', 
                              color: '#fff',
                              fontWeight: '600',
                              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                              whiteSpace: 'nowrap'
                            }}>
                              <FiEdit2 size={12} />
                              Reason
                            </label>
                            <input
                              type="text"
                              placeholder="Why multiplier?"
                              value={salaryMultiplierReason[staff.id] || ''}
                              onChange={(e) => setSalaryMultiplierReason(prev => ({ ...prev, [staff.id]: e.target.value }))}
                              style={{ 
                                padding: '8px 12px', 
                                fontSize: '13px', 
                                borderRadius: '8px', 
                                border: '2px solid #F59E0B',
                                background: '#fff',
                                color: '#1e1b4b',
                                fontWeight: '500',
                                outline: 'none',
                                flex: '1',
                                minWidth: '150px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
        </>
      )}

      {activeStaffTab === 'holidays' && (
        <section className="page-section holiday-tab-content">
            <div className="holiday-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '2rem',
              background: 'rgba(255, 255, 255, 0.7)',
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <div>
                <h2 className="section-title" style={{ margin: 0, color: '#1e293b' }}>Holiday Calendar</h2>
                <p className="section-subtitle" style={{ margin: '4px 0 0', color: '#64748b' }}>Manage company holidays and staff-specific offs</p>
              </div>
            <button 
              className="button-primary"
              onClick={() => {
                setEditingHoliday(null);
                setHolidayFormData({ date: new Date().toISOString().split('T')[0], name: "", type: "company_holiday", staff_id: "", is_paid: true });
                setShowHolidayModal(true);
              }}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              <FiPlus /> Add Holiday
            </button>
          </div>

          <div className="calendar-container" style={{ 
            background: 'rgba(255, 255, 255, 0.8)', 
            borderRadius: '28px', 
            padding: '2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(20px)',
            marginBottom: '2.5rem'
          }}>
            <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <div className="month-display" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <FiCalendar style={{ color: '#10b981' }} />
                <span>{holidayCurrentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="button-secondary" style={{ padding: '8px' }} onClick={() => setHolidayCurrentDate(new Date(holidayCurrentDate.getFullYear(), holidayCurrentDate.getMonth() - 1, 1))}><FiChevronLeft /></button>
                <button className="button-secondary" style={{ padding: '8px' }} onClick={() => setHolidayCurrentDate(new Date(holidayCurrentDate.getFullYear(), holidayCurrentDate.getMonth() + 1, 1))}><FiChevronRight /></button>
              </div>
            </div>

            <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px' }}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                <div key={d} className="weekday" style={{ textAlign: 'center', fontWeight: '700', color: '#64748b', paddingBottom: '1.2rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d}</div>
              ))}
              {renderHolidayCalendar()}
            </div>
          </div>

          {/* Monthly List View */}
          <div className="holiday-list-section">
            <h3 className="section-title" style={{ fontSize: '1.4rem', color: '#1e293b', fontWeight: '800' }}>Holidays in {holidayCurrentDate.toLocaleDateString('default', { month: 'long' })}</h3>
            <div className="holiday-items-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              {holidays.length > 0 ? holidays.map(h => (
                <motion.div 
                  key={h.id} 
                  className="holiday-item-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.9)', 
                    padding: '24px', 
                    borderRadius: '20px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div className="h-info">
                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '700' }}>{new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} - {h.name}</h4>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <span className={`badge ${h.type}`} style={{ 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        background: h.type === 'company_holiday' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                        color: h.type === 'company_holiday' ? '#F59E0B' : '#8B5CF6'
                      }}>
                        {h.type === 'company_holiday' ? 'Global' : 'Staff'}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        background: h.is_paid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: h.is_paid ? '#10B981' : '#EF4444'
                      }}>
                        {h.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                  <div className="h-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="button-secondary"
                      style={{ padding: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}
                      onClick={() => {
                        setEditingHoliday(h);
                        setHolidayFormData({
                            date: h.date.split('T')[0],
                            name: h.name,
                            type: h.type,
                            staff_id: h.staff_id || "",
                            is_paid: h.is_paid !== false
                        });
                        setShowHolidayModal(true);
                      }}
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button className="button-secondary" style={{ padding: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }} onClick={() => handleHolidayDelete(h.id)}><FiTrash2 size={16} /></button>
                  </div>
                </motion.div>
              )) : (
                <div style={{ padding: '40px', textAlign: 'center', gridColumn: '1/-1', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', color: '#94a3b8' }}>No holidays scheduled for this month.</div>
              )}
            </div>
          </div>
        </section>
      )}
      {activeStaffTab === 'management' && (
        <>

      {/* HEADER */}
      <section className="page-section">
        <h1 className="section-title">Staff Management</h1>
        <p className="section-subtitle">Manage your team members and their information</p>

        {/* SUMMARY CARDS ROW - Beside search bar */}
        <div className="summary-cards-row">
          <div
            className={`summary-card small ${filter === 'active' && !attendanceFilter ? 'active-filter' : ''}`}
            onClick={() => {
              setFilter('active');
              setAttendanceFilter(null);
              fetchStaffs(null);
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-icon">
              <FiUsers />
            </div>
            <div className="card-content">
              <h3>Active Staff</h3>
              <p className="card-value">{staffs.length}</p>
            </div>
          </div>

          <div
            className={`summary-card small clickable ${attendanceFilter === 'present' ? 'active-filter' : ''}`}
            onClick={() => {
              // First set the filter visual state
              setAttendanceFilter('present');
              // Then fetch present staff details to show in modal
              fetchPresentStaffDetails();
            }}
          >
            <div className="card-icon present">
              <FiCheckCircle />
            </div>
            <div className="card-content">
              <h3>Present</h3>
              <p className="card-value present">{attendanceSummary?.present_count || 0}</p>
            </div>
          </div>

          <div
            className={`summary-card small clickable ${attendanceFilter === 'absent' ? 'active-filter' : ''}`}
            onClick={() => {
              // First set the filter visual state
              setAttendanceFilter('absent');
              // Then fetch absent staff details to show in modal
              fetchAbsentStaffDetails();
            }}
          >
            <div className="card-icon absent">
              <FiXCircleIcon />
            </div>
            <div className="card-content">
              <h3>Absent</h3>
              <p className="card-value absent">{attendanceSummary?.absent_count || 0}</p>
            </div>
          </div>

          <div
            className={`summary-card small ${filter === 'deleted' ? 'active-filter' : ''}`}
            onClick={() => { setFilter('deleted'); setAttendanceFilter(null); if (deletedStaffs.length === 0) fetchDeletedStaffs(); fetchStaffs(null); }}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-icon">
              <FiTrash2 />
            </div>
            <div className="card-content">
              <h3>Deleted</h3>
              <p className="card-value">{deletedStaffs.length}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-controls">
          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="button-primary add-job-button"
            onClick={() => setShowForm(true)}
          >
            <FiPlusCircle />
            <span>Add Staff</span>
          </button>
        </div>
      </section>

      {/* STAFF LIST */}
      <section className="page-section">
        <div className="complaint-list">
          {filteredStaffs.length > 0 ? (
            filteredStaffs.map((staff) => (
              <div
                key={staff.id}
                className="complaint-card active"
              >
                <div className="card-header">
                  <span className="card-title">{staff.name}</span>
                  <div className={`status-badge ${filter === "active" ? "active" : "deleted"}`}>
                    {filter === "active" ? <FiUserCheck /> : <FiTrash2 />}
                    <span>{filter === "active" ? "Active" : "Deleted"}</span>
                  </div>
                </div>

                <div className="card-content">
                  <InfoRow icon={<FiPhone />} label="Phone" value={staff.phone} />
                  {staff.email && <InfoRow icon={<FiMail />} label="Email" value={staff.email} />}
                  <InfoRow icon={<FiMapPin />} label="Location" value={staff.location} />
                </div>

                <div className="card-actions">
                  {filter === "active" && (
                    <>
                      <button className="action-button edit" onClick={() => handleEdit(staff)}>
                        <span>Edit</span>
                      </button>
                      <button className="action-button delete" onClick={() => handleDelete(staff.id)}>
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FiUsers size={48} />
              <p>No staff found</p>
              <p className="empty-subtitle">
                {searchQuery ? "Try adjusting your search terms" : "Add your first team member"}
              </p>
            </div>
          )}
        </div>
      </section>
        </>
      )}

      {/* GLOBAL MODALS */}

      {/* ATTENDANCE HISTORY MODAL */}
      {showAttendanceHistory && createPortal(
        <div 
          className="modal-overlay history-overlay attendance-history-overlay" 
          onClick={() => setShowAttendanceHistory(false)}
        >
          <div 
            className="modal-content history-modal attendance-history-modal" 
            onClick={(e) => e.stopPropagation()}
            ref={attendanceHistoryRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Attendance History"
          >
            <div className="modal-header">
              <h2><FiCalendar style={{ marginRight: '0.5rem' }} />Attendance History</h2>
              <button className="close-btn" onClick={() => setShowAttendanceHistory(false)}>×</button>
            </div>

            {/* Filter Controls */}
            <div className="history-filters">
              <div className="filter-tabs">
                <button
                  className={`filter-tab ${historyFilter === 'date' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('date')}
                >
                  By Date
                </button>
                <button
                  className={`filter-tab ${historyFilter === 'month' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('month')}
                >
                  By Month
                </button>
                <button
                  className={`filter-tab ${historyFilter === 'range' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('range')}
                >
                  Date Range
                </button>
                <button
                  className={`filter-tab ${historyFilter === 'staff' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('staff')}
                >
                  By Staff
                </button>
              </div>

              <div className="filter-inputs">
                {historyFilter === 'date' && (
                  <div className="filter-input-group">
                    <label>Select Date:</label>
                    <input
                      type="date"
                      value={historyDate}
                      onChange={(e) => setHistoryDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                )}

                {historyFilter === 'month' && (
                  <div className="filter-input-group">
                    <label>Select Month:</label>
                    <input
                      type="month"
                      value={historyMonth}
                      onChange={(e) => setHistoryMonth(e.target.value)}
                      className="form-input"
                    />
                  </div>
                )}

                {historyFilter === 'range' && (
                  <div className="filter-input-group range-inputs">
                    <div>
                      <label>Start Date:</label>
                      <input
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label>End Date:</label>
                      <input
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                {historyFilter === 'staff' && (
                  <div className="filter-input-group">
                    <label>Staff Name:</label>
                    <input
                      type="text"
                      placeholder="Enter staff name..."
                      value={historyStaffName}
                      onChange={(e) => setHistoryStaffName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                )}

                <button
                  className="button-primary"
                  onClick={() => {
                    if (historyFilter === 'range' && (!historyStartDate || !historyEndDate)) {
                      alert('Please select both start and end dates');
                      return;
                    }
                    if (historyFilter === 'staff' && !historyStaffName.trim()) {
                      alert('Please enter a staff name');
                      return;
                    }
                    fetchAttendanceHistory();
                  }}
                  disabled={historyLoading}
                >
                  {historyLoading ? 'Loading...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {historySummary && (
              <div className="history-summary-cards">
                <div className="summary-card">
                  <h3>Total Records</h3>
                  <p className="card-value">{historySummary.total || 0}</p>
                </div>
                <div className="summary-card present">
                  <h3>Present</h3>
                  <p className="card-value">{historySummary.present || 0}</p>
                </div>
                <div className="summary-card absent">
                  <h3>Absent</h3>
                  <p className="card-value">{historySummary.absent || 0}</p>
                </div>
                <div className="summary-card">
                  <h3>Not Marked</h3>
                  <p className="card-value">{historySummary.not_marked || 0}</p>
                </div>
              </div>
            )}

            {/* History Table */}
            {historyLoading ? (
              <div className="loading-state">
                <p>Loading attendance history...</p>
              </div>
            ) : historyData.length > 0 ? (
              <div className="history-table-container">
                <table className="history-table">
                  <thead>
                      <tr>
                        <th>Date</th>
                        <th>Staff Name</th>
                        <th>Status</th>
                        <th>Multiplier</th>
                        <th>Reason</th>
                        <th>Marked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((record, index) => (
                        <tr key={index} className={record.status === 'Present' ? 'present-row' : record.status === 'Absent' ? 'absent-row' : ''}>
                          <td>{record.date || '-'}</td>
                          <td>{record.staff_name || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className={`status-badge ${record.status === 'Present' ? 'present' : record.status === 'Absent' ? 'absent' : 'not-marked'}`}>
                                {record.status || 'Not Marked'}
                                </span>
                                {record.is_override && (
                                    <span style={{ fontSize: '10px', background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #F87171' }}>
                                        OVERRIDE
                                    </span>
                                )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {record.salary_multiplier > 1 ? (
                                <span style={{ 
                                    background: '#10B981', 
                                    color: 'white', 
                                    padding: '2px 8px', 
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                }}>
                                    {record.salary_multiplier}x
                                </span>
                                ) : (
                                    <span style={{ color: '#64748b', fontSize: '12px' }}>Normal (1x)</span>
                                )}
                                {record.work_type === 'half_day' && (
                                    <span style={{ fontSize: '10px', background: '#E0F2FE', color: '#0369A1', padding: '2px 6px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #7DD3FC' }}>
                                        HALF DAY
                                    </span>
                                )}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', maxWidth: '200px' }}>
                                {record.override_reason ? (
                                    <div style={{ fontStyle: 'italic', color: '#1e293b' }}>
                                        <strong>Reason:</strong> {record.override_reason}
                                    </div>
                                ) : record.salary_multiplier_reason ? (
                                    <div style={{ fontStyle: 'italic', color: '#64748b' }}>
                                        {record.salary_multiplier_reason}
                                    </div>
                                ) : (
                                    <span style={{ color: '#cbd5e1' }}>-</span>
                                )}
                            </div>
                          </td>
                          <td>{record.marked_at || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <FiCalendar size={48} />
                <p>No attendance records found</p>
                <p className="empty-subtitle">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}


      {/* HOLIDAY MODAL */}
      <AnimatePresence>
        {showHolidayModal && (
          <div className="modal-backdrop" style={{ zIndex: 1100 }}>
            <motion.div 
              className="modal-content" 
              ref={holidayModalRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ maxWidth: '500px' }}
            >
              <div className="modal-header">
                <h2 className="modal-title">
                  <FiCalendar className="modal-icon" style={{ color: '#10b981' }} />
                  {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
                </h2>
                <button className="modal-close" onClick={() => setShowHolidayModal(false)}><FiX /></button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleHolidaySubmit}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required
                      value={holidayFormData.date}
                      onChange={e => setHolidayFormData({ ...holidayFormData, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Holiday Name / Reason</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Diwali, Staff Birthday" 
                      required
                      value={holidayFormData.name}
                      onChange={e => setHolidayFormData({ ...holidayFormData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Holiday Type</label>
                    <select 
                      className="form-input"
                      value={holidayFormData.type}
                      onChange={e => setHolidayFormData({ ...holidayFormData, type: e.target.value, staff_id: e.target.value === 'company_holiday' ? "" : holidayFormData.staff_id })}
                    >
                      <option value="company_holiday" style={{color: '#333'}}>Company / Global Holiday</option>
                      <option value="weekly_off" style={{color: '#333'}}>Staff Specific Off / Holiday</option>
                    </select>
                  </div>

                  {holidayFormData.type === 'weekly_off' && (
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Select Staff</label>
                      <select 
                        className="form-input"
                        required
                        value={holidayFormData.staff_id}
                        onChange={e => setHolidayFormData({ ...holidayFormData, staff_id: e.target.value })}
                      >
                        <option value="" style={{color: '#333'}}>— Choose Staff —</option>
                        {staffs.map(s => (
                          <option key={s.id} value={s.id} style={{color: '#333'}}>{s.name} ({s.phone})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* PAID / UNPAID TOGGLE */}
                  <div className="form-group" style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: '600', display: 'block' }}>Paid Holiday</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Should this be counted as a paid day?</span>
                    </div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={holidayFormData.is_paid}
                        onChange={e => setHolidayFormData({ ...holidayFormData, is_paid: e.target.checked })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ 
                        position: 'absolute', 
                        cursor: 'pointer', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: holidayFormData.is_paid ? '#10B981' : '#475569', 
                        transition: '.4s', 
                        borderRadius: '34px' 
                      }}>
                        <span style={{ 
                          position: 'absolute', 
                          height: '18px', width: '18px', 
                          left: holidayFormData.is_paid ? '28px' : '4px', 
                          bottom: '3px', 
                          backgroundColor: 'white', 
                          transition: '.4s', 
                          borderRadius: '50%' 
                        }}></span>
                      </span>
                    </label>
                  </div>

                  <button type="submit" className="button-primary" style={{ width: '100%', marginTop: '10px' }}>
                    <FiCheck /> {editingHoliday ? 'Update' : 'Create'} Holiday
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD/EDIT STAFF MODAL */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-content" ref={addStaffRef}>
            <h2 className="modal-title">{editingStaffId ? "Edit Staff" : "Add New Staff"}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Salary Fields */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '15px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginTop: '10px'
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 'bold', color: '#28a745' }}>
                    Monthly Salary (₹)
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="e.g., 18000"
                    value={monthlySalary}
                    onChange={(e) => {
                      setMonthlySalary(e.target.value);
                      // Auto-calculate per day salary when monthly salary is entered
                      if (e.target.value) {
                        const calculated = Math.round(e.target.value / 30 * 100) / 100;
                        setPerDaySalary(String(calculated));
                      }
                    }}
                    min="0"
                  />
                  <small style={{ color: '#666', fontSize: '11px' }}>Auto-calculates per day salary</small>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 'bold', color: '#007bff' }}>
                    Per Day Salary (₹)
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="e.g., 600"
                    value={perDaySalary}
                    onChange={(e) => setPerDaySalary(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <small style={{ color: '#666', fontSize: '11px' }}>Editable for custom rates</small>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button type="button" onClick={pickImage} className="action-button">
                  <FiCamera />
                  <span>Pick Photo</span>
                </button>
                {photoPreviewUrl && (
                  <img src={photoPreviewUrl} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', marginTop: '10px' }} />
                )}
              </div>

              {/* Weekly Off Days */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Weekly Off Days</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setWeeklyOffDays(prev => 
                          prev.includes(day) 
                            ? prev.filter(d => d !== day) 
                            : [...prev, day]
                        );
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '2px solid',
                        borderColor: weeklyOffDays.includes(day) ? '#5B4FE9' : '#e2e8f0',
                        backgroundColor: weeklyOffDays.includes(day) ? '#5B4FE9' : 'transparent',
                        color: weeklyOffDays.includes(day) ? '#fff' : '#64748b',
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  Select one or more days as recurring weekly offs
                </small>
              </div>
            </div>

            <div className="modal-actions">
              <button className="button-secondary" onClick={resetForm}>
                <FiXCircle />
                <span>Cancel</span>
              </button>
              <button className="button-primary" onClick={handleSubmit}>
                <FiSave />
                <span>{editingStaffId ? "Update" : "Save"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRESENT STAFF DETAILS MODAL */}
      {showPresentDetails && (
        <div className="modal-backdrop">
          <div className="modal-content large-modal" ref={presentDetailsRef}>
            <div className="modal-header">
              <h2 className="modal-title">
                <FiCheckCircle className="modal-icon present" />
                Present Staff Details
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowPresentDetails(false)}
              >
                <FiXCircle />
              </button>
            </div>

            <div className="modal-body">
              {detailsLoading ? (
                <div className="loading-state">
                  <FiClock size={32} />
                  <p>Loading present staff details...</p>
                </div>
              ) : presentStaffDetails.length > 0 ? (
                <div className="staff-details-list">
                  {presentStaffDetails.map((staff) => (
                    <div key={staff.id} className="staff-detail-card">
                      <div className="staff-detail-header">
                        {staff.photo_url && (
                          <img src={staff.photo_url} alt={staff.name} className="staff-detail-avatar" />
                        )}
                        <div className="staff-detail-info">
                          <h3 className="staff-detail-name">{staff.name}</h3>
                          <p className="staff-detail-phone">{staff.phone}</p>
                          {staff.email && (
                            <p className="staff-detail-email">{staff.email}</p>
                          )}
                          <p className="staff-detail-location">{staff.location}</p>
                        </div>
                      </div>
                      <div className="staff-detail-status present">
                        <FiCheckCircle />
                        <span>Present</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FiCheckCircle size={48} />
                  <p>No staff present today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABSENT STAFF DETAILS MODAL */}
      {showAbsentDetails && (
        <div className="modal-backdrop">
          <div className="modal-content large-modal" ref={absentDetailsRef}>
            <div className="modal-header">
              <h2 className="modal-title">
                <FiXCircleIcon className="modal-icon absent" />
                Absent Staff Details
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowAbsentDetails(false)}
              >
                <FiXCircle />
              </button>
            </div>

            <div className="modal-body">
              {detailsLoading ? (
                <div className="loading-state">
                  <FiClock size={32} />
                  <p>Loading absent staff details...</p>
                </div>
              ) : absentStaffDetails.length > 0 ? (
                <div className="staff-details-list">
                  {absentStaffDetails.map((staff) => (
                    <div key={staff.id} className="staff-detail-card">
                      <div className="staff-detail-header">
                        {staff.photo_url && (
                          <img src={staff.photo_url} alt={staff.name} className="staff-detail-avatar" />
                        )}
                        <div className="staff-detail-info">
                          <h3 className="staff-detail-name">{staff.name}</h3>
                          <p className="staff-detail-phone">{staff.phone}</p>
                          {staff.email && (
                            <p className="staff-detail-email">{staff.email}</p>
                          )}
                          <p className="staff-detail-location">{staff.location}</p>
                        </div>
                      </div>
                      <div className="staff-detail-status absent">
                        <FiXCircleIcon />
                        <span>Absent</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FiXCircleIcon size={48} />
                  <p>No staff absent today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;

// Styled components for Holiday Calendar
const style = document.createElement('style');
style.textContent = `
  .calendar-day {
    aspect-ratio: 1 / 1;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 20px;
    padding: 12px;
    position: relative;
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  }
  .calendar-day:hover {
    background: #ffffff;
    border-color: #10b981;
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
    z-index: 10;
  }
  .calendar-day.padding {
    background: transparent;
    cursor: default;
    border: none;
    box-shadow: none;
  }
  .calendar-day.padding:hover {
    transform: none;
    box-shadow: none;
  }
  .day-number {
    font-weight: 800;
    font-size: 1.2rem;
    color: #1e293b;
  }
  .has-holiday {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.2);
  }
  .has-weekly-off {
    background: rgba(59, 130, 246, 0.08);
    border-color: rgba(59, 130, 246, 0.2);
  }
  .holiday-badges {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .holiday-badge {
    font-size: 9px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .holiday-badge.company_holiday {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
  }
  .holiday-badge.weekly_off {
    background: rgba(244, 63, 94, 0.15); /* Rose background */
    color: #fb7185; /* Rose text */
  }
  .holiday-badge.unpaid {
    border-left: 2px solid #ef4444;
  }
  .h-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
document.head.appendChild(style);
