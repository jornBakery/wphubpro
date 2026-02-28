/**
 * Site Detail page - based on soft layouts/dashboards/smart-home
 * Tabs: Site Details, Plugins, Themes, Site Health
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';

import { useSite, useDeleteSite } from '../hooks/useSites';

import SiteDetailsTab from './site-detail/SiteDetailsTab';
import PluginsTab from './site-detail/PluginsTab';
import ThemesTab from './site-detail/ThemesTab';
import SiteHealthTab from './site-detail/SiteHealthTab';

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

  const { data: site, isLoading, isError, error } = useSite(id);
  const deleteSite = useDeleteSite();

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

  const siteName = (site as any).siteName || (site as any).site_name || 'Naamloze site';
  const siteUrl = (site as any).siteUrl || (site as any).site_url || '';

  return (
    <>
      <SoftBox my={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">{siteName}</SoftTypography>
            <SoftTypography variant="button" color="secondary">{siteUrl}</SoftTypography>
          </SoftBox>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => navigate('/sites')}>
            <Icon sx={{ mr: 0.5 }}>arrow_back</Icon>
            Terug
          </SoftButton>
        </SoftBox>

        <Card>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Site Details" icon={<Icon fontSize="small">info</Icon>} iconPosition="start" />
            <Tab label="Plugins" icon={<Icon fontSize="small">extension</Icon>} iconPosition="start" />
            <Tab label="Thema's" icon={<Icon fontSize="small">palette</Icon>} iconPosition="start" />
            <Tab label="Site Health" icon={<Icon fontSize="small">health_and_safety</Icon>} iconPosition="start" />
          </Tabs>

          <SoftBox px={3} pb={3}>
            <TabPanel value={tab} index={0}>
              <SiteDetailsTab siteId={site.$id} onRemove={handleRemove} />
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
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default SiteDetailPage;
