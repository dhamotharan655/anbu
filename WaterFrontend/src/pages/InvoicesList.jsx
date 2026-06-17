import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { FiFileText, FiSearch, FiDownload, FiMessageCircle, FiCalendar, FiUser, FiPhone, FiArrowLeft, FiEye, FiTrash2 } from 'react-icons/fi';
import './InvoicesList.css';

const InvoicesList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchQuery, invoices]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('invoices/');
      // ⭐ FEATURE 5: Exclude initial records from invoice flow
      const nonInitialInvoices = (response.data || []).filter(invoice => invoice.is_initial !== true);
      setInvoices(nonInitialInvoices);
      setFilteredInvoices(nonInitialInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    if (!searchQuery.trim()) {
      setFilteredInvoices(invoices);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = invoices.filter(invoice => {
      return (
        invoice.customer_name?.toLowerCase().includes(query) ||
        invoice.customer_phone?.toLowerCase().includes(query) ||
        invoice.invoice_number?.toLowerCase().includes(query) ||
        invoice.complaint_no?.toLowerCase().includes(query)
      );
    });
    setFilteredInvoices(filtered);
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
    navigate(`/invoice/${encodeURIComponent(invoice.complaint_no)}`);
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
      </div>

      {/* Section Header */}
      <div className="section-header">
        <div className="section-title">All Invoices</div>
        <div className="invoice-count">{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found</div>
      </div>

      {/* Invoice Grid */}
      {filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No invoices found</h3>
          <p>{searchQuery ? 'Try a different search term' : 'No invoices have been generated yet'}</p>
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
                <div className="info-row">
                  <FiFileText size={15} />
                  <span>Complaint: {invoice.complaint_no}</span>
                </div>

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
                    View Invoice
                  </button>
                  <button
                    className="btn-icon"
                    onClick={(e) => handleDownloadPDF(invoice, e)}
                    title="Download PDF"
                  >
                    <FiDownload size={15} />
                  </button>
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
      )}
    </div>
  );
};

export default InvoicesList;
