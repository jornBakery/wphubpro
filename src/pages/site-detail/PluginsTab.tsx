import React, { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import ScrollableTableWrapper from 'components/ScrollableTableWrapper';
import TableRow from '@mui/material/TableRow';
import DataTableHeadCell from 'examples/Tables/DataTable/DataTableHeadCell';
import DataTableBodyCell from 'examples/Tables/DataTable/DataTableBodyCell';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import SoftBadge from 'components/SoftBadge';
import { usePlugins, useTogglePlugin, useUpdatePlugin, useDeletePlugin } from '../../hooks/useWordPress';
import { useSite } from '../../hooks/useSites';
import { WordPressPlugin } from '../../types';

const infoGradient = 'linear-gradient(310deg, #4F5482, #7a8ef0)';
const orangeGradient = 'linear-gradient(310deg, #ea580c, #fb923c)';

interface PluginsTabProps {
  siteId: string;
}

const PluginsTab: React.FC<PluginsTabProps> = ({ siteId }) => {
  const { data: plugins, isLoading, isError, error, refetch } = usePlugins(siteId);
  const { data: site } = useSite(siteId);
  const togglePluginMutation = useTogglePlugin(siteId);
  const updatePluginMutation = useUpdatePlugin(siteId);
  const deletePluginMutation = useDeletePlugin(siteId);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; plugin: WordPressPlugin } | null>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, plugin: WordPressPlugin) => {
    e.stopPropagation();
    setMenuAnchor({ el: e.currentTarget, plugin });
  };
  const handleMenuClose = () => setMenuAnchor(null);

  const handleToggle = (plugin: WordPressPlugin) => {
    handleMenuClose();
    togglePluginMutation.mutate({ pluginSlug: plugin.plugin, status: plugin.status, pluginName: plugin.name });
  };

  const handleUpdate = (plugin: WordPressPlugin) => {
    handleMenuClose();
    updatePluginMutation.mutate({ pluginFile: plugin.plugin, pluginName: plugin.name });
  };

  const handleDelete = (plugin: WordPressPlugin) => {
    handleMenuClose();
    if (window.confirm(`Weet je zeker dat je "${plugin.name}" wilt verwijderen?`)) {
      deletePluginMutation.mutate({ pluginFile: plugin.plugin, pluginName: plugin.name });
    }
  };

  const openPlugin = menuAnchor?.plugin;
  const anyPending = togglePluginMutation.isPending || updatePluginMutation.isPending || deletePluginMutation.isPending;

  if (isLoading) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" p={6}>
        <Icon sx={{ fontSize: 40, color: 'grey.400', mr: 2 }}>sync</Icon>
        <SoftTypography variant="button" color="secondary">Plugins laden...</SoftTypography>
      </SoftBox>
    );
  }

  if (isError) {
    const apiUrl = site ? `${String(site.siteUrl).replace(/\/$/, '')}/wp-json/wphubpro/v1/plugins` : 'unknown';
    return (
      <Card>
        <SoftBox p={3}>
          <SoftTypography variant="caption" color="secondary" mb={2} display="block">API: {apiUrl}</SoftTypography>
          <SoftBox display="flex" alignItems="flex-start" gap={2}>
            <Icon color="error" sx={{ mt: 0.5 }}>error</Icon>
            <SoftBox flex={1}>
              <SoftTypography variant="h6" fontWeight="medium" color="error" mb={1}>Fout bij laden van plugins</SoftTypography>
              <SoftTypography variant="caption" color="secondary" mb={2}>{error?.message || String(error)}</SoftTypography>
              <SoftButton variant="outlined" color="info" size="small" onClick={() => refetch()}>Opnieuw proberen</SoftButton>
            </SoftBox>
          </SoftBox>
        </SoftBox>
      </Card>
    );
  }

  return (
    <Card>
      <SoftBox p={2} borderBottom="1px solid" borderColor="grey-200">
        <SoftTypography variant="caption" color="secondary">
          API: {site ? `${String(site.siteUrl).replace(/\/$/, '')}/wp-json/wphubpro/v1/plugins` : '-'}
        </SoftTypography>
      </SoftBox>
      <ScrollableTableWrapper maxHeight="55vh">
        <Table
          stickyHeader
          sx={{
            tableLayout: 'fixed',
            width: '100%',
            '& thead th': {
              position: 'sticky',
              top: 0,
              zIndex: 2,
              backgroundColor: 'background.paper',
              boxShadow: '0 1px 0 0 rgba(0,0,0,0.08)',
            },
            '& tbody td:first-of-type': {
              paddingLeft: (theme) => theme.spacing(5),
              paddingRight: (theme) => theme.spacing(3),
            },
            '& thead th:last-of-type': { paddingRight: (theme) => theme.spacing(4) },
            '& tbody td:last-of-type': { paddingRight: (theme) => theme.spacing(4) },
          }}
        >
          <SoftBox component="thead">
            <TableRow>
              {/* Column widths total 100%: 50 + 20 + 20 + 10 */}
              <DataTableHeadCell width="50%" pl={5} color="#4F5482">Plugin</DataTableHeadCell>
              <DataTableHeadCell width="20%" pl={undefined} color="#4F5482">Status</DataTableHeadCell>
              <DataTableHeadCell width="20%" pl={undefined} color="#4F5482">Versie</DataTableHeadCell>
              <DataTableHeadCell width="10%" align="right" pl={undefined} color="#4F5482" sorted={false}>Acties</DataTableHeadCell>
            </TableRow>
          </SoftBox>
          <TableBody>
            {plugins?.map((plugin) => (
              <TableRow key={plugin.plugin}>
                <DataTableBodyCell><SoftTypography variant="button" fontWeight="medium">{plugin.name}</SoftTypography></DataTableBodyCell>
                <DataTableBodyCell>
                  <SoftBadge variant="contained" color={plugin.status === 'active' ? 'success' : 'secondary'} size="xs" badgeContent={plugin.status === 'active' ? 'Actief' : 'Inactief'} container />
                </DataTableBodyCell>
                <DataTableBodyCell>
                  <SoftBox display="flex" alignItems="center" gap={0.5}>
                    <SoftTypography variant="caption">{plugin.version}</SoftTypography>
                    {plugin.update != null && plugin.update !== '' && (
                      <Tooltip title={`Update beschikbaar: ${plugin.update}`} placement="top">
                        <Icon sx={{ fontSize: 16, color: 'warning.main' }}>notification_important</Icon>
                      </Tooltip>
                    )}
                  </SoftBox>
                </DataTableBodyCell>
                <DataTableBodyCell align="right">
                  <Tooltip title="Acties" placement="top">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, plugin)}
                      sx={{ color: '#F97316' }}
                      aria-controls={openPlugin?.plugin === plugin.plugin ? 'plugin-actions-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={openPlugin?.plugin === plugin.plugin ? 'true' : undefined}
                      disabled={anyPending}
                    >
                      <Icon>more_vert</Icon>
                    </IconButton>
                  </Tooltip>
                </DataTableBodyCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollableTableWrapper>
      <Menu
        id="plugin-actions-menu"
        anchorEl={menuAnchor?.el ?? null}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        MenuListProps={{ 'aria-labelledby': 'plugin-actions-button' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {openPlugin && (
          <>
            {openPlugin.update != null && openPlugin.update !== '' && (
              <MenuItem
                onClick={() => handleUpdate(openPlugin)}
                disabled={updatePluginMutation.isPending && updatePluginMutation.variables?.pluginFile === openPlugin.plugin}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <SoftBox sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(310deg, #16a34a, #22c55e)' }}>
                    <Icon sx={{ fontSize: 16, color: 'white !important' }}>system_update</Icon>
                  </SoftBox>
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ sx: { fontSize: '0.65rem !important', fontWeight: 700, textTransform: 'uppercase' } }}>
                  Bijwerken naar {openPlugin.update}
                </ListItemText>
              </MenuItem>
            )}
            <MenuItem
              onClick={() => handleToggle(openPlugin)}
              disabled={togglePluginMutation.isPending && togglePluginMutation.variables?.pluginSlug === openPlugin.plugin}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SoftBox sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: infoGradient }}>
                  <Icon sx={{ fontSize: 16, color: 'white !important' }}>{openPlugin.status === 'active' ? 'power_off' : 'power'}</Icon>
                </SoftBox>
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ sx: { fontSize: '0.65rem !important', fontWeight: 700, textTransform: 'uppercase' } }}>
                {openPlugin.status === 'active' ? 'Deactiveren' : 'Activeren'}
              </ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => handleDelete(openPlugin)}
              sx={{ color: 'error.main' }}
              disabled={deletePluginMutation.isPending && deletePluginMutation.variables?.pluginFile === openPlugin.plugin}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SoftBox sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: orangeGradient }}>
                  <Icon sx={{ fontSize: 16, color: 'white !important' }}>delete</Icon>
                </SoftBox>
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ sx: { fontSize: '0.65rem !important', fontWeight: 700, textTransform: 'uppercase' } }}>Verwijderen</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </Card>
  );
};

export default PluginsTab;
