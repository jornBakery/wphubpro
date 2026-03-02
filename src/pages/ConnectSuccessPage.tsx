/**
 * Connect Success page - handles callback from WordPress plugin
 * Plugin redirects with ?site_url=...&user_login=...&api_key=...
 * Saves the API key to the site (create or update) so the site is connected
 */
import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Icon from '@mui/material/Icon';

import { useAuth } from '../contexts/AuthContext';
import { useSites, useAddSite, useUpdateSite } from '../hooks/useSites';

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

    if (existing) {
      updateSite.mutate(
        { siteId: existing.$id, api_key: apiKey },
        {
          onSuccess: () => navigate('/sites', { replace: true }),
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
          onSuccess: () => navigate('/sites', { replace: true }),
          onError: () => {},
        }
      );
    }
  }, [user, authLoading, sitesLoading, sites, siteUrl, apiKey, userLogin, navigate, addSite, updateSite]);

  if (authLoading || !user) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', p: 4 }}>
        <Icon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }}>hourglass_empty</Icon>
        <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>Even geduld…</Typography>
        <Typography variant="body2" color="text.secondary">Log in om de koppeling te voltooien.</Typography>
        <Button variant="contained" color="primary" size="small" sx={{ mt: 3 }} onClick={() => navigate('/login')}>
          Inloggen
        </Button>
      </Box>
    );
  }

  if (!siteUrl || !apiKey) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', p: 4 }}>
        <Icon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }}>warning</Icon>
        <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>Ongeldige callback</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Ontbrekende site_url of api_key.</Typography>
        <Button variant="contained" color="primary" size="small" onClick={() => navigate('/dashboard')}>
          Naar dashboard
        </Button>
      </Box>
    );
  }

  const isPending = addSite.isPending || updateSite.isPending;
  const isError = addSite.isError || updateSite.isError;

  if (isError) {
    const err = addSite.error || updateSite.error;
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', p: 4 }}>
        <Icon sx={{ fontSize: 48, color: 'error.main', mb: 2 }}>error</Icon>
        <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>Koppeling mislukt</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{err?.message}</Typography>
        <Button variant="contained" color="primary" size="small" onClick={() => navigate('/sites')}>
          Naar sites
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', p: 4 }}>
      <Icon sx={{ fontSize: 48, color: isPending ? 'info.main' : 'success.main', mb: 2 }}>
        {isPending ? 'sync' : 'check_circle'}
      </Icon>
      <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
        {isPending ? 'Site koppelen…' : 'Site gekoppeld!'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {isPending ? 'De verbinding wordt opgeslagen…' : 'U wordt doorgestuurd naar sites.'}
      </Typography>
    </Box>
  );
};

export default ConnectSuccessPage;
