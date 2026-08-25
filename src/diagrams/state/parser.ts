/**
 * Parser for PlantUML state diagrams.
 *
 * Uses a command-dispatch table (`state-commands.ts`): an array of
 * { pattern, passes, execute } objects tested against each trimmed line in
 * priority order. First match wins; `passes` then gates whether `execute`
 * runs (see `state-commands.ts`'s `Command.passes` doc).
 *
 * TWO-PASS architecture (mission A4/Phase L, ParserPass port): the ENTIRE
 * source is walked twice, against ONE PERSISTENT `ParseState` (shared scope
 * tree, `globalByName` registry, and `lastEntity`) — mirroring upstream's
 * single entity/group tree visited three times, not rebuilt each visit
 * (`ParseState.scopeByOwner`'s doc in state-parse-state.ts). Pass ONE runs
 * only declaration-family commands (composite/frame open+close, concurrent
 * regions, plain/pseudostate declarations, standalone description lines,
 * freestanding notes) and builds the COMPLETE state/composite tree, each
 * state in its true nested scope, for the WHOLE document. Pass TWO REOPENS
 * the same scopes (rather than rebuilding them) and additionally runs
 * transitions, `note on link`, and attached notes.
 *
 * This is a PREREQUISITE for `state-parse-state.ts`'s global by-name reuse:
 * a transition on pass TWO referencing a name declared LATER in the source
 * text still finds it already correctly placed, because pass ONE already
 * walked the whole document before any transition ever ran. A single-pass
 * implementation of global reuse is unsafe for exactly this
 * forward-reference case (verified against the oracle: it regressed the
 * bajelo-54-dixe684 and tuvugi-94-gapi519 goldens when tried without this
 * restructure). Rebuilding a FRESH scope tree per pass (an earlier draft of
 * this restructure) is ALSO unsafe: it silently drops any state created
 * only during pass ONE and never touched again on pass TWO (e.g. an
 * implicit create from a standalone `CODE : text` line — `CommandAddField`
 * is ParserPass.ONE-only upstream) — hence the persistent, reopened-not-
 * rebuilt scope tree.
 *
 * Composite states (state Foo { ... } / frame Foo { ... }) and concurrent
 * regions (separated by `--`/`||` inside a composite block) are handled via
 * a scope stack (`state-parse-state.ts`). Multi-line note bodies are
 * accumulated here, before dispatch, the same way the class parser handles
 * them (`class/parser.ts`'s `handlePendingNoteLine`) — with one addition:
 * the two multi-line note openers dispatch on BOTH passes (`state-commands.ts`
 * rules 10/13) purely so the block is always opened/swallowed regardless of
 * pass; `noteFinalizePass` below gates whether the accumulated text
 * actually gets pushed into `ast.notes`.
 * @see ~/git/plantuml/.../statediagram/StateDiagram.java#getRequiredPass
 */

import type { UmlSource } from '../../core/block-extractor.js';
import type { StateDiagramAST } from './ast.js';
import { COMMANDS } from './state-commands.js';
import { finalizePendingNote, isNoteCloser, type PendingNote } from './state-notes.js';
import { isJsonCloser } from './state-json-commands.js';
import { finalizeJsonBody } from '../../core/command/CommandCreateJson.js';
import {
  createAnnotations,
  matchAnnotationCommand,
  type DiagramAnnotations,
} from '../../core/annotations/index.js';
import { createSpriteRegistry, matchSpriteCommand, type SpriteRegistry } from '../../core/sprite-commands.js';
import {
  type ParseState,
  type Pass,
  makeScope,
  noteScopeId,
  nextCreationIndex,
  popScope,
  syncAutoScopes,
  DEFAULT_SEPARATOR,
} from './state-parse-state.js';
import { refuse, type ParseRefusal } from '../../core/parse-refusal.js';
import { checkFinalError } from './state-check-final.js';

/**
 * Which pass may FINALIZE (push into `ast.notes`) a given pending note
 * kind. Freestanding notes mirror upstream's `CommandFactoryNote` (default
 * `ParserPass.ONE`, no override); attached notes mirror
 * `CommandFactoryNoteOnEntity` (`ParserPass.THREE` for state diagrams,
 * merged into our single `'two'` pass alongside transitions/note-on-link —
 * see `Pass`'s doc in state-parse-state.ts for why merging THREE into TWO
 * is a safe, documented simplification for this corpus).
 */
function noteFinalizePass(kind: PendingNote['kind']): Pass {
  return kind === 'freestanding' ? 'one' : 'two';
}

/**
 * Consume a line while inside a multi-line note block, accumulating text
 * until the closer (`end note`, or `}` for a bracket-opened note). Returns
 * true when the line was consumed (i.e. a note was open). Finalization
 * (pushing into `ast.notes`) only happens when `pass` matches the note
 * kind's real eligible pass (`noteFinalizePass`) — on the OTHER pass, the
 * block is still fully swallowed (so its `}`/`end note` closer never
 * reaches `dispatchCommand`), just discarded instead of built.
 */
function handlePendingNoteLine(ps: ParseState, line: string, pass: Pass): boolean {
  if (ps.pendingNote === null) return false;
  if (isNoteCloser(ps.pendingNote, line)) {
    if (pass === noteFinalizePass(ps.pendingNote.kind)) {
      const scopeId = noteScopeId(ps);
      const id = finalizePendingNote(ps.ast, ps.pendingNote, scopeId, () => nextCreationIndex(ps));
      if (id !== undefined) ps.lastEntity = id;
    }
    ps.pendingNote = null;
  } else {
    ps.pendingNote.textLines.push(line);
  }
  return true;
}

/**
 * Consume a line while inside a `json Name { ... }` multi-line body,
 * accumulating raw lines until the closing brace. Returns true when the
 * line was consumed. Mirrors {@link handlePendingNoteLine} exactly: the
 * body must be swallowed regardless of pass (so its closing brace never
 * reaches `dispatchCommand`, and a mid-body line like a quoted-key/
 * quoted-value pair never falls through to the standalone CODE-colon-text
 * rule), but the actual `jsonValue` write only fires on pass ONE
 * (state-json-commands.ts's `finalizeJsonBody` doc).
 */
function handlePendingJsonLine(ps: ParseState, line: string, pass: Pass): boolean {
  if (ps.pendingJson === null) return false;
  if (isJsonCloser(line)) {
    if (pass === 'one') finalizeJsonBody(ps.pendingJson.target, ps.pendingJson.lines);
    ps.pendingJson = null;
  } else {
    ps.pendingJson.lines.push(line);
  }
  return true;
}

/** Dispatch a line to the first matching command, then apply it only if
 *  eligible for the current pass (see `Command.passes`'s doc). Returns
 *  whether ANY command's pattern matched (regardless of pass eligibility) --
 *  callers use this to decide whether to fall back to the annotation matcher
 *  (see `runPass`'s doc: the state-specific `CODE : text` description-line
 *  rule, COMMANDS' rule 15, must win over a same-shaped `header: text`/
 *  `title: text` line, matching upstream's real per-factory registration
 *  order -- CommandAddField before CommonCommands.addCommonCommands1,
 *  StateDiagramFactory.java:94,118). */
function dispatchCommand(ps: ParseState, line: string, pass: Pass): boolean {
  for (const cmd of COMMANDS) {
    const match = cmd.pattern.exec(line);
    if (match !== null) {
      if (cmd.passes.includes(pass)) cmd.execute(ps, match, pass);
      return true;
    }
  }
  return false;
}

/**
 * Trimmed, blank-filtered view of `block` (matchAnnotationCommand requires
 * already-trimmed lines -- see commands.ts's single-line matchers, which
 * test `^title...$` etc. with no internal trim), paired with each surviving
 * line's original `block.lines` position (T8, mission dispatch-by-parse-
 * attempt): blank lines are filtered out here the same way upstream's own
 * `CommandNope` (`command/CommonCommands.java:62`, a real registered Command
 * matching `^%s*$` and doing nothing) silently no-ops them, so dropping them
 * before the loop changes nothing observable -- but a refusal still needs to
 * name the offending line's real position in the source, not its position
 * in this filtered view. Rebuilt per pass (cheap, block-sized) rather than
 * shared on ParseState, so this stays within parser.ts's write-set (T5,
 * plans/g0b-annotations).
 */
function nonBlankLines(block: UmlSource): { lines: string[]; origIndex: number[] } {
  const lines: string[] = [];
  const origIndex: number[] = [];
  block.lines.forEach((raw, idx) => {
    const t = raw.trim();
    if (t === '') return;
    lines.push(t);
    origIndex.push(idx);
  });
  return { lines, origIndex };
}

/**
 * `dispatchCommand` declined line `i` (in `lines`, matched pairwise with
 * `origIndex`); try the shared annotation/sprite fallback matchers, and
 * refuse if neither claims it either (T8, mission dispatch-by-parse-attempt)
 * -- see `runPass`'s own doc for why a fall-through here ends the whole
 * parse, not just this line. Returns the caller's extra loop-index advance
 * on a match (`0` when the matcher consumed just this one line), or the
 * refusal to return. Split out of `runPass` to stay under the complexity
 * hook's 30-NLOC cap.
 */
function fallbackOrRefuse(
  lines: readonly string[],
  origIndex: readonly number[],
  i: number,
  annotationTarget: DiagramAnnotations,
  spriteTarget: SpriteRegistry,
): number | ParseRefusal {
  const annotationMatch = matchAnnotationCommand(lines, i, annotationTarget);
  if (annotationMatch !== null) return annotationMatch.consumed - 1;
  // `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4): same
  // FALLBACK position as the annotation matcher (tried immediately after
  // it), mirroring upstream's title-then-sprite registration order.
  const spriteMatch = matchSpriteCommand(lines, i, spriteTarget);
  if (spriteMatch !== null) return spriteMatch.consumed - 1;
  // No command, annotation, or sprite matcher recognised this line --
  // upstream's `getCandidate` returns `null` and `executeFewLines` builds a
  // SYNTAX_ERROR "Syntax Error?" immediately. `consumed` is `origIndex[i] +
  // 1`: upstream's `it.next()` (called AFTER building the error, BEFORE
  // `it.getTrace()` is read) advances the trace past the offending line
  // itself, so `trace.size()` includes it, not just the lines before it.
  // @see ~/git/plantuml/.../command/PSystemCommandFactory.java:169-175
  const offending = origIndex[i]!;
  return refuse('syntax', offending, offending + 1, 'Syntax Error?');
}

/**
 * Run one full top-to-bottom walk of `block` against the SHARED `ps` for
 * the given pass. `pendingNote` resets to `null` first — it is a
 * walk-position construct (are we currently inside an unclosed block, in
 * THIS scan), not a diagram-level value, so it must not leak from one
 * pass's walk into the next's (see `ParseState.pendingNote`'s doc).
 * `scopeStack`/`lastEntity`/`globalByName` are deliberately NOT reset —
 * they are diagram-level and persist across both passes.
 *
 * Returns a {@link ParseRefusal} the moment a line matches nothing (mission
 * dispatch-by-parse-attempt, T8) — mirrors upstream `PSystemCommandFactory
 * #executeFewLines`'s `getCandidate(it) == null` branch immediately
 * short-circuiting `createSystem`'s per-pass `while` loop (`if (sys
 * instanceof PSystemError) return sys;`, `PSystemCommandFactory.java:
 * 136-139`) — so a fall-through here stops the REST of this pass too, not
 * just the offending line. Line-pattern matching never depends on `pass`
 * (only whether a MATCHED command's `passes` gates its execution does, via
 * `dispatchCommand`/`Command.isEligibleFor`), so a line unmatched on pass
 * 'one' is guaranteed unmatched on pass 'two' as well — `parseState` never
 * needs to run pass 'two' once pass 'one' refuses, matching upstream never
 * reaching its own later passes past the same `return`.
 * @see ~/git/plantuml/.../command/PSystemCommandFactory.java:127-140
 */
function runPass(ps: ParseState, block: UmlSource, pass: Pass): ParseRefusal | null {
  ps.pendingNote = null;
  ps.pendingJson = null;
  ps.scopeStack = [ps.scopeStack[0]];
  ps.scopeStack[0].regionCursor = 0;

  const { lines, origIndex } = nonBlankLines(block);

  // Title/caption/legend/header/footer/mainframe are upstream `CommonCommand`s
  // registered by `StateDiagramFactory.initCommandsList` via
  // `CommonCommands.addCommonCommands1` -- called LAST (line 118 of ~120
  // registrations), AFTER `CommandAddField` (the `CODE : text`
  // description-line command, line 94) and every other state-specific
  // command. So a line like `HEADER: 0x00h ...` (a state literally named
  // "HEADER" with description lines) is claimed by the description-line
  // rule FIRST in real upstream output -- verified against the
  // desebo-47-maro096 oracle DOT (16 nodes incl. a degree-0 "HEADER" state;
  // consulting the matcher before `dispatchCommand` drops that node -- the
  // exact regression this ordering avoids). The matcher therefore
  // runs only as a FALLBACK, after `dispatchCommand` finds no match -- never
  // stealing a line the state grammar itself would have claimed. Consulted
  // on BOTH passes for swallow-symmetry with handlePendingNoteLine/
  // handlePendingJsonLine above (nothing else claims these lines on either
  // pass, so this never conflicts with real state-building); pass TWO's
  // match target is a throwaway object -- pass ONE already committed the
  // real annotations onto `ps.ast`.
  const annotationTarget = pass === 'one' ? ps.ast.annotations! : createAnnotations();
  // Same pass-throwaway-target discipline as `annotationTarget` above:
  // pass ONE commits real sprites onto `ps.ast`, pass TWO's matches are
  // discarded (nothing else claims sprite lines on either pass, so this
  // never conflicts with real state-building).
  const spriteTarget = pass === 'one' ? ps.ast.sprites! : createSpriteRegistry();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (handlePendingNoteLine(ps, line, pass)) continue;
    if (handlePendingJsonLine(ps, line, pass)) continue;
    if (dispatchCommand(ps, line, pass)) continue;
    const result = fallbackOrRefuse(lines, origIndex, i, annotationTarget, spriteTarget);
    if (typeof result !== 'number') return result;
    i += result;
  }

  // Close any unclosed composite scopes (mirrors the pre-existing
  // best-effort recovery for a missing `}`/`end state`).
  while (ps.scopeStack.length > 1) {
    popScope(ps);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main parser entry point
// ---------------------------------------------------------------------------

/** Fresh `ast`/`ps` pair for a brand-new parse -- split out of `parseState`
 *  to stay under the complexity hook's 30-NLOC cap (T8 added two early-return
 *  refusal checks to what was previously a straight-line function). */
function initParseState(): { ast: StateDiagramAST; ps: ParseState } {
  const ast: StateDiagramAST = {
    states: [],
    transitions: [],
    notes: [],
    annotations: createAnnotations(),
    sprites: createSpriteRegistry(),
  };
  const topScope = makeScope(null);
  const ps: ParseState = {
    scopeStack: [topScope],
    ast,
    pendingNote: null,
    pendingJson: null,
    lastEntity: null,
    globalByName: new Map(),
    scopeByOwner: new Map(),
    linkConnections: [],
    separator: DEFAULT_SEPARATOR,
    creationCounter: 0,
    pseudoCreationIndex: new Map(),
    concurrentGlobalCounter: 0,
    concurrentGlobalIds: new Map(),
  };
  return { ast, ps };
}

/**
 * Parse a PlantUML state diagram block into a StateDiagramAST — or a
 * {@link ParseRefusal} (T8, mission dispatch-by-parse-attempt, D0/D1) when
 * some line matches no registered command, or the finished diagram fails
 * {@link checkFinalError}. A successful (non-refused) parse is byte-identical
 * to what this function produced before T8 — refusal is strictly additive,
 * never changing what a fully-recognised source parses to.
 */
export function parseState(block: UmlSource): StateDiagramAST | ParseRefusal {
  const { ast, ps } = initParseState();
  const topScope = ps.scopeStack[0];

  // PASS ONE: declaration-family commands only — builds the complete tree.
  // A refusal here means pass TWO never runs at all — matches upstream's
  // own `createSystem`, which never reaches a later `ParserPass` once an
  // earlier one's line loop returns a `PSystemError` (see `runPass`'s doc).
  const refusalOne = runPass(ps, block, 'one');
  if (refusalOne !== null) return refusalOne;

  // PASS TWO: structural commands REOPEN the same scopes (identical
  // nesting, enriched in place) plus transitions/note-on-link/attached
  // notes now fire. Line-pattern matching is pass-independent (`runPass`'s
  // doc), so this can only refuse here if pass ONE's own walk somehow
  // missed a line pass TWO's walk reaches -- it does not, but the check is
  // kept for the same reason upstream's own per-pass loop re-checks on
  // every pass rather than assuming the first pass's clean run predicts the
  // rest.
  const refusalTwo = runPass(ps, block, 'two');
  if (refusalTwo !== null) return refusalTwo;

  // End-of-parse sweep (mission A4 Phase L iter 10, upstream
  // `eventuallyBuildPhantomGroups`): materializes `children` for any
  // composite that exists ONLY as a byproduct of dotted-hierarchy
  // auto-creation (state-parse-resolve.ts#resolveOrCreateDottedPath) and
  // therefore never went through pushScope/popScope.
  syncAutoScopes(ps);

  ast.states = topScope.states;
  ast.transitions = topScope.transitions;
  // mission G4 S7: hand off the parse-time pseudostate creation-index map
  // (see `StateDiagramAST.pseudoCreationIndex`'s own doc comment, ast.ts) --
  // mirrors the `ast.states`/`ast.transitions` handoff immediately above.
  ast.pseudoCreationIndex = ps.pseudoCreationIndex;
  // mission G4 S14: hand off the parse-time CONC-region global-numbering
  // translation map (see `StateDiagramAST.concurrentGlobalIds`'s own doc
  // comment, ast.ts) -- mirrors the `pseudoCreationIndex` handoff above.
  ast.concurrentGlobalIds = ps.concurrentGlobalIds;

  // Upstream's fourth refusal point, `finalizeDiagram`'s `checkFinalError`
  // call (`PSystemCommandFactory.java:150-153`) -- a whole-diagram validity
  // check over the now-finished tree (T8; see state-check-final.ts for the
  // full mechanism and its documented conservative limitation). `consumed`
  // is `1`: upstream's `it` is reset to a fresh iterator at every pass
  // boundary (`createSystem`'s `it = source.iterator2(); it.next();` reset
  // dance, `PSystemCommandFactory.java:131-133`), so by the time
  // `finalizeDiagram` reads `it.getTrace()` its size is always exactly 1,
  // regardless of source length or pass count -- not an invented value.
  const finalError = checkFinalError(ps, ast);
  if (finalError !== undefined) return refuse('final', 0, 1, finalError);

  return ast;
}
