import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import MainLayout from './components/layout/MainLayout';
import QueryProvider from './QueryProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './domains/auth';
import { SoftUIControllerProvider } from './context';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import Toaster from './components/ui/Toaster';
import CircularProgress from '@mui/material/CircularProgress';
import { ROUTE_PATHS } from './config/routePaths';

import theme from 'assets/theme';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Pages
import DashboardPage from './pages/DashboardPage';
import SitesPage from './pages/SitesPage';
import SiteDetailPage from './pages/SiteDetailPage';
import ConnectSuccessPage from './pages/ConnectSuccessPage';
import NotFoundPage from './pages/NotFoundPage';
import AccountProfilePage from './pages/account/AccountProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import TicketsPage from './pages/TicketsPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import ForumPage from './pages/ForumPage';
import ForumCategoryPage from './pages/ForumCategoryPage';
import ForumThreadPage from './pages/ForumThreadPage';
import ForumNewThreadPage from './pages/ForumNewThreadPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminPlatformSettingsPage from './pages/admin/AdminPlatformSettingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const PlaceholderPage: React.FC<{ name: string }> = ({ name }) => (
  <div className="p-6 text-lg">Pagina: {name} — wordt per stap gebouwd.</div>
);

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <CircularProgress size={40} />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path={ROUTE_PATHS.LOGIN}
        element={user ? <Navigate to={ROUTE_PATHS.DASHBOARD} replace /> : <LoginPage />}
      />
      <Route
        path={ROUTE_PATHS.REGISTER}
        element={user ? <Navigate to={ROUTE_PATHS.DASHBOARD} replace /> : <RegisterPage />}
      />
      <Route path={ROUTE_PATHS.CONNECT_SUCCESS} element={<ConnectSuccessPage />} />

      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to={ROUTE_PATHS.DASHBOARD} replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="sites" element={<SitesPage />} />
        <Route path="sites/:id" element={<SiteDetailPage />} />
        <Route path="library" element={<PlaceholderPage name="Bibliotheek" />} />
        <Route path="account" element={<Navigate to={ROUTE_PATHS.ACCOUNT_PROFILE} replace />} />
        <Route path="account/profile" element={<AccountProfilePage />} />
        <Route path="account/edit" element={<Navigate to={ROUTE_PATHS.ACCOUNT_PROFILE} replace />} />
        <Route path="account/settings" element={<Navigate to={ROUTE_PATHS.ACCOUNT_PROFILE} replace />} />
        <Route path="account/subscription" element={<Navigate to={ROUTE_PATHS.ACCOUNT_PROFILE} replace />} />
        <Route path="subscription" element={<Navigate to={ROUTE_PATHS.ACCOUNT_PROFILE} replace />} />
        <Route path="subscription/plans" element={<PlaceholderPage name="Plannen" />} />

        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/new" element={<CreateTicketPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="forum" element={<ForumPage />} />
        <Route path="forum/category/:key" element={<ForumCategoryPage />} />
        <Route path="forum/thread/:id" element={<ForumThreadPage />} />
        <Route path="forum/new" element={<ForumNewThreadPage />} />

        <Route path="admin" element={<AdminRoute><Outlet /></AdminRoute>}>
          <Route index element={<Navigate to={ROUTE_PATHS.ADMIN_DASHBOARD} replace />} />
          <Route path="dashboard" element={<PlaceholderPage name="Admin Dashboard" />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:userId" element={<PlaceholderPage name="User Detail" />} />
          <Route path="orders" element={<PlaceholderPage name="Orders" />} />
          <Route path="plans" element={<PlaceholderPage name="Plan Management" />} />
          <Route path="plans/:planId" element={<PlaceholderPage name="Plan Detail" />} />
          <Route path="subscriptions" element={<PlaceholderPage name="Subscriptions" />} />
          <Route path="subscriptions/:subscriptionId" element={<PlaceholderPage name="Subscription Detail" />} />
          <Route path="settings" element={<ErrorBoundary><AdminPlatformSettingsPage /></ErrorBoundary>} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="tickets" element={<PlaceholderPage name="Admin Tickets" />} />
          <Route path="tickets/:id" element={<PlaceholderPage name="Ticket Detail" />} />
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
