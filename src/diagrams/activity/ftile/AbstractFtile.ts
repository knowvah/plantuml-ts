import type { ISkinParamWithSimple } from '../../../core/abel/ISkinParam.js';
import type { HColorSet } from '../../../core/klimt/color/HColorSet.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import type { FtileGeometry } from './FtileGeometry.js';

/**
 * AbstractFtile — base of every activity tile: holds the `ISkinParam` and
 * memoises `calculateDimension` until `invalidateGeometryCache`.
 *
 * Ported slice (what `FtileBoxOld` reaches): the constructor, `skinParam()`,
 * `getIHtmlColorSet`, the geometry cache (`calculateDimension`,
 * `invalidateGeometryCache`, abstract `calculateDimensionFtile`). The
 * `Ftile` graph members (`getInLinkRendering`, `getWeldingPoints`,
 * `getTranslateFor`, `getMinMax`, `arrowHorizontalAlignment`, ...) serve the
 * activity ftile graph the port does not build (its activity engine is the
 * separate `tiles/` tree); they land with the first `Ftile` consumer.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/AbstractFtile.java:51-137
 */
export abstract class AbstractFtile {
  /** Renamed from `skinParam`: TS forbids a field and method of one name. @see AbstractFtile.java:55 */
  private readonly skinParamField: ISkinParamWithSimple;

  /** @see AbstractFtile.java:112 */
  private cachedGeometry: FtileGeometry | undefined;

  /** @see AbstractFtile.java:57-61 */
  constructor(skinParam: ISkinParamWithSimple) {
    this.skinParamField = skinParam;
  }

  /** @see AbstractFtile.java:64-69 */
  skinParam(): ISkinParamWithSimple {
    return this.skinParamField;
  }

  /** @see AbstractFtile.java:80-82 */
  getIHtmlColorSet(): HColorSet {
    return this.skinParamField.getIHtmlColorSet();
  }

  /** @see AbstractFtile.java:114-119 */
  calculateDimension(stringBounder: StringBounder): FtileGeometry {
    this.cachedGeometry ??= this.calculateDimensionFtile(stringBounder);
    return this.cachedGeometry;
  }

  /** @see AbstractFtile.java:121-123 */
  protected invalidateGeometryCache(): void {
    this.cachedGeometry = undefined;
  }

  /** @see AbstractFtile.java:125 */
  protected abstract calculateDimensionFtile(stringBounder: StringBounder): FtileGeometry;
}
