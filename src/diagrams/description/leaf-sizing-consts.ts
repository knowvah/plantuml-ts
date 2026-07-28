/**
 * Shared constants + context types for description leaf sizing.
 *
 * Split out of `leaf-sizing.ts` (S1L-f part 2b) so it and
 * `leaf-sizing-folder.ts` can both depend on the per-USymbol tables without
 * importing each other — the geometry lives with the sizing rule that uses
 * it, the numbers live here.
 */

import type { USymbol } from '../../core/descriptive-keywords.js';
import type { GuillemetPair } from '../../core/text/Guillemet.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';

/** `skinparam componentStyle` — only `uml2` (the default) draws the corner
 *  component icon; `uml1` and `rectangle` render a plain box. */
export type ComponentStyle = 'uml2' | 'uml1' | 'rectangle';

/** Per-diagram box-sizing context threaded from `ClassifyCtx` into
 *  `measureLeafNode`. Bundled (rather than separate params) to keep the
 *  sizing signatures within the argument-count budget. */
export interface BoxSizingOpts {
  componentStyle?: ComponentStyle | undefined;
  /** `skinparam minClassWidth` / style `MinimumWidth` (`PName.MinimumWidth`) —
   *  floors the text-block CONTENT width, before margin + icon. Default 0. */
  minimumWidth?: number | undefined;
  /** `skinparam wrapWidth` / `style.wrapWidth()` (`PName.MaximumWidth`) —
   *  word-wraps the entity's DESC text block, and only that one (upstream's
   *  `BodyFactory.create3` passes the strategy to `desc`; `name`/`stereo`
   *  never receive it). 0/absent = no wrapping, upstream's own default. */
  wrapWidth?: number | undefined;
  /** `skinparam guillemet` (`theme.guillemetStart`/`End`) — the pair a
   *  `<<…>>` run in the DISPLAY is rewritten to. Threaded so the sizer
   *  measures what `manageGuillemet` will actually render (S1L-f); absent =
   *  upstream's `«`/`»` default. */
  guillemet?: GuillemetPair | undefined;
  /** Registry view reporting sprite INK extents — the use-case ellipse
   *  footprint is fit to drawn-path bounds, not declared boxes (S1L-k). */
  inkSprites?: SpriteDimsLookup | undefined;
  /** Per-element font SIZE override (`skinparam <sname>FontSize N` /
   *  `<style> <sname> { FontSize N }`), already resolved for this node's
   *  USymbol by `resolveElementFontSize(theme, sname, 'title')` — the SAME
   *  call `renderer-symbol.ts#textFont` makes, so box and ink agree. Only
   *  the SIZE is threaded: `glyphWidth` ignores the family (`_fontName`),
   *  so `FontName`/`FontStyle` are width-neutral under the deterministic
   *  width table. Absent = the diagram-wide font size (S1L-h). */
  fontSize?: number | undefined;
}

/** Legacy actor box constants (kept for the re-export; the DOT size now comes
 *  from the stickman + label stack below). */
export const ACTOR_WIDTH = 50;
export const ACTOR_HEIGHT = 70;
/** ActorStickMan.getPreferredWidth = max(arms 13, legs 13) × 2 + 2×thickness
 *  = 26 + 1 (default thickness 0.5). */
export const ACTOR_STICKMAN_WIDTH = 27;
/** ActorStickMan.getPreferredHeight = headDiam 16 + body 27 + legsY 15 +
 *  2×thickness + 1 = 59 + 1 (default thickness 0.5, no shadow). */
export const ACTOR_STICKMAN_HEIGHT = 60;
/** Legacy fixed use-case ellipse height (renderer fallback / re-export). The
 *  actual DOT size now comes from the containing-ellipse formula below. */
export const USECASE_HEIGHT = 40;
/** `UEllipse.bigger(6)` — TextBlockInEllipse enlarges the containing ellipse by
 *  6px on each dimension after fitting it to the text footprint. */
export const USECASE_ELLIPSE_BIGGER = 6;
/** Aspect clamp on the containing ellipse (TextBlockInEllipse: alpha in [0.2,0.8]). */
export const USECASE_ALPHA_MIN = 0.2;
export const USECASE_ALPHA_MAX = 0.8;
/**
 * Default box text-block minimum width (`MinimumWidth` style,
 * `EntityImageDescription:186` / `BodyEnhanced2:114`): 0 — a narrow box is
 * sized purely by its text + margin (verified: oracle `rectangle "i"` = 24px,
 * not floored). `skinparam minClassWidth` / style `MinimumWidth` raise it via
 * `BoxSizingOpts.minimumWidth` (S1L-g).
 */
export const BOX_MIN_WIDTH_DEFAULT = 0;

/**
 * Per-USymbol box margin `[horizontal (x1+x2), vertical (y1+y2)]` in px,
 * transcribed verbatim from upstream `decoration/symbol/USymbol*.java`
 * `getMargin()`. Symbols not listed use DEFAULT_BOX_MARGIN.
 */
export const SYMBOL_BOX_MARGIN: Partial<Record<USymbol, readonly [number, number]>> = {
  component: [20, 20], // USymbolComponent1 (uml2/default) Margin(10,10,10,10)
  rectangle: [20, 20], // USymbolRectangle
  node: [40, 30], //      USymbolNode        Margin(15,25,20,10)
  frame: [40, 30], //     USymbolFrame       Margin(15,25,20,10)
  folder: [30, 23], //    USymbolFolder      Margin(10,20,13,10)
  package: [30, 23], //   USymbolFolder
  artifact: [30, 23], //  USymbolArtifact    Margin(10,20,13,10)
  card: [20, 6], //       USymbolCard        Margin(10,10,3,3)
  cloud: [20, 20], //     USymbolCloud (non-uml2) Margin(10,10,10,10)
  database: [20, 29], //  USymbolDatabase    Margin(10,10,24,5)
  storage: [20, 20], //   USymbolStorage
  file: [20, 20], //      USymbolFile
  person: [20, 20], //    USymbolPerson
  hexagon: [20, 20], //   USymbolHexagon
  label: [20, 20], //     USymbolLabel
  collections: [20, 20], // USymbolCollections
  queue: [20, 10], //     USymbolQueue       Margin(5,15,5,5)
  stack: [50, 20], //     USymbolStack       Margin(25,25,10,10)
  action: [30, 20], //    USymbolAction      Margin(10,20,10,10)
  process: [40, 20], //   USymbolProcess     Margin(20,20,10,10)
  agent: [20, 20], //     rectangle-like
};
/** Margin for any box symbol not in SYMBOL_BOX_MARGIN (upstream default). */
export const DEFAULT_BOX_MARGIN: readonly [number, number] = [20, 20];

/** Stereotype line horizontal margin — `TextBlockUtils.withMargin(stereo, 1, 0)`
 *  in EntityImageDescription adds 1px each side (+2 total width, +0 height). */
export const STEREO_MARGIN = 2;

/**
 * Per-line text height as a multiple of the font size. In the DETERMINISTIC
 * text mode that the oracle goldens use, `StringBounderFromWidthTable
 * .calculateDimension` returns height = size (no Creole leading), so a text
 * block is exactly `lineCount × size` tall — matching our own
 * `WidthTableMeasurer` (which likewise returns height = size). Hence 1.0.
 *
 * (An earlier value of 1.177736 was calibrated against the AWT build of the
 * oracle jar in `oracle/dist`, which is NOT the deterministic-patched jar that
 * produced the goldens — AWT adds ~2.5px/line of leading. Component golden
 * height 44px = 20 margin + 14 line + 10 icon confirms line = size = 14.)
 */
export const LINE_HEIGHT_FACTOR = 1.0;

/**
 * Fixed pixel allowance `[width, height]` a USymbol's decoration adds on top of
 * its text box, independent of the font. UML2 `component` reserves space for
 * the corner component icon (measured `+20w, +10h` vs a plain rectangle in the
 * deterministic oracle). Symbols with no decoration add nothing.
 */
export const SYMBOL_ICON_ALLOWANCE: Partial<Record<USymbol, readonly [number, number]>> = {
  component: [20, 10], // USymbolComponent1 UML2 corner icon
  cloud: [10, 10], //    cloud puffs (verified: cloud "L" 37.5×46.5 vs rect 27.5×36.5)
  // folder/package are NOT here: both are USymbolFolder and route to
  // `measureFolderLeaf`, never `measureBox`. It models the tab as the mergeTB
  // block upstream makes it, so the tab FLOORS the width as well as adding
  // height -- which a fixed icon allowance cannot express (S1L-a).
};

/**
 * `USymbolSimpleAbstract` symbols — the family whose `asSmall` stacks a fixed
 * DRAWING above the label (`mergeLayoutT12B3(stereo, drawing, label)`) rather
 * than wrapping text in a bordered box. Width is `max(drawing, label)`,
 * height is `drawing + label` — exactly the shape `measureActor` already had.
 *
 * Dimensions are each drawing's own `calculateDimension`, all of the form
 * `radius * 2 + 2 * margin` (margin 4, radius 12 for the robustness trio):
 *   - `Control` 24 + 8 = 32 x 32 (svek/Control.java:51-53, :87-88)
 *   - `EntityDomain` 32 x 32 (svek/EntityDomain.java:50-52, :75)
 *   - `Boundary` 24 + left 17 + 8 = 49 wide x 32 (svek/Boundary.java:52-55, :98)
 *
 * `actor` keeps its own constants below (a stickman, not a radius+margin
 * circle) and `interface`/`circle` are excluded entirely: they are the same
 * family but `hideText` drops the label, so they size as the bare circle
 * (see INTERFACE_CIRCLE_SIZE). Before this, control/boundary/entity fell to
 * `measureBox`'s generic [20, 20] margin — `control "C"` measured 30x34
 * against the jar's 32x46 (kizobu-64-rozo458 / tacixe-99-gesi489, S1L-e).
 */
export const SIMPLE_SYMBOL_DRAWING: Partial<Record<USymbol, readonly [number, number]>> = {
  control: [32, 32],
  entity: [32, 32],
  boundary: [49, 32],
};

/** Fixed square a `port`/`portin`/`portout` leaf occupies
 *  (EntityPosition.RADIUS * 2, abel/EntityPosition.java:56). */
export const PORT_SIZE = 12;

/**
 * `USymbolFolder(sname, showTitle)` — the ONE symbol class behind both
 * `folder` (`showTitle=false`) and `package` (`showTitle=true`)
 * (USymbols.java:79/86). Absence from this table means "not the folder
 * family"; see `measureFolderLeaf` for why the two forms size differently.
 * `artifact` is deliberately NOT here: it shares the folder MARGIN but is
 * USymbolArtifact, and already measures exact.
 */
export const FOLDER_FAMILY_SHOW_TITLE: Partial<Record<USymbol, boolean>> = {
  folder: false,
  package: true,
};

/** `USymbolFolder.getDimTitle` when `showTitle == false`: the tab is a FIXED
 *  `XDimension2D(40, 15)` block, independent of any text
 *  (USymbolFolder.java:172). It enters `mergeTB` as a normal block, so the 40
 *  FLOORS the leaf's content width and the 15 adds to its height. */
export const FOLDER_TAB_WIDTH = 40;
export const FOLDER_TAB_HEIGHT = 15;

/**
 * Extra width a SHOWN folder title contributes beyond its own text
 * (`package`). Measured exactly 12px against the deterministic oracle at
 * three different title widths — `package a` 49.787496 vs our 37.7875,
 * `package iiii` 54.599976 vs 42.6, `package WWWWWWWW` 147.700008 vs 135.7
 * (deltas 11.999996 / 11.999976 / 12.000008, i.e. 12 within DOT's
 * 6-decimal-inch rounding).
 *
 * NOT attributed to a single upstream expression: `USymbolFolder`'s own
 * `calculateDimension` adds only `getMargin()` (= [30, 23]) to
 * `dimName.mergeTB(...)`, so the 12 lives inside the title TextBlock itself.
 * Nearby candidates that do NOT sum to it: `marginTitleX1 + marginTitleX2`
 * = 6 (the drawn tab's own inset, USymbolFolder.java:60-61), `+ marginTitleX3`
 * = 13 (the tab slant's right edge), and the title's `UTranslate(4, 3)` draw
 * offset. Recorded as measured rather than guessed at; it applies ONLY to the
 * showTitle slot — a `folder`'s label text takes no such allowance (verified:
 * `folder WWWWWWWWW` is exact at labelW + 30).
 */
export const FOLDER_SHOWN_TITLE_EXTRA_WIDTH = 12;

/** Fixed square a `hideText` leaf (interface/circle) occupies:
 *  `CircleInterface2.calculateDimension` = `radius * 2 + 2 * margin` with
 *  `radius = 8`, `margin = 1` -> 18px = 0.25in exactly.
 *  @see .../svek/CircleInterface2.java#calculateDimension */
export const INTERFACE_CIRCLE_SIZE = 18;

// EntityImageNote sizing. Notes use FontParam.NOTE — a fixed 13px font, not the
// theme's default. Total horizontal margin (text padding + folded corner) and
// vertical margin measured exactly against the deterministic oracle.
export const NOTE_FONT_SIZE = 13;
export const NOTE_MARGIN_H = 21;
export const NOTE_MARGIN_V = 10;

export type Dim = { width: number; height: number };
