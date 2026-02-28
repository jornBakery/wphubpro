/**
 * Dashboard page - User dashboard
 * Left 65%: Sites list
 * Right 35%: User details, Subscription details, Sites Monitor
 */
import React from 'react';
import Grid from '@mui/material/Grid';

import SoftBox from 'components/SoftBox';
import Footer from 'examples/Footer';

import { useAuth } from '../contexts/AuthContext';
import { useSubscription, useUsage } from '../hooks/useSubscription';
import { useSites } from '../hooks/useSites';

import DashboardSitesTable from '../components/dashboard/DashboardSitesTable';
import DashboardUserCard from '../components/dashboard/DashboardUserCard';
import DashboardSubscriptionCard from '../components/dashboard/DashboardSubscriptionCard';
import DashboardSitesMonitor from '../components/dashboard/DashboardSitesMonitor';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: usage } = useUsage();
  const { data: sites } = useSites();

  return (
    <>
      <SoftBox mt={3}>
        <Grid container spacing={3}>
          {/* Left column ~65% (8/12) - Sites list */}
          <Grid item xs={12} lg={8}>
            <DashboardSitesTable sites={sites ?? []} />
          </Grid>

          {/* Right column ~35% (4/12) */}
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DashboardUserCard user={user} />
              </Grid>
              <Grid item xs={12}>
                <DashboardSubscriptionCard
                  subscription={subscription}
                  usage={usage}
                  isLoading={subLoading}
                />
              </Grid>
              <Grid item xs={12}>
                <DashboardSitesMonitor
                  sites={sites ?? []}
                  pluginUpdatesCount={0}
                  themeUpdatesCount={0}
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
