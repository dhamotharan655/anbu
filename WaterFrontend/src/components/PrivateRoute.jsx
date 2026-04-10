import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const isAuthenticated = !!sessionStorage.getItem('token');
  console.log('PrivateRoute check - isAuthenticated:', isAuthenticated, 'token:', sessionStorage.getItem('token') ? 'exists' : 'missing');

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin-login" />;
};

export default PrivateRoute;
