import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import styles from './UserBids.module.css';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { runAdvancePayment, bidIdString } from '../utils/advancePayment';

const UserBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingBidId, setPayingBidId] = useState(null);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bids/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if(response.ok) {
        setBids(Array.isArray(data) ? data : (data.data || []));
      } else {
        toast.error('Failed to load your negotiations');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch negotiations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle size={20} color="#10b981" />;
      case 'rejected': return <XCircle size={20} color="#ef4444" />;
      default: return <Clock size={20} color="#f59e0b" />;
    }
  };

  const handlePayment = (bid) => {
    const id = bidIdString(bid);
    runAdvancePayment(bid, {
      onSuccess: fetchBids,
      onBusyChange: (busy) => setPayingBidId(busy ? id : null),
    });
  };

  const getStatusText = (status) => {
    if (status === 'pending') return 'Waiting for review';
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) return <div className={styles.loading}>Loading your negotiations...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Negotiations</h1>
      <p className={styles.subtitle}>Track your proposed prices and negotiation status on each property.</p>

      <div className={styles.bidsList}>
        {bids.length === 0 ? (
          <p className={styles.noData}>You haven&apos;t started any negotiations yet.</p>
        ) : (
          bids.map((bid) => {
            const rowBidId = bidIdString(bid);
            const isPayingThis = payingBidId === rowBidId;
            return (
            <div key={bid._id} className={styles.bidCard}>
              <div className={styles.bidHeader}>
                <h3 className={styles.propertyTitle}>{bid.propertyId?.title || 'Unknown Property'}</h3>
                <div className={`${styles.statusBadge} ${styles[bid.status]}`}>
                  {getStatusIcon(bid.status)}
                  <span>{getStatusText(bid.status)}</span>
                </div>
              </div>
              <div className={styles.bidDetails}>
                <div className={styles.detailCol}>
                  <span className={styles.label}>Proposed price</span>
                  <span className={styles.value}>${bid.amount.toLocaleString()}</span>
                </div>
                <div className={styles.detailCol}>
                  <span className={styles.label}>Date Placed</span>
                  <span className={styles.value}>{new Date(bid.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.detailCol}>
                  <span className={styles.label}>Broker Contact</span>
                  <span className={styles.value}>
                    {bid.status === 'accepted' ? (bid.propertyId?.contactNumber || bid.propertyId?.listedBy?.phone || 'Not available') : 'Hidden until accepted'}
                  </span>
                </div>
                {bid.status === 'accepted' && (
                  <div className={styles.detailCol}>
                    <span className={styles.label}>Advance Payment</span>
                    {bid.advancePaymentDetails?.status === 'completed' ? (
                      <span className={styles.value} style={{color: '#10b981'}}>✓ Paid</span>
                    ) : (
                      <button
                        type="button"
                        disabled={isPayingThis}
                        onClick={() => handlePayment(bid)}
                        style={{
                          padding: '0.4rem 1rem',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: isPayingThis ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          opacity: isPayingThis ? 0.75 : 1,
                        }}
                      >
                        {isPayingThis ? (
                          <>
                            <Loader2 size={16} className={styles.paySpinner} aria-hidden />
                            Processing…
                          </>
                        ) : (
                          'Pay 10% Advance'
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserBids;
