/**
 * TextBlockSprited.test.ts — T9c: unit coverage for `TextBlockSprited`
 * (klimt/shape/TextBlockSprited.java) -- prefixes a `TextBlock` with a
 * small circled-character/sprite decoration.
 */
import { describe, expect, it } from 'vitest';
import { TextBlockSprited } from '../../../../../src/core/klimt/shape/TextBlockSprited.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import type { TextBlock } from '../../../../../src/core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { UShape } from '../../../../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
const sb: StringBounder = new FakeStringBounder();

function fixedBlock(width: number, height: number, name: string): TextBlock {
  return {
    calculateDimension: (): XDimension2D => new XDimension2D(width, height),
    drawU: (ug: UGraphic): void => {
      recorded.push({ name, translate: ug.getTranslate() });
    },
  };
}

let recorded: { name: string; translate: UTranslate }[] = [];

class RecordingUGraphic implements UGraphic {
  constructor(private readonly translate: UTranslate = UTranslate.none()) {}
  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new RecordingUGraphic(this.translate.compose(change));
    return this;
  }
  draw(_shape: UShape): void {}
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

describe('TextBlockSprited', () => {
  it('calculateDimension: width = sprite width + 6 + parent width; height = max(sprite, parent)', () => {
    const sprite = fixedBlock(4, 10, 'sprite');
    const parent = fixedBlock(20, 6, 'parent');
    const tb = new TextBlockSprited(sprite, parent);
    expect(tb.calculateDimension(sb)).toEqual(new XDimension2D(4 + 6 + 20, 10));
  });

  it('height uses the parent when it is taller than the sprite', () => {
    const sprite = fixedBlock(4, 5, 'sprite');
    const parent = fixedBlock(20, 30, 'parent');
    const tb = new TextBlockSprited(sprite, parent);
    expect(tb.calculateDimension(sb).getHeight()).toBe(30);
  });

  it('drawU draws the sprite at the origin, then the parent shifted right by (sprite width + 6)', () => {
    recorded = [];
    const sprite = fixedBlock(4, 10, 'sprite');
    const parent = fixedBlock(20, 6, 'parent');
    const tb = new TextBlockSprited(sprite, parent);
    tb.drawU(new RecordingUGraphic());
    expect(recorded).toEqual([
      { name: 'sprite', translate: UTranslate.none() },
      { name: 'parent', translate: new UTranslate(10, 0) },
    ]);
  });
});
