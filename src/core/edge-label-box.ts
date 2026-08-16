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
 * labels a different, wrong way. A pure move: the state engine's DOT output is
 * byte-identical across the relocation, which its DOT-parity suite proves.
 * `state-sizing.ts` and `state-transition-label.ts` re-export from here, so no
 * state-side import changed.
 */
import type { FontSpec, StringMeasurer } from './measurer.js';
// `src/core/` already imports from `src/diagrams/` elsewhere (`assemble-svg
// .ts` imports each engine's `renderer.js`), so reusing the existing
// `\n`/`\l`/`\r` splitter here is not a new or backwards layering — see D1
// and this task's boundary note.
import { splitEdgeLabelLines } from '../diagrams/class/class-layout-edge-labels.js';

/**
 * Split a display/description string on PlantUML's literal `\n` line-break
 * token (two source characters: backslash, n — NOT a real newline; our
 * parser never converts it, mirroring upstream's Creole renderer which
 * treats the literal token as a line break at draw time). A raw newline
 * character (if one ever appears) is also treated as a break, since no
 * upstream state-diagram source produces one but defensive parity costs
 * nothing here.
 * @see ~/git/plantuml/.../klimt/creole/Display.java (line splitting on `\n`)
 */
export function splitCreoleLines(text: string): string[] {
  return text.split(/\\n|\n/);
}

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
const CREOLE_FORMAT_TAG_SOURCE =
  '</?(?:color|back|size|font|plain|w|b|i|u|s)(?::[^>]*|\\s[^>]*)?>';

/**
 * Strip inline creole formatting to the text a measurer should see.
 *
 * Upstream never faces this: `SvekEdge` measures a real creole `TextBlock`
 * (`SvekEdge.java:441`), where a colour tag is a formatting change rather than
 * characters. This port measures strings, so the tags have to come out first
 * or they are counted as glyphs — measured at 336.1px against a 72px oracle
 * box on `usecase/jecici-56-bimu826`, whose label carries two colour tags.
 *
 * A faithful TextBlock port is the Phase 4h creole track and is out of scope
 * here; this closes the measurement gap without it. The one case it cannot
 * represent is a per-run font change inside a label (`<size:N>` mid-string),
 * which genuinely needs the block — no corpus fixture exercises it.
 */
export function stripCreoleMarkup(text: string): string {
  return text.replace(new RegExp(CREOLE_FORMAT_TAG_SOURCE, 'gi'), '');
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

/**
 * Width is the MAX over lines, not their sum; height is the line count times
 * the font size; both then take `2 * marginLabel` and the width floors, as
 * the jar truncates toward zero (`(int)` cast, `SvekEdge.java:504-507`).
 *
 * `marginLabel` is 6 for a self-loop and 1 otherwise.
 *
 * `classAttributeIconSize` gates M4 causes A+B (visibility-char strip +
 * icon block, see {@link applyVisibilityIcon}) on LINE 0 only — every other
 * line is unaffected, matching `Display#manageGuillemet`'s `first`-only
 * guard (`klimt/creole/Display.java:414-416`).
 */
export function computeReservedLabelBox(
  text: string,
  font: FontSpec,
  measurer: StringMeasurer,
  isSelfLoop: boolean,
  classAttributeIconSize: number = CLASS_ATTRIBUTE_ICON_SIZE_DEFAULT,
): ReservedLabelBox {
  const marginLabel = isSelfLoop ? 6 : 1;
  const rawLines = splitCreoleLines(text);
  const vis = applyVisibilityIcon(rawLines[0] ?? '', classAttributeIconSize);
  // Strip BEFORE measuring: a colour tag is a formatting change upstream, not
  // glyphs. `lines` carries the stripped text because its only consumer is a
  // descent measurement (`state-transition-label.ts:60`), not drawing.
  const lines = [vis.text, ...rawLines.slice(1)].map(stripCreoleMarkup);
  const measuredWidth = Math.max(...lines.map((l) => measurer.measure(l, font).width)) + vis.iconWidth;
  const measuredHeight = Math.max(lines.length * font.size, vis.iconHeight);
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

/**
 * The box formula for an edge's QUANTIFIER (multiplicity) and ROLE labels —
 * `startTailText`/`endHeadText`/`startTailRoleText`/`endHeadRoleText`,
 * measured at the CARDINALITY font, not the arrow label font.
 *
 * Construction (`SvekEdge.java:330-351`): each is
 * `Display.getWithNewlines(pragma, text).create(cardinalityFont, CENTER,
 * skinParam)` — split on `\n`, same mechanism `splitEdgeLabelLines` already
 * ports (reused here rather than duplicated, per this task's boundary).
 *
 * Emission (`SvekEdge.java:447-467`) is the point of this function existing
 * separately from {@link computeReservedLabelBox}: `appendTable(sb,
 * startTailText.calculateDimension(stringBounder), ...)` passes the RAW
 * dimension straight through. Unlike the main label at `:440-445`, which adds
 * `2 * labelShield` before its own `appendTable` call, the quantifier/role
 * arms add nothing — no shield, no `marginLabel`. `appendTable`'s `(int)`
 * cast (`:504-507`) truncates toward zero, mirrored here with `Math.floor`
 * (measured widths are never negative, so floor and trunc agree).
 *
 * `font` is the resolved CARDINALITY font — this function does not resolve
 * it; the caller (T6/T7) reads it through T1's style cascade.
 */
export function computeQuantifierBox(
  text: string,
  font: FontSpec,
  measurer: StringMeasurer,
): QuantifierBox {
  const { lines } = splitEdgeLabelLines(text);
  const measuredWidth = Math.max(...lines.map((l) => measurer.measure(l, font).width));
  const reservedWidth = Math.floor(measuredWidth);
  const reservedHeight = lines.length * font.size;
  return { lines, reservedWidth, reservedHeight };
}

/** Two-dimensional size, independent of where it came from (a measured
 *  label or the note sizer's decorated-image output). */
interface Dim {
  readonly width: number;
  readonly height: number;
}

/** `Position.LEFT` / `RIGHT` / `TOP` / `BOTTOM` — the note's placement
 *  relative to the label, `SvekEdge.java:318-325`. */
export type NoteOnLinkPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * `labelShield` — 7 when the link type's middle decor is not `NONE`, 0
 * otherwise (`SvekEdge.java:353-356`). `2 * LABEL_SHIELD` is added to BOTH
 * width and height via `dimNote.delta(2 * labelShield)` (`:441`), because
 * `XDimension2D#delta(double)` (`XDimension2D.java:75-77`) forwards to the
 * two-arg form with the same value for width and height (`:87-92`).
 */
const LABEL_SHIELD = 7;

/**
 * `XDimension2D#mergeLR` (`XDimension2D.java:108-112`) — the arithmetic
 * `TextBlockHorizontal#calculateDimensionSlow` reduces over via
 * `TextBlockUtils.mergeLR` (`TextBlockHorizontal.java:69-75`,
 * `TextBlockUtils.java:112-120`). Read here, not inferred from the method
 * name (decisions.md D2): width sums, height takes the max — the alignment
 * parameter (`VerticalAlignment`) only affects `drawU`'s vertical offset
 * (`:77-93`), never the dimension. Width-sum and height-max are both
 * commutative, so operand order does not change the numbers this function
 * returns — it is preserved anyway to mirror upstream for a future drawing
 * consumer (T9/T10), which DOES care which side is on the left.
 */
function mergeLR(left: Dim, right: Dim): Dim {
  return { width: left.width + right.width, height: Math.max(left.height, right.height) };
}

/**
 * `XDimension2D#mergeTB` (`XDimension2D.java:94-98`) — same reduction, via
 * `TextBlockVertical#calculateDimensionSlow` (`TextBlockVertical.java:71-77`,
 * `TextBlockUtils.java:122-130`): width takes the max, height sums.
 */
function mergeTB(top: Dim, bottom: Dim): Dim {
  return { width: Math.max(top.width, bottom.width), height: top.height + bottom.height };
}

/**
 * Operand order per position (`SvekEdge.java:318-325`): note-first for
 * `LEFT`/`TOP`, label-first for `RIGHT`/`BOTTOM`.
 */
function mergeByPosition(position: NoteOnLinkPosition, noteDim: Dim, labelDim: Dim): Dim {
  switch (position) {
    case 'left':
      return mergeLR(noteDim, labelDim);
    case 'right':
      return mergeLR(labelDim, noteDim);
    case 'top':
      return mergeTB(noteDim, labelDim);
    case 'bottom':
      return mergeTB(labelDim, noteDim);
  }
}

export interface MergedLabelBoxInput {
  readonly label: string;
  /** From the note sizer (`EntityImageNoteLink` — padding, border, and any
   *  sprite already baked in), NOT a string measurement. */
  readonly noteDim: Dim;
  readonly position: NoteOnLinkPosition;
  /** `NoteLinkStrategy.HALF_NOT_PRINTED` / `HALF_PRINTED_FULL`
   *  (`SvekEdge.java:314-317`). */
  readonly halfWidth: boolean;
  /** `link.getType().getMiddleDecor() != LinkMiddleDecor.NONE`
   *  (`:353-356`). */
  readonly hasMiddleDecor: boolean;
  readonly font: FontSpec;
  readonly measurer: StringMeasurer;
}

/**
 * The box formula for a link whose note is merged into the label
 * (`SvekEdge.java:302-325, 440-445, 485-489`), covering all three terms in
 * order of application:
 *
 * 1. **Merge** — `mergeLR`/`mergeTB` over the label's ALREADY-margined
 *    dimension (`labelOnly = addVisibilityModifier(block, link, skinParam)`,
 *    `:302`, which bakes in `2 * marginLabel` via `withMargin` — `:372-373`
 *    — BEFORE the merge, not after) and the note operand's raw dimension.
 *    Reuses {@link computeReservedLabelBox} for the label side so the same
 *    creole-strip/split/margin arithmetic is not re-derived; `isSelfLoop`
 *    is fixed `false` because this contract carries no such flag — no
 *    corpus fixture combines a self-loop link with `note on link`, so the
 *    self-loop margin (6, `:372`) is unrepresented here. If one surfaces,
 *    that is a `DIVERGENCES.md` entry, not a reason to guess a flag through.
 *    An empty label mirrors `TextBlockUtils.mergeLR`/`mergeTB`'s own
 *    `EMPTY_TEXT_BLOCK` short-circuit (`TextBlockUtils.java:112-120,
 *    122-130`): the note dimension passes through untouched, unmerged.
 * 2. **Shield** — `+ 2 * labelShield` on BOTH dimensions.
 * 3. **Halving** — width only, via `eventuallyDivideByTwo`
 *    (`SvekEdge.java:485-489`).
 *
 * `appendTable`'s `(int)` cast (`:504-507`) truncates the final width AND
 * height — unlike {@link computeReservedLabelBox}, where only width can be
 * fractional; here both can, since `noteDim` may carry sub-pixel values.
 *
 * **Exactly one truncation, at the end.** Upstream's whole pipeline —
 * `withMargin` (`TextBlockUtils.java:75-78`), `mergeLR`/`mergeTB`
 * (`XDimension2D.java:94-98,108-112`), `delta` (`:87-92`),
 * `eventuallyDivideByTwo` — stays in doubles; only `appendTable`'s `(int)`
 * cast (`:504-507`) truncates, once, on the fully-combined dimension. The
 * label operand therefore enters the merge as `measuredWidth + 2 *
 * marginLabel` (fractional), NOT {@link computeReservedLabelBox}'s
 * `reservedWidth` (already floored, `:107`) — using the floored value here
 * would truncate the label twice (once early, once at the end below),
 * losing up to 1px whenever `mergeLR` sums it into the note's width or
 * `mergeTB` maxes against it. `computeReservedLabelBox`'s OWN callers still
 * get the early floor; only this merge path skips it, on the label operand
 * only. Height is unaffected: `computeReservedLabelBox` never floors
 * `reservedHeight` (`:108`), so it is already the fractional value.
 */
export function computeMergedLabelBox(input: MergedLabelBoxInput): ReservedLabelBox {
  const { label, noteDim, position, halfWidth, hasMiddleDecor, font, measurer } = input;
  const labelBox = computeReservedLabelBox(label, font, measurer, false);
  const labelDim: Dim = {
    width: labelBox.measuredWidth + 2 * labelBox.marginLabel,
    height: labelBox.reservedHeight,
  };
  const merged = label.length === 0 ? noteDim : mergeByPosition(position, noteDim, labelDim);
  const shield = hasMiddleDecor ? LABEL_SHIELD : 0;
  const shieldedWidth = merged.width + 2 * shield;
  const shieldedHeight = merged.height + 2 * shield;
  const finalWidth = halfWidth ? shieldedWidth / 2 : shieldedWidth;
  return {
    marginLabel: labelBox.marginLabel,
    lines: labelBox.lines,
    measuredWidth: merged.width,
    measuredHeight: merged.height,
    reservedWidth: Math.floor(finalWidth),
    reservedHeight: Math.floor(shieldedHeight),
  };
}
