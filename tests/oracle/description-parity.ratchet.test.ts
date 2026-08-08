/**
 * Offline DOT-parity RATCHET for description-engine diagrams (component +
 * usecase, both routed through the unified description/deployment engine —
 * see `.claude/catalog.md`).
 *
 * Unlike `class-dot-parity.test.ts` (a harness-health check), this is a real
 * assertion: every fixture under `oracle/goldens/description/<slug>/` is
 * PINNED at structural EQUAL under the current (tightened) `svek-dot.ts` bar
 * (rankdir/nodesep/ranksep included). Once a slug is pinned here, any
 * regression in our DOT emission for that fixture fails `npm test` — the
 * ratchet only tightens, it never silently loosens.
 *
 * Fully offline: goldens are committed `input.puml` + `svek-N.dot` files (no
 * `test-results/` dependency, no Java, no network). New slugs are added by
 * copying a qualifying fixture out of the warm `test-results/dot-cache/`
 * oracle cache — see `oracle/README.md`.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../src/index.js';
import { WidthTableMeasurer } from '../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../src/core/graph-layout.js';
import { MapIncludeStore } from '../../src/core/tim/IncludeStore.js';
import { withStdlib } from '../../src/core/tim/StdlibStore.js';
import {
  parseSvekDot,
  dotInputToStructural,
  compareStructural,
  SIZE_CONFORMANCE_TOLERANCE_IN,
} from './svek-dot.js';
import { expectNoErrorDiagram } from '../helpers/error-diagram.js';
import { buildStdlibAssetsStore } from '../helpers/stdlib-assets-store.js';
import { buildSpriteAssetsStore } from '../helpers/sprite-assets-store.js';
import { buildEmojiAssetsStore } from '../helpers/emoji-assets-store.js';
import { combineAssetStores } from '../../src/core/asset-store.js';

const GOLDENS = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../oracle/goldens/description',
);

/** Slug → allowed maxSizeDeltaIn (inches) for not-yet-size-conformant fixtures
 *  (mission S1L). Absent slug ⇒ must be within the 0.01in `conformant` bar;
 *  backlog entries ratchet downward only. See size-backlog.json's `_doc` and
 *  plans/s1l-leaf-sizing/ledger.md for the per-fixture root-cause routing. */
const sizeBacklog: Record<string, number> = existsSync(join(GOLDENS, 'size-backlog.json'))
  ? (JSON.parse(readFileSync(join(GOLDENS, 'size-backlog.json'), 'utf8')) as Record<string, number>)
  : {};

const fixtures = existsSync(GOLDENS)
  ? readdirSync(GOLDENS, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((name) => name.name)
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

describe.skipIf(fixtures.length === 0)('oracle DOT-parity ratchet — description diagrams', () => {
  for (const name of fixtures) {
    it(`${name}: stays structurally EQUAL to the pinned oracle DOT`, () => {
      const files = svekFiles(name);
      captured = [];
      const svg = renderSync(readFileSync(join(GOLDENS, name, 'input.puml'), 'utf8'), {
        measurer: new WidthTableMeasurer(),
        // T9: 6 pinned goldens use `!include <bundle/thing>` stdlib sprites
        // (cloudogu/awslib/bootstrap/tupadr3) -- an assets-backed store is
        // wired for every ratchet fixture (cheap: memoized after first use,
        // see stdlib-assets-store.ts) rather than special-casing which ones
        // need it.
        includeStore: withStdlib(new MapIncludeStore(), buildStdlibAssetsStore()),
        // F4-f piece 1: same render-input wiring as
        // `scripts/measure-description-size-deltas.ts` (ADR-2). The jar has
        // its `/sprites/**` classpath bundle unconditionally; without this
        // the ratchet measures a diagram the oracle never rendered. Gate
        // logic below is untouched.
        //
        // Wave 3 adds the emoji half for the SAME reason: the jar reads
        // `emoji/data/<codepoint>.svg` off its own classpath unconditionally,
        // so a ratchet without it measures the platform-glyph fallback
        // (murava-69-tago286). All THREE size harnesses must wire the identical
        // store or they silently measure different diagrams — the tell is a
        // conformant count here that disagrees with
        // `measure-description-size-deltas.ts`/`audit-size-metric-identity.ts`.
        assetStore: combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore()),
      });
      expectNoErrorDiagram(svg, `${name}: render produced a PlantUML error`);
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
        expect(
          diff.structurallyEqual,
          `${name}/${file}: structural regression — failing checks: ${failingChecks.join(', ')}`,
        ).toBe(true);
        // S1L: node width/height pinned. Non-backlog fixtures must stay within
        // the 0.01in `conformant` bar; backlog fixtures ratchet downward only
        // (a sub-mission that drops one to ≤0.01 deletes its entry).
        const allowed = sizeBacklog[name] ?? SIZE_CONFORMANCE_TOLERANCE_IN;
        expect(
          diff.maxSizeDeltaIn,
          `${name}/${file}: node size drift — maxSizeDeltaIn=${diff.maxSizeDeltaIn} > allowed ${allowed}`,
        ).toBeLessThanOrEqual(allowed + 1e-6);
      }
    });
  }
});

// Explicit note for the zero-goldens state (this is expected to persist for a
// while: the tightened bar in svek-dot.ts asserts rankdir/nodesep/ranksep,
// which plantuml-ts does not yet match for any cached description fixture).
if (fixtures.length === 0) {
  it('has no pinned description goldens yet (skip gracefully, not a failure)', () => {
    expect(fixtures).toHaveLength(0);
  });
}
