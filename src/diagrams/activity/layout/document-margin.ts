/**
 * document-margin.ts -- T3j (mission `activity-divergence-drive`, journal
 * row 36): `TextBlockExporter#exportTo`'s outer document-margin wrap,
 * composed AFTER chrome (title/legend/caption/header/footer) rather than
 * baked into the body at layout time. Split out of `canvas-origin.ts` only
 * to keep that file under this repo's 500-line hook (that module's own doc
 * comment records the same convention when it was itself split out of
 * `assign-coordinates-full.ts` at T1a).
 *
 * Mechanism (journalled before any edit, per this task's own instructions):
 * `DiagramChromeFactory.create` wraps the RAW (`Recentred`-only, pre-margin)
 * `TextBlock`, and `TextBlockExporter`'s document margin wraps the FULLY
 * chrome-decorated result (`TextBlockExporter.java:159-203`). This port's
 * activity geometry bakes the margin into node/edge/swimlane coordinates at
 * layout time (`canvas-origin.ts#finalizeGeometry`'s `CANVAS_ORIGIN_SHIFT`/
 * `CANVAS_PADDING_TOTAL`) -- correct for the (dominant) no-chrome case,
 * where the margin wraps the raw body directly with nothing in between, so
 * that mechanism is left untouched. For a chrome-bearing fragment,
 * `index.ts#applyAnnotationChrome` instead routes through
 * {@link applyActivityChrome} here: undo the margin's own share of the
 * baked-in shift (an EXACT inverse -- `fragment.preChromeWidth`/
 * `preChromeHeight`, computed by `renderer.ts#preChromeDims` as the exact
 * RAW dims this shift must match), compose chrome around that raw body via
 * the shared `core/annotations/chrome.ts#applyChrome`, then re-apply the
 * margin (shift + pad + `SvgGraphics#ensureVisible`) to chrome's own
 * (still raw-based) result via {@link applyActivityDocumentMargin}.
 *
 * Unlike `class/layout-ink-extent.ts`'s own raw/margined split (G2 N46) --
 * `CucaDiagram`'s margin is the asymmetric `(0, 5, 5, 0)`, so class's own
 * re-application only ever needs to PAD `width`/`height`, never shift the
 * composed body -- `TitledDiagram#getDefaultMargins()`'s `same(10)` moves
 * the near corner on every side, so {@link applyActivityDocumentMargin}
 * must shift the body too.
 * @see net/sourceforge/plantuml/core/TextBlockExporter.java:159-203
 * @see net/sourceforge/plantuml/core/TextBlockExporter.java:172-173,199-202
 * @see net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:129-136,142-143
 */

import { ACTIVITY_DOCUMENT_MARGIN, SVG_CANVAS_CEIL } from '../activity-layout-constants.js';
import type { RenderFragment } from '../../../core/dispatcher.js';
import { shiftFragmentBody } from '../../../core/annotations/coord-shift.js';
import { applyChrome, type AnnotationStyles } from '../../../core/annotations/chrome.js';
import type { DiagramAnnotations } from '../../../core/annotations/model.js';
import type { StringMeasurer } from '../../../core/measurer.js';
import type { SpriteRegistry } from '../../../core/sprite-commands.js';

/**
 * `TextBlockExporter#exportTo`'s outer document-margin wrap, applied to an
 * ALREADY chrome-composed fragment (`core/annotations/chrome.ts#applyChrome`'s
 * own output) -- mirrors `class/layout-ink-extent.ts#applyClassDocumentMargin`'s
 * role for the class engine, but `ACTIVITY_DOCUMENT_MARGIN` is symmetric
 * (`same(10)`, unlike `CucaDiagram`'s asymmetric `(0, 5, 5, 0)`), so the
 * near corner moves too: the composed body must be SHIFTED by
 * `(ACTIVITY_DOCUMENT_MARGIN, ACTIVITY_DOCUMENT_MARGIN)`, not merely padded.
 */
export function applyActivityDocumentMargin(fragment: RenderFragment): RenderFragment {
  return {
    ...fragment,
    body: shiftFragmentBody(fragment.body, ACTIVITY_DOCUMENT_MARGIN, ACTIVITY_DOCUMENT_MARGIN),
    width: Math.floor(fragment.width + 2 * ACTIVITY_DOCUMENT_MARGIN + SVG_CANVAS_CEIL),
    height: Math.floor(fragment.height + 2 * ACTIVITY_DOCUMENT_MARGIN + SVG_CANVAS_CEIL),
  };
}

/**
 * The activity branch of `index.ts#applyAnnotationChrome` -- split out here
 * (not left inline in `index.ts`) only to keep that file under this repo's
 * 500-line hook. See this module's own doc comment for the full mechanism.
 */
export function applyActivityChrome(
  fragment: RenderFragment,
  annotations: DiagramAnnotations,
  styles: AnnotationStyles,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
): RenderFragment {
  const raw: RenderFragment = {
    ...fragment,
    body: shiftFragmentBody(fragment.body, -ACTIVITY_DOCUMENT_MARGIN, -ACTIVITY_DOCUMENT_MARGIN),
    width: fragment.preChromeWidth ?? fragment.width,
    height: fragment.preChromeHeight ?? fragment.height,
  };
  const chromedRaw = applyChrome(raw, annotations, styles, measurer, sprites);
  return applyActivityDocumentMargin(chromedRaw);
}
