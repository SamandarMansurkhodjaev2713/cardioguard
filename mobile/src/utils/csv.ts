/**
 * Minimal, dependency-free CSV serialization (RFC 4180). Pure and testable —
 * the file/share side-effects live in the export service. A UTF-8 BOM is
 * prepended so Excel opens Cyrillic correctly, and rows are CRLF-terminated as
 * Excel expects.
 */

/** UTF-8 byte-order mark; makes Excel read the file as UTF-8 (Cyrillic intact). */
const BOM = String.fromCharCode(0xfeff);

/** Quote a cell when it contains a comma, quote, or newline; double inner quotes. */
export function escapeCsvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serialize a matrix of string cells to a CSV document (with BOM, CRLF rows). */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<string>>): string {
  const body = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  return BOM + body;
}
