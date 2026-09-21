/**
 * Mechanism A (unknown-bucket-routing-repair, T7): `CommandCreateElementMultilines`
 * ported into the class engine — a multi-line descriptive-leaf declaration,
 * UNGATED by `allowmixing` (unlike the single-line `CommandCreateElementFull2`
 * this port's `class-descriptive-leaf-command.ts` already has), closed either
 * by a line ending in a quote (TYPE0, `<kw> <code> ... as "multi-line
 * display"`) or by a line ending in `]` (TYPE1, `<kw> <code> ... [ multi-line
 * description ]`). Registered AFTER `CommandCreateElementFull2` upstream
 * (`ClassDiagramFactory.java:166-167`, vs. `:133-134`), but this port's own
 * rule 7 (classifier declarations, entity/circle) and rule 9
 * (DESCRIPTIVE_LEAF_COMMANDS)'s dispatch-gating patterns are UNANCHORED
 * (`\s+\S`/prefix-only) and would otherwise steal or silently swallow either
 * shape before a later-registered command ever saw it — so, unlike upstream's
 * precise per-command grammar (where `CommandCreateElementFull2`'s own regex
 * simply fails to match a TYPE0/TYPE1 opener and the factory naturally tries
 * the next command), this port tries the TYPE0/TYPE1 openers explicitly
 * BEFORE `dispatchCommand`, mirroring how `handlePendingNoteLine`/
 * `handlePendingBodyLine` already pre-empt the general dispatch table for
 * their own multi-line constructs.
 *
 * The TYPE0/TYPE1 grammar (open/end regexes) and the STEREO/COLOR decoration
 * extractors are REUSED from the description engine's own port of the same
 * upstream command (`../description/parse-helpers.js`) rather than
 * re-derived — same upstream `Command`, same regex, cross-engine import
 * precedent already established by `sequence/sequence-arrow-regex.ts`
 * importing `../description/link-grammar-regex.js`.
 *
 * @see ~/git/plantuml/.../descdiagram/command/CommandCreateElementMultilines.java:80-84,96-122,169-220
 * @see ~/git/plantuml/.../classdiagram/ClassDiagramFactory.java:166-167
 */
import {
  ELEMENT_MULTILINE_END0_RE,
  ELEMENT_MULTILINE_END1_RE,
  ELEMENT_MULTILINE_OPEN_RE,
  ELEMENT_MULTILINE_OPEN_TYPE0_RE,
  extractColor,
  extractNodeStereotype,
  stripFullWrap,
} from '../description/parse-helpers.js';
import { getEmbeddedType } from '../../core/EmbeddedDiagram.js';
import { scanEmbeddedElementBlock } from './class-embedded-block.js';
import { ensureClassifier, type ParseState } from './parser.js';
import type { PendingMultilineElement } from './class-parse-state.js';

/**
 * TYPE keywords this port's rule 7 (`class-command-declarations.ts`'s
 * native classifier-declaration dispatch pattern, `class-declaration-parser
 * .ts`'s `DECL_KIND_RE`) already owns COMPLETELY on a single line, INCLUDING
 * a trailing `##[style]color` LINECOLOR spec rule 7's own grammar already
 * parses in full (`class-declaration-extractors.ts`) -- upstream's real
 * `CommandCreateClass`/`CommandCreateClassMultilines` are registered BEFORE
 * `CommandCreateElementMultilines` (`ClassDiagramFactory.java`: the native
 * declaration commands sit near the TOP of `initCommandsList`, `:166-167`
 * is CommandCreateElementMultilines near the BOTTOM), so upstream never
 * even tries CommandCreateElementMultilines on a line the native command
 * fully matches. `entity`/`circle` are DELIBERATELY excluded from this set
 * (present in BOTH rule 7's TYPE alternation AND description's shared
 * `ALL_TYPES`) -- rule 7's own grammar has no trailing-`[`-body form for
 * either (verified: `class-declaration-extractors.ts#extractBody` only
 * recognises a trailing `{`), so upstream's CommandCreateClass DECLINES an
 * `entity ABC [`/`circle A [` line and CommandCreateElementMultilines is
 * the real owner (T4 Mechanism A's own diagnosis, `gogisu-39-bepa573`/
 * `felixe-38-dilu011`). `interface` is the one keyword this port discovered
 * NEEDS the exclusion: rule 7's grammar DOES fully match `interface X
 * ##[style]color` (murotu-83-cebo380-style fixtures), so letting Mechanism
 * A's wider `ALL_KW_ALT` (reused from the description engine, which treats
 * `interface` as an ordinary USymbol keyword) claim it first would steal a
 * line rule 7 already owns.
 */
const NATIVE_DECL_KEYWORDS = new Set(['interface']);

/** Apply the opener's captured STEREO/COLOR run, mirroring the description
 *  engine's `applyElementDecorations` — TYPE0-only for COLOR (its slot sits
 *  before `as`; TYPE1's own color slot is a separate, unmeasured gap, same
 *  posture the description port already carries for TYPE1). */
function applyDecorations(state: ParseState, classifierId: string, run: string, withColor: boolean): void {
  if (run.trim() === '') return;
  const idx = state.classifierIndex.get(classifierId);
  const classifier = idx !== undefined ? state.ast.classifiers[idx] : undefined;
  if (classifier === undefined) return;
  const sr = extractNodeStereotype(run);
  if (sr !== undefined) classifier.stereotype = sr.stereotypes.join(', ');
  if (!withColor) return;
  const cr = extractColor(sr === undefined ? run : sr.remainder);
  if (cr !== undefined) classifier.color = cr.color;
}

/** A display row from the opener's own tail or the closer's pre-terminator
 *  prefix — pushed only when non-empty, mirroring `pushElementEdgeText`. */
function pushEdgeText(pending: PendingMultilineElement, text: string): void {
  const t = pending.terminator === 'quote' ? text : stripFullWrap(text.trim());
  if (t.trim() !== '') pending.lines.push(t);
}

/** `BlocLines#nbStartingSpace` — count of leading space/tab chars. */
function nbStartingSpace(s: string): number {
  let nb = 0;
  while (nb < s.length && (s[nb] === ' ' || s[nb] === '\t')) nb++;
  return nb;
}

/** `BlocLines#removeStartingSpaces` — strips AT MOST `nb` leading space/tab
 *  chars, so a line indented LESS than the reference line keeps what it has. */
function removeStartingSpaces(s: string, nb: number): string {
  let i = 0;
  while (i < nb && i < s.length && (s[i] === ' ' || s[i] === '\t')) i++;
  return i === 0 ? s : s.slice(i);
}

/** TYPE1's dedent-relative-to-first-body-line step (`BlocLines#trimSmart(1)`). */
function pushDedentedBodyLine(pending: PendingMultilineElement, raw: string): void {
  if (pending.baseIndent === undefined) pending.baseIndent = nbStartingSpace(raw);
  const t = stripFullWrap(removeStartingSpaces(raw, pending.baseIndent));
  if (t.trim() !== '') pending.lines.push(t);
}

/** One raw body line of an open block — TYPE1 dedents relative to its own
 *  first body line; TYPE0 keeps the line as-is (`expandsNewline(false)`, no
 *  dedent upstream either). Mirrors `pushElementBody`. */
function pushBodyLine(pending: PendingMultilineElement, raw: string): void {
  if (pending.terminator === 'quote') {
    if (raw.trim() !== '') pending.lines.push(raw);
    return;
  }
  pushDedentedBodyLine(pending, raw);
}

/** Close the pending block: the accumulated body IS the classifier's
 *  display, unconditionally (even when empty) — mirrors `finishElementBlock`. */
function finishBlock(state: ParseState, pending: PendingMultilineElement): void {
  const idx = state.classifierIndex.get(pending.classifierId);
  const classifier = idx !== undefined ? state.ast.classifiers[idx] : undefined;
  if (classifier !== undefined) classifier.display = pending.lines.join('\n');
  state.pendingMultilineElement = undefined;
}

/**
 * Consume one (or, for an embedded `{{ … }}` region, several) line(s) of an
 * already-open TYPE0/TYPE1 block, starting at `lines[i]`. Returns how many
 * lines were consumed, or `0` if no block was open (the line was not
 * consumed at all).
 *
 * A line that OPENS an embedded diagram is handled FIRST, before either END
 * test: the whole embedded region (see {@link scanEmbeddedElementBlock}'s
 * doc) is swallowed as raw body lines in one step, so none of ITS lines —
 * including a nested element's own closing `]` — are ever tested against
 * this block's END regex (T3.md M6, rozugu-82-pera583).
 */
export function continueMultilineElement(
  state: ParseState,
  lines: readonly string[],
  rawLines: readonly string[],
  i: number,
): number {
  const pending = state.pendingMultilineElement;
  if (pending === undefined) return 0;
  const trimmed = lines[i]!;
  if (getEmbeddedType(trimmed) !== null) {
    const embedded = scanEmbeddedElementBlock(rawLines, i);
    for (const l of embedded.block) pushBodyLine(pending, l);
    return embedded.consumed;
  }
  const end =
    pending.terminator === 'quote' ? ELEMENT_MULTILINE_END0_RE.exec(trimmed) : ELEMENT_MULTILINE_END1_RE.exec(trimmed);
  if (end === null) {
    pushBodyLine(pending, rawLines[i]!);
    return 1;
  }
  pushEdgeText(pending, end[1]!);
  finishBlock(state, pending);
  return 1;
}

/** TYPE1: `<kw> <code> [ ... ]`. The opener's own tail after `[` is the
 *  display's first row; a one-line `rectangle A [ desc ]` closes at once. */
function tryType1(state: ParseState, line: string): boolean {
  const open = ELEMENT_MULTILINE_OPEN_RE.exec(line);
  if (open === null) return false;
  const usymbol = open[1]!.toLowerCase();
  if (NATIVE_DECL_KEYWORDS.has(usymbol)) return false;
  const code = open[2]!;
  const classifier = ensureClassifier(state, code, 'descriptive', code);
  classifier.usymbol = usymbol;
  applyDecorations(state, classifier.id, open[3]!, false);
  const pending: PendingMultilineElement = { classifierId: classifier.id, terminator: 'bracket', lines: [] };
  state.pendingMultilineElement = pending;
  const desc = open[4]!;
  const closes = /\]\s*$/.test(desc);
  pushEdgeText(pending, closes ? desc.replace(/\]\s*$/, '') : desc);
  if (closes) finishBlock(state, pending);
  return true;
}

/** TYPE0: `<kw> <code> [#color] as "text`. Only opens when a closing line
 *  (ending in a quote char) exists FURTHER DOWN in the block — mirrors
 *  upstream's `isMultilineCommandOk` returning `null` (no candidate close
 *  found) and the factory moving on to the next command, which this port
 *  reproduces by falling through to `dispatchCommand` (rule 9's allowmixing
 *  gate) when no closer is found, rather than swallowing the rest of the
 *  diagram as body text. */
function tryType0(state: ParseState, lines: readonly string[], i: number, line: string): boolean {
  const open = ELEMENT_MULTILINE_OPEN_TYPE0_RE.exec(line);
  if (open === null) return false;
  const usymbol = open[1]!.toLowerCase();
  if (NATIVE_DECL_KEYWORDS.has(usymbol)) return false;
  let closerFound = false;
  for (let j = i + 1; j < lines.length && !closerFound; j++) {
    closerFound = ELEMENT_MULTILINE_END0_RE.test(lines[j]!.trim());
  }
  if (!closerFound) return false;
  const code = open[2]!;
  const classifier = ensureClassifier(state, code, 'descriptive', code);
  classifier.usymbol = usymbol;
  applyDecorations(state, classifier.id, open[3]!, true);
  const pending: PendingMultilineElement = { classifierId: classifier.id, terminator: 'quote', lines: [] };
  state.pendingMultilineElement = pending;
  pushEdgeText(pending, open[4]!);
  return true;
}

/** Try to open a TYPE1 then TYPE0 block on `line` — the two openers are
 *  mutually exclusive (one ends `[`, the other opens an UNCLOSED quote), so
 *  order is immaterial, mirroring the description engine's own
 *  `tryElementBlock`. */
export function tryOpenMultilineElement(state: ParseState, lines: readonly string[], i: number, line: string): boolean {
  return tryType1(state, line) || tryType0(state, lines, i, line);
}
