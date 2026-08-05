/**
 * TextBlockWithUrl.test.ts — SI1/T4: unit coverage for the ported
 * `src/core/klimt/shape/TextBlockWithUrl.ts`
 * (klimt/shape/TextBlockWithUrl.java).
 */
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '../../../../../src/core/klimt/shape/TextBlock.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { XRectangle2D } from '../../../../../src/core/klimt/geom/XRectangle2D.js';
import { MinMax } from '../../../../../src/core/klimt/geom/MinMax.js';
import { MagneticBorderNone } from '../../../../../src/core/klimt/geom/MagneticBorderNone.js';
import { TextBlockWithUrl, type Url } from '../../../../../src/core/klimt/shape/TextBlockWithUrl.js';

const stubStringBounder: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

const URL: Url = {
  getUrl: () => 'https://plantuml.com',
  getTooltip: () => 'tip',
  getLabel: () => 'label',
};

function plainBlock(events: string[] = []): TextBlock {
  return {
    calculateDimension: () => new XDimension2D(11, 7),
    drawU: () => {
      events.push('draw');
    },
  };
}

/** UGraphic stub exposing the duck-typed startUrl/closeUrl capability. */
function urlAwareUGraphic(events: string[]): UGraphic & { startUrl(url: Url): void; closeUrl(): void } {
  const ug = {
    apply: () => ug,
    draw: () => undefined,
    getParam: () => {
      throw new Error('not needed');
    },
    getTranslate: () => {
      throw new Error('not needed');
    },
    getStringBounder: () => stubStringBounder,
    startUrl: (url: Url) => {
      events.push(`startUrl:${url.getUrl()}`);
    },
    closeUrl: () => {
      events.push('closeUrl');
    },
  } as unknown as UGraphic & { startUrl(url: Url): void; closeUrl(): void };
  return ug;
}

describe('TextBlockWithUrl (klimt/shape/TextBlockWithUrl.java)', () => {
  it('withUrl returns the block unchanged for a missing url (:54-56)', () => {
    const block = plainBlock();
    expect(TextBlockWithUrl.withUrl(block, undefined)).toBe(block);
  });

  it('drawU wraps the inner draw in startUrl/closeUrl (:66-70)', () => {
    const events: string[] = [];
    const wrapped = TextBlockWithUrl.withUrl(plainBlock(events), URL);
    wrapped.drawU(urlAwareUGraphic(events));
    expect(events).toEqual(['startUrl:https://plantuml.com', 'draw', 'closeUrl']);
  });

  it('drawU still draws through a UGraphic without url support', () => {
    const events: string[] = [];
    const wrapped = TextBlockWithUrl.withUrl(plainBlock(events), URL);
    const bare: UGraphic = {
      apply: () => bare,
      draw: () => undefined,
      getParam: () => {
        throw new Error('not needed');
      },
      getTranslate: () => {
        throw new Error('not needed');
      },
      getStringBounder: () => stubStringBounder,
    };
    wrapped.drawU(bare);
    expect(events).toEqual(['draw']);
  });

  it('calculateDimension delegates to the wrapped block (:73-76)', () => {
    const wrapped = TextBlockWithUrl.withUrl(plainBlock(), URL);
    const dim = wrapped.calculateDimension(stubStringBounder);
    expect([dim.getWidth(), dim.getHeight()]).toEqual([11, 7]);
  });

  it('getMinMax delegates when the block supports it, throws otherwise (:78-80)', () => {
    const minMax = MinMax.fromMax(5, 6);
    const supporting = {
      ...plainBlock(),
      getMinMax: () => minMax,
    };
    const wrapped = TextBlockWithUrl.withUrl(supporting, URL) as TextBlockWithUrl;
    expect(wrapped.getMinMax(stubStringBounder)).toBe(minMax);
    const bare = TextBlockWithUrl.withUrl(plainBlock(), URL) as TextBlockWithUrl;
    expect(() => bare.getMinMax(stubStringBounder)).toThrow();
  });

  it('getInnerPosition delegates, undefined when unsupported (:83-85)', () => {
    const rect = new XRectangle2D(1, 2, 3, 4);
    const supporting = {
      ...plainBlock(),
      getInnerPosition: (member: string) => (member === 'm' ? rect : undefined),
    };
    const wrapped = TextBlockWithUrl.withUrl(supporting, URL) as TextBlockWithUrl;
    expect(wrapped.getInnerPosition('m', stubStringBounder)).toBe(rect);
    const bare = TextBlockWithUrl.withUrl(plainBlock(), URL) as TextBlockWithUrl;
    expect(bare.getInnerPosition('m', stubStringBounder)).toBeUndefined();
  });

  it('getMagneticBorder delegates with the MagneticBorderNone default (:88-90)', () => {
    const bare = TextBlockWithUrl.withUrl(plainBlock(), URL) as TextBlockWithUrl;
    expect(bare.getMagneticBorder()).toBeInstanceOf(MagneticBorderNone);
  });

  it('getBackcolor delegates, undefined when unsupported (:93-95)', () => {
    const supporting = {
      ...plainBlock(),
      getBackcolor: () => '#aabbcc',
    };
    const wrapped = TextBlockWithUrl.withUrl(supporting, URL) as TextBlockWithUrl;
    expect(wrapped.getBackcolor()).toBe('#aabbcc');
    const bare = TextBlockWithUrl.withUrl(plainBlock(), URL) as TextBlockWithUrl;
    expect(bare.getBackcolor()).toBeUndefined();
  });
});
