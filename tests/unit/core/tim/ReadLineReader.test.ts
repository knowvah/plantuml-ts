/**
 * `ReadLineReader#readLine` is `BufferedReader#readLine` (`ReadLineReader.java:85`):
 * a terminator ENDS a line and never opens one. `split('\n')` alone left a
 * phantom empty line after a final newline -- a bundled theme's, which then
 * shifted `UmlSource#seed` and every seeded SVG id (cdd4-T7b, mizupo-59).
 */
import { describe, expect, it } from 'vitest';
import { readLines } from '../../../../src/core/tim/ReadLineReader.js';

const texts = (source: string): string[] => readLines(source).map((l) => l.getString());

describe('readLines: BufferedReader#readLine line ends', () => {
  it('a final newline ends the last line; it opens no empty one', () => {
    expect(texts('a\nb\n')).toEqual(['a', 'b']);
    expect(texts('a\n\n')).toEqual(['a', '']);
    expect(texts('a')).toEqual(['a']);
    expect(texts('')).toEqual([]);
  });

  it('numbers the lines it keeps from 0', () => {
    expect(readLines('a\nb\n').map((l) => l.getLocation()?.getPosition())).toEqual([0, 1]);
  });

  // `BufferedReader#readLine`: "A line is considered to be terminated by any one
  // of a line feed ('\n'), a carriage return ('\r'), or a carriage return
  // followed immediately by a linefeed." The terminator is never part of the
  // line -- the preprocessor no longer right-trims (T6i), so a CRLF source must
  // not leave a '\r' on any line (empty-mindmap-0).
  it('ends a line at CRLF, CR or LF and keeps no terminator', () => {
    expect(texts('a\r\nb \r\n\r\nc\rd\n')).toEqual(['a', 'b ', '', 'c', 'd']);
  });

  it('drops only the empty tail after a final CRLF', () => {
    expect(texts('a\r\n')).toEqual(['a']);
  });
});
