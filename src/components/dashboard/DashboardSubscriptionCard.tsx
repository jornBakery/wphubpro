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
      <SoftBox p={3}>
        <SoftTypography variant="h6" fontWeight="medium" mb={2}>
          Abonnement
        </SoftTypography>
        {isLoading ? (
          <SoftTypography variant="caption" color="secondary">
            Laden...
          </SoftTypography>
        ) : (
          <>
            <SoftBox mb={2}>
              <SoftTypography variant="caption" color="secondary">Plan</SoftTypography>
              <SoftTypography variant="button" fontWeight="medium" display="block">
                {sub?.planId ?? 'FREE'}
              </SoftTypography>
            </SoftBox>
            <SoftBox mb={2}>
              <SoftTypography variant="caption" color="secondary">Facturatie</SoftTypography>
              <SoftTypography variant="caption" display="block">{billingPeriod}</SoftTypography>
              {periodStart && (
                <SoftTypography variant="caption" color="secondary">
                  {periodStart.toLocaleDateString('nl-NL')} – {periodEnd?.toLocaleDateString('nl-NL') ?? '-'}
                </SoftTypography>
              )}
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
                <SoftTypography variant="caption">Sites</SoftTypography>
                <SoftTypography variant="caption">{u.sitesUsed} / {sitesLimit}</SoftTypography>
              </SoftBox>
              <LinearProgress
                variant="determinate"
                value={sitesPct}
                color={sitesPct >= 100 ? 'error' : 'info'}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
                <SoftTypography variant="caption">Bibliotheek</SoftTypography>
                <SoftTypography variant="caption">{u.libraryUsed} / {libraryLimit}</SoftTypography>
              </SoftBox>
              <LinearProgress
                variant="determinate"
                value={libraryPct}
                color={libraryPct >= 100 ? 'error' : 'info'}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
                <SoftTypography variant="caption">Opslag</SoftTypography>
                <SoftTypography variant="caption">{u.storageUsed} / {storageLimit}</SoftTypography>
              </SoftBox>
              <LinearProgress
                variant="determinate"
                value={storagePct}
                color={storagePct >= 100 ? 'error' : 'info'}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </SoftBox>
            <SoftButton
              variant="gradient"
              color="info"
              size="small"
              component={Link}
              to="/subscription"
              fullWidth
            >
              <Icon sx={{ mr: 0.5, fontSize: 18 }}>credit_card</Icon>
              Abonnement beheren
            </SoftButton>
          </>
        )}
      </SoftBox>
    </Card>
  );
};

export default DashboardSubscriptionCard;
