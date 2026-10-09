/**
 * Row builders split out of `note-layout-measure.ts` (500-line module cap):
 * the shared row/context types + per-row height rule, the A12 creole-table
 * grid row (`StripeTable`/`AtomTable` geometry), and the R2b `{{ ... }}`
 * embedded-diagram row (`EmbeddedDiagram` region collapse). Leaf module —
 * imports only shared creole primitives, never `note-layout-measure.ts`
 * itself (no cycle). All doc comments carried over verbatim from their
 * pre-split home; see `note-layout-measure.ts`'s module doc comment for
 * the overall `BodyEnhanced2` note-assembly picture.
 */
import type { StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { getFont } from '../../core/klimt/shape/UText.js';
import { FontPosition, fontPositionSpace } from '../../core/klimt/font/FontPosition.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import type { NoteTableDraw } from './note-layout-measure-table.js';
import { atomTextLineHeight } from './class-stereotype-layout.js';
import { EmbeddedDiagram, type NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import { getClassNestedDiagramRenderer, type RenderedEmbeddedImage } from './class-nested-diagram-renderer.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';

/** One assembled render row (post block/table/bullet resolution). */
export interface NoteRow {
  text: string;
  width: number;
  atoms: readonly MemberRenderAtom[];
  height: number;
  /** T10: present only for a block-separator "leading" row (the row whose
   *  `.height` is `BodyEnhancedAbstract#decorate`'s `contentTop` margin --
   *  see `note-layout-measure.ts#appendDecoratedBlock`'s own doc comment) --
   *  tells the renderer to draw a `<line>` at this row's OWN top (offset
   *  {@link NoteDividerDraw.dividerYOffset} down from it). */
  divider?: NoteDividerDraw;
  /** T10: present only for a creole-table grid row (`CreoleParser
   *  .isTableLine` run, {@link buildTableRow}) -- tells the renderer to
   *  draw the grid + every cell's own text atoms at this row's own top. */
  table?: NoteTableDraw;
}

/** T10: `UHorizontalLine#getStroke`'s draw parameters for a note block
 *  separator, mirrored from `class-body-enhanced-layout.ts#EnhancedDividerPart`
 *  (the class-body divider's OWN identical shape, already jar-verified for
 *  every one of these fields) -- duplicated rather than imported since that
 *  interface (and its three small `separatorStroke*` builders) are private
 *  to a file this module does not otherwise depend on, matching this file
 *  family's established "duplicate a small private helper rather than cross
 *  a module boundary for it" precedent (`renderer-note.ts#noteAtomDecoration`'s
 *  own doc comment cites the same convention).
 * @see ~/git/plantuml/.../klimt/shape/UHorizontalLine.java#getStroke,drawHLine
 */
export interface NoteDividerDraw {
  /** Offset from this row's own top where the `<line>` actually draws -- 0
   *  for an UNTITLED separator (`BodyEnhancedAbstract#decorate`'s
   *  `TextBlockLineBefore#drawU`: the line draws BEFORE any margin
   *  translate). For a TITLED separator the draw sits on the block's
   *  TRAILING row (`TextBlockLineBefore.java:90-100` draws the block FIRST,
   *  then the titled line), so the offset is NEGATIVE: it points back up to
   *  the line's own y (cdd6 T3f, nuveji-19-jabi587 -- the "zero corpus
   *  reach" belief this field's doc once carried is disproved by that row). */
  readonly dividerYOffset: number;
  readonly strokeWidth: number;
  readonly strokeDasharray?: string;
  readonly doubleLine?: boolean;
  /** cdd6 T3f: a titled separator's own label -- `UHorizontalLine
   *  #drawLineInternal`'s title arm (`UHorizontalLine.java:92-97`). */
  readonly title?: NoteDividerTitle;
}

/** A titled separator's measured label (`BodyEnhancedAbstract#getTitle`,
 *  java:94-100: `Display.getWithNewlines(...).create(titleConfig, LEFT)`):
 *  its block size plus each line's own atoms at its top offset `y`. */
export interface NoteDividerTitle {
  readonly width: number;
  readonly height: number;
  readonly lines: readonly { readonly y: number; readonly atoms: readonly MemberRenderAtom[] }[];
}

/** `note-layout-measure.ts#appendDecoratedBlock`'s own untitled-separator
 *  draw-metadata build -- kept here (not there) purely for that file's
 *  500-line cap. */
export function buildDividerDraw(char: string, dividerYOffset: number, title?: NoteDividerTitle): NoteDividerDraw {
  return {
    dividerYOffset,
    strokeWidth: separatorStrokeWidth(char),
    ...separatorStrokeExtras(char),
    ...(title !== undefined ? { title } : {}),
  };
}

/** `UHorizontalLine#getStroke`: `'-'`/`'='` -> thickness 1; `'.'` -> thickness
 *  1 dashed (`new UStroke(1, 2, 1)`); anything else (`'_'`, synthetic
 *  block0/trailing-empty sentinel) -> thickness 0.5 (`PName.LineThickness`'s
 *  default -- `note-layout-measure.ts`'s own `ELEMENT_DEFAULT_LINE_THICKNESS`
 *  import would cycle back here, so the literal is repeated, matching
 *  `class-body-enhanced-layout.ts`'s own identical literal). Duplicated from
 *  that file's private, byte-identical helper rather than imported -- see
 *  `NoteDividerDraw`'s own doc comment for the precedent. */
function separatorStrokeWidth(char: string): number {
  return char === '-' || char === '=' || char === '.' ? 1 : 0.5;
}

/** `UHorizontalLine#drawHLine`'s `'.'` dash pattern and `'='` double-line
 *  flag, bundled into ONE optional-spread object so the caller stays under
 *  this project's per-call-site param/NLOC cap. */
function separatorStrokeExtras(char: string): { strokeDasharray?: string; doubleLine?: true } {
  if (char === '.') return { strokeDasharray: '1,2' };
  if (char === '=') return { doubleLine: true };
  return {};
}

// T2d (500-line cap): the creole-table grid types + builders moved to
// `note-layout-measure-table.ts` (`<#color>` capture pushed this file over)
// -- re-exported here so no consumer's import path changed (pure move,
// same "split purely for size" precedent this whole file family follows).
export type { NoteTableCell, NoteTableDraw } from './note-layout-measure-table.js';
export { buildTableRow } from './note-layout-measure-table.js';

/** Per-line build inputs the row builders need (one bundled param). */
export interface NoteLineBuildContext {
  fontSize: number;
  font: FontConfiguration;
  fontSpec: { readonly family: string; readonly size: number };
  measurer: StringMeasurer;
  maxWidth: number;
  /** A2s R2h (rotisi-30): the diagram's sprite registry -- threaded from
   *  the class layout so a `<$name>` atom in note text resolves exactly as
   *  it does in a member row (`resolveMemberAtoms`' own registry param).
   *  `undefined` (no `sprite` command in the diagram) drops sprite atoms,
   *  the same behavior as before the threading. */
  sprites?: SpriteRegistry | undefined;
}

/**
 * G2 N56: one note line's own height -- jar's real `Sea`/`Position` math
 * (`SheetBlock1#initMap`'s `sea.doAlign()` + `getHeight() == getMaxY() -
 * getMinY()`), algebraically closed-formed as `max(altitude) + max(height -
 * altitude)` (same reduction as `class-member-creole-sea.ts
 * #seaLineHeightAndSpan`, this function's row-height sibling for member
 * text -- kept as an independent formula here because this function only
 * ever sees the ALREADY-RESOLVED `MemberRenderAtom[]`, not the raw
 * `CreoleAtom[]` `resolveMemberAtoms` builds `dy` from). For every NORMAL
 * (non-superscript/subscript, `FontPosition.getSpace() == 0`) atom every
 * altitude is 0 and this collapses to the PRE-SI30 flat MAX over each
 * atom's own `AtomText#calculateDimensionSlow` height (floored at 10) --
 * NOT an ascent/descent-weighted SUM (confirmed algebraically: every atom's
 * measured-rect BOTTOM edge aligns to the SAME shared y=0, so the stripe's
 * total span is exactly the tallest atom's own height; re-derivation
 * cross-checked against `fogexa-30-zupo141`'s real per-run baselines --
 * "In java," @ y=26.1111 (13pt), "every" @ y=25 (18pt, `<size:18>`) on the
 * SAME physical line, delta 1.1111 == the two sizes' own `size/4.5` descent
 * difference, and the NEXT line's baseline sits EXACTLY 18 (not 13) below
 * this line's own top, proving the cumulative stack advances by each
 * line's own MAX height). SI30 D2/D3: a `<sup>`/`<sub>` run's own non-zero
 * altitude (`FontPosition.getSpace()`, `AtomText.java:321-323`) now grows
 * the line correctly instead of being floor-clipped away -- jar-verified
 * against `exposant-01-class`'s `**bold <sub>sub</sub> and <sup>sup</sup>
 * text**` note line (0.402778in target note height, only reachable via this
 * reduction, not the flat MAX).
 * A2s R2h: 'image' atoms (sprite/`<img:...>`) contribute their OWN raw
 * height at altitude 0 -- `AtomImg`/`AtomSprite` both have
 * `getStartingAltitude == 0` (AtomImg.java:242-244, AtomSprite.java:69-71),
 * jar-confirmed by rotisi-30-loge424's `note left : <$printer4>` node:
 * 0.347222in = 15 (sprite height, no 10-floor -- that floor is
 * `AtomText`-specific) + 2*5 Opale margins. 'vector' (open-iconic) atoms
 * stay excluded from the reduction entirely (not merely altitude-0): `Atom
 * OpenIconic#getStartingAltitude` is `-3*factor`, NOT 0, so the derivation
 * does not transfer without independent verification (see `renderer-note.ts
 * #renderNoteLineAtoms`'s matching scope note) -- {@link noteLineHeightEntry}
 * returns `undefined` for it, same as before this task. A line with NO
 * counted atom falls back to `fallbackFontSize`, matching this function's
 * pre-N56 flat behavior for that case.
 */
export function noteLineHeight(atoms: readonly MemberRenderAtom[], fallbackFontSize: number): number {
  let maxAltitude = -Infinity;
  let maxSpan = -Infinity;
  let counted = false;
  for (const atom of atoms) {
    const entry = noteLineHeightEntry(atom);
    if (entry === undefined) continue;
    counted = true;
    if (entry.altitude > maxAltitude) maxAltitude = entry.altitude;
    const span = entry.height - entry.altitude;
    if (span > maxSpan) maxSpan = span;
  }
  return counted ? maxAltitude + maxSpan : Math.max(fallbackFontSize, 10);
}

/** One atom's `{altitude, height}` contribution to {@link noteLineHeight}'s
 *  `Sea` reduction -- `undefined` for a kind that does not count (matches
 *  the pre-SI30 exclusion of 'vector'/'bullet', see {@link noteLineHeight}'s
 *  own doc comment). Factored out to keep that function's own CCN from
 *  growing (mirrors `class-member-creole-sea.ts`'s identical split). */
function noteLineHeightEntry(atom: MemberRenderAtom): { altitude: number; height: number } | undefined {
  if (atom.kind === 'text') {
    return {
      altitude: fontPositionSpace(atom.font.fontPosition ?? FontPosition.NORMAL),
      height: atomTextLineHeight(getFont(atom.font).size),
    };
  }
  if (atom.kind === 'image') return { altitude: 0, height: atom.height };
  return undefined;
}

/** `StringBounder` adapter over this module family's `StringMeasurer`, for
 *  `EmbeddedDiagram#calculateDimension`. Height mirrors `noteLineHeight`'s
 *  per-line rule (`max(size, 10)`). The SVG-arm renderer below sizes from
 *  the exported document, so no text is measured through it; the adapter is
 *  `EmbeddedDiagram#calculateDimension`'s required argument. */
function embeddedStringBounder(measurer: StringMeasurer): StringBounder {
  return {
    calculateDimension: (font, text) => new XDimension2D(measurer.measure(text, font).width, Math.max(font.size, 10)),
  };
}

/**
 * R2b/CDD B7FU-R2/lgm-T1e: consume one `{{ ... }}` embedded-diagram region
 * starting at `blockLines[start]` (whose `getEmbeddedType` already matched)
 * and build its single row. Region collection delegates to the REAL ported
 * `EmbeddedDiagram.createAndSkip` (java:97-115 -- nesting-aware: an inner
 * `{{` increments depth, a bare `}}` decrements, only the outermost `}}`
 * is swallowed) via a counting iterator, so measurement consumes exactly
 * the lines upstream's creole parser would.
 *
 * The row's SIZING is `EmbeddedDiagram#calculateDimensionSlow`'s SVG arm
 * (java:129-133): the exported nested document's `UImageSvg` width/height,
 * which is also the DRAWN image's size. {@link nestedImageRenderer} runs the
 * registered renderer once and keeps the image for the row's `'image'` atom.
 * No renderer registered, or a render failure, takes java:148-152's catch:
 * `(42, 42)` and `atoms: []` (nothing drawn, `drawU`'s own catch, java:191-193).
 */
export function consumeEmbeddedRow(
  blockLines: readonly string[],
  start: number,
  type: string,
  ctx: NoteLineBuildContext,
): { row: NoteRow; nextIndex: number } {
  let consumed = 0;
  const base = blockLines.slice(start + 1)[Symbol.iterator]();
  const counting: Iterator<string> = {
    next: (): IteratorResult<string> => {
      const step = base.next();
      if (step.done !== true) consumed++;
      return step;
    },
  };
  const capture = nestedImageRenderer();
  const embedded = EmbeddedDiagram.createAndSkip(type, counting, null, capture.renderer);
  const dim = embedded.calculateDimension(embeddedStringBounder(ctx.measurer));
  const nextIndex = start + consumed;
  const image = capture.image();
  const atoms: readonly MemberRenderAtom[] =
    image === undefined ? [] : [{ kind: 'image', href: image.href, width: image.width, height: image.height }];
  return {
    row: {
      text: blockLines.slice(start, nextIndex + 1).join('\n'),
      width: dim.getWidth(),
      atoms,
      height: dim.getHeight(),
    },
    nextIndex,
  };
}

/** A {@link NestedDiagramRenderer} over the class engine's registered
 *  renderer that renders ONCE and remembers the image, so the row's size
 *  (`EmbeddedDiagram#calculateDimension`) and its drawn `'image'` atom come
 *  from the same render. Unregistered: throws into `EmbeddedDiagram`'s
 *  java:148-152 catch. */
function nestedImageRenderer(): { renderer: NestedDiagramRenderer; image: () => RenderedEmbeddedImage | undefined } {
  let rendered: RenderedEmbeddedImage | undefined;
  return {
    renderer: {
      render(source): TextBlock {
        const registered = getClassNestedDiagramRenderer();
        if (registered === undefined) throw new Error('note-layout-measure: no nested-diagram renderer registered');
        const image = registered.renderImage(source);
        rendered = image;
        return {
          calculateDimension: () => new XDimension2D(image.width, image.height),
          drawU: () => undefined,
        };
      },
    },
    image: () => rendered,
  };
}
