import { matchAnnotationCommand } from '../../core/annotations/index.js';
import { isAssumeTransparent } from '../../core/assume-transparent.js';
import type { UmlSource } from '../../core/block-extractor.js';
import { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { Rankdir } from '../../core/klimt/geom/Rankdir.js';
import { refuse } from '../../core/parse-refusal.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import { matchScaleCommand } from '../../core/scale-command.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { matchSpriteCommand } from '../../core/sprite-commands.js';
import { createSpriteRegistry } from '../../core/sprite-registry.js';
import { buildMindmapStyleBuilder } from '../../core/style/mindmap-style-builder.js';
import { StyleParsingException } from '../../core/style/parser/StyleParser.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { applyMindMapDirection, MINDMAP_DIRECTION_RE } from './CommandMindMapDirection.js';
import {
  applyMindMapOrgmodeMultiline,
  collectOrgmodeMultilineBlock,
  ORGMODE_MULTILINE_START_RE,
} from './CommandMindMapOrgmodeMultiline.js';
import { applyMindMapOrgmode, ORGMODE_RE } from './CommandMindMapOrgmode.js';
import { applyMindMapPlus, PLUS_RE } from './CommandMindMapPlus.js';
import { applyMindMapRoot, ROOT_RE } from './CommandMindMapRoot.js';
import { MindMapDiagram } from './MindMapDiagram.js';
import { SkinParam } from './mindmap-skin-param.js';

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
 * here, inline, for the same reason. Sets the diagram skin param's rankdir
 * (`((SkinParam) diagram.getSkinParam()).setRankdir(...)`).
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
  const rankdir = match[1]!.toLowerCase().startsWith('left') ? Rankdir.LEFT_TO_RIGHT : Rankdir.TOP_TO_BOTTOM;
  diagram.getSkinParam().setRankdir(rankdir);
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
 * `CommonCommands.addCommonCommands1` (java:56-61), registered BEFORE the
 * mindmap commands (MindMapDiagramFactory.java:57): the title commands
 * (title/mainframe/caption/legend/footer/header), `!assume transparent` and
 * the sprite definitions of `addCommonCommands2`, then `addCommonScaleCommands`. `skinparam`,
 * `<style>`, `skin` and `!pragma` never reach here: the preprocessor
 * collected them (see `buildSkinParam`). Returns the lines consumed, or
 * `null` when none of them matches line `i`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommonCommands.java:56-61
 */
function dispatchCommonCommand(diagram: MindMapDiagram, lines: readonly string[], i: number): number | null {
  const annotation = matchAnnotationCommand(lines, i, diagram.annotations);
  if (annotation !== null) return annotation.consumed;

  // `CommandAssumeTransparent#executeArg` is a no-op (CommandAssumeTransparent.java:75-81).
  if (isAssumeTransparent(lines[i]!)) return 1;

  const sprite = matchSpriteCommand(lines, i, diagram.sprites);
  if (sprite !== null) return sprite.consumed;

  const scale = matchScaleCommand(lines[i]!.trim());
  if (scale === undefined) return null;
  diagram.scale = scale;
  return 1;
}

/** A hand-built source's style sources: no skin, no skinparam, no style. */
const EMPTY_STYLE_SOURCE: NonNullable<UmlSource['styleSource']> = {
  skinparam: new Map<string, string>(),
  styles: [],
};

/**
 * The diagram's `SkinParam`: upstream's `TitledDiagram` constructor builds
 * one and every `skinparam`/`<style>` command then mutes its style builder
 * in source order (decision D2, `buildMindmapStyleBuilder`). A `<style>`
 * block the parser rejects is `CommandStyleMultilinesCSS`'s command error
 * ("Error in style definition: …", java:92-93); the preprocessor keeps no
 * line for it, so the refusal is reported at line 0.
 */
function buildSkinParam(source: UmlSource): SkinParam | ParseRefusal {
  const styleSource = source.styleSource ?? EMPTY_STYLE_SOURCE;
  let styleBuilder: StyleBuilder;
  try {
    styleBuilder = buildMindmapStyleBuilder(styleSource);
  } catch (e) {
    if (!(e instanceof StyleParsingException)) throw e;
    return refuse('execution', 0, 0, `Error in style definition: ${e.message}`);
  }
  return new SkinParam({
    styleBuilder,
    skinparam: styleSource.skinparam,
    sprites: createSpriteRegistry(),
    pragma: Pragma.createEmpty(),
  });
}

/**
 * `MindMapDiagramFactory` — the top-level parse entry point for one
 * `@startmindmap` block. Mirrors `MindMapDiagramFactory#createEmptyDiagram`
 * plus `PSystemCommandFactory#createSystem`'s per-line dispatch loop: the
 * common commands first ({@link dispatchCommonCommand}), then the mindmap
 * commands in `initCommandsList` order.
 *
 * `getSmartLevel`'s `UnsupportedOperationException` (D6) is NOT caught
 * here — it propagates out of this function as a plain `Error`, matching
 * upstream's own uncaught "crash path" (see
 * `MindMapDiagram.ts#getSmartLevel`'s doc comment and
 * `core/parse-refusal.ts`'s file header).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/MindMapDiagramFactory.java:50-74
 */
export function createMindMapDiagram(source: UmlSource): MindMapDiagram | ParseRefusal {
  const skinParam = buildSkinParam(source);
  if ('refused' in skinParam) return skinParam;
  const diagram = new MindMapDiagram(source, new PreprocessingArtifact(), skinParam);
  const lines = source.lines;
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i]!.trim();
    if (trimmed === '' || START_END_RE.test(trimmed)) {
      i++;
      continue;
    }

    const common = dispatchCommonCommand(diagram, lines, i);
    if (common !== null) {
      i += common;
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
