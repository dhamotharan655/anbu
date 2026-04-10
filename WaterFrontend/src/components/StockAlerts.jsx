import React, { useState, useEffect } from 'react';
import api from '../api.js';
import './StockAlerts.css';

const StockAlerts = ({ onDismiss }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);

    // Get authentication headers
    const getAuthHeaders = () => {
        const token = sessionStorage.getItem('token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Role': sessionStorage.getItem('role'),
                'X-User-Name': sessionStorage.getItem('full_name')
            }
        };
    };

    // Fetch stock alerts
    const fetchStockAlerts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/stocks/alerts/', getAuthHeaders());
            setAlerts(response.data);
            if (response.data.length > 0) {
                setShowAlerts(true);
            }
        } catch (err) {
            console.error('Error fetching stock alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    // Check if alerts should be shown (only once per login)
    const shouldShowAlerts = () => {
        return !sessionStorage.getItem('stock_alerts_shown');
    };

    useEffect(() => {
        // Only show alerts on first load if there are alerts and not already shown
        if (shouldShowAlerts()) {
            fetchStockAlerts();
        }
    }, []);

    const handleDismiss = () => {
        setShowAlerts(false);
        sessionStorage.setItem('stock_alerts_shown', 'true');
        if (onDismiss) {
            onDismiss();
        }
    };

    const handleViewStock = () => {
        // Navigate to stock management page
        window.location.href = '/#/stock-management';
        handleDismiss();
    };

    if (!showAlerts || alerts.length === 0) {
        return null;
    }

    return (
        <div className="stock-alerts-overlay">
            <div className="stock-alerts-modal">
                <div className="stock-alerts-header">
                    <h3>⚠️ Stock Alert</h3>
                    <button className="close-btn" onClick={handleDismiss}>×</button>
                </div>
                
                <div className="stock-alerts-content">
                    {loading ? (
                        <div className="loading-message">Loading stock alerts...</div>
                    ) : (
                        <>
                            <p className="alert-description">
                                Some stock items are low or out of stock. Please review and restock as needed.
                            </p>
                            
                            <div className="alerts-list">
                                {alerts.map((item, index) => (
                                    <div key={index} className={`alert-item ${item.alert_type}`}>
                                        <div className="alert-item-header">
                                            <span className="alert-icon">
                                                {item.alert_type === 'danger' ? '❌' : '⚠️'}
                                            </span>
                                            <span className="alert-name">{item.name}</span>
                                            <span className={`alert-status ${item.alert_type}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="alert-details">
                                            <span className="alert-quantity">
                                                Current: {item.quantity} {item.unit}
                                            </span>
                                            <span className="alert-threshold">
                                                Threshold: {item.minimum_threshold} {item.unit}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="stock-alerts-actions">
                    <button className="btn-secondary" onClick={handleDismiss}>
                        Dismiss
                    </button>
                    <button className="btn-primary" onClick={handleViewStock}>
                        View Stock Management
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockAlerts;