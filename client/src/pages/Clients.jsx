import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Users, Mail, Phone, Trash2, ChevronDown, ChevronRight, Briefcase, Handshake } from 'lucide-react';
import styles from './Clients.module.css';

const PIPELINE_LABELS = {
  negotiation: 'Negotiation',
  advance_paid: 'Advance paid',
  deal_done: 'Deal done',
  deal_cancelled: 'Deal cancelled',
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [brokerBids, setBrokerBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', type: 'buyer', budget: '', requirements: ''
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const [clientsRes, bidsRes] = await Promise.allSettled([
        api.get('/clients'),
        api.get('/bids/broker'),
      ]);
      if (clientsRes.status === 'fulfilled') {
        setClients(clientsRes.value.data);
      } else {
        console.error('Failed to fetch clients', clientsRes.reason);
        setClients([]);
      }
      if (bidsRes.status === 'fulfilled') {
        const data = bidsRes.value.data;
        setBrokerBids(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch negotiations', bidsRes.reason);
        setBrokerBids([]);
      }
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

  const sortedBrokerBids = [...brokerBids].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

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

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
      <section className={styles.negotiationsSection} aria-labelledby="negotiations-heading">
        <div className={styles.negotiationsHeader}>
          <Handshake size={20} className={styles.negotiationsIcon} />
          <div>
            <h2 id="negotiations-heading" className={styles.negotiationsTitle}>
              Clients you&apos;re dealing with
            </h2>
            <p className={styles.negotiationsSubtitle}>
              Negotiations on your listings — proposed amounts, pipeline stage, and advance status
            </p>
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {sortedBrokerBids.length === 0 ? (
            <div className={styles.negotiationsEmpty}>
              No active negotiations on your properties yet. When buyers submit proposals, they appear here.
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Property</th>
                    <th>Proposed amount</th>
                    <th>Pipeline</th>
                    <th>Advance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBrokerBids.map((bid) => (
                    <tr key={bid._id}>
                      <td>
                        <div className={styles.contactCell}>
                          <span className={styles.clientName} style={{ marginBottom: 0 }}>
                            {bid.userId?.name || '—'}
                          </span>
                          {bid.userId?.phone && (
                            <div className={styles.contactItem}>
                              <Phone size={14} className={styles.contactIcon} /> {bid.userId.phone}
                            </div>
                          )}
                          {bid.userId?.email && (
                            <div className={`${styles.contactItem} ${styles.email}`}>
                              <Mail size={14} className={styles.contactIcon} /> {bid.userId.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{bid.propertyId?.title || '—'}</td>
                      <td>{formatCurrency(bid.amount)}</td>
                      <td>
                        <span className="badge badge-info">
                          {PIPELINE_LABELS[bid.pipelineStage] || bid.pipelineStage || 'Negotiation'}
                        </span>
                      </td>
                      <td>
                        {bid.advancePaymentDetails?.status === 'completed' ? (
                          <span className="badge badge-success">Paid</span>
                        ) : (
                          <span className="badge badge-warning">Not paid</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            bid.status === 'accepted'
                              ? 'badge-success'
                              : bid.status === 'rejected'
                                ? 'badge-danger'
                                : 'badge-warning'
                          }`}
                        >
                          {bid.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <div className="card">
        {clients.length === 0 ? (
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
                  <th>Deals & commission</th>
                  <th className={styles.textRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const hasDeals = (client.deals?.length || 0) > 0;
                  const expanded = expandedId === client._id;
                  return (
                    <React.Fragment key={client._id}>
                      <tr>
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
                        <td>
                          {!hasDeals ? (
                            <span className={styles.dealMuted}>No deals yet</span>
                          ) : (
                            <button
                              type="button"
                              className={styles.dealToggle}
                              onClick={() => setExpandedId(expanded ? null : client._id)}
                            >
                              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span>
                                <strong>{client.closedDealsCount || 0}</strong> closed
                                {(client.closedDealsCount || 0) > 0 && (
                                  <>
                                    {' · '}
                                    {formatCurrency(client.totalCommissionFromClosedDeals || 0)} comm.
                                  </>
                                )}
                              </span>
                            </button>
                          )}
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
                      {expanded && hasDeals && (
                        <tr className={styles.dealDetailRow}>
                          <td colSpan={6}>
                            <div className={styles.dealPanel}>
                              <h4 className={styles.dealPanelTitle}>
                                <Briefcase size={16} /> Deal history
                              </h4>
                              <table className={styles.dealNestedTable}>
                                <thead>
                                  <tr>
                                    <th>Property</th>
                                    <th>Status</th>
                                    <th>Negotiated amount</th>
                                    <th>Commission</th>
                                    <th>Closed</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {client.deals.map((d) => (
                                    <tr key={d._id}>
                                      <td>{d.propertyTitle}</td>
                                      <td>
                                        <span className={`badge ${d.status === 'closed' ? 'badge-success' : d.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                                          {d.status}
                                        </span>
                                      </td>
                                      <td>{formatCurrency(d.dealValue)}</td>
                                      <td>
                                        {d.status === 'closed' && d.commissionAmount != null
                                          ? formatCurrency(d.commissionAmount)
                                          : d.status === 'closed'
                                            ? formatCurrency((d.dealValue * (d.commissionRate || 2.5)) / 100)
                                            : '—'}
                                      </td>
                                      <td>{d.closedAt ? new Date(d.closedAt).toLocaleDateString() : '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

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
