/**
 * D3: the arrow-label font resolver -- `GraphvizImageBuilder.java:234-235`
 * (`getDefaultStyleDefinitionArrow(stereotype).getMergedStyle(...)
 * .getFontConfiguration(...)`), upstream's `labelFont` argument to
 * `SvekEdge`'s constructor. This is the ONE reader of
 * `theme.colors.graph.arrowFontFamily`/`arrowFontSize`/`arrowFontStyle`/
 * `arrowFontColor` (`style-cascade-class.ts#computeArrowFontOverride`, and
 * `skinparam-key-handlers.ts`'s `arrowfont*` handlers) and, through
 * {@link resolveCardinalityFontColor}, of `theme.cardinalityFontColor`.
 *
 * SI26 D2: upstream's `labelFont`/`cardinalityFont` are each ONE
 * `FontConfiguration` carrying font AND colour (`GraphvizImageBuilder
 * .java:234-241`; `klimt/shape/TextBlockArrow2.java:57-58` reads
 * `getColor()` off the same object), so the colour rides the same resolver
 * here rather than a second reader. `FontSpec` itself is untouched --
 * measurers never see colour.
 */
import { ARROW_LABEL_FONT_SIZE } from './klimt/font/FontParam.js';
import type { Theme } from './theme.js';
import type { FontSpec } from './measurer.js';

/**
 * Jar's arrow-label FontColor default: root `FontColor black`
 * (`skin/plantuml.skin:9`; the `arrow` block at `:306-310` sets no
 * FontColor). NEVER `theme.colors.text` (`#181818`, canvas text) -- D3.
 */
export const ARROW_LABEL_DEFAULT_COLOR = '#000000';

/** `FontSpec` plus the label colour -- see the module doc comment (D2). */
export type ArrowLabelFont = FontSpec & { readonly color: string };

/**
 * `klimt/font/FontStyle.java`'s independent BOLD/ITALIC axes
 * (`FontStyle.mutateFont`: BOLD sets font-weight 700, ITALIC sets the
 * font-style axis -- a value may combine both, e.g. "bold italic") --
 * the SAME substring-match convention `skinparam-key-handlers.ts
 * #parseFontStyleFlags` already uses for `classFontStyle`/
 * `classAttributeFontStyle`, applied here to the raw `arrowFontStyle`
 * cascade value (`style-cascade-class.ts#computeArrowFontOverride` and the
 * `arrowfontstyle` skinparam handler both thread it through UNPARSED for
 * exactly this one caller).
 */
function arrowFontFace(raw: string | undefined): Pick<FontSpec, 'weight' | 'style'> {
  if (raw === undefined) return {};
  const lower = raw.toLowerCase();
  const face: Pick<FontSpec, 'weight' | 'style'> = {};
  if (lower.includes('bold')) face.weight = 'bold';
  if (lower.includes('italic')) face.style = 'italic';
  return face;
}

/**
 * Resolve the arrow-label font from a Theme. `family` falls through
 * `arrowFontFamily` (`<style> arrow { FontName }` / `skinparam
 * arrowFontName`) to `theme.fontFamily` (`plantuml.skin:6`'s root
 * SansSerif -- the `arrow` block sets no FontName of its own upstream);
 * `size` falls through `arrowFontSize` (`klimt/font/FontParam.java:54`,
 * default 13) to {@link ARROW_LABEL_FONT_SIZE}. With no override this
 * resolves to EXACTLY `{ family: theme.fontFamily, size: 13, color:
 * '#000000' }`. `color` falls through `arrowFontColor` (`<style> arrow
 * { FontColor }` / `skinparam arrowFontColor` / `skinparam
 * defaultFontColor`, last-declared-wins per `StyleStorage
 * #computeMergedStyle`, `style/StyleStorage.java:102-116`) to
 * {@link ARROW_LABEL_DEFAULT_COLOR}.
 */
export function resolveArrowLabelFont(theme: Theme): ArrowLabelFont {
  const graph = theme.colors.graph;
  return {
    family: graph.arrowFontFamily ?? theme.fontFamily,
    size: graph.arrowFontSize ?? ARROW_LABEL_FONT_SIZE,
    ...arrowFontFace(graph.arrowFontStyle),
    color: graph.arrowFontColor ?? ARROW_LABEL_DEFAULT_COLOR,
  };
}

/**
 * The cardinality (`"1"`, `"*"`, role) label colour -- upstream's
 * `cardinalityFont` (`GraphvizImageBuilder.java:236-237`) resolved through
 * `getStyleArrowCardinality` = `{root,element,<diagram>,arrow,cardinality}`
 * (`:124-126`). `plantuml.skin` has no `cardinality` block, so it inherits
 * `arrow`'s FontColor until `arrow { cardinality { FontColor } }` overrides
 * (D5; oracle experiments a/g/h in
 * `plans/arrow-label-font-colour/decisions.md`).
 */
export function resolveCardinalityFontColor(theme: Theme): string {
  return theme.cardinalityFontColor ?? resolveArrowLabelFont(theme).color;
}
