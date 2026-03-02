/**
 * Responsive sites table - DataTable on md+, compact expandable rows on small screens
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@mui/material/Icon';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import DataTable from 'examples/Tables/DataTable';
import { Site } from '../../types';
import { SiteCell, StatusIcon, HealthBadge, ActionCell } from './SitesTableCells';

interface ResponsiveSitesTableProps {
  sites: Site[];
  showPinButton?: boolean;
  isPinned?: (id: string) => boolean;
  onTogglePin?: (id: string) => void;
  linkToDetails?: boolean;
  headerColor?: string;
  headerTitle?: string;
  headerLinkText?: string;
  headerLinkTo?: string;
  showHeader?: boolean;
  /** For desktop DataTable */
  entriesPerPage?: { defaultValue: number; entries: number[]; showSelector?: boolean };
}

export default function ResponsiveSitesTable({
  sites,
  showPinButton = false,
  isPinned = () => false,
  onTogglePin,
  linkToDetails = true,
  headerColor = '#4F5482',
  headerTitle = 'Sites',
  headerLinkText = 'All sites',
  headerLinkTo = '/sites',
  showHeader = true,
  entriesPerPage = { defaultValue: 5, entries: [5], showSelector: false },
}: ResponsiveSitesTableProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isSmall) {
    const dataTableData = {
      columns: [
        { Header: 'Site', accessor: 'site', width: '40%', Cell: ({ value, row }: any) => <SiteCell value={value} siteId={row.original.siteId} linkToDetails={linkToDetails} /> },
        { Header: 'Status', accessor: 'status', width: '15%', disableSortBy: true, Cell: ({ value }: any) => <StatusIcon value={value} /> },
        { Header: 'Health', accessor: 'health', width: '15%', disableSortBy: true, Cell: ({ value }: any) => <HealthBadge value={value} /> },
        { Header: 'Last Check', accessor: 'lastChecked', width: '15%' },
        { Header: 'Actions', accessor: 'action', width: '12%', disableSortBy: true },
      ],
      rows: sites.map((site) => ({
        site: [site.siteName || site.siteUrl || 'Untitled', { url: site.siteUrl || '-' }],
        siteId: site.$id,
        status: site.status,
        health: site.healthStatus,
        lastChecked: site.lastChecked ? new Date(site.lastChecked).toLocaleDateString('nl-NL') : '-',
        action: (
          <ActionCell
            siteId={site.$id}
            siteUrl={site.siteUrl || '#'}
            showPinButton={showPinButton}
            isPinned={isPinned(site.$id)}
            onTogglePin={onTogglePin ? () => onTogglePin(site.$id) : undefined}
          />
        ),
      })),
    };
    return (
      <>
        {showHeader && (
        <SoftBox p={2} borderBottom="1px solid" borderColor="grey-200" display="flex" justifyContent="space-between" alignItems="center">
          <SoftTypography variant="h6" fontWeight="bold" sx={{ color: headerColor }}>{headerTitle}</SoftTypography>
          {headerLinkTo && (
            <Link to={headerLinkTo} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <SoftTypography variant="button" fontWeight="bold" sx={{ color: headerColor }}>{headerLinkText}</SoftTypography>
              <Icon sx={{ fontSize: 18, color: headerColor }}>arrow_forward</Icon>
            </Link>
          )}
        </SoftBox>
        )}
        <SoftBox pt={2} pr={2} pb={2} pl={1}>
          <DataTable
            table={dataTableData}
            entriesPerPage={entriesPerPage}
            canSearch
            headerColor={headerColor}
          />
        </SoftBox>
      </>
    );
  }

  return (
    <>
      {showHeader && (
      <SoftBox p={2} borderBottom="1px solid" borderColor="grey-200" display="flex" justifyContent="space-between" alignItems="center">
        <SoftTypography variant="h6" fontWeight="bold" sx={{ color: headerColor }}>{headerTitle}</SoftTypography>
        {headerLinkTo && (
          <Link to={headerLinkTo} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <SoftTypography variant="button" fontWeight="bold" sx={{ color: headerColor }}>{headerLinkText}</SoftTypography>
            <Icon sx={{ fontSize: 18, color: headerColor }}>arrow_forward</Icon>
          </Link>
        )}
      </SoftBox>
      )}
      <SoftBox p={2}>
        {sites.length === 0 ? (
          <SoftBox py={3} textAlign="center">
            <SoftTypography variant="caption" color="secondary">No sites registered.</SoftTypography>
          </SoftBox>
        ) : (
          <SoftBox display="flex" flexDirection="column" gap={1}>
            {sites.map((site) => {
              const isExpanded = expanded[site.$id];
              return (
                <Box
                  key={site.$id}
                  onClick={() => toggleExpand(site.$id)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <SoftBox p={2} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <SoftBox flex={1} minWidth={0} sx={{ flexBasis: 'min-content' }}>
                      <SiteCell
                        value={[site.siteName || site.siteUrl || 'Untitled', { url: site.siteUrl || '-' }]}
                        siteId={site.$id}
                        linkToDetails={linkToDetails}
                      />
                    </SoftBox>
                    <SoftBox display="flex" alignItems="center" gap={0.5} onClick={(e) => e.stopPropagation()}>
                      <ActionCell
                        siteId={site.$id}
                        siteUrl={site.siteUrl || '#'}
                        showPinButton={showPinButton}
                        isPinned={isPinned(site.$id)}
                        onTogglePin={onTogglePin ? () => onTogglePin(site.$id) : undefined}
                      />
                    </SoftBox>
                    <Icon sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      expand_more
                    </Icon>
                  </SoftBox>
                  <Collapse in={isExpanded}>
                    <SoftBox px={2} pb={2} display="flex" flexWrap="wrap" gap={2} alignItems="center">
                      <SoftBox display="flex" alignItems="center" gap={0.5}>
                        <SoftTypography variant="caption" color="secondary">Status:</SoftTypography>
                        <StatusIcon value={site.status} />
                      </SoftBox>
                      <SoftBox display="flex" alignItems="center" gap={0.5}>
                        <SoftTypography variant="caption" color="secondary">Health:</SoftTypography>
                        <HealthBadge value={site.healthStatus} />
                      </SoftBox>
                      <SoftBox>
                        <SoftTypography variant="caption" color="secondary">Last check: </SoftTypography>
                        <SoftTypography variant="caption">
                          {site.lastChecked ? new Date(site.lastChecked).toLocaleDateString('nl-NL') : '-'}
                        </SoftTypography>
                      </SoftBox>
                    </SoftBox>
                  </Collapse>
                </Box>
              );
            })}
          </SoftBox>
        )}
      </SoftBox>
    </>
  );
}
