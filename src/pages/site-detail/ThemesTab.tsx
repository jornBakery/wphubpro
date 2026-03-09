import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import ScrollableTableWrapper from 'components/ScrollableTableWrapper';
import TableRow from '@mui/material/TableRow';
import DataTableHeadCell from 'examples/Tables/DataTable/DataTableHeadCell';
import DataTableBodyCell from 'examples/Tables/DataTable/DataTableBodyCell';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import SoftBox from 'components/SoftBox';
import SoftButton from 'components/SoftButton';
import { ActionIconButton } from '../../components/sites/SitesTableCells';
import SoftTypography from 'components/SoftTypography';
import { useThemes, useManageTheme } from '../../hooks/useWordPress';
import { useSite } from '../../domains/sites';
import type { WordPressTheme } from '../../types';

const infoGradient = 'linear-gradient(310deg, #4F5482, #7a8ef0)';
const orangeGradient = 'linear-gradient(310deg, #ea580c, #fb923c)';

interface ThemesTabProps {
  siteId: string;
}

const ThemesTab: React.FC<ThemesTabProps> = ({ siteId }) => {
  const { data: site } = useSite(siteId);
  const { data: themes, isLoading, isError, error, refetch } = useThemes(siteId, { enabled: site?.enabled });
  const manageTheme = useManageTheme(siteId);

  const handleActivate = (theme: WordPressTheme) => {
    if (theme.status !== 'active') {
      manageTheme.mutate({ themeSlug: theme.stylesheet, action: 'activate', themeName: theme.name });
    }
  };

  const handleUpdate = (theme: WordPressTheme) => {
    manageTheme.mutate({ themeSlug: theme.stylesheet, action: 'update', themeName: theme.name });
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
              <DataTableHeadCell width="50%" pl={5} color="#4F5482">Thema</DataTableHeadCell>
              <DataTableHeadCell width="20%" pl={undefined} color="#4F5482">Status</DataTableHeadCell>
              <DataTableHeadCell width="20%" pl={undefined} color="#4F5482">Versie</DataTableHeadCell>
              <DataTableHeadCell width="10%" align="right" pl={undefined} color="#4F5482" sorted="none">Acties</DataTableHeadCell>
            </TableRow>
          </SoftBox>
          <TableBody>
            {themes?.map((theme) => (
              <TableRow key={theme.stylesheet}>
                <DataTableBodyCell><SoftTypography variant="button" fontWeight="medium">{theme.name}</SoftTypography></DataTableBodyCell>
                <DataTableBodyCell>
                  <SoftBox
                  component="span"
                  sx={{
                    display: 'inline-block',
                    minWidth: 72,
                    textAlign: 'center',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    background: theme.status === 'active' ? orangeGradient : infoGradient,
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  {theme.status === 'active' ? 'Actief' : 'Inactief'}
                </SoftBox>
                </DataTableBodyCell>
                <DataTableBodyCell><SoftTypography variant="caption">{theme.version}</SoftTypography></DataTableBodyCell>
                <DataTableBodyCell align="right">
                  <SoftBox display="flex" gap={0.5} justifyContent="flex-end">
                    {theme.update != null && theme.update !== '' && (
                      <ActionIconButton
                        icon="system_update"
                        title={manageTheme.isPending ? '...' : `Bijwerken naar ${theme.update}`}
                        color="success"
                        onClick={() => handleUpdate(theme)}
                        disabled={manageTheme.isPending}
                      />
                    )}
                    <ActionIconButton
                      icon="check_circle"
                      title={theme.status === 'active' ? 'Actief' : 'Activeren'}
                      color="info"
                      onClick={() => handleActivate(theme)}
                      disabled={manageTheme.isPending || theme.status === 'active'}
                    />
                  </SoftBox>
                </DataTableBodyCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollableTableWrapper>
    </Card>
  );
};

export default ThemesTab;
