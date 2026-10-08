/**
 * unwind2-S4: the `...` delay's ink, pinned against jar renders.
 *
 * A delay is a `DelayTile` (`teoz/DelayTile.java`) that draws its
 * `DELAY_TEXT` and registers its span on every living space (`:108`).
 * `MutingLine#drawLine` (`teoz/MutingLine.java:73-92`) then cuts every
 * lifeline into `PARTICIPANT_LINE` pieces (titled groups, dash 5,5) and
 * `DELAY_LINE` pieces (bare lines, dash 1,4), and `LiveBoxesDrawer
 * #doDrawing` (`teoz/LiveBoxesDrawer.java:105-121`) cuts every activation bar
 * at the same spans.
 *
 * Each `tests/fixtures/unwind2-S4/delay-*.puml` sits beside the jar's own
 * page images, rendered by `scripts/oracle-render.sh` (deterministic text).
 * The sequence engine is not yet `compareSvg`-conformant (diff-baseline
 * ratchet), so this pins the geometry the delay owns: every dashed lifeline
 * piece, every 11pt delay text, every activation piece and the image height.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderPagesSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/unwind2-S4');

const RE_LINE = /<line ([^>]*)\/>/g;
const RE_DASH = /stroke-dasharray(?:="|:)([\d.,]+)/;
const RE_DELAY_TEXT = /<text ([^>]*font-size="11"[^>]*)>([^<]*)<\/text>/g;
const RE_ACTIVATION = /<g><title><\/title><rect ([^>]*)\/>((?:<line [^>]*\/>)*)<\/g>/g;
const RE_HEIGHT = /height="(\d+)px"/;

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
}

interface DelayInk {
  height: string | undefined;
  lifelinePieces: string[];
  delayTexts: string[];
  activationPieces: string[];
}

/** `withX` is false where the engine's activation x layout (not the delay)
 *  still diverges from the jar, so only the y axis is the delay's to pin. */
function inkOf(svg: string, withX: boolean): DelayInk {
  const x = (tag: string, name: string): string => (withX ? `${attr(tag, name)},` : '');
  return {
    height: RE_HEIGHT.exec(svg)?.[1],
    lifelinePieces: [...svg.matchAll(RE_LINE)]
      .map((m) => ({ tag: m[1]!, dash: RE_DASH.exec(m[1]!)?.[1] }))
      // Vertical only: a dashed `-->` shaft is horizontal and not the delay's.
      .filter((l) => (l.dash === '5,5' || l.dash === '1,4') && attr(l.tag, 'x1') === attr(l.tag, 'x2'))
      .map((l) => `${x(l.tag, 'x1')}${attr(l.tag, 'y1')},${attr(l.tag, 'y2')},${l.dash}`),
    delayTexts: [...svg.matchAll(RE_DELAY_TEXT)].map((m) => `${x(m[1]!, 'x')}${attr(m[1]!, 'y')},${m[2]}`),
    activationPieces: [...svg.matchAll(RE_ACTIVATION)].map(
      (m) => `${attr(m[1]!, 'y')},${attr(m[1]!, 'height')},${(m[2]!.match(/<line /g) ?? []).length}`,
    ),
  };
}

function jarPage(name: string, index: number): string {
  const suffix = index === 0 ? '' : `_${String(index).padStart(3, '0')}`;
  return readFileSync(join(FIXTURES, `${name}${suffix}.svg`), 'utf-8');
}

function ourPages(name: string): string[] {
  const source = readFileSync(join(FIXTURES, `${name}.puml`), 'utf-8');
  return renderPagesSync(source, { measurer: new WidthTableMeasurer() });
}

function expectDelayInkLikeJar(name: string, pageCount: number, withX = true): void {
  const pages = ourPages(name);
  expect(pages).toHaveLength(pageCount);
  pages.forEach((ours, i) => {
    expect(inkOf(ours, withX)).toEqual(inkOf(jarPage(name, i), withX));
  });
}

describe('unwind2-S4: delay ink matches the jar', () => {
  it('a bare `...` cuts every lifeline and reserves 28', () => {
    expectDelayInkLikeJar('delay-bare', 1);
  });

  it('`......` is a bare delay too (TextBlockEmpty)', () => {
    expectDelayInkLikeJar('delay-empty-label', 1);
  });

  it('`...text...` draws centred 11pt text and widens the diagram', () => {
    expectDelayInkLikeJar('delay-text', 1);
  });

  it('a multi-line label centres each line in the block', () => {
    expectDelayInkLikeJar('delay-multiline', 1);
  });

  it('delays across a newpage boundary are clipped like the jar', () => {
    expectDelayInkLikeJar('delay-newpage', 2);
  });

  it('activation bars are cut open at each delay', () => {
    expectDelayInkLikeJar('delay-activation', 1, false);
    // Bob's bar in three pieces (CLOSE_OPEN, OPEN_OPEN, OPEN_CLOSE: 3, 2, 3
    // lines) and Carol's in two (CLOSE_OPEN, OPEN_CLOSE).
    expect(inkOf(ourPages('delay-activation')[0]!, false).activationPieces).toEqual([
      '66,35,3',
      '129,27,2',
      '195,19,3',
      '93,8,3',
      '129,19,3',
    ]);
  });

  // The jar's own numbers for the bare form: a 28-tall `DELAY_LINE` between
  // two titled `PARTICIPANT_LINE` pieces, on each participant.
  it('states the bare delay pieces', () => {
    const ink = inkOf(ourPages('delay-bare')[0]!, false);
    expect(ink.lifelinePieces).toEqual([
      '39,74,5,5',
      '74,102,1,4',
      '102,139,5,5',
      '39,74,5,5',
      '74,102,1,4',
      '102,139,5,5',
    ]);
  });
});
