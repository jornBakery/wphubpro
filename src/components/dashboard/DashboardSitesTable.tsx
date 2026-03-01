/**
 * Dashboard sites table - same DataTable as /sites page
 */
import React, { useMemo } from 'react';
import Card from '@mui/material/Card';
import { Link } from 'react-router-dom';

import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import DataTable from 'examples/Tables/DataTable';

import { Site } from '../../types';
import { SiteCell, StatusIcon, HealthBadge, ActionCell } from '../sites/SitesTableCells';

interface DashboardSitesTableProps {
  sites: Site[];
}

const DashboardSitesTable: React.FC<DashboardSitesTableProps> = ({ sites }) => {
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
          Header: 'Health',
          accessor: 'health',
          Cell: ({ value }: { value: Site['healthStatus'] }) => <HealthBadge value={value} />,
        },
        { Header: 'Last Check', accessor: 'lastChecked', width: '15%' },
        { Header: 'Actions', accessor: 'action', width: '12%' },
      ],
      rows,
    };
  }, [sites]);

  return (
    <Card>
      <SoftBox p={2} borderBottom="1px solid" borderColor="grey-200" display="flex" justifyContent="space-between" alignItems="center">
        <SoftTypography variant="h6" fontWeight="medium">
          Sites
        </SoftTypography>
        <Link to="/sites" style={{ textDecoration: 'none' }}>
          <SoftTypography variant="button" fontWeight="regular" color="info">
            All sites
          </SoftTypography>
        </Link>
      </SoftBox>
      <SoftBox p={2}>
        {sites.length === 0 ? (
          <SoftBox py={3} textAlign="center">
            <SoftTypography variant="caption" color="secondary">
              No sites registered. Add your first WordPress site to get started.
            </SoftTypography>
          </SoftBox>
        ) : (
          <DataTable
            table={dataTableData}
            entriesPerPage={{ defaultValue: 5, entries: [5, 7, 10] }}
            canSearch
          />
        )}
      </SoftBox>
    </Card>
  );
};

export default DashboardSitesTable;
