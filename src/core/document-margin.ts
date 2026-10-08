/**
 * document-margin.ts -- lgm-T1a: `TextBlockExporter`'s outer document margin,
 * applied to a fragment AFTER `DiagramChromeFactory.create` composed its
 * chrome (title/legend/caption/header/footer/mainframe), as upstream does.
 *
 * `UgDiagram#getExporter` (`UgDiagram.java:124-128`) calls `getTextBlock`,
 * then `addChrome` -> `DiagramChromeFactory.create`, and only then hands the
 * fully decorated block to `TextBlockExporter`, whose `exportTo` translates
 * the drawing by `(margin.left, margin.top)` and whose
 * `calculateFinalDimension` adds `margin.left + margin.right` /
 * `margin.top + margin.bottom` (`core/TextBlockExporter.java:159-176,
 * 199-203`). `SvgGraphics#ensureVisible` then truncates (`(int)(v + 1)`,
 * `klimt/drawing/svg/SvgGraphics.java:129-136`).
 *
 * A producer whose fragment ALREADY carries that margin (its `width`/`height`
 * are the final canvas, its body drawn at the margin offset) declares the
 * margin-less block as `RenderFragment.preChromeWidth`/`preChromeHeight`.
 * {@link removeDocumentMargin} recovers that block, chrome composes around it,
 * and {@link applyDocumentMargin} puts the margin back around the result.
 *
 * The margin itself is a property of the diagram class
 * (`getDefaultMargins()`), not of the fragment, so it is looked up by
 * `RenderFragment.diagramType` here -- one table, mirroring the overrides:
 *
 *  - `CucaDiagram#getDefaultMargins` `(0, 5, 5, 0)` (`core/atmp/CucaDiagram`)
 *    -- class.
 *  - `SequenceDiagram#getDefaultMargins` (`SequenceDiagram.java:629-633`):
 *    `modeTeoz() ? same(5) : (5, 5, 5, 0)`. `modeTeoz()` is
 *    `GlobalConfig.FORCE_TEOZ || ...` and `FORCE_TEOZ` is a `static final
 *    true` (`cli/GlobalConfig.java:47`), so it is `same(5)` for every
 *    sequence diagram. The teoz block additionally translates its own body
 *    by `(5, 5)` and reports `dim + 10` (`teoz/SequenceDiagramFileMakerTeoz
 *    .java:134-168`) -- that part is INSIDE the block chrome receives.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/TextBlockExporter.java:159-203
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UgDiagram.java:124-128
 */

import type { RenderFragment } from './dispatcher.js';
import { shiftFragmentBody } from './annotations/coord-shift.js';
import {
  CUCA_DOCUMENT_MARGIN_BOTTOM,
  CUCA_DOCUMENT_MARGIN_LEFT,
  CUCA_DOCUMENT_MARGIN_RIGHT,
  CUCA_DOCUMENT_MARGIN_TOP,
} from './atmp/CucaDiagram.js';

/** `ClockwiseTopRightBottomLeft`'s four sides. */
export interface DocumentMargin {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** `SvgGraphics#ensureVisible`'s `+ 1` before the `(int)` truncation
 *  (`SvgGraphics.java:129-135`). */
const ENSURE_VISIBLE_DELTA = 1;

/** `ClockwiseTopRightBottomLeft.same(5)` -- `SequenceDiagram.java:630-631`. */
export const SEQUENCE_DOCUMENT_MARGIN: DocumentMargin = { top: 5, right: 5, bottom: 5, left: 5 };

/** `CucaDiagram#getDefaultMargins()`. */
const CUCA_DOCUMENT_MARGIN: DocumentMargin = {
  top: CUCA_DOCUMENT_MARGIN_TOP,
  right: CUCA_DOCUMENT_MARGIN_RIGHT,
  bottom: CUCA_DOCUMENT_MARGIN_BOTTOM,
  left: CUCA_DOCUMENT_MARGIN_LEFT,
};

/** `RenderFragment.diagramType` -> `getDefaultMargins()` of the diagram
 *  class that produced it. Only types whose producer declares
 *  `preChromeWidth`/`preChromeHeight` belong here. */
const DOCUMENT_MARGIN_BY_DIAGRAM_TYPE: Readonly<Record<string, DocumentMargin>> = {
  CLASS: CUCA_DOCUMENT_MARGIN,
  SEQUENCE: SEQUENCE_DOCUMENT_MARGIN,
};

/**
 * The document margin `fragment` was exported with, or `undefined` when its
 * producer does not split the margin from the block (no
 * `preChromeWidth`/`preChromeHeight`, or a diagram type this table does not
 * know) -- such a fragment is chrome-composed as handed over.
 */
export function documentMarginOf(fragment: RenderFragment): DocumentMargin | undefined {
  if (fragment.preChromeWidth === undefined || fragment.preChromeHeight === undefined) return undefined;
  return fragment.diagramType === undefined ? undefined : DOCUMENT_MARGIN_BY_DIAGRAM_TYPE[fragment.diagramType];
}

/**
 * The margin-less block: body moved back by `(margin.left, margin.top)`,
 * dimension = the producer's declared `preChromeWidth`/`preChromeHeight`.
 */
export function removeDocumentMargin(fragment: RenderFragment, margin: DocumentMargin): RenderFragment {
  return {
    ...fragment,
    body: shiftFragmentBody(fragment.body, -margin.left, -margin.top),
    width: fragment.preChromeWidth ?? fragment.width,
    height: fragment.preChromeHeight ?? fragment.height,
  };
}

/**
 * `TextBlockExporter#exportTo`/`#calculateFinalDimension` + `SvgGraphics
 * #ensureVisible`: translate the chrome-composed body by `(left, top)` and
 * grow the dimension by both sides, truncating the way `ensureVisible` does.
 */
export function applyDocumentMargin(fragment: RenderFragment, margin: DocumentMargin): RenderFragment {
  return {
    ...fragment,
    body: shiftFragmentBody(fragment.body, margin.left, margin.top),
    width: Math.floor(fragment.width + margin.left + margin.right + ENSURE_VISIBLE_DELTA),
    height: Math.floor(fragment.height + margin.top + margin.bottom + ENSURE_VISIBLE_DELTA),
  };
}
