/**
 * Descriptive link-line regex construction (LINK_LINE_RE + its decor/style/
 * color/token building blocks). Split out of `link-grammar.ts` (line cap);
 * self-contained. Consumed by the link parser there.
 */

import type {} from '../../core/descriptive-keywords.js';
import type {} from './ast.js';
import {} from './parse-helpers.js';

export const DECOR_ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;

export function escapeDecorToken(token: string): string {
  return token.replace(DECOR_ESCAPE_RE, '\\$&');
}

/**
 * LinkDecor.buildRegexFromDecorKeys: longest-first alternation, so e.g. "<||"
 * wins over "<|" and "<". Tokens starting/ending with 'o' (AGGREGATION,
 * CIRCLE_CROWFOOT, CIRCLE_LINE, …) get a `\b` guard so "o" doesn't gobble
 * into an adjacent bare identifier.
 */
export function buildDecorAlt(tokens: readonly string[]): string {
  return [...tokens]
    .sort((a, b) => b.length - a.length)
    .map((tok) => {
      const q = escapeDecorToken(tok);
      const startsO = tok.startsWith('o');
      const endsO = tok.endsWith('o');
      if (startsO && endsO) return `\\b${q}\\b`;
      if (startsO) return `\\b${q}`;
      if (endsO) return `${q}\\b`;
      return q;
    })
    .join('|');
}

// LinkDecor.java: every decors1()/decors2() call across all 20 enum entries.
export const DECORS1_TOKENS = [
  '<|', '^', '*', 'o', 'x', '<||', '<|:', '}', '}o', '|o', '||', '}|',
  '<', '<_', '<<', '0', '@', '0)', ')', '#', '+',
];
export const DECORS2_TOKENS = [
  '|>', '^', '*', 'o', 'x', '||>', ':|>', '{', 'o{', 'o|', '||', '|{',
  '>', '_>', '>>', '0', '@', '(0', '(', '#', '+', '\\\\', '//',
];

export const DECORS1_ALT = buildDecorAlt(DECORS1_TOKENS);
export const DECORS2_ALT = buildDecorAlt(DECORS2_TOKENS);

/**
 * Mirror maps: tail-vocabulary token (DECORS1, near entity1) <-> head-
 * vocabulary token (DECORS2, near entity2) for the SAME `LinkDecor`. Built
 * from `DECORS1_TOKENS`/`DECORS2_TOKENS` above, which are positionally
 * parallel for the first `DECORS1_TOKENS.length` entries (both arrays list
 * "every decors1()/decors2() call across all 20 enum entries" in the SAME
 * enum-declaration order — DECORS2_TOKENS' two trailing entries, `\\`/`//`,
 * are the HALF_ARROW_UP/DOWN decors2-only tokens with no decors1
 * counterpart, correctly excluded from the zip below).
 *
 * Needed by `resolveDecorPair` (below): upstream inverts a LEFT/UP-
 * direction link via `Link#getInv()` -> `LinkType#getInversed()`
 * (`decoration/LinkType.java:131-132`), which swaps the ALREADY-RESOLVED
 * `decor1`/`decor2` enum fields — a pure "which side" relabeling, since
 * `LinkDecor` is an abstract classification, not a raw character. This
 * port instead carries the RAW TOKEN through to `SvekEdge` for lookup
 * there (`renderer-edge.ts`'s doc comment), so swapping which entity a
 * decor sits nearest to must ALSO translate the token into the other
 * position's spelling: `'>'` is only a valid DECORS2/head-position token
 * (`lookupDecors1('>')` misses), so moving it verbatim into the tail
 * position silently drops the decor.
 */
export const TAIL_TO_HEAD_TOKEN = new Map<string, string>();
export const HEAD_TO_TAIL_TOKEN = new Map<string, string>();
for (let i = 0; i < DECORS1_TOKENS.length; i++) {
  const tail = DECORS1_TOKENS[i]!;
  const head = DECORS2_TOKENS[i]!;
  TAIL_TO_HEAD_TOKEN.set(tail, head);
  HEAD_TO_TAIL_TOKEN.set(head, tail);
}

// CommandLinkElement.KEY1/KEY2/LINE_STYLE/LINE_STYLE_MULTIPLES.
export const STYLE_KEY1 = 'dotted|dashed|plain|bold|hidden|norank|single|node|thickness=\\d+';
export const STYLE_KEY2 = ',dotted|,dashed|,plain|,bold|,hidden|,norank|,single|,node|,thickness=\\d+';
export const LINE_STYLE = `(?:#\\w+|${STYLE_KEY1})(?:,#\\w+|${STYLE_KEY2})*`;
export const LINE_STYLE_MULTIPLES = `${LINE_STYLE}(?:;${LINE_STYLE})*`;

/**
 * CommandLinkElement.getGroup(): endpoint alternatives, in upstream order —
 * bare identifier first, then quoted string, then interface/actor/component/
 * usecase shorthand forms (with the business-variant trailing `/`).
 */
export const LINK_ENT_ALT =
  '[\\p{L}\\p{N}_.]+' +
  '|"[^"]+"' +
  '|\\(\\)\\s*[\\p{L}\\p{N}_.]+' +
  '|\\(\\)\\s*"[^"]+"' +
  '|:[^:]+:/?' +
  '|(?!\\[\\*\\])\\[[^\\[\\]]+\\]' +
  '|\\((?!\\*\\))[^)]+\\)/?';

/**
 * `ColorParser.simpleColor(ColorType.LINE)` (klimt/color/ColorParser.java:
 * 43-46) — the SAME color grammar as `#RRGGBB`/`#colorname` (`COLOR_REGEXP`)
 * OR the extended `#base;key:value;...` inline-style form (`PART2`,
 * `#coral;text:red`, `#line:green`, `#line.dashed:blue;text:coral`). The
 * bare `#\\w+` this group used before only consumed the leading token,
 * leaving `;text:red : label` unconsumed and failing the whole line's match
 * (the link — and its label — silently dropped: gekage-52-dato745,
 * rekisu-47-pesa949). The leading `#` is matched OUTSIDE this group (see
 * LINK_LINE_SOURCE below), so both alternatives below omit it.
 */
export const COLOR_TOKEN = '\\w+[-\\\\|/]?\\w+';
export const COLOR_KEY_ALT = 'text|back|header|line|line\\.dashed|line\\.dotted|line\\.bold|shadowing';
export const COLOR_PART2 =
  `(?:${COLOR_TOKEN};)?(?:(?:${COLOR_KEY_ALT})(?::${COLOR_TOKEN})?(?:;|(?![\\w;:.])))+`;
export const COLORS_BODY_ALT = `(?:${COLOR_PART2})|(?:${COLOR_TOKEN})`;

export const LINK_LINE_SOURCE =
  `^(?<ent1>${LINK_ENT_ALT})` +
  '\\s*(?:"(?<firstLabel>[^"]+)")?\\s*' +
  `(?<head1>${DECORS1_ALT})?` +
  '(?<body1>[-=.~]+)' +
  `(?:\\[(?<style1>${LINE_STYLE_MULTIPLES})\\])?` +
  '(?:(?<direction>left|right|up|down|le?|ri?|up?|do?)(?=[-=.~0()\\[]))?' +
  '(?:(?<inside>0|\\(0\\)|\\(0|0\\))(?=[-=.~]))?' +
  `(?:\\[(?<style2>${LINE_STYLE})\\])?` +
  '(?<body2>[-=.~]*)' +
  `(?<head2>${DECORS2_ALT})?` +
  '\\s*(?:"(?<secondLabel>[^"]+)")?\\s*' +
  `(?<ent2>${LINK_ENT_ALT})` +
  `\\s*(?:#(?<color>${COLORS_BODY_ALT}))?\\s*(?<stereotype>(?:<<[^>]+>>\\s*)+)?` +
  '(?:\\s*:\\s*(?<label>.+))?$';

/**
 * CommandLinkElement.getRegexConcat() — the full link-line grammar. Upstream
 * compiles every command pattern with Pattern.CASE_INSENSITIVE
 * (regex/Pattern2.java:compileInternal), hence the 'i' flag; 'u' enables the
 * \p{L}/\p{N} Unicode property classes in the bare-identifier alternative.
 */
export const LINK_LINE_RE = new RegExp(LINK_LINE_SOURCE, 'iu');

/**
 * Named groups captured by {@link LINK_LINE_RE}. TypeScript's built-in
 * `RegExpExecArray['groups']` types every key as plain `string` even though a
 * non-participating optional group is `undefined` at runtime — this interface
 * corrects that for the groups this module reads.
 */
export interface LinkGroups {
  ent1: string;
  ent2: string;
  body1: string;
  body2: string;
  firstLabel?: string;
  secondLabel?: string;
  head1?: string;
  head2?: string;
  style1?: string;
  style2?: string;
  direction?: string;
  stereotype?: string;
  label?: string;
}

// ---------------------------------------------------------------------------
// Labels.init (descdiagram/command/Labels.java) — when no explicit quoted
// qualifier labels surround the arrow, quoted segments embedded in the
// post-colon label text become the first/second qualifiers:
//   : "1" uses "many"  → first="1", label="uses", second="many"
//   : "1" uses         → first="1", label="uses"
//   : uses "many"      → label="uses", second="many"
// ---------------------------------------------------------------------------
