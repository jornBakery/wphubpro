/**
 * Site Detail Sidebar - Site Details card (name, URL, technical info, actions)
 * Tab navigation is rendered at the top of the page as a horizontal menu.
 */
import React from 'react';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import { StatusIcon, HealthBadge } from '../sites/SitesTableCells';
import { useCheckSiteHealth } from '../../domains/sites';
import { useSiteDetails } from '../../hooks/useWordPress';
import type { Site } from '../../types';

const infoGradient = 'linear-gradient(310deg, #4F5482, #7a8ef0)';
const orangeGradient = 'linear-gradient(310deg, #ea580c, #fb923c)';

interface SiteDetailSidebarProps {
  site: Site;
  onEdit: () => void;
  onRemove: () => void;
}

const SiteDetailSidebar: React.FC<SiteDetailSidebarProps> = ({
  site,
  onEdit,
  onRemove,
}) => {
  const checkHealth = useCheckSiteHealth(site.$id);
  const { data: details } = useSiteDetails(site.$id);
  const siteName = (site as any).siteName || (site as any).site_name || 'Naamloze site';
  const siteUrl = (site as any).siteUrl || (site as any).site_url || '';
  const fullUrl = siteUrl && !siteUrl.startsWith('http') ? `https://${siteUrl}` : siteUrl;

  return (
    <SoftBox display="flex" flexDirection="column" gap={2} sx={{ alignSelf: 'flex-start' }}>
      {/* Site Details Card - sticky on scroll */}
      <Card sx={{ position: 'sticky', top: 8, zIndex: 1, background: infoGradient, color: 'white' }}>
        <SoftBox p={2} sx={{ color: 'white' }}>
          <SoftTypography variant="h6" fontWeight="bold" mb={1} sx={{ color: 'white' }}>
            {siteName}
          </SoftTypography>
          {siteUrl && (
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none', color: 'white' }}
            >
              <SoftTypography
                variant="caption"
                sx={{ display: 'block', wordBreak: 'break-all', color: 'rgba(255,255,255,0.9)', '&:hover': { textDecoration: 'underline' } }}
              >
                {siteUrl}
              </SoftTypography>
            </a>
          )}
          <SoftBox display="flex" alignItems="center" gap={1} mt={1.5} mb={1.5}>
            <StatusIcon value={site.status} />
            <HealthBadge value={site.healthStatus} />
          </SoftBox>

          {/* Technical details */}
          <SoftBox mt={2} pt={2} borderTop="1px solid rgba(255,255,255,0.3)">
            <SoftTypography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 1, color: 'rgba(255,255,255,0.9)' }}>
              Technische gegevens
            </SoftTypography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <SoftTypography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>WordPress</SoftTypography>
                <SoftTypography variant="button" display="block" sx={{ color: 'white' }}>{details?.wp_version || (site as any).wpVersion || site.wpVersion || '—'}</SoftTypography>
              </Grid>
              <Grid item xs={6}>
                <SoftTypography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>PHP</SoftTypography>
                <SoftTypography variant="button" display="block" sx={{ color: 'white' }}>{details?.php_version || (site as any).phpVersion || site.phpVersion || '—'}</SoftTypography>
              </Grid>
              <Grid item xs={6}>
                <SoftTypography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>Schijfruimte</SoftTypography>
                <SoftTypography variant="button" display="block" sx={{ color: 'white' }}>—</SoftTypography>
              </Grid>
              <Grid item xs={6}>
                <SoftTypography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>Memory limit</SoftTypography>
                <SoftTypography variant="button" display="block" sx={{ color: 'white' }}>—</SoftTypography>
              </Grid>
            </Grid>
          </SoftBox>
          <SoftBox display="flex" alignItems="center" gap={0.5}>
            <Tooltip title="Verwijderen" placement="top">
              <IconButton
                size="small"
                onClick={onRemove}
                sx={{
                  width: 32,
                  height: 32,
                  background: orangeGradient,
                  color: 'white',
                  '&:hover': { background: orangeGradient, opacity: 0.9 },
                  '& .MuiSvgIcon-root': { color: 'white' },
                }}
              >
                <Icon sx={{ fontSize: 18, color: 'white !important' }}>delete</Icon>
              </IconButton>
            </Tooltip>
            <Tooltip title="Verbinding controleren" placement="top">
              <IconButton
                size="small"
                onClick={() => checkHealth.mutate()}
                disabled={checkHealth.isPending}
                sx={{
                  width: 32,
                  height: 32,
                  background: infoGradient,
                  color: 'white',
                  '&:hover': { background: infoGradient, opacity: 0.9 },
                  '& .MuiSvgIcon-root': { color: 'white' },
                }}
              >
                <Icon sx={{ fontSize: 18, color: 'white !important' }}>sync</Icon>
              </IconButton>
            </Tooltip>
            <Tooltip title="Bewerken" placement="top">
              <IconButton
                size="small"
                onClick={onEdit}
                sx={{
                  width: 32,
                  height: 32,
                  background: infoGradient,
                  color: 'white',
                  '&:hover': { background: infoGradient, opacity: 0.9 },
                  '& .MuiSvgIcon-root': { color: 'white' },
                }}
              >
                <Icon sx={{ fontSize: 18, color: 'white !important' }}>edit</Icon>
              </IconButton>
            </Tooltip>
          </SoftBox>
        </SoftBox>
      </Card>
    </SoftBox>
  );
};

export default SiteDetailSidebar;
