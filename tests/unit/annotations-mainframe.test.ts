/**
 * Unit tests for `mainframe` rendering (cdd-T34, E14) — mission G0b's own
 * T9 escape hatch is CLOSED by this task: `DiagramChromeFactory
 * .decorateWithFrame` + `BigFrame` (`klimt/shape/BigFrame.java`) are now
 * ported (`core/klimt/shape/big-frame.ts`, `chrome.ts#addMainframe`).
 * `plans/g0b-annotations/decisions.md` D9's "deferred whole" is superseded;
 * `DIVERGENCES.md`'s "mainframe <label> — parsed, not yet rendered" entry
 * is stale and should be dropped by this task's close.
 *
 * @see ~/git/plantuml/.../core/DiagramChromeFactory.java:275-336 (decorateWithFrame)
 * @see ~/git/plantuml/.../klimt/shape/BigFrame.java
 */
import { describe, it, expect } from 'vitest';
import { applyChrome, type AnnotationStyles } from '../../src/core/annotations/chrome.js';
import { createAnnotations, setMainFrame, singleDisplayPositioned, isEmpty } from '../../src/core/annotations/index.js';
import type { AnnotationBoxStyle, AnnotationElement } from '../../src/core/annotations/style.js';
import type { RenderFragment } from '../../src/core/dispatcher.js';
import { FixedMeasurer } from '../../src/core/measurer.js';

const MEASURER = new FixedMeasurer(10, 10);

const PLAIN_STYLE: AnnotationBoxStyle = {
  fontSize: 14,
  fontStyle: 'plain',
  fontColor: 'black',
  fontFamily: 'SansSerif',
  backgroundColor: null,
  lineColor: null,
  roundCorner: 0,
  lineThickness: 1, // G2 N50: root{}'s LineThickness 1.0 default
  documentBackground: '#FFFFFF', // G2 N51: default canvas background
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  horizontalAlignment: 'LEFT',
};

// cdd-T34: mainframe's own real defaults (plantuml.skin:85-89) rather than
// PLAIN_STYLE's all-zero padding/margin/null-color stand-in — the geometry
// assertions below need real numbers to check against.
const MAINFRAME_STYLE: AnnotationBoxStyle = {
  ...PLAIN_STYLE,
  lineColor: '#181818',
  lineThickness: 1.5,
  padding: { top: 1, right: 5, bottom: 1, left: 5 },
  margin: { top: 10, right: 5, bottom: 10, left: 5 },
};

function plainStyles(): AnnotationStyles {
  const elements: AnnotationElement[] = ['title', 'caption', 'header', 'footer', 'legend', 'mainframe'];
  const result = {} as AnnotationStyles;
  for (const el of elements) {
    const base = el === 'mainframe' ? MAINFRAME_STYLE : PLAIN_STYLE;
    result[el] = { ...base, padding: { ...base.padding }, margin: { ...base.margin } };
  }
  return result;
}

function makeFragment(width: number, height: number, body = '<rect id="BODY"/>'): RenderFragment {
  return { body, width, height, background: '#FFFFFF', extraDefs: '<marker/>' };
}

describe('mainframe — parsing + isEmpty (unaffected by cdd-T34)', () => {
  it('a mainframe-only annotations bag is NOT isEmpty (chrome still runs)', () => {
    const annotations = createAnnotations();
    setMainFrame(annotations, singleDisplayPositioned(['demo'], null, null, 0));
    expect(isEmpty(annotations)).toBe(false);
  });

  it('byte-stability: applyChrome returns the SAME fragment object when no annotations are present at all', () => {
    const fragment = makeFragment(70, 107);
    const result = applyChrome(fragment, createAnnotations(), plainStyles(), MEASURER);
    expect(result).toBe(fragment);
  });
});

describe('mainframe — drawn via BigFrame (cdd-T34)', () => {
  it('wraps the original body in a frame + folder-tab title, growing width/height', () => {
    const annotations = createAnnotations();
    setMainFrame(annotations, singleDisplayPositioned(['demo'], null, null, 0));
    const fragment = makeFragment(70, 107);

    const result = applyChrome(fragment, annotations, plainStyles(), MEASURER);

    expect(result.body).not.toBe(fragment.body);
    expect(result.body).toContain('<rect id="BODY"/>');
    expect(result.width).toBeGreaterThan(fragment.width);
    expect(result.height).toBeGreaterThan(fragment.height);
  });

  it('draws the frame rect, the folder-tab cutout path, and the title text BEFORE the original body', () => {
    const annotations = createAnnotations();
    setMainFrame(annotations, singleDisplayPositioned(['demo'], null, null, 0));
    const fragment = makeFragment(70, 107);

    const result = applyChrome(fragment, annotations, plainStyles(), MEASURER);

    const rectIndex = result.body.indexOf('<rect');
    const pathIndex = result.body.indexOf('<path');
    const textIndex = result.body.indexOf('<text');
    const bodyIndex = result.body.indexOf('<rect id="BODY"/>');
    expect(rectIndex).toBeGreaterThanOrEqual(0);
    expect(pathIndex).toBeGreaterThan(rectIndex);
    expect(textIndex).toBeGreaterThan(pathIndex);
    expect(bodyIndex).toBeGreaterThan(textIndex);
  });

  it('applyChrome preserves background/extraDefs (spread-through, decisions.md D5 shape)', () => {
    const annotations = createAnnotations();
    setMainFrame(annotations, singleDisplayPositioned(['demo'], null, null, 0));
    const fragment = makeFragment(70, 107);

    const result = applyChrome(fragment, annotations, plainStyles(), MEASURER);

    expect(result.background).toBe('#FFFFFF');
    expect(result.extraDefs).toBe('<marker/>');
  });

  it('the outer margin is baked into every drawn coordinate (frame rect starts at margin.left/top)', () => {
    const annotations = createAnnotations();
    setMainFrame(annotations, singleDisplayPositioned(['demo'], null, null, 0));
    const fragment = makeFragment(70, 107);

    const result = applyChrome(fragment, annotations, plainStyles(), MEASURER);

    // MAINFRAME_STYLE.margin = {top: 10, left: 5} -- BigFrame.java:296-303's
    // `margin.getTranslate()`, the same offset `jakaja-15-faze022`'s real
    // oracle rect carries (`x="5" y="10"`).
    expect(result.body).toContain('<rect x="5" y="10"');
  });
});
