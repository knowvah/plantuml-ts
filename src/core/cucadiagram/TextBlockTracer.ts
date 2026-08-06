import type { TextBlock } from '../klimt/shape/TextBlock.js';
import { textBlockMagneticBorder } from '../klimt/shape/TextBlock.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { XDimension2D } from '../klimt/geom/XDimension2D.js';
import { XRectangle2D } from '../klimt/geom/XRectangle2D.js';
import type { MinMax } from '../klimt/geom/MinMax.js';
import type { MagneticBorder } from '../klimt/geom/MagneticBorder.js';
import type { Paint } from '../paint.js';
import type { Url } from '../url/Url.js';
import type { Member } from './Member.js';

/**
 * The per-member-row block wrappers of `MethodsOrFieldsArea.java` — its
 * package-private static nested class `TextBlockTracer` (java:307-339)
 * and its private static `fullInnerPosition` (java:269-305), plus the
 * `cs instanceof Member` stand-in both share with the owning class.
 * Split from `MethodsOrFieldsArea.ts` only for this repo's 500-line
 * file cap — the split follows the upstream nested-class boundary.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java
 */

/** Duck-typed stand-in for upstream's `cs instanceof Member` — this
 *  port's `Display` holds `DisplayElement`s and `Member` rows ride
 *  through it untyped (the caller places them, exactly as upstream's
 *  `Display.create(List<CharSequence>)` does). Duck-typing the `Member`
 *  surface instead of `instanceof` keeps this file free of a VALUE
 *  import of `Member.ts` (written in parallel by SI1/T7; the type-only
 *  import above is erased at runtime) — the same optional-capability
 *  idiom `TextBlockLineBefore.ts#getPorts` / `ULayoutGroup.ts#tryOne`
 *  established. */
export function isMember(cs: unknown): cs is Member {
  if (typeof cs !== 'object' || cs === null) return false;
  const candidate = cs as Partial<Member>;
  return typeof candidate.getDisplay === 'function' && typeof candidate.getVisibilityModifier === 'function';
}

/**
 * `MethodsOrFieldsArea#fullInnerPosition` (java:269-305) — wraps a
 * member's block so `getInnerPosition` claims the WHOLE row rectangle
 * when the queried member name equals this row's `Member#toString()`
 * (upstream's `display.toString().equals(member.toString())`), else
 * delegates nothing (`undefined` = "not here", `ULayoutGroup#tryOne`'s
 * probe contract). All other members delegate to `block`, with
 * upstream's `TextBlock` default-method semantics reproduced via the
 * established duck-typing idiom.
 */
export function fullInnerPosition(block: TextBlock, display: Member): TextBlock {
  return {
    drawU: (ug: UGraphic): void => {
      block.drawU(ug);
    },
    calculateDimension: (stringBounder: StringBounder): XDimension2D => block.calculateDimension(stringBounder),
    getMinMax: (stringBounder: StringBounder): MinMax => {
      const candidate = block as Partial<{ getMinMax(sb: StringBounder): MinMax }>;
      if (candidate.getMinMax !== undefined) return candidate.getMinMax(stringBounder);
      // TextBlock.java's default getMinMax throws UnsupportedOperationException.
      throw new Error('fullInnerPosition: wrapped block does not support getMinMax');
    },
    getInnerPosition: (member: string, stringBounder: StringBounder): XRectangle2D | undefined => {
      // InnerStrategy (upstream's own comment, java:288)
      if (display.toString() === String(member)) {
        const dim = block.calculateDimension(stringBounder);
        return new XRectangle2D(0, 0, dim.getWidth(), dim.getHeight());
      }
      return undefined;
    },
    getMagneticBorder: (): MagneticBorder => textBlockMagneticBorder(block),
    getBackcolor: (): Paint | undefined => {
      const candidate = block as Partial<{ getBackcolor(): Paint | undefined }>;
      return candidate.getBackcolor?.();
    },
  } as TextBlock;
}

/**
 * `MethodsOrFieldsArea.TextBlockTracer` (java:307-339) — brackets a
 * member row's draw with `startUrl(url)`/`closeUrl()` when the member
 * carries a `Url`. `startUrl`/`closeUrl` are duck-typed off the
 * `UGraphic` (this port's interface does not declare them —
 * `TextBlockWithUrl.ts#drawU`'s identical, established adaptation).
 */
export class TextBlockTracer implements TextBlock {
  private readonly block: TextBlock;
  private readonly url: Url | null;

  /** @see cucadiagram/MethodsOrFieldsArea.java:312-315 (TextBlockTracer constructor) */
  constructor(m: Member, block: TextBlock) {
    this.block = block;
    this.url = m.getUrl();
  }

  /** @see cucadiagram/MethodsOrFieldsArea.java:317-325 (TextBlockTracer#drawU) */
  drawU(ug: UGraphic): void {
    const candidate = ug as UGraphic & Partial<{ startUrl(url: Url): void; closeUrl(): void }>;
    if (this.url !== null) candidate.startUrl?.(this.url);

    this.block.drawU(ug);
    if (this.url !== null) candidate.closeUrl?.();
  }

  /** @see cucadiagram/MethodsOrFieldsArea.java:327-332 (upstream @Fast) */
  calculateDimension(stringBounder: StringBounder): XDimension2D {
    const dim = this.block.calculateDimension(stringBounder);
    return dim;
  }

  /** @see cucadiagram/MethodsOrFieldsArea.java:334-338 */
  getInnerPosition(member: string, stringBounder: StringBounder): XRectangle2D | undefined {
    const candidate = this.block as Partial<{
      getInnerPosition(m: string, sb: StringBounder): XRectangle2D | undefined;
    }>;
    return candidate.getInnerPosition?.(member, stringBounder);
  }
}
