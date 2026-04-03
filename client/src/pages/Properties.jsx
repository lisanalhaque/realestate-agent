import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { Plus, MapPin, Home as HomeIcon, Bed, Bath, Square, Trash2 } from 'lucide-react';
import styles from './Properties.module.css';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '', type: 'apartment', status: 'available', price: '', 
    location: { address: '', city: '', state: '', pincode: '' },
    area: '', bedrooms: '', bathrooms: ''
  });

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties');
      setProperties(res.data);
    } catch (error) {
      console.error('Failed to fetch properties', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.delete(`/properties/${id}`);
        setProperties(properties.filter(p => p._id !== id));
      } catch (error) {
        console.error('Failed to delete property', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/properties', formData);
      setShowModal(false);
      fetchProperties();
      setFormData({
        title: '', type: 'apartment', status: 'available', price: '', 
        location: { address: '', city: '', state: '', pincode: '' },
        area: '', bedrooms: '', bathrooms: ''
      });
    } catch (error) {
      console.error('Failed to create property', error);
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'available': return 'badge-success';
      case 'under_negotiation': return 'badge-warning';
      case 'sold': return 'badge-danger';
      case 'rented': return 'badge-info';
      default: return 'badge-default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-subtitle">Manage your real estate listings</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} /> Add Property
        </button>
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon-wrapper">
            <HomeIcon size={32} />
          </div>
          <h3 className="empty-title">No properties found</h3>
          <p className="empty-subtitle">Get started by adding your first property listing.</p>
        </div>
      ) : (
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
                <div className={styles.statusBadge}>
                  <span className={`badge ${getStatusClass(property.status)}`}>
                    {property.status.replace('_', ' ')}
                  </span>
                </div>
                <div className={styles.typeBadge}>
                  <span className="badge">
                    {property.type}
                  </span>
                </div>
              </div>
              
              <div className={styles.detailsContainer}>
                <h3 className={styles.title} title={property.title}>{property.title}</h3>
                <p className={styles.price}>{formatCurrency(property.price)}</p>
                
                <div className={styles.location}>
                  <MapPin size={16} className={styles.locationIcon} />
                  <span className="truncate">{property.location?.city || 'No Location'}, {property.location?.state || ''}</span>
                </div>
                
                <div className={styles.featuresGrid}>
                  <div className={styles.featureItem}>
                    <Bed size={18} className={styles.featureIcon} />
                    <span className={styles.featureValue}>{property.bedrooms || '-'}</span>
                  </div>
                  <div className={styles.featureItem}>
                    <Bath size={18} className={styles.featureIcon} />
                    <span className={styles.featureValue}>{property.bathrooms || '-'}</span>
                  </div>
                  <div className={styles.featureItem}>
                    <Square size={18} className={styles.featureIcon} />
                    <span className={styles.featureValue}>{property.area || '-'}</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.dateAdded}>
                    Added <span className={styles.dateValue}>{new Date(property.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(property._id)}
                    className="btn-icon danger"
                    title="Delete property"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content" style={{maxWidth: '42rem'}}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Property</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className={styles.formGrid}>
                  <div className={styles.fullWidth}>
                    <label className="form-label">Property Title *</label>
                    <input required type="text" className="form-control" 
                      value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="form-label">Price (₹) *</label>
                    <input required type="number" className="form-control" 
                      value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="form-label">Property Type *</label>
                    <select className="form-control"
                      value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="plot">Plot</option>
                      <option value="commercial">Commercial</option>
                      <option value="house">House</option>
                    </select>
                  </div>

                  <div className={`${styles.locationGroup} ${styles.fullWidth}`}>
                    <div className={styles.locationHeader}><MapPin size={16} className="text-primary" /> Location Details</div>
                    <div className={styles.locationInputs}>
                      <div className={styles.addressInput}>
                        <input placeholder="Street Address" type="text" className="form-control" 
                          value={formData.location.address} onChange={e => setFormData({...formData, location: {...formData.location, address: e.target.value}})} />
                      </div>
                      <div>
                        <input placeholder="City" type="text" className="form-control" 
                          value={formData.location.city} onChange={e => setFormData({...formData, location: {...formData.location, city: e.target.value}})} />
                      </div>
                      <div>
                        <input placeholder="State" type="text" className="form-control" 
                          value={formData.location.state} onChange={e => setFormData({...formData, location: {...formData.location, state: e.target.value}})} />
                      </div>
                      <div>
                        <input placeholder="Pincode" type="text" className="form-control" 
                          value={formData.location.pincode} onChange={e => setFormData({...formData, location: {...formData.location, pincode: e.target.value}})} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Area (sq.ft)</label>
                    <div className="input-icon-wrapper">
                      <Square className="input-icon" size={16} />
                      <input type="number" className="form-control form-control-with-icon" 
                        value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Bedrooms</label>
                      <div className="input-icon-wrapper">
                        <Bed className="input-icon" size={16} />
                        <input type="number" className="form-control form-control-with-icon" 
                          value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Bathrooms</label>
                      <div className="input-icon-wrapper">
                        <Bath className="input-icon" size={16} />
                        <input type="number" className="form-control form-control-with-icon" 
                          value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
