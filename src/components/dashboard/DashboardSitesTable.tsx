/**
 * Dashboard sites table - pinned (max 5) or most recent if less pinned
 * Responsive: compact expandable rows on small screens
 */
import React, { useMemo } from 'react';
import Card from '@mui/material/Card';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import { Site } from '../../types';
import { usePinnedSites } from '../../hooks/usePinnedSites';
import ResponsiveSitesTable from '../sites/ResponsiveSitesTable';

interface DashboardSitesTableProps {
  sites: Site[];
}

function selectDashboardSites(sites: Site[], pinnedIds: string[]): Site[] {
  const pinned = sites.filter((s) => pinnedIds.includes(s.$id));
  const rest = sites.filter((s) => !pinnedIds.includes(s.$id));
  const byDate = (a: Site, b: Site) => (b.lastChecked ?? 0) - (a.lastChecked ?? 0);
  rest.sort(byDate);
  const needed = Math.max(0, 5 - pinned.length);
  const recent = rest.slice(0, needed);
  return [...pinned, ...recent].slice(0, 5);
}

const DashboardSitesTable: React.FC<DashboardSitesTableProps> = ({ sites }) => {
  const { pinnedIds, togglePin, isPinned } = usePinnedSites();
  const displaySites = useMemo(() => selectDashboardSites(sites, pinnedIds), [sites, pinnedIds]);

  return (
    <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <SoftBox sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {displaySites.length === 0 ? (
          <>
            <SoftBox p={2} borderBottom="1px solid" borderColor="grey-200" display="flex" justifyContent="space-between" alignItems="center">
              <SoftTypography variant="h6" fontWeight="bold" sx={{ color: '#4F5482' }}>Sites</SoftTypography>
            </SoftBox>
            <SoftBox py={3} textAlign="center">
              <SoftTypography variant="caption" color="secondary">
                No sites registered. Add your first WordPress site to get started.
              </SoftTypography>
            </SoftBox>
          </>
        ) : (
          <ResponsiveSitesTable
            sites={displaySites}
            showPinButton
            isPinned={isPinned}
            onTogglePin={togglePin}
            linkToDetails
            headerColor="#4F5482"
            headerTitle="Sites"
            headerLinkText="All sites"
            headerLinkTo="/sites"
          />
        )}
      </SoftBox>
    </Card>
  );
};

export default DashboardSitesTable;
