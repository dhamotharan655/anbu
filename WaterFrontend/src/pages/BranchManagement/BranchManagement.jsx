import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useGlobalRefresh } from '../../context/GlobalRefreshContext';
import './BranchManagement.css';
import { FiMapPin, FiPhone, FiPlus, FiEdit, FiTrash2, FiActivity, FiBriefcase, FiGrid } from 'react-icons/fi';

const BranchManagement = () => {
    const { branches, fetchBranches } = useGlobalRefresh();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        contact_number: '',
        whatsapp_number: ''
    });
    const [editingId, setEditingId] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await axios.put(`${API_BASE_URL}branches/${editingId}/update/`, formData);
            } else {
                await axios.post(`${API_BASE_URL}branches/create/`, formData);
            }
            setFormData({ name: '', location: '', contact_number: '', whatsapp_number: '' });
            setEditingId(null);
            fetchBranches();
        } catch (error) {
            console.error('Error saving branch:', error);
            alert('Failed to save branch. Please check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (branch) => {
        setEditingId(branch.branch_id);
        setFormData({
            name: branch.name || '',
            location: branch.location || '',
            contact_number: branch.contact_number || '',
            whatsapp_number: branch.whatsapp_number || ''
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (branchId) => {
        if (!window.confirm('Are you sure you want to deactivate this branch?')) return;
        
        try {
            await axios.delete(`${API_BASE_URL}branches/${branchId}/delete/`);
            fetchBranches();
        } catch (error) {
            console.error('Error deleting branch:', error);
            alert('Failed to delete branch.');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', location: '', contact_number: '', whatsapp_number: '' });
    };

    return (
        <div className="branch-management-container">
            {/* Page Header */}
            <header className="branch-page-header">
                <div className="header-icon-circle">
                    <FiActivity />
                </div>
                <div className="header-title-info">
                    <h2>Branch Network</h2>
                    <p>Manage your business locations and contact points</p>
                </div>
            </header>
            
            {/* Form Section */}
            <section className="branch-form-section glass-panel">
                <div className="section-header">
                    <div className="section-icon-box">
                        {editingId ? <FiEdit /> : <FiPlus />}
                    </div>
                    <h3>{editingId ? 'Modify Branch Details' : 'Register New Branch'}</h3>
                </div>

                <form onSubmit={handleSubmit} className="branch-form">
                    <div className="branch-form-grid">
                        <div className="form-group">
                            <label>Branch Identity *</label>
                            <div className="input-wrapper">
                                <FiBriefcase className="input-icon" />
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                    required 
                                    placeholder="e.g. Head Office, South Branch"
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Physical Location</label>
                            <div className="input-wrapper">
                                <FiMapPin className="input-icon" />
                                <input 
                                    type="text" 
                                    name="location" 
                                    value={formData.location} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g. Anna Nagar, Chennai"
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Official Contact (Call)</label>
                            <div className="input-wrapper">
                                <FiPhone className="input-icon" />
                                <input 
                                    type="text" 
                                    name="contact_number" 
                                    value={formData.contact_number} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g. +91 98765 43210"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>WhatsApp Number for Booking</label>
                            <div className="input-wrapper">
                                <span className="input-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>💬</span>
                                <input 
                                    type="text" 
                                    name="whatsapp_number" 
                                    value={formData.whatsapp_number} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g. 919876543210 (with country code)"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-actions">
                        <button type="submit" className="primary-btn" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <><div className="bm-spinner-mini"></div> Processing...</>
                            ) : (
                                <>{editingId ? <FiEdit /> : <FiPlus />} {editingId ? 'Update Branch' : 'Create Branch'}</>
                            )}
                        </button>
                        {editingId && (
                            <button type="button" className="secondary-btn" onClick={handleCancelEdit}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* List Section */}
            <section className="branch-list-section glass-panel">
                <div className="section-header">
                    <div className="section-icon-box">
                        <FiGrid />
                    </div>
                    <h3>Active Locations ({branches.length})</h3>
                </div>

                <div className="premium-table-container">
                    <table className="branch-table">
                        <thead>
                            <tr>
                                <th>Identity</th>
                                <th>Location & Contact</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branches.length > 0 ? (
                                branches.map((branch) => (
                                    <tr key={branch.branch_id} className="branch-row">
                                        <td data-label="Identity">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span className="branch-id-tag">#{branch.branch_id}</span>
                                                <span className="branch-name">{branch.name}</span>
                                            </div>
                                        </td>
                                        <td data-label="Location & Contact">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <div className="location-chip">
                                                    <FiMapPin size={12} /> {branch.location || 'Not Specified'}
                                                </div>
                                                <div className="location-chip" style={{ opacity: 0.8 }}>
                                                    <FiPhone size={12} /> Call: {branch.contact_number || 'No Contact'}
                                                </div>
                                                <div className="location-chip" style={{ opacity: 0.8 }}>
                                                    <span style={{ fontSize: '11px', marginRight: '4px' }}>💬</span> WA: {branch.whatsapp_number || 'No WhatsApp'}
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Actions">
                                            <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                                <button 
                                                    className="action-pill edit-pill" 
                                                    onClick={() => handleEdit(branch)}
                                                >
                                                    <FiEdit size={14} /> Edit
                                                </button>
                                                {branches.length > 1 && (
                                                    <button 
                                                        className="action-pill delete-pill" 
                                                        onClick={() => handleDelete(branch.branch_id)}
                                                    >
                                                        <FiTrash2 size={14} /> Deactivate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3">
                                        <div className="empty-state">
                                            <FiBriefcase size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                            <p>No branches configured. Use the form above to register a location.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default BranchManagement;
