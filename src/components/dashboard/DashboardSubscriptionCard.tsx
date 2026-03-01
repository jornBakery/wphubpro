/**
 * Dashboard subscription details - Plan, dates, limits with usage, button
 */
import React from 'react';
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Icon from '@mui/material/Icon';
import { Link } from 'react-router-dom';
import type { Subscription, UsageMetrics } from '../../types';

interface DashboardSubscriptionCardProps {
  subscription: Subscription | null | undefined;
  usage: UsageMetrics | undefined;
  isLoading?: boolean;
}

const DashboardSubscriptionCard: React.FC<DashboardSubscriptionCardProps> = ({
  subscription,
  usage,
  isLoading,
}) => {
  const sub = subscription;
  const u = usage ?? { sitesUsed: 0, libraryUsed: 0, storageUsed: 0 };
  const sitesLimit = sub?.sitesLimit ?? 1;
  const libraryLimit = sub?.libraryLimit ?? 5;
  const storageLimit = sub?.storageLimit ?? 10;

  const sitesPct = sitesLimit > 0 ? Math.min(100, (u.sitesUsed / sitesLimit) * 100) : 0;
  const libraryPct = libraryLimit > 0 ? Math.min(100, (u.libraryUsed / libraryLimit) * 100) : 0;
  const storagePct = storageLimit > 0 ? Math.min(100, (u.storageUsed / storageLimit) * 100) : 0;

  const periodStart = sub?.currentPeriodEnd
    ? new Date((sub.currentPeriodEnd - (sub.interval === 'year' ? 365 : 30) * 24 * 60 * 60) * 1000)
    : null;
  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd * 1000) : null;
  const billingPeriod = sub?.interval === 'year' ? 'Jaarlijks' : 'Maandelijks';

  return (
    <Card>
      <SoftBox p={2}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <SoftTypography variant="button" fontWeight="medium">
            {sub?.planId ?? 'FREE'}
          </SoftTypography>
          {periodStart && (
            <SoftTypography variant="caption" color="secondary">
              {periodStart.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – {periodEnd?.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) ?? '-'}
            </SoftTypography>
          )}
        </SoftBox>
        {isLoading ? (
          <SoftTypography variant="caption" color="secondary">Laden...</SoftTypography>
        ) : (
          <>
            <SoftTypography variant="caption" color="secondary" display="block" mb={1}>{billingPeriod}</SoftTypography>
            <SoftBox mb={1}>
              <SoftBox display="flex" justifyContent="space-between" mb={0.25}>
                <SoftTypography variant="caption">Sites</SoftTypography>
                <SoftTypography variant="caption">{u.sitesUsed}/{sitesLimit}</SoftTypography>
              </SoftBox>
              <LinearProgress variant="determinate" value={sitesPct} color={sitesPct >= 100 ? 'error' : 'success'} sx={{ height: 4, borderRadius: 1 }} />
            </SoftBox>
            <SoftBox mb={1}>
              <SoftBox display="flex" justifyContent="space-between" mb={0.25}>
                <SoftTypography variant="caption">Bibliotheek</SoftTypography>
                <SoftTypography variant="caption">{u.libraryUsed}/{libraryLimit}</SoftTypography>
              </SoftBox>
              <LinearProgress variant="determinate" value={libraryPct} color={libraryPct >= 100 ? 'error' : 'success'} sx={{ height: 4, borderRadius: 1 }} />
            </SoftBox>
            <SoftBox mb={1.5}>
              <SoftBox display="flex" justifyContent="space-between" mb={0.25}>
                <SoftTypography variant="caption">Opslag</SoftTypography>
                <SoftTypography variant="caption">{u.storageUsed}/{storageLimit}</SoftTypography>
              </SoftBox>
              <LinearProgress variant="determinate" value={storagePct} color={storagePct >= 100 ? 'error' : 'success'} sx={{ height: 4, borderRadius: 1 }} />
            </SoftBox>
            <SoftButton variant="gradient" color="info" size="small" component={Link} to="/subscription" fullWidth>
              <Icon sx={{ mr: 0.5, fontSize: 16 }}>credit_card</Icon>
              Beheren
            </SoftButton>
          </>
        )}
      </SoftBox>
    </Card>
  );
};

export default DashboardSubscriptionCard;
