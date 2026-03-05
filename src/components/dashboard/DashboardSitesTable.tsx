/**
 * Dashboard sites table - shows only sites with meta_data.pinned === true
 * Responsive: compact expandable rows on small screens
 */
import React, { useMemo } from 'react';
import Card from '@mui/material/Card';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import { Site } from '../../types';
import { usePinnedSites, isSitePinned } from '../../hooks/usePinnedSites';
import ResponsiveSitesTable from '../sites/ResponsiveSitesTable';

interface DashboardSitesTableProps {
  sites: Site[];
}

const DashboardSitesTable: React.FC<DashboardSitesTableProps> = ({ sites }) => {
  const { togglePin, isPinned } = usePinnedSites(sites);
  const displaySites = useMemo(() => sites.filter(isSitePinned), [sites]);

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
                No pinned sites. Pin sites from the Sites page to show them here.
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
