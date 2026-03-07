import { Site } from '../../types';

export const mapSiteDocumentToSite = (doc: Record<string, any>): Site => {
  const hasCredentials = !!(doc.api_key || doc.apiKey || doc.password);
  const status: 'connected' | 'disconnected' =
    doc.status === 'connected' || doc.status === 'disconnected'
      ? doc.status
      : hasCredentials
        ? 'connected'
        : 'disconnected';

  const healthStatus: 'healthy' | 'bad' =
    doc.health_status === 'healthy' || doc.health_status === 'bad'
      ? doc.health_status
      : hasCredentials
        ? 'healthy'
        : 'bad';

  return {
    ...(doc as Site),
    userId: doc.userId || doc.user_id || '',
    siteName: doc.siteName || doc.site_name || '',
    siteUrl: doc.siteUrl || doc.site_url || '',
    status,
    healthStatus,
    lastChecked: doc.lastChecked || doc.last_checked || '',
    meta_data: doc.meta_data ?? doc.metaData ?? undefined,
  };
};
