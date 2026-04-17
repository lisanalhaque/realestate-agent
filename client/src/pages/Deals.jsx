import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Briefcase, FileText, IndianRupee, Trash2, Users } from 'lucide-react';
import { Home as HomeIcon } from 'lucide-react';
import styles from './Deals.module.css';

const STANDARD_COMMISSION_PCT = 2.5;

const Deals = ({ brokerId }) => {
  const [deals, setDeals] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [acceptedNegotiations, setAcceptedNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    property: '', client: '', status: 'lead', dealValue: '', commissionRate: String(STANDARD_COMMISSION_PCT), notes: '', sourceBid: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const q = brokerId ? `?agentId=${brokerId}` : '';
      const [dealsRes, propsRes, clientsRes, bidsRes] = await Promise.all([
        api.get(`/deals${q}`),
        api.get(`/properties${q}`),
        api.get('/clients'),
        api.get('/bids/broker').catch(() => ({ data: [] })),
      ]);
      setDeals(dealsRes.data);
      setProperties(propsRes.data);
      setClients(clientsRes.data);
      const raw = bidsRes.data || [];
      setAcceptedNegotiations(Array.isArray(raw) ? raw.filter((b) => b.status === 'accepted') : []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await api.delete(`/deals/${id}`);
        setDeals(deals.filter(d => d._id !== id));
      } catch (error) {
        console.error('Failed to delete deal', error);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.put(`/deals/${id}`, { status: newStatus });
      setDeals(deals.map((d) => (d._id === id ? { ...d, ...res.data } : d)));
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/deals', formData);
      setShowModal(false);
      fetchData();
      setFormData({
        property: '',
        client: '',
        status: 'lead',
        dealValue: '',
        commissionRate: String(STANDARD_COMMISSION_PCT),
        notes: '',
        sourceBid: '',
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create deal');
      console.error('Failed to create deal', error);
    } finally {
      setSubmitting(false);
    }
  };

  const stages = [
    { value: 'lead', label: 'Lead' },
    { value: 'site_visit', label: 'Site Visit' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'agreement', label: 'Agreement' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const dealValue = parseFloat(formData.dealValue) || 0;
  const rate = parseFloat(formData.commissionRate) || STANDARD_COMMISSION_PCT;
  const commissionPreview = (dealValue * rate) / 100;

  const propertyIdStr = formData.property ? String(formData.property) : '';
  const linkableNegotiations = acceptedNegotiations.filter((b) => {
    const pid = b.propertyId?._id || b.propertyId;
    return pid && String(pid) === propertyIdStr;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Deal Pipeline</h1>
          <p className="page-subtitle">Track deals; closing sets commission to {STANDARD_COMMISSION_PCT}% of the negotiated amount and updates linked negotiations.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} /> Add Deal
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : deals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <Briefcase size={32} />
            </div>
            <h3 className="empty-title">No active deals</h3>
            <p className="empty-subtitle">Create a deal to start tracking your pipeline.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Property & Client</th>
                  <th>Negotiated & commission</th>
                  <th>Status</th>
                  <th className={styles.textRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal._id}>
                    <td>
                      <div className={styles.detailCell}>
                        <div className={`${styles.detailRow} ${styles.primary}`}>
                          <HomeIcon size={14} className={`${styles.detailIcon} ${styles.primary}`} /> 
                          {deal.property?.title || 'Unknown Property'}
                        </div>
                        <div className={`${styles.detailRow} ${styles.secondary}`}>
                          <Users size={14} className={`${styles.detailIcon} ${styles.info}`} /> 
                          {deal.client?.name || 'Unknown Client'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.valueCell}>{formatCurrency(deal.dealValue)}</div>
                      <div className={styles.subValue}>
                        {deal.commissionRate}% 
                        <span className={styles.separator}>|</span> 
                        Est: {formatCurrency((deal.dealValue * deal.commissionRate) / 100)}
                      </div>
                    </td>
                    <td>
                      <select 
                        className={`${styles.statusSelect} ${styles[deal.status]}`}
                        value={deal.status}
                        onChange={(e) => handleStatusChange(deal._id, e.target.value)}
                        disabled={deal.status === 'closed' || deal.status === 'cancelled'}
                      >
                        {stages.map(stage => (
                          <option key={stage.value} value={stage.value} className={styles.statusOption}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={styles.textRight}>
                      <button 
                        onClick={() => handleDelete(deal._id)}
                        className="btn-icon danger"
                        title="Delete deal"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
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
                <Briefcase size={20} className="text-primary" /> New Deal Connection
              </h2>
              <button onClick={() => setShowModal(false)} className="modal-close">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className={styles.formGrid}>
                  <div>
                    <label className="form-label">Property *</label>
                    <select required className="form-control"
                      value={formData.property} onChange={e => setFormData({...formData, property: e.target.value, sourceBid: ''})}>
                      <option value="" disabled>Select a property</option>
                      {properties.map(p => <option key={p._id} value={p._id}>{p.title} - {formatCurrency(p.price)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Client *</label>
                    <select required className="form-control"
                      value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})}>
                      <option value="" disabled>Select a client</option>
                      {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.type})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Link accepted negotiation (optional)</label>
                    <select
                      className="form-control"
                      value={formData.sourceBid}
                      onChange={(e) => setFormData({ ...formData, sourceBid: e.target.value })}
                      disabled={!formData.property}
                    >
                      <option value="">None — no pipeline sync</option>
                      {linkableNegotiations.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.userId?.name || 'Client'} — proposed {formatCurrency(b.amount)}
                        </option>
                      ))}
                    </select>
                    <p className={styles.fieldHint}>When linked, negotiation pipeline follows this deal until closed.</p>
                  </div>
                  
                  <div className={styles.row}>
                    <div>
                      <label className="form-label">Negotiated amount (₹) *</label>
                      <input required type="number" className="form-control" 
                        value={formData.dealValue} onChange={e => setFormData({...formData, dealValue: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label">Comm. rate (%) — becomes {STANDARD_COMMISSION_PCT}% when closed</label>
                      <input required type="number" step="0.1" className="form-control" 
                        value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: e.target.value})} />
                    </div>
                  </div>

                  <div className={styles.previewBox}>
                    <span className={styles.previewLabel}>Commission preview (at current rate)</span>
                    <span className={styles.previewValue}>{formatCurrency(commissionPreview)}</span>
                  </div>

                  <div>
                    <label className="form-label">Notes</label>
                    <textarea className={`form-control ${styles.textarea}`} 
                      value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                  </div>
                </div>
                {error && <p className="error" style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deals;
