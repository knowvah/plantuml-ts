/**
 * D3/T11 (cdd3, Q-5): the arrow-label and cardinality font cascades -- split
 * out of `style-cascade-class.ts` (500-line cap), mirrors `style-cascade-
 * visibility-icon.ts`'s own split-for-size precedent (same import shape:
 * `cascadeHex`/`cascadeFontColorHex`/`GraphCascadeOverride` back from the
 * parent module, safe because neither is referenced at the other's
 * module-init time -- only inside a function body called later). A pure
 * move for `computeCardinalityFontOverride`/`cascadeArrowFontColor`/
 * `computeArrowFontOverride`; `cardinalityFontStyle` (T11) is new.
 */
import type { StyleMap } from './skinparam.js';
import { resolveStyleCascade } from './style-map-element.js';
import { cascadeHex, cascadeFontColorHex } from './style-cascade-class.js';
import { ARROW_SNAMES, CARDINALITY_SNAMES } from './style-cascade-class-snames.js';

/** SI26 D4/D5: `arrow { FontColor }` / `arrow { cardinality { FontColor } }`
 *  (`GraphvizImageBuilder.java:234-241`; skinparam twin `FromSkinparamToStyle
 *  .java:149,424-429`), merged last-declared-wins by `StyleStorage
 *  #computeMergedStyle` (`style/StyleStorage.java:102-116`) = `resolveStyle
 *  Cascade`'s source-order walk, no specificity. With `backgroundHex` (the
 *  canvas the label paints on) `#?light:dark` resolves via {@link
 *  cascadeFontColorHex}; without one, plain {@link cascadeHex}. */
function cascadeArrowFontColor(
  styleMap: StyleMap,
  snames: readonly string[],
  stereotypeTags: readonly string[],
  backgroundHex: string | undefined,
): string | undefined {
  return backgroundHex === undefined
    ? cascadeHex(styleMap, snames, 'fontcolor', stereotypeTags)
    : cascadeFontColorHex(styleMap, snames, backgroundHex, stereotypeTags);
}

/**
 * D3: resolve the `{root,element,classDiagram,arrow,cardinality}` font
 * override (T1, edge-label-box-backlog) from a diagram's own `<style>`
 * StyleMap -- `GraphvizImageBuilder.java:235-241` resolves this SEPARATELY
 * from `labelFont` and passes both into `SvekEdge`'s constructor as
 * `cardinalityFont`. Returns only the properties a matching selector
 * actually declares (`resolveStyleCascade` -> `undefined` otherwise), so a
 * StyleMap that never touches `arrow`/`arrow.cardinality` contributes
 * nothing and the caller keeps the Theme's own default
 * (`defaultTheme.cardinalityFontSize` = 13, `plantuml.skin:307`).
 * SI26 D5: `cardinalityFontColor` -- absent means "inherit the arrow
 * label colour" (`arrow-label-font.ts#resolveCardinalityFontColor`).
 * T11 (cdd3, Q-5): `cardinalityFontStyle` -- the SAME `fontstyle` cascade
 * `computeArrowFontOverride` already threads for the plain `arrow` selector
 * below, added here because `{root,element,classDiagram,arrow,cardinality}`
 * had no FontStyle field at all (`style-cascade-class.ts:210-226`,
 * `theme.ts:26-29` before this task) -- rides UNPARSED, the ONE reader is
 * `arrow-label-font.ts#resolveCardinalityFont` (mirrors `arrowFontStyle`'s
 * own `arrow-label-font.ts#arrowFontFace` contract). jar-verified
 * `camuna-58-veca254`/`nafiki-56-jixu680`: `arrow { cardinality { FontStyle
 * italic } }` draws every cardinality `<text>` `font-style="italic"`.
 */
export function computeCardinalityFontOverride(
  styleMap: StyleMap,
  stereotypeTags: readonly string[] = [],
  backgroundHex?: string,
): {
  cardinalityFontSize?: number;
  cardinalityFontFamily?: string;
  cardinalityFontStyle?: string;
  cardinalityFontColor?: string;
} {
  const override: {
    cardinalityFontSize?: number;
    cardinalityFontFamily?: string;
    cardinalityFontStyle?: string;
    cardinalityFontColor?: string;
  } = {};
  const sizeRaw = resolveStyleCascade(styleMap, CARDINALITY_SNAMES, 'fontsize', stereotypeTags);
  if (sizeRaw !== undefined) {
    const n = Number(sizeRaw);
    if (Number.isFinite(n) && n > 0) override.cardinalityFontSize = n;
  }
  const familyRaw = resolveStyleCascade(styleMap, CARDINALITY_SNAMES, 'fontname', stereotypeTags);
  if (familyRaw !== undefined) override.cardinalityFontFamily = familyRaw;
  const styleRaw = resolveStyleCascade(styleMap, CARDINALITY_SNAMES, 'fontstyle', stereotypeTags);
  if (styleRaw !== undefined) override.cardinalityFontStyle = styleRaw;
  const color = cascadeArrowFontColor(styleMap, CARDINALITY_SNAMES, stereotypeTags, backgroundHex);
  if (color !== undefined) override.cardinalityFontColor = color;
  return override;
}

/** D3: arrow `labelFont` (`GraphvizImageBuilder.java:234-235`); `fontstyle` rides UNPARSED -- `arrow-label-font.ts` is the ONE reader (`klimt/font/FontStyle.java`). SI26: `arrowFontColor` via {@link cascadeArrowFontColor}. */
export function computeArrowFontOverride(
  styleMap: StyleMap,
  stereotypeTags: readonly string[] = [],
  backgroundHex?: string,
): { arrowFontSize?: number; arrowFontFamily?: string; arrowFontStyle?: string; arrowFontColor?: string } {
  const size = Number(resolveStyleCascade(styleMap, ARROW_SNAMES, 'fontsize', stereotypeTags));
  const family = resolveStyleCascade(styleMap, ARROW_SNAMES, 'fontname', stereotypeTags);
  const style = resolveStyleCascade(styleMap, ARROW_SNAMES, 'fontstyle', stereotypeTags);
  const color = cascadeArrowFontColor(styleMap, ARROW_SNAMES, stereotypeTags, backgroundHex);
  return {
    ...(Number.isFinite(size) && size > 0 ? { arrowFontSize: size } : {}),
    ...(family !== undefined ? { arrowFontFamily: family } : {}),
    ...(style !== undefined ? { arrowFontStyle: style } : {}),
    ...(color !== undefined ? { arrowFontColor: color } : {}),
  };
}
