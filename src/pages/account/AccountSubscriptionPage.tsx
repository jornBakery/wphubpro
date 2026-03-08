import React from 'react';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';
import {
  useInvoices,
  useManageSubscription,
  useSubscription,
  useUsage,
} from '../../domains/billing';
import AccountSectionNav from '../../components/account/AccountSectionNav'; // pragma: allowlist secret

const formatMoney = (amountCents: number, currency = 'eur') => {
  return (amountCents / 100).toLocaleString('nl-NL', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const AccountSubscriptionPage: React.FC = () => { // pragma: allowlist secret
  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const { data: usage } = useUsage();
  const { data: invoices, isLoading: isInvoicesLoading } = useInvoices();
  const manageSubscription = useManageSubscription();

  const isFree = !subscription?.priceAmount || subscription.priceAmount === 0 || (subscription.planId ?? '').toUpperCase() === 'FREE';

  return (
    <>
      <SoftBox my={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={0.5}>
          Subscription Details
        </SoftTypography>
        <SoftTypography variant="button" color="text" mb={2} display="block">
          Bekijk uw plan, gebruik en facturen.
        </SoftTypography>

        <AccountSectionNav /> {/* pragma: allowlist secret */}

        <Card sx={{ mt: 2 }}>
          <SoftBox p={3}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
              <SoftBox>
                <SoftTypography variant="h6" fontWeight="bold">
                  Huidig plan
                </SoftTypography>
                <SoftTypography variant="button" color="text" display="block">
                  {isSubscriptionLoading ? 'Laden...' : (subscription?.planId ?? 'FREE')}
                </SoftTypography>
                <SoftTypography variant="caption" color="secondary">
                  Status: {isSubscriptionLoading ? '-' : (subscription?.status ?? 'active')}
                </SoftTypography>
              </SoftBox>
              <SoftButton
                variant="gradient"
                color="info"
                onClick={() => manageSubscription.mutate()}
                disabled={manageSubscription.isPending || isFree}
              >
                {manageSubscription.isPending ? 'Openen...' : 'Manage billing'}
              </SoftButton>
            </SoftBox>

            <SoftBox display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={2}>
              <Card>
                <SoftBox p={2}>
                  <SoftTypography variant="caption" color="secondary">Sites</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold">
                    {usage?.sitesUsed ?? 0} / {subscription?.sitesLimit ?? 1}
                  </SoftTypography>
                </SoftBox>
              </Card>
              <Card>
                <SoftBox p={2}>
                  <SoftTypography variant="caption" color="secondary">Library</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold">
                    {usage?.libraryUsed ?? 0} / {subscription?.libraryLimit ?? 5}
                  </SoftTypography>
                </SoftBox>
              </Card>
              <Card>
                <SoftBox p={2}>
                  <SoftTypography variant="caption" color="secondary">Storage uploads</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold">
                    {usage?.storageUsed ?? 0} / {subscription?.storageLimit ?? 10}
                  </SoftTypography>
                </SoftBox>
              </Card>
            </SoftBox>
          </SoftBox>
        </Card>

        <Card sx={{ mt: 2 }}>
          <SoftBox p={3}>
            <SoftTypography variant="h6" fontWeight="bold" mb={1.5}>
              Recente facturen
            </SoftTypography>
            {isInvoicesLoading ? (
              <SoftTypography variant="button" color="text">Facturen laden...</SoftTypography>
            ) : (invoices ?? []).length === 0 ? (
              <SoftTypography variant="button" color="text">Geen facturen beschikbaar.</SoftTypography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Datum</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Bedrag</TableCell>
                      <TableCell align="right">PDF</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(invoices ?? []).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{new Date(invoice.created * 1000).toLocaleDateString('nl-NL')}</TableCell>
                        <TableCell>{invoice.status}</TableCell>
                        <TableCell>{formatMoney(invoice.amount_paid, invoice.currency)}</TableCell>
                        <TableCell align="right">
                          <SoftButton
                            component="a"
                            href={invoice.invoice_pdf}
                            target="_blank"
                            rel="noreferrer"
                            variant="outlined"
                            color="info"
                            size="small"
                          >
                            Open
                          </SoftButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default AccountSubscriptionPage;
