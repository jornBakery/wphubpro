import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases } from '../../services/appwrite';
import { Query } from 'appwrite';
import { Site } from '../../types';
import { useAuth } from '../auth';
import { useToast } from '../../contexts/ToastContext';
import { executeFunction, executeFunctionWithMeta } from '../../integrations/appwrite/executeFunction';
import { mapSiteDocumentToSite } from './mappers';

const DATABASE_ID = 'platform_db';
const SITES_COLLECTION_ID = 'sites';

const PING_INTERVAL_MS = 10_000;

function parseMetaData(doc: { meta_data?: string; metaData?: string }): Record<string, unknown> {
  const raw = doc.meta_data ?? doc.metaData;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function mergeMetaDataConnected(meta: Record<string, unknown>, connected: boolean): string {
  return JSON.stringify({ ...meta, connected });
}

/** Ping bridge API and update site connection status in DB. Throws on failure (for checkHealth); returns false when disconnected (for background ping). */
async function pingSiteConnection(
  siteId: string,
  userId: string,
  options?: { throwOnFail?: boolean }
): Promise<boolean> {
  const path = `/?siteId=${siteId}&endpoint=wphubpro/v1/plugins&userId=${userId}&useApiKey=1`;
  const exec = await executeFunctionWithMeta<unknown>('wp-proxy', undefined, {
    path,
    throwOnHttpError: false,
  });
  const status = exec.statusCode || 0;
  const success = exec.executionStatus === 'completed' && status >= 200 && status < 400;

  const doc = await databases.getDocument(DATABASE_ID, SITES_COLLECTION_ID, siteId);
  const meta = parseMetaData(doc as any);
  const meta_data = mergeMetaDataConnected(meta, success);

  await databases.updateDocument(DATABASE_ID, SITES_COLLECTION_ID, siteId, {
    status: success ? 'connected' : 'disconnected',
    health_status: success ? 'healthy' : 'bad',
    last_checked: new Date().toISOString(),
    meta_data,
  });
  if (!success && options?.throwOnFail) {
    const parsed = exec.data as any;
    const msg = parsed && parsed.message ? parsed.message : 'Verbinding mislukt';
    throw new Error(msg);
  }
  return success;
}

export const useSites = () => {
  const { user } = useAuth();

  return useQuery<Site[], Error>({
    queryKey: ['sites', user?.$id],
    queryFn: async () => {
      if (!user?.$id) return [];
      const response = await databases.listDocuments(
        DATABASE_ID,
        SITES_COLLECTION_ID,
        [Query.equal('user_id', user.$id)]
      );
      return response.documents.map((doc: any) => mapSiteDocumentToSite(doc));
    },
    enabled: !!user?.$id,
  });
};

export const useSite = (siteId: string | undefined) => {
  const { user } = useAuth();

  return useQuery<Site, Error>({
    queryKey: ['site', siteId],
    queryFn: async () => {
      if (!siteId) throw new Error('Site ID is required.');

      const document = await databases.getDocument(
        DATABASE_ID,
        SITES_COLLECTION_ID,
        siteId
      );

      // Controleer of de site van de huidige gebruiker is
      if ((document as any).user_id !== user?.$id) {
        throw new Error('Geen toegang tot deze site.');
      }

      return mapSiteDocumentToSite(document as any);
    },
    enabled: !!siteId && !!user,
    retry: 1, // Voorkom eindeloze retries bij 404
  });
};

export const useAddSite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  type NewSiteInput = {
    siteName: string;
    siteUrl: string;
    username: string;
    password?: string;
    api_key?: string;
    meta_data?: string;
  };

  return useMutation<Site, Error, NewSiteInput>({
    mutationFn: async (newSiteData) => {
      if (!user) throw new Error('User not authenticated.');

      const payload: Record<string, unknown> = {
        action: 'create',
        site_url: newSiteData.siteUrl,
        site_name: newSiteData.siteName,
        username: newSiteData.username,
        password: newSiteData.password || '',
        userId: user.$id,
      };
      if (newSiteData.api_key) payload.api_key = newSiteData.api_key;
      if (newSiteData.meta_data !== undefined) payload.meta_data = newSiteData.meta_data;

      const path = `/?userId=${user.$id}`;
      const parsed = await executeFunction<{ document?: Site }>('wphub-sites', payload, { path });
      const rawSite = parsed && parsed.document ? parsed.document : parsed;
      return mapSiteDocumentToSite(rawSite as any);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sites', user?.$id] });
      queryClient.invalidateQueries({ queryKey: ['usage', user?.$id] });
      toast({
        title: 'Site Toegevoegd',
        description: `Site ${data.siteName} is succesvol aangemaakt.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout bij toevoegen',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation<any, Error, {
    siteId: string;
    username?: string;
    password?: string;
    api_key?: string;
    apiKey?: string;
    siteName?: string;
    siteUrl?: string;
    status?: 'connected' | 'disconnected';
    health_status?: 'healthy' | 'bad';
    last_checked?: string;
    meta_data?: string;
    /** When true, skip success toast (e.g. for background connection-status corrections) */
    silent?: boolean;
  }>({
    mutationFn: async ({ siteId, silent: _silent, ...updates }) => {
      if (!user) throw new Error('User not authenticated.');

      // Decide if server processing is needed. Use property presence (not truthiness)
      const hasOwn = (obj: any, key: string) => Object.prototype.hasOwnProperty.call(obj || {}, key);
      const needsServerProcessing = hasOwn(updates, 'password') || hasOwn(updates, 'username') || hasOwn(updates, 'api_key') || hasOwn(updates, 'apiKey');

      if (!needsServerProcessing) {
        // Direct DB update for simple metadata
        const dbUpdates: any = {};
        if (updates.siteName) dbUpdates.site_name = updates.siteName;
        if (updates.siteUrl) dbUpdates.site_url = updates.siteUrl;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.health_status) dbUpdates.health_status = updates.health_status;
        if (updates.last_checked) dbUpdates.last_checked = updates.last_checked;
        if (updates.meta_data !== undefined) dbUpdates.meta_data = updates.meta_data;
        // When status changes, persist connected in meta_data
        if (updates.status !== undefined) {
          const doc = await databases.getDocument(DATABASE_ID, SITES_COLLECTION_ID, siteId);
          const meta = parseMetaData(doc as any);
          dbUpdates.meta_data = mergeMetaDataConnected(meta, updates.status === 'connected');
        }
        // If there are no dbUpdates, avoid calling updateDocument with empty payload
        if (Object.keys(dbUpdates).length === 0) {
          throw new Error('No fields to update.');
        }
        const updated = await databases.updateDocument(DATABASE_ID, SITES_COLLECTION_ID, siteId, dbUpdates);
        return mapSiteDocumentToSite(updated as any);
      }

      // Use wphub-sites for sensitive data (password/username)
      const payload = { action: 'update', siteId, updates, userId: user.$id };
      const path = `/?userId=${user.$id}`;
      const parsed = await executeFunction<{ document?: any }>('wphub-sites', payload, { path });
      const rawSite = parsed && parsed.document ? parsed.document : parsed;
      return mapSiteDocumentToSite(rawSite as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites', user?.$id] });
      queryClient.invalidateQueries({ queryKey: ['site', variables.siteId] });
      // Invalidate plugins/themes for this site so the UI refetches using updated credentials
      queryClient.invalidateQueries({ queryKey: ['plugins', variables.siteId] });
      queryClient.invalidateQueries({ queryKey: ['themes', variables.siteId] });
      if (!variables.silent) {
        toast({ title: 'Site bijgewerkt', description: 'De gegevens zijn succesvol opgeslagen.', variant: 'success' });
      }
    },
    onError: (err) => {
      toast({ title: 'Update mislukt', description: err.message, variant: 'destructive' });
    },
  });
};

export const useCheckSiteHealth = (siteId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation<void, Error, { silent?: boolean } | void>({
    mutationFn: async () => {
      if (!siteId || !user) throw new Error('Site ID required.');
      await pingSiteConnection(siteId, user.$id, { throwOnFail: true });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites', user?.$id] });
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      const silent = typeof variables === 'object' && variables?.silent;
      if (!silent) toast({ title: 'Verbinding OK', description: 'De site reageert correct.', variant: 'success' });
    },
    onError: (err, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites', user?.$id] });
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      const silent = typeof _variables === 'object' && _variables?.silent;
      if (!silent) toast({ title: 'Verbinding mislukt', description: err.message, variant: 'destructive' });
    },
  });
};

export const useDeleteSite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (siteId: string) => {
      if (!user) throw new Error('User not authenticated.');
      await databases.deleteDocument(DATABASE_ID, SITES_COLLECTION_ID, siteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites', user?.$id] });
      toast({ title: 'Site verwijderd', description: 'De site is succesvol verwijderd.', variant: 'success' });
    },
    onError: (err) => {
      toast({ title: 'Verwijderen mislukt', description: err.message, variant: 'destructive' });
    },
  });
};

/** Background ping: probes bridge API every 10s and updates connection status. Use on Site Detail. */
export const useSiteConnectionPing = (siteId: string | undefined, intervalMs = PING_INTERVAL_MS) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!siteId || !user) return;
    const run = async () => {
      try {
        await pingSiteConnection(siteId, user.$id);
      } finally {
        queryClient.invalidateQueries({ queryKey: ['sites', user.$id] });
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      }
    };
    run();
    const id = setInterval(run, intervalMs);
    return () => clearInterval(id);
  }, [siteId, user?.$id, intervalMs, queryClient]);
};

/** Background ping: probes bridge API for all sites every 10s and updates statuses. Use on Dashboard/Sites. */
export const useSitesConnectionPing = (siteIds: string[], intervalMs = PING_INTERVAL_MS) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || siteIds.length === 0) return;
    const run = async () => {
      await Promise.all(siteIds.map((sid) => pingSiteConnection(sid, user.$id)));
      queryClient.invalidateQueries({ queryKey: ['sites', user.$id] });
      siteIds.forEach((sid) => queryClient.invalidateQueries({ queryKey: ['site', sid] }));
    };
    run();
    const id = setInterval(run, intervalMs);
    return () => clearInterval(id);
  }, [siteIds.join(','), user?.$id, intervalMs, queryClient]);
};
