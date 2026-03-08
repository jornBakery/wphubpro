import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import Icon from '@mui/material/Icon';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';
import { useTickets } from '../domains/tickets';
import { ROUTE_PATHS } from '../config/routePaths';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'Bezig',
  waiting: 'Wachtend',
  resolved: 'Opgelost',
  closed: 'Gesloten',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Laag',
  medium: 'Normaal',
  high: 'Hoog',
  urgent: 'Urgent',
};

const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useTickets();
  const tickets = data?.tickets ?? [];

  return (
    <>
      <SoftBox my={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <SoftTypography variant="h4" fontWeight="bold">
            Helpdesk
          </SoftTypography>
          <SoftButton
            variant="gradient"
            color="info"
            onClick={() => navigate(ROUTE_PATHS.TICKET_NEW)}
            startIcon={<Icon>add</Icon>}
          >
            Nieuw ticket
          </SoftButton>
        </SoftBox>

        <Card>
          {isLoading ? (
            <SoftBox p={3}>
              <SoftTypography color="text">Laden...</SoftTypography>
            </SoftBox>
          ) : tickets.length === 0 ? (
            <SoftBox p={3} textAlign="center">
              <Icon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }}>confirmation_number</Icon>
              <SoftTypography variant="h6" color="secondary" mb={1}>
                Geen tickets
              </SoftTypography>
              <SoftButton variant="gradient" color="info" onClick={() => navigate(ROUTE_PATHS.TICKET_NEW)}>
                Eerste ticket aanmaken
              </SoftButton>
            </SoftBox>
          ) : (
            <SoftBox component="ul" p={0} m={0} sx={{ listStyle: 'none' }}>
              {tickets.map((t) => (
                <SoftBox
                  key={t.$id}
                  component="li"
                  px={3}
                  py={2}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'grey.200',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate(ROUTE_PATHS.TICKET_DETAIL.replace(':id', t.$id))}
                >
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                    <SoftTypography variant="button" fontWeight="bold">
                      {t.subject}
                    </SoftTypography>
                    <SoftBox display="flex" gap={1}>
                      <SoftBox
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: 'grey.200',
                          fontSize: '0.75rem',
                        }}
                      >
                        {STATUS_LABELS[t.status] ?? t.status}
                      </SoftBox>
                      <SoftTypography variant="caption" color="secondary">
                        {PRIORITY_LABELS[t.priority] ?? t.priority}
                      </SoftTypography>
                    </SoftBox>
                  </SoftBox>
                  <SoftTypography variant="caption" color="secondary">
                    {new Date(t.$createdAt).toLocaleDateString('nl-NL')}
                  </SoftTypography>
                </SoftBox>
              ))}
            </SoftBox>
          )}
        </Card>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default TicketsPage;
