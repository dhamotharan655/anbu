import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from "../../api";
import { useScrollToRef } from "../../hooks/useScrollToRef";
import './StockManagement.css';
import { FiClock, FiX, FiTrendingUp, FiTrendingDown, FiPackage, FiTrash2, FiActivity, FiDownload } from 'react-icons/fi';
import { useGlobalRefresh } from "../../context/GlobalRefreshContext";
import ProductHistory from "../../components/ProductHistory";
import MotorMultiBrandModal from './MotorMultiBrandModal';

const StockManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshTriggers, triggerRefresh } = useGlobalRefresh();
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [showReduceStockModal, setShowReduceStockModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [stockHistory, setStockHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [productPurchaseHistory, setProductPurchaseHistory] = useState([]);
    const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);
    const [activeHistoryTab, setActiveHistoryTab] = useState('stock'); // 'stock' or 'purchase'
    const [showMotorModal, setShowMotorModal] = useState(false);

    // ⭐ NEW: Search states for history
    const [stockHistorySearch, setStockHistorySearch] = useState('');
    const [purchaseHistorySearch, setPurchaseHistorySearch] = useState('');

    // Scroll Refs for modals
    const addModalRef = useScrollToRef(showAddModal);
    const editModalRef = useScrollToRef(showEditModal);
    const addReduceModalRef = useScrollToRef(showAddStockModal || showReduceStockModal);
    const historyModalRef = useScrollToRef(showHistoryModal);
    const motorModalRef = useScrollToRef(showMotorModal);

    // ⭐ NEW: Motor search filter states
    const [motorNameSearch, setMotorNameSearch] = useState('');
    const [motorBrandSearch, setMotorBrandSearch] = useState('');

    // ⭐ NEW: Motor Operation State
    const [motorOperationMode, setMotorOperationMode] = useState('create'); // 'create' | 'edit' | 'add_stock' | 'reduce_stock'

    // Scroll to top when history modal opens
    useEffect(() => {
        if (showHistoryModal) {
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }
    }, [showHistoryModal]);

    // ⭐ NEW: Handle return from Motor Details page
    useEffect(() => {
        if (location.state?.from_motor_details) {
            // Preserve stock data if available
            setNewStock(prev => ({
                ...prev,
                name: location.state.stock_name || prev.name,
                category: location.state.stock_category || prev.category,
                quantity: location.state.stock_quantity || prev.quantity,
                unit: location.state.stock_unit || prev.unit,
                supplier: location.state.stock_supplier || prev.supplier,
                purchase_price_per_unit: location.state.stock_purchase_price || prev.purchase_price_per_unit,
                total_purchase_amount: location.state.stock_total_purchase || prev.total_purchase_amount,
                selling_price: location.state.stock_selling_price || prev.selling_price,
                buying_price: location.state.stock_buying_price || prev.buying_price,
                minimum_price: location.state.stock_minimum_price || prev.minimum_price,
                date_of_purchase: location.state.stock_date_of_purchase || prev.date_of_purchase,
                // ⭐ NEW: Include motor brands from MotorDetails
                motor_brands: location.state.motor_brands || []
            }));
            // Open the add modal with populated motor details
            setShowAddModal(true);
            // Clear the location state to prevent re-triggering
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Form states
    const [newStock, setNewStock] = useState({
        name: '',
        category: '',
        quantity: 0,
        unit: 'pcs',
        minimum_threshold: 2,
        supplier: '',
        purchase_price_per_unit: 0,
        total_purchase_amount: 0,
        selling_price: 0,
        buying_price: 0,
        minimum_price: 0,
        date_of_purchase: new Date().toISOString().split('T')[0],
        // ⭐ NEW: Motor brands with enhanced structure
        motor_brands: []
    });

    const [selectedStock, setSelectedStock] = useState(null);
    const [stockQuantity, setStockQuantity] = useState(0);
    const [stockAction, setStockAction] = useState('add'); // 'add' or 'reduce'

    // New fields for Add Stock (Purchase Details)
    const [purchaseDetails, setPurchaseDetails] = useState({
        supplier: '',
        purchasePricePerUnit: 0,
        totalPurchaseAmount: 0,
        dateOfPurchase: new Date().toISOString().split('T')[0]
    });

    // Get authentication headers
    const getAuthHeaders = () => {
        const token = sessionStorage.getItem('token');
        const role = sessionStorage.getItem('role');
        const userName = sessionStorage.getItem('full_name');

        console.log('Auth Headers Debug:', {
            token: token ? 'Present' : 'Missing',
            role: role || 'Missing',
            userName: userName || 'Missing'
        });

        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Role': role,
                'X-User-Name': userName
            }
        };
    };

    // Fetch stock items
    const fetchStockItems = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/stocks/', getAuthHeaders());
            // Ensure we always have an array, even if database returns different format
            const data = response.data;
            setStockItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching stock items:', err);
            setError('Failed to fetch stock items');
            setStockItems([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    // Fetch stock history
    const fetchStockHistory = async (stockId = null) => {
        setHistoryLoading(true);
        try {
            const url = stockId ? `/stocks/history/?stock_id=${stockId}` : '/stocks/history/';
            const response = await api.get(url, getAuthHeaders());
            setStockHistory(response.data);
        } catch (err) {
            console.error('Error fetching stock history:', err);
            setError('Failed to fetch stock history');
        } finally {
            setHistoryLoading(false);
        }
    };

    // Fetch product purchase history
    const fetchProductPurchaseHistory = async () => {
        setPurchaseHistoryLoading(true);
        try {
            const response = await api.get('/stocks/product-purchase-history/', getAuthHeaders());
            setProductPurchaseHistory(response.data);
        } catch (err) {
            console.error('Error fetching product purchase history:', err);
            setError('Failed to fetch product purchase history');
        } finally {
            setPurchaseHistoryLoading(false);
        }
    };

    const handleCreateStock = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const isMotor = newStock.name && newStock.name.toLowerCase().includes('motor');

        // Validation for NON-MOTOR products
        if (!isMotor) {
            if (!newStock.supplier || newStock.supplier.trim() === '') {
                setError('⚠️ Please enter supplier name');
                setLoading(false);
                return;
            }
            if (!newStock.date_of_purchase) {
                setError('⚠️ Please select date of purchase');
                setLoading(false);
                return;
            }
            if (!newStock.purchase_price_per_unit || newStock.purchase_price_per_unit <= 0) {
                setError('⚠️ Please enter Purchase Price (Per Unit)');
                setLoading(false);
                return;
            }
            if (!newStock.total_purchase_amount || newStock.total_purchase_amount <= 0) {
                setError('⚠️ Please enter Total Purchase Amount');
                setLoading(false);
                return;
            }
            if (!newStock.selling_price || newStock.selling_price <= 0) {
                setError('⚠️ Please enter Selling Price');
                setLoading(false);
                return;
            }
            if (!newStock.minimum_price || newStock.minimum_price <= 0) {
                setError('⚠️ Please enter Minimum Price');
                setLoading(false);
                return;
            }
            if (newStock.minimum_price >= newStock.selling_price) {
                setError('⚠️ Minimum Price should be less than Selling Price');
                setLoading(false);
                return;
            }
        }

        try {
            // ⭐ NEW: Calculate total quantity from motor brands if it's a motor
            let totalQuantity = newStock.quantity;
            if (isMotor && newStock.motor_brands && newStock.motor_brands.length > 0) {
                totalQuantity = newStock.motor_brands.reduce((sum, brand) => sum + (brand.quantity || brand.count || 0), 0);
            }

            const stockData = {
                ...newStock,
                quantity: totalQuantity,
                is_motor: isMotor,
                motor_brands: isMotor ? newStock.motor_brands : []
            };

            const response = await api.post('/stocks/create/', stockData, getAuthHeaders());
            if (response.data.success) {
                fetchStockItems();
                triggerRefresh('stock');
                setNewStock({
                    name: '',
                    category: '',
                    quantity: 0,
                    unit: 'pcs',
                    minimum_threshold: 2,
                    supplier: '',
                    purchase_price_per_unit: 0,
                    total_purchase_amount: 0,
                    selling_price: 0,
                    buying_price: 0,
                    minimum_price: 0,
                    date_of_purchase: new Date().toISOString().split('T')[0],
                    // ⭐ NEW: Reset motor brands
                    motor_brands: []
                });
                setShowAddModal(false);
            }
        } catch (err) {
            console.error('Error creating stock item:', err);
            setError(err.response?.data?.error || 'Failed to create stock item');
        } finally {
            setLoading(false);
        }
    };

    // Update stock item
    const handleUpdateStock = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.put(`/stocks/${selectedStock.stock_id}/`, selectedStock, getAuthHeaders());
            if (response.data.success) {
                fetchStockItems();
                triggerRefresh('stock');
                setShowEditModal(false);
                setSelectedStock(null);
            }
        } catch (err) {
            console.error('Error updating stock item:', err);
            setError(err.response?.data?.error || 'Failed to update stock item');
        } finally {
            setLoading(false);
        }
    };

    // Handle stock quantity operations
    const handleStockOperation = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate required fields when adding stock
        if (stockAction === 'add') {
            if (!purchaseDetails.supplier || purchaseDetails.supplier.trim() === '') {
                setError('Please enter supplier name');
                setLoading(false);
                return;
            }
            if (!purchaseDetails.purchasePricePerUnit || purchaseDetails.purchasePricePerUnit <= 0) {
                setError('Please enter purchase price per unit');
                setLoading(false);
                return;
            }
            if (!purchaseDetails.dateOfPurchase) {
                setError('Please select date of purchase');
                setLoading(false);
                return;
            }
        }

        try {
            const endpoint = stockAction === 'add'
                ? `/stocks/${selectedStock.stock_id}/add/`
                : `/stocks/${selectedStock.stock_id}/reduce/`;

            // Include purchase details only when adding stock
            const requestData = stockAction === 'add'
                ? {
                    quantity: stockQuantity,
                    supplier: purchaseDetails.supplier,
                    purchase_price_per_unit: purchaseDetails.purchasePricePerUnit,
                    total_purchase_amount: purchaseDetails.totalPurchaseAmount,
                    date_of_purchase: purchaseDetails.dateOfPurchase
                }
                : { quantity: stockQuantity };

            const response = await api.put(endpoint, requestData, getAuthHeaders());

            if (response.data.success) {
                fetchStockItems();
                triggerRefresh('stock');
                setShowAddStockModal(false);
                setShowReduceStockModal(false);
                setSelectedStock(null);
                setStockQuantity(0);
                // Reset purchase details
                setPurchaseDetails({
                    supplier: '',
                    purchasePricePerUnit: 0,
                    totalPurchaseAmount: 0,
                    dateOfPurchase: new Date().toISOString().split('T')[0]
                });
            }
        } catch (err) {
            console.error(`Error ${stockAction}ing stock:`, err);
            setError(err.response?.data?.error || `Failed to ${stockAction} stock`);
        } finally {
            setLoading(false);
        }
    };

    // Delete stock item (proper deletion)
    const handleDeleteStock = async (stockId) => {
        if (!window.confirm('Are you sure you want to delete this stock item?')) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.delete(`/stocks/${stockId}/delete/`, getAuthHeaders());

            if (response.data.success) {
                fetchStockItems();
                triggerRefresh('stock');
            }
        } catch (err) {
            console.error('Error deleting stock item:', err);
            setError(err.response?.data?.error || 'Failed to delete stock item');
        } finally {
            setLoading(false);
        }
    };

    // Get status color class
    const getStatusClass = (status) => {
        switch (status) {
            case 'Out of Stock':
                return 'status-out-of-stock';
            case 'Low':
                return 'status-low';
            default:
                return 'status-available';
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Out of Stock':
                return '❌';
            case 'Low':
                return '⚠️';
            default:
                return '✅';
        }
    };

    // Get stock level class for progress bar
    const getStockLevelClass = (item) => {
        if (item.status === 'Out of Stock') return 'low';
        if (item.status === 'Low') return 'medium';
        return 'high';
    };

    // Get operation type icon
    const getOperationIcon = (type) => {
        switch (type) {
            case 'add':
            case 'purchase':
                return <FiTrendingUp className="operation-icon add" />;
            case 'reduce':
                return <FiTrendingDown className="operation-icon reduce" />;
            case 'initial':
                return <FiPackage className="operation-icon initial" />;
            case 'delete':
                return <FiTrash2 className="operation-icon delete" />;
            default:
                return <FiPackage />;
        }
    };

    // Get operation type label
    const getOperationLabel = (type) => {
        switch (type) {
            case 'add':
                return 'Stock Added';
            case 'purchase':
                return 'Purchase';
            case 'reduce':
                return 'Stock Reduced';
            case 'initial':
                return 'Initial Stock';
            case 'delete':
                return 'Deleted';
            default:
                return type;
        }
    };

    // Export stock data to Excel/CSV
    const exportStockToExcel = () => {
        if (stockItems.length === 0) {
            alert('No stock data to export');
            return;
        }

        // Create CSV content
        const headers = [
            'Name',
            'Category',
            'Total Quantity',
            'Unit',
            'Minimum Threshold',
            'Status',
            'General Purchase Price',
            'General Selling Price',
            'Motor Brand',
            'Brand Quantity',
            'Supplier',
            'Date of Purchase'
        ];

        let rows = [];

        stockItems.forEach(item => {
            const isMotor = item.name && item.name.toLowerCase().includes('motor');
            const motorBrands = item.motor_brands || [];

            if (isMotor && motorBrands.length > 0) {
                // If motor has brands, create a separate row for each brand
                motorBrands.forEach(brand => {
                    // ⭐ NEW: "Mix-match" brand specific details into general columns to avoid empty fields
                    // Fixed field names to match MotorDetails structure (purchase_price instead of purchase_price_per_unit)
                    const purchasePrice = brand.pricing?.purchase_price || brand.purchase_price || item.buying_price || item.purchase_price_per_unit || 0;
                    const sellingPrice = brand.pricing?.selling_price || brand.selling_price || item.selling_price || 0;
                    const brandSupplier = brand.pricing?.supplier || brand.supplier || item.supplier || '';
                    const brandDate = brand.pricing?.purchase_date || brand.purchase_date || item.date_of_purchase || '';

                    rows.push([
                        item.name || '',
                        item.category || '',
                        item.quantity || 0,
                        item.unit || 'pcs',
                        item.minimum_threshold || 0,
                        item.status || '',
                        purchasePrice,
                        sellingPrice,
                        brand.brand_name || brand.brand || 'Unknown',
                        brand.quantity || brand.count || 0,
                        brandSupplier,
                        brandDate
                    ]);
                });
            } else {
                // Not a motor or no brands - conventional single row
                rows.push([
                    item.name || '',
                    item.category || '',
                    item.quantity || 0,
                    item.unit || 'pcs',
                    item.minimum_threshold || 0,
                    item.status || '',
                    item.buying_price || item.purchase_price_per_unit || 0,
                    item.selling_price || 0,
                    '', // Motor Brand (Empty)
                    '', // Brand Quantity (Empty)
                    item.supplier || '',
                    item.date_of_purchase || ''
                ]);
            }
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // Escape commas and wrap in quotes
                const cellStr = String(cell).replace(/"/g, '""');
                return `"${cellStr}"`;
            }).join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `stock_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchStockItems();
    }, [refreshTriggers.stock]);

    // ⭐ NEW: Derived filtered list — no API call, purely client-side
    const filteredStockItems = stockItems.filter((item) => {
        const nameMatch = motorNameSearch
            ? (item.name || '').toLowerCase().includes(motorNameSearch.toLowerCase())
            : true;

        const brandMatch = motorBrandSearch
            ? (item.motor_brands || []).some((mb) =>
                (mb.brand_name || mb.brand || '').toLowerCase().includes(motorBrandSearch.toLowerCase())
            )
            : true;

        return nameMatch && brandMatch;
    });

    return (
        <>
            <div className="stock-management-container">
                <div className="stock-management-header">
                    <h1>Stock Management</h1>
                    <div className="header-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setShowHistoryModal(true);
                                setActiveHistoryTab('stock');
                                fetchStockHistory();
                                fetchProductPurchaseHistory();
                            }}
                        >
                            <FiActivity /> View History
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={exportStockToExcel}
                            disabled={stockItems.length === 0}
                            title="Export Stock to Excel/CSV"
                        >
                            <FiDownload /> Export Stock
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => setShowAddModal(true)}
                        >
                            ➕ Add New Stock Item
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* ⭐ NEW: Motor Search Filter Bar */}
                <div className="stock-filter-bar">
                    <div className="filter-bar-title">
                        <span>🔍</span>
                        <span>Search &amp; Filter</span>
                        {(motorNameSearch || motorBrandSearch) && (
                            <span className="filter-results-count">
                                {filteredStockItems.length} of {stockItems.length} items
                            </span>
                        )}
                    </div>
                    <div className="filter-bar-inputs">
                        <div className="filter-input-group">
                            <label className="filter-input-label">Motor Name</label>
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="e.g. Motor 1HP…"
                                value={motorNameSearch}
                                onChange={(e) => setMotorNameSearch(e.target.value)}
                            />
                        </div>
                        <div className="filter-input-group">
                            <label className="filter-input-label">Motor Brand</label>
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="e.g. Kirloskar, CRI…"
                                value={motorBrandSearch}
                                onChange={(e) => setMotorBrandSearch(e.target.value)}
                            />
                        </div>
                        {(motorNameSearch || motorBrandSearch) && (
                            <button
                                className="filter-clear-btn"
                                onClick={() => { setMotorNameSearch(''); setMotorBrandSearch(''); }}
                                title="Clear filters"
                            >
                                ✕ Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="stock-items-grid">
                    {loading ? (
                        <div className="loading-state">
                            Loading stock items...
                        </div>
                    ) : stockItems.length === 0 ? (
                        <div className="empty-state">
                            No stock items found. Add your first item to get started.
                        </div>
                    ) : filteredStockItems.length === 0 ? (
                        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                            No stock items match your search. Try adjusting the filters.
                        </div>
                    ) : (
                        filteredStockItems.map((item) => (
                            <div key={item.id} className="stock-item-card">
                                <div className="stock-item-header">
                                    <div className="stock-item-title">
                                        <h3>{item.name}</h3>
                                        <span className={`status-badge ${getStatusClass(item.status)}`}>
                                            {getStatusIcon(item.status)} {item.status}
                                        </span>
                                    </div>
                                    <div className="stock-item-actions">
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => {
                                                const isMotor = item.name && item.name.toLowerCase().includes('motor');
                                                setSelectedStock(item);
                                                if (isMotor) {
                                                    setMotorOperationMode('edit');
                                                    setShowMotorModal(true);
                                                } else {
                                                    setShowEditModal(true);
                                                }
                                            }}
                                            title="Edit Stock Item"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="action-btn add-btn"
                                            onClick={() => {
                                                const isMotor = item.name && item.name.toLowerCase().includes('motor');
                                                setSelectedStock(item);
                                                if (isMotor) {
                                                    setMotorOperationMode('add_stock');
                                                    setShowMotorModal(true);
                                                } else {
                                                    setStockAction('add');
                                                    setStockQuantity(0);
                                                    setPurchaseDetails({
                                                        supplier: '',
                                                        purchasePricePerUnit: 0,
                                                        totalPurchaseAmount: 0,
                                                        dateOfPurchase: new Date().toISOString().split('T')[0]
                                                    });
                                                    setShowAddStockModal(true);
                                                }
                                            }}
                                            title="Add Stock"
                                        >
                                            ➕
                                        </button>
                                        <button
                                            className="action-btn reduce-btn"
                                            onClick={() => {
                                                const isMotor = item.name && item.name.toLowerCase().includes('motor');
                                                setSelectedStock(item);
                                                if (isMotor) {
                                                    setMotorOperationMode('reduce_stock');
                                                    setShowMotorModal(true);
                                                } else {
                                                    setStockAction('reduce');
                                                    setStockQuantity(0);
                                                    setShowReduceStockModal(true);
                                                }
                                            }}
                                            title="Reduce Stock"
                                        >
                                            ➖
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => handleDeleteStock(item.stock_id)}
                                            title="Delete Stock Item"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div className="stock-item-details">
                                    <div className="detail-row">
                                        <span className="detail-label">ID:</span>
                                        <span className="stock-id-badge">#{item.stock_id}</span>
                                    </div>
                                    {item.category && (
                                        <div className="detail-row">
                                            <span className="detail-label">Category:</span>
                                            <span className="category-tag">📦 {item.category}</span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="detail-label">Current Quantity:</span>
                                        <span className="detail-value quantity-value">
                                            {item.quantity} {item.unit}
                                        </span>
                                    </div>
                                    {item.name && item.name.toLowerCase().includes('motor') && item.motor_brands && item.motor_brands.length > 0 && (
                                        <div className="detail-row" style={{ marginTop: '8px', flexWrap: 'wrap' }}>
                                            <span className="detail-label" style={{ width: '100%', marginBottom: '4px' }}>Brands:</span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {item.motor_brands.map((mb, idx) => (
                                                    <span key={idx} className="brand-tag badge" style={{
                                                        backgroundColor: '#7c5cbf',
                                                        color: 'white',
                                                        padding: '2px 8px',
                                                        borderRadius: '100px',
                                                        fontSize: '11px',
                                                        fontWeight: '600'
                                                    }}>
                                                        {mb.brand || mb.brand_name || 'Unknown'} ({mb.count || mb.quantity || 0})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="detail-label">Minimum Threshold:</span>
                                        <span className="detail-value">{item.minimum_threshold} {item.unit}</span>
                                    </div>
                                    {item.selling_price > 0 && (
                                        <div className="detail-row">
                                            <span className="detail-label">Selling Price:</span>
                                            <span className="detail-value">₹{item.selling_price.toFixed(2)} / {item.unit}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stock Level Progress Bar */}
                                <div className="stock-level-container">
                                    <div className="stock-level-header">
                                        <span className="stock-level-label">Stock Level</span>
                                        <span className="stock-level-percentage">
                                            {Math.min(100, Math.round((item.quantity / (item.minimum_threshold * 3 || 1)) * 100))}%
                                        </span>
                                    </div>
                                    <div className="stock-level-bar">
                                        <div
                                            className={`stock-level-fill ${getStockLevelClass(item)}`}
                                            style={{ width: `${Math.min(100, Math.round((item.quantity / (item.minimum_threshold * 3 || 1)) * 100))}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Motor Brands Section - Show only for motor items */}
                                {item.is_motor && item.motor_brands && item.motor_brands.length > 0 && (
                                    <div className="motor-brands-display" style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1565c0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            🏭 Motor Brands
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {item.motor_brands.map((brand, index) => (
                                                    <div key={index} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '8px 12px',
                                                        backgroundColor: 'white',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e0e0e0',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                                    }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <span style={{ fontWeight: '600', color: '#1e1b2e', fontSize: '13px' }}>
                                                                {brand.brand_name || brand.brand || 'Unknown'}
                                                            </span>
                                                            {brand.specification?.motor_make && (
                                                                <span style={{ fontSize: '11px', color: '#666' }}>{brand.specification.motor_make}</span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '11px', color: '#8b85a1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Qty</div>
                                                                <div style={{ fontWeight: '700', color: '#7c5cbf', fontSize: '14px' }}>{brand.quantity || brand.count || 0}</div>
                                                            </div>
                                                            <div style={{ textAlign: 'right', minWidth: '70px' }}>
                                                                <div style={{ fontSize: '11px', color: '#8b85a1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Price</div>
                                                                <div style={{ fontWeight: '700', color: '#16a34a', fontSize: '14px' }}>
                                                                    ₹{brand.pricing?.selling_price || brand.selling_price || 0}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Stock Modal */}
            {showAddModal && (
                <div className="modal-overlay stock-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content stock-modal-content" ref={addModalRef} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header stock-modal-header">
                            <div className="modal-title-section">
                                <span className="modal-icon">📦</span>
                                <h2>Add New Stock Item</h2>
                                <p className="modal-subtitle">Create a new stock item</p>
                            </div>
                            <button className="close-btn stock-close-btn" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        {(() => {
                            const isMotor = newStock.name && newStock.name.toLowerCase().includes('motor');
                            return (
                                <form onSubmit={handleCreateStock} className="modal-form stock-modal-form">
                                    <div className="form-group">
                                        <label>Stock Name *</label>
                                        <input
                                            type="text"
                                            value={newStock.name}
                                            onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                                            required
                                            placeholder="Enter stock item name"
                                        />
                                    </div>



                                    {/* Motor Brands Section - Show only when stock name is "Motor" */}
                                    {isMotor && (
                                        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f0f4ff', borderRadius: '14px', border: '1px solid #d0d7de' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <h4 style={{ margin: 0, color: '#1e1b2e', fontSize: '15px', fontWeight: '700' }}>
                                                    🏭 Motor Brands & Inventory
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMotorModal(true)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#7c5cbf',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '100px',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 4px 12px rgba(124, 92, 191, 0.2)'
                                                    }}
                                                >
                                                    {newStock.motor_brands?.length > 0 ? 'Edit Brands' : 'Configure Brands'}
                                                </button>
                                            </div>

                                            {newStock.motor_brands?.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', padding: '0 10px', fontSize: '11px', fontWeight: '700', color: '#8b85a1', textTransform: 'uppercase' }}>
                                                        <span>Brand</span>
                                                        <span style={{ textAlign: 'center' }}>Qty</span>
                                                        <span style={{ textAlign: 'right' }}>P. Price</span>
                                                    </div>
                                                    {newStock.motor_brands.map((brand, idx) => (
                                                        <div key={idx} style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 60px 80px',
                                                            padding: '10px 12px',
                                                            backgroundColor: 'rgba(255,255,255,0.7)',
                                                            borderRadius: '10px',
                                                            fontSize: '13px',
                                                            border: '1px solid rgba(124, 92, 191, 0.1)'
                                                        }}>
                                                            <span style={{ fontWeight: '600', color: '#1e1b2e' }}>{brand.brand_name || brand.brand}</span>
                                                            <span style={{ textAlign: 'center', fontWeight: '700', color: '#7c5cbf' }}>{brand.quantity || brand.count}</span>
                                                            <span style={{ textAlign: 'right', fontWeight: '600', color: '#16a34a' }}>₹{brand.pricing?.purchase_price_per_unit || brand.purchase_price_per_unit || 0}</span>
                                                        </div>
                                                    ))}
                                                    <div style={{
                                                        marginTop: '4px',
                                                        padding: '12px',
                                                        backgroundColor: 'rgba(124, 92, 191, 0.05)',
                                                        borderRadius: '10px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        border: '1px dashed rgba(124, 92, 191, 0.2)'
                                                    }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e1b2e' }}>Total Quantity:</span>
                                                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#7c5cbf' }}>{newStock.quantity} {newStock.unit}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '10px', border: '2px dashed #d0d7de' }}>
                                                    <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                                                        No brands configured yet. Click "Configure Brands" to manage motor variations.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Category</label>
                                        <input
                                            type="text"
                                            value={newStock.category}
                                            onChange={(e) => setNewStock({ ...newStock, category: e.target.value })}
                                            placeholder="Enter category (optional)"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Unit</label>
                                        <select
                                            value={newStock.unit}
                                            onChange={(e) => setNewStock({ ...newStock, unit: e.target.value })}
                                        >
                                            <option value="pcs">Pieces (pcs)</option>
                                            <option value="kg">Kilograms (kg)</option>
                                            <option value="liters">Liters (L)</option>
                                            <option value="meters">Meters (m)</option>
                                            <option value="boxes">Boxes</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Initial Quantity</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={newStock.quantity}
                                            onChange={(e) => {
                                                const qty = parseInt(e.target.value) || 0;
                                                setNewStock(prev => ({
                                                    ...prev,
                                                    quantity: qty,
                                                    total_purchase_amount: qty * prev.purchase_price_per_unit
                                                }));
                                            }}
                                            readOnly={isMotor}
                                            placeholder={isMotor ? "Calculated from brands" : "Enter initial quantity"}
                                            style={isMotor ? { backgroundColor: '#f9fafb', cursor: 'not-allowed' } : {}}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Minimum Threshold (Auto-set to 2)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={newStock.minimum_threshold}
                                            disabled
                                            placeholder="Auto-set to 2"
                                        />
                                    </div>

                                    {/* Purchase Details Section */}
                                    {!isMotor ? (
                                        <>
                                            <div className="form-section-title purchase-section-title">
                                                <span className="section-icon">🛒</span>
                                                Purchase Details
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Supplier *</label>
                                                    <input
                                                        type="text"
                                                        value={newStock.supplier}
                                                        onChange={(e) => setNewStock({ ...newStock, supplier: e.target.value })}
                                                        placeholder="Enter supplier name"
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Date of Purchase *</label>
                                                    <input
                                                        type="date"
                                                        value={newStock.date_of_purchase}
                                                        onChange={(e) => setNewStock({ ...newStock, date_of_purchase: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Purchase Price (Per Unit) *</label>
                                                    <div className="input-with-prefix">
                                                        <span className="input-prefix">₹</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={newStock.purchase_price_per_unit || ''}
                                                            onChange={(e) => {
                                                                const price = parseFloat(e.target.value) || 0;
                                                                setNewStock(prev => ({
                                                                    ...prev,
                                                                    purchase_price_per_unit: price,
                                                                    total_purchase_amount: prev.quantity * price
                                                                }));
                                                            }}
                                                            placeholder="0.00"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>Total Purchase Amount (₹) *</label>
                                                    <div className="input-with-prefix total-amount">
                                                        <span className="input-prefix">₹</span>
                                                        <input
                                                            type="number"
                                                            value={newStock.total_purchase_amount || ''}
                                                            onChange={(e) => {
                                                                const amount = parseFloat(e.target.value) || 0;
                                                                setNewStock(prev => ({
                                                                    ...prev,
                                                                    total_purchase_amount: amount
                                                                }));
                                                            }}
                                                            placeholder="0.00"
                                                            className="total-input"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>Selling Price (₹) *</label>
                                                    <div className="input-with-prefix">
                                                        <span className="input-prefix">₹</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={newStock.selling_price || ''}
                                                            onChange={(e) => {
                                                                const price = parseFloat(e.target.value) || 0;
                                                                setNewStock(prev => ({
                                                                    ...prev,
                                                                    selling_price: price
                                                                }));
                                                            }}
                                                            placeholder="Enter selling price per unit"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>Cost Price (Buying Price - Optional)</label>
                                                    <div className="input-with-prefix">
                                                        <span className="input-prefix">₹</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={newStock.buying_price || ''}
                                                            onChange={(e) => {
                                                                const price = parseFloat(e.target.value) || 0;
                                                                setNewStock(prev => ({
                                                                    ...prev,
                                                                    buying_price: price
                                                                }));
                                                            }}
                                                            placeholder="Enter cost price per unit"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>Minimum Price (₹) *</label>
                                                    <div className="input-with-prefix">
                                                        <span className="input-prefix">₹</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={newStock.minimum_price || ''}
                                                            onChange={(e) => {
                                                                const price = parseFloat(e.target.value) || 0;
                                                                setNewStock(prev => ({
                                                                    ...prev,
                                                                    minimum_price: price
                                                                }));
                                                            }}
                                                            placeholder="Enter minimum price for discounting"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fff8f1', borderRadius: '12px', border: '1px solid #ffe7cc' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#c77b00', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '18px' }}>ℹ️</span> Parent Purchase Summary
                                            </div>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                                                Purchase details are managed per motor brand via <strong>'Configure Brands'</strong>. The parent stock item will serve as a technical summary.
                                            </p>
                                        </div>
                                    )}

                                    <div className="modal-actions stock-modal-actions">
                                        <button type="button" className="btn-secondary stock-btn-secondary" onClick={() => setShowAddModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-primary stock-btn-primary" disabled={loading}>
                                            {loading ? 'Creating...' : 'Create Stock Item'}
                                        </button>
                                    </div>
                                </form>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Edit Stock Modal */}
            {showEditModal && selectedStock && (
                <div className="modal-overlay stock-modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content stock-modal-content" ref={editModalRef} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Stock Item</h2>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleUpdateStock} className="modal-form">
                            <div className="form-group">
                                <label>Stock Name</label>
                                <input
                                    type="text"
                                    value={selectedStock.name}
                                    onChange={(e) => setSelectedStock({ ...selectedStock, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <input
                                    type="text"
                                    value={selectedStock.category || ''}
                                    onChange={(e) => setSelectedStock({ ...selectedStock, category: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Unit</label>
                                <select
                                    value={selectedStock.unit}
                                    onChange={(e) => setSelectedStock({ ...selectedStock, unit: e.target.value })}
                                >
                                    <option value="pcs">Pieces (pcs)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="liters">Liters (L)</option>
                                    <option value="meters">Meters (m)</option>
                                    <option value="boxes">Boxes</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Minimum Threshold (Auto-set to 2)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={selectedStock.minimum_threshold}
                                    disabled
                                />
                            </div>
                            <div className="form-group">
                                <label>Selling Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={selectedStock.selling_price || ''}
                                    onChange={(e) => setSelectedStock({ ...selectedStock, selling_price: e.target.value })}
                                    placeholder="Enter selling price per unit"
                                />
                            </div>
                            <div className="form-group">
                                <label>Cost Price (Buying Price - ₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={selectedStock.buying_price || ''}
                                    onChange={(e) => setSelectedStock({ ...selectedStock, buying_price: e.target.value })}
                                    placeholder="Enter cost price per unit"
                                />
                            </div>
                            <div className="form-group">
                                <label>Minimum Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={selectedStock.minimum_price || ''}
                                    onChange={(e) => setSelectedStock({ ...selectedStock, minimum_price: e.target.value })}
                                    placeholder="Enter minimum price for discounting"
                                />
                            </div>
                            <div className="form-group">
                                <label>Supplier</label>
                                <input
                                    type="text"
                                    value={selectedStock.supplier || ''}
                                    onChange={(e) => setSelectedStock({ ...selectedStock, supplier: e.target.value })}
                                    placeholder="Enter supplier name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Purchase Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={selectedStock.purchase_price_per_unit || ''}
                                    onChange={(e) => setSelectedStock({ ...selectedStock, purchase_price_per_unit: e.target.value })}
                                    placeholder="Enter purchase price per unit"
                                />
                            </div>
                            <div className="form-group">
                                <label>Total Purchase Amount (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={selectedStock.total_purchase_amount || ''}
                                    onChange={(e) => setSelectedStock({ ...selectedStock, total_purchase_amount: e.target.value })}
                                    placeholder="Enter total purchase amount"
                                />
                            </div>
                            <div className="form-group">
                                <label>Date of Purchase</label>
                                <input
                                    type="date"
                                    value={selectedStock.date_of_purchase || ''}
                                    onChange={(e) => setSelectedStock({ ...selectedStock, date_of_purchase: e.target.value })}
                                />
                            </div>

                            {/* Legacy motor fields removed - now handled by specialized modal */}

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Updating...' : 'Update Stock Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Reduce Stock Modal */}
            {(showAddStockModal || showReduceStockModal) && selectedStock && (
                <div className="modal-overlay stock-modal-overlay" onClick={() => {
                    setShowAddStockModal(false);
                    setShowReduceStockModal(false);
                }}>
                    <div className="modal-content stock-modal-content" ref={addReduceModalRef} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header stock-modal-header">
                            <div className="modal-title-section">
                                <span className="modal-icon">{stockAction === 'add' ? '📦' : '📉'}</span>
                                <h2>
                                    {stockAction === 'add' ? 'Add Stock' : 'Reduce Stock'}
                                </h2>
                                <p className="modal-subtitle">{selectedStock.name}</p>
                            </div>
                            <button className="close-btn stock-close-btn" onClick={() => {
                                setShowAddStockModal(false);
                                setShowReduceStockModal(false);
                            }}>×</button>
                        </div>
                        <form onSubmit={handleStockOperation} className="modal-form stock-modal-form">
                            {/* Current Stock Info */}
                            <div className="current-stock-info">
                                <div className="current-stock-item">
                                    <span className="current-stock-label">Current Stock</span>
                                    <span className="current-stock-value">{selectedStock.quantity} {selectedStock.unit}</span>
                                </div>
                                {stockAction === 'add' && (
                                    <div className="current-stock-item">
                                        <span className="current-stock-label">Category</span>
                                        <span className="current-stock-value">{selectedStock.category || 'N/A'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Quantity Section */}
                            <div className="form-section-title">
                                <span className="section-icon">📝</span>
                                Quantity Details
                            </div>
                            <div className="form-group">
                                <label>
                                    {stockAction === 'add' ? 'Quantity to Add *' : 'Quantity to Reduce *'}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={stockQuantity}
                                    onChange={(e) => {
                                        const qty = parseInt(e.target.value) || 0;
                                        setStockQuantity(qty);
                                        // Auto-calculate total purchase amount
                                        if (stockAction === 'add') {
                                            setPurchaseDetails(prev => ({
                                                ...prev,
                                                totalPurchaseAmount: qty * prev.purchasePricePerUnit
                                            }));
                                        }
                                    }}
                                    required
                                    placeholder={stockAction === 'add' ? 'Enter quantity to add' : 'Enter quantity to reduce'}
                                    className="form-input-highlight"
                                />
                            </div>

                            {/* Purchase Details Section - Only show when adding stock */}
                            {stockAction === 'add' && (
                                <>
                                    <div className="form-section-title purchase-section-title">
                                        <span className="section-icon">🛒</span>
                                        Purchase Details
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Supplier *</label>
                                            <input
                                                type="text"
                                                value={purchaseDetails.supplier}
                                                onChange={(e) => setPurchaseDetails({ ...purchaseDetails, supplier: e.target.value })}
                                                placeholder="Enter supplier name"
                                                className="form-input-highlight"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Date of Purchase *</label>
                                            <input
                                                type="date"
                                                value={purchaseDetails.dateOfPurchase}
                                                onChange={(e) => setPurchaseDetails({ ...purchaseDetails, dateOfPurchase: e.target.value })}
                                                className="form-input-highlight"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Purchase Price (Per Unit) *</label>
                                            <div className="input-with-prefix">
                                                <span className="input-prefix">₹</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={purchaseDetails.purchasePricePerUnit || ''}
                                                    onChange={(e) => {
                                                        const price = parseFloat(e.target.value) || 0;
                                                        setPurchaseDetails(prev => ({
                                                            ...prev,
                                                            purchasePricePerUnit: price,
                                                            totalPurchaseAmount: stockQuantity * price
                                                        }));
                                                    }}
                                                    placeholder="0.00"
                                                    className="form-input-highlight"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Total Purchase Amount</label>
                                            <div className="input-with-prefix total-amount">
                                                <span className="input-prefix">₹</span>
                                                <input
                                                    type="number"
                                                    value={purchaseDetails.totalPurchaseAmount || ''}
                                                    readOnly
                                                    placeholder="0.00"
                                                    className="form-input-highlight total-input"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {stockAction === 'reduce' && (
                                <div className="warning-message stock-warning">
                                    <span className="warning-icon">⚠️</span>
                                    <p>You are about to reduce stock. Current quantity: <strong>{selectedStock.quantity} {selectedStock.unit}</strong></p>
                                </div>
                            )}

                            <div className="modal-actions stock-modal-actions">
                                <button type="button" className="btn-secondary stock-btn-secondary" onClick={() => {
                                    setShowAddStockModal(false);
                                    setShowReduceStockModal(false);
                                }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary stock-btn-primary" disabled={loading}>
                                    {loading ? `${stockAction === 'add' ? 'Adding...' : 'Reducing...'}` : `${stockAction === 'add' ? 'Add Stock' : 'Reduce Stock'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock History Modal */}
            {showHistoryModal && (
                <div className="modal-overlay history-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content history-modal" ref={historyModalRef} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>History</h2>
                            <button className="close-btn" onClick={() => setShowHistoryModal(false)}>×</button>
                        </div>

                        {/* Tab Buttons */}
                        <div className="history-tabs">
                            <button
                                className={`tab-btn ${activeHistoryTab === 'stock' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryTab('stock')}
                            >
                                Stock History
                            </button>
                            <button
                                className={`tab-btn ${activeHistoryTab === 'purchase' ? 'active' : ''}`}
                                onClick={() => setActiveHistoryTab('purchase')}
                            >
                                Product Purchase History
                            </button>
                        </div>

                        {/* ⭐ NEW: Search Bar */}
                        {activeHistoryTab === 'stock' ? (
                            <div style={{ marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Search by Product, Date, Supplier..."
                                    value={stockHistorySearch}
                                    onChange={(e) => setStockHistorySearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        border: '1.5px solid #e5e7eb',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Search by Date, Customer Name, Phone, Product..."
                                    value={purchaseHistorySearch}
                                    onChange={(e) => setPurchaseHistorySearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        border: '1.5px solid #e5e7eb',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        )}

                        <div className="history-content">
                            {activeHistoryTab === 'stock' ? (
                                <>
                                    {historyLoading ? (
                                        <div className="loading-state">Loading history...</div>
                                    ) : stockHistory.length === 0 ? (
                                        <div className="empty-state">No stock history found</div>
                                    ) : (
                                        <div className="history-table-container">
                                            <table className="history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Product</th>
                                                        <th>Operation</th>
                                                        <th>Qty</th>
                                                        <th>Previous</th>
                                                        <th>New</th>
                                                        <th>Supplier</th>
                                                        <th>Motor Brand</th>
                                                        <th>By</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stockHistory
                                                        .filter(item => {
                                                            if (!stockHistorySearch) return true;
                                                            const search = stockHistorySearch.toLowerCase();
                                                            return (
                                                                (item.stock_name && item.stock_name.toLowerCase().includes(search)) ||
                                                                (item.supplier && item.supplier.toLowerCase().includes(search)) ||
                                                                (item.created_at && new Date(item.created_at).toLocaleDateString('en-IN').includes(search))
                                                            );
                                                        })
                                                        .map((item) => (
                                                            <tr key={item.id}>
                                                                <td>{item.created_at}</td>
                                                                <td>{item.stock_name}</td>
                                                                <td>
                                                                    <span className={`operation-badge ${item.operation_type}`}>
                                                                        {getOperationIcon(item.operation_type)}
                                                                        {getOperationLabel(item.operation_type)}
                                                                    </span>
                                                                </td>
                                                                <td className={item.operation_type === 'reduce' ? 'text-danger' : 'text-success'}>
                                                                    {item.operation_type === 'reduce' ? '-' : '+'}{item.quantity} {item.unit}
                                                                </td>
                                                                <td>{item.previous_quantity}</td>
                                                                <td>{item.new_quantity}</td>
                                                                <td>{item.supplier || '-'}</td>
                                                                <td>{item.motor_brand || '-'}</td>
                                                                <td>{item.performed_by}</td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {purchaseHistoryLoading ? (
                                        <div className="loading-state">Loading purchase history...</div>
                                    ) : productPurchaseHistory.length === 0 ? (
                                        <div className="empty-state">No product purchase history found</div>
                                    ) : (
                                        <div className="history-table-container">
                                            <table className="history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Customer Name</th>
                                                        <th>Phone</th>
                                                        <th>Booked Products</th>
                                                        <th>Additional Products</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {productPurchaseHistory
                                                        .filter(item => {
                                                            if (!purchaseHistorySearch) return true;
                                                            const search = purchaseHistorySearch.toLowerCase();
                                                            return (
                                                                (item.customer_name && item.customer_name.toLowerCase().includes(search)) ||
                                                                (item.phone && item.phone.toLowerCase().includes(search)) ||
                                                                (item.product_name && item.product_name.toLowerCase().includes(search)) ||
                                                                (item.additional_product && item.additional_product.toLowerCase().includes(search)) ||
                                                                (item.created_at && new Date(item.created_at).toLocaleDateString('en-IN').includes(search))
                                                            );
                                                        })
                                                        .map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '-'}</td>
                                                                <td>{item.customer_name || '-'}</td>
                                                                <td>{item.phone || '-'}</td>
                                                                <td>
                                                                    {item.product_name ? (
                                                                        <ProductHistory
                                                                            products={item.product_name}
                                                                            title=""
                                                                            showTotal={true}
                                                                            isCompact={true}
                                                                            showPrice={false}
                                                                        />
                                                                    ) : (
                                                                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {item.additional_product ? (
                                                                        <ProductHistory
                                                                            products={item.additional_product}
                                                                            title=""
                                                                            showTotal={true}
                                                                            isCompact={true}
                                                                            showPrice={false}
                                                                        />
                                                                    ) : (
                                                                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Render Motor Multibrand Modal globally */}
            {showMotorModal && (
                <MotorMultiBrandModal
                    ref={motorModalRef}
                    mode={motorOperationMode}
                    stockName={(selectedStock?.name || newStock.name) || 'Motor'}
                    initialBrands={motorOperationMode === 'create' ? (newStock.motor_brands || []) : (selectedStock?.motor_brands || [])}
                    onClose={() => {
                        setShowMotorModal(false);
                        setMotorOperationMode('create');
                    }}
                    onSubmit={async (brands, totalQty) => {
                        if (motorOperationMode === 'create') {
                            setNewStock(prev => ({
                                ...prev,
                                name: prev.name.toLowerCase().includes('motor') ? prev.name : 'Motor',
                                motor_brands: brands,
                                quantity: totalQty,
                                supplier: '',
                                purchase_price_per_unit: 0,
                                total_purchase_amount: 0,
                                selling_price: 0,
                                minimum_price: 0,
                            }));
                            setShowMotorModal(false);
                        } else if (motorOperationMode === 'edit') {
                            // Call update API
                            try {
                                const updatedStock = { ...selectedStock, motor_brands: brands, quantity: totalQty };
                                const response = await api.put(`/stocks/${selectedStock.stock_id}/`, updatedStock, getAuthHeaders());
                                if (response.data.success) {
                                    fetchStockItems();
                                    triggerRefresh('stock');
                                    setShowMotorModal(false);
                                    setSelectedStock(null);
                                }
                            } catch (err) {
                                console.error('Error updating motor stock:', err);
                                setError('Failed to update motor variants');
                            }
                        } else if (motorOperationMode === 'add_stock' || motorOperationMode === 'reduce_stock') {
                            // Call operation API
                            try {
                                const isAdd = motorOperationMode === 'add_stock';
                                const operationData = {
                                    quantity: totalQty,
                                    operation_type: isAdd ? 'add' : 'reduce',
                                    // Pass brand-wise breakdown for history
                                    motor_brands: brands,
                                    // Optional: use first brand's supplier for legacy reasons or leave empty
                                    supplier: brands[0]?.pricing?.supplier || 'Motor Brand Adjustment',
                                    purchase_price_per_unit: brands[0]?.pricing?.purchase_price || 0,
                                    date_of_purchase: new Date().toISOString().split('T')[0]
                                };

                                const response = await api.post(`/stocks/${selectedStock.stock_id}/operation/`, operationData, getAuthHeaders());
                                if (response.data.success) {
                                    fetchStockItems();
                                    triggerRefresh('stock');
                                    setShowMotorModal(false);
                                    setSelectedStock(null);
                                }
                            } catch (err) {
                                console.error('Error during motor stock operation:', err);
                                setError('Failed to perform stock operation');
                            }
                        }
                    }}
                />
            )}
        </>
    );
};

export default StockManagement;