/**
 * renderer-ug.ts -- the sequence engine's `UGraphic` seam (sdd3 batch 8,
 * `plans/sequence-divergence-drive-3/diagnosis/handwritten.md`, "The seam
 * design").
 *
 * Upstream draws every sequence component through ONE `UGraphic`: each
 * `ComponentRose*#drawInternalU` is an `ug.apply(...)` chain ending in
 * `draw(shape)`, over the exporter's single `UGraphicSvg`
 * (`TextBlockExporter.java:169-177`). The page is drawn the same way here, so
 * a decorator (`UGraphicHandwritten`, `:174-175`) sees every shape and the
 * graphic's own `ensureVisible` fold is the canvas.
 *
 * - {@link openSequenceGraphic}: the page's drawing context and its one
 *   serialisation step.
 * - {@link PageTheme}: the theme every draw function receives.
 * - {@link startGroup} / {@link closeGroup}: `UGraphic#startGroup` /
 *   `#closeGroup` (`UGraphic.java:72-74`). This port's `UGraphic` interface
 *   does not carry them (`UGraphic.ts`); the capable graphics do, and
 *   `UGraphicDelegator` forwards them (sdd3-T8p).
 *
 * ## The page is drawn at scale 1
 *
 * `renderer.ts#DRAW_SCALE` is 1: the export scale is the exporter's single
 * `SvgGraphics#format` pass (`core/TextBlockExporter.ts#exportTo`), so the
 * document built here never scales. Every draw runs, and {@link
 * SequenceGraphic#finish} is called, inside `renderPaginated`'s
 * `withDeferredFormat` scope, so a scaled page keeps lossless coordinates
 * for that one pass.
 *
 * ## Why the ids are normalised
 *
 * The ids `SvgGraphics` mints (`<seed><counter>`) are made page-uniform here,
 * as the participant glyph seam does for its own documents
 * (`renderer-participant-symbol.ts#glyphContent`):
 *
 * - the shadow `<filter>` (`SvgGraphics#manageShadow`, `:1070-1090`) is
 *   dropped and its references re-pointed at the page's single filter
 *   (`sequence-shadow.ts#sequenceShadowDefs` emits it); and
 * - a `<linearGradient>` (`SvgGraphics#createSvgGradient`, `:363-405`) keeps
 *   its definition but takes an id that is a hash of its own content, so two
 *   regions that draw the same gradient agree on the id and two that draw
 *   different gradients cannot collide on the `<seed><counter>` id each
 *   document would otherwise give them. `svg-defs.ts#collectDocumentDefs`
 *   lifts the defs and collapses equal ones, as upstream's one gradient map
 *   does.
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UGroup } from '../../core/klimt/shape/UGroup.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UGraphicHandwritten } from '../../core/klimt/drawing/hand/UGraphicHandwritten.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { seedOf } from '../../core/klimt/drawing/svg/svg-seed.js';
import type { StringBounder as DriverStringBounder } from '../../core/klimt/drawing/svg/driver-text-svg.js';
import { extractFlatContent, extractViewBoxDims, VERSION_PLACEHOLDER } from '../../core/klimt/document-shell.js';
import { hashString } from '../../core/paint.js';
import { attrs } from '../../core/svg.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import { sequenceShadowFilter } from './sequence-shadow.js';

/** The page's document seed. Only the ids `SvgGraphics` mints read it, and
 *  {@link normaliseMintedIds} replaces every one of them. */
const SEQUENCE_SEED = seedOf('sequence');

/** `SvgGraphics.java:161`: the shadow filter's `"f" + getSeed(seed)` id,
 *  as it appears in a shape's `filter` attribute. */
const MINTED_SHADOW_REF = /filter="url\(#f[0-9a-z]+\)"/g;
/** ...and the def itself, `SvgGraphics.java:1074-1086`. */
const MINTED_SHADOW_DEF = /<filter id="f[0-9a-z]+"[^>]*>.*?<\/filter>/g;

const GRADIENT_OPEN = '<linearGradient';
const GRADIENT_CLOSE = '</linearGradient>';
const GRADIENT_ID_ATTR = / id="([^"]*)"/;
/** The `g`-prefixed id shape `svg-defs.ts` lifts (`GRADIENT_ID_RE`). */
const GRADIENT_ID_PREFIX = 'g';

/** The `<style type="text/css">@import url(...)</style>` `SvgGraphics#addRoboto`
 *  writes into `<defs>` the first time a text names Roboto
 *  (`SvgGraphics.java:195-205`). */
const FONT_IMPORT_DEF = /<style type="text\/css">[^<]*<\/style>/g;

/**
 * `Theme` plus the render's own measurer (`DiagramPlugin.render`'s third
 * argument), the same instrument layout measured with. It rides on the theme
 * because every draw function already receives the theme, so no signature
 * grows; `DriverTextSvg` and the participant glyph seam read it. The page is
 * drawn at scale 1 (`renderer.ts#DRAW_SCALE`): the export scale is the
 * exporter's single `SvgGraphics#format` pass, so no length is multiplied here.
 */
export interface PageTheme extends Theme {
  readonly measurer: StringMeasurer;
}

/** The page's {@link PageTheme} under `measurer`. */
export function pageThemeOf(theme: Theme, measurer: StringMeasurer): PageTheme {
  return { ...theme, measurer };
}

/** What {@link SequenceGraphic#finish} yields. */
export interface SequenceFinish {
  /** The flat content markup, ids normalised. */
  readonly body: string;
  /** Defs the content needs (gradients), shadow filter and font import
   *  excluded. */
  readonly extraDefs: string;
  /** The font `@import` the one document wrote once into its `<defs>`
   *  (`SvgGraphics#addRoboto`), or the empty string: the page's `<defs>`
   *  carries it once, as the jar's does, however many texts name the font. */
  readonly fontDefs: string;
  /** The document's drawn extent, read from its root `viewBox`. */
  readonly maxX: number;
  readonly maxY: number;
}

/** The sequence page's drawing context. */
export interface SequenceGraphic {
  /** The page's `UGraphic`: a core `UGraphicSvg`, wrapped in
   *  `UGraphicHandwritten` when `theme.handwritten`
   *  (`TextBlockExporter.java:174-175`). */
  readonly ug: UGraphic;
  /** Serialise once, ids normalised ({@link normaliseMintedIds}). */
  finish(): SequenceFinish;
}

/** `DriverTextSvg`'s own width-only seam over the render's measurer
 *  (`PageTheme.measurer`): when a shape draws text it answers from the
 *  layout's metric, not a second private one. */
export function driverBounderOf(measurer: StringMeasurer): DriverStringBounder {
  return { calculateDimension: (font, text) => ({ width: measurer.measure(text, font).width }) };
}

/** One `<linearGradient>` element and where it ends, or `undefined` when
 *  none starts at or after `from`. Scanned with `indexOf` (not a lazy regex
 *  over library input; see `svg-defs.ts`). */
function nextGradient(defs: string, from: number): { at: number; end: number } | undefined {
  const at = defs.indexOf(GRADIENT_OPEN, from);
  if (at === -1) return undefined;
  const close = defs.indexOf(GRADIENT_CLOSE, at);
  if (close === -1) return undefined;
  return { at, end: close + GRADIENT_CLOSE.length };
}

/** `element` with its id replaced by `id`, moved to the front: the spelling
 *  `svg-defs.ts#extractGradientDefs` lifts (`createSvgGradient` writes it
 *  last, `SvgGraphics.java:384-393`). */
function withLeadingId(element: string, id: string): string {
  return element.replace(GRADIENT_ID_ATTR, '').replace(GRADIENT_OPEN, GRADIENT_OPEN + attrs([['id', id]]));
}

/** Rename every gradient def to a hash of its own content, and every
 *  `url(#...)` reference with it. */
function contentKeyGradients(defs: string, body: string): { defs: string; body: string } {
  const renames = new Map<string, string>();
  const kept: string[] = [];
  let cursor = 0;
  for (let span = nextGradient(defs, cursor); span !== undefined; span = nextGradient(defs, cursor)) {
    kept.push(defs.substring(cursor, span.at));
    const element = defs.substring(span.at, span.end);
    // `createSvgGradient` always writes the id (`SvgGraphics.java:393`).
    const minted = GRADIENT_ID_ATTR.exec(element)![1]!;
    const id = GRADIENT_ID_PREFIX + hashString(element.replace(GRADIENT_ID_ATTR, ''));
    renames.set(minted, id);
    kept.push(withLeadingId(element, id));
    cursor = span.end;
  }
  kept.push(defs.substring(cursor));
  let renamed = body;
  for (const [from, to] of renames) renamed = renamed.split(`url(#${from})`).join(`url(#${to})`);
  return { defs: kept.join(''), body: renamed };
}

/**
 * Make the ids one `SvgGraphics` document minted page-uniform: drop the
 * shadow filter and re-point every reference at the page's one filter, and
 * key each gradient by its content (module header, "Why the ids are
 * normalised").
 */
export function normaliseMintedIds(body: string, extraDefs: string): { body: string; extraDefs: string } {
  const withoutShadowDef = extraDefs.replace(MINTED_SHADOW_DEF, '');
  // `sequenceShadowFilter(1)`: any delta above 0 is the one page filter.
  const filter = sequenceShadowFilter(1).filter!;
  const repointed = body.replace(MINTED_SHADOW_REF, attrs([['filter', filter]]).trimStart());
  const keyed = contentKeyGradients(withoutShadowDef, repointed);
  return { body: keyed.body, extraDefs: keyed.defs };
}

/**
 * Open the page's graphic: `UGraphicSvg.build(...)` at scale 1, floored at
 * `minDim` (`TextBlockExporter.java:284`'s `option.withMinDim(dim)`), the
 * construction `renderer-participant-symbol.ts` already uses per glyph.
 *
 * `margin` is the translate the exporter applies for a style `Margin` that
 * differs from the `same(5)` the layout baked (`renderer-document.ts#
 * exporterPlacement`); the default is none.
 *
 * `theme.handwritten` is `TitledDiagram#isHandwritten`'s `skinParam
 * .handwritten()` (`TitledDiagram.java:115-118`): the exporter wraps the page
 * graphic in `UGraphicHandwritten` after the margin translate and before
 * `textBlock.drawU(ug)` (`TextBlockExporter.java:172-177`). The wrapped graphic stays the one
 * `svg` serialised by {@link SequenceGraphic#finish}: the decorator only
 * replaces each shape handed to `draw` (`UGraphicHandwritten.java:64-82`).
 */
export function openSequenceGraphic(
  theme: PageTheme,
  minDim: { readonly width: number; readonly height: number },
  margin: UTranslate = UTranslate.none(),
): SequenceGraphic {
  const svg = UGraphicSvg.build(
    SEQUENCE_SEED,
    basicSvgOption({ scale: 1, minDim }),
    VERSION_PLACEHOLDER,
    driverBounderOf(theme.measurer),
    theme.measurer,
  );
  // `ug = ug.apply(new UTranslate(margin.getLeft(), margin.getTop()))`, then the handwritten wrap
  // (`TextBlockExporter.java:168-176`): the fold below sees final coordinates.
  const translated = margin.getDx() === 0 && margin.getDy() === 0 ? svg : svg.apply(margin);
  return {
    ug: theme.handwritten === true ? new UGraphicHandwritten(translated) : translated,
    finish() {
      const document = svg.getSvgString();
      const { width, height } = extractViewBoxDims(document);
      const { body, extraDefs } = extractFlatContent(document);
      const fontDefs = extraDefs.match(FONT_IMPORT_DEF)?.[0] ?? '';
      const normalised = normaliseMintedIds(body, extraDefs.replace(FONT_IMPORT_DEF, ''));
      return { ...normalised, fontDefs, maxX: width, maxY: height };
    },
  };
}

/** The pair `UGraphic#startGroup` / `#closeGroup`, duck-typed: only the SVG
 *  graphic (and a delegator over it) opens a `<g>`; any other `UGraphic`
 *  draws without one, as upstream's non-SVG backends do. */
interface GroupCapable {
  startGroup(group: UGroup): void;
  closeGroup(): void;
}

/** `ug.startGroup(group)` (`UGraphic.java:72`). */
export function startGroup(ug: UGraphic, group: UGroup): void {
  (ug as Partial<GroupCapable>).startGroup?.(group);
}

/** `ug.closeGroup()` (`UGraphic.java:74`). */
export function closeGroup(ug: UGraphic): void {
  (ug as Partial<GroupCapable>).closeGroup?.();
}
