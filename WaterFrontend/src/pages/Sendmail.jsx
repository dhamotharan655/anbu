import React, { useState } from "react";
import api from "../api";
import { FiMail, FiSend } from "react-icons/fi"; // Import Feather icons

const SendEmailScreen = () => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSendEmail = async () => {
    if (!to || !subject || !message) {
      return window.alert("Error: All fields are required");
    }

    try {
      const res = await api.post(`send-email/`, { to, subject, message });
      if (res.data.success) {
        window.alert("Success: Email sent successfully!");
        setTo("");
        setSubject("");
        setMessage("");
      } else {
        window.alert(`Error: ${res.data.error || "Failed to send email"}`);
      }
    } catch (err) {
      console.error(err);
      window.alert("Error: Failed to send email. Please check console for details.");
    }
  };

  const styles = {
    container: {
      flex: 1,
      padding: '20px',
      background: 'var(--gradient-bg, #f9f9f9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    },
    contentWrapper: {
      maxWidth: '600px',
      width: '100%',
      backgroundColor: 'var(--glass-bg-strong, #fff)',
      backdropFilter: 'var(--glass-blur, blur(20px))',
      padding: '2.5rem',
      borderRadius: 'var(--border-radius-xl, 24px)',
      boxShadow: 'var(--shadow-lg, 0 12px 36px rgba(11, 102, 120, 0.12))',
      border: '1px solid var(--glass-border, rgba(11, 102, 120, 0.15))',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: '24px',
      color: 'var(--color-primary, #0b6678)',
      fontFamily: 'var(--font-family-heading, sans-serif)',
    },
    input: {
      border: '1.5px solid var(--color-border, rgba(11, 102, 120, 0.12))',
      borderRadius: 'var(--border-radius-lg, 14px)',
      padding: '12px 16px',
      marginBottom: '15px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      width: '100%',
      boxSizing: 'border-box',
      fontSize: '15px',
      fontFamily: 'var(--font-family-sans, sans-serif)',
      outline: 'none',
      transition: 'all 0.2s ease',
    },
    textarea: { // Specific style for multiline input
      minHeight: '120px',
      resize: 'vertical',
    },
    button: {
      background: 'var(--gradient-primary, #0b6678)',
      padding: '16px',
      borderRadius: 'var(--border-radius-lg, 14px)',
      alignItems: 'center',
      cursor: 'pointer',
      border: 'none',
      width: '100%',
      fontSize: '16px',
      fontWeight: '700',
      color: '#fff',
      display: 'flex',
      justifyContent: 'center',
      boxShadow: 'var(--shadow-primary, 0 6px 20px rgba(11, 102, 120, 0.3))',
      transition: 'all 0.3s ease',
    },
    buttonText: {
      color: '#fff',
      fontSize: '16px',
      fontWeight: 'bold',
      marginLeft: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <h1 style={styles.title}>
          <FiMail style={{ marginRight: '10px' }} size={24} /> Send Email via Gmail
        </h1>

        <input
          type="email"
          placeholder="To (email)"
          style={styles.input}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <input
          type="text"
          placeholder="Subject"
          style={styles.input}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          placeholder="Message"
          style={{ ...styles.input, ...styles.textarea }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button style={styles.button} onClick={handleSendEmail}>
          <FiSend size={20} color="#fff" />
          <span style={styles.buttonText}>Send Email</span>
        </button>
      </div>
    </div>
  );
};

export default SendEmailScreen;