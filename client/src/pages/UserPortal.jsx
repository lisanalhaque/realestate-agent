import React, { useState, useEffect } from 'react';
import axios from '../api/axios'; // Or standard axios
import { toast } from 'react-toastify';
import { Building, MapPin, DollarSign, Home, Bed, Bath, Square, Phone } from 'lucide-react';
import ImageCarousel from '../components/ImageCarousel';
import styles from './UserPortal.module.css';

const UserPortal = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [negotiatingPropertyId, setNegotiatingPropertyId] = useState(null);
  const [offerAmount, setOfferAmount] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      // Create axios instance correctly if not available
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if(response.ok) {
        setProperties(data);
      } else {
        toast.error('Failed to load properties');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const handleBidSubmit = async (e, propertyId, minBid) => {
    e.preventDefault();
    if (!offerAmount) {
      toast.error('Offer amount is required');
      return;
    }
    const numOffer = Number(offerAmount);
    if (numOffer < minBid) {
      toast.error('Your bid is too low! It must be at least 50% of the property value.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId, amount: Number(offerAmount) })
      });
      const data = await response.json();
      if(response.ok) {
        toast.success('Your negotiation proposal was sent to the broker.');
        setNegotiatingPropertyId(null);
        setOfferAmount('');
      } else {
        toast.error(data.message || 'Could not submit your negotiation proposal');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error submitting negotiation proposal');
    }
  };

  if (loading) return <div className={styles.loading}>Loading properties...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Available Properties</h1>
      <p className={styles.subtitle}>Explore listings and negotiate price with brokers.</p>
      
      <div className={styles.grid}>
        {properties.map(property => (
          <div key={property._id} className={styles.card}>
            <div className={styles.imageContainer}>
              <ImageCarousel 
                images={property.images} 
                title={property.title} 
                className={styles.image} 
              />
            </div>
            
            <div className={styles.content}>
              <h3 className={styles.propertyTitle}>{property.title}</h3>
              <div className={styles.propertyDetails}>
                <div className={styles.detailItem}>
                  <MapPin size={18} />
                  <span>
                    {property.location?.address ? `${property.location.address}, ` : ''}
                    {property.location?.city || 'Location N/A'}, {property.location?.state || ''} {property.location?.pincode || ''}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <DollarSign size={18} />
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#38bdf8' }}>
                    {property.price.toLocaleString()}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <Building size={18} />
                  <span style={{textTransform: 'capitalize'}}>{property.type}</span>
                </div>
                {property.contactNumber && (
                  <div className={styles.detailItem}>
                    <Phone size={18} />
                    <span>{property.contactNumber}</span>
                  </div>
                )}
              </div>

              <div className={styles.secondaryDetails}>
                {property.bedrooms && (
                  <div className={styles.detailItem} title="Bedrooms">
                    <Bed size={16} /> <span>{property.bedrooms} Beds</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className={styles.detailItem} title="Bathrooms">
                    <Bath size={16} /> <span>{property.bathrooms} Baths</span>
                  </div>
                )}
                {property.area && (
                  <div className={styles.detailItem} title="Area (sq.ft)">
                    <Square size={16} /> <span>{property.area} sq.ft</span>
                  </div>
                )}
              </div>

              {negotiatingPropertyId === property._id ? (
                <form onSubmit={(e) => handleBidSubmit(e, property._id, property.price * 0.5)} className={styles.bidForm} noValidate>
                  <input
                    type="number"
                    placeholder="Enter your proposed price"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className={styles.input}
                  />
                  <div className={styles.buttonGroup}>
                    <button type="button" onClick={() => setNegotiatingPropertyId(null)} className={styles.cancelBtn}>Cancel</button>
                    <button type="submit" className={styles.submitBtn}>Submit proposal</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setNegotiatingPropertyId(property._id)} className={styles.bidBtn}>
                  Start negotiation
                </button>
              )}
            </div>
          </div>
        ))}
        {properties.length === 0 && <p className={styles.noData}>No available properties at the moment.</p>}
      </div>
    </div>
  );
};

export default UserPortal;
