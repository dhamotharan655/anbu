import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from "../../api";
import { useScrollToRef } from "../../hooks/useScrollToRef";
import './StockManagement.css';
import { FiClock, FiX, FiTrendingUp, FiTrendingDown, FiPackage, FiTrash2, FiActivity, FiDownload, FiPlus, FiEdit, FiDollarSign, FiShoppingCart, FiSearch, FiInfo, FiTag, FiPlusSquare } from 'react-icons/fi';
import { useGlobalRefresh } from "../../context/GlobalRefreshContext";
import ProductHistory from "../../components/ProductHistory";

const StockManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshTriggers, triggerRefresh, branches } = useGlobalRefresh();
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

    // ✅ NEW: Page-level tab
    const [activePageTab, setActivePageTab] = useState('stock'); // 'stock' | 'expired'

    // ✅ NEW: Expired/Scrap Items
    const [expiredItems, setExpiredItems] = useState([]);
    const [expiredLoading, setExpiredLoading] = useState(false);
    const [editingExpiredId, setEditingExpiredId] = useState(null);
    const [expiredEditData, setExpiredEditData] = useState({ sold_price: '', sold_date: '' });

    // â­ NEW: Search states for history
    const [stockHistorySearch, setStockHistorySearch] = useState('');
    const [purchaseHistorySearch, setPurchaseHistorySearch] = useState('');

    // ✅ NEW: Branch filtering
    const [selectedBranch, setSelectedBranch] = useState(sessionStorage.getItem('role') !== 'admin' && sessionStorage.getItem('role') !== 'bigadmin' ? sessionStorage.getItem('branch_name') || '' : '');

    // Scroll Refs for modals
    const addModalRef = useScrollToRef(showAddModal);
    const editModalRef = useScrollToRef(showEditModal);
    const addReduceModalRef = useScrollToRef(showAddStockModal || showReduceStockModal);
    const historyModalRef = useScrollToRef(showHistoryModal);


    // Scroll to top when history modal opens
    useEffect(() => {
        if (showHistoryModal) {
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }
    }, [showHistoryModal]);


    // Form states
    const [newStock, setNewStock] = useState({
        name: '',
        branch_name: selectedBranch || (branches && branches.length > 0 ? branches[0].name : 'Main Branch'),
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
        date_of_purchase: new Date().toISOString().split('T')[0]
    });

    const [selectedStock, setSelectedStock] = useState(null);
    const [stockQuantity, setStockQuantity] = useState(0);
    const [stockAction, setStockAction] = useState('add'); // 'add' or 'reduce'

    // New fields for Add Stock (Purchase Details)
    const [purchaseDetails, setPurchaseDetails] = useState({
        supplier: '',
        purchasePricePerUnit: 0,
        totalPurchaseAmount: 0,
        dateOfPurchase: new Date().toISOString().split('T')[0],
        minimumPrice: 0,
        minimumThreshold: 0,
        sellingPrice: 0
    });

    const [showPriceSyncConfirm, setShowPriceSyncConfirm] = useState(false);

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

    // ✅ NEW: Fetch expired/scrap items
    const fetchExpiredItems = async (branch = selectedBranch) => {
        setExpiredLoading(true);
        try {
            const url = branch ? `/expired-items/?branch_name=${branch}` : '/expired-items/';
            const res = await api.get(url, getAuthHeaders());
            setExpiredItems(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching expired items:', err);
        } finally {
            setExpiredLoading(false);
        }
    };

    useEffect(() => {
        if (activePageTab === 'expired') fetchExpiredItems();
    }, [activePageTab]);

    const saveExpiredEdit = async (id) => {
        try {
            await api.put(`/expired-items/${id}/`, {
                sold_price: expiredEditData.sold_price ? parseFloat(expiredEditData.sold_price) : 0,
                sold_date: expiredEditData.sold_date || null,
            });
            setEditingExpiredId(null);
            fetchExpiredItems();
        } catch (err) {
            alert('Failed to update expired item');
        }
    };

    // Fetch stock items

    // Fetch stock items
    const fetchStockItems = async (branch = selectedBranch) => {
        setLoading(true);
        setError('');
        try {
            const url = branch ? `/stocks/?branch_name=${branch}` : '/stocks/';
            const response = await api.get(url, getAuthHeaders());
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
    const fetchStockHistory = async (stockId = null, branch = selectedBranch) => {
        setHistoryLoading(true);
        try {
            let url = stockId ? `/stocks/history/?stock_id=${stockId}` : '/stocks/history/';
            if (branch && !stockId) {
                url += (url.includes('?') ? '&' : '?') + `branch_name=${branch}`;
            }
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
    const fetchProductPurchaseHistory = async (branch = selectedBranch) => {
        setPurchaseHistoryLoading(true);
        try {
            const url = branch ? `/stocks/product-purchase-history/?branch_name=${branch}` : '/stocks/product-purchase-history/';
            const response = await api.get(url, getAuthHeaders());
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

        try {
            const stockData = {
                ...newStock
            };

            const response = await api.post('/stocks/create/', stockData, getAuthHeaders());
            if (response.data.success) {
                fetchStockItems();
                triggerRefresh('stock');
                setNewStock({
                    name: '',
                    branch_name: selectedBranch || (branches && branches.length > 0 ? branches[0].name : 'Main Branch'),
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
                    date_of_purchase: new Date().toISOString().split('T')[0]
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
    const handleStockOperation = async (e, bypassConfirm = false) => {
        if (e && e.preventDefault) e.preventDefault();
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

            // Check if selling price is different, and we haven't shown confirmation dialog yet
            if (selectedStock && purchaseDetails.sellingPrice !== selectedStock.selling_price && !bypassConfirm) {
                setLoading(false);
                setShowPriceSyncConfirm(true);
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
                    date_of_purchase: purchaseDetails.dateOfPurchase,
                    minimum_price: purchaseDetails.minimumPrice,
                    minimum_threshold: purchaseDetails.minimumThreshold,
                    selling_price: purchaseDetails.sellingPrice
                }
                : { quantity: stockQuantity };

            const response = await api.put(endpoint, requestData, getAuthHeaders());

            if (response.data.success) {
                fetchStockItems();
                triggerRefresh('stock');
                setShowAddStockModal(false);
                setShowReduceStockModal(false);
                setShowPriceSyncConfirm(false);
                setSelectedStock(null);
                setStockQuantity(0);
                // Reset purchase details
                setPurchaseDetails({
                    supplier: '',
                    purchasePricePerUnit: 0,
                    totalPurchaseAmount: 0,
                    dateOfPurchase: new Date().toISOString().split('T')[0],
                    minimumPrice: 0,
                    minimumThreshold: 0,
                    sellingPrice: 0
                });
            }
        } catch (err) {
            console.error(`Error ${stockAction}ing stock:`, err);
            setError(err.response?.data?.error || `Failed to ${stockAction} stock`);
        } finally {
            setLoading(false);
        }
    };

    // Helper to confirm and sync price updates to the existing stock item
    const handleConfirmPriceSync = () => {
        handleStockOperation(null, true);
    };

    // Helper to create a new stock item with the new price
    const handleCreateNewStock = async () => {
        if (!selectedStock) return;
        setLoading(true);
        setError('');
        try {
            const requestData = {
                name: `${selectedStock.name} - ₹${purchaseDetails.sellingPrice}`,
                category: selectedStock.category || '',
                quantity: stockQuantity,
                unit: selectedStock.unit || 'pcs',
                minimum_threshold: purchaseDetails.minimumThreshold || selectedStock.minimum_threshold || 2,
                selling_price: purchaseDetails.sellingPrice,
                buying_price: purchaseDetails.purchasePricePerUnit,
                minimum_price: purchaseDetails.minimumPrice,
                branch_name: selectedStock.branch_name || 'Main Branch',
                supplier: purchaseDetails.supplier,
                purchase_price_per_unit: purchaseDetails.purchasePricePerUnit,
                total_purchase_amount: purchaseDetails.totalPurchaseAmount,
                date_of_purchase: purchaseDetails.dateOfPurchase
            };

            const response = await api.post('/stocks/create/', requestData, getAuthHeaders());

            if (response.data.success) {
                fetchStockItems();
                triggerRefresh('stock');
                setShowAddStockModal(false);
                setShowPriceSyncConfirm(false);
                setSelectedStock(null);
                setStockQuantity(0);
                setPurchaseDetails({
                    supplier: '',
                    purchasePricePerUnit: 0,
                    totalPurchaseAmount: 0,
                    dateOfPurchase: new Date().toISOString().split('T')[0],
                    minimumPrice: 0,
                    minimumThreshold: 0,
                    sellingPrice: 0
                });
            }
        } catch (err) {
            console.error("Error creating new price stock:", err);
            setError(err.response?.data?.error || "Failed to create new stock item");
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
                return '\u274C';
            case 'Low':
                return '\u26A0\uFE0F';
            default:
                return '\u2705';
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
            'Supplier',
            'Date of Purchase'
        ];

        let rows = [];

        stockItems.forEach(item => {
            rows.push([
                item.name || '',
                item.category || '',
                item.quantity || 0,
                item.unit || 'pcs',
                item.minimum_threshold || 0,
                item.status || '',
                item.buying_price || item.purchase_price_per_unit || 0,
                item.selling_price || 0,
                item.supplier || '',
                item.date_of_purchase || ''
            ]);
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
        fetchStockItems(selectedBranch);
        if (activePageTab === 'expired') fetchExpiredItems(selectedBranch);
    }, [selectedBranch, activePageTab]);

    useEffect(() => {
        if (refreshTriggers.stock > 0) {
            fetchStockItems(selectedBranch);
            if (activePageTab === 'expired') fetchExpiredItems(selectedBranch);
        }
    }, [refreshTriggers.stock]);

    // Render a single stock card (used for both branch-grouped and flat views)
    const renderStockCard = (item) => (
        <div key={item.id} className="stock-item-card">
            {/* Branch Name Banner (shown when viewing All Branches) */}
            {!selectedBranch && item.branch_name && (
                <div className="stock-card-branch-banner">
                    🏢 {item.branch_name}
                </div>
            )}

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
                            setSelectedStock(item);
                            setShowEditModal(true);
                        }}
                        title="Edit Stock Item"
                    >
                        {'✏️'}
                    </button>
                    <button
                        className="action-btn add-btn"
                        onClick={() => {
                            setSelectedStock(item);
                            setStockAction('add');
                            setStockQuantity(0);
                            setPurchaseDetails({
                                supplier: item.supplier || '',
                                purchasePricePerUnit: item.buying_price || 0,
                                totalPurchaseAmount: 0,
                                dateOfPurchase: new Date().toISOString().split('T')[0],
                                minimumPrice: item.minimum_price || 0,
                                minimumThreshold: item.minimum_threshold || 0,
                                sellingPrice: item.selling_price || 0
                            });
                            setShowAddStockModal(true);
                        }}
                        title="Add Stock"
                    >
                        ➕
                    </button>
                    <button
                        className="action-btn reduce-btn"
                        onClick={() => {
                            setSelectedStock(item);
                            setStockAction('reduce');
                            setStockQuantity(0);
                            setShowReduceStockModal(true);
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
                        <FiTrash2 />
                    </button>
                </div>
            </div>

            <div className="stock-item-details">
                <div className="detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="stock-id-badge">#{item.stock_id}</span>
                </div>
                {item.branch_name && (
                    <div className="detail-row">
                        <span className="detail-label">Branch:</span>
                        <span className="branch-tag">🏢 {item.branch_name}</span>
                    </div>
                )}
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
                <div className="detail-row">
                    <span className="detail-label">Min Threshold:</span>
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
        </div>
    );


    return (
        <>
            <div className="stock-management-container">
                <div className="stock-management-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <h1>Stock Management</h1>
                        
                        {(sessionStorage.getItem('role') === 'admin' || sessionStorage.getItem('role') === 'bigadmin') && (
                            <div className="sm-branch-filter">
                                <FiTag className="sm-filter-icon" />
                                <select 
                                    value={selectedBranch} 
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="sm-branch-select"
                                >
                                    <option value="">All Branches</option>
                                    {branches && branches.map(b => (
                                        <option key={b.branch_id} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {selectedBranch && (
                            <div className="active-branch-badge">
                                Branch: {selectedBranch}
                            </div>
                        )}
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setShowHistoryModal(true);
                                setActiveHistoryTab('stock');
                                fetchStockHistory(null, selectedBranch);
                                fetchProductPurchaseHistory(selectedBranch);
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
                            <FiTrendingUp /> Add New Stock Item
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Page Tabs */}
                <div className="page-tabs">
                    <button
                        className={`page-tab ${activePageTab === 'stock' ? 'active' : ''}`}
                        onClick={() => setActivePageTab('stock')}
                    >
                        📦 Stock Items
                    </button>
                    <button
                        className={`page-tab ${activePageTab === 'expired' ? 'active' : ''}`}
                        onClick={() => setActivePageTab('expired')}
                    >
                        🛠️ Expired/Scrap
                    </button>
                </div>

                {activePageTab === 'stock' && (() => {
                    if (loading) return (
                        <div className="loading-state">Loading stock items...</div>
                    );
                    if (stockItems.length === 0) return (
                        <div className="empty-state">No stock items found. Add your first item to get started.</div>
                    );

                    // If a branch is selected, show flat list
                    if (selectedBranch) {
                        return (
                            <div className="stock-items-grid">
                                {stockItems.map((item) => renderStockCard(item))}
                            </div>
                        );
                    }

                    // Group by branch when viewing all
                    const branchGroups = {};
                    stockItems.forEach(item => {
                        const branch = item.branch_name || 'Unassigned';
                        if (!branchGroups[branch]) branchGroups[branch] = [];
                        branchGroups[branch].push(item);
                    });

                    return Object.entries(branchGroups).map(([branchName, items]) => (
                        <div key={branchName} className="branch-stock-group">
                            <div className="branch-group-header">
                                <span className="branch-group-icon">🏢</span>
                                <h2 className="branch-group-title">{branchName}</h2>
                                <span className="branch-group-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="stock-items-grid">
                                {items.map((item) => renderStockCard(item))}
                            </div>
                        </div>
                    ));
                })()}

                {activePageTab === 'expired' && (
                    <div className="expired-scrap-container main-page-expired">
                        <div className="expired-header">
                            <div className="expired-icon-circle">🛠️</div>
                            <div className="expired-title-info">
                                <h3>Expired / Scrap Collection</h3>
                                <p>Items collected from customers — update sold price once resold</p>
                            </div>
                            <button className="btn-secondary expired-refresh-btn" onClick={fetchExpiredItems}>
                                <FiActivity /> Refresh Records
                            </button>
                        </div>

                        {expiredLoading ? (
                            <div className="loading-state">
                                <div className="sm-spinner"></div>
                                <p>Loading collection records...</p>
                            </div>
                        ) : expiredItems.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🛠️</div>
                                <h3>No collection records</h3>
                                <p>Items will appear here when staff log them during service completion.</p>
                            </div>
                        ) : (
                            <div className="expired-table-wrapper premium-table-card">
                                <table className="expired-table">
                                    <thead>
                                        <tr>
                                            <th>Item Name</th>
                                            <th>Complaint No</th>
                                            <th style={{ textAlign: 'right' }}>Bought At (₹)</th>
                                            <th>Buy Date</th>
                                            <th style={{ textAlign: 'right' }}>Sold At (₹)</th>
                                            <th>Sold Date</th>
                                            <th style={{ textAlign: 'center' }}>Status</th>
                                            <th style={{ textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expiredItems.map((ei) => (
                                            <tr key={ei.id} className="expired-row">
                                                <td style={{ fontWeight: 700 }}>{ei.name}</td>
                                                <td style={{ color: 'var(--sm-text-muted)', fontSize: '0.85rem' }}>{ei.complaint_no}</td>
                                                <td className="price-positive" style={{ textAlign: 'right' }}>₹{(ei.buying_price || 0).toFixed(2)}</td>
                                                <td style={{ color: 'var(--sm-text-muted)', fontSize: '0.85rem' }}>{ei.buy_date ? new Date(ei.buy_date).toLocaleDateString('en-IN') : '-'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {editingExpiredId === ei.id ? (
                                                        <input
                                                            type="number"
                                                            className="edit-input-mini"
                                                            value={expiredEditData.sold_price}
                                                            onChange={(e) => setExpiredEditData({ ...expiredEditData, sold_price: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className={ei.sold_price > 0 ? "price-neutral" : "price-empty"}>
                                                            {ei.sold_price > 0 ? `₹${ei.sold_price.toFixed(2)}` : 'Not sold'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {editingExpiredId === ei.id ? (
                                                        <input
                                                            type="date"
                                                            className="edit-input-mini"
                                                            style={{ width: 'auto' }}
                                                            value={expiredEditData.sold_date}
                                                            onChange={(e) => setExpiredEditData({ ...expiredEditData, sold_date: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span style={{ color: 'var(--sm-text-muted)', fontSize: '0.85rem' }}>
                                                            {ei.sold_date ? new Date(ei.sold_date).toLocaleDateString('en-IN') : '-'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`status-badge-mini ${ei.sold_price > 0 ? 'status-sold' : 'status-pending'}`}>
                                                        {ei.sold_price > 0 ? '✅ Sold' : '⏳ Pending'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {editingExpiredId === ei.id ? (
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                            <button className="action-btn-pill btn-save-pill" onClick={() => saveExpiredEdit(ei.id)}>Save</button>
                                                            <button className="action-btn-pill btn-cancel-pill" onClick={() => setEditingExpiredId(null)}>Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="action-btn-pill btn-edit-pill"
                                                            onClick={() => {
                                                                setEditingExpiredId(ei.id);
                                                                setExpiredEditData({
                                                                    sold_price: ei.sold_price || '',
                                                                    sold_date: ei.sold_date ? ei.sold_date.split('T')[0] : ''
                                                                });
                                                            }}
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {showAddModal && (
                    <div className="premium-stock-fullscreen-overlay">
                        <div className="premium-stock-fullscreen-modal">
                            <div className="modal-header">
                                <div className="modal-title-section">
                                    <span className="modal-icon"><FiPlusSquare /></span>
                                    <h2>Create New Stock Profile</h2>
                                    <p className="modal-subtitle">Define a new inventory item and initial stock levels</p>
                                </div>
                                <button className="close-btn" onClick={() => setShowAddModal(false)} style={{ fontSize: '2rem' }}>×</button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleCreateStock} className="premium-stock-form-container">
                                {/* Section 1: Basic Identity */}
                                <div className="form-section-card">
                                    <div className="form-section-header">
                                        <div className="section-icon-badge"><FiTag /></div>
                                        <h3>Product Identity</h3>
                                    </div>
                                    <div className="form-group">
                                        <label>Product / Stock Name *</label>
                                        <div className="input-with-prefix">
                                            <FiPackage className="input-icon-left" />
                                            <input
                                                type="text"
                                                value={newStock.name}
                                                onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                                                required
                                                placeholder="e.g. 20L Water Can, Submersible Pump"
                                                className="form-input-highlight icon-padding"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label>Branch Assignment</label>
                                            <select
                                                value={newStock.branch_name}
                                                onChange={(e) => setNewStock({ ...newStock, branch_name: e.target.value })}
                                                className="form-input-highlight"
                                            >
                                                <option value="">Select Branch (Default: Main)</option>
                                                {branches?.map(b => (
                                                    <option key={b.branch_id} value={b.name}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <input
                                                type="text"
                                                value={newStock.category}
                                                onChange={(e) => setNewStock({ ...newStock, category: e.target.value })}
                                                placeholder="e.g. Motors, Spares"
                                                className="form-input-highlight"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Inventory Configuration */}
                                <div className="form-section-card">
                                    <div className="form-section-header">
                                        <div className="section-icon-badge"><FiActivity /></div>
                                        <h3>Inventory & Units</h3>
                                    </div>
                                        <div className="form-grid-3">
                                            <div className="form-group">
                                                <label>Measurement Unit</label>
                                                <select
                                                    value={newStock.unit}
                                                    onChange={(e) => setNewStock({ ...newStock, unit: e.target.value })}
                                                    className="form-input-highlight"
                                                >
                                                    <option value="pcs">Pieces (pcs)</option>
                                                    <option value="kg">Kilograms (kg)</option>
                                                    <option value="liters">Liters (L)</option>
                                                    <option value="meters">Meters (m)</option>
                                                    <option value="boxes">Boxes</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Initial Opening Stock</label>
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
                                                    className="form-input-highlight"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Low Stock Alert Level</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={newStock.minimum_threshold}
                                                    onChange={(e) => setNewStock({ ...newStock, minimum_threshold: parseInt(e.target.value) || 0 })}
                                                    className="form-input-highlight"
                                                    placeholder="2"
                                                />
                                                <p style={{ fontSize: '11px', color: 'var(--sm-text-muted)', marginTop: '6px', fontWeight: 600 }}>Get notified at this level</p>
                                            </div>
                                        </div>
                                </div>

                                {/* Section 3: Commercial Details */}
                                <div className="form-section-card">
                                    <div className="form-section-header">
                                        <div className="section-icon-badge"><FiDollarSign /></div>
                                        <h3>Commercial Records</h3>
                                    </div>
                                    <div className="form-grid-3">
                                        <div className="form-group">
                                            <label>Standard Selling Price *</label>
                                            <div className="input-with-prefix">
                                                <span className="input-prefix">₹</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={newStock.selling_price || ''}
                                                    onChange={(e) => setNewStock({ ...newStock, selling_price: parseFloat(e.target.value) || 0 })}
                                                    required
                                                    placeholder="0.00"
                                                    className="form-input-highlight"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Minimum Selling Price</label>
                                            <div className="input-with-prefix">
                                                <span className="input-prefix">₹</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={newStock.minimum_price || ''}
                                                    onChange={(e) => setNewStock({ ...newStock, minimum_price: parseFloat(e.target.value) || 0 })}
                                                    placeholder="0.00"
                                                    className="form-input-highlight"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Purchase Price (Unit)</label>
                                            <div className="input-with-prefix">
                                                <span className="input-prefix">₹</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
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
                                                    className="form-input-highlight"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ marginTop: '1rem' }}>
                                        <label>Supplier Name</label>
                                        <div className="input-with-prefix">
                                            <FiShoppingCart className="input-icon-left" />
                                            <input
                                                type="text"
                                                value={newStock.supplier}
                                                onChange={(e) => setNewStock({ ...newStock, supplier: e.target.value })}
                                                placeholder="e.g. ABC Trading Co."
                                                className="form-input-highlight icon-padding"
                                            />
                                        </div>
                                    </div>
                                </div>

                                    <div className="stock-modal-actions" style={{ padding: '2rem 0', marginTop: '1rem' }}>
                                        <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)} style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>
                                            Discard & Exit
                                        </button>
                                        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '1.25rem 4rem', fontSize: '1.1rem' }}>
                                            {loading ? <><div className="sm-spinner-mini"></div> Processing...</> : <><FiPlus /> Create Stock Item</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Stock Modal */}
                {showEditModal && selectedStock && (
                    <div className="premium-stock-fullscreen-overlay">
                        <div className="premium-stock-fullscreen-modal">
                            <div className="modal-header">
                                <div className="modal-title-section">
                                    <span className="modal-icon"><FiEdit /></span>
                                    <h2>Edit Stock Profile</h2>
                                    <p className="modal-subtitle">Update details for {selectedStock.name}</p>
                                </div>
                                <button className="close-btn" onClick={() => setShowEditModal(false)} style={{ fontSize: '2rem' }}>×</button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleUpdateStock} className="premium-stock-form-container">
                                    {/* Basic Info Section */}
                                    <div className="form-section-card">
                                        <div className="form-section-header">
                                            <div className="section-icon-badge"><FiPackage /></div>
                                            <h3>Product Identity</h3>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label>Stock Item Name</label>
                                            <input
                                                type="text"
                                                value={selectedStock.name}
                                                onChange={(e) => setSelectedStock({ ...selectedStock, name: e.target.value })}
                                                required
                                                className="form-input-highlight"
                                                style={{ fontSize: '1.1rem', padding: '1rem' }}
                                            />
                                        </div>
                                        <div className="form-grid-2">
                                            <div className="form-group">
                                                <label>Branch Assignment</label>
                                                <select
                                                    value={selectedStock.branch_name || ''}
                                                    onChange={(e) => setSelectedStock({ ...selectedStock, branch_name: e.target.value })}
                                                    className="form-input-highlight"
                                                >
                                                    <option value="">Select Branch (Default: Main Branch)</option>
                                                    {branches?.map(b => (
                                                        <option key={b.branch_id} value={b.name}>{b.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Inventory Category</label>
                                                <input
                                                    type="text"
                                                    value={selectedStock.category || ''}
                                                    onChange={(e) => setSelectedStock({ ...selectedStock, category: e.target.value })}
                                                    className="form-input-highlight"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Configuration Section */}
                                    <div className="form-section-card">
                                        <div className="form-section-header">
                                            <div className="section-icon-badge"><FiActivity /></div>
                                            <h3>Units & Alerts</h3>
                                        </div>
                                        <div className="form-grid-2">
                                            <div className="form-group">
                                                <label>Measurement Unit</label>
                                                <select
                                                    value={selectedStock.unit}
                                                    onChange={(e) => setSelectedStock({ ...selectedStock, unit: e.target.value })}
                                                    className="form-input-highlight"
                                                >
                                                    <option value="pcs">Pieces (pcs)</option>
                                                    <option value="kg">Kilograms (kg)</option>
                                                    <option value="liters">Liters (L)</option>
                                                    <option value="meters">Meters (m)</option>
                                                    <option value="boxes">Boxes</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Low Stock Alert Level</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={selectedStock.minimum_threshold}
                                                    onChange={(e) => setSelectedStock({ ...selectedStock, minimum_threshold: parseInt(e.target.value) || 0 })}
                                                    className="form-input-highlight"
                                                    placeholder="2"
                                                />
                                                <p style={{ fontSize: '11px', color: 'var(--sm-text-muted)', marginTop: '6px', fontWeight: 600 }}>Notify when stock reaches this level</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Section */}
                                    <div className="form-section-card">
                                        <div className="form-section-header">
                                            <div className="section-icon-badge"><FiDollarSign /></div>
                                            <h3>Commercial Details</h3>
                                        </div>
                                        <div className="form-grid-3">
                                            <div className="form-group">
                                                <label>Standard Selling Price (₹)</label>
                                                <div className="input-with-prefix">
                                                    <span className="input-prefix">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={selectedStock.selling_price || ''}
                                                        onChange={(e) => setSelectedStock({ ...selectedStock, selling_price: e.target.value })}
                                                        placeholder="0.00"
                                                        className="form-input-highlight"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Minimum Selling Price (₹)</label>
                                                <div className="input-with-prefix">
                                                    <span className="input-prefix">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={selectedStock.minimum_price || ''}
                                                        onChange={(e) => setSelectedStock({ ...selectedStock, minimum_price: e.target.value })}
                                                        placeholder="0.00"
                                                        className="form-input-highlight"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Unit Cost Price (₹)</label>
                                                <div className="input-with-prefix">
                                                    <span className="input-prefix">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={selectedStock.buying_price || ''}
                                                        onChange={(e) => setSelectedStock({ ...selectedStock, buying_price: e.target.value })}
                                                        placeholder="0.00"
                                                        className="form-input-highlight"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="stock-modal-actions" style={{ padding: '2rem 0', marginTop: '1rem' }}>
                                        <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)} style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>
                                            Cancel Changes
                                        </button>
                                        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '1.25rem 4rem', fontSize: '1.1rem' }}>
                                            {loading ? <><div className="sm-spinner-mini"></div> Updating...</> : <><FiEdit /> Save Profile Changes</>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add/Reduce Stock Modal */}
                {(showAddStockModal || showReduceStockModal) && selectedStock && (
                    <div className="modal-overlay stock-modal-overlay" onClick={() => {
                        setShowAddStockModal(false);
                        setShowReduceStockModal(false);
                    }}>
                        <div className="modal-content stock-modal-content modal-trimmed" ref={addReduceModalRef} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header stock-modal-header">
                                <div className="modal-title-section">
                                    <span className="modal-icon">{stockAction === 'add' ? '📈' : '📉'}</span>
                                    <h2>
                                        {stockAction === 'add' ? 'Increase Stock' : 'Inventory Reduction'}
                                    </h2>
                                    <p className="modal-subtitle">{selectedStock.name}</p>
                                </div>
                                <button className="close-btn stock-close-btn" onClick={() => {
                                    setShowAddStockModal(false);
                                    setShowReduceStockModal(false);
                                }}>×</button>
                            </div>
                            <form onSubmit={handleStockOperation} className="modal-form stock-modal-form">
                                {/* Current Stock Info Banner */}
                                <div className="current-stock-info">
                                    <div className="current-stock-item">
                                        <span className="current-stock-label">Available Stock</span>
                                        <span className="current-stock-value">{selectedStock.quantity} {selectedStock.unit}</span>
                                    </div>
                                    <div className="current-stock-item">
                                        <span className="current-stock-label">Product Category</span>
                                        <span className="current-stock-value">{selectedStock.category || 'Uncategorized'}</span>
                                    </div>
                                </div>

                                {/* Quantity Section */}
                                <div className="form-section-card">
                                    <div className="form-section-header">
                                        <div className="section-icon-badge">
                                            {stockAction === 'add' ? <FiPlus /> : <FiTrash2 />}
                                        </div>
                                        <h3>{stockAction === 'add' ? 'Stock Increase' : 'Inventory Deduction'}</h3>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            {stockAction === 'add' ? 'Quantity to Add *' : 'Quantity to Remove *'}
                                        </label>
                                        <div className="input-with-prefix">
                                            <FiPackage className="input-icon-left" />
                                            <input
                                                type="number"
                                                min="1"
                                                value={stockQuantity}
                                                onChange={(e) => {
                                                    const qty = parseInt(e.target.value) || 0;
                                                    setStockQuantity(qty);
                                                    if (stockAction === 'add') {
                                                        setPurchaseDetails(prev => ({
                                                            ...prev,
                                                            totalPurchaseAmount: qty * prev.purchasePricePerUnit
                                                        }));
                                                    }
                                                }}
                                                required
                                                placeholder="Enter quantity"
                                                className="form-input-highlight icon-padding"
                                            />
                                        </div>
                                    </div>
                                    {stockAction === 'reduce' && (
                                        <div className="warning-message stock-warning">
                                            <span className="warning-icon">⚠️</span>
                                            <p>This will permanently reduce your available inventory level.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Purchase Details Section - Only show when adding stock */}
                                {stockAction === 'add' && (
                                    <div className="form-section-card">
                                        <div className="form-section-header">
                                            <div className="section-icon-badge"><FiShoppingCart /></div>
                                            <h3>Batch Purchase Info</h3>
                                        </div>

                                        <div className="form-grid-2">
                                            <div className="form-group">
                                                <label>Supplier Name</label>
                                                <input
                                                    type="text"
                                                    value={purchaseDetails.supplier}
                                                    onChange={(e) => setPurchaseDetails({ ...purchaseDetails, supplier: e.target.value })}
                                                    placeholder="Supplier Name"
                                                    className="form-input-highlight"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Purchase Date</label>
                                                <input
                                                    type="date"
                                                    value={purchaseDetails.dateOfPurchase}
                                                    onChange={(e) => setPurchaseDetails({ ...purchaseDetails, dateOfPurchase: e.target.value })}
                                                    className="form-input-highlight"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                                            <div className="form-group">
                                                <label>Update Minimum Price (₹)</label>
                                                <div className="input-with-prefix">
                                                    <span className="input-prefix">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={purchaseDetails.minimumPrice || ''}
                                                        onChange={(e) => setPurchaseDetails({ ...purchaseDetails, minimumPrice: parseFloat(e.target.value) || 0 })}
                                                        placeholder="Optional"
                                                        className="form-input-highlight"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Update Low Stock Alert Level</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={purchaseDetails.minimumThreshold || ''}
                                                    onChange={(e) => setPurchaseDetails({ ...purchaseDetails, minimumThreshold: parseInt(e.target.value) || 0 })}
                                                    placeholder="Optional"
                                                    className="form-input-highlight"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                                            <div className="form-group">
                                                <label>Selling Price (₹) *</label>
                                                <div className="input-with-prefix">
                                                    <span className="input-prefix">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={purchaseDetails.sellingPrice || ''}
                                                        onChange={(e) => setPurchaseDetails({ ...purchaseDetails, sellingPrice: parseFloat(e.target.value) || 0 })}
                                                        placeholder="0.00"
                                                        className="form-input-highlight"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                                            <div className="form-group">
                                                <label>Price / Unit (₹)</label>
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
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Total Amount</label>
                                                <div className="input-with-prefix total-amount">
                                                    <span className="input-prefix">₹</span>
                                                    <input
                                                        type="number"
                                                        value={purchaseDetails.totalPurchaseAmount || ''}
                                                        className="total-input"
                                                        readOnly
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="stock-modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => {
                                        setShowAddStockModal(false);
                                        setShowReduceStockModal(false);
                                    }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? <><div className="sm-spinner-mini"></div> Processing...</> : <><FiPlus /> Update Inventory</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showPriceSyncConfirm && (
                    <div className="modal-overlay" style={{ zIndex: 1100 }}>
                        <div className="modal-content" style={{ maxWidth: '450px', padding: '24px' }}>
                            <div className="modal-header" style={{ marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-primary)' }}>Selling Price Changed</h2>
                                <button className="close-btn" onClick={() => setShowPriceSyncConfirm(false)}>×</button>
                            </div>
                            <div style={{ marginBottom: '24px', fontSize: '14px', lineHeight: '1.6', color: '#4b5563' }}>
                                <p style={{ marginBottom: '12px' }}>
                                    The selling price you entered (<strong>₹{purchaseDetails.sellingPrice.toFixed(2)}</strong>) is different from the existing stock price (<strong>₹{selectedStock?.selling_price?.toFixed(2) || '0.00'}</strong>).
                                </p>
                                <p>What would you like to do?</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button 
                                    className="btn-primary" 
                                    onClick={handleConfirmPriceSync}
                                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                                    disabled={loading}
                                >
                                    🔄 Sync & Update Existing Stock Price
                                </button>
                                <button 
                                    className="btn-secondary" 
                                    onClick={handleCreateNewStock}
                                    style={{ width: '100%', justifyContent: 'center', padding: '12px', background: '#f3f4f6', border: '1px solid #d1d5db', color: '#1f2937' }}
                                    disabled={loading}
                                >
                                    ➕ Add as a New Stock Item
                                </button>
                                <button 
                                    className="btn-secondary" 
                                    onClick={() => setShowPriceSyncConfirm(false)}
                                    style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                                >
                                    Cancel
                                </button>
                            </div>
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

                            {/* â­ NEW: Search Bar */}
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
                                                            <th>Buying Price (Unit / Total)</th>
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
                                                                    <td>
                                                                        {item.purchase_price_per_unit ? (
                                                                            <span style={{ fontWeight: 600, color: '#0f766e' }}>
                                                                                ₹{item.purchase_price_per_unit.toFixed(2)} 
                                                                                {item.total_purchase_amount ? ` / ₹${item.total_purchase_amount.toFixed(2)}` : ''}
                                                                            </span>
                                                                        ) : '-'}
                                                                    </td>
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
                                    <>
                                        {purchaseHistoryLoading ? (
                                            <div className="loading-state">Loading purchase history...</div>
                                        ) : productPurchaseHistory.length === 0 ? (
                                            <div className="empty-state">No product purchase history found</div>
                                        ) : (
                                            (() => {
                                                const filteredData = productPurchaseHistory.filter(item => {
                                                    if (!purchaseHistorySearch) return true;
                                                    const search = purchaseHistorySearch.toLowerCase();
                                                    return (
                                                        (item.customer_name && item.customer_name.toLowerCase().includes(search)) ||
                                                        (item.phone && item.phone.toLowerCase().includes(search)) ||
                                                        (item.product_name && item.product_name.toLowerCase().includes(search)) ||
                                                        (item.additional_product && item.additional_product.toLowerCase().includes(search)) ||
                                                        (item.created_at && new Date(item.created_at).toLocaleDateString('en-IN').includes(search))
                                                    );
                                                });

                                                if (filteredData.length === 0) return <div className="empty-state">No matching purchase history found</div>;

                                                // Group by branch
                                                const groupedData = filteredData.reduce((acc, item) => {
                                                    const branch = item.branch_name || 'Main Branch';
                                                    if (!acc[branch]) acc[branch] = [];
                                                    acc[branch].push(item);
                                                    return acc;
                                                }, {});

                                                return Object.entries(groupedData).map(([branch, items]) => (
                                                    <div key={branch} className="history-branch-section" style={{ marginBottom: '32px' }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '12px 20px',
                                                            background: 'rgba(11, 102, 120, 0.06)',
                                                            borderRadius: '12px',
                                                            borderLeft: '5px solid var(--color-primary)',
                                                            marginBottom: '20px',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                                        }}>
                                                            <FiShoppingCart style={{ color: 'var(--color-primary)', fontSize: '20px' }} />
                                                            <div>
                                                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    {branch}
                                                                </h3>
                                                                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                                                                    {items.length} Transactions found
                                                                </p>
                                                            </div>
                                                        </div>
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
                                                                    {items.map((item, index) => (
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
                                                                                        showPrice={true}
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
                                                                                        showPrice={true}
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
                                                    </div>
                                                ));
                                            })()
                                        )}
                                    </>
                                    </>
                                )}
                            </div> 
                        </div>
                    </div>
                )}


            </div> 
        </>
    );
};

export default StockManagement;
