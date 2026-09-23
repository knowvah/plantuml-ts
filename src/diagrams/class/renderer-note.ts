/**
 * Note rendering — folded-corner box + dashed connector, or the Opale
 * zigzag-notch member-tip shape (G2/N13). Split out of `renderer.ts` to
 * keep that file under the project's 500-line file cap (mirrors
 * `renderer-arrowhead.ts`/`renderer-group.ts`/`renderer-uid.ts`'s own
 * "split purely for size, no behavior change" precedent).
 *
 * `renderBulletAtom` was further split out to `renderer-bullet-atom.ts`
 * (same reason), re-exported here unchanged for
 * `renderer-classifier-rows.ts`'s own import.
 */
import type { NoteGeo } from './note-layout.js';
import type { TipShape } from './note-tips-resolve.js';
import type { Theme } from '../../core/theme.js';
import type { Paint } from '../../core/paint.js';
import { text, path, image, linkWrap, decorationLines } from '../../core/svg.js';
import { textRenderDecorations } from '../../core/klimt/drawing/svg/driver-text-svg-decorations.js';
import { renderBulletAtom } from './renderer-bullet-atom.js';
export { renderBulletAtom };
import { moveTo, lineTo } from '../../core/svg-path-builder.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';
import { splitStereotypeStyleTags } from './class-stereotype.js';
import { cleanStereotypeToken } from '../../core/style-map-element.js';
import {
  opalePolygonLeft,
  opalePolygonRight,
  opalePolygonUp,
  opalePolygonDown,
  opaleCorner,
  type OpaleBox,
  type OpaleConnector,
  type OpaleDirection,
} from './note-opale.js';
import { getFont } from '../../core/klimt/shape/UText.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import { noteLineAtomDy } from './class-member-creole-sea.js';
import { renderOpenIconicAtom } from './renderer-openiconic.js';
// cdd-T10 wiring fix: a row's own creole `----` divider / table draws AT
// THIS ROW'S OWN POSITION inside `renderNoteText`'s loop below -- see that
// function's own doc comment. `renderer-note-lines.ts` owns the pure
// per-row/per-cell drawing primitives (`NoteDividerDraw`/`NoteTableDraw`
// consumers); it imports nothing from this file, so this is not a cycle.
import { renderNoteRowExtra } from './renderer-note-lines.js';

/**
 * G2 N34: jar's `EntityImageNote` ctor default (`ColorParam.noteBackground`,
 * `plantuml.skin`) -- the fallback when NEITHER the note's own explicit
 * `#color` NOR a `<style> note { BackgroundColor ... }` bucket applies.
 */
const NOTE_FILL = '#FEFFDD';

/**
 * G2 N34: a note's own fill color, cascading explicit `#color` override
 * (`ClassNote.color`, highest precedence -- `EntityImageNote.java`'s ctor:
 * `entity.getColors().getColor(BACK)` wins outright) -> the `<style> note
 * { BackgroundColor ... } </style>` bucket default -> the hardcoded
 * `NOTE_FILL`. Reads `theme.colors.elements.note` directly rather than via
 * `resolveElementPaint` (`theme.ts`) -- that helper's own generic "no
 * bucket" fallback is `nodeBackground` (`#F1F1F1`, the class-box default),
 * NOT jar's real note default (`ColorParam.noteBackground`, `#FEFFDD`) --
 * using it here would silently wrongize every note with no override. The
 * nested `.tagname` stereotype-cascade sub-selector (`note { .faint { ...
 * } }`) is a SEPARATE, deeper mechanism -- surveyed, not built (ledger).
 */
function resolveNoteBackground(
  color: string | undefined,
  theme: Theme,
  // G2 N37: the note's OWN `<<stereotype>>` (`ClassNote.stereotype`) --
  // resolves the `.tagname` `<style>` cascade (`note { .faint {
  // BackgroundColor red } } }`) between the explicit `#color` override and
  // the bare `note {}` bucket default. Optional/trailing so every
  // pre-existing call site (no stereotype) is behavior-unchanged.
  stereotype?: string,
): Paint {
  const override = resolveBareOrBackColor(color);
  if (override !== undefined) return resolveColorToSvgHex(override);
  const tagBackground = resolveNoteTagBackground(theme, stereotype);
  if (tagBackground !== undefined) return tagBackground;
  const bucket = theme.colors.elements?.['note']?.background;
  if (bucket === undefined) return NOTE_FILL;
  // A `<style> note { BackgroundColor red }` bucket value is a raw
  // `parseColor` result (`core/paint.ts`) -- a plain color NAME still needs
  // HColorSet resolution (`resolveColorToSvgHex`, same as the explicit-
  // override branch above); a Gradient object is already a resolved `Paint`
  // and passes through unchanged (`core/svg.ts#resolvePaint` handles it).
  return typeof bucket === 'string' ? resolveColorToSvgHex(bucket) : bucket;
}

/**
 * G2 N37: `theme.colors.noteTagCascade` lookup, resolving the note's own
 * (possibly multi-label) stereotype the SAME way {@link
 * splitStereotypeStyleTags} splits a classifier's -- a note's stereotype
 * blob follows the identical `<<A>><<B>>` stacking grammar. Returns the
 * FIRST matching label's background (already a resolved `Paint` from
 * `computeNoteStyleTagCascade`'s `parseColor` call), or `undefined`.
 */
function resolveNoteTagBackground(theme: Theme, stereotype: string | undefined): Paint | undefined {
  if (stereotype === undefined) return undefined;
  const cascade = theme.colors.noteTagCascade;
  if (cascade === undefined) return undefined;
  for (const label of splitStereotypeStyleTags(stereotype)) {
    const bg = cascade[cleanStereotypeToken(label)]?.background;
    if (bg !== undefined) return bg;
  }
  return undefined;
}
/** `Opale.java`'s `cornersize` -- the folded-corner triangle size, shared by
 *  BOTH the plain fold (this file) and the zigzag-notch tip outline
 *  (`note-opale.ts#opaleCorner`, the SAME upstream constant). */
import { OPALE_CORNERSIZE as NOTE_FOLD } from '../../core/svek/image/Opale.js';
/** `Opale.java`'s `marginX1`/`marginY` -- text inset from the note box's
 *  own top-left corner (matches `note-layout.ts#measureNote`'s sizing). */
import { OPALE_MARGIN_X1 as NOTE_MARGIN_X1 } from '../../core/svek/image/Opale.js';
import { OPALE_MARGIN_Y as NOTE_MARGIN_Y } from '../../core/svek/image/Opale.js';
/** `plantuml.skin`'s `note { FontSize 13 }` default -- one point smaller
 *  than the diagram's normal text (matches `note-layout.ts#NOTE_FONT_SIZE`).
 *  G2 N39: the DEFAULT only -- see that constant's own doc comment for the
 *  `theme.colors.elements['note'].fontSize` override this renderer now also
 *  consults (`renderNoteText`'s own `fontSize` local). */
import { NOTE_FONT_SIZE } from '../../core/klimt/font/FontParam.js';
/** `note { LineThickness 0.5 }` -- the note's OWN style stroke: the box
 *  outline (body + fold). `EntityImageNote.java:275-289` `drawNormal`:
 *  `stroked = applyStroke(ug); stroked.draw(polygon)` -- the fold draws on
 *  `ug` itself, not `stroked` (see {@link NOTE_FOLD_STROKE_WIDTH}). cdd-T9b:
 *  the dashed host connector is NOT this note's own stroke -- upstream
 *  draws it as a completely separate `Link` (`CommandFactoryNoteOnEntity
 *  .java:342`), styled like any other dashed relationship edge -- see
 *  `renderer-note-connector.ts#renderNoteConnectorPath`. */
const NOTE_STROKE_WIDTH = 0.5;

/** `EntityImageNote.java:275-289` `ug.draw(Opale.getCorner(...))`: the fold
 *  draws on the UNSTROKED `ug`, so it keeps the diagram's DEFAULT stroke
 *  width (1), never the note's own {@link NOTE_STROKE_WIDTH} (0.5). */
const NOTE_FOLD_STROKE_WIDTH = 1;

/**
 * `Opale.java:149-167` `getPolygonNormal`, `roundCorner === 0` (class notes
 * never set `skinparam NoteRoundCorner`): `moveTo(0,0) lineTo(0,height)
 * lineTo(w,height) lineTo(w,cornersize) lineTo(w-cornersize,0) lineTo(0,0)`
 * -- DOWN the left side first, opposite the old winding. `f` = `Opale
 * #cornersize` ({@link NOTE_FOLD}); `(x,y)` the note's absolute origin.
 */
function noteBodyPathData(x: number, y: number, w: number, h: number, f: number): string {
  return [
    moveTo(x, y),
    lineTo(x, y + h),
    lineTo(x + w, y + h),
    lineTo(x + w, y + f),
    lineTo(x + w - f, y),
    lineTo(x, y),
  ].join(' ');
}

/**
 * G2 N55: draws ONE note line's per-atom creole content -- the note-local
 * mirror of `renderer-classifier-box.ts`'s private `renderRowAtoms` (same
 * per-atom-kind switch, same per-atom-`textLength`/unrounded-x-advance
 * convention -- `textLength` rounds to 3dp at SVG emission (ADR-1,
 * `core/svg.ts#attrs`), x-advance stays the exact unrounded `atom.width`)
 * -- duplicated rather than imported since that function is private to a
 * file this module
 * does not otherwise depend on (mirrors `buildConnectorPathData`'s own
 * "duplicated to avoid a needless cross-file dependency" precedent above).
 * G2 N67 item 49: an atom's OWN creole-resolved color (a `<color>` command)
 * still wins when set (matching `renderRowAtoms`'s identical precedence);
 * below that, `theme.colors.graph.noteCascadeFontColor` (`<style> note {
 * FontColor N } }`, `style-cascade-class.ts#NOTE_SNAMES`) applies when set;
 * only when NEITHER is present does a note's plain text fall back to the
 * hardcoded `'#000000'` default (pre-N67, this fallback was the ONLY tier --
 * notes had no per-tag/theme cascade fallback the way classifier rows did,
 * G2 N36's own now-superseded framing).
 */
/** SI30 D2: a note text atom's drawn Y -- the pre-existing UNMUTED `lineTop +
 *  lineHeight - atom.font.size / 4.5` reconstruction plus `dy`, the CALLER's
 *  own `noteLineAtomDy(atoms, lineHeight)[i]` -- NOT `atom.dy` (that field is
 *  `class-member-creole-sea.ts#textAtomDy`'s MEMBER-row correction, a
 *  different reference; see its own doc comment). Split out purely to keep
 *  {@link renderNoteLineAtoms}'s CCN from growing (mirrors `renderer-
 *  classifier-rows.ts#textAtomRowY`'s identical precedent). */
function noteTextAtomY(
  lineTop: number,
  lineHeight: number,
  atom: Extract<MemberRenderAtom, { kind: 'text' }>,
  dy: number,
): number {
  return lineTop + lineHeight - atom.font.size / 4.5 + dy;
}

function renderNoteLineAtoms(
  atoms: readonly MemberRenderAtom[],
  startX: number,
  lineTop: number,
  lineHeight: number,
  theme: Theme,
  // The SAME per-line baseline offset `renderNoteText` already computed
  // (`fontSize - fontSize/4.5`, at the note's OWN resolved font size, NOT
  // `theme.fontSize` -- a note draws at `NOTE_FONT_SIZE`/its own override,
  // never the diagram's general body font size). G2 N56: kept ONLY for
  // 'vector'/'image' atoms -- zero corpus reach for either inside a note
  // body (grep-verified against every `note-creole-markup`-tagged fixture),
  // so their placement rule stays EXACTLY the pre-N56 formula (a flat offset
  // off the note's OWN base font, not the per-line `lineHeight` a 'text'
  // atom now uses) rather than guessing an extension `AtomOpenIconic`/
  // `AtomImg`'s own `getStartingAltitude` (0 and -3*factor respectively,
  // NEITHER of which this port's Sea-alignment model currently threads)
  // would need to justify -- see `note-layout.ts#noteLineHeight`'s matching
  // scope note.
  baselineOffset: number,
): string {
  let x = startX;
  let out = '';
  const legacyY = lineTop + baselineOffset;
  // SI30 D2: one Sea reduction for the whole line -- needs every atom's own
  // `{altitude, height}` to find the shared `maxSpan`, so it is computed once.
  const dys = noteLineAtomDy(atoms, lineHeight);
  for (let i = 0; i < atoms.length; i++) {
    const atom = atoms[i]!;
    if (atom.kind === 'text') {
      // G2 N56: jar's real per-atom baseline -- `lineTop + lineHeight -
      // descent(atom)`, `descent == atom.font.size / 4.5` (the SAME formula
      // `renderNoteText`'s own flat `baselineOffset` already used, now
      // applied PER ATOM instead of once per line) -- every atom's own
      // measured-rect BOTTOM aligns to `lineTop + lineHeight`, jar-verified
      // against `fogexa-30-zupo141`'s mixed-size line (`note-layout.ts
      // #noteLineHeight`'s own doc comment has the full derivation). SI30
      // D2: the UNMUTED `atom.font.size / 4.5` term stays unchanged --
      // {@link noteTextAtomY} adds the atom's own `Sea` correction on top
      // (`dys[i]`, `decisions.md#D2`'s "must not be applied twice").
      const y = noteTextAtomY(lineTop, lineHeight, atom, dys[i]!);
      // cdd-B7FU-R1: the SAME shared port of `DriverTextSvg#draw`'s
      // font-configuration decisions the classifier rows now use
      // (java:93-173) -- weight/style/decoration plus the `<back:>` filter
      // and the custom-coloured underline/strike lines.
      const deco = textRenderDecorations(atom.font, getFont(atom.font).size);
      // G2 N57 item 38: `atom.renderText`/`renderWidth` are set ONLY for a
      // whitespace-only run (`DriverTextSvg.java`'s NBSP-substitution
      // branch, `class-member-creole.ts#MemberRenderAtom`'s own doc
      // comment) -- the DRAWN text/textLength use them when present, but
      // x-advance below stays on `atom.width` (the LAYOUT value) always.
      // SI30 D1: drawn at the EFFECTIVE (muted) size (`getFont`).
      const rendered = text(x, y, atom.renderText ?? atom.text, {
        fontFamily: atom.font.family,
        fontSize: getFont(atom.font).size,
        fill: atom.font.color ?? theme.colors.graph.noteCascadeFontColor ?? '#000000',
        lengthAdjust: 'spacing',
        textLength: atom.renderWidth ?? atom.width,
        ...(deco.fontWeight !== null ? { fontWeight: deco.fontWeight as '700' } : {}),
        ...(deco.fontStyle !== null ? { fontStyle: 'italic' as const } : {}),
        ...(deco.textDecoration !== null ? { textDecoration: deco.textDecoration } : {}),
        ...(deco.backColor !== null ? { textBackColor: deco.backColor } : {}),
      });
      out += atom.url !== undefined ? linkWrap(rendered, atom.url) : rendered;
      // Upstream java:180: drawn AFTER the `<text>` it decorates.
      out += decorationLines(deco.extraLines, x, y, atom.renderWidth ?? atom.width, getFont(atom.font).size);
      x += atom.width;
      continue;
    }
    if (atom.kind === 'bullet') {
      out += renderBulletAtom(atom, x, lineTop, lineHeight);
      x += atom.width;
      continue;
    }
    if (atom.kind === 'vector') {
      out += renderOpenIconicAtom(atom, x, legacyY, theme);
      x += atom.width;
      continue;
    }
    // 'image': jar's `AtomImg`/`AtomSprite` sit at the line's TOP (altitude
    // 0), not the text baseline -- same placement rule `renderRowAtoms`
    // applies for a classifier member row's inline atom.
    out += image(x, legacyY - baselineOffset, atom.width, atom.height, atom.href);
    x += atom.width;
  }
  // #lizard forgives -- pre-existing per-atom-kind switch, unrelated to
  // this task's `javaRound4` removal (T6c); size predates this edit.
  return out;
}

/** Per-row layout inputs {@link renderNoteLineContent} needs -- bundled to
 *  stay under this project's per-function param cap. */
interface NoteLineRowCtx {
  readonly i: number;
  readonly lineTop: number;
  readonly lineHeight: number;
  readonly baselineOffset: number;
  readonly fontSize: number;
}

/** One row's own text content (creole atoms or the pre-cutover plain-
 *  `<text>` fallback) -- split out of {@link renderNoteText} purely to
 *  keep that function's own NLOC under this project's complexity cap
 *  after the cdd-T10 wiring fix added a second per-row push. */
function renderNoteLineContent(note: NoteGeo, ln: string, row: NoteLineRowCtx, theme: Theme): string {
  const { i, lineTop, lineHeight, baselineOffset, fontSize } = row;
  if (note.lineAtoms !== undefined) {
    return renderNoteLineAtoms(note.lineAtoms[i]!, note.x + NOTE_MARGIN_X1, lineTop, lineHeight, theme, baselineOffset);
  }
  return text(note.x + NOTE_MARGIN_X1, lineTop + baselineOffset, ln, {
    fontFamily: theme.fontFamily,
    fontSize,
    // G2 N67 item 49: SAME cascade fallback tier renderNoteLineAtoms
    // consults (this branch has no per-atom color to check first, since
    // it draws the note's own single, un-decomposed source line).
    fill: theme.colors.graph.noteCascadeFontColor ?? '#000000',
    lengthAdjust: 'spacing',
    textLength: note.lineWidths[i]!,
  });
}

/**
 * Note body text, one line per row, LEFT-anchored.
 *
 * G2 N55: when `note.lineAtoms` is present (every note built by
 * `note-layout.ts#measureNote` -- the ONLY production path -- always sets
 * it), each line draws as its own per-RUN creole atom sequence via {@link
 * renderNoteLineAtoms} instead of one plain `<text>` of the literal source
 * string -- jar-verified against `tenobo-24-liga464`'s `Yet **another**`
 * note line (two `<text>` runs, "Yet" plain + "another" bold, x split at the
 * first run's own measured width). `note.lineAtoms` is OPTIONAL only for a
 * hand-built `NoteGeo` test literal that constructs one directly, bypassing
 * `note-layout.ts` (`renderer-note.test.ts`'s pre-cutover fixtures) -- that
 * case falls back to the ORIGINAL single-`<text>`-per-line rendering below,
 * unchanged, matching `renderer-classifier-box.ts#renderRowText`'s identical
 * `row.atoms !== undefined` optional-with-fallback precedent (G2 N22).
 *
 * G2/N21: `textLength` uses EACH line's own measured width
 *  (`note.lineWidths[i]`, `note-layout.ts#measureNote`), not the note box's
 *  shared max-line-driven width -- jar draws every line's `<text>` with its
 *  OWN `textLength`, so a multi-line note whose lines have different widths
 *  (the common case) previously emitted the SAME (longest-line) value on
 *  every row; jar-verified against `sisolu-74-minu975`. */
function renderNoteText(note: NoteGeo, theme: Theme): string {
  const parts: string[] = [];
  // G2 N39: `<style> note { FontSize N }` / `skinparam noteFontSize N`
  // override -- see `NOTE_FONT_SIZE`'s own doc comment. `baselineOffset`'s
  // formula (`fontSize - descent`, `descent == size/4.5`) is recomputed here
  // per-note rather than as a module constant, since it now varies with the
  // resolved size.
  const fontSize = theme.colors.elements?.['note']?.fontSize ?? NOTE_FONT_SIZE;
  const baselineOffset = fontSize - fontSize / 4.5;
  // G2 N56: cumulative running top-of-line, mirroring jar's real `SheetBlock1
  // #initMap`'s `y += sea.getHeight()` stack -- each line's OWN resolved
  // height (`note.lineHeights[i]`, `note-layout.ts#measureNote`) advances the
  // NEXT line's top, not a flat `fontSize` (see `note-layout.ts
  // #noteLineHeight`'s own doc comment for the jar derivation). `note
  // .lineHeights` is OPTIONAL only for a hand-built `NoteGeo` test literal
  // that constructs one directly (mirrors `lineAtoms`'s identical optional-
  // with-fallback contract) -- `undefined` falls back to the flat `fontSize`
  // per line, BYTE-IDENTICAL to the pre-N56 formula.
  let lineTop = note.y + NOTE_MARGIN_Y;
  note.lines.forEach((ln, i) => {
    const lineHeight = note.lineHeights?.[i] ?? fontSize;
    parts.push(renderNoteLineContent(note, ln, { i, lineTop, lineHeight, baselineOffset, fontSize }, theme));
    // cdd-T10 wiring fix: a row's own `<line>`/table draws AT THIS ROW'S
    // OWN POSITION (`lineTop`, BEFORE advancing) -- never appended after
    // every row, which cannot reproduce the jar's interleaved child order
    // (`BodyEnhancedAbstract.java:107-121`: a block-separator's divider
    // draws immediately before its own block's content, not after the
    // whole note). `renderNoteRowExtra` is a no-op ('') for every row
    // that carries neither `lineDividers[i]` nor `lineTables[i]`.
    parts.push(renderNoteRowExtra(note, lineTop, i, baselineOffset, theme));
    lineTop += lineHeight;
  });
  return parts.join('');
}

/** Plain note: folded-corner box only -- every note kind EXCEPT a resolved
 *  member-tip (`renderTipNote` below). cdd-T9b: the dashed host connector
 *  is no longer built here at all -- it is a completely separate upstream
 *  `Link` (`CommandFactoryNoteOnEntity.java:342`), drawn as its own `<g
 *  class="link">` by `renderer.ts`'s edges phase via
 *  `renderer-note-connector.ts#renderNoteConnectorPath` (T9 already moved
 *  the EMISSION site; T9b moves the STYLE/id-owning code too, since the
 *  note's own `NOTE_STROKE_WIDTH`/`'4 4'` never applied to it upstream in
 *  the first place -- see `NOTE_STROKE_WIDTH`'s own doc comment). */
export function renderNote(note: NoteGeo, theme: Theme): string {
  return renderPlainNote(note, theme).entityParts.join('');
}

/**
 * Plain note: folded-corner box (body + fold, two separate `UPath`s per
 * `EntityImageNote.java:275-289`) plus its per-line text.
 */
export function renderPlainNote(note: NoteGeo, theme: Theme): { entityParts: string[] } {
  const fill = resolveNoteBackground(note.color, theme, note.stereotype);
  const { x, y, width: w, height: h } = note;
  const f = NOTE_FOLD;
  const entityParts: string[] = [
    // Body: `Opale.getPolygonNormal`'s vertex order (see `noteBodyPathData`'s
    // own doc comment), the note style's OWN stroke width (0.5).
    path(noteBodyPathData(x, y, w, h, f), { fill, stroke: theme.colors.border, strokeWidth: NOTE_STROKE_WIDTH }),
    // Fold: `Opale.getCorner`, reused unchanged from `note-opale.ts`/
    // `core/svek/image/Opale.ts` (the SAME primitive `renderTipNote`/
    // `renderOpaleNote` already call) -- filled with the note's OWN
    // background (not `none`) at the diagram's DEFAULT stroke width, per
    // `EntityImageNote.java:275-289` (see `NOTE_FOLD_STROKE_WIDTH`'s doc
    // comment).
    path(opaleCorner({ x, y }, w), { fill, stroke: theme.colors.border, strokeWidth: NOTE_FOLD_STROKE_WIDTH }),
    renderNoteText(note, theme),
  ];
  return { entityParts };
}

/**
 * A resolved member-tip note (`note <left|right> of Class::member`): the
 * connector is a zigzag notch cut directly into the note's own outline
 * (`note-opale.ts`), not a separate line -- and the whole thing draws
 * UNWRAPPED (no `<g class="entity">`, no id, no comment), matching
 * `EntityImageTips`'s draw path -- upstream never routes a tip through the
 * normal per-entity `<g>`-wrapping machinery other leaf kinds get (mirrors
 * `renderAssocPoint`'s identical unwrapped precedent, G2 N8).
 * @see ~/git/plantuml/.../svek/image/EntityImageTips.java#drawU
 */
export function renderTipNote(note: NoteGeo, tip: TipShape, theme: Theme): string {
  const box: OpaleBox = { origin: { x: note.x, y: note.y }, width: note.width, height: note.height };
  const connector: OpaleConnector = { pp1: tip.pp1, pp2: tip.pp2 };
  const outline = tip.direction === 'left' ? opalePolygonLeft(box, connector) : opalePolygonRight(box, connector);
  const fill = resolveNoteBackground(note.color, theme, note.stereotype);
  const parts: string[] = [
    path(outline, { fill, stroke: theme.colors.border, strokeWidth: NOTE_STROKE_WIDTH }),
    path(opaleCorner({ x: note.x, y: note.y }, note.width), {
      fill,
      stroke: theme.colors.border,
      strokeWidth: NOTE_STROKE_WIDTH,
    }),
  ];
  parts.push(renderNoteText(note, theme));
  return parts.join('');
}

/** Dispatch to the right `opalePolygon*` function by direction --
 *  `Opale.java#drawU`'s own `strategy` switch, shared by {@link renderTipNote}
 *  (LEFT/RIGHT only) and {@link renderOpaleNote} (all four). */
function opaleOutline(direction: OpaleDirection, box: OpaleBox, connector: OpaleConnector): string {
  switch (direction) {
    case 'left':
      return opalePolygonLeft(box, connector);
    case 'right':
      return opalePolygonRight(box, connector);
    case 'up':
      return opalePolygonUp(box, connector);
    case 'down':
      return opalePolygonDown(box, connector);
  }
}

/**
 * A RESOLVED general "opalisable" note (G2/N14, `note <pos> of X` with a
 * single non-invisible connection to a non-note entity) -- the SAME
 * zigzag-notch merged outline as a member-tip note, but WRAPPED in the
 * normal `<g class="entity">` (upstream never special-cases the wrapping
 * for this mechanism the way it does for member-tips -- `EntityImageNote`
 * draws through the ordinary per-entity `<g>` path, jar-verified:
 * `fezugi-39-fujo327`'s note is `<g class="entity" data-qualified-name=
 * "GMN2" id="ent0003" data-source-line="7">`). No separate `<g
 * class="link">` connector draws at all -- `SvekEdge#drawU`'s `if (opale)
 * return;` -- the caller must not emit one for this note's own connector
 * edge.
 * @see ~/git/plantuml/.../svek/image/EntityImageNote.java#drawU
 */
export function renderOpaleNote(note: NoteGeo, theme: Theme): string {
  const opale = note.opale!;
  const box: OpaleBox = { origin: { x: note.x, y: note.y }, width: note.width, height: note.height };
  const connector: OpaleConnector = { pp1: opale.pp1, pp2: opale.pp2 };
  const fill = resolveNoteBackground(note.color, theme, note.stereotype);
  const parts: string[] = [
    path(opaleOutline(opale.direction, box, connector), {
      fill,
      stroke: theme.colors.border,
      strokeWidth: NOTE_STROKE_WIDTH,
    }),
    path(opaleCorner({ x: note.x, y: note.y }, note.width), {
      fill,
      stroke: theme.colors.border,
      strokeWidth: NOTE_STROKE_WIDTH,
    }),
  ];
  parts.push(renderNoteText(note, theme));
  return parts.join('');
}
