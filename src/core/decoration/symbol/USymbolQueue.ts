import type { UGraphic } from '../../klimt/UGraphic.js';
import type { StringBounder } from '../../klimt/font/StringBounder.js';
import { HorizontalAlignment } from '../../klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../klimt/geom/XDimension2D.js';
import { UTranslate } from '../../klimt/UTranslate.js';
import { UPath } from '../../klimt/shape/UPath.js';
import { Back } from '../../klimt/Back.js';
import { TextBlockUtils } from '../../klimt/shape/TextBlockUtils.js';
import { AbstractUGraphicHorizontalLine } from '../../klimt/drawing/AbstractUGraphicHorizontalLine.js';
import type { UHorizontalLine } from '../../klimt/shape/UHorizontalLine.js';
import type { Stencil } from '../../klimt/creole/Stencil.js';
import type { StringBounder as SB } from '../../klimt/font/StringBounder.js';
import type { TextBlock } from '../../klimt/shape/TextBlock.js';
import { USymbol, Margin } from './USymbol.js';
import type { SName } from './USymbol.js';
import type { SymbolContext } from './SymbolContext.js';

/**
 * USymbolQueue — the "queue" descriptive/deployment element: a
 * horizontal cylinder (two cubic caps on the LEFT/RIGHT sides, straight
 * top/bottom) — a 90-degree rotation of the database cylinder's layout,
 * but a genuinely distinct coordinate formula (own `dx` inset constant),
 * not derived from `USymbolDatabase`.
 *
 * Upstream: decoration/symbol/USymbolQueue.java (186 ln). Ported:
 * `getSNames`, `drawQueue`/`getClosingPath` (top-level functions — see
 * `USymbolDatabase.ts`'s "TS-mechanics deviation" doc entry, identical
 * reasoning here), `getMargin`, `asSmall`, `asBig`. The `dx = 5` field is
 * the class's own inset constant (left/right cap depth) — ported as the
 * `QUEUE_DX` module constant.
 *
 * cdd6-T2c (D4/D7, item 2B): the closing cap's second `cubicTo` below
 * ported `USymbolQueue.java:86`'s LITERAL text (`"cubicTo(width - dx * 2,
 * height / 2, width - dx * 2, height, width - dx, height)"`) rather than
 * `:87` (`"cubicTo(width - dx * 2, height, width - dx, height, width -
 * dx, height)"`) -- a cdd5 finding that itself turned out to be fitted to
 * a STALE `plantuml-1.2026.7beta3.jar` capture (its own doc comment cited
 * that jar's printed coordinates over the checked-out source text).
 * Re-verified against the CURRENT `1.2026.8beta1` conformance oracle:
 * every cached `queue`-using fixture's closing cap (25/25 scanned --
 * component/object/sequence participants + unknown, `diagnosis/verify.md`'s
 * "empty usymbol containers" mechanism B) draws the `:87` SOURCE form, 0
 * the old beta3 form. Ported to `:87` (`getClosingPath` below).
 *
 * Seam — `MyUGraphicQueue` (T3b realignment): restored below, now that
 * `AbstractUGraphicHorizontalLine`/`UHorizontalLine`/`Stencil` are
 * ported (T3b) — see `USymbolDatabase.ts`'s doc comment for the shared
 * write-up. Output-neutral for this task's conformance suite (this
 * element's stereotype/label content never draws a `UHorizontalLine`).
 */

const QUEUE_DX = 5;

/** Upstream: `USymbolQueue#getClosingPath` (`USymbolQueue.java:83-88`) —
 * the small cubic "hump" drawn `2*dx` inset from the right edge,
 * back-colored `none`. See the module doc comment (cdd6-T2c item 2B) for
 * why the second `cubicTo` below is `:87`'s literal text, not the older
 * beta3-jar-fitted form it replaces. */
export function getClosingPath(width: number, height: number): UPath {
  const closing = UPath.none();
  closing.moveTo(width - QUEUE_DX, 0);
  closing.cubicTo(width - QUEUE_DX * 2, 0, width - QUEUE_DX * 2, height / 2, width - QUEUE_DX * 2, height / 2);
  closing.cubicTo(width - QUEUE_DX * 2, height, width - QUEUE_DX, height, width - QUEUE_DX, height);
  return closing;
}

/** Upstream: `USymbolQueue#drawQueue`. */
export function drawQueue(ug: UGraphic, width: number, height: number, shadowing: number): void {
  const shape = UPath.none();
  shape.setDeltaShadow(shadowing);

  shape.moveTo(QUEUE_DX, 0);
  shape.lineTo(width - QUEUE_DX, 0);
  shape.cubicTo(width, 0, width, height / 2, width, height / 2);
  shape.cubicTo(width, height / 2, width, height, width - QUEUE_DX, height);
  shape.lineTo(QUEUE_DX, height);

  shape.cubicTo(0, height, 0, height / 2, 0, height / 2);
  shape.cubicTo(0, height / 2, 0, 0, QUEUE_DX, 0);

  ug.draw(shape);

  const closing = getClosingPath(width, height);
  ug.apply(new Back('none')).draw(closing);
}

/**
 * MyUGraphicQueue — wraps `ug` so any `UHorizontalLine` drawn through it
 * (a Creole separator inside the merged stereotype/label content) bends
 * to follow the queue cylinder's curved left/right caps instead of
 * drawing a straight rule across the whole symbol width. Unlike
 * `MyUGraphicDatabase`, this class implements `Stencil` directly and
 * lets `UHorizontalLine#drawLineInternal` do the clipped drawing.
 *
 * Upstream: `USymbolQueue.MyUGraphicQueue` (Java inner class). Ported in
 * full: the constructor, `copy`, `drawHline`, `getStartingX`/`getEndingX`.
 *
 * Output-neutral for this task's conformance suite (T3b realignment):
 * neither `stereotype` nor `label` here ever draws a `UHorizontalLine`.
 */
class MyUGraphicQueue extends AbstractUGraphicHorizontalLine implements Stencil {
  private readonly x1: number;
  private readonly x2: number;
  private readonly fullHeight: number;

  constructor(ug: UGraphic, x1: number, x2: number, fullHeight: number) {
    super(ug);
    this.x1 = x1;
    this.x2 = x2;
    this.fullHeight = fullHeight;
  }

  protected copy(ug: UGraphic): AbstractUGraphicHorizontalLine {
    return new MyUGraphicQueue(ug, this.x1, this.x2, this.fullHeight);
  }

  protected drawHline(ug: UGraphic, line: UHorizontalLine, translate: UTranslate): void {
    line.drawLineInternal(ug, this, translate.getDy(), line.getStroke());
  }

  getStartingX(_stringBounder: SB, _y: number): number {
    return 0;
  }

  getEndingX(_stringBounder: SB, y: number): number {
    const halfHeight = this.fullHeight / 2;
    const factor2 = y <= halfHeight ? 1 - y / halfHeight : (y - halfHeight) / halfHeight;
    return (this.x2 - this.x1) * factor2 + this.x1;
  }
}

/** Upstream: `USymbolQueue#getMargin`. */
export function getMargin(): Margin {
  return new Margin(5, 15, 5, 5);
}

export class USymbolQueue extends USymbol {
  getSNames(): readonly SName[] {
    return ['queue'];
  }

  asSmall(
    _name: TextBlock,
    label: TextBlock,
    stereotype: TextBlock,
    symbolContext: SymbolContext,
    _stereoAlignment: HorizontalAlignment,
  ): TextBlock {
    const calculateDimension = (stringBounder: StringBounder): XDimension2D => {
      const dimLabel = label.calculateDimension(stringBounder);
      const dimStereo = stereotype.calculateDimension(stringBounder);
      return getMargin().addDimension(dimStereo.mergeTB(dimLabel));
    };

    return {
      calculateDimension,
      drawU(ug: UGraphic): void {
        const dim = calculateDimension(ug.getStringBounder());
        ug = symbolContext.apply(ug);
        drawQueue(ug, dim.getWidth(), dim.getHeight(), symbolContext.getDeltaShadow());
        const margin = getMargin();
        const tb = TextBlockUtils.mergeTB(stereotype, label, HorizontalAlignment.CENTER);
        const ug2 = new MyUGraphicQueue(ug, dim.getWidth() - 2 * QUEUE_DX, dim.getWidth() - QUEUE_DX, dim.getHeight());
        tb.drawU(ug2.apply(new UTranslate(margin.getX1(), margin.getY1())));
      },
    };
  }

  asBig(
    title: TextBlock,
    _labelAlignment: HorizontalAlignment,
    stereotype: TextBlock,
    width: number,
    height: number,
    symbolContext: SymbolContext,
    _stereoAlignment: HorizontalAlignment,
  ): TextBlock {
    const calculateDimension = (_stringBounder: StringBounder): XDimension2D => new XDimension2D(width, height);

    return {
      calculateDimension,
      drawU(ug: UGraphic): void {
        const stringBounder = ug.getStringBounder();
        const dim = calculateDimension(stringBounder);
        ug = symbolContext.apply(ug);
        drawQueue(ug, dim.getWidth(), dim.getHeight(), symbolContext.getDeltaShadow());

        const dimStereo = stereotype.calculateDimension(stringBounder);
        const posStereo = (width - dimStereo.getWidth()) / 2;
        stereotype.drawU(ug.apply(new UTranslate(posStereo, 2)));

        const dimTitle = title.calculateDimension(stringBounder);
        const posTitle = (width - dimTitle.getWidth()) / 2;
        title.drawU(ug.apply(new UTranslate(posTitle, 2 + dimStereo.getHeight())));
      },
    };
    // 7 params mirrors the abstract USymbol#asBig signature (T3,
    // USymbol.ts — out of this task's write-set); not reducible without
    // breaking the override contract.
  }
}
