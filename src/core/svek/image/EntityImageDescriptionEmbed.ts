/**
 * EntityImageDescriptionEmbed — the `{{ ... }}` embedded-diagram
 * `NestedDiagramRenderer` `EntityImageDescriptionDelegates.ts#buildDesc`'s
 * `create3` pipeline wires into `ISkinSimple.sheet()`.
 *
 * Split out of `EntityImageDescriptionDelegates.ts` (T2b, ink-walk-reuses-
 * draw) purely to stay under this project's 500-line complexity-hook
 * ceiling -- this project's established "500-line splits" workaround, same
 * precedent as the `EntityImageDescriptionSupport.ts`/
 * `EntityImageDescriptionShield.ts` splits that file's own doc comment
 * documents. Zero behavior change from the move itself.
 *
 * ## T2b (tefeco-12-rato895 mechanism (a)) -- diagnosed, NOT fixed here
 *
 * `LimitFinder.java:99-100`'s `matchesProperty` delegates to the ink
 * bounder (false, the oracle's `StringBounderFromWidthTable`), so
 * `EmbeddedDiagram#drawU`'s own `ug.matchesProperty("SVG")` (java:169) is
 * ALSO false during the jar's ink pass -- the raster arm throws (java:180)
 * and its catch (java:191-193) draws NOTHING. Only the REAL `UGraphicSvg`
 * pass (`matchesProperty` true) draws the embed. This port's
 * `drawn.drawU(ug)` below draws unconditionally, so the ink walk
 * (`leaf-sizing-entity.ts#measureEntityLeafInk`'s `LimitFinder`) sees a
 * real `UImage` the jar's own ink pass never does (`LimitFinder.ts
 * #drawImage`'s `x+w-1,y+h-1` rule) -- measured contributor to tefeco's
 * canvas Δ12 (`symbolInk.maxX` 217 = the label's own 10 + the embed's
 * 208-1, `diagnosis/verify.md`).
 *
 * **Ruled out (measured, this task):** gating this `drawU` on
 * `ug.getStringBounder() instanceof MeasurerStringBounder` (this port's
 * structural analogue of `matchesProperty`) to skip the draw during the
 * ink pass. Two things were tried and both regressed:
 * - Suppress + a `UEmpty` reservation at the embed's real corner (mirror
 *   `SvgGraphics#ensureVisible`, java:1033-1034): regressed
 *   `unknown/gubeca-19-lemu434`/`unknown/jixibu-01-xave465` by +1 (211->212,
 *   `UEmpty`'s plain `x+w,y+h` corner has no `-1`, unlike the `UImage` rule
 *   those two rows already matched jar through) and tefeco by +1 more
 *   (279->280) -- proves the embed's OWN ink, via the ordinary `UImage`
 *   rule, is exactly right for gubeca/jixibu, so ANY different corner rule
 *   for the SAME shape is a regression, not a fix.
 * - Suppress with NO replacement ink at all: catastrophic --
 *   `unknown/gubeca-19-lemu434` collapsed 211->166, `unknown/jixibu-01-xave465`
 *   211->127, and `unknown/tefeco-12-rato895`'s `artifact.card.label` leaf
 *   (whose ONLY drawn content IS the embed) lost 100% of its ink, producing
 *   an empty `MinMax` that propagated as `Infinity` through the whole
 *   document canvas. This port's `computeClassDocumentDims` derives the
 *   ENTIRE canvas from the ink walk (`layout-ink-extent.ts`'s own doc
 *   comment) -- there is no separate real-draw bounds tracker upstream's
 *   `SvgGraphics#ensureVisible` has, so removing this ink with nothing to
 *   replace it removes the ONLY channel some leaves have.
 *
 * Both experiments confirm the embed's ink is load-bearing for THIS port's
 * canvas computation in a way a uniform ink-pass suppression cannot safely
 * replace without a per-leaf-aware replacement channel (why the embed's
 * ink matters for gubeca/jixibu's CORRECT canvas but is 12px too much for
 * tefeco's is itself unresolved) -- **open -> cdd7**, not fixed in this
 * task. `drawU` is therefore left unconditional, matching pre-T2b
 * behavior exactly.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/EmbeddedDiagram.java:126-152,165-195
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:99-100
 */
import type { XDimension2D } from '../../klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../klimt/shape/TextBlock.js';
import type { NestedDiagramRenderer } from '../../EmbeddedDiagram.js';
import { getNestedDiagramRenderer } from '../../nested-diagram-registry.js';

/**
 * `EmbeddedDiagram`'s two arms for a description label, split the way the
 * oracle jar splits them. SIZE: `calculateDimensionSlow` takes the SVG arm
 * only when `stringBounder.matchesProperty("SVG")` (java:129); the oracle's
 * `StringBounderFromWidthTable` (`FileFormat.java:185-187`) keeps
 * `StringBounder.java:43-45`'s `false`, so the raster `getImage` arm runs
 * (java:138-139) -- no raster here -- and the catch returns `(42, 42)`
 * (java:148-152): the dimension below throws into that same catch. DRAW:
 * `UGraphicSvg#matchesProperty("SVG")` is true (`UGraphicSvg.java:175-179`),
 * so `drawU` draws the real nested SVG (java:169-174) -- the registered
 * renderer's own `drawU`. Nothing registered (a unit test bypassing
 * `src/index.ts`): both arms fall to their catch.
 *
 * See this module's own doc comment for the T2b ink-pass gating this
 * function's `drawU` was measured NOT to need (two regressing attempts,
 * both reverted).
 */
export function descEmbeddedRenderer(): NestedDiagramRenderer {
  return {
    render(source, skinParam): TextBlock {
      const registered = getNestedDiagramRenderer();
      if (registered === undefined) {
        throw new Error('EntityImageDescriptionDelegates: no nested-diagram renderer registered for {{ ... }}');
      }
      const drawn = registered.render(source, skinParam);
      return {
        calculateDimension(): XDimension2D {
          throw new Error('EmbeddedDiagram.java:138-139: a non-SVG StringBounder reads a raster -- unported');
        },
        drawU: (ug) => drawn.drawU(ug),
      };
    },
  };
}
