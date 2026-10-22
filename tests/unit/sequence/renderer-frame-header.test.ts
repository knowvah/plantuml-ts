import { describe, it, expect } from 'vitest';
import type { FrameGeo, TextRun } from '../../../src/diagrams/sequence/ast.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { HEADER_PADDING } from '../../../src/diagrams/sequence/frame-style.js';
import {
  builderOf,
  DEFAULT_GROUP_PAINTS,
  DEFAULT_REF_PAINTS,
  groupPaintsOf,
  refPaintsOf,
} from './frame-paint-fixtures.js';
import { scaleSequenceTheme, type ScaledTheme } from '../../../src/diagrams/sequence/scale-geo.js';
import {
  renderGroupingHeaderBackground,
  renderGroupingHeaderForeground,
  frameHeaderCornerPath,
} from '../../../src/diagrams/sequence/renderer-frame-header.js';

const theme: ScaledTheme = scaleSequenceTheme(defaultTheme, 1, new DeterministicMeasurer());

/** `groupHeader { FontSize 13 }` (`plantuml.skin:127`). */
const HEADER_FONT_SIZE = 13;
/** `group { FontSize 11 }` (`plantuml.skin:119`), the comment's `smallFont2`. */
const GROUP_FONT_SIZE = 11;

/**
 * The tab's runs, built the way `sequence-layout-events.ts#buildTabRuns`
 * builds them — A4 moved that placement into layout, so a hand-built
 * `FrameGeo` has to supply it. Measured rather than hard-coded, so the
 * `textLength` these tests assert on cannot drift from the measurer.
 *
 * C5 added `fontFamily`/`fontSize`/`bold` to what a run supplies. The renderer
 * used to pick the two blocks' skin values apart by INDEX, which stopped being
 * possible once a title became one run per creole atom; every run now carries
 * the font its block was measured at, so a hand-built one must too.
 */
function tabRunsFor(f: FrameGeo): TextRun[] {
  const measurer = new DeterministicMeasurer();
  const runAt = (text: string, leftX: number, top: number, size: number): TextRun => {
    const spec = { family: defaultTheme.fontFamily, size, weight: 'bold' as const };
    const lineHeight = measurer.measure('M', spec).height;
    const ascent = lineHeight - measurer.getDescent(spec, 'M');
    return {
      text,
      x: leftX,
      y: top + ascent,
      textWidth: measurer.measure(text, spec).width,
      textAscent: ascent,
      textLineHeight: lineHeight,
      // The creole seam stamps a run's own fill (`sequence-label-primitives.ts:157`).
      color: '#000000',
      fontFamily: spec.family,
      fontSize: spec.size,
      bold: true,
    };
  };
  const left = f.x + HEADER_PADDING.left;
  const top = f.y + HEADER_PADDING.top;
  const title = runAt(f.tabText, left, top, HEADER_FONT_SIZE);
  if (f.tabComment === undefined) return [title];
  return [title, runAt(`[${f.tabComment}]`, left + f.tabWidth, top + 1, GROUP_FONT_SIZE)];
}

function makeFrame(overrides: Partial<FrameGeo> = {}): FrameGeo {
  const base: FrameGeo = {
    ...DEFAULT_GROUP_PAINTS,
    kind: 'frame',
    frameType: 'group',
    label: '',
    x: 10,
    y: 50,
    width: 200,
    height: 100,
    branchSeparators: [],
    refBody: [],
    tabText: 'foo',
    tabWidth: 90,
    tabHeight: 20,
    tabTextWidth: 60,
    ...overrides,
    tabRuns: [],
  };
  return { ...base, tabRuns: tabRunsFor(base) };
}

/** Splits a concatenated markup string into its top-level elements (this
 *  module never nests elements, so a simple `<tag` split is exact). */
function topLevelTags(svg: string): string[] {
  return [...svg.matchAll(/<(path|rect|text)\b/g)].map((m) => m[1] as string);
}

describe('renderGroupingHeaderBackground', () => {
  it('emits exactly one <rect>, fill=none, stroke black 1.5', () => {
    const svg = renderGroupingHeaderBackground(makeFrame(), theme);
    expect(topLevelTags(svg)).toEqual(['rect']);
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="#000"');
    expect(svg).toContain('stroke-width="1.5"');
  });
});

describe('renderGroupingHeaderForeground', () => {
  it('group frame with no comment: path, rect, text(13, bold)', () => {
    const svg = renderGroupingHeaderForeground(makeFrame({ tabText: 'foo' }), theme);
    expect(topLevelTags(svg)).toEqual(['path', 'rect', 'text']);
    expect(svg).toContain('font-size="13"');
    expect(svg).toContain('font-weight="700"');
    expect(svg).toContain('>foo<');
  });

  it('corner path is filled #EEE and stroked black 1.5', () => {
    const svg = renderGroupingHeaderForeground(makeFrame(), theme);
    const pathEl = svg.slice(0, svg.indexOf('<rect'));
    expect(pathEl).toContain('fill="#EEE"');
    expect(pathEl).toContain('stroke="#000"');
    expect(pathEl).toContain('stroke-width="1.5"');
  });

  it('alt frame with a condition: path, rect, text, text(11, bracketed)', () => {
    const frame = makeFrame({ frameType: 'alt', tabText: 'alt', tabComment: 'successful' });
    const svg = renderGroupingHeaderForeground(frame, theme);
    expect(topLevelTags(svg)).toEqual(['path', 'rect', 'text', 'text']);
    expect(svg).toContain('font-size="11"');
    expect(svg).toContain('>[successful]<');
  });

  it('background rect and foreground rect share geometry (the double outline)', () => {
    const frame = makeFrame();
    const bg = renderGroupingHeaderBackground(frame, theme);
    const fg = renderGroupingHeaderForeground(frame, theme);
    const fgRect = fg.slice(fg.indexOf('<rect'));
    expect(fgRect.startsWith(bg)).toBe(true);
  });
});

describe('frameHeaderCornerPath', () => {
  it('roundCorner === 0 matches getCorner:163-171 exactly', () => {
    const d = frameHeaderCornerPath({ x: 0, y: 0 }, { width: 90, height: 20 }, 10, 0);
    expect(d).toBe('M0,0 L90,0 L90,10 L80,20 L0,20 L0,0');
  });

  it('roundCorner > 0 opens at (roundCorner/2, 0) and closes with an arc', () => {
    const d = frameHeaderCornerPath({ x: 0, y: 0 }, { width: 90, height: 20 }, 10, 8);
    expect(d).toBe('M4,0 L90,0 L90,10 L80,20 L0,20 L0,4 A4,4 0 0 1 4,0');
  });

  it('offsets every point by the given origin', () => {
    const d = frameHeaderCornerPath({ x: 10, y: 50 }, { width: 90, height: 20 }, 10, 0);
    expect(d).toBe('M10,50 L100,50 L100,60 L90,70 L10,70 L10,50');
  });
});

/** A `<style>` body over the sequence diagram. */
function styled(rules: string): ReturnType<typeof builderOf> {
  return builderOf(`<style>\nsequenceDiagram {\n${rules}\n}\n</style>`);
}

describe('frame paint (sdd1 T3a)', () => {
  it('draws the default skin: outline black 1.5 unrounded, tab #EEE stroked 1.5 (plantuml.skin:116-129)', () => {
    const svg = renderGroupingHeaderForeground(makeFrame(), theme);
    expect(svg).toContain(
      '<path d="M10,50 L100,50 L100,60 L90,70 L10,70 L10,50" fill="#EEE" stroke="#000" stroke-width="1.5"/>',
    );
    expect(svg).toContain(
      '<rect x="10" y="50" width="200" height="100" fill="none" stroke="#000" stroke-width="1.5"/>',
    );
  });

  it('strokes both rects with the group style and the tab with groupHeader (<style>)', () => {
    const builder = styled(
      'group {\n LineColor red\n LineThickness 3\n LineStyle 4\n RoundCorner 10\n}\n' +
        'groupHeader {\n BackGroundColor yellow\n LineColor green\n LineThickness 2\n}',
    );
    const frame = makeFrame(groupPaintsOf(builder));
    const fg = renderGroupingHeaderForeground(frame, theme);
    // ComponentRoseGroupingHeader.java:79,82,142: the corner is shaped by the
    // BODY's RoundCorner and painted by the header's symbol context.
    expect(fg).toContain(
      '<path d="M15,50 L100,50 L100,60 L90,70 L10,70 L10,55 A5,5 0 0 1 15,50" fill="#FF0" stroke="#008000" stroke-width="2"/>',
    );
    const rectEl =
      '<rect x="10" y="50" width="200" height="100" fill="none" stroke="#F00" stroke-width="3" stroke-dasharray="4,4" rx="5" ry="5"/>';
    expect(fg).toContain(rectEl);
    expect(renderGroupingHeaderBackground(frame, theme)).toBe(rectEl);
  });

  it('honours the old theme-path skinparams through the style (sequenceGroupBorder*)', () => {
    const builder = builderOf('skinparam sequenceGroupBorderThickness 3\nskinparam sequenceGroupBorderColor blue');
    const svg = renderGroupingHeaderBackground(makeFrame(groupPaintsOf(builder)), theme);
    expect(svg).toBe('<rect x="10" y="50" width="200" height="100" fill="none" stroke="#00F" stroke-width="3"/>');
  });

  it('fills the tab with the element colour (alt #pink)', () => {
    const frame = makeFrame(groupPaintsOf(undefined, { backColorElement: '#pink' }));
    expect(renderGroupingHeaderForeground(frame, theme)).toContain('fill="#FFC0CB"');
  });

  it('scales the stroke and its dashes at emission', () => {
    const k2 = scaleSequenceTheme(defaultTheme, 2, new DeterministicMeasurer());
    const frame = makeFrame(groupPaintsOf(styled('group {\n LineStyle 4\n}')));
    expect(renderGroupingHeaderBackground(frame, k2)).toContain('stroke-width="3" stroke-dasharray="8,8"');
  });

  it('draws no tab text when the header font is transparent (DriverTextSvg.java:93-94)', () => {
    const painted = makeFrame(groupPaintsOf(styled('groupHeader {\n FontColor transparent\n}')));
    // Layout stamps no colour on a transparent run (`sequence-label-primitives.ts:157`).
    const frame = { ...painted, tabRuns: painted.tabRuns.map(({ color: _c, ...run }) => run) };
    expect(topLevelTags(renderGroupingHeaderForeground(frame, theme))).toEqual(['path', 'rect']);
  });

  it('omits a comment run whose font colour is transparent, keeping the title (DriverTextSvg.java:93-94)', () => {
    // pizupi: `group { FontColor transparent }` -- the title is `groupHeader`'s
    // (black), the `[` and `]` are `group`'s, transparent, so carry no colour
    // (`sequence-label-primitives.ts:157`); the `<color:#0>` run keeps its own.
    const frame = makeFrame({ frameType: 'alt', tabText: 'alt', tabComment: 'x' });
    const [title, bracket] = tabRunsFor(frame);
    const inner: TextRun = { ...bracket!, text: 'x' };
    const { color: _c, ...open } = { ...bracket!, text: '[' };
    const { color: _d, ...close } = { ...bracket!, text: ']' };
    const svg = renderGroupingHeaderForeground({ ...frame, tabRuns: [title!, open, inner, close] }, theme);
    expect(topLevelTags(svg)).toEqual(['path', 'rect', 'text', 'text']);
    expect(svg).not.toContain('>[<');
    expect(svg).not.toContain('>]<');
    expect(svg).toContain('>alt<');
    expect(svg).toContain('>x<');
  });

  it('refuses a frame layout did not paint', () => {
    const { paint: _p, headerPaint: _h, ...bare } = makeFrame();
    expect(() => renderGroupingHeaderBackground(bare, theme)).toThrow(/no paint/);
  });
});

describe('ref paint (sdd1 T3a)', () => {
  const ref = (paints = DEFAULT_REF_PAINTS): FrameGeo =>
    makeFrame({ ...paints, frameType: 'ref', tabText: 'ref', tabWidth: 60, tabHeight: 15 });

  it('draws the default skin: body none/black 1.5, tab #EEE stroked 2 (plantuml.skin:155-170)', () => {
    const svg = renderGroupingHeaderForeground(ref(), theme);
    expect(svg).toContain(
      '<rect x="10" y="50" width="200" height="100" fill="none" stroke="#000" stroke-width="1.5"/>',
    );
    expect(svg).toContain('fill="#EEE" stroke="#000" stroke-width="2"/>');
    expect(renderGroupingHeaderBackground(ref(), theme)).toBe('');
  });

  it('fills and strokes the body with reference, the tab with referenceHeader (<style>)', () => {
    const builder = styled(
      'reference {\n BackGroundColor lightblue\n LineColor red\n LineThickness 3\n RoundCorner 8\n}\n' +
        'referenceHeader {\n BackGroundColor pink\n LineColor orange\n LineThickness 1\n}',
    );
    const svg = renderGroupingHeaderForeground(ref(refPaintsOf(builder)), theme);
    expect(svg).toContain(
      '<rect x="10" y="50" width="200" height="100" fill="#ADD8E6" stroke="#F00" stroke-width="3" rx="4" ry="4"/>',
    );
    expect(svg).toContain(
      '<path d="M14,50 L70,50 L70,55 L60,65 L10,65 L10,54 A4,4 0 0 1 14,50" fill="#FFC0CB" stroke="#FFA500" stroke-width="1"/>',
    );
  });

  it('honours sequenceReference* skinparams through the style', () => {
    const builder = builderOf(
      'skinparam sequenceReferenceBorderColor red\nskinparam sequenceReferenceBackgroundColor #AAAAAA',
    );
    const svg = renderGroupingHeaderForeground(ref(refPaintsOf(builder)), theme);
    expect(svg).toContain(
      '<rect x="10" y="50" width="200" height="100" fill="#AAA" stroke="#F00" stroke-width="1.5"/>',
    );
  });
});
