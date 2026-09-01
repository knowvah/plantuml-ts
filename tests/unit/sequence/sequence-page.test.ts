/**
 * The `newpage` PAGE TRANSFORM: one `SequenceGeometry` in, one page out.
 *
 * Batch 2 of `plans/sequence-newpage-pagination`. Every rule in
 * `decisions.md` D3/D4 gets a case here, and so does every STRADDLE case the
 * README asks to be enumerated rather than averaged: a geometry whose ink
 * crosses a band edge, where upstream's per-shape drivers would clamp one
 * shape and drop another. Those are the assertions to read first if a later
 * change makes this module disagree with the jar.
 *
 * The bands are stated numerically rather than derived, so a test failing
 * here says WHICH rule moved.
 */
import { describe, it, expect } from 'vitest';
import { paginateSequence, newpageTilesOf, sequencePageCount } from '../../../src/diagrams/sequence/sequence-page.js';
import { NEWPAGE_MARGIN_Y, NEWPAGE_TILE_HEIGHT } from '../../../src/diagrams/sequence/newpage-style.js';
import { ARROW_DELTA_Y } from '../../../src/diagrams/sequence/sequence-arrowhead.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type {
  ActivationGeo,
  DividerGeo,
  EventGeo,
  FrameGeo,
  MessageGeo,
  NewpageGeo,
  NoteGeo,
  SequenceGeometry,
  SpaceGeo,
} from '../../../src/diagrams/sequence/ast.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const HEAD_HEIGHT = 30;
const LIFELINE_END = 500;

/** A geometry with one head row of `HEAD_HEIGHT`, body ending at
 *  `LIFELINE_END`, and whatever events the case needs. */
function geo(events: EventGeo[], overrides?: Partial<SequenceGeometry>): SequenceGeometry {
  return {
    totalWidth: 400,
    totalHeight: 560,
    participants: [
      {
        id: 'A', display: 'A', type: 'participant',
        x: 10, y: 0, width: 60, height: HEAD_HEIGHT, centerX: 40,
        background: defaultTheme.colors.background, border: defaultTheme.colors.border,
      },
    ],
    events,
    headHeight: HEAD_HEIGHT,
    lifelineEndY: LIFELINE_END,
    footerShapeY: LIFELINE_END,
    showFootbox: true,
    boxes: [],
    ...overrides,
  };
}

function newpage(y: number): NewpageGeo {
  return { kind: 'newpage', y, height: NEWPAGE_TILE_HEIGHT, bandX: 10, bandWidth: 360 };
}

function message(y: number, labelY?: number): MessageGeo {
  return {
    kind: 'message', fromX: 40, toX: 200, y, label: 'm',
    arrow: arrowConfigurationOf({}),
    labelLines: labelY === undefined ? [] : [{ text: 'm', x: 50, y: labelY }],
    arrowDirection: 'right',
  };
}

const note = (y: number, height: number): NoteGeo =>
  ({ kind: 'note', x: 10, y, width: 80, height, text: 'n' });
const activation = (y: number, height: number): ActivationGeo =>
  ({ kind: 'activation', participantId: 'A', lifelineX: 40, y, height });
const divider = (y: number, height: number): DividerGeo =>
  ({ kind: 'divider', text: 'd', lines: ['d'], y, bandX: 10, bandWidth: 360,
     height, textWidth: 40, textHeight: 20 });
const space = (y: number): SpaceGeo => ({ kind: 'space', y, height: 12 });

function frame(y: number, height: number, extra?: Partial<FrameGeo>): FrameGeo {
  return {
    kind: 'frame', frameType: 'group', label: 'g',
    x: 5, y, width: 300, height,
    branchSeparators: [], refBody: [],
    tabText: 'group', tabTextWidth: 30, tabWidth: 40, tabHeight: 15,
    ...extra,
  };
}

const kinds = (g: SequenceGeometry): string[] => g.events.map((e) => e.kind);
/** The kinds a page carries APART from its own separators. Every band in the
 *  per-kind cases below straddles a `newpage` tile, whose separator survives
 *  on both adjacent pages by design -- that is its own section. */
const inkKinds = (g: SequenceGeometry): string[] =>
  kinds(g).filter((k) => k !== 'newpage');
const only = <T extends EventGeo>(g: SequenceGeometry, kind: T['kind']): T[] =>
  g.events.filter((e): e is T => e.kind === kind);

// ---------------------------------------------------------------------------
// The page list
// ---------------------------------------------------------------------------

describe('page list', () => {
  it('counts pages as yNewPages().size() - 1, i.e. tiles + 1', () => {
    expect(sequencePageCount(geo([message(100)]))).toBe(1);
    expect(sequencePageCount(geo([message(100), newpage(150)]))).toBe(2);
    expect(sequencePageCount(geo([newpage(50), message(100), newpage(150)]))).toBe(3);
  });

  it('returns the SAME object when the document has no newpage', () => {
    const g = geo([message(100), note(120, 40)]);
    expect(paginateSequence(g, 0)).toBe(g);
    expect(paginateSequence(g, 5)).toBe(g);
  });

  it('lists the tiles in layout order', () => {
    const g = geo([newpage(50), message(100), newpage(150)]);
    expect(newpageTilesOf(g).map((t) => t.y)).toEqual([50, 150]);
  });

  it('clamps a page index past the end onto the last page', () => {
    const g = geo([message(100), newpage(200), message(300)]);
    expect(paginateSequence(g, 99)).toEqual(paginateSequence(g, 1));
  });
});

// ---------------------------------------------------------------------------
// The band and the document totals
// ---------------------------------------------------------------------------

describe('band and totals', () => {
  /** Page 0 of a two-page document: band `[headHeight, tile.y + 21 + 1]`,
   *  no translation, and the lifelines stop at `pageHeight + headHeight`. */
  it('page 0 keeps the head row in place and ends the body at ymax', () => {
    const g = geo([message(100), newpage(200), message(300)]);
    const page = paginateSequence(g, 0);
    expect(only<MessageGeo>(page, 'message').map((m) => m.y)).toEqual([100]);
    // ymax = 200 + 21 = 221, dy = 0
    expect(page.lifelineEndY).toBe(221);
    expect(page.totalHeight).toBe(560 - (LIFELINE_END - 221));
  });

  /** Page 1: `ymin` is the PREVIOUS tile's y, so the body slides up by
   *  `headHeight - ymin` and the last page runs to the original body end. */
  it('page 1 translates the body by headHeight - ymin', () => {
    const g = geo([message(100), newpage(200), message(300)]);
    const page = paginateSequence(g, 1);
    // dy = 30 - 200 = -170
    expect(only<MessageGeo>(page, 'message').map((m) => m.y)).toEqual([130]);
    expect(page.lifelineEndY).toBe(LIFELINE_END - 170);
    expect(page.totalHeight).toBe(560 - 170);
    expect(page.footerShapeY).toBe(LIFELINE_END - 170);
  });

  it('re-sizes box englobers to the page height', () => {
    const g = geo([message(100), newpage(200), message(300)], {
      boxes: [{ x: 0, y: 0, width: 100, height: 560, label: 'b', color: '#eee' }],
    });
    const page = paginateSequence(g, 0);
    expect(page.boxes[0]!.height).toBe(page.totalHeight);
  });

  it('leaves width, participants and showFootbox alone', () => {
    const g = geo([message(100), newpage(200)]);
    const page = paginateSequence(g, 0);
    expect(page.totalWidth).toBe(g.totalWidth);
    expect(page.participants).toEqual(g.participants);
    expect(page.showFootbox).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The six per-shape rules, per kind
// ---------------------------------------------------------------------------

describe('message — the arrow head is the strictest shape (UPolygon)', () => {
  const g = (y: number) => geo([newpage(200), message(y)]);
  // page 0 band: [30, 222]

  it('keeps a message whose head is wholly inside', () => {
    expect(inkKinds(paginateSequence(g(222 - ARROW_DELTA_Y), 0))).toEqual(['message']);
  });

  it('drops a message whose head crosses the bottom edge by one pixel', () => {
    expect(inkKinds(paginateSequence(g(223 - ARROW_DELTA_Y), 0))).toEqual([]);
  });

  /** This is the case that matters: the first tile of the NEXT page starts
   *  at `tile.y + 21`, and this port draws a message's arrow at its tile's
   *  TOP where upstream draws it lower. The shaft alone would be inside the
   *  band by one pixel; the head is not. */
  it('drops the first message of the next page, whose arrow sits on ymax', () => {
    const page = paginateSequence(geo([newpage(200), message(221)]), 0);
    expect(inkKinds(page)).toEqual([]);
  });

  it('drops a label run whose own anchor left the band, keeping the arrow', () => {
    const page = paginateSequence(geo([newpage(200), message(100, 20)]), 0);
    const [m] = only<MessageGeo>(page, 'message');
    expect(m!.y).toBe(100);
    expect(m!.labelLines).toEqual([]);
  });

  it('keeps and translates a label run inside the band', () => {
    const page = paginateSequence(geo([message(300), newpage(200)]), 1);
    const [m] = only<MessageGeo>(page, 'message');
    expect(m!.y).toBe(130);
  });
});

describe('note — UPath, so the WHOLE box must be inside', () => {
  // page 0 band: [30, 222]
  it('keeps a note that fits', () => {
    expect(inkKinds(paginateSequence(geo([newpage(200), note(150, 40)]), 0))).toEqual(['note']);
  });

  /** STRADDLE (D4): upstream would clamp an `rnote`'s `URectangle` and drop
   *  its text lines one by one. This port cannot express a box without its
   *  text, so it takes the folded-corner `UPath`'s answer for every note
   *  shape: all-or-nothing on both corners. */
  it('drops a note whose bottom crosses the band edge', () => {
    expect(inkKinds(paginateSequence(geo([newpage(200), note(200, 40)]), 0))).toEqual([]);
  });

  it('drops a note whose top is above the band', () => {
    expect(inkKinds(paginateSequence(geo([note(100, 40), newpage(200)]), 1))).toEqual([]);
  });
});

describe('activation — URectangle, so CLAMP', () => {
  it('clamps an activation that runs past the band and keeps the survivor', () => {
    const page = paginateSequence(geo([newpage(200), activation(150, 200)]), 0);
    const [a] = only<ActivationGeo>(page, 'activation');
    // [150, 350] clipped to [30, 222]
    expect(a!.y).toBe(150);
    expect(a!.height).toBe(72);
  });

  it('clamps an activation that starts above the band', () => {
    const page = paginateSequence(geo([activation(100, 200), newpage(200)]), 1);
    const [a] = only<ActivationGeo>(page, 'activation');
    // [100, 300] clipped to [200, 501], then translated by 30 - 200
    expect(a!.y).toBe(30);
    expect(a!.height).toBe(100);
  });

  it('drops an activation the clamp reduces to nothing', () => {
    expect(inkKinds(paginateSequence(geo([newpage(200), activation(300, 50)]), 0))).toEqual([]);
  });
});

describe('divider — anchored on the BAND rule, y + height / 2', () => {
  /** STRADDLE (D4). The divider that follows a `newpage` starts at
   *  `tile.y + 21`, one pixel inside a band that ends at `tile.y + 22`,
   *  but every shape it draws is ~20px lower and clipped away. The jar's
   *  golden for `digula-66-dipe776` shows none of its `== Page 2 ==`. */
  it('drops the divider that opens the next page', () => {
    expect(inkKinds(paginateSequence(geo([newpage(200), divider(221, 41)]), 0))).toEqual([]);
  });

  it('keeps that same divider on the page it opens', () => {
    expect(kinds(paginateSequence(geo([newpage(200), divider(221, 41)]), 1))).toEqual(
      ['newpage', 'divider'],
    );
  });

  it('keeps a divider whose band rule is inside', () => {
    expect(inkKinds(paginateSequence(geo([newpage(200), divider(150, 41)]), 0))).toEqual(['divider']);
  });
});

describe('frame — body CLAMPED, header tab all-or-nothing', () => {
  // page 0 band: [30, 222]
  it('clamps a frame that runs off the bottom and keeps its tab', () => {
    const page = paginateSequence(geo([newpage(200), frame(100, 300)]), 0);
    const [f] = only<FrameGeo>(page, 'frame');
    expect(f!.y).toBe(100);
    expect(f!.height).toBe(122);
    expect(f!.headerClipped).toBeUndefined();
  });

  /** STRADDLE (D4), and the one place upstream's two rules genuinely
   *  disagree within a kind: the body is a `URectangle` (clamped) and the
   *  tab is a `UPath` (all-or-nothing on its bbox corners). */
  it('keeps the body but drops the tab when the frame top is off-page', () => {
    const page = paginateSequence(geo([frame(100, 300), newpage(200)]), 1);
    const [f] = only<FrameGeo>(page, 'frame');
    expect(f!.y).toBe(30);
    expect(f!.height).toBe(200);
    expect(f!.headerClipped).toBe(true);
  });

  it('drops the tab when only the tab BOTTOM leaves the band', () => {
    // tab spans [215, 230]; the band ends at 222
    const page = paginateSequence(geo([newpage(200), frame(215, 100)]), 0);
    expect(only<FrameGeo>(page, 'frame')[0]!.headerClipped).toBe(true);
  });

  it('drops a frame the clamp reduces to nothing', () => {
    expect(inkKinds(paginateSequence(geo([newpage(200), frame(300, 50)]), 0))).toEqual([]);
  });

  it('drops the else separators that left the band and translates the rest', () => {
    const f = frame(100, 300, {
      branchSeparators: [
        { y: 150, label: 'a' },
        { y: 260, label: 'b' },
      ],
    });
    const page = paginateSequence(geo([newpage(200), f]), 0);
    expect(only<FrameGeo>(page, 'frame')[0]!.branchSeparators).toEqual([{ y: 150, label: 'a' }]);
  });

  it('drops the ref body with the header it hangs off', () => {
    const f = frame(100, 300, { frameType: 'ref', refBody: [{ text: 'r', x: 20 }] });
    const page = paginateSequence(geo([f, newpage(200)]), 1);
    expect(only<FrameGeo>(page, 'frame')[0]!.refBody).toEqual([]);
  });
});

describe('newpage separator — a horizontal ULine, in BOTH adjacent bands', () => {
  const g = geo([message(100), newpage(200), message(300)]);

  it('appears on the page it ends', () => {
    const tiles = newpageTilesOf(paginateSequence(g, 0));
    expect(tiles.map((t) => t.y)).toEqual([200]);
  });

  it('appears again on the page it starts', () => {
    const tiles = newpageTilesOf(paginateSequence(g, 1));
    // translated by 30 - 200
    expect(tiles.map((t) => t.y)).toEqual([30]);
  });

  it('drops a separator belonging to a page further on', () => {
    const two = geo([newpage(100), newpage(300)]);
    expect(newpageTilesOf(paginateSequence(two, 0)).map((t) => t.y)).toEqual([100]);
  });

  /** The rule is on the LINE, `tile.y + MARGINY`, not the tile's top. */
  it('is tested at tile.y + MARGINY', () => {
    expect(NEWPAGE_MARGIN_Y).toBe(10);
    // A tile whose top is inside the band but whose line is not.
    const g2 = geo([newpage(200), newpage(215)]);
    expect(newpageTilesOf(paginateSequence(g2, 0)).map((t) => t.y)).toEqual([200]);
  });
});

describe('space — no ink, so nothing to clip', () => {
  it('is carried through translated', () => {
    const page = paginateSequence(geo([space(300), newpage(200)]), 1);
    expect(only<SpaceGeo>(page, 'space').map((s) => s.y)).toEqual([130]);
  });
});
