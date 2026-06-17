/**
 * WhatsApp Utility Functions
 * 
 * This module provides utility functions for generating WhatsApp links.
 * These functions are completely isolated and do not modify any existing code.
 * 
 * Features:
 * - Accepts customer phone number and message text
 * - Normalizes number to include country code (India = 91)
 * - Removes spaces, +, or special characters
 * - URL encodes the message
 * - Generates link using https://wa.me/<number>?text=<encoded_message>
 * 
 * Usage:
 * - Open link in new tab
 * - Do NOT auto-send message
 * - Do NOT auto-attach files
 * - Admin manually attaches invoice and presses send
 */

/**
 * Normalize phone number for WhatsApp
 * @param {string} phoneNumber - Raw phone number input
 * @returns {string} - Normalized phone number with country code
 */
export const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';

  // Remove all non-digit characters except leading +
  let normalized = phoneNumber.replace(/[^\d+]/g, '');

  // Remove leading + if present
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }

  // Remove leading 0 if present (common in Indian numbers)
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }

  // Add India country code (91) if not already present
  if (!normalized.startsWith('91')) {
    normalized = '91' + normalized;
  }

  return normalized;
};

/**
 * Generate WhatsApp link
 * @param {string} phoneNumber - Customer phone number
 * @param {string} message - Message text to send
 * @returns {string} - WhatsApp link
 */
export const generateWhatsAppLink = (phoneNumber, message = '') => {
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${normalizedNumber}${message ? `?text=${encodedMessage}` : ''}`;
};

/**
 * Generate default service message
 * @param {string} customerName - Customer's name
 * @param {string} complaintNo - Service complaint number
 * @returns {string} - Default message text
 */
export const generateDefaultMessage = (customerName, complaintNo) => {
  return `Hello ${customerName},\n\nYour service request #${complaintNo} has been completed by Ruban Electricals.\n\nPlease find the invoice attached.\n\nThank you for choosing Ruban Electricals!\n\nBest regards,\nRuban Electricals Team. `;
};

/**
 * Generate booking confirmation message
 * @param {string} customerName - Customer's name
 * @param {string} complaintNo - Service complaint number
 * @param {string} productName - Product/Service name
 * @param {string} serviceType - Service type
 * @param {string} date - Booking date
 * @returns {string} - Booking confirmation message text
 */
export const generateBookingMessage = (customerName, complaintNo, productName, serviceType, date) => {
  return `Hello ${customerName},\n\nYour service request has been successfully booked.\n\nComplaint No: ${complaintNo}\nProduct: ${productName}\nService Type: ${serviceType}\nDate: ${date}\n\nOur technician will contact you shortly.\n\nThank you,\nRuban Electricals`;
};

/**
 * Generate staff assignment message with complaint details and location
 * @param {string} staffName - Staff member's name
 * @param {string} complaintNo - Service complaint number
 * @param {string} customerName - Customer's name
 * @param {string} complaintDetails - Details of the complaint
 * @param {string} customerPhone - Customer's phone number
 * @param {string} customerAddress - Customer's address
 * @returns {string} - Staff assignment message text
 */
export const generateStaffAssignmentMessage = (staffName, complaintNo, customerName, complaintDetails, customerPhone, customerAddress) => {
  return `Hello ${staffName},\n\nA new service complaint has been assigned to you.\n\nComplaint ID: ${complaintNo}\nCustomer Name: ${customerName}\nComplaint Details: ${complaintDetails}\nContact Number: ${customerPhone}\nAddress: ${customerAddress}\n\nPlease attend at the earliest.\n\nRuban Electricals - Your Trusted Partner`;
};

/**
 * Generate WhatsApp link with default message
 * @param {string} phoneNumber - Customer phone number
 * @param {string} customerName - Customer's name
 * @param {string} complaintNo - Service complaint number
 * @returns {string} - WhatsApp link with default message
 */
export const generateWhatsAppLinkWithDefaultMessage = (phoneNumber, customerName, complaintNo) => {
  const defaultMessage = generateDefaultMessage(customerName, complaintNo);
  return generateWhatsAppLink(phoneNumber, defaultMessage);
};

/**
 * Open WhatsApp in new tab
 * @param {string} phoneNumber - Customer phone number
 * @param {string} message - Message text (optional)
 */
export const openWhatsApp = (phoneNumber, message = '') => {
  const link = generateWhatsAppLink(phoneNumber, message);
  window.open(link, '_blank');
};

/**
 * Open WhatsApp with default message in new tab
 * @param {string} phoneNumber - Customer phone number
 * @param {string} customerName - Customer's name
 * @param {string} complaintNo - Service complaint number
 */
export const openWhatsAppWithDefaultMessage = (phoneNumber, customerName, complaintNo) => {
  const link = generateWhatsAppLinkWithDefaultMessage(phoneNumber, customerName, complaintNo);
  window.open(link, '_blank');
};

// Export all functions as default for easy import
export default {
  normalizePhoneNumber,
  generateWhatsAppLink,
  generateDefaultMessage,
  generateStaffAssignmentMessage,
  generateWhatsAppLinkWithDefaultMessage,
  openWhatsApp,
  openWhatsAppWithDefaultMessage
};
