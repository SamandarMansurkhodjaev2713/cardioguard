import { renderReportHtml, type ReportInput } from '../reportHtml';

function baseInput(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    lang: 'ru',
    documentTitle: 'Сводный медицинский отчёт',
    appName: 'CardioGuard',
    subtitle: 'Кардиометаболический мониторинг',
    metaLine: 'Сформировано 02.06.2026 · Аноним. ID: P-0142',
    highlights: [{ label: 'Риск ССЗ, 10 лет', value: '9 %', color: '#DC3A33' }],
    sections: [
      {
        heading: 'Последние измерения',
        rows: [{ label: 'Артериальное давление', value: '142/91 мм рт. ст.' }],
      },
    ],
    recommendationsHeading: 'Клинические рекомендации',
    recommendations: [{ tag: 'Высокий приоритет', title: 'Контроль АД', body: 'Снизьте потребление соли.' }],
    recommendationsEmpty: 'Нет рекомендаций.',
    disclaimer: 'Не является диагнозом.',
    ...overrides,
  };
}

describe('renderReportHtml', () => {
  it('produces a self-contained HTML document', () => {
    const html = renderReportHtml(baseInput());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="ru">');
    expect(html).toContain('<style>');
    // No external asset references (expo-print iOS requirement).
    expect(html).not.toMatch(/<(img|link|script)\b/);
  });

  it('includes the headline values', () => {
    const html = renderReportHtml(baseInput());
    expect(html).toContain('CardioGuard');
    expect(html).toContain('Сформировано 02.06.2026 · Аноним. ID: P-0142');
    expect(html).toContain('142/91 мм рт. ст.');
    expect(html).toContain('Риск ССЗ, 10 лет');
    expect(html).toContain('Контроль АД');
  });

  it('renders the empty-recommendations fallback when there are none', () => {
    const html = renderReportHtml(baseInput({ recommendations: [] }));
    expect(html).toContain('Нет рекомендаций.');
    // No rendered recommendation element (the CSS class definition is unrelated).
    expect(html).not.toContain('class="rec-title"');
  });

  it('escapes HTML metacharacters in dynamic values', () => {
    const html = renderReportHtml(
      baseInput({
        sections: [{ heading: 'X', rows: [{ label: 'note', value: '<script>alert("x")</script>' }] }],
      }),
    );
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });

  it('omits the stats block when there are no highlights', () => {
    const html = renderReportHtml(baseInput({ highlights: [] }));
    expect(html).not.toContain('class="stats"');
  });
});
