import React from 'react';
import { FiX, FiPrinter } from "react-icons/fi";

const MotorDetailsViewModal = React.forwardRef(({ isOpen, onClose, motorData }, ref) => {
    // 🛡️ CRITICAL SAFETY GUARD: Prevent crash if data is missing
    if (!isOpen || !motorData) return null;

    const { brand = 'N/A', specification = {}, pricing = {} } = motorData;
    const spec = specification || {};
    const price = pricing || {};

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = `
            <html>
                <head>
                    <title>Motor Specification - ${brand}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                        .header { border-bottom: 3px solid #1a237e; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                        .title { margin: 0; color: #1a237e; font-size: 28px; }
                        .brand-tag { background: #e8eaf6; padding: 5px 15px; border-radius: 20px; font-weight: bold; color: #1a237e; }
                        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
                        .item { border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between; }
                        .label { font-weight: 600; color: #666; font-size: 14px; }
                        .value { font-weight: 700; color: #000; }
                        .section-title { background: #f5f5f5; padding: 8px 15px; border-left: 5px solid #1a237e; margin-bottom: 20px; font-size: 18px; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; font-size: 14px; }
                        td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; pt: 20px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 class="title">Full Motor Specification Sheet</h1>
                        <span class="brand-tag">${brand}</span>
                    </div>

                    <div class="section-title">General & Technical Specifications</div>
                    <div class="grid">
                        <div class="item"><span class="label">Motor Make:</span> <span class="value">${spec.motor_make || 'N/A'}</span></div>
                        <div class="item"><span class="label">HP / Horsepower:</span> <span class="value">${spec.hp || spec.horsepower || 'N/A'} HP</span></div>
                        <div class="item"><span class="label">KW / Power:</span> <span class="value">${spec.kw || 'N/A'} KW</span></div>
                        <div class="item"><span class="label">RPM Speed:</span> <span class="value">${spec.rpm || 'N/A'} RPM</span></div>
                        <div class="item"><span class="label">Phase:</span> <span class="value">${spec.phase || 'N/A'}</span></div>
                        <div class="item"><span class="label">Voltage:</span> <span class="value">${spec.voltage || 'N/A'}</span></div>
                        <div class="item"><span class="label">Connection Type:</span> <span class="value">${spec.connection || 'N/A'}</span></div>
                        <div class="item"><span class="label">SWG (Wire Gauge):</span> <span class="value">${spec.swg || 'N/A'}</span></div>
                        <div class="item"><span class="label">No. of Slots:</span> <span class="value">${spec.no_of_slots || 'N/A'}</span></div>
                        <div class="item"><span class="label">Core Length:</span> <span class="value">${spec.core_length || 'N/A'}</span></div>
                    </div>

                    <div class="section-title">Winding Specifications (Poles/Pitch/Turns)</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Pitch</th>
                                <th>Turns</th>
                                <th>Set Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(spec.winding_details || []).map(w => `
                                <tr>
                                    <td>${w.pitch || '-'}</td>
                                    <td>${w.turns || '-'}</td>
                                    <td>${w.set_weight || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="section-title" style="margin-top: 40px;">Additional Remarks</div>
                    <p style="padding: 15px; background: #fafafa; border-radius: 8px; font-style: italic;">${spec.remarks || 'No additional remarks provided.'}</p>

                    <div class="footer">
                        Generated by Ruban Electricals Service Management System
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // Styles matching MotorHistory.jsx perfectly
    const styles = {
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
        }
    };

    // Only renders if there is a valid value
    const DetailItem = ({ label, value }) => {
        if (!value || value === 'N/A' || value === '-' || value === 'N/A HP' || value === 'N/A KW') {
            return null;
        }
        return (
            <div style={styles.detailItem}>
                <div style={styles.detailLabel}>{label}</div>
                <div style={styles.detailValue}>{value}</div>
            </div>
        );
    };

    const hasWindingDetails = Array.isArray(spec.winding_details) && spec.winding_details.length > 0 && spec.winding_details.some(w => w.pitch || w.turns || w.set_weight);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            zIndex: 9999,
            padding: '20px'
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '700px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }} ref={ref} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1.5px solid #E5E7EB'
                }}>
                    <h2 style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#1E1B4B',
                        margin: 0
                    }}>Motor Details: {brand}</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handlePrint}
                            style={{
                                background: '#EEF2FF',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#5B4FE9',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}
                        >
                            <FiPrinter size={16} /> Print
                        </button>
                        <button
                            onClick={onClose}
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
                </div>
                
                {/* Content */}
                <div style={{ padding: '20px' }}>
                    <div style={styles.detailGrid}>
                        <DetailItem label="Company Name" value={spec.company_name} />
                        <DetailItem label="Motor Make" value={spec.motor_make} />
                        <DetailItem label="Motor Brand" value={spec.motor_brand || brand} />
                        <DetailItem label="Serial No." value={spec.serial_no} />
                        
                        <DetailItem 
                            label="KW / HP" 
                            value={
                                (spec.kw && spec.kw !== 'N/A') && (spec.hp && spec.hp !== 'N/A')
                                    ? `${spec.kw} / ${spec.hp}`
                                    : (spec.kw && spec.kw !== 'N/A') ? spec.kw 
                                    : (spec.hp && spec.hp !== 'N/A') ? spec.hp 
                                    : null
                            } 
                        />
                        <DetailItem label="RPM" value={spec.rpm} />
                        <DetailItem label="Phase" value={spec.phase} />
                        <DetailItem label="Voltage" value={spec.voltage} />
                        <DetailItem label="Motor Type" value={spec.motor_type} />
                        <DetailItem label="Warranty" value={spec.warranty} />
                        <DetailItem label="No. of Slots" value={spec.no_of_slots} />
                        <DetailItem label="Core Length (mm)" value={spec.core_length} />
                        <DetailItem label="Load Current (A)" value={spec.load_current} />
                        <DetailItem label="SWG" value={spec.swg} />
                        <DetailItem label="Connection" value={spec.connection} />
                        <DetailItem label="Total Set" value={spec.total_set} />
                        <DetailItem label="Total Weight (kg)" value={spec.total_weight} />
                        <DetailItem label="Resistance Value (Ω)" value={spec.resistance_value} />
                        <DetailItem label="Winder / Manufacturer" value={spec.winder_name} />
                    </div>

                    {/* Pricing Section */}
                    {Object.keys(price).length > 0 && 
                     ((price.supplier && price.supplier !== 'N/A') || 
                      (price.purchase_date && price.purchase_date !== 'N/A') || 
                      (price.purchase_price && price.purchase_price !== 'N/A' && price.purchase_price !== 0) ||
                      (price.minimum_price && price.minimum_price !== 'N/A' && price.minimum_price !== 0) ||
                      (price.selling_price && price.selling_price !== 'N/A' && price.selling_price !== 0)) ? (
                        <>
                            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>Pricing & Supply</h3>
                            <div style={styles.detailGrid}>
                                <DetailItem label="Supplier" value={price.supplier} />
                                <DetailItem label="Purchase Date" value={price.purchase_date} />
                                <DetailItem label="Purchase Price" value={price.purchase_price && price.purchase_price !== 'N/A' ? `₹${Number(price.purchase_price).toLocaleString()}` : null} />
                                <DetailItem label="Min. Price" value={price.minimum_price && price.minimum_price !== 'N/A' ? `₹${Number(price.minimum_price).toLocaleString()}` : null} />
                                <DetailItem label="Selling Price" value={price.selling_price && price.selling_price !== 'N/A' ? `₹${Number(price.selling_price).toLocaleString()}` : null} />
                            </div>
                        </>
                    ) : null}

                    {/* Winding Details Table */}
                    {hasWindingDetails && (
                        <>
                            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', marginTop: '16px' }}>Winding Details</h3>
                            <table style={styles.windingTable}>
                                <thead>
                                    <tr>
                                        <th style={styles.windingTh}>Pitch</th>
                                        <th style={styles.windingTh}>No. of Turns</th>
                                        <th style={styles.windingTh}>Set Wt. (g)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {spec.winding_details.map((row, idx) => (
                                        <tr key={idx}>
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
                    {spec.remarks && spec.remarks !== 'N/A' && (
                        <div style={styles.remarks}>
                            <div style={styles.remarksTitle}>Remarks</div>
                            <div style={styles.remarksText}>{spec.remarks}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default MotorDetailsViewModal;
