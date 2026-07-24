/**
 * Mission G5/C1, sites 2 and 3, LANDED via G8/T2 -- `state-composite-pass.ts
 * #addLevelEdges` (site 2) and `#sweepOrphanEdges` (site 3) measure
 * transition-label text at upstream's `FontParam.ARROW` default size (13),
 * not `theme.fontSize` (14) — every assertion below is jar-verified (real
 * oracle `textLength` values from `in.svg`). (Site 2 is also the S13
 * `bemena-23-zebu249`/`"EvNewValueSaved"` founding evidence's own call
 * site.)
 *
 * Originally REVERTED (G5/C1): applying the font-size fix alone regressed
 * the PROTECTED `tests/oracle/state-dot-parity.test.ts` size-backlog
 * ratchet, because the composite-bbox-width gap it exposed (an autonom
 * composite's solved-layout bbox under-crediting the horizontal space an
 * edge label actually needs) was not yet closed. G8/T2 closes that
 * companion gap atomically alongside this fix: the FIXEDSIZE edge-label
 * box reservation (`graph-layout-build.ts#addEdges`) + the jar-faithful
 * centre->anchor placement (`state-transition-label.ts`) + the ink-walk
 * `labelInk` box fold (`layout-ink-extent.ts#computeSvekResultGeometry`)
 * + the jar-derived relaxation of `state-composite-cluster.ts`'s title-
 * eligibility guard together reproduce jar's real composite sizing, so
 * the font-size fix no longer widens the backlog -- see
 * `scripts/measure-state-size-deltas.ts`'s own harness (widened=0 gate)
 * for the corpus-wide verification.
 *
 * `nimana-36-veco708` (`plans/state-dot-sync` link-hoisting fixture,
 * `tests/unit/state/state-link-hoisting.test.ts`'s own primary evidence)
 * exercises BOTH call sites in one diagram:
 *   - `no --> yes : go to yes` / `yes --> no : go to no` are declared at
 *     the diagram's TOP scope, both endpoints top-level states — resolved
 *     directly by `addLevelEdges('', ast.transitions, ...)` (site 2's own
 *     top-level call, `state-composite-pass.ts`'s last two lines).
 *   - `yesno --> yesyes : go to yes-yes` / `yesyes --> yesno : go to
 *     yes-no` are declared OUTSIDE the `yes { ... }` block but nested
 *     inside it (real endpoints), so `addLevelEdges` never claims them at
 *     any scope — they land in `ctx.pool` and are picked up by
 *     `sweepOrphanEdges` (site 3) at whichever pass boundary first sees
 *     both endpoints resolved.
 *
 * `bemena-23-zebu249`'s `Configuring { ... NewValuePreview --> NewValueSelection
 * : EvNewValueSaved }` block additionally covers site 2 for a NON-top-level
 * scope call (`state-composite-cluster.ts`'s `addLevelEdges(s.id, ...)`) —
 * the exact S13 founding-evidence call site.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph, DotInputEdge } from '../../../src/core/graph-layout.js';

const CACHE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../test-results/dot-cache/state',
);

const measurer = new WidthTableMeasurer();
const size13 = (text: string): number => measurer.measure(text, { family: 'sans-serif', size: 13 }).width;
const size14 = (text: string): number => measurer.measure(text, { family: 'sans-serif', size: 14 }).width;

function readPuml(slug: string): string {
  return readFileSync(join(CACHE, slug, 'in.puml'), 'utf8');
}

function captureAll(puml: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(puml, { measurer });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

function findEdgeByLabel(graphs: readonly DotInputGraph[], label: string): DotInputEdge {
  for (const g of graphs) {
    const e = g.edges.find((edge) => edge.attributes?.label === label);
    if (e !== undefined) return e;
  }
  throw new Error(`no edge with label "${label}" found in any captured graph`);
}

describe('state-composite-pass.ts addLevelEdges — site 2, top-level scope call', () => {
  const graphs = captureAll(readPuml('nimana-36-veco708'));

  it('measures "go to yes" at font-size 13 (jar-exact 45.5px), not 14', () => {
    const edge = findEdgeByLabel(graphs, 'go to yes');
    expect(size13('go to yes')).toBeCloseTo(45.5, 3);
    expect(size14('go to yes')).not.toBeCloseTo(size13('go to yes'), 3);
    expect(edge.attributes!.labelWidth).toBeCloseTo(size13('go to yes'), 6);
  });

  it('measures "go to no" at font-size 13, not 14', () => {
    const edge = findEdgeByLabel(graphs, 'go to no');
    expect(edge.attributes!.labelWidth).toBeCloseTo(size13('go to no'), 6);
    expect(edge.attributes!.labelWidth).not.toBeCloseTo(size14('go to no'), 3);
  });
});

describe('state-composite-pass.ts addLevelEdges — non-top-level scope call (bemena-23-zebu249, S13 founding evidence)', () => {
  const graphs = captureAll(readPuml('bemena-23-zebu249'));

  it('measures "EvNewValueSaved" at font-size 13 (jar-exact 111.475px), not 14 (120.05px)', () => {
    const edge = findEdgeByLabel(graphs, 'EvNewValueSaved');
    expect(size13('EvNewValueSaved')).toBeCloseTo(111.475, 3);
    expect(size14('EvNewValueSaved')).toBeCloseTo(120.05, 3);
    expect(edge.attributes!.labelWidth).toBeCloseTo(111.475, 3);
    expect(edge.attributes!.labelWidth).not.toBeCloseTo(120.05, 1);
  });
});

describe('state-composite-pass.ts sweepOrphanEdges — site 3', () => {
  const graphs = captureAll(readPuml('nimana-36-veco708'));

  it('measures "go to yes-yes" at font-size 13 (jar-exact 70.0375px), not 14', () => {
    const edge = findEdgeByLabel(graphs, 'go to yes-yes');
    expect(size13('go to yes-yes')).toBeCloseTo(70.0375, 3);
    expect(size14('go to yes-yes')).not.toBeCloseTo(size13('go to yes-yes'), 3);
    expect(edge.attributes!.labelWidth).toBeCloseTo(size13('go to yes-yes'), 6);
  });

  it('measures "go to yes-no" at font-size 13 (jar-exact 64.2688px), not 14', () => {
    const edge = findEdgeByLabel(graphs, 'go to yes-no');
    expect(size13('go to yes-no')).toBeCloseTo(64.2688, 3);
    expect(edge.attributes!.labelWidth).toBeCloseTo(size13('go to yes-no'), 6);
    expect(edge.attributes!.labelWidth).not.toBeCloseTo(size14('go to yes-no'), 3);
  });
});
