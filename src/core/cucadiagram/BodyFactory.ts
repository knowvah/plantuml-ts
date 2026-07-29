import type { Display } from '../klimt/creole/Display.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { AtomOps } from '../klimt/creole/Sea.js';
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
 * - **`create1`/`BODY3`** — confirmed permanently out of scope, not
 *   merely deferred: `BodyFactory.BODY3 = false` (java:56) is a dead flag
 *   read only by `BodierLikeClassOrObject.java:212`, and `create1`'s only
 *   real callers (grep-verified against `~/git/plantuml`) are the
 *   SI1-excluded `Bodier*` classes -- so neither has a reachable caller
 *   even once SI1 lands `Bodier`, since `Body3`'s own upstream code path
 *   is permanently `if (false)`. Recorded in
 *   `.agent-notes/T2b-body-classes.md` (the earlier T2b attempt) and
 *   re-verified here.
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
  /** java:78-81. Upstream's 6 flat params (`rawBody, skinParam, align, fc,
   *  lineBreakStrategy, style`) collapse 1:1 onto `BodyEnhanced2`'s own
   *  already-grouped constructor (`skinParam`/`align`/`fc`-as-`titleConfig`/
   *  `lineBreakStrategy` -> {@link BodyEnhanced2Config}, `style` -> {@link
   *  BodyEnhanced2StyleValues}) -- see `BodyEnhanced2.ts`'s doc comment. */
  create3(rawBody: Display, config: BodyEnhanced2Config, styleValues: BodyEnhanced2StyleValues, atomOps: AtomOps): TextBlock {
    return new BodyEnhanced2(rawBody, config, styleValues, atomOps);
  },
};
