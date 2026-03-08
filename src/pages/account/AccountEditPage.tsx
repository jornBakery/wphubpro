import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';
import { account } from '../../services/appwrite';
import { useAuth } from '../../domains/auth';
import { useToast } from '../../contexts/ToastContext';
import AccountSectionNav from '../../components/account/AccountSectionNav'; // pragma: allowlist secret

const AccountEditPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    const prefs = (user?.prefs ?? {}) as Record<string, unknown>;
    setDisplayName(typeof prefs.displayName === 'string' ? prefs.displayName : '');
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await account.updateName(name.trim());
      const currentPrefs = (user?.prefs ?? {}) as Record<string, unknown>;
      await account.updatePrefs({ ...currentPrefs, displayName: displayName.trim() });
      await refreshUser();
      toast({
        title: 'Profile updated',
        description: 'Uw accountgegevens zijn bijgewerkt.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.message || 'Kon profiel niet bijwerken.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 8) {
      toast({
        title: 'Wachtwoord te kort',
        description: 'Gebruik minimaal 8 karakters.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Wachtwoorden komen niet overeen',
        description: 'Controleer uw nieuwe wachtwoord en bevestiging.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      await account.updatePassword(newPassword, currentPassword || undefined);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Wachtwoord bijgewerkt',
        description: 'Uw wachtwoord is succesvol gewijzigd.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Wachtwoord update mislukt',
        description: error?.message || 'Kon wachtwoord niet wijzigen.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <>
      <SoftBox my={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={0.5}>
          Edit Account
        </SoftTypography>
        <SoftTypography variant="button" color="text" mb={2} display="block">
          Werk uw profielgegevens en wachtwoord bij.
        </SoftTypography>

        <AccountSectionNav /> {/* pragma: allowlist secret */}

        <Grid container spacing={3} mt={0.5}>
          <Grid item xs={12} md={6}>
            <Card>
              <SoftBox p={3} display="flex" flexDirection="column" gap={2}>
                <SoftTypography variant="h6" fontWeight="bold">
                  Profielgegevens
                </SoftTypography>
                <TextField
                  label="Naam"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Display name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="E-mail"
                  value={user?.email || ''}
                  fullWidth
                  size="small"
                  disabled
                />
                <SoftButton
                  variant="gradient"
                  color="info"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || !name.trim()}
                >
                  {isSavingProfile ? 'Opslaan...' : 'Opslaan'}
                </SoftButton>
              </SoftBox>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <SoftBox p={3} display="flex" flexDirection="column" gap={2}>
                <SoftTypography variant="h6" fontWeight="bold">
                  Wachtwoord wijzigen
                </SoftTypography>
                <TextField
                  label="Huidig wachtwoord"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Nieuw wachtwoord"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Bevestig nieuw wachtwoord"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  fullWidth
                  size="small"
                />
                <SoftButton
                  variant="outlined"
                  color="info"
                  onClick={handleSavePassword}
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? 'Bijwerken...' : 'Wachtwoord bijwerken'}
                </SoftButton>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default AccountEditPage;
