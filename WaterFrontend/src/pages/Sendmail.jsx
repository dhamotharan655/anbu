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
      flex: 1, // For web, consider minHeight: '100vh' if it's a full page
      padding: '20px',
      backgroundColor: '#f9f9f9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center', // Center content vertically and horizontally
      minHeight: '100vh',
    },
    contentWrapper: { // Added a wrapper to control max width
      maxWidth: '600px',
      width: '100%',
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '20px',
      color: '#333',
    },
    input: {
      border: '1px solid #ccc',
      borderRadius: '10px',
      padding: '10px',
      marginBottom: '15px',
      backgroundColor: '#fff',
      width: 'calc(100% - 22px)', // Adjust for padding and border
      boxSizing: 'border-box', // Include padding and border in the element's total width and height
      fontSize: '16px',
      outline: 'none',
    },
    textarea: { // Specific style for multiline input
      minHeight: '120px',
      resize: 'vertical',
    },
    button: {
      backgroundColor: '#4CAF50',
      paddingVertical: '15px',
      borderRadius: '10px',
      alignItems: 'center',
      cursor: 'pointer',
      border: 'none',
      width: '100%',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#fff',
      display: 'flex',
      justifyContent: 'center',
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