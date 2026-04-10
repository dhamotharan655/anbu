import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiPrinter, FiRefreshCw, FiX } from "react-icons/fi";

const MotorHistory = () => {
    const navigate = useNavigate();
    const [motors, setMotors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMotor, setSelectedMotor] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", isError: false });

    const showToast = (message, isError = false) => {
        setToast({ show: true, message, isError });
        setTimeout(() => setToast({ show: false, message: "", isError: false }), 3000);
    };

    const fetchMotors = async () => {
        setLoading(true);
        try {
            const response = await api.get("motor-details/");
            if (response.data.success) {
                let motorData = response.data.data || [];
                
                // ⭐ FIX: Remove duplicate records (keep only one with job_type, or first one)
                const uniqueMotors = [];
                const seenComplaintIds = new Set();
                
                // Sort by complaint_id to ensure consistent ordering
                motorData.sort((a, b) => {
                    const aId = a.complaint_id || '';
                    const bId = b.complaint_id || '';
                    return aId.localeCompare(bId, undefined, { numeric: true });
                });
                
                for (const motor of motorData) {
                    if (motor.complaint_id) {
                        if (!seenComplaintIds.has(motor.complaint_id)) {
                            seenComplaintIds.add(motor.complaint_id);
                            uniqueMotors.push(motor);
                        }
                    } else {
                        // Keep records without complaint_id
                        uniqueMotors.push(motor);
                    }
                }
                
                setMotors(uniqueMotors);
            } else {
                showToast("Failed to fetch motor records", true);
            }
        } catch (error) {
            console.error("Error fetching motors:", error);
            showToast("Error fetching motor records", true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMotors();
    }, []);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            fetchMotors();
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`motor-details/search/?serial_no=${searchTerm}&company_name=${searchTerm}&motor_make=${searchTerm}`);
            if (response.data.success) {
                setMotors(response.data.data);
            }
        } catch (error) {
            console.error("Search error:", error);
            showToast("Search failed", true);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (motorId) => {
        if (!window.confirm("Are you sure you want to delete this motor record?")) {
            return;
        }
        try {
            const response = await api.delete(`motor-details/${motorId}/`);
            if (response.data.success) {
                showToast("Motor record deleted successfully");
                fetchMotors();
            } else {
                showToast(response.data.error || "Failed to delete", true);
            }
        } catch (error) {
            console.error("Delete error:", error);
            showToast("Failed to delete motor record", true);
        }
    };

    const viewDetails = async (motor) => {
        if (!motor.complaint_id) {
            setSelectedMotor(motor);
            setShowModal(true);
            return;
        }

        setIsModalLoading(true);
        setShowModal(true);
        setSelectedMotor(motor); // Initial show with what we have

        try {
            const response = await api.get(`motor-by-complaint/?complaint_id=${encodeURIComponent(motor.complaint_id)}`);
            if (response.data.success) {
                const freshData = response.data.data;
                
                // Flatten the nested specification/pricing if they exist
                // This preserves compatibility with the existing modal UI
                const flattenedMotor = {
                    ...motor,
                    ...freshData, // Top level fields
                    ...(freshData.specification || {}), // Nested spec fields
                    ...(freshData.pricing || {}) // Nested pricing fields
                };
                
                setSelectedMotor(flattenedMotor);
            }
        } catch (error) {
            console.error("Error fetching complete motor details:", error);
            // Fallback to what we already have
        } finally {
            setIsModalLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    // Styles
    const styles = {
        page: {
            minHeight: "100vh",
            background: "#F0F2FF",
            fontFamily: "'DM Sans', sans-serif",
            color: "#1E1B4B",
            padding: "32px"
        },
        header: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px"
        },
        titleSection: {},
        title: {
            fontFamily: "'Syne', sans-serif",
            fontSize: "28px",
            fontWeight: 800,
            color: "#1E1B4B",
            margin: 0
        },
        subtitle: {
            color: "#6B7280",
            fontSize: "14px",
            marginTop: "4px"
        },
        addBtn: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            background: "linear-gradient(135deg, #5B4FE9 0%, #7C3AED 50%, #9333EA 100%)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(91,79,233,.35)"
        },
        searchBar: {
            display: "flex",
            gap: "12px",
            marginBottom: "24px"
        },
        searchInput: {
            flex: 1,
            padding: "12px 16px",
            border: "1.5px solid #E5E7EB",
            borderRadius: "12px",
            fontSize: "14px",
            fontFamily: "'DM Sans', sans-serif",
            outline: "none"
        },
        searchBtn: {
            padding: "12px 20px",
            background: "#5B4FE9",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
        },
        refreshBtn: {
            padding: "12px 16px",
            background: "white",
            color: "#6B7280",
            border: "1.5px solid #E5E7EB",
            borderRadius: "12px",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
        },
        tableWrapper: {
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 2px 24px rgba(0,0,0,.06)",
            overflow: "hidden"
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "800px"
        },
        tableHead: {
            background: "linear-gradient(135deg, #5B4FE9, #7C3AED)"
        },
        tableHeadTh: {
            padding: "16px",
            fontFamily: "'Syne', sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "white",
            textAlign: "left",
            letterSpacing: ".3px"
        },
        tableBody: {},
        tableRow: {
            borderBottom: "1px solid #F0F0F4",
            transition: "background .15s"
        },
        tableRowHover: {
            background: "#F0EEFF"
        },
        tableTd: {
            padding: "14px 16px",
            fontSize: "14px",
            color: "#1E1B4B"
        },
        badge: {
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "99px",
            fontSize: "12px",
            fontWeight: 600
        },
        badgePrimary: {
            background: "rgba(91,79,233,.1)",
            color: "#5B4FE9"
        },
        actions: {
            display: "flex",
            gap: "8px"
        },
        actionBtn: {
            padding: "6px 10px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
        },
        viewBtn: {
            background: "#EEF2FF",
            color: "#5B4FE9"
        },
        deleteBtn: {
            background: "#FEE2E2",
            color: "#EF4444"
        },
        emptyState: {
            padding: "60px 20px",
            textAlign: "center"
        },
        emptyIcon: {
            fontSize: "48px",
            marginBottom: "16px"
        },
        emptyTitle: {
            fontSize: "18px",
            fontWeight: 600,
            color: "#1E1B4B",
            marginBottom: "8px"
        },
        emptyText: {
            color: "#6B7280",
            fontSize: "14px"
        },
        modal: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
        },
        modalContent: {
            background: "white",
            borderRadius: "20px",
            width: "90%",
            maxWidth: "900px",
            maxHeight: "90vh",
            overflow: "auto",
            padding: "32px"
        },
        modalHeader: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "1.5px solid #E5E7EB"
        },
        modalTitle: {
            fontFamily: "'Syne', sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "#1E1B4B"
        },
        closeBtn: {
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#6B7280"
        },
        detailGrid: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "24px"
        },
        detailItem: {
            padding: "12px",
            background: "#F9FAFB",
            borderRadius: "10px"
        },
        detailLabel: {
            fontSize: "11px",
            fontWeight: 600,
            color: "#6B7280",
            textTransform: "uppercase",
            letterSpacing: ".5px",
            marginBottom: "4px"
        },
        detailValue: {
            fontSize: "14px",
            fontWeight: 500,
            color: "#1E1B4B"
        },
        windingTable: {
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "16px",
            marginBottom: "24px"
        },
        windingTh: {
            padding: "10px 12px",
            background: "#5B4FE9",
            color: "white",
            fontSize: "12px",
            fontWeight: 600,
            textAlign: "left"
        },
        windingTd: {
            padding: "10px 12px",
            borderBottom: "1px solid #E5E7EB",
            fontSize: "13px"
        },
        remarks: {
            padding: "16px",
            background: "#F9FAFB",
            borderRadius: "10px",
            marginTop: "16px"
        },
        remarksTitle: {
            fontSize: "12px",
            fontWeight: 600,
            color: "#6B7280",
            textTransform: "uppercase",
            marginBottom: "8px"
        },
        remarksText: {
            fontSize: "14px",
            color: "#1E1B4B",
            whiteSpace: "pre-wrap"
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
        loading: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "60px"
        },
        recordBadge: {
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(91,79,233,.1)",
            color: "#5B4FE9",
            padding: "4px 12px",
            borderRadius: "99px",
            fontSize: "12px",
            fontWeight: 600,
            marginBottom: "16px"
        }
    };

    return (
        <div style={styles.page}>
            {/* HEADER */}
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <h1 style={styles.title}>Motor History</h1>
                    <p style={styles.subtitle}>View and manage saved motor records</p>
                </div>
                <button style={styles.addBtn} onClick={() => navigate("/motor-details")}>
                    <FiPlus size={16} />
                    New Motor
                </button>
            </div>

            {/* RECORD COUNT */}
            {motors.length > 0 && (
                <div style={styles.recordBadge}>
                    {motors.length} Record{motors.length !== 1 ? "s" : ""}
                </div>
            )}

            {/* SEARCH BAR */}
            <div style={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Search by Serial No, Company Name, Motor Make..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    style={styles.searchInput}
                />
                <button style={styles.searchBtn} onClick={handleSearch}>
                    <FiSearch size={16} />
                    Search
                </button>
                <button style={styles.refreshBtn} onClick={fetchMotors}>
                    <FiRefreshCw size={16} />
                </button>
            </div>

            {/* TABLE */}
            <div style={styles.tableWrapper}>
                {loading ? (
                    <div style={styles.loading}>Loading...</div>
                ) : motors.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>📋</div>
                        <div style={styles.emptyTitle}>No Motor Records Found</div>
                        <div style={styles.emptyText}>Add your first motor record to get started</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                        <thead style={styles.tableHead}>
                            <tr>
                                <th style={styles.tableHeadTh}>#</th>
                                <th style={styles.tableHeadTh}>Complaint ID</th>
                                <th style={styles.tableHeadTh}>Customer Name</th>
                                <th style={styles.tableHeadTh}>Job Type</th>
                                <th style={styles.tableHeadTh}>Company</th>
                                <th style={styles.tableHeadTh}>Motor Make</th>
                                <th style={styles.tableHeadTh}>Motor Brand</th>
                                <th style={styles.tableHeadTh}>Serial No.</th>
                                <th style={styles.tableHeadTh}>KW/HP</th>
                                <th style={styles.tableHeadTh}>Motor Amount</th>
                                <th style={styles.tableHeadTh}>Discount %</th>
                                <th style={styles.tableHeadTh}>Date</th>
                                <th style={{...styles.tableHeadTh, minWidth: '100px'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody style={styles.tableBody}>
                            {motors.map((motor, index) => (
                                <tr key={motor.id} style={styles.tableRow}>
                                    <td style={styles.tableTd}>{index + 1}</td>
                                    <td style={styles.tableTd}>
                                        {motor.complaint_id ? (
                                            <span style={{ color: '#F57C00', fontWeight: '600' }}>
                                                {motor.complaint_id}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#999' }}>-</span>
                                        )}
                                    </td>
                                    <td style={styles.tableTd}>
                                        {motor.customer_name || "-"}
                                    </td>
                                    <td style={styles.tableTd}>
                                        {motor.job_type ? (
                                            <span style={{
                                                color: motor.job_type === 'motor_sale' ? '#16A34A' : '#2563EB',
                                                fontWeight: '600'
                                            }}>
                                                {motor.job_type === 'motor_sale' ? 'Motor Sales' : motor.job_type === 'motor_service' ? 'Motor Service' : motor.job_type}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#999' }}>-</span>
                                        )}
                                    </td>
                                    <td style={styles.tableTd}>{motor.company_name || "-"}</td>
                                    <td style={styles.tableTd}>{motor.motor_make || "-"}</td>
                                    <td style={styles.tableTd}>{motor.motor_brand || "-"}</td>
                                    <td style={styles.tableTd}>
                                        <strong>{motor.serial_no || "-"}</strong>
                                    </td>
                                    <td style={styles.tableTd}>
                                        {motor.kw && motor.hp ? `${motor.kw} / ${motor.hp}` : motor.kw || motor.hp || "-"}
                                    </td>
                                    <td style={styles.tableTd}>
                                        {motor.motor_amount ? (
                                            <span style={{ color: '#16A34A', fontWeight: '600' }}>
                                                ₹{motor.motor_amount}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#999' }}>-</span>
                                        )}
                                    </td>
                                    <td style={styles.tableTd}>
                                        {motor.discount_percent ? (
                                            <span style={{ color: '#DC2626', fontWeight: '600' }}>
                                                {motor.discount_percent}%
                                            </span>
                                        ) : (
                                            <span style={{ color: '#999' }}>-</span>
                                        )}
                                    </td>
                                    <td style={styles.tableTd}>{formatDate(motor.created_at)}</td>
                                    <td style={styles.tableTd}>
                                        <div style={styles.actions}>
                                            <button
                                                style={{ ...styles.actionBtn, ...styles.viewBtn }}
                                                onClick={() => viewDetails(motor)}
                                                title="View Details"
                                            >
                                                <FiEye size={14} />
                                            </button>
                                            <button
                                                style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                                                onClick={() => handleDelete(motor.id)}
                                                title="Delete"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {showModal && selectedMotor && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.45)',
                    zIndex: 9999,
                    padding: '20px'
                }} onClick={() => setShowModal(false)}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        maxWidth: '700px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 20px',
                            borderBottom: '1.5px solid #E5E7EB'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h2 style={{
                                    fontFamily: "'Syne', sans-serif",
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    color: '#1E1B4B',
                                    margin: 0
                                }}>Motor Details</h2>
                                {isModalLoading && (
                                    <span style={{
                                        fontSize: '12px',
                                        color: '#5B4FE9',
                                        background: 'rgba(91,79,233,0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        animation: 'pulse 1.5s infinite'
                                    }}>
                                        Fetching complete details...
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#666'
                                }}
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div style={{ padding: '20px' }}>
                <div style={styles.detailGrid}>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Company Name</div>
                                <div style={styles.detailValue}>{selectedMotor.company_name || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Motor Make</div>
                                <div style={styles.detailValue}>{selectedMotor.motor_make || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Motor Brand</div>
                                <div style={styles.detailValue}>{selectedMotor.motor_brand || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Serial No.</div>
                                <div style={styles.detailValue}>{selectedMotor.serial_no || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>KW / HP</div>
                                <div style={styles.detailValue}>
                                    {selectedMotor.kw && selectedMotor.hp
                                        ? `${selectedMotor.kw} / ${selectedMotor.hp}`
                                        : selectedMotor.kw || selectedMotor.hp || "-"}
                                </div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>RPM</div>
                                <div style={styles.detailValue}>{selectedMotor.rpm || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>No. of Slots</div>
                                <div style={styles.detailValue}>{selectedMotor.no_of_slots || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Core Length (mm)</div>
                                <div style={styles.detailValue}>{selectedMotor.core_length || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Load Current (A)</div>
                                <div style={styles.detailValue}>{selectedMotor.load_current || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>SWG</div>
                                <div style={styles.detailValue}>{selectedMotor.swg || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Connection</div>
                                <div style={styles.detailValue}>{selectedMotor.connection || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Total Set</div>
                                <div style={styles.detailValue}>{selectedMotor.total_set || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Total Weight (kg)</div>
                                <div style={styles.detailValue}>{selectedMotor.total_weight || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Resistance Value (Ω)</div>
                                <div style={styles.detailValue}>{selectedMotor.resistance_value || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Winder Name</div>
                                <div style={styles.detailValue}>{selectedMotor.winder_name || "-"}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Opening Date</div>
                                <div style={styles.detailValue}>{formatDate(selectedMotor.opening_date)}</div>
                            </div>
                            <div style={styles.detailItem}>
                                <div style={styles.detailLabel}>Closing Date</div>
                                <div style={styles.detailValue}>{formatDate(selectedMotor.closing_date)}</div>
                            </div>
                        </div>

                        {/* Winding Details Table */}
                        {selectedMotor.winding_details && selectedMotor.winding_details.length > 0 && (
                            <>
                                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Winding Details</h3>
                                <table style={styles.windingTable}>
                                    <thead>
                                        <tr>
                                            <th style={styles.windingTh}>#</th>
                                            <th style={styles.windingTh}>Pitch</th>
                                            <th style={styles.windingTh}>No. of Turns</th>
                                            <th style={styles.windingTh}>Set Wt. (g)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedMotor.winding_details.map((row, idx) => (
                                            <tr key={idx}>
                                                <td style={styles.windingTd}>{idx + 1}</td>
                                                <td style={styles.windingTd}>{row.pitch || "-"}</td>
                                                <td style={styles.windingTd}>{row.turns || "-"}</td>
                                                <td style={styles.windingTd}>{row.set_weight || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}

                        {/* Remarks */}
                        {selectedMotor.remarks && (
                            <div style={styles.remarks}>
                                <div style={styles.remarksTitle}>Remarks</div>
                                <div style={styles.remarksText}>{selectedMotor.remarks}</div>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            )}

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

export default MotorHistory;
