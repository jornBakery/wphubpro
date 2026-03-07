export const ADMIN_CHILD_PATHS = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  USER_DETAIL: 'users/:userId',
  ORDERS: 'orders',
  PLANS: 'plans',
  PLAN_DETAIL: 'plans/:planId',
  SUBSCRIPTIONS: 'subscriptions',
  SUBSCRIPTION_DETAIL: 'subscriptions/:subscriptionId',
  SETTINGS: 'settings',
} as const;

const adminPath = (child: string) => `/admin/${child}`;

export const ROUTE_PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CONNECT_SUCCESS: '/connect-success',

  DASHBOARD: '/dashboard',
  SITES: '/sites',
  SITE_DETAIL: '/sites/:id',
  LIBRARY: '/library',
  ACCOUNT: '/account',
  SUBSCRIPTION: '/subscription',
  SUBSCRIPTION_PLANS: '/subscription/plans',

  ADMIN_ROOT: '/admin',
  ADMIN_DASHBOARD: adminPath(ADMIN_CHILD_PATHS.DASHBOARD),
  ADMIN_USERS: adminPath(ADMIN_CHILD_PATHS.USERS),
  ADMIN_ORDERS: adminPath(ADMIN_CHILD_PATHS.ORDERS),
  ADMIN_PLANS: adminPath(ADMIN_CHILD_PATHS.PLANS),
  ADMIN_SUBSCRIPTIONS: adminPath(ADMIN_CHILD_PATHS.SUBSCRIPTIONS),
  ADMIN_SETTINGS: adminPath(ADMIN_CHILD_PATHS.SETTINGS),
} as const;
