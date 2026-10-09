import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

/**
 * Instrument parity: every `<text textLength>` in the jar renders under
 * tests/fixtures/isw-T1a/ (rendered with the seam-#4 oracle jar,
 * `-DPLANTUML_DETERMINISTIC_TEXT=true`) equals `DeterministicMeasurer`'s
 * width of the same run at the run's font-size, exactly (to the jar's
 * printed precision).
 */
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'isw-T1a');
const TEXT_RUN = /<text\b([^>]*)>([^<]*)<\/text>/g;
const ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};
const decode = (s: string): string =>
  s
    .replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&[a-z]+;/g, (e) => ENTITIES[e] ?? e);
const attr = (attrs: string, name: string): string | undefined => new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1];

interface Run {
  readonly text: string;
  readonly size: number;
  readonly textLength: number;
}
const runsOf = (svg: string): Run[] =>
  [...svg.matchAll(TEXT_RUN)].flatMap((m) => {
    const textLength = attr(m[1]!, 'textLength');
    const size = attr(m[1]!, 'font-size');
    if (textLength === undefined || size === undefined) return [];
    return [{ text: decode(m[2]!), size: Number(size), textLength: Number(textLength) }];
  });

const m = new DeterministicMeasurer();
const files = readdirSync(DIR).filter((f) => f.endsWith('.svg'));

describe('DeterministicMeasurer vs the seam-#4 jar: textLength per text run', () => {
  it('has fixtures at 12 and 14 pt', () => {
    expect(files.length).toBeGreaterThanOrEqual(7);
    const sizes = new Set(files.flatMap((f) => runsOf(readFileSync(join(DIR, f), 'utf8'))).map((r) => r.size));
    expect([...sizes].sort()).toEqual([12, 14]);
  });

  it.each(files)('%s: every textLength matches', (file) => {
    const runs = runsOf(readFileSync(join(DIR, file), 'utf8'));
    for (const r of runs) {
      const ours = m.measure(r.text, { family: 'sans-serif', size: r.size }).width;
      // SvgGraphics#format prints option.getDecimal() = 3 decimals, trailing zeros trimmed
      expect(Number(ours.toFixed(3)), JSON.stringify(r)).toBe(r.textLength);
    }
  });

  it('a lone-space run renders (no crash page) without a textLength attribute', () => {
    for (const f of ['lone-space-single-12.svg', 'lone-space-14.svg']) {
      const svg = readFileSync(join(DIR, f), 'utf8');
      expect(svg).toMatch(/<text\b[^>]*>[  ]<\/text>/);
      expect(svg).not.toContain('has crashed');
    }
  });

  it('covers space-bearing runs (single, multiple, tab-split)', () => {
    const all = files.flatMap((f) => runsOf(readFileSync(join(DIR, f), 'utf8')));
    expect(all.filter((r) => r.text.includes(' ')).length).toBeGreaterThanOrEqual(8);
    expect(all.some((r) => r.text.includes('  '))).toBe(true);
  });
});
