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
 * ## cdd6 T3b (journal row 47): the embed skips the ink pass
 *
 * `LimitFinder.java:99-100`'s `matchesProperty` delegates to the ink
 * bounder (false, the oracle's `StringBounderFromWidthTable`), so
 * `EmbeddedDiagram#drawU`'s `ug.matchesProperty("SVG")` (java:169) is false
 * during the jar's ink pass -- the raster arm throws (java:180) and its catch
 * (java:191-193) draws NOTHING. Only the real `UGraphicSvg` pass draws the
 * embed, and `SvgGraphics#ensureVisible` (`SvgGraphics.java:129-133,
 * 1033-1034`, `(int)(x + w + 1)`) is the embed's only route to the canvas.
 * `drawU` below mirrors that: it returns when the bounder is a
 * `MeasurerStringBounder` (every ink pass here). The real-draw extent is
 * `class/renderer.ts`'s union of the per-leaf `UGraphicSvg` fragments, and
 * an embed-only leaf's empty ink is skipped by `class-ink-box.ts`.
 *
 * T2b's two reverted attempts (row 47) lacked those two halves: a `UEmpty`
 * reservation is off by the `UImage` `x+w-1` rule, and suppression alone
 * collapses embed-only leaves to an empty `MinMax`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/EmbeddedDiagram.java:126-152,165-195
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:99-100
 */
import type { XDimension2D } from '../../klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../klimt/shape/TextBlock.js';
import type { NestedDiagramRenderer } from '../../EmbeddedDiagram.js';
import { getNestedDiagramRenderer } from '../../nested-diagram-registry.js';
import { MeasurerStringBounder } from '../../measurer-bounder.js';

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
 * See this module's own doc comment for the ink-pass gating in `drawU`.
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
        // `LimitFinder.java:99-100`: the ink pass's `matchesProperty("SVG")`
        // is false, so `EmbeddedDiagram#drawU`'s raster arm throws and its
        // catch draws nothing (java:169-193). This port has no
        // `matchesProperty`; the ink passes are the ones bounded by a
        // `MeasurerStringBounder` (`UGraphicSvg` hands out its own bounder).
        drawU: (ug) => {
          if (ug.getStringBounder() instanceof MeasurerStringBounder) return;
          drawn.drawU(ug);
        },
      };
    },
  };
}
