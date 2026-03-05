/**
 * Overview tab - 4 cards: Plugins need update, Themes need update, Health analysis, Action log
 */
import React from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import DefaultCounterCard from 'examples/Cards/CounterCards/DefaultCounterCard';
import { useSite } from '../../hooks/useSites';
import { usePlugins, useThemes } from '../../hooks/useWordPress';

interface SiteDetailsTabProps {
  siteId: string;
  onTabChange?: (index: number) => void;
}

const SiteDetailsTab: React.FC<SiteDetailsTabProps> = ({ siteId, onTabChange }) => {
  const { data: site } = useSite(siteId);
  const { data: plugins } = usePlugins(siteId);
  const { data: themes } = useThemes(siteId);

  const pluginsNeedingUpdate = plugins?.filter((p) => Boolean((p as any).update)).length ?? 0;
  const themesNeedingUpdate = themes?.filter((t) => Boolean((t as any).update)).length ?? 0;
  const logCount = Array.isArray((site as any)?.action_log) ? (site as any).action_log.length : 0;
  const healthStatus = site?.healthStatus ?? 'unknown';

  if (!site) return null;

  const handleGoToHealth = () => onTabChange?.(3);

  return (
    <SoftBox>
      <Grid container spacing={3}>
        {/* 1. Plugins need update */}
        <Grid item xs={12} sm={6}>
          <DefaultCounterCard
            count={pluginsNeedingUpdate}
            title="Plugins need update"
            description="beschikbaar"
            color={pluginsNeedingUpdate > 0 ? 'warning' : 'success'}
          />
        </Grid>

        {/* 2. Themes need update */}
        <Grid item xs={12} sm={6}>
          <DefaultCounterCard
            count={themesNeedingUpdate}
            title="Themes need update"
            description="beschikbaar"
            color={themesNeedingUpdate > 0 ? 'warning' : 'success'}
          />
        </Grid>

        {/* 3. Health analysis details */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <SoftBox p={2} height="100%" display="flex" flexDirection="column" justifyContent="space-between">
              <SoftBox display="flex" alignItems="center" gap={1} mb={1}>
                <Icon color={healthStatus === 'healthy' ? 'success' : 'error'}>
                  {healthStatus === 'healthy' ? 'check_circle' : 'warning'}
                </Icon>
                <SoftTypography variant="h6" fontWeight="medium">Health analysis details</SoftTypography>
              </SoftBox>
              <SoftTypography variant="caption" color="secondary" mb={1}>
                Status: {healthStatus === 'healthy' ? 'Gezond' : 'Problemen gevonden'}
              </SoftTypography>
              <SoftTypography
                variant="button"
                color="info"
                fontWeight="medium"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={handleGoToHealth}
              >
                Bekijk volledige analyse →
              </SoftTypography>
            </SoftBox>
          </Card>
        </Grid>

        {/* 4. Action log */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%', minHeight: 140 }}>
            <SoftBox p={2} height="100%" display="flex" flexDirection="column" justifyContent="space-between">
              <SoftBox display="flex" alignItems="center" gap={1} mb={1}>
                <Icon color="info">history</Icon>
                <SoftTypography variant="h6" fontWeight="medium">Action log</SoftTypography>
              </SoftBox>
              <SoftTypography variant="caption" color="secondary" mb={1}>
                {logCount} actie{logCount !== 1 ? 's' : ''} gelogd
              </SoftTypography>
              <SoftTypography
                variant="button"
                color="info"
                fontWeight="medium"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={handleGoToHealth}
              >
                Bekijk actielog →
              </SoftTypography>
            </SoftBox>
          </Card>
        </Grid>
      </Grid>
    </SoftBox>
  );
};

export default SiteDetailsTab;
