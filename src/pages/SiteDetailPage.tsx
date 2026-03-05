/**
 * Site Detail page - Dashboard layout: main content left, sidebar right
 * Tabs: Overview, Plugins, Themes, Health
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Icon from '@mui/material/Icon';
import Card from '@mui/material/Card';
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
import SiteDetailSidebar from '../components/site-detail/SiteDetailSidebar';
import EditSiteModal from '../components/sites/EditSiteModal';

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
      <SoftBox mt={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: 'transparent' }}>
        <Grid container spacing={3} alignItems="stretch" sx={{ flex: 1, minHeight: 0 }}>
          {/* Left column - main content */}
          <Grid item xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <SoftBox px={3} pb={3} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <TabPanel value={tab} index={0}>
                  <SiteDetailsTab siteId={site.$id} />
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
              </SoftBox>
            </Card>
          </Grid>

          {/* Right column - sidebar */}
          <Grid item xs={12} lg={4}>
            <SiteDetailSidebar
              site={site}
              tab={tab}
              onTabChange={setTab}
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
