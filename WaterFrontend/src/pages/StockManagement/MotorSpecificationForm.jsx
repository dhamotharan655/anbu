import React, { useState, useEffect, forwardRef } from 'react';
import './StockManagement.css';

const MotorSpecificationForm = forwardRef(({ brandName, quantity, onSave, onCancel, initialData }, ref) => {
    const [formData, setFormData] = useState({
        specification: {
            company_name: '',
            motor_make: '',
            kw: '',
            hp: '',
            rpm: '',
            phase: 'Single',
            voltage: '',
            no_of_slots: '',
            core_length: '',
            load_current: '',
            swg: '',
            connection: 'Delta',
            total_set: '',
            total_weight: '',
            resistance_value: '',
            winder_name: '',
            opening_date: '',
            closing_date: '',
            remarks: '',
            winding_details: [
                { pitch: '', turns: '', set_weight: '' },
                { pitch: '', turns: '', set_weight: '' },
                { pitch: '', turns: '', set_weight: '' }
            ]
        },
        pricing: {
            supplier: '',
            purchase_date: new Date().toISOString().split('T')[0],
            purchase_price: '',
            selling_price: '',
            minimum_price: ''
        }
    });

    // Populate initial data if editing
    useEffect(() => {
        if (initialData) {
            const spec = initialData.specification || initialData;
            const pricing = initialData.pricing || initialData;

            setFormData({
                specification: {
                    company_name: spec.company_name || '',
                    motor_make: spec.motor_make || '',
                    kw: spec.kw || '',
                    hp: spec.hp || spec.horsepower || '',
                    rpm: spec.rpm || '',
                    phase: spec.phase || 'Single',
                    voltage: spec.voltage || '',
                    no_of_slots: spec.no_of_slots || '',
                    core_length: spec.core_length || '',
                    load_current: spec.load_current || '',
                    swg: spec.swg || '',
                    connection: spec.connection || 'Delta',
                    total_set: spec.total_set || '',
                    total_weight: spec.total_weight || '',
                    resistance_value: spec.resistance_value || '',
                    winder_name: spec.winder_name || '',
                    opening_date: (spec.opening_date || '').split('T')[0],
                    closing_date: (spec.closing_date || '').split('T')[0],
                    remarks: spec.remarks || '',
                    winding_details: spec.winding_details && spec.winding_details.length > 0
                        ? spec.winding_details
                        : [
                            { pitch: '', turns: '', set_weight: '' },
                            { pitch: '', turns: '', set_weight: '' },
                            { pitch: '', turns: '', set_weight: '' }
                        ]
                },
                pricing: {
                    supplier: pricing.supplier || '',
                    purchase_date: (pricing.purchase_date || pricing.date_of_purchase || new Date().toISOString().split('T')[0]).split('T')[0],
                    purchase_price: pricing.purchase_price || pricing.purchase_price_per_unit || '',
                    selling_price: pricing.selling_price || '',
                    minimum_price: pricing.minimum_price || ''
                }
            });
        }
    }, [initialData]);

    const handleSpecChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            specification: { ...prev.specification, [name]: value }
        }));
    };

    const handleWindingChange = (index, field, value) => {
        const newWinding = [...formData.specification.winding_details];
        newWinding[index] = { ...newWinding[index], [field]: value };
        setFormData(prev => ({
            ...prev,
            specification: { ...prev.specification, winding_details: newWinding }
        }));
    };

    const addWindingRow = () => {
        setFormData(prev => ({
            ...prev,
            specification: {
                ...prev.specification,
                winding_details: [...prev.specification.winding_details, { pitch: '', turns: '', set_weight: '' }]
            }
        }));
    };

    const removeWindingRow = (index) => {
        if (formData.specification.winding_details.length > 1) {
            const newWinding = formData.specification.winding_details.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                specification: { ...prev.specification, winding_details: newWinding }
            }));
        }
    };

    const handlePricingChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            pricing: { ...prev.pricing, [name]: value }
        }));
    };

    const purchasePrice = parseFloat(formData.pricing.purchase_price || 0);
    const totalPrice = purchasePrice * quantity;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.pricing.supplier) {
            alert("Supplier is required.");
            return;
        }
        if (!formData.pricing.purchase_price || parseFloat(formData.pricing.purchase_price) <= 0) {
            alert("Valid purchase price per unit is required.");
            return;
        }
        if (!formData.pricing.selling_price || parseFloat(formData.pricing.selling_price) <= 0) {
            alert("Valid selling price is required.");
            return;
        }

        onSave({
            specification: {
                ...formData.specification,
                hp: formData.specification.hp ? parseFloat(formData.specification.hp) : '',
                rpm: formData.specification.rpm ? parseInt(formData.specification.rpm) : '',
                no_of_slots: formData.specification.no_of_slots ? parseInt(formData.specification.no_of_slots) : ''
            },
            pricing: {
                ...formData.pricing,
                purchase_price: parseFloat(formData.pricing.purchase_price),
                selling_price: parseFloat(formData.pricing.selling_price),
                minimum_price: parseFloat(formData.pricing.minimum_price || 0),
                total_price: totalPrice
            }
        });
    };

    const fieldStyle = {
        marginBottom: '12px'
    };
    const labelStyle = {
        display: 'block',
        fontSize: '11px',
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '4px'
    };
    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1.5px solid #e2e8f0',
        fontSize: '14px',
        color: '#1e293b',
        background: '#fafafa',
        boxSizing: 'border-box'
    };
    const sectionHeaderStyle = {
        fontSize: '15px',
        color: '#1a237e',
        borderBottom: '2px solid #e8eaf6',
        paddingBottom: '8px',
        marginBottom: '16px',
        fontWeight: '700'
    };

    return (
        <div className="modal-overlay stock-modal-overlay">
            <div className="modal-content stock-modal-content" ref={ref} style={{ zIndex: 1001, maxWidth: '900px', width: '95%' }}>
                <div className="modal-header stock-modal-header">
                    <div className="modal-title-section">
                        <span className="modal-icon">⚙️</span>
                        <h2>Motor Specification: {brandName}</h2>
                        <p className="modal-subtitle">Add motor details for stock (Qty: {quantity})</p>
                    </div>
                    <button className="close-btn stock-close-btn" onClick={onCancel}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form stock-modal-form" style={{ padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>

                    {/* SECTION 1: MOTOR INFORMATION - matches MotorDetails.jsx exactly */}
                    <h3 style={sectionHeaderStyle}>Motor Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Company Name</label>
                            <input type="text" name="company_name" value={formData.specification.company_name} onChange={handleSpecChange} placeholder="e.g. ABB Company" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Motor Make</label>
                            <input type="text" name="motor_make" value={formData.specification.motor_make} onChange={handleSpecChange} placeholder="e.g. Siemens, Crompton" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>KW</label>
                            <input type="text" name="kw" value={formData.specification.kw} onChange={handleSpecChange} placeholder="e.g. 3.7" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>HP</label>
                            <input type="number" name="hp" step="0.1" value={formData.specification.hp} onChange={handleSpecChange} placeholder="e.g. 5.0" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>RPM</label>
                            <input type="number" name="rpm" value={formData.specification.rpm} onChange={handleSpecChange} placeholder="e.g. 1440" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>No. of Slots</label>
                            <input type="number" name="no_of_slots" value={formData.specification.no_of_slots} onChange={handleSpecChange} placeholder="e.g. 36" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Core Length</label>
                            <input type="text" name="core_length" value={formData.specification.core_length} onChange={handleSpecChange} placeholder="e.g. 150mm" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Load Current</label>
                            <input type="text" name="load_current" value={formData.specification.load_current} onChange={handleSpecChange} placeholder="e.g. 10A" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>SWG</label>
                            <input type="text" name="swg" value={formData.specification.swg} onChange={handleSpecChange} placeholder="e.g. 18" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Connection</label>
                            <select name="connection" value={formData.specification.connection} onChange={handleSpecChange} style={inputStyle}>
                                <option value="Star">Star</option>
                                <option value="Delta">Delta</option>
                                <option value="Star-Delta">Star-Delta</option>
                            </select>
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Total Set</label>
                            <input type="text" name="total_set" value={formData.specification.total_set} onChange={handleSpecChange} placeholder="e.g. 4" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Total Weight</label>
                            <input type="text" name="total_weight" value={formData.specification.total_weight} onChange={handleSpecChange} placeholder="e.g. 45 kg" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Resistance Value</label>
                            <input type="text" name="resistance_value" value={formData.specification.resistance_value} onChange={handleSpecChange} placeholder="e.g. 2.5 ohm" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Phase</label>
                            <select name="phase" value={formData.specification.phase} onChange={handleSpecChange} style={inputStyle}>
                                <option value="Single">Single Phase</option>
                                <option value="Three">Three Phase</option>
                            </select>
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Voltage</label>
                            <input type="text" name="voltage" value={formData.specification.voltage} onChange={handleSpecChange} placeholder="e.g. 415V" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Winder Name</label>
                            <input type="text" name="winder_name" value={formData.specification.winder_name} onChange={handleSpecChange} placeholder="e.g. Rajesh Winding Works" style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Opening Date</label>
                            <input type="date" name="opening_date" value={formData.specification.opening_date} onChange={handleSpecChange} style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Closing Date</label>
                            <input type="date" name="closing_date" value={formData.specification.closing_date} onChange={handleSpecChange} style={inputStyle} />
                        </div>
                    </div>

                    {/* SECTION 2: WINDING DETAILS TABLE */}
                    <div style={{ marginTop: '24px' }}>
                        <h3 style={sectionHeaderStyle}>Winding Specifications (Pitch / Turns / Set Weight)</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Pitch</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Turns</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Set Weight</th>
                                    <th style={{ padding: '10px', width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.specification.winding_details.map((row, idx) => (
                                    <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px' }}>
                                            <input type="text" value={row.pitch} onChange={(e) => handleWindingChange(idx, 'pitch', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input type="text" value={row.turns} onChange={(e) => handleWindingChange(idx, 'turns', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input type="text" value={row.set_weight} onChange={(e) => handleWindingChange(idx, 'set_weight', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <button type="button" onClick={() => removeWindingRow(idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={addWindingRow} style={{ marginTop: '10px', padding: '6px 16px', color: '#1a237e', border: '1px dashed #1a237e', borderRadius: '6px', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>+ Add Row</button>
                    </div>

                    {/* SECTION 3: PURCHASE DETAILS */}
                    <div style={{ marginTop: '24px' }}>
                        <h3 style={sectionHeaderStyle}>Purchase Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Supplier *</label>
                                <input type="text" name="supplier" value={formData.pricing.supplier} onChange={handlePricingChange} placeholder="e.g. ABC Motors Pvt Ltd" style={inputStyle} required />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Purchase Date *</label>
                                <input type="date" name="purchase_date" value={formData.pricing.purchase_date} onChange={handlePricingChange} style={inputStyle} required />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Purchase Price Per Unit *</label>
                                <input type="number" name="purchase_price" value={formData.pricing.purchase_price} onChange={handlePricingChange} placeholder="e.g. 5000" style={inputStyle} required />
                            </div>
                            <div style={{ ...fieldStyle, background: '#f0f4ff', padding: '12px', borderRadius: '8px' }}>
                                <label style={{ ...labelStyle, color: '#1a237e' }}>Total Amount (Auto-calculated)</label>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a237e', padding: '8px 0' }}>
                                    ₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                    ₹{purchasePrice.toLocaleString()} × {quantity} units
                                </div>
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Selling Price *</label>
                                <input type="number" name="selling_price" value={formData.pricing.selling_price} onChange={handlePricingChange} placeholder="e.g. 7000" style={inputStyle} required />
                            </div>
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Minimum Price</label>
                                <input type="number" name="minimum_price" value={formData.pricing.minimum_price} onChange={handlePricingChange} placeholder="e.g. 6000" style={inputStyle} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: REMARKS */}
                    <div style={{ marginTop: '24px' }}>
                        <label style={labelStyle}>Technical Remarks / Notes</label>
                        <textarea name="remarks" value={formData.specification.remarks} onChange={handleSpecChange} placeholder="Any additional technical notes..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                    </div>

                    {/* NOTE about Serial No */}
                    <div style={{ marginTop: '16px', padding: '12px 16px', background: '#FEF3C7', borderRadius: '8px', border: '1px solid #F59E0B', fontSize: '13px', color: '#92400E' }}>
                        <strong>Note:</strong> Serial No. is unique per motor unit and will be entered when this motor is sold (during Booking or Additional Product selection).
                    </div>

                    {/* ACTIONS */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Save Specification</button>
                    </div>
                </form>
            </div>
        </div>
    );
});

export default MotorSpecificationForm;
