import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import MainLayout from './components/layout/MainLayout';
import QueryProvider from './QueryProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SoftUIControllerProvider } from './context';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import Toaster from './components/ui/Toaster';
import { Loader2 } from 'lucide-react';

import theme from 'assets/theme';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Pages
import DashboardPage from './pages/DashboardPage';
import SitesPage from './pages/SitesPage';
import SiteDetailPage from './pages/SiteDetailPage';
import NotFoundPage from './pages/NotFoundPage';

const PlaceholderPage: React.FC<{ name: string }> = ({ name }) => (
  <div className="p-6 text-lg">Pagina: {name} — wordt per stap gebouwd.</div>
);

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-secondary">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/sites/:id" element={<SiteDetailPage />} />
        <Route path="/library" element={<PlaceholderPage name="Bibliotheek" />} />
        <Route path="/subscription" element={<PlaceholderPage name="Abonnement" />} />
        <Route path="/subscription/plans" element={<PlaceholderPage name="Plannen" />} />

        <Route path="/admin" element={<AdminRoute><Outlet /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<PlaceholderPage name="Admin Dashboard" />} />
          <Route path="users" element={<PlaceholderPage name="User Manager" />} />
          <Route path="users/:userId" element={<PlaceholderPage name="User Detail" />} />
          <Route path="orders" element={<PlaceholderPage name="Orders" />} />
          <Route path="plans" element={<PlaceholderPage name="Plan Management" />} />
          <Route path="plans/:planId" element={<PlaceholderPage name="Plan Detail" />} />
          <Route path="subscriptions" element={<PlaceholderPage name="Subscriptions" />} />
          <Route path="subscriptions/:subscriptionId" element={<PlaceholderPage name="Subscription Detail" />} />
          <Route path="settings" element={<PlaceholderPage name="Admin Settings" />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryProvider>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <SoftUIControllerProvider>
          <ThemeProvider>
            <ToastProvider>
              <HashRouter>
                <AuthProvider>
              <AppRoutes />
              <Toaster />
                </AuthProvider>
              </HashRouter>
            </ToastProvider>
          </ThemeProvider>
        </SoftUIControllerProvider>
      </MuiThemeProvider>
    </QueryProvider>
  );
};

export default App;
