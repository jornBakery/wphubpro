/**
 * WPHub.PRO route config - used by Soft UI Sidenav
 * Pages will be built one by one using soft layouts as reference
 */
import React from 'react';
import { Navigate } from 'react-router-dom';

// Icons - using lucide-react for now
import { LayoutDashboard, Globe, Library, CreditCard, Settings } from 'lucide-react';

// Placeholder pages - will be replaced with real pages per user request
const PlaceholderPage: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ padding: 24, fontSize: 18 }}>Pagina: {name} — wordt per stap gebouwd.</div>
);

export const routes = [
  {
    type: 'collapse',
    name: 'Dashboard',
    key: 'dashboard',
    icon: <LayoutDashboard size={20} />,
    route: '/dashboard',
    component: <PlaceholderPage name="Dashboard" />,
  },
  {
    type: 'collapse',
    name: 'Sites',
    key: 'sites',
    icon: <Globe size={20} />,
    route: '/sites',
    component: <PlaceholderPage name="Sites" />,
  },
  {
    type: 'collapse',
    name: 'Bibliotheek',
    key: 'library',
    icon: <Library size={20} />,
    route: '/library',
    component: <PlaceholderPage name="Bibliotheek" />,
  },
  {
    type: 'collapse',
    name: 'Abonnement',
    key: 'subscription',
    icon: <CreditCard size={20} />,
    route: '/subscription',
    component: <PlaceholderPage name="Abonnement" />,
  },
  {
    type: 'divider',
    key: 'divider-settings',
  },
  {
    type: 'collapse',
    name: 'Instellingen',
    key: 'settings',
    icon: <Settings size={20} />,
    route: '/subscription/plans',
    component: <PlaceholderPage name="Plannen" />,
  },
];
