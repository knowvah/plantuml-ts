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

const FONT_SIZE_DEFAULTS: Readonly<Record<ActivitySName, number>> = {
  activity: ACTIVITY_FONT_SIZE,
  // `activityBar` (the fork/join bar) and `composite` declare no FontSize
  // upstream; neither draws text of its own. They resolve the action box's
  // size so a caller that asks is never handed a fabricated number.
  activityBar: ACTIVITY_FONT_SIZE,
  arrow: ARROW_FONT_SIZE,
  // `circle` (start/stop/end terminals) declares no FontSize and draws no
  // text; same reasoning as `activityBar`.
  circle: ACTIVITY_FONT_SIZE,
  composite: ACTIVITY_FONT_SIZE,
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
 * override if any, else this module's `plantuml.skin` default (D2). */
export function activityFontSize(theme: Theme, sname: ActivitySName): number {
  return resolveElementFontSize(theme, bucketKey(sname), 'title') ?? FONT_SIZE_DEFAULTS[sname];
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
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:360 */
export const ACTIVITY_PADDING = 10;

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
