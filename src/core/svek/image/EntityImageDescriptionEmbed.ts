/**
 * EntityImageDescriptionEmbed — the `{{ ... }}` embedded-diagram
 * `NestedDiagramRenderer` `EntityImageDescriptionDelegates.ts#buildDesc`'s
 * `create3` pipeline wires into `ISkinSimple.sheet()`.
 *
 * Split out of `EntityImageDescriptionDelegates.ts` (T2b, ink-walk-reuses-
 * draw) purely to stay under this project's 500-line complexity-hook
 * ceiling. Zero behavior change from the move itself.
 *
 * ## lgm-T1e: the SVG arm in every pass, ink included
 *
 * `EmbeddedDiagram#calculateDimensionSlow` (java:129-133) and `#drawU`
 * (java:169-174) each branch on `matchesProperty("SVG")`. The stock jar's
 * `StringBounderSvg` answers true (`StringBounderSvg.java:67-69`), and
 * `LimitFinder.java:99-100` delegates `matchesProperty` to its bounder, so
 * the ink pass ALSO takes the SVG arm: `LimitFinder#drawImageSvg`
 * (java:201-204, `addPoint(x + w - 1, y + h - 1)`) tracks the embed. The
 * deterministic oracle answered false until oracle seam #3
 * (`oracle/patches/0003-oracle-svg-property.patch`); cdd6 T3b's "the embed
 * skips the ink pass" (journal row 47) fitted that artefact and is gone.
 * The registered renderer's `TextBlock` draws one `UImage` of the nested
 * document's size, which `LimitFinder#drawImage` tracks by the same rule.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/EmbeddedDiagram.java:126-152,165-195
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java:99-100,201-204
 */
import type { NestedDiagramRenderer } from '../../EmbeddedDiagram.js';
import { getNestedDiagramRenderer } from '../../nested-diagram-registry.js';

/**
 * The description label's embed renderer: the registered nested renderer
 * itself (its `TextBlock` is sized and drawn by the nested document's
 * `UImageSvg`). Nothing registered (a unit test bypassing `src/index.ts`):
 * throws into `EmbeddedDiagram`'s catch (java:148-152, 191-193).
 */
export function descEmbeddedRenderer(): NestedDiagramRenderer {
  return {
    render(source, skinParam) {
      const registered = getNestedDiagramRenderer();
      if (registered === undefined) {
        throw new Error('EntityImageDescriptionDelegates: no nested-diagram renderer registered for {{ ... }}');
      }
      return registered.render(source, skinParam);
    },
  };
}
