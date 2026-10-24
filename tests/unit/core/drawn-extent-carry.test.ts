/**
 * sdd3-T8g -- the drawn fold (`SvgGraphics.java:129-135`, `ensureVisible`) rides
 * with the body wherever the body is shifted, and the finalizer takes the
 * larger of the seed composed from chrome and margin and that fold.
 *
 * `RenderFragment.drawnMaxX/drawnMaxY` are INTERNAL: the page graphic's own
 * `maxX`/`maxY` (`sequence/renderer-ug.ts#SequenceFinish`), in the coordinates
 * of `body`. A shift of the body by `(dx, dy)` is a shift of the fold by the
 * same amount, exactly as `UGraphic#apply(UTranslate)` moves every coordinate
 * `ensureVisible` later sees.
 */
import { describe, it, expect } from 'vitest';
import { assembleSvg } from '../../../src/core/assemble-svg.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';
import {
  applyDocumentMargin,
  removeDocumentMargin,
  SEQUENCE_DOCUMENT_MARGIN,
} from '../../../src/core/document-margin.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { withWarningBanner } from '../../../src/core/skinparam-warnings.js';
import { Warning } from '../../../src/core/warning/Warning.js';

const BODY = '<line x1="1" y1="2" x2="3" y2="4"/>';
const WARNING = "Please use '!option handwritten true' to enable handwritten ";

/** kaluna-08-rubu301: exportedDimension 295.7875 x 340 (journal row 34 / `drawn-extent.md`), so the seed is
 *  trunc(295.7875 + 1) = 296 and the sprite arc's `ensureVisible(252.894 + 110)` makes the canvas 363
 *  (`SvgGraphics.java:854`). */
const KALUNA: RenderFragment = {
  body: BODY,
  width: 296,
  height: 341,
  preChromeWidth: 285.7875,
  preChromeHeight: 330,
  diagramType: 'SEQUENCE',
};

function viewBoxOf(svg: string): [number, number] {
  const m = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  if (m === null) throw new Error('no viewBox');
  return [Number(m[1]), Number(m[2])];
}

describe('finalizeSequenceFragment: max(seed composed from chrome and margin, drawn fold)', () => {
  it('a fold past the seed grows the canvas (kaluna: trunc(252.894 + 110 + 1) = 363)', () => {
    const svg = assembleSvg({ ...KALUNA, drawnMaxX: 363, drawnMaxY: 341 });
    expect(viewBoxOf(svg)).toEqual([363, 341]);
  });

  it('gebeki: scale 2 multiplies the unscaled fold, 230 x 2 = 460 (SvgGraphics.java:800-813)', () => {
    const svg = assembleSvg({
      body: BODY,
      width: 229,
      height: 182,
      preChromeWidth: 218.625,
      preChromeHeight: 171,
      scaleSpec: { kind: 'simple', factor: 2 },
      diagramType: 'SEQUENCE',
      drawnMaxX: 230,
      drawnMaxY: 182,
    });
    expect(viewBoxOf(svg)).toEqual([460, 364]);
  });

  it('a fold equal to the seed leaves the canvas at the seed (chrome row, no change)', () => {
    const plain = viewBoxOf(assembleSvg(KALUNA));
    expect(plain).toEqual([296, 341]);
    expect(viewBoxOf(assembleSvg({ ...KALUNA, drawnMaxX: 296, drawnMaxY: 341 }))).toEqual(plain);
  });

  it('a fold BELOW the seed never shrinks the canvas', () => {
    expect(viewBoxOf(assembleSvg({ ...KALUNA, drawnMaxX: 100, drawnMaxY: 100 }))).toEqual([296, 341]);
  });

  it('the fold is truncated like every canvas side (ensureVisible stores (int)(x + 1))', () => {
    expect(viewBoxOf(assembleSvg({ ...KALUNA, drawnMaxX: 363.9, drawnMaxY: 341.4 }))).toEqual([363, 341]);
  });
});

describe('the fold is shifted wherever the body is', () => {
  const folded: RenderFragment = { ...KALUNA, drawnMaxX: 363, drawnMaxY: 341 };

  it('removeDocumentMargin / applyDocumentMargin move it by -(left, top) / +(left, top)', () => {
    const block = removeDocumentMargin(folded, SEQUENCE_DOCUMENT_MARGIN);
    expect([block.drawnMaxX, block.drawnMaxY]).toEqual([358, 336]);
    const back = applyDocumentMargin(block, SEQUENCE_DOCUMENT_MARGIN);
    expect([back.drawnMaxX, back.drawnMaxY]).toEqual([363, 341]);
  });

  it('a fragment without a fold gains none', () => {
    const block = removeDocumentMargin(KALUNA, SEQUENCE_DOCUMENT_MARGIN);
    expect('drawnMaxX' in block).toBe(false);
    expect('drawnMaxY' in block).toBe(false);
  });

  it('the warning banner moves the body down by its height, so the fold moves down with it', () => {
    const measurer = new DeterministicMeasurer();
    const without = withWarningBanner(KALUNA, [new Warning(WARNING)], measurer, SEQUENCE_DOCUMENT_MARGIN, 'carry');
    const bannerH = (without.preChromeHeight ?? 0) - (KALUNA.preChromeHeight ?? 0);
    expect(bannerH).toBeGreaterThan(0);
    const withFold = withWarningBanner(folded, [new Warning(WARNING)], measurer, SEQUENCE_DOCUMENT_MARGIN, 'carry');
    expect(withFold.drawnMaxX).toBe(363);
    expect(withFold.drawnMaxY).toBe(341 + bannerH);
  });

  it('no warning: the very same fragment, fold untouched', () => {
    const measurer = new DeterministicMeasurer();
    expect(withWarningBanner(folded, [], measurer, SEQUENCE_DOCUMENT_MARGIN, 'carry')).toBe(folded);
  });
});
