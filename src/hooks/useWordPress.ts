import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { functions } from '../services/appwrite';
import { WordPressPlugin, WordPressTheme } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const FUNCTION_ID = 'wp-proxy';

// --- API Helper ---
const executeWpProxy = async <T>(payload: { siteId: string; method?: string; endpoint: string; body?: any; userId?: string; useApiKey?: boolean }): Promise<T> => {
  try {
    const qs = new URLSearchParams();
    qs.set('siteId', payload.siteId);
    qs.set('endpoint', payload.endpoint);
    if (payload.method) qs.set('method', String(payload.method));
    if (payload.userId) qs.set('userId', payload.userId);
    if (payload.useApiKey) qs.set('useApiKey', '1');
    // Appwrite execution body may not reach the function; put body in query so wp-proxy gets it
    if (payload.body) qs.set('body', JSON.stringify(payload.body));

    const path = `/?${qs.toString()}`;

    const execMethod = payload.method ? String(payload.method) : 'GET';
    const result = await functions.createExecution(FUNCTION_ID, undefined, false, path, execMethod as any);

    // Appwrite Execution response properties
    const responseBody = result.responseBody || '';
    const statusCode = result.responseStatusCode || 0;

    // Safely attempt to parse JSON; if it fails, keep raw text
    let data: any = null;
    try {
      data = responseBody ? JSON.parse(responseBody) : null;
    } catch {
      data = responseBody;
    }

    if (statusCode < 200 || statusCode >= 300) {
      const message = (data && typeof data === 'object' && data.message) ? data.message : (typeof data === 'string' ? data : `Request failed with status ${statusCode}`);
      throw new Error(message);
    }

    // If function returned empty body (non-JSON), provide an empty-array fallback for list endpoints
    if ((data === null || data === '') && payload.endpoint && /plugins|themes/.test(payload.endpoint)) {
      return [] as unknown as T;
    }

    return data as T;
    } catch (error) {
    // Try to surface function execution details if present
    const err: any = error;
    if (err && err.response) {
      try {
        const parsed = JSON.parse(err.response);
        throw new Error(parsed.message || 'An unknown error occurred while executing the function.');
      } catch {
        throw err;
      }
    }
    throw err;
  }
};


// --- Hooks ---
// Use the new bridge endpoint for plugin list
// Bridge returns: { file, name, version, active (boolean), update }
// Frontend expects: { plugin (file path), name, version, status: 'active'|'inactive' }
export const usePlugins = (siteId: string | undefined) => {
  const { user } = useAuth();
  return useQuery<WordPressPlugin[], Error>({
    queryKey: ['plugins', siteId],
    queryFn: async () => {
      const raw = await executeWpProxy<any[]>({ siteId: siteId!, endpoint: 'wphubpro/v1/plugins', userId: user?.$id, useApiKey: true });
      return raw.map((p) => ({
        ...p,
        plugin: p.plugin || p.file,
        status: p.active === true ? ('active' as const) : ('inactive' as const),
      })) as WordPressPlugin[];
    },
    enabled: !!siteId,
  });
};

// Bridge API log entry (from option WPHUBPRO_LOG)
export interface BridgeLogEntry {
  time: string;
  endpoint: string;
  type: string;
  code: number;
  request: Record<string, unknown> | unknown;
  response: unknown;
}

export interface SiteLogsResponse {
  logs: BridgeLogEntry[];
}

export const useSiteLogs = (siteId: string | undefined) => {
  const { user } = useAuth();
  return useQuery<BridgeLogEntry[], Error>({
    queryKey: ['site-logs', siteId],
    queryFn: async () => {
      const data = await executeWpProxy<SiteLogsResponse>({
        siteId: siteId!,
        endpoint: 'wphubpro/v1/logs',
        userId: user?.$id,
        useApiKey: true,
      });
      return data?.logs ?? [];
    },
    enabled: !!siteId && !!user?.$id,
  });
};

export interface SiteErrorLogResponse {
  lines: string[];
  file?: string | null;
  error?: string;
}

export const useSiteErrorLog = (siteId: string | undefined) => {
  const { user } = useAuth();
  return useQuery<SiteErrorLogResponse, Error>({
    queryKey: ['site-error-log', siteId],
    queryFn: () =>
      executeWpProxy<SiteErrorLogResponse>({
        siteId: siteId!,
        endpoint: 'wphubpro/v1/error-log',
        userId: user?.$id,
        useApiKey: true,
      }),
    enabled: !!siteId && !!user?.$id,
  });
};

// Appwrite function execution (wp-proxy) for a site – from listExecutions, filtered by siteId in request path
export interface AppwriteExecution {
  $id: string;
  $createdAt: string;
  functionId: string;
  trigger: string;
  status: string;
  requestMethod: string;
  requestPath: string;
  responseStatusCode: number;
  responseBody: string;
  logs: string;
  errors: string;
  duration: number;
}

export const useSiteExecutionLogs = (siteId: string | undefined) => {
  const { user } = useAuth();
  return useQuery<AppwriteExecution[], Error>({
    queryKey: ['site-execution-logs', siteId],
    queryFn: async () => {
      const list = await functions.listExecutions(FUNCTION_ID, ['limit(50)']);
      const executions = (list as { executions?: AppwriteExecution[] }).executions ?? [];
      return executions.filter((e) => {
        if (!e.requestPath || !e.requestPath.includes('?')) return false;
        const qs = e.requestPath.slice(e.requestPath.indexOf('?') + 1);
        const param = new URLSearchParams(qs).get('siteId');
        return param === siteId;
      });
    },
    enabled: !!siteId && !!user?.$id,
  });
};

// Site details (WordPress version, PHP version, plugin/theme counts)
export interface SiteDetailsResponse {
  wp_version: string;
  wp_version_latest: string | null;
  plugins_count: number;
  themes_count: number;
  php_version: string;
  php_check: { recommended_version?: string; minimum_version?: string; is_supported?: boolean; is_secure?: boolean; is_acceptable?: boolean } | null;
}

export const useSiteDetails = (siteId: string | undefined) => {
  const { user } = useAuth();
  return useQuery<SiteDetailsResponse, Error>({
    queryKey: ['site-details', siteId],
    queryFn: () =>
      executeWpProxy<SiteDetailsResponse>({
        siteId: siteId!,
        endpoint: 'wphubpro/v1/details',
        userId: user?.$id,
        useApiKey: true,
      }),
    enabled: !!siteId && !!user?.$id,
    retry: 0,
  });
};

// Use the new bridge endpoint for theme list
// Bridge returns: { slug, name, version, active (boolean), update }
// Frontend expects: { stylesheet (slug), name, version, status: 'active'|'inactive' }
export const useThemes = (siteId: string | undefined) => {
  const { user } = useAuth();
  return useQuery<WordPressTheme[], Error>({
    queryKey: ['themes', siteId],
    queryFn: async () => {
      const raw = await executeWpProxy<any[]>({ siteId: siteId!, endpoint: 'wphubpro/v1/themes', userId: user?.$id, useApiKey: true });
      return raw.map((t) => ({
        ...t,
        stylesheet: t.stylesheet || t.slug,
        status: t.active === true ? ('active' as const) : ('inactive' as const),
      })) as WordPressTheme[];
    },
    enabled: !!siteId,
  });
};

export const useTogglePlugin = (siteId: string | undefined) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation<WordPressPlugin, Error, { pluginSlug: string; status: 'active' | 'inactive', pluginName: string }>({
    mutationFn: ({ pluginSlug, status }) => {
      const path = status === 'active' ? 'wphubpro/v1/plugins/manage/deactivate' : 'wphubpro/v1/plugins/manage/activate';
      const endpointWithPlugin = `${path}?plugin=${encodeURIComponent(pluginSlug)}`;
      return executeWpProxy<WordPressPlugin>({
        siteId: siteId!,
        method: 'POST',
        endpoint: endpointWithPlugin,
        body: { plugin: pluginSlug },
        userId: user?.$id,
        useApiKey: true,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plugins', siteId] });
      const action = variables.status === 'active' ? 'deactivated' : 'activated';
      toast({
        title: "Success",
        description: `Plugin "${variables.pluginName}" has been ${action}.`,
        variant: 'success'
      });
    },
    onError: (error, variables) => {
      toast({
        title: "Action Failed",
        description: `Could not toggle plugin "${variables.pluginName}": ${error.message}`,
        variant: 'destructive',
      });
    }
  });
};

export const useUpdatePlugin = (siteId: string | undefined) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation<WordPressPlugin, Error, { pluginFile: string; pluginName: string }>({
    mutationFn: ({ pluginFile }) => {
      const endpointWithPlugin = `wphubpro/v1/plugins/manage/update?plugin=${encodeURIComponent(pluginFile)}`;
      return executeWpProxy<WordPressPlugin>({
        siteId: siteId!,
        method: 'POST',
        endpoint: endpointWithPlugin,
        body: { plugin: pluginFile },
        userId: user?.$id,
        useApiKey: true,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plugins', siteId] });
      toast({
        title: 'Success',
        description: `Plugin "${variables.pluginName}" is bijgewerkt.`,
        variant: 'success',
      });
    },
    onError: (error, variables) => {
      toast({
        title: 'Update mislukt',
        description: `Kon plugin "${variables.pluginName}" niet bijwerken: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

export const useDeletePlugin = (siteId: string | undefined) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation<void, Error, { pluginFile: string; pluginName: string }>({
    mutationFn: ({ pluginFile }) => {
      const endpointWithPlugin = `wphubpro/v1/plugins/manage/uninstall?plugin=${encodeURIComponent(pluginFile)}`;
      return executeWpProxy<void>({
        siteId: siteId!,
        method: 'POST',
        endpoint: endpointWithPlugin,
        body: { plugin: pluginFile },
        userId: user?.$id,
        useApiKey: true,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plugins', siteId] });
      toast({
        title: "Success",
        description: `Plugin "${variables.pluginName}" is verwijderd.`,
        variant: 'success'
      });
    },
    onError: (error, variables) => {
      toast({
        title: "Verwijderen mislukt",
        description: `Could not remove plugin "${variables.pluginName}": ${error.message}`,
        variant: 'destructive',
      });
    }
  });
};

export const useManageTheme = (siteId: string | undefined) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation<WordPressTheme, Error, { themeSlug: string; action: 'activate' | 'deactivate' | 'delete' | 'update'; themeName: string }>({
    mutationFn: ({ themeSlug, action }) => {
      return executeWpProxy<WordPressTheme>({
        siteId: siteId!,
        method: 'POST',
        endpoint: 'wphubpro/v1/themes/manage',
        body: { action, slug: themeSlug },
        userId: user?.$id,
        useApiKey: true,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['themes', siteId] });
      toast({
        title: 'Success',
        description: `Theme "${variables.themeName}" ${variables.action}d successfully.`,
        variant: 'success',
      });
    },
    onError: (error, variables) => {
      toast({
        title: 'Action Failed',
        description: `Could not ${variables.action} theme "${variables.themeName}": ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};