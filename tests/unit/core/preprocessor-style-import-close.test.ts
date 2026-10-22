import { describe, it, expect } from 'vitest';
import { preprocess } from '../../../src/core/preprocessor.js';
import { BUILTIN_SKINS } from '../../../src/core/skins-builtin.js';

const STRICTUML_SKIN_TEXT = BUILTIN_SKINS['strictuml']!;

describe('<style src=...> import (CommandStyleImport.java:67-79, :99-125)', () => {
  it('applies the built-in strictuml skin as a style block and consumes the line', () => {
    const result = preprocess('<style src=strictuml.skin>\nAlice -> Bob : hi');
    expect(result.styles).toEqual([STRICTUML_SKIN_TEXT]);
    expect(result.lines).toEqual(['Alice -> Bob : hi']);
  });

  it('accepts a quoted path and any attribute name (the \\w+ before "=" is unchecked)', () => {
    const result = preprocess('<style file="strictuml.skin">\nAlice -> Bob');
    expect(result.styles).toEqual([STRICTUML_SKIN_TEXT]);
  });

  it('records the import on the same declaration counter as a <style> block', () => {
    const result = preprocess('<style>\nroot {\n}\n</style>\n<style src=strictuml.skin>\nA -> B');
    expect(result.styles).toHaveLength(2);
    expect(result.declarationOrder?.styles).toEqual([0, 1]);
  });

  it('leaves an unresolvable path in the body (jar: "Cannot read: path" command error)', () => {
    const result = preprocess('<style src=nowhere.skin>\nAlice -> Bob');
    expect(result.styles).toEqual([]);
    expect(result.lines).toEqual(['<style src=nowhere.skin>', 'Alice -> Bob']);
  });

  it('leaves a URL import in the body (no fetch in a browser-safe sync library)', () => {
    const result = preprocess('<style src=https://example.com/a.skin>\nAlice -> Bob');
    expect(result.styles).toEqual([]);
    expect(result.lines[0]).toBe('<style src=https://example.com/a.skin>');
  });
});

describe('style block END is </?style> (CommandStyleMultilinesCSS.java:58)', () => {
  it('closes the first block at a second <style> opener', () => {
    const result = preprocess('<style>\nroot {\n  LineColor red\n}\n<style>\nAlice -> Bob : hello');
    expect(result.styles).toEqual(['root {\n  LineColor red\n}']);
    expect(result.lines).toEqual(['Alice -> Bob : hello']);
  });

  it('still closes at </style>', () => {
    const result = preprocess('<style>\nroot {\n}\n</style>\nAlice -> Bob');
    expect(result.styles).toEqual(['root {\n}']);
    expect(result.lines).toEqual(['Alice -> Bob']);
  });

  it('tolerates surrounding whitespace on the END line ([%s]*)', () => {
    const result = preprocess('<style>\nroot {\n}\n  <STYLE>  \nA -> B');
    expect(result.styles).toEqual(['root {\n}']);
    expect(result.lines).toEqual(['A -> B']);
  });
});
