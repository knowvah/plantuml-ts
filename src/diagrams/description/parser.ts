/**
 * Parser for PlantUML descriptive diagrams (component / use-case / deployment).
 *
 * Merges the component and use-case parsers into one upstream-faithful engine
 * keyed by KEYWORD_TO_SYMBOL (mirrors CommandCreateElementFull.ALL_TYPES in
 * net.sourceforge.plantuml.descdiagram.command). Uses a command-dispatch table
 * tested against each trimmed line in priority order — first match wins.
 *
 * The command dispatch table (COMMANDS) and the mutable-state helpers
 * (ParseState, emitNode, note handling, …) live in `command-table.ts` /
 * `parse-state.ts` respectively — split out of this file (mission G0b/T6)
 * purely to stay under the project's 500-line file cap; this file owns only
 * the top-level line loop and its dispatch priority.
 */

import type { UmlSource } from '../../core/block-extractor.js';
import { matchAnnotationCommand } from '../../core/annotations/index.js';
import { matchSpriteCommand } from '../../core/sprite-commands.js';
import { KEYWORD_TO_SYMBOL } from '../../core/descriptive-keywords.js';
import type { DescriptionDiagramAST, DescriptiveNode } from './ast.js';
import {
  ELEMENT_MULTILINE_END0_RE,
  ELEMENT_MULTILINE_OPEN_RE,
  ELEMENT_MULTILINE_OPEN_TYPE0_RE,
  extractColor,
  extractNodeStereotype,
  finalizeDisplay,
  makeNode,
  parseNameSection,
} from './parse-helpers.js';
import { classifyNoteOpen, isNoteTerminator } from './note-grammar.js';
import {
  closePendingNote,
  emitNode,
  executeNoteOpen,
  makeDefaultAST,
  resolveStillUnknown,
  type ElementBlockTerminator,
  type ParseState,
  type PendingElementState,
} from './parse-state.js';
import { COMMANDS } from './command-table.js';
import { leafDisplayName } from './namespace-groups.js';

export { CONTAINER_SYMBOLS } from './parse-helpers.js';

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

function makeInitialState(): ParseState {
  return {
    inSpriteBlock: false,
    pendingElement: undefined,
    ast: makeDefaultAST(),
    containerStack: [],
    nodesById: new Map(),
    parentArrayById: new Map(),
    qualifiedNodesById: new Map(),
    lastEntityId: undefined,
    noteCounter: 0,
    pendingNote: undefined,
    pages: [],
    namespaceSeparator: null,
    uidCounter: 0,
  };
}

/** `1` when the phase consumed the line, a `consumed` count > 1 when it
 *  consumed a multiline block, `null` when it doesn't apply and the next
 *  dispatch phase should be tried. */
type LineOutcome = number | null;

/** `BlocLines#nbStartingSpace` (utils/BlocLines.java:318-324) — spaces AND
 *  tabs both count, since `StripeTree#computeLevel` treats a tab as a
 *  nesting step exactly like a 2-space group. */
function nbStartingSpace(s: string): number {
  let nb = 0;
  while (nb < s.length && (s[nb] === ' ' || s[nb] === '\t')) nb++;
  return nb;
}

/** `BlocLines#removeStartingSpaces` (utils/BlocLines.java:330-343): strips AT
 *  MOST `nb` leading space/tab characters, so a line indented LESS than the
 *  reference line keeps whatever it has instead of borrowing a column from
 *  its text. */
function removeStartingSpaces(s: string, nb: number): string {
  let i = 0;
  while (i < nb && i < s.length && (s[i] === ' ' || s[i] === '\t')) i++;
  return i === 0 ? s : s.slice(i);
}

/** A display row that comes from the OPENER's own `DESC` tail or from the
 *  closing line's pre-terminator prefix — `display.addFirst(descStart)` /
 *  `display.add(lineLast.get(0))`, each applied only when non-empty
 *  (CommandCreateElementMultilines.java:191-199). Both are read off an
 *  already-trimmed line, so neither participates in `trimSmart`'s indent. */
function pushElementEdgeText(pending: PendingElementState, text: string): void {
  const t = pending.terminator === 'quote' ? text : finalizeDisplay(text.trim());
  if (t.trim() !== '') pending.lines.push(t);
}

/**
 * Push one body line of an open element block, RAW.
 *
 * `BlocLines#trimSmart(1)` (utils/BlocLines.java:305-316) removes the leading
 * whitespace run of the block's FIRST BODY LINE — its *reference* line — from
 * that line and every line after it. It is deliberately NOT a minimum over
 * the block: a body is indented relative to its own first line. Before this,
 * `processLine`'s blanket `.trim()` flattened every body line, so
 * `StripeTree#computeLevel` scored each `|_` row at level 1 and
 * `AtomTree#calculateDimensionSlow`'s `getXEndForLevel` never grew past 18px
 * — vixeni-34-nici683's node B came out 16px (2 levels × `Skeleton2.SIZE_X`)
 * narrow (S1L tail, G8).
 *
 * TYPE0 is `expandsNewline(false)` (CommandCreateElementMultilines.java:169;
 * jar-verified — a literal `\n` inside a TYPE0 body is NOT a line break), so
 * its rows are joined raw and must NOT route through `finalizeDisplay`, which
 * resolves `\n` escapes. TYPE1 keeps the established finalize pass.
 */
function pushElementBody(pending: PendingElementState, raw: string): void {
  if (pending.baseIndent === undefined) pending.baseIndent = nbStartingSpace(raw);
  const dedented = removeStartingSpaces(raw, pending.baseIndent);
  const t = pending.terminator === 'quote' ? dedented : finalizeDisplay(dedented);
  if (t.trim() !== '') pending.lines.push(t);
}

/** Close the multi-line element block: the accumulated body IS the element's
 *  display/label (S1L-b — CommandCreateElementMultilines body, previously
 *  discarded when sizes were tolerant).
 *
 *  An EMPTY body still replaces it. `component A.6 [ ]` draws a box of pure
 *  margin — 30px against our 44px while the code was left standing in as the
 *  display (xocodo-09-nuxi647, S1L-e). Upstream sets the display from the
 *  block unconditionally; there is no "fall back to the code" branch. */
function finishElementBlock(state: ParseState): void {
  const pending = state.pendingElement;
  if (pending !== undefined) pending.node.display = pending.lines.join('\n');
  state.pendingElement = undefined;
}

/** Consume one line of an already-open block. TYPE1 closes on a line ending
 *  `]`, TYPE0 on a line ending in a quote character — both tested against the
 *  `Trim.BOTH`-trimmed line, both contributing that line's prefix as a
 *  display row when it is non-empty. Non-closing lines keep their raw
 *  indentation (see {@link pushElementBody}). */
function continueElementBlock(
  state: ParseState,
  pending: PendingElementState,
  raw: string,
  trimmed: string,
): LineOutcome {
  const end =
    pending.terminator === 'quote'
      ? ELEMENT_MULTILINE_END0_RE.exec(trimmed)
      : /^(.*)\]$/.exec(trimmed);
  if (end === null) {
    pushElementBody(pending, raw);
    return 1;
  }
  pushElementEdgeText(pending, end[1]!);
  finishElementBlock(state);
  return 1;
}

/** Apply the opener's captured STEREO/COLOR run (`ELEMENT_DECORATION_RUN`)
 *  through the same extractors the single-line path uses. `withColor` is
 *  TYPE0-only: TYPE0's colour slot sits before `as` and has no single-line
 *  equivalent, whereas TYPE1's colour is a separate, unmeasured gap (see this
 *  task's decision-journal row). */
function applyElementDecorations(
  node: DescriptiveNode,
  run: string,
  withColor: boolean,
): void {
  if (run.trim() === '') return;
  const sr = extractNodeStereotype(run);
  if (sr !== undefined) node.stereotype = sr.stereotypes;
  if (!withColor) return;
  const cr = extractColor(sr === undefined ? run : sr.remainder);
  if (cr !== undefined) node.color = cr.color;
}

/** Create the block's leaf and open its pending record. `null` when the
 *  keyword is not a known USymbol (the line then falls through to the next
 *  dispatch phase, as it did before the block phase existed). */
function openElementBlock(
  state: ParseState,
  open: RegExpExecArray,
  terminator: ElementBlockTerminator,
): PendingElementState | null {
  const symbol = KEYWORD_TO_SYMBOL.get(open[1]!.toLowerCase());
  if (symbol === undefined) return null;
  const code = open[2]!;
  const node = makeNode(code, code, symbol);
  applyElementDecorations(node, open[3]!, terminator === 'quote');
  emitNode(state, node);
  const pending: PendingElementState = {
    terminator,
    node,
    lines: [],
    baseIndent: undefined,
  };
  state.pendingElement = pending;
  return pending;
}

/** `<keyword> <code> [ … ]` (CommandCreateElementMultilines TYPE1). The
 *  opener's own tail after `[` is the display's first row; a one-line
 *  `component c [ desc ]` closes immediately. */
function tryElementBlockType1(state: ParseState, line: string): LineOutcome {
  const open = ELEMENT_MULTILINE_OPEN_RE.exec(line);
  if (open === null) return null;
  const pending = openElementBlock(state, open, 'bracket');
  if (pending === null) return null;
  const desc = open[4]!;
  const closes = /\]\s*$/.test(desc);
  pushElementEdgeText(pending, closes ? desc.replace(/\]\s*$/, '') : desc);
  if (closes) finishElementBlock(state);
  return 1;
}

/**
 * `<keyword> <code> [#color] as "text` (CommandCreateElementMultilines
 * TYPE0). Accumulates with NO line cap until a line ends in a quote
 * character — the `nb` cap in `PSystemCommandFactory.isMultilineCommandOk`
 * applies only to `CommandDecoratorMultine`.
 *
 * The lookahead reproduces upstream's EOF behaviour exactly: when no closing
 * line exists, `isMultilineCommandOk` returns `null` and the factory
 * `continue`s to the next command, so the opener must fall through to the
 * single-line rule rather than swallow the rest of the diagram.
 */
function tryElementBlockType0(
  state: ParseState,
  lines: readonly string[],
  i: number,
  line: string,
): LineOutcome {
  const open = ELEMENT_MULTILINE_OPEN_TYPE0_RE.exec(line);
  if (open === null) return null;
  let closerFound = false;
  for (let j = i + 1; j < lines.length && !closerFound; j++) {
    closerFound = ELEMENT_MULTILINE_END0_RE.test(lines[j]!.trim());
  }
  if (!closerFound) return null;
  const pending = openElementBlock(state, open, 'quote');
  if (pending === null) return null;
  pushElementEdgeText(pending, open[4]!);
  return 1;
}

/** The `CommandCreateElementMultilines` phase — an open block owns the line
 *  outright, else TYPE1 then TYPE0 are offered it (upstream registers TYPE0
 *  at `DescriptionDiagramFactory.java:122` and TYPE1 at `:123`; the two
 *  openers are mutually exclusive, so order is immaterial). */
function tryElementBlock(
  state: ParseState,
  lines: readonly string[],
  i: number,
  line: string,
): LineOutcome {
  const pending = state.pendingElement;
  if (pending !== undefined) return continueElementBlock(state, pending, lines[i]!, line);
  const type1 = tryElementBlockType1(state, line);
  if (type1 !== null) return type1;
  return tryElementBlockType0(state, lines, i, line);
}

/** A note-command multi-line body owns every line until its terminator
 *  (CommandMultilines2) — never re-dispatched through COMMANDS, so a body
 *  line that happens to look like another command (e.g. razefo-71-pice114's
 *  embedded `{{ skinparam note { ... } }}`) is never misparsed as one. */
function tryNoteHandling(state: ParseState, line: string): LineOutcome {
  if (state.pendingNote !== undefined) {
    if (isNoteTerminator(line, state.pendingNote.terminator)) {
      closePendingNote(state);
    } else {
      state.pendingNote.lines.push(line);
    }
    return 1;
  }
  const noteOpen = classifyNoteOpen(line);
  if (noteOpen !== undefined) {
    executeNoteOpen(state, noteOpen);
    return 1;
  }
  return null;
}

/**
 * `archimate #color (CODE | DISPLAY "as" CODE | CODE "as" DISPLAY) STEREOTYPE?`
 * — `CommandArchimate.java`'s single-line leaf form (T8,
 * description-leaf-sizing-audit). The mandatory `#color` token PRECEDES
 * CODE/DISPLAY here — the only `KEYWORD_TO_SYMBOL` keyword where color is
 * required and leads, rather than optional and trailing. Every other
 * keyword's grammar leaves `parseNameSection`'s `remainder` starting at the
 * quote (if any), so its `splitLeadingQuote` quote-protection (guillemets
 * INSIDE a quoted display are literal text, never STEREOTYPE) engages
 * correctly; feeding it `#color "..."` unstripped defeats that check
 * entirely (the remainder starts with `#`, not `"`), letting
 * `extractNodeStereotype` reach inside the quotes. Stripping the color
 * HERE, before `parseNameSection` ever sees the rest, keeps that guard
 * intact — verified against `archimate #Business "<<inside>> Hello"`
 * (co-located test).
 *
 * `CommandArchimateMultilines` (`[ … ]` body) and `CommandArchimatePackage`
 * (`{ … }` group) are filed, not implemented — see
 * plans/s1l-leaf-sizing/ledger.md. A line missing the color token (upstream:
 * no command matches, no entity created) falls through to the generic
 * `KEYWORD_TO_SYMBOL` dispatch (`command-table-containers.ts` rule 14)
 * instead, which has no color requirement — more lenient than upstream on
 * that one malformed-input edge, documented in the co-located test.
 */
const ARCHIMATE_RE = /^archimate\s+(#\S+)\s+(.+)$/i;

function tryArchimate(state: ParseState, line: string): LineOutcome {
  const m = ARCHIMATE_RE.exec(line);
  if (m === null) return null;
  const symbol = KEYWORD_TO_SYMBOL.get('archimate');
  if (symbol === undefined) return null;
  const color = m[1]!;
  const { id, display, stereotype, tags } = parseNameSection(m[2]!);
  const finalDisplay =
    display === id ? leafDisplayName(id, state.namespaceSeparator) : display;
  emitNode(state, makeNode(id, finalDisplay, symbol, stereotype, color, tags));
  return 1;
}

/**
 * title/caption/legend/header/footer/mainframe (mission G0b/T6,
 * decisions.md D3), then the ordinary COMMANDS table. The annotation
 * matcher is tried FIRST — mirroring upstream CommonCommands
 * .addTitleCommands being registered before any diagram-specific command —
 * so those directives are never misread as entity declarations. Operates on
 * the raw (untrimmed) `lines` array/index so a matched multiline block's
 * body keeps its original indentation for `removeEmptyColumns`.
 */
function dispatchCommand(
  state: ParseState,
  lines: readonly string[],
  i: number,
  line: string,
): number {
  const annotationMatch = matchAnnotationCommand(lines, i, state.ast.annotations!);
  if (annotationMatch !== null) return annotationMatch.consumed;

  // `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4): tried
  // immediately after the chrome matcher, same fallback position -- this
  // REPLACES the pre-mission `trySpriteBlock`/`RE_SPRITE_BLOCK_OPEN` stub
  // (which ran FIRST in `processLine`, before note handling, and merely
  // discarded sprite blocks without building a real `Sprite`; running it
  // there also risked swallowing a sprite-shaped line inside a note body
  // -- moving it here fixes that for free, matching the annotation
  // matcher's own D3 note-safety guarantee).
  const spriteMatch = matchSpriteCommand(lines, i, state.ast.sprites!);
  if (spriteMatch !== null) return spriteMatch.consumed;

  for (const cmd of COMMANDS) {
    const match = cmd.pattern.exec(line);
    if (match !== null) {
      cmd.execute(state, match);
      break;
    }
  }
  return 1;
}

/**
 * Dispatch one non-blank line at index `i` of the raw (untrimmed) `lines`
 * array. Returns `false` when the line was `!exit` (net.sourceforge
 * .plantuml.preproc) — the preprocessor directive that halts all further
 * line processing (confirmed against the pinned oracle golden for
 * jesibe-85-sozu187: a link past `!exit` referring to an undeclared
 * endpoint must NOT spuriously auto-create that endpoint). Otherwise
 * returns the number of lines consumed (>= 1) — greater than 1 only when
 * the shared annotation/sprite matchers consumed a multi-line block (see
 * `dispatchCommand`). Phases run in upstream-priority order: element
 * block, pending/open note, `archimate` (T8 — must run before the ordinary
 * command table so its own color-first grammar is parsed before the
 * generic `KEYWORD_TO_SYMBOL` dispatch would misparse it, see
 * `tryArchimate`'s doc), then title/caption/legend/…/sprite and the
 * ordinary command table (sprite defs are tried LAST, inside
 * `dispatchCommand`, so a sprite-shaped line inside a note body is never
 * stolen from note accumulation -- see `dispatchCommand`'s doc).
 */
function processLine(state: ParseState, lines: readonly string[], i: number): number | false {
  const line = lines[i]!.trim();
  if (/^!exit\b/i.test(line)) return false;

  const elementResult = tryElementBlock(state, lines, i, line);
  if (elementResult !== null) return elementResult;

  const noteResult = tryNoteHandling(state, line);
  if (noteResult !== null) return noteResult;

  const archimateResult = tryArchimate(state, line);
  if (archimateResult !== null) return archimateResult;

  return dispatchCommand(state, lines, i, line);
}

/**
 * Parse a UmlSource block for a descriptive diagram (component / use-case /
 * deployment) into a DescriptionDiagramAST.
 */
export function parseDescription(block: UmlSource): DescriptionDiagramAST {
  const state = makeInitialState();
  const lines = block.lines;

  for (let i = 0; i < lines.length; ) {
    if (lines[i]!.trim() === '') {
      i++;
      continue;
    }
    const result = processLine(state, lines, i);
    if (result === false) break;
    i += result;
  }

  resolveStillUnknown(state.ast.nodes);

  if (state.pages.length === 0) {
    return state.ast;
  }

  // Multi-page: the first page carries `pages` (itself included), per the
  // ast.ts `DescriptionDiagramAST.pages` interface contract consumed by
  // `layoutDescription` (layout.ts). Mirrors class/parser.ts#parseClass.
  state.pages.push(state.ast);
  state.pages[0]!.pages = state.pages;
  return state.pages[0]!;
}
