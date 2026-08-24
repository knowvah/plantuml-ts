/**
 * Block extractor: types a block's PREPROCESSED content, from the @start<type>
 * keyword suffix or -- for plain @startuml -- by probing the first 20 non-empty
 * content lines.
 *
 * The SPLIT itself does not live here: it runs on RAW lines, before TIM, in
 * `BlockUmlBuilder.ts` (upstream's `BlockUmlBuilder`), which calls
 * {@link finalizeBlock} once the interpreter has run over the block's interior.
 * `extractBlocks` below is the split+type convenience over both, for the tests
 * and scripts that hand it lines directly.
 */

import { stripSpriteRegions } from './descriptive-keywords.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiagramType =
  | 'sequence'
  | 'class'
  | 'state'
  | 'description'
  | 'activity'
  | 'object'
  | 'timing'
  | 'mindmap'
  | 'gantt'
  | 'wbs'
  | 'json'
  | 'yaml'
  | 'hcl'
  | 'board'
  | 'chronology'
  | 'files'
  | 'packetdiag'
  | 'chart'
  | 'dot'
  | 'unknown';

export interface UmlSource {
  readonly lines: readonly string[];
  readonly type: DiagramType;
  /** Raw style-block strings extracted by the preprocessor (pre-parsed). */
  readonly rawStyles?: readonly string[];
  /**
   * G2 N9: parallel to {@link lines} -- see `preprocessor.ts
   * #PreprocessorResult.linePositions`'s doc comment. Absent for a
   * hand-built literal fixture (many unit tests construct `UmlSource`
   * directly); a diagram parser reading it must treat a missing entry
   * the same as an `undefined` position (no `codeLine` to emit).
   */
  readonly linePositions?: readonly (number | undefined)[];
  /**
   * G2 N39: parallel to {@link rawStyles} -- see `preprocessor.ts
   * #PreprocessorResult.stylePositions`'s doc comment. Absent for a
   * hand-built literal fixture, same fallback contract as
   * {@link linePositions}.
   */
  readonly stylePositions?: readonly (number | undefined)[];
  /**
   * The block's RAW source lines, `@start`/`@end` and every directive
   * (`skin`, `!define`, `skinparam`, ...) included -- upstream's
   * `BlockUml#rawSource`, the exact list `UmlSource.seed()` hashes
   * (`svg-graphics-core.ts#seedOf`). {@link lines} is the DIRECTIVE-STRIPPED
   * interior, so seeding over it omits directive lines and diverges from the
   * jar's seed for any diagram carrying one (surfacing as a mismatched
   * shadow/gradient/uid id). Populated by `index.ts#umlSourceOfBlock`; absent
   * for a hand-built literal fixture (the seed falls back to the wrapped
   * {@link lines}, unchanged for the directive-free diagrams those fixtures
   * always are).
   */
  readonly rawSourceLines?: readonly string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_DETECTION_WINDOW = 20;

/**
 * Keyword-suffix types: @start<suffix> maps directly to a DiagramType.
 * Note: 'uml' is handled separately (needs content probing).
 */
const START_SUFFIX_MAP: Readonly<Record<string, DiagramType>> = {
  mindmap: 'mindmap',
  gantt: 'gantt',
  wbs: 'wbs',
  sequence: 'sequence',
  class: 'class',
  // @startcomponent / @startusecase route to the consolidated description engine.
  component: 'description',
  state: 'state',
  usecase: 'description',
  activity: 'activity',
  object: 'object',
  timing: 'timing',
  json: 'json',
  yaml: 'yaml',
  hcl: 'hcl',
  board: 'board',
  chronology: 'chronology',
  files: 'files',
  packetdiag: 'packetdiag',
  chart: 'chart',
  dot: 'dot',
};

// Matches @startuml, @startmindmap, @startgantt, etc. (case-insensitive).
// A trailing token after the keyword is tolerated — @startuml may carry a
// diagram name/title, and corpus fixtures sometimes leave junk after @enduml
// (e.g. `@enduml */`); upstream's line reader terminates on the keyword alone.
const RE_START = /^@start(\w+)(?:\s.*)?$/i;
// Matches @enduml, @endmindmap, @endgantt, etc. (case-insensitive)
const RE_END = /^@end(\w+)(?:\s.*)?$/i;

// ---------------------------------------------------------------------------
// Content-based type probing for @startuml blocks
// ---------------------------------------------------------------------------

const SEQUENCE_ACTOR_KEYWORDS = new Set([
  'participant',
  'actor',
  'boundary',
  'control',
  'entity',
  'database',
  'collections',
  'queue',
]);

/**
 * T5 mechanism 2 (widening, D3 exception 1, `plans/routing-heuristic-repair/
 * decisions.md#d3`): first-word keywords owned by `CommandActivate`
 * (`~/git/plantuml/.../sequencediagram/command/CommandActivate.java:62`,
 * `TYPE` group `(activate|deactivate|destroy|create)`). Bounded to the two
 * forms the mission's fixtures actually exercise (`fonatu-29-texo854`:
 * `activate C`; `todozi-34-jire490`: `activate A` / `deactivate A`) rather
 * than the full TYPE alternative -- `destroy`/`create` have no fixture
 * evidence and widening past what closes the nine is a stop condition.
 */
const SEQUENCE_ACTIVATION_KEYWORDS = new Set(['activate', 'deactivate']);

/**
 * T5 mechanism 2: `note over ...` -- `FactorySequenceNoteCommand.java:83,100`,
 * the `POSITION` alternative `(right|left|over)` narrowed to `over` only.
 * Unlike `right`/`left` (shared by every other diagram family's own note
 * command -- `note left of X` is legal in state/class/activity diagrams
 * too), `over` positioning does not exist outside
 * `net/sourceforge/plantuml/command/note/sequence/` -- grepped, no other
 * `command/note/` package defines it -- so it is a genuine sequence-only
 * signal and safe to widen on (D3).
 */
const RE_NOTE_OVER = /^(?:note|hnote|rnote)\s+over\b/iu;

/**
 * T5 mechanism 2: left-pointing arrow dressing -- `CommandArrow.java:99-101`,
 * `ARROW_DRESSING1`'s `(?:[%s][ox]|\(\d+\))?<<?_?` alternative, the reversed
 * form of the `->`/`-->` dressing already probed below. Matches `<-`, `<--`,
 * `<<--` (and `<<-`) -- the exact left-arrow tokens `zicadi-21-koje636`
 * (`Test <<-- Test : …`) uses. Same command class as the right-pointing
 * probe, just the mirrored dressing.
 */
const RE_LEFT_ARROW = /<<?-/u;

/**
 * Collect the first N non-empty trimmed lines for detection probes.
 * This is called once and shared across all probes.
 */
function firstNonEmptyLines(
  lines: readonly string[],
  n: number,
): readonly string[] {
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    result.push(trimmed);
    if (result.length >= n) break;
  }
  return result;
}

function probeState(lines: readonly string[]): boolean {
  // [*] is unambiguous state-diagram syntax and must be checked before
  // sequence, since "[*] --> Idle" also contains "-->" which matches sequence.
  for (const line of lines) {
    if (/\[\*\]/u.test(line)) return true;
  }
  return false;
}

function probeSequence(lines: readonly string[]): boolean {
  for (const line of lines) {
    // Arrow patterns: ->, ->>, -->, -->>
    if (/->|-->/u.test(line)) return true;

    // Left-pointing arrow patterns: <-, <--, <<-- (T5 mechanism 2, see
    // RE_LEFT_ARROW above for the CommandArrow.java citation).
    if (RE_LEFT_ARROW.test(line)) return true;

    // `note over ...` (T5 mechanism 2, see RE_NOTE_OVER above for the
    // FactorySequenceNoteCommand.java citation).
    if (RE_NOTE_OVER.test(line)) return true;

    // Keyword-starts
    const firstWord = line.split(/\s+/u)[0]?.toLowerCase() ?? '';
    if (
      SEQUENCE_ACTOR_KEYWORDS.has(firstWord) ||
      SEQUENCE_ACTIVATION_KEYWORDS.has(firstWord)
    )
      return true;
  }
  return false;
}

function probeClass(lines: readonly string[]): boolean {
  for (const line of lines) {
    if (
      /^class\s/u.test(line) ||
      /^abstract\s+class\s/u.test(line) ||
      /^interface\s/u.test(line) ||
      /^enum\s/u.test(line)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Upstream's fallback for a `@startuml` whose content no probe claims.
 *
 * `DiagramType.findStartTypes("@startuml")` returns EVERY legacy-UML type, and
 * `PSystemBuilder#createPSystem` then tries the matching factories IN
 * REGISTRATION ORDER, keeping the first that does not error: Sequence, then
 * Class, then Activity, Description, State... Sequence is first, but a sequence
 * diagram with no participants is `isIncomplete()`, and
 * `PSystemCommandFactory#finalizeDiagram` returns null for an incomplete
 * diagram -- so the next factory, ClassDiagramFactory, takes it. `@startuml`
 * + `title X` renders as `data-diagram-type="CLASS"` in the jar for exactly
 * that reason (live-oracle verified).
 *
 * @see ~/git/plantuml/.../PSystemBuilder.java#createPSystem
 * @see ~/git/plantuml/.../command/PSystemCommandFactory.java#finalizeDiagram
 */
const UML_FALLBACK_TYPE: DiagramType = 'class';

/**
 * T5 mechanism 1: a `sprite $name { ... }` / `sprite name <svg ...` multiline
 * region -- whether authored directly or landed by `!include` expansion
 * (both are indistinguishable by the time this runs: preprocessing has
 * already spliced the include's interior in) -- is stripped before the
 * window is taken, so its body never crowds out the real diagram content.
 * Same fix `stripSpriteRegions` already applies for `descriptive-keywords.ts`'s
 * own SCAN_LINE_LIMIT (vivido-49-nisu863) -- this is the identical mechanism
 * hitting a second window.
 *
 * Deliberately still windowed over the PREPROCESSED lines (not raw): the
 * class doc comment on `finalizeBlock` records that choice, and stripping a
 * *specific, upstream-defined* non-content region is not the same as
 * abandoning the preprocessed-lines contract -- it only removes content
 * that upstream itself never types on (`BlockUml#data` carries the sprite
 * body, but no factory's `accepts()`/parse ever inspects it for typing).
 */
function detectUmlType(lines: readonly string[]): DiagramType {
  const scanLines = stripSpriteRegions(lines);
  const window = firstNonEmptyLines(scanLines, TYPE_DETECTION_WINDOW);
  // State must be probed before sequence: "[*] -->" contains "-->" which
  // would otherwise match the sequence arrow pattern.
  if (probeState(window)) return 'state';
  if (probeSequence(window)) return 'sequence';
  if (probeClass(window)) return 'class';
  return UML_FALLBACK_TYPE;
}

// ---------------------------------------------------------------------------
// Trim leading/trailing blank lines from an array
// ---------------------------------------------------------------------------

function isBlankLine(line: string | undefined): boolean {
  return (line?.trim() ?? '') === '';
}

function trimBlankLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length - 1;
  while (start <= end && isBlankLine(lines[start])) start++;
  while (end >= start && isBlankLine(lines[end])) end--;
  return lines.slice(start, end + 1);
}

/** Same leading/trailing-blank-line bounds as {@link trimBlankLines},
 *  applied to a parallel positions array so `UmlSource.linePositions`
 *  stays index-aligned with `UmlSource.lines`. */
function trimBlankLinePositions(
  lines: readonly string[],
  positions: readonly (number | undefined)[],
): (number | undefined)[] {
  let start = 0;
  let end = lines.length - 1;
  while (start <= end && isBlankLine(lines[start])) start++;
  while (end >= start && isBlankLine(lines[end])) end--;
  return positions.slice(start, end + 1);
}

/**
 * Type a completed block's content into a `UmlSource`.
 *
 * `contentLines` are the block's interior AFTER the preprocessor has run over
 * it (upstream: `BlockUml#data`, what `PSystemBuilder` types) -- never the raw
 * lines: a macro-generated body would otherwise be typed on its unexpanded
 * source.
 */
export function finalizeBlock(
  suffix: string,
  contentLines: readonly string[],
  contentPositions?: readonly (number | undefined)[],
): UmlSource {
  const trimmed = trimBlankLines([...contentLines]);
  const type: DiagramType =
    suffix === 'uml'
      ? detectUmlType(trimmed)
      : (START_SUFFIX_MAP[suffix] ?? 'unknown');
  if (contentPositions === undefined) return { lines: trimmed, type };
  return { lines: trimmed, type, linePositions: trimBlankLinePositions(contentLines, contentPositions) };
}

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------

/**
 * Splits preprocessed source lines into UmlSource blocks.
 * Each block corresponds to one @start…@end pair.
 */
export function extractBlocks(processedLines: readonly string[]): UmlSource[] {
  const blocks: UmlSource[] = [];
  let inside = false;
  let currentSuffix = '';
  let contentLines: string[] = [];

  for (const rawLine of processedLines) {
    const line = rawLine;

    if (!inside) {
      const startMatch = RE_START.exec(line);
      if (startMatch?.[1] !== undefined) {
        inside = true;
        currentSuffix = startMatch[1].toLowerCase();
        contentLines = [];
      }
      // Lines before @start are ignored
      continue;
    }

    // We are inside a block
    const endMatch = RE_END.exec(line);
    if (endMatch?.[1] !== undefined) {
      // End of block
      inside = false;
      blocks.push(finalizeBlock(currentSuffix, contentLines));
      contentLines = [];
      currentSuffix = '';
      continue;
    }

    contentLines.push(line);
  }

  // Unclosed block is silently discarded (no @end found)
  return blocks;
}
