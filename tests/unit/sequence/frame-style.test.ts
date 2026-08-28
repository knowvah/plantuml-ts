import { describe, it, expect } from 'vitest';
import {
  GROUP_BACKGROUND,
  GROUP_LINE_COLOR,
  GROUP_LINE_THICKNESS,
  GROUP_FONT_SIZE,
  GROUP_FONT_BOLD,
  HEADER_LINE_THICKNESS,
  HEADER_BACKGROUND,
  HEADER_LINE_COLOR,
  HEADER_FONT_SIZE,
  HEADER_FONT_BOLD,
  HEADER_PADDING,
  CORNER_SIZE,
  groupingHeaderDisplay,
} from '../../../src/diagrams/sequence/frame-style.js';
import { scaleSequenceGeometry } from '../../../src/diagrams/sequence/scale-geo.js';
import type { FrameGeo, SequenceGeometry } from '../../../src/diagrams/sequence/ast.js';

// ---------------------------------------------------------------------------
// Constants — plantuml.skin:102-129 / ComponentRoseGroupingHeader.java:64,76
// ---------------------------------------------------------------------------

describe('frame-style constants', () => {
  it('group bucket matches plantuml.skin:103,117-120', () => {
    expect(GROUP_BACKGROUND).toBe('transparent');
    expect(GROUP_LINE_COLOR).toBe('black');
    expect(GROUP_LINE_THICKNESS).toBe(1.5);
    expect(GROUP_FONT_SIZE).toBe(11);
    expect(GROUP_FONT_BOLD).toBe(true);
  });

  it('groupHeader bucket matches plantuml.skin:124-128', () => {
    expect(HEADER_LINE_THICKNESS).toBe(1.5);
    expect(HEADER_BACKGROUND).toBe('#e');
    expect(HEADER_LINE_COLOR).toBe('black');
    expect(HEADER_FONT_SIZE).toBe(13);
    expect(HEADER_FONT_BOLD).toBe(true);
  });

  it('header padding matches ComponentRoseGroupingHeader.java:76 order', () => {
    expect(HEADER_PADDING).toEqual({ top: 1, right: 30, bottom: 1, left: 15 });
  });

  it('corner size matches ComponentRoseGroupingHeader.java:64', () => {
    expect(CORNER_SIZE).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// groupingHeaderDisplay — GroupingTile.java:126-127
// ---------------------------------------------------------------------------

describe('groupingHeaderDisplay', () => {
  it('a bare "group" draws the comment AS the tab text, no comment box', () => {
    expect(groupingHeaderDisplay('group', 'foo')).toEqual({ tabText: 'foo' });
  });

  it('a typed frame draws its title in the tab and comment beside it', () => {
    expect(groupingHeaderDisplay('alt', 'cond')).toEqual({
      tabText: 'alt',
      tabComment: 'cond',
    });
  });

  it('"group" with no comment falls back to an empty tab (Display.create(null))', () => {
    const result = groupingHeaderDisplay('group', undefined);
    expect(result.tabText).toBe('');
    expect(result.tabComment).toBeUndefined();
  });

  it('a typed frame with no comment omits the comment box', () => {
    const result = groupingHeaderDisplay('loop', undefined);
    expect(result.tabText).toBe('loop');
    expect(result.tabComment).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// scaleFrame (via scaleSequenceGeometry) — lengths scale, tokens/text don't
// ---------------------------------------------------------------------------

function makeFrameGeo(overrides: Partial<FrameGeo> = {}): FrameGeo {
  return {
    kind: 'frame',
    frameType: 'alt',
    label: 'x > 0',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    backColorElement: '#FF0000',
    backColorGeneral: '#00FF00',
    branchSeparators: [{ y: 40, label: 'else', backColorGeneral: '#0000FF' }],
    refBody: [],
    tabText: 'alt',
    tabComment: 'x > 0',
    tabTextWidth: 30,
    tabWidth: 60,
    tabHeight: 15,
    ...overrides,
  };
}

function makeGeometry(frame: FrameGeo): SequenceGeometry {
  return {
    totalWidth: 400,
    totalHeight: 300,
    participants: [],
    events: [frame],
    lifelineEndY: 200,
    footerShapeY: 210,
    boxes: [],
    showFootbox: true,
  };
}

describe('scaleFrame (via scaleSequenceGeometry)', () => {
  it('scales tabWidth, tabHeight and tabTextWidth by k', () => {
    const scaled = scaleSequenceGeometry(makeGeometry(makeFrameGeo()), 2);
    const frame = scaled.events[0] as FrameGeo;
    expect(frame.tabWidth).toBe(120);
    expect(frame.tabHeight).toBe(30);
    expect(frame.tabTextWidth).toBe(60);
  });

  it('scales frame x/y/width/height and each separator y', () => {
    const scaled = scaleSequenceGeometry(makeGeometry(makeFrameGeo()), 2);
    const frame = scaled.events[0] as FrameGeo;
    expect(frame.x).toBe(20);
    expect(frame.y).toBe(40);
    expect(frame.width).toBe(200);
    expect(frame.height).toBe(100);
    expect(frame.branchSeparators[0]?.y).toBe(80);
  });

  it('passes colour tokens and text through unchanged', () => {
    const scaled = scaleSequenceGeometry(makeGeometry(makeFrameGeo()), 2);
    const frame = scaled.events[0] as FrameGeo;
    expect(frame.backColorElement).toBe('#FF0000');
    expect(frame.backColorGeneral).toBe('#00FF00');
    expect(frame.tabText).toBe('alt');
    expect(frame.tabComment).toBe('x > 0');
    expect(frame.branchSeparators[0]?.label).toBe('else');
    expect(frame.branchSeparators[0]?.backColorGeneral).toBe('#0000FF');
  });

  it('is a no-op at k=1 (identity short-circuit)', () => {
    const geo = makeGeometry(makeFrameGeo());
    expect(scaleSequenceGeometry(geo, 1)).toBe(geo);
  });
});
