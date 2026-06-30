import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../api';

const CreateEstimationModal = ({ onClose, onCreated, editData }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [items, setItems] = useState([{ name: '', qty: 1, selling_price: '' }]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (editData) {
      setCustomerName(editData.customer_name || '');
      setPhone(editData.customer_phone || '');
      setAddress(editData.address || '');
      try {
        if (editData.product_name) {
          const parsed = JSON.parse(editData.product_name);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed.map(item => ({
              name: item.name,
              qty: item.quantity || 1,
              selling_price: item.selling_price || 0
            })));
          }
        }
      } catch (e) {
        console.error("Failed to parse editData items", e);
      }
    }

    // Fetch products/services for autocomplete
    const fetchSuggestions = async () => {
      try {
        const [servicesRes, stocksRes] = await Promise.all([
          api.get('services/').catch(() => ({ data: [] })),
          api.get('stocks/').catch(() => ({ data: [] }))
        ]);
        
        const services = Array.isArray(servicesRes.data) ? servicesRes.data.map(s => ({ name: s.name, price: s.price })) : [];
        const stocks = Array.isArray(stocksRes.data) ? stocksRes.data.map(s => ({ name: s.name, price: s.selling_price })) : [];
        
        setSuggestions([...services, ...stocks]);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    };
    fetchSuggestions();
  }, []);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-fill price if name matches a suggestion
    if (field === 'name') {
      const match = suggestions.find(s => s.name.toLowerCase() === value.toLowerCase());
      if (match && match.price) {
        // Only parse if it's a number, some prices are strings like "Contact for pricing"
        const priceNum = parseFloat(String(match.price).replace(/[^0-9.]/g, ''));
        if (!isNaN(priceNum)) {
          newItems[index].selling_price = priceNum;
        }
      }
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', qty: 1, selling_price: '' }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !phone) {
      alert("Customer name and phone are required");
      return;
    }
    
    const validItems = items.filter(i => i.name.trim() !== '');
    if (validItems.length === 0) {
      alert("Add at least one item");
      return;
    }

    try {
      setLoading(true);
      
      let res;
      if (editData && editData.invoice_number) {
        res = await api.put(`edit-manual-estimation/${editData.invoice_number}/`, {
          customer_name: customerName,
          phone,
          address,
          items: validItems
        });
      } else {
        res = await api.post('generate-manual-estimation/', {
          customer_name: customerName,
          phone,
          address,
          items: validItems
        });
      }
      
      const baseURL = api.defaults.baseURL.replace(/\/$/, '');
      const downloadUrl = `${baseURL}/download-estimation/${res.data.invoice_number}/`;
      window.open(downloadUrl, '_blank');
      
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to generate estimation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="est-modal-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px'
    }}>
      <div className="est-modal-content" style={{
        background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, color: '#0b6678', fontSize: '1.25rem', textAlign: 'left', flex: 1 }}>
            {editData ? 'Edit Manual Estimation' : 'Create Manual Estimation'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#666', padding: '4px' }}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600, color: '#374151' }}>Customer Name *</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600, color: '#374151' }}>Phone *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600, color: '#374151' }}>Address (Optional)</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem', resize: 'vertical' }} />
          </div>

          <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, color: '#374151', fontSize: '0.95rem' }}>Items</h4>
              <button type="button" onClick={addItem} style={{
                background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600
              }}>
                <FiPlus /> Add Item
              </button>
            </div>
            
            {items.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 36px', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Item Name" 
                  value={item.name} 
                  onChange={e => handleItemChange(index, 'name', e.target.value)}
                  list="estimation-suggestions"
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', width: '100%' }}
                />
                <input 
                  type="number" 
                  placeholder="Qty" 
                  value={item.qty} 
                  onChange={e => handleItemChange(index, 'qty', e.target.value)}
                  min="1"
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', width: '100%' }}
                />
                <input 
                  type="number" 
                  placeholder="Price (₹)" 
                  value={item.selling_price} 
                  onChange={e => handleItemChange(index, 'selling_price', e.target.value)}
                  min="0"
                  step="0.01"
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', width: '100%' }}
                />
                <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1}
                  style={{ background: 'none', border: 'none', color: items.length === 1 ? '#ccc' : '#ef4444', cursor: items.length === 1 ? 'not-allowed' : 'pointer', padding: '8px' }}>
                  <FiTrash2 />
                </button>
              </div>
            ))}
            
            <datalist id="estimation-suggestions">
              {suggestions.map((s, i) => (
                <option key={i} value={s.name} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '6px', color: '#4b5563', fontWeight: 600, cursor: 'pointer'
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '10px', background: '#0b6678', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Processing...' : (editData ? 'Update Estimation' : 'Generate Estimation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEstimationModal;
