/**
 * Site Health tab - Action log + health status
 */
import React, { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Card from '@mui/material/Card';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import { useSite } from '../../hooks/useSites';
import type { ActionLogEntry } from '../../types';

interface SiteHealthTabProps {
  siteId: string;
}

const SiteHealthTab: React.FC<SiteHealthTabProps> = ({ siteId }) => {
  const { data: site, isLoading, isError, error } = useSite(siteId);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isLoading) {
    return (
      <SoftBox p={6} textAlign="center">
        <SoftTypography variant="button" color="secondary">Action log laden...</SoftTypography>
      </SoftBox>
    );
  }

  if (isError || !site) {
    return (
      <SoftBox p={4}>
        <SoftTypography variant="button" color="error">{error?.message || 'Fout bij laden.'}</SoftTypography>
      </SoftBox>
    );
  }

  const log: ActionLogEntry[] = Array.isArray((site as any)?.action_log) ? [...(site as any).action_log].reverse() : [];

  return (
    <Card>
      <SoftBox p={2} borderBottom="1px solid" borderColor="grey-200">
        <SoftTypography variant="h6" fontWeight="medium">Site Health &amp; Action Log</SoftTypography>
        <SoftTypography variant="caption" color="secondary">Overzicht van API-aanroepen en gezondheid</SoftTypography>
      </SoftBox>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Actie</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Endpoint</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">Datum/Tijd</SoftTypography></TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {log.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <SoftTypography variant="caption" color="secondary">Nog geen acties gelogd.</SoftTypography>
                </TableCell>
              </TableRow>
            )}
            {log.map((entry, idx) => (
              <React.Fragment key={idx}>
                <TableRow>
                  <TableCell><SoftTypography variant="caption">{entry.action}</SoftTypography></TableCell>
                  <TableCell><SoftTypography variant="caption" sx={{ wordBreak: 'break-all' }}>{entry.endpoint}</SoftTypography></TableCell>
                  <TableCell><SoftTypography variant="caption">{new Date(entry.timestamp).toLocaleString('nl-NL')}</SoftTypography></TableCell>
                  <TableCell align="right">
                    <SoftButton
                      variant="text"
                      color="info"
                      size="small"
                      onClick={() => setExpanded(expanded === idx ? null : idx)}
                    >
                      {expanded === idx ? 'Verbergen' : 'Details'}
                    </SoftButton>
                  </TableCell>
                </TableRow>
                {expanded === idx && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 0, borderTop: 'none' }}>
                      <SoftBox p={2} bgColor="grey-100" borderRadius="md">
                        <SoftTypography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.7rem' }}>
                          <strong>Request:</strong> {JSON.stringify(entry.request, null, 2)}
                          {'\n'}
                          <strong>Response:</strong> {typeof entry.response === 'object' ? JSON.stringify(entry.response, null, 2) : String(entry.response)}
                        </SoftTypography>
                      </SoftBox>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default SiteHealthTab;
