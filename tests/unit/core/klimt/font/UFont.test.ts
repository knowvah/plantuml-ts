import { describe, expect, it } from 'vitest';
import { FontStack } from '../../../../../src/core/klimt/font/FontStack.js';
import { UFont } from '../../../../../src/core/klimt/font/UFont.js';
import { UFontFactory } from '../../../../../src/core/klimt/font/UFontFactory.js';

describe('FontStack (FontStack.java)', () => {
  it('getSvgFamily maps the three logical families, else swaps " for \' (java:178-188)', () => {
    expect(FontStack.build(FontStack.SERIF).getSvgFamily()).toBe('serif');
    expect(FontStack.build(FontStack.SANS_SERIF).getSvgFamily()).toBe('sans-serif');
    expect(FontStack.build(FontStack.MONOSPACE).getSvgFamily()).toBe('monospace');
    expect(FontStack.build('"A B", Arial').getSvgFamily()).toBe("'A B', Arial");
  });

  it('value equality on the full definition; toString and getFullDefinition (java:154-176)', () => {
    const a = FontStack.build('Arial, Helvetica');
    expect(a.equals(FontStack.build('Arial, Helvetica'))).toBe(true);
    expect(a.equals(FontStack.build('Arial'))).toBe(false);
    expect(a.equals('Arial, Helvetica')).toBe(false);
    expect(a.toString()).toBe('FontStack[Arial, Helvetica]');
    expect(a.getFullDefinition()).toBe('Arial, Helvetica');
  });
});

describe('UFont / UFontFactory.build (UFont.java:61-101, UFontFactory.java:48-52)', () => {
  it('a missing face is UFontFace.normal(); size and size2D are the int size', () => {
    const f = UFontFactory.build('Serif', undefined, 11);
    expect(f.getFontFace()).toEqual({ cssWeight: 400, italic: false });
    expect(f.getSize()).toBe(11);
    expect(f.getSize2D()).toBe(11);
    expect(f.getFontStack().getFullDefinition()).toBe('Serif');
    expect(f).toBeInstanceOf(UFont);
  });

  it('keeps a given face', () => {
    expect(UFontFactory.build('X', { cssWeight: 300, italic: true }, 9).getFontFace()).toEqual({
      cssWeight: 300,
      italic: true,
    });
  });
});
