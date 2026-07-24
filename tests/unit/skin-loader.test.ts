import { describe, it, expect } from 'vitest';
import { applySkinLayer } from '../../src/core/skin-loader.js';
import { defaultTheme } from '../../src/core/theme.js';

describe('applySkinLayer -- skin-file-loading mission Batch 1', () => {
  it('is a no-op when no skin directive is present', () => {
    const result = applySkinLayer({ skin: undefined }, defaultTheme);
    expect(result).toBe(defaultTheme);
  });

  it('is a no-op for an unrecognized/preprocessor-grammar skin name (D1)', () => {
    // `reddress`/`sonyxperiadev` are NOT embedded (D1) -- lookup fails and
    // this must render unaffected, never throw.
    const result = applySkinLayer({ skin: 'reddress' }, defaultTheme);
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

  it('is case-insensitive-safe when the collector already lowercased the name', () => {
    // preprocessor.ts lowercases the captured directive argument before
    // this ever runs -- verify the registry key itself is lowercase.
    const result = applySkinLayer({ skin: 'rose' }, defaultTheme);
    expect(result).not.toBe(defaultTheme);
  });
});
