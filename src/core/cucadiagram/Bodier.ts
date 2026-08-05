import type { Entity } from '../abel/Entity.js';
import type { Display } from '../klimt/creole/Display.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import type { ISkinParam, Style } from '../abel/ISkinParam.js';
import type { FontConfiguration } from '../abel/FontConfiguration.js';

/**
 * Bodier — the contract between an `Entity` and its body (fields/
 * methods/raw lines) provider. `Entity` holds one and delegates
 * `muteClassToObject`/`hasUrl`/`getRawBody`/`getBestMatch` to it; T7's
 * `BodierJSon`/`BodierMap`/`BodyEnhanced`-family classes implement it.
 *
 * SI1/T5 — the interface is trivially upstream's :49-70 surface
 * (11/11 members), so it lives here at its upstream-mirroring home per
 * the task's placement rule. `CharSequence` → `string` and
 * `List<CharSequence>` → `readonly string[]` per the translation table.
 * The style-seam parameter types (`ISkinParam`/`Style`/
 * `FontConfiguration`) are ADR-2 consumed stubs from `src/core/abel/`
 * until the style missions land their real homes.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Bodier.java:49-70
 */
export interface Bodier {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Bodier.java:51 */
  setLeaf(leaf: Entity): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Bodier.java:53 */
  getFieldsToDisplay(): Display;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Bodier.java:55 */
  getMethodsToDisplay(): Display;

  /** Upstream declares `throws NoSuchColorException`; this port's color
   * resolvers never throw (see `stereo/StereotypeDecoration.ts`'s
   * documented convention), so no error contract is carried here.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Bodier.java:57 */
  addFieldOrMethod(s: string): boolean;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Bodier.java:59-60 */
  getBody(
    skinParam: ISkinParam,
    showMethods: boolean,
    showFields: boolean,
    stereotype: Stereotype | undefined,
    style: Style,
    fontConfiguration: FontConfiguration,
  ): TextBlock;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Bodier.java:62 */
  getRawBody(): readonly string[];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Bodier.java:64 */
  muteClassToObject(): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Bodier.java:66 */
  hasUrl(): boolean;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Bodier.java:68 */
  getBestMatch(candidate: string): string;
}
