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
import { useThemes, useManageTheme } from '../../hooks/useWordPress';
import { useSite } from '../../hooks/useSites';
import type { WordPressTheme } from '../../types';

interface ThemesTabProps {
  siteId: string;
}

const ThemesTab: React.FC<ThemesTabProps> = ({ siteId }) => {
  const { data: themes, isLoading, isError, error, refetch } = useThemes(siteId);
  const { data: site } = useSite(siteId);
  const manageTheme = useManageTheme(siteId);

  const handleActivate = (theme: WordPressTheme) => {
    if (theme.status !== 'active') {
      manageTheme.mutate({ themeSlug: theme.stylesheet, action: 'activate', themeName: theme.name });
    }
  };

  if (isLoading) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" p={6}>
        <Icon sx={{ fontSize: 40, color: 'grey.400', mr: 2 }}>sync</Icon>
        <SoftTypography variant="button" color="secondary">Themas laden...</SoftTypography>
      </SoftBox>
    );
  }

  if (isError) {
    const apiUrl = site ? `${String(site.siteUrl).replace(/\/$/, '')}/wp-json/wphubpro/v1/themes` : 'unknown';
    return (
      <Card>
        <SoftBox p={3}>
          <SoftTypography variant="caption" color="secondary" mb={2} display="block">API: {apiUrl}</SoftTypography>
          <SoftBox display="flex" alignItems="flex-start" gap={2}>
            <Icon color="error" sx={{ mt: 0.5 }}>error</Icon>
            <SoftBox flex={1}>
              <SoftTypography variant="h6" fontWeight="medium" color="error" mb={1}>Fout bij laden van themas</SoftTypography>
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
          API: {site ? `${String(site.siteUrl).replace(/\/$/, '')}/wp-json/wphubpro/v1/themes` : '-'}
        </SoftTypography>
      </SoftBox>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Thema</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Status</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Versie</SoftTypography></TableCell>
              <TableCell align="right"><SoftTypography variant="caption" fontWeight="bold">Acties</SoftTypography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {themes?.map((theme) => (
              <TableRow key={theme.stylesheet}>
                <TableCell><SoftTypography variant="button" fontWeight="medium">{theme.name}</SoftTypography></TableCell>
                <TableCell>
                  <SoftBadge variant="contained" color={theme.status === 'active' ? 'success' : 'secondary'} size="xs" badgeContent={theme.status === 'active' ? 'Actief' : 'Inactief'} container />
                </TableCell>
                <TableCell><SoftTypography variant="caption">{theme.version}</SoftTypography></TableCell>
                <TableCell align="right">
                  <SoftButton variant="gradient" color="info" size="small" disabled={manageTheme.isPending || theme.status === 'active'} onClick={() => handleActivate(theme)}>
                    {theme.status === 'active' ? 'Actief' : 'Activeren'}
                  </SoftButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default ThemesTab;
