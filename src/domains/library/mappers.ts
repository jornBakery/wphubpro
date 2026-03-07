import { LibraryItem, LibraryItemSource, LibraryItemType } from '../../types';

const toLibraryItemType = (value: string): LibraryItemType => {
  return value === LibraryItemType.Theme ? LibraryItemType.Theme : LibraryItemType.Plugin;
};

const toLibraryItemSource = (value: string): LibraryItemSource => {
  return value === LibraryItemSource.Local ? LibraryItemSource.Local : LibraryItemSource.Official;
};

export const mapLibraryDocumentToItem = (doc: Record<string, any>): LibraryItem => {
  return {
    ...(doc as LibraryItem),
    userId: doc.userId || doc.user_id || '',
    type: toLibraryItemType(doc.type),
    source: toLibraryItemSource(doc.source),
    s3Path: doc.s3Path || doc.s3_path || doc.s3_key || undefined,
    wpSlug: doc.wpSlug || doc.wp_slug || undefined,
  };
};
