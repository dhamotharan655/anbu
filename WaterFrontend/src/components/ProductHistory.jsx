import React from 'react';
import { FiShoppingBag, FiPackage } from 'react-icons/fi';

/**
 * Reusable ProductHistory Component
 * Parses and displays products in a clean, structured format
 * 
 * @param {Array} products - Array of product objects or JSON string
 * @param {string} title - Section title (optional)
 * @param {boolean} showTotal - Whether to show total amount
 * @param {boolean} isCompact - Compact mode for smaller spaces
 * @param {boolean} showPrice - Whether to show price columns (default: true)
 */
const ProductHistory = ({
    products,
    title = "Products Purchased",
    showTotal = true,
    isCompact = false,
    showPrice = true
}) => {
    // Parse products from JSON string or array
    const parseProducts = (productData) => {
        if (!productData) return [];

        // If it's already an array
        if (Array.isArray(productData)) {
            return productData.map(p => ({
                product_name: p.productName || p.name || p.product_name || '',
                quantity: p.quantity || p.qty || 1,
                price: p.price || p.selling_price || 0,
                motor_brand: p.brand_name || p.motor_brand || p.motorBrand || p.brand || null
            }));
        }

        // If it's a JSON string, try to parse
        if (typeof productData === 'string') {
            try {
                const parsed = JSON.parse(productData);
                if (Array.isArray(parsed)) {
                    return parsed.map(p => ({
                        product_name: p.productName || p.name || p.product_name || '',
                        quantity: p.quantity || p.qty || 1,
                        price: p.price || p.selling_price || 0,
                        motor_brand: p.brand_name || p.motor_brand || p.motorBrand || p.brand || null
                    }));
                }
                // If it's an object, return as single item
                return [{
                    product_name: parsed.productName || parsed.name || parsed.product_name || String(productData),
                    quantity: parsed.quantity || parsed.qty || 1,
                    price: parsed.price || parsed.selling_price || 0,
                    motor_brand: parsed.brand_name || parsed.motor_brand || parsed.motorBrand || parsed.brand || null
                }];
            } catch (e) {
                // Legacy string format
                return [{
                    product_name: String(productData),
                    quantity: 1,
                    price: 0,
                    motor_brand: null
                }];
            }
        }

        return [];
    };

    // Parse the products data
    const parsedProducts = parseProducts(products);

    // Calculate total
    const calculateTotal = () => {
        return parsedProducts.reduce((sum, item) => {
            return sum + (item.quantity * item.price);
        }, 0);
    };

    const total = calculateTotal();

    // If no products, show empty state
    if (!parsedProducts || parsedProducts.length === 0) {
        return (
            <div style={{
                padding: isCompact ? '8px 12px' : '12px 16px',
                textAlign: 'center',
                color: '#6b7280',
                fontStyle: 'italic',
                fontSize: isCompact ? '12px' : '14px'
            }}>
                No products purchased
            </div>
        );
    }

    // Styles
    const containerStyle = {
        background: 'linear-gradient(135deg, rgba(124,92,191,0.03), rgba(107,174,224,0.03))',
        border: '1px solid rgba(124,92,191,0.1)',
        borderRadius: isCompact ? '8px' : '12px',
        overflow: 'hidden',
        marginTop: '8px'
    };

    const headerStyle = {
        fontSize: isCompact ? '11px' : '13px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: '#7c5cbf',
        padding: isCompact ? '8px 12px' : '10px 14px',
        borderBottom: '1px solid rgba(124,92,191,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: isCompact ? '11px' : '13px'
    };

    const rowStyle = {
        borderBottom: '1px solid rgba(124,92,191,0.05)'
    };

    const cellStyle = {
        padding: isCompact ? '6px 10px' : '8px 12px',
        textAlign: 'left',
        color: '#374151'
    };

    const qtyStyle = {
        ...cellStyle,
        textAlign: 'center',
        color: '#6b7280'
    };

    const priceStyle = {
        ...cellStyle,
        textAlign: 'right',
        color: '#6b7280'
    };

    const subtotalStyle = {
        ...cellStyle,
        textAlign: 'right',
        fontWeight: 600,
        color: '#059669'
    };

    const totalStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isCompact ? '8px 12px' : '10px 14px',
        background: 'rgba(5,150,105,0.08)',
        borderTop: '2px solid rgba(124,92,191,0.1)',
        fontSize: isCompact ? '12px' : '14px',
        fontWeight: 700,
        color: '#059669'
    };

    // If showPrice is false, use simplified layout
    if (!showPrice) {
        return (
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <FiPackage size={isCompact ? 12 : 14} />
                    {title}
                </div>

                <div style={{ padding: isCompact ? '6px 0' : '8px 0' }}>
                    {parsedProducts.map((item, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: isCompact ? '4px 12px' : '6px 14px',
                            borderBottom: index < parsedProducts.length - 1 ? '1px solid rgba(124,92,191,0.05)' : 'none',
                            fontSize: isCompact ? '12px' : '13px'
                        }}>
                            <span style={{ fontWeight: 500, color: '#374151' }}>
                                {item.product_name}
                                {item.motor_brand && <span style={{ color: '#6366f1', fontSize: '11px', fontWeight: '700', marginLeft: '5px' }}>({item.motor_brand})</span>}
                            </span>
                            <span style={{
                                color: '#7c5cbf',
                                fontWeight: 600,
                                background: 'rgba(124,92,191,0.1)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: isCompact ? '10px' : '11px'
                            }}>×{item.quantity}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Full layout with price
    return (
        <div style={containerStyle}>
            {title && (
                <div style={headerStyle}>
                    <FiShoppingBag size={isCompact ? 12 : 14} />
                    {title}
                </div>
            )}

            <table style={{ ...tableStyle, width: '100%', minWidth: '180px' }}>
                <thead>
                    <tr style={{ background: 'rgba(124,92,191,0.03)' }}>
                        <th style={{ ...cellStyle, fontWeight: 600, color: '#6b7280', fontSize: '9px', textTransform: 'uppercase', padding: '3px 5px', whiteSpace: 'nowrap' }}>Product</th>
                        <th style={{ ...qtyStyle, fontWeight: 600, color: '#6b7280', fontSize: '9px', textTransform: 'uppercase', padding: '3px 5px', width: '40px' }}>Qty</th>
                        <th style={{ ...priceStyle, fontWeight: 600, color: '#6b7280', fontSize: '9px', textTransform: 'uppercase', padding: '3px 5px', width: '60px' }}>Price</th>
                        <th style={{ ...subtotalStyle, fontWeight: 600, color: '#6b7280', fontSize: '9px', textTransform: 'uppercase', padding: '3px 5px', width: '70px' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {parsedProducts.map((item, index) => (
                        <tr key={index} style={{ ...rowStyle, padding: '2px 0' }}>
                            <td style={{ ...cellStyle, padding: '2px 5px', fontSize: '11px' }}>
                                <div style={{ fontWeight: 500 }}>
                                    {item.product_name}
                                    {item.motor_brand && <span style={{ color: '#6366f1', fontSize: '10px', fontWeight: '700', marginLeft: '4px' }}>({item.motor_brand})</span>}
                                </div>
                            </td>
                            <td style={{ ...qtyStyle, padding: '2px 5px', fontSize: '11px' }}>×{item.quantity}</td>
                            <td style={{ ...priceStyle, padding: '2px 5px', fontSize: '10px' }}>
                                {item.price > 0 ? `₹${Math.round(item.price)}` : '-'}
                            </td>
                            <td style={{ ...subtotalStyle, padding: '2px 5px', fontSize: '10px' }}>
                                {item.price > 0 ? `₹${Math.round(item.quantity * item.price)}` : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showTotal && total > 0 && (
                <div style={{ ...totalStyle, padding: '4px 8px', fontSize: '11px' }}>
                    <span>Total:</span>
                    <span>₹{Math.round(total)}</span>
                </div>
            )}
        </div>
    );
};

export default ProductHistory;
