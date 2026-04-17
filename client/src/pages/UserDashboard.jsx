import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Home as HomeIcon, MapPin, DollarSign, CreditCard, Loader2 } from 'lucide-react';
import styles from './Properties.module.css';
import { runAdvancePayment, bidIdString } from '../utils/advancePayment';

const UserDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [userBids, setUserBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingBidId, setPayingBidId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propsRes, bidsRes] = await Promise.all([
          api.get('/properties'),
          api.get('/bids/user')
        ]);
        setProperties(Array.isArray(propsRes.data) ? propsRes.data : propsRes.data?.data || []);
        const rawBids = bidsRes.data;
        setUserBids(Array.isArray(rawBids) ? rawBids : rawBids?.data || []);
      } catch (error) {
        console.error('Failed to load user hub', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleBid = async (propertyId) => {
    const amount = prompt("Enter your proposed price (INR):");
    if (amount && !isNaN(amount)) {
      try {
        await api.post('/bids', { propertyId, amount: Number(amount) });
        alert("Proposal submitted — the broker will continue the negotiation.");
        const bidsRes = await api.get('/bids/user');
        const raw = bidsRes.data;
        setUserBids(Array.isArray(raw) ? raw : raw?.data || []);
      } catch (e) {
        console.error(e);
        alert("Failed to submit negotiation proposal.");
      }
    }
  };

  const refreshBids = async () => {
    try {
      const bidsRes = await api.get('/bids/user');
      const raw = bidsRes.data;
      setUserBids(Array.isArray(raw) ? raw : raw?.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Could not refresh negotiations');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Available Listings</h1>
          <p className="page-subtitle">Browse listings and negotiate price with brokers.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {properties.map(property => (
          <div key={property._id} className={`card ${styles.propertyCard}`}>
            <div className={styles.imageContainer}>
              {property.images && property.images.length > 0 ? (
                <img src={property.images[0]} alt={property.title} className={styles.propertyImage} />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <HomeIcon size={48} />
                </div>
              )}
            </div>
            
            <div className={styles.detailsContainer}>
              <h3 className={styles.title}>{property.title}</h3>
              <p className={styles.price}>{formatCurrency(property.price)}</p>
              
              <div className={styles.location}>
                <MapPin size={16} className={styles.locationIcon} />
                <span>{property.location?.city || 'No Location'}, {property.location?.state || ''}</span>
              </div>
              
              <div className={styles.cardFooter} style={{ padding: '1rem 0 0 0', display: 'flex', justifyContent: 'flex-start' }}>
                <button 
                  onClick={() => handleBid(property._id)}
                  className="btn-primary" 
                  style={{ width: '100%' }}
                >
                  <DollarSign size={16} /> Start negotiation
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {userBids.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <h2 className="page-title mb-4">Your active negotiations</h2>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px' }}>Property</th>
                  <th style={{ padding: '16px' }}>Proposed price</th>
                  <th style={{ padding: '16px' }}>Status</th>
                  <th style={{ padding: '16px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {userBids.map((bid) => {
                  const rowBidId = bidIdString(bid);
                  const isPayingThis = payingBidId === rowBidId;
                  return (
                  <tr key={bid._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px' }}>{bid.propertyId?.title || 'Unknown'}</td>
                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{formatCurrency(bid.amount)}</td>
                    <td style={{ padding: '16px' }}>
                      <span className={`badge ${bid.status === 'pending' ? 'badge-warning' : bid.status === 'accepted' ? 'badge-success' : 'badge-danger'}`}>
                        {bid.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {bid.status === 'accepted' &&
                        (bid.advancePaymentDetails?.status === 'completed' ? (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>Paid</span>
                        ) : (
                          <button
                            type="button"
                            disabled={isPayingThis}
                            onClick={() =>
                              runAdvancePayment(bid, {
                                onSuccess: refreshBids,
                                onBusyChange: (busy) => setPayingBidId(busy ? rowBidId : null),
                              })
                            }
                            className="btn-primary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              opacity: isPayingThis ? 0.85 : 1,
                              cursor: isPayingThis ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {isPayingThis ? (
                              <>
                                <Loader2 size={16} style={{ animation: 'spin 0.75s linear infinite' }} aria-hidden />
                                Processing…
                              </>
                            ) : (
                              <>
                                <CreditCard size={16} /> Pay 10% Advance
                              </>
                            )}
                          </button>
                        ))}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
