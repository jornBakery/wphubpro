/**
 * Dashboard health cards - Updates, Healthy %, Connected, Total Health Score
 * 4 cards displayed above the sites table
 */
import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import Grid from '@mui/material/Grid';

import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';

import { Site } from '../../types';

interface DashboardHealthCardsProps {
  sites: Site[];
  /** Sites that need an update (plugin or theme) */
  sitesNeedingUpdatesCount?: number;
  /** Plugins that can be updated across all sites */
  pluginUpdatesCount?: number;
  /** Total plugins across all sites */
  pluginTotalCount?: number;
  /** Themes that can be updated across all sites */
  themeUpdatesCount?: number;
  /** Total themes across all sites */
  themeTotalCount?: number;
}

/** Healthy = no critical health issues + at least 80% of WP site health checks passed */
const isHealthy = (site: Site): boolean => site.healthStatus === 'healthy';

const blueGradient = 'linear-gradient(310deg, #4F5482, #7a8ef0)';

/** Icon at 98% of card height, 20% opacity, centered - white, 6rem */
const iconBgSx = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  height: '98%',
  width: '98%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.2,
  color: 'white !important',
  pointerEvents: 'none' as const,
  fontSize: '6rem !important',
};

/** Alias for backwards compatibility */
const iconBoxSx = iconBgSx;

/** Orange bold text styling */
const orangeBold = { color: '#ea580c', fontWeight: 700 };

/** Round white circle for X/X numbers - explicit white bg so it shows on all cards */
const numberCircleSx = {
  flexShrink: 0,
  width: 56,
  height: 56,
  minWidth: 56,
  minHeight: 56,
  borderRadius: '50%',
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ea580c',
  fontFamily: '"Inter", sans-serif',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums' as const,
  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
};

/** Card 4 circle - white bg, dark text so XX% is readable on orange card */
const numberCircleCard4Sx = {
  ...numberCircleSx,
  color: '#292F4D',
};

const DashboardHealthCards: React.FC<DashboardHealthCardsProps> = ({
  sites,
  sitesNeedingUpdatesCount = 0,
  pluginUpdatesCount = 0,
  pluginTotalCount = 0,
  themeUpdatesCount = 0,
  themeTotalCount = 0,
}) => {
  const total = sites.length;
  const healthyCount = sites.filter(isHealthy).length;
  const disconnectedCount = sites.filter((s) => s.status === 'disconnected').length;
  const healthyPct = total > 0 ? Math.round((healthyCount / total) * 100) : 0;
  const connectedPct = total > 0 ? Math.round(((total - disconnectedCount) / total) * 100) : 0;
  const updatesScore =
    pluginTotalCount + themeTotalCount > 0
      ? Math.round(
          (1 -
            (pluginUpdatesCount + themeUpdatesCount) / (pluginTotalCount + themeTotalCount)) *
            100
        )
      : 100;
  const totalHealthScore =
    total > 0 ? Math.round((updatesScore + healthyPct + connectedPct) / 3) : 0;

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* Card 1: Updates */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card sx={{ minHeight: 145, background: blueGradient, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <Icon sx={iconBgSx}>system_update</Icon>
          <SoftBox p={2} flex={1} display="flex" flexDirection="row" alignItems="center" gap={2} color="white" position="relative" justifyContent="flex-end">
            <SoftBox display="flex" flexDirection="column" flex={1} gap={1}>
              <SoftTypography variant="h6" fontWeight="bold" color="white" textAlign="right" sx={{ textDecoration: 'underline' }}>
                Updates
              </SoftTypography>
              <SoftTypography variant="button" color="white" fontWeight="regular" textAlign="right" sx={{ opacity: 0.95 }}>
                sites need an update.
              </SoftTypography>
            </SoftBox>
            <Box sx={numberCircleSx}>
              <SoftTypography variant="h6" fontWeight="bold" color="#ea580c" sx={{ fontFamily: '"Inter", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                {sitesNeedingUpdatesCount}/{total}
              </SoftTypography>
            </Box>
          </SoftBox>
        </Card>
      </Grid>

      {/* Card 2: Healthy sites */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card sx={{ minHeight: 145, background: blueGradient, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <Icon sx={iconBgSx}>monitor_heart</Icon>
          <SoftBox p={2} flex={1} display="flex" flexDirection="row" alignItems="center" gap={2} color="white" position="relative" justifyContent="flex-end">
            <SoftBox display="flex" flexDirection="column" flex={1} gap={1}>
              <SoftTypography variant="h6" fontWeight="bold" color="white" textAlign="right" sx={{ textDecoration: 'underline' }}>
                Healthy Sites
              </SoftTypography>
              <SoftTypography variant="button" color="white" fontWeight="regular" textAlign="right" sx={{ opacity: 0.95 }}>
                sites are healthy
              </SoftTypography>
            </SoftBox>
            <Box sx={numberCircleSx}>
              <SoftTypography variant="h6" fontWeight="bold" color="#ea580c" sx={{ fontFamily: '"Inter", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                {healthyCount}/{total}
              </SoftTypography>
            </Box>
          </SoftBox>
        </Card>
      </Grid>

      {/* Card 3: Connected */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card sx={{ minHeight: 145, background: blueGradient, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <Icon sx={iconBgSx}>link</Icon>
          <SoftBox p={2} flex={1} display="flex" flexDirection="row" alignItems="center" gap={2} color="white" position="relative" justifyContent="flex-end">
            <SoftBox display="flex" flexDirection="column" flex={1} gap={1}>
              <SoftTypography variant="h6" fontWeight="bold" color="white" textAlign="right" sx={{ textDecoration: 'underline' }}>
                Connection
              </SoftTypography>
              <SoftTypography variant="button" color="white" fontWeight="regular" textAlign="right" sx={{ opacity: 0.95 }}>
                sites are connected
              </SoftTypography>
            </SoftBox>
            <Box sx={numberCircleSx}>
              <SoftTypography variant="h6" fontWeight="bold" color="#ea580c" sx={{ fontFamily: '"Inter", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                {total - disconnectedCount}/{total}
              </SoftTypography>
            </Box>
          </SoftBox>
        </Card>
      </Grid>

      {/* Card 4: Total Health Score */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card sx={{ minHeight: 145, background: 'linear-gradient(310deg, #ea580c, #fb923c)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <Icon sx={iconBgSx}>assessment</Icon>
          <SoftBox
            p={2}
            flex={1}
            display="flex"
            flexDirection="row"
            alignItems="center"
            gap={2}
            color="white"
            position="relative"
            justifyContent="flex-end"
          >
            <SoftBox display="flex" flexDirection="column" flex={1} gap={1}>
              <SoftTypography variant="h6" fontWeight="bold" color="white" textAlign="right" sx={{ textDecoration: 'underline' }}>
                Health Score
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="white" textAlign="right" sx={{ opacity: 0.95 }}>
                Your Health Score
              </SoftTypography>
            </SoftBox>
            <Box sx={numberCircleCard4Sx}>
              <SoftTypography variant="h6" fontWeight="bold" color="#292F4D" sx={{ fontFamily: '"Inter", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                {totalHealthScore}%
              </SoftTypography>
            </Box>
          </SoftBox>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardHealthCards;
