/**
 * Oracle DOT-parity ratchet for state diagrams (mission A4 state-dot-sync).
 *
 * State diagrams run their own engine (upstream StateDiagramFactory) on the
 * shared svek pipeline. Composite states make these fixtures MULTI-GRAPH:
 * autonom composites are laid out in child svek passes dumped before the
 * parent (GroupMakerState), so a golden may carry svek-1..svek-N and the
 * captured layout graphs must pair 1:1 in order. Mirrors the RATCHET suite
 * of `object-dot-parity.test.ts`: fixtures under
 * `oracle/goldens/state/<slug>/` are input.puml + svek-N.dot pinned when
 * `scripts/dot-sync-report.ts state` classified them structurally EQUAL.
 *
 * Per decisions.md#d4 (A4), node SIZES are asserted from the start:
 * maxSizeDeltaIn must be 0 for every fixture NOT listed in
 * `size-backlog.json`. Backlog fixtures (structurally EQUAL before their
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
import {
  assertBacklogFailures,
  expectedBacklogFailures,
  loadSlugBacklog,
  structuralFailures,
  type BacklogFile,
} from './dot-parity-backlogs.js';

const GOLDENS = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../oracle/goldens/state',
);

/** Per-slug structural backlogs (NOT skips -- see dot-parity-backlogs.ts):
 *  B31 `direction-backlog.json` (edge DIRECTION only; emptied by object-close
 *  T2/B33, kept as the seam) and D7 `label-size-backlog.json` (edge-label BOX
 *  SIZE only, edge-label-box 2026-08-15). Each file's `_doc` has the mechanism. */
const backlogs: ReadonlyMap<BacklogFile, ReadonlySet<string>> = new Map(
  (['direction-backlog.json', 'label-size-backlog.json'] as const).map((f) => [f, loadSlugBacklog(GOLDENS, f)]),
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

describe.skipIf(ratchetFixtures.length === 0)('oracle DOT-parity ratchet — state diagrams', () => {
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

      // Structural gate, per fixture: see dot-parity-backlogs.ts for why the
      // backlog check is a per-file subset and a per-fixture union.
      const diffs = files.map((file, i) =>
        compareStructural(
          parseSvekDot(readFileSync(join(GOLDENS, name, file), 'utf8')),
          dotInputToStructural(captured[i]!),
        ),
      );
      assertBacklogFailures(name, files, diffs.map(structuralFailures), expectedBacklogFailures(name, backlogs));
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const diff = diffs[i]!;
        // D4: node sizes pinned (rect nodes; plaintext nodes parse as 0x0 on
        // both sides so they cannot mask a rect-size regression). Backlog
        // fixtures ratchet downward; everything else must be exactly 0.
        const allowed = sizeBacklog[name] ?? 0;
        // Compared WITH float slack, mirroring `compare.ts#exceedsTolerance`'s
        // own note that a naive `>` is wrong at the boundary. Node dims reach
        // the engine as a 6dp inches string (`svek-dot-emit.ts#inches`), so a
        // drift of exactly one 1e-6 unit is the quantization granularity and
        // is what this `+ 1e-6` band was written to admit — but 1e-6 is not
        // representable, and the value arrives as 0.000001000000000139778,
        // failing an exact `<=` by 1.4e-16. The band is unchanged; only the
        // comparison stops tripping over its own representation.
        const bound = allowed + 1e-6;
        const slack = Number.EPSILON * Math.max(diff.maxSizeDeltaIn, bound, 1);
        expect(
          diff.maxSizeDeltaIn - bound,
          `${name}/${file}: node size drift — maxSizeDeltaIn=${diff.maxSizeDeltaIn} > allowed ${allowed}`,
        ).toBeLessThanOrEqual(slack);
      }
    });
  }
});
