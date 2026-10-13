import { describe, expect, it } from 'vitest';
import { WBSLink, type WElementGeometry } from '../../../src/diagrams/wbs/WBSLink.js';
import { Fore } from '../../../src/core/klimt/Fore.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import { ULine } from '../../../src/core/klimt/shape/ULine.js';
import type { UPolygon } from '../../../src/core/klimt/shape/UPolygon.js';
import type { UChange } from '../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../src/core/klimt/UParam.js';
import type { UShape } from '../../../src/core/klimt/UShape.js';
import type { HColorOrPaint } from '../../../src/core/klimt/color/ColorMapper.js';

const LINK_COLOR: HColorOrPaint = '#181818';
const UNUSED = (): never => {
  throw new Error('not used in these tests');
};

interface Recorded {
  readonly applied: readonly UChange[];
  readonly shape: UShape;
}

/** Records each draw with the changes applied so far (a minimal UGraphic double). */
class RecordingUGraphic implements UGraphic {
  constructor(
    private readonly log: Recorded[],
    private readonly applied: readonly UChange[] = [],
  ) {}

  apply(change: UChange): UGraphic {
    return new RecordingUGraphic(this.log, [...this.applied, change]);
  }

  draw(shape: UShape): void {
    this.log.push({ applied: this.applied, shape });
  }

  getParam(): UParam {
    const fore = [...this.applied].reverse().find((c): c is Fore => c instanceof Fore);
    return {
      getStroke: UNUSED,
      getColor: () => fore?.getColor() ?? '#000000',
      getBackcolor: UNUSED,
      getTranslate: UNUSED,
    };
  }

  getTranslate = UNUSED;
  getStringBounder = UNUSED;
}

function element(x: number, y: number, w: number, h: number): WElementGeometry {
  return { getPosition: () => new UTranslate(x, y), getDimension: () => new XDimension2D(w, h) };
}

const NO_GEOMETRY: WElementGeometry = { getPosition: () => undefined, getDimension: () => undefined };

function draw(link: WBSLink): Recorded[] {
  const log: Recorded[] = [];
  link.drawU(new RecordingUGraphic(log));
  return log;
}

describe('WBSLink', () => {
  it('throws when the colour is missing (WBSLink.java:9-10)', () => {
    expect(() => new WBSLink(element(0, 0, 1, 1), element(0, 0, 1, 1), undefined)).toThrow(Error);
  });

  it('exposes both elements', () => {
    const e1 = element(0, 0, 1, 1);
    const e2 = element(5, 5, 1, 1);
    const link = new WBSLink(e1, e2, LINK_COLOR);
    expect(link.getElement1()).toBe(e1);
    expect(link.getElement2()).toBe(e2);
  });

  it('draws right-edge-centre to left-edge-centre for rectangles 100 apart', () => {
    const log = draw(new WBSLink(element(0, 0, 40, 20), element(140, 0, 40, 20), LINK_COLOR));
    const [line, arrow] = log;
    expect(log).toHaveLength(2);
    expect(line!.applied[1]).toEqual(new UTranslate(40, 10));
    expect(line!.shape).toEqual(new ULine(100, 0));
    expect((line!.applied[0] as Fore).getColor()).toBe(LINK_COLOR);
    const tip = (arrow!.shape as UPolygon).getPoint(0);
    expect(tip.x).toBeCloseTo(140, 9);
    expect(tip.y).toBeCloseTo(10, 9);
  });

  it('matches the jar for WBS-arrow-0 (TLB -> TLA)', () => {
    // in.svg: <line x1="113.4" y1="114" x2="93.4" y2="114"> and the polygon tip at 93.4,114
    const tla = element(20, 92, 73.4, 44);
    const tlb = element(113.4, 92, 73.4, 44);
    const [line, arrow] = draw(new WBSLink(tlb, tla, LINK_COLOR));
    expect(line!.applied[1]).toEqual(new UTranslate(113.4, 114));
    const ul = line!.shape as ULine;
    expect(113.4 + ul.getDX()).toBeCloseTo(93.4, 9);
    expect(ul.getDY()).toBe(0);
    const pts = (arrow!.shape as UPolygon).getPoints();
    const expected = [
      [93.4, 114],
      [102.4, 118],
      [98.4, 114],
      [102.4, 110],
      [93.4, 114],
    ];
    expect(pts).toHaveLength(5);
    expected.forEach(([x, y], i) => {
      expect(pts[i]!.x).toBeCloseTo(x!, 9);
      expect(pts[i]!.y).toBeCloseTo(y!, 9);
    });
  });

  it('draws nothing when either element has no geometry', () => {
    expect(draw(new WBSLink(NO_GEOMETRY, element(0, 0, 1, 1), LINK_COLOR))).toEqual([]);
    expect(draw(new WBSLink(element(0, 0, 1, 1), NO_GEOMETRY, LINK_COLOR))).toEqual([]);
  });

  it('fails like upstream when the centre line crosses no edge (null XPoint2D)', () => {
    // Identical rectangles: zero-length centre line, no intersection (java NPE in XLine2D.line).
    expect(() => draw(new WBSLink(element(0, 0, 10, 10), element(0, 0, 10, 10), LINK_COLOR))).toThrow(Error);
  });
});
