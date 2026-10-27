import { describe, expect, it } from 'vitest';
import { formatDate } from '../../../../../src/core/tim/builtin/date-format.js';
import { renderSync } from '../../../../../src/index.js';

const UTC = 'UTC';
const SEC = 1000;
const utcMillis = (iso: string): number => Date.parse(`${iso}T12:00:00Z`);

describe('formatDate week-year letter Y (en_US: Sunday first, minimal days 1)', () => {
  it('formats 4,000,000 s as 1970-02-16 for YYYY-MM-dd', () => {
    expect(formatDate(200 * 20000 * SEC, 'YYYY-MM-dd', UTC)).toBe('1970-02-16');
  });

  it('formats YY as two digits', () => {
    expect(formatDate(200 * 20000 * SEC, 'YY', UTC)).toBe('70');
  });

  it('keeps y (calendar year) unchanged across the boundary', () => {
    expect(formatDate(utcMillis('2024-12-31'), 'yyyy-YYYY', UTC)).toBe('2024-2025');
  });

  it.each([
    ['2024-12-28', '2024'], // Saturday: its own week ends in 2024
    ['2024-12-29', '2025'], // Sunday starting the week that holds 2025-01-01
    ['2024-12-31', '2025'], // Tuesday of that week
    ['2025-01-01', '2025'],
    ['2022-12-31', '2022'], // Saturday
    ['2023-01-01', '2023'], // Sunday
    ['2020-12-31', '2021'], // Thursday; week ends Saturday 2021-01-02
    ['2021-01-01', '2021'],
  ])('week year of %s is %s', (date, expected) => {
    expect(formatDate(utcMillis(date), 'YYYY', UTC)).toBe(expected);
  });

  it('renders the fecaru source without a syntax error and with February 1970', () => {
    const svg = renderSync(
      '@startgantt\n!$today = %date("YYYY-MM-dd", 200 * 20000)\nProject starts $today\n[foo] lasts 10 days\n@endgantt\n',
    );
    expect(svg).not.toContain('Syntax Error');
    expect(svg).toContain('February 1970');
  });
});
