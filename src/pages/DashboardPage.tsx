/**
 * Dashboard page based on soft layouts/pages/projects/general
 * - Earnings card → Subscription details
 * - Statistics → Limits (sites, library, storage)
 * - Recommendation card → User info
 * - To do list → Sites list
 * - Tasks → Plugin/theme/site notifications
 * - Projects card → Site monitoring (health status)
 */
import React from 'react';
import Grid from '@mui/material/Grid';

import SoftBox from 'components/SoftBox';
import AnimatedStatisticsCard from 'examples/Cards/StatisticsCards/AnimatedStatisticsCard';
import MiniStatisticsCard from 'examples/Cards/StatisticsCards/MiniStatisticsCard';
import AnnouncementCard from 'examples/Cards/AnnouncementCard';
import ProgressLineChart from 'examples/Charts/LineCharts/ProgressLineChart';
import ProgressDoughnutChart from 'examples/Charts/DoughnutCharts/ProgressDoughnutChart';
import Footer from 'examples/Footer';

import { useAuth } from '../contexts/AuthContext';
import { useSubscription, useUsage } from '../hooks/useSubscription';
import { useSites } from '../hooks/useSites';
import { Site } from '../types';

// Dashboard-specific components
import SitesTodoList from '../components/dashboard/SitesTodoList';

const getSiteMonitoringChartData = (sites: Site[] | undefined) => {
  const good = sites?.filter((s) => s.healthStatus === 'good').length ?? 0;
  const warning = sites?.filter((s) => s.healthStatus === 'warning').length ?? 0;
  const error = sites?.filter((s) => s.healthStatus === 'error').length ?? 0;
  const labels: string[] = [];
  const data: number[] = [];
  const colors: string[] = [];
  if (good > 0) {
    labels.push('Healthy');
    data.push(good);
    colors.push('success');
  }
  if (warning > 0) {
    labels.push('Warning');
    data.push(warning);
    colors.push('warning');
  }
  if (error > 0) {
    labels.push('Error');
    data.push(error);
    colors.push('error');
  }
  if (labels.length === 0) {
    labels.push('No sites');
    data.push(1);
    colors.push('secondary');
  }
  return {
    labels,
    datasets: { label: 'Sites', backgroundColors: colors, data },
  };
};

const getNotificationChartData = (sites: Site[] | undefined) => {
  // Aggregate action_log entries across sites for notifications
  const notifications: { month: string; count: number }[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  months.forEach((m, i) => {
    let count = 0;
    sites?.forEach((site) => {
      const entries = site.action_log?.filter((e) => {
        const t = typeof e.timestamp === 'number' ? e.timestamp : new Date(e.timestamp).getTime();
        const d = new Date(t);
        return d.getMonth() === i;
      }) ?? [];
      count += entries.length;
    });
    notifications.push({ month: m, count });
  });
  return {
    labels: months,
    data: notifications.map((n) => n.count),
  };
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: usage } = useUsage();
  const { data: sites } = useSites();

  const sub = subscription;
  const u = usage ?? { sitesUsed: 0, libraryUsed: 0, storageUsed: 0 };
  const monitoringChart = getSiteMonitoringChartData(sites);
  const notificationChart = getNotificationChartData(sites);
  const totalNotifications = notificationChart.data.reduce((a, b) => a + b, 0);

  return (
    <>
      <SoftBox mt={3}>
        <Grid container spacing={3}>
          {/* Left column */}
          <Grid item xs={12} lg={8}>
            <Grid container spacing={3}>
              {/* Earnings card → Subscription details */}
              <Grid item xs={12} lg={4}>
                <AnimatedStatisticsCard
                  title="Abonnement"
                  count={subLoading ? '...' : sub?.planId ?? 'FREE'}
                  percentage={{
                    color: sub?.status === 'active' ? 'success' : 'warning',
                    label: sub?.status === 'active' ? 'Actief' : sub?.status ?? '-',
                  }}
                  action={{
                    type: 'internal',
                    route: '/subscription',
                    label: 'beheer',
                  }}
                />
              </Grid>

              {/* Statistics → Limits (sites, library, storage) */}
              <Grid item xs={12} md={6} lg={4}>
                <SoftBox mb={3}>
                  <MiniStatisticsCard
                    title={{ fontWeight: 'medium', text: 'Sites' }}
                    count={`${u.sitesUsed} / ${sub?.sitesLimit ?? '-'}`}
                    icon={{ color: 'info', component: 'public' }}
                    direction="left"
                    percentage={{ color: 'success', text: '' }}
                  />
                </SoftBox>
                <MiniStatisticsCard
                  title={{ fontWeight: 'medium', text: 'Bibliotheek' }}
                  count={`${u.libraryUsed} / ${sub?.libraryLimit ?? '-'}`}
                  icon={{ color: 'info', component: 'folder' }}
                  direction="left"
                  percentage={{ color: 'success', text: '' }}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={4}>
                <SoftBox mb={3}>
                  <MiniStatisticsCard
                    title={{ fontWeight: 'medium', text: 'Opslag' }}
                    count={`${u.storageUsed} / ${sub?.storageLimit ?? '-'}`}
                    icon={{ color: 'info', component: 'storage' }}
                    direction="left"
                    percentage={{ color: 'success', text: '' }}
                  />
                </SoftBox>
                <MiniStatisticsCard
                  title={{ fontWeight: 'medium', text: 'Periode' }}
                  count={
                    sub?.currentPeriodEnd
                      ? new Date(sub.currentPeriodEnd * 1000).toLocaleDateString('nl-NL', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'
                  }
                  icon={{ color: 'info', component: 'event' }}
                  direction="left"
                  percentage={{ color: 'success', text: '' }}
                />
              </Grid>
            </Grid>

            {/* To do list → Sites list */}
            <Grid item xs={12}>
              <SoftBox my={3}>
                <SitesTodoList sites={sites ?? []} />
              </SoftBox>
            </Grid>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              {/* Recommendation card → User info */}
              <Grid item xs={12}>
                <AnnouncementCard
                  by={{
                    name: user?.name ?? user?.email ?? 'Gebruiker',
                    date: user?.email ?? '',
                  }}
                  badge={{ color: 'info', label: 'account' }}
                  title={user?.name ?? 'Welkom'}
                  description={
                    user?.email
                      ? `Ingelogd als ${user.email}`
                      : 'Uw accountinformatie wordt hier getoond.'
                  }
                  value={{}}
                  action={{
                    type: 'internal',
                    route: '/subscription',
                    label: 'abonnement',
                  }}
                />
              </Grid>

              {/* Tasks → Plugin/theme/site notifications */}
              <Grid item xs={12}>
                <ProgressLineChart
                  icon="notifications"
                  title="Notificaties"
                  count={totalNotifications}
                  progress={Math.min(100, totalNotifications * 5)}
                  chart={notificationChart}
                />
              </Grid>

              {/* Projects card → Site monitoring */}
              <Grid item xs={12}>
                <ProgressDoughnutChart
                  icon="monitor_heart"
                  title="Site Monitoring"
                  count={sites?.length ?? 0}
                  chart={monitoringChart}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default DashboardPage;
