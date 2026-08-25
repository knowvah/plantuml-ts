/**
 * Unit tests for `descriptive-keywords.ts`'s surviving exports.
 *
 * T21 deleted the dispatch heuristic this module was built for, and with it
 * `hasDescriptiveSignal`, `hasDescriptiveElement`, `DESCRIPTIVE_ONLY_KEYWORDS`
 * and the legend-region scanners. What remains is the upstream keyword/symbol
 * TABLE (`ALL_TYPES`, `KEYWORD_TO_SYMBOL`) and `stripSpriteRegions`, which the
 * sprite command layer still uses; their tests are kept and the rest removed.
 */
import { describe, it, expect } from 'vitest';
import {
  ALL_TYPES,
  KEYWORD_TO_SYMBOL,
  stripSpriteRegions,
} from '../../../src/core/descriptive-keywords.js';

describe('descriptive-keywords — ALL_TYPES / KEYWORD_TO_SYMBOL', () => {
  it('covers the full upstream ALL_TYPES keyword set, plus `archimate` (T8)', () => {
    // Upstream CommandCreateElementFull.ALL_TYPES, in declaration order --
    // plus `archimate` (CommandArchimate.java, its own dedicated command,
    // never part of ALL_TYPES upstream), deliberately folded into this
    // port's single keyword-dispatch table so it gets the SAME
    // hasDescriptiveSignal/hasDescriptiveElement/KEYWORD_RE machinery every
    // other descriptive-only keyword uses -- see descriptive-keywords.ts's
    // KEYWORD_SYMBOL_ENTRIES comment for why it maps to 'rectangle', not a
    // new USymbol tag.
    expect(ALL_TYPES).toEqual([
      'person',
      'artifact',
      'actor/',
      'actor',
      'folder',
      'card',
      'file',
      'package',
      'rectangle',
      'hexagon',
      'label',
      'node',
      'frame',
      'cloud',
      'action',
      'process',
      'database',
      'queue',
      'stack',
      'storage',
      'agent',
      'archimate',
      'usecase/',
      'usecase',
      'component',
      'boundary',
      'control',
      'entity',
      'interface',
      'circle',
      'collections',
      'port',
      'portin',
      'portout',
    ]);
  });

  it('maps every keyword to a USymbol', () => {
    for (const keyword of ALL_TYPES) {
      expect(KEYWORD_TO_SYMBOL.has(keyword)).toBe(true);
    }
    expect(KEYWORD_TO_SYMBOL.size).toBe(ALL_TYPES.length);
  });

  it('maps business variants to the -business symbols', () => {
    expect(KEYWORD_TO_SYMBOL.get('actor/')).toBe('actor-business');
    expect(KEYWORD_TO_SYMBOL.get('actor')).toBe('actor');
    expect(KEYWORD_TO_SYMBOL.get('usecase/')).toBe('usecase-business');
    expect(KEYWORD_TO_SYMBOL.get('usecase')).toBe('usecase');
  });

  it('folds portin/portout onto the port symbol', () => {
    expect(KEYWORD_TO_SYMBOL.get('port')).toBe('port');
    expect(KEYWORD_TO_SYMBOL.get('portin')).toBe('port');
    expect(KEYWORD_TO_SYMBOL.get('portout')).toBe('port');
  });
});

describe('descriptive-keywords — stripSpriteRegions', () => {
  it('drops a multiline sprite body and keeps the surrounding lines', () => {
    expect(
      stripSpriteRegions(['component A', 'sprite $s [4x4/16] {', '0F', 'F0', '}', 'component B']),
    ).toEqual(['component A', 'component B']);
  });

  it('leaves a source with no sprite block untouched', () => {
    const lines = ['component A', 'component B'];
    expect(stripSpriteRegions(lines)).toEqual(lines);
  });
});
