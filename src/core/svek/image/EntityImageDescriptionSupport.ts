/**
 * EntityImageDescriptionSupport — module-level helpers for
 * `EntityImageDescription.ts`, extracted purely to stay under this
 * project's 500-line complexity-hook ceiling (see this project's
 * established "500-line splits" workaround — `EntityImageDescription.ts`
 * itself carries the full port narrative and adaptation-seam citations;
 * this file is pure implementation, not a separate upstream unit).
 *
 * Contains: `ShapeType`/`Margins` (upstream: svek/ShapeType.java,
 * svek/Margins.java) and the symbol-resolution seam
 * (`resolveDescriptionUSymbol`/`resolveUSymbol`/`resolveShapeType`). Every
 * private instance-method body `EntityImageDescription` delegates to
 * (`buildDesc`, `buildStereo`, the three link-scanning helpers,
 * `computeShieldMargins`, `hideTextOffsets`, `requireGroups`) moved to the
 * sibling `EntityImageDescriptionDelegates.ts` (E2r/L1, mechanical split —
 * see that file's doc comment) once this file grew past the 500-line
 * ceiling to accommodate the ported creole stripe/atom pipeline; the
 * text-construction seam (`buildTextBlock` and its helpers — this port's
 * scoped substitute for `BodyFactory.create2`/`create3`) later moved the
 * SAME way, to `EntityImageDescriptionTextBlock.ts` (svg-sprite-nanoparser
 * T9, mechanical split — that file's doc comment), when widening
 * `drawAtoms`'s `drawable` branch pushed this file back over the ceiling.
 * `measureLine`/`buildTextBlock` are re-exported below so every external
 * import path is unchanged.
 *
 * E2r/L1 (mission `plans/e2r-creole/`): `buildTextBlock`'s per-line
 * measure/draw now goes through `klimt/creole`'s ported stripe/atom
 * pipeline (`classifyStripeLine` + `buildStripeAtoms`) instead of the old
 * single-`UText`-per-line path — one `<text>` element per STYLED RUN,
 * matching the jar's own SVG element structure, plus per-line `==` heading
 * font cascade (I4c mechanism 2/5). `classifySeparatorLine` (G1 I9b) is
 * SUBSUMED by `classifyStripeLine` (see that module's doc comment for the
 * exact behavior-preservation argument, including why a non-empty
 * `--Header--`-shaped line still falls through to plain NORMAL text).
 */
import type { UShape } from '../../klimt/UShape.js';
import type { USymbol } from '../../decoration/symbol/USymbol.js';
import { USymbols, componentStyleToUSymbol } from '../../decoration/symbol/USymbols.js';
import type { ComponentStyle } from '../../decoration/symbol/USymbols.js';
import type { ActorStyle } from '../../skin/ActorStyle.js';
import type { EntityImageDescriptionSymbol } from './EntityImageDescription.js';

export { measureLine, buildTextBlock } from './EntityImageDescriptionTextBlock.js';

/** The geometric family svek/layout branches on. Upstream:
 *  svek/ShapeType.java (12-value `enum`); only the 5 values this file's
 *  sibling can produce are ported (as-const object — no `const enum`). */
export const ShapeType = {
  RECTANGLE: 'RECTANGLE',
  RECTANGLE_WITH_CIRCLE_INSIDE: 'RECTANGLE_WITH_CIRCLE_INSIDE',
  FOLDER: 'FOLDER',
  HEXAGON: 'HEXAGON',
  OVAL: 'OVAL',
} as const;
export type ShapeType = (typeof ShapeType)[keyof typeof ShapeType];

/** The (x1,x2,y1,y2) "shield" padding `getShield` reports so a
 *  magnetic-border-avoiding link steers clear of a lollipop interface's
 *  out-of-band title/stereotype text. Upstream: svek/Margins.java,
 *  ported in full. */
export class Margins {
  static readonly NONE = new Margins(0, 0, 0, 0);

  constructor(
    private readonly x1: number,
    private readonly x2: number,
    private readonly y1: number,
    private readonly y2: number,
  ) {}

  static uniform(value: number): Margins { return new Margins(value, value, value, value); }
  toString(): string { return `MARGIN[${this.x1},${this.x2},${this.y1},${this.y2}]`; }
  merge(o: Margins): Margins {
    return new Margins(Math.max(this.x1, o.x1), Math.max(this.x2, o.x2), Math.max(this.y1, o.y1), Math.max(this.y2, o.y2));
  }
  isZero(): boolean { return this.x1 === 0 && this.x2 === 0 && this.y1 === 0 && this.y2 === 0; }
  getX1(): number { return this.x1; }
  getX2(): number { return this.x2; }
  getY1(): number { return this.y1; }
  getY2(): number { return this.y2; }
  getTotalWidth(): number { return this.x1 + this.x2; }
  getTotalHeight(): number { return this.y1 + this.y2; }
}

/** A `UShape` that also exposes `setDeltaShadow` — the surface
 *  `EntityImageDescription#drawHexagon` needs off `bibliotekon
 *  .getNode(entity).getPolygon()` (upstream: a `Shadowable` polygon). */
export interface HexagonPolygon extends UShape {
  setDeltaShadow(deltaShadow: number): void;
}

// ---------------------------------------------------------------------------
// Symbol resolution — see EntityImageDescription.ts's doc comment
// ("Symbol-resolution seam")
// ---------------------------------------------------------------------------

/**
 * Keyword string to `USymbol`, collapsing `CommandCreateElementFull
 * .java`'s keyword dispatch with `Entity#getUSymbol()`'s leafType
 * fallback. `null` return means "no explicit symbol" (upstream:
 * `entity.getUSymbol() == null`) — caller falls back to
 * {@link componentStyleToUSymbol}. `portin`/`portout`/`port` also
 * resolve to `null`: upstream never resolves a `USymbol` for ports
 * (`EntityImagePort` draws them — out of scope).
 */
export function resolveDescriptionUSymbol(
  keyword: string | null,
  actorStyle: ActorStyle,
  componentStyle: ComponentStyle,
): USymbol | null {
  if (keyword === null) return null;
  const lower = keyword.toLowerCase();
  if (lower === 'usecase') return USymbols.USECASE;
  if (lower === 'usecase/') return USymbols.USECASE_BUSINESS;
  if (lower === 'circle') return USymbols.INTERFACE;
  if (lower === 'portin' || lower === 'portout' || lower === 'port') return null;
  return USymbols.fromString(keyword, { actorStyle: () => actorStyle, componentStyle: () => componentStyle });
}

/** Upstream: `EntityImageDescription#getUSymbol(Entity)`. */
export function resolveUSymbol(symbolInfo: EntityImageDescriptionSymbol): USymbol {
  const explicit = resolveDescriptionUSymbol(symbolInfo.keyword, symbolInfo.actorStyle, symbolInfo.componentStyle);
  return explicit ?? componentStyleToUSymbol(symbolInfo.componentStyle);
}

/** Upstream: the `shapeType` if/else-if chain inside the constructor. */
export function resolveShapeType(symbol: USymbol, fixCircleLabelOverlapping: boolean): ShapeType {
  if (symbol === USymbols.FOLDER || symbol === USymbols.PACKAGE) return ShapeType.FOLDER;
  if (symbol === USymbols.HEXAGON) return ShapeType.HEXAGON;
  if (symbol === USymbols.USECASE || symbol === USymbols.USECASE_BUSINESS) return ShapeType.OVAL;
  if (symbol === USymbols.INTERFACE) {
    return fixCircleLabelOverlapping ? ShapeType.RECTANGLE_WITH_CIRCLE_INSIDE : ShapeType.RECTANGLE;
  }
  return ShapeType.RECTANGLE;
}
