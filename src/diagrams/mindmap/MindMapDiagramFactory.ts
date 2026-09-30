import type { UmlSource } from '../../core/block-extractor.js';
import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { refuse } from '../../core/parse-refusal.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import { applyMindMapDirection, MINDMAP_DIRECTION_RE } from './CommandMindMapDirection.js';
import {
  applyMindMapOrgmodeMultiline,
  collectOrgmodeMultilineBlock,
  ORGMODE_MULTILINE_START_RE,
} from './CommandMindMapOrgmodeMultiline.js';
import { applyMindMapOrgmode, ORGMODE_RE } from './CommandMindMapOrgmode.js';
import { applyMindMapPlus, PLUS_RE } from './CommandMindMapPlus.js';
import { applyMindMapRoot, ROOT_RE } from './CommandMindMapRoot.js';
import type { AtomOps } from '../../core/klimt/creole/Sea.js';
import type { MindMapSkinParam } from './MindMap.js';
import { MindMapDiagram } from './MindMapDiagram.js';

export interface MindMapDiagramOptions {
  readonly skinParam?: MindMapSkinParam;
  /** ADR-9's creole capability for the drawing (`MindMap`/`FingerImpl`). */
  readonly atomOps?: AtomOps;
}

/** `@startmindmap`/`@endmindmap` — `UmlSource.lines` is documented as
 *  already directive-stripped for a render-pipeline-built source, but a
 *  hand-built test fixture may still include them; tolerated defensively,
 *  matching this port's other per-engine parsers (`board/parser.ts`). */
const START_END_RE = /^@(start|end)mindmap\s*$/i;

/**
 * `CommandRankDir` — `left to right direction` / `top to bottom direction`,
 * registered directly by `MindMapDiagramFactory.initCommandsList` (java:60)
 * rather than being mindmap-specific. No dedicated port file exists for it
 * (every other diagram type that reaches this directive re-implements the
 * same two-phrase match locally too, e.g.
 * `src/diagrams/description/command-table-directives.ts`); implemented
 * here, inline, for the same reason. Sets {@link MindMapDiagram}'s local
 * `rankdir` field — see that class's own doc comment for why this is not a
 * real `SkinParam.setRankdir` call.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandRankDir.java:56-65
 */
const RANKDIR_RE = /^(left\s+to\s+right|top\s+to\s+bottom)\s+direction\s*$/i;

interface DispatchOutcome {
  readonly result: CommandExecutionResult;
  readonly nextIndex: number;
}

/**
 * Tries each mindmap command's regex against the RAW (untrimmed) line, in
 * upstream's `initCommandsList` registration order (java:58-65): RankDir,
 * OrgmodeMultiline, Orgmode, Root, Plus, Direction. Untrimmed matters for
 * two of these — `ORGMODE_RE`'s leading `[ \t]*` feeds `getSmartLevel`'s
 * indentation reading, and `ORGMODE_MULTILINE_START_RE`'s lack of any
 * leading-whitespace allowance means an INDENTED `**:` line deliberately
 * falls through to `ORGMODE_RE` instead (matching upstream: neither
 * pattern tolerates leading whitespace before `[*#]+` the way `ORGMODE_RE`
 * alone does) — pre-trimming here would misroute that case.
 * Returns `null` when no command matches ("Syntax Error?") or an
 * unterminated multiline block reaches end of source.
 */
function dispatchMindMapLine(diagram: MindMapDiagram, lines: readonly string[], i: number): DispatchOutcome | null {
  const raw = lines[i]!;

  const rankdirMatch = RANKDIR_RE.exec(raw);
  if (rankdirMatch !== null) return { result: applyRankdir(diagram, rankdirMatch), nextIndex: i + 1 };

  const multilineStart = ORGMODE_MULTILINE_START_RE.exec(raw);
  if (multilineStart !== null) return dispatchOrgmodeMultiline(diagram, lines, i, multilineStart);

  const orgmodeMatch = ORGMODE_RE.exec(raw);
  if (orgmodeMatch !== null) return { result: applyMindMapOrgmode(diagram, orgmodeMatch), nextIndex: i + 1 };

  const rootMatch = ROOT_RE.exec(raw);
  if (rootMatch !== null) return { result: applyMindMapRoot(diagram, rootMatch), nextIndex: i + 1 };

  const plusMatch = PLUS_RE.exec(raw);
  if (plusMatch !== null) return { result: applyMindMapPlus(diagram, plusMatch), nextIndex: i + 1 };

  const directionMatch = MINDMAP_DIRECTION_RE.exec(raw);
  if (directionMatch !== null) return { result: applyMindMapDirection(diagram, directionMatch), nextIndex: i + 1 };

  return null;
}

/** @see CommandRankDir.java:76-79 */
function applyRankdir(diagram: MindMapDiagram, match: RegExpExecArray): CommandExecutionResult {
  diagram.setRankdir(match[1]!.toLowerCase().startsWith('left') ? 'LR' : 'TB');
  return CommandExecutionResult.ok();
}

function dispatchOrgmodeMultiline(
  diagram: MindMapDiagram,
  lines: readonly string[],
  i: number,
  startMatch: RegExpExecArray,
): DispatchOutcome | null {
  const block = collectOrgmodeMultilineBlock(lines, i, startMatch);
  if (block === undefined) return null;
  return { result: applyMindMapOrgmodeMultiline(diagram, startMatch, block), nextIndex: block.endIndex + 1 };
}

/**
 * `MindMapDiagramFactory` — the top-level parse entry point for one
 * `@startmindmap` block. Mirrors `MindMapDiagramFactory#createEmptyDiagram`
 * plus `PSystemCommandFactory#createSystem`'s per-line dispatch loop
 * (upstream's `CommonCommands.addCommonCommands1` chrome commands —
 * title/caption/legend/header/footer/scale/hide — are D5's chrome-wiring
 * batch, not this one; see `MindMapDiagram.ts`'s class doc).
 *
 * `getSmartLevel`'s `UnsupportedOperationException` (D6) is NOT caught
 * here — it propagates out of this function as a plain `Error`, matching
 * upstream's own uncaught "crash path" (see
 * `MindMapDiagram.ts#getSmartLevel`'s doc comment and
 * `core/parse-refusal.ts`'s file header).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMapDiagramFactory.java:50-74
 */
export function createMindMapDiagram(
  source: UmlSource,
  options?: MindMapDiagramOptions,
): MindMapDiagram | ParseRefusal {
  const diagram = new MindMapDiagram(options?.skinParam, options?.atomOps);
  const lines = source.lines;
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i]!.trim();
    if (trimmed === '' || START_END_RE.test(trimmed)) {
      i++;
      continue;
    }

    const outcome = dispatchMindMapLine(diagram, lines, i);
    if (outcome === null) return refuse('syntax', i, i, 'Syntax Error?');
    if (outcome.result.isOk() === false) {
      return refuse('execution', i, i, outcome.result.getError(), outcome.result.getScore());
    }
    i = outcome.nextIndex;
  }

  return diagram;
}
