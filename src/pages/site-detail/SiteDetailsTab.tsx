/**
 * Site Details tab - action buttons, site info, analytics, technical data
 */
import React from 'react';
import Grid from '@mui/material/Grid';
import Icon from '@mui/material/Icon';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import SoftBadge from 'components/SoftBadge';
import Card from '@mui/material/Card';
import DefaultCounterCard from 'examples/Cards/CounterCards/DefaultCounterCard';
import { useSite, useDeleteSite, useCheckSiteHealth } from '../../hooks/useSites';
import { usePlugins, useThemes } from '../../hooks/useWordPress';

interface SiteDetailsTabProps {
  siteId: string;
  onEdit?: () => void;
  onRemove?: () => void;
}

const SiteDetailsTab: React.FC<SiteDetailsTabProps> = ({ siteId, onEdit, onRemove }) => {
  const { data: site } = useSite(siteId);
  const { data: plugins } = usePlugins(siteId);
  const { data: themes } = useThemes(siteId);
  const deleteSite = useDeleteSite();
  const checkHealth = useCheckSiteHealth(siteId);

  const activePlugins = plugins?.filter((p: { status: string }) => p.status === 'active').length ?? 0;
  const installedPlugins = plugins?.length ?? 0;
  const installedThemes = themes?.length ?? 0;

  const handleCheckConnection = () => {
    checkHealth.mutate();
  };

  if (!site) return null;

  const statusConfig: Record<string, { color: 'success' | 'error'; label: string }> = {
    connected: { color: 'success', label: 'Verbonden' },
    disconnected: { color: 'error', label: 'Losgekoppeld' },
  };
  const healthConfig: Record<string, { color: 'success' | 'error'; label: string }> = {
    healthy: { color: 'success', label: 'Healthy' },
    bad: { color: 'error', label: 'Bad' },
  };
  const sc = statusConfig[site.status || 'disconnected'] || statusConfig.disconnected;
  const hc = healthConfig[site.healthStatus || 'bad'] || healthConfig.bad;

  return (
    <SoftBox>
      {/* Action buttons */}
      <SoftBox display="flex" gap={1} mb={3} flexWrap="wrap">
        <SoftButton variant="outlined" color="error" size="small" onClick={onRemove || (() => {
          if (window.confirm('Weet je zeker dat je deze site wilt verwijderen?')) deleteSite.mutate(siteId);
        })}>
          <Icon sx={{ mr: 0.5, fontSize: 18 }}>delete</Icon>
          Verwijderen
        </SoftButton>
        <SoftButton variant="outlined" color="info" size="small" onClick={onEdit || (() => {})}>
          <Icon sx={{ mr: 0.5, fontSize: 18 }}>edit</Icon>
          Naam/URL bewerken
        </SoftButton>
        <SoftButton variant="gradient" color="success" size="small" onClick={handleCheckConnection} disabled={checkHealth.isPending}>
          <Icon sx={{ mr: 0.5, fontSize: 18 }}>sync</Icon>
          {checkHealth.isPending ? 'Controleren...' : 'Verbinding controleren'}
        </SoftButton>
      </SoftBox>

      <Grid container spacing={3}>
        {/* Site info */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <SoftBox p={3}>
              <SoftTypography variant="h6" fontWeight="medium" mb={2}>Site-informatie</SoftTypography>
              <SoftBox component="dl" sx={{ m: 0 }}>
                <SoftBox display="flex" justifyContent="space-between" py={1} borderBottom="1px solid" borderColor="grey-200">
                  <SoftTypography variant="caption" color="secondary">Naam</SoftTypography>
                  <SoftTypography variant="button" fontWeight="medium">{(site as any).siteName || (site as any).site_name || '—'}</SoftTypography>
                </SoftBox>
                <SoftBox display="flex" justifyContent="space-between" py={1} borderBottom="1px solid" borderColor="grey-200">
                  <SoftTypography variant="caption" color="secondary">URL</SoftTypography>
                  {((site as any).siteUrl || (site as any).site_url) ? (
                    <a href={((site as any).siteUrl || (site as any).site_url).startsWith('http') ? ((site as any).siteUrl || (site as any).site_url) : `https://${(site as any).siteUrl || (site as any).site_url}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <SoftTypography variant="caption" fontWeight="medium" sx={{ wordBreak: 'break-all', '&:hover': { textDecoration: 'underline' } }}>{(site as any).siteUrl || (site as any).site_url}</SoftTypography>
                    </a>
                  ) : (
                    <SoftTypography variant="caption" fontWeight="medium" sx={{ wordBreak: 'break-all' }}>—</SoftTypography>
                  )}
                </SoftBox>
                <SoftBox display="flex" justifyContent="space-between" py={1} borderBottom="1px solid" borderColor="grey-200">
                  <SoftTypography variant="caption" color="secondary">Status</SoftTypography>
                  <SoftBadge variant="contained" color={sc.color} size="xs" badgeContent={sc.label} container />
                </SoftBox>
                <SoftBox display="flex" justifyContent="space-between" py={1} borderBottom="1px solid" borderColor="grey-200">
                  <SoftTypography variant="caption" color="secondary">Gezondheid</SoftTypography>
                  <SoftBadge variant="contained" color={hc.color} size="xs" badgeContent={hc.label} container />
                </SoftBox>
                <SoftBox display="flex" justifyContent="space-between" py={1} borderBottom="1px solid" borderColor="grey-200">
                  <SoftTypography variant="caption" color="secondary">Aangemaakt</SoftTypography>
                  <SoftTypography variant="caption">{(site as any).$createdAt ? new Date((site as any).$createdAt).toLocaleDateString('nl-NL') : '—'}</SoftTypography>
                </SoftBox>
                <SoftBox display="flex" justifyContent="space-between" py={1}>
                  <SoftTypography variant="caption" color="secondary">API Key</SoftTypography>
                  <SoftTypography variant="caption">{(site as any).api_key || (site as any).apiKey ? '••••••••' : '—'}</SoftTypography>
                </SoftBox>
              </SoftBox>
            </SoftBox>
          </Card>
        </Grid>

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
