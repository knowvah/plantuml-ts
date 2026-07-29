import type { TextBlock } from './TextBlock.js';
import type { UGraphic } from '../UGraphic.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { XDimension2D } from '../geom/XDimension2D.js';
import { UHorizontalLine } from './UHorizontalLine.js';
import { Fore } from '../Fore.js';

/**
 * TextBlockLineBefore — wraps a `TextBlock` with an infinite horizontal
 * rule (`UHorizontalLine`) drawn at the wrapper's own top edge, optionally
 * carrying a centered title that splits the rule in two. The sole caller
 * in this port is `BodyEnhancedAbstract#decorate` (`../cucadiagram/
 * BodyEnhancedAbstract.ts`) — a titled or untitled Creole block separator
 * (`--sep--`, `==sep==`, `..sep..`, `__sep__`).
 *
 * Upstream: klimt/shape/TextBlockLineBefore.java. Ported:
 * `calculateDimension` (the title-present `atLeast` width/height floor),
 * `drawU` (the title==null vs title!=null draw-order branch — see below),
 * all three constructor arities (collapsed to one via trailing optional
 * params, since TS has no overloading).
 *
 * `drawU`'s draw order is NOT a Y-sort and must stay exactly as ported:
 * - title undefined: draw the rule FIRST (at the wrapper's own y=0,
 *   untranslated), THEN `textBlock.drawU` (which applies its own margin
 *   translate internally, so its content lands below the rule).
 * - title defined: draw `textBlock` FIRST, THEN the rule+title AFTER —
 *   the opposite order, matching upstream exactly (`TextBlockLineBefore
 *   .java:81-95`). `BodyEnhancedAbstract#decorate`'s title branch relies
 *   on this: the inner block already carries a top margin of
 *   `dimTitle.height/2` (so its content clears the rule), and the rule
 *   itself draws at y=0 — i.e. `dimTitle.height/2` ABOVE the content top,
 *   with the title's own upper half extending into NEGATIVE y (into the
 *   margin `decorate` adds around the whole `TextBlockLineBefore`).
 *
 * Color handling (TS-idiom collapse, reported): upstream reads `HColor
 * color = ug.getParam().getColor()` (nullable — `HColors.none()` is the
 * substitute when unset) before re-applying it via `ug.apply(color)` /
 * `ug.apply(HColors.none())`. This port's `Paint` (`../../paint.ts`) has
 * no null variant — `AbstractCommonUGraphic.ts`'s own `NONE_PAINT =
 * 'none'` default already stands in for `HColors.none()` (see that
 * file's doc comment) — so the null branch is unreachable here and the
 * two-way branch collapses to a single unconditional `ug.apply(new
 * Fore(color))`.
 *
 * NOT ported (reported, "no caller in this port's `TextBlock`/svek
 * seam" — same rationale `TextBlockMarged.ts`/`TextBlockVertical.ts`
 * document for the identical members): `getInnerPosition` (not part of
 * this port's `TextBlock` interface, `TextBlock.ts`'s own doc comment);
 * `getPorts`/`WithPorts` (a separate, unported `svek` port-routing
 * subsystem — no `Ports.ts`/`WithPorts.ts` exists in this port at all).
 */
export class TextBlockLineBefore implements TextBlock {
  private readonly textBlock: TextBlock;
  private readonly separator: string;
  private readonly title: TextBlock | undefined;
  private readonly defaultThickness: number;

  constructor(defaultThickness: number, textBlock: TextBlock, separator = '\0', title?: TextBlock) {
    this.defaultThickness = defaultThickness;
    this.textBlock = textBlock;
    this.separator = separator;
    this.title = title;
  }

  calculateDimension(stringBounder: StringBounder): XDimension2D {
    const dim = this.textBlock.calculateDimension(stringBounder);
    if (this.title !== undefined) {
      const dimTitle = this.title.calculateDimension(stringBounder);
      return dim.atLeast(dimTitle.getWidth() + 8, dimTitle.getHeight());
    }
    return dim;
  }

  drawU(ug: UGraphic): void {
    const color = ug.getParam().getColor();
    if (this.title === undefined) {
      UHorizontalLine.infinite(this.defaultThickness, 1, 1, this.separator).drawMe(ug);
    }
    this.textBlock.drawU(ug);
    const ugColored = ug.apply(new Fore(color));
    if (this.title !== undefined) {
      UHorizontalLine.infinite(this.defaultThickness, 1, 1, this.separator, this.title).drawMe(ugColored);
    }
  }
}
