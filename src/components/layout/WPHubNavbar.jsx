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

import { useSoftUIController, setTransparentNavbar, setMiniSidenav } from 'context';

import { useAuth } from '../../contexts/AuthContext';

import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
} from 'examples/Navbars/DashboardNavbar/styles';

function WPHubNavbar({ absolute = false, light = false, isMini = false }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar } = controller;
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

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
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
        <SoftBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs icon="home" title={pageTitle} route={route} light={light} />
          <Icon fontSize="medium" sx={navbarDesktopMenu} onClick={handleMiniSidenav}>
            {miniSidenav ? 'menu_open' : 'menu'}
          </Icon>
        </SoftBox>

        {isMini ? null : (
          <SoftBox sx={(theme) => navbarRow(theme, { isMini })}>
            <SoftBox pr={1}>
              <SoftInput
                placeholder="Zoek sites..."
                icon={{ component: 'search', direction: 'left' }}
              />
            </SoftBox>
            <SoftBox color={light ? 'white' : 'inherit'}>
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

              <IconButton size="small" color="inherit" sx={navbarMobileMenu} onClick={handleMiniSidenav}>
                <Icon className={light ? 'text-white' : 'text-dark'}>
                  {miniSidenav ? 'menu_open' : 'menu'}
                </Icon>
              </IconButton>

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
          </SoftBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default WPHubNavbar;
