/**
 * chrome-export.ts -- lgm-T1a: `UgDiagram#getExporter`'s order, once, for every
 * fragment whose producer splits the document margin from the block.
 *
 * Upstream composes `getTextBlock` -> `addChrome` (`DiagramChromeFactory
 * .create`) -> `TextBlockExporter` margin (`UgDiagram.java:124-128`,
 * `core/TextBlockExporter.java:159-203`). A fragment that declares its
 * margin-less block (`RenderFragment.preChromeWidth`/`preChromeHeight`,
 * `core/document-margin.ts`) is therefore chromed AS THAT BLOCK and has the
 * margin re-applied afterward -- so the mainframe, title and legend are sized
 * from the block `DiagramChromeFactory` is really given, not from the final
 * canvas. This replaces the class-only re-application `src/index.ts`
 * (`applyClassDocumentMargin`, G2 N46) used to carry; class is the
 * `CUCA` row of the same table.
 *
 * Every harness that composes chrome calls THIS function, so the production
 * path and the conformance probes cannot drift apart again.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:124-128
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:159-203
 */

import type { RenderFragment } from '../dispatcher.js';
import type { StringMeasurer } from '../measurer.js';
import type { SpriteRegistry } from '../sprite-commands.js';
import { applyDocumentMargin, documentMarginOf, removeDocumentMargin } from '../document-margin.js';
import { applyChrome, type AnnotationStyles } from './chrome.js';
import type { DiagramAnnotations } from './model.js';
import { isEmpty } from './model.js';

/**
 * `DiagramChromeFactory.create` around the fragment's margin-less block, then
 * `TextBlockExporter`'s margin around the result. A fragment with no declared
 * block (every producer but class and sequence) is chromed as handed over.
 */
export function applyExportedChrome(
  fragment: RenderFragment,
  annotations: DiagramAnnotations,
  styles: AnnotationStyles,
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
): RenderFragment {
  const margin = documentMarginOf(fragment);
  if (isEmpty(annotations)) return fragment;
  if (margin === undefined) return applyChrome(fragment, annotations, styles, measurer, sprites);
  const chromed = applyChrome(removeDocumentMargin(fragment, margin), annotations, styles, measurer, sprites);
  return applyDocumentMargin(chromed, margin);
}
