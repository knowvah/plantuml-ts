/**
 * T5/M6: the INSIDE middle-circle marker (CommandLinkClass's separate INSIDE
 * regex group, `(0|\(0\)|\(0|0\))(?=[-=.~])`, CommandLinkClass.java:137,
 * 498-507) -- a LinkMiddleDecor, NOT a LinkDecor: it sits BETWEEN the two
 * body runs (`-0)-`), never at a head position, and is a wholly separate
 * Java enum (decoration/LinkMiddleDecor.java) from the head-decor LinkDecor
 * table `class-arrow-decor-map.ts` owns. `class-relationship-parser.ts`'s own
 * `ARROW_INSIDE` fragment already matches-and-discards this token when
 * building the line grammar; this extracts the SAME token's semantic value
 * from the raw arrow text `resolveArrow`/`parseArrowDecors` already receive.
 *
 * Split out of class-arrow-grammar.ts (pure move, no behavior change) to
 * keep that file under the repo's 500-line-per-file cap.
 */

import { canonicalizeArrow, splitCanonicalHeads } from './class-arrow-grammar.js';

/** `decoration/LinkMiddleDecor.java`'s four INSIDE-reachable members (`NONE`
 *  is `undefined` here, matching every other decor field's convention;
 *  `SUBSET`/`SUPERSET` have no INSIDE token -- CommandLinkClass never
 *  constructs them from this regex group, only from a description-diagram
 *  command this port's class engine does not share -- so they are not
 *  representable here). */
export type MiddleDecor = 'circle' | 'circleCircled' | 'circleCircled1' | 'circleCircled2';

/**
 * `CommandLinkClass#getLinkType`'s INSIDE if/else-if chain, ported as a
 * table: `"0"` -> `withMiddleCircle()` (CIRCLE), `"0)"` ->
 * `withMiddleCircleCircled1()` (CIRCLE_CIRCLED1), `"(0"` ->
 * `withMiddleCircleCircled2()` (CIRCLE_CIRCLED2), `"(0)"` ->
 * `withMiddleCircleCircled()` (CIRCLE_CIRCLED). Only `"0)"` has corpus reach
 * in this port's fixture set (`cenubi-27-xova754`); the other three are
 * ported alongside it because they are the same four-armed Java method, not
 * a speculative extension of it.
 * @see ~/git/plantuml/.../classdiagram/command/CommandLinkClass.java:498-507
 * @see ~/git/plantuml/.../decoration/LinkType.java:135-149
 */
const MIDDLE_DECOR_TOKEN: Record<string, MiddleDecor> = {
  '0': 'circle',
  '(0)': 'circleCircled',
  '0)': 'circleCircled1',
  '(0': 'circleCircled2',
};

// Anchored against the BODY SPAN between the two heads (see
// splitCanonicalHeads): one mandatory leading body char (ARROW_BODY1's "+",
// already collapsed to one by canonicalizeArrow), the INSIDE token, then an
// optional trailing body char (ARROW_BODY2's "*"). Longest-alternative-first
// so `0)`/`(0)` are not shadowed by the bare `0`/`(0` alternatives.
const MIDDLE_DECOR_RE = /^[-.=](0\)|\(0\)|\(0|0)[-.=]?$/;

/** Extract the INSIDE middle-circle token from a raw arrow, or `undefined`
 *  when the arrow carries none (the overwhelming majority). Operates on the
 *  body span `splitCanonicalHeads` already isolates from the two heads, so a
 *  genuine head-position `"0)"`/`"(0"` (LinkDecor.CIRCLE_CONNECT, a
 *  DIFFERENT Java enum this port's grammar cannot yet produce as a head
 *  token -- see class-arrow-decor-map.ts's own doc comment) can never be
 *  misread as a middle decor: a head token never has a body char on both
 *  sides of it. */
export function extractMiddleDecor(rawArrow: string): MiddleDecor | undefined {
  const canonical = canonicalizeArrow(rawArrow);
  const { head1, head2 } = splitCanonicalHeads(canonical);
  const bodySpan = canonical.slice(head1.length, canonical.length - head2.length);
  const m = MIDDLE_DECOR_RE.exec(bodySpan);
  return m === null ? undefined : MIDDLE_DECOR_TOKEN[m[1]!];
}

/** `LinkMiddleDecor#getInversed()` (decoration/LinkMiddleDecor.java:69-76) --
 *  `getInv()`'s endpoint swap (this port's `upOrLeft`) swaps CIRCLE_CIRCLED1
 *  and CIRCLE_CIRCLED2 (the marker's asymmetric "which side is circled" bit)
 *  and leaves CIRCLE/CIRCLE_CIRCLED (symmetric) and `undefined` alone. */
export function invertMiddleDecor(decor: MiddleDecor | undefined, upOrLeft: boolean): MiddleDecor | undefined {
  if (!upOrLeft) return decor;
  if (decor === 'circleCircled1') return 'circleCircled2';
  if (decor === 'circleCircled2') return 'circleCircled1';
  return decor;
}
