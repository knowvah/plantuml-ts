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
 * Always a string (never `undefined`): supplying the default is this
 * module's job, matching every other `activity*` resolver's contract.
 */
export function activityFontColor(theme: Theme, sname: ActivitySName): string {
  const bucket = resolveSolidBucketColor(theme.colors.elements?.[bucketKey(sname)]?.font);
  if (bucket !== undefined) return bucket;
  const rootOverride = theme.styleOverrides?.['root']?.['fontcolor'];
  if (rootOverride !== undefined) return resolveColorToSvgHex(rootOverride);
  return ACTIVITY_FONT_COLOR;
}

// ---------------------------------------------------------------------------
// Horizontal alignment (D2)
// ---------------------------------------------------------------------------

/**
 * The resolved horizontal alignment for activity box text: the bucket's
 * own alignment, else the parsed `skinparam defaultTextAlignment`, else
 * the root `HorizontalAlignment left` (`plantuml.skin:12`).
 *
 * `FtileBox`'s own field is `style.getHorizontalAlignment()`
 * (`FtileBox.java:86` declares the field, `:89` sets
 * `skinParam.getDefaultTextAlignment(horizontalAlignment)` for the creole
 * sheet) -- a per-element `Style` value cascading over the diagram's
 * `defaultTextAlignment` skinparam, itself falling back to the root
 * `HorizontalAlignment left` when neither is set.
 *
 * FILED, not implemented, because neither upstream tier exists in this
 * port today (verified this session, `src/core` is outside this task's
 * write-set):
 *   - the bucket tier: `ElementColors` (`theme-graph-colors.ts:21-171`)
 *     carries `background`, `border`, `font`, `fontSize`,
 *     `stereotypeFontSize`, `headerBackground`/`headerFont`/
 *     `headerFontSize`, `shadowing`, `lineThickness`, `minimumWidth` and
 *     `roundCorner` -- no alignment role. Add
 *     `ElementColors.horizontalAlignment?: 'left' | 'center' | 'right'`
 *     and its `<style>`/`skinparam` parse in `style-map-element.ts` when a
 *     fixture needs it.
 *   - the `skinparam defaultTextAlignment` tier: `rg -n -i
 *     'defaulttextalignment|horizontalalignment' src/core/` this session
 *     hits only the builtin skin TEXT of `skins-builtin-rose-2.ts` -- never
 *     a parser that reads it into `Theme`/`ThemeOverride`. Add the field
 *     and its parse to `theme.ts` when a fixture needs it.
 *
 * So today this resolver has exactly one reachable tier -- the root
 * `'left'` -- and always returns it. `theme` is still accepted: it is the
 * locked interface contract this task's spec fixes (`plans
 * /activity-min-box-width/batch-1/T1-resolvers.md`), and it is what either
 * filed tier will read once it lands, without changing the signature T2,
 * T4 and T5 depend on.
 */
export function activityHorizontalAlignment(_theme: Theme): 'left' | 'center' | 'right' {
  return 'left';
}
