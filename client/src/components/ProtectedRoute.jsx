import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';

const ProtectedRoute = ({ allowedRoles, withSidebar = true }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return withSidebar ? <Sidebar /> : <Outlet />;
};

export default ProtectedRoute;
