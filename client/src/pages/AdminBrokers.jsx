import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Shield, Trash2, Check, X } from 'lucide-react';
import styles from './Clients.module.css';

const AdminBrokers = () => {
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBrokers = async () => {
    try {
      const res = await api.get('/admin/brokers');
      setBrokers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/admin/brokers/${id}/status`, { isActive: status });
      fetchBrokers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this broker completely?")) {
      await api.delete(`/admin/brokers/${id}`);
      fetchBrokers();
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Brokers</h1>
          <p className="page-subtitle">Verify, accept or reject brokers joining the system.</p>
        </div>
      </div>
      <div className="card">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Broker Name</th>
              <th>Email</th>
              <th>System Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brokers.length === 0 && <tr><td colSpan="4">No brokers found.</td></tr>}
            {brokers.map(b => (
              <tr key={b._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={styles.clientAvatar}>{b.name.charAt(0)}</div>
                    <span style={{ fontWeight: 'bold' }}>{b.name}</span>
                  </div>
                </td>
                <td>{b.email}</td>
                <td>
                  <span className={`badge ${b.isActive ? 'badge-success' : 'badge-warning'}`}>
                    {b.isActive ? 'Verified / Active' : 'Pending Verification'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '16px' }}>
                  <button onClick={() => window.location.href = `/admin/brokers/${b._id}/dashboard`} className="btn-primary" style={{ padding: '6px 12px' }}>View Portal</button>
                  {!b.isActive ? (
                    <button onClick={() => handleStatus(b._id, true)} className="btn-success" style={{ padding: '6px 12px' }}><Check size={16} /> Accept</button>
                  ) : (
                    <button onClick={() => handleStatus(b._id, false)} className="btn-warning" style={{ padding: '6px 12px' }}><X size={16} /> Disable</button>
                  )}
                  <button onClick={() => handleDelete(b._id)} className="btn-icon danger" title="Delete"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminBrokers;
