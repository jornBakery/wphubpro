/**
 * Site Detail page - Horizontal tab menu at top, main content left, site card right
 * Tabs: Overview, Plugins, Themes, Health, Logs
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Icon from '@mui/material/Icon';
import TabNavList, { TabNavPanel } from 'components/ui/TabNavList';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';

import { useSite, useDeleteSite, useCheckSiteHealth, useUpdateSite, useSiteConnectionPing } from '../domains/sites';
import { usePageBreadcrumb } from '../contexts/PageBreadcrumbContext';

import { usePlugins } from '../hooks/useWordPress';
import SiteDetailsTab from './site-detail/SiteDetailsTab';
import PluginsTab from './site-detail/PluginsTab';
import ThemesTab from './site-detail/ThemesTab';
import SiteHealthTab from './site-detail/SiteHealthTab';
import LogsTab from './site-detail/LogsTab';
import SiteDetailSidebar from '../components/site-detail/SiteDetailSidebar';
import EditSiteModal from '../components/sites/EditSiteModal';

const TAB_ITEMS = [
  { value: 0, label: 'Overview', icon: 'info' },
  { value: 1, label: 'Plugins', icon: 'extension' },
  { value: 2, label: "Thema's", icon: 'palette' },
  { value: 3, label: 'Health', icon: 'health_and_safety' },
  { value: 4, label: 'Logs', icon: 'list_alt' },
];

const SiteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { setBreadcrumbTitle } = usePageBreadcrumb();

  const { data: site, isLoading, isError, error } = useSite(id);
  const deleteSite = useDeleteSite();
  const checkHealth = useCheckSiteHealth(id);
  const updateSite = useUpdateSite();
  useSiteConnectionPing(site?.enabled !== false ? id : undefined);
  const { isSuccess: pluginsSuccess } = usePlugins(id, { enabled: site?.enabled });

  useEffect(() => {
    if (site) {
      const name = (site as any).siteName || (site as any).site_name || 'Site';
      setBreadcrumbTitle?.(name);
    }
    return () => setBreadcrumbTitle?.(null);
  }, [site, setBreadcrumbTitle]);

  useEffect(() => {
    if (!id || !site || site.enabled === false) return;
    checkHealth.mutate({ silent: true });
  }, [id, site?.$id, site?.enabled]);

  useEffect(() => {
    if (!id || !site || site.enabled === false || site.status === 'connected') return;
    if (pluginsSuccess) {
      updateSite.mutate({ siteId: id, status: 'connected', silent: true });
    }
  }, [id, site, pluginsSuccess, updateSite]);

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
            <SoftBox sx={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <TabNavList items={TAB_ITEMS} value={tab} onChange={(_, v) => setTab(v)} />
              <SoftBox
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
                <TabNavPanel value={tab} index={0}>
                  <SiteDetailsTab siteId={site.$id} onTabChange={setTab} />
                </TabNavPanel>
                <TabNavPanel value={tab} index={1}>
                  <PluginsTab siteId={site.$id} />
                </TabNavPanel>
                <TabNavPanel value={tab} index={2}>
                  <ThemesTab siteId={site.$id} />
                </TabNavPanel>
                <TabNavPanel value={tab} index={3}>
                  <SiteHealthTab siteId={site.$id} />
                </TabNavPanel>
                <TabNavPanel value={tab} index={4}>
                  <LogsTab siteId={site.$id} />
                </TabNavPanel>
              </SoftBox>
            </SoftBox>
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
