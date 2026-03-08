/**
 * Dashboard sites monitor - Updates, % healthy, disconnected count
 */
import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import Typography from '@mui/material/Typography';
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
      <Box p={2}>
        <Box display="flex" flexDirection="column" gap={0.75}>
          <Box display="flex" alignItems="center" gap={1}>
            <Icon color="info" sx={{ fontSize: 18 }}>system_update</Icon>
            <Typography variant="caption">
              {pluginUpdatesCount} plugin{pluginUpdatesCount !== 1 ? 's' : ''} &amp; {themeUpdatesCount} thema{themeUpdatesCount !== 1 ? "'s" : ''} updates
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Icon color={healthyPct >= 80 ? 'success' : healthyPct >= 50 ? 'warning' : 'error'} sx={{ fontSize: 18 }}>monitor_heart</Icon>
            <Typography variant="caption">
              {healthyPct}% sites healthy
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Icon color={disconnectedCount === 0 ? 'success' : 'error'} sx={{ fontSize: 18 }}>link</Icon>
            <Typography variant="caption">
              {disconnectedCount === 0 ? 'Alles verbonden' : `${disconnectedCount} losgekoppeld`}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default DashboardSitesMonitor;
