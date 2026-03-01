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

export const SiteCell: React.FC<{ value: [string, { url: string }] }> = ({ value: [name, data] }) => (
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
      <SoftTypography variant="button" fontWeight="medium">{name || 'Untitled'}</SoftTypography>
      <SoftTypography variant="caption" color="secondary" display="block">{data?.url || '-'}</SoftTypography>
    </SoftBox>
  </SoftBox>
);

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

const infoGradient = 'linear-gradient(310deg, #4F5482, #7a8ef0)';
const orangeGradient = 'linear-gradient(310deg, #ea580c, #fb923c)';

const ActionIconButton: React.FC<{
  icon: string;
  title: string;
  color?: 'info' | 'error';
  onClick?: () => void;
}> = ({ icon, title, color = 'info', onClick }) => {
  const isDelete = color === 'error';
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
          background: isDelete ? orangeGradient : infoGradient,
          color: 'white',
          cursor: 'pointer',
          '&:hover': { opacity: 0.9 },
        }}
        component="span"
        onClick={onClick}
      >
        <Icon sx={{ fontSize: 18, color: 'white !important' }}>{icon}</Icon>
      </SoftBox>
    </Tooltip>
  );
};

export const ActionCell: React.FC<{ siteId: string; siteUrl: string }> = ({ siteId, siteUrl }) => {
  const deleteSite = useDeleteSite();
  const handleDelete = () => {
    if (window.confirm('Weet je zeker dat je deze site wilt verwijderen?')) {
      deleteSite.mutate(siteId);
    }
  };
  return (
    <SoftBox display="flex" alignItems="center" gap={0.5}>
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
