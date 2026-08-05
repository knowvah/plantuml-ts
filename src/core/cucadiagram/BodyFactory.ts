import type { Display } from '../klimt/creole/Display.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { AtomOps } from '../klimt/creole/Sea.js';
import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import type { Entity } from '../abel/Entity.js';
import type { ISkinParam, Style } from '../abel/ISkinParam.js';
import type { Member } from './Member.js';
import { BodyEnhanced2, type BodyEnhanced2Config, type BodyEnhanced2StyleValues } from './BodyEnhanced2.js';

/**
 * BodyFactory — `create3` ONLY (ADR-10,
 * `plans/bodyenhanced-atom-seams/decisions.md`).
 *
 * Upstream: cucadiagram/BodyFactory.java (84 lines, 5 static members:
 * `createLeaf`, `createGroup`, `create1`, `create2`, `create3`, plus the
 * `BODY3` flag).
 *
 * ## What is deliberately absent, and why
 *
 * - **`createLeaf`/`createGroup`** — return `Bodier`, the class/object
 *   member-model builder this mission's own README places out of scope
 *   as mission SI1's work (`CucaDiagram`/`Entity`/`Bodier`/the 40-file
 *   `skin/` package, ADR-10's ≈12,100-line cascade).
 * - **`BODY3`** — permanently out of scope: `BodyFactory.BODY3 = false`
 *   (java:56) is a dead flag read only by `BodierLikeClassOrObject
 *   .java:212` (`if (false)` forever). Recorded in
 *   `.agent-notes/T2b-body-classes.md` and re-verified.
 *   **`create1`** — the "no reachable caller" claim above's era ended
 *   with SI1: T7 ported `BodierSimple`/`BodierLikeClassOrObject`, whose
 *   `getBody` calls `create1`; it is declared below as a typed
 *   throws-deferred hook that SI1 batch-4/T9 (`BodyEnhanced1`) fills.
 * - **`create2`** — routes to `BodyEnhanced1`, which (via `buildTextBlock`
 *   -> `MethodsOrFieldsArea`) pulls in the SAME SI1-scoped cascade as
 *   `createLeaf`/`createGroup` above. ADR-10 moves `create2` to mission
 *   SI1's `T2b-2`, alongside `BodyEnhanced1`/`MethodsOrFieldsArea`/
 *   `CucaDiagram`/`Entity`/`Bodier`/the skin subsystem -- ported ONCE,
 *   there, not split across two missions. This is a deliberate mission
 *   boundary, not a gap: do not add `create2` here without re-opening
 *   ADR-10.
 *
 * `create3`'s upstream trailing `Style style` param is adapted to
 * `BodyEnhanced2Config`/`BodyEnhanced2StyleValues` + a trailing `atomOps` --
 * see `BodyEnhanced2.ts`'s own doc comment for the full derivation (ADR-8
 * corollary / ADR-9).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyFactory.java
 */
export const BodyFactory = {
  /** java:68-71 — TYPED THROWS-DEFERRED HOOK (SI1/T7): the real body
   *  (`return new BodyEnhanced1(align, rawBody, skinParam, entity, style)`)
   *  lands with SI1 batch-4/T9 (`BodyEnhanced1`), which fills this hook.
   *  Declared now because SI1/T7's `BodierSimple#getBody`/
   *  `BodierLikeClassOrObject#getBody` delegate here exactly as upstream
   *  does (BodierSimple.java:84-88, BodierLikeClassOrObject.java:215-233).
   *  `List<CharSequence> rawBody` carries plain lines OR `Member`s
   *  (`rawBodyWithoutHidden`), hence the union. Journaled (SI1 decision
   *  journal, T7 — deferred-throw per T5's precedent; ADR-10's earlier
   *  "create1 has no reachable caller" note is superseded by SI1's ADR-1
   *  full-Bodier port, per SI1 README batch 4. The `stereotype` param is
   *  unused upstream too (passed and dropped). */
  create1(
    _align: HorizontalAlignment,
    _rawBody: readonly (string | Member)[],
    _skinParam: ISkinParam,
    _stereotype: Stereotype | undefined,
    _entity: Entity | undefined,
    _style: Style,
  ): TextBlock {
    throw new Error('BodyFactory.create1: deferred to SI1 batch-4/T9 (BodyEnhanced1 not yet ported)');
  },

  /** java:78-81. Upstream's 6 flat params (`rawBody, skinParam, align, fc,
   *  lineBreakStrategy, style`) collapse 1:1 onto `BodyEnhanced2`'s own
   *  already-grouped constructor (`skinParam`/`align`/`fc`-as-`titleConfig`/
   *  `lineBreakStrategy` -> {@link BodyEnhanced2Config}, `style` -> {@link
   *  BodyEnhanced2StyleValues}) -- see `BodyEnhanced2.ts`'s doc comment. */
  create3(rawBody: Display, config: BodyEnhanced2Config, styleValues: BodyEnhanced2StyleValues, atomOps: AtomOps): TextBlock {
    return new BodyEnhanced2(rawBody, config, styleValues, atomOps);
  },
};
