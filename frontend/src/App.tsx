import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Layout } from './components/layout/Layout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

// Application Pages
import { Dashboard } from './pages/dashboard/Dashboard';
import { Customers } from './pages/customers/Customers';
import { CustomerLedger } from './pages/customers/CustomerLedger';
import { Bills } from './pages/bills/Bills';
import { Payments } from './pages/payments/Payments';
import { Reminders } from './pages/reminders/Reminders';
import { WhatsAppHistory } from './pages/whatsapp/WhatsAppHistory';
import { Settings } from './pages/settings/Settings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected App Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id/ledger" element={<CustomerLedger />} />
              <Route path="bills" element={<Bills />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="whatsapp" element={<WhatsAppHistory />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
