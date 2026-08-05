import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../klimt/shape/UText.js';
import type { LineBreakStrategy } from '../klimt/LineBreakStrategy.js';
import type { NestedDiagramRenderer } from '../EmbeddedDiagram.js';
import type { ISkinParam } from '../abel/ISkinParam.js';
import type { ISkinSimple } from '../style/ISkinSimple.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import type { Paint } from '../paint.js';

/**
 * The ADR-9 constructor-seam types for `MethodsOrFieldsArea.ts` — the
 * substitutes for upstream's `(ISkinParam skinParam, HorizontalAlignment
 * align, …, Style style)` constructor surface, grouped per
 * `BodyEnhanced2Config`/`BodyEnhanced2StyleValues`'s established
 * precedent (`BodyEnhanced2.ts`). Split from `MethodsOrFieldsArea.ts`
 * only for this repo's 500-line file cap (types-only sibling; no
 * behavior lives here).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:97-107
 */

/** The `ISkinParam` surface `MethodsOrFieldsArea` consumes. Upstream
 *  `style/ISkinParam extends ISkinSimple`; T5's consumed-slice stub
 *  (`abel/ISkinParam.ts`) deliberately deferred that extension "until a
 *  consumer reaches the ISkinSimple surface through this seam" —
 *  `MethodsOrFieldsArea` is that consumer (it passes `skinParam` as
 *  `create8`'s `spriteContainer` and reads `getPragma`), and it
 *  additionally reads `classAttributeIconSize` (java:126, 244, 366) and
 *  `getCircledCharacterRadius` (java:157, 388, 399). Declared here as a
 *  derived interface rather than widening `abel/ISkinParam.ts` in place:
 *  adding required members there would break `implements ISkinParam`
 *  mocks in T5's test helper (`tests/unit/core/abel/helpers.ts`), a
 *  shared file T6/T7 may be editing in parallel this batch. Consolidate
 *  onto `abel/ISkinParam.ts` in a sequential batch (reported, SI1/T8).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/ISkinParam.java */
export interface MethodsOrFieldsAreaSkinParam extends ISkinParam, ISkinSimple {
  /** @see style/ISkinParam.java#classAttributeIconSize */
  classAttributeIconSize(): number;
  /** @see style/ISkinParam.java#getCircledCharacterRadius */
  getCircledCharacterRadius(): number;
}

/** Upstream `ISkinParam skinParam, HorizontalAlignment align` plus the
 *  two ADR-9 substitutes that cannot be derived without the unported
 *  style/font machinery. */
export interface MethodsOrFieldsAreaConfig {
  readonly skinParam: MethodsOrFieldsAreaSkinParam;
  /** Upstream's 4-arg constructor overload (java:97-99) passes
   *  `HorizontalAlignment.LEFT`; omitting `align` reproduces it. */
  readonly align?: HorizontalAlignment;
  /** Substitute for `FontConfiguration.create(skinParam, style,
   *  leaf.getColors())` (java:240; klimt/font/FontConfiguration.java:213
   *  — the 3-arg overload): the resolved member-row font. The full
   *  `FontConfiguration` class is unported (`abel/FontConfiguration.ts`'s
   *  own deferral note); this is the same `UText.ts` structural
   *  configuration `BodyEnhanced2Config.titleConfig` uses. */
  readonly memberFontConfig: FontConfiguration;
  /** `EmbeddedDiagram.createAndSkip`'s port requires a
   *  `NestedDiagramRenderer` (that file's documented seam). Only consumed
   *  when `members` actually contains an embedded diagram block; absent
   *  in that case, the constructor throws (typed deferral, ADR-2). */
  readonly nestedDiagramRenderer?: NestedDiagramRenderer;
}

/** Upstream's trailing `Style style` parameter, split into the scalar
 *  reads it actually feeds (ADR-2; `BodyEnhanced2StyleValues` precedent). */
export interface MethodsOrFieldsAreaStyleValues {
  /** `style.value(PName.LineThickness).asDouble()` (java:84). */
  readonly lineThickness: number;
  /** `style.wrapWidth()` (java:256, 265). */
  readonly wrapWidth: LineBreakStrategy;
  /** Substitute for java:360-364's per-modifier style resolution
   *  (`modifier.getStyleSignature().getMergedStyle(skinParam
   *  .getCurrentStyleBuilder())` + `PName.LineColor`/`BackGroundColor`
   *  `.asColor(skinParam.getIHtmlColorSet())`) — the merged-style cascade
   *  is unported (ADR-2). Only consumed by `getUBlock` on the RENDER
   *  half (`drawU`/`getInnerPosition` layouts with icons present);
   *  absent there, `getUBlock` throws (typed deferral). Sizing paths
   *  never reach it (java:154-177 reads only the icon ZONE width). */
  readonly resolveVisibilityStyle?: (modifier: VisibilityModifier) => VisibilityModifierStyleValues;
}

/** The two `PName` reads java:361-364 resolves off the modifier's merged
 *  style. The `isField ? null : …` back-color branch stays in
 *  `MethodsOrFieldsArea#getUBlock`, faithfully — this seam mirrors only
 *  the raw value resolution. */
export interface VisibilityModifierStyleValues {
  /** `style.value(PName.LineColor).asColor(...)` (java:361). */
  readonly lineColor: Paint;
  /** `style.value(PName.BackGroundColor).asColor(...)` (java:363-364). */
  readonly backGroundColor: Paint;
}
