/**
 * Sidenav routes config for WPHub - Soft UI Sidenav format
 * Uses Material Icons (string names)
 */
export const getSidenavRoutes = (isAdmin = false) => {
  const mainRoutes = [
    { type: 'collapse', name: 'Dashboard', key: 'dashboard', icon: 'dashboard', route: '/dashboard', noCollapse: true },
    { type: 'collapse', name: 'Sites', key: 'sites', icon: 'public', route: '/sites', noCollapse: true },
    { type: 'collapse', name: 'Bibliotheek', key: 'library', icon: 'folder', route: '/library', noCollapse: true },
    { type: 'collapse', name: 'Abonnement', key: 'subscription', icon: 'credit_card', route: '/subscription', noCollapse: true },
    { type: 'divider', key: 'divider-1' },
  ];

  const adminRoutes = isAdmin
    ? [
        { type: 'title', title: 'Admin', key: 'admin-title' },
        { type: 'collapse', name: 'Admin Dashboard', key: 'admin-dashboard', icon: 'dashboard', route: '/admin/dashboard', noCollapse: true },
        { type: 'collapse', name: 'User Manager', key: 'admin-users', icon: 'people', route: '/admin/users', noCollapse: true },
        { type: 'collapse', name: 'Orders', key: 'admin-orders', icon: 'receipt_long', route: '/admin/orders', noCollapse: true },
        { type: 'collapse', name: 'Plan Management', key: 'admin-plans', icon: 'inventory_2', route: '/admin/plans', noCollapse: true },
        { type: 'collapse', name: 'Subscriptions', key: 'admin-subscriptions', icon: 'paid', route: '/admin/subscriptions', noCollapse: true },
        { type: 'collapse', name: 'Platform Settings', key: 'admin-settings', icon: 'settings', route: '/admin/settings', noCollapse: true },
      ]
    : [];

  return [...mainRoutes, ...adminRoutes];
};
