/**
 * Main layout with Soft UI Sidenav and Navbar styling
 */
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SoftBox from 'components/SoftBox';

import Sidenav from 'examples/Sidenav';
import { useSoftUIController, setLayout } from 'context';

import WPHubNavbar from './WPHubNavbar';
import { PageBreadcrumbProvider } from '../../contexts/PageBreadcrumbContext';
import { getSidenavRoutes } from '../../config/sidenavRoutes';
import { useAuth } from '../../contexts/AuthContext';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import Toaster from '../ui/Toaster';

import brand from 'assets/images/logo-ct.png';

const MainLayout: React.FC = () => {
  const [controller, dispatch] = useSoftUIController();
  const location = useLocation();
  const isSiteDetailPage = /^\/sites\/[^/]+$/.test(location.pathname);
  const { miniSidenav } = controller;
  const { isAdmin } = useAuth();
  const { data: details } = usePlatformSettings('details');
  const brandName = details?.name || 'WPHub.PRO';
  const brandLogo = details?.logoUrl || details?.logoDataUrl || brand;

  useEffect(() => {
    setLayout(dispatch, 'dashboard');
  }, []);

  const routes = getSidenavRoutes(isAdmin);

  return (
    <>
      <Sidenav
        color="info"
        brand={brandLogo}
        brandName={brandName}
        routes={routes}
      />
      <PageBreadcrumbProvider>
        <SoftBox
          sx={({ breakpoints, transitions, functions: { pxToRem } }) => ({
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            position: 'relative',
            [breakpoints.up('xl')]: {
              marginLeft: miniSidenav ? pxToRem(120) : pxToRem(274),
              transition: transitions.create(['margin-left', 'margin-right'], {
                easing: transitions.easing.easeInOut,
                duration: transitions.duration.standard,
              }),
            },
          })}
        >
          <WPHubNavbar />
          <SoftBox
            component="main"
            pt={1}
            pb={3}
            px={3}
            sx={({ breakpoints }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflowX: 'hidden',
              overflowY: 'auto',
              backgroundColor: isSiteDetailPage ? 'transparent' : undefined,
              [breakpoints.down('sm')]: {
                px: 2,
              },
            })}
          >
            <Outlet />
          </SoftBox>
        </SoftBox>
      </PageBreadcrumbProvider>
      <Toaster />
    </>
  );
};

export default MainLayout;
