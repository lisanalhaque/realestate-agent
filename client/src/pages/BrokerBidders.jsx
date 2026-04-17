import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Mail, Phone, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import styles from './BrokerBids.module.css';

const BrokerBidders = () => {
  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, accepted, negotiation

  useEffect(() => {
    fetchBidders();
    const interval = setInterval(fetchBidders, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBidders = async () => {
    try {
      const response = await api.get('/bids/broker/bidders');
      setBidders(response.data);
    } catch (error) {
      console.error('Failed to fetch negotiation clients', error);
      toast.error('Failed to load negotiation clients');
    } finally {
      setLoading(false);
    }
  };

  const filteredBidders = bidders.filter(bidder => {
    if (filter === 'all') return true;
    if (filter === 'accepted') return bidder.acceptedBids > 0;
    if (filter === 'active') return bidder.totalBids > 0;
    return true;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) return <div className={styles.loading}>Loading negotiation clients...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Negotiation clients</h1>
        <p className={styles.subtitle}>Clients who are negotiating price on your listings</p>
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All clients ({bidders.length})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'accepted' ? styles.active : ''}`}
          onClick={() => setFilter('accepted')}
        >
          With accepted negotiations ({bidders.filter(b => b.acceptedBids > 0).length})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({bidders.filter(b => b.totalBids > 0).length})
        </button>
      </div>

      <div className={styles.biddersGrid}>
        {filteredBidders.length === 0 ? (
          <p className={styles.noData}>No negotiation clients found</p>
        ) : (
          filteredBidders.map(bidder => (
            <div key={bidder.userId} className={styles.bidderCard}>
              <div className={styles.bidderHeader}>
                <div>
                  <h3 className={styles.bidderName}>{bidder.name}</h3>
                  <div className={styles.bidderContact}>
                    <Mail size={14} /> {bidder.email}
                  </div>
                  <div className={styles.bidderContact}>
                    <Phone size={14} /> {bidder.phone}
                  </div>
                </div>
                {bidder.acceptedBids > 0 && (
                  <div className={styles.badge}>
                    <CheckCircle size={16} />
                    {bidder.acceptedBids} Accepted
                  </div>
                )}
              </div>

              <div className={styles.bidderStats}>
                <div className={styles.stat}>
                  <span className={styles.label}>Total proposals</span>
                  <span className={styles.value}>{bidder.totalBids}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>Highest proposal</span>
                  <span className={styles.value}>{formatCurrency(bidder.highestBid)}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>Lowest proposal</span>
                  <span className={styles.value}>{formatCurrency(bidder.lowestBid)}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>Total proposed value</span>
                  <span className={styles.value}>{formatCurrency(bidder.totalBidAmount)}</span>
                </div>
              </div>

              <div className={styles.bidsList}>
                <h4>Properties in negotiation:</h4>
                {bidder.bids.map(bid => (
                  <div key={bid._id} className={styles.bidItem}>
                    <div className={styles.bidProperty}>
                      <strong>{bid.propertyId.title}</strong>
                      <span className={`${styles.status} ${styles[bid.status]}`}>
                        {bid.status.toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.bidAmount}>
                      {formatCurrency(bid.amount)}
                      {bid.advancePaymentDetails?.status === 'completed' && (
                        <span className={styles.paymentBadge}>✓ Advance Paid</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BrokerBidders;
