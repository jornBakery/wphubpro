/**
 * WPHub navbar - Soft UI DashboardNavbar styling with Auth integration
 * Shows user info + logout when logged in, Sign in link when not
 */
import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Icon from '@mui/material/Icon';

import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftInput from 'components/SoftInput';
import Breadcrumbs from 'examples/Breadcrumbs';

import { useSoftUIController, setTransparentNavbar } from 'context';

import { useAuth } from '../../contexts/AuthContext';

import {
  navbar,
  navbarContainer,
  navbarIconButton,
} from 'examples/Navbars/DashboardNavbar/styles';

function WPHubNavbar({ absolute = false, light = false, isMini = false }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useSoftUIController();
  const { transparentNavbar, fixedNavbar } = controller;
  const [openMenu, setOpenMenu] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
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

  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(null);

  const handleLogout = async () => {
    handleCloseMenu();
    await logout();
    navigate('/login');
  };

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
            <SoftBox display="flex" alignItems="center" gap={0.5} color={light ? 'white' : 'inherit'}>
              <SoftInput
                placeholder="Zoek sites..."
                icon={{ component: 'search', direction: 'left' }}
                size="small"
                sx={{ minWidth: 200 }}
              />
              {user ? (
                <>
                  <IconButton
                    sx={navbarIconButton}
                    size="small"
                    onClick={handleOpenMenu}
                    aria-controls="account-menu"
                  >
                    <Icon sx={{ color: light ? 'white.main' : 'dark.main' }}>account_circle</Icon>
                    <SoftTypography
                      variant="button"
                      fontWeight="medium"
                      color={light ? 'white' : 'dark'}
                      sx={{ display: { xs: 'none', sm: 'inline-block' }, ml: 0.5 }}
                    >
                      {user.name || user.email}
                    </SoftTypography>
                  </IconButton>
                  <Menu
                    id="account-menu"
                    anchorEl={openMenu}
                    open={Boolean(openMenu)}
                    onClose={handleCloseMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ mt: 2 }}
                  >
                    <MenuItem disabled>
                      <SoftTypography variant="caption" color="secondary">
                        {isAdmin ? 'Administrator' : 'Platform Member'}
                      </SoftTypography>
                    </MenuItem>
                    <MenuItem component={Link} to="/subscription" onClick={handleCloseMenu}>
                      Abonnement
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Uitloggen</MenuItem>
                  </Menu>
                </>
              ) : (
                <Link to="/login">
                  <IconButton sx={navbarIconButton} size="small">
                    <Icon sx={{ color: light ? 'white.main' : 'dark.main' }}>account_circle</Icon>
                    <SoftTypography
                      variant="button"
                      fontWeight="medium"
                      color={light ? 'white' : 'dark'}
                      sx={{ display: { xs: 'none', sm: 'inline-block' }, ml: 0.5 }}
                    >
                      Inloggen
                    </SoftTypography>
                  </IconButton>
                </Link>
              )}

              <IconButton
                size="small"
                color="inherit"
                sx={navbarIconButton}
                component={Link}
                to={isAdmin ? '/admin/settings' : '/subscription'}
              >
                <Icon>settings</Icon>
              </IconButton>
            </SoftBox>
          )}
        </SoftBox>
      </Toolbar>
    </AppBar>
  );
}

export default WPHubNavbar;
