import { describe, expect, it } from 'vitest';
import { Back } from '../../../src/core/klimt/Back.js';
import type { UChange } from '../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { UStroke } from '../../../src/core/klimt/UStroke.js';
import type { UShape } from '../../../src/core/klimt/UShape.js';
import { UPath } from '../../../src/core/klimt/shape/UPath.js';
import type { UPolygon } from '../../../src/core/klimt/shape/UPolygon.js';
import { GArrows } from '../../../src/diagrams/gantt/GArrows.js';
import { GSide } from '../../../src/diagrams/gantt/core/GSide.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GArrows.java:44-107

interface Drawn {
  changes: UChange[];
  shape: UShape;
}

/** Immutable-apply recorder sharing one draw log. */
class RecordingUGraphic {
  constructor(
    readonly drawn: Drawn[],
    readonly changes: UChange[] = [],
  ) {}
  apply(change: UChange): UGraphic {
    return new RecordingUGraphic(this.drawn, [...this.changes, change]) as unknown as UGraphic;
  }
  draw(shape: UShape): void {
    this.drawn.push({ changes: this.changes, shape });
  }
}

function draw(arrows: GArrows): Drawn[] {
  const drawn: Drawn[] = [];
  arrows.drawU(new RecordingUGraphic(drawn) as unknown as UGraphic);
  return drawn;
}

const BACK = '#112233';

describe('GArrows', () => {
  it('LEFT: path ends 3px short of the last point, head points right (java:57-107)', () => {
    const arrows = new GArrows(GSide.LEFT, BACK);
    arrows.addPoint(10, 20);
    arrows.addPoint(30, 20);
    arrows.addPoint(30, 40);

    const [pathDraw, headDraw] = draw(arrows);
    const path = pathDraw?.shape as UPath;
    expect(path).toBeInstanceOf(UPath);
    expect(path.size()).toBe(3);
    expect([path.getMinX(), path.getMinY(), path.getMaxX(), path.getMaxY()]).toEqual([10, 20, 30, 40]);
    // lastPointPatched: x - 3 for LEFT (java:72-79) -> third point (27, 40)
    expect(pathDraw?.changes).toEqual([]);

    const head = headDraw?.shape as UPolygon;
    expect(head.getPoints()).toEqual([
      { x: 26, y: 36 },
      { x: 30, y: 40 },
      { x: 26, y: 44 },
      { x: 26, y: 36 },
    ]);
    expect(headDraw?.changes).toEqual([UStroke.simple(), new Back(BACK)]);
  });

  it('RIGHT: path ends 3px past the last point, head points left', () => {
    const arrows = new GArrows(GSide.RIGHT, BACK);
    arrows.addPoint(10, 20);
    arrows.addPoint(30, 20);

    const [pathDraw, headDraw] = draw(arrows);
    const path = pathDraw?.shape as UPath;
    expect(path.size()).toBe(2);
    expect(path.getMaxX()).toBe(33);
    expect((headDraw?.shape as UPolygon).getPoints()).toEqual([
      { x: 34, y: 16 },
      { x: 30, y: 20 },
      { x: 34, y: 24 },
      { x: 34, y: 16 },
    ]);
  });

  it('any other side leaves the last point unpatched and draws an empty head (java:72-79,105-106)', () => {
    const arrows = new GArrows(GSide.TOP_LEFT, BACK);
    arrows.addPoint(1, 2);
    arrows.addPoint(5, 2);

    const [pathDraw, headDraw] = draw(arrows);
    expect((pathDraw?.shape as UPath).getMaxX()).toBe(5);
    expect((headDraw?.shape as UPolygon).getPoints()).toEqual([]);
  });

  it('drawing with no points is an IndexOutOfBoundsException (points.get(0))', () => {
    expect(() => draw(new GArrows(GSide.LEFT, BACK))).toThrow('IndexOutOfBoundsException');
  });
});
