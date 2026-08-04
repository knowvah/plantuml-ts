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

  /**
   * SI14 T4: the actor now draws via `EntityImageDescription.drawU`
   * (`renderer-usymbol-entity.ts`), not the hand-rolled `renderActorIcon`
   * string path -- every actor-specific diff this fixture pinned pre-T4
   * (ellipse/text stroke, fill, lengthAdjust, text-anchor, textLength, and
   * the two centring-formula diffs on x/y) is now ZERO. The two survivors
   * are BOTH the diagram's own pre-existing (pre-T4, unmoved) 1px width/
   * viewBox rounding gap -- unrelated to actor rendering, verified present
   * in the ORIGINAL 9-entry pin above (first two entries) before this task
   * touched anything.
   */
  it('measures a KNOWN, pinned diff against the jar golden (T4: only the pre-existing 1px width gap survives)', () => {
    const golden = readGolden(slug);
    const ours = renderFixtureClass(readSource(slug), new DeterministicMeasurer());
    const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
    expect(pass).toBe(false);
    const expected: Diff[] = [
      // Pre-existing, unrelated to actor rendering (present pre-T4 too).
      { path: 'svg/@viewBox[2]', actual: '256', expected: '255', delta: 1, tolerance: 0.01 },
      { path: 'svg/@width', actual: '256', expected: '255', delta: 1, tolerance: 0.01 },
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
   * SI15 T1 (ADR-1): `UImage` now carries the sprite's native raster grid
   * dims (`resolveSpriteAtom`, 3x2 for this fixture) so `Footprint
   * .MyUGraphic.drawImage` fits the ellipse against `raster - 1` (W=2,H=1)
   * instead of the declared/scaled placement box, matching upstream
   * `UImage.java:87-92`.
   *
   * `ellipse/@rx`/`@ry` CLEAR entirely (AC1: `rx=48.968`, `ry=13.0625` to 5
   * decimals, within the comparator's 0.01 tolerance) -- the diagnosis
   * note's (`.agent-notes/si14-ry-delta.md`) HIGH-confidence leg, confirmed.
   *
   * `cx`/`image/@x`/`text/@x` did NOT clear to zero -- the diagnosis note's
   * own MEDIUM-confidence leg, reported honestly: they SHRANK by ~96%
   * (delta 2.003 -> 0.075, well outside the 0.01 tolerance) but a small
   * residual survives. A NEW `ellipse/@cy` diff (delta 0.4246, absent
   * before this task) appears, and `image/@y`/`text/@y` (the pre-existing
   * descent-approximation residual) shift from delta 0.5794 to the SAME
   * 0.4246 as the new `cy` diff -- consistent with one shared remaining
   * mechanism (likely `alpha`/circle-fit rounding at the new, smaller
   * W=2,H=1 corner points, or a second minor centring effect this task did
   * not chase) rather than two independent causes; not diagnosed further
   * here -- out of T1's write-set (ellipse-fit geometry belongs to the
   * sizer, `measureUsecaseOrActor`, not `Footprint`).
   *
   * `image/@width`/`@height` CLEAR entirely (SI15 T3, ADR-2): the shared
   * `driver-image-svg.ts` now rounds the emitted `<image>` box to
   * `Math.round(width)`/`Math.round(height)` whenever the `UImage` carries
   * raster dims (2.1538/3.2308 -> 2/3, matching the jar exactly), the same
   * rule commit `1406e139` gave the class engine's OWN emission site
   * (`renderer-classifier-rows.ts`) -- jar-verified for `<img>` atoms too
   * (`class-usecase-inline-img`, this file, below): 6.5x3.9 -> 7x4,
   * confirming round-half-up over floor.
   *
   * NET COUNT: 8 entries (was 10) -- `rx`/`ry` were already cleared;
   * `image/@width`/`@height` clear now too (-2).
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
      // Residual centring shift -- see doc comment above (MEDIUM-confidence
      // leg, shrank but did not clear).
      { path: 'svg/g[1]/g[2]/ellipse[1]/@cx', actual: '175.603', expected: '175.528', delta: 0.07500000000001705, tolerance: 0.01 },
      // NEW: see doc comment above.
      { path: 'svg/g[1]/g[2]/ellipse[1]/@cy', actual: '37.5779', expected: '38.0025', delta: 0.4245999999999981, tolerance: 0.01 },
      // Ellipse-fit dx propagation -- same mechanism as cx above.
      { path: 'svg/g[1]/g[2]/image[1]/@x', actual: '143.625', expected: '143.55', delta: 0.07499999999998863, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/image[1]/@y', actual: '41.8065', expected: '42.2311', delta: 0.4245999999999981, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@x', actual: '146.856', expected: '146.781', delta: 0.07499999999998863, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@y', actual: '40.8492', expected: '41.2738', delta: 0.4245999999999981, tolerance: 0.01 },
    ];
    expect(diffs).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// Fixture 4 -- usecase display carrying an inline `<img:...>` data-URI atom
// (SI15 T3, jar-verification input for ADR-2).
// ---------------------------------------------------------------------------

describe('class-usecase-inline-img (usecase display with an inline <img:...> atom)', () => {
  const slug = 'class-usecase-inline-img';

  it('routes to the CLASS engine (allowmixing short-circuits classAccepts)', () => {
    assertRoutesToClassEngine(readSource(slug));
  });

  /**
   * Jar-verified (SI15 T3, ADR-2): a 5x3 PNG at `{scale=1.3}` scales to
   * 6.5x3.9 -- straddling a `.5` boundary on the width axis specifically to
   * disambiguate round-half-up from floor. The jar emits `width="7"
   * height="4"`, i.e. standard `Math.round`, the SAME shape D9 Amendment 1
   * jar-verified for monochrome sprites. `image/@width`/`@height` therefore
   * clear entirely here too, confirming the single raster-backed gate in
   * `driver-image-svg.ts` covers both atom origins -- no per-origin flag
   * needed (ADR-2's fallback path was not taken).
   *
   * The surviving diffs (ellipse `rx`/`ry`/`cx`/`cy`, `image`/`text`
   * `x`/`y`, the 4px width gap) are the SAME ellipse-fit / IHDR-sizing
   * residual class as `class-usecase-inline-sprite` above -- out of T3's
   * write-set (emission rounding only), unrelated to `<image>` width/height.
   */
  it('measures a KNOWN, pinned diff against the jar golden (image/@width and @height clear)', () => {
    const golden = readGolden(slug);
    const ours = renderFixtureClass(readSource(slug), new DeterministicMeasurer());
    const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs.map((d) => d.path)).not.toContain('svg/g[1]/g[2]/image[1]/@width');
    expect(diffs.map((d) => d.path)).not.toContain('svg/g[1]/g[2]/image[1]/@height');
    const expected: Diff[] = [
      { path: 'svg/@viewBox[2]', actual: '248', expected: '244', delta: 4, tolerance: 0.01 },
      { path: 'svg/@width', actual: '248', expected: '244', delta: 4, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@cx', actual: '177.244', expected: '178.527', delta: 1.282999999999987, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@cy', actual: '37.3154', expected: '38.004', delta: 0.688600000000001, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@rx', actual: '50.0574', expected: '51.7574', delta: 1.6999999999999957, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@ry', actual: '12.8', expected: '13.154', delta: 0.3539999999999992, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/image[1]/@x', actual: '142.952', expected: '144.915', delta: 1.9629999999999939, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/image[1]/@y', actual: '40.0265', expected: '40.3596', delta: 0.33310000000000173, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@x', actual: '149.452', expected: '151.415', delta: 1.9629999999999939, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@y', actual: '40.8154', expected: '41.1485', delta: 0.33310000000000173, tolerance: 0.01 },
    ];
    expect(diffs).toEqual(expected);
  });
});
