/**
 * Shared table cells for Sites DataTable - used by SitesPage and Dashboard
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftBadge from 'components/SoftBadge';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import { Site } from '../../types';
import { useDeleteSite, useUpdateSite } from '../../domains/sites';

function parseSiteMeta(site: Site): Record<string, unknown> {
  if (!site.meta_data) return {};
  try {
    const parsed = JSON.parse(site.meta_data);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

const infoGradient = 'linear-gradient(310deg, #4F5482, #7a8ef0)';
const orangeGradient = 'linear-gradient(310deg, #ea580c, #fb923c)';

interface SiteCellProps {
  value: [string, { url: string }];
  siteId?: string;
  linkToDetails?: boolean;
}

export const SiteCell: React.FC<SiteCellProps> = ({ value: [name, data], siteId, linkToDetails = false }) => {
  const content = (
    <SoftBox display="flex" alignItems="center">
    <SoftBox
      mx={2}
      display="flex"
      alignItems="center"
      justifyContent="center"
      width="3rem"
      height="3rem"
      borderRadius="md"
      sx={{ background: infoGradient }}
    >
      <Icon sx={{ color: 'white !important' }}>public</Icon>
    </SoftBox>
    <SoftBox>
      {linkToDetails && siteId ? (
        <Link to={`/sites/${siteId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <SoftTypography variant="button" fontWeight="medium" sx={{ '&:hover': { textDecoration: 'underline' } }}>
            {name || 'Untitled'}
          </SoftTypography>
        </Link>
      ) : (
        <SoftTypography variant="button" fontWeight="medium">{name || 'Untitled'}</SoftTypography>
      )}
      {data?.url && (data.url.startsWith('http') ? (
        <a href={data.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.75rem', display: 'block', opacity: 0.7 }} title={data.url}>
          <SoftTypography variant="caption" color="secondary" component="span" sx={{ '&:hover': { textDecoration: 'underline' } }}>{data.url}</SoftTypography>
        </a>
      ) : (
        <SoftTypography variant="caption" color="secondary" display="block">{data.url || '-'}</SoftTypography>
      ))}
    </SoftBox>
  </SoftBox>
  );
  return content;
};

export const StatusIcon: React.FC<{ value: Site['status'] }> = ({ value }) => {
  const isConnected = value === 'connected';
  return (
    <Tooltip title={isConnected ? 'Verbonden' : 'Losgekoppeld'} placement="top">
      <SoftBox sx={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}>
        <Icon
          sx={{
            fontSize: '1.5rem !important',
            ...(isConnected
              ? {
                  background: orangeGradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent !important',
                }
              : {
                  background: 'none !important',
                  backgroundClip: 'unset',
                  WebkitBackgroundClip: 'unset',
                  color: '#9e9e9e !important',
                }),
          }}
        >
          {isConnected ? 'flash_on' : 'flash_off'}
        </Icon>
      </SoftBox>
    </Tooltip>
  );
};

export const HealthBadge: React.FC<{ value: Site['healthStatus'] }> = ({ value }) => {
  const config: Record<string, { color: 'info' | 'error'; label: string }> = {
    healthy: { color: 'info', label: 'Healthy' },
    bad: { color: 'error', label: 'Bad' },
  };
  const c = config[value] || config.bad;
  return <SoftBadge variant="gradient" color={c.color} size="xs" badgeContent={c.label} container />;
};

/** On/Off toggle button – when off, site is excluded from stats and no bridge API calls. */
export const SiteEnabledToggle: React.FC<{
  enabled: boolean;
  onToggle: () => void;
  size?: 'small' | 'normal';
}> = ({ enabled, onToggle, size = 'normal' }) => {
  const sz = size === 'small' ? 28 : 32;
  return (
    <Tooltip title={enabled ? 'Site aan – klik om uit te zetten' : 'Site uit – klik om aan te zetten'} placement="top">
      <SoftBox
        component="button"
        type="button"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation?.();
          onToggle();
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: sz,
          height: sz,
          borderRadius: '50%',
          background: enabled ? orangeGradient : 'grey.400',
          color: 'white',
          cursor: 'pointer',
          border: 'none',
          '&:hover': { opacity: 0.9 },
        }}
      >
        <Icon sx={{ fontSize: size === 'small' ? 16 : 18, color: 'white !important' }}>{enabled ? 'power' : 'power_off'}</Icon>
      </SoftBox>
    </Tooltip>
  );
};

export const ActionIconButton: React.FC<{
  icon: string;
  title: string;
  color?: 'info' | 'error' | 'success';
  onClick?: () => void;
  disabled?: boolean;
}> = ({ icon, title, color = 'info', onClick, disabled = false }) => {
  const bg = color === 'error' ? orangeGradient : color === 'success' ? orangeGradient : infoGradient;
  return (
    <Tooltip title={title} placement="top">
      <span style={{ display: 'inline-flex' }}>
        <SoftBox
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: bg,
            color: 'white',
            cursor: disabled ? 'default' : onClick ? 'pointer' : 'inherit',
            opacity: disabled ? 0.6 : 1,
            pointerEvents: disabled ? 'none' : undefined,
            '&:hover': onClick && !disabled ? { opacity: 0.9 } : undefined,
          }}
          component={onClick && !disabled ? 'button' : 'span'}
          onClick={disabled ? undefined : onClick}
          {...(onClick && !disabled && { type: 'button' as const })}
        >
          <Icon sx={{ fontSize: 18, color: 'white !important' }}>{icon}</Icon>
        </SoftBox>
      </span>
    </Tooltip>
  );
};

export const ActionCell: React.FC<{
  siteId: string;
  siteUrl: string;
  site?: Site;
  showPinButton?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  compact?: boolean;
}> = ({ siteId, siteUrl, site, showPinButton = false, isPinned = false, onTogglePin, compact = false }) => {
  const deleteSite = useDeleteSite();
  const updateSite = useUpdateSite();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleToggleEnabled = () => {
    if (!site) return;
    const meta = parseSiteMeta(site);
    meta.enabled = !(site.enabled !== false);
    updateSite.mutate({ siteId: site.$id, meta_data: JSON.stringify(meta) });
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const handleDelete = () => {
    handleMenuClose();
    if (window.confirm('Weet je zeker dat je deze site wilt verwijderen?')) {
      deleteSite.mutate(siteId);
    }
  };

  const handlePin = () => {
    handleMenuClose();
    onTogglePin?.();
  };

  const handleSettings = () => {
    handleMenuClose();
    navigate(`/sites/${siteId}`);
  };

  const handleOpenSite = () => {
    handleMenuClose();
    window.open(siteUrl, '_blank');
  };

  const enabledToggle = site && (
    <SiteEnabledToggle enabled={site.enabled !== false} onToggle={handleToggleEnabled} />
  );

  const pinButton = showPinButton && onTogglePin && (
    <Tooltip title={isPinned ? 'Verwijder van dashboard' : 'Pin naar dashboard'} placement="top">
      <SoftBox
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: isPinned ? 'rgba(249, 115, 22, 0.15)' : infoGradient,
          cursor: 'pointer',
          '&:hover': { opacity: 0.9 },
        }}
        component="button"
        type="button"
        onClick={onTogglePin}
      >
        <Icon sx={{ fontSize: 18, color: isPinned ? '#F97316 !important' : 'white !important' }}>push_pin</Icon>
      </SoftBox>
    </Tooltip>
  );

  const settingsButton = (
    <Link to={`/sites/${siteId}`} style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}>
      <ActionIconButton icon="settings" title="Beheer" />
    </Link>
  );

  const openSiteButton = (
    <a href={siteUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}>
      <ActionIconButton icon="open_in_new" title="Open site" />
    </a>
  );

  const deleteButton = (
    <ActionIconButton icon="delete" title="Verwijderen" color="error" onClick={handleDelete} />
  );

  if (compact) {
    return (
      <>
        <Tooltip title="Acties" placement="top">
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ color: '#F97316' }}
            aria-controls={open ? 'site-actions-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Icon>more_vert</Icon>
          </IconButton>
        </Tooltip>
        <Menu
          id="site-actions-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          MenuListProps={{ 'aria-labelledby': 'site-actions-button' }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {site && (
            <MenuItem onClick={() => { handleToggleEnabled(); handleMenuClose(); }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SoftBox
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: site.enabled !== false ? orangeGradient : 'grey.400',
                  }}
                >
                  <Icon sx={{ fontSize: 16, color: 'white !important' }}>{site.enabled !== false ? 'power' : 'power_off'}</Icon>
                </SoftBox>
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ sx: { fontSize: '0.65rem !important', fontWeight: 700, textTransform: 'uppercase' } }}>{site.enabled !== false ? 'Site uitzetten' : 'Site aanzetten'}</ListItemText>
            </MenuItem>
          )}
          {showPinButton && onTogglePin && (
            <MenuItem onClick={handlePin}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SoftBox
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: isPinned ? 'rgba(249, 115, 22, 0.2)' : infoGradient,
                  }}
                >
                  <Icon sx={{ fontSize: 16, color: isPinned ? '#4F5482 !important' : 'white !important' }}>push_pin</Icon>
                </SoftBox>
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ sx: { fontSize: '0.65rem !important', fontWeight: 700, textTransform: 'uppercase' } }}>{isPinned ? 'Verwijder van dashboard' : 'Pin naar dashboard'}</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleSettings}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SoftBox
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: infoGradient,
                }}
              >
                <Icon sx={{ fontSize: 16, color: 'white !important' }}>settings</Icon>
              </SoftBox>
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ sx: { fontSize: '0.65rem !important', fontWeight: 700, textTransform: 'uppercase' } }}>Beheer</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleOpenSite}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SoftBox
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: infoGradient,
                }}
              >
                <Icon sx={{ fontSize: 16, color: 'white !important' }}>open_in_new</Icon>
              </SoftBox>
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ sx: { fontSize: '0.65rem !important', fontWeight: 700, textTransform: 'uppercase' } }}>Open site</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SoftBox
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: orangeGradient,
                }}
              >
                <Icon sx={{ fontSize: 16, color: 'white !important' }}>delete</Icon>
              </SoftBox>
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ sx: { fontSize: '0.65rem !important', fontWeight: 700, textTransform: 'uppercase' } }}>Verwijderen</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  }

  return (
    <SoftBox display="flex" alignItems="center" gap={0.5}>
      {enabledToggle}
      {pinButton}
      {settingsButton}
      {openSiteButton}
      {deleteButton}
    </SoftBox>
  );
};
