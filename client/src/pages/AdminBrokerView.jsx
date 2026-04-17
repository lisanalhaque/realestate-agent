import React from 'react';
import { Routes, Route, Navigate, NavLink, useParams } from 'react-router-dom';
import Dashboard from './Dashboard';
import Properties from './Properties';
import Deals from './Deals';
import BrokerPipeline from './BrokerPipeline';
import styles from '../components/Layout.module.css';

const AdminBrokerView = () => {
  const { brokerId } = useParams();

  if (!brokerId) return <Navigate to="/admin/brokers" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Mini Navigation Bar for Broker Drill-down */}
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid #e2e8f0', 
        backgroundColor: '#f8fafc',
        display: 'flex', 
        gap: '24px', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ fontWeight: 600, color: '#334155', marginRight: '16px' }}>
          Viewing Broker Context:
        </div>
        
        <NavLink 
          to={`/admin/brokers/${brokerId}/dashboard`} 
          className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.active : ''}`}
          style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to={`/admin/brokers/${brokerId}/properties`} 
          className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.active : ''}`}
          style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}
        >
          Properties
        </NavLink>
        <NavLink 
          to={`/admin/brokers/${brokerId}/pipeline`} 
          className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.active : ''}`}
          style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}
        >
          Neg. Pipeline
        </NavLink>
        <NavLink 
          to={`/admin/brokers/${brokerId}/deals`} 
          className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.active : ''}`}
          style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}
        >
          CRM Deals
        </NavLink>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Routes>
          <Route path="dashboard" element={<Dashboard brokerId={brokerId} />} />
          <Route path="properties" element={<Properties brokerId={brokerId} />} />
          <Route path="pipeline" element={<BrokerPipeline brokerId={brokerId} />} />
          <Route path="deals" element={<Deals brokerId={brokerId} />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminBrokerView;
