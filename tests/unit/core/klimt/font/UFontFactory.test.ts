/**
 * `UFontFactory.serif`/`sansSerif`/`monospace`/`byDefault`
 * (klimt/font/UFontFactory.java:54-68): `build(FontStack.X,
 * UFontFace.normal(), size)`; `byDefault` ignores its argument.
 */
import { describe, expect, it } from 'vitest';
import { FontStack } from '../../../../../src/core/klimt/font/FontStack.js';
import type { UFont } from '../../../../../src/core/klimt/font/UFont.js';
import { UFontFactory } from '../../../../../src/core/klimt/font/UFontFactory.js';

/** The fields `UFont.equals` compares upstream (fontStack, face, size; UFont.java:159-171). */
function shape(f: UFont): { family: string; face: unknown; size: number } {
  return { family: f.getFontStack().getFullDefinition(), face: f.getFontFace(), size: f.getSize() };
}

const NORMAL = { cssWeight: 400, italic: false };

describe('UFontFactory shortcuts (UFontFactory.java:54-68)', () => {
  it('serif(n) is the Serif stack, normal face, size n (java:54-56)', () => {
    expect(shape(UFontFactory.serif(11))).toEqual({ family: FontStack.SERIF, face: NORMAL, size: 11 });
  });

  it('sansSerif(n) is the SansSerif stack, normal face, size n (java:58-60)', () => {
    expect(shape(UFontFactory.sansSerif(13))).toEqual({ family: FontStack.SANS_SERIF, face: NORMAL, size: 13 });
  });

  it('monospace(n) is the Monospaced stack, normal face, size n (java:62-64)', () => {
    expect(shape(UFontFactory.monospace(9))).toEqual({ family: FontStack.MONOSPACE, face: NORMAL, size: 9 });
  });

  it('byDefault(size) is sansSerif(12) whatever the size (java:66-68)', () => {
    expect(shape(UFontFactory.byDefault(10))).toEqual(shape(UFontFactory.sansSerif(12)));
    expect(UFontFactory.byDefault(40).getSize()).toBe(12);
  });
});
