/**
 * The `activityDiagram { }` style-default table and its resolvers
 * (mission `activity-style-defaults`, T2).
 *
 * THE ONE PLACE an activity `plantuml.skin` number is written. T3-T6 call
 * these resolvers; none of them re-declares a value.
 *
 * WHY THE DEFAULTS LIVE HERE AND NOT IN THE THEME (D2). Upstream's style
 * signature is DIAGRAM-SCOPED -- every activity element resolves through
 * `StyleSignatureBasic.of(root, element, activityDiagram, <sname>)`
 * (`activitydiagram3/ftile/vertical/FtileBox.java:98` for the action box,
 * `ftile/FtileFactoryDelegator.java:80,84` for the diamond and the arrow,
 * `ftile/Swimlanes.java:127` and `ftile/LaneDivider.java:72` for the
 * swimlane, `ftile/vcompact/FtileWithNoteOpale.java:89` for the note,
 * `ftile/vcompact/VCompactFactory.java:97-109` for the start/stop/end
 * circles). Our `theme.colors.elements` map is FLAT: `style-map-element
 * .ts#resolveElementBucketSelector` accepts the `<diagramType>.<sname>`
 * spelling but returns the BARE `sname`, so the bucket key carries no
 * diagram scope. Seeding `defaultTheme.colors.elements.arrow.fontSize = 11`
 * would therefore move description, class and state arrows too.
 *
 * So the cascade is two-tier, which is exactly the contract
 * `resolveElementFontSize` / `resolveElementLineThickness` already
 * document ("absent -> caller applies its own default"):
 *
 *   1. the USER OVERRIDE, from the shared bucket -- a `<style>
 *      activityDiagram { activity { FontSize 20 } }` block or a `skinparam
 *      DiamondFontSize 40`, both routed by T1;
 *   2. this module's constant, when the bucket declares none.
 *
 * Every resolver returns a `number` (never `undefined`): supplying the
 * default IS this module's job, so no caller writes `?? theme.fontSize`.
 *
 * WHAT IS DELIBERATELY NOT HERE. `theme.fontSize` (the diagram-wide root
 * default, `plantuml.skin:10`, `FontSize 14`) is what the activity engine
 * used for EVERY element before this module existed -- 98.9% of our
 * `<text>` carried it against the jar's 0.8% (`.agent-notes/asd-T0.md`).
 * It is not an activity value and no constant here restates it.
 */
import type { Theme } from '../../core/theme.js';
import { resolveElementFontSize, resolveElementLineThickness } from '../../core/theme.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import type { Paint } from '../../core/paint.js';

/**
 * The activity element kinds this module resolves. Deliberately a string
 * union rather than the bare `string` the shared `resolveElement*` helpers
 * take: a typo reaching those returns `undefined` silently, whereas here it
 * must not compile.
 *
 * Four of the seven -- `activity`, `activityBar`, `diamond`, `swimlane` --
 * are activity-EXCLUSIVE SNames and carry a shared bucket (T1, D3). The
 * other three -- `arrow`, `note`, `circle` -- are SHARED SNames whose
 * bucket is NOT routed for activity (D3 forbids admitting them), so for
 * those the override tier is reachable only through the nested
 * `activityDiagram { note { ... } }` spelling that D3a wired, and the
 * DEFAULT tier below is what normally applies.
 */
export type ActivitySName = 'activity' | 'activityBar' | 'arrow' | 'circle' | 'composite' | 'diamond' | 'note';

/** The bucket key for an SName. The shared bucket map is keyed by the
 * LOWERCASED sname (`skinparam-element-buckets.ts`'s own allowlist spells
 * `activitybar`), so `activityBar` must be folded before lookup. */
function bucketKey(sname: ActivitySName): string {
  return sname.toLowerCase();
}

// ---------------------------------------------------------------------------
// Font sizes
// ---------------------------------------------------------------------------

/** `activityDiagram { activity { FontSize 12 } }` — the action box's text.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:361 */
export const ACTIVITY_FONT_SIZE = 12;

/** `activityDiagram { diamond { FontSize 11 } }` — the branch/merge rhombus.
 * Not `ACTIVITY_FONT_SIZE - 1`: upstream declares it outright, and the
 * diamond's own signature (`of(root, element, activityDiagram, activity,
 * diamond)`, `ftile/FtileFactoryDelegator.java:80`) nests under `activity`,
 * so a relation between the two would silently invert if a user overrode
 * only `activity`.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:370 */
export const DIAMOND_FONT_SIZE = 11;

/** `activityDiagram { arrow { FontSize 11 } }` — the edge LABEL's text.
 * This is the activity-scoped override, and it BEATS the root-level `arrow
 * { FontSize 13 }` at `plantuml.skin:317`: the more-specific signature
 * wins, so an activity arrow's label is 11, never 13.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:373 */
export const ARROW_FONT_SIZE = 11;

/** The root-level `swimlane { FontSize 18 }` block. Activity has no
 * `activityDiagram { swimlane { ... } }` override, so the root block IS the
 * value the swimlane signature (`ftile/Swimlanes.java:127`) resolves.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:313 */
export const SWIMLANE_FONT_SIZE = 18;

/** The root-level `note { FontSize 13 }` block, resolved by an activity
 * note's own signature (`ftile/vcompact/FtileWithNoteOpale.java:89`).
 * Unlike `arrow`, `activityDiagram { }` declares no `note` override, so the
 * root value stands.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:323 */
export const NOTE_FONT_SIZE = 13;

/**
 * `undefined` means the kind declares NO FontSize anywhere upstream and so
 * inherits the ROOT block's `FontSize 14` (`plantuml.skin:10`) — which this
 * port already carries as `theme.fontSize`, and which a user's `skinparam
 * defaultFontSize` moves. Reading the theme there rather than restating 14
 * is the difference between inheriting the root and pinning a copy of it.
 *
 * Three kinds are in that position, each confirmed against its own upstream
 * signature rather than assumed:
 *   - `composite` — `activityDiagram { composite { ... } }`
 *     (`plantuml.skin:364-368`) declares LineColor, BackgroundColor and
 *     LineThickness only. A group/partition title resolves
 *     `of(root, element, activityDiagram, <symbol>, composite)`
 *     (`ftile/vcompact/FtileGroup.java:89-92`).
 *   - `circle` — the bare root `circle { }` block is EMPTY
 *     (`plantuml.skin:331-332`), and the `activityDiagram { circle { ... }
 *     }` block declares only thickness and colour. The connector spot's
 *     label resolves `of(..., circle, spot)`
 *     (`ftile/vcompact/VCompactFactory.java:103-105`,
 *     `gtile/GtileCircleSpot.java:66`).
 *   - `activityBar` — declares only a BackgroundColor (`:387`), and the
 *     fork/join bar draws no text at all.
 */
const FONT_SIZE_DEFAULTS: Readonly<Record<ActivitySName, number | undefined>> = {
  activity: ACTIVITY_FONT_SIZE,
  activityBar: undefined,
  arrow: ARROW_FONT_SIZE,
  circle: undefined,
  composite: undefined,
  diamond: DIAMOND_FONT_SIZE,
  note: NOTE_FONT_SIZE,
};

/**
 * The `swimlane` SName is NOT an `ActivitySName` member above because it is
 * not a FTile kind -- it is the lane chrome, resolved on its own axis by
 * `renderer.ts`. Its two values sit here anyway so the module keeps its
 * "one place an activity skin number is written" property.
 */
export function swimlaneFontSize(theme: Theme): number {
  return resolveElementFontSize(theme, 'swimlane', 'title') ?? SWIMLANE_FONT_SIZE;
}

/** The resolved text size for one activity element kind: the user's bucket
 * override if any, else this module's `plantuml.skin` default, else — for a
 * kind that declares none upstream — the inherited root `theme.fontSize`
 * (D2). Always a number; supplying the fallback is this module's job. */
export function activityFontSize(theme: Theme, sname: ActivitySName): number {
  return resolveElementFontSize(theme, bucketKey(sname), 'title') ?? FONT_SIZE_DEFAULTS[sname] ?? theme.fontSize;
}

// ---------------------------------------------------------------------------
// Line thicknesses
// ---------------------------------------------------------------------------

/** `activityDiagram { arrow { LineThickness 1 } }` — the activity-scoped
 * override of the root `arrow { LineThickness 1.0 }` (`:318`); both are 1,
 * and this cites the more-specific one that actually resolves.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:374 */
export const ARROW_LINE_THICKNESS = 1;

/** `activityDiagram { composite { LineThickness 1.5 } }` — a group/partition
 * frame's border.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:367 */
export const COMPOSITE_LINE_THICKNESS = 1.5;

/** `activityDiagram { circle { start, stop, end { LineThickness 1 } } }` —
 * the terminal circles' stroke. The `end` terminal overrides this to 1.5
 * one block later; see {@link CIRCLE_END_LINE_THICKNESS}.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:378 */
export const CIRCLE_LINE_THICKNESS = 1;

/** `activityDiagram { circle { end { LineThickness 1.5 } } }` — the `end`
 * terminal ALONE, overriding the `start, stop, end` block above it. Kept as
 * its own constant rather than folded into a conditional at the call site:
 * upstream gives `end` its own StyleSignature
 * (`ftile/vcompact/VCompactFactory.java:97`) distinct from `stop`'s
 * (`:101`) and `start`'s (`:109`), and the split is the whole reason the
 * two values differ.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:383 */
export const CIRCLE_END_LINE_THICKNESS = 1.5;

/** The root-level `swimlane { LineThickness 1.5 }` block.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:312 */
export const SWIMLANE_LINE_THICKNESS = 1.5;

/** The root-level `note { LineThickness 0.5 }` block.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:325 */
export const NOTE_LINE_THICKNESS = 0.5;

/** The root block's own `LineThickness 1.0` — what an activity element that
 * declares none of its own inherits. `activity`, `activityBar` and
 * `diamond` are all in that position: each declares only a FontSize,
 * BackgroundColor or RoundCorner inside `activityDiagram { }`.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:15 */
export const ROOT_LINE_THICKNESS = 1;

const LINE_THICKNESS_DEFAULTS: Readonly<Record<ActivitySName, number>> = {
  activity: ROOT_LINE_THICKNESS,
  activityBar: ROOT_LINE_THICKNESS,
  arrow: ARROW_LINE_THICKNESS,
  circle: CIRCLE_LINE_THICKNESS,
  composite: COMPOSITE_LINE_THICKNESS,
  diamond: ROOT_LINE_THICKNESS,
  note: NOTE_LINE_THICKNESS,
};

/** The resolved stroke width for one activity element kind. For the `end`
 * terminal specifically, use {@link CIRCLE_END_LINE_THICKNESS} — it is a
 * distinct upstream signature, not a variant of `circle`. */
export function activityLineThickness(theme: Theme, sname: ActivitySName): number {
  return resolveElementLineThickness(theme, bucketKey(sname)) ?? LINE_THICKNESS_DEFAULTS[sname];
}

export function swimlaneLineThickness(theme: Theme): number {
  return resolveElementLineThickness(theme, 'swimlane') ?? SWIMLANE_LINE_THICKNESS;
}

// ---------------------------------------------------------------------------
// Corner radius
// ---------------------------------------------------------------------------

/** `activityDiagram { activity { RoundCorner 25 } }` — the RAW, UNHALVED
 * value. Callers emit `rx` = `ry` = half of it (D4), matching
 * `URectangle`'s own halving convention: the jar renders `rx="12.5"
 * ry="12.5"` on an action rect.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:362 */
export const ACTIVITY_ROUND_CORNER = 25;

/** The root block's own `RoundCorner 0` — what every activity element but
 * the action box inherits, none of the others declaring one of their own.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:13 */
export const ROOT_ROUND_CORNER = 0;

const ROUND_CORNER_DEFAULTS: Readonly<Record<ActivitySName, number>> = {
  activity: ACTIVITY_ROUND_CORNER,
  activityBar: ROOT_ROUND_CORNER,
  arrow: ROOT_ROUND_CORNER,
  circle: ROOT_ROUND_CORNER,
  composite: ROOT_ROUND_CORNER,
  diamond: ROOT_ROUND_CORNER,
  note: ROOT_ROUND_CORNER,
};

/** The resolved corner radius for one activity element kind, RAW and
 * UNHALVED — the caller halves it onto both `rx` and `ry` (D4). */
export function activityRoundCorner(theme: Theme, sname: ActivitySName): number {
  return theme.colors.elements?.[bucketKey(sname)]?.roundCorner ?? ROUND_CORNER_DEFAULTS[sname];
}

// ---------------------------------------------------------------------------
// Padding
// ---------------------------------------------------------------------------

/** `activityDiagram { activity { Padding 10 } }` — the action box's inner
 * padding, the second half (with {@link ACTIVITY_FONT_SIZE}) of what makes
 * its height. D8 derives that height rather than keeping the port's
 * unsourced `ACTION_HEIGHT = 36`.
 *
 * ONE number for all four sides: `Style#getPadding` parses the value with
 * `ClockwiseTopRightBottomLeft.read`, whose single-token case returns
 * `new ClockwiseTopRightBottomLeft(v, v, v, v)`
 * (`klimt/geom/ClockwiseTopRightBottomLeft.java:74-77`).
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:360 */
export const ACTIVITY_PADDING = 10;

/** The ROOT block declares no `Padding` at all (`plantuml.skin:1-19`), and
 * `ClockwiseTopRightBottomLeft.read` returns `none()` — zero on every side
 * — for an absent value (`:67-68`). So a kind that declares none has NO
 * padding upstream, which is a real value and not a missing one.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:1-19 */
export const ROOT_PADDING = 0;

const PADDING_DEFAULTS: Readonly<Record<ActivitySName, number>> = {
  activity: ACTIVITY_PADDING,
  activityBar: ROOT_PADDING,
  arrow: ROOT_PADDING,
  circle: ROOT_PADDING,
  composite: ROOT_PADDING,
  diamond: ROOT_PADDING,
  note: ROOT_PADDING,
};

/**
 * The resolved inner padding for one activity element kind, per side.
 *
 * There is no bucket tier: `ElementColors` carries no `padding` field, and
 * D2's reasoning for adding one does not apply — the DEFAULT is what this
 * module exists to supply, and no corpus fixture sets `<style> activity {
 * Padding N }`. Add the bucket field when one does.
 */
export function activityPadding(sname: ActivitySName): number {
  return PADDING_DEFAULTS[sname];
}

/**
 * The height an activity box reserves for `lineCount` lines of its own
 * resolved text — upstream's own arithmetic, not a constant.
 *
 * `FtileBox#calculateDimensionFtile` (`ftile/vertical/FtileBox.java:237-243`):
 *
 * ```java
 * XDimension2D dimRaw = tb.calculateDimension(stringBounder);
 * dimRaw = dimRaw.delta(padding.getLeft() + padding.getRight(),
 *                       padding.getBottom() + padding.getTop());
 * dimRaw = dimRaw.atLeast(minimumWidth, 0);
 * ```
 *
 * — so the height is the text height plus the top and bottom padding, and
 * the `atLeast` floors the WIDTH only: its second argument is a literal
 * `0`, so **upstream imposes no minimum height on an action box**. The
 * port's `ACTION_HEIGHT = 36` was a floor with no upstream counterpart
 * (D8), and it is deleted rather than lowered to the 32 the jar happens to
 * emit — 32 is what this derivation RETURNS for one line at `FontSize 12`
 * and `Padding 10`, which is corroboration, not the source.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBox.java:237-243
 */
export function activityBoxHeight(textHeight: number, sname: ActivitySName): number {
  return textHeight + 2 * activityPadding(sname);
}

// ---------------------------------------------------------------------------
// Ink
// ---------------------------------------------------------------------------

/**
 * `activityDiagram { circle { start, stop, end { LineColor #2;
 * BackgroundColor #2 } } }` — the terminal circles' stroke AND fill, the
 * same token for both.
 *
 * `#2` is upstream's one-digit hex shorthand, resolved through the ported
 * `HColorSet#parseSimpleColor` (`klimt/color/HColorSet.ts`, the 1/3/6/8
 * digit-length parser table) rather than written as a literal — D5, and
 * CLAUDE.md's "every constant carries its upstream `file:line`; never fit a
 * value to a golden".
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:379-380 */
export const CIRCLE_INK = resolveColorToSvgHex('#2');

/** `activityDiagram { activityBar { BackgroundColor #5 } }` — the fork/join
 * bar's fill. Same `#N` shorthand mechanism as {@link CIRCLE_INK}.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:387 */
export const ACTIVITY_BAR_FILL = resolveColorToSvgHex('#5');

// ---------------------------------------------------------------------------
// Swimlane title & border (T2, D4)
// ---------------------------------------------------------------------------

/**
 * The root-level `swimlane { LineColor black }` block — the divider stroke
 * `LaneDivider#drawU` resolves via `getStyle().value(PName.LineColor)
 * .asColor(...)`, the same signature {@link swimlaneLineThickness} reads
 * `getStyle().getStroke()` from.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:311
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/LaneDivider.java:94
 */
export const SWIMLANE_BORDER_COLOR = resolveColorToSvgHex('black');

/**
 * The ROOT `FontColor black` a swimlane title INHERITS: the `swimlane { }`
 * block (`:309-314`) declares BackGroundColor, LineColor, LineThickness and
 * FontSize but no FontColor of its own, so `Swimlanes#getTitle`'s
 * `getStyle().getFontConfiguration(...)` (`ftile/Swimlanes.java:287`)
 * resolves the ROOT block's value, not a swimlane-scoped one.
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:9
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:287
 */
export const SWIMLANE_TITLE_FONT_COLOR = resolveColorToSvgHex('black');

/**
 * A `Paint` value AS RESOLVED SVG HEX, or `undefined` when `paint` is a
 * `Gradient` (`paint.ts`) or unset. `ElementColors.border`/`.font` carry the
 * shared `Paint` type because the bucket is a general per-SName map; no
 * corpus fixture sets a gradient `LineColor`/`FontColor` on a swimlane
 * divider or title, so a Gradient here falls through to the next cascade
 * tier rather than the resolver throwing or drawing it.
 */
function resolveSolidBucketColor(paint: Paint | undefined): string | undefined {
  return typeof paint === 'string' ? resolveColorToSvgHex(paint) : undefined;
}

/**
 * The resolved lane-divider stroke colour: T1's `graph.activity
 * .swimlaneBorder` (`SwimlaneBorderColor` -> `PName.LineColor`, D4) → the
 * shared `swimlane` bucket's own `LineColor` override (a `<style> swimlane {
 * LineColor ... } }` block, `style-map-element.ts:163-164`) → the
 * `plantuml.skin:311` constant. Bucket access is DIRECT (`theme.colors
 * .elements`), not `resolveElementPaint`: that helper's own `border` role
 * falls back to `theme.colors.border` (the diagram-wide generic default),
 * which is not this cascade's third tier.
 */
export function swimlaneBorderColor(theme: Theme): string {
  const override = theme.colors.graph.activity?.swimlaneBorder;
  if (override !== undefined) return resolveColorToSvgHex(override);
  return resolveSolidBucketColor(theme.colors.elements?.['swimlane']?.border) ?? SWIMLANE_BORDER_COLOR;
}

/**
 * The resolved lane-title text colour: T1's `graph.activity
 * .swimlaneTitleFontColor` (`SwimlaneTitleFontColor` -> `PName.FontColor`,
 * D4) → the shared `swimlane` bucket's own `FontColor` override (a `<style>
 * swimlane { FontColor ... } }` block, `style-map-element.ts:165-166`) →
 * the inherited ROOT `FontColor` constant. Same direct-bucket-access
 * reasoning as {@link swimlaneBorderColor}: `resolveElementPaint`'s `font`
 * role falls back to `theme.colors.text`, not this cascade's third tier.
 */
export function swimlaneTitleFontColor(theme: Theme): string {
  const override = theme.colors.graph.activity?.swimlaneTitleFontColor;
  if (override !== undefined) return resolveColorToSvgHex(override);
  return resolveSolidBucketColor(theme.colors.elements?.['swimlane']?.font) ?? SWIMLANE_TITLE_FONT_COLOR;
}

/**
 * The resolved divider stroke width: T1's `graph.activity
 * .swimlaneBorderThickness` (`SwimlaneBorderThickness` -> `PName
 * .LineThickness`, D4) → {@link swimlaneLineThickness}'s own bucket/constant
 * cascade. DELEGATES rather than restating the bucket lookup or the 1.5
 * constant — `swimlaneLineThickness` already owns that value.
 */
export function swimlaneBorderThickness(theme: Theme): number {
  return theme.colors.graph.activity?.swimlaneBorderThickness ?? swimlaneLineThickness(theme);
}

/**
 * The resolved lane-title font size: T1's `graph.activity
 * .swimlaneTitleFontSize` (`SwimlaneTitleFontSize` -> `PName.FontSize`, D4)
 * → {@link swimlaneFontSize}'s own bucket/constant cascade. DELEGATES rather
 * than restating the bucket lookup or the 18 constant — `swimlaneFontSize`
 * already owns that value (D2's `getTitlesHeight` MEASURES the title text
 * this size produces; this resolver supplies the size, not the height).
 */
export function swimlaneTitleFontSize(theme: Theme): number {
  return theme.colors.graph.activity?.swimlaneTitleFontSize ?? swimlaneFontSize(theme);
}
