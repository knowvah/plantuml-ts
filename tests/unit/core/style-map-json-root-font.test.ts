/**
 * unwind-U1: a `root`/`element` FontName reaches the json family's node font
 * (the node style signature carries `root`, `TextBlockJson.java:269-288`),
 * and a family-specific `jsonDiagram { node { FontName } }` still wins.
 * Jar: tests/fixtures/unwind-U1/json-theme-amiga.svg (Verdana from
 * `puml-theme-amiga.puml:36`, with the theme's skinparams ignored).
 */
import { describe, it, expect } from 'vitest';
import { parseStyleBlock } from '../../../src/core/skinparam.js';
import { resolveGlobalFontName } from '../../../src/core/style-map-global.js';
import { computeJsonFamilyOverride, computeYamlFamilyOverride } from '../../../src/core/style-map-json-diagram.js';

describe('root/element FontName → json-family node font', () => {
  it('resolves the last root/element FontName', () => {
    expect(resolveGlobalFontName(parseStyleBlock('root { FontName Verdana }'))).toBe('Verdana');
    expect(resolveGlobalFontName(parseStyleBlock('root { FontName A }\nelement { FontName B }'))).toBe('B');
    expect(resolveGlobalFontName(parseStyleBlock('node { FontName A }'))).toBeUndefined();
  });

  it('feeds nodeFontFamily for json and yaml', () => {
    const map = parseStyleBlock('root { FontName Verdana }');
    expect(computeJsonFamilyOverride(map).nodeFontFamily).toBe('Verdana');
    expect(computeYamlFamilyOverride(map).nodeFontFamily).toBe('Verdana');
  });

  it('a jsonDiagram node FontName overrides root', () => {
    const map = parseStyleBlock('root { FontName Verdana }\njsonDiagram { node { FontName Courier } }');
    expect(computeJsonFamilyOverride(map).nodeFontFamily).toBe('Courier');
  });
});
