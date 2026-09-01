/**
 * `newpage` PAGINATION: one `SequenceGeometry` in, one page's
 * `SequenceGeometry` out.
 *
 * ## What upstream does, and what it does NOT do
 *
 * It does NOT re-lay-out per page. `PlayingSpaceWithParticipants#drawU`
 * (`:204-229`) draws the SAME full layout every time; only three things vary
 * with the page index:
 *
 *   1. the body is translated by `dy(headHeight - ymin)`;
 *   2. the body is CLIPPED to `new UClip(-1000, ymin, MAX, pageHeight + 1)`,
 *      but only when `getNbPages() > 1`;
 *   3. the heads are drawn un-clipped at the top and the footbox row at
 *      `dy(pageHeight + headHeight)`.
 *
 * So a page is a pure geometry -> geometry transform, which is what this
 * module is. Layout runs once, unchanged; the renderer is untouched and
 * unclipped and never learns that pages exist.
 *
 * ## Why the clip lives HERE and not at the emitters
 *
 * Upstream's clip is held by the DRIVERS: each `Driver*Svg` asks
 * `clipContainer.getClip()` and trims its own shape. Mirroring that
 * structurally would mean threading a clip through this engine's 38 direct
 * `rect`/`line`/`text`/`path`/`polygon` call sites across 8 modules, for a
 * feature 35 fixtures reach. Post-filtering the emitted SVG string would
 * mean re-parsing our own `path` `d` and `polygon` `points`. The decision to
 * clip in geometry space instead is `plans/sequence-newpage-pagination/
 * README.md`'s, and is not re-argued per kind.
 *
 * What that decision costs is stated rather than hidden: the six driver
 * rules are per SHAPE, and this port emits per KIND, so a kind that emits
 * shapes with different rules cannot be split. Each such case is enumerated
 * in `decisions.md` D4 and pinned in
 * `tests/unit/sequence/sequence-page.test.ts`.
 *
 * ## The band, and its `+ 1`
 *
 * In this port's coordinates the band is `[ymin, ymax + 1]`, closed at both
 * ends. `UClip#isInside` uses `<` / `>`, so both edges are inside; the `+ 1`
 * is the `pageHeight + 1` the `UClip` is constructed with. It is visible in
 * the jar's own golden for `digula-66-dipe776`, whose lifelines stop at
 * `y2="339"` where `ymax` maps to `338`. See `decisions.md` D2 for the
 * arithmetic.
 *
 * The x half of the clip is `[-1000, ~MAX_VALUE]` and every x this port
 * emits is inside it, which is what reduces every rule below to a test on
 * `y` alone.
 *
 * @see ~/git/plantuml/.../sequencediagram/teoz/PlayingSpaceWithParticipants.java:78-110,204-229
 * @see ~/git/plantuml/.../sequencediagram/teoz/PlayingSpace.java:326-350
 * @see ~/git/plantuml/.../klimt/UClip.java:85-160
 */

import type {
  ActivationGeo,
  NewpageEvent,
  SequenceDiagramAST,
  SequenceEvent,
  DividerGeo,
  EventGeo,
  FrameGeo,
  MessageGeo,
  NewpageGeo,
  NoteGeo,
  SequenceGeometry,
  SpaceGeo,
} from './ast.js';
import { NEWPAGE_MARGIN_Y } from './newpage-style.js';
import type { DisplayPositioned } from '../../core/annotations/index.js';
import { noneDisplayPositioned, singleDisplayPositioned } from '../../core/annotations/index.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { VerticalAlignment } from '../../core/klimt/geom/VerticalAlignment.js';
import { ARROW_DELTA_Y } from './sequence-arrowhead.js';

// ---------------------------------------------------------------------------
// The band
// ---------------------------------------------------------------------------

/**
 * One page's clip band in geometry coordinates, plus the translation applied
 * to whatever survives it — `UTranslate.dy(headHeight - ymin)`
 * (`PlayingSpaceWithParticipants.java:217`).
 */
interface PageBand {
  readonly top: number;
  readonly bottom: number;
  readonly dy: number;
}

/** `UClip#isInside`, reduced to its y half (`:98-127`). Closed at both ends:
 *  upstream rejects on `<` / `>`, never on `<=` / `>=`. */
function inBand(band: PageBand, y: number): boolean {
  return y >= band.top && y <= band.bottom;
}

/** A y that survived the band, moved into page-local coordinates. */
function shift(band: PageBand, y: number): number {
  return y + band.dy;
}

/**
 * `UClip#getClippedRectangle` (`:139-145`) plus `DriverRectangleSvg`'s own
 * `if (height <= 0) return` (`:71-73`) — the CLAMP rule, for the kinds whose
 * ink is a rectangle. `undefined` is that `return`.
 */
function clampSpan(
  band: PageBand,
  y: number,
  height: number,
): { y: number; height: number } | undefined {
  const y1 = Math.max(y, band.top);
  const y2 = Math.min(y + height, band.bottom);
  if (y2 - y1 <= 0) return undefined;
  return { y: shift(band, y1), height: y2 - y1 };
}

// ---------------------------------------------------------------------------
// Per-kind rules — see decisions.md D3/D4 for the shape each one maps onto
// ---------------------------------------------------------------------------

/**
 * ALL-OR-NOTHING on the arrow HEAD's extent, `y ± ARROW_DELTA_Y`.
 *
 * A message emits three kinds of shape and the drivers rule on each
 * separately: the shaft is a horizontal `ULine` (dropped when its single `y`
 * leaves the band — `getClippedLine` finds both endpoints outside with
 * `x1 != x2` and returns `null`), the head is a `UPolygon` or a pair of
 * `ULine`s spanning `y ± ARROW_DELTA_Y` (`DriverPolygonSvg:57-61` needs
 * EVERY point inside), and the label is `UText` (anchor test).
 *
 * The head is the strictest of the three, so it is the one the kind maps
 * onto: a message survives exactly when its head does. Taking the shaft's
 * looser test instead would keep the first message of the NEXT page on this
 * one, because this port places a message's arrow at the top of its own tile
 * where upstream places it `getContactPointRelative()` lower
 * (`CommunicationTile.java:168-170`) — so the port's arrow lands exactly on
 * `ymax`, one pixel inside a band that ends at `ymax + 1`. That divergence is
 * `sequence-layout-message.ts`'s, not this module's; the head rule is what
 * upstream's own drivers would do to the ink this port actually emits, and it
 * answers the case correctly without reaching into layout.
 *
 * `ARROW_DELTA_Y` is 4 for every dressing — it is `AbstractComponentRoseArrow`
 * `.arrowDeltaY` and also the `o` circle's radius (`DIAM_CIRCLE / 2`).
 *
 * NOT modelled: a SELF message's loop reaches ~20px below `y`, and a loop
 * that alone crossed the band's bottom edge would have its `UPath` dropped by
 * upstream while the head survived. No self message in the corpus is in that
 * position (the head rule fires first in every case measured), and splitting
 * a `MessageGeo` into surviving segments would move the renderer's self-loop
 * arithmetic into this module.
 *
 * The label RUNS are the one component this port stores a separate `y` for
 * (they sit above the arrow), so they get their own anchor test, which is
 * exactly `DriverTextSvg:88-90`.
 */
function clipMessage(m: MessageGeo, band: PageBand): MessageGeo | undefined {
  if (!inBand(band, m.y - ARROW_DELTA_Y) || !inBand(band, m.y + ARROW_DELTA_Y))
    return undefined;
  const { labelNumber, ...rest } = m;
  const keepNumber = labelNumber !== undefined && inBand(band, labelNumber.y);
  return {
    ...rest,
    y: shift(band, m.y),
    labelLines: m.labelLines
      .filter((r) => inBand(band, r.y))
      .map((r) => ({ ...r, y: shift(band, r.y) })),
    ...(keepNumber ? { labelNumber: { ...labelNumber, y: shift(band, labelNumber.y) } } : {}),
  };
}

/**
 * ALL-OR-NOTHING on the WHOLE box. A default `note` is drawn as a folded-
 * corner `UPath`, and `DriverPathSvg` tests the bbox's min AND max corner
 * (`:58-60`) — so a note is kept only when its top and bottom are both
 * inside.
 *
 * `rnote` (`shape: 'rect'`) is a `URectangle` upstream and would CLAMP,
 * dropping its text lines individually by their own anchors; this port
 * cannot express a note box without its text, so it takes the `UPath`
 * answer for both. No note in the `newpage` corpus straddles a band edge
 * (measured, all 35 fixtures x every page), so the case is pinned rather
 * than exercised.
 */
function clipNote(n: NoteGeo, band: PageBand): NoteGeo | undefined {
  if (!inBand(band, n.y) || !inBand(band, n.y + n.height)) return undefined;
  return { ...n, y: shift(band, n.y) };
}

/** CLAMP — an activation bar is a `URectangle` and nothing else. */
function clipActivation(a: ActivationGeo, band: PageBand): ActivationGeo | undefined {
  const span = clampSpan(band, a.y, a.height);
  if (span === undefined) return undefined;
  return { ...a, y: span.y, height: span.height };
}

/**
 * ALL-OR-NOTHING on the BAND'S OWN y, `y + height / 2`
 * (`ComponentRoseDivider.java:68,79`) — not on the tile's top.
 *
 * The divider's five shapes (band rect, two rules, label box, text) are all
 * within a few pixels of that line, so it is the y that decides whether any
 * of them survives. Taking the tile's TOP instead would keep a divider whose
 * ink is entirely below the band: the tile that starts at `newpageY + 21`
 * has its top inside `[…, newpageY + 22]` while every shape it draws is
 * ~20px lower and clipped away. That case is real — it is `digula`'s
 * `== Page 2 ==` — and `digula`'s golden confirms the jar draws none of it.
 */
function clipDivider(d: DividerGeo, band: PageBand): DividerGeo | undefined {
  if (!inBand(band, d.y + d.height / 2)) return undefined;
  return { ...d, y: shift(band, d.y) };
}

/**
 * CLAMP the body rectangle; then the header tab and each `else` separator
 * answer for themselves. This is the one kind where upstream genuinely mixes
 * the two rules: `GroupingTile` draws a `Blotter` rect (clamped) and a
 * header component whose corner tab is a `UPath` and whose label is a
 * `UText` (both all-or-nothing).
 *
 * `headerClipped` is set when the tab's `UPath` would fail the min/max
 * corner test — its bbox spans `[y, y + tabHeight]`. `refBody` goes with it:
 * those lines are positioned from the header band, so the header's fate is
 * theirs.
 */
function clipFrame(f: FrameGeo, band: PageBand): FrameGeo | undefined {
  const span = clampSpan(band, f.y, f.height);
  if (span === undefined) return undefined;
  const headerClipped = !inBand(band, f.y) || !inBand(band, f.y + f.tabHeight);
  return {
    ...f,
    y: span.y,
    height: span.height,
    branchSeparators: f.branchSeparators
      .filter((s) => inBand(band, s.y))
      .map((s) => ({ ...s, y: shift(band, s.y) })),
    refBody: headerClipped ? [] : f.refBody,
    ...(headerClipped ? { headerClipped: true } : {}),
  };
}

/**
 * ALL-OR-NOTHING on the separator's own y, `tile.y + MARGINY`
 * (`NewpageTile.java:88`) — a horizontal `ULine`, so `getClippedLine`
 * returns `null` the moment that y leaves the band.
 *
 * It is deliberately inside BOTH adjacent bands: page k ends at
 * `tile.y + 21 + 1` and page k+1 begins at `tile.y`, and the separator sits
 * at `tile.y + 10`. That overlap is the point — see
 * `PlayingSpaceWithParticipants.java:78-80`.
 */
function clipNewpage(n: NewpageGeo, band: PageBand): NewpageGeo | undefined {
  if (!inBand(band, n.y + NEWPAGE_MARGIN_Y)) return undefined;
  return { ...n, y: shift(band, n.y) };
}

/** A `space` reserves height and emits no ink, so there is nothing for a
 *  clip to trim; it is carried through translated. */
function shiftSpace(s: SpaceGeo, band: PageBand): SpaceGeo {
  return { ...s, y: shift(band, s.y) };
}

function clipEvent(event: EventGeo, band: PageBand): EventGeo | undefined {
  switch (event.kind) {
    case 'message':
      return clipMessage(event, band);
    case 'note':
      return clipNote(event, band);
    case 'activation':
      return clipActivation(event, band);
    case 'frame':
      return clipFrame(event, band);
    case 'divider':
      return clipDivider(event, band);
    case 'space':
      return shiftSpace(event, band);
    case 'newpage':
      return clipNewpage(event, band);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** `PlayingSpace#getNewpageTiles` (`:326-336`), in layout order — including
 *  the ones nested in a `group`, which that method reaches through
 *  `GroupingTile#addNewpageTiles`. */
export function newpageTilesOf(geo: SequenceGeometry): NewpageGeo[] {
  return geo.events.filter((e): e is NewpageGeo => e.kind === 'newpage');
}

/** `PlayingSpace#getNbPages` — `yNewPages().size() - 1`, where `yNewPages`
 *  is `[0, …each tile's y…, MAX_VALUE]` (`:338-350`). Always >= 1. */
export function sequencePageCount(geo: SequenceGeometry): number {
  return newpageTilesOf(geo).length + 1;
}

/**
 * One page of `geo`, 0-based.
 *
 * Returns `geo` ITSELF, by reference, when the document has no `newpage` —
 * the same fast path `scaleSequenceGeometry` takes at `k === 1`, and what
 * bounds this feature's blast radius to the documents that ask for it.
 * Upstream reaches the same conclusion by a different route: it applies no
 * `UClip` at all unless `getNbPages() > 1` (`:218-221`).
 *
 * `pageIndex` is clamped into `[0, pageCount - 1]` rather than throwing,
 * because `PlayingSpaceWithParticipants#getYMax` is itself written to answer
 * for an index past the end (`:106-110`).
 */
export function paginateSequence(geo: SequenceGeometry, pageIndex: number): SequenceGeometry {
  const tiles = newpageTilesOf(geo);
  if (tiles.length === 0) return geo;

  const index = Math.min(Math.max(pageIndex, 0), tiles.length);
  // `getYMin` (`:96-102`) / `getYMax` (`:104-110`), shifted by `headHeight`
  // because this port's body starts below the head row -- decisions.md D1.
  const ymin = index === 0 ? geo.headHeight : tiles[index - 1]!.y;
  const tile = tiles[index];
  const ymax =
    tile === undefined
      ? geo.lifelineEndY
      : Math.min(tile.y + tile.height, geo.lifelineEndY);

  const band: PageBand = { top: ymin, bottom: ymax + 1, dy: geo.headHeight - ymin };

  // `pageHeight + headHeight` -- where `drawU` puts the footbox row
  // (`:225-226`) and where `calculateDimensionSlow` ends the image
  // (`:80-86`). This port spends ONE field where upstream has two: its
  // `lifelineEndY` is both the lifeline's bottom and the footbox's top,
  // which the clip separates by exactly the band's `+ 1` on any page but the
  // last. The footbox/image answer is taken, so an inner page's lifelines
  // stop 1px short of the jar's -- under the footbox that covers them.
  const lifelineEndY = shift(band, ymax);
  const delta = lifelineEndY - geo.lifelineEndY;
  const totalHeight = geo.totalHeight + delta;

  return {
    ...geo,
    events: geo.events
      .map((e) => clipEvent(e, band))
      .filter((e): e is EventGeo => e !== undefined),
    lifelineEndY,
    footerShapeY: geo.footerShapeY + delta,
    totalHeight,
    // `dolls.drawEnglobers` is handed `body.calculateDimension().getHeight()
    // + ...` (`SequenceDiagramFileMakerTeoz.java:138-140`), i.e. the PAGE's
    // height -- englobers are drawn outside the clip and re-sized per page.
    boxes: geo.boxes.map((b) => ({ ...b, height: totalHeight })),
  };
}

// ---------------------------------------------------------------------------
// Per-page chrome
// ---------------------------------------------------------------------------

/** One `newpage`'s title, as `CommandNewpage#executeArg` files it:
 *  `DisplayPositioned.single(location, strings, CENTER, TOP)`, or
 *  `Display.NULL` when the command carried no LABEL (`:90-92`). */
function newpageTitle(event: NewpageEvent): DisplayPositioned {
  if (event.title === undefined)
    return noneDisplayPositioned(HorizontalAlignment.CENTER, VerticalAlignment.TOP);
  return singleDisplayPositioned(
    event.title,
    HorizontalAlignment.CENTER,
    VerticalAlignment.TOP,
  );
}

/** `SequenceDiagram#titles`, in the order `newpage(...)` appended them —
 *  source order, including inside a `group`/`alt` branch, which is the same
 *  recursion `PlayingSpace#getNewpageTiles` performs over the tiles. */
function newpageTitlesOf(events: readonly SequenceEvent[]): DisplayPositioned[] {
  const titles: DisplayPositioned[] = [];
  for (const event of events) {
    if (event.kind === 'newpage') titles.push(newpageTitle(event));
    else if (event.kind === 'frame')
      for (const branch of event.branches) titles.push(...newpageTitlesOf(branch));
  }
  return titles;
}

/**
 * The AST as page `pageIndex`'s chrome reads it.
 *
 * `TitledDiagram#addChrome(index, …)` takes the diagram's own title and then,
 * for `index > 0` and ONLY on a `SequenceDiagram`, replaces it with
 * `getTitle(index)` = `titles.get(index - 1)` (`:469-476`,
 * `SequenceDiagram.java:111-115`). Caption, legend, header and footer are not
 * touched, so neither are they here.
 *
 * Returns the input unchanged for page 0, for a document with no chrome at
 * all, and for an index past the last `newpage`.
 */
export function sequencePageAst(
  ast: SequenceDiagramAST,
  pageIndex: number,
): SequenceDiagramAST {
  const annotations = ast.annotations;
  if (pageIndex <= 0 || annotations === undefined) return ast;
  const title = newpageTitlesOf(ast.events)[pageIndex - 1];
  if (title === undefined) return ast;
  return { ...ast, annotations: { ...annotations, title } };
}
