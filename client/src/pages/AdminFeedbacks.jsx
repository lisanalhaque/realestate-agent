import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import styles from './AdminFeedbacks.module.css';
import { MessageSquare, AlertCircle } from 'lucide-react';

const AdminFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/feedbacks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if(response.ok) {
        setFeedbacks(data.data || []);
      } else {
        toast.error('Failed to load feedbacks');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch from server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading feedbacks...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>System Feedback</h1>
      <p className={styles.subtitle}>Review user thoughts and complaints.</p>

      <div className={styles.list}>
        {feedbacks.length === 0 ? (
          <p className={styles.noData}>No feedback items found.</p>
        ) : (
          feedbacks.map(f => (
            <div key={f._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.typeBadge}>
                  {f.type === 'complaint' ? <AlertCircle size={18} color="#ef4444" /> : <MessageSquare size={18} color="#3b82f6" />}
                  <span style={{ textTransform: 'capitalize', color: f.type === 'complaint' ? '#ef4444' : '#3b82f6' }}>{f.type}</span>
                </div>
                <span className={styles.date}>{new Date(f.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className={styles.subject}>{f.subject}</h3>
              <p className={styles.message}>{f.message}</p>
              <div className={styles.userInfo}>
                <span className={styles.username}>From: {f.userId?.name || 'Unknown User'}</span>
                <span className={styles.status}>Status: {f.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminFeedbacks;
