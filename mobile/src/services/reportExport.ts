/**
 * Turns a rendered HTML report into a shareable PDF (expo-print + expo-sharing,
 * SDK 56). Native: print to a PDF file, then open the share sheet. Web: open the
 * browser print dialog (the user can "Save as PDF"); local-file sharing is not
 * supported there. Side effects are isolated here; the HTML comes from the pure
 * {@link file://./reportHtml.ts} renderer.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { logger } from '../utils/logger';

export type ReportExportResult = 'shared' | 'saved' | 'printed' | 'failed';

export interface ReportExportOptions {
  /** Title shown in the OS share dialog. */
  readonly dialogTitle: string;
}

/**
 * Web: render the report into its own window and print it. expo-print's web
 * `printAsync` ignores the `html` option and prints the host page, so we do this
 * ourselves to print the actual report. Returns false if a window can't open
 * (e.g. popup blocked).
 */
function printHtmlInOwnWindow(html: string): boolean {
  if (typeof window === 'undefined' || typeof window.open !== 'function') return false;
  const win = window.open('', '_blank', 'width=820,height=1000');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return true;
}

/**
 * Export the report. Returns a coarse outcome so the UI can give feedback
 * without throwing: 'printed' (web dialog), 'shared' (share sheet opened),
 * 'saved' (PDF created but sharing unavailable), or 'failed'.
 */
export async function exportReport(
  html: string,
  options: ReportExportOptions,
): Promise<ReportExportResult> {
  try {
    if (Platform.OS === 'web') {
      return printHtmlInOwnWindow(html) ? 'printed' : 'failed';
    }
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: options.dialogTitle,
        UTI: 'com.adobe.pdf',
      });
      return 'shared';
    }
    return 'saved';
  } catch (error) {
    logger.error('Failed to export report', { error: String(error) });
    return 'failed';
  }
}
