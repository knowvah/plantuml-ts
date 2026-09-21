/**
 * Arrow head glyph -> `LinkDecor` mapping, split out of class-arrow-grammar.ts
 * (pure move, no behavior change) to keep that file under the repo's
 * 500-line-per-file cap.
 */
import type { LinkDecor } from './ast.js';
import { canonicalizeArrow, splitCanonicalHeads } from './class-arrow-grammar.js';

/**
 * Map one arrow head glyph (the run before/after the body) to its
 * decoration. G2 N28: widened past the original 4-shape D6 subset to cover
 * every `LinkDecor.java` glyph this port's arrow grammar can extract as a
 * head token — `SQUARE`/`PLUS`/`PARENTHESIS`/`CROWFOOT` (the named D6
 * follow-up) plus the crow's-foot IE-notation family that shares the same
 * decors1/decors2 glyph set (`CIRCLE_CROWFOOT`/`CIRCLE_LINE`/`DOUBLE_LINE`/
 * `LINE_CROWFOOT`) — every one of these already has a built `ExtremityFactory`
 * (`core/svek/extremity/link-decor.ts#BUILDERS`), so this is purely a
 * glyph→name mapping fix, matching upstream `LinkDecor.decors1`/`.decors2`
 * (`~/git/plantuml/.../decoration/LinkDecor.java:80-94`). `x` (NOT_NAVIGABLE)
 * and `('/`)` bare parens deliberately NOT added here: bare-paren tokens are
 * caught upstream by the DISTINCT `CommandLinkLollipop` command before
 * `CommandLinkClass` ever sees them for `()`/`((`/`))` doubled forms (this
 * port's own `class-lollipop.ts#LOLLIPOP_RE`); a SINGLE `)`/`(` (not
 * doubled) is genuinely `LinkDecor.PARENTHESIS` here and IS added below.
 * `x`/NOT_NAVIGABLE was surveyed and found to have zero corpus reach beyond
 * this iteration's named 8-fixture PLUS/SQUARE/CROWFOOT/PARENTHESIS set —
 * left `'none'` (unbuilt) rather than added speculatively.
 *
 * T5/M6: `<||`/`||>` (REDEFINES) and `<|:`/`:|>` (DEFINEDBY) added — both
 * ARE reachable as head tokens (`class-relationship-parser.ts`'s
 * `HEAD1_SAFE`/`HEAD2_CHARS` already list all four literally, for TYPE
 * resolution's `'extends'` fold; only the DECOR-map entry was missing).
 * `^` (`LinkDecor.EXTENDS`'s second decor string, alongside `<|`/`|>`) maps
 * to the SAME `'triangle'` member those already use — EXTENDS is one Java
 * enum value regardless of which of its three glyphs matched
 * (`decoration/LinkDecor.java:71`: `EXTENDS(decors1("<|","^"),
 * decors2("|>","^"),...)`), not a distinct `'arrowTriangle'` shape (that
 * name belongs to the UNRELATED `ARROW_TRIANGLE` enum member, glyphs
 * `<<`/`>>` — see this file's own T5 report for why those two are NOT
 * added: `class-relationship-parser.ts`'s `HEAD1_SAFE`/`HEAD2_CHARS` have no
 * alternative for a doubled `<`/`>`, so no input can ever reach
 * `headToDecor('<<')`; a dead table entry is not added on the strength of
 * an interface sketch alone). `CIRCLE_FILL` (`@`), the head-position form of
 * `CIRCLE_CONNECT` (`0)`/`(0` as a literal ARROW_HEAD, distinct from the
 * MID-BODY `INSIDE` form `class-arrow-middle-decor.ts` owns), and
 * `HALF_ARROW_UP`/`HALF_ARROW_DOWN` (`\\`/`//`) are, by the same
 * unreachable-via-current-grammar reasoning, also NOT added here.
 * @see ~/git/plantuml/.../decoration/LinkDecor.java:71-77
 */
// Head glyph -> LinkDecor, as a lookup table rather than a switch (same
// tabular style as this file's own HEAD1_KIND/HEAD2_KIND precedent in
// class-arrow-grammar.ts) -- keeps CCN flat regardless of how many glyphs
// map to the same decor. 'x' (NOT_NAVIGABLE): G2 N47, previously left
// unmapped on an N28 "zero corpus reach" survey; `rekazo-16-jola519` (`bob
// x--> alice`) disproved that -- `core/svek/extremity/link-decor.ts`'s
// `ExtremityFactoryNotNavigable`/`not_navigable` data-link-type row were
// already built for description's renderer, this is purely the class-side
// glyph->name wiring.
const HEAD_TO_DECOR: Record<string, LinkDecor> = {
  '<': 'open',
  '>': 'open',
  '<_': 'open',
  '_>': 'open',
  '<|': 'triangle',
  '|>': 'triangle',
  '*': 'filledDiamond',
  o: 'diamond',
  '#': 'square',
  '+': 'plus',
  ')': 'parenthesis',
  '(': 'parenthesis',
  '}': 'crowfoot',
  '{': 'crowfoot',
  '}o': 'circleCrowfoot',
  'o{': 'circleCrowfoot',
  '|o': 'circleLine',
  'o|': 'circleLine',
  '||': 'doubleLine',
  '}|': 'lineCrowfoot',
  '|{': 'lineCrowfoot',
  x: 'notNavigable',
  '<||': 'redefines',
  '||>': 'redefines',
  '<|:': 'definedBy',
  ':|>': 'definedBy',
  '^': 'triangle',
};

// '' → no standard marker (D6 scope note: DOT parity only, not SVG rendering).
function headToDecor(head: string): LinkDecor {
  return HEAD_TO_DECOR[head] ?? 'none';
}

/**
 * Parse the two head decorations of an arrow token independently (D6, mirroring
 * upstream's per-end LinkDecor). The token is `HEAD1 BODY HEAD2`; HEAD1
 * decorates the left operand's end, HEAD2 the right operand's. `swapDirection`
 * (left operand is `to`) then assigns them to source/target so a plain `--` is
 * undecorated at both ends while `-->` is `open` at the target.
 */
export function parseArrowDecors(
  rawArrow: string,
  swapDirection: boolean,
): { sourceDecor: LinkDecor; targetDecor: LinkDecor } {
  const { head1, head2 } = splitCanonicalHeads(canonicalizeArrow(rawArrow));
  const d1 = headToDecor(head1);
  const d2 = headToDecor(head2);
  return swapDirection ? { targetDecor: d1, sourceDecor: d2 } : { sourceDecor: d1, targetDecor: d2 };
}

/**
 * The two head decorations, keyed to TEXTUAL declaration order (`d1` = near
 * the left/first-written operand, `d2` = near the right/second-written one)
 * -- UNLIKE {@link parseArrowDecors}, which additionally applies
 * `swapDirection` (the DOT-layout-direction swap, arrowhead-driven). This is
 * upstream's `ARROW_HEAD1`/`ARROW_HEAD2` pair before `CommandLinkClass
 * .getLinkType()`'s own `new LinkType(decors2, decors1)` field-swap AND
 * before `Link#getInv()`'s `-left-`/`-up-` endpoint swap -- i.e. exactly
 * what `Relationship.idEntity1Decor`/`.idEntity2Decor` are built from
 * (`class-relationship-parser.ts`, `pickDirectional(upOrLeft, d1, d2)`),
 * since jar's `Link#idCommentForSvg()` keys off `getEntity1()`/
 * `getEntity2()` (cl1/cl2, swapped ONLY by the explicit direction word),
 * never off the arrowhead-driven DOT swap. See this file's `ArrowInfo
 * #upOrLeft` doc for the full derivation.
 *
 * Deliberately does NOT reuse `parseArrowDecors`'s `headToDecor` mapping:
 * that function collapses PLUS/SQUARE/CROWFOOT/PARENTHESIS glyphs to
 * `'none'` because THIS port draws no distinct marker shape for them (D6
 * scope, rendered-decor purpose only) -- but upstream's `LinkDecor.PLUS`/
 * `.SQUARE`/etc are each a real, NON-`NONE` enum member, and `LinkType
 * #looksLikeRevertedForSvg`/`#looksLikeNoDecorAtAllSvg` only test `== NONE`.
 * `HashMap [d4] +-l-> [h] V4` (coxose-20-nifu136) is jar-verified proof: PLUS
 * at one end + ARROW at the other is DOUBLE-decorated ("V4-HashMap", bare)
 * -- collapsing PLUS to 'none' wrongly reads that as single-decorated
 * ("V4-backto-HashMap"). `headHasIdDecor` below tests for "some glyph
 * matched" instead, which is what upstream's own `!= NONE` actually means
 * (every non-empty ARROW_HEAD1/2 regex match is *some* named LinkDecor).
 * @see ~/git/plantuml/.../classdiagram/command/CommandLinkClass.java:490-497
 * @see ~/git/plantuml/.../abel/Link.java:106-114,145-156 (idCommentForSvg, getInv)
 * @see ~/git/plantuml/.../decoration/LinkDecor.java (PLUS/SQUARE/CIRCLE_CROWFOOT/PARENTHESIS)
 */
export function parseArrowDecorsRaw(rawArrow: string): { decor1: LinkDecor; decor2: LinkDecor } {
  const { head1, head2 } = splitCanonicalHeads(canonicalizeArrow(rawArrow));
  return { decor1: idDecorForHead(head1), decor2: idDecorForHead(head2) };
}

/** Whether a head glyph counts as decorated for `parseArrowDecorsRaw`'s
 *  none-vs-not-none purpose -- see that function's doc comment. Reuses
 *  `headToDecor`'s classification directly for every glyph it now resolves
 *  (G2 N28 widened `headToDecor` to cover square/plus/parenthesis/crowfoot/
 *  the crow's-foot IE family too, G2 N47 added NOT_NAVIGABLE `x`, so this
 *  function no longer needs a placeholder for any of them). Only a
 *  genuinely EMPTY head (`headToDecor('')` = `'none'`) still falls back to
 *  the arbitrary placeholder `'open'` -- never rendered as a marker (these
 *  two fields are consumed only by `looksLikeRevertedForSvg`/
 *  `looksLikeNoDecorAtAllSvg`'s `undefined`-vs-defined test, never by
 *  `buildEdgeArrowheads`, which reads `sourceDecor`/`targetDecor` instead). */
function idDecorForHead(head: string): LinkDecor {
  if (head === '') return 'none';
  const rendered = headToDecor(head);
  return rendered === 'none' ? 'open' : rendered;
}
