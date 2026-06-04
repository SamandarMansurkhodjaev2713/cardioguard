/**
 * Exports a CSV string. Native: write it to a cache file (expo-file-system) and
 * open the share sheet (expo-sharing). Web: trigger a browser download via a
 * Blob. Side-effects are isolated here; the CSV text comes from the pure
 * {@link file://../utils/csv.ts} serializer. Returns a coarse outcome instead of
 * throwing, so the UI can give feedback.
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { logger } from '../utils/logger';

export type CsvExportResult = 'shared' | 'saved' | 'downloaded' | 'failed';

/** Web-only: download the CSV through an anchor + Blob. */
function downloadCsvWeb(csv: string, filename: string): boolean {
  if (typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') return false;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return true;
}

export async function exportCsv(csv: string, filename: string, dialogTitle: string): Promise<CsvExportResult> {
  try {
    if (Platform.OS === 'web') {
      return downloadCsvWeb(csv, filename) ? 'downloaded' : 'failed';
    }
    const file = new File(Paths.cache, filename);
    try {
      file.create();
    } catch {
      // File already exists from a previous export — write() overwrites it below.
    }
    file.write(csv);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle,
        UTI: 'public.comma-separated-values-text',
      });
      return 'shared';
    }
    return 'saved';
  } catch (error) {
    logger.error('Failed to export CSV', { error: String(error) });
    return 'failed';
  }
}
