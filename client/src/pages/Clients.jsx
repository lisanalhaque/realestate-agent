import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Users, Mail, Phone, Trash2 } from 'lucide-react';
import styles from './Clients.module.css';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', type: 'buyer', budget: '', requirements: ''
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await api.delete(`/clients/${id}`);
        setClients(clients.filter(c => c._id !== id));
      } catch (error) {
        console.error('Failed to delete client', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      setShowModal(false);
      fetchClients();
      setFormData({ name: '', phone: '', email: '', type: 'buyer', budget: '', requirements: '' });
    } catch (error) {
      console.error('Failed to create client', error);
    }
  };

  const getTypeStyle = (type) => {
    switch(type) {
      case 'buyer': return 'badge-info';
      case 'seller': return 'badge-success';
      case 'both': return 'badge-warning';
      default: return 'badge-default';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your buyers and sellers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} /> Add Client
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <Users size={32} />
            </div>
            <h3 className="empty-title">No clients yet</h3>
            <p className="empty-subtitle">Add your first client to get started cross-matching with properties.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Contact Detail</th>
                  <th>Type</th>
                  <th>Budget</th>
                  <th className={styles.textRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  return (
                    <tr key={client._id}>
                      <td>
                        <div className={styles.clientCell}>
                          <div className={styles.clientAvatar}>
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={styles.clientName}>{client.name}</p>
                            <p className={styles.clientReq} title={client.requirements || 'No specific requirements'}>
                              {client.requirements || 'No specific requirements'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.contactCell}>
                          <div className={styles.contactItem}>
                            <Phone size={14} className={styles.contactIcon} /> {client.phone}
                          </div>
                          {client.email && (
                            <div className={`${styles.contactItem} ${styles.email}`}>
                              <Mail size={14} className={styles.contactIcon} /> {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getTypeStyle(client.type)}`}>
                          {client.type}
                        </span>
                      </td>
                      <td>
                        <div className={styles.budgetCell}>
                          {client.budget ? formatCurrency(client.budget) : <span className={styles.budgetPlaceholder}>Not specified</span>}
                        </div>
                      </td>
                      <td className={styles.textRight}>
                        <button 
                          onClick={() => handleDelete(client._id)}
                          className="btn-icon danger"
                          title="Delete Client"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content" style={{maxWidth: '32rem'}}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Users size={20} className="text-primary" /> Add New Client
              </h2>
              <button onClick={() => setShowModal(false)} className="modal-close">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className={styles.formGrid}>
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input required type="text" className="form-control" 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  
                  <div className={styles.row}>
                    <div>
                      <label className="form-label">Phone *</label>
                      <input required type="tel" className="form-control" 
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className={styles.row}>
                    <div>
                      <label className="form-label">Client Type *</label>
                      <select className="form-control"
                        value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Budget (₹)</label>
                      <input type="number" className="form-control" 
                        value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Requirements / Notes</label>
                    <textarea className={`form-control ${styles.textarea}`} 
                      value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
