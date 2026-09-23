/**
 * `ClassGeometry` -- split out of `class-geo-types.ts` (500-line hook cap,
 * cdd-T17: the `EdgeGeo.roleLines` field pushed it back over after the
 * cdd-T6 split already once cleared it). A pure move: the interface below
 * is unchanged, and `class-geo-types.ts` re-exports it so no consumer's
 * import path changed -- same precedent as that file's own `NamespaceGeo`/
 * `JsonBodyItem` splits.
 */
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { EdgeGeo } from './class-geo-types.js';
import type { NamespaceGeo } from './class-geo-namespace-types.js';
import type { ClassLeafGeo } from './class-leaf-geo.js';
import type { JsonBodyItem } from './class-geo-json-types.js';

export interface ClassGeometry {
  /** cdd-T3 (A1 SB5): `class-directives-removal.ts#computeRemovedRanks`'s output (see its doc comment). */
  removedRanks?: readonly number[];
  totalWidth: number;
  totalHeight: number;
  /**
   * G2 N46: the PRE-`CucaDiagram#getDefaultMargins()`/`SvgGraphics
   * #ensureVisible` ink-walk dims (`layout-ink-extent.ts
   * #computeClassRawInkDims`) -- what jar's `DiagramChromeFactory.create`
   * receives as `raw` and every `DecorateEntityImage#getTextX` centering
   * computation runs against, DISTINCT from `totalWidth`/`totalHeight`
   * (post-margin, post-quirk -- the correct value for a NO-chrome canvas).
   * Optional: `assembleShiftedGeometry`'s main DOT-driven path AND
   * `class-geo-builders.ts#degenerateSingleClassifier` (G2 N48, item 24's
   * first of 3 named sub-cases) both set it. The empty-diagram sentinel and
   * `layoutMultiPage`'s page-stacking combiner still leave it `undefined`
   * -- `renderer.ts#renderClass` and `index.ts#applyAnnotationChrome`'s
   * class branch fall back to `totalWidth`/`totalHeight` in that case
   * (today's behavior, unchanged; named remainder, not chased this
   * iteration -- see `plans/g2-class-svg/ledger.md` N48).
   */
  rawWidth?: number;
  rawHeight?: number;
  edges: EdgeGeo[];
  namespaces: NamespaceGeo[];
  /** Single leaf collection, replacing `classifiers`/`notes` (T3) -- see `class-leaf-geo.ts`'s doc comment for jar mechanism + draw-order. */
  leaves: ClassLeafGeo[];
  /**
   * SI14 T3: the SAME `StringMeasurer` instance `SyncPlugin.layoutSync`
   * received, carried onto the geometry for the same reason `errors` above
   * `index.ts#classPlugin.layoutSync` is: `SyncPlugin.render(geo, theme)`
   * (`dispatcher.ts`) only receives the geo, not the measurer, so a
   * draw-time consumer that needs to measure text (T4: USymbol label
   * placement via the faithful `TextBlock` tree, mirroring the description
   * engine's `EntityImageDescriptionSupport.ts#buildTextBlock` precedent)
   * has nowhere else to get one. Set unconditionally by `index.ts`'s
   * `layoutSync` on every real `parseClass()`-driven diagram; optional only
   * so pre-existing hand-built `ClassGeometry` test fixtures that bypass
   * `layoutClass`/`layoutSync` entirely (unit tests constructing a geo
   * literal directly) compile unchanged.
   */
  measurer?: StringMeasurer;
  /**
   * SI14 T3: this diagram's `sprite $name { ... }` definitions, copied
   * unchanged from `ClassDiagramAST.sprites` (`ast.ts`'s doc comment) by
   * the same `layoutSync` spread as {@link measurer} above -- mirrors the
   * description engine's identical `ast.sprites` -> geo `sprites`
   * passthrough (`description/layout.ts:487`). Omitted (not merely
   * `undefined`) when the diagram declares no sprites, matching every
   * other optional field in this file.
   */
  sprites?: SpriteRegistry;
  /**
   * cdd-T29 round 2 (D4): the resolved `scale ...` factor `layoutClass`
   * computed (`resolveScaleFactor`), carried onto the geometry for the SAME
   * reason `measurer`/`sprites` above are: `SyncPlugin.render(geo, theme)`
   * (`dispatcher.ts`) only receives the geo, and `index.ts`'s own
   * `render(geo, theme)` call site (outside this task's write-set) passes
   * the UNSCALED `theme` unchanged -- `renderer.ts#renderClass` is the one
   * remaining seam that can turn it into a `ScaledTheme`
   * (`class-scale-geo.ts#scaleClassTheme`) for every render-time
   * pixel-literal constant this port's class renderer carries (box/divider
   * border stroke-width, badge radius, round-corner, arrowhead geometry,
   * dash patterns, ...) that has no OTHER geo-side field to scale, unlike
   * `ClassifierGeo.rows[].fontSize`'s own materialized-fallback precedent.
   * Absent (or `1`) is a true no-op: `scaleClassGeometry` only ever sets
   * this when `k !== 1`, and every reader falls back to `1` via `??`.
   */
  scaleK?: number;
  /**
   * cdd-T34 (E14 `newpage`): one entry per page `layoutMultiPage`
   * (`class-layout-multipage.ts`) stacked into this geometry, in page
   * order — the STACKED `y` this page's leaves/namespaces/edges were
   * shifted by, plus that page's OWN pre-stack `width`/`height` (each page
   * is a fully independent `CucaDiagram`, `NewpagedDiagram.java:87-162`,
   * so widths differ page to page and `totalWidth` alone cannot recover
   * one page's own canvas size). `class-layout-multipage.ts#sliceClassGeometryPage`
   * is the sole reader: it filters `leaves`/`edges`/`namespaces` by which
   * page's `[y, y + height)` band a leaf/namespace's own `y` (an edge's
   * first point's `y`) falls into, then shifts everything back by `-y` to
   * reproduce that page's standalone geometry, matching `layoutSinglePage`
   * byte-for-byte (verified: `tests/unit/class/class-newpage-layout.test.ts`'s
   * own G2 N28 harness already reaches this exact equivalence via a
   * different route -- stripping `ast.pages` and re-laying-out page 0
   * alone). Only ever set by `layoutMultiPage`; absent (not `undefined`
   * via `??`, genuinely omitted) for every single-page diagram — the
   * overwhelming common case pays zero cost. `layoutClass`/`scaleClassGeometry`
   * scale each entry's `y`/`width`/`height` by the SAME `k` as every other
   * geometric field when `scale ...` is present (D4).
   */
  pageBoundaries?: readonly ClassPageBoundary[];
}

/** One page's stacked position + own standalone dimension — see
 *  {@link ClassGeometry.pageBoundaries}'s doc comment. */
export interface ClassPageBoundary {
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// cdd-T6: `JsonBodyItem` is re-exported alongside `ClassGeometry` purely
// because both used to live in the same block of `class-geo-types.ts`
// before this split -- see `class-geo-types.ts`'s own re-export of this
// same name for the canonical import path every consumer uses.
export type { JsonBodyItem };
