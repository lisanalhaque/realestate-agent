import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Clients from './pages/Clients';
import Deals from './pages/Deals';
import Commissions from './pages/Commissions';
import AdminBrokers from './pages/AdminBrokers';
import BrokerBids from './pages/BrokerBids';
import BrokerBidders from './pages/BrokerBidders';
import BrokerPipeline from './pages/BrokerPipeline';
import UserPortal from './pages/UserPortal';
import UserBids from './pages/UserBids';
import UserFeedback from './pages/UserFeedback';
import AdminFeedbacks from './pages/AdminFeedbacks';
import AdminUsers from './pages/AdminUsers';
import AdminBrokerView from './pages/AdminBrokerView';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute withSidebar={false} />}>
             <Route path="/" element={<Home />} />
          </Route>

          {/* Broker and Admin Shared Routes */}
          <Route element={<ProtectedRoute allowedRoles={['broker', 'admin']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/commissions" element={<Commissions />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/broker/incoming-negotiations" element={<BrokerBids />} />
            <Route path="/broker/negotiation-clients" element={<BrokerBidders />} />
            <Route path="/broker/negotiation-pipeline" element={<BrokerPipeline />} />
            <Route path="/bids" element={<Navigate to="/broker/incoming-negotiations" replace />} />
            <Route path="/broker/bidders" element={<Navigate to="/broker/negotiation-clients" replace />} />
            <Route path="/broker/pipeline" element={<Navigate to="/broker/negotiation-pipeline" replace />} />
            <Route path="/broker/incoming-bargains" element={<Navigate to="/broker/incoming-negotiations" replace />} />
            <Route path="/broker/bargain-clients" element={<Navigate to="/broker/negotiation-clients" replace />} />
            <Route path="/broker/bargain-pipeline" element={<Navigate to="/broker/negotiation-pipeline" replace />} />
          </Route>

          {/* Admin Exclusive Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/brokers" element={<AdminBrokers />} />
            <Route path="/admin/brokers/:brokerId/*" element={<AdminBrokerView />} />
            <Route path="/admin/feedbacks" element={<AdminFeedbacks />} />
          </Route>

          {/* User Routes */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'broker', 'admin']} />}>
            <Route path="/user/properties" element={<UserPortal />} />
            <Route path="/user/negotiations" element={<UserBids />} />
            <Route path="/user/bids" element={<Navigate to="/user/negotiations" replace />} />
            <Route path="/user/bargains" element={<Navigate to="/user/negotiations" replace />} />
            <Route path="/user/feedback" element={<UserFeedback />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
