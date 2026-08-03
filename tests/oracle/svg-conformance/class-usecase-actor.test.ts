/**
 * Offline SVG-conformance CHARACTERISATION GUARD for the class-engine's
 * `usecase`/`actor`/`allowmixing` routing (mission SI10, T3).
 *
 * See `plans/si10-usecase-actor-routing/decisions.md` ADR-4 before editing
 * this file. Context: ZERO of the 310 pre-existing `oracle/goldens/svg-class`
 * fixtures contain `usecase`, `actor`, or `allowmixing` — T1/T2 (SI10)
 * changed how the class engine sizes usecase/actor leaves
 * (`class-layout-leaf-shapes.ts#measureUsecaseOrActor`, routed through the
 * description engine's `measureUsecaseOrActorLeaf`, ADR-2) with NO regression
 * guard on that path at all. This file is that guard.
 *
 * IMPORTANT — this is NOT `class.golden.ratchet.test.ts`'s zero-diff ratchet.
 * None of the three fixtures below measured zero-diff against their jar
 * `golden.svg` (class conformance is low corpus-wide: `0/718 -> 29/718` per
 * `oracle/goldens/svg-class/README.md`, so a brand-new fixture landing
 * zero-diff was never assumable — ADR-4). Each fixture's diffs are pinned
 * EXACTLY (full array, every `path`/`actual`/`expected`/`delta`), so ANY
 * change to our rendering of this path — regression OR improvement — fails
 * this test and must be re-measured deliberately, rather than drifting
 * silently. Per ADR-4, none of these three are eligible for
 * `oracle/goldens/svg-class/ratchet.json`: that manifest's DOT-EQUAL
 * eligibility rule is enforced via `parity-class.json`, which
 * `scripts/dot-sync-fixtures.ts` populates only for `oracle/goldens/
 * svg-description/<type>/<slug>/`-shaped entries — authored class fixtures
 * (`svg-class/<slug>/`, no `<type>` level) cannot obtain an entry there, so
 * they structurally cannot satisfy the ratchet's eligibility gate. This is a
 * characterisation guard, not a ratchet; do NOT add these slugs to
 * `ratchet.json`.
 *
 * Renders via `renderFixtureClass` + `DeterministicMeasurer` (NOT production
 * `renderSync`, which hardcodes `jarMeasurer`/AWT — see `oracle/goldens/
 * svg-class/README.md`'s "Why a deterministic measurer, not production"),
 * matching the system the goldens were captured in
 * (`-DPLANTUML_DETERMINISTIC_TEXT=true`).
 *
 * Routing (production dispatch, verified per fixture below): the class
 * engine is registered FIRST in `src/index.ts`'s plugin registry, and for a
 * plain `@startuml` block `DiagramRegistry#resolve` falls through to
 * `accepts()` scanning (`src/core/dispatcher.ts`) — so `classAccepts(lines)
 * === true` is authoritative proof the class engine (not description) wins.
 * Independently corroborated by the FULL production `renderSync` pipeline:
 * `assembleDocumentShell`'s `data-diagram-type` root attribute is set to
 * `"CLASS"` only by `class/renderer-shell.ts#assembleClassShell` (never by
 * description's `"DESCRIPTION"`), so its presence on the rendered root `<svg>`
 * is a second, independent, production-pipeline confirmation of routing.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg, type Diff } from './compare.js';
import { renderFixtureClass } from './render-fixture-class.js';
import { renderSync } from '../../../src/index.js';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { classAccepts } from '../../../src/diagrams/class/class-dispatch.js';

const GOLDENS_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../oracle/goldens/svg-class',
);

function readSource(slug: string): string {
  return readFileSync(join(GOLDENS_ROOT, slug, 'in.puml'), 'utf8');
}

function readGolden(slug: string): string {
  return readFileSync(join(GOLDENS_ROOT, slug, 'golden.svg'), 'utf8');
}

/** Verifies production routing: the block's `classAccepts()` decision AND
 *  the full `renderSync` pipeline's `data-diagram-type` root attribute both
 *  agree the CLASS engine (not description) owns this fixture. */
function assertRoutesToClassEngine(markup: string): void {
  const blocks = buildBlockUmls(markup);
  const first = blocks[0];
  expect(first, 'expected exactly one diagram block').toBeDefined();
  expect(first!.ok, 'expected the block to parse cleanly').toBe(true);
  if (!first!.ok) return;
  expect(classAccepts(first!.source.lines)).toBe(true);

  const svg = renderSync(markup);
  const m = /data-diagram-type="([^"]+)"/.exec(svg);
  expect(m?.[1]).toBe('CLASS');
}

// ---------------------------------------------------------------------------
// Fixture 1 — allowmixing + usecase alongside a real class.
// ---------------------------------------------------------------------------

describe('class-allowmixing-usecase-mix (allowmixing + usecase + class)', () => {
  const slug = 'class-allowmixing-usecase-mix';

  it('routes to the CLASS engine (allowmixing short-circuits classAccepts)', () => {
    assertRoutesToClassEngine(readSource(slug));
  });

  it('measures a KNOWN, pinned diff against the jar golden (not zero -- ellipse stroke-width + text render attrs)', () => {
    const golden = readGolden(slug);
    const ours = renderFixtureClass(readSource(slug), new DeterministicMeasurer());
    const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
    expect(pass).toBe(false);
    const expected: Diff[] = [
      { path: 'svg/@viewBox[2]', actual: '256', expected: '255', delta: 1, tolerance: 0.01 },
      { path: 'svg/@width', actual: '256', expected: '255', delta: 1, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@stroke-width', actual: '', expected: '0.5', tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@fill', actual: '#181818', expected: '#000000', tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@lengthAdjust', actual: '', expected: 'spacing', tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@text-anchor', actual: 'middle', expected: '', tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@textLength', actual: '', expected: '82.5125', tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@x', actual: '184.531', expected: '143.276', delta: 41.254999999999995, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@y', actual: '40.6667', expected: '41.5005', delta: 0.8338000000000036, tolerance: 0.01 },
    ];
    expect(diffs).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// Fixture 2 — bare actor, reachable WITHOUT allowmixing.
// ---------------------------------------------------------------------------

describe('class-actor-bare-no-allowmixing (actor, no allowmixing, alongside class)', () => {
  const slug = 'class-actor-bare-no-allowmixing';

  /**
   * The divergence this fixture originally measured is now FIXED. T3 recorded
   * that upstream REFUSES this input -- `CommandCreateElementFull2.java:197-198`
   * (`Mode.NORMAL_KEYWORD`) requires `diagram.isAllowMixing() == true` and
   * errors otherwise -- while this port rendered a diagram. The gate now
   * exists (`class-descriptive-leaf-command.ts#adjudicateAllowMixing`), so the
   * user-visible result is a refusal carrying upstream's own wording.
   */
  it('is REFUSED, as upstream refuses it, with upstream\'s own message', () => {
    const svg = renderSync(readSource(slug));
    expect(svg).toContain('Class diagram error:');
    expect(svg).toContain(
      "Use 'allowmixing' if you want to mix classes and other UML elements.",
    );
    // The element the jar rejects must NOT be drawn.
    expect(svg).not.toMatch(/>Bob</);
  });

  it('renders normally once `allowmixing` is present', () => {
    const withMixing = readSource(slug).replace('@startuml', '@startuml\nallowmixing');
    const svg = renderSync(withMixing);
    expect(svg).not.toContain('Class diagram error:');
    expect(svg).toMatch(/>Bob</);
  });

  /**
   * Still pinned, but note WHICH layer it measures: `renderFixtureClass` drives
   * the class engine's low-level pipeline (parseClass -> layoutClass ->
   * renderClass) directly, BYPASSING the plugin wrapper where the refusal is
   * emitted. So this measures the renderer's raw output against the jar's
   * error page and stays a characterisation guard on the underlying geometry.
   * The user-visible behaviour is asserted by the two tests above.
   */
  it('the raw class pipeline (bypassing the plugin gate) keeps its pinned diff', () => {
    const golden = readGolden(slug);
    const ours = renderFixtureClass(readSource(slug), new DeterministicMeasurer());
    const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
    expect(pass).toBe(false);
    const expected: Diff[] = [
      { path: 'svg/@background', actual: '#FFFFFF', expected: '#000000', tolerance: 0.01 },
      { path: 'svg/@height', actual: '96', expected: '162', delta: 66, tolerance: 0.01 },
      { path: 'svg/@viewBox[2]', actual: '169', expected: '579', delta: 410, tolerance: 0.01 },
      { path: 'svg/@viewBox[3]', actual: '96', expected: '162', delta: 66, tolerance: 0.01 },
      { path: 'svg/@width', actual: '169', expected: '579', delta: 410, tolerance: 0.01 },
      { path: 'svg/g[1][childCount]', actual: '2', expected: '11', tolerance: 0.01 },
    ];
    expect(diffs).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// Fixture 3 — usecase display carrying an inline <$sprite> atom.
// ---------------------------------------------------------------------------

describe('class-usecase-inline-sprite (usecase display with an inline <$sprite> atom)', () => {
  const slug = 'class-usecase-inline-sprite';

  it('routes to the CLASS engine (allowmixing short-circuits classAccepts)', () => {
    assertRoutesToClassEngine(readSource(slug));
  });

  /**
   * The rendering half of this gap is now CLOSED. T2 threaded `sprites` into
   * `measureUsecaseOrActor`'s sizing; the render path then still drew the
   * LITERAL `&lt;$Gear&gt; Configure` markup as one `<text>`, so our
   * usecase-entity `<g>` had 2 children where the jar's has 3 (ellipse +
   * `<image>` + a separate "Configure" text row). That structural
   * childCount mismatch short-circuited `compareSvg`'s recursion, which is
   * why only 3 diffs surfaced.
   *
   * The label's atoms are now resolved at LAYOUT time (the renderer receives
   * no sprite registry) and drawn by the class engine's own
   * `renderRowAtoms`, so the `<image>` is emitted and the structure matches.
   * The diff LIST is longer (12) precisely because the structures now agree
   * and `compareSvg` recurses into the `<g>` for the first time -- read it as
   * "same shape, imprecise numbers", not as a regression from 3.
   *
   * SCALE and VERTICAL PLACEMENT are now exact relative to our own baseline:
   * the emitted `<image>` is the jar's 3x2 (si5b D9 Amendment 1's
   * measure-raw / emit-integer rule), and `renderRowAtoms` bottom-aligns an
   * inline atom to the line instead of top-aligning it, closing `image/@y`
   * from 12.45 to 0.607.
   *
   * REMAINING GAP, and note its SHAPE: every surviving delta is now a SHARED
   * offset, not an atom-specific error. `image/@y` 0.6072 and `text/@y`
   * 0.6071 are the same number -- our label baseline sits 0.607 above the
   * jar's, carrying both children with it -- and `image/@x` and `text/@x`
   * likewise share 2.003. Those trace to two things upstream of any atom
   * drawing: this codebase's `fontSize/4.5` descent APPROXIMATION (3.1111 vs
   * the jar's real 2.9531 at font 14, a 0.158 difference that also shifts
   * every text baseline in the port), and the sizer's ellipse dimensions
   * (`ellipse/@rx` ~1.9 wide), which set the centring the label is drawn
   * against. `ellipse/@stroke-width` absent is the same pre-existing gap the
   * sibling fixture pins.
   */
  it('draws the sprite atom; pinned diffs are placement/scale, not structure', () => {
    const golden = readGolden(slug);
    const ours = renderFixtureClass(readSource(slug), new DeterministicMeasurer());
    const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
    expect(pass).toBe(false);
    // The structural childCount diff is GONE -- that is the fix.
    expect(diffs.map((d) => d.path)).not.toContain('svg/g[1]/g[2][childCount]');
    // And the `<image>` the jar draws is now actually emitted.
    expect(ours).toMatch(/<image/);
    const expected: Diff[] = [
      { path: 'svg/@viewBox[2]', actual: '243', expected: '238', delta: 5, tolerance: 0.01 },
      { path: 'svg/@width', actual: '243', expected: '238', delta: 5, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@cx', actual: '177.531', expected: '175.528', delta: 2.0030000000000143, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@rx', actual: '50.8964', expected: '48.968', delta: 1.9283999999999963, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@ry', actual: '13.4846', expected: '13.0625', delta: 0.42210000000000036, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@stroke-width', actual: '', expected: '0.5', tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/image[1]/@x', actual: '145.553', expected: '143.55', delta: 2.002999999999986, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/image[1]/@y', actual: '41.6239', expected: '42.2311', delta: 0.6071999999999989, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@x', actual: '148.784', expected: '146.781', delta: 2.002999999999986, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@y', actual: '40.6667', expected: '41.2738', delta: 0.6071000000000026, tolerance: 0.01 },
    ];
    expect(diffs).toEqual(expected);
  });
});
