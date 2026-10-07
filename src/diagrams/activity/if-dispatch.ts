/**
 * `if / elseif / else / endif` dispatch for the activity diagram parser.
 * Split out of node-dispatch.ts (mission G0b/T6) purely to keep both files
 * under the project's 500-line file cap -- no behavior change; every
 * export here is verbatim code moved from node-dispatch.ts.
 */

import type { ParseRefusal } from '../../core/parse-refusal.js';
import type { ActivityElseIf, ActivityIf, ActivityNode, ActivityNote } from './ast.js';
import {
  RE_ELSE,
  RE_ELSE_LEGACY,
  RE_ELSEIF,
  RE_ENDIF,
  RE_IF,
  RE_IF4,
  RE_IF_LEGACY,
  isRefusal,
  swimlaneSpread,
  type DispatchResult,
  type ParseContext,
  type StopKeywords,
} from './dispatch-support.js';
import { parseNodes } from './node-dispatch.js';

// ---------------------------------------------------------------------------
// if / elseif / else / endif
// ---------------------------------------------------------------------------

/** Stop-keyword PREFIX test for `elseif`, used only by
 *  {@link consumeIfClauses}'s `parseNodes` stop-list -- not the full
 *  {@link RE_ELSEIF} match (which also needs `then (label)`'s trailing
 *  shape). Mirrors `RE_ELSEIF`'s own leading `(incoming)` group (see its
 *  doc, `dispatch-support.ts`) so a decorated `elseif` stops a body scan
 *  the same as a bare one. */
const RE_ELSEIF_STOP = /^(?:\([^)]*\)\s*)?else\s*if\b/i;

interface IfClauses {
  cursor: number;
  elseIfBranches: ActivityElseIf[];
  elseBranch: ActivityNode[];
  elseLabel: string | undefined;
}

/** Strips the same optional trailing `;` the main dispatch loop applies to
 *  non-action lines, so `else (no);` / `endif;` are recognised here too.
 *  Exported: `switch-dispatch.ts` (mission ubrr-T10 M2) reuses it for the
 *  identical `case (...)`/`endswitch;` shape. */
export function stripTrailingSemi(raw: string): string {
  return !raw.startsWith(':') && raw.endsWith(';') ? raw.slice(0, -1).trimEnd() : raw;
}

/**
 * `\n`/`\t`/`\\` escapes inside a branch label's OR a condition's raw
 * text, mirroring `Display#getWithNewlines`'s own backslash pass
 * (`klimt/creole/Display.java:287-313`): `\n` ends the current line
 * (joined back with a REAL newline here, since `renderIfLabel`'s
 * `label.split('\n')` -- a literal newline character -- is what turns one
 * line into many), `\t` appends a literal tab, `\\` appends a literal
 * backslash, and any OTHER character after a `\` is kept verbatim (both
 * characters) -- upstream's own trailing `else { current.append(c);
 * current.append(c2); }` (`:311-313`), not a silent drop
 * (`getWithNewlines3`'s shorter sibling DOES drop it, but that function is
 * not the one any label/condition here reaches).
 * Before this (`bazuma-86-metu353`), an `else (...\n...)` label's literal
 * two-character `\`+`n` reached `renderIfLabel` unconverted, so its
 * `.split('\n')` (a real newline) never split it into multiple `<text>`
 * lines and `gtile-diamond-inside.ts`'s own `measureLabel` summed every
 * character's width (including the literal `\`/`n` glyphs) as ONE line,
 * reserving neither the right width nor the right height in layout.
 * IFNL (T3d, `vaxiki-78-nice114`): the `if`/`elseif` CONDITION itself goes
 * through the exact same `Display.getWithNewlines` call upstream
 * (`CommandIf2.java:151`, `CommandIf4.java:120`, `CommandElseIf2.java:151`)
 * but this module's own `matchIfHeader`/`consumeElseifClause` never applied
 * {@link unescapeLabelNewlines} to the `condition` field, only to
 * `thenLabel`/branch labels -- the literal `\`+`n` rendered verbatim in the
 * hexagon's own text.
 * `\r`/`\l` (`:291-296`, upstream's own right/left natural-alignment
 * escapes) are a documented gap: no branch-label fixture in this task's
 * cohort uses either, and porting them means threading a new per-label
 * alignment override through `ActivityIf`/`ActivityElseIf` and
 * `renderIfLabel` -- a separate mechanism from "multiline branch label",
 * left for a fixture that actually needs it.
 */
export function unescapeLabelNewlines(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (c === '\\' && i < text.length - 1) {
      const c2 = text[i + 1]!;
      i++;
      if (c2 === 'n') out += '\n';
      else if (c2 === 't') out += '\t';
      else if (c2 === '\\') out += '\\';
      else out += c + c2;
    } else {
      out += c;
    }
  }
  return out;
}

/** {@link unescapeLabelNewlines} applied only when the captured group
 *  matched -- every call site below immediately follows an optional
 *  regex-group `.trim()`. */
export function unescapeLabel(text: string | undefined): string | undefined {
  return text === undefined ? text : unescapeLabelNewlines(text);
}

interface ElseifStep {
  cursor: number;
  branch: ActivityElseIf;
}

/** Consumes one `elseif (...) then (...)` clause and its body. */
function consumeElseifClause(
  ctx: ParseContext,
  cursor: number,
  clauseLine: string,
  ifInnerStops: StopKeywords,
): ElseifStep | ParseRefusal {
  const elseifMatch = RE_ELSEIF.exec(clauseLine)!;
  // ELSEIFIN: group 1 is the leading `(incoming)` decoration -- shifts
  // condition/then-label to groups 2/3 (dispatch-support.ts's own doc).
  const incomingLabel = unescapeLabel(elseifMatch[1]?.trim());
  const eiLabel = unescapeLabel(elseifMatch[3]?.trim());
  const eiResult = parseNodes(ctx, cursor + 1, ifInnerStops);
  if (isRefusal(eiResult)) return eiResult;
  return {
    cursor: eiResult.nextIdx,
    branch: {
      condition: unescapeLabelNewlines(elseifMatch[2]!.trim()),
      ...(eiLabel !== undefined && eiLabel !== '' ? { label: eiLabel } : {}),
      ...(incomingLabel !== undefined && incomingLabel !== '' ? { incomingLabel } : {}),
      body: eiResult.nodes,
    },
  };
}

interface ElseStep {
  cursor: number;
  branch: ActivityNode[];
  label: string | undefined;
}

/**
 * Consumes an `else (...)`/legacy-`else when LABEL` clause's body, plus
 * its terminating `endif`. `label` is already extracted by the caller
 * (mission ubrr-T10 M4a/M4c: `RE_ENDIF` now also accepts a trailing
 * stereogroup, so the closer check uses it instead of an exact-string
 * `'endif'` compare -- see `RE_ENDIF`'s own doc for why an exact compare
 * would otherwise silently swallow lines).
 */
function consumeElseClause(ctx: ParseContext, cursor: number, label: string | undefined): ElseStep | ParseRefusal {
  const { lines } = ctx;
  const elseResult = parseNodes(ctx, cursor + 1, [RE_ENDIF]);
  if (isRefusal(elseResult)) return elseResult;
  let next = elseResult.nextIdx;
  if (next < lines.length && RE_ENDIF.test(stripTrailingSemi(lines[next]!.trim()))) {
    next++;
  }
  return { cursor: next, branch: elseResult.nodes, label };
}

/** One step of {@link consumeIfClauses}'s clause-header scan. `'unexpected'`
 *  is the not-converted-to-refusal fallback -- see that function's doc
 *  comment for why. */
type ClauseStep =
  | { kind: 'endif' | 'unexpected'; cursor: number }
  | { kind: 'elseif'; cursor: number; branch: ActivityElseIf }
  | { kind: 'else'; cursor: number; branch: ActivityNode[]; label: string | undefined }
  | ParseRefusal;

/** Classifies and consumes exactly one clause-header line: `endif`
 *  (optionally stereotyped, `RE_ENDIF`), `elseif (...) then (...)` (plus
 *  its body), `else (...)` OR legacy `else when LABEL` (plus its body and
 *  terminating `endif`), or the unexpected-line fallback. */
function classifyClauseLine(ctx: ParseContext, cursor: number, ifInnerStops: StopKeywords): ClauseStep {
  const clauseLine = stripTrailingSemi(ctx.lines[cursor]!.trim());

  if (RE_ENDIF.test(clauseLine)) return { kind: 'endif', cursor: cursor + 1 };

  if (RE_ELSEIF.test(clauseLine)) {
    const step = consumeElseifClause(ctx, cursor, clauseLine, ifInnerStops);
    if (isRefusal(step)) return step;
    return { kind: 'elseif', cursor: step.cursor, branch: step.branch };
  }

  // Legacy `else when LABEL` (mission ubrr-T10 M4c) is checked BEFORE the
  // plain `else (...)?` form: `RE_ELSE`'s optional group would otherwise
  // never match "when no" as a paren group and fall through anyway, but
  // trying the more specific legacy form first mirrors upstream's own
  // `CommandElseLegacy1` (a distinct, separately-registered command).
  const legacyMatch = RE_ELSE_LEGACY.exec(clauseLine);
  if (legacyMatch !== null) {
    const step = consumeElseClause(ctx, cursor, unescapeLabel(legacyMatch[1]!.trim()));
    if (isRefusal(step)) return step;
    return { kind: 'else', cursor: step.cursor, branch: step.branch, label: step.label };
  }

  if (RE_ELSE.test(clauseLine)) {
    const step = consumeElseClause(ctx, cursor, unescapeLabel(RE_ELSE.exec(clauseLine)![1]?.trim()));
    if (isRefusal(step)) return step;
    return { kind: 'else', cursor: step.cursor, branch: step.branch, label: step.label };
  }

  return { kind: 'unexpected', cursor: cursor + 1 };
}

/**
 * Consumes the sequence of `elseif` / `else` / `endif` clauses following
 * an `if (...)`'s then-branch.
 *
 * {@link classifyClauseLine}'s `'unexpected'` outcome is defensive, not a
 * live command-recognition point, and is intentionally left unconverted
 * to a refusal (mission dispatch-by-parse-attempt/T6): every entry into
 * this loop's body starts at a cursor where the immediately preceding
 * `parseNodes` call already matched one of `ifInnerStops` via
 * `matchesStopKeyword` (exact keyword, or keyword+space/paren prefix), or
 * exited on end-of-input, which this loop's own `cursor < lines.length`
 * guard also catches before the body runs. `matchesStopKeyword`'s prefix
 * form is looser than `classifyClauseLine`'s exact-match/regex checks, so
 * a synthetic line such as "endif foo" could in principle land here --
 * but that shape matches no upstream `Command` either
 * (`CommandEndif3.java:58-67` has no trailing free-text group), so
 * upstream would ALSO refuse it, just via its one flat `getCandidate` loop
 * rather than this nested one. Converting this fallback risks a false
 * stop-condition-3 (refusing something upstream accepts) for a case this
 * task cannot fully enumerate against every other command's regex; left
 * unchanged and flagged for review.
 */
function consumeIfClauses(ctx: ParseContext, startIdx: number, ifInnerStops: StopKeywords): IfClauses | ParseRefusal {
  let cursor = startIdx;
  const elseIfBranches: ActivityElseIf[] = [];
  let elseBranch: ActivityNode[] = [];
  let elseLabel: string | undefined;

  while (cursor < ctx.lines.length) {
    const step = classifyClauseLine(ctx, cursor, ifInnerStops);
    if (isRefusal(step)) return step;
    cursor = step.cursor;
    if (step.kind === 'endif') break;
    if (step.kind === 'elseif') {
      elseIfBranches.push(step.branch);
      continue;
    }
    if (step.kind === 'else') {
      elseBranch = step.branch;
      elseLabel = step.label;
      break;
    }
    // 'unexpected' -- see this function's doc comment above.
  }

  return { cursor, elseIfBranches, elseBranch, elseLabel };
}

interface IfHeader {
  condition: string;
  thenLabel: string | undefined;
}

/**
 * Tries the three `if`-opener spellings in upstream's registration order
 * (`ActivityDiagramFactory3.java:118-121`): `CommandIf4`'s `is`/`equals`
 * form, `CommandIf2`'s `then (label)?` form (now with an optional trailing
 * stereogroup, mission ubrr-T10 M4a), then `CommandIfLegacy1`'s `then when
 * LABEL` form (M4c). All three hand their label to the SAME
 * `diagram.startIf(test, when, ...)` call upstream-side, so they collapse
 * onto the one `thenLabel` field here.
 */
function matchIfHeader(line: string): IfHeader | null {
  const if4 = RE_IF4.exec(line);
  if (if4 !== null) return { condition: unescapeLabelNewlines(if4[1]!.trim()), thenLabel: unescapeLabel(if4[2]?.trim()) };
  const if2 = RE_IF.exec(line);
  if (if2 !== null) return { condition: unescapeLabelNewlines(if2[1]!.trim()), thenLabel: unescapeLabel(if2[2]?.trim()) };
  const legacy = RE_IF_LEGACY.exec(line);
  if (legacy !== null) {
    return { condition: unescapeLabelNewlines(legacy[1]!.trim()), thenLabel: unescapeLabel(legacy[2]!.trim()) };
  }
  return null;
}

interface LeadingNoteSplit {
  readonly body: ActivityNode[];
  readonly note?: ActivityNote;
}

/** `InstructionIf#addNote`'s `current.isEmpty()` arm
 *  (`InstructionIf.java:222-227`): a note as the FIRST node of a
 *  then/elseif/else branch belongs to the IF ITSELF, not the branch's own
 *  flow content -- extracted here, before `tileNodes` ever sees the
 *  branch body. The complementary TRAILING capture (`endifCalled`)
 *  happens at `pushParsedNode` (`list-backward-dispatch.ts`), well after
 *  {@link extractIfOwnNotes} returns. */
function extractLeadingNote(body: ActivityNode[]): LeadingNoteSplit {
  const first = body[0];
  if (first === undefined || first.kind !== 'note') return { body };
  return { body: body.slice(1), note: first };
}

interface IfNotesExtraction {
  readonly thenBranch: ActivityNode[];
  readonly elseIfBranches: ActivityElseIf[];
  readonly elseBranch: ActivityNode[];
  readonly notes: ActivityNote[];
}

/** `WithNote#addNote`'s own insertion order (`WithNote.java:56-59`):
 *  then-branch's leading note first, each `elseif` branch's own in
 *  clause order, else-branch's last -- the if's own `notes` array,
 *  stripped out of each branch body. `activity-divergence-drive-3` T2a,
 *  family IFNOTE. */
function extractIfOwnNotes(
  thenBranch: ActivityNode[],
  elseIfBranches: ActivityElseIf[],
  elseBranch: ActivityNode[],
): IfNotesExtraction {
  const notes: ActivityNote[] = [];
  const then = extractLeadingNote(thenBranch);
  if (then.note !== undefined) notes.push(then.note);
  const elseIfs = elseIfBranches.map((branch) => {
    const split = extractLeadingNote(branch.body);
    if (split.note !== undefined) notes.push(split.note);
    return split.note === undefined ? branch : { ...branch, body: split.body };
  });
  const elseSplit = extractLeadingNote(elseBranch);
  if (elseSplit.note !== undefined) notes.push(elseSplit.note);
  return { thenBranch: then.body, elseIfBranches: elseIfs, elseBranch: elseSplit.body, notes };
}

/**
 * Captures the `if`'s swimlane at its opener, not its closer.
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:309
 *   -- `new InstructionIf(swimlanes.getCurrentSwimlane(), ...)`, taken
 *   when the `if` line itself is parsed, before the then-branch.
 */
export function tryIf(ctx: ParseContext, idx: number, line: string): DispatchResult | ParseRefusal | null {
  const header = matchIfHeader(line);
  if (header === null) return null;
  const { condition, thenLabel } = header;

  // Mission `activity-lane-capture` D1/T3: read BEFORE the then-branch
  // parses, so a lane switch inside the body never leaks into this node's
  // own `swimlane`.
  const openerSwimlane = swimlaneSpread(ctx);

  // then-branch stops at elseif, else, endif
  // `RE_ENDIF` (not the literal `'endif'`) so the then-branch body scan
  // also stops at a zero-or-more-space `end if` closer (mission add2-T2e,
  // D6: `zinelo-77-losu727`'s nested `end if` refused against the
  // literal-string-only stop before this). `RE_ELSEIF_STOP` (not the
  // literal `'elseif'`) so the scan also stops at a leading-`(incoming)`-
  // decorated `elseif` (`dulate-94-bupu593`/`nolubo-93-rula384`): the
  // literal-prefix stop never matched `(additional text) elseif (...)`,
  // so the line fell through to the generic body dispatch instead of
  // reaching {@link classifyClauseLine}'s own `RE_ELSEIF` match, and
  // refused there (no body handler recognizes a bare `(label) elseif`
  // line).
  const IF_INNER_STOPS: StopKeywords = [RE_ELSEIF_STOP, 'else', RE_ENDIF];
  const thenResult = parseNodes(ctx, idx + 1, IF_INNER_STOPS);
  if (isRefusal(thenResult)) return thenResult;
  const thenBranch = thenResult.nodes;

  const clauses = consumeIfClauses(ctx, thenResult.nextIdx, IF_INNER_STOPS);
  if (isRefusal(clauses)) return clauses;
  const { cursor, elseIfBranches, elseBranch, elseLabel } = clauses;
  const extracted = extractIfOwnNotes(thenBranch, elseIfBranches, elseBranch);

  // Always push exactly one if node per `if (...)` opener
  const ifNode: ActivityIf = {
    kind: 'if',
    condition,
    ...(thenLabel !== undefined && thenLabel !== '' ? { thenLabel } : {}),
    ...(elseLabel !== undefined && elseLabel !== '' ? { elseLabel } : {}),
    thenBranch: extracted.thenBranch,
    elseBranch: extracted.elseBranch,
    elseIfBranches: extracted.elseIfBranches,
    ...openerSwimlane,
    ...(extracted.notes.length > 0 ? { notes: extracted.notes } : {}),
  };
  return { idx: cursor, node: ifNode };
}
