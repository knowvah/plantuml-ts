/**
 * The swimlane title/border style resolvers, split out of
 * `activity-style-defaults.ts` (mission `activity-divergence-drive`, T2c) --
 * that module was 486 lines before the `fonebe-54-save009` arrow-thickness
 * fix pushed it to 510, over this project's 500-line cap (D9: "Helper
 * splits forced by the 500-line hook are push-forwards, journaled with the
 * new file name"). A pure move, not a rewrite: every function below is
 * unchanged from its pre-split body, still THE ONE PLACE these
 * `plantuml.skin` swimlane numbers are written, and `activity-style-
 * defaults.ts` re-exports all seven names so no import elsewhere in the
 * tree (`activity-renderer-swimlanes.ts`, test files) needed to change.
 *
 * @see ./activity-style-defaults.ts for the module's own cascade contract
 *      (D2's two-tier "user override, else this module's constant").
 */
import type { Theme } from '../../core/theme.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { resolveSolidBucketColor, swimlaneFontSize, swimlaneLineThickness } from './activity-style-defaults.js';

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

/**
 * The resolved title-band fill (T6, D3). T1's `graph.activity
 * .swimlaneHeaderBackground` (`SwimlaneTitleBackgroundColor` -> `PName
 * .BackGroundColor`, D4's "Amended at execution" note) → the shared
 * `swimlane` bucket's own `BackGroundColor` override → the ROOT
 * `plantuml.skin:310` default (`BackGroundColor transparent`). That
 * default is a non-null `HColor`, so `Swimlanes#drawTitlesBackground`
 * (`:358-367`) still draws the rect and paints nothing -- `'none'`, not a
 * resolved hex, mirroring `renderEdgeLabel`'s own `stroke: 'none'` "paint
 * nothing" convention rather than resolving `resolveColorToSvgHex
 * ('transparent')`'s `#00000000`, which the jar never emits for this rect.
 */
export function swimlaneHeaderBackground(theme: Theme): string {
  const override = theme.colors.graph.activity?.swimlaneHeaderBackground;
  if (override !== undefined) return resolveColorToSvgHex(override);
  return resolveSolidBucketColor(theme.colors.elements?.['swimlane']?.background) ?? 'none';
}
