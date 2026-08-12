/**
 * Object member-row measurement group -- the field/row math consumed by
 * ./class-object-sizing.ts's field-based `object` leaf branch. Split out of
 * ./class-object-sizing.ts (S-C -- pure relocation, no logic change) to keep
 * both files under the repo's 500-line-per-file cap and every function
 * under the CCN/NLOC caps -- same split rationale as class-object-sizing.ts's
 * own module doc (split from class-object-map-sizing.ts, S1) and
 * class-shield-helpers.ts's (split from class-layout-helpers.ts, S2).
 * `class-object-sizing.ts` keeps `measureObjectClassifier` and its title/
 * geo-builder helpers, and imports {@link measureObjectFields} and
 * {@link methodOrFieldHeight} back from here for its field-based branch --
 * newly exported by this split, since both were previously called only
 * within the same file. {@link formatObjectMemberText} was ALREADY exported
 * before this split: its external caller is `class-port-rows.ts`, whose
 * `./class-object-sizing.js` import site is repointed here, not re-exported.
 *
 * Faithful port of the row math:
 *   @see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java (asBlockMemberImpl)
 *   @see ~/git/plantuml/.../cucadiagram/BodierLikeClassOrObject.java (getMethodOrFieldHeight, OBJECT branch)
 *   @see ~/git/plantuml/.../klimt/font/AtomText.java (getTabSize/tabString/drawU)
 *   @see ~/git/plantuml/.../klimt/creole/Display.java (getWithNewlines, `\t` escape)
 *
 * Verification fixtures (byte-for-byte against the jar's deterministic width
 * table) are unchanged by this move and remain documented in
 * ./class-object-sizing.ts's own module doc: figeze-77-fozi735 (per-row
 * width), nukera-08-dige359 (OBJECT_SMALL_ICON), nufoju-44-dabi767
 * (tabStopWidthPx's width-0 fallback).
 */

import type { Classifier, Member } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { ClassifierGeo } from './layout.js';
import type { Dim } from './class-object-map-header.js';
import { baselineOffsetFor } from './class-object-map-header.js';
import { CANONICAL_OBJECT_SEPARATOR } from './class-object-display.js';
import { buildObjectMemberRow } from './class-object-member-creole.js';
import type { ObjectMemberRow } from './class-object-member-creole.js';
import { atomsToPlainText } from './class-member-creole.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { FlatMemberRows } from './class-member-rows.js';

interface FieldsResult {
  dim: Dim;
  rows: ClassifierGeo['rows'];
  /** SI20 T1, publish-only: `visibleMembers`/`texts`/`builds`, already
   *  computed for `dim`/`rows` above, reshaped into `class-layout-generic-
   *  classifier.ts#buildNormalClassifierResult`'s `FlatMemberRows` shape --
   *  no new measurement. See {@link toFlatMemberRows}. */
  flat: FlatMemberRows;
}

/** MethodsOrFieldsArea#asBlockMemberImpl: `withMargin(this, 6, 4)`. */
const OBJECT_FIELD_MARGIN_X = 6;
const OBJECT_FIELD_MARGIN_Y = 4;
/** `TextBlockEmpty(10, 16)` — the "no fields but shown" placeholder box
 *  (EntityImageObject ctor, `fieldsToDisplay.size() == 0 && showFields`). */
const OBJECT_EMPTY_FIELDS: Dim = { width: 10, height: 16 };
/** BodierLikeClassOrObject#marginEmptyFieldsOrMethod — substituted only when
 *  the fields area is BOTH empty and shown. Unreachable in practice for
 *  object (the empty-fields branch above always yields height 16, never 0),
 *  ported anyway per this project's "port the awkward code too" discipline. */
const OBJECT_EMPTY_HEIGHT_FALLBACK = 13;
/**
 * `MethodsOrFieldsArea#calculateDimensionOnlyMembers`'s `smallIcon` term —
 * `skinParam.getCircledCharacterRadius() + 3`, added to the block's width
 * ONCE (not per row) whenever ANY visible member carries an explicit
 * visibility char (`hasSmallIcon()`). Upstream's default radius is
 * `FontParam.CIRCLED_CHARACTER`'s size (17) integer-divided by 3, plus 6:
 * `17/3 + 6 = 5 + 6 = 11`; `+3` -> 14. Verified against nukera-08-dige359's
 * p1 (four visibility-char member rows, all sharing the same post-strip
 * text): `107.7125 (text) + 14 (icon) + 12 (2*marginX) = 133.7125` px, the
 * oracle width exactly.
 * @see ~/git/plantuml/.../skin/SkinParam.java:542-545 (getCircledCharacterRadius)
 * @see ~/git/plantuml/.../klimt/font/FontParam.java:55 (CIRCLED_CHARACTER size 17)
 * @see ~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:125-138,155-157
 */
const OBJECT_SMALL_ICON = 14;

/**
 * G3/O4: `AtomText#getTabSize`/`tabString` -- the pixel width of ONE tab
 * stop, matching upstream's own quirky clamp: a configured `skinparam
 * tabSize N` in [1,6] uses N literal spaces; ANY other value (including
 * the upstream default 8, and `skinparam tabSize 20`) falls back to a
 * HARDCODED 8-space string regardless of N (`AtomText.java:258-264`'s own
 * `nb >= 1 && nb < 7` gate -- a genuine upstream quirk, ported faithfully
 * per this project's "port the awkward code too" discipline). When that
 * string measures to width 0 (`DeterministicMeasurer`'s width table has no
 * entry for the space glyph -- jar-verified), the tab stop becomes
 * `fontSize * 4` instead (`AtomText.java:272-274`'s own `width == 0`
 * fallback) -- jar-verified against `nufoju-44-dabi767` (`skinparam
 * tabSize 20`, 14pt font -> tab stop 56 = 14*4, NOT a function of the
 * configured `20` at all).
 */
function tabStopWidthPx(theme: Theme, measurer: StringMeasurer): number {
  const nb = theme.tabSize ?? 8;
  const spaces = nb >= 1 && nb < 7 ? ' '.repeat(nb) : '        ';
  const width = measurer.measure(spaces, { family: theme.fontFamily, size: theme.fontSize }).width;
  return width === 0 ? theme.fontSize * 4 : width;
}

/** Format a member text string for object diagram instances: the raw,
 *  visibility-stripped source line verbatim when present (upstream's
 *  `Member#getDisplay(false)` — `Bodier` never rejects a body line, see
 *  class-object-commands.ts#parseObjectField), else the structured
 *  `name = value` / bare `name` reconstruction for the two shapes this AST
 *  still parses eagerly. Exported: also used by tests constructing expected
 *  row text directly.
 *
 *  G3/O4: a literal `\t` (backslash + 't', TWO source chars -- `skinparam
 *  tabSize`'s own trigger, `nufoju-44-dabi767`) is unescaped to a REAL tab
 *  byte (U+0009) here, mirroring `Display.getWithNewlines`'s own `c2 ==
 *  't'` branch (`Display.java:302-304`, `current.append('\t')`) -- the
 *  GENERIC backslash-escape site every Display-backed text line (title/
 *  caption/legend/member) routes through upstream. Scoped to ONLY the `\t`
 *  escape (not the full `\n`/`\r`/`\l`/`\\` family Display.java also
 *  handles) -- no corpus object-field fixture exercises the others, and
 *  `\n` specifically has NO meaning inside a single already-newline-split
 *  field line. `layoutTabRuns` (above) consumes the resulting real tab
 *  byte via `AtomText#drawU`'s own tokenizer shape. */
export function formatObjectMemberText(
  member: Pick<Member, 'name' | 'type' | 'rawDisplay' | 'typeSeparator'>,
): string {
  const raw =
    member.rawDisplay !== undefined
      ? member.rawDisplay
      : member.type !== undefined
        ? `${member.name}${member.typeSeparator ?? CANONICAL_OBJECT_SEPARATOR}${member.type}`
        : member.name;
  return raw.includes('\\t') ? raw.replace(/\\t/g, '\t') : raw;
}

/** BodierLikeClassOrObject#getMethodOrFieldHeight (OBJECT branch). */
export function methodOrFieldHeight(fieldsHeight: number, showFields: boolean): number {
  return fieldsHeight === 0 && showFields ? OBJECT_EMPTY_HEIGHT_FALLBACK : fieldsHeight;
}

/** SI20 T1, publish-only: reshapes already-computed `visibleMembers`/
 *  `texts`/`builds` into `buildNormalClassifierResult`'s `FlatMemberRows`
 *  shape -- no new measurement. `ObjectMemberRow.runs[].atom` unwraps into
 *  `MemberRowBuild.atoms` (`x` is run-only, unused by `toPortCompartments`,
 *  which reads only `.height`). */
function toFlatMemberRows(
  members: Classifier['members'],
  texts: string[],
  builds: readonly ObjectMemberRow[],
): FlatMemberRows {
  return {
    members,
    texts,
    builds: builds.map((b) => ({ atoms: b.runs.map((r) => r.atom), width: b.width, height: b.height })),
  };
}

/**
 * MethodsOrFieldsArea (via BodyFactory.create1 -> BodyEnhanced1 -> a single
 * buildTextBlock, since object field lines never contain a block separator/
 * tree/table): one row per visible member, width = widest row + 2*marginX
 * (+ {@link OBJECT_SMALL_ICON} once, when any row has an explicit visibility
 * char — `MethodsOrFieldsArea#hasSmallIcon`), height = sum(rowHeights) +
 * 2*marginY. Every row's TEXT indent shifts by the same icon reserve when
 * `hasIcon` is true, even for a row with no modifier of its own — upstream's
 * `PlacementStrategyVisibility` reserves that column uniformly across the
 * whole block (a modifier-less row just draws nothing in it,
 * `getUBlock(null, ...)`). Falls back to the empty-fields placeholder / a
 * zero box per BodierLikeClassOrObject#getBody's OBJECT branch (see file doc
 * for the exact showFields/hasMembers matrix).
 *
 * G3/O1: each row's baseline is `OBJECT_FIELD_MARGIN_Y + i*fontSize +
 * baselineOffset` (the SAME "ascent-from-row-top" convention as
 * `headerRows` in ./class-object-map-header.ts, one row-height stride per
 * index `i`) -- NOT the pre-O1 half-height guess (`i*fontSize +
 * fontSize/2`), which only coincided with jar for a font with zero descent
 * (never, for real text). Every row also carries its OWN raw text width
 * for `textLength` (rounded at emission, `core/svg.ts`) -- jar-verified
 * against figeze-77-fozi735's
 * "user" (`name = "Dummy"` -> 101.4125, `id = 123` -> 42.525, visibly
 * DIFFERENT per-row values, ruling out a shared-block-width hypothesis) and
 * nukera-08-dige359's p1 (4 identical-text visibility-icon rows, baseline
 * stride unperturbed by the icon reserve).
 */
export function measureObjectFields(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
  showFields: boolean,
): FieldsResult {
  const visibleMembers = classifier.members.filter((m) => m.hidden !== true);
  if (!showFields) return { dim: { width: 0, height: 0 }, rows: [], flat: toFlatMemberRows([], [], []) };
  if (visibleMembers.length === 0) return { dim: OBJECT_EMPTY_FIELDS, rows: [], flat: toFlatMemberRows([], [], []) };

  const fontSpec = { family: theme.fontFamily, size: theme.fontSize };
  const texts = visibleMembers.map(formatObjectMemberText);
  // G3/O4: `\t` characters (`skinparam tabSize`) split a line into
  // multiple independently-positioned text runs -- see `layoutTabRuns`'s
  // own doc comment. `tabStopWidthPx` is computed once per block (font-
  // dependent only, not per-row).
  const tabStopPx = tabStopWidthPx(theme, measurer);
  // Member rows are CREOLE lines upstream (`MethodsOrFieldsArea
  // #createTextBlock`, java:238-265, `CreoleMode.SIMPLE_LINE`), with tab
  // stops expanded inside the resulting text atoms rather than instead of
  // them -- see `class-object-member-creole.ts`.
  const font: FontConfiguration = {
    family: fontSpec.family, size: fontSpec.size, color: null, styles: new Set(),
  };
  const builds = texts.map((t) => buildObjectMemberRow(t, font, measurer, tabStopPx));
  const widths = builds.map((b) => b.width);
  const hasIcon = visibleMembers.some((m) => m.visibilityExplicit === true);
  const iconReserve = hasIcon ? OBJECT_SMALL_ICON : 0;
  const textIndent = OBJECT_FIELD_MARGIN_X + iconReserve;
  const width = Math.max(...widths) + iconReserve + OBJECT_FIELD_MARGIN_X * 2;
  // Sum of each row's OWN height, not `count * fontSize`:
  // `MethodsOrFieldsArea#calculateDimensionOnlyMembers` advances
  // `y += dim.getHeight()` per member (java:161-166). A plain text row's
  // height equals the font size, so text-only bodies are unchanged.
  const height = builds.reduce((a, b) => a + b.height, 0) + OBJECT_FIELD_MARGIN_Y * 2;
  const baselineOffset = baselineOffsetFor(fontSpec, measurer);
  const rows: ClassifierGeo['rows'] = [];
  let rowTop = OBJECT_FIELD_MARGIN_Y;
  builds.forEach((build, i) => {
    const y = rowTop + baselineOffset;
    rowTop += build.height;
    build.runs.forEach(({ atom, x }, runIndex) => {
      rows.push({
        text: atomsToPlainText([atom]),
        atoms: [atom],
        y,
        indent: textIndent + x,
        width: atom.width,
        // G3/O4: `visibilityIsField: true` UNCONDITIONALLY -- upstream's
        // `BodierLikeClassOrObject#getFieldsToDisplay` OBJECT branch
        // constructs EVERY member via `Member.field(s)` (never `Member
        // .method(s)`, regardless of the text looking method-like, e.g.
        // `getName()`), so `MethodsOrFieldsArea`'s own icon-fill derivation
        // (`modifier.isField()`, baked in at Member-construction time, NOT
        // a dynamic per-row check) is ALWAYS true for an object field --
        // `class-visibility-icon.ts#isFilled`'s own `!memberIsField` rule
        // therefore ALWAYS resolves to stroke-only (`fill="none"`) for
        // object rows, regardless of the visibility char -- jar-verified
        // `xuvesu-44-laru205` (`+`/`-` icons both `fill="none"`, `PUBLIC_
        // FIELD`/`PRIVATE_FIELD` data-attributes, never `_METHOD`). Absent
        // pre-O4, `row.visibilityIsField === true` evaluated false for
        // every object row, incorrectly filling `+` icons like a method.
        ...(runIndex === 0 && visibleMembers[i]!.visibilityExplicit === true
          ? { visibilityIcon: visibleMembers[i]!.visibility, visibilityIsField: true as const }
          : {}),
      });
    });
  });
  return { dim: { width, height }, rows, flat: toFlatMemberRows(visibleMembers, texts, builds) };
}
