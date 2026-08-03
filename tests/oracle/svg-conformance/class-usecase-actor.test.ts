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
   * SI14 T4: the usecase now draws via `EntityImageDescription.drawU`
   * (`renderer-usymbol-entity.ts`), replacing the hand-rolled
   * `renderUseCaseIcon`/`renderRowAtoms` pair the pre-T4 pin above measured.
   * `ellipse/@stroke-width` (absent pre-T4) is now emitted and exact -- the
   * new path threads a real `UStroke` through `EntityImageDescriptionPaint`,
   * where the old hand-rolled ellipse never set one.
   *
   * `ellipse/@cx`/`@rx`/`@ry` are UNCHANGED and expected to survive this
   * task -- per T4's own "Explicitly out of scope" note, this is the fitted
   * ellipse's OWN dimensions (the sizer's `measureUsecaseOrActor`, T6's
   * job), a mechanism upstream of and independent from centring.
   *
   * `image/@x`/`text/@x` are ALSO UNCHANGED (2.003, not the 0 the task's own
   * acceptance criterion 1 predicted). Measured, not assumed: both trace to
   * the SAME out-of-scope ellipse-fit mechanism above -- the fitted
   * ellipse's cx/rx set the dx the label draws against, so an off-by-~1.93
   * `rx` propagates directly into an off-by-~2.00 label x. AC1's prediction
   * that x would independently reach 0 did not hold once measured; this is
   * the honest residual, not a rounding slip.
   *
   * `image/@y`/`text/@y` IMPROVED (0.6072/0.6071 -> 0.5794/0.5794, still
   * non-zero, still a SHARED offset -- both numbers equal, confirming a
   * single upstream cause, not two independent errors): the description
   * engine's own `fontSize/4.5` descent approximation (recorded pre-T4,
   * unchanged by this task).
   *
   * `image/@width`/`@height` are a NEW residual T4 exposes (2 entries,
   * absent pre-T4): commit 1406e139 (landed immediately before this task)
   * moved D9 Amendment 1's raw-measure/integer-emit rounding to the
   * CLASS-engine-only `<image>` emission site (`renderer-classifier-
   * rows.ts`), explicitly flagging in its own commit message that "the
   * description engine emits via klimt's shared `svgImageDataUri`, which is
   * not aligned -- rounding there would also affect `<img>` atoms... [and]
   * needs its own verification pass." T4 routes usecase/actor through
   * EXACTLY that unrounded description-engine path
   * (`EntityImageDescriptionTextBlock.ts#drawAtoms`), so this pre-flagged,
   * pre-existing gap becomes reachable here for the first time. Rounding it
   * at THIS task's own resolver seam would corrupt the cursor-advance width
   * `drawAtoms` reuses for the FOLLOWING text run (the same reason the
   * class-engine fix rounds only at the emission site, not the resolver) --
   * fixing it correctly requires editing `EntityImageDescriptionTextBlock
   * .ts`, outside this task's write-set and already named as its own
   * follow-up by the commit that surfaced it. NOT chased here, mirroring
   * how T4 does not chase the ellipse-fit residual above.
   *
   * NET COUNT: 11 entries, not smaller than the pre-T4 pin (10) -- honest
   * report, not the strict "smaller" the task predicted: one entry
   * resolved (`stroke-width`) while two NEW ones surface (`image/@width`,
   * `@height`) for the reason above. Every actor-only diff on the SIBLING
   * fixture above closed to zero; this fixture's residual count grows by
   * exactly the pre-flagged rounding gap this task's own routing change
   * newly reaches.
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
      // Ellipse fit itself -- T6's job, out of scope (task's own note).
      { path: 'svg/g[1]/g[2]/ellipse[1]/@cx', actual: '177.531', expected: '175.528', delta: 2.0030000000000143, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@rx', actual: '50.8964', expected: '48.968', delta: 1.9283999999999963, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/ellipse[1]/@ry', actual: '13.4846', expected: '13.0625', delta: 0.42210000000000036, tolerance: 0.01 },
      // NEW residual: description-engine `<image>` emission does not round
      // (pre-flagged gap, commit 1406e139) -- see doc comment above.
      { path: 'svg/g[1]/g[2]/image[1]/@height', actual: '2.1538', expected: '2', delta: 0.15379999999999994, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/image[1]/@width', actual: '3.2308', expected: '3', delta: 0.2307999999999999, tolerance: 0.01 },
      // Ellipse-fit dx propagation -- same mechanism as cx/rx above.
      { path: 'svg/g[1]/g[2]/image[1]/@x', actual: '145.553', expected: '143.55', delta: 2.002999999999986, tolerance: 0.01 },
      // Descent approximation (pre-existing, unchanged mechanism).
      { path: 'svg/g[1]/g[2]/image[1]/@y', actual: '41.6517', expected: '42.2311', delta: 0.5793999999999997, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@x', actual: '148.784', expected: '146.781', delta: 2.002999999999986, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2]/text[1]/@y', actual: '40.6944', expected: '41.2738', delta: 0.5793999999999997, tolerance: 0.01 },
    ];
    expect(diffs).toEqual(expected);
  });
});
