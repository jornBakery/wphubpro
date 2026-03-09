import React, { useState } from 'react';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import SoftInput from 'components/SoftInput';
import MenuItem from '@mui/material/MenuItem';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';
import { executeFunction } from '../../integrations/appwrite/executeFunction';
import { useToast } from '../../contexts/ToastContext';
import type { NotificationType } from '../../types';

const AdminNotificationsPage: React.FC = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotificationType>('platform');
  const [targetUserIds, setTargetUserIds] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Vul titel en bericht in', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    try {
      const ids = targetUserIds.trim() ? targetUserIds.trim().split(/\s+/).filter(Boolean) : [];
      await executeFunction('notifications', {
        action: 'send',
        title: title.trim(),
        body: body.trim(),
        type,
        targetUserIds: ids,
      });
      toast({ title: 'Notificatie verzonden', variant: 'success' });
      setTitle('');
      setBody('');
      setTargetUserIds('');
    } catch (err) {
      toast({
        title: 'Fout',
        description: err instanceof Error ? err.message : 'Kon notificatie niet verzenden',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <SoftBox my={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Platform notificaties versturen
        </SoftTypography>
        <Card>
          <SoftBox component="form" onSubmit={handleSend} p={3} display="flex" flexDirection="column" gap={2}>
            <SoftBox>
              <SoftTypography variant="caption" fontWeight="medium" color="text" display="block" mb={0.5}>Titel</SoftTypography>
              <SoftInput value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth size="small" />
            </SoftBox>
            <TextField
              variant="standard"
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
              select
              fullWidth
              size="small"
            >
              <MenuItem value="platform">Platform</MenuItem>
              <MenuItem value="site_connection">Sitefout</MenuItem>
              <MenuItem value="plugin_update">Plugin update</MenuItem>
              <MenuItem value="theme_update">Theme update</MenuItem>
              <MenuItem value="site_report">Site rapport</MenuItem>
              <MenuItem value="subscription">Abonnement</MenuItem>
            </TextField>
            <TextField
              variant="standard"
              label="Bericht"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              multiline
              rows={5}
              required
              fullWidth
              size="small"
            />
            <SoftBox>
              <SoftTypography variant="caption" fontWeight="medium" color="text" display="block" mb={0.5}>User IDs (optioneel, leeg = alle gebruikers)</SoftTypography>
              <SoftInput value={targetUserIds} onChange={(e) => setTargetUserIds(e.target.value)} placeholder="Space-separated user IDs" fullWidth size="small" />
            </SoftBox>
            <SoftButton type="submit" variant="gradient" color="info" disabled={isSending}>
              {isSending ? 'Verzenden...' : 'Verstuur notificatie'}
            </SoftButton>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default AdminNotificationsPage;
