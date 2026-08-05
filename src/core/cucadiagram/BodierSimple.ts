import type { FontConfiguration } from '../abel/FontConfiguration.js';
import type { ISkinParam, Style } from '../abel/ISkinParam.js';
import { Display } from '../klimt/creole/Display.js';
import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import { BodierAbstract } from './BodierAbstract.js';
import { BodyFactory } from './BodyFactory.js';

/**
 * BodierSimple — the `Bodier` for every non-class-like entity (all
 * description/state/... leaves and every group): the body is just raw
 * display lines with no field/method model at all.
 *
 * Upstream: cucadiagram/BodierSimple.java — ported in full. The
 * constructor is package-private upstream (`BodyFactory.createLeaf`/
 * `createGroup` are the real entry points, landing with SI1 batch-4/T9);
 * public here because the factory lives in another module.
 *
 * `addFieldOrMethod`'s `rawBody.addAll(display.asList())` stores each
 * element via `String(...)` — the `Bodier` interface's T5 translation
 * types `rawBody` as `string[]`, and `Display.getWithNewlines2` only
 * produces string lines, so this is a type narrowing, not a behavior
 * change (`Display.ts`'s own generic elements-as-`String(e)` convention).
 *
 * SI1/T7.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierSimple.java
 */
export class BodierSimple extends BodierAbstract {
  private readonly skinParam: ISkinParam;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierSimple.java:56-58 */
  constructor(skinParam: ISkinParam) {
    super();
    this.skinParam = skinParam;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierSimple.java:51-54 */
  muteClassToObject(): void {
    throw new Error('UnsupportedOperationException');
  }

  /** Upstream declares `throws NoSuchColorException` — not carried, per
   *  the `Bodier` interface's documented convention.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierSimple.java:60-66 */
  addFieldOrMethod(s: string): boolean {
    const display = Display.getWithNewlines2(this.skinParam.getPragma(), s);
    for (const el of display.asList()) this.rawBody.push(String(el));
    return true;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierSimple.java:68-71 */
  getMethodsToDisplay(): Display {
    throw new Error('UnsupportedOperationException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierSimple.java:73-76 */
  getFieldsToDisplay(): Display {
    throw new Error('UnsupportedOperationException');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierSimple.java:78-81 */
  hasUrl(): boolean {
    return false;
  }

  /** Delegates to `BodyFactory.create1` exactly as upstream — currently
   *  the SI1 batch-4/T9 throws-deferred hook (`BodyFactory.ts`).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierSimple.java:83-88 */
  getBody(
    skinParam: ISkinParam,
    _showMethods: boolean,
    _showFields: boolean,
    stereotype: Stereotype | undefined,
    style: Style,
    _fontConfiguration: FontConfiguration,
  ): TextBlock | null {
    return BodyFactory.create1(
      skinParam.getDefaultTextAlignment(HorizontalAlignment.LEFT),
      this.rawBody,
      skinParam,
      stereotype,
      this.leaf,
      style,
    );
  }
}
