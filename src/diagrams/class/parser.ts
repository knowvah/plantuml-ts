/**
 * Parser for PlantUML class diagrams.
 *
 * Uses a command-dispatch table: an array of { pattern, execute } objects
 * tested against each trimmed line in priority order. First match wins.
 */

import type { UmlSource } from '../../core/block-extractor.js';
import type { ClassDiagramAST } from './ast.js';
import {
  applyDirectives,
  applyHideShowEntityDirectives,
  applyHideShowKindDirectives,
  applyVisibilityHideShow,
  applyStereotypeHideShow,
} from './class-directives.js';
import { handlePendingNoteLine } from './class-notes.js';
import { createAnnotations, matchAnnotationCommand } from '../../core/annotations/index.js';
import { createSpriteRegistry, matchSpriteCommand } from '../../core/sprite-commands.js';
import { normalizeSameConnectionLengths } from './class-namespace.js';
import { eventuallyBuildPhantomGroups } from './class-namespace-resolve.js';
export { ensureClassifier } from './class-ensure-classifier.js';
import { parseMemberLine } from './class-member-parser.js';
import { parseObjectField } from './class-object-commands.js';
import { applyMapBodyLine } from './class-map-commands.js';
import { finalizeJsonBody } from '../../core/command/CommandCreateJson.js';
import { isPendingJsonBodyComplete } from './class-json-commands.js';
import { dedentRawLines } from './class-body-enhanced.js';
import { COMMANDS } from './class-commands.js';
import { mergeStandaloneBraces } from './class-line-merge.js';
import { filterPendingBodyBlanks } from './class-body-blank-filter.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import { refuse } from '../../core/parse-refusal.js';

// ---------------------------------------------------------------------------
// Mutable parse state (local to each parseClass call)
// ---------------------------------------------------------------------------

import type { ParseState } from './class-parse-state.js';
import { adjudicateAllowMixing } from './class-descriptive-leaf-command.js';
import { continueMultilineElement, tryOpenMultilineElement } from './class-multiline-element.js';
export type { ParseState };

function makeDefaultAST(): ClassDiagramAST {
  return {
    classifiers: [],
    relationships: [],
    namespaces: [],
    directives: [],
    notes: [],
    annotations: createAnnotations(),
    sprites: createSpriteRegistry(),
  };
}

/**
 * `newpage` (CommandNewpage): finalize the current page and start an
 * entirely fresh one. Upstream creates a brand-new empty diagram
 * (`factory.createEmptyDiagram`) and wraps the pair in `NewpagedDiagram`,
 * which routes every subsequent command to `getLastDiagram()` — only `dpi`
 * carries over, which this parser does not model, so a page reset here
 * means every mutable field returns to its `parseClass` initial value.
 * @see ~/git/plantuml/.../descdiagram/command/CommandNewpage.java:77-88
 * @see ~/git/plantuml/.../NewpagedDiagram.java:61-162
 */
export function startNewPage(state: ParseState): void {
  // checkFinalError's same-pair length normalization runs per finished
  // diagram (ClassDiagram.java:74-82) — a page is a finished diagram.
  normalizeSameConnectionLengths(state.ast.relationships);
  // cdd-T1: `getTextBlock`'s own closing sweep (CucaDiagram.java:464) -- a
  // page IS a finished diagram, rendered through its own getTextBlock.
  eventuallyBuildPhantomGroups(state.ast.namespaces, state.ast.classifiers, state.creationCounter);
  applyDirectives(state.ast);
  // A2s F-A / B2: kind BEFORE entity/stereotype -- see finalizeParse's
  // identical ordering note.
  applyHideShowKindDirectives(state.ast);
  applyHideShowEntityDirectives(state.ast);
  applyVisibilityHideShow(state.ast);
  applyStereotypeHideShow(state.ast);
  state.pages.push(state.ast);
  state.ast = makeDefaultAST();
  state.classifierIndex = new Map();
  state.pendingBodyId = null;
  state.pendingJsonLines = [];
  state.activeNamespace = null;
  state.pendingNote = null;
  state.pendingNoteTags = [];
  state.namespaceSeparator = '.';
  state.intermediatePackages = true;
  state.descriptiveContainers = new Map();
  state.namespaceStack = [];
  state.togetherStack = [];
  state.lastEntity = null;
  state.creationCounter = { value: 0 };
  state.tipGroupsSeen = new Set();
}

// ---------------------------------------------------------------------------
// Main parser entry point
// ---------------------------------------------------------------------------

/**
 * Parse a preprocessed PlantUML class diagram block into an AST.
 */
/**
 * Close a pending `json { ... }` body, finalizing the accumulated raw lines
 * into `classifier.jsonValue` (class-json-commands.ts#finalizeJsonBody) —
 * called just before `handlePendingBodyLine` clears `pendingBodyId` on a
 * closing `}`. A no-op for every other pending kind (map/object/class), and
 * for the `''` duplicate-name sentinel (class-json-commands.ts#applyJsonOpen)
 * since `classifierIndex.get('')` always misses.
 */
function closeJsonBodyIfPending(state: ParseState): void {
  const idx = state.pendingBodyId !== null ? state.classifierIndex.get(state.pendingBodyId) : undefined;
  const classifier = idx !== undefined ? state.ast.classifiers[idx] : undefined;
  if (classifier !== undefined && classifier.kind === 'json') {
    finalizeJsonBody(classifier, state.pendingJsonLines);
  }
  state.pendingJsonLines = [];
}

/** T3 M5: a pending JSON body's bare-`}` candidate is NOT the real closer
 *  when the content accumulated BEFORE it (the candidate line itself is
 *  always the terminator, never body content -- same convention every other
 *  pending-body kind already follows) does not yet parse as complete,
 *  balanced JSON. Always `false` for every other pending kind. */
function isUnclosedJsonBody(state: ParseState): boolean {
  const idx = state.pendingBodyId !== null ? state.classifierIndex.get(state.pendingBodyId) : undefined;
  const classifier = idx !== undefined ? state.ast.classifiers[idx] : undefined;
  if (classifier === undefined || classifier.kind !== 'json') return false;
  return !isPendingJsonBodyComplete(state.pendingJsonLines);
}

/**
 * G2 N44: dedent a just-closed class/interface/enum/... body's
 * `rawBodyLines` (`BlocLines#trimSmart(1)`'s port) -- called just before
 * `handlePendingBodyLine` clears `pendingBodyId` on a closing `}`, mirroring
 * `closeJsonBodyIfPending`'s own placement. A no-op when `rawBodyLines` is
 * undefined (object/map/json bodies, or a body with zero lines) -- see
 * `class-body-enhanced.ts#dedentRawLines`'s own doc comment for the full
 * mechanism this fixes.
 */
function dedentPendingRawBodyLines(state: ParseState): void {
  const idx = state.pendingBodyId !== null ? state.classifierIndex.get(state.pendingBodyId) : undefined;
  const classifier = idx !== undefined ? state.ast.classifiers[idx] : undefined;
  if (classifier?.rawBodyLines !== undefined) {
    classifier.rawBodyLines = dedentRawLines(classifier.rawBodyLines);
  }
}

/**
 * Consume a line while inside an open brace body, treating it as a member
 * definition until `}` closes it. Returns true when the line was consumed
 * (i.e. a body was open).
 */
function handlePendingBodyLine(state: ParseState, line: string): boolean {
  if (state.pendingBodyId === null) return false;
  if (/^\}\s*$/.test(line) && !isUnclosedJsonBody(state)) {
    closeJsonBodyIfPending(state);
    dedentPendingRawBodyLines(state);
    filterPendingBodyBlanks(state);
    state.pendingBodyId = null;
    return true;
  }
  const idx = state.classifierIndex.get(state.pendingBodyId);
  if (idx !== undefined) {
    const classifier = state.ast.classifiers[idx];
    if (classifier !== undefined) {
      if (classifier.kind === 'map') {
        // Map bodies (`map Name { key => value / key *-> dest }`) collect
        // MapRow entries (and, for a linked entry, a Relationship) under
        // wholly different semantics than a member line — see
        // class-map-commands.ts#applyMapBodyLine's doc.
        applyMapBodyLine(state, classifier, line);
      } else if (classifier.kind === 'json') {
        // json bodies are not line-parseable individually (a bare
        // `"name": "component c1",` is not valid JSON on its own) — see
        // ParseState.pendingJsonLines' doc.
        state.pendingJsonLines.push(line);
      } else {
        // Object bodies (`object Foo { ... }`) collect raw field lines under
        // different semantics than class member lines — route by kind. See
        // class-object-commands.ts#parseObjectField's doc for why.
        const member = classifier.kind === 'object' ? parseObjectField(line) : parseMemberLine(line);
        if (member !== null) {
          classifier.members.push(member);
        } else if (line === '' && classifier.kind !== 'object') {
          // A2s F-A / A3: an interior blank body line enters `rawBody` as
          // an empty `Member` candidate (`addFieldOrMethod` takes every
          // interior line, empty included) -- which rows actually DISPLAY
          // is decided at body close by `filterBodyBlankMembers` below,
          // mirroring `getFieldsToDisplay`/`getMethodsToDisplay`'s empties
          // filtering. `parseMemberLine('')` returns null, so build the
          // placeholder here.
          // @see ~/git/plantuml/.../classdiagram/command/CommandCreateClassMultilines.java:303-307
          classifier.members.push({ visibility: '+', name: '', isStatic: false, isAbstract: false });
        }
        // G2 N42, G3/O4 (correction): parallel raw-line capture for
        // class/interface/enum/... AND object bodies alike -- upstream's
        // `BodierLikeClassOrObject#addFieldOrMethod` collects EVERY kind's
        // raw line into the SAME `rawBody` list unconditionally
        // (`isBodyEnhanced()`'s own scan has no kind gate); OBJECT's own
        // `getBody` ALWAYS routes through `BodyFactory.create1`
        // (`BodyEnhanced1`) when `showFields`, whether or not a separator
        // is present -- the pre-O4 "object -- no enhanced-body reach"
        // comment was a genuine gap, jar-verified `linazi-45-gevo553`
        // (`--`/`==`/`..`/`__` separators inside an object body). See
        // `Classifier.rawBodyLines`'s own doc comment. `state.currentRawLine`
        // (trailing-whitespace-only trimmed) is used instead of `line`
        // (fully trimmed by `mergeStandaloneBraces`) so a `|_` tree-list
        // line's leading indentation survives -- falls back to `line` only
        // for a hand-built `ParseState` that bypasses the main loop (never
        // sets `currentRawLine`, zero corpus reach).
        (classifier.rawBodyLines ??= []).push(state.currentRawLine ?? line);
      }
    }
  }
  return true;
  // #lizard forgives -- pre-existing violation (CCN 13 vs cap 10), unchanged
  // by the allowmixing gate: `git diff` shows zero overlap with this function.
}

/** Dispatch a line to the first matching command. Returns whether a
 *  command's pattern matched -- callers use this to decide whether to fall
 *  back to the annotation matcher (see `parseClass`'s doc: the generic
 *  `CODE : text` member-addition rule ("6-pre" above, upstream's
 *  `CommandAddMethod`) must win over a same-shaped `header: text`/
 *  `title: text` line, matching upstream's real registration order --
 *  `CommandAddMethod` before `CommonCommands.addTitleCommands`,
 *  ClassDiagramFactory.java:109,168). */
function dispatchCommand(state: ParseState, line: string): boolean {
  for (const cmd of COMMANDS) {
    const match = cmd.pattern.exec(line);
    if (match !== null) {
      cmd.execute(state, match);
      return true;
    }
  }
  return false;
}


/** cdd-T28: `matchAnnotationCommand`'s SINGLE-line matchers read `lines[i]`
 *  verbatim (they require an already-trimmed line), but a matched MULTILINE
 *  block's BODY must keep its indentation: upstream's `BlocLines` never
 *  trims a legend/title/caption body, and `CreoleStripeSimpleParser`'s
 *  FULL-mode list patterns are anchored at column 0
 *  (`^(\*+)…`/`^(#+)…`, java:70-72), so a leading space is what makes the
 *  jar draw ` * Hyp 1` as literal text instead of a bullet (jar-probed
 *  directly: the same source WITHOUT the leading space draws
 *  `<ellipse cx="22.5" …>` + the text at x=29, which is exactly what this
 *  port now draws). Trimming only index `i` is
 *  `description/annotation-line-trim.ts#trimLineForAnnotationMatch`'s
 *  established shape, duplicated here rather than imported across engine
 *  boundaries (the same convention that file's own doc records). */
function annotationLines(lines: readonly string[], i: number): readonly string[] {
  const raw = lines[i];
  if (raw === undefined) return lines;
  const trimmed = raw.trim();
  if (trimmed === raw) return lines;
  const copy = lines.slice();
  copy[i] = trimmed;
  return copy;
}

/**
 * T5 (dispatch-by-parse-attempt): upstream's fall-through refusal point --
 * no registered `Command` matched the line, so `getCandidate` returns `null`
 * and the factory builds a `SYNTAX_ERROR "Syntax Error?"` at that exact
 * line, score contribution 0 (the literal third arg to `new ErrorUml(...)`).
 * `line`/`consumed` prefer the ORIGINAL (pre-merge) source position
 * (`state.currentLine`, set every loop iteration from `merged.positions[i]`)
 * over the merged-array loop index, falling back to it only for a hand-built
 * `ParseState` fixture that bypasses position tracking.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemCommandFactory.java:169-175
 */
function buildSyntaxRefusal(state: ParseState, loopIndex: number): ParseRefusal {
  const line = state.currentLine ?? loopIndex;
  return refuse('syntax', line, line, 'Syntax Error?');
}

export function parseClass(block: UmlSource): ClassDiagramAST | ParseRefusal {
  const state: ParseState = {
    ast: makeDefaultAST(),
    classifierIndex: new Map(),
    stylePositions: block.stylePositions ?? [],
    namespaceSeparator: '.',
    intermediatePackages: true,
    pendingBodyId: null,
    pendingJsonLines: [],
    activeNamespace: null,
    allowMixing: false,
    gatedLeafSeen: false,
    pendingNote: null,
    pendingNoteTags: [],
    descriptiveContainers: new Map(),
    pendingContainerTags: new Map(),
    namespaceStack: [],
    togetherStack: [],
    lastEntity: null,
    pages: [],
    creationCounter: { value: 0 },
    tipGroupsSeen: new Set(),
  };

  // Annotation commands (title/caption/legend/header/footer/mainframe) are
  // consulted AFTER the existing multiline constructs (note body, brace
  // body) have had a chance to claim the line -- decisions.md D3: a
  // `title`/`legend`-shaped line inside `note ... end note` or a class body
  // must stay note/member text, never annotation content. Also consulted
  // AFTER `dispatchCommand`/`COMMANDS` -- NOT "matcher first": upstream
  // registers `CommonCommands.addTitleCommands` near the END of
  // `ClassDiagramFactory#initCommandsList` (line 168 of ~170), AFTER the
  // generic `CODE : text` member-addition rule ("6-pre" above, upstream's
  // `CommandAddMethod`, line 109). A top-level `header: text`/`title: text`
  // line is therefore claimed by that member rule FIRST in real upstream
  // output (creating/appending to a classifier literally named `header`/
  // `title`), matching the identical ambiguity verified against the
  // desebo-47-maro096 state-diagram oracle (see state/parser.ts's doc) --
  // `dispatchCommand` returning `false` (no COMMANDS pattern matched) is
  // what makes a line eligible for the annotation fallback. This also
  // replaces the old `pendingLegend` strip (legend content now lands in
  // `state.ast.annotations.legend` instead of being discarded).
  const merged = mergeStandaloneBraces(block.lines, block.linePositions ?? []);
  const lines = merged.lines;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    // G2 N9: current line's 0-indexed source position, for the
    // relationship-dispatch command's `Relationship.sourceLine` stamp --
    // see `ParseState.currentLine`'s doc comment.
    state.currentLine = merged.positions[i];
    // G2 N42: see `ParseState.currentRawLine`'s own doc comment.
    state.currentRawLine = merged.rawLines[i];
    if (handlePendingNoteLine(state, line)) continue;
    if (handlePendingBodyLine(state, line)) continue;
    const multilineConsumed = continueMultilineElement(state, lines, merged.rawLines, i);
    if (multilineConsumed > 0) {
      i += multilineConsumed - 1;
      continue;
    }
    // A2s F-A / A3: blank lines now SURVIVE mergeStandaloneBraces (so open
    // note/brace bodies above receive them as content); one no open
    // construct claims is skipped here, exactly as when the pre-pass
    // dropped them all -- command dispatch never sees a blank line.
    if (line === '') continue;
    // T7 Mechanism A (unknown-bucket-routing-repair): tried BEFORE
    // `dispatchCommand` -- this port's rule 7 (classifier declarations,
    // entity/circle) and rule 9 (DESCRIPTIVE_LEAF_COMMANDS) both use
    // unanchored dispatch-gating patterns that would otherwise steal or
    // silently swallow a TYPE0/TYPE1 opener before it ever reached here
    // (see class-multiline-element.ts's own module doc comment).
    if (tryOpenMultilineElement(state, lines, i, line)) continue;
    if (dispatchCommand(state, line)) {
      // A command matched but reported failure. Upstream builds the
      // EXECUTION_ERROR and `createSystem` returns it at once
      // (`PSystemCommandFactory.java:180-186`, `:136-139`); it never carries
      // on to later lines.
      if (state.executionRefusal !== undefined) return state.executionRefusal;
      continue;
    }
    // makeDefaultAST() always sets annotations; the field is optional on
    // ClassDiagramAST only so hand-authored literal fixtures elsewhere need
    // not include it (see ast.ts's doc on the field).
    const annotationMatch = matchAnnotationCommand(annotationLines(merged.rawLines, i), i, state.ast.annotations!);
    if (annotationMatch !== null) {
      i += annotationMatch.consumed - 1;
      continue;
    }

    // `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4): tried
    // immediately after the chrome matcher, same fallback dispatch position
    // (mirrors upstream registering `CommandFactorySprite` right after
    // `addTitleCommands`, ClassDiagramFactory.java:168-169).
    const spriteMatch = matchSpriteCommand(lines, i, state.ast.sprites!);
    if (spriteMatch !== null) {
      i += spriteMatch.consumed - 1;
      continue;
    }

    // T5: no command/annotation/sprite matcher claimed this line -- the
    // upstream fall-through refusal (see buildSyntaxRefusal's doc). Mirrors
    // `createSystem`'s abort-on-first-failure: return immediately rather
    // than continuing to later lines.
    return buildSyntaxRefusal(state, i);
  }

  return finalizeParse(state);
  // #lizard forgives -- pre-existing violation (was already 43 NLOC vs the 30
  // cap); the allowmixing gate added only two state-init lines to its object
  // literal, and T5's refusal fall-through added one more branch delegating
  // to buildSyntaxRefusal -- no existing branch's condition or order changed.
  // Restructuring ported parser dispatch mid-change is what CLAUDE.md's "do
  // not refactor while porting" prevents.
}

/** Post-processing: same-pair length normalization (checkFinalError,
 *  ClassDiagram.java:74-82), hide/show directives, then page assembly. */
function finalizeParse(state: ParseState): ClassDiagramAST {
  adjudicateAllowMixing(state);

  normalizeSameConnectionLengths(state.ast.relationships);
  // cdd-T1: `getTextBlock`'s closing sweep (CucaDiagram.java:464, as in
  // startNewPage) -- numbers any package no like-class leaf ever swept.
  eventuallyBuildPhantomGroups(state.ast.namespaces, state.ast.classifiers, state.creationCounter);
  applyDirectives(state.ast);
  // A2s F-A / B2: kind BEFORE entity/stereotype -- entity `show` now clears
  // flags (CucaDiagram#showPortion's last-matching-rule fold), so the more-
  // specific entity/`<<stereotype>>` pass must run after the type-keyword
  // pass (`hide class circled` + `show <<even>> circled`, xofumu-51-jozi528).
  applyHideShowKindDirectives(state.ast);
  applyHideShowEntityDirectives(state.ast);
  applyVisibilityHideShow(state.ast);
  applyStereotypeHideShow(state.ast);

  // Single page (the common case): no `pages` field, AST unchanged.
  if (state.pages.length === 0) {
    return state.ast;
  }

  // Multi-page: the first page carries `pages` (itself included), per the
  // T6 interface contract consumed by layoutClass (T7).
  state.pages.push(state.ast);
  state.pages[0]!.pages = state.pages;
  return state.pages[0]!;
}
