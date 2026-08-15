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
 * IMPORTANT — this is a characterisation guard that runs ALONGSIDE
 * `class.golden.ratchet.test.ts`, not a substitute for it. Each fixture's
 * diffs are pinned EXACTLY, so ANY change to our rendering of this path —
 * regression OR improvement — fails this test and must be re-measured
 * deliberately, rather than drifting silently.
 *
 * HISTORY (both original caveats are now RESOLVED — do not re-apply them):
 *   1. When written (SI10, ADR-4), none of the three measured zero-diff, and
 *      class conformance was low corpus-wide (`0/718 -> 29/718`), so a
 *      brand-new fixture landing zero-diff was not assumable. SI14/SI15 then
 *      closed every ellipse/image/text family, leaving one shared 1px
 *      width/viewBox gap; the usecase-ellipse ink fix (2026-08-06,
 *      `class-ink-box.ts#addEllipseInk`) closed that. **All three are now
 *      zero-diff**, and their pins above are empty arrays.
 *   2. ADR-4 also recorded them as structurally INELIGIBLE for
 *      `oracle/goldens/svg-class/ratchet.json`, because that manifest's
 *      DOT-EQUAL rule reads `parity-class.json`, which
 *      `scripts/dot-sync-fixtures.ts` then populated only for
 *      `svg-description/<type>/<slug>/`-shaped entries. **SI13 removed that
 *      restriction** (per-type golden layout; class → flat `svg-class/<slug>/`
 *      root), and all three now carry `dotEqual: true` parity rows. They ARE
 *      ratcheted as of 2026-08-06.
 *
 * `class-actor-bare-no-allowmixing` remains the one exception: the jar
 * refuses its input (error-page canonical, no CLASS tag), so it can never
 * obtain a parity row and stays guarded here only.
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

/**
 * The port's own inline error boxes draw with `fontFamily: 'monospace'`, and
 * the SVG emitter applies upstream's monospace rule to any such text —
 * `SvgGraphics.java:727-728` replaces every space with U+00A0 under a
 * `monospace`/`courier` family. So the message IS in the document, spelled
 * with NBSPs. These assertions are about the message being STATED, not about
 * which space character carries it, so they compare against the de-NBSP'd
 * text.
 */
const deNbsp = (svg: string): string => svg.split('\u00a0').join(' ');


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
   *
   * CLOSED 2026-08-06 (usecase-ellipse ink): that last 1px was this
   * diagram's own usecase leaf being ink-walked as a RECT (`x + w`) instead
   * of the `<ellipse>` it actually draws (`LimitFinder#drawEllipse` --
   * `x + w - 1`). See `class-ink-box.ts#addEllipseInk`. **ZERO diffs.**
   */
  it('is byte-exact against the jar golden (usecase-ellipse ink closed the last 1px)', () => {
    const golden = readGolden(slug);
    const ours = renderFixtureClass(readSource(slug), new DeterministicMeasurer());
    const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
    expect(diffs).toEqual([]);
    expect(pass).toBe(true);
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
    expect(deNbsp(svg)).toContain('plantuml-ts version');
    expect(deNbsp(svg)).toContain(
      "Use 'allowmixing' if you want to mix classes and other UML elements.",
    );
    // The element the jar rejects must NOT be drawn.
    expect(svg).not.toMatch(/>Bob</);
  });

  it('renders normally once `allowmixing` is present', () => {
    const withMixing = readSource(slug).replace('@startuml', '@startuml\nallowmixing');
    const svg = renderSync(withMixing);
    expect(deNbsp(svg)).not.toContain('plantuml-ts version');
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
    // UNCHANGED by the size-reduction mission, and that is the point: this
    // pin was briefly "re-measured" to 5 diffs (height 288, childCount 18)
    // against a golden T9 had written from an anomalous jar capture -- a
    // 16031-byte error page carrying two embedded PlantUML banner PNGs that
    // nine consecutive re-captures of the same invocation do not reproduce
    // (they give 2147 bytes, deterministically). The golden is restored and
    // this pin with it. The error page's own geometry never moved.
    // Re-pinned 2026-08-15 (usymbol-ink-rule): 96 -> 92 high, 169 -> 168
    // wide. This fixture draws an ACTOR, and an actor's ink is now its own
    // drawn head/body/label union rather than `addRectInk`'s box corner
    // (`class-ink-box.ts#addClassifierInk`), which sat 1.5 above the head's
    // real top. The geometry moving here is the fix reaching this fixture,
    // not a regression.
    //
    // Re-pinning is legitimate specifically because of what the `expected`
    // column IS: the jar's own 579x162 ERROR PAGE, emitted because upstream
    // REFUSES a bare `actor` without `allowmixing` (the two tests above
    // assert that refusal is what users see). This path bypasses that gate,
    // so the golden is not a rendering of this diagram and the deltas are
    // not a fidelity measure — the same 4px that reads as "further from
    // 162" here is what makes `cezaka-60-jado323` land EXACTLY on jar,
    // where jar does draw the diagram. Do NOT treat this as a target to
    // close, and do not re-pin it to make an unrelated gate pass.
    const expected: Diff[] = [
      { path: 'svg/@background', actual: '#FFFFFF', expected: '#000000', tolerance: 0.01 },
      { path: 'svg/@height', actual: '92', expected: '162', delta: 70, tolerance: 0.01 },
      { path: 'svg/@viewBox[2]', actual: '168', expected: '579', delta: 411, tolerance: 0.01 },
      { path: 'svg/@viewBox[3]', actual: '92', expected: '162', delta: 70, tolerance: 0.01 },
      { path: 'svg/@width', actual: '168', expected: '579', delta: 411, tolerance: 0.01 },
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
   * `image/@width`/`@height` CLEAR entirely (SI15 T3, ADR-2): the shared
   * `driver-image-svg.ts` now rounds the emitted `<image>` box to
   * `Math.round(width)`/`Math.round(height)` whenever the `UImage` carries
   * raster dims (2.1538/3.2308 -> 2/3, matching the jar exactly), the same
   * rule commit `1406e139` gave the class engine's OWN emission site
   * (`renderer-classifier-rows.ts`) -- jar-verified for `<img>` atoms too
   * (`class-usecase-inline-img`, this file, below): 6.5x3.9 -> 7x4,
   * confirming round-half-up over floor.
   *
   * SI15 T6 closed the WHOLE remaining ellipse-fit family: the interim
   * cx/cy/x/y residuals T1 pinned (delta 0.075 / 0.4246) were the SIZING
   * path still measuring the declared box -- `sizingAtomImageResolverFor`
   * (`leaf-sizing-entity.ts`) never carried raster dims, so
   * `Footprint.drawImage`'s `raster - 1` branch was unreachable from
   * `measureUsecaseOrActorLeaf` (`.agent-notes/si15-ink-offset.md`). With
   * raster dims on the sizing fallback (and the formula corrected to
   * `Math.round(declared)` at every producer), every ellipse/image/text
   * attribute on this fixture matches the jar within tolerance.
   *
   * NET COUNT: 2 entries (was 8) -- ONLY the diagram's pre-existing 1px
   * width/viewBox rounding gap survives, the SAME class of diff
   * `class-allowmixing-usecase-mix` pins above (256 vs 255 there); it
   * even shrank 5 -> 1 as the now-correct (smaller) ellipse narrowed the
   * diagram.
   *
   * CLOSED 2026-08-06 (usecase-ellipse ink): the surviving 1px was the
   * usecase leaf being ink-walked as a RECT rather than the `<ellipse>` it
   * draws -- see `class-ink-box.ts#addEllipseInk`. **ZERO diffs.**
   */
  it('draws the sprite atom and is byte-exact against the jar golden', () => {
    const golden = readGolden(slug);
    const ours = renderFixtureClass(readSource(slug), new DeterministicMeasurer());
    const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
    // The structural childCount diff is GONE -- that is the fix.
    expect(diffs.map((d) => d.path)).not.toContain('svg/g[1]/g[2][childCount]');
    // And the `<image>` the jar draws is now actually emitted.
    expect(ours).toMatch(/<image/);
    expect(diffs).toEqual([]);
    expect(pass).toBe(true);
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
   * SI15 T6: the ellipse-fit family this fixture originally pinned
   * (`rx`/`ry`/`cx`/`cy`, `image`/`text` `x`/`y`) CLEARED entirely once
   * (a) raster dims reached the sizing path and (b) the raster formula
   * became `Math.round(declared)` -- for this 5x3 PNG at scale 1.3 that is
   * round(6.5)x round(3.9) = 7x4, so `Footprint` fits against 6x3
   * (raster - 1), reproducing the jar's fit exactly. Only the same
   * pre-existing 1px width/viewBox rounding gap as the sibling fixtures
   * survives (shrank 4 -> 1 with the corrected, smaller ellipse).
   *
   * CLOSED 2026-08-06 (usecase-ellipse ink): that last 1px was the usecase
   * leaf being ink-walked as a RECT rather than the `<ellipse>` it draws --
   * see `class-ink-box.ts#addEllipseInk`. **ZERO diffs.**
   */
  it('is byte-exact against the jar golden (image/@width and @height clear)', () => {
    const golden = readGolden(slug);
    const ours = renderFixtureClass(readSource(slug), new DeterministicMeasurer());
    const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
    expect(diffs.map((d) => d.path)).not.toContain('svg/g[1]/g[2]/image[1]/@width');
    expect(diffs.map((d) => d.path)).not.toContain('svg/g[1]/g[2]/image[1]/@height');
    expect(diffs).toEqual([]);
    expect(pass).toBe(true);
  });
});
