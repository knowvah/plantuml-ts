/**
 * sdd3-T8e: notes, frames, `else` rules, dividers, `newpage` rules, boxes,
 * connectors and link anchors are drawn through the page's `UGraphic`, each
 * as the Java chain draws it. A recording graphic logs, per draw, the chain of
 * `apply`s on the instance that drew and WHICH instance it was: the apply
 * ORDER and the instance sharing are what `UGraphicHandwritten` (T8f)
 * depends on (a draw is jiggled by the RNG its instance's last `apply`
 * restarted; the note's polygon and corner share one stream,
 * `ComponentRoseNote.java:121-124`).
 */
import { describe, it, expect } from 'vitest';
import type { UChange } from '../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../src/core/klimt/UParam.js';
import type { UShape } from '../../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { UPath, USegmentType } from '../../../src/core/klimt/shape/UPath.js';
import { UPolygon } from '../../../src/core/klimt/shape/UPolygon.js';
import { URectangle } from '../../../src/core/klimt/shape/URectangle.js';
import { UText } from '../../../src/core/klimt/shape/UText.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { MeasurerStringBounder } from '../../../src/core/measurer-bounder.js';
import type {
  BoxGeo,
  DividerGeo,
  ElseGeo,
  EventGeo,
  FrameGeo,
  NewpageGeo,
  NoteGeo,
  SequenceGeometry,
} from '../../../src/diagrams/sequence/ast.js';
import {
  drawBoxBackground,
  drawConnector,
  drawNote,
  drawNoteBackground,
} from '../../../src/diagrams/sequence/renderer-note.js';
import {
  drawGroupingHeaderBackground,
  drawGroupingHeaderForeground,
} from '../../../src/diagrams/sequence/renderer-frame-header.js';
import { drawFrameBlotter } from '../../../src/diagrams/sequence/renderer-frame-blotter.js';
import { drawDivider } from '../../../src/diagrams/sequence/renderer-divider.js';
import { drawLinkAnchors } from '../../../src/diagrams/sequence/renderer-link-anchor.js';
import { drawEventPass } from '../../../src/diagrams/sequence/renderer-events.js';
import { changeLabel, shapeLabel } from '../../helpers/recording-ugraphic.js';
import { layoutBody } from './frame-paint-fixtures.js';
import { pageTheme } from './draw-markup.js';

const MEASURER = new DeterministicMeasurer();
const THEME = pageTheme(MEASURER);

/** One recorded draw: the instance that drew, the apply chain on it, the shape. */
interface Drawn {
  readonly instance: number;
  readonly chain: readonly string[];
  readonly shape: UShape;
}

/** A `UGraphic` that records which instance each draw landed on. */
class Recorder implements UGraphic {
  constructor(
    readonly log: Drawn[] = [],
    private readonly counter = { next: 0 },
    private readonly chain: readonly string[] = [],
    private readonly id = 0,
  ) {}

  apply(change: UChange): UGraphic {
    this.counter.next += 1;
    return new Recorder(this.log, this.counter, [...this.chain, changeLabel(change)], this.counter.next);
  }

  draw(shape: UShape): void {
    this.log.push({ instance: this.id, chain: this.chain, shape });
  }

  getParam(): UParam {
    throw new Error('the draw functions never read the param');
  }

  getTranslate(): UTranslate {
    return UTranslate.none();
  }

  getStringBounder(): StringBounder {
    return new MeasurerStringBounder(MEASURER);
  }
}

/** The shape draws of `draw` (text runs excluded: they are pass-through). */
function shapesDrawn(draw: (ug: UGraphic) => void): Drawn[] {
  const ug = new Recorder();
  draw(ug);
  return ug.log.filter((d) => !(d.shape instanceof UText));
}

const kindsOf = (log: readonly Drawn[]): string[] => log.map((d) => shapeLabel(d.shape));

/** The recorded segments of a path as `TYPE x,y` tokens. */
function segmentsOf(path: UPath): string[] {
  return [...path.iterator()].map((s) => `${s.segmentType.replace('SEG_', '')} ${s.coord.join(',')}`);
}

const ALT = ['Alice -> Bob : hello', 'alt x', 'Bob -> Alice : yes', 'else y', 'Bob -> Alice : no', 'end'].join('\n');

function eventsOf<T extends EventGeo>(geo: SequenceGeometry, kind: T['kind']): T[] {
  return geo.events.filter((e): e is T => e.kind === kind);
}

describe('drawNote (ComponentRoseNote.java:118-124, Opale.java:134-171)', () => {
  const geo = layoutBody('participant A\nnote left of A : ok', MEASURER);
  const note = eventsOf<NoteGeo>(geo, 'note')[0]!;

  it('draws the polygon and the corner on ONE instance, under translate, fore, back, stroke', () => {
    const [polygon, corner, ...rest] = shapesDrawn((ug) => drawNote(ug, note, THEME));
    expect(rest).toEqual([]);
    expect(polygon!.shape).toBeInstanceOf(UPath);
    expect(corner!.shape).toBeInstanceOf(UPath);
    // `ug = symbolContext.apply(ug); ug.draw(polygon); ug.draw(corner)`: the
    // very same variable, so the same instance and the same chain.
    expect(corner!.instance).toBe(polygon!.instance);
    expect(corner!.chain).toBe(polygon!.chain);
    expect(polygon!.chain).toEqual([
      `translate(${note.x},${note.y})`,
      'fore(#181818)',
      'back(#FEFFDD)',
      'stroke(0,0,0.5)',
    ]);
  });

  it('builds the polygon at the origin in `Opale.getPolygonNormal` vertex order (:152-157)', () => {
    const [polygon] = shapesDrawn((ug) => drawNote(ug, note, THEME));
    const { width: w, height: h } = note;
    expect(segmentsOf(polygon!.shape as UPath)).toEqual([
      'MOVETO 0,0',
      `LINETO 0,${h}`,
      `LINETO ${w},${h}`,
      `LINETO ${w},10`,
      `LINETO ${w - 10},0`,
      'LINETO 0,0',
    ]);
  });

  it('shadows the polygon and not the corner (:119, :123)', () => {
    const shadowed = { ...note, shadow: 4 };
    const [polygon, corner] = shapesDrawn((ug) => drawNote(ug, shadowed, THEME));
    expect((polygon!.shape as UPath).getDeltaShadow()).toBe(4);
    expect((corner!.shape as UPath).getDeltaShadow()).toBe(0);
  });

  it('keeps `arcTo` in a rounded polygon and corner (`getPolygonNormal:158-168`, `getCorner:139-141`)', () => {
    const rounded = layoutBody('skinparam roundCorner 10\nparticipant A\nnote left of A : r', MEASURER);
    const [polygon, corner] = shapesDrawn((ug) => drawNote(ug, eventsOf<NoteGeo>(rounded, 'note')[0]!, THEME));
    const arcs = (d: Drawn): number =>
      [...(d.shape as UPath).iterator()].filter((s) => s.segmentType === USegmentType.SEG_ARCTO).length;
    expect([arcs(polygon!), arcs(corner!)]).toEqual([3, 1]);
  });

  it('draws a rect note as one rounded URectangle and an hnote as one UPolygon, each on a fresh instance', () => {
    const rect = layoutBody('participant A\nrnote right of A : b', MEASURER);
    const hex = layoutBody('participant A\nhnote over A : h', MEASURER);
    const drawnRect = shapesDrawn((ug) => drawNote(ug, eventsOf<NoteGeo>(rect, 'note')[0]!, THEME));
    const drawnHex = shapesDrawn((ug) => drawNote(ug, eventsOf<NoteGeo>(hex, 'note')[0]!, THEME));
    expect(drawnRect.map((d) => d.shape.constructor)).toEqual([URectangle]);
    expect(drawnHex.map((d) => d.shape.constructor)).toEqual([UPolygon]);
    expect((drawnHex[0]!.shape as UPolygon).getPoints()).toHaveLength(7);
    expect(drawnRect[0]!.chain.slice(1)).toEqual(['fore(#181818)', 'back(#FEFFDD)', 'stroke(0,0,0.5)']);
  });
});

describe('drawConnector (CommunicationTileNoteBottomTopAbstract.java:70-79)', () => {
  const geo = layoutBody('participant A\nparticipant B\nA -> B : hi\nnote bottom : under', MEASURER);
  const note = eventsOf<NoteGeo>(geo, 'note')[0]!;

  it('draws one ULine under translate(x1, y1), the root LineColor and UStroke(2, 2, 1)', () => {
    const c = note.connector!;
    const [line, ...rest] = shapesDrawn((ug) => drawConnector(ug, c));
    expect(rest).toEqual([]);
    expect(shapeLabel(line!.shape)).toBe(`ULine(${c.x2 - c.x1},${c.y2 - c.y1})`);
    expect(line!.chain).toEqual([`translate(${c.x1},${c.y1})`, 'fore(#181818)', 'stroke(2,2,1)']);
  });

  it('lands in BOTH passes: the background pass draws it alone, the foreground after the note', () => {
    const background = shapesDrawn((ug) => drawEventPass(ug, [note], THEME, true));
    const foreground = shapesDrawn((ug) => drawEventPass(ug, [note], THEME, false));
    expect(kindsOf(background).map((k) => k.replace(/\(.*/, ''))).toEqual(['ULine']);
    expect(kindsOf(foreground).map((k) => k.replace(/\(.*/, ''))).toEqual(['UPath', 'UPath', 'ULine']);
    const { connector: _unused, ...bare } = note;
    expect(shapesDrawn((ug) => drawNoteBackground(ug, bare))).toEqual([]);
  });
});

describe('drawGroupingHeader* (ComponentRoseGroupingHeader.java:126-159)', () => {
  const geo = layoutBody(ALT, MEASURER);
  const frame = eventsOf<FrameGeo>(geo, 'frame')[0]!;
  const at = `translate(${frame.x},${frame.y})`;

  it('background: the outline stroke, then fore, then the transparent back, on the rect', () => {
    const [rect, ...rest] = shapesDrawn((ug) => drawGroupingHeaderBackground(ug, frame));
    expect(rest).toEqual([]);
    expect(rect!.chain).toEqual([at, 'stroke(0,0,1.5)', 'fore(#000000)', 'back(none)']);
    expect(shapeLabel(rect!.shape)).toBe(`URectangle(${frame.width},${frame.height})`);
  });

  it('foreground: the corner under the header context, THEN the outline, each on a fresh instance', () => {
    const [corner, rect, ...rest] = shapesDrawn((ug) => drawGroupingHeaderForeground(ug, frame));
    expect(rest).toEqual([]);
    expect(corner!.shape).toBeInstanceOf(UPath);
    expect(corner!.chain).toEqual([at, 'fore(#000000)', 'back(#EEEEEE)', 'stroke(0,0,1.5)']);
    expect(rect!.chain).toEqual([at, 'stroke(0,0,1.5)', 'fore(#000000)']);
    expect(corner!.instance).not.toBe(rect!.instance);
  });

  it('a ref draws its body rect FIRST, then the corner (ComponentRoseReference.java:96,122)', () => {
    const ref = eventsOf<FrameGeo>(
      layoutBody('Alice -> Bob : hello\nref over Alice, Bob : some text', MEASURER),
      'frame',
    )[0]!;
    const drawn = shapesDrawn((ug) => drawGroupingHeaderForeground(ug, ref));
    expect(drawn.map((d) => d.shape.constructor)).toEqual([URectangle, UPath]);
    expect(drawn[0]!.chain).toEqual([`translate(${ref.x},${ref.y})`, 'fore(#000000)', 'back(none)', 'stroke(0,0,1.5)']);
    expect(shapesDrawn((ug) => drawGroupingHeaderBackground(ug, ref))).toEqual([]);
  });

  it('a clipped header keeps the outline alone (DriverPathSvg / DriverTextSvg skipped the tab)', () => {
    const drawn = shapesDrawn((ug) => drawGroupingHeaderForeground(ug, { ...frame, headerClipped: true }));
    expect(drawn.map((d) => d.shape.constructor)).toEqual([URectangle]);
  });
});

describe('drawFrameBlotter (Blotter.java:74-88)', () => {
  it('draws each band on a fresh child of the frame origin: fore, back, dy(y)', () => {
    const frame = eventsOf<FrameGeo>(
      layoutBody(`alt#red #yellow x\nAlice -> Bob : a\nelse y\nBob -> Alice : b\nend`, MEASURER),
      'frame',
    )[0]!;
    const drawn = shapesDrawn((ug) => drawFrameBlotter(ug, frame));
    expect(drawn.length).toBeGreaterThan(0);
    for (const d of drawn) {
      expect(d.chain[0]).toBe(`translate(${frame.x},${frame.y})`);
      expect(d.chain.slice(1, 3)).toEqual(['fore(#FFFF00)', 'back(#FFFF00)']);
      expect(d.chain[3]).toMatch(/^translate\(0,/);
    }
    expect(new Set(drawn.map((d) => d.instance)).size).toBe(drawn.length);
  });
});

describe('drawEventPass: else, newpage (ComponentRoseGroupingElse.java:103-113, ComponentRoseNewpage.java:59-64)', () => {
  it('draws the else rule under stroke(2, 2, 1), the group border, dy(1)', () => {
    const geo = layoutBody(ALT, MEASURER);
    const elseGeo = eventsOf<ElseGeo>(geo, 'else')[0]!;
    const [rule, ...rest] = shapesDrawn((ug) => drawEventPass(ug, [elseGeo], THEME, false));
    expect(rest).toEqual([]);
    expect(shapeLabel(rule!.shape)).toBe(`ULine(${elseGeo.width},0)`);
    expect(rule!.chain).toEqual([
      `translate(${elseGeo.x},${elseGeo.y})`,
      'stroke(2,2,1)',
      'fore(#000000)',
      'translate(0,1)',
    ]);
    expect(shapesDrawn((ug) => drawEventPass(ug, [elseGeo], THEME, true))).toEqual([]);
  });

  it('draws the newpage rule MARGINY below the tile, under the style stroke and colour', () => {
    const geo = layoutBody('Alice -> Bob : a\nnewpage\nAlice -> Bob : b', MEASURER);
    const newpage = eventsOf<NewpageGeo>(geo, 'newpage')[0]!;
    const [rule, ...rest] = shapesDrawn((ug) => drawEventPass(ug, [newpage], THEME, false));
    expect(rest).toEqual([]);
    expect(shapeLabel(rule!.shape)).toBe(`ULine(${newpage.bandWidth},0)`);
    expect(rule!.chain).toEqual([
      `translate(${newpage.bandX},${newpage.y})`,
      'translate(0,10)',
      'stroke(2,2,0.5)',
      'fore(#181818)',
    ]);
    expect(shapesDrawn((ug) => drawEventPass(ug, [newpage], THEME, true))).toEqual([]);
  });
});

describe('drawDivider (ComponentRoseDivider.java:79-126)', () => {
  const geo = layoutBody('Alice -> Bob : hi\n== Init ==', MEASURER);
  const divider = eventsOf<DividerGeo>(geo, 'divider')[0]!;
  const origin = `translate(${divider.bandX},${divider.y})`;

  it('draws the band, the two rules, then the label box, each on its own chain', () => {
    const drawn = shapesDrawn((ug) => drawDivider(ug, divider, THEME));
    expect(drawn.map((d) => d.shape.constructor.name)).toEqual(['URectangle', 'ULine', 'ULine', 'URectangle']);
    const mid = `translate(0,${divider.height / 2})`;
    expect(drawn[0]!.chain).toEqual([
      origin,
      'back(#EEEEEE)',
      mid,
      'fore(#EEEEEE)',
      'translate(0,-1)',
      'stroke(0,0,1)',
    ]);
    expect(drawn[1]!.chain).toEqual([
      origin,
      'back(#EEEEEE)',
      mid,
      'fore(#EEEEEE)',
      'stroke(0,0,1)',
      'fore(#000000)',
      'translate(0,-1)',
    ]);
    expect(drawn[2]!.chain.slice(-1)).toEqual(['translate(0,2)']);
    expect((drawn[0]!.shape as URectangle).getHeight()).toBe(3);
    expect(drawn[3]!.chain.slice(0, 2)).toEqual([origin, 'back(#EEEEEE)']);
  });

  it('draws the empty ==== form as the band and the rules only (:84-85)', () => {
    const empty = eventsOf<DividerGeo>(layoutBody('Alice -> Bob : hi\n====', MEASURER), 'divider')[0]!;
    expect(shapesDrawn((ug) => drawDivider(ug, empty, THEME)).map((d) => d.shape.constructor.name)).toEqual([
      'URectangle',
      'ULine',
      'ULine',
    ]);
  });
});

describe('drawBoxBackground (ComponentRoseEnglober.java:65-71)', () => {
  it('draws one rounded URectangle under translate, fore, back, stroke', () => {
    const geo = layoutBody('box "Group" #LightBlue\nparticipant A\nend box\nA -> A : x', MEASURER);
    const box: BoxGeo = geo.boxes[0]!;
    const [rect, ...rest] = shapesDrawn((ug) => drawBoxBackground(ug, box, THEME));
    expect(rest).toEqual([]);
    expect(shapeLabel(rect!.shape)).toBe(`URectangle(${box.width},${box.height})`);
    expect(rect!.chain[0]).toBe(`translate(${box.x},${box.y})`);
    expect(rect!.chain.slice(1).map((c) => c.split('(')[0])).toEqual(['fore', 'back', 'stroke']);
  });
});

describe('drawLinkAnchors (Worm.java:119-172)', () => {
  const geo = layoutBody(
    ['A -> B : a', '{start} A -> B : b', 'B -> A : c', '{end} B -> A : d', '{start} <-> {end} : some time'].join('\n'),
    MEASURER,
  );

  it('draws the shaft, the UP head, then the DOWN head, each on a fresh child', () => {
    const [link] = geo.linkAnchors!;
    const drawn = shapesDrawn((ug) => drawLinkAnchors(ug, [link!], THEME));
    expect(drawn.map((d) => d.shape.constructor.name)).toEqual(['ULine', 'UPolygon', 'UPolygon']);
    const [shaft, up, down] = drawn;
    expect(shaft!.chain).toEqual([
      'fore(#181818)',
      'back(#181818)',
      `stroke(0,0,${link!.thickness})`,
      `translate(${link!.x},${link!.yStart})`,
    ]);
    // `ug.apply(UStroke.withThickness(1.5))`, then on a child `apply(UTranslate.point(p))
    // .apply(UStroke.simple())` (`Worm.java:160-171`).
    expect(up!.chain).toEqual([
      'fore(#181818)',
      'back(#181818)',
      'stroke(0,0,1.5)',
      `translate(${link!.x},${link!.yStart})`,
      'stroke(0,0,1)',
    ]);
    expect(down!.chain[3]).toBe(`translate(${link!.x},${link!.yEnd})`);
    expect(new Set(drawn.map((d) => d.instance)).size).toBe(3);
    // The head polygon is in its own local frame, not at the tip.
    expect((up!.shape as UPolygon).getPoints()[0]).toEqual({ x: -4, y: 10 });
  });
});
