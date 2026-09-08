/**
 * The reserved box an edge label occupies in the DOT handed to graphviz.
 *
 * Upstream sizes EVERY edge label the same way — `SvekEdge` measures a creole
 * `TextBlock` and writes the result into a `<TABLE FIXEDSIZE="TRUE" WIDTH=".."
 * HEIGHT="..">` reservation (`svek/SvekEdge.java:441`,
 * `labelText.calculateDimension(stringBounder)`). One formula upstream, so one
 * formula here.
 *
 * Relocated from `diagrams/state/` (2026-08-14, mission
 * `edge-label-box-and-class-ports` T1) because it was correct and reachable
 * only by the state engine, while class and description each measured their
 * labels a different, wrong way. A pure move: the state engine's DOT output
 * is byte-identical across the relocation. `state-sizing.ts`/
 * `state-transition-label.ts` re-export from here, so no import changed.
 */
import type { FontSpec, StringMeasurer } from './measurer.js';
// mission `shared-seam-extraction` T1: the ONE `Display#getWithNewlines`
// port every engine's edge-label line-splitting now reaches, replacing
// this file's own `splitCreoleLines` (real-newline-splitting, escape-blind)
// AND `diagrams/class/class-edge-label-lines.ts`'s `splitEdgeLabelLines`
// (an independent, narrower re-derivation of the SAME upstream scan) --
// see `DisplayNewlines.ts#splitDisplayLines`'s own doc comment.
import { splitDisplayLines } from './klimt/creole/DisplayNewlines.js';

/**
 * Inline creole tags that change FORMATTING and contribute no glyphs, so a
 * measurer must not see them. Built as a string so the alternation stays
 * readable; longer names precede their prefixes (`back` before `b`, `size`
 * before `s`) because regex alternation is first-match, not longest-match.
 *
 * A tag may carry a `:value` (`<color:green>`, `<size:13>`) or HTML-style
 * attributes after a space (`<font color="red">`), and may be a closing form.
 *
 * **Deliberately absent: `img`, `$` and `&`.** Those are ATOMS — they occupy
 * real width, and `creole-atoms.ts#scanLineForAtoms` sizes them
 * (`<img…>`, `<$sprite>`, `<&openicon>`). Stripping them here would silently
 * shrink every label carrying an icon. None of their names appears in the
 * alternation below, which is what keeps the atom scan intact.
 */
const CREOLE_FORMAT_TAG_SOURCE = '</?(?:color|back|size|font|plain|w|b|i|u|s)(?::[^>]*|\\s[^>]*)?>';

/**
 * Strip inline creole formatting to the text a measurer should see. Upstream
 * never faces this: `SvekEdge` measures a real creole `TextBlock`
 * (`SvekEdge.java:441`), a colour tag is a formatting change there, not
 * characters — measured 336.1px against a 72px oracle on
 * `usecase/jecici-56-bimu826` before this landed. See {@link resolveLineFont}
 * for the one case handed off separately: a leading `<size:N>` run change.
 */
export function stripCreoleMarkup(text: string): string {
  return text.replace(new RegExp(CREOLE_FORMAT_TAG_SOURCE, 'gi'), '');
}

/**
 * `<size:N>` with no closing `</size>` changes the font to the end of the
 * LINE (`CommandCreoleSizeChange.java:57,81-93` EOL form, `Splitter.java:53`
 * `fontSizePattern`). LEADING-only: `starters()` (`:50-52`) fires anywhere,
 * but a MID-STRING change (`abc <size:30>def`) needs per-run measurement no
 * fixture requires. Shared below by {@link computeReservedLabelBox} and the
 * class engine's magic-arrow branch (`class-layout-edge-labels.ts`).
 */
const LEADING_SIZE_TAG = /^<size[\s:]+(\d+)[^>]*>/i;

export function resolveLineFont(line: string, font: FontSpec): { text: string; font: FontSpec } {
  const m = LEADING_SIZE_TAG.exec(line);
  if (!m) return { text: stripCreoleMarkup(line), font };
  return { text: stripCreoleMarkup(line.slice(m[0].length)), font: { ...font, size: Number(m[1]) } };
}

/** Every intermediate the box formula produces, so a caller that needs the
 *  margin or the pre-margin measurement reads it off the same computation
 *  rather than re-deriving it. */
export interface ReservedLabelBox {
  readonly marginLabel: number;
  readonly lines: readonly string[];
  readonly measuredWidth: number;
  readonly measuredHeight: number;
  readonly reservedWidth: number;
  readonly reservedHeight: number;
}

/**
 * `VisibilityModifier#isVisibilityCharacter` (`skin/VisibilityModifier.java
 * :211-234`): a line carries a leading visibility marker only when it is
 * longer than 2 characters, its SECOND character differs from its first
 * (guards a doubled leading char, e.g. `--comment`, from being read as one),
 * and the first character is one of `-#+~*`.
 */
function isVisibilityCharacter(line: string): boolean {
  if (line.length <= 2) return false;
  const c = line[0]!;
  if (line[1] === c) return false;
  return c === '-' || c === '#' || c === '+' || c === '~' || c === '*';
}

/**
 * `SkinParam#classAttributeIconSize()`'s own default (`skin/SkinParam.java
 * :555`, `getAsInt("classAttributeIconSize", 10)`). Every caller of
 * {@link computeReservedLabelBox} / {@link applyVisibilityIcon} that omits
 * the size argument gets this — matching every diagram that never sets
 * `skinparam classAttributeIconSize`.
 */
export const CLASS_ATTRIBUTE_ICON_SIZE_DEFAULT = 10;

/** {@link applyVisibilityIcon}'s result. */
export interface VisibilityIconAdjustment {
  /** Line 0 with a leading visibility character stripped and trimmed
   *  (`Display.java:415-416`) — identical to the input when no icon
   *  applies. */
  readonly text: string;
  /** Extra width the icon block reserves, ALREADY merged left of the label
   *  (`SvekEdge.java:302,363-374`) — 0 when no icon applies. */
  readonly iconWidth: number;
  /** Extra height the icon block contributes — MAXED against the label's own
   *  height (`XDimension2D#mergeLR` takes the max, not the sum,
   *  `XDimension2D.java:108-112`), not added. 0 when no icon applies. */
  readonly iconHeight: number;
}

/**
 * `Guillemet.GUILLEMET_PATTERN` (`text/Guillemet.java:76`), transliterated
 * character for character: `\<\<\s?((?:\<&\w+\>|[^<>])+?)\s?\>\>`. The
 * alternation's first arm (`<&\w+>`) lets an icon-atom token survive INSIDE
 * a guillemet run (`<<​<&icon> foo>>`); the second (`[^<>]`) is everything
 * else. See {@link applyGuillemet}'s doc comment for the two behaviors this
 * reproduces that a naive string replace would miss.
 */
const GUILLEMET_PATTERN = /<<\s?((?:<&\w+>|[^<>])+?)\s?>>/g;

/**
 * Causes A+B of M4 (`.agent-notes/m4-single-line-width.md`): strip a leading
 * visibility character off a label's first line and reserve the icon block
 * upstream draws in its place. Both are gated on `classAttributeIconSize() >
 * 0` (`AbstractClassOrObjectDiagram.java:74`, `CommandLinkStateCommon.java
 * :202`, `LinkArg.java:65-72`) — the one flag that reaches every cuca engine
 * (class, state, description); when the skinparam is 0, upstream skips BOTH
 * the strip and the icon, and the raw string measures as written.
 *
 * A — `Display#manageGuillemet`'s visibility arm (`klimt/creole/Display.java
 * :415-416`): `lineString.substring(1).trim()`.
 *
 * B — `VisibilityModifier#getUBlock`'s `calculateDimension` returns `(size+1,
 * size+1)` (`skin/VisibilityModifier.java:100-102`). `SvekEdge
 * #addVisibilityModifier` wraps it in `TextBlockUtils.withMargin(v, 0, 1, 2,
 * 0)` (`svek/SvekEdge.java:363`) — the 4-arg overload maps to
 * `TextBlockMarged(v, top=marginY1=2, right=marginX2=1, bottom=marginY2=0,
 * left=marginX1=0)` (`klimt/shape/TextBlockUtils.java:75-78`), and
 * `TextBlockMarged#calculateDimension` adds `left+right` to width and
 * `top+bottom` to height (`klimt/shape/TextBlockMarged.java:74-77`). Net:
 * width `size+1+1 = size+2`, height `size+1+2 = size+3` — 12 and 13 at the
 * default size 10, the 12px M4 measured. The block is then merged LEFT of
 * the label (`TextBlockUtils.mergeLR`, `SvekEdge.java:374`), which sums
 * widths and MAXES heights (`XDimension2D#mergeLR`, `XDimension2D.java
 * :108-112`).
 */
export function applyVisibilityIcon(
  firstLine: string,
  classAttributeIconSize: number = CLASS_ATTRIBUTE_ICON_SIZE_DEFAULT,
): VisibilityIconAdjustment {
  if (classAttributeIconSize <= 0 || !isVisibilityCharacter(firstLine)) {
    return { text: firstLine, iconWidth: 0, iconHeight: 0 };
  }
  return {
    text: firstLine.slice(1).trim(),
    iconWidth: classAttributeIconSize + 2,
    iconHeight: classAttributeIconSize + 3,
  };
}

/**
 * M4 cause C (`.agent-notes/m4-single-line-width.md`): `Guillemet.GUILLEMET
 * .manageGuillemet(String)` (`text/Guillemet.java:76,78-88`) rewrites a
 * `<<stereotype>>` run to the single-glyph guillemet form `«stereotype»`
 * BEFORE measurement. Two details a naive `replace('<<', '«')` gets wrong,
 * both read off `GUILLEMET_PATTERN` (`Guillemet.java:76`,
 * `\<\<\s?((?:\<&\w+\>|[^<>])+?)\s?\>\>`):
 *
 * 1. The pattern matches ANYWHERE in the string — `Matcher#replaceAll`
 *    (`:86-87`) scans and rewrites every non-overlapping match in the
 *    whole input, not only one at position 0. `st.indexOf('<') < 0` (`:83
 *    -84`) is a FAST-PATH short-circuit, not an anchor.
 * 2. It eats one OPTIONAL space just inside each bracket — `\s?` on both
 *    sides of the captured group: `<< a >>` -> `«a»`, but `<<a>>` (no
 *    space) is untouched by that rule and only ONE of two spaces is eaten
 *    per side (`<<  a  >>` -> `« a »`).
 *
 * `Display#manageGuillemet(boolean)` (`klimt/creole/Display.java:410-424`)
 * calls this on EVERY line, unconditionally — unlike the visibility strip
 * ({@link applyVisibilityIcon}), which is gated on `classAttributeIconSize()
 * > 0` and line 0 only (`:415-416` vs `:418`, same loop body, two
 * independent conditions). Kept as a SEPARATE function rather than folded
 * into {@link applyVisibilityIcon} because folding would silently reach
 * every caller of {@link computeReservedLabelBox} (state, description via
 * `link-edge-attrs.ts:234`) — this mission's T12b scopes cause C to the
 * CLASS engine only: the description engine already rewrites its
 * POST-COLON stereotype correctly via a different route
 * (`link-edge-attrs.ts:206`, `mainLabelText`), and a MID-STRING `<<x>>`
 * inside a description main label is a real, separate, un-fixed gap that
 * route cannot represent — left as residue, not fixed here.
 */
export function applyGuillemet(text: string): string {
  if (!text.includes('<')) return text;
  return text.replace(GUILLEMET_PATTERN, '«$1»');
}

/** {@link parseMagicArrowLabel}'s parsed direction — `LinkArrow.BACKWARD` /
 *  `DIRECT_NORMAL` (`abel/LinkArrow.java`). */
export type MagicArrowDirection = 'forward' | 'backward';

/** {@link parseMagicArrowLabel}'s result. */
export interface MagicArrowLabel {
  /** Remaining label text after stripping the arrow token; `undefined` for
   *  a BARE `<`/`>` label (jar's `label = null` branch — no text at all,
   *  glyph only, `StringWithArrow.java:68-73`). */
  readonly text: string | undefined;
  readonly direction: MagicArrowDirection;
}

/**
 * M4 cause D (`.agent-notes/m4-single-line-width.md`, T12c): detect and
 * strip a magic-arrow token from a SINGLE-line label, mirroring
 * `StringWithArrow`'s constructor (`descdiagram/command/StringWithArrow
 * .java:56-91`) exactly, in the SAME check order (jar tests bare-equality
 * before the `startsWith`/`endsWith` forms). Returns `undefined` when the
 * label carries no magic-arrow token at all (jar's trailing `else` branch,
 * `linkArrow = NONE_OR_SEVERAL`).
 *
 * Shared seam (decisions.md D1): class (`class-magic-arrow.ts`, which also
 * owns the CLASS-ONLY triangle-glyph render geometry — description does not
 * draw the glyph) and description (`link-edge-attrs.ts`) both call this
 * directly. The caller is responsible for the single-line gate
 * (`StringWithArrow.java:63-65`'s `hasSeveralGuideLines` check) — this
 * function does not see the rest of the label and cannot apply it.
 */
export function parseMagicArrowLabel(label: string): MagicArrowLabel | undefined {
  if (label === '<') return { text: undefined, direction: 'backward' };
  if (label === '>') return { text: undefined, direction: 'forward' };
  if (label.startsWith('< ')) return { text: label.slice(2).trim(), direction: 'backward' };
  if (label.startsWith('> ')) return { text: label.slice(2).trim(), direction: 'forward' };
  if (label.endsWith(' >')) return { text: label.slice(0, -2).trim(), direction: 'forward' };
  if (label.endsWith(' <')) return { text: label.slice(0, -2).trim(), direction: 'backward' };
  return undefined;
}

/**
 * Width is the MAX over lines, not their sum; height SUMS each line's own
 * font size (`XDimension2D#mergeTB`, `XDimension2D.java:94-98`) — equal to
 * `lines.length * font.size` unless a leading `<size:N>` tag resolves a
 * different size per {@link resolveLineFont}. Both then take `2 *
 * marginLabel` and the width floors, as the jar truncates toward zero
 * (`(int)` cast, `SvekEdge.java:504-507`). `marginLabel` is 6 for a
 * self-loop, 1 otherwise.
 *
 * `classAttributeIconSize` gates M4 causes A+B (visibility-char strip + icon
 * block, {@link applyVisibilityIcon}) on LINE 0 only, matching
 * `Display#manageGuillemet`'s `first`-only guard (`Display.java:414-416`).
 *
 * T1: `text` splits via {@link splitDisplayLines} (`Display#getWithNewlines`,
 * `klimt/creole/Display.java:262-346`) -- every caller's upstream site builds
 * its input via that SAME method (class: `CommandLinkClass.java:413`; state:
 * `CommandCreateState.java:195`/`BodierSimple.java:61`; description: `CommandLinkElement.java:320`).
 */
export function computeReservedLabelBox(
  text: string,
  font: FontSpec,
  measurer: StringMeasurer,
  isSelfLoop: boolean,
  classAttributeIconSize: number = CLASS_ATTRIBUTE_ICON_SIZE_DEFAULT,
): ReservedLabelBox {
  const marginLabel = isSelfLoop ? 6 : 1;
  const rawLines = splitDisplayLines(text).lines;
  const vis = applyVisibilityIcon(rawLines[0] ?? '', classAttributeIconSize);
  // Resolve BEFORE measuring: colour tags are formatting, `<size:N>` rewrites
  // the font; `lines` only feeds a descent measurement (`state-transition-label.ts:60`).
  const resolved = [vis.text, ...rawLines.slice(1)].map((l) => resolveLineFont(l, font));
  const lines = resolved.map((r) => r.text);
  const measuredWidth = Math.max(...resolved.map((r) => measurer.measure(r.text, r.font).width)) + vis.iconWidth;
  const stackedHeight = resolved.reduce((sum, r) => sum + r.font.size, 0);
  const measuredHeight = Math.max(stackedHeight, vis.iconHeight);
  const reservedWidth = Math.floor(measuredWidth + 2 * marginLabel);
  const reservedHeight = measuredHeight + 2 * marginLabel;
  return { marginLabel, lines, measuredWidth, measuredHeight, reservedWidth, reservedHeight };
}

/** {@link computeQuantifierBox}'s result — deliberately narrower than
 *  {@link ReservedLabelBox}: the quantifier/role arm never has a margin or a
 *  shield to report, so there is nothing else to expose. */
export interface QuantifierBox {
  readonly lines: readonly string[];
  readonly reservedWidth: number;
  readonly reservedHeight: number;
}

/** `CharHidder#isToBeHidden` (`utils/CharHidder.java:84-90`): the ten
 *  characters a leading `~` can escape. NOT `VisibilityModifier`'s char set
 *  (`-#+~*`, `skin/VisibilityModifier.java:219-232`) — overlap only at `*`. */
const CHAR_HIDDER_ESCAPE_TARGETS = '_-"#][*./<';

/**
 * `~X` where `X` is one of {@link CHAR_HIDDER_ESCAPE_TARGETS} is a creole
 * ESCAPE sequence (`CharHidder#hide`, `utils/CharHidder.java:59-75`), not a
 * UML visibility marker on the quantifier/role arm: `hide` folds the pair
 * into one placeholder char during markup scanning, consuming the `~`;
 * `#unhide` (`:106-126`) restores `X` literally after. Called
 * unconditionally on every creole line by `StripeSimple#analyzeAndAdd`
 * (`klimt/creole/legacy/StripeSimple.java:150`) — main label AND
 * quantifier/role both reach it via `Display#create` ->
 * `CreoleStripeSimpleParser` -> `StripeSimple`.
 *
 * DIFFERENT from {@link applyVisibilityIcon} (`Display.java:415-416`),
 * which runs ONLY from `LinkArg#build` on the MAIN label and is absent
 * from quantifier construction (`SvekEdge.java:329-351` never touches
 * `LinkArg`) — no `VisibilityModifier` reference exists under `klimt
 * /creole/` outside `Display.java`. A visibility-strip reading would ALSO
 * strip a leading `+`/`-`/`#`, and a bare `~` before any non-escape char;
 * solo `scripts/oracle-render.sh` renders disprove both: `"+
 * initiators"`/`"# initiators"` measure literal, UNSTRIPPED (56/62px);
 * `"~ initiators"`/`"~initiators"` both measure 56, tilde rendered.
 * `"~* initiators"`/`"~*initiators"` both measure 53 — the escape consumes
 * exactly the `~`; the surviving `*` renders literally, NOT the creole
 * list-bullet markup a BARE leading `*` triggers (`CreoleStripeSimpleParser
 * .ASTERISK_PREFIXED_LINE_PATTERN`, `:69` — measures 60, not reproduced).
 *
 * Scoped to a LEADING escape only — no fixture needs mid-line, and the
 * list-bullet path is out of scope.
 */
function stripLeadingEscapedChar(line: string): string {
  if (line.length < 2 || line[0] !== '~') return line;
  return CHAR_HIDDER_ESCAPE_TARGETS.includes(line[1]!) ? line.slice(1) : line;
}

/**
 * The box formula for an edge's QUANTIFIER (multiplicity) and ROLE labels —
 * `startTailText`/`endHeadText`/`startTailRoleText`/`endHeadRoleText`,
 * measured at the CARDINALITY font, not the arrow label font.
 *
 * Construction (`SvekEdge.java:330-351`): `Display.getWithNewlines(pragma,
 * text).create(cardinalityFont, CENTER, skinParam)` — split on `\n`
 * ({@link splitDisplayLines}), then {@link stripLeadingEscapedChar} on EVERY
 * line (not gated to line 0 — see its doc comment for the mechanism).
 *
 * Emission (`SvekEdge.java:447-467`), why this exists apart from
 * {@link computeReservedLabelBox}: `appendTable` passes the RAW dimension
 * through — no shield, no `marginLabel` (unlike the main label at
 * `:440-445`). Its `(int)` cast (`:504-507`) truncates toward zero,
 * mirrored with `Math.floor` (widths are never negative).
 *
 * `font` is the resolved CARDINALITY font — the caller (T6/T7) reads it
 * through the style cascade.
 */
export function computeQuantifierBox(text: string, font: FontSpec, measurer: StringMeasurer): QuantifierBox {
  const { lines: rawLines } = splitDisplayLines(text);
  const lines = rawLines.map(stripLeadingEscapedChar);
  const measuredWidth = Math.max(...lines.map((l) => measurer.measure(l, font).width));
  const reservedWidth = Math.floor(measuredWidth);
  const reservedHeight = lines.length * font.size;
  return { lines, reservedWidth, reservedHeight };
}

// The `note on link` merge lives in a sibling module (2026-09-08, split for
// the 500-line cap after `<size:N>` support pushed this file to exactly it).
// Re-exported so no consumer's import path changed.
export {
  computeMergedLabelBox,
  type MergedLabelBoxInput,
  type NoteOnLinkPosition,
} from './edge-label-box-note-merge.js';
