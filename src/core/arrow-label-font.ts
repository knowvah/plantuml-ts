/**
 * D3: the arrow-label font resolver -- `GraphvizImageBuilder.java:234-235`
 * (`getDefaultStyleDefinitionArrow(stereotype).getMergedStyle(...)
 * .getFontConfiguration(...)`), upstream's `labelFont` argument to
 * `SvekEdge`'s constructor. This is the ONE reader of
 * `theme.colors.graph.arrowFontFamily`/`arrowFontSize`/`arrowFontStyle`
 * (`style-cascade-class.ts#computeArrowFontOverride`, and
 * `skinparam-key-handlers.ts`'s `arrowfontname`/`arrowfontstyle` handlers).
 *
 * Building block only -- no production caller yet. D4 (Batch 3, per engine)
 * wires this into both the DOT-measurement site and the SVG renderer site
 * for each engine so layout and ink never disagree; T7 (state)'s bar is
 * zero fixture movement with no override.
 */
import { ARROW_LABEL_FONT_SIZE } from './klimt/font/FontParam.js';
import type { Theme } from './theme.js';
import type { FontSpec } from './measurer.js';

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
 * resolves to EXACTLY `{ family: theme.fontFamily, size: 13 }` --
 * byte-identical to every hardcoded `ARROW_LABEL_FONT_SIZE` call site this
 * does NOT yet replace.
 */
export function resolveArrowLabelFont(theme: Theme): FontSpec {
  const graph = theme.colors.graph;
  return {
    family: graph.arrowFontFamily ?? theme.fontFamily,
    size: graph.arrowFontSize ?? ARROW_LABEL_FONT_SIZE,
    ...arrowFontFace(graph.arrowFontStyle),
  };
}
