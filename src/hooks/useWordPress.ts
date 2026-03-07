import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSiteLogs, 
  getSiteErrorLog, 
  getSiteExecutionLogs,
  updatePluginStatus,
  updateThemeStatus,
  syncSiteData,
  deletePlugin,
  deleteTheme
} from '../services/wordpress';
import { functions } from '../services/appwrite'; // Importeer de centrale Appwrite instance

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

export const useWordPress = () => {
  const queryClient = useQueryClient();

  /**
   * Noodherstel acties via de recovery-manager Appwrite Function (JWT gebaseerd)
   */
  const executeRecovery = async (siteId: string, action: 'get_error_log' | 'rollback_plugin', pluginSlug?: string) => {
    try {
      const execution = await functions.createExecution(
        'recovery-manager', // Zorg dat dit ID overeenkomt met je Function ID in Appwrite
        JSON.stringify({ siteId, action, plugin_slug: pluginSlug }),
        false,
        '/',
        'POST'
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

  const useSiteLogs = (siteId: string) => {
    return useQuery<BridgeLogEntry[]>({
      queryKey: ['site-logs', siteId],
      queryFn: () => getSiteLogs(siteId),
      refetchInterval: 30000, // Elke 30 seconden verversen
    });
  };

  const useSiteErrorLog = (siteId: string) => {
    return useQuery<{ lines: string[]; file: string; error?: string }>({
      queryKey: ['site-error-log', siteId],
      queryFn: () => getSiteErrorLog(siteId),
    });
  };

  const useSiteExecutionLogs = (siteId: string) => {
    return useQuery<AppwriteExecution[]>({
      queryKey: ['site-execution-logs', siteId],
      queryFn: () => getSiteExecutionLogs(siteId),
    });
  };

  const useUpdatePlugin = () => {
    return useMutation({
      mutationFn: ({ siteId, slug, status }: { siteId: string; slug: string; status: boolean }) =>
        updatePluginStatus(siteId, slug, status),
      onSuccess: (_, { siteId }) => {
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      },
    });
  };

  const useDeletePlugin = () => {
    return useMutation({
      mutationFn: ({ siteId, slug }: { siteId: string; slug: string }) =>
        deletePlugin(siteId, slug),
      onSuccess: (_, { siteId }) => {
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      },
    });
  };

  const useUpdateTheme = () => {
    return useMutation({
      mutationFn: ({ siteId, slug, status }: { siteId: string; slug: string; status: boolean }) =>
        updateThemeStatus(siteId, slug, status),
      onSuccess: (_, { siteId }) => {
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      },
    });
  };

  const useDeleteTheme = () => {
    return useMutation({
      mutationFn: ({ siteId, slug }: { siteId: string; slug: string }) =>
        deleteTheme(siteId, slug),
      onSuccess: (_, { siteId }) => {
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      },
    });
  };

  const useSyncSite = () => {
    return useMutation({
      mutationFn: (siteId: string) => syncSiteData(siteId),
      onSuccess: (_, siteId) => {
        queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      },
    });
  };

  return {
    useSiteLogs,
    useSiteErrorLog,
    useSiteExecutionLogs,
    useUpdatePlugin,
    useDeletePlugin,
    useUpdateTheme,
    useDeleteTheme,
    useSyncSite,
    executeRecovery // Geëxporteerd voor gebruik in LogsTab.tsx
  };
};

// Behoud individuele exports voor backwards compatibility in LogsTab.tsx
export { 
  getSiteLogs as fetchSiteLogs,
  getSiteErrorLog as fetchSiteErrorLog,
  getSiteExecutionLogs as fetchSiteExecutionLogs
};