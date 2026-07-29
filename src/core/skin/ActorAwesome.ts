import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import { UTranslate } from '../klimt/UTranslate.js';
import { UEllipse } from '../klimt/shape/UEllipse.js';
import { UPath } from '../klimt/shape/UPath.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import { XDimension2D } from '../klimt/geom/XDimension2D.js';
import type { SymbolContext } from '../decoration/symbol/SymbolContext.js';

/**
 * ActorAwesome — the "awesome" actor drawing style selected by `skinparam
 * actorStyle awesome`: a head circle plus a rounded, filled body silhouette
 * (a bezier-outlined torso, unlike `ActorStickMan`'s open line figure).
 *
 * Upstream: skin/ActorAwesome.java. Ported in full: the constructor,
 * `drawU`, `thickness`, `getPreferredWidth`/`getPreferredHeight`,
 * `calculateDimension`.
 *
 * Unlike `ActorStickMan#drawU`, the body `path` here is a CLOSED silhouette
 * (moveTo → six cubicTo segments → closePath), so it is drawn with the
 * ambient `fashion` fill applied — no `Back('none')` override (that override
 * exists on `ActorStickMan` specifically because its path is an open stick
 * figure of line segments, not a fillable region; see that file's own doc
 * comment). This class's Java has no such override either — verified,
 * not a divergence.
 */
export class ActorAwesome implements TextBlock {
  private readonly headDiam = 32;
  private readonly bodyWidth = 54;
  private readonly shoulder = 16;
  private readonly collar = 4;
  private readonly radius = 8;
  private readonly bodyHeight = 28;

  private readonly fashion: SymbolContext;

  constructor(fashion: SymbolContext) {
    this.fashion = fashion;
  }

  drawU(ug: UGraphic): void {
    const head = UEllipse.build(this.headDiam, this.headDiam);
    const centerX = this.getPreferredWidth() / 2;

    const path = UPath.none();
    path.moveTo(0, this.collar);
    path.cubicTo(
      this.collar,
      this.collar,
      this.bodyWidth / 2 - this.shoulder - this.collar,
      this.collar,
      this.bodyWidth / 2 - this.shoulder,
      0,
    );
    path.cubicTo(
      this.bodyWidth / 2 - this.shoulder / 2,
      0,
      this.bodyWidth / 2,
      this.shoulder / 2,
      this.bodyWidth / 2,
      this.shoulder,
    );
    path.lineTo(this.bodyWidth / 2, this.bodyHeight - this.radius);
    path.cubicTo(
      this.bodyWidth / 2,
      this.bodyHeight - this.radius / 2,
      this.bodyWidth / 2 - this.radius / 2,
      this.bodyHeight,
      this.bodyWidth / 2 - this.radius,
      this.bodyHeight,
    );
    path.lineTo(-this.bodyWidth / 2 + this.radius, this.bodyHeight);
    path.cubicTo(
      -this.bodyWidth / 2 + this.radius / 2,
      this.bodyHeight,
      -this.bodyWidth / 2,
      this.bodyHeight - this.radius / 2,
      -this.bodyWidth / 2,
      this.bodyHeight - this.radius,
    );
    path.lineTo(-this.bodyWidth / 2, this.shoulder);
    path.cubicTo(
      -this.bodyWidth / 2,
      this.shoulder / 2,
      -this.bodyWidth / 2 + this.shoulder / 2,
      0,
      -this.bodyWidth / 2 + this.shoulder,
      0,
    );
    path.cubicTo(
      -this.bodyWidth / 2 + this.shoulder + this.collar,
      this.collar,
      -this.collar,
      this.collar,
      0,
      this.collar,
    );
    path.closePath();

    if (this.fashion.getDeltaShadow() !== 0) {
      head.setDeltaShadow(this.fashion.getDeltaShadow());
      path.setDeltaShadow(this.fashion.getDeltaShadow());
    }
    const applied = this.fashion.apply(ug);
    applied.apply(new UTranslate(centerX - head.getWidth() / 2, this.thickness())).draw(head);
    applied.apply(new UTranslate(centerX, head.getHeight() + this.thickness())).draw(path);
  }

  private thickness(): number {
    return this.fashion.getStroke().getThickness();
  }

  getPreferredWidth(): number {
    return this.bodyWidth + this.thickness() * 2;
  }

  getPreferredHeight(): number {
    return this.headDiam + this.bodyHeight + this.thickness() * 2;
  }

  calculateDimension(_stringBounder: StringBounder): XDimension2D {
    return new XDimension2D(this.getPreferredWidth(), this.getPreferredHeight());
  }
}
