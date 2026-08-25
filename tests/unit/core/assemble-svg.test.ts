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
import { ROOT_GROUP_OPEN, rect, svgRoot } from '../../../src/core/svg.js';
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

// ---------------------------------------------------------------------------
// SEQUENCE finalize (T2) — unreachable until T3 sets `diagramType:'SEQUENCE'`
// on the fragment, so every fixture below is synthetic. Jar evidence is the
// cached golden named in each case (`test-results/dot-cache/sequence/<slug>/
// in.svg`); the mechanism is `klimt/drawing/svg/SvgGraphics.java:186-191`
// (paint guard) + `:207-212` (rect appended to the root `<g>` FIRST).
// ---------------------------------------------------------------------------

/** The dims every SEQUENCE fixture below uses — `dakake-85-nemi992`'s own. */
const SEQ_DIMS = { width: 114, height: 313 };

function sequenceFragment(overrides: Partial<RenderFragment> = {}): RenderFragment {
  return { body: INNER, ...SEQ_DIMS, diagramType: 'SEQUENCE', ...overrides };
}

describe('assembleSvg — SEQUENCE root <g> shape (AC1)', () => {
  it('wraps an unwrapped body in ONE bare <g>, upgraded to ROOT_GROUP_OPEN', () => {
    const svg = assembleSvg(sequenceFragment());
    expect(svg).toContain('<defs/>' + ROOT_GROUP_OPEN + INNER + '</g></svg>');
  });

  it('emits exactly one root <g> open tag', () => {
    const svg = assembleSvg(sequenceFragment());
    expect(svg.split(ROOT_GROUP_OPEN)).toHaveLength(2);
  });

  it('leaves an already-wrapped (chrome-present) body’s own <g> in place', () => {
    const svg = assembleSvg(
      sequenceFragment({ body: ROOT_GROUP_OPEN + INNER + '</g>', bodyWrapped: true }),
    );
    expect(svg).toContain('<defs/>' + ROOT_GROUP_OPEN + INNER + '</g></svg>');
  });

  it('carries data-diagram-type="SEQUENCE" and the klimt prolog', () => {
    const svg = assembleSvg(sequenceFragment());
    expect(svg).toContain('data-diagram-type="SEQUENCE"');
    expect(svg).toContain('<?plantuml $version$?>');
  });
});

describe('assembleSvg — SEQUENCE background rect (AC2/AC3/AC4)', () => {
  it('draws the rect as the content group’s FIRST child (dakake-85-nemi992)', () => {
    const svg = assembleSvg(sequenceFragment({ background: '#FF0000' }));
    // Golden: `<rect x="0" y="0" width="114" height="313" fill="#F00"
    // style="stroke:none;"/>` — this port emits the stroke as an ATTRIBUTE
    // (`stroke="none"`), a pre-existing `core/svg-shapes.ts#rect` form shared
    // with STATE/JSON, not something this case introduces.
    expect(rootGroupChildren(svg)).toBe(
      '<rect x="0" y="0" width="114" height="313" fill="#F00" stroke="none"/>' + INNER,
    );
    expect(svg).toContain('background:#FF0000;');
  });

  it('draws no rect for the default white background (bakire-18-peku988)', () => {
    const svg = assembleSvg(sequenceFragment({ background: '#FFFFFF' }));
    expect(rootGroupChildren(svg)).toBe(INNER);
    expect(svg).toContain('background:#FFFFFF;');
  });

  it('draws no rect when the fragment carries no background at all', () => {
    expect(rootGroupChildren(assembleSvg(sequenceFragment()))).toBe(INNER);
  });

  it('draws no rect and omits background: from the root style for transparent (badoba-13-cuba151)', () => {
    const svg = assembleSvg(sequenceFragment({ background: 'transparent' }));
    expect(rootGroupChildren(svg)).toBe(INNER);
    expect(svg).toContain('style="width:114px;height:313px;"');
    expect(svg).not.toContain('background:');
  });

  it('draws no rect for the `none` spelling of transparent either', () => {
    expect(rootGroupChildren(assembleSvg(sequenceFragment({ background: 'none' })))).toBe(INNER);
  });

  it('draws no rect for the canonical transparent hex #00000000', () => {
    const svg = assembleSvg(sequenceFragment({ background: '#00000000' }));
    expect(rootGroupChildren(svg)).toBe(INNER);
    expect(svg).not.toContain('background:');
  });

  it('draws no rect for a BLACK background, which jar excludes alongside white (zuravu-52-mike252)', () => {
    const svg = assembleSvg(sequenceFragment({ background: '#000000' }));
    expect(rootGroupChildren(svg)).toBe(INNER);
    expect(svg).toContain('background:#000000;');
  });

  it('truncates the rect dims to integers, matching every non-white golden', () => {
    const svg = assembleSvg(sequenceFragment({ width: 114.7, height: 313.2, background: '#808080' }));
    expect(rootGroupChildren(svg)).toBe(
      '<rect x="0" y="0" width="114" height="313" fill="#808080" stroke="none"/>' + INNER,
    );
  });

  it('splices the rect into an already-wrapped body ahead of chrome (fazaba-22-nusi829)', () => {
    const header = '<g class="header"><text x="5" y="12">h</text></g>';
    const svg = assembleSvg(
      sequenceFragment({
        body: ROOT_GROUP_OPEN + header + INNER + '</g>',
        bodyWrapped: true,
        background: '#AAAAAA',
      }),
    );
    expect(rootGroupChildren(svg)).toBe(
      '<rect x="0" y="0" width="114" height="313" fill="#AAA" stroke="none"/>' + header + INNER,
    );
  });
});

// ---------------------------------------------------------------------------
// AC5 — the other five diagram types (and the diagramType-less path) are
// byte-identical to their pre-T2 output. Every literal below was captured
// from the implementation BEFORE the SEQUENCE case was added and pinned
// verbatim; a change to any shared helper breaks these, not just a change to
// the dispatch switch.
// ---------------------------------------------------------------------------

const SHELL_HEAD = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" data-diagram-type=';

/** `<svg …>…<defs/>` prolog for one diagram type at one canvas size. */
function pinnedPrologue(type: string, w: number, h: number, style: string): string {
  return (
    `${SHELL_HEAD}"${type}" style="${style}" width="${String(w)}px" height="${String(h)}px"` +
    ` viewBox="0 0 ${String(w)} ${String(h)}" zoomAndPan="magnify" preserveAspectRatio="none"` +
    ' contentStyleType="text/css"><?plantuml $version$?><defs/>'
  );
}

describe('assembleSvg — AC5: the other diagram types are byte-unchanged', () => {
  it('CLASS (border rect + background rect + chrome-wrapped body)', () => {
    const svg = assembleSvg(
      chromedClassFragment({
        documentBackgroundRect: '#EEEEEE',
        diagramBorderColor: '#FF0000',
        background: '#EEEEEE',
      }),
    );
    expect(svg).toBe(
      pinnedPrologue('CLASS', 66, 46, 'width:66px;height:46px;background:#EEEEEE;') +
        ROOT_GROUP_OPEN +
        '<rect x="0" y="0" width="64" height="44" fill="none" stroke="#F00" stroke-width="1"/>' +
        '<rect x="0" y="0" width="66" height="46" fill="#EEE" stroke="none"/>' +
        INNER +
        '</g></svg>',
    );
  });

  it('STATE (non-default background, unwrapped body)', () => {
    const svg = assembleSvg({
      body: INNER, width: 100, height: 80, background: '#808080', diagramType: 'STATE',
    });
    expect(svg).toBe(
      pinnedPrologue('STATE', 100, 80, 'width:100px;height:80px;background:#808080;') +
        ROOT_GROUP_OPEN +
        '<rect x="0" y="0" width="100" height="80" fill="#808080" stroke="none"/>' +
        INNER +
        '</g></svg>',
    );
  });

  it('JSON (theme-named white canonicalizes, no rect)', () => {
    const svg = assembleSvg({
      body: INNER, width: 50, height: 30, background: 'white', diagramType: 'JSON',
    });
    expect(svg).toBe(
      pinnedPrologue('JSON', 50, 30, 'width:50px;height:30px;background:#FFFFFF;') +
        ROOT_GROUP_OPEN + INNER + '</g></svg>',
    );
  });

  it('YAML (chrome-wrapped body, rect spliced in)', () => {
    const svg = assembleSvg({
      body: ROOT_GROUP_OPEN + INNER + '</g>',
      width: 50, height: 30, background: '#0B58A8', bodyWrapped: true, diagramType: 'YAML',
    });
    expect(svg).toBe(
      pinnedPrologue('YAML', 50, 30, 'width:50px;height:30px;background:#0B58A8;') +
        ROOT_GROUP_OPEN +
        '<rect x="0" y="0" width="50" height="30" fill="#0B58A8" stroke="none"/>' +
        INNER +
        '</g></svg>',
    );
  });

  it('HCL (same finalize as JSON/YAML)', () => {
    const svg = assembleSvg({
      body: INNER, width: 50, height: 30, background: '#0B58A8', diagramType: 'HCL',
    });
    expect(svg).toBe(
      pinnedPrologue('HCL', 50, 30, 'width:50px;height:30px;background:#0B58A8;') +
        ROOT_GROUP_OPEN +
        '<rect x="0" y="0" width="50" height="30" fill="#0B58A8" stroke="none"/>' +
        INNER +
        '</g></svg>',
    );
  });

  it('a diagramType-less fragment still goes through svgRoot verbatim (markers and all)', () => {
    // `svgRoot` is untouched by T2, so equality with it IS the byte-identity
    // statement: had the dispatch stolen this path, the marker `<defs>` block
    // alone would differ by ~3kB.
    const svg = assembleSvg({ body: INNER, width: 50, height: 30, background: '#0B58A8' });
    expect(svg).toBe(svgRoot(50, 30, [INNER], '#0B58A8'));
    expect(svg).toContain('<marker id="arrow-sync"');
    expect(svg).not.toContain('data-diagram-type');
  });
});

// ---------------------------------------------------------------------------
// Gradient defs — SvgGraphics#createSvgGradient
// ---------------------------------------------------------------------------

describe('gradient defs are hoisted and deduped', () => {
  const gradient = { color1: '#FF0000', color2: '#0000FF', policy: '\\' } as const;

  // `createSvgGradient` keys a map on (color1, color2, policy), creates the
  // element once on a miss and appends it to `defs`
  // (`SvgGraphics.java:363-405`). This port's shape emitters each prepend
  // their own def inline, so a gradient shared by N shapes appeared N times
  // with `<defs/>` left empty.
  it('emits ONE linearGradient, inside <defs>, for many shapes sharing it', () => {
    const body =
      rect(0, 0, 10, 10, { fill: gradient }) +
      rect(20, 0, 10, 10, { fill: gradient }) +
      rect(40, 0, 10, 10, { fill: gradient });
    const svg = assembleSvg({ body, width: 100, height: 20, background: '#FFFFFF' });
    expect((svg.match(/<linearGradient/g) ?? []).length).toBe(1);
    const defsBlock = /<defs>([\s\S]*?)<\/defs>/.exec(svg)?.[1] ?? '';
    expect(defsBlock).toContain('<linearGradient');
    // ...and the shapes still reference it.
    expect((svg.match(/url\(#/g) ?? []).length).toBe(3);
  });

  it('keeps DISTINCT gradients as separate defs', () => {
    const other = { color1: '#00FF00', color2: '#FFFF00', policy: '|' } as const;
    const svg = assembleSvg({
      body: rect(0, 0, 10, 10, { fill: gradient }) + rect(20, 0, 10, 10, { fill: other }),
      width: 100,
      height: 20,
      background: '#FFFFFF',
    });
    expect((svg.match(/<linearGradient/g) ?? []).length).toBe(2);
  });

  it('leaves no gradient behind in the drawing body', () => {
    const svg = assembleSvg({
      body: rect(0, 0, 10, 10, { fill: gradient }),
      width: 100,
      height: 20,
      background: '#FFFFFF',
    });
    const afterDefs = svg.slice(svg.indexOf('</defs>'));
    expect(afterDefs).not.toContain('<linearGradient');
  });
});
