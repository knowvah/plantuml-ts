import type { TextBlock } from './TextBlock.js';
import type { UGraphic } from '../UGraphic.js';
import type { StringBounder } from '../font/StringBounder.js';
import type { XDimension2D } from '../geom/XDimension2D.js';
import type { XRectangle2D } from '../geom/XRectangle2D.js';
import type { WithPorts } from '../../svek/WithPorts.js';
import { UHorizontalLine } from './UHorizontalLine.js';
import { Fore } from '../Fore.js';
import { Ports } from '../../svek/Ports.js';

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
 * `getInnerPosition`/`getPorts` (ADR-7's "note on Ports/WithPorts",
 * `plans/bodyenhanced-atom-seams/decisions.md`): T2a originally dropped
 * both, reasoning "no caller"/"`Ports`/`WithPorts` don't exist in this
 * port" — an invalid justification under this mission's ADR-8 corollary
 * ("not ported yet" is never "unreachable"). T8 reinstates both, faithful
 * to `TextBlockLineBefore.java:97-107`:
 * - `getInnerPosition(member, stringBounder)`: delegates to
 *   `this.textBlock.getInnerPosition(member, stringBounder)` if present.
 *   `TextBlock.ts`'s own interface does not declare this member (a T3
 *   scope reduction, same "add it the day a ported class needs to
 *   override one" rationale as `getMagneticBorder` — today is that day
 *   for `SheetBlock1`/`SheetBlock2`, `klimt/creole/SheetBlock{1,2}.ts`).
 *   Rather than widen `TextBlock.ts` (outside this task's write-set), the
 *   delegation below duck-types the optional capability directly, exactly
 *   as `getMagneticBorder` already established as this port's idiom for
 *   an upstream `TextBlock` default member with no universal caller.
 * - `getPorts(stringBounder)`: upstream's `textBlock instanceof
 *   WithPorts` becomes a duck-typed `typeof
 *   (textBlock as Partial<WithPorts>).getPorts === 'function'` check (TS
 *   interfaces carry no runtime tag to `instanceof` against) — same
 *   fallback (`new Ports()`) when absent.
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

  getInnerPosition(member: string, stringBounder: StringBounder): XRectangle2D | undefined {
    const candidate = this.textBlock as Partial<{
      getInnerPosition(m: string, sb: StringBounder): XRectangle2D | undefined;
    }>;
    return candidate.getInnerPosition?.(member, stringBounder);
  }

  getPorts(stringBounder: StringBounder): Ports {
    const candidate = this.textBlock as Partial<WithPorts>;
    if (typeof candidate.getPorts === 'function') return candidate.getPorts(stringBounder);
    return new Ports();
  }
}
