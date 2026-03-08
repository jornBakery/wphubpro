import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Icon from '@mui/material/Icon';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';
import { useTicket, useAddTicketMessage } from '../domains/tickets';
import { useToast } from '../contexts/ToastContext';
import { ROUTE_PATHS } from '../config/routePaths';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading } = useTicket(id);
  const addMessage = useAddTicketMessage();
  const [body, setBody] = useState('');

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !body.trim()) return;
    try {
      await addMessage.mutateAsync({ ticketId: id, body: body.trim() });
      setBody('');
      toast({ title: 'Bericht verzonden', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Fout',
        description: err instanceof Error ? err.message : 'Kon bericht niet verzenden',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !data) {
    return (
      <SoftBox my={3}>
        <SoftTypography color="text">Laden...</SoftTypography>
      </SoftBox>
    );
  }

  const { ticket, messages } = data;

  return (
    <>
      <SoftBox my={3}>
        <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
          <SoftButton size="small" variant="text" onClick={() => navigate(ROUTE_PATHS.TICKETS)} startIcon={<Icon>arrow_back</Icon>}>
            Terug
          </SoftButton>
        </SoftBox>

        <Card sx={{ mb: 2 }}>
          <SoftBox p={3}>
            <SoftTypography variant="h5" fontWeight="bold" mb={1}>
              {ticket.subject}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              Status: {ticket.status} · Prioriteit: {ticket.priority} · {new Date(ticket.$createdAt).toLocaleDateString('nl-NL')}
            </SoftTypography>
          </SoftBox>
        </Card>

        <SoftTypography variant="h6" fontWeight="bold" mb={1}>
          Berichten
        </SoftTypography>
        <Card sx={{ mb: 2 }}>
          <SoftBox p={2}>
            {messages.map((m) => (
              <SoftBox
                key={m.$id}
                mb={2}
                p={2}
                sx={{
                  bgcolor: m.isStaff ? 'info.lighter' : 'grey.100',
                  borderRadius: 1,
                  borderLeft: m.isStaff ? '4px solid' : 'none',
                  borderColor: 'info.main',
                }}
              >
                <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
                  <SoftTypography variant="caption" fontWeight="bold">
                    {m.isStaff ? 'Support' : 'Jij'}
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    {new Date(m.$createdAt).toLocaleString('nl-NL')}
                  </SoftTypography>
                </SoftBox>
                <SoftTypography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {m.body}
                </SoftTypography>
              </SoftBox>
            ))}
          </SoftBox>
        </Card>

        <Card>
          <SoftBox component="form" onSubmit={handleReply} p={3}>
            <TextField
              label="Antwoord"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />
            <SoftButton type="submit" variant="gradient" color="info" disabled={addMessage.isPending || !body.trim()}>
              {addMessage.isPending ? 'Verzenden...' : 'Verstuur'}
            </SoftButton>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default TicketDetailPage;
