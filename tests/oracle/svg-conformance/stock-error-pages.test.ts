/**
 * Guards `oracle/goldens/stock-error-pages.json` (aepp D5): the record of
 * fixtures on which the STOCK upstream jar (no oracle seams) errors. The
 * error-page conformance rule consults it, so it must belong to the pinned
 * upstream SHA and carry the planning-verified activity rows.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface StockError {
  line: number | null;
  message: string;
  provenance?: 'stock' | 'oracle-widths';
}
interface StockRecord {
  upstreamSha: string;
  plantumlVersion: string;
  errors: Record<string, StockError>;
}

const ROOT = resolve(__dirname, '../../..');
const REGENERATE = 'scripts/stock-jar-verify.sh';
const readJson = <T>(rel: string): T => JSON.parse(readFileSync(resolve(ROOT, rel), 'utf8')) as T;

const pin = readJson<{ upstreamSha: string; plantumlVersion: string }>('oracle/pin.json');
const record = readJson<StockRecord>('oracle/goldens/stock-error-pages.json');

/** fixtures.md ERR/REFUSE rows: slug -> [line, message prefix]. */
const ACTIVITY_ROWS: Record<string, [number, string]> = {
  'gabeme-89-tiko230': [15, 'Cannot find if'],
  'jokaxi-40-toko207': [4, 'Syntax Error?'],
  'kedozi-45-begu156': [4, "No 'case' in this switch"],
  'nefume-98-leti603': [2, 'Parsing syntax error about nota;number'],
  'pejima-95-nuxu520': [7, 'Cannot find if'],
  'pizuga-11-mabo948': [3, 'Syntax Error?'],
  'ticoxo-71-jile893': [21, 'Illegal call here'],
  'veducu-71-tika634': [7, 'Cannot find group'],
  'vipixe-71-rika369': [6, 'Infinite loop?'],
  'xesoze-85-pugu865': [15, 'A procedure cannot have !return'],
  'xoreni-54-xoro817': [15, 'Cannot find if'],
  'zezaju-29-duni146': [7, 'Syntax Error?'],
  'nakavu-98-pela661': [5, 'This swimlane must be defined at the start'],
  'velodu-59-sada437': [3, 'This swimlane must be defined at the start'],
};

describe('stock-error-pages record', () => {
  it('belongs to the pinned upstream SHA', () => {
    expect(record.upstreamSha, `stale record: re-run ${REGENERATE} after changing oracle/pin.json#upstreamSha`).toBe(
      pin.upstreamSha,
    );
    expect(record.plantumlVersion).toBe(pin.plantumlVersion);
  });

  it('has the documented shape with sorted keys', () => {
    const keys = Object.keys(record.errors);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toEqual([...keys].sort());
    for (const [key, e] of Object.entries(record.errors)) {
      expect(key).toMatch(/^[a-z0-9]+\/[^/]+$/);
      expect(e.line === null || Number.isInteger(e.line)).toBe(true);
      expect(typeof e.message).toBe('string');
    }
  });

  it.each(Object.entries(ACTIVITY_ROWS))('activity/%s errors on stock', (slug, [line, prefix]) => {
    const e = record.errors[`activity/${slug}`];
    expect(e?.line).toBe(line);
    expect(e?.message.startsWith(prefix)).toBe(true);
  });

  it('lists exactly the 14 activity error fixtures', () => {
    const activity = Object.keys(record.errors).filter((k) => k.startsWith('activity/'));
    expect(activity.length).toBe(Object.keys(ACTIVITY_ROWS).length);
  });

  it('pins the exact oracle-widths set (stock draws, oracle crashes only under deterministic text)', () => {
    const widths = Object.entries(record.errors)
      .filter(([, e]) => e.provenance === 'oracle-widths')
      .map(([k]) => k);
    expect(widths).toEqual(['class/zuduxu-90-kosi876', 'unknown/rubebe-45-sura795']);
  });
});
