/**
 * gtc T2b: the description diagram's `<style>` cascades -- the description twin of `style-cascade-class.ts`, over the
 * description diagram's OWN style name (`componentDiagram`, `DiagramType.java:250-251`) instead of `classDiagram`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:816-821,874-876
 */
import type { StyleMap } from './skinparam.js';
import type { Theme } from './theme.js';
import { arrowTagCascadeEntry, cascadeHex } from './style-cascade-class.js';
import { cleanStereotypeToken, collectStyleTagNames } from './style-map-element.js';
import { DESCRIPTION_ARROW_SNAMES } from './style-cascade-class-snames.js';

export type DescriptionCascadeOverride = Pick<
  Theme['colors']['graph'],
  'descriptionCascadeArrowColor' | 'descriptionArrowTagCascade'
>;

/**
 * `SvekEdge#drawU` merges `{root, element, componentDiagram, arrow}` (`SvekEdge.java:816-821`) and builds the line
 * colour with `Rainbow.build(styleLine, ...)` (`:874-876`): `arrow { LineColor }`, `componentDiagram { arrow {
 * LineColor } }` and a bare `root`/`element` LineColor all reach a description link. Empty when none matches.
 */
export function computeDescriptionStyleCascadeOverrides(styleMap: StyleMap): Partial<DescriptionCascadeOverride> {
  const override: Partial<DescriptionCascadeOverride> = {};
  const arrowColor = cascadeHex(styleMap, DESCRIPTION_ARROW_SNAMES, 'linecolor');
  if (arrowColor !== undefined) override.descriptionCascadeArrowColor = arrowColor;
  // gtc T3: the stereotype-signed tier (`withTOBECHANGED(stereotype)`, `SvekEdge.java:819-821`).
  const tags: Record<string, NonNullable<DescriptionCascadeOverride['descriptionArrowTagCascade']>[string]> = {};
  for (const tag of collectStyleTagNames(styleMap)) {
    const fontColor = cascadeHex(styleMap, DESCRIPTION_ARROW_SNAMES, 'fontcolor', [tag]);
    const entry = {
      ...arrowTagCascadeEntry(styleMap, tag, DESCRIPTION_ARROW_SNAMES),
      ...(fontColor === undefined ? {} : { fontColor }),
    };
    if (Object.keys(entry).length > 0) tags[cleanStereotypeToken(tag)] = entry;
  }
  if (Object.keys(tags).length > 0) override.descriptionArrowTagCascade = tags;
  return override;
}
