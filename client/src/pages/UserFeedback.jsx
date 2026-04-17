import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styles from './UserFeedback.module.css';

const UserFeedback = () => {
  const [formData, setFormData] = useState({
    type: 'feedback',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if(response.ok) {
        toast.success('Submitted successfully!');
        setFormData({ type: 'feedback', subject: '', message: '' });
      } else {
        toast.error(data.message || 'Error submitting');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Feedback & Complaints</h1>
      <p className={styles.subtitle}>We value your input. Let us know how we can improve.</p>

      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Type</label>
          <select name="type" className={styles.input} value={formData.type} onChange={handleChange}>
            <option value="feedback">Feedback</option>
            <option value="complaint">Complaint</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Subject</label>
          <input 
            type="text" 
            name="subject" 
            required 
            placeholder="What is this regarding?"
            className={styles.input} 
            value={formData.subject} 
            onChange={handleChange} 
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Message</label>
          <textarea 
            name="message" 
            required 
            rows="5"
            placeholder="Provide details..."
            className={styles.textarea} 
            value={formData.message} 
            onChange={handleChange} 
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default UserFeedback;
