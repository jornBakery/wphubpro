import { Site } from '../../types';

function parseMetaData(doc: Record<string, any>): Record<string, unknown> {
  const raw = doc.meta_data ?? doc.metaData;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export const mapSiteDocumentToSite = (doc: Record<string, any>): Site => {
  const hasCredentials = !!(doc.api_key || doc.apiKey || doc.password);
  const meta = parseMetaData(doc);
  const metaConnected = meta.connected;
  const status: 'connected' | 'disconnected' =
    metaConnected === true
      ? 'connected'
      : metaConnected === false
        ? 'disconnected'
        : doc.status === 'connected'
          ? 'connected'
          : doc.status === 'disconnected'
            ? 'disconnected'
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
