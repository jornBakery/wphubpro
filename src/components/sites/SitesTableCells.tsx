/**
 * Shared table cells for Sites DataTable - used by SitesPage and Dashboard
 */
import React from 'react';
import { Link } from 'react-router-dom';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftBadge from 'components/SoftBadge';
import Icon from '@mui/material/Icon';
import Tooltip from '@mui/material/Tooltip';
import { Site } from '../../types';
import { useDeleteSite } from '../../hooks/useSites';

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
            color: isConnected ? 'success.main' : 'error.main',
            fontSize: '1.5rem !important',
          }}
        >
          {isConnected ? 'bolt' : 'power_off'}
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

const ActionIconButton: React.FC<{
  icon: string;
  title: string;
  color?: 'info' | 'error' | 'success';
  onClick?: () => void;
}> = ({ icon, title, color = 'info', onClick }) => {
  const bg = color === 'error' ? orangeGradient : color === 'success' ? orangeGradient : infoGradient;
  return (
    <Tooltip title={title} placement="top">
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
          cursor: onClick ? 'pointer' : 'inherit',
          '&:hover': { opacity: 0.9 },
        }}
        component={onClick ? 'button' : 'span'}
        onClick={onClick}
        {...(onClick && { type: 'button' as const })}
      >
        <Icon sx={{ fontSize: 18, color: 'white !important' }}>{icon}</Icon>
      </SoftBox>
    </Tooltip>
  );
};

export const ActionCell: React.FC<{
  siteId: string;
  siteUrl: string;
  showPinButton?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}> = ({ siteId, siteUrl, showPinButton = false, isPinned = false, onTogglePin }) => {
  const deleteSite = useDeleteSite();
  const handleDelete = () => {
    if (window.confirm('Weet je zeker dat je deze site wilt verwijderen?')) {
      deleteSite.mutate(siteId);
    }
  };
  return (
    <SoftBox display="flex" alignItems="center" gap={0.5}>
      {showPinButton && onTogglePin && (
        <ActionIconButton
          icon="push_pin"
          title={isPinned ? 'Verwijder van dashboard' : 'Pin naar dashboard'}
          color={isPinned ? 'success' : 'info'}
          onClick={onTogglePin}
        />
      )}
      <Link to={`/sites/${siteId}`} style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}>
        <ActionIconButton icon="settings" title="Beheer" />
      </Link>
      <a href={siteUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex' }}>
        <ActionIconButton icon="open_in_new" title="Open site" />
      </a>
      <ActionIconButton icon="delete" title="Verwijderen" color="error" onClick={handleDelete} />
    </SoftBox>
  );
};
