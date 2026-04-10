import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './Invoice.css';

const Invoice = () => {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showWhatsAppConfirm, setShowWhatsAppConfirm] = useState(false);

  useEffect(() => {
    if (complaintId) {
      generateInvoice();
    } else {
      setError('Invalid complaint ID');
      setLoading(false);
    }
  }, [complaintId]);

  const generateInvoice = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`generate-invoice/${encodeURIComponent(complaintId)}/`);

      if (response.status === 200 || response.status === 201) {
        setInvoiceData(response.data);
      }
    } catch (err) {
      console.error('Error generating invoice:', err);
      // Don't navigate away on error - just show the error message
      if (err.response?.status === 400) {
        setError(err.response.data.error || 'Cannot generate invoice for this job');
      } else if (err.response?.status === 404) {
        setError('Complaint not found');
      } else if (err.response?.status === 401) {
        setError('Please login to generate invoice');
      } else {
        setError(err.response?.data?.error || 'Failed to generate invoice. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (invoiceData?.invoice_number) {
      // Use the new download endpoint for proper filename
      const baseURL = api.defaults.baseURL.replace(/\/$/, ''); // Remove trailing slash
      const downloadUrl = `${baseURL}/download-invoice/${invoiceData.invoice_number}/`;

      // Open in new tab to trigger download with proper filename from server
      window.open(downloadUrl, '_blank');
    }
  };

  const handleSendViaWhatsApp = () => {
    setShowWhatsAppConfirm(true);
  };

  const confirmWhatsApp = () => {
    if (invoiceData?.pdf_url && invoiceData?.customer_phone) {
      // For relative URLs, add the base URL with https://
      let fullPdfUrl = invoiceData.pdf_url;
      if (!fullPdfUrl.startsWith('http')) {
        fullPdfUrl = `https://localhost:8000${fullPdfUrl}`;
      }
      // Ensure URL uses https://
      fullPdfUrl = fullPdfUrl.replace('http://', 'https://');

      // Phone sanitization: Remove all non-numeric characters
      const phone = invoiceData.customer_phone.replace(/\D/g, '');

      if (!phone || phone.length < 10) {
        window.alert("Invalid customer phone number. Cannot send WhatsApp message.");
        return;
      }

      // Add India country code if not already present
      const phoneWithCountryCode = phone.startsWith('91') ? phone : '91' + phone;

      // Create WhatsApp message - ensure URL is on its own line with no trailing punctuation
      const message = `Hello,\nYour service has been completed.\n\nDownload your invoice here:\n${fullPdfUrl}`;

      // Encode message for WhatsApp URL
      const encodedMessage = encodeURIComponent(message);

      // Use wa.me format with country code and encoded message
      const whatsappUrl = `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
      setShowWhatsAppConfirm(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="invoice-container">
        <div className="invoice-loading">
          <div className="spinner"></div>
          <p>Generating Invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-container">
        <div className="invoice-error">
          <div className="error-icon">⚠️</div>
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn-back" onClick={handleGoBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-container">
      <div className="invoice-card">
        <div className="invoice-header">
          <h1>🧾 Invoice Generated</h1>
          <p className="invoice-number">{invoiceData?.invoice_number}</p>
        </div>

        <div className="invoice-details">
          <div className="detail-row">
            <span className="label">Complaint ID:</span>
            <span className="value">{complaintId}</span>
          </div>
          <div className="detail-row">
            <span className="label">Customer Phone:</span>
            <span className="value">{invoiceData?.customer_phone}</span>
          </div>
        </div>

        <div className="invoice-actions">
          <button className="btn-download" onClick={handleDownloadPDF}>
            📥 Download PDF
          </button>

          <button className="btn-whatsapp" onClick={handleSendViaWhatsApp}>
            💬 Send via WhatsApp
          </button>
        </div>

        <button className="btn-back-secondary" onClick={handleGoBack}>
          ← Back to Job
        </button>
      </div>

      {/* WhatsApp Confirmation Modal */}
      {showWhatsAppConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm WhatsApp Share</h3>
            <p>Invoice link ready. Please confirm before sending.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowWhatsAppConfirm(false)}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={confirmWhatsApp}>
                Send to WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;
