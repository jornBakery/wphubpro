/**
 * Site Detail page - Horizontal tab menu at top, main content left, site card right
 * Tabs: Overview, Plugins, Themes, Health, Logs
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Icon from '@mui/material/Icon';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';

import { useSite, useDeleteSite, useCheckSiteHealth } from '../hooks/useSites';
import { usePageBreadcrumb } from '../contexts/PageBreadcrumbContext';

import SiteDetailsTab from './site-detail/SiteDetailsTab';
import PluginsTab from './site-detail/PluginsTab';
import ThemesTab from './site-detail/ThemesTab';
import SiteHealthTab from './site-detail/SiteHealthTab';
import LogsTab from './site-detail/LogsTab';
import SiteDetailSidebar from '../components/site-detail/SiteDetailSidebar';
import EditSiteModal from '../components/sites/EditSiteModal';

const TAB_ITEMS = [
  { index: 0, label: 'Overview', icon: 'info' },
  { index: 1, label: 'Plugins', icon: 'extension' },
  { index: 2, label: "Thema's", icon: 'palette' },
  { index: 3, label: 'Health', icon: 'health_and_safety' },
  { index: 4, label: 'Logs', icon: 'list_alt' },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <SoftBox py={3}>{children}</SoftBox>}
    </div>
  );
}

const SiteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { setBreadcrumbTitle } = usePageBreadcrumb();

  const { data: site, isLoading, isError, error } = useSite(id);
  const deleteSite = useDeleteSite();
  const checkHealth = useCheckSiteHealth(id);

  useEffect(() => {
    if (site) {
      const name = (site as any).siteName || (site as any).site_name || 'Site';
      setBreadcrumbTitle?.(name);
    }
    return () => setBreadcrumbTitle?.(null);
  }, [site, setBreadcrumbTitle]);

  useEffect(() => {
    if (!id || !site) return;
    checkHealth.mutate({ silent: true });
  }, [id, site?.$id]);

  const handleRemove = () => {
    if (!id) return;
    if (window.confirm('Weet je zeker dat je deze site wilt verwijderen?')) {
      deleteSite.mutate(id, { onSuccess: () => navigate('/sites') });
    }
  };

  if (isLoading) {
    return (
      <SoftBox display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={12}>
        <Icon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} className="spin">sync</Icon>
        <SoftTypography variant="button" color="secondary">Site gegevens ophalen...</SoftTypography>
      </SoftBox>
    );
  }

  if (isError || !site) {
    return (
      <SoftBox py={6} textAlign="center">
        <Icon sx={{ fontSize: 48, color: 'error.main', mb: 2 }}>error</Icon>
        <SoftTypography variant="h5" fontWeight="medium" mb={1}>Site niet gevonden</SoftTypography>
        <SoftTypography variant="button" color="secondary" mb={2}>{error?.message || `Geen site met ID: ${id}`}</SoftTypography>
        <SoftButton variant="gradient" color="info" size="small" onClick={() => navigate('/sites')}>Terug naar overzicht</SoftButton>
      </SoftBox>
    );
  }

  return (
    <>
      <SoftBox mt={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', backgroundColor: 'transparent' }}>
        <Grid container spacing={3} alignItems="stretch" sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left column - tab menu + main content */}
          <Grid item xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <Box sx={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              {/* Horizontal tab navigation - same style as vertical main Sidenav */}
              <Box sx={{ flexShrink: 0, mb: 2, px: 3, pt: 0, color: '#292F4D', backgroundColor: 'background.default', py: 1 }}>
                <Tabs
                  value={tab}
                  onChange={(_, value: number) => setTab(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    minHeight: 48,
                    '& .MuiTabs-indicator': { display: 'none' },
                    '& .MuiTabs-flexContainer': { overflow: 'visible' },
                    '& .MuiTab-root': {
                      minHeight: 48,
                      minWidth: 100,
                      padding: '6px 16px 6px 16px',
                      marginRight: 8,
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      color: '#292F4D !important',
                      backgroundColor: 'transparent',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&.Mui-selected': {
                        color: '#292F4D !important',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        boxShadow: '0 20px 27px 0 rgba(0,0,0,0.05)',
                      },
                      // Ensure label text is visible (icon + label layout)
                      '& > *:not(.MuiTab-iconWrapper)': {
                        color: 'inherit',
                        opacity: 1,
                        visibility: 'visible',
                        whiteSpace: 'nowrap',
                        overflow: 'visible',
                      },
                    },
                    '& .MuiTab-iconWrapper': {
                      marginRight: 12.8,
                      '& > *': {
                        minWidth: 32,
                        minHeight: 32,
                        borderRadius: '8px',
                        display: 'grid',
                        placeItems: 'center',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.12)',
                        transition: 'background 0.2s ease-in-out',
                        color: '#4F5482',
                        fontSize: 18,
                      },
                    },
                    '& .Mui-selected .MuiTab-iconWrapper > *': {
                      background: 'linear-gradient(310deg, #f97316, #fb923c)',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.12)',
                      color: '#ffffff',
                    },
                  }}
                >
                  {TAB_ITEMS.map(({ index, label, icon }) => (
                    <Tab
                      key={index}
                      label={label}
                      icon={
                        <Box component="span" sx={{ display: 'inherit' }}>
                          <Icon sx={{ fontSize: 18 }}>{icon}</Icon>
                        </Box>
                      }
                      iconPosition="start"
                      value={index}
                    />
                  ))}
                </Tabs>
              </Box>
              <Box
                sx={{
                  flex: '1 1 0%',
                  minHeight: 0,
                  height: 0,
                  overflow: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  px: 3,
                  pb: 3,
                }}
              >
                <TabPanel value={tab} index={0}>
                  <SiteDetailsTab siteId={site.$id} onTabChange={setTab} />
                </TabPanel>
                <TabPanel value={tab} index={1}>
                  <PluginsTab siteId={site.$id} />
                </TabPanel>
                <TabPanel value={tab} index={2}>
                  <ThemesTab siteId={site.$id} />
                </TabPanel>
                <TabPanel value={tab} index={3}>
                  <SiteHealthTab siteId={site.$id} />
                </TabPanel>
                <TabPanel value={tab} index={4}>
                  <LogsTab siteId={site.$id} />
                </TabPanel>
              </Box>
            </Box>
          </Grid>

          {/* Right column - site details card only */}
          <Grid item xs={12} lg={4} sx={{ pr: { lg: 4 } }}>
            <SiteDetailSidebar
              site={site}
              onEdit={() => setEditModalOpen(true)}
              onRemove={handleRemove}
            />
          </Grid>
        </Grid>
      </SoftBox>

      <EditSiteModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        site={site}
      />

      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default SiteDetailPage;
