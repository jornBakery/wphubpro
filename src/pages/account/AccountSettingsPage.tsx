import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import SoftButton from 'components/SoftButton';
import Footer from 'examples/Footer';
import { account } from '../../services/appwrite';
import { useAuth } from '../../domains/auth';
import { useToast } from '../../contexts/ToastContext';
import AccountSectionNav from '../../components/account/AccountSectionNav'; // pragma: allowlist secret

const AccountSettingsPage: React.FC = () => { // pragma: allowlist secret
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const prefs = (user?.prefs ?? {}) as Record<string, unknown>;
    setEmailNotifications(prefs.emailNotifications !== false);
    setMarketingEmails(prefs.marketingEmails === true);
    setWeeklyDigest(prefs.weeklyDigest !== false);
  }, [user]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const currentPrefs = (user?.prefs ?? {}) as Record<string, unknown>;
      await account.updatePrefs({
        ...currentPrefs,
        emailNotifications,
        marketingEmails,
        weeklyDigest,
      });
      await refreshUser();
      toast({
        title: 'Settings saved',
        description: 'Uw instellingen zijn opgeslagen.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Opslaan mislukt',
        description: error?.message || 'Kon instellingen niet opslaan.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <SoftBox my={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={0.5}>
          Account Settings
        </SoftTypography>
        <SoftTypography variant="button" color="text" mb={2} display="block">
          Beheer uw notificatie- en communicatievoorkeuren.
        </SoftTypography>

        <AccountSectionNav /> {/* pragma: allowlist secret */}

        <Card sx={{ mt: 2 }}>
          <SoftBox p={3} display="flex" flexDirection="column" gap={1}>
            <SoftTypography variant="h6" fontWeight="bold" mb={1}>
              Voorkeuren
            </SoftTypography>
            <FormControlLabel
              control={(
                <Switch
                  checked={emailNotifications}
                  onChange={(event) => setEmailNotifications(event.target.checked)}
                />
              )}
              label="E-mail notificaties voor accountactiviteit"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={weeklyDigest}
                  onChange={(event) => setWeeklyDigest(event.target.checked)}
                />
              )}
              label="Wekelijkse samenvatting van updates"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={marketingEmails}
                  onChange={(event) => setMarketingEmails(event.target.checked)}
                />
              )}
              label="Productnieuws en marketing e-mails"
            />
            <SoftBox mt={1}>
              <SoftButton
                variant="gradient"
                color="info"
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                {isSaving ? 'Opslaan...' : 'Instellingen opslaan'}
              </SoftButton>
            </SoftBox>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer company={{ href: 'https://wphub.pro', name: 'WPHub.PRO' }} links={[]} />
    </>
  );
};

export default AccountSettingsPage;
