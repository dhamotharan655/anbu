import React from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, children, title, maxWidth = '900px' }) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: maxWidth,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {title && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1.5px solid #E5E7EB'
          }}>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '20px',
              fontWeight: 700,
              color: '#1E1B4B',
              margin: 0
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}
              onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              <FiX size={20} />
            </button>
          </div>
        )}
        
        {/* Modal Content */}
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
