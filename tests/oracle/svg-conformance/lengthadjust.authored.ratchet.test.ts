/**
 * Authored lengthAdjust gate (lad / T0c, D5): per row of
 * `oracle/goldens/svg-lengthadjust/authored-baseline.json` the weighted score
 * never rises, `rootExact` / `textLengthMatch` never flip true to false, and
 * `exact` rows whose baseline says `textLengthMatch` stay matched. Rows are
 * exactly the `.puml` files on disk, each with its jar `.svg`. Mirrors the
 * authored half of `utility.diff-baseline.ratchet.test.ts`.
 *
 *   npx jiti plans/lengthadjust-document-wide/tools/build-authored-baseline.mts <commit> [--write]
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  listAuthoredLengthAdjustSlugs,
  measureAuthoredLengthAdjust,
  readAuthoredLengthAdjustFixture,
  renderAuthoredLengthAdjust,
} from './render-fixture-lengthadjust.js';

interface AuthoredRow {
  readonly slug: string;
  readonly engine: string;
  readonly variant: string;
  readonly score: number;
  readonly diffCount: number;
  readonly rootExact: boolean;
  readonly textLength: 'exact' | 'baseline';
  readonly textLengthMatch: boolean;
  readonly reason?: string;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(HERE, '../../../oracle/goldens/svg-lengthadjust/authored-baseline.json');
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as {
  readonly measuredAt: string;
  readonly commit: string;
  readonly rows: readonly AuthoredRow[];
};

const RENDERS_PER_ROW = 3;

describe('lengthadjust authored fixtures — manifest shape', () => {
  it('rows are exactly one per tests/fixtures/lengthadjust/*.puml, each with its jar .svg', () => {
    const onDisk = listAuthoredLengthAdjustSlugs();
    expect(manifest.rows.map((r) => r.slug).sort()).toEqual(onDisk);
    expect(onDisk.filter((slug) => readAuthoredLengthAdjustFixture(slug).golden === undefined)).toEqual([]);
  });

  it('every baseline-textLength row and every non-rootExact row carries a reason', () => {
    const unexplained = manifest.rows.filter(
      (r) => (r.textLength === 'baseline' || !r.rootExact) && (r.reason === undefined || r.reason === ''),
    );
    expect(unexplained.map((r) => r.slug)).toEqual([]);
  });
});

describe('lengthadjust authored fixtures — never rises', () => {
  for (const row of manifest.rows) {
    it(`${row.slug}: score <= ${String(row.score)}; rootExact and textLengthMatch never regress`, () => {
      const m = measureAuthoredLengthAdjust(row.slug);
      if (m.errored) throw new Error(`${row.slug}: ${m.reason}`);
      expect(m.weErrored, `${row.slug}: we rendered an error page`).toBe(false);
      expect(m.score, `${row.slug}: weighted score ROSE`).toBeLessThanOrEqual(row.score);
      if (row.rootExact) expect(m.rootExact, `${row.slug}: rootExact regressed`).toBe(true);
      if (row.textLengthMatch) expect(m.textLengthMatch, `${row.slug}: textLengthMatch regressed`).toBe(true);
      if (row.textLength === 'exact' && row.textLengthMatch) {
        expect(m.textLengthMatch, `${row.slug}: exact row lost its textLength match`).toBe(true);
      }
    });
  }
});

describe('lengthadjust authored fixtures — determinism', () => {
  for (const row of manifest.rows) {
    it(`${row.slug}: ${String(RENDERS_PER_ROW)} renders are byte-identical`, () => {
      const { markup } = readAuthoredLengthAdjustFixture(row.slug);
      const renders = Array.from({ length: RENDERS_PER_ROW }, () => renderAuthoredLengthAdjust(markup));
      expect(new Set(renders).size).toBe(1);
    });
  }
});
