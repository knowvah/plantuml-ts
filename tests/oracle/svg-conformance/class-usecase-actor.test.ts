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

  it('routes to the CLASS engine even without allowmixing (actor is excluded from the descriptive-signal decline set, D3)', () => {
    assertRoutesToClassEngine(readSource(slug));
  });

  /**
   * KNOWN, LARGE, PRE-EXISTING DIVERGENCE (not T1/T2, not this mission's
   * scope): the jar's `golden.svg` here is upstream's own ERROR rendering,
   * not a real diagram. `CommandCreateElementFull2.java:197-198`
   * (`Mode.NORMAL_KEYWORD`) requires `diagram.isAllowMixing() == true` before
   * accepting an `actor`/`usecase`/`database`/... leaf inside a class
   * diagram, and errors otherwise ("Use 'allowmixing' if you want to mix
   * classes and other UML elements."). This port's class engine has NO
   * equivalent gate (`class-descriptive-leaf-command.ts`'s
   * `DESCRIPTIVE_LEAF_COMMANDS` registers unconditionally), so it renders a
   * real diagram where upstream errors -- confirmed by both sides agreeing
   * on ROUTING ("Assumed diagram type: class" in the jar's error text,
   * `data-diagram-type` absent on its error SVG only because upstream never
   * reaches its own class-shell assembly for an error page) while disagreeing
   * on ACCEPTANCE. This is a real, measured finding surfaced BY this fixture
   * -- flagged here for a follow-up mission, deliberately NOT fixed in T3
   * (write-set is fixtures + this test only).
   */
  it('measures a KNOWN, pinned diff against the jar golden (jar ERRORS without allowmixing; this port does not gate it)', () => {
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
   * KNOWN GAP (measured, not fixed here): T2 threaded `sprites` into
   * `measureUsecaseOrActor`'s WIDTH calculation
   * (`class-layout-leaf-shapes.ts`), but nothing threads the `<$sprite>` atom
   * into the class engine's RENDER path for a usecase/actor leaf -- our
   * output's usecase-entity `<g>` has 2 children (ellipse + one text row
   * containing the LITERAL, un-resolved `<$Gear>` text), where the jar's has
   * 3 (ellipse + an `<image>` for the sprite + a separate "Configure" text
   * row). The structural childCount mismatch short-circuits `compareSvg`'s
   * recursion into that `<g>` (see `compare.ts#compareNodes`'s "structural
   * mismatch -- stop recursing" rule), so only the top-two `childCount`/
   * size diffs surface here rather than a longer list of attribute diffs.
   */
  it('measures a KNOWN, pinned diff against the jar golden (sprite atom sized but not rendered)', () => {
    const golden = readGolden(slug);
    const ours = renderFixtureClass(readSource(slug), new DeterministicMeasurer());
    const { pass, diffs } = compareSvg(ours, golden, 'deterministic');
    expect(pass).toBe(false);
    const expected: Diff[] = [
      { path: 'svg/@viewBox[2]', actual: '243', expected: '238', delta: 5, tolerance: 0.01 },
      { path: 'svg/@width', actual: '243', expected: '238', delta: 5, tolerance: 0.01 },
      { path: 'svg/g[1]/g[2][childCount]', actual: '2', expected: '3', tolerance: 0.01 },
    ];
    expect(diffs).toEqual(expected);
  });
});
