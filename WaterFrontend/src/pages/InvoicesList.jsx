import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { FiFileText, FiSearch, FiDownload, FiMessageCircle, FiCalendar, FiUser, FiPhone, FiArrowLeft, FiEye, FiTrash2, FiPlus, FiEdit } from 'react-icons/fi';
import CreateEstimationModal from '../components/CreateEstimationModal';
import './InvoicesList.css';

const InvoicesList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'estimations'
  const [showEstimationModal, setShowEstimationModal] = useState(false);
  const [editEstimationData, setEditEstimationData] = useState(null);
  // Invoice Company Settings States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsData, setSettingsData] = useState({
    company_name: "Anbu Enterprises",
    company_address: "No 12, Main Road, Tuticorin",
    company_phone: "+91 9876543210",
    company_landline: "044 2345 6789",
    company_email: "contact@anbuenterprises.com",
    bank_name: "HDFC Bank",
    bank_branch: "Anna Nagar Branch",
    bank_acc_no: "50100234567890",
    bank_ifsc: "HDFC0001234",
    company_upi: "anbu@okaxis",
    company_gpay: "+91 9876543210",
    whatsapp_number: "",
    contact_phone: ""
  });

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await api.get('site-settings/');
      if (response.data) {
        setSettingsData({
          company_name: response.data.company_name || "Anbu Enterprises",
          company_address: response.data.company_address || "No 12, Main Road, Tuticorin",
          company_phone: response.data.company_phone || "+91 9876543210",
          company_landline: response.data.company_landline || "044 2345 6789",
          company_email: response.data.company_email || "contact@anbuenterprises.com",
          bank_name: response.data.bank_name || "HDFC Bank",
          bank_branch: response.data.bank_branch || "Anna Nagar Branch",
          bank_acc_no: response.data.bank_acc_no || "50100234567890",
          bank_ifsc: response.data.bank_ifsc || "HDFC0001234",
          company_upi: response.data.company_upi || "anbu@okaxis",
          company_gpay: response.data.company_gpay || "+91 9876543210",
          whatsapp_number: response.data.whatsapp_number || "",
          contact_phone: response.data.contact_phone || ""
        });
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      await api.post('site-settings/update/', settingsData);
      alert('Invoice and company settings updated successfully!');
      // Don't close modal anymore, it's a tab
    } catch (error) {
      console.error('Error saving site settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSettingsSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchQuery, invoices, activeTab]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('invoices/');
      // Backend might return estimations and invoices. 
      // is_initial might be True for estimations, but they have status='estimation'.
      // We accept them all into 'invoices' state and filter later.
      const nonInitialInvoices = (response.data || []).filter(invoice => 
        invoice.is_initial !== true || invoice.status === 'estimation'
      );
      setInvoices(nonInitialInvoices);
      setFilteredInvoices(nonInitialInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    const query = searchQuery ? searchQuery.toLowerCase() : '';
    
    // First filter by tab purely based on the first 3 letters of the invoice number
    let tabFiltered = invoices;
    if (activeTab === 'invoices') {
      tabFiltered = invoices.filter(inv => inv.invoice_number && inv.invoice_number.startsWith('INV'));
    } else if (activeTab === 'estimations') {
      tabFiltered = invoices.filter(inv => inv.invoice_number && inv.invoice_number.startsWith('EST'));
    }

    // Then filter by search query
    const searchFiltered = tabFiltered.filter(invoice => {
      return (
        invoice.customer_name?.toLowerCase().includes(query) ||
        invoice.customer_phone?.toLowerCase().includes(query) ||
        invoice.invoice_number?.toLowerCase().includes(query) ||
        invoice.complaint_no?.toLowerCase().includes(query)
      );
    });
    setFilteredInvoices(searchFiltered);
  };

  const handleDownloadPDF = (invoice, e) => {
    e.stopPropagation();
    if (invoice.invoice_number) {
      // Use the new download endpoint for proper filename
      const baseURL = api.defaults.baseURL.replace(/\/$/, ''); // Remove trailing slash
      const downloadUrl = `${baseURL}/download-invoice/${invoice.invoice_number}/`;

      // Open in new tab to trigger download with proper filename from server
      window.open(downloadUrl, '_blank');
    }
  };

  const handleDownloadEstimation = (invoice, e) => {
    e.stopPropagation();
    if (invoice.invoice_number) {
      const baseURL = api.defaults.baseURL.replace(/\/$/, ''); // Remove trailing slash
      const downloadUrl = `${baseURL}/download-estimation/${invoice.invoice_number}/`;
      window.open(downloadUrl, '_blank');
    }
  };

  const handleSendWhatsApp = (invoice, e) => {
    e.stopPropagation();
    if (invoice.invoice_pdf_url && invoice.customer_phone) {
      let fullPdfUrl = invoice.invoice_pdf_url;
      if (!fullPdfUrl.startsWith('http')) {
        fullPdfUrl = `https://localhost:8000${fullPdfUrl}`;
      }
      // Ensure URL uses https://
      fullPdfUrl = fullPdfUrl.replace('http://', 'https://');

      // Phone sanitization: Remove all non-numeric characters
      const phone = invoice.customer_phone.replace(/\D/g, '');

      if (!phone || phone.length < 10) {
        window.alert("Invalid customer phone number. Cannot send WhatsApp message.");
        return;
      }

      // Add India country code if not already present
      const phoneWithCountryCode = phone.startsWith('91') ? phone : '91' + phone;

      // Create WhatsApp message with customer name, complaint number, and clickable download link
      const message = `Hello ${invoice.customer_name || 'Customer'},

Your service request #${invoice.complaint_no || 'N/A'} has been completed by Anbu Enterprises.

Please find the invoice attached.

Thank you for choosing Anbu Enterprises!

Best regards,
Anbu Enterprises Team.

---
Your service has been completed.

Download your invoice here:
${fullPdfUrl}`;
      const encodedMessage = encodeURIComponent(message);

      // Use wa.me format with country code and encoded message
      window.open(`https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`, '_blank');
    }
  };

  const handleViewInvoice = (invoice) => {
    if (invoice.invoice_number && invoice.invoice_number.startsWith('EST')) {
      const baseURL = api.defaults.baseURL.replace(/\/$/, '');
      const downloadUrl = `${baseURL}/download-estimation/${invoice.invoice_number}/`;
      window.open(downloadUrl, '_blank');
    } else {
      navigate(`/invoice/${encodeURIComponent(invoice.complaint_no)}`);
    }
  };

  const handleEditEstimation = (invoice) => {
    setEditEstimationData(invoice);
    setShowEstimationModal(true);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="invoices-page">
        <div className="invoices-loading">
          <div className="spinner"></div>
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoices-page">
      {/* Hero Banner */}
      <div className="invoices-hero">
        <button className="back-button" onClick={handleBack}>
          <FiArrowLeft /> Back
        </button>

        <button className="settings-btn" onClick={() => setActiveTab('settings')}>
          ⚙️ Invoice Settings
        </button>

        <div className="hero-icon">🧾</div>
        <h1>Invoices</h1>
        <p className="hero-subtitle">View and manage all generated invoices</p>

        <div className="search-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, phone, or invoice number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button 
            className="settings-btn" 
            style={{ 
              position: 'relative', 
              top: 0, right: 0, 
              background: '#0ea5e9', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }} 
            onClick={() => setShowEstimationModal(true)}
          >
            <FiPlus /> Create Estimation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px', padding: '0 24px' }}>
        <button
          onClick={() => setActiveTab('invoices')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'invoices' ? '3px solid #0b6678' : '3px solid transparent',
            color: activeTab === 'invoices' ? '#0b6678' : '#6b7280',
            fontWeight: activeTab === 'invoices' ? 700 : 500,
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('estimations')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'estimations' ? '3px solid #0b6678' : '3px solid transparent',
            color: activeTab === 'estimations' ? '#0b6678' : '#6b7280',
            fontWeight: activeTab === 'estimations' ? 700 : 500,
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Estimations
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '3px solid #0b6678' : '3px solid transparent',
            color: activeTab === 'settings' ? '#0b6678' : '#6b7280',
            fontWeight: activeTab === 'settings' ? 700 : 500,
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Invoice Settings
        </button>
      </div>

      {/* Section Header */}
      <div className="section-header">
        <div className="section-title">
          {activeTab === 'invoices' ? 'All Invoices' : activeTab === 'estimations' ? 'All Estimations' : 'Invoice Settings'}
        </div>
        {activeTab !== 'settings' && (
          <div className="invoice-count">{filteredInvoices.length} {activeTab === 'invoices' ? 'invoice' : 'estimation'}{filteredInvoices.length !== 1 ? 's' : ''} found</div>
        )}
      </div>

      {/* Invoice Grid */}
      {/* Invoice Grid */}
      {activeTab !== 'settings' && (
        filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No {activeTab === 'invoices' ? 'invoices' : 'estimations'} found</h3>
            <p>{searchQuery ? 'Try a different search term' : `No ${activeTab === 'invoices' ? 'invoices' : 'estimations'} have been generated yet`}</p>
          </div>
        ) : (
          <div className="invoice-grid">
            {filteredInvoices.map((invoice, index) => (
              <div
                key={invoice.id}
                className="invoice-card"
                data-search={`${invoice.invoice_number} ${invoice.customer_name} ${invoice.customer_phone} ${invoice.complaint_no}`.toLowerCase()}
                onClick={() => handleViewInvoice(invoice)}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="card-header">
                  <div className="inv-number">{invoice.invoice_number}</div>
                  <div className="inv-date">
                    <FiCalendar size={12} />
                    {invoice.invoice_generated_at
                      ? new Date(invoice.invoice_generated_at).toLocaleDateString('en-GB')
                      : 'N/A'}
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <FiUser size={15} />
                    <span>{invoice.customer_name}</span>
                  </div>
                  <div className="info-row">
                    <FiPhone size={15} />
                    <span>{invoice.customer_phone}</span>
                  </div>
                  {invoice.status !== 'estimation' && (
                    <div className="info-row">
                      <FiFileText size={15} />
                      <span>Complaint: {invoice.complaint_no}</span>
                    </div>
                  )}

                  <div className="amount-row">
                    <span className="amount-label">Grand Total</span>
                    <span className="amount-value grand-total">₹{(invoice.grand_total || invoice.amount)?.toFixed(2) || '0.00'}</span>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewInvoice(invoice);
                      }}
                    >
                      <FiEye size={14} />
                      {activeTab === 'estimations' ? 'View Estimation' : 'View Invoice'}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => handleDownloadPDF(invoice, e)}
                      title="Download Invoice PDF"
                    >
                      <FiDownload size={15} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => handleDownloadEstimation(invoice, e)}
                      title="Download Estimation PDF"
                      style={{ color: '#d97706' }}
                    >
                      <FiFileText size={15} />
                    </button>
                    {activeTab === 'estimations' && (
                      <button
                        className="btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleEditEstimation(invoice); }}
                        title="Edit Estimation"
                        style={{ color: '#0ea5e9' }}
                      >
                        <FiEdit size={15} />
                      </button>
                    )}
                    <button
                      className="btn-icon btn-whatsapp"
                      onClick={(e) => handleSendWhatsApp(invoice, e)}
                      title="Send via WhatsApp"
                    >
                      <FiMessageCircle size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Settings Tab Content */}
      {activeTab === 'settings' && (
        <div className="settings-container" style={{ padding: '0 24px 40px', maxWidth: '800px', margin: '0 auto' }}>
          <div className="inv-modal-card" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.08)', animation: 'none' }}>
            <div className="inv-modal-header" style={{ background: '#f8fafc' }}>
              <h3>Edit Company &amp; Bank Details</h3>
            </div>
            
            {settingsLoading ? (
              <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="spinner"></div>
                <p>Loading invoice settings...</p>
              </div>
            ) : (
              <form onSubmit={saveSettings}>
                <div className="inv-modal-body" style={{ maxHeight: 'none', overflowY: 'visible' }}>
                  <div className="inv-form-grid">
                    
                    {/* Company Name */}
                    <div className="inv-form-group full-width">
                      <label>Company Name</label>
                      <input 
                        type="text" 
                        className="inv-form-input" 
                        value={settingsData.company_name} 
                        onChange={(e) => setSettingsData({...settingsData, company_name: e.target.value})} 
                        required 
                      />
                    </div>
                    
                    {/* Address */}
                    <div className="inv-form-group full-width">
                      <label>Company Address</label>
                      <input 
                        type="text" 
                        className="inv-form-input" 
                        value={settingsData.company_address} 
                        onChange={(e) => setSettingsData({...settingsData, company_address: e.target.value})} 
                        required 
                      />
                    </div>
                    
                    {/* Phone & Landline */}
                    <div className="inv-form-group">
                      <label>Office Phone</label>
                      <input 
                        type="text" 
                        className="inv-form-input" 
                        value={settingsData.company_phone} 
                        onChange={(e) => setSettingsData({...settingsData, company_phone: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="inv-form-group">
                      <label>Landline Phone</label>
                      <input 
                        type="text" 
                        className="inv-form-input" 
                        value={settingsData.company_landline} 
                        onChange={(e) => setSettingsData({...settingsData, company_landline: e.target.value})} 
                      />
                    </div>
                    
                    {/* Email & GST/Other */}
                    <div className="inv-form-group full-width">
                      <label>Company Email</label>
                      <input 
                        type="email" 
                        className="inv-form-input" 
                        value={settingsData.company_email} 
                        onChange={(e) => setSettingsData({...settingsData, company_email: e.target.value})} 
                        required 
                      />
                    </div>
                    
                    {/* Divider */}
                    <div className="inv-form-group full-width" style={{ borderTop: '1px dashed rgba(11, 102, 120, 0.15)', margin: '8px 0' }}></div>
                    <h4 className="inv-form-group full-width" style={{ margin: '0 0 8px 0', color: 'var(--primary)', textAlign: 'left' }}>Bank Details</h4>
                    
                    {/* Bank Name & Branch */}
                    <div className="inv-form-group">
                      <label>Bank Name</label>
                      <input 
                        type="text" 
                        className="inv-form-input" 
                        value={settingsData.bank_name} 
                        onChange={(e) => setSettingsData({...settingsData, bank_name: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="inv-form-group">
                      <label>Branch Name</label>
                      <input 
                        type="text" 
                        className="inv-form-input" 
                        value={settingsData.bank_branch} 
                        onChange={(e) => setSettingsData({...settingsData, bank_branch: e.target.value})} 
                        required 
                      />
                    </div>
                    
                    {/* Acc No & IFSC */}
                    <div className="inv-form-group">
                      <label>Account Number</label>
                      <input 
                        type="text" 
                        className="inv-form-input" 
                        value={settingsData.bank_acc_no} 
                        onChange={(e) => setSettingsData({...settingsData, bank_acc_no: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="inv-form-group">
                      <label>IFSC Code</label>
                      <input 
                        type="text" 
                        className="inv-form-input" 
                        value={settingsData.bank_ifsc} 
                        onChange={(e) => setSettingsData({...settingsData, bank_ifsc: e.target.value})} 
                        required 
                      />
                    </div>
                    
                    {/* UPI & GPay */}
                    <div className="inv-form-group">
                      <label>UPI ID</label>
                      <input 
                        type="text" 
                        className="inv-form-input" 
                        value={settingsData.company_upi} 
                        onChange={(e) => setSettingsData({...settingsData, company_upi: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="inv-form-group">
                      <label>GPay Number</label>
                      <input 
                        type="text" 
                        className="inv-form-input" 
                        value={settingsData.company_gpay} 
                        onChange={(e) => setSettingsData({...settingsData, company_gpay: e.target.value})} 
                        required 
                      />
                    </div>
                    
                  </div>
                </div>
                
                <div className="inv-modal-footer" style={{ background: '#f8fafc' }}>
                  <button type="submit" className="inv-btn inv-btn-primary" disabled={settingsSaving} style={{ marginLeft: 'auto', minWidth: '150px' }}>
                    {settingsSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showEstimationModal && (
        <CreateEstimationModal 
          onClose={() => {
            setShowEstimationModal(false);
            setEditEstimationData(null);
          }} 
          onCreated={fetchInvoices} 
          editData={editEstimationData}
        />
      )}
    </div>
  );
};

export default InvoicesList;
