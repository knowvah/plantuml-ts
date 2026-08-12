/**
 * Oracle DOT-parity ratchet for object diagrams (mission A3 object-dot-sync).
 *
 * Object diagrams are CLASS diagrams upstream (no separate engine —
 * `ClassDiagramFactory` registers the object/map commands), so every golden
 * here routes through the class engine. Mirrors the RATCHET suite of
 * `class-dot-parity.test.ts`: fixtures under `oracle/goldens/object/<slug>/`
 * are input.puml + svek-N.dot pinned when `scripts/dot-sync-report.ts object`
 * classified them structurally EQUAL. Every pinned fixture must keep emitting
 * exactly as many layout graphs as its committed svek-N.dot files, each
 * structurally EQUAL.
 *
 * Per decisions.md#d4, node SIZES are asserted from the start (stricter than
 * the class ratchet): maxSizeDeltaIn must be 0 for every fixture NOT listed
 * in `size-backlog.json`. Backlog fixtures (structurally EQUAL before their
 * size mechanisms were fixed) assert delta <= their pinned value, so a size
 * gap can only shrink; Phase L size iterations drive entries to 0 and remove
 * them (absent = 0 required).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../src/index.js';
import { WidthTableMeasurer } from '../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../src/core/graph-layout.js';
import {
  parseSvekDot,
  dotInputToStructural,
  compareStructural,
} from './svek-dot.js';

const GOLDENS = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../oracle/goldens/object',
);

/** Slugs whose DOT differs from the oracle's ONLY in edge-endpoint ports — the
 *  unported row-port emission. See `port-backlog.json`'s own `_doc`; the
 *  assertion below keeps every other check live for these fixtures. */
const portBacklog: ReadonlySet<string> = new Set(
  existsSync(join(GOLDENS, 'port-backlog.json'))
    ? (JSON.parse(readFileSync(join(GOLDENS, 'port-backlog.json'), 'utf8')) as { slugs: string[] }).slugs
    : [],
);

/** B31: slugs whose DOT differs from the oracle's ONLY in edge DIRECTION --
 *  see `direction-backlog.json`'s own `_doc`. Same shape as `portBacklog`:
 *  the assertion below keeps every other check live for these fixtures. */
const directionBacklog: ReadonlySet<string> = new Set(
  existsSync(join(GOLDENS, 'direction-backlog.json'))
    ? (JSON.parse(readFileSync(join(GOLDENS, 'direction-backlog.json'), 'utf8')) as { slugs: string[] }).slugs
    : [],
);

/** Slug → allowed maxSizeDeltaIn (inches) for not-yet-size-exact fixtures. */
const sizeBacklog: Record<string, number> = existsSync(join(GOLDENS, 'size-backlog.json'))
  ? (JSON.parse(readFileSync(join(GOLDENS, 'size-backlog.json'), 'utf8')) as Record<string, number>)
  : {};

const ratchetFixtures = existsSync(GOLDENS)
  ? readdirSync(GOLDENS, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((name) => existsSync(join(GOLDENS, name, 'input.puml')))
      .sort()
  : [];

/** Sorted `svek-N.dot` filenames for a golden, in rank order. */
function svekFiles(name: string): string[] {
  return readdirSync(join(GOLDENS, name))
    .filter((f) => /^svek-\d+\.dot$/.test(f))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]));
}

let captured: DotInputGraph[] = [];
beforeAll(() => setLayoutInputObserver((g) => captured.push(g)));
afterAll(() => setLayoutInputObserver(undefined));

describe.skipIf(ratchetFixtures.length === 0)('oracle DOT-parity ratchet — object diagrams', () => {
  it('has goldens to compare', () => {
    expect(ratchetFixtures.length).toBeGreaterThan(0);
  });

  for (const name of ratchetFixtures) {
    it(`${name}: stays structurally EQUAL to the pinned oracle DOT`, () => {
      const files = svekFiles(name);
      captured = [];
      // Not asserting "no PlantUML error": zero-vs-zero graph counts are a
      // legitimate EQUAL per dot-sync-report.ts's classification; the
      // captured-graph-count assertion is the structural check.
      renderSync(readFileSync(join(GOLDENS, name, 'input.puml'), 'utf8'), {
        measurer: new WidthTableMeasurer(),
      });
      expect(
        captured.length,
        `${name}: expected ${files.length} captured layout graph(s), got ${captured.length}`,
      ).toBe(files.length);

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const oracle = parseSvekDot(readFileSync(join(GOLDENS, name, file), 'utf8'));
        const candidate = dotInputToStructural(captured[i]!);
        const diff = compareStructural(oracle, candidate);
        const failingChecks = Object.entries(diff)
          .filter(([k, v]) => k.endsWith('Ok') && v === false)
          .map(([k]) => k);
        if (directionBacklog.has(name)) {
          // B31: known-unequal in edge DIRECTION ONLY (see
          // direction-backlog.json's `_doc`). Same contract as portBacklog
          // below/above -- NOT a skip: every other structural check stays
          // live, so a regression in node count, degree, minlen, shape,
          // labels, ports or clusters still fails here.
          expect(
            failingChecks.filter((k) => k !== 'sizeConformantOk'),
            `${name}/${file}: direction-backlog fixtures may fail directionOk and NOTHING else`,
          ).toEqual(['directionOk']);
        } else if (portBacklog.has(name)) {
          // Known-unequal in edge ports ONLY (see port-backlog.json's `_doc`).
          // Deliberately NOT a skip: the fixture stays fully gated on every
          // other check, so a regression in node count, degree, minlen, shape,
          // labels or clusters still fails here. `sizeConformantOk` is excluded
          // because it is not a structural check -- it is the tolerant size
          // metric, kept out of `structurallyEqual` by design and gated
          // separately by `sizeBacklog` immediately below.
          expect(
            failingChecks.filter((k) => k !== 'sizeConformantOk'),
            `${name}/${file}: port-backlog fixtures may fail portOk and NOTHING else`,
          ).toEqual(['portOk']);
        } else {
          expect(
            diff.structurallyEqual,
            `${name}/${file}: structural regression — failing checks: ${failingChecks.join(', ')}`,
          ).toBe(true);
        }
        // D4: node sizes pinned (rect nodes; plaintext nodes parse as 0x0 on
        // both sides so they cannot mask a rect-size regression). Backlog
        // fixtures ratchet downward; everything else must be exactly 0.
        const allowed = sizeBacklog[name] ?? 0;
        expect(
          diff.maxSizeDeltaIn,
          `${name}/${file}: node size drift — maxSizeDeltaIn=${diff.maxSizeDeltaIn} > allowed ${allowed}`,
        ).toBeLessThanOrEqual(allowed + 1e-6);
      }
    });
  }
});
