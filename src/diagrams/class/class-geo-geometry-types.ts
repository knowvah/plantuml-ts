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
}

// cdd-T6: `JsonBodyItem` is re-exported alongside `ClassGeometry` purely
// because both used to live in the same block of `class-geo-types.ts`
// before this split -- see `class-geo-types.ts`'s own re-export of this
// same name for the canonical import path every consumer uses.
export type { JsonBodyItem };
