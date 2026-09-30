/**
 * `EntityImagePort` -- the image class upstream instantiates for a class-engine
 * `portin`/`portout` leaf (`LeafType.PORTIN`/`PORTOUT`,
 * `GeneralImageBuilder.java:122-127`, checked BEFORE the `DESCRIPTION`
 * branch), in place of the class box / `EntityImageDescription` every other
 * leaf gets. cdd7-T2a (bonaco-71-xefu608, D4): the draw half of the port leaf;
 * the DOT half is `class-entity-port.ts`, the post-layout cluster frontier is
 * `class-geo-builders-port.ts`.
 *
 * `drawU` (`EntityImagePort.java:100-140`), 1:1:
 * - the desc text block, translated by `x = -(descWidth - 2*RADIUS)/2`
 *   (centred on the symbol) and `y = -(2*RADIUS + descHeight)` when
 *   `upPosition()`, else `y = +2*RADIUS` (`:102-108`);
 * - all of it inside a `UGroup` carrying `class="entity"`, `entity_<name>`
 *   and the data attributes, with NO leading `UComment` (`:110-116` go
 *   straight to `new UGroup`, unlike `EntityImageDescription`);
 * - then `drawSymbol`: a `RADIUS*2` square (`:94-97`) at stroke 1.5
 *   (`getUStroke`, `:142-144`), coloured by the entity's own BACK/LINE colours
 *   falling back to the `port` style's `BackGroundColor`/`LineColor`
 *   (`:122-134`).
 *
 * The same instance is walked by a `LimitFinder` at layout time
 * (`class-geo-builders-port.ts#entityPortSymbolInk`) -- upstream has one ink
 * concept: whatever `drawU` draws is what `SvekResult#calculateDimension`'s
 * `getMinMax` walk sees (`SvekResult.java:130-135`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImagePort.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:56
 */
import type { ClassifierGeo } from './class-geo-types.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { Paint } from '../../core/paint.js';
import { parseColor } from '../../core/paint.js';
import { resolveElementPaint } from '../../core/theme.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { RADIUS } from '../../core/abel/EntityPosition.js';
import { decorateEntityDrawing, type EntityDecorationInfo } from '../../core/svek/DecorateEntityImage.js';
import { requireGroups } from '../../core/svek/image/EntityImageDescriptionShield.js';
import { buildTextBlock } from '../../core/svek/image/EntityImageDescriptionTextBlock.js';
import { textFont } from '../../core/decoration/symbol/usymbol-resolve.js';
import { renderDrawableToFragment, type DrawableFragment } from '../../core/klimt/document-shell.js';
import { leafPortion } from './renderer-group.js';
import { entityPortRank } from './class-entity-port.js';

/** `EntityImagePort#getUStroke` -- `UStroke.withThickness(1.5)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImagePort.java:142-144 */
const PORT_STROKE_THICKNESS = 1.5;

/** `SName.port` -- the last element of `EntityImagePort#getStyleSignature`
 *  (`root, element, <diagram>, port`).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImagePort.java:70-73 */
const PORT_SNAME = 'port';

/** Everything `EntityImagePort#drawU` reads, resolved. `radius` is
 *  `EntityPosition.RADIUS` times the diagram scale (the port pre-scales its
 *  geometry; upstream scales at the `UGraphic`). */
export interface EntityImagePortParams {
  readonly entity: EntityDecorationInfo;
  /** `getDesc()` -- the display at the port style's font, CENTER-aligned
   *  (`AbstractEntityImageBorder.java:78-82`). */
  readonly desc: TextBlock;
  /** `upPosition()` (`EntityImagePort.java:75-81`), decided at layout time
   *  against the parent cluster's post-frontier rectangle. */
  readonly upPosition: boolean;
  readonly backcolor: Paint;
  readonly borderColor: Paint;
  readonly radius: number;
  readonly strokeThickness: number;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImagePort.java:65-146 */
export class EntityImagePort implements UDrawable {
  constructor(private readonly params: EntityImagePortParams) {}

  /** `drawSymbol` -- `URectangle.build(RADIUS * 2, RADIUS * 2)` (`:94-97`). */
  private drawSymbol(ug: UGraphic): void {
    const side = this.params.radius * 2;
    ug.draw(URectangle.build(side, side));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImagePort.java:99-140 */
  drawU(ug: UGraphic): void {
    const { desc, radius, upPosition } = this.params;
    const dimDesc = desc.calculateDimension(ug.getStringBounder());
    const x = 0 - (dimDesc.getWidth() - 2 * radius) / 2;
    const y = upPosition ? -(2 * radius + dimDesc.getHeight()) : 2 * radius;
    decorateEntityDrawing(
      requireGroups(ug),
      this.params.entity,
      {
        drawU: (inner: UGraphic): void => {
          desc.drawU(inner.apply(new UTranslate(x, y)));
          const styled = inner
            .apply(new Fore(this.params.borderColor))
            .apply(UStroke.withThickness(this.params.strokeThickness))
            .apply(new Back(this.params.backcolor));
          this.drawSymbol(styled);
        },
      },
      { withComment: false },
    );
  }
}

/** `GeneralImageBuilder.java:122-127`: a PORTIN/PORTOUT leaf draws
 *  `EntityImagePort`, checked before the `DESCRIPTION` branch. */
export function isClassEntityPort(leaf: Pick<ClassifierGeo, 'usymbol'>): boolean {
  return entityPortRank(leaf) !== undefined;
}

/** The display a port leaf's desc draws -- the header row's text, the same
 *  source every other class-engine usymbol draw reads (`renderer.ts
 *  #tryRenderUSymbol`, `renderer-usymbol-entity.ts`). */
export function entityPortDisplay(leaf: Pick<ClassifierGeo, 'rows' | 'id'>): string {
  return leaf.rows[0]?.text ?? leaf.id;
}

/** `getDesc()`: `leaf.getDisplay().create(fc, HorizontalAlignment.CENTER,
 *  skinParam)` at `FontConfiguration.create(skinParam, getStyle())` -- the
 *  `port` style's font. `buildTextBlock` is this port's `Display.create`
 *  substitute (`EntityImageDescriptionTextBlock.ts`).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/AbstractEntityImageBorder.java:78-82 */
export function entityPortDesc(leaf: Pick<ClassifierGeo, 'rows' | 'id'>, theme: Theme): TextBlock {
  return buildTextBlock(entityPortDisplay(leaf), textFont(theme, PORT_SNAME), HorizontalAlignment.CENTER);
}

/** `EntityImagePort.java:122-134`: the entity's own BACK colour (`#color`,
 *  `ColorParser.simpleColor(BACK)`) over the style's `BackGroundColor`; the
 *  LINE colour is the style's `LineColor` (the entity-level `##line` colour
 *  has no extraction in this port yet -- see the T2a report). */
function portColors(leaf: ClassifierGeo, theme: Theme): { backcolor: Paint; borderColor: Paint } {
  const back = resolveBareOrBackColor(leaf.color);
  const parsed = back === undefined ? undefined : parseColor(back);
  const backcolor =
    parsed === undefined
      ? resolveElementPaint(theme, PORT_SNAME, 'background')
      : typeof parsed === 'string'
        ? resolveColorToSvgHex(parsed)
        : parsed;
  return { backcolor, borderColor: resolveElementPaint(theme, PORT_SNAME, 'border') };
}

/** Build the image for one laid-out port leaf. `scaleK` is 1 at layout time
 *  (the ink walk) and the diagram scale at draw time. */
export function buildEntityImagePort(leaf: ClassifierGeo, theme: Theme, scaleK: number, uid: string): EntityImagePort {
  return new EntityImagePort({
    entity: { name: leafPortion(leaf.id), qualifiedName: leaf.id, uid, location: null },
    desc: entityPortDesc(leaf, theme),
    upPosition: leaf.entityPortUp === true,
    ...portColors(leaf, theme),
    radius: RADIUS * scaleK,
    strokeThickness: PORT_STROKE_THICKNESS * scaleK,
  });
}

/**
 * Draw one port leaf at its laid-out origin (`SvekResult.java:82-87`:
 * `image.drawU(ug.apply(new UTranslate(minX, minY)))`) through the klimt SVG
 * emitter, unwrapped into a fragment exactly as `renderer-usymbol-entity.ts
 * #renderClassUSymbolEntity` does for `EntityImageDescription`.
 */
export function renderClassEntityPort(
  leaf: ClassifierGeo,
  theme: ScaledTheme,
  measurer: StringMeasurer,
  uid: string,
): DrawableFragment {
  const image = buildEntityImagePort(leaf, theme, theme.scaleK, uid);
  const drawable: UDrawable = {
    drawU(ug: UGraphic): void {
      image.drawU(ug.apply(new UTranslate(leaf.x, leaf.y)));
    },
  };
  return renderDrawableToFragment(drawable, {
    width: leaf.x + leaf.width,
    height: leaf.y + leaf.height,
    measurer,
    uid,
  });
}
