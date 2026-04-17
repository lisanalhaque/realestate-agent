import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Shield, Trash2, Check, X, User as UserIcon } from 'lucide-react';
import styles from './Clients.module.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatus = async (id, status) => {
    // Re-use broker status endpoint since it just updates User schema isActive
    try {
      await api.put(`/admin/brokers/${id}/status`, { isActive: status });
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this user completely?")) {
      // Re-use delete API since it deletes the User by ID
      await api.delete(`/admin/brokers/${id}`);
      fetchUsers();
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Standard Users</h1>
          <p className="page-subtitle">View and moderate all regular user accounts on the platform.</p>
        </div>
      </div>
      <div className="card">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>System Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan="4">No users found.</td></tr>}
            {users.map(u => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={styles.clientAvatar}>
                      {u.avatar ? <img src={u.avatar} alt="avatar" style={{width: '32px', height: '32px', borderRadius: '50%'}} /> : <UserIcon size={16} />}
                    </div>
                    <span style={{ fontWeight: 'bold' }}>{u.name}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-warning'}`}>
                    {u.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '16px' }}>
                  {!u.isActive ? (
                    <button onClick={() => handleStatus(u._id, true)} className="btn-success" style={{ padding: '6px 12px' }}><Check size={16} /> Activate</button>
                  ) : (
                    <button onClick={() => handleStatus(u._id, false)} className="btn-warning" style={{ padding: '6px 12px' }}><X size={16} /> Suspend</button>
                  )}
                  <button onClick={() => handleDelete(u._id)} className="btn-icon danger" title="Delete"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
