/**
 * Logs tab – sub-tabs: Bridge Logs, Error Logs, Execution Logs (Appwrite wp-proxy for this site).
 */
import React, { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ScrollableTableWrapper from 'components/ScrollableTableWrapper';
import TableRow from '@mui/material/TableRow';
import DataTableHeadCell from 'examples/Tables/DataTable/DataTableHeadCell';
import DataTableBodyCell from 'examples/Tables/DataTable/DataTableBodyCell';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useSiteLogs, useSiteErrorLog, useSiteExecutionLogs, type BridgeLogEntry, type AppwriteExecution } from '../../hooks/useWordPress';
import { useSite } from '../../hooks/useSites';
// Voorbeeld van hoe je dit in LogsTab.tsx gebruikt

function parseExecutionEndpoint(requestPath: string): string {
  if (!requestPath || !requestPath.includes('?')) return requestPath || '—';
  const qs = requestPath.slice(requestPath.indexOf('?') + 1);
  const endpoint = new URLSearchParams(qs).get('endpoint');
  return endpoint ? decodeURIComponent(endpoint) : requestPath;
}

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
        <DataTableBodyCell>
          <Typography component="span" sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{formatTime(entry.time)}</Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-word' }}>{entry.endpoint}</Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>{entry.type}</DataTableBodyCell>
        <DataTableBodyCell>
          <Typography component="span" sx={{ fontWeight: 600, color: codeOk ? 'success.main' : codeErr ? 'error.main' : 'text.primary' }}>{entry.code}</Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <Typography
            component="span"
            variant="caption"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setRequestOpen((o) => !o); setResponseOpen(false); }}
            sx={{ cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace' }}
          >
            {requestOpen ? 'Hide' : 'Request'}
          </Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <Typography
            component="span"
            variant="caption"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setResponseOpen((o) => !o); setRequestOpen(false); }}
            sx={{ cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace' }}
          >
            {responseOpen ? 'Hide' : 'Response'}
          </Typography>
        </DataTableBodyCell>
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

function BridgeLogsPanel({ siteId }: { siteId: string }) {
  const { data: logs, isLoading, isError, error, refetch } = useSiteLogs(siteId);
  const { data: site } = useSite(siteId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={6}>
        <Icon sx={{ fontSize: 40, color: 'grey.400', mr: 2 }}>sync</Icon>
        <Typography variant="body2" color="textSecondary">Bridge logs laden...</Typography>
      </Box>
    );
  }

  if (isError) {
    const apiUrl = site ? `${String(site.siteUrl).replace(/\/$/, '')}/wp-json/wphubpro/v1/logs` : 'unknown';
    return (
      <Box p={3}>
        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>API: {apiUrl}</Typography>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Icon color="error" sx={{ mt: 0.5 }}>error</Icon>
          <Box flex={1}>
            <Typography variant="h6" fontWeight="medium" color="error" sx={{ mb: 1 }}>Fout bij laden van bridge logs</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>{error?.message || String(error)}</Typography>
            <Button variant="outlined" color="info" size="small" onClick={() => refetch()}>Opnieuw proberen</Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box p={2} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="caption" color="textSecondary">
          Laatste 20 aanroepen naar het Bridge API (option WPHUBPRO_LOG). API: {site ? `${String(site.siteUrl).replace(/\/$/, '')}/wp-json/wphubpro/v1/logs` : '—'}
        </Typography>
      </Box>
      <ScrollableTableWrapper maxHeight="55vh">
        <Table
          size="small"
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
          <Box component="thead">
            <TableRow>
              <DataTableHeadCell width="15%" pl={5} color="#4F5482">Tijd</DataTableHeadCell>
              <DataTableHeadCell width="30%" pl={undefined} color="#4F5482">Endpoint</DataTableHeadCell>
              <DataTableHeadCell width="10%" pl={undefined} color="#4F5482">Type</DataTableHeadCell>
              <DataTableHeadCell width="8%" pl={undefined} color="#4F5482">Code</DataTableHeadCell>
              <DataTableHeadCell width="20%" pl={undefined} color="#4F5482">Request</DataTableHeadCell>
              <DataTableHeadCell width="17%" pl={undefined} color="#4F5482">Response</DataTableHeadCell>
            </TableRow>
          </Box>
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
      </ScrollableTableWrapper>
    </>
  );
}

// PHP error log line: [date time] PHP Type: message [ in file.php on line N]
// Lines that don't match (e.g. "Stack trace:", "#0 ...", "  thrown in ...") are merged into the previous entry's message.
export interface ParsedErrorLogEntry {
  raw: string;
  timestamp: string;
  logType: string;
  file: string | null;
  line: number | null;
  message: string;
}

const PHP_ERROR_LINE_RE = /^\[([^\]]+)\]\s*PHP\s+(\w+(?:\s+\w+)?):\s*(.+)$/i;
// Match " in /path/file.php on line 123" or " thrown in /path/file.php on line 123"
const FILE_LINE_RE = /\s+(?:thrown\s+)?in\s+(.+?)\s+on\s+line\s+(\d+)\s*$/;
// Fallback: match "file.php(123)" or "file.php:123" in stack frames
const FILE_LINE_FALLBACK_RE = /([^\s()]+\.php)[:(](\d+)\)?/;

/** Extract file and line from a string (e.g. first line or full merged text). */
function extractFileLine(text: string): { file: string; line: number } | null {
  const m = FILE_LINE_RE.exec(text);
  if (m) return { file: m[1].trim(), line: parseInt(m[2], 10) };
  const m2 = FILE_LINE_FALLBACK_RE.exec(text);
  if (m2) return { file: m2[1].trim(), line: parseInt(m2[2], 10) };
  return null;
}

function parseSingleErrorLine(raw: string): Partial<ParsedErrorLogEntry> & { message: string } | null {
  const main = PHP_ERROR_LINE_RE.exec(raw);
  if (!main) return null;
  const timestamp = main[1].trim();
  const logType = main[2].trim();
  let msg = main[3].trim();
  const fileLine = extractFileLine(raw);
  if (fileLine) {
    const suffixMatch = FILE_LINE_RE.exec(msg);
    if (suffixMatch) msg = msg.slice(0, msg.length - suffixMatch[0].length).trim();
    return { raw, timestamp, logType, file: fileLine.file, line: fileLine.line, message: msg };
  }
  return { raw, timestamp, logType, file: null, line: null, message: msg };
}

/** Parse lines and merge stack traces / continuation lines into the previous entry's message. */
function parseErrorLogLines(lines: string[]): ParsedErrorLogEntry[] {
  const entries: ParsedErrorLogEntry[] = [];
  let current: ParsedErrorLogEntry | null = null;
  for (const raw of lines) {
    const parsed = parseSingleErrorLine(raw);
    if (parsed) {
      if (current) entries.push(current);
      current = {
        raw: parsed.raw,
        timestamp: parsed.timestamp ?? '',
        logType: parsed.logType ?? '',
        file: parsed.file ?? null,
        line: parsed.line ?? null,
        message: parsed.message,
      };
    } else if (current) {
      current.message = current.message + '\n' + raw;
      current.raw = current.raw + '\n' + raw;
      // Extract file/line from "thrown in ... on line N" in continuation if we don't have one yet
      if (current.file == null && current.line == null) {
        const fl = extractFileLine(current.raw);
        if (fl) {
          current.file = fl.file;
          current.line = fl.line;
        }
      }
    }
  }
  if (current) entries.push(current);
  return entries;
}

function logTypeColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('fatal') || t.includes('error') || t === 'error') return 'error.main';
  if (t.includes('warning')) return 'warning.main';
  if (t.includes('deprecated') || t.includes('notice')) return 'info.main';
  return 'text.secondary';
}

interface ErrorLogRowProps {
  entry: ParsedErrorLogEntry;
}

const ErrorLogRow: React.FC<ErrorLogRowProps> = ({ entry }) => {
  const [open, setOpen] = useState(false);
  const fileLine = entry.file != null && entry.line != null ? `${entry.file}:${entry.line}` : entry.file ?? '—';

  return (
    <>
      <TableRow
        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        onClick={() => setOpen((o) => !o)}
      >
        <DataTableBodyCell>
          <Typography component="span" sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{entry.timestamp || '—'}</Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: logTypeColor(entry.logType) }}>
            {entry.logType || '—'}
          </Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <Typography
            component="span"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              whiteSpace: 'normal',
              wordBreak: 'break-all',
              display: 'block',
              lineHeight: 1.4,
            }}
          >
            {fileLine}
          </Typography>
        </DataTableBodyCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={3} sx={{ py: 0, borderBottom: open ? '1px solid' : 0, borderColor: 'divider' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Bericht</Typography>
              <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                {entry.message || '—'}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

function ErrorLogsPanel({ siteId }: { siteId: string }) {
  const { data, isLoading, isError, error, refetch } = useSiteErrorLog(siteId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={6}>
        <Icon sx={{ fontSize: 40, color: 'grey.400', mr: 2 }}>sync</Icon>
        <Typography variant="body2" color="textSecondary">Error log laden...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Icon color="error" sx={{ mt: 0.5 }}>error</Icon>
          <Box flex={1}>
            <Typography variant="h6" fontWeight="medium" color="error" sx={{ mb: 1 }}>Fout bij laden van error log</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>{error?.message || String(error)}</Typography>
            <Button variant="outlined" color="info" size="small" onClick={() => refetch()}>Opnieuw proberen</Button>
          </Box>
        </Box>
      </Box>
    );
  }

  const rawLines = data?.lines ?? [];
  const lines = rawLines.filter((line) => !line.includes('[WPHubPro Bridge]'));
  const fileInfo = data?.file ?? null;
  const errorMsg = data?.error;
  const parsed = parseErrorLogLines(lines).filter(
    (entry) => entry.logType.toLowerCase().includes('error')
  );

  return (
    <>
      <Box p={2} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="caption" color="textSecondary" display="block">
          Laatste 200 regels van de PHP error log (alleen type error). Klik op een rij om het bericht te tonen.
        </Typography>
        {fileInfo && (
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
            Bestand: {fileInfo}
          </Typography>
        )}
        {errorMsg && (
          <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>{errorMsg}</Typography>
        )}
      </Box>
      {parsed.length === 0 ? (
        <Box p={3}>
          <Typography variant="body2" color="textSecondary">Geen regels of log niet leesbaar.</Typography>
        </Box>
      ) : (
        <ScrollableTableWrapper maxHeight="55vh">
          <Table
            size="small"
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
            <Box component="thead">
              <TableRow>
                <DataTableHeadCell width="22%" pl={5} color="#4F5482">Tijd</DataTableHeadCell>
                <DataTableHeadCell width="18%" pl={undefined} color="#4F5482">Type</DataTableHeadCell>
                <DataTableHeadCell width="60%" pl={undefined} color="#4F5482">Bestand:regel</DataTableHeadCell>
              </TableRow>
            </Box>
            <TableBody>
              {parsed.map((entry, i) => (
                <ErrorLogRow key={i} entry={entry} />
              ))}
            </TableBody>
          </Table>
        </ScrollableTableWrapper>
      )}
    </>
  );
}

interface ExecutionLogRowProps {
  execution: AppwriteExecution;
}

const ExecutionLogRow: React.FC<ExecutionLogRowProps> = ({ execution }) => {
  const [open, setOpen] = useState(false);
  const endpoint = parseExecutionEndpoint(execution.requestPath);
  const statusOk = execution.responseStatusCode >= 200 && execution.responseStatusCode < 300;
  const statusErr = execution.responseStatusCode >= 400;
  const statusColor = statusOk ? 'success.main' : statusErr ? 'error.main' : 'text.primary';

  return (
    <>
      <TableRow sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => setOpen((o) => !o)}>
        <DataTableBodyCell>
          <Typography component="span" sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{formatTime(execution.$createdAt)}</Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: execution.status === 'completed' ? 'success.main' : execution.status === 'failed' ? 'error.main' : 'text.secondary' }}>
            {execution.status}
          </Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <Typography component="span" sx={{ fontSize: '0.75rem' }}>{execution.requestMethod || 'GET'}</Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{endpoint}</Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <Typography component="span" sx={{ fontWeight: 600, fontSize: '0.75rem', color: statusColor }}>{execution.responseStatusCode ?? '—'}</Typography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <Typography component="span" sx={{ fontSize: '0.75rem' }}>{typeof execution.duration === 'number' ? `${execution.duration}s` : '—'}</Typography>
        </DataTableBodyCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: open ? '1px solid' : 0, borderColor: 'divider' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, px: 2, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {execution.responseBody && (
                <>
                  <Typography variant="caption" fontWeight="bold" color="textSecondary">Response</Typography>
                  <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {execution.responseBody.length > 2000 ? `${execution.responseBody.slice(0, 2000)}…` : execution.responseBody || '—'}
                  </Box>
                </>
              )}
              {execution.logs && (
                <>
                  <Typography variant="caption" fontWeight="bold" color="textSecondary">Logs</Typography>
                  <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 150, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {execution.logs}
                  </Box>
                </>
              )}
              {execution.errors && (
                <>
                  <Typography variant="caption" fontWeight="bold" color="error.main">Errors</Typography>
                  <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'error.light', color: 'error.contrastText', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 150, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {execution.errors}
                  </Box>
                </>
              )}
              {!execution.responseBody && !execution.logs && !execution.errors && (
                <Typography variant="caption" color="textSecondary">Geen details beschikbaar (async execution).</Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

function ExecutionLogsPanel({ siteId }: { siteId: string }) {
  const { data: executions, isLoading, isError, error, refetch } = useSiteExecutionLogs(siteId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={6}>
        <Icon sx={{ fontSize: 40, color: 'grey.400', mr: 2 }}>sync</Icon>
        <Typography variant="body2" color="textSecondary">Execution logs laden...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Icon color="error" sx={{ mt: 0.5 }}>error</Icon>
          <Box flex={1}>
            <Typography variant="h6" fontWeight="medium" color="error" sx={{ mb: 1 }}>Fout bij laden van execution logs</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>{error?.message || String(error)}</Typography>
            <Button variant="outlined" color="info" size="small" onClick={() => refetch()}>Opnieuw proberen</Button>
          </Box>
        </Box>
      </Box>
    );
  }

  const list = executions ?? [];

  return (
    <>
      <Box p={2} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="caption" color="textSecondary">
          Appwrite wp-proxy executions voor deze site (laatste 50, gefilterd op siteId). Klik op een rij voor details.
        </Typography>
      </Box>
      {list.length === 0 ? (
        <Box p={3}>
          <Typography variant="body2" color="textSecondary">Geen executions voor deze site.</Typography>
        </Box>
      ) : (
        <ScrollableTableWrapper maxHeight="55vh">
          <Table
            size="small"
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
              '& tbody td:first-of-type': { paddingLeft: (theme) => theme.spacing(5), paddingRight: (theme) => theme.spacing(3) },
              '& thead th:last-of-type': { paddingRight: (theme) => theme.spacing(4) },
              '& tbody td:last-of-type': { paddingRight: (theme) => theme.spacing(4) },
            }}
          >
            <Box component="thead">
              <TableRow>
                <DataTableHeadCell width="18%" pl={5} color="#4F5482">Tijd</DataTableHeadCell>
                <DataTableHeadCell width="12%" pl={undefined} color="#4F5482">Status</DataTableHeadCell>
                <DataTableHeadCell width="8%" pl={undefined} color="#4F5482">Method</DataTableHeadCell>
                <DataTableHeadCell width="38%" pl={undefined} color="#4F5482">Endpoint</DataTableHeadCell>
                <DataTableHeadCell width="10%" pl={undefined} color="#4F5482">Code</DataTableHeadCell>
                <DataTableHeadCell width="14%" pl={undefined} color="#4F5482">Duur</DataTableHeadCell>
              </TableRow>
            </Box>
            <TableBody>
              {list.map((exec) => (
                <ExecutionLogRow key={exec.$id} execution={exec} />
              ))}
            </TableBody>
          </Table>
        </ScrollableTableWrapper>
      )}
    </>
  );
}

const LogsTab: React.FC<LogsTabProps> = ({ siteId }) => {
  const [subTab, setSubTab] = useState(0);
  const { executeRecovery, loading } = useWordPress();
  const [fatalError, setFatalError] = useState<any>(null);
  const fetchFatalLog = async () => {
    const data = await executeRecovery(site.$id, 'get_error_log');
    if (data.success) {
      setFatalError(data.data);
    }
  };



  return (
      <Card sx={{ p: 3 }}>
        <SoftTypography variant="h6">Noodherstel & Error Logs</SoftTypography>
        
        {fatalError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>Fatal Error:</strong> {fatalError.message} <br />
            <em>Bestand: {fatalError.file} op regel {fatalError.line}</em>
            <Button 
              variant="contained" 
              color="warning" 
              onClick={() => executeRecovery(site.$id, 'rollback_plugin', 'naam-van-plugin')}
              sx={{ mt: 1 }}
            >
              Deactiveer plugin
            </Button>
          </Alert>
        ) : (
          <SoftButton onClick={fetchFatalLog} disabled={loading}>
            Scan op Fatal Errors
          </SoftButton>
        )}
      </Card>
  );
};

export default LogsTab;
    <Card>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{
          px: 1,
          minHeight: 36,
          border: 'none',
          backgroundColor: 'transparent !important',
          '& .MuiTabs-scroller': { backgroundColor: 'transparent !important' },
          '& .MuiTabs-flexContainer': { justifyContent: 'flex-end', backgroundColor: 'transparent !important' },
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root': {
            fontSize: '0.75rem',
            fontWeight: 700,
            minHeight: 36,
            textTransform: 'none',
            backgroundColor: 'transparent !important',
            borderRadius: 0,
          },
          '& .MuiTab-root:hover': { backgroundColor: 'transparent !important', borderRadius: 0 },
          '& .MuiTab-root.Mui-selected': { color: '#ed6c02 !important', backgroundColor: 'transparent !important', borderRadius: 0 },
          '& .MuiTab-root.Mui-focusVisible': { backgroundColor: 'transparent !important', borderRadius: 0 },
        }}
      >
        <Tab label="Bridge Logs" id="logs-bridge" aria-controls="logs-panel-bridge" />
        <Tab label="Error Logs" id="logs-error" aria-controls="logs-panel-error" />
        <Tab label="Execution Logs" id="logs-execution" aria-controls="logs-panel-execution" />
      </Tabs>
      <Box
        role="tabpanel"
        id="logs-panel-bridge"
        aria-labelledby="logs-bridge"
        hidden={subTab !== 0}
        sx={{
          height: '55vh',
          overflow: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {subTab === 0 && <BridgeLogsPanel siteId={siteId} />}
      </Box>
      <Box
        role="tabpanel"
        id="logs-panel-error"
        aria-labelledby="logs-error"
        hidden={subTab !== 1}
        sx={{
          height: '55vh',
          overflow: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {subTab === 1 && <ErrorLogsPanel siteId={siteId} />}
      </Box>
      <Box
        role="tabpanel"
        id="logs-panel-execution"
        aria-labelledby="logs-execution"
        hidden={subTab !== 2}
        sx={{
          height: '55vh',
          overflow: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {subTab === 2 && <ExecutionLogsPanel siteId={siteId} />}
      </Box>
    </Card>