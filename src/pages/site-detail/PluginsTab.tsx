import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import SoftBadge from 'components/SoftBadge';
import { usePlugins, useTogglePlugin, useDeletePlugin } from '../../hooks/useWordPress';
import { useSite } from '../../hooks/useSites';
import { WordPressPlugin } from '../../types';

interface PluginsTabProps {
  siteId: string;
}

const PluginsTab: React.FC<PluginsTabProps> = ({ siteId }) => {
  const { data: plugins, isLoading, isError, error, refetch } = usePlugins(siteId);
  const { data: site } = useSite(siteId);
  const togglePluginMutation = useTogglePlugin(siteId);
  const deletePluginMutation = useDeletePlugin(siteId);

  const handleToggle = (plugin: WordPressPlugin) => {
    togglePluginMutation.mutate({ pluginSlug: plugin.plugin, status: plugin.status, pluginName: plugin.name });
  };

  const handleDelete = (plugin: WordPressPlugin) => {
    if (window.confirm(`Weet je zeker dat je "${plugin.name}" wilt verwijderen?`)) {
      deletePluginMutation.mutate({ pluginFile: plugin.plugin, pluginName: plugin.name });
    }
  };

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
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Plugin</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Status</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Versie</SoftTypography></TableCell>
              <TableCell align="right"><SoftTypography variant="caption" fontWeight="bold">Acties</SoftTypography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plugins?.map((plugin) => (
              <TableRow key={plugin.plugin}>
                <TableCell><SoftTypography variant="button" fontWeight="medium">{plugin.name}</SoftTypography></TableCell>
                <TableCell>
                  <SoftBadge variant="contained" color={plugin.status === 'active' ? 'success' : 'secondary'} size="xs" badgeContent={plugin.status === 'active' ? 'Actief' : 'Inactief'} container />
                </TableCell>
                <TableCell><SoftTypography variant="caption">{plugin.version}</SoftTypography></TableCell>
                <TableCell align="right">
                  <SoftBox display="flex" gap={1} justifyContent="flex-end">
                    <SoftButton variant="outlined" color="info" size="small" onClick={() => handleToggle(plugin)} disabled={(togglePluginMutation.isPending && togglePluginMutation.variables?.pluginSlug === plugin.plugin) || (deletePluginMutation.isPending && deletePluginMutation.variables?.pluginFile === plugin.plugin)}>
                      {togglePluginMutation.isPending && togglePluginMutation.variables?.pluginSlug === plugin.plugin ? '...' : plugin.status === 'active' ? 'Deactiveren' : 'Activeren'}
                    </SoftButton>
                    <SoftButton variant="outlined" color="error" size="small" onClick={() => handleDelete(plugin)} disabled={(togglePluginMutation.isPending && togglePluginMutation.variables?.pluginSlug === plugin.plugin) || (deletePluginMutation.isPending && deletePluginMutation.variables?.pluginFile === plugin.plugin)}>
                      {deletePluginMutation.isPending && deletePluginMutation.variables?.pluginFile === plugin.plugin ? '...' : 'Verwijderen'}
                    </SoftButton>
                  </SoftBox>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default PluginsTab;
