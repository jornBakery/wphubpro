import { useEffect, useRef } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { functions } from '../services/appwrite';
import { useAuth } from '../domains/auth';
import { useUpdateSite } from '../domains/sites/hooks';
import { useToast } from '../contexts/ToastContext';
import { executeFunctionWithMeta } from '../integrations/appwrite/executeFunction';

function wpProxy<T>(
  siteId: string,
  userId: string | undefined,
  endpoint: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): Promise<T> {
  const qs = new URLSearchParams();
  qs.set('siteId', siteId);
  qs.set('endpoint', endpoint);
  if (userId) qs.set('userId', userId);
  qs.set('useApiKey', '1');
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') qs.set('method', method);
  if (options.body && Object.keys(options.body).length > 0) {
    qs.set('body', JSON.stringify(options.body));
  }
  const path = `/?${qs.toString()}`;
  const payload = options.body && method !== 'GET' ? options.body : undefined;
  return executeFunctionWithMeta<T>(
    'wp-proxy',
    payload as any,
    { path, method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', throwOnHttpError: true }
  ).then((r) => r.data);
}

async function getSiteLogs(siteId: string, userId?: string): Promise<BridgeLogEntry[]> {
  const res = await wpProxy<{ logs?: BridgeLogEntry[] }>(siteId, userId, 'wphubpro/v1/logs');
  return res?.logs ?? [];
}

async function getSiteErrorLog(siteId: string, userId?: string): Promise<{ lines: string[]; file?: string; error?: string }> {
  return wpProxy(siteId, userId, 'wphubpro/v1/error-log');
}

async function getSiteExecutionLogs(siteId: string): Promise<AppwriteExecution[]> {
  const { functions } = await import('../services/appwrite');
  const { Query } = await import('appwrite');
  const list = await (functions as any).listExecutions?.('wp-proxy', [
    Query.equal('requestPath', `?siteId=${siteId}`),
    Query.limit(50),
    Query.orderDesc('$createdAt'),
  ]);
  return (list?.executions ?? []).map((e: any) => ({
    $id: e.$id,
    $createdAt: e.$createdAt,
    status: e.status,
    responseStatusCode: e.responseStatusCode,
    responseBody: e.responseBody ?? '',
    logs: e.logs ?? '',
    errors: e.errors ?? '',
    duration: e.duration ?? 0,
    requestMethod: e.requestMethod ?? '',
    requestPath: e.requestPath ?? '',
  }));
}

async function updatePluginStatus(siteId: string, slug: string, active: boolean, userId?: string): Promise<unknown> {
  const path = active ? 'wphubpro/v1/plugins/manage/activate' : 'wphubpro/v1/plugins/manage/deactivate';
  return wpProxy(siteId, userId, `${path}?plugin=${encodeURIComponent(slug)}`, { method: 'POST', body: { plugin: slug } });
}

async function updateThemeStatus(siteId: string, slug: string, active: boolean, userId?: string): Promise<unknown> {
  const path = active ? 'wphubpro/v1/themes/manage/activate' : 'wphubpro/v1/themes/manage/deactivate';
  return wpProxy(siteId, userId, path, { method: 'POST', body: { slug } });
}

async function deletePlugin(siteId: string, slug: string, userId?: string): Promise<unknown> {
  return wpProxy(siteId, userId, `wphubpro/v1/plugins/manage/uninstall?plugin=${encodeURIComponent(slug)}`, {
    method: 'POST',
    body: { plugin: slug },
  });
}

async function deleteTheme(siteId: string, slug: string, userId?: string): Promise<unknown> {
  return wpProxy(siteId, userId, 'wphubpro/v1/themes/manage/delete', { method: 'POST', body: { slug } });
}

async function syncSiteData(siteId: string, userId?: string): Promise<unknown> {
  const path = `/?siteId=${siteId}&endpoint=wphubpro/v1/plugins&userId=${userId || ''}&useApiKey=1`;
  const exec = await executeFunctionWithMeta('wp-proxy', undefined, { path, throwOnHttpError: false });
  return exec.statusCode >= 200 && exec.statusCode < 400 ? {} : Promise.reject(new Error('Sync failed'));
}

export interface BridgeLogEntry {
  time: string;
  endpoint: string;
  type: string;
  code: number;
  request: any;
  response: any;
}

export interface AppwriteExecution {
  $id: string;
  $createdAt: string;
  status: string;
  responseStatusCode: number;
  responseBody: string;
  logs: string;
  errors: string;
  duration: number;
  requestMethod: string;
  requestPath: string;
}

export interface WordPressPlugin {
  plugin: string;
  name: string;
  version: string;
  status: 'active' | 'inactive';
  update: string | null;
}

export interface WordPressTheme {
  stylesheet: string;
  name: string;
  version: string;
  status: 'active' | 'inactive';
  update?: string | null;
}

/** Plugin list - exported for SiteDetailsTab, PluginsTab. Set enabled: false when site is off to skip bridge API calls. */
export const usePlugins = (siteId: string | undefined, options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  const queryEnabled = !!siteId && (options?.enabled !== false);
  return useQuery<WordPressPlugin[]>({
    queryKey: ['plugins', siteId],
    queryFn: async () => {
      const raw = await wpProxy<any[]>(siteId!, user?.$id, 'wphubpro/v1/plugins');
      return (raw ?? []).map((p: any) => ({
        plugin: p.plugin ?? p.file,
        name: p.name,
        version: p.version,
        status: p.active ? ('active' as const) : ('inactive' as const),
        update: p.update ?? null,
      }));
    },
    enabled: queryEnabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

/** Theme list - exported for SiteDetailsTab, ThemesTab. Set enabled: false when site is off to skip bridge API calls. */
export const useThemes = (siteId: string | undefined, options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  const queryEnabled = !!siteId && (options?.enabled !== false);
  return useQuery<WordPressTheme[]>({
    queryKey: ['themes', siteId],
    queryFn: async () => {
      const raw = await wpProxy<any[]>(siteId!, user?.$id, 'wphubpro/v1/themes');
      return (raw ?? []).map((t: any) => ({
        stylesheet: t.stylesheet ?? t.slug,
        name: t.name,
        version: t.version,
        status: t.active ? ('active' as const) : ('inactive' as const),
        update: t.update ?? null,
      }));
    },
    enabled: queryEnabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

function hasUpdate(p: { update?: string | { new_version?: string } | null }): boolean {
  if (p.update == null) return false;
  if (typeof p.update === 'object') return !!(p.update.new_version && String(p.update.new_version).trim());
  return String(p.update).trim() !== '';
}

export interface PluginUpdateSite {
  siteId: string;
  siteName: string;
  installedVersion: string;
  pluginFile: string;
}

export interface AggregatedPluginUpdate {
  pluginSlug: string;
  name: string;
  latestVersion: string;
  releaseDate: string | null;
  sites: PluginUpdateSite[];
}

export interface SitesUpdateStats {
  sitesNeedingUpdatesCount: number;
  pluginUpdatesCount: number;
  pluginTotalCount: number;
  themeUpdatesCount: number;
  themeTotalCount: number;
  pluginUpdatesList: AggregatedPluginUpdate[];
  isLoading: boolean;
}

/** Aggregate update stats across all connected sites - exported for Dashboard.
 * Also tracks bridge API response: when plugins fetch fails, marks site as disconnected.
 */
export const useSitesUpdateStats = (sites: { $id: string; status: string }[]) => {
  const { user } = useAuth();
  const updateSite = useUpdateSite();
  const markedDisconnectedRef = useRef<Set<string>>(new Set());
  const markedConnectedRef = useRef<Set<string>>(new Set());
  const connectedSites = sites.filter((s) => s.status === 'connected');
  const siteIds = sites.map((s) => s.$id);

  const pluginsQueries = useQueries({
    queries: siteIds.map((siteId) => ({
      queryKey: ['plugins', siteId] as const,
      queryFn: async () => {
        const raw = await wpProxy<any[]>(siteId, user?.$id, 'wphubpro/v1/plugins');
        return (raw ?? []).map((p: any) => {
          const u = p.update;
          const updateObj =
            u != null
              ? typeof u === 'object' && u !== null
                ? { new_version: (u as any).new_version ?? String(u), last_updated: (u as any).last_updated ?? null }
                : { new_version: String(u).trim(), last_updated: null }
              : null;
          return {
            plugin: p.plugin ?? p.file,
            name: p.name,
            version: p.version,
            status: p.active ? ('active' as const) : ('inactive' as const),
            update: updateObj,
          };
        });
      },
      enabled: !!siteId && !!user,
      staleTime: 60_000,
    })),
  });

  const themesQueries = useQueries({
    queries: siteIds.map((siteId) => ({
      queryKey: ['themes', siteId] as const,
      queryFn: async () => {
        const raw = await wpProxy<any[]>(siteId, user?.$id, 'wphubpro/v1/themes');
        return (raw ?? []).map((t: any) => ({
          stylesheet: t.stylesheet ?? t.slug,
          name: t.name,
          version: t.version,
          status: t.active ? ('active' as const) : ('inactive' as const),
          update: t.update ?? null,
        }));
      },
      enabled: !!siteId && !!user,
      staleTime: 60_000,
    })),
  });

  const isLoading = pluginsQueries.some((q) => q.isLoading) || themesQueries.some((q) => q.isLoading);

  // Track bridge API response: plugins is the primary connectivity check
  useEffect(() => {
    for (let i = 0; i < siteIds.length; i++) {
      const siteId = siteIds[i];
      if (!siteId) continue;
      const pluginsQuery = pluginsQueries[i];
      const pluginsSucceeded = pluginsQuery?.isSuccess && pluginsQuery?.data != null;
      const pluginsFailed = pluginsQuery?.isError ?? false;

      if (pluginsSucceeded && !markedConnectedRef.current.has(siteId)) {
        const site = sites.find((s) => s.$id === siteId);
        if (site?.status !== 'connected') {
          markedConnectedRef.current.add(siteId);
          updateSite.mutate({ siteId, status: 'connected', silent: true });
        }
      } else if (pluginsFailed && !markedDisconnectedRef.current.has(siteId)) {
        markedDisconnectedRef.current.add(siteId);
        updateSite.mutate({ siteId, status: 'disconnected', silent: true });
      }
    }
  }, [siteIds, sites, pluginsQueries, updateSite]);

  let pluginUpdatesCount = 0;
  let pluginTotalCount = 0;
  let themeUpdatesCount = 0;
  let themeTotalCount = 0;
  let sitesNeedingUpdatesCount = 0;

  const pluginUpdatesMap = new Map<string, AggregatedPluginUpdate>();

  const connectedSiteIds = new Set(connectedSites.map((s) => s.$id));
  for (let i = 0; i < siteIds.length; i++) {
    if (!connectedSiteIds.has(siteIds[i])) continue;
    const siteId = siteIds[i];
    const site = sites.find((s) => s.$id === siteId);
    const siteName = (site as any)?.siteName ?? (site as any)?.site_name ?? siteId;
    const plugins = pluginsQueries[i]?.data ?? [];
    const themes = themesQueries[i]?.data ?? [];
    const pluginUpdates = plugins.filter(hasUpdate).length;
    const themeUpdates = themes.filter(hasUpdate).length;
    pluginUpdatesCount += pluginUpdates;
    pluginTotalCount += plugins.length;
    themeUpdatesCount += themeUpdates;
    themeTotalCount += themes.length;
    if (pluginUpdates > 0 || themeUpdates > 0) {
      sitesNeedingUpdatesCount++;
    }

    for (const p of plugins) {
      if (!hasUpdate(p)) continue;
      const slug = p.plugin;
      const upd = p.update as { new_version?: string; last_updated?: string } | null;
      const latestVersion = upd && typeof upd === 'object' ? (upd.new_version ?? '') : String(p.update ?? '');
      const releaseDate = upd && typeof upd === 'object' && upd.last_updated ? upd.last_updated : null;
      const entry = pluginUpdatesMap.get(slug);
      const siteEntry: PluginUpdateSite = {
        siteId,
        siteName,
        installedVersion: p.version ?? '',
        pluginFile: p.plugin ?? slug,
      };
      if (entry) {
        entry.sites.push(siteEntry);
      } else {
        pluginUpdatesMap.set(slug, {
          pluginSlug: slug,
          name: p.name ?? slug,
          latestVersion,
          releaseDate,
          sites: [siteEntry],
        });
      }
    }
  }

  const pluginUpdatesList = Array.from(pluginUpdatesMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return {
    sitesNeedingUpdatesCount,
    pluginUpdatesCount,
    pluginTotalCount,
    themeUpdatesCount,
    themeTotalCount,
    pluginUpdatesList,
    isLoading,
  };
};

/** Toggle plugin active/inactive - exported for PluginsTab */
export const useTogglePlugin = (siteId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ pluginSlug, status }: { pluginSlug: string; status: 'active' | 'inactive'; pluginName: string }) => {
      const path = status === 'active' ? 'wphubpro/v1/plugins/manage/deactivate' : 'wphubpro/v1/plugins/manage/activate';
      return wpProxy(siteId!, user?.$id, `${path}?plugin=${encodeURIComponent(pluginSlug)}`, { method: 'POST', body: { plugin: pluginSlug } });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plugins', siteId] });
      toast({ title: 'Success', description: `Plugin "${variables.pluginName}" has been ${variables.status === 'active' ? 'deactivated' : 'activated'}.`, variant: 'success' });
    },
    onError: (err, variables) => {
      toast({ title: 'Action Failed', description: `Could not toggle plugin "${variables.pluginName}": ${(err as Error).message}`, variant: 'destructive' });
    },
  });
};

/** Update plugin - exported for PluginsTab. Pass siteId in variables to update any site (e.g. from dashboard list). */
export const useUpdatePlugin = (siteId?: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ siteId: sid, pluginFile }: { siteId?: string; pluginFile: string; pluginName: string }) => {
      const id = sid ?? siteId;
      if (!id) throw new Error('Site ID required');
      return wpProxy(id, user?.$id, `wphubpro/v1/plugins/manage/update?plugin=${encodeURIComponent(pluginFile)}`, { method: 'POST', body: { plugin: pluginFile } });
    },
    onSuccess: (_, variables) => {
      const id = variables.siteId ?? siteId;
      if (id) queryClient.invalidateQueries({ queryKey: ['plugins', id] });
      toast({ title: 'Success', description: `Plugin "${variables.pluginName}" is bijgewerkt.`, variant: 'success' });
    },
    onError: (err, variables) => {
      toast({ title: 'Update mislukt', description: `Kon plugin "${variables.pluginName}" niet bijwerken: ${(err as Error).message}`, variant: 'destructive' });
    },
  });
};

/** Delete plugin - exported for PluginsTab */
export const useDeletePlugin = (siteId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ pluginFile }: { pluginFile: string; pluginName: string }) =>
      wpProxy(siteId!, user?.$id, `wphubpro/v1/plugins/manage/uninstall?plugin=${encodeURIComponent(pluginFile)}`, { method: 'POST', body: { plugin: pluginFile } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plugins', siteId] });
      toast({ title: 'Success', description: `Plugin "${variables.pluginName}" is verwijderd.`, variant: 'success' });
    },
    onError: (err, variables) => {
      toast({ title: 'Verwijderen mislukt', description: `Could not remove plugin "${variables.pluginName}": ${(err as Error).message}`, variant: 'destructive' });
    },
  });
};

const themeEndpoints: Record<string, string> = {
  activate: 'wphubpro/v1/themes/manage/activate',
  update: 'wphubpro/v1/themes/manage/update',
  delete: 'wphubpro/v1/themes/manage/delete',
};

/** Site details (WP version, PHP version, etc.) - exported for SiteDetailSidebar. Set enabled: false when site is off to skip bridge API calls. */
export const useSiteDetails = (siteId: string | undefined, options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  const queryEnabled = !!siteId && (options?.enabled !== false);
  return useQuery<{ wp_version?: string; php_version?: string; [key: string]: unknown }>({
    queryKey: ['site-details', siteId],
    queryFn: () => wpProxy(siteId!, user?.$id, 'wphubpro/v1/details'),
    enabled: queryEnabled,
  });
};

/** Manage theme (activate/update/delete) - exported for ThemesTab */
export const useManageTheme = (siteId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ themeSlug, action }: { themeSlug: string; action: 'activate' | 'delete' | 'update'; themeName: string }) => {
      const endpoint = themeEndpoints[action];
      if (!endpoint) return Promise.reject(new Error(`Theme action "${action}" is not supported.`));
      return wpProxy(siteId!, user?.$id, endpoint, { method: 'POST', body: { slug: themeSlug } });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['themes', siteId] });
      toast({ title: 'Success', description: `Theme "${variables.themeName}" ${variables.action}d successfully.`, variant: 'success' });
    },
    onError: (err, variables) => {
      toast({ title: 'Action Failed', description: `Could not ${variables.action} theme "${variables.themeName}": ${(err as Error).message}`, variant: 'destructive' });
    },
  });
};

/** Standalone hook for Bridge logs - exported for LogsTab */
export const useSiteLogs = (siteId: string, options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  const queryEnabled = !!siteId && (options?.enabled !== false);
  return useQuery<BridgeLogEntry[]>({
    queryKey: ['site-logs', siteId],
    queryFn: () => getSiteLogs(siteId, user?.$id),
    enabled: queryEnabled,
    refetchInterval: 30000,
  });
};

/** Standalone hook for error log - exported for LogsTab */
export const useSiteErrorLog = (siteId: string, options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  const queryEnabled = !!siteId && (options?.enabled !== false);
  return useQuery<{ lines: string[]; file?: string; error?: string }>({
    queryKey: ['site-error-log', siteId],
    queryFn: () => getSiteErrorLog(siteId, user?.$id),
    enabled: queryEnabled,
  });
};

/** Standalone hook for execution logs - exported for LogsTab */
export const useSiteExecutionLogs = (siteId: string, options?: { enabled?: boolean }) => {
  const queryEnabled = !!siteId && (options?.enabled !== false);
  return useQuery<AppwriteExecution[]>({
    queryKey: ['site-execution-logs', siteId],
    queryFn: () => getSiteExecutionLogs(siteId),
    enabled: queryEnabled,
  });
};

/** Noodherstel acties via recovery-manager Appwrite Function - exported for LogsTab */
export const executeRecovery = async (
  siteId: string,
  action: 'get_error_log' | 'rollback_plugin',
  pluginSlug?: string
) => {
  try {
    const execution = await functions.createExecution(
      'recovery-manager',
      JSON.stringify({ siteId, action, plugin_slug: pluginSlug }),
      false,
      '/',
      'POST' as any
    );
    const result = JSON.parse(execution.responseBody);
    if (!result.success) {
      throw new Error(result.message || 'Herstelactie mislukt');
    }
    return result.data;
  } catch (err: any) {
    console.error('Recovery execution error:', err);
    throw err;
  }
};

export const useWordPress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const useUpdatePlugin = () => {
    return useMutation({
      mutationFn: ({ siteId, slug, status }: { siteId: string; slug: string; status: boolean }) =>
        updatePluginStatus(siteId, slug, status, user?.$id),
      onSuccess: (_, { siteId }) => {
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      },
    });
  };

  const useDeletePlugin = () => {
    return useMutation({
      mutationFn: ({ siteId, slug }: { siteId: string; slug: string }) =>
        deletePlugin(siteId, slug, user?.$id),
      onSuccess: (_, { siteId }) => {
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      },
    });
  };

  const useUpdateTheme = () => {
    return useMutation({
      mutationFn: ({ siteId, slug, status }: { siteId: string; slug: string; status: boolean }) =>
        updateThemeStatus(siteId, slug, status, user?.$id),
      onSuccess: (_, { siteId }) => {
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      },
    });
  };

  const useDeleteTheme = () => {
    return useMutation({
      mutationFn: ({ siteId, slug }: { siteId: string; slug: string }) =>
        deleteTheme(siteId, slug, user?.$id),
      onSuccess: (_, { siteId }) => {
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      },
    });
  };

  const useSyncSite = () => {
    return useMutation({
      mutationFn: (siteId: string) => syncSiteData(siteId, user?.$id),
      onSuccess: (_, siteId) => {
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      },
    });
  };

  return {
    useSiteLogs,
    useSiteErrorLog,
    useSiteExecutionLogs,
    executeRecovery,
    useUpdatePlugin,
    useDeletePlugin,
    useUpdateTheme,
    useDeleteTheme,
    useSyncSite,
  };
};

// Behoud individuele exports voor backwards compatibility in LogsTab.tsx
export { 
  getSiteLogs as fetchSiteLogs,
  getSiteErrorLog as fetchSiteErrorLog,
  getSiteExecutionLogs as fetchSiteExecutionLogs
};