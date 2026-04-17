import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Check, X, Clock, AlertCircle, DollarSign, User, Phone, Mail } from 'lucide-react';
import styles from './BrokerBids.module.css';

const BrokerBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected

  useEffect(() => {
    fetchBids();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchBids, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBids = async () => {
    try {
      const response = await api.get('/bids/broker');
      setBids(response.data);
    } catch (error) {
      console.error('Failed to fetch negotiations', error);
      toast.error('Failed to load negotiations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bidId, status) => {
    try {
      await api.put(`/bids/${bidId}/status`, { status });
      setBids(bids.map(b => b._id === bidId ? { ...b, status } : b));
      toast.success(`Negotiation ${status === 'accepted' ? 'accepted' : 'declined'}`);
    } catch (error) {
      console.error('Failed to update negotiation', error);
      toast.error('Could not update negotiation status');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'accepted': return <Check size={18} />;
      case 'rejected': return <X size={18} />;
      case 'pending': return <Clock size={18} />;
      default: return <AlertCircle size={18} />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    return bid.status === filter;
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
        Loading negotiations...
      </div>
    );
  }

  const totalBids = bids.length;
  const pendingBids = bids.filter(b => b.status === 'pending').length;
  const acceptedBids = bids.filter(b => b.status === 'accepted').length;
  const paidAdvance = bids.filter(b => b.advancePaymentDetails?.status === 'completed').length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Incoming Negotiations</h1>
        <p className={styles.subtitle}>Review price proposals from clients on your listings</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total negotiations</span>
          <span className={styles.statValue}>{totalBids}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending</span>
          <span className={styles.statValue} style={{color: '#f59e0b'}}>{pendingBids}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Accepted</span>
          <span className={styles.statValue} style={{color: '#10b981'}}>{acceptedBids}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Advance Paid</span>
          <span className={styles.statValue} style={{color: '#3b82f6'}}>{paidAdvance}</span>
        </div>
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All negotiations
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'accepted' ? styles.active : ''}`}
          onClick={() => setFilter('accepted')}
        >
          Accepted
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'rejected' ? styles.active : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </button>
      </div>

      {filteredBids.length === 0 ? (
        <div className={styles.noData}>
          {filter === 'all' 
            ? 'No negotiations on your listings yet.'
            : `No ${filter} negotiations found.`
          }
        </div>
      ) : (
        <div className={styles.bidsList}>
          {filteredBids.map((bid) => (
            <div key={bid._id} className={styles.bidCard}>
              <div className={styles.bidHeader}>
                <div>
                  <h3 className={styles.propertyTitle}>{bid.propertyId?.title || 'Unknown Property'}</h3>
                  <p className={styles.propertyPrice}>{formatCurrency(bid.propertyId?.price || 0)}</p>
                </div>
                <span className={`${styles.statusBadge} ${styles[bid.status]}`}>
                  {getStatusIcon(bid.status)}
                  {bid.status.toUpperCase()}
                </span>
              </div>

              <div className={styles.clientInfo}>
                <div className={styles.infoBlock}>
                  <User size={16} />
                  <div>
                    <span className={styles.infoLabel}>Client</span>
                    <span className={styles.infoValue}>{bid.userId?.name || 'Unknown'}</span>
                  </div>
                </div>
                <div className={styles.infoBlock}>
                  <Phone size={16} />
                  <div>
                    <span className={styles.infoLabel}>Phone</span>
                    <span className={styles.infoValue}>{bid.userId?.phone || 'N/A'}</span>
                  </div>
                </div>
                <div className={styles.infoBlock}>
                  <Mail size={16} />
                  <div>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{bid.userId?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.bidDetails}>
                <div className={styles.detailCol}>
                  <span className={styles.label}>Proposed price</span>
                  <span className={styles.value} style={{ color: '#10b981', fontWeight: 'bold', fontSize: '18px' }}>
                    {formatCurrency(bid.amount)}
                  </span>
                </div>
                <div className={styles.detailCol}>
                  <span className={styles.label}>Advance (10%)</span>
                  <span className={styles.value} style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                    {formatCurrency(bid.amount * 0.1)}
                  </span>
                </div>
                <div className={styles.detailCol}>
                  <span className={styles.label}>Payment Status</span>
                  <span 
                    className={styles.value}
                    style={{ color: getPaymentStatusColor(bid.advancePaymentDetails?.status), fontWeight: 'bold' }}
                  >
                    {bid.advancePaymentDetails?.status?.toUpperCase() || 'PENDING'}
                    {bid.advancePaymentDetails?.status === 'completed' && ' ✓'}
                  </span>
                </div>
                {bid.advancePaymentDetails?.status === 'completed' && (
                  <div className={styles.detailCol}>
                    <span className={styles.label}>Paid Amount</span>
                    <span className={styles.value} style={{ color: '#10b981' }}>
                      {formatCurrency(bid.advancePaymentDetails?.paidAmount || 0)}
                    </span>
                  </div>
                )}
                <div className={styles.detailCol}>
                  <span className={styles.label}>Placed On</span>
                  <span className={styles.value}>
                    {new Date(bid.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {bid.status === 'pending' && (
                <div className={styles.actions}>
                  <button 
                    onClick={() => handleStatusUpdate(bid._id, 'accepted')} 
                    className={styles.acceptBtn}
                  >
                    <Check size={16} /> Accept negotiation
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(bid._id, 'rejected')} 
                    className={styles.rejectBtn}
                  >
                    <X size={16} /> Decline negotiation
                  </button>
                </div>
              )}

              {bid.status === 'accepted' && bid.advancePaymentDetails?.status === 'completed' && (
                <div className={styles.successMessage}>
                  ✓ Advance payment received - Client ready to proceed
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrokerBids;
