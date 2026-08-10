/**
 * T5b — `assembleClassShell`'s two splice sites (`documentBackgroundRect`,
 * G2 N48; `diagramBorderColor`, G2 N66) must keep finding the outer `<g>`
 * now that the SVG-size-reduction port (rule 3) puts
 * `font-family="sans-serif" lengthAdjust="spacing"` on the document's root
 * `<g>`.
 *
 * Both sites used to match the literal `'<g>'` and fall back to returning
 * the body UNCHANGED when it did not match — a silent no-op that drops the
 * document background rect (and the diagram border) with no error at all.
 * Every test below feeds a body whose outer `<g>` ALREADY carries the root
 * attributes, which is exactly the input the literal marker would miss, so
 * these fail loudly against the old code rather than passing vacuously.
 */
import { describe, it, expect } from 'vitest';
import type { RenderFragment } from '../../../src/core/dispatcher.js';
import { assembleClassShell } from '../../../src/diagrams/class/renderer-shell.js';
import { ROOT_GROUP_OPEN, rect } from '../../../src/core/svg.js';
import {
  applyClassDocumentMargin,
  computeClassBorderRectDims,
} from '../../../src/diagrams/class/layout-ink-extent.js';

const INNER = '<text x="1" y="2">A</text>';
const RAW_DIMS = { width: 60, height: 40 };
const FINAL_DIMS = applyClassDocumentMargin(RAW_DIMS);
/** `UStroke.simple()`'s thickness — `renderer-shell.ts`'s own constant. */
const BORDER_THICKNESS = 1;

/** A chrome-decorated fragment: `applyChrome` already wrapped the body, so
 *  `assembleClassShell` splices into THAT `<g>` rather than adding one.
 *  Wrapped with the attributed root tag on purpose (see module comment). */
function chromedFragment(overrides: Partial<RenderFragment> = {}): RenderFragment {
  return {
    body: ROOT_GROUP_OPEN + INNER + '</g>',
    width: FINAL_DIMS.width,
    height: FINAL_DIMS.height,
    preChromeWidth: RAW_DIMS.width,
    preChromeHeight: RAW_DIMS.height,
    bodyWrapped: true,
    classShell: true,
    ...overrides,
  };
}

/** The root `<g>`'s children, up to (not including) the closing `</svg>`. */
function rootGroupChildren(svg: string): string {
  const start = svg.indexOf(ROOT_GROUP_OPEN);
  expect(start).toBeGreaterThan(-1);
  return svg.slice(start + ROOT_GROUP_OPEN.length, svg.lastIndexOf('</g>'));
}

describe('assembleClassShell — root <g> shape', () => {
  it('emits the jar’s root <g> as the first element after <defs>', () => {
    const svg = assembleClassShell(chromedFragment());
    expect(svg).toContain('<defs/><g font-family="sans-serif" lengthAdjust="spacing">');
  });

  it('wraps an UNwrapped body in that same root <g>', () => {
    const svg = assembleClassShell({
      body: INNER,
      width: FINAL_DIMS.width,
      height: FINAL_DIMS.height,
      classShell: true,
    });
    expect(svg).toContain('<defs/>' + ROOT_GROUP_OPEN + INNER + '</g>');
  });
});

describe('assembleClassShell — documentBackgroundRect splice (G2 N48)', () => {
  it('splices the background rect as the root <g>’s FIRST child', () => {
    const svg = assembleClassShell(chromedFragment({ documentBackgroundRect: '#EEEEEE' }));
    const bgRect = rect(0, 0, FINAL_DIMS.width, FINAL_DIMS.height, {
      fill: '#EEEEEE',
      stroke: 'none',
      strokeWidth: 1,
    });
    expect(rootGroupChildren(svg)).toBe(bgRect + INNER);
  });

  it('splices it for an unwrapped body too', () => {
    const svg = assembleClassShell({
      body: INNER,
      width: FINAL_DIMS.width,
      height: FINAL_DIMS.height,
      documentBackgroundRect: '#EEEEEE',
      classShell: true,
    });
    expect(rootGroupChildren(svg)).toMatch(/^<rect x="0" y="0"/);
  });

  it('draws no background rect when the fragment carries none', () => {
    expect(assembleClassShell(chromedFragment())).not.toContain('<rect x="0" y="0"');
  });
});

describe('assembleClassShell — diagramBorderColor splice (G2 N66)', () => {
  it('splices the border rect as the root <g>’s FIRST child', () => {
    const svg = assembleClassShell(chromedFragment({ diagramBorderColor: '#FF0000' }));
    const border = computeClassBorderRectDims(RAW_DIMS, BORDER_THICKNESS);
    const borderRect = rect(0, 0, border.width, border.height, {
      fill: 'none',
      stroke: '#FF0000',
      strokeWidth: BORDER_THICKNESS,
    });
    expect(rootGroupChildren(svg)).toBe(borderRect + INNER);
  });

  it('puts the border rect BEFORE the background rect (drawn first)', () => {
    const svg = assembleClassShell(
      chromedFragment({ diagramBorderColor: '#FF0000', documentBackgroundRect: '#EEEEEE' }),
    );
    expect(rootGroupChildren(svg)).toMatch(/^<rect [^>]*fill="none"[^>]*\/><rect /);
  });

  it('still no-ops when chrome inflated the canvas past the class body', () => {
    const svg = assembleClassShell(
      chromedFragment({ diagramBorderColor: '#FF0000', height: FINAL_DIMS.height + 30 }),
    );
    expect(svg).not.toContain('fill="none"');
  });
});

describe('assembleClassShell — a lost <g> wrapper cannot fail quietly', () => {
  it('throws instead of silently dropping the background rect', () => {
    expect(() =>
      assembleClassShell(
        chromedFragment({ body: INNER, documentBackgroundRect: '#EEEEEE' }),
      ),
    ).toThrow(/not wrapped in an outer <g> element/);
  });
});
