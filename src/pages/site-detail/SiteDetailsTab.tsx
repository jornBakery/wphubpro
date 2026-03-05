/**
 * Overview tab - analytics and technical data
 */
import React from 'react';
import Grid from '@mui/material/Grid';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import Card from '@mui/material/Card';
import DefaultCounterCard from 'examples/Cards/CounterCards/DefaultCounterCard';
import { useSite } from '../../hooks/useSites';
import { usePlugins, useThemes } from '../../hooks/WordPress';

interface SiteDetailsTabProps {
  siteId: string;
}

const SiteDetailsTab: React.FC<SiteDetailsTabProps> = ({ siteId }) => {
  const { data: site } = useSite(siteId);
  const { data: plugins } = usePlugins(siteId);
  const { data: themes } = useThemes(siteId);

  const activePlugins = plugins?.filter((p: { status: string }) => p.status === 'active').length ?? 0;
  const installedPlugins = plugins?.length ?? 0;
  const installedThemes = themes?.length ?? 0;

  if (!site) return null;

  return (
    <SoftBox>
      <Grid container spacing={3}>
        {/* Analytics counters */}
        <Grid item xs={12} md={6}>
          <SoftTypography variant="h6" fontWeight="medium" mb={2}>Analytics</SoftTypography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <DefaultCounterCard count={installedPlugins} title="Geïnstalleerde plugins" description="totaal" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DefaultCounterCard count={activePlugins} title="Geactiveerde plugins" description="actief" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DefaultCounterCard count={installedThemes} title="Geïnstalleerde thema's" description="totaal" />
            </Grid>
          </Grid>
        </Grid>

        {/* Technical data */}
        <Grid item xs={12}>
          <Card>
            <SoftBox p={3}>
              <SoftTypography variant="h6" fontWeight="medium" mb={2}>Technische gegevens</SoftTypography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <SoftTypography variant="caption" color="secondary">WordPress versie</SoftTypography>
                  <SoftTypography variant="button">{(site as any).wpVersion || site.wpVersion || '—'}</SoftTypography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SoftTypography variant="caption" color="secondary">PHP versie</SoftTypography>
                  <SoftTypography variant="button">{(site as any).phpVersion || site.phpVersion || '—'}</SoftTypography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SoftTypography variant="caption" color="secondary">Schijfruimte</SoftTypography>
                  <SoftTypography variant="button">—</SoftTypography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SoftTypography variant="caption" color="secondary">Memory limit</SoftTypography>
                  <SoftTypography variant="button">—</SoftTypography>
                </Grid>
              </Grid>
            </SoftBox>
          </Card>
        </Grid>
      </Grid>
    </SoftBox>
  );
};

export default SiteDetailsTab;
