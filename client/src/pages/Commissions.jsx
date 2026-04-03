import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { DollarSign, CheckCircle, Clock, FileText } from 'lucide-react';
import styles from './Commissions.module.css';

const Commissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [commRes, summaryRes] = await Promise.all([
        api.get('/commissions'),
        api.get('/commissions/summary')
      ]);
      setCommissions(commRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch commission data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    if (user.role === 'agent') return; // Agents cannot change status
    try {
      await api.put(`/commissions/${id}/status`, { status: newStatus });
      fetchData(); // Refresh to update summary totals as well
    } catch (error) {
      console.error('Failed to update commission status', error);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Commissions</h1>
          <p className="page-subtitle">Track your earnings and payouts</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.teal}`}>
            <DollarSign size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Earned</p>
            <p className={styles.statValue}>{formatCurrency(summary.total)}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Paid Out</p>
            <p className={styles.statValue}>{formatCurrency(summary.paid)}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orange}`}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Pending</p>
            <p className={styles.statValue}>{formatCurrency(summary.pending)}</p>
          </div>
        </div>
      </div>

      <div className={`card ${styles.historySection}`}>
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}>Payout History</h2>
        </div>
        
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : commissions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <FileText size={32} />
            </div>
            <h3 className="empty-title">No commissions yet</h3>
            <p className="empty-subtitle">Close a deal to start generating commissions.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Deal Reference</th>
                  <th>Agent</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((comm) => (
                  <tr key={comm._id}>
                    <td>
                      <div className={styles.dealCell}>
                        Deal #{comm.deal?._id.toString().slice(-6).toUpperCase() || 'N/A'}
                      </div>
                      <div className={styles.dealSubText}>
                        Value: {formatCurrency(comm.deal?.dealValue)} @ {comm.deal?.commissionRate}%
                      </div>
                    </td>
                    <td className={styles.agentCell}>
                      {comm.agent?.name || 'Unknown'}
                    </td>
                    <td>
                      <div className={styles.commCell}>{formatCurrency(comm.agentShare)}</div>
                      <div className={styles.commSubText}>Total: {formatCurrency(comm.totalCommission)}</div>
                    </td>
                    <td>
                      {user.role === 'agent' ? (
                        <span className={`badge ${styles.statusSelect} ${styles[comm.status]}`}>
                          {comm.status}
                        </span>
                      ) : (
                        <select 
                          className={`${styles.statusSelect} ${styles[comm.status]}`}
                          value={comm.status}
                          onChange={(e) => handleStatusChange(comm._id, e.target.value)}
                        >
                          <option value="pending" className={styles.statusOption}>Pending</option>
                          <option value="approved" className={styles.statusOption}>Approved</option>
                          <option value="paid" className={styles.statusOption}>Paid</option>
                        </select>
                      )}
                    </td>
                    <td className={styles.dateCell}>
                      {comm.status === 'paid' && comm.paidAt 
                        ? new Date(comm.paidAt).toLocaleDateString()
                        : new Date(comm.createdAt).toLocaleDateString()
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Commissions;
