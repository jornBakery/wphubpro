/**
 * Dashboard page - User dashboard
 * Left 65%: Sites list
 * Right 35%: Subscription details, Sites Monitor
 */
import React from 'react';
import Grid from '@mui/material/Grid';

import SoftBox from 'components/SoftBox';
import Footer from 'examples/Footer';

import { useSubscription, useUsage } from '../domains/billing';
import { useSites } from '../domains/sites';

import DashboardHealthCards from '../components/dashboard/DashboardHealthCards';
import DashboardSitesTable from '../components/dashboard/DashboardSitesTable';
import DashboardSubscriptionCard from '../components/dashboard/DashboardSubscriptionCard';

const DashboardPage: React.FC = () => {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: usage } = useUsage();
  const { data: sites } = useSites();

  return (
    <>
      <SoftBox mt={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Grid container spacing={3} alignItems="stretch" sx={{ flex: 1, minHeight: 0 }}>
          {/* Left column ~65% (8/12) - Health cards + Sites list */}
          <Grid item xs={12} lg={9} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <DashboardHealthCards
              sites={sites ?? []}
              sitesNeedingUpdatesCount={0}
              pluginUpdatesCount={0}
              pluginTotalCount={0}
              themeUpdatesCount={0}
              themeTotalCount={0}
            />
            <SoftBox sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignSelf: 'stretch' }}>
              <DashboardSitesTable sites={sites ?? []} />
            </SoftBox>
          </Grid>

          {/* Right column ~35% (4/12) */}
          <Grid item xs={12} lg={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DashboardSubscriptionCard
                  subscription={subscription}
                  usage={usage}
                  isLoading={subLoading}
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
