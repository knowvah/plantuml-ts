/**
 * class-leaf-magnetic-border.ts -- the LEAF arm of `SvekEdge#drawU`'s
 * magnetic force.
 *
 * `SvekEdge.java:922-926,933-937`: for an end whose entity is a node
 * (`getSvekNode1()/2() != null`) the force is
 * `getSvekNode*().getMagneticBorder().getForceAt(stringBounder, point.move(dx, dy))`,
 * and `SvekNode.java:486-492` asks the node's image after
 * `position.move(-minX, -minY)`. The only image answering a real border is
 * `EntityImageDescription.java:362-366` for `ShapeType.FOLDER`
 * (`asSmall.getMagneticBorder()` -> `USymbolFolder.java:185-209`, the title
 * tab); `IEntityImageUtils.java:103` and `EntityImageDegenerated.java:95-101`
 * only translate it, and every other image inherits `MagneticBorderNone`.
 * So a `package`/`folder` description leaf pushes an end that lands right of
 * its tab down by the tab height.
 *
 * The cluster arm is `class-shield-helpers.ts#applyClusterMagneticBorders`;
 * a leaf rect is the same `ClipRect` shape, so it rides the same function.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:922-941
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java:486-492
 */
import { EntityImageDescription } from '../../core/svek/image/EntityImageDescription.js';
import { MagneticBorderNone } from '../../core/klimt/geom/MagneticBorderNone.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ClassifierGeo } from './class-geo-types.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { ClipRect } from './class-shield-helpers.js';
import { buildUSymbolEntityParams, usesClassUSymbolEntity } from './renderer-usymbol-entity.js';

/** The leaf's top-left (`SvekNode#minX/minY`) is its classifier box origin. */
export function leafMagneticRects(
  leaves: readonly ClassifierGeo[],
  theme: ScaledTheme,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
): ReadonlyMap<string, ClipRect> {
  const bounder = new MeasurerStringBounder(measurer);
  const rects = new Map<string, ClipRect>();
  for (const leaf of leaves) {
    if (!usesClassUSymbolEntity(leaf)) continue;
    const border = new EntityImageDescription(buildUSymbolEntityParams(leaf, theme, sprites)).getMagneticBorder();
    if (border instanceof MagneticBorderNone) continue;
    rects.set(leaf.id, {
      x: leaf.x,
      y: leaf.y,
      width: leaf.width,
      height: leaf.height,
      magneticBorder: {
        getForceAt: (position) => border.getForceAt({ x: position.x - leaf.x, y: position.y - leaf.y }, bounder),
      },
    });
  }
  return rects;
}
