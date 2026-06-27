import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from './Layout';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import LandingHome from './pages/LandingHome';
import Dashboard from './pages/Dashboard';
import Booking from './pages/Booking';
import Staff from './pages/Staff';
import AddStaff from './pages/AddStaff';
import History from './pages/History';
import Selectstaff from './pages/Selectstaff';
import StaffPerformance from './pages/StaffPerformance';
import DailyPerformance from './pages/DailyPerformance';
import PrivateRoute from './components/PrivateRoute';
import Customers from './pages/Customers/Customers'
import './App.css';
import CustomerHistory from './pages/Customers/CustomerHistory';
import PermissionPage from './pages/PermissionPage';
import ProtectedRoute from "./pages/ProtectedRoute";
import AddCustomer from './pages/Customers/AddCustomer';
import StockManagement from './pages/StockManagement/StockManagement';
import { GlobalRefreshProvider } from './context/GlobalRefreshContext';
import Invoice from './pages/Invoice';
import InvoicesList from './pages/InvoicesList';
import PaymentDue from './pages/PaymentDue';
import Payroll from './pages/Payroll';
import PendingMessages from './pages/PendingMessages';
import BranchManagement from './pages/BranchManagement/BranchManagement';
import ServiceReminders from './pages/ServiceReminders';
import Products from './pages/Products';
import Services from './pages/Services';
import PublicLayout from './PublicLayout';
import InventoryFinancials from './pages/InventoryFinancials';


function App() {
  return (
    <Router>
      <GlobalRefreshProvider>
        <Routes>
          {/* Public landing pages - accessible without login */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingHome />} />
            <Route path="/products" element={<Products />} />
            <Route path="/services" element={<Services />} />
          </Route>

          {/* Login page */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Public invoice route - no authentication required */}
          <Route path="/invoice/:complaintId" element={<Invoice />} />

          {/* Protected routes (post-login) */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/dashboard" element={
                <ProtectedRoute page="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/booking" element={
                <ProtectedRoute page="booking">
                  <Booking />
                </ProtectedRoute>
              } />
              <Route path="/staff" element={
                <ProtectedRoute page="staff">
                  <Staff />
                </ProtectedRoute>
              } />
              <Route path="/add-staff" element={
                <ProtectedRoute page="staff">
                  <AddStaff />
                </ProtectedRoute>
              } />
              <Route path="/edit-staff/:id" element={
                <ProtectedRoute page="staff">
                  <AddStaff />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute page="history">
                  <History />
                </ProtectedRoute>
              } />

              <Route path="/select-staff" element={<Selectstaff />} />

              <Route path="/add-customer" element={
                <ProtectedRoute page="add-customer">
                  <AddCustomer />
                </ProtectedRoute>
              } />


              <Route path="/staff-performance" element={<StaffPerformance />} />
              <Route path="/staff-performance" element={
                <ProtectedRoute page="staff-performance">
                  <StaffPerformance />
                </ProtectedRoute>
              } />
              <Route path="/daily-performance" element={<DailyPerformance />} />
              <Route path="/customers" element={
                <ProtectedRoute page="customers">
                  <Customers />
                </ProtectedRoute>
              } />
              <Route path="/customerhistory" element={<CustomerHistory />} />
              <Route path="/permissions" element={
                <ProtectedRoute page="bigadmin">
                  <PermissionPage />
                </ProtectedRoute>
              }
              />
              <Route path="/stock-management" element={
                <ProtectedRoute page="stock-management">
                  <StockManagement />
                </ProtectedRoute>
              } />
              <Route path="/invoices" element={
                <ProtectedRoute page="bigadmin">
                  <InvoicesList />
                </ProtectedRoute>
              } />
              <Route path="/payment-due" element={
                <ProtectedRoute page="bigadmin">
                  <PaymentDue />
                </ProtectedRoute>
              } />
              <Route path="/service-reminders" element={
                <ProtectedRoute page="dashboard">
                  <ServiceReminders />
                </ProtectedRoute>
              } />
              <Route path="/payroll" element={
                <ProtectedRoute page="bigadmin">
                  <Payroll />
                </ProtectedRoute>
              } />
              <Route path="/inventory-financials" element={
                <ProtectedRoute page="bigadmin">
                  <InventoryFinancials />
                </ProtectedRoute>
              } />
              <Route path="/whatsapp-pending" element={<PendingMessages />} />
              <Route path="/branch-management" element={
                <ProtectedRoute page="admin">
                  <BranchManagement />
                </ProtectedRoute>
              } />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/admin-login" replace />} />

        </Routes>
      </GlobalRefreshProvider>
    </Router>
  );
}

export default App;
