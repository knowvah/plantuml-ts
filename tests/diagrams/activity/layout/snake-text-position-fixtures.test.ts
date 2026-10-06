/**
 * Authored-fixture tests for T1b's `Snake#getTextBlockPosition` port
 * (`layout/snake-text-position.ts`), mirroring `canvas-origin.test.ts`'s
 * own "render both, compare one attribute" pattern.
 *
 * `while-backward-bottom` = `boxefe-81-situ725` (real corpus fixture,
 * copied verbatim -- the acceptance criterion's own named case), a
 * `while` with `(incoming) backward :Warning; (dsc_5)`: Backward1's
 * `(incoming)` label is `VerticalAlignment.BOTTOM`
 * (`FtileWhile.java:354`); Backward2's `(dsc_5)` label is
 * `arrowHorizontalAlignment()` (`:389-390`, default LEFT).
 *
 * Jar X, pre-fix (T1a's census): BOTTOM branch x matched by coincidence
 * (the old generic fallback's `max(pt1.x,pt2.x)+4` happened to equal
 * `worm.getMinX()` on this fixture's geometry); Y was off by 6.445px
 * (`139.833` ours vs `146.278` jar) because the fallback never computed
 * `worm.getMaxY()` at all. After this port, X still matches exactly for
 * BOTH labels and Y drops to a sub-2px residual -- see the Y assertions'
 * own comment for why that residual is NOT this task's mechanism.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../../helpers/fixture-include-store.js';
import { renderFixtureActivity } from '../../../oracle/svg-conformance/render-fixture-activity.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../../fixtures/activity/add3-T1b');

function renderFixture(name: string): { ours: string; golden: string } {
  const puml = readFileSync(join(FIXTURE_ROOT, name, 'in.puml'), 'utf8');
  const golden = readFileSync(join(FIXTURE_ROOT, name, 'in.svg'), 'utf8');
  const ours = renderFixtureActivity(puml, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  return { ours, golden };
}

/** The `x`/`y` of the FIRST `<text>` whose content is exactly `label`. */
function textPosition(svg: string, label: string): { x: number; y: number } {
  const re = new RegExp(`<text x="([^"]*)" y="([^"]*)"[^>]*>${label}</text>`);
  const m = svg.match(re);
  if (m === null) throw new Error(`<text>${label}</text> not found`);
  return { x: Number(m[1]), y: Number(m[2]) };
}

function attr(svg: string, name: string): string {
  const m = svg.match(new RegExp(`${name}="([^"]*)"`));
  if (m === null) throw new Error(`${name} not found`);
  return m[1]!;
}

/** Count of `<text>` elements whose content is exactly `label` -- the
 *  "exactly once, no duplicate draw" check every generic-mechanism
 *  fixture below needs (`label-in-fork`'s own doc: upstream draws a
 *  fork branch's entry label ONCE, on the first branch only). */
function textOccurrences(svg: string, label: string): number {
  const re = new RegExp(`<text[^>]*>${label}</text>`, 'g');
  return (svg.match(re) ?? []).length;
}

describe('Snake label position -- while-backward-bottom (boxefe-81-situ725)', () => {
  const { ours, golden } = renderFixture('while-backward-bottom');

  it('Backward1 "incoming" (BOTTOM): x matches the jar exactly', () => {
    expect(textPosition(ours, 'incoming').x).toBe(textPosition(golden, 'incoming').x);
  });

  it('Backward2 "dsc_5" (LEFT default): x matches the jar exactly', () => {
    expect(textPosition(ours, 'dsc_5').x).toBe(textPosition(golden, 'dsc_5').x);
  });

  // Y for both labels still carries a sub-2px residual, but NOT from this
  // task's mechanism: every Y-axis value in this fixture (box `rect`/`text`
  // y, independent of any label) is offset from the jar by the SAME
  // ~0.944px step (e.g. the "read data" box: jar `rect y="99.944"` vs ours
  // `rect y="99"`) -- a pre-existing, fixture-wide rounding divergence in
  // the `while`/hexagon geometry this task's write-set does not touch.
  // These two assertions PIN our own current output (a regression guard),
  // not jar parity -- do not "fix" them by fitting a new constant here.
  it('Backward1 "incoming" y: pinned at the current (not jar-equal) value', () => {
    expect(textPosition(ours, 'incoming').y).toBeCloseTo(218.556, 3);
  });

  it('Backward2 "dsc_5" y: pinned at the current (not jar-equal) value', () => {
    expect(textPosition(ours, 'dsc_5').y).toBeCloseTo(96.806, 3);
  });
});

/**
 * T1b pass 2: the generic `-> label;` mechanism (`ActivityDiagram3.java:
 * 105-106,437-465`), end to end -- every fixture below was rendered
 * through `scripts/oracle-render.sh` and asserted against BOTH the
 * real jar and our own port. Canvas `width`/`height` and the label's
 * own `x` now match the jar EXACTLY in every case; `y` carries the
 * same creole-ascent residual `while-backward-bottom` already
 * documents above (not re-derived here -- same mechanism, same
 * boundary).
 */
describe('generic -> label; -- default-arrow-label (start;:A;->hello;:B;stop;)', () => {
  const { ours, golden } = renderFixture('default-arrow-label');

  it('canvas width/height match the jar exactly', () => {
    expect(attr(ours, 'width')).toBe(attr(golden, 'width'));
    expect(attr(ours, 'height')).toBe(attr(golden, 'height'));
  });

  it('"hello" x matches the jar exactly', () => {
    expect(textPosition(ours, 'hello').x).toBe(textPosition(golden, 'hello').x);
  });

  it('"hello" y: pinned at the current (not jar-equal) value', () => {
    expect(textPosition(ours, 'hello').y).toBeCloseTo(109.778, 3);
  });
});

describe('generic -> label; -- colored-arrow-label (-><back:red> hello;)', () => {
  const { ours, golden } = renderFixture('colored-arrow-label');

  it('draws a feFlood/feComposite filter, never a RED background rect (SvgGraphics.java:772-786)', () => {
    expect(ours).toContain('<feFlood flood-color="#FF0000"');
    expect(ours).toContain('<feComposite in="SourceGraphic" in2="flood" operator="over"/>');
    // The OLD pill mechanism (pre-T1b) drew a `<rect ... fill="red">` --
    // every `<rect>` here must be the unrelated A/B action boxes
    // (`fill="#F1F1F1"`), never the label's own colour.
    expect(ours).not.toContain('fill="red"');
    expect(golden).not.toContain('fill="red"');
  });

  it('"hello" carries filter="url(#...)" on the <text> itself, matching the jar\'s own shape', () => {
    expect(ours).toMatch(/<text[^>]*filter="url\(#[^)]+\)"[^>]*>hello<\/text>/);
    expect(golden).toMatch(/<text[^>]*filter="url\(#[^)]+\)"[^>]*>hello<\/text>/);
  });

  it('"hello" x matches the jar exactly; canvas size unchanged by the colour', () => {
    expect(textPosition(ours, 'hello').x).toBe(textPosition(golden, 'hello').x);
    expect(attr(ours, 'width')).toBe(attr(golden, 'width'));
    expect(attr(ours, 'height')).toBe(attr(golden, 'height'));
  });
});

describe('generic -> label; -- label-before-repeat (FtileRepeat ConnectionIn, row 6)', () => {
  const { ours, golden } = renderFixture('label-before-repeat');

  it('canvas width/height match the jar exactly', () => {
    expect(attr(ours, 'width')).toBe(attr(golden, 'width'));
    expect(attr(ours, 'height')).toBe(attr(golden, 'height'));
  });

  it('"hello" x matches the jar exactly, drawn exactly once', () => {
    expect(textPosition(ours, 'hello').x).toBe(textPosition(golden, 'hello').x);
    expect(textOccurrences(ours, 'hello')).toBe(1);
    expect(textOccurrences(golden, 'hello')).toBe(1);
  });
});

describe('generic -> label; -- label-after-endif (the merge-diamond\'s own out edge)', () => {
  const { ours, golden } = renderFixture('label-after-endif');

  it('canvas width/height match the jar exactly', () => {
    expect(attr(ours, 'width')).toBe(attr(golden, 'width'));
    expect(attr(ours, 'height')).toBe(attr(golden, 'height'));
  });

  it('"hello" x matches the jar exactly -- the SAME generic mechanism as a top-level label, no if-specific wiring needed', () => {
    expect(textPosition(ours, 'hello').x).toBe(textPosition(golden, 'hello').x);
  });
});

/**
 * T1b pass 2: `ParallelBuilderFork$ConnectionIn` (rows 19/20) -- a `->
 * label;` right after `fork`, read off the FIRST branch's own entry
 * edge only (`fork again`'s branch carries no label in this fixture).
 */
describe('generic -> label; -- label-in-fork (ParallelBuilderFork ConnectionIn, rows 19/20)', () => {
  const { ours, golden } = renderFixture('label-in-fork');

  it('"hello" drawn exactly once (first branch only), x matches the jar exactly', () => {
    expect(textOccurrences(ours, 'hello')).toBe(1);
    expect(textOccurrences(golden, 'hello')).toBe(1);
    expect(textPosition(ours, 'hello').x).toBe(textPosition(golden, 'hello').x);
  });

  // `ParallelBuilderFork`'s own bar-to-branch gap height reservation is a
  // SEPARATE constant from `FtileFactoryDelegatorAssembly`'s generic
  // 35px/label-height term (`tiles/gtile-top-down.ts#sequentialGap`) --
  // NOT extended for a label this pass (`.agent-notes/add3-T1b.md`), so
  // canvas size here is a KNOWN, documented residual, not jar-equal.
  it('canvas size is a known residual (fork-specific gap, not re-derived this pass)', () => {
    expect(attr(ours, 'width')).not.toBe(attr(golden, 'width'));
  });
});
