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
        { type: 'collapse', name: 'Admin Dashboard', key: 'admin', icon: 'dashboard', route: '/admin/dashboard', noCollapse: true },
        { type: 'collapse', name: 'Users', key: 'admin-users', icon: 'people', route: '/admin/users', noCollapse: true },
        {
          type: 'collapse',
          name: 'Business',
          key: 'admin-business',
          icon: 'business_center',
          collapse: [
            { name: 'Subscriptions', route: '/admin/subscriptions', key: 'admin-subscriptions' },
            { name: 'Orders', route: '/admin/orders', key: 'admin-orders' },
            { name: 'Plan Manager', route: '/admin/plans', key: 'admin-plans' },
          ],
        },
        { type: 'collapse', name: 'Platform Settings', key: 'admin-settings', icon: 'settings', route: '/admin/settings', noCollapse: true },
      ]
    : [];

  return [...mainRoutes, ...adminRoutes];
};
