/**
 * The unconsumed activity box-width, font-colour and horizontal-alignment
 * resolvers (mission `activity-min-box-width`, T1, D1/D2/D3).
 *
 * Split out of `activity-style-defaults.ts` rather than added there: that
 * module was 456 lines before this task and the project's complexity hook
 * blocks any write past 500 -- see `.agent-notes/amb-T0.md` and this
 * mission's `plans/activity-min-box-width/batch-1/T1-resolvers.md`. It is
 * still THE SAME cascade contract: every constant carries its own
 * `plantuml.skin`/Java citation, and `bucketKey`/`resolveSolidBucketColor`
 * are imported rather than re-declared, so there remains exactly one
 * folding rule and one `Paint`-to-hex rule for activity.
 *
 * Nothing in this repository calls these three functions yet -- T2
 * (delete `ACTION_MIN_WIDTH`), T4 (text colour) and T5 (text position)
 * are each a separate task in this mission that wires one of them in.
 */
import type { Theme } from '../../core/theme.js';
import { resolveElementMinimumWidth } from '../../core/theme-element-resolve.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { ActivitySName } from './activity-style-defaults.js';
import { bucketKey, resolveSolidBucketColor } from './activity-style-defaults.js';

// ---------------------------------------------------------------------------
// Minimum width (D1)
// ---------------------------------------------------------------------------

/**
 * The action box's content-width floor, resolved through the SHARED
 * `<style>`/`skinparam` cascade rather than the port's own unsourced
 * `ACTION_MIN_WIDTH = 120` (deleted by T2, not lowered).
 *
 * `FtileBox` declares `private double minimumWidth = 0;`
 * (`FtileBox.java:87`) and applies it as the WIDTH-only floor of
 * `calculateDimensionFtile`'s `dimRaw.atLeast(minimumWidth, 0)`
 * (`:237-243` -- the second argument, the height floor, is a literal `0`,
 * so upstream imposes no minimum height here at all). The field is set
 * from `style.value(PName.MinimumWidth).asDouble()`; an unset `PName`
 * resolves to a `ValueNull`, whose `asDouble()` returns `0`
 * (`style/ValueNull.java:61-63`) -- the same 0 the field already
 * initialises to.
 *
 * The bare `skinparam minClassWidth` reaches the action box too:
 * `addConvert("MinClassWidth", PName.MinimumWidth)`
 * (`style/FromSkinparamToStyle.java:241`) registers with NO `SName`
 * arguments, so the resulting style rule's signature is empty and an empty
 * signature matches every element (`style/StyleStorage.java:102-116`,
 * `OVERWRITE_EXISTING_VALUE` merge order) -- including `activity`. This is
 * exactly the two-tier shape `resolveElementMinimumWidth` already
 * implements for class/description/object (`theme-element-resolve.ts
 * :139-141`): the `activity` bucket's own `MinimumWidth` first, then the
 * bare `theme.minimumWidth`, and this resolver adds only the SName and the
 * `?? 0` upstream's own default supplies.
 *
 * The SName is fixed to `'activity'`: `FtileBox` is the action-box shape
 * alone, so unlike `activityFontColor` this resolver takes no `sname`
 * parameter.
 */
export function activityMinimumWidth(theme: Theme): number {
  return resolveElementMinimumWidth(theme, 'activity') ?? 0;
}

// ---------------------------------------------------------------------------
// Font colour (D3)
// ---------------------------------------------------------------------------

/** `root { FontColor black }` (`plantuml.skin:9`) -- what every activity
 * text kind inherits, since no activity block (`activity`, `diamond`,
 * `note`, `arrow`, ...) declares its own `FontColor` anywhere in
 * `activityDiagram { }` (D3; 1869 of the jar's 1915 activity texts are
 * `#000`, `.agent-notes/amb-T0.md`).
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:9 */
export const ACTIVITY_FONT_COLOR = resolveColorToSvgHex('black');

/**
 * The resolved text colour for one activity element kind: the user's
 * bucket override (`<style> activityDiagram { <sname> { FontColor ... } }`
 * or `skinparam <sname>FontColor`, T1 of the previous mission) if a SOLID
 * colour, else a theme's or diagram `<style>`'s own `root { FontColor ... }`
 * (converted through {@link resolveColorToSvgHex}, unshortened -- the SVG
 * emission layer's `resolvePaint`/`shortenColor` collapses `#RRGGBB` to
 * `#RGB` at write time, matching every other constant in this cascade),
 * else {@link ACTIVITY_FONT_COLOR}.
 *
 * The root tier exists because `plantuml.skin`'s own `root { FontColor
 * black }` (`:9`) is merged FIRST and a theme's or `<style>`'s `root { }`
 * block is merged AFTER it in file order with `OVERWRITE_EXISTING_VALUE`
 * (`style/StyleStorage.java:102-116`) -- so it beats the skin's black for
 * every activity signature, exactly as `puml-theme-amiga.puml:35`'s `root
 * { FontColor #FFFFFF }` beats it for `!theme amiga` (D3, amended). The
 * port already carries that block as `theme.styleOverrides.root.fontcolor`
 * (`Theme.styleOverrides`, `theme.ts:55`); this resolver is the first
 * activity reader of it.
 *
 * Shaped exactly like `swimlaneTitleFontColor`
 * (`activity-style-defaults.ts:411`) for the bucket tier: direct bucket
 * access via `theme.colors.elements`, not `resolveElementPaint` (whose
 * `font` role falls back to `theme.colors.text`, the diagram-wide generic
 * default, not this cascade's constant), and the same
 * `resolveSolidBucketColor` Paint-string-only handling -- a Gradient
 * `FontColor` falls through past the bucket rather than crashing.
 *
 * `sname === 'arrow'` carries one more tier, between the bucket and the
 * root override: `theme.colors.graph.arrowFontColor`. `skinparam
 * arrowFontColor` / `skinparam activityArrowFontColor` (the latter folds
 * to the former -- `skinparam-key-normalize.ts#normaliseKey` step 3,
 * `SkinParam.java:cleanForKeySlow`) both register `PName.FontColor` on
 * `SName.arrow` (`FromSkinparamToStyle.java:149`, `addConFont("arrow",
 * SName.arrow)`), the signature `arrow-label-font.ts#resolveArrowLabelFont`
 * already reads for class/sequence/usecase/state/component/object edges --
 * this is activity's own reader of the SAME field, not a second cascade.
 * `activity{arrow{FontColor}}`'s own bucket (checked first, above) is a
 * MORE specific signature and so still wins when both are set.
 *
 * Always a string (never `undefined`): supplying the default is this
 * module's job, matching every other `activity*` resolver's contract.
 */
export function activityFontColor(theme: Theme, sname: ActivitySName): string {
  const bucket = resolveSolidBucketColor(theme.colors.elements?.[bucketKey(sname)]?.font);
  if (bucket !== undefined) return bucket;
  if (sname === 'arrow' && theme.colors.graph.arrowFontColor !== undefined) {
    return theme.colors.graph.arrowFontColor;
  }
  const rootOverride = theme.styleOverrides?.['root']?.['fontcolor'];
  if (rootOverride !== undefined) return resolveColorToSvgHex(rootOverride);
  return ACTIVITY_FONT_COLOR;
}

// ---------------------------------------------------------------------------
// Horizontal alignment (D2)
// ---------------------------------------------------------------------------

/**
 * The resolved horizontal alignment for activity box text: the `root`
 * bucket's own alignment, else `'left'` (`plantuml.skin:12`'s
 * `HorizontalAlignment left`).
 *
 * `FtileBox`'s own field is `style.getHorizontalAlignment()`
 * (`FtileBox.java:86` declares the field, `:89` passes it as the fallback
 * to `skinParam.getDefaultTextAlignment(horizontalAlignment)` for the
 * creole sheet) -- a per-element `Style` value whose `PName
 * .HorizontalAlignment` is set, for the WHOLE diagram, by `skinparam
 * defaultTextAlignment` (`FromSkinparamToStyle.java:155`: `addConvert
 * ("defaulttextalignment", PName.HorizontalAlignment, SName.root)`).
 * `FtileBox`'s style signature (`{root, element, activityDiagram,
 * activity}`) inherits the `root`-tier value, so one skinparam line sets
 * BOTH the per-line creole alignment (`SheetBlock1`'s stripe-coef split,
 * see this module's own doc comment) and the outer block-level translate
 * -- confirmed by `activity-text-placement.ts#boxLineX`'s algebra, which
 * already collapses the two into one closed form per alignment.
 *
 * UNLIKE T1's own era (this resolver's prior doc comment, now stale): both
 * tiers landed since -- `ElementColors.horizontalAlignment`
 * (`theme-graph-colors.ts:284`) and the `defaulttextalignment` ->
 * `acc.elements['root'].horizontalAlignment` parse (`skinparam-key-
 * handlers-table-b.ts#setAlignment`, cdd7 T2b) -- for a DIFFERENT
 * consumer (`renderer-usymbol-entity-style.ts#rootHorizontalAlignment`,
 * class). This resolver only had to start reading the same bucket.
 */
export function activityHorizontalAlignment(theme: Theme): 'left' | 'center' | 'right' {
  const alignment = theme.colors.elements?.['root']?.horizontalAlignment;
  if (alignment === HorizontalAlignment.CENTER) return 'center';
  if (alignment === HorizontalAlignment.RIGHT) return 'right';
  return 'left';
}

// ---------------------------------------------------------------------------
// Font family (add2 T3e, family K)
// ---------------------------------------------------------------------------

/**
 * The resolved font family for one activity element kind: the user's
 * bucket override (`<style> activityDiagram { <sname> { FontName ... } }`
 * or the flat `skinparam activityFontName`/`skinparam activityDiamond
 * FontName` form, `skinparam-key-handlers-table-{a,c}.ts`) if set, else
 * `theme.fontFamily` -- the diagram-wide default every caller reads
 * UNCONDITIONALLY today.
 *
 * `FromSkinparamToStyle.java:144` (`addConFont("activity", SName.activity)`
 * registers `activityFontName` -> `PName.FontName` on `SName.activity`);
 * diamond inherits the SAME bucket via its own style signature nesting
 * `SName.activity` (`StyleSignatureBasic.java:271-273`, `kafevi-44-
 * tesu096`'s own precedent for a different property). Shaped exactly like
 * {@link activityFontColor}'s bucket tier.
 *
 * NOT YET CONSUMED, re-slotted (dozaxu-98-xetu961, family K): the two call
 * sites that would read this instead of `theme.fontFamily` directly
 * (`activity-renderer-shapes.ts:135,155`, `activity-renderer-if-shapes.ts
 * :128,142,144`) are outside this task's write-set.
 */
export function activityFontFamily(theme: Theme, sname: ActivitySName): string {
  const own = theme.colors.elements?.[bucketKey(sname)]?.fontFamily;
  if (own !== undefined) return own;
  // add2 T3h: diamond's signature NESTS `SName.activity` (cited above), so
  // an `activity{FontName}` rule legitimately matches it too, absent a
  // diamond-specific override (just checked) -- jar-verified dozaxu-98-
  // xetu961 (`skinparam activity{FontName Verdana}`, no DiamondFontName).
  if (sname === 'diamond') {
    const activityTier = theme.colors.elements?.[bucketKey('activity')]?.fontFamily;
    if (activityTier !== undefined) return activityTier;
  }
  return theme.fontFamily;
}

/**
 * add2 T3h (family F): `theme.hyperlinkUnderline`/`theme.svgLinkTarget` as
 * an `ActivityTextStyle`-shaped spread fragment -- `exactOptionalPropertyTypes`
 * forbids assigning an explicit `undefined` to an optional property, so a
 * caller building a style literal must OMIT the key rather than set it to
 * `undefined` (conditional spread, not a ternary-per-field).
 */
export function linkStyleFields(theme: Theme): { hyperlinkUnderline?: boolean; svgLinkTarget?: string } {
  return {
    ...(theme.hyperlinkUnderline !== undefined ? { hyperlinkUnderline: theme.hyperlinkUnderline } : {}),
    ...(theme.svgLinkTarget !== undefined ? { svgLinkTarget: theme.svgLinkTarget } : {}),
  };
}
