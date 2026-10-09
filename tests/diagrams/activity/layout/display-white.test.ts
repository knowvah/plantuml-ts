/**
 * isw-T2-act F2: the parser keeps `while ( )`'s `" "` verbatim, and the
 * tile drops it as `Display#isWhite` does (`Display.java:170-175`) --
 * vamazo-19-tufu812 is the jar fixture.
 */
import { describe, expect, it } from 'vitest';
import { nonWhiteTest } from '../../../../src/diagrams/activity/layout/display-white.js';

describe('nonWhiteTest (Display#isWhite)', () => {
  it('drops an empty or single whitespace-only line', () => {
    expect(nonWhiteTest('')).toBe('');
    expect(nonWhiteTest(' ')).toBe('');
    expect(nonWhiteTest(' \t ')).toBe('');
  });

  it('keeps text, and keeps a multi-line display even when blank', () => {
    expect(nonWhiteTest(' a ')).toBe(' a ');
    expect(nonWhiteTest(' \n ')).toBe(' \n ');
  });

  it('keeps a non-breaking space: Java `\\s` is ASCII whitespace only', () => {
    expect(nonWhiteTest(' ')).toBe(' ');
  });
});
