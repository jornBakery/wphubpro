/**
 * Sites page - based on soft layouts/ecommerce/products/products-list
 * DataTable with sites list
 */
import React, { useState, useMemo } from 'react';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Icon from '@mui/material/Icon';

import Footer from 'examples/Footer';
import DataTable from 'examples/Tables/DataTable';

import { useSites } from '../hooks/useSites';
import AddSiteModal from '../components/sites/AddSiteModal';
import { Site } from '../types';
import { SiteCell, StatusIcon, HealthBadge, ActionCell } from '../components/sites/SitesTableCells';

const SitesPage: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { data: sites, isLoading, isError, error } = useSites();

  const dataTableData = useMemo(() => {
    const rows = (sites || []).map((site) => ({
      site: [site.siteName || site.siteUrl || 'Untitled', { url: site.siteUrl || '-' }],
      status: site.status,
      health: site.healthStatus,
      lastChecked: site.lastChecked ? new Date(site.lastChecked).toLocaleDateString('nl-NL') : '-',
      action: <ActionCell siteId={site.$id} siteUrl={site.siteUrl || '#'} />,
    }));
    return {
      columns: [
        {
          Header: 'Site',
          accessor: 'site',
          width: '40%',
          Cell: ({ value }: { value: [string, { url: string }] }) => <SiteCell value={value} />,
        },
        {
          Header: 'Status',
          accessor: 'status',
          width: '8%',
          Cell: ({ value }: { value: Site['status'] }) => <StatusIcon value={value} />,
        },
        {
          Header: 'Gezondheid',
          accessor: 'health',
          Cell: ({ value }: { value: Site['healthStatus'] }) => <HealthBadge value={value} />,
        },
        { Header: 'Laatst gecontroleerd', accessor: 'lastChecked', width: '15%' },
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
