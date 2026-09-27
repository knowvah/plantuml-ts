/**
 * `StereotypeSpriteRef` -- moved out of `./ast.ts` (cdd3-T18, pure move, to
 * keep that file under the 500-line cap); re-exported from there.
 */
import type { ResolvedColor } from '../../core/klimt/color/HColorSet.js';

/**
 * The sprite half of a parsed `<<...>>` run: `StereotypeDecoration
 * .spriteName` / `.spriteScale` / `.htmlColor`.
 *
 * Upstream keeps the whole `Stereotype` on the `Entity` and asks it for
 * `getSprite(getSkinParam())` at draw time
 * (`EntityImageDescription.java:193-194`). This port's `SpriteRegistry` is
 * not in scope while parsing, so the three fields that lookup needs travel
 * on the node instead — see `Stereotype#getSpriteName`'s doc comment for
 * why the accessor exists at all.
 */
export interface StereotypeSpriteRef {
  readonly name: string;
  /** `Parser.getScale(...)`, defaulting to 1 (java:167). */
  readonly scale: number;
  /** `Stereotype#getHtmlColor()` — `HColors.BLACK` whenever a sprite run
   *  matched and declared no explicit color (java:164), so normally set.
   *  Handed to `SvgNanoParser#drawU` as its `fontColor`, exactly as
   *  `Stereotype#getSprite` hands it to `asTextBlock`. */
  readonly color?: ResolvedColor | undefined;
}
