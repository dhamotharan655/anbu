import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api";
import { FiHome, FiSave, FiPrinter, FiX, FiPlus, FiTrash2, FiUser, FiPhone, FiMapPin, FiSearch, FiPackage } from "react-icons/fi";

const MotorDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state || {};
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", isError: false });

    // ⭐ NEW: Get job_type from URL parameter or location state
    const urlParams = new URLSearchParams(location.search);
    const jobTypeFromUrl = urlParams.get('job_type');

    // ⭐ NEW: Customer info from Booking page or Stock Management
    const [customerInfo, setCustomerInfo] = useState({
        customer_name: locationState.customer_name || "",
        customer_phone: locationState.customer_phone || "",
        customer_address: locationState.address || "",
        job_category: locationState.job_category || "normal_service",
        // ⭐ NEW: Job Type from URL or state (readonly)
        job_type: jobTypeFromUrl || locationState.job_category || "normal_service",
        // ⭐ NEW: Stock Management context
        from_stock_management: locationState.from_stock_management || false,
        stock_name: locationState.stock_name || ""
    });

    // ⭐ NEW: Serial number lookup state
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [lookupResult, setLookupResult] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        company_name: "",
        motor_make: "",
        serial_no: "",
        kw: "",
        hp: "",
        rpm: "",
        no_of_slots: "",
        core_length: "",
        load_current: "",
        swg: "",
        connection: "Delta",
        total_set: "",
        total_weight: "",
        resistance_value: "",
        winder_name: "",
        opening_date: "",
        closing_date: "",
        remarks: "",
        // ⭐ NEW: Motor Amount (only for motor_sales)
        motor_amount: "",
        // ⭐ NEW: Discount percent for motor_sales
        discount_percent: 0,
        // ⭐ NEW: Minimum price for motor_sales
        minimum_price: 0,
        winding_details: [
            { pitch: "", turns: "", set_weight: "" },
            { pitch: "", turns: "", set_weight: "" },
            { pitch: "", turns: "", set_weight: "" }
        ],
        // ⭐ NEW: Motor brands with counts (for stock management)
        motor_brands: [
            { brand: "", count: 0 }
        ]
    });

    const showToast = (message, isError = false) => {
        setToast({ show: true, message, isError });
        setTimeout(() => setToast({ show: false, message: "", isError: false }), 3000);
    };

    // ⭐ NEW: Serial number lookup function
    const lookupSerialNo = async () => {
        if (!formData.serial_no.trim()) {
            showToast("⚠️ Please enter a Serial No. to search", true);
            return;
        }

        setIsLookingUp(true);
        try {
            const response = await api.get(`motor-details/search/?serial_no=${encodeURIComponent(formData.serial_no)}`);
            if (response.data.success && response.data.data && response.data.data.length > 0) {
                const existingMotor = response.data.data[0];
                setLookupResult(existingMotor);
                showToast(`✅ Found existing motor record!`, false);
            } else {
                setLookupResult(null);
                showToast("ℹ️ No existing record found for this Serial No.", false);
            }
        } catch (error) {
            console.error("Error looking up serial no:", error);
            showToast("⚠️ Error searching for serial number", true);
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWindingChange = (index, field, value) => {
        const newWindingDetails = [...formData.winding_details];
        newWindingDetails[index] = { ...newWindingDetails[index], [field]: value };
        setFormData(prev => ({ ...prev, winding_details: newWindingDetails }));
    };

    const addRow = () => {
        setFormData(prev => ({
            ...prev,
            winding_details: [...prev.winding_details, { pitch: "", turns: "", set_weight: "" }]
        }));
    };

    const removeRow = (index) => {
        if (formData.winding_details.length > 1) {
            const newWindingDetails = formData.winding_details.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, winding_details: newWindingDetails }));
        }
    };

    // ⭐ NEW: Motor brands management functions
    const handleMotorBrandChange = (index, field, value) => {
        const newMotorBrands = [...formData.motor_brands];
        newMotorBrands[index] = { ...newMotorBrands[index], [field]: value };
        setFormData(prev => ({ ...prev, motor_brands: newMotorBrands }));
    };

    const addMotorBrand = () => {
        setFormData(prev => ({
            ...prev,
            motor_brands: [...prev.motor_brands, { brand: "", count: 0 }]
        }));
    };

    const removeMotorBrand = (index) => {
        if (formData.motor_brands.length > 1) {
            const newMotorBrands = formData.motor_brands.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, motor_brands: newMotorBrands }));
        }
    };

    const resetForm = () => {
        setFormData({
            company_name: "",
            motor_make: "",
            serial_no: "",
            kw: "",
            hp: "",
            rpm: "",
            no_of_slots: "",
            core_length: "",
            load_current: "",
            swg: "",
            connection: "Delta",
            total_set: "",
            total_weight: "",
            resistance_value: "",
            winder_name: "",
            opening_date: "",
            closing_date: "",
            remarks: "",
            winding_details: [
                { pitch: "", turns: "", set_weight: "" },
                { pitch: "", turns: "", set_weight: "" },
                { pitch: "", turns: "", set_weight: "" }
            ],
            motor_brands: [
                { brand: "", count: 0 }
            ]
        });
    };

    const saveForm = async () => {
        // Validation
        if (!formData.company_name.trim()) {
            showToast("⚠️ Please fill in Company Name", true);
            return;
        }
        if (!formData.serial_no.trim()) {
            showToast("⚠️ Please fill in Serial No.", true);
            return;
        }
        if (!formData.winder_name.trim()) {
            showToast("⚠️ Please fill in Winder Name", true);
            return;
        }

        // ⭐ NEW: Check if opened from Stock Management
        if (locationState.from_stock_management) {
            showToast("✅ Motor details collected! Returning to Stock Management...", false);
            
            setTimeout(() => {
                navigate("/stock-management", {
                    state: {
                        // Return motor details to pre-fill in stock management
                        from_motor_details: true,
                        motor_company: formData.company_name,
                        motor_make: formData.motor_make,
                        motor_kw: formData.kw,
                        motor_hp: formData.hp,
                        motor_rpm: formData.rpm,
                        motor_no_of_slots: formData.no_of_slots,
                        motor_core_length: formData.core_length,
                        motor_load_current: formData.load_current,
                        motor_swg: formData.swg,
                        motor_connection: formData.connection,
                        motor_total_set: formData.total_set,
                        motor_total_weight: formData.total_weight,
                        motor_resistance_value: formData.resistance_value,
                        // ⭐ NEW: Include motor brands with counts
                        motor_brands: formData.motor_brands,
                        // Include stock data to preserve it
                        stock_name: locationState.stock_name,
                        stock_category: locationState.stock_category,
                        stock_quantity: locationState.stock_quantity,
                        stock_unit: locationState.stock_unit,
                        stock_supplier: locationState.stock_supplier,
                        stock_purchase_price: locationState.stock_purchase_price,
                        stock_total_purchase: locationState.stock_total_purchase,
                        stock_selling_price: locationState.stock_selling_price,
                        stock_buying_price: locationState.stock_buying_price,
                        stock_minimum_price: locationState.stock_minimum_price,
                        stock_date_of_purchase: locationState.stock_date_of_purchase
                    }
                });
            }, 1000);
            return;
        }

        // ⭐ NEW: Instead of saving motor details directly, pass to Booking
        // Motor details will be saved AFTER booking is submitted with complaint_id
        showToast("✅ Motor details collected! Proceeding to Booking...", false);

        setTimeout(() => {
            navigate("/booking", {
                state: {
                    // Return motor details to pre-fill in booking
                    from_motor_details: true,
                    motor_serial_no: formData.serial_no,
                    motor_company: formData.company_name,
                    motor_make: formData.motor_make,
                    motor_kw: formData.kw,
                    motor_hp: formData.hp,
                    motor_rpm: formData.rpm,
                    motor_no_of_slots: formData.no_of_slots,
                    motor_core_length: formData.core_length,
                    motor_load_current: formData.load_current,
                    motor_swg: formData.swg,
                    motor_connection: formData.connection,
                    motor_total_set: formData.total_set,
                    motor_total_weight: formData.total_weight,
                    motor_resistance_value: formData.resistance_value,
                    motor_winder_name: formData.winder_name,
                    motor_opening_date: formData.opening_date,
                    motor_closing_date: formData.closing_date,
                    motor_remarks: formData.remarks,
                    motor_winding_details: formData.winding_details,
                    // ⭐ NEW: Include motor_amount
                    motor_amount: formData.motor_amount,
                    // ⭐ NEW: Include discount_percent (as both discount_percent and motor_discount_percent)
                    discount_percent: formData.discount_percent,
                    motor_discount_percent: formData.discount_percent,
                    // ⭐ NEW: Include minimum_price
                    minimum_price: formData.minimum_price,
                    job_category: customerInfo.job_type,
                    // Pre-fill customer info
                    customer_name: customerInfo.customer_name,
                    customer_phone: customerInfo.customer_phone,
                    address: customerInfo.customer_address
                }
            });
        }, 1000);
    };

    // Styles
    const styles = {
        page: {
            minHeight: "100vh",
            background: "#F0F2FF",
            fontFamily: "'DM Sans', sans-serif",
            color: "#1E1B4B",
            paddingBottom: "40px"
        },
        hero: {
            background: "linear-gradient(135deg, #5B4FE9 0%, #7C3AED 50%, #9333EA 100%)",
            borderRadius: "24px",
            padding: "40px",
            marginBottom: "28px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 16px 48px rgba(91,79,233,.3)"
        },
        heroInner: {
            display: "flex",
            alignItems: "center",
            gap: "20px",
            position: "relative",
            zIndex: 1
        },
        heroIconBox: {
            width: "64px",
            height: "64px",
            background: "rgba(255,255,255,.18)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            border: "1px solid rgba(255,255,255,.25)",
            backdropFilter: "blur(8px)",
            flexShrink: 0
        },
        heroText: {
            color: "white"
        },
        heroTitle: {
            fontFamily: "'Syne', sans-serif",
            fontSize: "28px",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.5px"
        },
        heroSubtitle: {
            color: "rgba(255,255,255,.75)",
            fontSize: "14px",
            marginTop: "4px"
        },
        heroBadge: {
            marginLeft: "auto",
            background: "rgba(255,255,255,.18)",
            border: "1px solid rgba(255,255,255,.25)",
            color: "white",
            padding: "8px 18px",
            borderRadius: "99px",
            fontSize: "13px",
            fontWeight: 600,
            backdropFilter: "blur(8px)"
        },
        formWrapper: {
            background: "white",
            borderRadius: "24px",
            boxShadow: "0 2px 24px rgba(0,0,0,.06)",
            overflow: "hidden",
            margin: "0 32px"
        },
        sectionTitle: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "20px 28px 16px",
            fontFamily: "'Syne', sans-serif",
            fontSize: "15px",
            fontWeight: 700,
            color: "#1E1B4B",
            borderBottom: "1.5px solid #E5E7EB",
            background: "#FAFBFF"
        },
        dot: {
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #5B4FE9 0%, #7C3AED 50%, #9333EA 100%)",
            boxShadow: "0 0 0 3px rgba(91,79,233,.15)"
        },
        formGrid: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0",
            padding: "24px 28px"
        },
        field: {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            padding: "12px 16px 12px 0",
            borderBottom: "1px solid #F3F4F6"
        },
        fieldEven: {
            paddingLeft: "16px",
            paddingRight: 0,
            borderLeft: "1px solid #F3F4F6"
        },
        label: {
            fontSize: "11.5px",
            fontWeight: 600,
            color: "#6B7280",
            textTransform: "uppercase",
            letterSpacing: ".5px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
        },
        input: {
            padding: "10px 14px",
            border: "1.5px solid #E5E7EB",
            borderRadius: "10px",
            fontSize: "14px",
            fontFamily: "'DM Sans', sans-serif",
            color: "#1E1B4B",
            background: "#FAFAFA",
            outline: "none",
            transition: "all .2s"
        },
        tableWrap: {
            padding: "0 28px 24px"
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            borderRadius: "14px",
            overflow: "hidden",
            border: "1.5px solid #E5E7EB"
        },
        tableHead: {
            background: "linear-gradient(135deg, #5B4FE9, #7C3AED)"
        },
        tableHeadTh: {
            padding: "13px 16px",
            fontFamily: "'Syne', sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "white",
            textAlign: "left",
            letterSpacing: ".3px"
        },
        tableBody: {
            background: "#F9FAFB"
        },
        tableTd: {
            padding: "10px 12px",
            borderBottom: "1px solid #F0F0F4"
        },
        tableInput: {
            width: "100%",
            border: "none",
            background: "transparent",
            padding: "4px 6px",
            fontSize: "14px",
            fontFamily: "'DM Sans', sans-serif",
            color: "#1E1B4B",
            outline: "none"
        },
        addRowBtn: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "10px",
            background: "none",
            border: "1.5px dashed #7C72F0",
            color: "#5B4FE9",
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all .2s",
            fontFamily: "'DM Sans', sans-serif"
        },
        remarksWrap: {
            padding: "0 28px 28px"
        },
        textarea: {
            padding: "10px 14px",
            border: "1.5px solid #E5E7EB",
            borderRadius: "10px",
            fontSize: "14px",
            fontFamily: "'DM Sans', sans-serif",
            color: "#1E1B4B",
            background: "#FAFAFA",
            outline: "none",
            resize: "vertical",
            minHeight: "80px",
            width: "100%"
        },
        actionBar: {
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            padding: "20px 28px",
            borderTop: "1.5px solid #E5E7EB",
            background: "#FAFBFF"
        },
        btnCancel: {
            padding: "11px 24px",
            background: "white",
            color: "#6B7280",
            border: "1.5px solid #E5E7EB",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            transition: "all .2s",
            display: "flex",
            alignItems: "center",
            gap: "8px"
        },
        btnSave: {
            padding: "11px 28px",
            background: "linear-gradient(135deg, #5B4FE9 0%, #7C3AED 50%, #9333EA 100%)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(91,79,233,.35)",
            transition: "all .2s",
            display: "flex",
            alignItems: "center",
            gap: "8px"
        },
        btnPrint: {
            padding: "11px 24px",
            background: "#F0FDF4",
            color: "#16A34A",
            border: "1.5px solid #BBF7D0",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            transition: "all .2s",
            display: "flex",
            alignItems: "center",
            gap: "8px"
        },
        toast: {
            position: "fixed",
            bottom: "32px",
            right: "32px",
            background: "#1E1B4B",
            color: "white",
            padding: "14px 22px",
            borderRadius: "14px",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 8px 32px rgba(0,0,0,.2)",
            transform: "translateY(80px)",
            opacity: 0,
            transition: "all .35s cubic-bezier(.34,1.56,.64,1)",
            zIndex: 999
        },
        toastShow: {
            transform: "translateY(0)",
            opacity: 1
        },
        errorInput: {
            borderColor: "#EF4444"
        },
        rowNumber: {
            color: "#6B7280",
            fontSize: "13px",
            padding: "10px 12px"
        },
        removeBtn: {
            background: "none",
            border: "none",
            color: "#EF4444",
            cursor: "pointer",
            fontSize: "16px",
            padding: "4px"
        }
    };

    return (
        <div style={styles.page}>
            {/* HERO SECTION */}
            <div style={styles.hero}>
                <div style={styles.heroInner}>
                    <div style={styles.heroIconBox}>⚙️</div>
                    <div style={styles.heroText}>
                        <h1 style={styles.heroTitle}>
                            {customerInfo.from_stock_management ? 'Motor Details for Stock' : 'Three Phase Motor'}
                        </h1>
                        <p style={styles.heroSubtitle}>
                            {customerInfo.from_stock_management
                                ? `Add motor specifications for "${customerInfo.stock_name || 'Motor'}" stock item`
                                : 'Record winding details, coil specs & job information'
                            }
                        </p>
                    </div>
                    <div style={styles.heroBadge}>
                        {customerInfo.from_stock_management ? 'Stock Item' : 'New Entry'}
                    </div>
                </div>
            </div>

            {/* ⭐ NEW: CUSTOMER INFO SECTION - Show if from Booking (or show placeholder) */}
            <div style={{ ...styles.formWrapper, marginBottom: '20px', margin: '0 32px 20px', backgroundColor: customerInfo.from_stock_management ? '#E3F2FD' : (customerInfo.customer_name ? '#FFF3E0' : '#FFEBEE') }}>
                <div style={{ ...styles.sectionTitle, background: customerInfo.from_stock_management ? '#E3F2FD' : (customerInfo.customer_name ? '#FFF3E0' : '#FFEBEE') }}>
                    <div style={{ ...styles.dot, background: customerInfo.from_stock_management ? 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' : (customerInfo.customer_name ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' : 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)') }}></div>
                    <span style={{ color: customerInfo.from_stock_management ? '#1565C0' : (customerInfo.customer_name ? '#E65100' : '#C62828') }}>
                        {customerInfo.from_stock_management
                            ? `Stock Item: ${customerInfo.stock_name || 'Motor'}`
                            : (customerInfo.customer_name ? 'Customer Information (from Service Booking)' : '⚠️ No Customer Data - Please go back and fill customer details first')
                        }
                    </span>
                </div>
                <div style={{ padding: '16px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    {customerInfo.from_stock_management ? (
                        <>
                            <div style={styles.field}>
                                <label style={{ ...styles.label, color: '#1565C0' }}>
                                    <FiPackage size={13} /> Stock Name
                                </label>
                                <input
                                    type="text"
                                    value={customerInfo.stock_name || 'Motor'}
                                    readOnly
                                    style={{ ...styles.input, background: '#E3F2FD', color: '#000' }}
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={{ ...styles.label, color: '#1565C0' }}>
                                    <FiUser size={13} /> Context
                                </label>
                                <input
                                    type="text"
                                    value="Stock Management"
                                    readOnly
                                    style={{ ...styles.input, background: '#E3F2FD', color: '#000', fontWeight: '600' }}
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={{ ...styles.label, color: '#1565C0' }}>
                                    <FiHome size={13} /> Purpose
                                </label>
                                <input
                                    type="text"
                                    value="Add Motor Specifications"
                                    readOnly
                                    style={{ ...styles.input, background: '#E3F2FD', color: '#000', fontWeight: '600' }}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={styles.field}>
                                <label style={{ ...styles.label, color: customerInfo.customer_name ? '#E65100' : '#C62828' }}>
                                    <FiUser size={13} /> Customer Name
                                </label>
                                <input
                                    type="text"
                                    value={customerInfo.customer_name || '(Not provided)'}
                                    readOnly
                                    style={{ ...styles.input, background: '#FFF8E1', color: customerInfo.customer_name ? '#000' : '#999' }}
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={{ ...styles.label, color: customerInfo.customer_name ? '#E65100' : '#C62828' }}>
                                    <FiPhone size={13} /> Phone
                                </label>
                                <input
                                    type="text"
                                    value={customerInfo.customer_phone || '(Not provided)'}
                                    readOnly
                                    style={{ ...styles.input, background: '#FFF8E1', color: customerInfo.customer_phone ? '#000' : '#999' }}
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={{ ...styles.label, color: customerInfo.customer_name ? '#E65100' : '#C62828' }}>
                                    <FiHome size={13} /> Job Type
                                </label>
                                <input
                                    type="text"
                                    value={customerInfo.job_type === 'motor_service' ? 'Motor Service' : customerInfo.job_type === 'motor_sale' ? 'Motor Sales' : customerInfo.job_category === 'motor_service' ? 'Motor Service' : customerInfo.job_category === 'motor_sale' ? 'Motor Sales' : 'Normal Service'}
                                    readOnly
                                    style={{ ...styles.input, background: '#FFF8E1', fontWeight: '600', color: customerInfo.job_type === 'motor_sale' || customerInfo.job_category === 'motor_sale' ? '#16A34A' : customerInfo.job_type === 'motor_service' || customerInfo.job_category === 'motor_service' ? '#2563EB' : '#6B7280' }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* FORM WRAPPER */}
            <div style={styles.formWrapper}>
                {/* SECTION 1: MOTOR INFO */}
                <div style={styles.sectionTitle}>
                    <div style={styles.dot}></div> Motor Information
                </div>
                <div style={styles.formGrid}>
                    <div style={styles.field}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Company Name
                        </label>
                        <input
                            type="text"
                            name="company_name"
                            placeholder="e.g. ABB Company"
                            value={formData.company_name}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={{ ...styles.field, ...styles.fieldEven }}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Motor Make
                        </label>
                        <input
                            type="text"
                            name="motor_make"
                            placeholder="e.g. Siemens, Crompton"
                            value={formData.motor_make}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Serial No.
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                name="serial_no"
                                placeholder="e.g. 769423"
                                value={formData.serial_no}
                                onChange={handleInputChange}
                                style={{ ...styles.input, flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={lookupSerialNo}
                                disabled={isLookingUp}
                                style={{
                                    ...styles.input,
                                    width: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isLookingUp ? '#E5E7EB' : '#5B4FE9',
                                    color: 'white',
                                    cursor: isLookingUp ? 'not-allowed' : 'pointer',
                                    border: 'none'
                                }}
                                title="Search existing motor by Serial No."
                            >
                                {isLookingUp ? '...' : <FiSearch size={16} />}
                            </button>
                        </div>
                    </div>
                    <div style={{ ...styles.field, ...styles.fieldEven }}>
                        <label style={styles.label}>
                            <FiHome size={13} /> KW / HP
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                type="text"
                                name="kw"
                                placeholder="KW (e.g. 2.2)"
                                value={formData.kw}
                                onChange={handleInputChange}
                                style={{ ...styles.input, flex: 1 }}
                            />
                            <input
                                type="text"
                                name="hp"
                                placeholder="HP (e.g. 3HP)"
                                value={formData.hp}
                                onChange={handleInputChange}
                                style={{ ...styles.input, flex: 1 }}
                            />
                        </div>
                    </div>
                    {/* ⭐ NEW: Motor Amount - Only visible for motor_sales */}
                    {(customerInfo.job_type === 'motor_sale') && (
                        <>
                        <div style={styles.field}>
                            <label style={{ ...styles.label, color: '#16A34A' }}>
                                <FiHome size={13} /> Motor Amount (₹)
                            </label>
                            <input
                                type="number"
                                name="motor_amount"
                                placeholder="e.g. 15000"
                                value={formData.motor_amount}
                                onChange={handleInputChange}
                                style={{ ...styles.input, borderColor: '#16A34A', background: '#F0FDF4' }}
                            />
                        </div>
                        {/* ⭐ NEW: Discount Percent - Only visible for motor_sales */}
                        <div style={styles.field}>
                            <label style={{ ...styles.label, color: '#f59e0b' }}>
                                <FiHome size={13} /> Discount (%)
                            </label>
                            <input
                                type="number"
                                name="discount_percent"
                                placeholder="e.g. 10"
                                value={formData.discount_percent}
                                onChange={(e) => {
                                    const discount = parseFloat(e.target.value) || 0;
                                    const motorAmount = parseFloat(formData.motor_amount) || 0;
                                    const minimumPrice = parseFloat(formData.minimum_price) || 0;
                                    
                                    // Validate discount against minimum price
                                    if (minimumPrice > 0 && motorAmount > 0) {
                                        const discountedPrice = motorAmount - (motorAmount * discount / 100);
                                        if (discountedPrice < minimumPrice) {
                                            const maxAllowedDiscount = Math.floor(((motorAmount - minimumPrice) / motorAmount) * 100);
                                            showToast(`⚠️ Discount too high! Maximum allowed is ${maxAllowedDiscount}% (₹${minimumPrice})`, true);
                                            setFormData({ ...formData, discount_percent: Math.max(0, maxAllowedDiscount) });
                                            return;
                                        }
                                    }
                                    setFormData({ ...formData, discount_percent: discount });
                                }}
                                min="0"
                                max="100"
                                style={{ ...styles.input, borderColor: '#f59e0b', background: '#FFFBEB' }}
                            />
                        </div>
                        {/* ⭐ NEW: Minimum Price - Only visible for motor_sales */}
                        <div style={styles.field}>
                            <label style={{ ...styles.label, color: '#dc2626' }}>
                                <FiHome size={13} /> Minimum Price (₹)
                            </label>
                            <input
                                type="number"
                                name="minimum_price"
                                placeholder="e.g. 10000"
                                value={formData.minimum_price}
                                onChange={handleInputChange}
                                style={{ ...styles.input, borderColor: '#dc2626', background: '#FEF2F2' }}
                            />
                        </div>
                        </>
                    )}
                    <div style={styles.field}>
                        <label style={styles.label}>
                            <FiHome size={13} /> RPM
                        </label>
                        <input
                            type="number"
                            name="rpm"
                            placeholder="e.g. 1440"
                            value={formData.rpm}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={{ ...styles.field, ...styles.fieldEven }}>
                        <label style={styles.label}>
                            <FiHome size={13} /> No. of Slots
                        </label>
                        <input
                            type="number"
                            name="no_of_slots"
                            placeholder="e.g. 36"
                            value={formData.no_of_slots}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Core Length (mm)
                        </label>
                        <input
                            type="number"
                            name="core_length"
                            placeholder="e.g. 344"
                            value={formData.core_length}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={{ ...styles.field, ...styles.fieldEven }}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Load Current (A)
                        </label>
                        <input
                            type="number"
                            name="load_current"
                            placeholder="e.g. 4.8"
                            step="0.1"
                            value={formData.load_current}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>
                            <FiHome size={13} /> SWG
                        </label>
                        <input
                            type="text"
                            name="swg"
                            placeholder="e.g. 22½"
                            value={formData.swg}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={{ ...styles.field, ...styles.fieldEven }}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Connection
                        </label>
                        <select
                            name="connection"
                            value={formData.connection}
                            onChange={handleInputChange}
                            style={styles.input}
                        >
                            <option value="">Select connection type</option>
                            <option value="Star">Star (Y)</option>
                            <option value="Delta">Delta (Δ)</option>
                            <option value="Star-Delta">Star-Delta</option>
                        </select>
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Total Set
                        </label>
                        <input
                            type="number"
                            name="total_set"
                            placeholder="e.g. 6"
                            value={formData.total_set}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={{ ...styles.field, ...styles.fieldEven }}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Total Weight (kg)
                        </label>
                        <input
                            type="text"
                            name="total_weight"
                            placeholder="e.g. 1.950"
                            value={formData.total_weight}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Resistance Value (Ω)
                        </label>
                        <input
                            type="text"
                            name="resistance_value"
                            placeholder="e.g. 2.5"
                            value={formData.resistance_value}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={{ ...styles.field, ...styles.fieldEven }}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Winder Name
                        </label>
                        <input
                            type="text"
                            name="winder_name"
                            placeholder="e.g. Mel. Saamsu"
                            value={formData.winder_name}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Opening Date
                        </label>
                        <input
                            type="date"
                            name="opening_date"
                            value={formData.opening_date}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={{ ...styles.field, ...styles.fieldEven }}>
                        <label style={styles.label}>
                            <FiHome size={13} /> Closing Date
                        </label>
                        <input
                            type="date"
                            name="closing_date"
                            value={formData.closing_date}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                </div>

                {/* SECTION 2: WINDING TABLE */}
                <div style={styles.sectionTitle}>
                    <div style={styles.dot}></div> Winding Details — Pitch, Turns & Set Weight
                </div>
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead style={styles.tableHead}>
                            <tr>
                                <th style={styles.tableHeadTh}>#</th>
                                <th style={styles.tableHeadTh}>Pitch</th>
                                <th style={styles.tableHeadTh}>No. of Turns</th>
                                <th style={styles.tableHeadTh}>Set Wt. (g)</th>
                                <th style={styles.tableHeadTh}></th>
                            </tr>
                        </thead>
                        <tbody style={styles.tableBody}>
                            {formData.winding_details.map((row, index) => (
                                <tr key={index}>
                                    <td style={styles.rowNumber}>{index + 1}</td>
                                    <td style={styles.tableTd}>
                                        <input
                                            type="text"
                                            placeholder="e.g. 1×8"
                                            value={row.pitch}
                                            onChange={(e) => handleWindingChange(index, "pitch", e.target.value)}
                                            style={styles.tableInput}
                                        />
                                    </td>
                                    <td style={styles.tableTd}>
                                        <input
                                            type="number"
                                            placeholder="e.g. 76"
                                            value={row.turns}
                                            onChange={(e) => handleWindingChange(index, "turns", e.target.value)}
                                            style={styles.tableInput}
                                        />
                                    </td>
                                    <td style={styles.tableTd}>
                                        <input
                                            type="text"
                                            placeholder="e.g. 325g"
                                            value={row.set_weight}
                                            onChange={(e) => handleWindingChange(index, "set_weight", e.target.value)}
                                            style={styles.tableInput}
                                        />
                                    </td>
                                    <td style={styles.tableTd}>
                                        <button
                                            onClick={() => removeRow(index)}
                                            style={styles.removeBtn}
                                            title="Remove"
                                            disabled={formData.winding_details.length <= 1}
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button style={styles.addRowBtn} onClick={addRow}>
                        <FiPlus size={14} />
                        Add Row
                    </button>
                </div>

                {/* ⭐ NEW: SECTION 3: MOTOR BRANDS (for Stock Management) */}
                {customerInfo.from_stock_management && (
                    <>
                        <div style={styles.sectionTitle}>
                            <div style={styles.dot}></div> Motor Brands & Counts
                        </div>
                        <div style={styles.tableWrap}>
                            <table style={styles.table}>
                                <thead style={styles.tableHead}>
                                    <tr>
                                        <th style={styles.tableHeadTh}>#</th>
                                        <th style={styles.tableHeadTh}>Brand Name</th>
                                        <th style={styles.tableHeadTh}>Count</th>
                                        <th style={styles.tableHeadTh}></th>
                                    </tr>
                                </thead>
                                <tbody style={styles.tableBody}>
                                    {formData.motor_brands.map((row, index) => (
                                        <tr key={index}>
                                            <td style={styles.rowNumber}>{index + 1}</td>
                                            <td style={styles.tableTd}>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Crompton, Siemens"
                                                    value={row.brand}
                                                    onChange={(e) => handleMotorBrandChange(index, "brand", e.target.value)}
                                                    style={styles.tableInput}
                                                />
                                            </td>
                                            <td style={styles.tableTd}>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 5"
                                                    value={row.count}
                                                    onChange={(e) => handleMotorBrandChange(index, "count", parseInt(e.target.value) || 0)}
                                                    style={styles.tableInput}
                                                />
                                            </td>
                                            <td style={styles.tableTd}>
                                                <button
                                                    onClick={() => removeMotorBrand(index)}
                                                    style={styles.removeBtn}
                                                    title="Remove"
                                                    disabled={formData.motor_brands.length <= 1}
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button style={styles.addRowBtn} onClick={addMotorBrand}>
                                <FiPlus size={14} />
                                Add Brand
                            </button>
                        </div>
                    </>
                )}

                {/* SECTION 4: REMARKS */}
                <div style={styles.sectionTitle}>
                    <div style={styles.dot}></div> Remarks
                </div>
                <div style={styles.remarksWrap}>
                    <textarea
                        name="remarks"
                        placeholder="e.g. Winelining&#10;620·6 + 6·308&#10;Terminal"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        style={styles.textarea}
                    />
                </div>

                {/* ACTION BAR */}
                <div style={styles.actionBar}>
                    {customerInfo.from_stock_management && (
                        <button
                            style={{ ...styles.btnCancel, backgroundColor: '#2196F3', color: 'white' }}
                            onClick={() => navigate("/stock-management")}
                        >
                            <FiHome size={14} />
                            Back to Stock
                        </button>
                    )}
                    <button style={styles.btnCancel} onClick={resetForm}>
                        <FiX size={14} />
                        Clear Form
                    </button>
                    <button style={styles.btnPrint} onClick={() => window.print()}>
                        <FiPrinter size={14} />
                        Print
                    </button>
                    <button style={styles.btnSave} onClick={saveForm} disabled={loading}>
                        <FiSave size={14} />
                        {loading ? "Saving..." : "Save Record"}
                    </button>
                </div>
            </div>

            {/* TOAST */}
            <div style={{
                ...styles.toast,
                ...(toast.show ? styles.toastShow : {}),
                background: toast.isError ? "#EF4444" : "#1E1B4B"
            }}>
                {toast.message}
            </div>
        </div>
    );
};

export default MotorDetails;
