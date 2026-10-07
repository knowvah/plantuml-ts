import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { Theme } from '../../../core/theme.js';
import { activityFontSize } from '../activity-style-defaults.js';
import type { StringMeasurer } from '../../../core/measurer.js';
import { creoleTextLines } from '../../../core/svek/image/creole-text-lines.js';
import { measurerAdapterOf } from './gtile-action.js';

/** `FtileUtils.addHorizontalMargin(inner, 10)` (`FtileGroup.java:97`): a
 *  flat 10px margin added to BOTH sides of the body before any of this
 *  class's own title/frame math runs (`FtileMarged.java:92-96`: width +=
 *  20, body shifted +10 on x, height/inY/outY unchanged). Mission
 *  `activity-divergence-drive-2` T3g (family PART): was a flat `H_PAD=12`
 *  on both width AND the body offset, neither sourced. */
const BODY_MARGIN = 10;
/** `FtileGroup.java:74` -- `private final double diffYY2 = 20;`, the
 *  frame's own bottom padding below the (margined) body. */
const BOTTOM_PAD = 20;

/**
 * `dimTitle.getWidth()` of the frame title. The title is a creole
 * `Display` (`FtileGroup.java:104-108`: `title.create(fc, LEFT,
 * skinParam)`), so `[[url label]]` measures as `label` and `**x**` as `x`
 * -- measured through the SAME `creoleTextLines` lexer the renderer draws
 * it with, never as the raw markup. Shared by this tile's sizing
 * (`suppWidth`, `:160-167`), the renderer's tab (`USymbolFrame.java:76-84`)
 * and the compression adapter's title slot (`USymbolFrame.java:150-156`).
 */
export function frameTitleWidth(title: string, measurer: StringMeasurer, theme: Theme): number {
  if (title === '') return 0;
  const font = { family: theme.fontFamily, size: activityFontSize(theme, 'composite') };
  return Math.max(0, ...creoleTextLines(title, font, measurer).map((line) => line.width));
}

export class GtileGroup extends TileComposite {
  // Widened to `string` so subclasses (e.g. GtilePartition) can override
  // with a narrower literal while remaining assignable to this base type.
  readonly kind: string = 'gtile-group';
  readonly width: number;
  readonly height: number;
  readonly children: readonly Tile[];
  /** `node.title` verbatim -- `tile-coordinates.ts#walkTileGroup` threads
   *  this onto the pushed node's `label` so the renderer's `USymbolFrame`
   *  port (`activity-renderer-composite.ts`) can draw the title tab. */
  readonly title: string;
  readonly titleHeight: number;
  readonly bodyOffsetX: number;
  readonly bodyOffsetY: number;

  constructor(title: string, body: Tile, bounder: StringBounder, theme: Theme) {
    super();
    this.children = [body];
    this.title = title;
    // A group/partition frame resolves `of(root, element, activityDiagram,
    // <symbol>, composite)` (`ftile/vcompact/FtileGroup.java:89-92`), and
    // `activityDiagram { composite { ... } }` (plantuml.skin:364-368)
    // declares LineColor, BackgroundColor and LineThickness but NO FontSize
    // -- so the title inherits the root `FontSize 14` (:10), which is what
    // `activityFontSize` returns for a kind declaring none. Routed through
    // the resolver rather than left as a bare `theme.fontSize` so a user's
    // `<style> activityDiagram { composite { FontSize N } }` reaches it.
    const titleMeasured = bounder.getDimension(title, activityFontSize(theme, 'composite'));
    // `FtileGroup.java:140-143` -- `diffHeightTitle`: `max(25, dimTitle
    // .getHeight() + 20)`. Was `titleMeasured.height + 8`, unsourced.
    const diffHeightTitle = Math.max(25, titleMeasured.height + 20);
    this.titleHeight = diffHeightTitle;
    const margedBodyWidth = body.width + 2 * BODY_MARGIN;
    // `:160-167` -- `suppWidth`: `max(orig.width, dimTitle.width + 20,
    // dimHeaderNote.width + 20) - orig.width`. `headerNote` is always the
    // empty `TextBlock` (`:110-113`, the `displayNote` branch is
    // permanently commented out upstream), so its term is a flat `+20`;
    // `orig.width` is `margedBodyWidth` (the body already widened by
    // `FtileMarged`, `getInnerDimension`'s ink-scan correction unported --
    // see this class's own `drawU` counterpart's doc).
    const titleWidth = frameTitleWidth(title, measurerAdapterOf(bounder), theme);
    const suppWidth = Math.max(margedBodyWidth, titleWidth + 20, 20) - margedBodyWidth;
    this.width = margedBodyWidth + suppWidth;
    // `:145-148` -- `getTranslate`: `(suppWidth/2, diffHeightTitle +
    // headerNoteHeight)`, drawn onto the already-`FtileMarged` body, whose
    // OWN `+BODY_MARGIN` shift (`FtileMarged.java:108-110`) composes with
    // this outer translate (`drawU`, `FtileGroup.java:225`).
    this.bodyOffsetX = suppWidth / 2 + BODY_MARGIN;
    this.bodyOffsetY = diffHeightTitle;
    // `:194-195` -- `height = orig.height + diffHeightTitle + diffYY2 +
    // headerNoteHeight`.
    this.height = body.height + diffHeightTitle + BOTTOM_PAD;
  }

  getCoord(hook: HookName): GPoint {
    const body = this.children[0]!;
    // `:190-203` -- `calculateDimensionFtile`: `left = orig.getLeft() +
    // suppWidth/2` (the `FtileMarged` body's own `+BODY_MARGIN` shift is
    // already folded into `bodyOffsetX` above); `inY`/`outY` =
    // `orig.getInY/OutY() + titleAndHeaderNoteHeight` (`bodyOffsetY`). Was
    // a flat `this.width / 2` -- centred on the FRAME, not the body's own
    // in/out column, which only coincide when the body happens to be
    // centred under the title.
    const left = body.getCoord(NORTH_HOOK).x + this.bodyOffsetX;
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: left, y: body.getCoord(NORTH_HOOK).y + this.bodyOffsetY };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: left, y: body.getCoord(SOUTH_HOOK).y + this.bodyOffsetY };
      case EAST_HOOK:
        return { x: this.width, y: this.height / 2 };
      case WEST_HOOK:
        return { x: 0, y: this.height / 2 };
      /* c8 ignore next 3 */
      default: {
        const _exhaustive: never = hook;
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * Passes through the single body's out point. `GtilePartition` inherits
   * this unmodified -- upstream partitions resolve through the same
   * `FtileGroup` as composite/group frames, just a different `USymbol`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileGroup.java:190-201
   *   -- `calculateDimensionFtile`: `if (orig.hasPointOut()) return
   *   ...outY...; return ...(no outY)`.
   */
  hasPointOut(): boolean {
    return this.children[0]!.hasPointOut();
  }
}
