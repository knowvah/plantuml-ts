/**
 * A `UGraphic` that records every `draw(shape)` as the shape's kind, the
 * accumulated translate at draw time and the shape's own extent — the same
 * pattern as `tests/unit/core/klimt/creole/atom/Skeleton2.test.ts`'s
 * `RecordingUGraphic`. Coordinates are rounded to 4 decimals, the SVG
 * writer's precision, so expectations can be read straight off a jar
 * `in.svg` (`x1`/`y1`/`x2`/`y2`, `rect x`/`y`).
 */
import { ULine } from '../../../../src/core/klimt/shape/ULine.js';
import { URectangle } from '../../../../src/core/klimt/shape/URectangle.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import type { UChange } from '../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import type { UShape } from '../../../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';

/** One recorded draw: a `line` from (x1,y1) to (x2,y2), or a `rect` at (x1,y1) sized (x2-x1)x(y2-y1). */
export interface DrawEvent {
  readonly kind: 'line' | 'rect';
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

const SVG_PRECISION = 10_000;

function round(v: number): number {
  return Math.round(v * SVG_PRECISION) / SVG_PRECISION;
}

const sb: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

export class RecordingUGraphic implements UGraphic {
  constructor(
    readonly events: DrawEvent[] = [],
    private readonly translate: UTranslate = UTranslate.none(),
  ) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.events, this.translate.compose(change));
    return this;
  }

  draw(shape: UShape): void {
    const { x, y } = this.translate.getPosition();
    if (shape instanceof URectangle) {
      this.events.push(event('rect', x, y, x + shape.getWidth(), y + shape.getHeight()));
      return;
    }
    if (shape instanceof ULine) {
      this.events.push(event('line', x, y, x + shape.getDX(), y + shape.getDY()));
      return;
    }
    throw new Error(`unexpected shape ${shape.constructor.name}`);
  }

  getParam(): never {
    throw new Error('not needed');
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    return sb;
  }
}

function event(kind: DrawEvent['kind'], x1: number, y1: number, x2: number, y2: number): DrawEvent {
  return { kind, x1: round(x1), y1: round(y1), x2: round(x2), y2: round(y2) };
}

/** SVG `<line x1 y1 x2 y2>` as a `DrawEvent`. */
export function line(x1: number, y1: number, x2: number, y2: number): DrawEvent {
  return { kind: 'line', x1, y1, x2, y2 };
}

/** SVG `<rect x y width height>` as a `DrawEvent`. */
export function rect(x: number, y: number, width: number, height: number): DrawEvent {
  return { kind: 'rect', x1: x, y1: y, x2: x + width, y2: y + height };
}
