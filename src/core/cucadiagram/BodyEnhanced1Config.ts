import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../klimt/shape/UText.js';
import type { LineBreakStrategy } from '../klimt/LineBreakStrategy.js';
import type { AtomOps } from '../klimt/creole/Sea.js';
import type { NestedDiagramRenderer } from '../EmbeddedDiagram.js';
import type { ISkinParam, Style } from '../abel/ISkinParam.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import type {
  MethodsOrFieldsAreaSkinParam,
  VisibilityModifierStyleValues,
} from './MethodsOrFieldsAreaConfig.js';

/**
 * The ADR-9 constructor-seam types for `BodyEnhanced1.ts` plus the two
 * runtime narrowing guards `BodyFactory.create1`/`create2` and
 * `BodierLikeClassOrObject#newMethodsOrFieldsArea` use to bridge the
 * upstream-shaped `(ISkinParam, Style)` inputs onto these seams. Split
 * from `BodyEnhanced1.ts` only for this repo's 500-line file cap —
 * `MethodsOrFieldsAreaConfig.ts`'s identical types-sibling precedent.
 *
 * ## Why guards instead of narrower parameter types
 *
 * Upstream's `Bodier#getBody(ISkinParam, …, Style)` signature is fixed by
 * `Bodier.ts` (T5/T7, out of this task's write-set), and its `Style` IS
 * the value resolver (`style.value(PName…)`, `style.getFontConfiguration`).
 * This port has no `Style`/`PName` cascade (ADR-2), so the resolved
 * values must arrive ON the objects passed through those upstream-shaped
 * parameters: the caller supplies a `Style` that additionally carries
 * {@link BodyEnhanced1Style}'s resolved members, and an `ISkinParam` that
 * additionally carries `MethodsOrFieldsAreaSkinParam`'s surface. The
 * guards below narrow with a descriptive ADR-2-idiom throw when a caller
 * passes a bare stub — the same "supply X" contract every landed seam
 * deferral in this mission uses (`MethodsOrFieldsArea.ts#getUBlock`,
 * `FontConfiguration.ts#create`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:78-92
 */

/** Upstream `ISkinParam skinParam` (both ctors) grouped with the ADR-9
 *  `nestedDiagramRenderer` seam (pass-through to `MethodsOrFieldsArea`,
 *  see `MethodsOrFieldsAreaConfig.ts`). `align` is upstream's first
 *  positional constructor parameter, grouped per `BodyEnhanced2Config`'s
 *  established shape. */
export interface BodyEnhanced1Config {
  readonly skinParam: MethodsOrFieldsAreaSkinParam;
  readonly align: HorizontalAlignment;
  readonly nestedDiagramRenderer?: NestedDiagramRenderer;
}

/**
 * Upstream's trailing `Style style` parameter, split into the resolved
 * reads it actually feeds (`BodyEnhanced2StyleValues`/
 * `MethodsOrFieldsAreaStyleValues` precedent). One upstream `style`
 * object feeds BOTH `BodyEnhanced1` and every `MethodsOrFieldsArea` it
 * builds, so one interface carries both consumers' reads.
 */
export interface BodyEnhanced1StyleValues {
  /** `style.value(PName.LineThickness).asDouble()` — feeds BOTH
   *  `BodyEnhancedAbstract#getDefaultThickness` (its ctor's
   *  `defaultThickness`, see `BodyEnhancedAbstract.ts`) and
   *  `MethodsOrFieldsAreaStyleValues.lineThickness` (java:84 there) —
   *  the same `PName` read off the same `style` object upstream. */
  readonly lineThickness: number;
  /** `style.value(PName.MinimumWidth).asDouble()` (BodyEnhanced1.java:
   *  180-182's `minClassWidth`). */
  readonly minimumWidth: number;
  /** `style.getFontConfiguration(skinParam.getIHtmlColorSet(),
   *  entity.getColors())` (java:80/93 — the `super(…)` `titleConfig`
   *  argument; style/Style.java:221). Consumed by `getTitle`. */
  readonly titleConfig: FontConfiguration;
  /** `style.getFontConfiguration(skinParam.getIHtmlColorSet())`
   *  (java:154 — the tree/table branch; style/Style.java:217-219
   *  delegates to `getFontConfiguration(set, null)`, so this differs
   *  from {@link titleConfig} exactly when the entity's `Colors`
   *  override the style's font color). */
  readonly treeTableFontConfig: FontConfiguration;
  /** Substitute for `FontConfiguration.create(skinParam, style,
   *  leaf.getColors())` (MethodsOrFieldsArea.java:240; klimt/font/
   *  FontConfiguration.java:213's 3-arg overload) — forwarded as
   *  `MethodsOrFieldsAreaConfig.memberFontConfig` (T8's seam). */
  readonly memberFontConfig: FontConfiguration;
  /** `style.wrapWidth()` (MethodsOrFieldsArea.java:256/265) — forwarded
   *  as `MethodsOrFieldsAreaStyleValues.wrapWidth`. */
  readonly wrapWidth: LineBreakStrategy;
  /** Pass-through to `MethodsOrFieldsAreaStyleValues.
   *  resolveVisibilityStyle` (see `MethodsOrFieldsAreaConfig.ts`). */
  readonly resolveVisibilityStyle?: (modifier: VisibilityModifier) => VisibilityModifierStyleValues;
}

/**
 * The runtime surface `BodyFactory.create1`/`create2` (and the
 * `BodierLikeClassOrObject` bridge) require of their upstream-shaped
 * `style: Style` input: the abel `Style` stub plus the resolved values,
 * plus the two ADR-9 carriers that have no upstream expression at all
 * (`atomOps` — required by every `Display#create*` call; the optional
 * embedded-diagram renderer). They ride on the style object because
 * upstream's `create1(align, rawBody, skinParam, stereotype, entity,
 * style)` positional shape (BodyFactory.java:69-72) has no parameter to
 * append them to without breaking the `Bodier#getBody` call sites.
 */
export interface BodyEnhanced1Style extends Style, BodyEnhanced1StyleValues {
  readonly atomOps: AtomOps;
  readonly nestedDiagramRenderer?: NestedDiagramRenderer;
}

/** Narrows the upstream-shaped `skinParam: ISkinParam` to the
 *  `MethodsOrFieldsAreaSkinParam` surface `BodyEnhanced1`'s
 *  `MethodsOrFieldsArea` compartments consume, checking the members
 *  BEYOND the declared parameter type (the T8 additions + the
 *  `ISkinSimple` extension deferred by T5's stub). */
export function requireBodyEnhanced1SkinParam(skinParam: ISkinParam): MethodsOrFieldsAreaSkinParam {
  const candidate = skinParam as Partial<MethodsOrFieldsAreaSkinParam>;
  if (
    typeof candidate.classAttributeIconSize === 'function' &&
    typeof candidate.getCircledCharacterRadius === 'function' &&
    typeof candidate.sheet === 'function' &&
    typeof candidate.getSprite === 'function'
  ) {
    return skinParam as MethodsOrFieldsAreaSkinParam;
  }
  throw new Error(
    'deferred per SI1/ADR-2: BodyFactory.create1/create2 need the MethodsOrFieldsAreaSkinParam ' +
      'surface (classAttributeIconSize/getCircledCharacterRadius + the ISkinSimple extension) on ' +
      'their skinParam input — supply a MethodsOrFieldsAreaSkinParam (MethodsOrFieldsAreaConfig.ts)',
  );
}

/** Narrows the upstream-shaped `style: Style` to the resolved
 *  {@link BodyEnhanced1Style} seam — see this module's doc comment. */
export function requireBodyEnhanced1Style(style: Style): BodyEnhanced1Style {
  const candidate = style as Partial<BodyEnhanced1Style>;
  if (
    typeof candidate.lineThickness === 'number' &&
    typeof candidate.minimumWidth === 'number' &&
    candidate.titleConfig !== undefined &&
    candidate.treeTableFontConfig !== undefined &&
    candidate.memberFontConfig !== undefined &&
    candidate.wrapWidth !== undefined &&
    candidate.atomOps !== undefined
  ) {
    return style as BodyEnhanced1Style;
  }
  throw new Error(
    'deferred per SI1/ADR-2: BodyFactory.create1/create2 need the resolved BodyEnhanced1Style ' +
      'values (lineThickness/minimumWidth/titleConfig/treeTableFontConfig/memberFontConfig/' +
      'wrapWidth/atomOps) on their style input — this port has no Style/PName cascade to resolve ' +
      'them from (BodyEnhanced1Config.ts)',
  );
}
