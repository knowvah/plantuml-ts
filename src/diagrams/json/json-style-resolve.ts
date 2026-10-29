/**
 * resolveJsonStyles — the json family's styles at the jar's six signatures.
 *
 * Every `Style` is `StyleSignatureBasic.of(root, element, <T>, …)
 * .getMergedStyle(styleBuilder)` with `<T>` the diagram's own `SName`
 * (`jsonDiagram` or `yamlDiagram`, `TextBlockJson.java:114`,
 * `SmetanaForJson.java:112-116`):
 * - node: `root,element,<T>,node` (`TextBlockJson.java:151`, `:269-270`,
 *   `SmetanaForJson.java:124-126`);
 * - nodeHeader: `root,element,<T>,header,node` (`TextBlockJson.java:149`);
 * - highlight(class, header): `…,node,highlight` / `…,header,node,highlight`
 *   `.withTOBECHANGED(highlighted.getStereotype())` (`TextBlockJson.java:138-146`,
 *   row fill `:296-299`);
 * - separator: the node style's signature `+ separator`
 *   (`TextBlockJson.java:286-288`);
 * - arrow: `root,element,<T>,arrow` (`SmetanaForJson.java:119-122`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java:138-152
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/SmetanaForJson.java:119-126
 */
import { Stereotype } from '../../core/stereo/Stereotype.js';
import type { SName } from '../../core/style/SName.js';
import type { Style } from '../../core/style/Style.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { StyleSignature } from '../../core/style/StyleSignature.js';

/**
 * The part of the family SkinParam the resolver reads: `Pick<JsonSkinParam,
 * 'getCurrentStyleBuilder' | 'styleName'>` (`json-skin-param.ts`, T1a).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java:113-114
 */
export interface JsonStyleInput {
  getCurrentStyleBuilder(): StyleBuilder;
  readonly styleName: 'jsonDiagram' | 'yamlDiagram';
}

/** The resolved styles. `highlight('', …)` is a highlight with no stereotype. */
export interface JsonStyleSet {
  readonly node: Style;
  readonly nodeHeader: Style;
  highlight(styleClass: string, header: boolean): Style;
  readonly separator: Style;
  readonly arrow: Style;
}

/** A merged style; a builder always matches `root`, so `undefined` is a broken invariant. */
function merged(signature: StyleSignature, builder: StyleBuilder): Style {
  const style = signature.getMergedStyle(builder);
  if (style === undefined) throw new Error(`json style: no declaration matches ${signature.toString()}`);
  return style;
}

/**
 * The stereotype a `#highlight … <<class>>` carries (`Highlighted.java:73`,
 * `Stereotype.build(matcher.group(2))`); `undefined` for no class (`:73`
 * `null`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/yaml/Highlighted.java:73
 */
function highlightStereotype(styleClass: string): Stereotype | undefined {
  return styleClass === '' ? undefined : Stereotype.build(`<<${styleClass}>>`);
}

/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java:138-152
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/SmetanaForJson.java:119-126
 */
export function resolveJsonStyles(skin: JsonStyleInput): JsonStyleSet {
  const builder = skin.getCurrentStyleBuilder();
  const type: SName = skin.styleName;
  const of = (...names: SName[]): StyleSignatureBasic => StyleSignatureBasic.of('root', 'element', type, ...names);

  // TextBlockJson.java:151 / :269-270 / SmetanaForJson.java:124-126
  const node = merged(of('node'), builder);
  // TextBlockJson.java:149
  const nodeHeader = merged(of('header', 'node'), builder);
  // TextBlockJson.java:286-288
  const separator = merged(node.getSignature().addSName('separator'), builder);
  // SmetanaForJson.java:119-122
  const arrow = merged(of('arrow'), builder);

  return {
    node,
    nodeHeader,
    separator,
    arrow,
    highlight(styleClass: string, header: boolean): Style {
      const stereotype = highlightStereotype(styleClass);
      // TextBlockJson.java:141-146; row fill :296-299 is the non-header one
      const signature = header ? of('header', 'node', 'highlight') : of('node', 'highlight');
      return merged(signature.withTOBECHANGED(stereotype), builder);
    },
  };
}

/**
 * `TextBlockJson#getStyleToUse(header, highlighted)`: the one style a cell is both measured with
 * (`getTextBlock`, `:340-349`) and painted with. `highlight` is the row's `JsonRowGeo.highlight`:
 * `false` = not highlighted, otherwise the stereotype class (`''` = none).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java:138-152 (callers :123-131)
 */
export function styleToUse(styles: JsonStyleSet, header: boolean, highlight: string | false): Style {
  if (highlight !== false) return styles.highlight(highlight, header);
  return header ? styles.nodeHeader : styles.node;
}
