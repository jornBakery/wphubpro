/**
 * Hook for pinned dashboard sites - stores pinned state in site meta_data
 */
import { useCallback } from 'react';
import { Site } from '../types';
import { useUpdateSite } from './useSites';

function parseMeta(site: Site): Record<string, unknown> {
  if (!site.meta_data) return {};
  try {
    const parsed = JSON.parse(site.meta_data);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function isSitePinned(site: Site): boolean {
  const meta = parseMeta(site);
  return meta?.pinned === true;
}

export function usePinnedSites(sites: Site[]) {
  const updateSite = useUpdateSite();

  const isPinned = useCallback(
    (siteId: string) => {
      const site = sites.find((s) => s.$id === siteId);
      return site ? isSitePinned(site) : false;
    },
    [sites]
  );

  const togglePin = useCallback(
    (siteId: string) => {
      const site = sites.find((s) => s.$id === siteId);
      if (!site) return;
      const meta = parseMeta(site);
      meta.pinned = !(meta.pinned === true);
      const meta_data = JSON.stringify(meta);
      updateSite.mutate({ siteId, meta_data });
    },
    [sites, updateSite]
  );

  return { isPinned, togglePin };
}
