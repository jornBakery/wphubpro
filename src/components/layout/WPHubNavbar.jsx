/**
 * WPHub navbar - Soft UI DashboardNavbar styling with Auth integration
 * Shows user info + logout when logged in, Sign in link when not
 */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Icon from '@mui/material/Icon';

import SoftBox from 'components/SoftBox';
import SoftInput from 'components/SoftInput';
import Breadcrumbs from 'examples/Breadcrumbs';

import { useSoftUIController, setTransparentNavbar } from 'context';
import { useAuth } from '../../contexts/AuthContext';


import {
  navbar,
  navbarContainer,
} from 'examples/Navbars/DashboardNavbar/styles';

function WPHubNavbar({ absolute = false, light = false, isMini = false }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useSoftUIController();
  const { transparentNavbar, fixedNavbar } = controller;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const route = location.pathname.split('/').slice(1);
  const pageTitle = route[route.length - 1] || 'dashboard';

  useEffect(() => {
    setNavbarType(fixedNavbar ? 'sticky' : 'static');

    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }
    window.addEventListener('scroll', handleTransparentNavbar);
    handleTransparentNavbar();
    return () => window.removeEventListener('scroll', handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  return (
    <AppBar
      position={absolute ? 'absolute' : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <Breadcrumbs icon="home" title={pageTitle} route={route} light={light} showPageTitle={false} />
          {!isMini && (
            <SoftBox display="flex" alignItems="center" gap={1} color={light ? 'white' : 'inherit'}>
              <SoftInput
                placeholder="Zoek sites..."
                icon={{ component: 'search', direction: 'left' }}
                size="small"
                sx={{ minWidth: 200 }}
              />
              {user && (
                <Tooltip title="Uitloggen">
                  <IconButton size="small" onClick={handleLogout} sx={{ color: 'inherit' }} aria-label="Uitloggen">
                    <Icon>logout</Icon>
                  </IconButton>
                </Tooltip>
              )}
            </SoftBox>
          )}
        </SoftBox>
      </Toolbar>
    </AppBar>
  );
}

export default WPHubNavbar;
