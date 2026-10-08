import { describe, it, expect } from 'vitest';
import { applySkinLayer } from '../../src/core/skin-loader.js';
import { defaultTheme, resolveElementShadowing } from '../../src/core/theme.js';

describe('applySkinLayer -- skin-file-loading mission Batch 1', () => {
  it('is a no-op when no skin directive is present', () => {
    const result = applySkinLayer({ skin: undefined }, defaultTheme);
    expect(result).toBe(defaultTheme);
  });

  it('is a no-op for an unrecognized skin name', () => {
    const result = applySkinLayer({ skin: 'not-a-real-skin' }, defaultTheme);
    expect(result).toBe(defaultTheme);
  });

  it('resolves rose colors: root BackgroundColor/LineColor', () => {
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(result.colors.graph.rootElementBackground).toBe('#FEFECE');
    expect(result.colors.border).toBe('#A80036');
  });

  it('resolves rose Shadowing 4.0 from the bare element {} selector', () => {
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(result.shadowing).toBe(4);
  });

  it('captures rose per-bucket Shadowing overrides (element {} general subset matcher follow-on)', () => {
    // rose declares `element { Shadowing 4.0 }` (global default) plus
    // per-USymbol overrides: `node { Shadowing 2.0 }`,
    // `rectangle { Shadowing 3.0 }`, `component { Shadowing 4.0 }`, ...
    // Each must land on `elements[sname].shadowing`, NOT collapse to 4.
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(result.colors.elements?.node?.shadowing).toBe(2);
    expect(result.colors.elements?.rectangle?.shadowing).toBe(3);
    expect(result.colors.elements?.database?.shadowing).toBe(3);
    expect(result.colors.elements?.component?.shadowing).toBe(4);
  });

  it('cascades rose per-bucket Shadowing over the global element default', () => {
    // `resolveElementShadowing` prefers the specific bucket, falling back to
    // the diagram-wide `theme.shadowing` for USymbol kinds rose leaves alone.
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(resolveElementShadowing(result, 'node')).toBe(2); // specific wins
    expect(resolveElementShadowing(result, 'rectangle')).toBe(3);
    expect(resolveElementShadowing(result, 'interface')).toBe(4); // -> global
    expect(resolveElementShadowing(result, 'actor')).toBe(4); // -> global
  });

  it('resolves rose document { BackgroundColor white } as the canvas background, not the entity default', () => {
    // root's own BackGroundColor is #FEFECE (entity-fill default); document's
    // is white -- both must resolve to DIFFERENT theme fields.
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(result.colors.background).toBe('white');
    expect(result.colors.graph.rootElementBackground).toBe('#FEFECE');
  });

  it('resolves debug colors: root BackgroundColor/LineColor and the element {} override', () => {
    const result = applySkinLayer({ skin: 'debug' }, defaultTheme);
    // debug.skin has no `document {}` block, so root's own BackgroundColor
    // (#AAA) is what reaches the canvas.
    expect(result.colors.background).toBe('#AAA');
    expect(result.colors.border).toBe('#3600A8');
    // debug.skin's `element { BackGroundColor #CEFEFE }` overrides root's
    // #AAA for the entity-fill default specifically (registered later).
    expect(result.colors.graph.rootElementBackground).toBe('#CEFEFE');
  });

  it('resolves debug Shadowing 0.0 -- root sets it, element does not override it', () => {
    const result = applySkinLayer({ skin: 'debug' }, defaultTheme);
    expect(result.shadowing).toBe(0);
  });

  it('resolves strictuml Shadowing 0.0 from both root and element', () => {
    const result = applySkinLayer({ skin: 'strictuml' }, defaultTheme);
    expect(result.shadowing).toBe(0);
  });

  it('keys the registry by the lowercase resource name', () => {
    // The lookup is case-sensitive, as the jar's `getResourceAsStream` is:
    // `skin Rose` is upstream's "Cannot find style Rose" (unwind2-S8).
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(result).not.toBe(defaultTheme);
  });
});

describe('applySkinLayer -- the jar style-grammar sonyxperiadev.skin (unwind2-S8)', () => {
  it('applies the sheet as runs, the later "specifics" root over the plantuml.skin copy', () => {
    // sonyxperiadev.skin:565-570 -- `root { FontName Arial; FontColor #333333 }`
    // after the copied plantuml.skin root (`FontName SansSerif; FontColor black`).
    const result = applySkinLayer({ skin: 'sonyxperiadev' }, defaultTheme);
    expect(result.fontFamily).toBe('Arial');
    expect(result.colors.text).toBe('#333333');
    // sonyxperiadev.skin:576-581 -- `note { BackGroundColor #ffffcd; LineColor #a9a980 }`
    expect(result.colors.elements?.note?.background).toBe('#ffffcd');
    expect(result.colors.elements?.note?.border).toBe('#a9a980');
  });

  it('ignores the @media dark-scheme section (StyleParser.java:150-152)', () => {
    // sonyxperiadev.skin's dark section sets `root { BackGroundColor #313139 }`
    // and `document { BackGroundColor #1B1B1B }`; neither reaches a light render.
    const result = applySkinLayer({ skin: 'sonyxperiadev' }, defaultTheme);
    expect(result.colors.background).not.toBe('#1B1B1B');
    expect(result.colors.graph.rootElementBackground).toBe('#f1f1f1');
  });

  it('has no reddress: the jar bundles no reddress.skin, so nothing applies', () => {
    expect(applySkinLayer({ skin: 'reddress' }, defaultTheme)).toEqual(defaultTheme);
  });
});
