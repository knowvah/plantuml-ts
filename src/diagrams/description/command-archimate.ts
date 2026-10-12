/**
 * `CommandArchimate.java`'s single-line leaf form, moved out of `parser.ts`
 * (file cap) by cdd8-T1c when it gained the `<<$archimate/icon>>` rewrite.
 *
 * @see net/sourceforge/plantuml/descdiagram/command/CommandArchimate.java
 */
import { KEYWORD_TO_SYMBOL } from '../../core/descriptive-keywords.js';
import { extractNodeStereotype, makeNode, parseNameSection } from './parse-helpers.js';
import { emitNode, type ParseState } from './parse-state.js';
import { leafDisplayName } from './namespace-groups.js';

/**
 * `archimate #color (CODE | DISPLAY "as" CODE | CODE "as" DISPLAY) STEREOTYPE?`
 * — `CommandArchimate.java`'s single-line leaf form (T8,
 * description-leaf-sizing-audit). The mandatory `#color` token PRECEDES
 * CODE/DISPLAY here — the only `KEYWORD_TO_SYMBOL` keyword where color is
 * required and leads, rather than optional and trailing. Every other
 * keyword's grammar leaves `parseNameSection`'s `remainder` starting at the
 * quote (if any), so its `splitLeadingQuote` quote-protection (guillemets
 * INSIDE a quoted display are literal text, never STEREOTYPE) engages
 * correctly; feeding it `#color "..."` unstripped defeats that check
 * entirely (the remainder starts with `#`, not `"`), letting
 * `extractNodeStereotype` reach inside the quotes. Stripping the color
 * HERE, before `parseNameSection` ever sees the rest, keeps that guard
 * intact — verified against `archimate #Business "<<inside>> Hello"`
 * (co-located test).
 *
 * `CommandArchimateMultilines` (`[ … ]` body) and `CommandArchimatePackage`
 * (`{ … }` group) are filed, not implemented — see
 * plans/s1l-leaf-sizing/ledger.md. A line missing the color token (upstream:
 * no command matches, no entity created) falls through to the generic
 * `KEYWORD_TO_SYMBOL` dispatch (`command-table-containers.ts` rule 14)
 * instead, which has no color requirement — more lenient than upstream on
 * that one malformed-input edge, documented in the co-located test.
 */
const ARCHIMATE_RE = /^archimate\s+(#\S+)\s+(.+)$/i;

/** The icon token `StereotypePattern.optionalArchimate` admits,
 *  `(\<\<[-\w]+?\>\>)` (`stereo/StereotypePattern.java:83`), chevrons off. */
const ARCHIMATE_ICON_RE = /^[-\w]+$/;

/**
 * `CommandArchimate.java:146-154`: `icon = removeChevronBrackets(STEREOTYPE)`
 * and, when present, the leaf's stereotype is REPLACED by
 * `Stereotype.build("<<$archimate/" + icon + ">>", ...)` — a sprite
 * stereotype, so `EntityImageDescription.java:194-195` draws the
 * `archimate/<icon>` sprite. `Stereotype#getLabel`'s archimate case
 * (`Stereotype.java:171-172`) still yields `icon` as the label, which only
 * draws when the sprite does not resolve. A run that is not one `[-\w]+`
 * token never matches upstream's STEREOTYPE and is left as parsed.
 */
function archimateStereotype(labels: readonly string[] | undefined): ReturnType<typeof extractNodeStereotype> {
  const icon = labels?.length === 1 ? labels[0]! : undefined;
  if (icon === undefined || !ARCHIMATE_ICON_RE.test(icon)) return undefined;
  return extractNodeStereotype(`<<$archimate/${icon}>>`);
}

export function tryArchimate(state: ParseState, line: string): number | null {
  const m = ARCHIMATE_RE.exec(line);
  if (m === null) return null;
  const symbol = KEYWORD_TO_SYMBOL.get('archimate');
  if (symbol === undefined) return null;
  const color = m[1]!;
  const { id, display, stereotype, tags, stereotypeSprite } = parseNameSection(m[2]!);
  const finalDisplay = display === id ? leafDisplayName(id, state.namespaceSeparator) : display;
  const icon = archimateStereotype(stereotype);
  const node =
    icon === undefined
      ? makeNode(id, finalDisplay, symbol, stereotype, color, tags, stereotypeSprite)
      : makeNode(id, finalDisplay, symbol, icon.stereotypes, color, tags, icon.sprite);
  emitNode(state, node);
  return 1;
}
