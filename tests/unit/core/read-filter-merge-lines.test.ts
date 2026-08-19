/**
 * `ReadFilterMergeLines.java:48-88` -- trailing-`\` line continuation.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc2/ReadFilterMergeLines.java
 */
import { describe, expect, it } from 'vitest';
import { mergeEndingBackslashLines } from '../../../src/core/tim/ReadFilterMergeLines.js';
import { readLines } from '../../../src/core/tim/ReadLineReader.js';
import { preprocess } from '../../../src/core/preprocessor.js';
import { MapIncludeStore } from '../../../src/core/tim/IncludeStore.js';

/** Merge `source` and return the resulting lines' text, in order. */
function mergedText(source: string): string[] {
  return mergeEndingBackslashLines(readLines(source)).map((s) => s.getString());
}

describe('mergeEndingBackslashLines', () => {
  it('merges a bare trailing backslash with the next line', () => {
    expect(mergedText('State1 : a \\\nb')).toEqual(['State1 : a b']);
  });

  it('does not merge a line ending in an escaped double backslash', () => {
    // `StringUtils.java:454-456`: endsWith("\\") && !endsWith("\\\\").
    expect(mergedText('set namespaceSeparator \\\\\nclass A')).toEqual([
      'set namespaceSeparator \\\\',
      'class A',
    ]);
  });

  it('does not merge when trailing spaces follow the backslash', () => {
    // The Java check is a literal string suffix, not a trimmed one.
    expect(mergedText('a \\ \nb')).toEqual(['a \\ ', 'b']);
  });

  it('leaves a trailing backslash on the last line unmerged (no next line)', () => {
    expect(mergedText('a\nb \\')).toEqual(['a', 'b \\']);
  });

  it('chains multiple continuations into one line', () => {
    expect(mergedText('a \\\nb \\\nc')).toEqual(['a b c']);
  });

  it('keeps the FIRST line location on the merged result', () => {
    const [first] = mergeEndingBackslashLines(readLines('a \\\nb\nc'));
    expect(first!.getLocation()?.getPosition()).toBe(0);
  });

  it('skips a full-line comment encountered while merging', () => {
    expect(mergedText("a \\\n' a comment\nb")).toEqual(['a b']);
  });

  it('suspends continuation inside a @startditaa block', () => {
    expect(mergedText('@startditaa\nfoo \\\nbar\n@endditaa\nclass A')).toEqual([
      '@startditaa',
      'foo \\',
      'bar',
      '@endditaa',
      'class A',
    ]);
  });
});

describe('!includesub merges trailing backslash lines in the included file', () => {
  it('merges a continuation inside the sub block before it is replayed', () => {
    const store = new MapIncludeStore({
      'shared.iuml': '!startsub S\nclass A \\\nB\n!endsub',
    });
    const result = preprocess('!includesub shared.iuml!S', undefined, { includeStore: store });
    expect(result.lines).toEqual(['class A B']);
  });
});
