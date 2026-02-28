/**
 * Sites page - based on soft layouts/ecommerce/products/products-list
 * DataTable with sites list
 */
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Icon from '@mui/material/Icon';
import Tooltip from '@mui/material/Tooltip';

import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';
import SoftBadge from 'components/SoftBadge';

import { useSites, useDeleteSite } from '../hooks/useSites';
import AddSiteModal from '../components/sites/AddSiteModal';
import { Site } from '../types';

const SiteCell: React.FC<{ value: [string, { url: string }] }> = ({ value: [name, data] }) => (
  <SoftBox display="flex" alignItems="center">
    <SoftBox mx={2} display="flex" alignItems="center" justifyContent="center" width="3rem" height="3rem" bgColor="grey-200" borderRadius="md">
      <Icon color="action">public</Icon>
    </SoftBox>
    <SoftBox>
      <SoftTypography variant="button" fontWeight="medium">{name || 'Untitled'}</SoftTypography>
      <SoftTypography variant="caption" color="secondary" display="block">{data?.url || '-'}</SoftTypography>
    </SoftBox>
  </SoftBox>
);

const StatusBadge: React.FC<{ value: Site['status'] }> = ({ value }) => {
  const config: Record<string, { color: 'success' | 'error'; label: string }> = {
    connected: { color: 'success', label: 'Verbonden' },
    disconnected: { color: 'error', label: 'Losgekoppeld' },
  };
  const c = config[value] || config.disconnected;
  return <SoftBadge variant="contained" color={c.color} size="xs" badgeContent={c.label} container />;
};

const HealthBadge: React.FC<{ value: Site['healthStatus'] }> = ({ value }) => {
  const config: Record<string, { color: 'success' | 'error'; label: string }> = {
    healthy: { color: 'success', label: 'Healthy' },
    bad: { color: 'error', label: 'Bad' },
  };
  const c = config[value] || config.bad;
  return <SoftBadge variant="contained" color={c.color} size="xs" badgeContent={c.label} container />;
};

const ActionCell: React.FC<{ siteId: string; siteUrl: string }> = ({ siteId, siteUrl }) => {
  const deleteSite = useDeleteSite();
  const handleDelete = () => {
    if (window.confirm('Weet je zeker dat je deze site wilt verwijderen?')) {
      deleteSite.mutate(siteId);
    }
  };
  return (
    <SoftBox display="flex" alignItems="center" gap={1}>
      <Link to={`/sites/${siteId}`} style={{ textDecoration: 'none' }}>
        <Tooltip title="Beheer" placement="top">
          <Icon sx={{ cursor: 'pointer', color: 'secondary.main' }}>settings</Icon>
        </Tooltip>
      </Link>
      <a href={siteUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
        <Tooltip title="Open site" placement="top">
          <Icon sx={{ cursor: 'pointer', color: 'secondary.main' }}>open_in_new</Icon>
        </Tooltip>
      </a>
      <Tooltip title="Verwijderen" placement="left">
        <Icon sx={{ cursor: 'pointer', color: 'error.main' }} onClick={handleDelete}>delete</Icon>
      </Tooltip>
    </SoftBox>
  );
};

const SitesPage: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { data: sites, isLoading, isError, error } = useSites();

  const dataTableData = useMemo(() => {
    const rows = (sites || []).map((site) => ({
      site: [site.siteName || site.siteUrl || 'Untitled', { url: site.siteUrl || '-' }],
      status: site.status,
      health: site.healthStatus,
      url: site.siteUrl || '-',
      lastChecked: site.lastChecked ? new Date(site.lastChecked).toLocaleDateString('nl-NL') : '-',
      action: <ActionCell siteId={site.$id} siteUrl={site.siteUrl || '#'} />,
    }));
    return {
      columns: [
        {
          Header: 'Site',
          accessor: 'site',
          width: '35%',
          Cell: ({ value }: { value: [string, { url: string }] }) => <SiteCell value={value} />,
        },
        { Header: 'URL', accessor: 'url', width: '20%' },
        {
          Header: 'Status',
          accessor: 'status',
          Cell: ({ value }: { value: Site['status'] }) => <StatusBadge value={value} />,
        },
        {
          Header: 'Gezondheid',
          accessor: 'health',
          Cell: ({ value }: { value: Site['healthStatus'] }) => <HealthBadge value={value} />,
        },
        { Header: 'Laatst gecontroleerd', accessor: 'lastChecked', width: '12%' },
        { Header: 'Acties', accessor: 'action', width: '12%' },
      ],
      rows,
    };
  }, [sites]);

  return (
    <>
      <AddSiteModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />

      <SoftBox my={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" p={3}>
            <SoftBox lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                Sites
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Beheer uw gekoppelde WordPress-sites.
              </SoftTypography>
            </SoftBox>
            <Stack spacing={1} direction="row">
              <SoftButton variant="gradient" color="info" size="small" onClick={() => setAddModalOpen(true)}>
                + Nieuwe site
              </SoftButton>
            </Stack>
          </SoftBox>

          {isLoading && (
            <SoftBox p={6} textAlign="center">
              <SoftTypography variant="button" color="secondary">Laden...</SoftTypography>
            </SoftBox>
          )}

          {isError && (
            <SoftBox p={4}>
              <SoftTypography variant="button" color="error">{error?.message || 'Fout bij laden van sites.'}</SoftTypography>
            </SoftBox>
          )}

          {!isLoading && !isError && sites && sites.length === 0 && (
            <SoftBox p={6} textAlign="center">
              <Icon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }}>public</Icon>
              <SoftTypography variant="h6" fontWeight="medium" mb={1}>Nog geen sites</SoftTypography>
              <SoftTypography variant="button" color="secondary" mb={2} display="block">
                Voeg uw eerste WordPress-site toe om te beheren.
              </SoftTypography>
              <SoftButton variant="gradient" color="info" size="small" onClick={() => setAddModalOpen(true)}>
                + Nieuwe site
              </SoftButton>
            </SoftBox>
          )}

          {!isLoading && !isError && sites && sites.length > 0 && (
            <DataTable
              table={dataTableData}
              entriesPerPage={{ defaultValue: 7, entries: [5, 7, 10, 15, 20, 25] }}
              canSearch
            />
          )}
        </Card>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default SitesPage;
