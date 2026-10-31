/**
 * The json family's positional-residue ratchet (jfp D4).
 *
 * Every non-conformant row is structurally clean but placed off the jar's
 * coordinates; `json-family-structural.test.ts` drops those attributes, so
 * nothing there stops a row getting WORSE. This gate pins the measured max |Δ|
 * per row (`oracle/goldens/json-family-positional.json`, orchestrator-seeded
 * from `plans/json-family-parity/tools/residue.mts --all --json`) and fails
 * when a row exceeds its ceiling. Shrink-only: improving a row never fails it;
 * the orchestrator lowers the pin at the next re-seed.
 */
import { describe, it, expect } from 'vitest';

import {
  AUTHORED_KEY_PREFIX,
  PIN_PATH,
  checkRow,
  conformantRows,
  listCachedRows,
  measureResidue,
  missingAuthoredPinKeys,
  parseRowKey,
  readPin,
} from './json-family-positional.js';

/** Each row renders twice (measure + structural verdict); give it room on a loaded machine. */
const ROW_TIMEOUT_MS = 60_000;

const pin = readPin();
const conformant = conformantRows();
const rows = listCachedRows();

describe('json family — positional residue pin', () => {
  it('is seeded', () => {
    expect(pin, `unseeded: ${PIN_PATH} is missing — seed it with residue.mts --all --json`).toBeDefined();
  });

  describe.skipIf(pin === undefined)('pinned rows', () => {
    const known = new Set(rows.map(({ type, slug }) => `${type}/${slug}`));

    it('names only cached rows that are not conformant', () => {
      const keys = Object.keys(pin?.rows ?? {}).filter((k) => !k.startsWith(AUTHORED_KEY_PREFIX));
      const stale = keys.filter((k) => !known.has(k));
      const loosening = keys.filter((k) => conformant.has(k));
      expect(stale, `stale pin rows (no cached fixture): ${stale.join(', ')}`).toEqual([]);
      expect(loosening, `pinned rows that are conformant — drop them: ${loosening.join(', ')}`).toEqual([]);
    });

    for (const { type, slug } of rows) {
      const key = `${type}/${slug}`;
      it(`${key} stays within its pinned residue`, { timeout: ROW_TIMEOUT_MS }, () => {
        const violations = checkRow(key, measureResidue(type, slug), pin?.rows[key], conformant.has(key));
        expect(violations, violations.join('\n')).toEqual([]);
      });
    }
  });

  describe.skipIf(pin === undefined)('pinned authored rows', () => {
    const authoredKeys = Object.keys(pin?.rows ?? {}).filter((k) => k.startsWith(AUTHORED_KEY_PREFIX));

    it('names only authored fixtures that exist under tests/fixtures', () => {
      const missing = missingAuthoredPinKeys(authoredKeys);
      expect(missing, `pin rows with no authored fixture on disk: ${missing.join(', ')}`).toEqual([]);
    });

    for (const key of authoredKeys) {
      const { type, slug } = parseRowKey(key);
      it(`${key} stays within its pinned residue`, { timeout: ROW_TIMEOUT_MS }, () => {
        const violations = checkRow(key, measureResidue(type, slug, 'authored'), pin?.rows[key], false);
        expect(violations, violations.join('\n')).toEqual([]);
      });
    }
  });
});
