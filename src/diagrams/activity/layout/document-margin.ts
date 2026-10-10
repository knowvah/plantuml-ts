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

import {
  ACTIVITY_DOCUMENT_MARGIN,
  SVG_CANVAS_CEIL,
  activityDocumentMargin,
  type DocumentMargin,
} from '../activity-layout-constants.js';
import type { AssembledSvg, RenderFragment } from '../../../core/dispatcher.js';
import { isExportScaled, resolveScaleFactor, type ScaleSpec } from '../../../core/scale-command.js';
import type { Theme } from '../../../core/theme.js';
import { shiftFragmentBody } from '../../../core/annotations/coord-shift.js';
import { applyChrome, type AnnotationStyles } from '../../../core/annotations/chrome.js';
import type { DiagramAnnotations } from '../../../core/annotations/model.js';
import type { StringMeasurer } from '../../../core/measurer.js';
import type { SpriteRegistry } from '../../../core/sprite-commands.js';

/** `TitledDiagram#getDefaultMargins()`, `same(10)` (`TitledDiagram.java:275`). */
const SAME_10: DocumentMargin = {
  top: ACTIVITY_DOCUMENT_MARGIN,
  right: ACTIVITY_DOCUMENT_MARGIN,
  bottom: ACTIVITY_DOCUMENT_MARGIN,
  left: ACTIVITY_DOCUMENT_MARGIN,
};

/**
 * `TextBlockExporter#exportTo`'s outer document-margin wrap, applied to an
 * ALREADY chrome-composed fragment (`core/annotations/chrome.ts#applyChrome`'s
 * own output) -- mirrors `class/layout-ink-extent.ts#applyClassDocumentMargin`'s
 * role for the class engine, but `ACTIVITY_DOCUMENT_MARGIN` is symmetric
 * (`same(10)`, unlike `CucaDiagram`'s asymmetric `(0, 5, 5, 0)`), so the
 * near corner moves too: the composed body must be SHIFTED by
 * `(ACTIVITY_DOCUMENT_MARGIN, ACTIVITY_DOCUMENT_MARGIN)`, not merely padded.
 */
export function applyActivityDocumentMargin(
  fragment: RenderFragment,
  margin: DocumentMargin = SAME_10,
): RenderFragment {
  return {
    ...fragment,
    body: shiftFragmentBody(fragment.body, margin.left, margin.top),
    width: Math.floor(fragment.width + margin.left + margin.right + SVG_CANVAS_CEIL),
    height: Math.floor(fragment.height + margin.top + margin.bottom + SVG_CANVAS_CEIL),
  };
}

/**
 * What `TextBlockExporter.Builder#styled` reads off the diagram for the
 * export (`TextBlockExporter.java:489-503`): the document margin
 * (`calculateMargin`, `:510-516`), the unresolved `scale` (`:497`) and the
 * `skinparam dpi` (`computeScaleFactor`, `:204-208`), plus the sprites chrome
 * text resolves against.
 */
export interface ActivityDocumentContext {
  readonly sprites?: SpriteRegistry;
  readonly margin: DocumentMargin;
  readonly scaleSpec?: ScaleSpec;
  readonly dpi?: number;
}

/** {@link ActivityDocumentContext} from the parsed AST (`ast.scale`,
 *  `parser.ts`) and the theme. `ast` is `unknown` because `src/index.ts`
 *  holds every engine's AST as one; a non-activity AST simply has no
 *  `scale`. */
export function activityDocumentContext(
  ast: unknown,
  theme: Theme,
  sprites: SpriteRegistry | undefined,
): ActivityDocumentContext {
  const scale =
    typeof ast === 'object' && ast !== null && 'scale' in ast ? (ast as { scale?: ScaleSpec }).scale : undefined;
  return {
    ...(sprites !== undefined ? { sprites } : {}),
    margin: activityDocumentMargin(theme),
    ...(scale !== undefined ? { scaleSpec: scale } : {}),
    ...(theme.dpi !== undefined ? { dpi: theme.dpi } : {}),
  };
}

const DEFAULT_DOCUMENT_CONTEXT: ActivityDocumentContext = { margin: SAME_10 };

/** `SkinParam#getDpi()`'s default (`skin/SkinParam.java:649-656`). */
const DEFAULT_DPI = 96;

/**
 * add4-T3b (ACT-SCALE): `computeScaleFactor(calculateFinalDimension())`
 * (`TextBlockExporter.java:160-166,198-208`). `dimWidth`/`dimHeight` are
 * the RAW block plus the document margin -- before `ensureVisible`'s
 * `(int)(x + 1)` (`SvgGraphics.java:129-136`), which only this layer can
 * rebuild. The strategy (clamped, `ScaleProtected`) is resolved here at dpi
 * 96 and handed on as a `simple` spec (re-clamping a clamped value is a
 * no-op, `scale-command.ts#clampScale`); `dpi` travels unresolved, so
 * `core/assemble-svg-activity.ts#finalizeActivityFragment` multiplies it
 * after the clamp exactly as upstream does, then scales the composed
 * document.
 */
function withActivityScale(
  fragment: RenderFragment,
  dimWidth: number,
  dimHeight: number,
  doc: ActivityDocumentContext,
): RenderFragment {
  if (!isExportScaled(doc.scaleSpec, doc.dpi)) return fragment;
  const dpi = doc.dpi ?? DEFAULT_DPI;
  const dpiPart = dpi === DEFAULT_DPI ? {} : { dpi };
  if (doc.scaleSpec === undefined) return { ...fragment, ...dpiPart };
  const factor = resolveScaleFactor(doc.scaleSpec, dimWidth, dimHeight);
  return { ...fragment, scaleSpec: { kind: 'simple', factor }, ...dpiPart };
}

/** What `src/index.ts` (and the activity harness) hold at export time --
 *  turned into an {@link ActivityDocumentContext} here so the caller needs
 *  one import, not three (`src/index.ts` is at its 500-line cap). */
export interface ActivityExportInput {
  readonly ast: unknown;
  readonly theme: Theme;
  readonly sprites?: SpriteRegistry | undefined;
}

/**
 * The no-chrome export: the layout already baked `doc.margin` into the
 * body (`canvas-origin.ts`), so only the scale is left to resolve, against
 * `preChromeWidth`/`preChromeHeight` (the raw block, `renderer.ts
 * #preChromeDims`) plus that margin. Any other fragment passes through.
 */
export function applyActivityScale(fragment: AssembledSvg, input: ActivityExportInput): AssembledSvg {
  if ('completeSvg' in fragment || fragment.diagramType !== 'ACTIVITY') return fragment;
  const doc = activityDocumentContext(input.ast, input.theme, input.sprites);
  if (fragment.preChromeWidth === undefined || fragment.preChromeHeight === undefined) return fragment;
  const m = doc.margin;
  return withActivityScale(
    fragment,
    fragment.preChromeWidth + m.left + m.right,
    fragment.preChromeHeight + m.top + m.bottom,
    doc,
  );
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
  input?: ActivityExportInput,
): RenderFragment {
  const doc =
    input === undefined ? DEFAULT_DOCUMENT_CONTEXT : activityDocumentContext(input.ast, input.theme, input.sprites);
  const raw: RenderFragment = {
    ...fragment,
    body: shiftFragmentBody(fragment.body, -ACTIVITY_DOCUMENT_MARGIN, -ACTIVITY_DOCUMENT_MARGIN),
    width: fragment.preChromeWidth ?? fragment.width,
    height: fragment.preChromeHeight ?? fragment.height,
  };
  const chromedRaw = applyChrome(raw, annotations, styles, measurer, doc.sprites);
  // add4-T3b THEME-MARGIN: the layout baked `same(10)` under chrome
  // (`documentMarginTheme`), undone above; the export margin is the
  // theme's (`TextBlockExporter.Builder#calculateMargin`, java:510-516),
  // translated by (left, top) and summed into the dimension (`:172-173,
  // 199-202`).
  const m = doc.margin;
  return withActivityScale(
    applyActivityDocumentMargin(chromedRaw, m),
    chromedRaw.width + m.left + m.right,
    chromedRaw.height + m.top + m.bottom,
    doc,
  );
}
