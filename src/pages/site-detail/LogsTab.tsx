/**
 * Logs tab – bridge API log from site option WPHUBPRO_LOG (via wphubpro/v1/logs).
 */
import React, { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useSiteLogs, type BridgeLogEntry } from '../../hooks/useWordPress';
import { useSite } from '../../hooks/useSites';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

interface LogRowProps {
  entry: BridgeLogEntry;
}

const LogRow: React.FC<LogRowProps> = ({ entry }) => {
  const [requestOpen, setRequestOpen] = useState(false);
  const [responseOpen, setResponseOpen] = useState(false);
  const codeOk = entry.code >= 200 && entry.code < 300;
  const codeErr = entry.code >= 400;
  const requestStr = typeof entry.request === 'object' && entry.request !== null
    ? JSON.stringify(entry.request, null, 2)
    : String(entry.request ?? '');
  const responseStr = typeof entry.response === 'object' && entry.response !== null
    ? JSON.stringify(entry.response, null, 2)
    : String(entry.response ?? '');

  return (
    <>
      <TableRow
        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        onClick={() => {
          setRequestOpen((o) => !o);
          setResponseOpen(false);
        }}
      >
        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{formatTime(entry.time)}</TableCell>
        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-word' }}>{entry.endpoint}</TableCell>
        <TableCell>{entry.type}</TableCell>
        <TableCell sx={{ fontWeight: 600, color: codeOk ? 'success.main' : codeErr ? 'error.main' : 'text.primary' }}>{entry.code}</TableCell>
        <TableCell sx={{ maxWidth: 160 }}>
          <Typography
            component="span"
            variant="caption"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setRequestOpen((o) => !o); setResponseOpen(false); }}
            sx={{ cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace' }}
          >
            {requestOpen ? 'Hide' : 'Request'}
          </Typography>
        </TableCell>
        <TableCell sx={{ maxWidth: 160 }}>
          <Typography
            component="span"
            variant="caption"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setResponseOpen((o) => !o); setRequestOpen(false); }}
            sx={{ cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace' }}
          >
            {responseOpen ? 'Hide' : 'Response'}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: requestOpen || responseOpen ? '1px solid' : 0, borderColor: 'divider' }}>
          <Collapse in={requestOpen} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Request</Typography>
              <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {requestStr || '—'}
              </Box>
            </Box>
          </Collapse>
          <Collapse in={responseOpen} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Response</Typography>
              <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {responseStr || '—'}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

interface LogsTabProps {
  siteId: string;
}

const LogsTab: React.FC<LogsTabProps> = ({ siteId }) => {
  const { data: logs, isLoading, isError, error, refetch } = useSiteLogs(siteId);
  const { data: site } = useSite(siteId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={6}>
        <Icon sx={{ fontSize: 40, color: 'grey.400', mr: 2 }}>sync</Icon>
        <Typography variant="body2" color="textSecondary">Logs laden...</Typography>
      </Box>
    );
  }

  if (isError) {
    const apiUrl = site ? `${String(site.siteUrl).replace(/\/$/, '')}/wp-json/wphubpro/v1/logs` : 'unknown';
    return (
      <Card>
        <Box p={3}>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>API: {apiUrl}</Typography>
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Icon color="error" sx={{ mt: 0.5 }}>error</Icon>
            <Box flex={1}>
              <Typography variant="h6" fontWeight="medium" color="error" sx={{ mb: 1 }}>Fout bij laden van logs</Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>{error?.message || String(error)}</Typography>
              <Button variant="outlined" color="info" size="small" onClick={() => refetch()}>Opnieuw proberen</Button>
            </Box>
          </Box>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box p={2} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="caption" color="textSecondary">
          Laatste 20 aanroepen naar het Bridge API (option WPHUBPRO_LOG). API: {site ? `${String(site.siteUrl).replace(/\/$/, '')}/wp-json/wphubpro/v1/logs` : '—'}
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="caption" fontWeight="bold">Tijd</Typography></TableCell>
              <TableCell><Typography variant="caption" fontWeight="bold">Endpoint</Typography></TableCell>
              <TableCell><Typography variant="caption" fontWeight="bold">Type</Typography></TableCell>
              <TableCell><Typography variant="caption" fontWeight="bold">Code</Typography></TableCell>
              <TableCell><Typography variant="caption" fontWeight="bold">Request</Typography></TableCell>
              <TableCell><Typography variant="caption" fontWeight="bold">Response</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!logs || logs.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="caption" color="textSecondary">Geen logs.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((entry, i) => <LogRow key={i} entry={entry} />)
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default LogsTab;
