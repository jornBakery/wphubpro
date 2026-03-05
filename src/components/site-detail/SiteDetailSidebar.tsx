/**
 * Site Detail Sidebar - Site Details card + vertical tab navigation
 */
import React from 'react';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import { StatusIcon, HealthBadge } from '../sites/SitesTableCells';
import { useDeleteSite, useCheckSiteHealth } from '../../hooks/useSites';
import type { Site } from '../../types';

const infoGradient = 'linear-gradient(310deg, #4F5482, #7a8ef0)';
const orangeGradient = 'linear-gradient(310deg, #ea580c, #fb923c)';

const TAB_ITEMS = [
  { index: 0, label: 'Overview', icon: 'info' },
  { index: 1, label: 'Plugins', icon: 'extension' },
  { index: 2, label: "Thema's", icon: 'palette' },
  { index: 3, label: 'Health', icon: 'health_and_safety' },
];

interface SiteDetailSidebarProps {
  site: Site;
  tab: number;
  onTabChange: (index: number) => void;
  onEdit: () => void;
  onRemove: () => void;
}

const SiteDetailSidebar: React.FC<SiteDetailSidebarProps> = ({
  site,
  tab,
  onTabChange,
  onEdit,
  onRemove,
}) => {
  const checkHealth = useCheckSiteHealth(site.$id);
  const siteName = (site as any).siteName || (site as any).site_name || 'Naamloze site';
  const siteUrl = (site as any).siteUrl || (site as any).site_url || '';
  const fullUrl = siteUrl && !siteUrl.startsWith('http') ? `https://${siteUrl}` : siteUrl;

  return (
    <SoftBox display="flex" flexDirection="column" gap={2}>
      {/* Site Details Card */}
      <Card>
        <SoftBox p={2}>
          <SoftTypography variant="h6" fontWeight="bold" mb={1}>
            {siteName}
          </SoftTypography>
          {siteUrl && (
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <SoftTypography
                variant="caption"
                color="secondary"
                sx={{ display: 'block', wordBreak: 'break-all', '&:hover': { textDecoration: 'underline' } }}
              >
                {siteUrl}
              </SoftTypography>
            </a>
          )}
          <SoftBox display="flex" alignItems="center" gap={1} mt={1.5} mb={1.5}>
            <StatusIcon value={site.status} />
            <HealthBadge value={site.healthStatus} />
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
                }}
              >
                <Icon sx={{ fontSize: 18 }}>delete</Icon>
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
                }}
              >
                <Icon sx={{ fontSize: 18 }}>sync</Icon>
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
                }}
              >
                <Icon sx={{ fontSize: 18 }}>edit</Icon>
              </IconButton>
            </Tooltip>
          </SoftBox>
        </SoftBox>
      </Card>

      {/* Vertical tab menu */}
      <Card>
        <List disablePadding>
          {TAB_ITEMS.map(({ index, label, icon }) => (
            <ListItemButton
              key={index}
              selected={tab === index}
              onClick={() => onTabChange(index)}
              sx={{
                py: 1.25,
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small">{icon}</Icon>
              </ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ variant: 'button', fontWeight: tab === index ? 'bold' : 'regular' }} />
            </ListItemButton>
          ))}
        </List>
      </Card>
    </SoftBox>
  );
};

export default SiteDetailSidebar;
