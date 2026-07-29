import type { TextBlock } from './TextBlock.js';
import { UTranslate } from '../UTranslate.js';
import type { UGraphic } from '../UGraphic.js';
import type { StringBounder } from '../font/StringBounder.js';
import { XDimension2D } from '../geom/XDimension2D.js';

const CIRCLED_CHARACTER_MARGIN = 6.0;

/**
 * TextBlockSprited — prefixes a `TextBlock` with a small circled-
 * character/sprite decoration (a UML stereotype's `(C)`/`(I)`-style spot
 * icon), drawn at the far left with a fixed 6px gutter, the rest of the
 * block shifted right by the decoration's own width.
 *
 * Upstream: klimt/shape/TextBlockSprited.java (79 lines). Ported in full:
 * the constructor, `calculateDimension`, `getCircledCharacterWithAndMargin`
 * (private, the shared width/margin computation both `calculateDimension`
 * and `drawU` read), `drawU`.
 *
 * Added as a small, self-contained sibling of `Display.ts` (T9c,
 * `Display#createStereotype` constructs one) — no dependency this port
 * lacks (`TextBlock`/`UGraphic`/`UTranslate`/`XDimension2D`/`StringBounder`
 * all exist already). Note: `Display.ts`'s own `createStereotype` cannot
 * currently reach the call site that would construct one (both of
 * upstream's `circledCharacter`-producing branches are blocked on a
 * missing `HColor` color model / a `SpriteRegistry`-vs-`ISkinSimple`
 * mismatch — see `Display.ts`'s own doc comment) — this class is still
 * ported now, faithfully and independently, so a future task that closes
 * either gap gets it for free rather than re-discovering the same 35-line
 * combinator.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockSprited.java
 */
export class TextBlockSprited implements TextBlock {
  private readonly sprite: TextBlock;
  private readonly parent: TextBlock;

  constructor(sprite: TextBlock, parent: TextBlock) {
    this.sprite = sprite;
    this.parent = parent;
  }

  private getCircledCharacterWithAndMargin(stringBounder: StringBounder): number {
    return this.sprite.calculateDimension(stringBounder).getWidth() + CIRCLED_CHARACTER_MARGIN;
  }

  calculateDimension(stringBounder: StringBounder): XDimension2D {
    const widthCircledCharacter = this.getCircledCharacterWithAndMargin(stringBounder);
    const heightCircledCharacter = this.sprite.calculateDimension(stringBounder).getHeight();

    const dim = this.parent.calculateDimension(stringBounder);
    return new XDimension2D(dim.getWidth() + widthCircledCharacter, Math.max(heightCircledCharacter, dim.getHeight()));
  }

  drawU(ug: UGraphic): void {
    const stringBounder = ug.getStringBounder();

    this.sprite.drawU(ug);

    const widthCircledCharacter = this.getCircledCharacterWithAndMargin(stringBounder);

    this.parent.drawU(ug.apply(UTranslate.dx(widthCircledCharacter)));
  }
}
