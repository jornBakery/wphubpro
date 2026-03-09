/**
 * Logs tab – sub-tabs: Bridge Logs, Error Logs, Execution Logs (Appwrite wp-proxy for this site).
 * Inclusief Noodherstel functionaliteit voor Fatal Errors via JWT.
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
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { 
  useWordPress,
  useSiteLogs, 
  useSiteErrorLog, 
  useSiteExecutionLogs, 
  type BridgeLogEntry, 
  type AppwriteExecution 
} from '../../hooks/useWordPress';
import { useSite } from '../../domains/sites';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import { functions } from '../../services/appwrite';

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
          <SoftTypography component="span" sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{formatTime(entry.time)}</SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-word' }}>{entry.endpoint}</SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>{entry.type}</DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography component="span" sx={{ fontWeight: 600, color: codeOk ? 'success.main' : codeErr ? 'error.main' : 'text.primary' }}>{entry.code}</SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography
            component="span"
            variant="caption"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setRequestOpen((o) => !o); setResponseOpen(false); }}
            sx={{ cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace' }}
          >
            {requestOpen ? 'Hide' : 'Request'}
          </SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography
            component="span"
            variant="caption"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setResponseOpen((o) => !o); setRequestOpen(false); }}
            sx={{ cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace' }}
          >
            {responseOpen ? 'Hide' : 'Response'}
          </SoftTypography>
        </DataTableBodyCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: requestOpen || responseOpen ? '1px solid' : 0, borderColor: 'divider' }}>
          <Collapse in={requestOpen} timeout="auto" unmountOnExit>
            <SoftBox sx={{ py: 1.5, px: 2, bgcolor: 'grey.50' }}>
              <SoftTypography variant="caption" fontWeight="bold" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Request</SoftTypography>
              <SoftBox component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {requestStr || '—'}
              </SoftBox>
            </SoftBox>
          </Collapse>
          <Collapse in={responseOpen} timeout="auto" unmountOnExit>
            <SoftBox sx={{ py: 1.5, px: 2, bgcolor: 'grey.50' }}>
              <SoftTypography variant="caption" fontWeight="bold" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Response</SoftTypography>
              <SoftBox component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {responseStr || '—'}
              </SoftBox>
            </SoftBox>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

interface LogsTabProps {
  siteId: string;
}

function BridgeLogsPanel({ siteId, siteEnabled }: { siteId: string; siteEnabled?: boolean }) {
  const { data: site } = useSite(siteId);
  const { data: logs, isLoading, isError, error, refetch } = useSiteLogs(siteId, { enabled: siteEnabled });

  if (isLoading) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" p={6}>
        <Icon sx={{ fontSize: 40, color: 'grey.400', mr: 2 }}>sync</Icon>
        <SoftTypography variant="body2" color="textSecondary">Bridge logs laden...</SoftTypography>
      </SoftBox>
    );
  }

  if (isError) {
    const apiUrl = site ? `${String(site.siteUrl).replace(/\/$/, '')}/wp-json/wphubpro/v1/logs` : 'unknown';
    return (
      <SoftBox p={3}>
        <SoftTypography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>API: {apiUrl}</SoftTypography>
        <SoftBox display="flex" alignItems="flex-start" gap={2}>
          <Icon color="error" sx={{ mt: 0.5 }}>error</Icon>
          <SoftBox flex={1}>
            <SoftTypography variant="h6" fontWeight="medium" color="error" sx={{ mb: 1 }}>Fout bij laden van bridge logs</SoftTypography>
            <SoftTypography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>{error?.message || String(error)}</SoftTypography>
            <SoftButton variant="outlined" color="info" size="small" onClick={() => refetch()}>Opnieuw proberen</SoftButton>
          </SoftBox>
        </SoftBox>
      </SoftBox>
    );
  }

  return (
    <>
      <SoftBox p={2} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <SoftTypography variant="caption" color="textSecondary">
          Laatste 20 aanroepen naar het Bridge API (option WPHUBPRO_LOG). API: {site ? `${String(site.siteUrl).replace(/\/$/, '')}/wp-json/wphubpro/v1/logs` : '—'}
        </SoftTypography>
      </SoftBox>
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
          <SoftBox component="thead">
            <TableRow>
              <DataTableHeadCell width="15%" pl={5} color="#4F5482">Tijd</DataTableHeadCell>
              <DataTableHeadCell width="30%" pl={undefined} color="#4F5482">Endpoint</DataTableHeadCell>
              <DataTableHeadCell width="10%" pl={undefined} color="#4F5482">Type</DataTableHeadCell>
              <DataTableHeadCell width="8%" pl={undefined} color="#4F5482">Code</DataTableHeadCell>
              <DataTableHeadCell width="20%" pl={undefined} color="#4F5482">Request</DataTableHeadCell>
              <DataTableHeadCell width="17%" pl={undefined} color="#4F5482">Response</DataTableHeadCell>
            </TableRow>
          </SoftBox>
          <TableBody>
            {(!logs || logs.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <SoftTypography variant="caption" color="textSecondary">Geen logs.</SoftTypography>
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

export interface ParsedErrorLogEntry {
  raw: string;
  timestamp: string;
  logType: string;
  file: string | null;
  line: number | null;
  message: string;
}

const PHP_ERROR_LINE_RE = /^\[([^\]]+)\]\s*PHP\s+(\w+(?:\s+\w+)?):\s*(.+)$/i;
const FILE_LINE_RE = /\s+(?:thrown\s+)?in\s+(.+?)\s+on\s+line\s+(\d+)\s*$/;
const FILE_LINE_FALLBACK_RE = /([^\s()]+\.php)[:(](\d+)\)?/;

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

function parseErrorLogLines(lines: string[]): ParsedErrorLogEntry[] {
  const entries: ParsedErrorLogEntry[] = [];
  let current: ParsedErrorLogEntry | null = null;
  for (const raw of lines) {
    const parsed = parseSingleErrorLine(raw);
    if (parsed) {
      if (current) entries.push(current);
      current = {
        raw: parsed.raw ?? '',
        timestamp: parsed.timestamp ?? '',
        logType: parsed.logType ?? '',
        file: parsed.file ?? null,
        line: parsed.line ?? null,
        message: parsed.message,
      };
    } else if (current) {
      current.message = current.message + '\n' + raw;
      current.raw = current.raw + '\n' + raw;
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

function extractPluginSlugFromPath(filePath: string | null): string | null {
  if (!filePath || !filePath.includes('plugins/')) return null;
  const m = filePath.match(/plugins\/([^/]+)/);
  return m ? m[1] : null;
}

interface ErrorLogRowProps {
  entry: ParsedErrorLogEntry;
  onRollbackPlugin?: (slug: string) => void;
  rollbackLoading?: boolean;
}

const ErrorLogRow: React.FC<ErrorLogRowProps> = ({ entry, onRollbackPlugin, rollbackLoading }) => {
  const [open, setOpen] = useState(false);
  const fileLine = entry.file != null && entry.line != null ? `${entry.file}:${entry.line}` : entry.file ?? '—';
  const pluginSlug = extractPluginSlugFromPath(entry.file);

  return (
    <>
      <TableRow
        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        onClick={() => setOpen((o) => !o)}
      >
        <DataTableBodyCell>
          <SoftTypography component="span" sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{entry.timestamp || '—'}</SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: logTypeColor(entry.logType) }}>
            {entry.logType || '—'}
          </SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography
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
          </SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftBox
            component="span"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            sx={{ display: 'inline-flex', width: 56, justifyContent: 'center' }}
          >
            {pluginSlug && onRollbackPlugin && (
              <Tooltip title={`Deactiveer plugin: ${pluginSlug}`} placement="left">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onRollbackPlugin(pluginSlug)}
                  disabled={rollbackLoading}
                  aria-label={`Deactiveer ${pluginSlug}`}
                >
                  <Icon sx={{ fontSize: 18 }}>power_off</Icon>
                </IconButton>
              </Tooltip>
            )}
          </SoftBox>
        </DataTableBodyCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ py: 0, borderBottom: open ? '1px solid' : 0, borderColor: 'divider' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <SoftBox sx={{ py: 1.5, px: 2, bgcolor: 'grey.50' }}>
              <SoftTypography variant="caption" fontWeight="bold" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Bericht</SoftTypography>
              <SoftBox component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 280, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                {entry.message || '—'}
              </SoftBox>
            </SoftBox>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

function ErrorLogsPanel({ siteId, siteEnabled }: { siteId: string; siteEnabled?: boolean }) {
  const { data, isLoading, isError, error, refetch } = useSiteErrorLog(siteId, { enabled: siteEnabled });
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [fatalRecoveryLog, setFatalRecoveryLog] = useState<any>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  /**
   * Voert een noodactie uit via de Appwrite recovery-manager function (JWT gebaseerd)
   */
  const handleRecoveryAction = async (action: 'get_error_log' | 'rollback_plugin', pluginSlug?: string) => {
    setRecoveryLoading(true);
    setRecoveryError(null);
    try {
      // Roep de Appwrite function aan die we hebben gemaakt voor JWT herstel
      const execution = await functions.createExecution(
        'recovery-manager', // Zorg dat dit ID overeenkomt met je Appwrite Function ID
        JSON.stringify({ siteId, action, plugin_slug: pluginSlug }),
        false,
        '/',
        'POST' as Parameters<typeof functions.createExecution>[4]
      );

      const result = JSON.parse(execution.responseBody);
      if (!result.success) throw new Error(result.message || 'Actie mislukt');

      if (action === 'get_error_log') {
        setFatalRecoveryLog(result.data.data);
      } else {
        alert('Plugin succesvol gedeactiveerd. De site zou nu weer bereikbaar moeten zijn.');
        setFatalRecoveryLog(null);
        refetch();
      }
    } catch (err: any) {
      setRecoveryError(err.message || 'Kon herstelactie niet uitvoeren.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" p={6}>
        <Icon sx={{ fontSize: 40, color: 'grey.400', mr: 2 }}>sync</Icon>
        <SoftTypography variant="body2" color="textSecondary">Error log laden...</SoftTypography>
      </SoftBox>
    );
  }

  // Als de reguliere API faalt (500 error op WP), toon de Noodherstel optie
  if (isError) {
    return (
      <SoftBox p={3}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <SoftTypography variant="body2">
            <strong>De WordPress site lijkt onbereikbaar (Fatal Error).</strong> <br />
            De standaard error logs kunnen niet worden opgehaald via de Bridge API. 
            Gebruik de Noodherstel-agent om de laatste PHP crash-data op te halen.
          </SoftTypography>
          <SoftBox mt={2}>
            <SoftButton 
              color="error" 
              variant="contained" 
              size="small" 
              onClick={() => handleRecoveryAction('get_error_log')}
              disabled={recoveryLoading}
            >
              {recoveryLoading ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : <Icon sx={{ mr: 1 }}>emergency</Icon>}
              Scan op Fatal Errors (JWT)
            </SoftButton>
          </SoftBox>
        </Alert>

        {fatalRecoveryLog && (
          <Card sx={{ p: 2, bgcolor: 'grey.100', border: '1px solid', borderColor: 'error.light', mb: 2 }}>
            <SoftTypography variant="h6" color="error">Gevonden Fatal Error:</SoftTypography>
            <SoftTypography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1, display: 'block', p: 1, bgcolor: 'white', borderRadius: 1 }}>
              {JSON.stringify(fatalRecoveryLog, null, 2)}
            </SoftTypography>
            
            {/* Slimme detectie van de plugin slug uit het bestandspad */}
            {fatalRecoveryLog.file && fatalRecoveryLog.file.includes('plugins/') && (
              <SoftBox mt={2}>
                <SoftTypography variant="body2" sx={{ mb: 1 }}>Mogelijke oorzaak: Plugin gedetecteerd.</SoftTypography>
                <SoftButton 
                  color="warning" 
                  variant="gradient"
                  onClick={() => {
                    const parts = fatalRecoveryLog.file.split('plugins/');
                    const slug = parts[1].split('/')[0];
                    handleRecoveryAction('rollback_plugin', slug);
                  }}
                >
                  Deactiveer Plugin: {fatalRecoveryLog.file.split('plugins/')[1].split('/')[0]}
                </SoftButton>
              </SoftBox>
            )}
          </Card>
        )}

        {recoveryError && <SoftTypography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{recoveryError}</SoftTypography>}

        <SoftBox display="flex" alignItems="flex-start" gap={2} mt={3}>
          <Icon color="error" sx={{ mt: 0.5 }}>error</Icon>
          <SoftBox flex={1}>
            <SoftTypography variant="h6" fontWeight="medium" color="error" sx={{ mb: 1 }}>Fout bij laden van reguliere error log</SoftTypography>
            <SoftTypography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>{error?.message || String(error)}</SoftTypography>
            <SoftButton variant="outlined" color="info" size="small" onClick={() => refetch()}>Opnieuw proberen</SoftButton>
          </SoftBox>
        </SoftBox>
      </SoftBox>
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
      <SoftBox p={2} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <SoftTypography variant="caption" color="textSecondary" display="block">
          Laatste 200 regels van de PHP error log (alleen type error). Klik op een rij om het bericht te tonen.
        </SoftTypography>
        {fileInfo && (
          <SoftTypography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
            Bestand: {fileInfo}
          </SoftTypography>
        )}
        {errorMsg && (
          <SoftTypography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>{errorMsg}</SoftTypography>
        )}
      </SoftBox>
      {parsed.length === 0 ? (
        <SoftBox p={3}>
          <SoftTypography variant="body2" color="textSecondary">Geen regels of log niet leesbaar.</SoftTypography>
        </SoftBox>
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
            <SoftBox component="thead">
              <TableRow>
                <DataTableHeadCell width="20%" pl={5} color="#4F5482">Tijd</DataTableHeadCell>
                <DataTableHeadCell width="16%" pl={undefined} color="#4F5482">Type</DataTableHeadCell>
                <DataTableHeadCell width="54%" pl={undefined} color="#4F5482">Bestand:regel</DataTableHeadCell>
                <DataTableHeadCell width="10%" pl={undefined} color="#4F5482">Actie</DataTableHeadCell>
              </TableRow>
            </SoftBox>
            <TableBody>
              {parsed.map((entry, i) => (
                <ErrorLogRow
                  key={i}
                  entry={entry}
                  onRollbackPlugin={(slug) => handleRecoveryAction('rollback_plugin', slug)}
                  rollbackLoading={recoveryLoading}
                />
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
          <SoftTypography component="span" sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{formatTime(execution.$createdAt)}</SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography component="span" sx={{ fontSize: '0.75rem', fontWeight: 600, color: execution.status === 'completed' ? 'success.main' : execution.status === 'failed' ? 'error.main' : 'text.secondary' }}>
            {execution.status}
          </SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography component="span" sx={{ fontSize: '0.75rem' }}>{execution.requestMethod || 'GET'}</SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{endpoint}</SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography component="span" sx={{ fontWeight: 600, fontSize: '0.75rem', color: statusColor }}>{execution.responseStatusCode ?? '—'}</SoftTypography>
        </DataTableBodyCell>
        <DataTableBodyCell>
          <SoftTypography component="span" sx={{ fontSize: '0.75rem' }}>{typeof execution.duration === 'number' ? `${execution.duration}s` : '—'}</SoftTypography>
        </DataTableBodyCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: open ? '1px solid' : 0, borderColor: 'divider' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <SoftBox sx={{ py: 1.5, px: 2, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {execution.responseBody && (
                <>
                  <SoftTypography variant="caption" fontWeight="bold" color="textSecondary">Response</SoftTypography>
                  <SoftBox component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {execution.responseBody.length > 2000 ? `${execution.responseBody.slice(0, 2000)}…` : execution.responseBody || '—'}
                  </SoftBox>
                </>
              )}
              {execution.logs && (
                <>
                  <SoftTypography variant="caption" fontWeight="bold" color="textSecondary">Logs</SoftTypography>
                  <SoftBox component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 150, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {execution.logs}
                  </SoftBox>
                </>
              )}
              {execution.errors && (
                <>
                  <SoftTypography variant="caption" fontWeight="bold" color="error.main">Errors</SoftTypography>
                  <SoftBox component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'error.light', color: 'error.contrastText', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: '0.75rem', overflow: 'auto', maxHeight: 150, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {execution.errors}
                  </SoftBox>
                </>
              )}
              {!execution.responseBody && !execution.logs && !execution.errors && (
                <SoftTypography variant="caption" color="textSecondary">Geen details beschikbaar (async execution).</SoftTypography>
              )}
            </SoftBox>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

function ExecutionLogsPanel({ siteId, siteEnabled }: { siteId: string; siteEnabled?: boolean }) {
  const { data: executions, isLoading, isError, error, refetch } = useSiteExecutionLogs(siteId, { enabled: siteEnabled });

  if (isLoading) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" p={6}>
        <Icon sx={{ fontSize: 40, color: 'grey.400', mr: 2 }}>sync</Icon>
        <SoftTypography variant="body2" color="textSecondary">Execution logs laden...</SoftTypography>
      </SoftBox>
    );
  }

  if (isError) {
    return (
      <SoftBox p={3}>
        <SoftBox display="flex" alignItems="flex-start" gap={2}>
          <Icon color="error" sx={{ mt: 0.5 }}>error</Icon>
          <SoftBox flex={1}>
            <SoftTypography variant="h6" fontWeight="medium" color="error" sx={{ mb: 1 }}>Fout bij laden van execution logs</SoftTypography>
            <SoftTypography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>{error?.message || String(error)}</SoftTypography>
            <SoftButton variant="outlined" color="info" size="small" onClick={() => refetch()}>Opnieuw proberen</SoftButton>
          </SoftBox>
        </SoftBox>
      </SoftBox>
    );
  }

  const list = executions ?? [];

  return (
    <>
      <SoftBox p={2} sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <SoftTypography variant="caption" color="textSecondary">
          Appwrite wp-proxy executions voor deze site (laatste 50, gefilterd op siteId). Klik op een rij voor details.
        </SoftTypography>
      </SoftBox>
      {list.length === 0 ? (
        <SoftBox p={3}>
          <SoftTypography variant="body2" color="textSecondary">Geen executions voor deze site.</SoftTypography>
        </SoftBox>
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
            <SoftBox component="thead">
              <TableRow>
                <DataTableHeadCell width="18%" pl={5} color="#4F5482">Tijd</DataTableHeadCell>
                <DataTableHeadCell width="12%" pl={undefined} color="#4F5482">Status</DataTableHeadCell>
                <DataTableHeadCell width="8%" pl={undefined} color="#4F5482">Method</DataTableHeadCell>
                <DataTableHeadCell width="38%" pl={undefined} color="#4F5482">Endpoint</DataTableHeadCell>
                <DataTableHeadCell width="10%" pl={undefined} color="#4F5482">Code</DataTableHeadCell>
                <DataTableHeadCell width="14%" pl={undefined} color="#4F5482">Duur</DataTableHeadCell>
              </TableRow>
            </SoftBox>
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
  const { data: site } = useSite(siteId);
  useWordPress();
  const siteEnabled = site?.enabled !== false;

  return (
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
      <SoftBox
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
        {subTab === 0 && <BridgeLogsPanel siteId={siteId} siteEnabled={siteEnabled} />}
      </SoftBox>
      <SoftBox
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
        {subTab === 1 && <ErrorLogsPanel siteId={siteId} siteEnabled={siteEnabled} />}
      </SoftBox>
      <SoftBox
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
        {subTab === 2 && <ExecutionLogsPanel siteId={siteId} siteEnabled={siteEnabled} />}
      </SoftBox>
    </Card>
  );
};

export default LogsTab;