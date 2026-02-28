/**
 * Dashboard sites monitor - Updates, % healthy, disconnected count
 */
import React from 'react';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import { Site } from '../../types';

interface DashboardSitesMonitorProps {
  sites: Site[];
  pluginUpdatesCount?: number;
  themeUpdatesCount?: number;
}

const DashboardSitesMonitor: React.FC<DashboardSitesMonitorProps> = ({
  sites,
  pluginUpdatesCount = 0,
  themeUpdatesCount = 0,
}) => {
  const healthyCount = sites.filter((s) => s.healthStatus === 'healthy').length;
  const disconnectedCount = sites.filter((s) => s.status === 'disconnected').length;
  const total = sites.length;
  const healthyPct = total > 0 ? Math.round((healthyCount / total) * 100) : 0;

  return (
    <Card>
      <SoftBox p={3}>
        <SoftTypography variant="h6" fontWeight="medium" mb={2}>
          Sites Monitor
        </SoftTypography>
        <SoftBox display="flex" flexDirection="column" gap={2}>
          <SoftBox display="flex" alignItems="center" gap={1}>
            <Icon color="info" fontSize="small">system_update</Icon>
            <SoftTypography variant="button">
              {pluginUpdatesCount} plugin{pluginUpdatesCount !== 1 ? 's' : ''} &amp; {themeUpdatesCount} thema{themeUpdatesCount !== 1 ? "'s" : ''} updates beschikbaar
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" alignItems="center" gap={1}>
            <Icon color={healthyPct >= 80 ? 'success' : healthyPct >= 50 ? 'warning' : 'error'} fontSize="small">
              monitor_heart
            </Icon>
            <SoftTypography variant="button">
              {healthyPct}% van uw sites is healthy
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" alignItems="center" gap={1}>
            <Icon color={disconnectedCount === 0 ? 'success' : 'error'} fontSize="small">link</Icon>
            <SoftTypography variant="button">
              {disconnectedCount === 0
                ? 'Al uw sites zijn verbonden'
                : `${disconnectedCount} site${disconnectedCount !== 1 ? 's' : ''} losgekoppeld`}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </SoftBox>
    </Card>
  );
};

export default DashboardSitesMonitor;
