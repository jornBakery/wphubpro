/**
 * Dashboard plugin updates list - all available updates across sites (table)
 * Columns: Plugin name, Latest version, Release date, Sites count (expandable)
 * Expanded: site name, installed version, Update button
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import Icon from '@mui/material/Icon';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import { useUpdatePlugin } from '../../hooks/useWordPress';
import type { AggregatedPluginUpdate } from '../../hooks/useWordPress';

const blueGradient = 'linear-gradient(310deg, #4F5482, #7a8ef0)';
const orangeGradient = 'linear-gradient(310deg, #ea580c, #fb923c)';

interface DashboardPluginUpdatesListProps {
  pluginUpdatesList: AggregatedPluginUpdate[];
  isLoading?: boolean;
}

function formatReleaseDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

const DashboardPluginUpdatesList: React.FC<DashboardPluginUpdatesListProps> = ({
  pluginUpdatesList,
  isLoading = false,
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  if (pluginUpdatesList.length === 0 && !isLoading) {
    return (
      <Card sx={{ background: blueGradient, color: 'white' }}>
        <SoftBox p={2}>
          <SoftTypography variant="h6" fontWeight="bold" color="white" mb={1}>
            Beschikbare updates
          </SoftTypography>
          <SoftTypography variant="caption" color="white" sx={{ opacity: 0.9 }}>
            Geen plugin-updates beschikbaar.
          </SoftTypography>
        </SoftBox>
      </Card>
    );
  }

  return (
    <Card sx={{ background: blueGradient, color: 'white', '& .MuiTypography-root': { color: 'white !important' } }}>
      <SoftBox p={2}>
        <SoftTypography variant="h6" fontWeight="bold" color="white" mb={1.5}>
          Beschikbare updates
        </SoftTypography>
        {isLoading ? (
          <SoftTypography variant="caption" color="white">Laden...</SoftTypography>
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.2)', py: 1 }}>Plugin</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.2)', py: 1 }}>Nieuwste versie</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.2)', py: 1 }}>Release</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.2)', py: 1, width: 80 }}>Sites</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pluginUpdatesList.map((item) => (
                  <PluginUpdateTableRow
                    key={item.pluginSlug}
                    item={item}
                    expanded={expanded.has(item.pluginSlug)}
                    onToggle={() => toggleExpanded(item.pluginSlug)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SoftBox>
    </Card>
  );
};

interface PluginUpdateTableRowProps {
  item: AggregatedPluginUpdate;
  expanded: boolean;
  onToggle: () => void;
}

const PluginUpdateTableRow: React.FC<PluginUpdateTableRowProps> = ({ item, expanded, onToggle }) => {
  const updatePlugin = useUpdatePlugin();

  return (
    <>
      <TableRow
        sx={{
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
          '& > td': { borderColor: 'rgba(255,255,255,0.2)', color: 'white', py: 1.5 },
        }}
        onClick={onToggle}
      >
        <TableCell>
          <SoftTypography variant="button" fontWeight="medium" color="white">
            {item.name}
          </SoftTypography>
        </TableCell>
        <TableCell>
          <SoftTypography variant="caption" color="white" sx={{ opacity: 0.95 }}>
            v{item.latestVersion}
          </SoftTypography>
        </TableCell>
        <TableCell>
          <SoftTypography variant="caption" color="white" sx={{ opacity: 0.9 }}>
            {formatReleaseDate(item.releaseDate)}
          </SoftTypography>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <SoftBox
            display="inline-flex"
            alignItems="center"
            gap={0.5}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              background: orangeGradient,
              cursor: 'pointer',
            }}
            onClick={onToggle}
          >
            <SoftTypography variant="caption" fontWeight="bold" color="white">
              {item.sites.length}
            </SoftTypography>
            <Icon sx={{ fontSize: 18, color: 'white', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </Icon>
          </SoftBox>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ borderBottom: 'none', py: 0, backgroundColor: 'rgba(0,0,0,0.15)' }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.15)', color: 'white' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem', py: 1, pl: 4 }}>Site</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem', py: 1 }}>Geïnstalleerd</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem', py: 1, width: 90 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {item.sites.map((s) => (
                  <TableRow key={s.siteId} sx={{ '& > td': { py: 1 } }}>
                    <TableCell sx={{ pl: 4 }}>
                      <Link to={`/sites/${s.siteId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <SoftTypography variant="caption" fontWeight="medium" color="white" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                          {s.siteName}
                        </SoftTypography>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <SoftTypography variant="caption" color="white" sx={{ opacity: 0.9 }}>
                        v{s.installedVersion}
                      </SoftTypography>
                    </TableCell>
                    <TableCell>
                      <SoftButton
                        variant="gradient"
                        color="info"
                        size="small"
                        onClick={() =>
                          updatePlugin.mutate({
                            siteId: s.siteId,
                            pluginFile: s.pluginFile,
                            pluginName: item.name,
                          })
                        }
                        disabled={updatePlugin.isPending}
                        sx={{
                          background: 'white',
                          color: '#4F5482',
                          minWidth: 80,
                          '&:hover': { background: 'rgba(255,255,255,0.9)' },
                        }}
                      >
                        Update
                      </SoftButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default DashboardPluginUpdatesList;
