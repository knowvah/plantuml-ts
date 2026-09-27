import { describe, it, expect } from 'vitest';
import { computeClassStyleCascadeOverrides } from '../../../src/core/style-cascade-class.js';
import type { StyleMap } from '../../../src/core/skinparam.js';

function styleMap(spec: Record<string, Record<string, string>>): StyleMap {
  const m: StyleMap = new Map();
  for (const [sel, decls] of Object.entries(spec)) m.set(sel, new Map(Object.entries(decls)));
  return m;
}

// cdd3-T24 (C-6, E3-8): `Style#value(PName.LineThickness)` / `.value(
// PName.LineColor)` resolved over `EntityImageClass`'s `{root,element,
// classDiagram,class_}` and `EntityImageNote`'s `{root,element,classDiagram,
// note}` signatures (`style-cascade-class-snames.ts`).
describe('computeClassStyleCascadeOverrides -- LineThickness / note LineColor (cdd3-T24)', () => {
  it('rose.skin:11 root { LineThickness 1.0 } reaches both the class and the note thickness', () => {
    const o = computeClassStyleCascadeOverrides(styleMap({ root: { linethickness: '1.0' } }));
    expect(o.classCascadeLineThickness).toBe(1);
    expect(o.noteCascadeLineThickness).toBe(1);
  });

  it('class { LineThickness 2 } reaches the class only', () => {
    const o = computeClassStyleCascadeOverrides(styleMap({ class: { linethickness: '2' } }));
    expect(o.classCascadeLineThickness).toBe(2);
    expect(o.noteCascadeLineThickness).toBeUndefined();
  });

  it('note { LineThickness 3; LineColor green } reaches the note only', () => {
    const o = computeClassStyleCascadeOverrides(styleMap({ note: { linethickness: '3', linecolor: 'green' } }));
    expect(o.noteCascadeLineThickness).toBe(3);
    expect(o.noteCascadeBorder).toBe('#008000');
    expect(o.classCascadeLineThickness).toBeUndefined();
  });

  it('classDiagram { LineColor red } reaches the note border (NOTE_SNAMES carries classDiagram)', () => {
    const o = computeClassStyleCascadeOverrides(styleMap({ classdiagram: { linecolor: 'red' } }));
    expect(o.noteCascadeBorder).toBe('#FF0000');
  });

  it('a non-numeric LineThickness is ignored', () => {
    const o = computeClassStyleCascadeOverrides(styleMap({ root: { linethickness: 'thick' } }));
    expect(o.classCascadeLineThickness).toBeUndefined();
    expect(o.noteCascadeLineThickness).toBeUndefined();
  });
});
