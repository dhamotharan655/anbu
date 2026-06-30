/**
 * Test file for WhatsApp utility functions
 * 
 * This file contains tests to verify the functionality of the WhatsApp utility functions.
 * These tests ensure that the functions work correctly and handle edge cases properly.
 */

import {
  normalizePhoneNumber,
  generateWhatsAppLink,
  generateDefaultMessage,
  generateWhatsAppLinkWithDefaultMessage,
  openWhatsApp,
  openWhatsAppWithDefaultMessage
} from './whatsappUtils';

// Mock window.open to prevent actual browser navigation during tests
const originalOpen = window.open;
beforeEach(() => {
  window.open = jest.fn();
});

afterEach(() => {
  window.open = originalOpen;
});

describe('WhatsApp Utility Functions', () => {
  describe('normalizePhoneNumber', () => {
    it('should normalize Indian phone numbers correctly', () => {
      expect(normalizePhoneNumber('9876543210')).toBe('919876543210');
      expect(normalizePhoneNumber('09876543210')).toBe('919876543210');
      expect(normalizePhoneNumber('+919876543210')).toBe('919876543210');
      expect(normalizePhoneNumber('919876543210')).toBe('919876543210');
    });

    it('should handle numbers with spaces and special characters', () => {
      expect(normalizePhoneNumber('9876 543 210')).toBe('919876543210');
      expect(normalizePhoneNumber('+91 9876 543 210')).toBe('919876543210');
      expect(normalizePhoneNumber('9876-543-210')).toBe('919876543210');
      expect(normalizePhoneNumber('+91-9876-543-210')).toBe('919876543210');
    });

    it('should handle empty or invalid input', () => {
      expect(normalizePhoneNumber('')).toBe('');
      expect(normalizePhoneNumber(null)).toBe('');
      expect(normalizePhoneNumber(undefined)).toBe('');
    });
  });

  describe('generateWhatsAppLink', () => {
    it('should generate correct WhatsApp link', () => {
      const link = generateWhatsAppLink('9876543210', 'Hello World');
      expect(link).toBe('https://wa.me/919876543210?text=Hello%20World');
    });

    it('should generate link without message', () => {
      const link = generateWhatsAppLink('9876543210');
      expect(link).toBe('https://wa.me/919876543210');
    });

    it('should handle special characters in message', () => {
      const link = generateWhatsAppLink('9876543210', 'Hello & Welcome!');
      expect(link).toBe('https://wa.me/919876543210?text=Hello%20%26%20Welcome%21');
    });
  });

  describe('generateDefaultMessage', () => {
    it('should generate default service message', () => {
      const message = generateDefaultMessage('John Doe', 'WP-COMP-0001');
      expect(message).toBe('Hello John Doe,\n\nYour service request #WP-COMP-0001 has been completed by Anbu Enterprises.\n\nPlease find the invoice attached.\n\nThank you for choosing Anbu Enterprises!\n\nBest regards,\nAnbu Enterprises Team. ');
    });
  });

  describe('generateWhatsAppLinkWithDefaultMessage', () => {
    it('should generate link with default message', () => {
      const link = generateWhatsAppLinkWithDefaultMessage('9876543210', 'John Doe', 'WP-COMP-0001');
      const expectedMessage = encodeURIComponent('Hello John Doe,\n\nYour service request #WP-COMP-0001 has been completed by Anbu Enterprises.\n\nPlease find the invoice attached.\n\nThank you for choosing Anbu Enterprises!\n\nBest regards,\nAnbu Enterprises Team. ');
      expect(link).toBe(`https://wa.me/919876543210?text=${expectedMessage}`);
    });
  });

  describe('openWhatsApp', () => {
    it('should open WhatsApp link in new tab', () => {
      openWhatsApp('9876543210', 'Hello World');
      expect(window.open).toHaveBeenCalledWith('https://wa.me/919876543210?text=Hello%20World', '_blank');
    });

    it('should open WhatsApp link without message', () => {
      openWhatsApp('9876543210');
      expect(window.open).toHaveBeenCalledWith('https://wa.me/919876543210', '_blank');
    });
  });

  describe('openWhatsAppWithDefaultMessage', () => {
    it('should open WhatsApp with default message', () => {
      openWhatsAppWithDefaultMessage('9876543210', 'John Doe', 'WP-COMP-0001');
      const expectedMessage = encodeURIComponent('Hello John Doe,\n\nYour service request #WP-COMP-0001 has been completed by Anbu Enterprises.\n\nPlease find the invoice attached.\n\nThank you for choosing Anbu Enterprises!\n\nBest regards,\nAnbu Enterprises Team. ');
      expect(window.open).toHaveBeenCalledWith(`https://wa.me/919876543210?text=${expectedMessage}`, '_blank');
    });
  });
});