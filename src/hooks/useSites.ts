import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, functions } from '../services/appwrite';
import { Query } from 'appwrite';
import { Site } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const DATABASE_ID = 'platform_db';
const SITES_COLLECTION_ID = 'sites';

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
      // Map de database resultaten naar het Site type
      return response.documents.map((doc: any) => {
        const hasCredentials = !!(doc.api_key || doc.apiKey || doc.password);
        const status: 'connected' | 'disconnected' = (doc.status === 'connected' || doc.status === 'disconnected')
          ? doc.status
          : (hasCredentials ? 'connected' : 'disconnected');
        const healthStatus: 'healthy' | 'bad' = (doc.health_status === 'healthy' || doc.health_status === 'bad')
          ? doc.health_status
          : (hasCredentials ? 'healthy' : 'bad'); // fallback voor oude data
        return {
          ...doc,
          siteName: doc.site_name || '',
          siteUrl: doc.site_url || '',
          status,
          healthStatus,
          lastChecked: doc.last_checked || doc.lastChecked || '',
        };
      }) as unknown as Site[];
    },
    enabled: !!user?.$id,
  });
};

export const useSite = (siteId: string | undefined) => {
    const { user } = useAuth();

    return useQuery<Site, Error>({
        queryKey: ['site', siteId],
        queryFn: async () => {
            if (!siteId) throw new Error("Site ID is required.");
            
            const document = await databases.getDocument(
                DATABASE_ID,
                SITES_COLLECTION_ID,
                siteId
            );

            // Controleer of de site van de huidige gebruiker is
            if ((document as any).user_id !== user?.$id) {
                throw new Error("Geen toegang tot deze site.");
            }
            
            // Map snake_case naar camelCase zodat de UI de data vindt
            const doc = document as any;
            const hasCredentials = !!(doc.api_key || doc.apiKey || doc.password);
            const status: 'connected' | 'disconnected' = (doc.status === 'connected' || doc.status === 'disconnected')
                ? doc.status
                : (hasCredentials ? 'connected' : 'disconnected');
            const healthStatus: 'healthy' | 'bad' = (doc.health_status === 'healthy' || doc.health_status === 'bad')
                ? doc.health_status
                : (hasCredentials ? 'healthy' : 'bad');
            return {
                ...document,
                siteName: doc.site_name,
                siteUrl: doc.site_url,
                status,
                healthStatus,
                lastChecked: doc.last_checked || doc.lastChecked || '',
            } as unknown as Site;
        },
        enabled: !!siteId && !!user,
        retry: 1 // Voorkom eindeloze retries bij 404
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
    }

    return useMutation<Site, Error, NewSiteInput>({
        mutationFn: async (newSiteData) => {
            if (!user) throw new Error("User not authenticated.");
            
            const payload: Record<string, unknown> = {
                site_url: newSiteData.siteUrl,
                site_name: newSiteData.siteName,
                username: newSiteData.username,
                password: newSiteData.password || '',
                userId: user.$id,
            };
            if (newSiteData.api_key) payload.api_key = newSiteData.api_key;

            const path = `/?userId=${user.$id}`;
            const exec = await functions.createExecution('create-site', JSON.stringify(payload), false, path);
            const status = exec.responseStatusCode || 0;
            const body = exec.responseBody || '';
            let parsed: any = null;
            try { parsed = body ? JSON.parse(body) : null; } catch { parsed = body; }

            if (status >= 400) {
                const msg = (parsed && parsed.message) ? parsed.message : (typeof parsed === 'string' ? parsed : 'Failed to create site');
                throw new Error(msg);
            }

            return (parsed && parsed.document) ? (parsed.document as unknown as Site) : (parsed as unknown as Site);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sites', user?.$id] });
            queryClient.invalidateQueries({ queryKey: ['usage', user?.$id]});
            toast({
                title: "Site Toegevoegd",
                description: `Site ${data.siteName} is succesvol aangemaakt.`,
                variant: 'success',
            });
        },
        onError: (error) => {
            toast({
                title: "Fout bij toevoegen",
                description: error.message,
                variant: 'destructive',
            });
        }
    });
};

export const useUpdateSite = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { toast } = useToast();

    return useMutation<any, Error, { siteId: string; username?: string; password?: string; api_key?: string; apiKey?: string; siteName?: string; siteUrl?: string; status?: 'connected' | 'disconnected'; health_status?: 'healthy' | 'bad'; last_checked?: string }>({
        mutationFn: async ({ siteId, ...updates }) => {
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
                // If there are no dbUpdates, avoid calling updateDocument with empty payload
                if (Object.keys(dbUpdates).length === 0) {
                    throw new Error('No fields to update.');
                }
                return await databases.updateDocument(DATABASE_ID, SITES_COLLECTION_ID, siteId, dbUpdates);
            }

            // Gebruik de 'update-site' functie voor gevoelige data (password/username)
            const payload = { siteId, updates, userId: user.$id };
            const path = `/?userId=${user.$id}`;
            const exec = await functions.createExecution('update-site', JSON.stringify(payload), false, path);
            
            const status = exec.responseStatusCode || 0;
            const body = exec.responseBody || '';
            let parsed: any = null;
            try { parsed = body ? JSON.parse(body) : null; } catch { parsed = body; }
            
            if (status >= 400) {
                const msg = (parsed && parsed.message) ? parsed.message : 'Fout bij bijwerken site';
                throw new Error(msg);
            }
            return (parsed && parsed.document) ? parsed.document : parsed;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['sites', user?.$id] });
            queryClient.invalidateQueries({ queryKey: ['site', variables.siteId] });
            // Invalidate plugins/themes for this site so the UI refetches using updated credentials
            queryClient.invalidateQueries({ queryKey: ['plugins', variables.siteId] });
            queryClient.invalidateQueries({ queryKey: ['themes', variables.siteId] });
            toast({ title: 'Site bijgewerkt', description: 'De gegevens zijn succesvol opgeslagen.', variant: 'success' });
        },
        onError: (err) => {
            toast({ title: 'Update mislukt', description: err.message, variant: 'destructive' });
        }
    });
};

export const useCheckSiteHealth = (siteId: string | undefined) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { toast } = useToast();

    return useMutation<void, Error, { silent?: boolean } | void>({
        mutationFn: async () => {
            if (!siteId || !user) throw new Error('Site ID required.');
            // Probeer de plugins endpoint via wp-proxy
            const path = `/?siteId=${siteId}&endpoint=wphubpro/v1/plugins&userId=${user.$id}&useApiKey=1`;
            const exec = await functions.createExecution('wp-proxy', undefined, false, path);
            const status = exec.responseStatusCode || 0;
            const success = exec.status === 'completed' && status >= 200 && status < 400;
            await databases.updateDocument(DATABASE_ID, SITES_COLLECTION_ID, siteId, {
                health_status: success ? 'healthy' : 'bad',
                last_checked: new Date().toISOString(),
            });
            if (!success) {
                const body = exec.responseBody || '';
                let parsed: any = null;
                try { parsed = body ? JSON.parse(body) : null; } catch { parsed = body; }
                const msg = (parsed && parsed.message) ? parsed.message : 'Verbinding mislukt';
                throw new Error(msg);
            }
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
        }
    });
};