/**
 * What the three json-family factories (`JsonDiagramFactory`,
 * `YamlDiagramFactory`, `HclDiagramFactory`) and the `JsonDiagram`
 * constructor take from a {@link StyleExtractor} besides the payload: the
 * title and the `scale` line.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonDiagramFactory.java:97-109
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonDiagram.java:76-100
 */

import {
  createAnnotations,
  setTitle,
  singleDisplayPositioned,
  type DiagramAnnotations,
} from '../../core/annotations/index.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { VerticalAlignment } from '../../core/klimt/geom/VerticalAlignment.js';
import { getWithNewlines3 } from '../../core/klimt/creole/DisplayNewlines.js';
import { matchScaleCommand, type ScaleSpec } from '../../core/scale-command.js';
import type { StyleExtractor } from './StyleExtractor.js';

/** The chrome and scale a factory derives from its extractor. */
export interface JsonFamilyHeader {
  readonly annotations: DiagramAnnotations;
  readonly scale?: ScaleSpec;
}

/**
 * `title` and `scale`, as the factories apply them.
 *
 * `honourTitle` is false for hcl: `HclDiagramFactory.java:86-92` has the
 * whole `setTitle` block commented out, so an hcl `title` line is consumed by
 * the extractor and then dropped (jar: `tests/fixtures/unwind-U1/hcl-title`).
 * json and yaml set it as `DisplayPositioned.single(Display.getWithNewlines(
 * pragma, title), CENTER, CENTER)` -- the RAW text after `title `, so a
 * quoted title keeps its quotes (jar: `json-title-quoted`).
 *
 * `scale` is executed by the `JsonDiagram` constructor for all three
 * (`JsonDiagram.java:91-99`).
 */
export function headerOf(extractor: StyleExtractor, honourTitle: boolean): JsonFamilyHeader {
  const annotations = createAnnotations();
  const title = honourTitle ? extractor.title : undefined;
  if (title !== undefined) {
    const display = getWithNewlines3(title) ?? [];
    setTitle(annotations, singleDisplayPositioned(display, HorizontalAlignment.CENTER, VerticalAlignment.CENTER));
  }
  const scale = extractor.scale === undefined ? undefined : matchScaleCommand(extractor.scale);
  return { annotations, ...(scale === undefined ? {} : { scale }) };
}
