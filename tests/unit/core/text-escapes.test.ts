import { describe, it, expect } from 'vitest';
import { resolveTextEscapes } from '../../../src/core/text-escapes.js';

// G2/N21: promoted out of `diagrams/description/parse-helpers.ts` (mission
// I4c) into `core/` so the class engine's note text can share it — see that
// file's own doc comment for the AtomText.java provenance.
describe('resolveTextEscapes', () => {
  it('resolves a 4-digit <U+XXXX> unicode escape to its literal glyph', () => {
    expect(resolveTextEscapes('a <U+005C> b')).toBe('a \\ b');
  });

  it('resolves a 5-digit <U+XXXXX> unicode escape (astral codepoint)', () => {
    expect(resolveTextEscapes('<U+1F600>')).toBe(String.fromCodePoint(0x1f600));
  });

  it('resolves &#NNN; HTML numeric character references', () => {
    expect(resolveTextEscapes('a &#65; b')).toBe('a A b');
  });

  it('leaves a malformed <U+> escape (too few hex digits) untouched', () => {
    expect(resolveTextEscapes('<U+12>')).toBe('<U+12>');
  });

  // Boundary cases lifted directly from `AtomText.java:120-133`'s scan: the
  // hex run is bounded `4 <= len <= 5` AND the closing `>` must immediately
  // follow -- neither a 3-digit run nor an unterminated 4-digit run matches.
  it('leaves a 3-digit hex run untouched (hexLen < 4)', () => {
    expect(resolveTextEscapes('<U+0AB>')).toBe('<U+0AB>');
  });

  it('leaves an unterminated <U+XXXX escape (no closing >) untouched', () => {
    expect(resolveTextEscapes('<U+00AB other text')).toBe('<U+00AB other text');
  });

  it('resolves 4-digit hex case-insensitively (lowercase and mixed case)', () => {
    expect(resolveTextEscapes('<U+00ab>')).toBe('«');
    expect(resolveTextEscapes('<U+00Ab>')).toBe('«');
  });

  it('leaves plain text with no escapes untouched', () => {
    expect(resolveTextEscapes('hello world')).toBe('hello world');
  });

  it('resolves multiple escapes in the same string', () => {
    expect(resolveTextEscapes('<U+0041>&#66;<U+0043>')).toBe('ABC');
  });
});
