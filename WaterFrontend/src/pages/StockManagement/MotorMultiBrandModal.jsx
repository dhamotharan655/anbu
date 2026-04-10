import React, { useState, useEffect, forwardRef } from 'react';
import MotorSpecificationForm from './MotorSpecificationForm';
import './StockManagement.css'; // Reusing parent's CSS

const MotorMultiBrandModal = forwardRef(({ stockName, onClose, onSubmit, initialBrands = [], mode = 'create' }, ref) => {
    // Standardize brand mapping for consistent internal state
    const mapBrandData = (brandsArr) => {
        return brandsArr.map(b => ({
            id: b.id || Date.now() + Math.random(),
            brand_name: b.brand_name || b.brand || '',
            quantity: b.quantity || b.count || 0,
            specification: b.specification || null,
            pricing: b.pricing || {
                supplier: b.supplier || '',
                purchase_price: b.purchase_price || 0,
                selling_price: b.selling_price || 0,
                minimum_price: b.minimum_price || 0,
                purchase_date: b.purchase_date || new Date().toISOString().split('T')[0]
            }
        }));
    };

    const [brands, setBrands] = useState(initialBrands.length > 0 ? mapBrandData(initialBrands) : [
        { id: Date.now(), brand_name: '', quantity: 0, specification: null }
    ]);
    const [selectedBrandIndex, setSelectedBrandIndex] = useState(null);

    const handleAddBrand = () => {
        setBrands([...brands, { id: Date.now(), brand_name: '', quantity: 0, specification: null }]);
    };

    const handleRemoveBrand = (indexToRemove) => {
        setBrands(brands.filter((_, index) => index !== indexToRemove));
    };

    const handleBrandChange = (index, field, value) => {
        const newBrands = [...brands];
        newBrands[index] = { ...newBrands[index], [field]: value };
        setBrands(newBrands);
    };

    const openSpecification = (index) => {
        if (!brands[index].brand_name) {
            alert("Please enter a brand name first.");
            return;
        }
        if (!brands[index].quantity && mode === 'create') {
            alert("Please enter a valid quantity first.");
            return;
        }
        setSelectedBrandIndex(index);
    };

    const handleSaveSpecification = (specData) => {
        const newBrands = [...brands];
        
        // specData already contains { specification: {...}, pricing: {...} }
        newBrands[selectedBrandIndex] = {
            ...newBrands[selectedBrandIndex],
            ...specData, // This adds specification and pricing objects
            // Maintain backward compatibility fields at the top level
            supplier: specData.pricing.supplier,
            purchase_price: specData.pricing.purchase_price,
            selling_price: specData.pricing.selling_price,
            minimum_price: specData.pricing.minimum_price,
            purchase_date: specData.pricing.purchase_date
        };

        setBrands(newBrands);
        setSelectedBrandIndex(null);
    };

    const handleFinalSubmit = () => {
        // Validate
        for (let i = 0; i < brands.length; i++) {
            if (!brands[i].brand_name) {
                alert(`Please enter brand name for row ${i + 1}`);
                return;
            }
            if (!brands[i].pricing && mode === 'create') {
                alert(`Please add specifications and pricing for brand: ${brands[i].brand_name}`);
                return;
            }
        }

        const totalQuantity = brands.reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0);
        onSubmit(brands, totalQuantity);
    };

    const getHeaderIcon = () => {
        switch (mode) {
            case 'add_stock': return '📦';
            case 'reduce_stock': return '📉';
            case 'edit': return '✏️';
            default: return '🏭';
        }
    };

    const getHeaderTitle = () => {
        switch (mode) {
            case 'add_stock': return 'Add Motor Stock';
            case 'reduce_stock': return 'Reduce Motor Stock';
            case 'edit': return 'Edit Motor Brands';
            default: return 'Motor Brands Setup';
        }
    };

    const getSubmitLabel = () => {
        switch (mode) {
            case 'add_stock': return 'Add to Inventory';
            case 'reduce_stock': return 'Reduce from Inventory';
            case 'edit': return 'Update Variants';
            default: return 'Verify & Complete';
        }
    };

    if (selectedBrandIndex !== null) {
        return (
            <MotorSpecificationForm
                brandName={brands[selectedBrandIndex].brand_name}
                quantity={brands[selectedBrandIndex].quantity}
                initialData={brands[selectedBrandIndex].specification}
                initialPricing={brands[selectedBrandIndex].pricing}
                onSave={handleSaveSpecification}
                onCancel={() => setSelectedBrandIndex(null)}
            />
        );
    }

    return (
        <div className="modal-overlay stock-modal-overlay">
            <div className="modal-content stock-modal-content" ref={ref} style={{ maxWidth: '800px' }}>
                <div className="modal-header stock-modal-header">
                    <div className="modal-title-section">
                        <span className="modal-icon">{getHeaderIcon()}</span>
                        <h2>{getHeaderTitle()}</h2>
                        <p className="modal-subtitle">Configuring: {stockName}</p>
                    </div>
                    <button className="close-btn stock-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body" style={{ padding: '20px' }}>
                    {(mode === 'create' || mode === 'edit') && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                            <button type="button" className="btn-secondary" onClick={handleAddBrand} style={{ backgroundColor: '#1976d2', color: 'white' }}>
                                + Add Another Brand
                            </button>
                        </div>
                    )}

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                                <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Brand Name</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '120px' }}>
                                    {mode === 'add_stock' ? 'Qty to Add' : mode === 'reduce_stock' ? 'Qty to Reduce' : 'Quantity'}
                                </th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '200px' }}>Specifications</th>
                                {(mode === 'create' || mode === 'edit') && <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '60px' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {brands.map((brand, index) => (
                                <tr key={brand.id || index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>
                                        <input
                                            type="text"
                                            value={brand.brand_name}
                                            onChange={(e) => handleBrandChange(index, 'brand_name', e.target.value)}
                                            placeholder="e.g., Siemens"
                                            readOnly={mode === 'reduce_stock' || mode === 'add_stock'}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: (mode === 'reduce_stock' || mode === 'add_stock') ? '#f9f9f9' : 'white' }}
                                        />
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={brand.quantity}
                                            onChange={(e) => handleBrandChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #7c5cbf', borderRadius: '4px', fontWeight: 'bold' }}
                                        />
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        {brand.specification ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: 'green', fontSize: '12px' }}>✅ Configured</span>
                                                <button type="button" onClick={() => openSpecification(index)} style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}>Edit</button>
                                            </div>
                                        ) : (
                                            <button 
                                                type="button" 
                                                onClick={() => openSpecification(index)}
                                                style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                ⚙️ Setup
                                            </button>
                                        )}
                                    </td>
                                    {(mode === 'create' || mode === 'edit') && (
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveBrand(index)}
                                                disabled={brands.length === 1}
                                                style={{ background: 'none', border: 'none', color: '#f44336', cursor: brands.length === 1 ? 'not-allowed' : 'pointer', fontSize: '18px', opacity: brands.length === 1 ? 0.5 : 1 }}
                                                title="Remove Brand"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#1565c0' }}>
                           {mode === 'add_stock' ? 'Total to Add:' : mode === 'reduce_stock' ? 'Total to Reduce:' : 'Total Quantity:'} {brands.reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0)}
                        </span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="button" className="btn-primary" onClick={handleFinalSubmit}>{getSubmitLabel()}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default MotorMultiBrandModal;
