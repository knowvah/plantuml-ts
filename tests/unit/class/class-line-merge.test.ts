/**
 * `mergeStandaloneBraces` -- the class parser's pre-dispatch standalone-`{`
 * merge (`src/diagrams/class/class-line-merge.ts`).
 *
 * cdd5-T5e (class-line-merge-bracket, jixibu-01-xave465): upstream's
 * `BlocLines#eventuallyMoveBracket` (java:358-369) merges a bare `{` into
 * the immediately preceding line ONLY when that line does not already end
 * in `{` -- it never runs at all on lines already inside an open
 * `{{ ... }}` embedded-diagram region (`EmbeddedDiagram#createAndSkip`,
 * java:97-115, consumes those wholesale). The port's flat, whole-source
 * merge pass did not track embed nesting, so a literal `{` immediately
 * after `{{json` (real JSON syntax) was folded into `{{json {`, which is
 * not a type `EmbeddedDiagram#getEmbeddedType` recognizes.
 */
import { describe, it, expect } from 'vitest';
import { mergeStandaloneBraces } from '../../../src/diagrams/class/class-line-merge.js';

describe('mergeStandaloneBraces (cdd5-T5e, class-line-merge-bracket)', () => {
  it('still merges a standalone `{` into a real class-body opener', () => {
    const result = mergeStandaloneBraces(['class Foo', '{', 'x : int', '}']);
    expect(result.lines).toEqual(['class Foo {', 'x : int', '}']);
  });

  it('does NOT merge a literal `{` that opens JSON content inside a {{json embed', () => {
    // jixibu-01-xave465: `{{json` followed by JSON's own opening `{`.
    const result = mergeStandaloneBraces(['{{json', '{', '"fruit":"Apple"', '}', '}}']);
    expect(result.lines).toEqual(['{{json', '{', '"fruit":"Apple"', '}', '}}']);
  });

  it('resumes normal bracket-merge behaviour for lines after the embed closes', () => {
    const result = mergeStandaloneBraces(['file n [', 'label', '{{json', '{', '}', '}}', ']']);
    expect(result.lines).toEqual(['file n [', 'label', '{{json', '{', '}', '}}', ']']);
  });

  it('tracks nested embeds (an embed opening another embed)', () => {
    const result = mergeStandaloneBraces(['{{', '{{json', '{', '}', '}}', '{', '}}']);
    // The inner `{` (JSON) is never merged; the OUTER `{{`'s own nesting
    // only closes on its own matching `}}` -- the bare `{` right before the
    // outer close is still INSIDE the outer embed, so it is untouched too.
    expect(result.lines).toEqual(['{{', '{{json', '{', '}', '}}', '{', '}}']);
  });
});
