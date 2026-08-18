/**
 * T8 — `assembleSvg`'s `diagramType`-keyed dispatch, and the per-type body
 * finalize functions that used to live in four separate `diagrams/*
 * /renderer-shell.ts` files (`assembleClassShell`/`assembleStateShell`/
 * `assembleJsonShell`/`assembleKlimtShell`). Those four files are gone;
 * their coverage moves here, exercised through the ONE public entry point
 * (`assembleSvg`) rather than the deleted per-engine functions directly.
 *
 * The class-specific cases below are a direct port of the former
 * `tests/unit/class/renderer-shell.test.ts` (T5b), retargeted from
 * `assembleClassShell(fragment)` to `assembleSvg({ ...fragment, diagramType:
 * 'CLASS' })` — same assertions, same jar evidence, new entry point.
 */
import { describe, it, expect } from 'vitest';
import { assembleSvg } from '../../../src/core/assemble-svg.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';
import { ROOT_GROUP_OPEN, rect } from '../../../src/core/svg.js';
import { applyCucaDocumentMargin } from '../../../src/core/TextBlockExporter.js';

const INNER = '<text x="1" y="2">A</text>';
const RAW_DIMS = { width: 60, height: 40 };
const FINAL_DIMS = applyCucaDocumentMargin(RAW_DIMS);
/** `UStroke.simple()`'s thickness — `core/assemble-svg.ts`'s own constant. */
const BORDER_THICKNESS = 1;

// ---------------------------------------------------------------------------
// Routing (the "one core test" T8's spec calls for)
// ---------------------------------------------------------------------------

describe('assembleSvg — routing', () => {
  it('returns completeSvg verbatim, bypassing every other branch', () => {
    expect(assembleSvg({ completeSvg: '<svg>X</svg>' })).toBe('<svg>X</svg>');
  });

  it('routes a diagramType-less fragment through the generic svgRoot', () => {
    const svg = assembleSvg({ body: '<rect/>', width: 10, height: 10 });
    expect(svg).toContain('<rect/>');
    expect(svg).not.toContain('data-diagram-type');
  });

  it('routes a diagramType-carrying fragment through assembleDocumentShell, carrying every root attribute svgRoot omits', () => {
    const svg = assembleSvg({ body: '<g/>', width: 100, height: 50, background: '#FFFFFF', diagramType: 'DESCRIPTION' });
    expect(svg).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    expect(svg).toContain('version="1.1"');
    expect(svg).toContain('data-diagram-type="DESCRIPTION"');
    expect(svg).toContain('zoomAndPan="magnify"');
    expect(svg).toContain('preserveAspectRatio="none"');
    expect(svg).toContain('contentStyleType="text/css"');
    expect(svg).toContain('<?plantuml $version$?>');
  });

  it('folds background into the root style attribute, not a separate <rect> (matches finalizeRootAttributes)', () => {
    const svg = assembleSvg({ body: '<g/>', width: 100, height: 50, background: '#FF0000', diagramType: 'DESCRIPTION' });
    expect(svg).toContain('style="width:100px;height:50px;background:#FF0000;"');
    expect(svg).not.toContain('<rect');
  });

  it('omits the background segment of style for a transparent background', () => {
    const svg = assembleSvg({ body: '<g/>', width: 100, height: 50, background: 'transparent', diagramType: 'DESCRIPTION' });
    expect(svg).toContain('style="width:100px;height:50px;"');
    expect(svg).not.toContain('background:');
  });

  it('defaults background to #FFFFFF when omitted (matches svgRoot\'s own default)', () => {
    const svg = assembleSvg({ body: '<g/>', width: 100, height: 50, diagramType: 'DESCRIPTION' });
    expect(svg).toContain('background:#FFFFFF;');
  });

  it('emits width/height/viewBox truncated to integers (Math.trunc, matching finalizeRootAttributes)', () => {
    const svg = assembleSvg({ body: '<g/>', width: 100.7, height: 50.2, background: '#FFFFFF', diagramType: 'DESCRIPTION' });
    expect(svg).toContain('width="100px"');
    expect(svg).toContain('height="50px"');
    expect(svg).toContain('viewBox="0 0 100 50"');
  });

  it('splices extraDefs into the single <defs> block with no ALL_ARROW_TYPES marker injection', () => {
    const svg = assembleSvg({
      body: '<g/>', width: 10, height: 10, background: '#FFFFFF',
      extraDefs: '<linearGradient id="g0"/>', diagramType: 'DESCRIPTION',
    });
    expect(svg).toContain('<defs><linearGradient id="g0"/></defs>');
    expect(svg).not.toContain('arrow-sync');
    expect(svg).not.toContain('marker');
  });

  it('emits an empty <defs> block when extraDefs is absent', () => {
    const svg = assembleSvg({ body: '<g/>', width: 10, height: 10, background: '#FFFFFF', diagramType: 'DESCRIPTION' });
    // Self-closing when empty — the jar's own form (`document-shell.ts`).
    expect(svg).toContain('<defs/>');
  });

  it('leaves a DESCRIPTION fragment’s body untouched (no finalize entry, matches the deleted assembleKlimtShell no-op)', () => {
    const svg = assembleSvg({ body: '<g class="mark">X</g>', width: 10, height: 10, diagramType: 'DESCRIPTION' });
    expect(svg.endsWith('<g class="mark">X</g></svg>')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CLASS finalize (formerly assembleClassShell, T5b)
// ---------------------------------------------------------------------------

/** A chrome-decorated fragment: `applyChrome` already wrapped the body, so
 *  the finalizer splices into THAT `<g>` rather than adding one. Wrapped
 *  with the attributed root tag on purpose (module doc comment). */
function chromedClassFragment(overrides: Partial<RenderFragment> = {}): RenderFragment {
  return {
    body: ROOT_GROUP_OPEN + INNER + '</g>',
    width: FINAL_DIMS.width,
    height: FINAL_DIMS.height,
    preChromeWidth: RAW_DIMS.width,
    preChromeHeight: RAW_DIMS.height,
    bodyWrapped: true,
    diagramType: 'CLASS',
    ...overrides,
  };
}

/** The root `<g>`'s children, up to (not including) the closing `</svg>`. */
function rootGroupChildren(svg: string): string {
  const start = svg.indexOf(ROOT_GROUP_OPEN);
  expect(start).toBeGreaterThan(-1);
  return svg.slice(start + ROOT_GROUP_OPEN.length, svg.lastIndexOf('</g>'));
}

describe('assembleSvg — CLASS root <g> shape', () => {
  it('emits the jar’s root <g> as the first element after <defs>', () => {
    const svg = assembleSvg(chromedClassFragment());
    expect(svg).toContain('<defs/><g font-family="sans-serif" lengthAdjust="spacing">');
  });

  it('wraps an UNwrapped body in that same root <g>', () => {
    const svg = assembleSvg({
      body: INNER,
      width: FINAL_DIMS.width,
      height: FINAL_DIMS.height,
      diagramType: 'CLASS',
    });
    expect(svg).toContain('<defs/>' + ROOT_GROUP_OPEN + INNER + '</g>');
  });
});

describe('assembleSvg — CLASS documentBackgroundRect splice (G2 N48)', () => {
  it('splices the background rect as the root <g>’s FIRST child', () => {
    const svg = assembleSvg(chromedClassFragment({ documentBackgroundRect: '#EEEEEE' }));
    const bgRect = rect(0, 0, FINAL_DIMS.width, FINAL_DIMS.height, {
      fill: '#EEEEEE',
      stroke: 'none',
      strokeWidth: 1,
    });
    expect(rootGroupChildren(svg)).toBe(bgRect + INNER);
  });

  it('splices it for an unwrapped body too', () => {
    const svg = assembleSvg({
      body: INNER,
      width: FINAL_DIMS.width,
      height: FINAL_DIMS.height,
      documentBackgroundRect: '#EEEEEE',
      diagramType: 'CLASS',
    });
    expect(rootGroupChildren(svg)).toMatch(/^<rect x="0" y="0"/);
  });

  it('draws no background rect when the fragment carries none', () => {
    expect(assembleSvg(chromedClassFragment())).not.toContain('<rect x="0" y="0"');
  });
});

describe('assembleSvg — CLASS diagramBorderColor splice (G2 N66)', () => {
  it('splices the border rect as the root <g>’s FIRST child', () => {
    const svg = assembleSvg(chromedClassFragment({ diagramBorderColor: '#FF0000' }));
    const border = {
      width: RAW_DIMS.width + 5 - BORDER_THICKNESS,
      height: RAW_DIMS.height + 5 - BORDER_THICKNESS,
    };
    const borderRect = rect(0, 0, border.width, border.height, {
      fill: 'none',
      stroke: '#FF0000',
      strokeWidth: BORDER_THICKNESS,
    });
    expect(rootGroupChildren(svg)).toBe(borderRect + INNER);
  });

  it('puts the border rect BEFORE the background rect (drawn first)', () => {
    const svg = assembleSvg(
      chromedClassFragment({ diagramBorderColor: '#FF0000', documentBackgroundRect: '#EEEEEE' }),
    );
    expect(rootGroupChildren(svg)).toMatch(/^<rect [^>]*fill="none"[^>]*\/><rect /);
  });

  it('still no-ops when chrome inflated the canvas past the class body', () => {
    const svg = assembleSvg(
      chromedClassFragment({ diagramBorderColor: '#FF0000', height: FINAL_DIMS.height + 30 }),
    );
    expect(svg).not.toContain('fill="none"');
  });
});

describe('assembleSvg — CLASS: a lost <g> wrapper cannot fail quietly', () => {
  it('throws instead of silently dropping the background rect', () => {
    expect(() =>
      assembleSvg(chromedClassFragment({ body: INNER, documentBackgroundRect: '#EEEEEE' })),
    ).toThrow(/not wrapped in an outer <g> element/);
  });
});

// ---------------------------------------------------------------------------
// STATE finalize (formerly assembleStateShell) — the chrome-present branch
// tests/unit/state/renderer-shell.test.ts does not cover, since it only
// exercises the no-chrome path via renderState directly.
// ---------------------------------------------------------------------------

describe('assembleSvg — STATE background rect skipped once chrome has wrapped', () => {
  it('draws no background rect for a bodyWrapped (chrome-present) fragment, even with a non-default background', () => {
    const svg = assembleSvg({
      body: ROOT_GROUP_OPEN + INNER + '</g>',
      width: 100,
      height: 80,
      background: '#808080',
      bodyWrapped: true,
      diagramType: 'STATE',
    });
    expect(svg).not.toContain('<rect x="0" y="0"');
  });
});

// ---------------------------------------------------------------------------
// JSON/YAML/HCL finalize (formerly assembleJsonShell) — no prior dedicated
// unit test existed; this is new, direct coverage of the moved logic.
// ---------------------------------------------------------------------------

describe('assembleSvg — JSON background rect (isSolidNonDefault)', () => {
  it('draws no rect for the default #FFFFFF background', () => {
    const svg = assembleSvg({ body: INNER, width: 50, height: 30, diagramType: 'JSON' });
    expect(svg).not.toContain('<rect x="0" y="0"');
  });

  it('draws no rect for a transparent background', () => {
    const svg = assembleSvg({
      body: INNER, width: 50, height: 30, background: 'transparent', diagramType: 'JSON',
    });
    expect(svg).not.toContain('<rect x="0" y="0"');
  });

  it('draws no rect for white spelled as a theme name ("white" canonicalizes to #FFFFFF)', () => {
    const svg = assembleSvg({
      body: INNER, width: 50, height: 30, background: 'white', diagramType: 'JSON',
    });
    expect(svg).not.toContain('<rect x="0" y="0"');
    // canonicalized into the root style too, not left as the literal theme string
    expect(svg).toContain('background:#FFFFFF;');
  });

  it('draws the rect for a non-default background, sized to the final canvas, stroke:none only', () => {
    const svg = assembleSvg({
      body: INNER, width: 50, height: 30, background: '#0B58A8', diagramType: 'JSON',
    });
    expect(svg).toContain('<rect x="0" y="0" width="50" height="30" fill="#0B58A8" stroke="none"/>');
  });

  it('positions the rect as the FIRST child when the body is unwrapped', () => {
    const svg = assembleSvg({
      body: INNER, width: 50, height: 30, background: '#0B58A8', diagramType: 'JSON',
    });
    const rectIdx = svg.indexOf('<rect x="0" y="0"');
    const innerIdx = svg.indexOf(INNER);
    expect(rectIdx).toBeGreaterThan(-1);
    expect(innerIdx).toBeGreaterThan(rectIdx);
  });

  it('splices the rect into an already-wrapped (chrome-present) body too', () => {
    const svg = assembleSvg({
      body: ROOT_GROUP_OPEN + INNER + '</g>',
      width: 50,
      height: 30,
      background: '#0B58A8',
      bodyWrapped: true,
      diagramType: 'YAML',
    });
    const rectIdx = svg.indexOf('<rect x="0" y="0"');
    const innerIdx = svg.indexOf(INNER);
    expect(rectIdx).toBeGreaterThan(-1);
    expect(innerIdx).toBeGreaterThan(rectIdx);
  });

  it('routes HCL through the same finalize path as JSON/YAML', () => {
    const svg = assembleSvg({
      body: INNER, width: 50, height: 30, background: '#0B58A8', diagramType: 'HCL',
    });
    expect(svg).toContain('data-diagram-type="HCL"');
    expect(svg).toContain('fill="#0B58A8"');
  });
});
