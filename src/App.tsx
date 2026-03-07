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
import { Loader2 } from 'lucide-react';
import { ROUTE_PATHS, ADMIN_CHILD_PATHS } from './config/routePaths';

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
      <Route
        path={ROUTE_PATHS.LOGIN}
        element={user ? <Navigate to={ROUTE_PATHS.DASHBOARD} replace /> : <LoginPage />}
      />
      <Route
        path={ROUTE_PATHS.REGISTER}
        element={user ? <Navigate to={ROUTE_PATHS.DASHBOARD} replace /> : <RegisterPage />}
      />
      <Route path={ROUTE_PATHS.CONNECT_SUCCESS} element={<ConnectSuccessPage />} />

      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path={ROUTE_PATHS.ROOT} element={<Navigate to={ROUTE_PATHS.DASHBOARD} replace />} />
        <Route path={ROUTE_PATHS.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTE_PATHS.SITES} element={<SitesPage />} />
        <Route path={ROUTE_PATHS.SITE_DETAIL} element={<SiteDetailPage />} />
        <Route path={ROUTE_PATHS.LIBRARY} element={<PlaceholderPage name="Bibliotheek" />} />
        <Route path={ROUTE_PATHS.ACCOUNT} element={<PlaceholderPage name="Mijn Account" />} />
        <Route path={ROUTE_PATHS.SUBSCRIPTION} element={<PlaceholderPage name="Abonnement" />} />
        <Route path={ROUTE_PATHS.SUBSCRIPTION_PLANS} element={<PlaceholderPage name="Plannen" />} />

        <Route path={ROUTE_PATHS.ADMIN_ROOT} element={<AdminRoute><Outlet /></AdminRoute>}>
          <Route index element={<Navigate to={ROUTE_PATHS.ADMIN_DASHBOARD} replace />} />
          <Route path={ADMIN_CHILD_PATHS.DASHBOARD} element={<PlaceholderPage name="Admin Dashboard" />} />
          <Route path={ADMIN_CHILD_PATHS.USERS} element={<PlaceholderPage name="User Manager" />} />
          <Route path={ADMIN_CHILD_PATHS.USER_DETAIL} element={<PlaceholderPage name="User Detail" />} />
          <Route path={ADMIN_CHILD_PATHS.ORDERS} element={<PlaceholderPage name="Orders" />} />
          <Route path={ADMIN_CHILD_PATHS.PLANS} element={<PlaceholderPage name="Plan Management" />} />
          <Route path={ADMIN_CHILD_PATHS.PLAN_DETAIL} element={<PlaceholderPage name="Plan Detail" />} />
          <Route path={ADMIN_CHILD_PATHS.SUBSCRIPTIONS} element={<PlaceholderPage name="Subscriptions" />} />
          <Route path={ADMIN_CHILD_PATHS.SUBSCRIPTION_DETAIL} element={<PlaceholderPage name="Subscription Detail" />} />
          <Route path={ADMIN_CHILD_PATHS.SETTINGS} element={<PlaceholderPage name="Admin Settings" />} />
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
