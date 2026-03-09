/**
 * Connect Success page - handles callback from WordPress plugin
 * Plugin redirects with ?site_url=...&user_login=...&api_key=...
 * Saves the API key to the site (create or update) so the site is connected
 */
import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SoftBox from 'components/SoftBox';
import SoftButton from 'components/SoftButton';
import SoftTypography from 'components/SoftTypography';
import Icon from '@mui/material/Icon';

import { useAuth } from '../domains/auth';
import { useSites, useAddSite, useUpdateSite } from '../domains/sites';
import { account, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '../services/appwrite';

/** Save JWT and connection data to WordPress bridge */
async function saveConnectionToWordPress(siteUrl: string, apiKey: string): Promise<void> {
  let jwt: string;
  try {
    const res = await account.createJWT();
    jwt = typeof res === 'string' ? res : (res as { jwt?: string }).jwt ?? '';
  } catch {
    return;
  }
  if (!jwt) return;
  const base = siteUrl.replace(/\/$/, '');
  const url = `${base}/wp-json/wphubpro/v1/save-connection`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WPHub-Key': apiKey,
      },
      body: JSON.stringify({
        jwt,
        endpoint: APPWRITE_ENDPOINT,
        project_id: APPWRITE_PROJECT_ID,
      }),
    });
  } catch {
    // Silently ignore - connection still works via API key
  }
}

const normalizeUrl = (url: string) => {
  const s = (url || '').trim();
  if (!s) return '';
  try {
    return s.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  } catch {
    return s;
  }
};

const ConnectSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: sites, isLoading: sitesLoading } = useSites();
  const addSite = useAddSite();
  const updateSite = useUpdateSite();
  const processed = useRef(false);

  const siteUrl = searchParams.get('site_url') || '';
  const userLogin = searchParams.get('user_login') || '';
  const apiKey = searchParams.get('api_key') || '';

  useEffect(() => {
    if (processed.current || authLoading || sitesLoading || !user) return;
    if (!siteUrl || !apiKey) {
      processed.current = true;
      navigate('/dashboard', { replace: true });
      return;
    }
    // Gebruik sites-array (bij fout/undefined als lege array, zodat we alsnog kunnen aanmaken)
    const sitesList = Array.isArray(sites) ? sites : [];
    processed.current = true;
    const normalized = normalizeUrl(siteUrl);
    if (!normalized) {
      navigate('/dashboard', { replace: true });
      return;
    }
    const existing = sitesList.find((s) => {
      const existingNorm = normalizeUrl(s.siteUrl || (s as any).site_url || '');
      return existingNorm && existingNorm === normalized;
    });

    const doNavigate = () => navigate('/sites', { replace: true });
    const fullSiteUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;

    if (existing) {
      updateSite.mutate(
        { siteId: existing.$id, api_key: apiKey },
        {
          onSuccess: () => {
            saveConnectionToWordPress(fullSiteUrl, apiKey).then(doNavigate);
          },
          onError: () => {},
        }
      );
    } else {
      const siteName = (() => {
        try {
          return new URL(siteUrl).hostname || siteUrl;
        } catch {
          return siteUrl;
        }
      })();
      addSite.mutate(
        {
          siteUrl: siteUrl.replace(/\/$/, ''),
          siteName,
          username: userLogin,
          api_key: apiKey,
        },
        {
          onSuccess: () => {
            saveConnectionToWordPress(fullSiteUrl, apiKey).then(doNavigate);
          },
          onError: () => {},
        }
      );
    }
  }, [user, authLoading, sitesLoading, sites, siteUrl, apiKey, userLogin, navigate, addSite, updateSite]);

  if (authLoading || !user) {
    return (
      <SoftBox sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', p: 4 }}>
        <Icon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }}>hourglass_empty</Icon>
        <SoftTypography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>Even geduld…</SoftTypography>
        <SoftTypography variant="body2" color="text.secondary">Log in om de koppeling te voltooien.</SoftTypography>
        <SoftButton variant="contained" color="primary" size="small" sx={{ mt: 3 }} onClick={() => navigate('/login')}>
          Inloggen
        </SoftButton>
      </SoftBox>
    );
  }

  if (!siteUrl || !apiKey) {
    return (
      <SoftBox sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', p: 4 }}>
        <Icon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }}>warning</Icon>
        <SoftTypography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>Ongeldige callback</SoftTypography>
        <SoftTypography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Ontbrekende site_url of api_key.</SoftTypography>
        <SoftButton variant="contained" color="primary" size="small" onClick={() => navigate('/dashboard')}>
          Naar dashboard
        </SoftButton>
      </SoftBox>
    );
  }

  const isPending = addSite.isPending || updateSite.isPending;
  const isError = addSite.isError || updateSite.isError;

  if (isError) {
    const err = addSite.error || updateSite.error;
    return (
      <SoftBox sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', p: 4 }}>
        <Icon sx={{ fontSize: 48, color: 'error.main', mb: 2 }}>error</Icon>
        <SoftTypography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>Koppeling mislukt</SoftTypography>
        <SoftTypography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{err?.message}</SoftTypography>
        <SoftButton variant="contained" color="primary" size="small" onClick={() => navigate('/sites')}>
          Naar sites
        </SoftButton>
      </SoftBox>
    );
  }

  return (
    <SoftBox sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', p: 4 }}>
      <Icon sx={{ fontSize: 48, color: isPending ? 'info.main' : 'success.main', mb: 2 }}>
        {isPending ? 'sync' : 'check_circle'}
      </Icon>
      <SoftTypography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
        {isPending ? 'Site koppelen…' : 'Site gekoppeld!'}
      </SoftTypography>
      <SoftTypography variant="body2" color="text.secondary">
        {isPending ? 'De verbinding wordt opgeslagen…' : 'U wordt doorgestuurd naar sites.'}
      </SoftTypography>
    </SoftBox>
  );
};

export default ConnectSuccessPage;
