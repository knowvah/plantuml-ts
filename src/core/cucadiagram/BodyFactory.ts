import type { Display } from '../klimt/creole/Display.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { AtomOps } from '../klimt/creole/Sea.js';
import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import type { Entity } from '../abel/Entity.js';
import type { ISkinParam, Style } from '../abel/ISkinParam.js';
import { LeafType, isLikeClass } from '../abel/LeafType.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import type { Bodier } from './Bodier.js';
import type { Member } from './Member.js';
import { BodierLikeClassOrObject } from './BodierLikeClassOrObject.js';
import { BodierSimple } from './BodierSimple.js';
import { BodyEnhanced1 } from './BodyEnhanced1.js';
import { requireBodyEnhanced1SkinParam, requireBodyEnhanced1Style } from './BodyEnhanced1Config.js';
import { BodyEnhanced2, type BodyEnhanced2Config, type BodyEnhanced2StyleValues } from './BodyEnhanced2.js';

/**
 * BodyFactory — complete as of SI1 batch-4/T9 (`createLeaf`,
 * `createGroup`, `create1`, `create2`, `create3`; upstream's 5 static
 * members plus the `BODY3` flag, which stays deliberately absent).
 *
 * History: ADR-10 (`plans/bodyenhanced-atom-seams/decisions.md`) scoped
 * this file to `create3` only and deferred the rest to mission SI1; SI1
 * T7 declared `create1` as a typed throws-deferred hook for its
 * `Bodier#getBody` ports; T9 (this task) landed `BodyEnhanced1` and
 * filled `create1`/`create2`/`createLeaf`/`createGroup`.
 *
 * - **`BODY3`** — permanently out of scope: `BodyFactory.BODY3 = false`
 *   (java:56) is a dead flag read only by `BodierLikeClassOrObject
 *   .java:212` (`if (false)` forever). Recorded in
 *   `.agent-notes/T2b-body-classes.md` and re-verified.
 * - **`create1`/`create2`** — upstream's trailing `Style style` is the
 *   value resolver this port does not have (ADR-2: no `Style`/`PName`
 *   cascade), so both narrow their upstream-shaped `(ISkinParam, Style)`
 *   inputs to the resolved ADR-9 seam surfaces at runtime — see
 *   `BodyEnhanced1Config.ts`'s module doc comment for the full contract
 *   and why the values ride on the `style` object.
 * - **`create3`**'s upstream trailing `Style style` param is adapted to
 *   `BodyEnhanced2Config`/`BodyEnhanced2StyleValues` + a trailing
 *   `atomOps` — see `BodyEnhanced2.ts`'s own doc comment (ADR-8
 *   corollary / ADR-9).
 *
 * The import cycle with `BodierSimple`/`BodierLikeClassOrObject` (they
 * call `create1`; `createLeaf` constructs them) mirrors upstream's own
 * class cycle and is safe here: every cross-reference is inside a
 * function body, never at module-evaluation time.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyFactory.java
 */
export const BodyFactory = {
  /** java:58-63 — class-like or OBJECT leaves get the field/method
   *  model; everything else (and `MAP`/`JSON`, which are neither) gets
   *  `BodierSimple`. The `MAP` rejection upstream keeps lives in
   *  `BodierLikeClassOrObject`'s own constructor (java:74-76 there),
   *  unreachable through this routing — exactly as upstream. */
  createLeaf(skinParam: ISkinParam, type: LeafType, hideVisibilityModifier: ReadonlySet<VisibilityModifier> | null): Bodier {
    if (isLikeClass(type) || type === LeafType.OBJECT) return new BodierLikeClassOrObject(type, hideVisibilityModifier);

    return new BodierSimple(skinParam);
  },

  /** java:65-67. */
  createGroup(skinParam: ISkinParam): Bodier {
    return new BodierSimple(skinParam);
  },

  /** java:69-72 — `new BodyEnhanced1(align, rawBody, skinParam, entity,
   *  style)`, the `List<CharSequence>` constructor (`lineFirst=true`).
   *  `List<CharSequence> rawBody` carries plain lines OR `Member`s
   *  (`rawBodyWithoutHidden`), hence the union. The `stereotype` param
   *  is unused upstream too (passed and dropped). `entity` is typed
   *  optional by the T7 hook's callers (`BodierAbstract#leaf` before
   *  `setLeaf`); upstream NPEs inside the constructor's
   *  `entity.getColors()` super-call — surfaced here as the explicit
   *  NPE throw (project convention). */
  create1(
    align: HorizontalAlignment,
    rawBody: readonly (string | Member)[],
    skinParam: ISkinParam,
    _stereotype: Stereotype | undefined,
    entity: Entity | undefined,
    style: Style,
  ): TextBlock {
    if (entity === undefined) throw new Error('NullPointerException');
    const seamSkinParam = requireBodyEnhanced1SkinParam(skinParam);
    const seamStyle = requireBodyEnhanced1Style(style);
    return new BodyEnhanced1(
      rawBody,
      {
        skinParam: seamSkinParam,
        align,
        ...(seamStyle.nestedDiagramRenderer !== undefined && { nestedDiagramRenderer: seamStyle.nestedDiagramRenderer }),
      },
      entity,
      seamStyle,
      seamStyle.atomOps,
    );
  },

  /** java:74-77 — `new BodyEnhanced1(align, display, skinParam, entity,
   *  style)`, the `Display` constructor (`lineFirst=false`, the
   *  usecase-ellipse handling): the folder/package title route T12
   *  un-narrows onto (ADR-4). Same seam narrowing as {@link create1}. */
  create2(
    align: HorizontalAlignment,
    display: Display,
    skinParam: ISkinParam,
    _stereotype: Stereotype | undefined,
    entity: Entity | undefined,
    style: Style,
  ): TextBlock {
    if (entity === undefined) throw new Error('NullPointerException');
    const seamSkinParam = requireBodyEnhanced1SkinParam(skinParam);
    const seamStyle = requireBodyEnhanced1Style(style);
    return new BodyEnhanced1(
      display,
      {
        skinParam: seamSkinParam,
        align,
        ...(seamStyle.nestedDiagramRenderer !== undefined && { nestedDiagramRenderer: seamStyle.nestedDiagramRenderer }),
      },
      entity,
      seamStyle,
      seamStyle.atomOps,
    );
  },

  /** java:79-82. Upstream's 6 flat params (`rawBody, skinParam, align, fc,
   *  lineBreakStrategy, style`) collapse 1:1 onto `BodyEnhanced2`'s own
   *  already-grouped constructor (`skinParam`/`align`/`fc`-as-`titleConfig`/
   *  `lineBreakStrategy` -> {@link BodyEnhanced2Config}, `style` -> {@link
   *  BodyEnhanced2StyleValues}) -- see `BodyEnhanced2.ts`'s doc comment. */
  create3(rawBody: Display, config: BodyEnhanced2Config, styleValues: BodyEnhanced2StyleValues, atomOps: AtomOps): TextBlock {
    return new BodyEnhanced2(rawBody, config, styleValues, atomOps);
  },
};
