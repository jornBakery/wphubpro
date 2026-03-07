/**
 * Sidenav routes config for WPHub - Soft UI Sidenav format
 * Uses Material Icons (string names)
 */
import { ROUTE_PATHS } from './routePaths';

export const getSidenavRoutes = (isAdmin = false) => {
  const mainRoutes = [
    { type: 'collapse', name: 'Dashboard', key: 'dashboard', icon: 'dashboard', route: ROUTE_PATHS.DASHBOARD, noCollapse: true },
    { type: 'collapse', name: 'Sites', key: 'sites', icon: 'public', route: ROUTE_PATHS.SITES, noCollapse: true },
    { type: 'collapse', name: 'Bibliotheek', key: 'library', icon: 'folder', route: ROUTE_PATHS.LIBRARY, noCollapse: true },
    { type: 'collapse', name: 'Abonnement', key: 'subscription', icon: 'credit_card', route: ROUTE_PATHS.SUBSCRIPTION, noCollapse: true },
    { type: 'divider', key: 'divider-1' },
  ];

  const adminRoutes = isAdmin
    ? [
        { type: 'title', title: 'Admin', key: 'admin-title' },
        { type: 'collapse', name: 'Admin Dashboard', key: 'admin', icon: 'dashboard', route: ROUTE_PATHS.ADMIN_DASHBOARD, noCollapse: true },
        { type: 'collapse', name: 'Users', key: 'admin-users', icon: 'people', route: ROUTE_PATHS.ADMIN_USERS, noCollapse: true },
        {
          type: 'collapse',
          name: 'Business',
          key: 'admin-business',
          icon: 'business_center',
          submenuColor: '#ea580c',
          collapse: [
            { name: 'Subscriptions', route: ROUTE_PATHS.ADMIN_SUBSCRIPTIONS, key: 'admin-subscriptions' },
            { name: 'Orders', route: ROUTE_PATHS.ADMIN_ORDERS, key: 'admin-orders' },
            { name: 'Plan Manager', route: ROUTE_PATHS.ADMIN_PLANS, key: 'admin-plans' },
          ],
        },
        { type: 'collapse', name: 'Platform Settings', key: 'admin-settings', icon: 'settings', route: ROUTE_PATHS.ADMIN_SETTINGS, noCollapse: true },
      ]
    : [];

  return [...mainRoutes, ...adminRoutes];
};
