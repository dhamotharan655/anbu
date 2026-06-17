import React, { useEffect, useState, useCallback, forwardRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { useScrollToRef } from "../hooks/useScrollToRef";
import "./SelectStaff.css";
import {
  FiSearch,
  FiPhone,
  FiMapPin,
} from "react-icons/fi"; // Import Feather icons
import {
  IoPersonOutline,
  IoCheckmarkCircle,
  IoPeopleOutline,
  IoSend,
  IoTrashOutline,
} from "react-icons/io5"; // Import Ionicons
import { openWhatsApp } from "../utils/whatsappUtils";

const COLORS = {
  background: 'linear-gradient(135deg, #f0f7f8 0%, #eef5f6 100%)',
  header: 'var(--gradient-primary)',
  headerGradient: 'var(--gradient-primary)',
  panel: 'rgba(255,255,255,0.85)',
  surface: 'rgba(var(--color-primary-rgb), 0.04)',
  glassWhite: 'var(--color-white)',
  primary: 'var(--color-primary)',
  secondary: 'var(--color-gold)',
  accent: 'var(--color-primary-light)',
  accentLight: 'var(--color-primary-light)',
  success: 'var(--color-success)',
  successLight: 'rgba(var(--color-success-rgb), 0.1)',
  danger: 'var(--color-danger)',
  dangerLight: 'rgba(var(--color-danger-rgb), 0.1)',
  textPrimary: 'var(--color-text)',
  textSecondary: 'var(--color-text-secondary)',
  textMuted: 'var(--color-text-secondary)',
  muted: 'var(--color-border)',
  border: 'var(--color-border)',
  borderLight: 'rgba(var(--color-primary-rgb), 0.08)',
  white: 'var(--color-white)',
  shadowColor: 'rgba(var(--color-primary-rgb), 0.25)',
  cardShadow: 'var(--shadow-md)',
  cardHoverShadow: 'var(--shadow-lg)',
};

const SIZES = {
  radius: 16,
  radiusSmall: 12,
  radiusLarge: 20,
  padding: 24,
  h1: 32,
  h2: 24,
  h3: 18,
  body: 14,
  inputHeight: 52,
  cardPadding: 20,
};

const FILTER_OPTIONS = [
  { label: "Available Staff", value: "available", icon: <IoPersonOutline size={20} /> },
  { label: "Pending Staff", value: "pending", icon: <IoPersonOutline size={20} /> },
  { label: "Pending Messages", value: "pending_messages", icon: <IoSend size={20} /> },
];

const SelectStaff = () => {
  const [searchParams] = useSearchParams();
  // Handle complaint number - it may be encoded or unencoded due to URL parsing issues
  let complaintNo = searchParams.get("complaintNo") || searchParams.get("complaint_no") || "";

  // Handle the case where '#' was interpreted as URL fragment (causing empty complaintNo)
  // Check if we need to extract from the full URL
  if (!complaintNo && window.location.href.includes('complaintNo=')) {
    const urlMatch = window.location.href.match(/complaintNo=([^&]+)/);
    if (urlMatch) {
      complaintNo = decodeURIComponent(urlMatch[1]);
    }
  } else if (complaintNo) {
    // Decode if encoded
    complaintNo = decodeURIComponent(complaintNo);
  }

  const navigate = useNavigate();

  // Debug: Log complaintNo for troubleshooting
  console.log('SelectStaff - complaintNo from URL:', complaintNo);
  console.log('SelectStaff - All search params:', Object.fromEntries(searchParams.entries()));
  console.log('SelectStaff - Full URL:', window.location.href);

  const [viewMode, setViewMode] = useState("available");
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

  // State for notification modal
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState(null);

  const [availableStaff, setAvailableStaff] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);

  // State for pending WhatsApp messages
  const [pendingMessages, setPendingMessages] = useState([]);

  // Scroll ref for notification modal
  const notificationModalRef = useScrollToRef(showNotificationModal);
  const [availableCount, setAvailableCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [bookingBranch, setBookingBranch] = useState("");

  const fetchData = useCallback(async () => {
    try {

      // Fetch booking branch if complaintNo exists
      let bBranch = "";
      if (complaintNo) {
        try {
          const complaintsRes = await api.get('complaints/');
          const complaint = complaintsRes.data.find(c => c.complaint_no === complaintNo);
          if (complaint && complaint.branch_name) {
            bBranch = complaint.branch_name;
            setBookingBranch(complaint.branch_name);
          }
        } catch (err) {
          console.error("Error fetching booking branch:", err);
        }
      }

      const [availableRes, pendingRes] = await Promise.all([
        api.get(`selectstaff/`, {
          params: { mode: "available" },
        }),
        api.get(`selectstaff/`, {
          params: { mode: "pending" },
        }),
      ]);

      const pendingStaffNames = new Set(
        pendingRes.data.map((s) => s.name)
      );

      // Sort helper for branch matching
      const sortByBranch = (list) => {
        if (!bBranch) return list;
        return [...list].sort((a, b) => {
          const aMatch = (a.branch_name || 'Main Hub') === bBranch;
          const bMatch = (b.branch_name || 'Main Hub') === bBranch;
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
      };

      const trulyAvailableStaff = availableRes.data.filter(
        (staff) => !pendingStaffNames.has(staff.name)
      );

      const sortedAvailableStaff = sortByBranch(trulyAvailableStaff);

      const sortedPendingStaff = pendingRes.data.sort((a, b) => {
        // Priority to branch match first
        if (bBranch) {
          const aMatch = (a.branch_name || 'Main Hub') === bBranch;
          const bMatch = (b.branch_name || 'Main Hub') === bBranch;
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
        }

        const getMostRecentComplaintTime = (staff) => {
          if (!staff.complaints || staff.complaints.length === 0) {
            return 0;
          }
          const mostRecent = staff.complaints.reduce((latest, current) => {
            const latestDate = new Date(latest.assigned_at);
            const currentDate = new Date(current.assigned_at);
            return currentDate > latestDate ? current : latest;
          });
          return new Date(mostRecent.assigned_at).getTime();
        };

        const timeA = getMostRecentComplaintTime(a);
        const timeB = getMostRecentComplaintTime(b);

        return timeB - timeA;
      });

      setAvailableStaff(sortedAvailableStaff);
      setPendingStaff(sortedPendingStaff);
      setAvailableCount(trulyAvailableStaff.length);
      setPendingCount(pendingRes.data.length);
    } catch (error) {
      console.error("Failed to fetch staff list:", error);
    }
  }, [complaintNo]);

  // Fetch pending WhatsApp messages
  const fetchPendingMessages = useCallback(async () => {
    try {
      const res = await api.get('pending-whatsapp-messages/');
      if (res.data?.success) {
        setPendingMessages(res.data.complaints || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending messages:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchPendingMessages();
  }, [fetchData, fetchPendingMessages]);

  useEffect(() => {
    if (viewMode === "pending_messages") {
      fetchPendingMessages();
    }
  }, [viewMode, fetchPendingMessages]);

  // Update WhatsApp send status on backend
  const handleUpdateWhatsappStatus = async (complaintNo, field) => {
    try {
      const payload = { complaint_no: complaintNo, [field]: true };
      const res = await api.post('update-whatsapp-status/', payload);
      if (res.data?.success) {
        fetchPendingMessages();
      }
    } catch (error) {
      console.error("Failed to update WhatsApp status:", error);
    }
  };

  useEffect(() => {
    if (viewMode === "available") {
      setStaffList(availableStaff);
    } else {
      setStaffList(pendingStaff);
    }
  }, [viewMode, availableStaff, pendingStaff]);

  // Send location to staff via WhatsApp
  const sendLocationToStaff = async (staffPhone, staffName, latitude, longitude, complaintNo, address, complaintDetails, customerName, customerPhone) => {
    // Input validation
    if (!staffPhone) {
      window.alert("Staff phone number is missing.");
      return;
    }

    // Phone sanitization: Remove all non-numeric characters
    const sanitizedPhone = staffPhone.replace(/\D/g, '');

    if (!sanitizedPhone || sanitizedPhone.length < 10) {
      window.alert("Invalid staff phone number. Cannot send WhatsApp message.");
      return;
    }

    // Add India country code if not already present
    const phoneWithCountryCode = sanitizedPhone.startsWith('91') ? sanitizedPhone : '91' + sanitizedPhone;

    try {
      let message;
      let googleMapsLink = null;

      // Generate message based on available location data
      if (latitude && longitude) {
        // GPS coordinates available - use Google Maps search API for exact pinpoint with label
        const label = encodeURIComponent(`${customerName} @ `);
        googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${label}${latitude},${longitude}`;
        message = `Hello ${staffName},\n\nA new service complaint has been assigned to you.\n\nComplaint ID: ${complaintNo}\nCustomer Name: ${customerName}\nComplaint Details: ${complaintDetails}\nContact Number: ${customerPhone}\nCustomer Location:\n${googleMapsLink}\n\nPlease attend at the earliest.\n\nAnbu Enterprises - Your Trusted Partner`;
      } else if (address && address.trim()) {
        // No GPS coordinates but address available - use address-based Google Maps search API for pinning
        const encodedAddress = encodeURIComponent(address);
        googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        message = `Hello ${staffName},\n\nA new service complaint has been assigned to you.\n\nComplaint ID: ${complaintNo}\nCustomer Name: ${customerName}\nComplaint Details: ${complaintDetails}\nContact Number: ${customerPhone}\nCustomer Location:\n${googleMapsLink}\n\nAddress: ${address}\n\nPlease attend at the earliest.\n\nAnbu Enterprises - Your Trusted Partner`;
      } else {
        // No location data available - inform staff
        message = `Hello ${staffName},\n\nA new service complaint has been assigned to you.\n\nComplaint ID: ${complaintNo}\nCustomer Name: ${customerName}\nComplaint Details: ${complaintDetails}\nContact Number: ${customerPhone}\n\n⚠️ Location details not available. Please contact the customer for location details.\n\nCustomer will be contacted separately with service information.\n\nAnbu Enterprises - Your Trusted Partner`;
      }

      // Use wa.me format with country code and encoded message
      const whatsappURL = `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp in new tab
      window.open(whatsappURL, "_blank");
    } catch (error) {
      console.error("Failed to open WhatsApp:", error);
      window.alert("Failed to open WhatsApp. Please check your browser settings and ensure popups are allowed for this site.");
    }
  };

  // Send notification to customer about staff assignment
  const notifyCustomer = (customerPhone, customerName, staffName, staffPhone) => {
    // Input validation
    if (!customerPhone) {
      window.alert("Customer phone number is missing.");
      return;
    }

    // Phone sanitization: Remove all non-numeric characters
    const sanitizedPhone = customerPhone.replace(/\D/g, '');

    if (!sanitizedPhone || sanitizedPhone.length < 10) {
      window.alert("Invalid customer phone number. Cannot send WhatsApp message.");
      return;
    }

    // Add India country code if not already present
    const phoneWithCountryCode = sanitizedPhone.startsWith('91') ? sanitizedPhone : '91' + sanitizedPhone;

    try {
      // Create customer notification message
      const message = `Hello ${customerName || 'Customer'},\n\nYour service request has been assigned.\n\nStaff Name: ${staffName}\nStaff Phone: ${staffPhone}\n\nThey will contact you shortly.\n\nThank you.`;

      // Use wa.me format with country code and encoded message
      const whatsappURL = `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp in new tab
      window.open(whatsappURL, "_blank");
    } catch (error) {
      console.error("Failed to open WhatsApp for customer:", error);
      window.alert("Failed to open WhatsApp. Please check your browser settings and ensure popups are allowed for this site.");
    }
  };

  // Fetch complaint details to get customer location
  const fetchComplaintDetails = async (complaintNo) => {
    try {
      console.log("Fetching complaint details for:", complaintNo);

      // First, get all complaints to find the specific one
      const complaintsResponse = await api.get(`complaints/`);
      const complaint = complaintsResponse.data.find(c => c.complaint_no === complaintNo);

      if (!complaint) {
        console.warn("Complaint not found in list");
        return null;
      }

      console.log("Found complaint:", complaint);
      console.log("Complaint customer_id:", complaint.customer_id);

      // Get customer location from ClientDetails if customer_id exists
      let latitude = null;
      let longitude = null;

      // Try multiple methods to get GPS coordinates
      if (complaint.customer_id) {
        try {
          console.log("Attempting to fetch customer with ID:", complaint.customer_id);
          const customerResponse = await api.get(`customer-by-id/?customer_id=${complaint.customer_id}`);
          console.log("Customer response:", customerResponse.data);

          if (customerResponse.data && customerResponse.data.found) {
            const customer = customerResponse.data;
            console.log("Customer location data:", customer.location);

            if (customer.location && customer.location.latitude && customer.location.longitude) {
              latitude = customer.location.latitude;
              longitude = customer.location.longitude;
              console.log("✅ Found GPS coordinates from customer:", { latitude, longitude });
            } else {
              console.log("❌ No GPS coordinates in customer location field");
            }
          } else {
            console.log("❌ Customer not found with ID:", complaint.customer_id);
          }
        } catch (customerError) {
          console.warn("Failed to fetch customer details:", customerError);
        }
      }

      // Alternative: Try to get customer by phone number if customer_id is missing
      if (!latitude && !longitude && complaint.phone) {
        try {
          console.log("Attempting to fetch customer by phone:", complaint.phone);
          const customerResponse = await api.get(`customer-by-phone/?phone=${complaint.phone}`);
          console.log("Customer by phone response:", customerResponse.data);

          if (customerResponse.data && customerResponse.data.found) {
            const customer = customerResponse.data;
            console.log("Customer location data from phone lookup:", customer.location);

            if (customer.location && customer.location.latitude && customer.location.longitude) {
              latitude = customer.location.latitude;
              longitude = customer.location.longitude;
              console.log("✅ Found GPS coordinates from phone lookup:", { latitude, longitude });
            }
          }
        } catch (phoneError) {
          console.warn("Failed to fetch customer by phone:", phoneError);
        }
      }

      // Final check: if we still don't have coordinates, log detailed info
      if (!latitude || !longitude) {
        console.log("⚠️ No GPS coordinates found. Available data:");
        console.log("- Complaint customer_id:", complaint.customer_id);
        console.log("- Complaint phone:", complaint.phone);
        console.log("- Complaint address:", complaint.address);
      }

      return {
        latitude: latitude,
        longitude: longitude,
        customer_name: complaint.customer_name,
        customer_phone: complaint.customer_phone,
        address: complaint.address,
        complaint_no: complaint.complaint_no,
        complaint_details: complaint.complaint_details || complaint.details || "No details provided"
      };
    } catch (error) {
      console.error("Failed to fetch complaint details:", error);
      console.error("Error response:", error.response);
      return null;
    }
  };

  // Assign complaint to staff
  const handleAssign = async () => {
    if (!selectedStaff) {
      window.alert("Please select a staff member first.");
      return;
    }

    // Debug: Log complaintNo
    console.log('handleAssign - complaintNo:', complaintNo);
    console.log('handleAssign - Full URL:', window.location.href);

    if (!complaintNo) {
      window.alert("Complaint number is missing. Please go back and try again.\n\nDebug: complaintNo=" + complaintNo + " | URL: " + window.location.href);
      return;
    }
    // Amount is now optional
    if (amount && (isNaN(amount) || parseFloat(amount) < 0)) {
      window.alert("Please enter a valid amount (or leave empty).");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`assignstaff/`, {
        complaint_no: complaintNo,
        staff_name: selectedStaff,
        amount: parseFloat(amount),
      });

      if (res.data?.success) {
        setLoading(false);
        window.alert("Staff Assigned Successfully");

        // Fetch complaint details
        const complaintDetails = await fetchComplaintDetails(complaintNo);

        if (complaintDetails) {
          // Find selected staff details to get phone number
          const selectedStaffDetails = staffList.find(staff => staff.name === selectedStaff);

          if (selectedStaffDetails && selectedStaffDetails.phone) {
            console.log("Staff Assigned - Ready to notify");
            console.log("Complaint details:", complaintDetails);

            // Store assignment details and show modal FIRST (before opening WhatsApp)
            setAssignmentDetails({
              complaintNo,
              staffName: selectedStaff,
              staffPhone: selectedStaffDetails.phone,
              customerName: complaintDetails.customer_name,
              customerPhone: complaintDetails.customer_phone,
              latitude: complaintDetails.latitude,
              longitude: complaintDetails.longitude,
              address: complaintDetails.address,
              complaintDetails: complaintDetails.complaint_details
            });
            // Show notification modal FIRST - before any WhatsApp opens
            setShowNotificationModal(true);
            // Don't navigate yet - wait for user to send notifications
            return;
          } else {
            console.warn("Selected staff phone number not found");
            window.alert("Staff assigned successfully, but could not send WhatsApp - staff phone not found.");
            fetchData();
            setSelectedStaff(null);
            setAmount("");
            navigate("/home");
          }
        } else {
          console.warn("Complaint details not found");
          window.alert("Staff assigned successfully, but could not fetch customer details.");
          fetchData();
          setSelectedStaff(null);
          setAmount("");
          navigate("/home");
        }

        fetchData(); // Refresh data
        setSelectedStaff(null);
        setAmount("");
        navigate("/home"); // Redirect to home page
      } else {
        setLoading(false);
        window.alert("Failed to assign staff. Try again.");
      }
    } catch (error) {
      setLoading(false);
      console.error("Assignment error:", error);
      window.alert("Failed to assign staff. Check console for details.");
    }
  };

  const getFilteredData = () => {
    if (!searchQuery.trim()) return staffList;

    const query = searchQuery.toLowerCase();
    return staffList.filter(
      (item) =>
        item.name?.toLowerCase().includes(query) ||
        item.phone?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query)
    );
  };

  const renderInfoRow = (IconComponent, label, value) => (
    <div style={styles.infoRow}>
      <div style={styles.infoIcon}>
        {IconComponent && <IconComponent size={16} color={COLORS.primary} />}
      </div>
      <p style={styles.infoLabel}>{label}</p>
      <p style={styles.infoValue}>{value}</p>
    </div>
  );

  const renderAvailableItem = (item) => {
    const isSelected = selectedStaff === item.name;
    return (
      <button
        style={{ ...styles.card, ...(isSelected && styles.selectedCard) }}
        onClick={() => setSelectedStaff(item.name)}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
          }
        }}
      >
        {item.photo_url ? (
          <img src={item.photo_url} style={styles.profilePhoto} alt={`${item.name} profile`} />
        ) : (
          <div style={styles.placeholderProfilePhoto}>
            <IoPersonOutline size={40} color={COLORS.white} />
          </div>
        )}
        <div style={styles.cardContent}>
          <div style={styles.cardHeader}>
            <p style={{ ...styles.cardTitle, ...(isSelected && styles.selectedText) }}>
              {item.name}
            </p>
            {isSelected && (
              <div style={styles.statusBadge}>
                <IoCheckmarkCircle size={16} color={COLORS.white} />
                <span style={styles.statusText}>Selected</span>
              </div>
            )}
          </div>
          {renderInfoRow(FiPhone, "Phone", item.phone)}
          {renderInfoRow(FiMapPin, "Location", item.location)}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            width: 'fit-content',
            background: (item.branch_name || 'Main Hub') === bookingBranch ? 'rgba(11, 102, 120, 0.1)' : 'rgba(0,0,0,0.04)',
            color: (item.branch_name || 'Main Hub') === bookingBranch ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            border: (item.branch_name || 'Main Hub') === bookingBranch ? '1px solid rgba(11, 102, 120, 0.2)' : '1px solid transparent'
          }}>
            🏢 Branch: {item.branch_name || 'Main Hub'}
            {bookingBranch && (item.branch_name || 'Main Hub') === bookingBranch && (
              <span style={{
                marginLeft: '4px',
                padding: '2px 6px',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: '4px',
                fontSize: '9px'
              }}>MATCHING</span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderPendingItem = (item) => {
    const isSelected = selectedStaff === item.name;
    return (
      <button
        style={{ ...styles.card, ...(isSelected && styles.selectedCard) }}
        onClick={() => setSelectedStaff(item.name)}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
          }
        }}
      >
        {item.photo_url ? (
          <img src={item.photo_url} style={styles.profilePhoto} alt={`${item.name} profile`} />
        ) : (
          <div style={styles.placeholderProfilePhoto}>
            <IoPersonOutline size={40} color={COLORS.white} />
          </div>
        )}
        <div style={styles.cardContent}>
          <div style={styles.cardHeader}>
            <p style={{ ...styles.cardTitle, ...(isSelected && styles.selectedText) }}>
              {item.name}
            </p>
            {isSelected && (
              <div style={styles.statusBadge}>
                <IoCheckmarkCircle
                  size={16}
                  color={COLORS.white}
                />
                <span style={styles.statusText}>Selected</span>
              </div>
            )}
          </div>
          {renderInfoRow(FiPhone, "Phone", item.phone)}
          {renderInfoRow(FiMapPin, "Location", item.location)}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            width: 'fit-content',
            background: (item.branch_name || 'Main Hub') === bookingBranch ? 'rgba(11, 102, 120, 0.1)' : 'rgba(0,0,0,0.04)',
            color: (item.branch_name || 'Main Hub') === bookingBranch ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            border: (item.branch_name || 'Main Hub') === bookingBranch ? '1px solid rgba(11, 102, 120, 0.2)' : '1px solid transparent'
          }}>
            🏢 Branch: {item.branch_name || 'Main Hub'}
            {bookingBranch && (item.branch_name || 'Main Hub') === bookingBranch && (
              <span style={{
                marginLeft: '4px',
                padding: '2px 6px',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: '4px',
                fontSize: '9px'
              }}>MATCHING</span>
            )}
          </div>
          <p style={{ ...styles.subTitle, ...(isSelected && styles.selectedText) }}>
            Complaints:
          </p>
          {(item.complaints || []).map((c, idx) => (
            <div key={idx} style={styles.complaintBox}>
              <p style={{ ...styles.details, ...(isSelected && styles.selectedText) }}>
                Complaint No: {c.complaint_no}
              </p>
              <p style={{ ...styles.details, ...(isSelected && styles.selectedText) }}>
                Customer Address: {c.customer_address}
              </p>
              <p style={{ ...styles.details, ...(isSelected && styles.selectedText) }}>
                Customer Phone: {c.customer_phone}
              </p>
            </div>
          ))}
        </div>
      </button>
    );
  };

  const renderHeader = () => (
    <>
      <div className="header-section-desktop" style={styles.headerSection}>
        <h1 style={styles.headerTitle}>Select Staff</h1>
        {complaintNo && <p style={styles.headerSubtitle}>Complaint {complaintNo}</p>}
        <div className="grid-desktop" style={styles.filterRow}>
          {FILTER_OPTIONS.map((option) => {
            const isActive = viewMode === option.value;
            let count = 0;
            if (option.value === "available") count = availableCount;
            else if (option.value === "pending") count = pendingCount;
            else if (option.value === "pending_messages") count = pendingMessages.length;
            return (
              <button
                key={option.value}
                style={{ ...styles.filterCard, ...(isActive && styles.filterCardActive) }}
                onClick={() => {
                  setViewMode(option.value);
                  setSearchQuery("");
                  setSelectedStaff(null);
                }}
              >
                <div style={{ ...styles.filterIcon, ...(isActive && styles.filterIconActive) }}>
                  {option.icon}
                </div>
                <span style={{ ...styles.filterLabel, ...(isActive && styles.filterLabelActive) }}>
                  {option.label}
                </span>
                <span style={{ ...styles.filterCount, ...(isActive && styles.filterLabelActive) }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={styles.listHeader}>
        {viewMode !== "pending_messages" && (
          <>
            <div style={styles.searchBarContainer}>
              <FiSearch
                size={20}
                color={COLORS.accent}
                style={{ marginRight: 10 }}
              />
              <input
                style={styles.searchBar}
                placeholder="Search by name, phone or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={styles.amountContainer}>
              <input
                style={styles.amountInput}
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            {selectedStaff && (
              <div style={styles.selectedStaffIndicator}>
                <span style={styles.selectedStaffLabel}>Selected:</span>
                <span style={styles.selectedStaffName}>{selectedStaff}</span>
              </div>
            )}
            <button
              style={{ ...styles.assignBtn, ...(loading && styles.assignBtnDisabled), ...(selectedStaff && styles.assignBtnActive) }}
              onClick={handleAssign}
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <IoSend size={20} color={COLORS.white} />
              )}
              <span style={styles.assignBtnText}>
                {loading ? "Assigning..." : selectedStaff ? `Assign ${selectedStaff}` : "Select Staff to Assign"}
              </span>
            </button>
          </>
        )}
        {viewMode === "pending_messages" && (
          <div style={{ padding: '12px 0', width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: COLORS.textSecondary, margin: 0 }}>
              Complaints where WhatsApp notifications have not been sent
            </p>
          </div>
        )}
      </div>
    </>
  );

  const styles = {
    container: {
      flex: 1,
      minHeight: '100vh',
      backgroundColor: '#f8fcfd',
      background: 'linear-gradient(180deg, #f8fcfd 0%, #f0f7f8 100%)',
      overflow: 'auto',
      padding: SIZES.padding,
    },
    listWrapper: {
      flex: 1,
      padding: '0 16px',
    },
    listContent: {
      paddingBottom: '40px',
    },
    headerSection: {
      background: 'var(--gradient-primary)',
      margin: '0 16px',
      marginTop: '16px',
      padding: SIZES.padding,
      borderRadius: SIZES.radiusLarge,
      boxShadow: '0px 8px 25px rgba(11,102,120,0.35)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    headerTitle: {
      fontSize: SIZES.h1,
      fontWeight: '800',
      color: COLORS.white,
      textAlign: 'center',
      letterSpacing: '0.5px',
      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    headerSubtitle: {
      fontSize: SIZES.body,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
      marginTop: '8px',
      fontWeight: '500',
      backgroundColor: 'rgba(255,255,255,0.2)',
      display: 'inline-block',
      padding: '6px 16px',
      borderRadius: '20px',
    },
    filterRow: {
      display: 'flex',
      flexDirection: 'row',
      marginTop: '24px',
      justifyContent: 'center',
      gap: '16px',
    },
    filterCard: {
      flex: 1,
      maxWidth: '170px',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: SIZES.radius,
      paddingVertical: '18px',
      paddingHorizontal: '12px',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: '2px solid rgba(255,255,255,0.2)',
      transition: 'all 0.3s ease',
    },
    filterCardActive: {
      backgroundColor: COLORS.white,
      borderColor: COLORS.white,
      boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    },
    filterIcon: {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '10px',
      transition: 'all 0.3s ease',
    },
    filterIconActive: {
      background: 'var(--gradient-primary)',
    },
    filterLabel: {
      color: COLORS.white,
      fontWeight: '600',
      fontSize: '13px',
      opacity: 0.9,
    },
    filterLabelActive: {
      color: COLORS.primary,
      fontWeight: '700',
    },
    filterCount: {
      fontSize: SIZES.h2,
      fontWeight: '800',
      marginTop: '8px',
      color: COLORS.white,
    },
    listHeader: {
      backgroundColor: COLORS.white,
      margin: '16px',
      marginTop: '16px',
      borderRadius: SIZES.radiusLarge,
      padding: '20px',
      boxShadow: '0px 4px 20px rgba(0,0,0,0.06)',
    },
    searchBarContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.white,
      borderRadius: SIZES.radius,
      paddingHorizontal: '16px',
      paddingVertical: '4px',
      border: `1px solid ${COLORS.border}`,
      marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.3s ease',
    },
    searchBar: {
      flex: 1,
      fontSize: '15px',
      color: COLORS.textPrimary,
      border: 'none',
      outline: 'none',
      width: '100%',
      background: 'transparent',
      fontWeight: '500',
    },
    amountContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.white,
      borderRadius: SIZES.radius,
      paddingHorizontal: '16px',
      paddingVertical: '4px',
      border: `1px solid ${COLORS.border}`,
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.3s ease',
    },
    amountInput: {
      flex: 1,
      fontSize: '15px',
      color: COLORS.textPrimary,
      border: 'none',
      outline: 'none',
      width: '100%',
      background: 'transparent',
      fontWeight: '500',
    },
    assignBtn: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paddingVertical: '16px',
      borderRadius: SIZES.radius,
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
      transition: 'all 0.3s ease',
    },
    assignBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    assignBtnText: {
      color: COLORS.white,
      fontWeight: '700',
      fontSize: '16px',
      marginLeft: '10px',
      letterSpacing: '0.5px',
    },
    assignBtnActive: {
      background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
      boxShadow: '0 6px 20px rgba(76, 29, 149, 0.5)',
    },
    selectedStaffIndicator: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f3ff',
      border: '2px solid #4c1d95',
      borderRadius: '12px',
      padding: '12px 20px',
      marginBottom: '12px',
      boxShadow: '0 4px 15px rgba(76, 29, 149, 0.2)',
    },
    selectedStaffLabel: {
      fontWeight: '600',
      color: '#6b7280',
      fontSize: '14px',
      marginRight: '8px',
    },
    selectedStaffName: {
      fontWeight: '800',
      color: '#4c1d95',
      fontSize: '16px',
    },
    card: {
      backgroundColor: COLORS.white,
      margin: '16px',
      marginTop: '16px',
      padding: SIZES.cardPadding,
      borderRadius: SIZES.radiusLarge,
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      cursor: 'pointer',
      border: 'none',
      textAlign: 'left',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    selectedCard: {
      borderColor: '#4c1d95', // Dark purple for clear selection visibility
      borderWidth: '3px',
      backgroundColor: '#f5f3ff',
      boxShadow: '0 8px 30px rgba(76, 29, 149, 0.35)',
      transform: 'translateY(-4px)',
    },
    profilePhoto: {
      width: '90px',
      height: '90px',
      borderRadius: '50%',
      display: 'block',
      margin: '0 auto 16px auto',
      objectFit: 'cover',
      border: '3px solid transparent',
      backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundOrigin: 'border-box',
      backgroundClip: 'content-box, border-box',
      boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
    },
    placeholderProfilePhoto: {
      width: '90px',
      height: '90px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontSize: '40px',
      color: COLORS.white,
      boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
    },
    cardContent: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
      width: '100%',
    },
    cardTitle: {
      fontWeight: '700',
      fontSize: SIZES.h3,
      color: COLORS.textPrimary,
      letterSpacing: '0.3px',
    },
    selectedText: {
      color: '#4c1d95',
      fontWeight: '800',
    },
    statusBadge: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 16px',
      borderRadius: '25px',
      background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '2px solid #a78bfa',
      boxShadow: '0 4px 15px rgba(76, 29, 149, 0.4)',
      color: '#fff',
    },
    statusText: {
      color: COLORS.white,
      fontWeight: '700',
      fontSize: '12px',
      marginLeft: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    infoRow: {
      display: 'flex',
      alignItems: 'center',
      marginVertical: '6px',
      width: '100%',
    },
    infoIcon: {
      width: '32px',
      height: '32px',
      borderRadius: '10px',
      backgroundColor: 'rgba(102,126,234,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '12px',
      flexShrink: 0,
    },
    infoLabel: {
      fontWeight: '600',
      color: COLORS.textSecondary,
      width: '85px',
      flexShrink: 0,
      fontSize: '13px',
    },
    infoValue: {
      color: COLORS.textPrimary,
      flex: 1,
      wordBreak: 'break-word',
      fontWeight: '500',
      fontSize: '14px',
    },
    subTitle: {
      fontSize: '15px',
      fontWeight: '700',
      marginBottom: '12px',
      color: COLORS.textPrimary,
      width: '100%',
      textAlign: 'left',
      marginTop: '18px',
    },
    complaintBox: {
      padding: '14px',
      borderRadius: '12px',
      marginBottom: '10px',
      backgroundColor: 'rgba(102,126,234,0.05)',
      width: '100%',
      boxSizing: 'border-box',
      border: '1px solid rgba(102,126,234,0.1)',
    },
    details: {
      fontSize: '13px',
      color: COLORS.textSecondary,
      marginBottom: '4px',
      fontWeight: '500',
    },
    emptyContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '60px',
      width: '100%',
      color: COLORS.textSecondary,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: '16px',
      fontSize: SIZES.h3,
      fontWeight: '700',
      color: COLORS.textPrimary,
    },
    emptySubtext: {
      fontSize: '14px',
      color: COLORS.textMuted,
      textAlign: 'center',
      marginTop: '8px',
    },
    selectedText: {
      color: COLORS.primary,
      fontWeight: '700',
    },
    // Custom Activity Indicator (simple CSS spinner)
    activityIndicator: {
      // border: '4px solid rgba(255, 255, 255, 0.3)', // Moved to App.css
      // borderTop: '4px solid #fff', // Moved to App.css
      // borderRadius: '50%', // Moved to App.css
      // width: '20px', // Moved to App.css
      // height: '20px', // Moved to App.css
      // animation: 'spin 1s linear infinite', // Moved to App.css
      marginRight: '10px',
    },
    // '@keyframes spin': { // Moved to App.css
    //     '0%': { transform: 'rotate(0deg)' },
    //     '100%': { transform: 'rotate(360deg)' },
    // },
  };

  const renderStaffSections = () => {
    const data = getFilteredData();
    if (!data || data.length === 0) {
      return (
        <div style={styles.emptyContainer}>
          <IoPeopleOutline size={64} color={COLORS.textMuted} />
          <p style={styles.emptyText}>No staff found</p>
          <p style={styles.emptySubtext}>
            {viewMode === "available"
              ? "No available staff members"
              : "No staff with pending tasks"}
          </p>
        </div>
      );
    }

    if (!bookingBranch) {
      return data.map((item) =>
        viewMode === "available" ? renderAvailableItem(item) : renderPendingItem(item)
      );
    }

    const matchingStaff = data.filter(s => (s.branch_name || 'Main Hub') === bookingBranch);
    const otherStaff = data.filter(s => (s.branch_name || 'Main Hub') !== bookingBranch);

    return (
      <div style={{ gridColumn: '1 / -1', width: '100%' }}>
        {matchingStaff.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 16px 20px',
              padding: '12px 20px',
              background: 'rgba(11, 102, 120, 0.08)',
              borderRadius: '16px',
              borderLeft: '5px solid var(--color-primary)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px'
              }}>
                🎯
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary)', margin: 0 }}>
                  MATCHING BRANCH STAFF
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0', opacity: 0.8 }}>
                  Team members from {bookingBranch}
                </p>
              </div>
            </div>
            <div className="grid-desktop" style={{ ...styles.listContent, marginTop: 0 }}>
              {matchingStaff.map(item =>
                viewMode === "available" ? renderAvailableItem(item) : renderPendingItem(item)
              )}
            </div>
          </div>
        )}

        {otherStaff.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '24px 16px 20px',
              padding: '12px 20px',
              background: 'rgba(0,0,0,0.04)',
              borderRadius: '16px',
              borderLeft: '5px solid #6b7280',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px'
              }}>
                🏢
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#374151', margin: 0 }}>
                  OTHER BRANCH STAFF
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0', opacity: 0.8 }}>
                  Members from other locations
                </p>
              </div>
            </div>
            <div className="grid-desktop" style={{ ...styles.listContent, marginTop: 0 }}>
              {otherStaff.map(item =>
                viewMode === "available" ? renderAvailableItem(item) : renderPendingItem(item)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container-desktop" style={styles.container}>
      {/* AnimatedOrbs (should be in Layout or root) */}
      {renderHeader()}
      <div style={styles.listWrapper}>
        <div className="grid-desktop" style={styles.listContent}>
          {viewMode === "pending_messages" ? (
            pendingMessages.length > 0 ? (
              pendingMessages.map((item, index) => (
                <PendingMessageCard
                  key={item.id || item.complaint_no || index}
                  complaint={item}
                  COLORS={COLORS}
                  SIZES={SIZES}
                  onSendToCustomer={() => {
                    if (item.customer_phone) {
                      notifyCustomer(
                        item.customer_phone,
                        item.customer_name,
                        item.assigned_staff || item.staff_name,
                        item.staff_phone
                      );
                      handleUpdateWhatsappStatus(item.complaint_no, 'whatsapp_sent_to_customer');
                    }
                  }}
                  onSendToStaff={() => {
                    if (item.staff_phone) {
                      sendLocationToStaff(
                        item.staff_phone,
                        item.assigned_staff || item.staff_name,
                        item.latitude,
                        item.longitude,
                        item.complaint_no,
                        item.address,
                        item.complaint_details,
                        item.customer_name,
                        item.customer_phone
                      );
                      handleUpdateWhatsappStatus(item.complaint_no, 'whatsapp_sent_to_staff');
                    }
                  }}
                />
              ))
            ) : (
              <div style={styles.emptyContainer}>
                <IoCheckmarkCircle size={64} color="#25D366" />
                <p style={styles.emptyText}>All messages sent!</p>
                <p style={styles.emptySubtext}>
                  No pending WhatsApp notifications
                </p>
              </div>
            )
          ) : (
            renderStaffSections()
          )}
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        show={showNotificationModal}
        ref={notificationModalRef}
        onClose={() => {
          setShowNotificationModal(false);
          setAssignmentDetails(null);
          fetchData();
          setSelectedStaff(null);
          setAmount("");
          navigate("/home");
        }}
        onNotifyStaff={() => {
          if (assignmentDetails) {
            // Send notification to staff
            sendLocationToStaff(
              assignmentDetails.staffPhone,
              assignmentDetails.staffName,
              assignmentDetails.latitude,
              assignmentDetails.longitude,
              assignmentDetails.complaintNo,
              assignmentDetails.address,
              assignmentDetails.complaintDetails,
              assignmentDetails.customerName,
              assignmentDetails.customerPhone
            );
            // Track WhatsApp send status to backend
            handleUpdateWhatsappStatus(assignmentDetails.complaintNo, 'whatsapp_sent_to_staff');
          }
        }}
        onNotifyCustomer={() => {
          if (assignmentDetails) {
            // Send notification to customer
            notifyCustomer(
              assignmentDetails.customerPhone,
              assignmentDetails.customerName,
              assignmentDetails.staffName,
              assignmentDetails.staffPhone
            );
            // Track WhatsApp send status to backend
            handleUpdateWhatsappStatus(assignmentDetails.complaintNo, 'whatsapp_sent_to_customer');
          }
        }}
        assignmentDetails={assignmentDetails}
        COLORS={COLORS}
        SIZES={SIZES}
      />
    </div>
  );
};

// Pending Message Card Component
const PendingMessageCard = ({ complaint, COLORS, SIZES, onSendToCustomer, onSendToStaff }) => {
  const customerSent = complaint.whatsapp_sent_to_customer === true;
  const staffSent = complaint.whatsapp_sent_to_staff === true;

  return (
    <div style={{
      backgroundColor: COLORS.white,
      borderRadius: SIZES.radius,
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: COLORS.textPrimary,
        }}>
          {complaint.complaint_no}
        </span>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '13px', color: COLORS.textSecondary, margin: '4px 0' }}>
          <strong>Customer:</strong> {complaint.customer_name || '-'}
        </p>
        <p style={{ fontSize: '13px', color: COLORS.textSecondary, margin: '4px 0' }}>
          <strong>Assigned Staff:</strong> {complaint.assigned_staff || complaint.staff_name || '-'}
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '14px',
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          padding: '4px 12px',
          borderRadius: '12px',
          backgroundColor: customerSent ? '#d1fae5' : '#fee2e2',
          color: customerSent ? '#059669' : '#dc2626',
        }}>
          Customer: {customerSent ? 'Sent' : 'Not Sent'}
        </span>
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          padding: '4px 12px',
          borderRadius: '12px',
          backgroundColor: staffSent ? '#d1fae5' : '#fee2e2',
          color: staffSent ? '#059669' : '#dc2626',
        }}>
          Staff: {staffSent ? 'Sent' : 'Not Sent'}
        </span>
      </div>

      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        {!customerSent && (
          <button
            onClick={onSendToCustomer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: COLORS.white,
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
            }}
          >
            <span>👤</span>
            Send to Customer
          </button>
        )}
        {customerSent && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            background: '#d1fae5',
            color: '#059669',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
          }}>
            <IoCheckmarkCircle size={16} />
            Customer Sent
          </span>
        )}
        {!staffSent && (
          <button
            onClick={onSendToStaff}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: COLORS.white,
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
            }}
          >
            <span>📱</span>
            Send to Staff
          </button>
        )}
        {staffSent && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            background: '#d1fae5',
            color: '#059669',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
          }}>
            <IoCheckmarkCircle size={16} />
            Staff Sent
          </span>
        )}
      </div>
    </div>
  );
};

// Notification Modal Component
const NotificationModal = forwardRef(({
  show,
  onClose,
  onNotifyStaff,
  onNotifyCustomer,
  assignmentDetails,
  COLORS,
  SIZES
}, ref) => {
  if (!show || !assignmentDetails) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div
        ref={ref}
        style={{
          backgroundColor: COLORS.white,
          borderRadius: SIZES.radiusLarge,
          padding: '32px',
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <h2 style={{
          marginTop: 0,
          marginBottom: '8px',
          color: COLORS.textPrimary,
          fontSize: '24px',
          fontWeight: '700',
        }}>
          ✓ Staff Assigned Successfully
        </h2>

        <p style={{
          color: COLORS.textSecondary,
          marginBottom: '24px',
          fontSize: '15px',
        }}>
          Staff <strong>{assignmentDetails.staffName}</strong> has been assigned to complaint <strong>#{assignmentDetails.complaintNo}</strong>
        </p>

        <div style={{
          backgroundColor: 'rgba(102, 126, 234, 0.08)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: COLORS.textPrimary, fontSize: '14px' }}>
            Assignment Details:
          </p>
          <p style={{ margin: '4px 0', fontSize: '13px', color: COLORS.textSecondary }}>
            <strong>Staff:</strong> {assignmentDetails.staffName} ({assignmentDetails.staffPhone})
          </p>
          <p style={{ margin: '4px 0', fontSize: '13px', color: COLORS.textSecondary }}>
            <strong>Customer:</strong> {assignmentDetails.customerName}
          </p>
        </div>

        <p style={{
          color: COLORS.textSecondary,
          marginBottom: '16px',
          fontSize: '13px',
          textAlign: 'center',
        }}>
          Click below to send WhatsApp notifications. You can send both or just one.
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          flexDirection: 'column',
        }}>
          <button
            onClick={onNotifyStaff}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: COLORS.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
            }}
          >
            <span style={{ fontSize: '20px' }}>📱</span>
            Notify Staff (WhatsApp)
          </button>

          <button
            onClick={onNotifyCustomer}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: COLORS.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            }}
          >
            <span style={{ fontSize: '20px' }}>👤</span>
            Notify Customer (WhatsApp)
          </button>

          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px 24px',
              background: 'transparent',
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
});

export default SelectStaff;
