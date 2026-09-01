/**
 * The geometry `renderer.ts` draws ITSELF — notes, dividers, the `newpage`
 * separator, explicit vertical space, and the `box` group background.
 *
 * One of the four per-renderer geometry modules `geo.ts` was split into (D8).
 * Where the other three pair with a dedicated `renderer-*.ts`, this one is the
 * remainder: every geo whose drawing lives in `renderer.ts` proper. That is a
 * real organizing principle rather than a leftover bucket — it is exactly the
 * set one Phase A task owns — but it does mean the module is named for the
 * majority, not for all of it. {@link BoxGeo} is a participant GROUPING, not an
 * annotation; it is here because `renderBoxBackground` is here.
 *
 * Re-exported by `geo.ts`, which is re-exported by `ast.ts`.
 */

export interface NoteGeo {
  kind: 'note';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color?: string;
  shape?: 'rect';
}

export interface DividerGeo {
  kind: 'divider';
  text: string;
  /** `text` split on `\n` (`Display.getWithNewlines`). The empty `====` form
   *  is `['']`, which still occupies one line box upstream. */
  lines: readonly string[];
  /** The tile's TOP, as with every other geo here — not the band's own y,
   *  which sits at `y + height / 2` (`ComponentRoseDivider.java:68,79`). */
  y: number;
  /** The band's span: `[border1, border2]`, not `[0, totalWidth]`. */
  bandX: number;
  bandWidth: number;
  /** `#getPreferredHeight` (`:127-129`). */
  height: number;
  /** `AbstractTextualComponent#getTextWidth`/`#getTextHeight` — the text
   *  block plus the component's `topRightBottomLeft(4, 4, 4, 4)`. */
  textWidth: number;
  textHeight: number;
}
// Every field above is resolved in LAYOUT and only read by the renderer; see
// `divider-style.ts` for each one's derivation and the jar measurements
// behind it. That split is the point -- a divider's drawn box and the space
// reserved for it must come from one measurement, which is the defect class
// `planning/sizer-renderer-parity.md` names.

export interface SpaceGeo {
  kind: 'space';
  y: number;
  height: number;
}

/**
 * `NewpageTile` (`teoz/NewpageTile.java`) — the page boundary, as laid out.
 *
 * It is a tile like any other: it occupies vertical space, the tiles after it
 * stack below it, and `PlayingSpace#yNewPages` reads back each one's
 * `getYGauge().getMin()` to build the page list (`:338-345`). Carrying it as
 * an `EventGeo` rather than as a bare number on {@link SequenceGeometry} is
 * what makes that true here too: the y comes out of the same cursor walk
 * every other tile's does, including inside a `group`/`alt` branch, which is
 * the recursion `PlayingSpace#getNewpageTiles` performs through
 * `GroupingTile#addNewpageTiles` (`:326-336`).
 */
export interface NewpageGeo {
  kind: 'newpage';
  /** The tile's TOP — `getYGauge().getMin()`, the value `yNewPages`
   *  collects. The separator itself is drawn `MARGINY` (10) below it. */
  y: number;
  /** `NewpageTile#getPreferredHeight` — `ComponentRoseNewpage
   *  #getPreferredHeight`'s `1` plus `2 * MARGINY`
   *  (`NewpageTile.java:50,94-96`, `ComponentRoseNewpage.java:68-71`), so
   *  21. This is why page k extends 21px past the newpage's own y and the
   *  separator belongs to both adjacent pages. */
  height: number;
  /** The separator's span: `[border1, border2]`, back-filled once
   *  `totalWidth` is known, exactly as {@link DividerGeo.bandX} is.
   *  `NewpageTile#drawU` translates by `border1` and hands the component an
   *  `Area` of `border2 - border1 - xOrigin` (`:83-90`). */
  bandX: number;
  bandWidth: number;
}

/**
 * Geometry for a single box group background rectangle.
 * Spans from y=0 to totalHeight, covering all participant columns in the group.
 */
export interface BoxGeo {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
}
