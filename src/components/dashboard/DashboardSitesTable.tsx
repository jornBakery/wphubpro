/**
 * Dashboard sites table - Name, URL, WP version, health, status, plugins, actions
 */
import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Link } from 'react-router-dom';

import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftBadge from 'components/SoftBadge';
import { Site } from '../../types';
import { usePlugins } from '../../hooks/useWordPress';

interface DashboardSitesTableProps {
  sites: Site[];
}

const SiteRow: React.FC<{ site: Site }> = ({ site }) => {
  const { data: plugins } = usePlugins(site.$id);
  const pluginCount = plugins?.length ?? 0;
  const updateCount = plugins?.filter((p: { update?: { new_version?: string } }) => p.update?.new_version).length ?? 0;

  return (
    <TableRow>
      <TableCell>
        <SoftTypography variant="button" fontWeight="medium">
          {site.siteName || site.siteUrl || 'Untitled'}
        </SoftTypography>
      </TableCell>
      <TableCell>
        <SoftTypography variant="caption" sx={{ wordBreak: 'break-all' }}>
          {site.siteUrl || '-'}
        </SoftTypography>
      </TableCell>
      <TableCell>
        <SoftTypography variant="caption">{(site as { wpVersion?: string }).wpVersion ?? '-'}</SoftTypography>
      </TableCell>
      <TableCell>
        <SoftBadge
          variant="contained"
          color={site.healthStatus === 'healthy' ? 'success' : 'error'}
          size="xs"
          badgeContent={site.healthStatus === 'healthy' ? 'Healthy' : 'Bad'}
          container
        />
      </TableCell>
      <TableCell>
        <SoftBadge
          variant="contained"
          color={site.status === 'connected' ? 'success' : 'error'}
          size="xs"
          badgeContent={site.status === 'connected' ? 'Verbonden' : 'Losgekoppeld'}
          container
        />
      </TableCell>
      <TableCell>
        <SoftTypography variant="caption">
          {pluginCount} {updateCount > 0 ? `(${updateCount} need update)` : ''}
        </SoftTypography>
      </TableCell>
      <TableCell align="right">
        <Tooltip title="Beheer site">
          <IconButton size="small" component={Link} to={`/sites/${site.$id}`}>
            <Icon fontSize="small">settings</Icon>
          </IconButton>
        </Tooltip>
        <Tooltip title="Bezoek site">
          <IconButton
            size="small"
            href={site.siteUrl}
            target="_blank"
            rel="noreferrer"
            component="a"
          >
            <Icon fontSize="small">open_in_new</Icon>
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

const DashboardSitesTable: React.FC<DashboardSitesTableProps> = ({ sites }) => {
  return (
    <Card>
      <SoftBox p={2} borderBottom="1px solid" borderColor="grey-200" display="flex" justifyContent="space-between" alignItems="center">
        <SoftTypography variant="h6" fontWeight="medium">
          Sites
        </SoftTypography>
        <Link to="/sites" style={{ textDecoration: 'none' }}>
          <SoftTypography variant="button" fontWeight="regular" color="info">
            Alle sites
          </SoftTypography>
        </Link>
      </SoftBox>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Naam</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">URL</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">WP</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Gezondheid</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Status</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Plugins</SoftTypography></TableCell>
              <TableCell align="right"><SoftTypography variant="caption" fontWeight="bold">Acties</SoftTypography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <SoftBox py={3} textAlign="center">
                    <SoftTypography variant="caption" color="secondary">
                      Nog geen sites. Voeg uw eerste WordPress-site toe.
                    </SoftTypography>
                  </SoftBox>
                </TableCell>
              </TableRow>
            ) : (
              sites.slice(0, 10).map((site) => (
                <SiteRow key={site.$id} site={site} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default DashboardSitesTable;
