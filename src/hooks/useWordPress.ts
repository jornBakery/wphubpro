import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { functions } from '../services/appwrite';
import { executeFunctionWithMeta } from '../integrations/appwrite/executeFunction';
import { useAuth } from '../contexts/AuthContext';

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
  if (options.body && Object.keys(options.body).length > 0) {
    qs.set('body', JSON.stringify(options.body));
  }
  const path = `/?${qs.toString()}`;
  const payload = options.body && options.method !== 'GET' ? options.body : undefined;
  const method = (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  return executeFunctionWithMeta<T>(
    'wp-proxy',
    payload as any,
    { path, method, throwOnHttpError: true }
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

/** Standalone hook for Bridge logs - exported for LogsTab */
export const useSiteLogs = (siteId: string) => {
  const { user } = useAuth();
  return useQuery<BridgeLogEntry[]>({
    queryKey: ['site-logs', siteId],
    queryFn: () => getSiteLogs(siteId, user?.$id),
    refetchInterval: 30000,
  });
};

/** Standalone hook for error log - exported for LogsTab */
export const useSiteErrorLog = (siteId: string) => {
  const { user } = useAuth();
  return useQuery<{ lines: string[]; file?: string; error?: string }>({
    queryKey: ['site-error-log', siteId],
    queryFn: () => getSiteErrorLog(siteId, user?.$id),
  });
};

/** Standalone hook for execution logs - exported for LogsTab */
export const useSiteExecutionLogs = (siteId: string) => {
  return useQuery<AppwriteExecution[]>({
    queryKey: ['site-execution-logs', siteId],
    queryFn: () => getSiteExecutionLogs(siteId),
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