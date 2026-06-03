/**
 * Pure renderer for the doctor's patient-summary report. Produces a
 * self-contained HTML document (inline styles, no external assets — required
 * for `expo-print` on iOS) that downstream code turns into a PDF. Kept free of
 * platform imports so it can be unit-tested without native mocks. All dynamic
 * values are HTML-escaped.
 */

export interface ReportRow {
  readonly label: string;
  readonly value: string;
}

export interface ReportSection {
  readonly heading: string;
  readonly rows: readonly ReportRow[];
}

export interface ReportRecommendation {
  readonly title: string;
  readonly body: string;
  /** Short priority tag, e.g. "Высокий приоритет". */
  readonly tag: string;
}

export interface ReportHighlight {
  readonly label: string;
  readonly value: string;
  /** CSS color for the value, chosen by the caller from the risk tone. */
  readonly color: string;
}

export interface ReportInput {
  readonly lang: string;
  readonly documentTitle: string;
  readonly appName: string;
  readonly subtitle: string;
  /** One-line meta, e.g. "Сформировано 02.06.2026 · Аноним. ID: P-0142". */
  readonly metaLine: string;
  readonly highlights: readonly ReportHighlight[];
  readonly sections: readonly ReportSection[];
  readonly recommendationsHeading: string;
  readonly recommendations: readonly ReportRecommendation[];
  readonly recommendationsEmpty: string;
  readonly disclaimer: string;
}

const ACCENT = '#C0392B';
const INK = '#10243B';
const MUTED = '#5A6B7B';
const HAIRLINE = '#E3E8EE';
const SOFT_BG = '#F6F8FB';

/** Escape a string for safe interpolation into HTML text/attribute context. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHighlight(h: ReportHighlight): string {
  return `<div class="stat">
    <div class="stat-value" style="color:${escapeHtml(h.color)}">${escapeHtml(h.value)}</div>
    <div class="stat-label">${escapeHtml(h.label)}</div>
  </div>`;
}

function renderSection(section: ReportSection): string {
  const rows = section.rows
    .map(
      (row) => `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`,
    )
    .join('');
  return `<section class="block">
    <h2>${escapeHtml(section.heading)}</h2>
    <table>${rows}</table>
  </section>`;
}

function renderRecommendation(rec: ReportRecommendation): string {
  return `<div class="rec">
    <div class="rec-tag">${escapeHtml(rec.tag)}</div>
    <div class="rec-title">${escapeHtml(rec.title)}</div>
    <div class="rec-body">${escapeHtml(rec.body)}</div>
  </div>`;
}

const STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 36px; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: ${INK}; font-size: 13px; line-height: 1.5; }
  header { border-bottom: 3px solid ${ACCENT}; padding-bottom: 14px; margin-bottom: 20px; }
  .brand { font-size: 20px; font-weight: 700; color: ${ACCENT}; letter-spacing: 0.2px; }
  h1 { font-size: 17px; margin: 6px 0 2px; }
  .subtitle { color: ${MUTED}; margin: 0; }
  .meta { color: ${MUTED}; font-size: 12px; margin-top: 8px; }
  .stats { display: flex; gap: 10px; margin-bottom: 22px; }
  .stat { flex: 1; background: ${SOFT_BG}; border: 1px solid ${HAIRLINE}; border-radius: 10px; padding: 12px 14px; }
  .stat-value { font-size: 22px; font-weight: 700; }
  .stat-label { color: ${MUTED}; font-size: 11px; margin-top: 2px; }
  .block { margin-bottom: 20px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.6px; color: ${MUTED}; border-bottom: 1px solid ${HAIRLINE}; padding-bottom: 6px; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 5px 0; vertical-align: top; font-weight: 400; }
  th { color: ${MUTED}; width: 55%; }
  td { font-weight: 600; text-align: right; }
  .rec { border: 1px solid ${HAIRLINE}; border-left: 3px solid ${ACCENT}; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
  .rec-tag { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: ${ACCENT}; font-weight: 700; }
  .rec-title { font-weight: 700; margin-top: 2px; }
  .rec-body { color: ${MUTED}; margin-top: 2px; }
  .empty { color: ${MUTED}; }
  footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid ${HAIRLINE}; color: ${MUTED}; font-size: 11px; line-height: 1.45; }
`;

/** Render the full report document as an HTML string. */
export function renderReportHtml(input: ReportInput): string {
  const stats = input.highlights.map(renderHighlight).join('');
  const sections = input.sections.map(renderSection).join('');
  const recs = input.recommendations.length
    ? input.recommendations.map(renderRecommendation).join('')
    : `<p class="empty">${escapeHtml(input.recommendationsEmpty)}</p>`;

  return `<!DOCTYPE html>
<html lang="${escapeHtml(input.lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.documentTitle)}</title>
  <style>${STYLES}</style>
</head>
<body>
  <header>
    <div class="brand">${escapeHtml(input.appName)}</div>
    <h1>${escapeHtml(input.documentTitle)}</h1>
    <p class="subtitle">${escapeHtml(input.subtitle)}</p>
    <p class="meta">${escapeHtml(input.metaLine)}</p>
  </header>
  ${stats ? `<div class="stats">${stats}</div>` : ''}
  ${sections}
  <section class="block">
    <h2>${escapeHtml(input.recommendationsHeading)}</h2>
    ${recs}
  </section>
  <footer>${escapeHtml(input.disclaimer)}</footer>
</body>
</html>`;
}
