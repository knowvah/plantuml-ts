/**
 * gtc T2b: the description diagram's `<style>` cascades -- the description twin of `style-cascade-class.ts`, over the
 * description diagram's OWN style name (`componentDiagram`, `DiagramType.java:250-251`) instead of `classDiagram`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:816-821,874-876
 */
import type { StyleMap } from './skinparam.js';
import type { Theme } from './theme.js';
import { cascadeHex } from './style-cascade-class.js';
import { DESCRIPTION_ARROW_SNAMES } from './style-cascade-class-snames.js';

export type DescriptionCascadeOverride = Pick<Theme['colors']['graph'], 'descriptionCascadeArrowColor'>;

/**
 * `SvekEdge#drawU` merges `{root, element, componentDiagram, arrow}` (`SvekEdge.java:816-821`) and builds the line
 * colour with `Rainbow.build(styleLine, ...)` (`:874-876`): `arrow { LineColor }`, `componentDiagram { arrow {
 * LineColor } }` and a bare `root`/`element` LineColor all reach a description link. Empty when none matches.
 */
export function computeDescriptionStyleCascadeOverrides(styleMap: StyleMap): Partial<DescriptionCascadeOverride> {
  const arrowColor = cascadeHex(styleMap, DESCRIPTION_ARROW_SNAMES, 'linecolor');
  return arrowColor === undefined ? {} : { descriptionCascadeArrowColor: arrowColor };
}
