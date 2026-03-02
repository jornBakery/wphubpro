/**
 * Hook for pinned dashboard sites (max 5)
 * Stores in localStorage keyed by user ID
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'wphub-pinned-sites';
const MAX_PINNED = 5;
const PINNED_CHANGED = 'wphub-pinned-sites-changed';

function getStorageKey(userId: string) {
  return `${STORAGE_KEY}-${userId}`;
}

function loadPinnedIds(userId: string): string[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function savePinnedIds(userId: string, ids: string[]) {
  if (!userId) return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(PINNED_CHANGED, { detail: { userId } }));
}

export function usePinnedSites() {
  const { user } = useAuth();
  const userId = user?.$id ?? null;
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => loadPinnedIds(userId ?? ''));

  useEffect(() => {
    setPinnedIds(loadPinnedIds(userId ?? ''));
    const handler = () => setPinnedIds(loadPinnedIds(userId ?? ''));
    window.addEventListener(PINNED_CHANGED, handler);
    return () => window.removeEventListener(PINNED_CHANGED, handler);
  }, [userId]);

  const togglePin = useCallback(
    (siteId: string) => {
      if (!userId) return;
      const ids = loadPinnedIds(userId);
      const idx = ids.indexOf(siteId);
      let next: string[];
      if (idx >= 0) {
        next = ids.filter((id) => id !== siteId);
      } else if (ids.length >= MAX_PINNED) {
        next = [...ids.slice(1), siteId];
      } else {
        next = [...ids, siteId];
      }
      savePinnedIds(userId, next);
    },
    [userId]
  );

  const isPinned = useCallback(
    (siteId: string) => pinnedIds.includes(siteId),
    [pinnedIds]
  );

  const pin = useCallback(
    (siteId: string) => {
      if (!userId || pinnedIds.includes(siteId)) return;
      const next =
        pinnedIds.length >= MAX_PINNED ? [...pinnedIds.slice(1), siteId] : [...pinnedIds, siteId];
      savePinnedIds(userId, next);
    },
    [userId, pinnedIds]
  );

  const unpin = useCallback(
    (siteId: string) => {
      if (!userId) return;
      const next = pinnedIds.filter((id) => id !== siteId);
      savePinnedIds(userId, next);
    },
    [userId, pinnedIds]
  );

  return { pinnedIds, togglePin, isPinned, pin, unpin };
}
