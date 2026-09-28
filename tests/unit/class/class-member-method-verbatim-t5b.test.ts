/**
 * T5b (member-method-params-reformatted, potase-97-japa248/zaxavo-08-
 * rake498): upstream's `Member` constructor never decomposes a method into
 * name/params/type -- `this.display` is the verbatim source text (post
 * tag/url/modifier/visibility strip), trimmed at the ENDS only
 * (`StringUtils.trin`, not `String#trim`, so INTERNAL whitespace -- e.g.
 * inside the parens -- survives untouched).
 *
 * `formatMemberText` (the class engine's member-row reconstruction point)
 * previously rebuilt method text from `params.join(', ')`, collapsing
 * `__construct( FOORepositoryInterface )`'s internal padding to
 * `__construct(FOORepositoryInterface)`. `parseMemberLine` now carries the
 * ORIGINAL (post-modifier-strip) text on `rawDisplay` for a structured
 * method match too, and `formatMemberText` already prefers `rawDisplay`
 * when present (the same precedence the G2 N12 raw-fallback shape uses).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:133-137
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java:505-521
 */
import { describe, it, expect } from 'vitest';
import { parseMemberLine } from '../../../src/diagrams/class/class-member-parser.js';
import { formatMemberText } from '../../../src/diagrams/class/class-layout-helpers.js';

describe('T5b: method member text round-trips verbatim internal whitespace', () => {
  it('preserves padded spaces inside the parens (potase-97-japa248: "__construct( FOORepositoryInterface )")', () => {
    const member = parseMemberLine('__construct( FOORepositoryInterface )');
    expect(member).toMatchObject({
      name: '__construct',
      params: ['FOORepositoryInterface'],
      rawDisplay: '__construct( FOORepositoryInterface )',
    });
    expect(formatMemberText(member!)).toBe('__construct( FOORepositoryInterface )');
  });

  it('preserves padded spaces for a different identifier (zaxavo-08-rake498: "OrderRepositoryInterface")', () => {
    const member = parseMemberLine('__construct( OrderRepositoryInterface )');
    expect(formatMemberText(member!)).toBe('__construct( OrderRepositoryInterface )');
  });

  it('still reconstructs the canonical ", "-joined form when the source already used it (no behavior change)', () => {
    const member = parseMemberLine('+getName(a, b): String');
    expect(formatMemberText(member!, true)).toBe('+getName(a, b): String');
  });

  it('preserves multi-param internal spacing verbatim, not just single-param', () => {
    const member = parseMemberLine('run(  a ,b  )');
    expect(formatMemberText(member!)).toBe('run(  a ,b  )');
    // Classification fields are still derived from the decomposed shape.
    expect(member).toMatchObject({ name: 'run', params: ['a', 'b'] });
  });
});
