import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import axios from "axios";
import api from "../api";
import { useGlobalRefresh } from "../context/GlobalRefreshContext";
import { useScrollToRef } from "../hooks/useScrollToRef";
import { motion, AnimatePresence } from "framer-motion";
import "./Staff.css";
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
  FiChevronRight,
  FiFileText,
  FiUserPlus,
  FiShield,
  FiCreditCard,
  FiMap,
  FiAward,
  FiAlertCircle
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
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState([]);
  const [deletedStaffs, setDeletedStaffs] = useState([]);
  const [filteredStaffs, setFilteredStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false); // kept for holiday/other modals compat
  const [attendanceFilter, setAttendanceFilter] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(sessionStorage.getItem('role') !== 'admin' && sessionStorage.getItem('role') !== 'bigadmin' ? sessionStorage.getItem('branch_name') || '' : '');

  // Use global refresh context
  const { refreshTriggers, triggerRefresh, branches } = useGlobalRefresh();

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
  const [branchName, setBranchName] = useState("");

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
    staff_ids: [],
    is_paid: true
  });
  const [holidayStaffSearch, setHolidayStaffSearch] = useState("");
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

      if (data.type === 'company_holiday') {
        data.staff_id = null;
        data.staff_ids = [];
      } else {
        // Validation for weekly off
        if (data.staff_ids.length === 0 && !data.staff_id) {
          alert("Please select at least one staff member.");
          return;
        }

        // Ensure staff_ids is populated for backend
        if (data.staff_ids.length === 0 && data.staff_id) {
          data.staff_ids = [data.staff_id];
        }
      }

      if (editingHoliday) {
        await api.put(`holiday-calendar/${editingHoliday.id}/`, data);
      } else {
        await api.post("holiday-calendar/", data);
      }

      setShowHolidayModal(false);
      setEditingHoliday(null);
      setHolidayFormData({
        date: "",
        name: "",
        type: "company_holiday",
        staff_id: "",
        staff_ids: [],
        is_paid: true
      });
      fetchMonthHolidays();
      fetchTodayHolidays(); // Also update today's holidays if relevant
    } catch (error) {
      console.error("Holiday submit error:", error);
      const errorDetail = error.response?.data?.error || "Error saving holiday. Please check if date is already taken for selected staff.";
      alert(errorDetail);
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
      }

      if (historyStaffName && historyStaffName.trim()) {
        params.append('staff_name', historyStaffName.trim());
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

  const handleAttendanceChange = (staffId, status, type = 'present') => {
    setAttendanceData(prev => ({
      ...prev,
      [staffId]: status
    }));
    setAttendanceType(prev => ({
      ...prev,
      [staffId]: type
    }));
  };

  // Helper to determine if today is a holiday for a staff member
  const getTodayHolidayStatus = (staffId) => {
    if (!todayHolidays || todayHolidays.length === 0) return null;

    // Check global holidays (no staff_id)
    const globalHoliday = todayHolidays.find(h => !h.staff_id && h.is_active !== false);
    if (globalHoliday) return { type: 'global', name: globalHoliday.name, is_paid: globalHoliday.is_paid };

    // Check staff specific holidays
    const staffHoliday = todayHolidays.find(h => h.staff_id === staffId && h.is_active !== false);
    if (staffHoliday) return { type: 'staff', name: staffHoliday.name, is_paid: staffHoliday.is_paid };

    // Check weekly off from staff model
    const staff = staffs.find(s => s.id === staffId);
    if (staff && staff.weekly_off_days) {
      const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      if (staff.weekly_off_days.includes(todayDayName)) {
        return { type: 'weekly_off', name: 'Weekly Off', is_paid: true };
      }
    }

    return null;
  };

  // Effect to pre-populate attendance for holidays to avoid accidental 'Absent' marks
  useEffect(() => {
    if (staffs.length > 0 && todayHolidays.length > 0) {
      const newAttendance = { ...attendanceData };
      let changed = false;

      staffs.forEach(staff => {
        // Only pre-populate if not already manually interacted with
        if (attendanceData[staff.id] === undefined) {
          const holidayStatus = getTodayHolidayStatus(staff.id);
          if (holidayStatus && holidayStatus.is_paid !== false) {
            newAttendance[staff.id] = 'Present';
            changed = true;
          }
        }
      });

      if (changed) {
        setAttendanceData(newAttendance);
      }
    }
  }, [staffs, todayHolidays]);

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

    const attendanceList = staffs.map(staff => {
      const holidayStatus = getTodayHolidayStatus(staff.id);
      const isActuallyHoliday = !!holidayStatus;

      // If today is a holiday and user didn't mark anything, default to Present (for payroll)
      const defaultStatus = isActuallyHoliday ? 'Present' : 'Absent';

      // Determine the attendance type: if it's a holiday and we are marking as Present, use 'holiday' type
      // unless the user specifically override it with something else (like Leave)
      const currentStatus = attendanceData[staff.id] || defaultStatus;
      let currentType = attendanceType[staff.id] || 'present';

      if (isActuallyHoliday && currentStatus === 'Present' && currentType === 'present') {
        currentType = 'holiday';
      }

      return {
        staff_id: staff.id,
        staff_name: staff.name,
        status: currentStatus,
        attendance_type: currentType,
        work_type: workType[staff.id] || 'full_day', // full_day/half_day
        salary_multiplier: parseFloat(salaryMultiplier[staff.id]) || 1, // 1, 1.5, 2, etc.
        salary_multiplier_reason: salaryMultiplierReason[staff.id] || '', // Legacy field
        override_reason: salaryMultiplierReason[staff.id] || (isActuallyHoliday ? `${holidayStatus.name} Attendance` : '')
      };
    });

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
        let msg = `✅ ${res.data.message}`;
        if (res.data.errors && res.data.errors.length > 0) {
          msg += `\n\nNote: Some issues occurred:\n- ${res.data.errors.join('\n- ')}`;
        }
        alert(msg);
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

    // Filter by branch
    if (selectedBranch) {
      filtered = filtered.filter(c => (c.branch_name || 'Main Hub') === selectedBranch);
    }

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
    if (branchName) formData.append("branch_name", branchName);

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
    navigate(`/edit-staff/${staff.id}`);
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
    setBranchName("");
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

  const renderStaffCard = (staff) => (
    <div key={staff.id} className="staff-card">
      <div className="staff-card-header">
        {staff.photo_url ? (
          <img src={staff.photo_url} alt={staff.name} className="staff-card-avatar" />
        ) : (
          <div className="staff-card-avatar placeholder">
            {staff.name.charAt(0)}
          </div>
        )}
        <div className="staff-card-info">
          <h3>{staff.name}</h3>
          <div className="staff-branch-tag">
            <FiMapPin size={10} /> {staff.branch_name || 'Main Hub'}
          </div>
        </div>
      </div>

      <div className="staff-card-body">
        <div className="contact-item">
          <FiPhone /> {staff.phone}
        </div>
        {staff.email && (
          <div className="contact-item">
            <FiMail /> {staff.email}
          </div>
        )}
        <div className="contact-item">
          <FiMapPin /> {staff.location}
        </div>
      </div>

      <div className="staff-card-actions">
        {filter === 'active' ? (
          <>
            <button className="staff-btn-secondary" style={{ flex: 1, padding: '0.6rem' }} onClick={() => handleEdit(staff)}>
              <FiEdit /> Edit
            </button>
            <button className="action-btn-sm delete-btn" onClick={() => handleDelete(staff.id)}>
              <FiTrash2 />
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--staff-danger)', fontSize: '0.8rem', fontWeight: 700 }}>This profile is archived</p>
        )}
      </div>
    </div>
  );

  const filterCounts = getFilterCounts();

  if (loading) {
    return (
      <div className="staff-page-container">
        <div className="loading-state">
          <div className="bm-spinner-mini" style={{ width: '40px', height: '40px', borderTopColor: 'var(--staff-primary)' }}></div>
          <p style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--staff-primary)' }}>Loading staff resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-page-container">
      {/* Premium Header */}
      <header className="staff-page-header">
        <div className="header-left">
          <div className="header-icon-box">
            <FiUsers />
          </div>
          <div className="header-title-info">
            <h2>Workforce Hub</h2>
            <p>Manage attendance, payroll, and staff records</p>
          </div>
        </div>

        <button className="staff-btn-primary" onClick={() => navigate('/add-staff')}>
          <FiUserPlus /> Add Team Member
        </button>
      </header>

      {/* Modern Tab Navigation */}
      <nav className="staff-tab-nav">
        <button
          className={`tab-btn ${activeStaffTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveStaffTab('attendance')}
        >
          <FiUserCheck /> Attendance
        </button>
        <button
          className={`tab-btn ${activeStaffTab === 'management' ? 'active' : ''}`}
          onClick={() => setActiveStaffTab('management')}
        >
          <FiUsers /> Team Roster
        </button>
        <button
          className={`tab-btn ${activeStaffTab === 'holidays' ? 'active' : ''}`}
          onClick={() => setActiveStaffTab('holidays')}
        >
          <FiCalendar /> Holiday Calendar
        </button>
        <button
          className={`tab-btn ${activeStaffTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveStaffTab('history');
            fetchAttendanceHistory();
          }}
        >
          <FiClock /> Attendance Logs
        </button>
      </nav>

      {/* Attendance Tab Content */}
      {activeStaffTab === 'attendance' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {showReminder && (
            <div className="reminder-banner">
              <div className="reminder-content">
                <FiBell className="reminder-icon" />
                <div className="reminder-text">
                  <h3>Daily Checklist</h3>
                  <p>Attendance for today hasn't been marked yet. Please verify all active staff.</p>
                </div>
                <button className="reminder-close" onClick={() => setShowReminder(false)}><FiX /></button>
              </div>
            </div>
          )}

          <div className="attendance-container">
            <div className="attendance-header">
              <div className="attendance-date-badge">
                <FiCalendar /> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="staff-btn-secondary" onClick={() => {
                  setShowAttendanceHistory(true);
                  fetchAttendanceHistory();
                }}>
                  <FiClock /> History
                </button>
                <button className="staff-btn-secondary" onClick={handleRefreshAttendance} disabled={attendanceLoading}>
                  <FiRefreshCcw /> Refresh
                </button>
                {!attendanceSubmitted && (
                  <button className="staff-btn-primary" onClick={handleSubmitAttendance} disabled={attendanceLoading}>
                    <FiSave /> {attendanceLoading ? 'Submitting...' : 'Mark Attendance'}
                  </button>
                )}
              </div>
            </div>

            {attendanceSubmitted ? (
              <div className="attendance-locked-message">
                <FiCheckCircle size={20} />
                <p>Today's attendance has been locked. View records in History.</p>
              </div>
            ) : (
              <div className="attendance-grid-list">
                <table className="attendance-list-table">
                  <tbody>
                    {staffs.map((staff) => (
                      <tr key={staff.id}>
                        <td>
                          <div className="staff-info">
                            {staff.photo_url ? (
                              <img src={staff.photo_url} alt={staff.name} className="staff-avatar" style={{ width: '40px', height: '40px' }} />
                            ) : (
                              <div className="staff-avatar-placeholder" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                                {staff.name.charAt(0)}
                              </div>
                            )}
                            <div className="staff-details">
                              <span className="staff-name">{staff.name}</span>
                              <span className="staff-phone">{staff.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="status-chips">
                            <button
                              className={`status-chip present ${attendanceData[staff.id] === 'Present' && attendanceType[staff.id] !== 'leave' ? 'active' : ''}`}
                              onClick={() => handleAttendanceChange(staff.id, 'Present', 'present')}
                            >
                              <FiCheck /> Present
                            </button>
                            <button
                              className={`status-chip absent ${attendanceData[staff.id] === 'Absent' ? 'active' : ''}`}
                              onClick={() => handleAttendanceChange(staff.id, 'Absent', 'absent')}
                            >
                              <FiX /> Absent
                            </button>
                            <button
                              className={`status-chip leave ${attendanceType[staff.id] === 'leave' ? 'active' : ''}`}
                              onClick={() => handleAttendanceChange(staff.id, 'Present', 'leave')}
                            >
                              <FiMail /> Leave
                            </button>
                          </div>
                        </td>
                        <td>
                          {(attendanceData[staff.id] === 'Present' || attendanceType[staff.id] === 'leave') && (
                            <div className="payroll-settings" style={{ margin: 0, padding: '0.5rem 1rem' }}>
                              <div className="payroll-field">
                                <select
                                  className="payroll-input"
                                  value={workType[staff.id] || 'full_day'}
                                  onChange={(e) => setWorkType(prev => ({ ...prev, [staff.id]: e.target.value }))}
                                >
                                  <option value="full_day">Full Day</option>
                                  <option value="half_day">Half Day</option>
                                </select>
                              </div>
                              <div className="payroll-field">
                                <select
                                  className="payroll-input"
                                  value={salaryMultiplier[staff.id] || '1'}
                                  onChange={(e) => setSalaryMultiplier(prev => ({ ...prev, [staff.id]: e.target.value }))}
                                >
                                  <option value="1">1x Pay</option>
                                  <option value="1.5">1.5x Pay</option>
                                  <option value="2">2x Pay</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Staff Management Tab */}
      {activeStaffTab === 'management' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="staff-controls-row">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, role or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="summary-badges">
              <div
                className={`count-badge ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                <FiUsers /> Active <span className="count">{staffs.length}</span>
              </div>
              <div className="count-badge" onClick={fetchPresentStaffDetails}>
                <FiCheckCircle style={{ color: 'var(--staff-success)' }} /> Present <span className="count" style={{ color: 'var(--staff-success)' }}>{attendanceSummary?.present_count || 0}</span>
              </div>
              <div className="count-badge" onClick={fetchAbsentStaffDetails}>
                <FiXCircle style={{ color: 'var(--staff-danger)' }} /> Absent <span className="count" style={{ color: 'var(--staff-danger)' }}>{attendanceSummary?.absent_count || 0}</span>
              </div>
              <div
                className={`count-badge ${filter === 'deleted' ? 'active' : ''}`}
                onClick={() => { setFilter('deleted'); if (deletedStaffs.length === 0) fetchDeletedStaffs(); }}
              >
                <FiTrash2 /> Archive <span className="count">{deletedStaffs.length}</span>
              </div>
            </div>
          </div>
          
          {(sessionStorage.getItem('role') === 'admin' || sessionStorage.getItem('role') === 'bigadmin') && (
            <div className="staff-branch-filter-container" style={{ marginBottom: '2rem' }}>
              <div className="sm-branch-filter" style={{ width: 'fit-content', border: '1.5px solid var(--staff-border)', background: 'var(--staff-white)' }}>
                <FiMapPin className="sm-filter-icon" style={{ color: 'var(--staff-primary)' }} />
                <select 
                    value={selectedBranch} 
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="sm-branch-select"
                    style={{ border: 'none', background: 'transparent', fontWeight: 700, color: 'var(--staff-text)' }}
                >
                    <option value="">All Branches</option>
                    {branches && branches.map(b => (
                        <option key={b.branch_id} value={b.name}>{b.name}</option>
                    ))}
                </select>
              </div>
            </div>
          )}

          <div className="staff-roster-content">
            {filteredStaffs.length > 0 ? (() => {
              // If a branch is selected, show flat grid
              if (selectedBranch) {
                return (
                  <div className="staff-grid">
                    {filteredStaffs.map((staff) => renderStaffCard(staff))}
                  </div>
                );
              }

              // Group by branch when viewing all
              const branchGroups = {};
              filteredStaffs.forEach(staff => {
                const branch = staff.branch_name || 'Main Hub';
                if (!branchGroups[branch]) branchGroups[branch] = [];
                branchGroups[branch].push(staff);
              });

              return Object.entries(branchGroups).map(([branchName, staffs]) => (
                <div key={branchName} className="branch-staff-group">
                  <div className="branch-group-header">
                    <span className="branch-group-icon">🏢</span>
                    <h2 className="branch-group-title">{branchName}</h2>
                    <span className="branch-group-count">{staffs.length} member{staffs.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="staff-grid">
                    {staffs.map((staff) => renderStaffCard(staff))}
                  </div>
                </div>
              ));
            })() : (
              <div className="empty-state">
                <FiUsers size={48} />
                <p>No team members found</p>
                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Try adjusting your search or filters</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Holiday Tab Content - Using existing logic but polished via Staff.css */}
      {activeStaffTab === 'holidays' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="holiday-container">
          {/* Calendar implementation follows similar polished pattern */}
          <div className="attendance-container">
            <div className="attendance-header" style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  className="staff-btn-primary"
                  onClick={() => {
                    setEditingHoliday(null);
                    setHolidayFormData({ date: new Date().toISOString().split('T')[0], name: "", type: "company_holiday", staff_id: "", is_paid: true });
                    setShowHolidayModal(true);
                  }}
                >
                  <FiPlus /> Add Holiday
                </button>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--staff-primary)' }}>Holiday Calendar</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--staff-text-muted)', fontSize: '0.9rem' }}>Schedule company offs and weekly holidays</p>
              </div>
            </div>

            <div className="calendar-wrapper" style={{ marginTop: '2rem' }}>
              <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <FiCalendar size={24} color="var(--staff-primary)" />
                  <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{holidayCurrentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="action-btn-sm edit-btn" onClick={() => setHolidayCurrentDate(new Date(holidayCurrentDate.getFullYear(), holidayCurrentDate.getMonth() - 1, 1))}><FiChevronLeft /></button>
                  <button className="action-btn-sm edit-btn" onClick={() => setHolidayCurrentDate(new Date(holidayCurrentDate.getFullYear(), holidayCurrentDate.getMonth() + 1, 1))}><FiChevronRight /></button>
                </div>
              </div>

              <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--staff-text-muted)', textTransform: 'uppercase', paddingBottom: '0.5rem' }}>{d}</div>
                ))}
                {renderHolidayCalendar()}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Attendance History Tab Content */}
      {activeStaffTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="history-tab-content-full">
          <div className="premium-history-full-view">
            <header className="history-view-header">
              <div className="header-left">
                <div className="header-icon-box">
                  <FiClock />
                </div>
                <div className="header-title-info">
                  <h2>Attendance Logs</h2>
                  <p>Detailed historical records of staff attendance and multipliers</p>
                </div>
              </div>

              <div className="history-view-controls">
                <div className="filter-tabs-modern">
                  {['date', 'month', 'range'].map(f => (
                    <button
                      key={f}
                      className={`modern-filter-btn ${historyFilter === f ? 'active' : ''}`}
                      onClick={() => setHistoryFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            <div className="history-filter-shelf">
              <div className="shelf-inputs">
                {historyFilter === 'date' && (
                  <div className="shelf-group">
                    <label>View Date</label>
                    <input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} />
                  </div>
                )}
                {historyFilter === 'month' && (
                  <div className="shelf-group">
                    <label>View Month</label>
                    <input type="month" value={historyMonth} onChange={(e) => setHistoryMonth(e.target.value)} />
                  </div>
                )}
                {historyFilter === 'range' && (
                  <div className="shelf-group shelf-range">
                    <div>
                      <label>From</label>
                      <input type="date" value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label>To</label>
                      <input type="date" value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} />
                    </div>
                  </div>
                )}
                <div className="shelf-group">
                  <label>Filter By Staff</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FiUser style={{ position: 'absolute', left: '12px', color: 'var(--staff-text-muted)' }} />
                    <select 
                      value={historyStaffName} 
                      onChange={e => setHistoryStaffName(e.target.value)} 
                      style={{ paddingLeft: '35px', minWidth: '220px', height: '45px', borderRadius: '10px', border: '1.5px solid var(--staff-border)', background: 'white', fontWeight: 700 }}
                    >
                      <option value="">All Staff Members</option>
                      {staffs.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  className="staff-btn-history search-btn" 
                  onClick={fetchAttendanceHistory} 
                  disabled={historyLoading}
                  style={{ 
                    padding: '0.875rem 2.5rem',
                    fontSize: '1rem',
                    background: 'var(--staff-grad-gold)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {historyLoading ? (
                    <div className="bm-spinner-mini" style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                  ) : (
                    <><FiSearch /> Filter Records</>
                  )}
                </button>
              </div>

              {historySummary && (
                <div className="shelf-summary">
                  <div className="mini-stat">
                    <span className="stat-label">Total</span>
                    <span className="stat-value">{historySummary.total || 0}</span>
                  </div>
                  <div className="mini-stat present">
                    <span className="stat-label">Present</span>
                    <span className="stat-value">{historySummary.present || 0}</span>
                  </div>
                  <div className="mini-stat absent">
                    <span className="stat-label">Absent</span>
                    <span className="stat-value">{historySummary.absent || 0}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="history-data-table-wrapper">
              {historyLoading ? (
                <div className="table-loader">
                  <div className="bm-spinner-mini"></div>
                  <p>Analyzing Attendance Database...</p>
                </div>
              ) : historyData.length > 0 ? (
                <table className="modern-history-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Date</th>
                      <th style={{ width: '250px' }}>Staff Member</th>
                      <th>Status</th>
                      <th>Multiplier</th>
                      <th>Shift Details</th>
                      <th>Comments / Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((record, index) => (
                      <tr key={index} className="history-row-animate">
                        <td className="date-cell">{record.date}</td>
                        <td className="staff-cell">
                          <div className="staff-ident">
                            <span className="staff-initials">{record.staff_name?.charAt(0)}</span>
                            <span className="staff-full-name">{record.staff_name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge-status ${record.attendance_type === 'leave' ? 'leave' : record.attendance_type === 'holiday' ? 'holiday' : record.status?.toLowerCase()}`}>
                            {record.attendance_type === 'leave' ? 'Leave' : record.attendance_type === 'holiday' ? 'Paid Holiday' : record.status}
                          </span>
                        </td>
                        <td>
                          {record.salary_multiplier > 1 ? (
                            <span className="bonus-pill">
                              {record.salary_multiplier}x Bonus
                            </span>
                          ) : (
                            <span className="normal-pill">1.0x</span>
                          )}
                        </td>
                        <td>
                          <span className="shift-badge">
                            {record.work_type === 'half_day' ? 'Half Day' : 'Full Day'}
                          </span>
                        </td>
                        <td className="remark-cell">
                          {record.override_reason || record.salary_multiplier_reason || <span className="no-remark">No remarks</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="table-empty-state">
                  <FiClock size={40} />
                  <h3>No Records Found</h3>
                  <p>Try broadening your search or choosing a different date range.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}






      {/* PREMIUM ADD/EDIT STAFF MODAL */}
      <AnimatePresence>
        {showForm && (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(30, 27, 46, 0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              zIndex: 99999,
              padding: '60px 1rem 1rem 260px',
              boxSizing: 'border-box',
              overflowY: 'auto'
            }}
          >
            <motion.div
              ref={addStaffRef}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                background: 'rgba(255,255,255,0.98)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 32px 80px rgba(11,102,120,0.25)',
                width: '100%',
                maxWidth: '820px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: 0,
                boxSizing: 'border-box'
              }}
            >
              {/* Modal Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1.5rem 2rem',
                background: 'linear-gradient(135deg, #0b6678 0%, #0e8fa8 100%)',
                borderRadius: '24px 24px 0 0'
              }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {editingStaffId ? <FiEdit /> : <FiUserPlus />}
                  {editingStaffId ? 'Update Team Profile' : 'Enlist New Member'}
                </h2>
                <button
                  onClick={resetForm}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.3)',
                    borderRadius: '50%', width: '38px', height: '38px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  <FiX />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '2rem' }}>
                <div className="form-section-card">
                  <div className="form-section-title"><FiUser /> Identity &amp; Contact</div>
                  <div className="staff-form-grid">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input className="form-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" maxLength={10} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Home Location</label>
                      <input className="form-input" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Area" />
                    </div>
                  </div>
                </div>

                <div className="form-section-card">
                  <div className="form-section-title"><FiAward /> Assignment &amp; Remuneration</div>
                  <div className="staff-form-grid">
                    <div className="form-group">
                      <label className="form-label">Assign Branch</label>
                      <select className="form-input" value={branchName} onChange={(e) => setBranchName(e.target.value)}>
                        <option value="">Main Hub (Default)</option>
                        {branches?.map(b => <option key={b.branch_id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monthly Salary (₹)</label>
                      <div style={{ position: 'relative' }}>
                        <input className="form-input" type="number" value={monthlySalary}
                          onChange={(e) => {
                            setMonthlySalary(e.target.value);
                            if (e.target.value) setPerDaySalary(String(Math.round(e.target.value / 30)));
                          }}
                        />
                        <FiCreditCard style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--staff-primary)', opacity: 0.5 }} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Weekly Off</label>
                      <div className="weekly-off-grid">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <div
                            key={day}
                            className={`day-chip ${weeklyOffDays.includes(day) ? 'selected' : ''}`}
                            onClick={() => setWeeklyOffDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', gridColumn: '1/-1' }}>
                      <div className="avatar-upload-box" onClick={() => fileInputRef.current.click()}>
                        {photoPreviewUrl ? (
                          <img src={photoPreviewUrl} alt="Preview" className="avatar-preview" />
                        ) : (
                          <FiCamera size={24} color="var(--staff-primary)" />
                        )}
                        <div className="upload-overlay">Upload Photo</div>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 800, color: 'var(--staff-primary)', fontSize: '0.95rem' }}>Team Portrait</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--staff-text-muted)' }}>Used for ID cards and attendance verification</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
                padding: '1.25rem 2rem',
                borderTop: '1.5px solid var(--staff-border)',
                background: 'var(--staff-bg)',
                borderRadius: '0 0 24px 24px'
              }}>
                <button className="staff-btn-secondary" onClick={resetForm}><FiX /> Discard</button>
                <button className="staff-btn-primary" onClick={handleSubmit}>
                  <FiSave /> {editingStaffId ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOLIDAY MODAL */}
      <AnimatePresence>
        {showHolidayModal && (
          <div className="modal-backdrop" onClick={() => setShowHolidayModal(false)}>
            <motion.div
              className="modal-content"
              ref={holidayModalRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '520px', width: '95%', padding: 0, overflow: 'hidden', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <div className="modal-header">
                <div className="modal-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="modal-icon-badge" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--staff-primary), var(--staff-gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.1rem', flexShrink: 0 }}>
                    <FiCalendar />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e1b2e' }}>
                      {editingHoliday ? 'Update Holiday' : 'New Holiday Event'}
                    </h2>
                    <p className="modal-subtitle" style={{ margin: 0, fontSize: '0.8rem', color: '#8b85a1' }}>
                      {editingHoliday ? 'Update the holiday details below' : 'Schedule a new holiday or staff off day'}
                    </p>
                  </div>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowHolidayModal(false)}
                  title="Close"
                  style={{ background: 'rgba(124,92,191,0.08)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7c5cbf', fontSize: '1.1rem' }}
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleHolidaySubmit} className="modal-body">
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Event Name - full width */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Event Name *</label>
                    <input
                      className="form-input"
                      type="text"
                      value={holidayFormData.name}
                      onChange={e => setHolidayFormData({ ...holidayFormData, name: e.target.value })}
                      placeholder="e.g. Diwali Celebration"
                      required
                    />
                  </div>

                  {/* Date */}
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      className="form-input"
                      type="date"
                      value={holidayFormData.date}
                      onChange={e => setHolidayFormData({ ...holidayFormData, date: e.target.value })}
                      required
                    />
                  </div>

                  {/* Holiday Type */}
                  <div className="form-group">
                    <label>Holiday Type</label>
                    <select
                      className="form-input"
                      value={holidayFormData.type}
                      onChange={e => setHolidayFormData({ ...holidayFormData, type: e.target.value, staff_id: '' })}
                    >
                      <option value="company_holiday">Company-wide Holiday</option>
                      <option value="weekly_off">Individual Staff Off</option>
                    </select>
                  </div>

                  {/* Staff selector - full width, only if staff holiday */}
                  {holidayFormData.type === 'weekly_off' && (
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Select Staff Member</label>
                      <select
                        className="form-input"
                        value={holidayFormData.staff_id}
                        onChange={e => setHolidayFormData({ ...holidayFormData, staff_id: e.target.value })}
                        required
                      >
                        <option value="">Choose staff member...</option>
                        {staffs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
                      </select>
                    </div>
                  )}

                  {/* Paid Holiday toggle - full width */}
                  <div className="form-group" style={{ gridColumn: '1 / -1', background: 'rgba(124,92,191,0.05)', padding: '0.9rem 1rem', borderRadius: '12px', border: '1px solid rgba(124,92,191,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#1e1b2e' }}>Paid Holiday</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#8b85a1' }}>Staff will receive full pay for this day</p>
                      </div>
                      <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px', accentColor: 'var(--staff-primary)', cursor: 'pointer' }}
                        checked={holidayFormData.is_paid}
                        onChange={e => setHolidayFormData({ ...holidayFormData, is_paid: e.target.checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="staff-btn-secondary"
                    onClick={() => setShowHolidayModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="staff-btn-primary">
                    <FiCheck /> {editingHoliday ? 'Save Changes' : 'Create Holiday'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ATTENDANCE HISTORY MODAL */}
      <AnimatePresence>
        {showAttendanceHistory && (
          <div className="attendance-history-overlay">
            <motion.div
              className="premium-history-modal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="modal-header">
                <h2 className="modal-title"><FiCalendar /> Attendance Archive</h2>
                <button className="modal-close" onClick={() => setShowAttendanceHistory(false)}><FiX /></button>
              </div>

              <div className="modal-body" style={{ padding: 0 }}>
                <div className="history-filter-shelf">
                  <div className="shelf-inputs">
                    <div className="shelf-group">
                      <label>Period Type</label>
                      <div className="filter-tabs-modern" style={{ background: 'rgba(0,0,0,0.05)', padding: '4px' }}>
                        {['date', 'month'].map(f => (
                          <button 
                            key={f}
                            className={`modern-filter-btn ${historyFilter === f ? 'active' : ''}`} 
                            style={historyFilter === f ? { background: 'white', color: 'var(--staff-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : { color: 'var(--staff-text-muted)' }}
                            onClick={() => setHistoryFilter(f)}
                          >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {historyFilter === 'date' && (
                      <div className="shelf-group">
                        <label>Select Date</label>
                        <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)} />
                      </div>
                    )}
                    {historyFilter === 'month' && (
                      <div className="shelf-group">
                        <label>Select Month</label>
                        <input type="month" value={historyMonth} onChange={e => setHistoryMonth(e.target.value)} />
                      </div>
                    )}

                    <div className="shelf-group">
                      <label>Filter By Staff</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <FiUser style={{ position: 'absolute', left: '12px', color: 'var(--staff-text-muted)' }} />
                        <select 
                          value={historyStaffName} 
                          onChange={e => setHistoryStaffName(e.target.value)} 
                          style={{ paddingLeft: '35px', minWidth: '220px', height: '45px', borderRadius: '10px', border: '1.5px solid var(--staff-border)', background: 'white', fontWeight: 700 }}
                        >
                          <option value="">All Staff Members</option>
                          {staffs.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button 
                      className="staff-btn-history search-btn" 
                      onClick={fetchAttendanceHistory} 
                      disabled={historyLoading}
                      style={{ 
                        padding: '0.875rem 2.5rem',
                        fontSize: '1rem',
                        background: 'var(--staff-grad-primary)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {historyLoading ? (
                        <div className="bm-spinner-mini" style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      ) : (
                        <><FiRefreshCcw /> Fetch Records</>
                      )}
                    </button>
                  </div>
                </div>

                <div className="history-data-table-wrapper" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                  {historyData.length > 0 ? (
                    <table className="modern-history-table">
                      <thead>
                        <tr>
                          <th>Staff Member</th>
                          <th>Status</th>
                          <th>Work Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.map((record, idx) => (
                          <tr key={idx} className="history-row-animate">
                            <td className="staff-cell">
                              <div className="staff-ident">
                                <span className="staff-initials">{record.staff_name?.charAt(0)}</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span className="staff-full-name">{record.staff_name}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--staff-text-muted)' }}>{new Date(record.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge-status ${record.status?.toLowerCase()}`}>
                                {record.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className="shift-badge">
                                  {record.work_type === 'full_day' ? 'Full Shift' : 'Half Shift'}
                                </span>
                                {record.salary_multiplier > 1 && (
                                  <span className="bonus-pill">
                                    {record.salary_multiplier}x Premium
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="table-empty-state">
                      <FiFileText size={48} />
                      <h3>No Records Found</h3>
                      <p>Try choosing a different date or month to view logs.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRESENT STAFF DETAILS MODAL */}
      {showPresentDetails && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(30, 27, 46, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, padding: '1rem 1rem 1rem 260px', boxSizing: 'border-box'
          }}
        >
          <div
            ref={presentDetailsRef}
            style={{
              background: 'rgba(255,255,255,0.98)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 32px 80px rgba(11,102,120,0.25)',
              width: '100%', maxWidth: '860px',
              maxHeight: '90vh', overflowY: 'auto'
            }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.5rem 2rem', background:'linear-gradient(135deg, #0b6678 0%, #0e8fa8 100%)', borderRadius:'24px 24px 0 0' }}>
              <h2 style={{ margin:0, fontSize:'1.2rem', fontWeight:800, color:'white', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                <FiCheckCircle /> Present Staff Details
              </h2>
              <button onClick={() => setShowPresentDetails(false)} style={{ background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.3)', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', cursor:'pointer' }}>
                <FiX />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
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
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(30, 27, 46, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, padding: '1rem 1rem 1rem 260px', boxSizing: 'border-box'
          }}
        >
          <div
            ref={absentDetailsRef}
            style={{
              background: 'rgba(255,255,255,0.98)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 32px 80px rgba(239,68,68,0.2)',
              width: '100%', maxWidth: '860px',
              maxHeight: '90vh', overflowY: 'auto'
            }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.5rem 2rem', background:'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', borderRadius:'24px 24px 0 0' }}>
              <h2 style={{ margin:0, fontSize:'1.2rem', fontWeight:800, color:'white', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                <FiXCircleIcon /> Absent Staff Details
              </h2>
              <button onClick={() => setShowAbsentDetails(false)} style={{ background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.3)', borderRadius:'50%', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', cursor:'pointer' }}>
                <FiX />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
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
    border-color: var(--color-primary);
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
    color: var(--color-text);
  }
  .has-holiday {
    background: rgba(11, 102, 120, 0.08);
    border-color: rgba(11, 102, 120, 0.2);
  }
  .has-weekly-off {
    background: rgba(241, 179, 42, 0.08);
    border-color: rgba(241, 179, 42, 0.2);
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
    background: rgba(241, 179, 42, 0.15);
    color: var(--color-secondary);
  }
  .holiday-badge.weekly_off {
    background: rgba(11, 102, 120, 0.15);
    color: var(--color-primary);
  }
  .holiday-badge.unpaid {
    border-left: 2px solid var(--color-danger);
  }
  .h-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .status-badge.holiday {
    background: rgba(241, 179, 42, 0.15);
    color: var(--color-gold-dark);
    border: 1px solid var(--color-gold);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
    text-align: center;
    display: inline-block;
  }
  .status-badge.leave {
    background: rgba(11, 102, 120, 0.1);
    color: var(--color-primary);
    border: 1px solid var(--color-primary-light);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    display: inline-block;
  }
  .attendance-option.disabled {
    cursor: not-allowed;
  }
  .attendance-option.disabled .attendance-label {
    background-color: #f1f5f9 !important;
    color: #94a3b8 !important;
  }
  .attendance-label.leave-mark {
    border-color: rgba(11, 102, 120, 0.3);
    color: var(--color-primary);
    background: rgba(11, 102, 120, 0.08);
  }
  .attendance-option input[type="radio"]:checked + .attendance-label.leave-mark,
  .attendance-label.leave-mark.checked {
    background: linear-gradient(135deg, rgba(11, 102, 120, 0.1), rgba(11, 102, 120, 0.2)) !important;
    border-color: var(--color-primary) !important;
    color: var(--color-primary) !important;
  }

  /* Staff Form Modal Specific Layout Fixes */
  .modal-content.staff-form-modal {
    max-width: 750px !important;
    width: 95% !important;
  }

  .modal-content.staff-form-modal .form-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 1.25rem !important;
  }

  /* Responsive adjustment for small screens */
  @media (max-width: 768px) {
    .modal-content.staff-form-modal .form-grid {
      grid-template-columns: 1fr !important;
    }
    .modal-content.staff-form-modal {
      max-width: 95% !important;
      padding: 1.5rem !important;
    }
  }

  /* Specific grouping for salary fields inside the grid */
  .salary-fields-container {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    padding: 15px;
    background-color: var(--color-bg-light);
    border-radius: 12px;
    border: 1px solid var(--color-border);
  }
`;
document.head.appendChild(style);
