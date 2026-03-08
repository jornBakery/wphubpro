import React from 'react';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftAvatar from 'components/SoftAvatar';
import Footer from 'examples/Footer';
import { useAuth } from '../../domains/auth';
import { avatars } from '../../services/appwrite';
import { useSubscription, useUsage } from '../../domains/billing';
import AccountSectionNav from '../../components/account/AccountSectionNav'; // pragma: allowlist secret

const AccountProfilePage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: usage } = useUsage();

  const avatarUrl = (() => {
    try {
      const initials = (user?.name || user?.email || 'U').substring(0, 2).toUpperCase();
      return avatars.getInitials(initials, 200, 200).toString();
    } catch {
      return undefined;
    }
  })();

  const memberSince = (user as { $createdAt?: string } | null)?.$createdAt
    ? new Date((user as { $createdAt?: string }).$createdAt as string).toLocaleDateString('nl-NL', {
      month: 'long',
      year: 'numeric',
    })
    : '-';

  return (
    <>
      <SoftBox my={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={0.5}>
          Account Profile
        </SoftTypography>
        <SoftTypography variant="button" color="text" mb={2} display="block">
          Bekijk uw accountinformatie en huidig abonnement.
        </SoftTypography>

        <AccountSectionNav /> {/* pragma: allowlist secret */}

        <Grid container spacing={3} mt={0.5}>
          <Grid item xs={12} md={7}>
            <Card>
              <SoftBox p={3} display="flex" alignItems="center" gap={2}>
                <SoftAvatar src={avatarUrl} alt={user?.name || 'avatar'} size="xl" bgColor="info" variant="rounded" />
                <SoftBox>
                  <SoftTypography variant="h5" fontWeight="bold">
                    {user?.name || 'Gebruiker'}
                  </SoftTypography>
                  <SoftTypography variant="button" color="text" display="block">
                    {user?.email || '-'}
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    {isAdmin ? 'Administrator' : 'Member'} · Lid sinds {memberSince}
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card>
              <SoftBox p={3}>
                <SoftTypography variant="h6" fontWeight="bold" mb={1}>
                  Subscription Snapshot
                </SoftTypography>
                <SoftTypography variant="button" color="text" display="block">
                  Plan: {subscription?.planId ?? 'FREE'}
                </SoftTypography>
                <SoftTypography variant="button" color="text" display="block">
                  Status: {subscription?.status ?? 'active'}
                </SoftTypography>
                <SoftTypography variant="button" color="text" display="block">
                  Sites: {usage?.sitesUsed ?? 0} / {subscription?.sitesLimit ?? 1}
                </SoftTypography>
                <SoftTypography variant="button" color="text" display="block">
                  Library: {usage?.libraryUsed ?? 0} / {subscription?.libraryLimit ?? 5}
                </SoftTypography>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default AccountProfilePage;
