/**
 * lgm-T1a: the mainframe (and the chrome around it) sized from the block
 * `DiagramChromeFactory.create` is given, the document margin applied after
 * (`UgDiagram#getExporter`, `UgDiagram.java:124-128`;
 * `TextBlockExporter#calculateFinalDimension`, `:199-203`), on every engine
 * that hands chrome a block whose ink this port can recover.
 *
 * Every `.svg` beside its `.puml` in `tests/fixtures/lgm-T1a/` is a
 * `scripts/oracle-render.sh` render. The sequence engine still differs from
 * the jar on four unrelated style attributes of its own participant/lifeline
 * drawing (`stroke-width`, `rx`/`ry`, a lifeline `stroke-dasharray`); they
 * are listed in {@link SEQUENCE_STYLE_NOISE} so a geometry or chrome
 * regression cannot hide behind them -- every other diff, and every diff on
 * the frame rect / folder tab / title text, fails the test.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg, type Diff } from './compare.js';
import { renderFixtureClass } from './render-fixture-class.js';
import { renderFixtureSequence } from './render-fixture-sequence.js';

const DIR = 'tests/fixtures/lgm-T1a';

function diffsOf(name: string): readonly Diff[] {
  const read = (ext: string) => readFileSync(join(DIR, `${name}.${ext}`), 'utf8');
  const ours = renderSync(read('puml'), { measurer: new DeterministicMeasurer() });
  return compareSvg(ours, read('svg'), 'deterministic').diffs;
}

/** Attributes the sequence engine's own participant/lifeline drawing still
 *  gets wrong, independent of chrome (present in the no-chrome baseline). */
const SEQUENCE_STYLE_NOISE = /\/@(stroke-width|rx|ry|stroke-dasharray)$/;
/** The mainframe's three drawn parts, in the jar's draw order: border rect,
 *  folder-tab path, title text -- the first of each under the content group. */
const FRAME_PART = /^svg\/g\[1\]\/(rect|path|text)\[1\]\//;
const ROOT_ATTR = /^svg\/@/;

const EXACT: readonly string[] = [
  'act-frame',
  'act-frame-all',
  'class-frame',
  'json-frame',
  'mindmap-frame',
  'object-frame',
];

const SEQUENCE_FRAME: readonly string[] = [
  'seq-frame',
  'seq-frame-teoz',
  'seq-frame-all',
  'seq-frame-long-title',
  'seq-frame-note-group',
  'seq-frame-style',
];

const SEQUENCE_CHROME: readonly string[] = ['seq-title-only', 'seq-legend-only', 'seq-header-footer'];

describe('lgm-T1a: engines that equal the jar render outright', () => {
  it.each(EXACT)('%s', (name) => {
    expect(diffsOf(name)).toEqual([]);
  });
});

describe('lgm-T1a: sequence mainframe -- canvas, frame rect, tab and title equal the jar', () => {
  it.each(SEQUENCE_FRAME)('%s', (name) => {
    const diffs = diffsOf(name);
    expect(diffs.filter((d) => ROOT_ATTR.test(d.path))).toEqual([]);
    expect(diffs.filter((d) => FRAME_PART.test(d.path))).toEqual([]);
    expect(diffs.filter((d) => !SEQUENCE_STYLE_NOISE.test(d.path))).toEqual([]);
  });
});

describe('lgm-T1a: sequence title/legend/header/footer are sized from the margin-less block', () => {
  it.each(SEQUENCE_CHROME)('%s', (name) => {
    const diffs = diffsOf(name);
    expect(diffs.filter((d) => ROOT_ATTR.test(d.path))).toEqual([]);
    expect(diffs.filter((d) => !SEQUENCE_STYLE_NOISE.test(d.path))).toEqual([]);
  });
});

describe('lgm-T1a: the conformance harnesses compose chrome as production does', () => {
  const MEASURER = new DeterministicMeasurer();
  const source = (name: string): string => readFileSync(join(DIR, `${name}.puml`), 'utf8');

  it.each(['seq-frame-all', 'seq-frame-style', 'seq-title-only'])('%s: renderFixtureSequence === renderSync', (name) => {
    expect(renderFixtureSequence(source(name), MEASURER)).toBe(renderSync(source(name), { measurer: MEASURER }));
  });

  it('class-frame: renderFixtureClass === renderSync', () => {
    expect(renderFixtureClass(source('class-frame'), MEASURER)).toBe(
      renderSync(source('class-frame'), { measurer: MEASURER }),
    );
  });
});

// The svek family (state, description) draws the framed `SvekResult` in the
// raw svek frame -- `decorateWithFrame` never calls its `calculateDimension`,
// so `moveDelta(6 - minX, 6 - minY)` (`svek/SvekResult.java:130-135`) does not
// run -- while these engines draw the normalized body. Class mirrors that in
// its own layout (`class/layout-ink-extent.ts#mainframePlacement`); state and
// description do not yet, so the frame rect is the wrong size. Flip these to
// the EXACT list when they are ported: a test that starts failing here is the
// good news.
describe('lgm-T1a: open -- state and description mainframe (raw svek frame)', () => {
  it.each(['state-frame', 'component-frame', 'usecase-frame'])('%s: the frame rect is still the wrong size', (name) => {
    const frameWidth = diffsOf(name).filter((d) => d.path === 'svg/g[1]/rect[1]/@width');
    expect(frameWidth).toHaveLength(1);
  });
});
