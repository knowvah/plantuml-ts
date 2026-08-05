/**
 * Note text measurement — a clean leaf of the note-layout module family. No
 * dependency on grouping or tip/geo resolution; those modules import
 * `NoteMeasurement`/`measureNote` from here.
 *
 * A2s F-C: a note's text block is upstream `BodyFactory.create3` ->
 * `BodyEnhanced2` (`EntityImageNote.java:117`, `EntityImageTips.java:185`) —
 * NOT a bare creole sheet. That layer splits the display at `--`/`==`/`..`/
 * `__` block-separator lines (`BodyEnhancedAbstract#isBlockSeparator`) and
 * decorates each following block with `withMargin(block, 0, 4)` (untitled,
 * +8 height) or the titled `withMargin(block, 0, 6, titleH/2, 4)` +
 * `TextBlockLineBefore.atLeast(titleW+8, titleH)` + outer `titleH/2` dance
 * (`BodyEnhancedAbstract.java:107-121`, `TextBlockLineBefore.java:71-80`).
 * Within a block, creole FULL mode applies: `*`-bullet lines carry a
 * `Bullet` header atom (`Bullet.java:72-76`) and consecutive `|...|` lines
 * form one `StripeTable`/`AtomTable` grid (`StripeTable.java`,
 * `AtomTable.java`). The single-line note form additionally splits on
 * literal `\n` via `Display.getWithNewlines` (`CommandFactoryNote.java:124`);
 * the block form (`lines.toDisplay()`, java:159) keeps `\n` literal — see
 * `splitNoteDisplayLines`'s own doc comment for the origin discriminator.
 *
 * All formulas here were probe-verified <0.01px against the jar
 * (`oracle/goldens/class/a2s-note-hline-{1,2,3}/` + scratchpad probes
 * bsplit/btitled/table, 2026-08-04).
 */
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { javaRound4 } from '../../core/number-format.js';
import { resolveTextEscapes } from '../../core/text-escapes.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { parseWithNewlines } from '../../core/klimt/creole/DisplayNewlines.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import {
  ClassifierBodyGeometry,
  ELEMENT_DEFAULT_LINE_THICKNESS,
} from './class-body-enhanced-geometry.js';
import {
  buildMemberAtoms,
  resolveMemberAtoms,
  memberBaseFont,
  buildWrappedMemberRows,
  atomsToPlainText,
  type MemberRenderAtom,
} from './class-member-creole.js';
import { getEmbeddedType } from '../../core/EmbeddedDiagram.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import {
  type NoteRow,
  type NoteLineBuildContext,
  noteLineHeight,
  buildTableRow,
  consumeEmbeddedRow,
} from './note-layout-measure-rows.js';

/** `plantuml.skin`'s `note { FontSize 13 }` default — one point smaller
 *  than the diagram's normal text. G2 N39: the DEFAULT only -- a `<style>
 *  note { FontSize N }` block (or flat `skinparam noteFontSize N`) override
 *  is threaded via `theme.colors.elements['note'].fontSize` (`ELEMENT_
 *  BUCKET_SNAMES`'s pre-existing 'note' entry, G2 N34 -- the bucket was
 *  already populated, this constant just never consulted it, jar-verified
 *  `xokipa-29-rafu481`). */
const NOTE_FONT_SIZE = 13;
/** `Opale.java`'s `marginX1`/`marginX2`/`marginY` — the note text's own
 *  inset from the folded-corner box (asymmetric: more room on the right,
 *  where the fold lives). */
const NOTE_MARGIN_X1 = 6;
const NOTE_MARGIN_X2 = 15;
const NOTE_MARGIN_Y = 5;
/** `Bullet.java:73-75` — order 0 is an ellipse cell 12 wide; order n>=1 a
 *  rectangle cell `8 + 8*order` wide. */
const BULLET_ORDER0_WIDTH = 12;
const BULLET_NESTED_WIDTH_BASE = 8;
/** `BodyEnhancedAbstract.java:117` — titled separator: the following block
 *  is `withMargin(block, getMarginX()==0, 6, titleH/2, 4)` (X2 = 6). */
const TITLED_SEPARATOR_MARGIN_X2 = 6;
/** `TextBlockLineBefore.java:77` — `dim.atLeast(dimTitle.getWidth() + 8,
 *  ...)`: a titled separator floors its block's width at titleW + 8. */
const TITLED_SEPARATOR_TITLE_PAD = 8;

/** `CreoleStripeSimpleParser.java:69-70` — the two FULL-mode bullet-list
 *  patterns (`ASTERISK_PREFIXED_LINE_PATTERN`, `ASTERISK_HEADER_LINE_
 *  PATTERN`, `[%s]` == whitespace). Both yield `StripeStyleType.LIST_
 *  WITHOUT_NUMBER` with `order = stars - 1` and `line = trin(group(2))`. */
const ASTERISK_PREFIXED_LINE_PATTERN = /^(\*+)([^*]+(?:[^*]|\*\*[^*]+\*\*)*)$/;
const ASTERISK_HEADER_LINE_PATTERN = /^(\*+)(\s.+)$/;

/** ADR-7 "one owner" of `decorate()`'s Y-axis arithmetic — the same probe
 *  `class-body-enhanced-layout.ts` uses. `marginX = 0` per `BodyEnhanced2
 *  #getMarginX` (java:76-78); thickness is height-inert (the divider line
 *  adds no height), passed only to satisfy the ctor. */
const NOTE_BODY_GEOMETRY = new ClassifierBodyGeometry(ELEMENT_DEFAULT_LINE_THICKNESS, 0);

export interface NoteMeasurement {
  width: number;
  height: number;
  lines: string[];
  lineWidths: number[];
  /** G2 N55: see `NoteGeo.lineAtoms`'s own doc comment -- ALWAYS populated
   *  here (this is the one production builder, unlike the geo's own optional
   *  field which also serves hand-built test literals). A block-separator
   *  or table row carries `[]` (nothing to draw at the row's own x/y; the
   *  divider/grid strokes are a renderer follow-up, journaled). */
  lineAtoms: readonly (readonly MemberRenderAtom[])[];
  /** G2 N56: see `NoteGeo.lineHeights`'s own doc comment -- ALWAYS populated
   *  here, same "production builder always sets it" contract as `lineAtoms`
   *  above. */
  lineHeights: readonly number[];
}

/**
 * G2/N13: `Opale.java` formula — `getWidth`/`getHeight` (`textWidth +
 * marginX1 + marginX2`, `textBlockHeight + 2*marginY`) at note font size 13
 * (jar-verified byte-exact, `cajicu-52-cego765`/`tenobo-24-liga464`). The
 * text block itself is the `BodyEnhanced2` assembly (module doc comment):
 * display-line split -> block-separator walk -> per-block creole rows.
 */
export function measureNote(text: string, theme: Theme, measurer: StringMeasurer, sprites?: SpriteRegistry): NoteMeasurement {
  const ctx = resolveNoteFontContext(theme);
  const buildCtx: NoteLineBuildContext = { ...ctx, measurer, sprites };
  const displayLines = splitNoteDisplayLines(text);
  const out: { rows: NoteRow[]; blockWidths: number[] } = { rows: [], blockWidths: [] };
  let pendingSeparator: string | undefined;
  let blockLines: string[] = [];
  const flushBlock = (): void => {
    appendDecoratedBlock(out, buildBlockRows(blockLines, buildCtx), pendingSeparator, buildCtx);
    blockLines = [];
  };
  for (const line of displayLines) {
    if (isNoteBlockSeparator(line)) {
      flushBlock();
      pendingSeparator = line;
    } else {
      blockLines.push(line);
    }
  }
  flushBlock();
  const { rows, blockWidths } = out;
  const maxW = blockWidths.length === 0 ? 0 : Math.max(...blockWidths);
  return {
    lines: rows.map((r) => r.text),
    lineWidths: rows.map((r) => r.width),
    lineAtoms: rows.map((r) => r.atoms),
    lineHeights: rows.map((r) => r.height),
    width: maxW + NOTE_MARGIN_X1 + NOTE_MARGIN_X2,
    height: rows.reduce((sum, r) => sum + r.height, 0) + NOTE_MARGIN_Y * 2,
  };
}

/** A `\n`/`\r`/`\l` two-char break sequence — the trigger for routing a
 *  single-physical-line note text through the `getWithNewlines` scanner. */
const BACKSLASH_BREAK = /\\[nrl]/;

/** R2b: the six `jaws/Jaws.java:47-53` private-use sentinels TIM builtins
 *  can leave in a line — `%retrieve_procedure`'s multi-line capture joins
 *  with `BLOCK_E1_NEWLINE` (`TContext#extractFromResultList`), and
 *  `%n()`/`%newline()`/`%breakline()`/`%left_align()`/`%right_align()`/
 *  `%backslash()`/`%tab()` return one directly (`tim/builtin/`,
 *  `JawsFlags.USE_BLOCK_E1_IN_NEWLINE_FUNCTION == true`). Any of them
 *  proves the text passed through the TIM interpreter on ONE physical
 *  line, so the single-line-form `getWithNewlines` scan (which decodes
 *  every one of them, `Display.java:315-339`) is the correct decoder. */
const BLOCK_E1_SENTINEL = /[\u{e100}-\u{e103}\u{e110}\u{e111}]/u;

/**
 * B5-note: split the stored note text into upstream `Display` lines. A text
 * with REAL newlines is a block-form note (`lines.toDisplay()`, no literal-
 * `\n` split — jar-probe `bsplit`); a single physical line CONTAINING a
 * `\n`/`\r`/`\l` break sequence is (with near-certainty) the single-line
 * note form, split via the REAL ported `Display#getWithNewlines` scanner
 * (`DisplayNewlines.ts#parseWithNewlines` — `\n`/`\r`/`\l` break, `\t` tab,
 * `\\` literal backslash, raw-mode spans preserved). A single physical line
 * with NO break sequence stays literal — this deliberately narrower gate
 * keeps a one-line BLOCK note's `\\`/`\t` escapes literal exactly as the
 * jar does (`bopusi-74-bifa012`'s `Note \\ (foo...)`, which a broader
 * "always scan one-liners" rule regressed by 3.575px during F-C). Known
 * remainder, journaled: a single-line-FORM note whose only escapes are
 * `\\`/`\t` (no break) keeps them literal (pre-F-C behavior, zero known
 * corpus reach), as does a one-line BLOCK note containing a literal `\n`
 * (ambiguous without origin info this module cannot see).
 */
function splitNoteDisplayLines(text: string): string[] {
  if (text.includes('\n')) return text.split('\n');
  if (!BACKSLASH_BREAK.test(text) && !BLOCK_E1_SENTINEL.test(text)) return [text];
  const parsed = parseWithNewlines(Pragma.createEmpty(), text);
  return parsed === null ? [text] : [...parsed.lines];
}

/** `BodyEnhancedAbstract#isBlockSeparator` (java:68-83) — verbatim, RAW
 *  line (no trim; this port's note parser already dedents body lines, the
 *  same precondition upstream's `BlocLines` trims establish). */
function isNoteBlockSeparator(s: string): boolean {
  if (s.startsWith('--') && s.endsWith('--')) return true;
  if (s.startsWith('==') && s.endsWith('==')) return true;
  if (s.startsWith('..') && s.endsWith('..') && s !== '...') return true;
  if (s.startsWith('__') && s.endsWith('__')) return true;
  return false;
}

/** `StringUtils.trin` (java:502-530) — strips chars `<= ' '` from both
 *  ends (narrower than JS `trim()`, which also eats NBSP etc.). */
function trin(s: string): string {
  return s.replace(/^[\u0000-\u0020]+/, '').replace(/[\u0000-\u0020]+$/, '');
}

/** `BodyEnhancedAbstract#getTitle` (java:94-100): `undefined` (no title)
 *  for a bare separator of <= 4 chars; else the trimmed middle. */
function separatorTitleText(s: string): string | undefined {
  if (s.length <= 4) return undefined;
  return trin(s.slice(2, -2));
}

/** A titled separator's own measured label (`BodyEnhancedAbstract#getTitle`
 *  routes it through `Display.getWithNewlines` + the same creole engine).
 *  `undefined` for a bare `--`/`----` separator (java:94-96). */
function measureSeparatorTitle(
  separator: string,
  ctx: NoteLineBuildContext,
): { width: number; height: number } | undefined {
  const titleText = separatorTitleText(separator);
  if (titleText === undefined) return undefined;
  const titleRows = buildBlockRows(splitNoteDisplayLines(titleText), ctx);
  return {
    width: titleRows.reduce((max, r) => Math.max(max, r.width), 0),
    height: titleRows.reduce((sum, r) => sum + r.height, 0),
  };
}

/**
 * A11: append one block's rows, decorated per `BodyEnhancedAbstract
 * #decorate` (java:107-121). The separator's own row height is derived by
 * running the REAL ported `decorate()` through `ClassifierBodyGeometry`
 * (ADR-7: one owner — untitled reduces to `innerH + 8`; titled to
 * `max(titleH/2 + innerH + 4, titleH) + titleH/2`, probe `btitled`).
 * Width: untitled adds nothing; titled is `max(innerW + 6, titleW + 8)`
 * (`withMargin` X2 + `TextBlockLineBefore.atLeast`, probe-verified).
 */
function appendDecoratedBlock(
  out: { rows: NoteRow[]; blockWidths: number[] },
  blockRows: NoteRow[],
  separator: string | undefined,
  ctx: NoteLineBuildContext,
): void {
  const innerH = blockRows.reduce((sum, r) => sum + r.height, 0);
  const innerW = blockRows.reduce((max, r) => Math.max(max, r.width), 0);
  if (separator === undefined) {
    // First block: decorate()'s `separator == 0` branch — identity margins.
    out.blockWidths.push(innerW);
    out.rows.push(...blockRows);
    return;
  }
  const title = measureSeparatorTitle(separator, ctx);
  const decorated = NOTE_BODY_GEOMETRY.deriveHeightOffsets(innerH, separator.charAt(0), title?.height);
  const sepWidth = title === undefined ? 0 : title.width + TITLED_SEPARATOR_TITLE_PAD;
  out.rows.push({ text: separator, width: sepWidth, atoms: [], height: decorated.totalHeight - innerH });
  out.blockWidths.push(
    title === undefined ? innerW : Math.max(innerW + TITLED_SEPARATOR_MARGIN_X2, sepWidth),
  );
  out.rows.push(...blockRows);
}

/**
 * `theme`-derived font + wrap-width context every note line shares. Split
 * out of `measureNote` for the complexity-hook NLOC cap.
 *
 * G2 N39: `fontSize` -- `<style> note { FontSize N }` block (or flat
 * `skinparam noteFontSize N`) override, see `NOTE_FONT_SIZE`'s own doc
 * comment. G2 N55: `font` -- each line routes through the SAME shared
 * creole atom engine `class-member-creole.ts` wires for classifier member
 * rows (`buildMemberAtoms`/`resolveMemberAtoms`, N22's own
 * `classifyStripeLine` -> `buildStripeAtoms`/`buildLiteralAtoms` dispatch)
 * -- `memberBaseFont(fontSpec, {})` with an EMPTY member object (a note
 * line has no `{abstract}`/`{static}` modifier concept) yields the exact
 * `{family, size, color: null, styles: new Set()}` base font, whose
 * `atomFontSpec` projection is BYTE-IDENTICAL to the pre-cutover `fontSpec`
 * (no `weight`/`style` keys) -- this is the mission's own
 * measurement-identity proof (see `class-member-creole.test.ts`'s identical
 * proof for member rows, N22's own precedent). G2 N66: `maxWidth` --
 * `<style> note/element { MaximumWidth N }` word-wrap (`theme.ts
 * #noteCascadeMaximumWidth`'s own doc comment); `maxWidth<=0` (the
 * overwhelming majority of notes) short-circuits every line to the SAME
 * single-build result the pre-N66 direct call produced, byte-identical.
 */
function resolveNoteFontContext(
  theme: Theme,
): { fontSize: number; fontSpec: { family: string; size: number }; font: FontConfiguration; maxWidth: number } {
  const fontSize = theme.colors.elements?.['note']?.fontSize ?? NOTE_FONT_SIZE;
  const fontSpec = { family: theme.fontFamily, size: fontSize };
  const font = memberBaseFont(fontSpec, {});
  const maxWidth = theme.colors.graph.noteCascadeMaximumWidth ?? 0;
  return { fontSize, fontSpec, font, maxWidth };
}

/**
 * Build one block's render rows: consecutive `|...|` table lines collapse
 * into ONE grid row (A12), `*`-bullet lines carry a `Bullet` header (A4),
 * anything else is a plain creole line (word-wrapped when `ctx.maxWidth`
 * binds, G2 N66). Classification runs on the RAW line; `<U+XXXX>`/`&#N;`
 * escapes resolve at atom-build time (upstream substitutes them inside
 * `AtomText`, AFTER stripe classification — G2/N21's `pacuve-18` mechanism,
 * order now made explicit).
 */
function buildBlockRows(blockLines: readonly string[], ctx: NoteLineBuildContext): NoteRow[] {
  const rows: NoteRow[] = [];
  for (let i = 0; i < blockLines.length; i++) {
    const ln = blockLines[i]!;
    // R2b: a line opening a `{{ ... }}` embedded-diagram region collapses,
    // with everything through its matching `}}`, into ONE row
    // (`EmbeddedDiagram.getEmbeddedType` gate, java:257-366; region walk +
    // 42x42 dimension in `note-layout-measure-rows.ts#consumeEmbeddedRow`).
    const embeddedType = getEmbeddedType(ln);
    if (embeddedType !== null) {
      const consumed = consumeEmbeddedRow(blockLines, i, embeddedType, ctx);
      rows.push(consumed.row);
      i = consumed.nextIndex;
      continue;
    }
    if (CreoleParser.isTableLine(ln)) {
      const run: string[] = [ln];
      while (i + 1 < blockLines.length && CreoleParser.isTableLine(blockLines[i + 1]!)) {
        run.push(blockLines[++i]!);
      }
      rows.push(buildTableRow(run, ctx));
      continue;
    }
    const bullet = matchBulletLine(ln);
    if (bullet !== undefined) {
      rows.push(...buildBulletRows(bullet, ctx));
      continue;
    }
    rows.push(...buildPlainRows(ln, ctx));
  }
  return rows;
}

/** A4: `CreoleStripeSimpleParser.java:119-137` — FULL-mode bullet match.
 *  `order = group(1).length - 1`, `text = trin(group(2))`. */
function matchBulletLine(ln: string): { order: number; text: string } | undefined {
  const m = ASTERISK_PREFIXED_LINE_PATTERN.exec(ln) ?? ASTERISK_HEADER_LINE_PATTERN.exec(ln);
  if (m === null) return undefined;
  return { order: m[1]!.length - 1, text: trin(m[2]!) };
}

/**
 * A4: one bullet row — a zero-text spacer atom carrying the `Bullet`
 * header's fixed width (`Bullet#calculateDimensionSlow`, java:72-76: 12 for
 * order 0, `8 + 8*order` nested) followed by the trimmed text's own creole
 * atoms. Height stays the text row's own (the bullet glyph's 5px/3px cell
 * never exceeds a >=10px text row — `Sea#doAlign` places it inside the text
 * span). Jar-verified: temise-16/pejone-71 note widths == `12 + w(text) +
 * 21` exactly. Word-wrap (`ctx.maxWidth > 0`, A2s R2h): `Fission` seeds the
 * FIRST wrapped stripe with the real header atom and every continuation
 * with `blank(header)` (same width), and breaks when the stripe width
 * INCLUDING the header exceeds `valueMaxWidth` (Fission.java:69-92,120-125)
 * — so the text budget is `maxWidth - bulletWidth` for ALL rows and every
 * row is indented by the header width (jar-verified ponono-25/sumocu-27:
 * max row 12 + 287.7062 at WrapWidth 300). A nested bullet wider than
 * `maxWidth` itself (budget <= 0, zero corpus reach) falls back to the
 * unwrapped single-row build; upstream would instead break at every word.
 */
function buildBulletRows(bullet: { order: number; text: string }, ctx: NoteLineBuildContext): NoteRow[] {
  const bulletWidth =
    bullet.order === 0 ? BULLET_ORDER0_WIDTH : BULLET_NESTED_WIDTH_BASE + BULLET_NESTED_WIDTH_BASE * bullet.order;
  const textCtx = ctx.maxWidth > 0 ? { ...ctx, maxWidth: ctx.maxWidth - bulletWidth } : ctx;
  const spacer: MemberRenderAtom = { kind: 'text', text: '', font: ctx.font, width: bulletWidth };
  return buildPlainRows(bullet.text, textCtx).map((row) => ({
    text: row.text,
    width: javaRound4(bulletWidth + row.width),
    atoms: [spacer, ...row.atoms],
    height: row.height,
  }));
}

/**
 * Plain creole line -> one row normally, 2+ when `ctx.maxWidth` wraps it
 * (G2 N66, mirrors `buildWrappedSectionRowBuilds`'s convention: single-row
 * keeps the source text verbatim; wrapped rows rebuild from their atoms).
 */
function buildPlainRows(rawLine: string, ctx: NoteLineBuildContext): NoteRow[] {
  const { font, fontSpec, measurer, maxWidth, fontSize, sprites } = ctx;
  const ln = resolveTextEscapes(rawLine);
  const builds = maxWidth > 0
    ? buildWrappedMemberRows(ln, {}, fontSpec, measurer, maxWidth, sprites)
    : [resolveMemberAtoms(buildMemberAtoms(ln, font), font, measurer, sprites)];
  return builds.map((build) => ({
    text: builds.length === 1 ? ln : atomsToPlainText(build.atoms),
    width: javaRound4(build.width),
    atoms: build.atoms,
    height: noteLineHeight(build.atoms, fontSize),
  }));
}

