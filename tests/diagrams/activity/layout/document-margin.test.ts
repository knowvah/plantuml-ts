/**
 * Unit tests for `applyActivityDocumentMargin`/`applyActivityChrome`
 * (src/diagrams/activity/layout/document-margin.ts) — T3j (mission
 * `activity-divergence-drive`, journal row 36).
 *
 * `TitledDiagram#getDefaultMargins()` returns the symmetric `same(10)`
 * (`TitledDiagram.java:275`), unlike `CucaDiagram`'s asymmetric `(0,5,5,0)`
 * class uses — so the composed body must be SHIFTED by the margin, not
 * merely padded (`TextBlockExporter.java:159-203`): `DiagramChromeFactory
 * .create` wraps the RAW (`Recentred`-only) body, and the document margin
 * wraps the fully chrome-decorated result, afterward.
 */
import { describe, it, expect } from 'vitest';
import {
  applyActivityDocumentMargin,
  applyActivityChrome,
} from '../../../../src/diagrams/activity/layout/document-margin.js';
import type { AnnotationStyles } from '../../../../src/core/annotations/chrome.js';
import {
  createAnnotations,
  setTitle,
  singleDisplayPositioned,
  type DiagramAnnotations,
} from '../../../../src/core/annotations/index.js';
import type { AnnotationBoxStyle, AnnotationElement } from '../../../../src/core/annotations/style.js';
import type { RenderFragment } from '../../../../src/core/dispatcher.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { VerticalAlignment } from '../../../../src/core/klimt/geom/VerticalAlignment.js';
import { FixedMeasurer } from '../../../../src/core/measurer.js';

const MEASURER = new FixedMeasurer(10, 10); // 10px/char, matches annotations-chrome.test.ts's convention.
const BODY_MARKER = '<rect id="BODY_MARKER" x="0" y="0"/>';
const ONE_LINE_BLOCK_HEIGHT = 10 + 1; // fontSize 10 + BORDERED_DIMENSION_QUIRK(1) -- same derivation as annotations-chrome.test.ts.

function shiftedBodyMarker(dx: number, dy: number): string {
  return `<rect id="BODY_MARKER" x="${dx}" y="${dy}"/>`;
}

function plainStyle(overrides: Partial<AnnotationBoxStyle> = {}): AnnotationBoxStyle {
  return {
    fontSize: 10,
    fontStyle: 'plain',
    fontColor: '#000000',
    fontFamily: 'sans-serif',
    backgroundColor: null,
    lineColor: null,
    roundCorner: 0,
    lineThickness: 1,
    documentBackground: '#FFFFFF',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    horizontalAlignment: HorizontalAlignment.CENTER,
    ...overrides,
  };
}

function plainStyles(): AnnotationStyles {
  const elements: AnnotationElement[] = ['title', 'caption', 'header', 'footer', 'legend', 'mainframe'];
  const result = {} as AnnotationStyles;
  for (const el of elements) result[el] = plainStyle();
  return result;
}

function withTitle(text: string): DiagramAnnotations {
  const a = createAnnotations();
  setTitle(a, singleDisplayPositioned([text], HorizontalAlignment.CENTER, VerticalAlignment.TOP, 0));
  return a;
}

/** `preChromeWidth`/`preChromeHeight` set, mirroring `renderer.ts
 *  #renderActivity`'s own (margin-included `width`/`height` plus the RAW,
 *  pre-margin `preChromeWidth`/`preChromeHeight` pair `preChromeDims`
 *  derives from them). */
function makeActivityFragment(rawWidth: number, rawHeight: number, body = BODY_MARKER): RenderFragment {
  const ACTIVITY_MARGIN_TOTAL = 21; // 2 * ACTIVITY_DOCUMENT_MARGIN(10) + SVG_CANVAS_CEIL(1).
  return {
    body,
    width: rawWidth + ACTIVITY_MARGIN_TOTAL,
    height: rawHeight + ACTIVITY_MARGIN_TOTAL,
    diagramType: 'ACTIVITY',
    preChromeWidth: rawWidth,
    preChromeHeight: rawHeight,
  };
}

// ---------------------------------------------------------------------------
// applyActivityDocumentMargin — the TextBlockExporter margin recipe alone
// ---------------------------------------------------------------------------

describe('applyActivityDocumentMargin', () => {
  it('shifts the body by (10,10) and pads width/height by 21 (2*margin + ensureVisible)', () => {
    const fragment: RenderFragment = { body: BODY_MARKER, width: 100, height: 50 };
    const result = applyActivityDocumentMargin(fragment);
    expect(result.body).toBe(shiftedBodyMarker(10, 10));
    expect(result.width).toBe(121);
    expect(result.height).toBe(71);
  });

  it('floors a fractional chrome-composed width/height (SvgGraphics#ensureVisible)', () => {
    const fragment: RenderFragment = { body: BODY_MARKER, width: 100.6, height: 50.2 };
    const result = applyActivityDocumentMargin(fragment);
    // floor(100.6 + 21) = 121, floor(50.2 + 21) = 71.
    expect(result.width).toBe(121);
    expect(result.height).toBe(71);
  });
});

// ---------------------------------------------------------------------------
// applyActivityChrome — undo margin, compose chrome around the RAW body,
// re-apply margin to chrome's own (still raw-based) result.
// ---------------------------------------------------------------------------

describe('applyActivityChrome', () => {
  it('narrower title: body dominates — final width is the margined RAW width, body shifts by exactly the chrome offset', () => {
    // RAW body 100x50; margined fragment (what renderer.ts hands in) is 121x71.
    // `makeActivityFragment`'s body marker sits at (0,0) -- the "undo
    // margin" (-10,-10) and "re-apply margin" (+10,+10) this function does
    // are an exact additive round trip on a translation, so they cancel:
    // the NET body shift observed here is exactly chrome's own (xImage,
    // yImage), not a separate +10 on top -- this IS the mechanism working
    // (a body already sitting at the MARGINED position, as renderer.ts's
    // real output does, nets the identical (xImage, yImage) relative move).
    const fragment = makeActivityFragment(100, 50);
    const result = applyActivityChrome(fragment, withTitle('T'), plainStyles(), MEASURER, undefined);
    // Title block ('T' at 10px/char + 1px quirk = 11) narrower than the RAW
    // body (100) -- chrome's own dimTotal.width stays 100 (`mergeTB`'s
    // width = max), so xImage = (100-100)/2 = 0; yImage = the title's own
    // height.
    expect(result.body).toContain(shiftedBodyMarker(0, ONE_LINE_BLOCK_HEIGHT));
    // width: raw chrome width (100) + 21; height: raw (50 + title height) + 21.
    expect(result.width).toBe(121);
    expect(result.height).toBe(50 + ONE_LINE_BLOCK_HEIGHT + 21);
  });

  it('wider title: title dominates — final width grows to the (margined) title width, body re-centred', () => {
    // RAW body 20x50 (much narrower than the title block below).
    const fragment = makeActivityFragment(20, 50);
    // 14 chars * 10px/char = 140 -> titleBlock width 141 (quirk +1), wider than the RAW body (20).
    const result = applyActivityChrome(fragment, withTitle('AAAAAAAAAAAAAA'), plainStyles(), MEASURER, undefined);
    const titleWidth = 140 + 1;
    const xImage = (titleWidth - 20) / 2;
    expect(result.width).toBe(titleWidth + 21);
    expect(result.height).toBe(50 + ONE_LINE_BLOCK_HEIGHT + 21);
    // Net body shift is chrome's own (xImage, yImage) -- see the previous
    // test's comment for why the undo/re-apply margin steps cancel here.
    expect(result.body).toContain(shiftedBodyMarker(xImage, ONE_LINE_BLOCK_HEIGHT));
  });

  it('round-trips to a no-op shift when annotations are empty (undo margin, no-op chrome, re-apply margin)', () => {
    const fragment = makeActivityFragment(100, 50);
    const result = applyActivityChrome(fragment, createAnnotations(), plainStyles(), MEASURER, undefined);
    // `applyChrome` no-ops on empty annotations, so undoing then re-applying
    // the SAME (10,10) margin shift is an exact round trip.
    expect(result.body).toBe(fragment.body);
    expect(result.width).toBe(fragment.width);
    expect(result.height).toBe(fragment.height);
  });
});
