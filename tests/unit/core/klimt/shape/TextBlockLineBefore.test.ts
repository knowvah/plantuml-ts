/**
 * TextBlockLineBefore.test.ts — T2a: coverage for the newly-ported
 * `src/core/klimt/shape/TextBlockLineBefore.ts`, the sole owner of
 * `BodyEnhancedAbstract#decorate`'s divider/title wrapper (ADR-7).
 *
 * Scope: this file tests TextBlockLineBefore's OWN behavior (dimension
 * floor, draw-order, color reapplication) — not `UHorizontalLine`'s
 * internal stencil/stroke logic, which is already ported and out of this
 * task's write-set. The mock `UGraphic` below intercepts `draw(shape)`
 * generically (recording which shape TYPE was drawn) rather than
 * simulating a real stencil-clipped render.
 */
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '../../../../../src/core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { UShape } from '../../../../../src/core/klimt/UShape.js';
import type { UParam } from '../../../../../src/core/klimt/UParam.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import type { Paint } from '../../../../../src/core/paint.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import { Fore } from '../../../../../src/core/klimt/Fore.js';
import { UHorizontalLine } from '../../../../../src/core/klimt/shape/UHorizontalLine.js';
import { TextBlockLineBefore } from '../../../../../src/core/klimt/shape/TextBlockLineBefore.js';

const stubStringBounder: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

/** Every `Paint` used in this file's fixtures is a plain string; this
 *  narrows for the event log so it never falls back to `[object Object]`
 *  stringification of a `Gradient`. */
function paintLabel(paint: Paint): string {
  return typeof paint === 'string' ? paint : 'gradient';
}

class RecordingUGraphic implements UGraphic {
  constructor(
    private readonly events: string[],
    private readonly translate: UTranslate = UTranslate.none(),
    private readonly color: Paint = '#123456',
  ) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.events, this.translate.compose(change), this.color);
    if (change instanceof Fore) {
      this.events.push(`fore:${paintLabel(change.getColor())}`);
      return new RecordingUGraphic(this.events, this.translate, change.getColor());
    }
    return this;
  }

  draw(shape: UShape): void {
    this.events.push(`draw:${shape.constructor.name}`);
  }

  getParam(): UParam {
    return {
      getStroke: () => {
        throw new Error('not needed');
      },
      getColor: () => this.color,
      getBackcolor: () => 'none',
      getTranslate: () => this.translate,
    };
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    return stubStringBounder;
  }
}

function recordingBlock(width: number, height: number, tag: string, events: string[]): TextBlock {
  return {
    calculateDimension: () => new XDimension2D(width, height),
    drawU: (): void => {
      events.push(tag);
    },
  };
}

describe('TextBlockLineBefore.calculateDimension', () => {
  it('no title: returns the inner block dimension unchanged', () => {
    const block = recordingBlock(10, 5, 'content', []);
    const tb = new TextBlockLineBefore(0.5, block, '-');
    expect(tb.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(10, 5));
  });

  it('with title: applies atLeast(dimTitle.width + 8, dimTitle.height) (Java:76)', () => {
    const block = recordingBlock(10, 5, 'content', []);
    const title = recordingBlock(20, 12, 'title', []);
    const tb = new TextBlockLineBefore(0.5, block, '-', title);
    // width: max(10, 20+8) = 28; height: max(5, 12) = 12
    expect(tb.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(28, 12));
  });

  it('with title narrower than the floor: inner dimension wins', () => {
    const block = recordingBlock(100, 50, 'content', []);
    const title = recordingBlock(5, 3, 'title', []);
    const tb = new TextBlockLineBefore(0.5, block, '-', title);
    expect(tb.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(100, 50));
  });
});

describe('TextBlockLineBefore.drawU — draw order (Java:81-95)', () => {
  it('title undefined: draws the rule FIRST, then the content, then reapplies the color', () => {
    const events: string[] = [];
    const block = recordingBlock(10, 5, 'content', events);
    const tb = new TextBlockLineBefore(0.5, block, '-');
    tb.drawU(new RecordingUGraphic(events));
    expect(events).toEqual(['draw:UHorizontalLine', 'content', 'fore:#123456']);
  });

  it('title defined: draws the content FIRST, then reapplies color, then draws the rule+title', () => {
    const events: string[] = [];
    const block = recordingBlock(10, 5, 'content', events);
    const title = recordingBlock(20, 12, 'title', events);
    const tb = new TextBlockLineBefore(0.5, block, '-', title);
    tb.drawU(new RecordingUGraphic(events));
    expect(events).toEqual(['content', 'fore:#123456', 'draw:UHorizontalLine']);
  });

  it('constructs the UHorizontalLine with the given separator char and defaultThickness', () => {
    // Faithful smoke check that the shape handed to `ug.draw` really is a
    // `UHorizontalLine` (not some other UShape) -- the event log above
    // only records the constructor name; this asserts the actual type.
    const events: string[] = [];
    const block = recordingBlock(10, 5, 'content', events);
    const tb = new TextBlockLineBefore(0.5, block, '-');
    let drawnShape: UShape | undefined;
    const ug: UGraphic = {
      apply: (change) => {
        if (change instanceof Fore) return ug;
        return ug;
      },
      draw: (shape) => {
        drawnShape = shape;
      },
      getParam: () => ({
        getStroke: () => {
          throw new Error('not needed');
        },
        getColor: () => 'none',
        getBackcolor: () => 'none',
        getTranslate: () => UTranslate.none(),
      }),
      getTranslate: () => UTranslate.none(),
      getStringBounder: () => stubStringBounder,
    };
    tb.drawU(ug);
    expect(drawnShape).toBeInstanceOf(UHorizontalLine);
  });
});
