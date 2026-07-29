import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import { UTranslate } from '../klimt/UTranslate.js';
import { UEllipse } from '../klimt/shape/UEllipse.js';
import { UPath } from '../klimt/shape/UPath.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import { XDimension2D } from '../klimt/geom/XDimension2D.js';
import type { SymbolContext } from '../decoration/symbol/SymbolContext.js';

/**
 * ActorHollow — the "hollow" actor drawing style selected by `skinparam
 * actorStyle hollow`: a small head circle plus an angular, filled
 * hour-glass-shaped body outline (arms/torso/legs as a single 13-point
 * closed polygon path).
 *
 * Upstream: skin/ActorHollow.java. Ported in full: the constructor,
 * `drawU`, `thickness`, `getPreferredWidth`/`getPreferredHeight`,
 * `calculateDimension`. `getPreferredHeight` is the one method of the
 * three actor styles that reads `fashion.getDeltaShadow()` directly into
 * the preferred size (upstream, verbatim) — `ActorStickMan`/`ActorAwesome`
 * do not (their own `getPreferredHeight`s omit it); not "fixed" here, per
 * this project's porting discipline (preserve upstream asymmetries).
 *
 * Body path is a CLOSED silhouette (13 lineTo segments → closePath), drawn
 * with the ambient `fashion` fill — no `Back('none')` override, same
 * reasoning as `ActorAwesome.ts`'s own doc comment.
 */
export class ActorHollow implements TextBlock {
  private readonly headDiam = 9;
  private readonly bodyWidth = 25;
  private readonly bodyHeight = 21;

  private readonly neckHeight = 2;

  private readonly armThickness = 5;
  private readonly bodyThickness = 6;
  private readonly legThickness = 6;

  private readonly fashion: SymbolContext;

  constructor(fashion: SymbolContext) {
    this.fashion = fashion;
  }

  drawU(ug: UGraphic): void {
    const head = UEllipse.build(this.headDiam, this.headDiam);
    const centerX = this.getPreferredWidth() / 2;

    const legDiag = (this.legThickness * Math.sqrt(2)) / 2;
    const path = UPath.none();
    path.moveTo(-this.bodyWidth / 2, 0);
    path.lineTo(-this.bodyWidth / 2, this.armThickness);
    path.lineTo(-this.bodyThickness / 2, this.armThickness);
    path.lineTo(-this.bodyThickness / 2, this.bodyHeight - (this.bodyWidth + this.legThickness * Math.sqrt(2) - this.bodyThickness) / 2);
    path.lineTo(-this.bodyWidth / 2, this.bodyHeight - legDiag);
    path.lineTo(-(this.bodyWidth / 2 - legDiag), this.bodyHeight);

    path.lineTo(0, this.bodyHeight - (this.bodyWidth / 2 - legDiag));

    path.lineTo(this.bodyWidth / 2 - legDiag, this.bodyHeight);
    path.lineTo(this.bodyWidth / 2, this.bodyHeight - legDiag);
    path.lineTo(this.bodyThickness / 2, this.bodyHeight - (this.bodyWidth + this.legThickness * Math.sqrt(2) - this.bodyThickness) / 2);
    path.lineTo(this.bodyThickness / 2, this.armThickness);
    path.lineTo(this.bodyWidth / 2, this.armThickness);
    path.lineTo(this.bodyWidth / 2, 0);
    path.lineTo(-this.bodyWidth / 2, 0);
    path.closePath();

    if (this.fashion.getDeltaShadow() !== 0) {
      head.setDeltaShadow(this.fashion.getDeltaShadow());
      path.setDeltaShadow(this.fashion.getDeltaShadow());
    }
    const applied = this.fashion.apply(ug);
    applied.apply(new UTranslate(centerX - head.getWidth() / 2, this.thickness())).draw(head);
    applied.apply(new UTranslate(centerX, head.getHeight() + this.thickness() + this.neckHeight)).draw(path);
  }

  private thickness(): number {
    return this.fashion.getStroke().getThickness();
  }

  getPreferredWidth(): number {
    return this.bodyWidth + this.thickness() * 2;
  }

  getPreferredHeight(): number {
    return this.headDiam + this.neckHeight + this.bodyHeight + this.thickness() * 2 + this.fashion.getDeltaShadow();
  }

  calculateDimension(_stringBounder: StringBounder): XDimension2D {
    return new XDimension2D(this.getPreferredWidth(), this.getPreferredHeight());
  }
}
