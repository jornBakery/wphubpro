import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import SoftBox from 'components/SoftBox';
import SoftInput from 'components/SoftInput';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';
import { useCreateTicket } from '../domains/tickets';
import { useToast } from '../contexts/ToastContext';
import { ROUTE_PATHS } from '../config/routePaths';
import type { TicketPriority } from '../types';

const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createTicket = useCreateTicket();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast({ title: 'Onderwerp verplicht', variant: 'destructive' });
      return;
    }
    try {
      const res = await createTicket.mutateAsync({ subject: subject.trim(), body: body.trim(), priority });
      toast({ title: 'Ticket aangemaakt', variant: 'success' });
      navigate(ROUTE_PATHS.TICKET_DETAIL.replace(':id', res.ticket.$id));
    } catch (err) {
      toast({
        title: 'Fout',
        description: err instanceof Error ? err.message : 'Kon ticket niet aanmaken',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <SoftBox my={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Nieuw ticket
        </SoftTypography>

        <Card>
          <SoftBox component="form" onSubmit={handleSubmit} p={3} display="flex" flexDirection="column" gap={2}>
            <SoftBox>
              <SoftTypography variant="caption" fontWeight="medium" color="text" display="block" mb={0.5}>Onderwerp</SoftTypography>
              <SoftInput value={subject} onChange={(e) => setSubject(e.target.value)} required fullWidth size="small" />
            </SoftBox>
            <TextField
              variant="standard"
              label="Prioriteit"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              select
              fullWidth
              size="small"
            >
              <MenuItem value="low">Laag</MenuItem>
              <MenuItem value="medium">Normaal</MenuItem>
              <MenuItem value="high">Hoog</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
            <SoftBox>
              <SoftTypography variant="caption" fontWeight="medium" color="text" display="block" mb={0.5}>Bericht</SoftTypography>
              <SoftInput value={body} onChange={(e) => setBody(e.target.value)} multiline rows={5} fullWidth size="small" />
            </SoftBox>
            <SoftBox display="flex" gap={1} mt={1}>
              <SoftButton type="submit" variant="gradient" color="info" disabled={createTicket.isPending}>
                {createTicket.isPending ? 'Aanmaken...' : 'Ticket aanmaken'}
              </SoftButton>
              <SoftButton variant="outlined" color="info" onClick={() => navigate(ROUTE_PATHS.TICKETS)}>
                Annuleren
              </SoftButton>
            </SoftBox>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default CreateTicketPage;
