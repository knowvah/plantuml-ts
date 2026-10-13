import { matchAnnotationCommand } from '../../core/annotations/index.js';
import { isAssumeTransparent } from '../../core/assume-transparent.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { refuse } from '../../core/parse-refusal.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import { matchScaleCommand } from '../../core/scale-command.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { matchSpriteCommand } from '../../core/sprite-commands.js';
import { createSpriteRegistry } from '../../core/sprite-registry.js';
import {
  createMindmapSkinParam,
  executeDeclaration,
  positionedDeclarationsOf,
  type PositionedDeclaration,
  type SkinParam as StyleSkinParam,
} from '../../core/style/mindmap-style-builder.js';
import { StyleParsingException } from '../../core/style/parser/StyleParser.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { Warning } from '../../core/warning/Warning.js';
import {
  applyWbsItemMultilineNew,
  collectWbsMultilineBlock,
  WBS_MULTILINE_NEW_START_RE,
} from './CommandWBSItemMultilineNew.js';
import { applyWbsItemMultilineOld, WBS_MULTILINE_OLD_START_RE } from './CommandWBSItemMultilineOld.js';
import { applyWbsItemNew, WBS_ITEM_NEW_RE_0, WBS_ITEM_NEW_RE_1 } from './CommandWBSItemNew.js';
import { applyWbsItemOld, WBS_ITEM_OLD_RE_0, WBS_ITEM_OLD_RE_1 } from './CommandWBSItemOld.js';
import { applyWbsLink, WBS_LINK_RE } from './CommandWBSLink.js';
import { WBSDiagram } from './WBSDiagram.js';
import { SkinParam } from './wbs-skin-param.js';

/** `@startwbs`/`@endwbs` — tolerated defensively in a hand-built source
 *  (the mindmap factory's `START_END_RE` precedent). */
const START_END_RE = /^@(start|end)wbs\s*$/i;

/** The `new Warning(…)` texts `CommandSkinParam#executeArg` adds, keyed by
 *  the lower-cased skin parameter name.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParam.java:92-99 */
const SKINPARAM_WARNINGS: ReadonlyMap<string, string> = new Map([
  ['handwritten', "Please use '!option handwritten true' to enable handwritten "],
  ['participantpadding', 'Please use CSS style instead of skinparam ParticipantPadding'],
  ['padding', 'Please use CSS style instead of skinparam padding'],
]);

/** The standard error text of a line no command matches. */
const SYNTAX_ERROR = 'Syntax Error?';

interface DispatchOutcome {
  readonly result: CommandExecutionResult;
  readonly nextIndex: number;
}

/** One single-line command: its pattern, whether it runs on the trimmed
 *  line (`SingleLineCommand2`'s `doTrim`), and its executor. */
interface SingleLineCommand {
  readonly re: RegExp;
  readonly trim: boolean;
  readonly apply: (diagram: WBSDiagram, match: RegExpExecArray) => CommandExecutionResult;
}

/** @see WBSDiagramFactory.java:9-14 (registration order; CommandWBSItemNew/Old pass `doTrim=false`, CommandWBSLink.java:58 trims) */
const ITEM_NEW_1: SingleLineCommand = {
  re: WBS_ITEM_NEW_RE_1,
  trim: false,
  apply: (d, m) => applyWbsItemNew(d, m, 1),
};
const ITEM_NEW_0: SingleLineCommand = {
  re: WBS_ITEM_NEW_RE_0,
  trim: false,
  apply: (d, m) => applyWbsItemNew(d, m, 0),
};
const ITEM_OLD_1: SingleLineCommand = {
  re: WBS_ITEM_OLD_RE_1,
  trim: false,
  apply: (d, m) => applyWbsItemOld(d, m, 1),
};
const ITEM_OLD_0: SingleLineCommand = {
  re: WBS_ITEM_OLD_RE_0,
  trim: false,
  apply: (d, m) => applyWbsItemOld(d, m, 0),
};
const LINK: SingleLineCommand = { re: WBS_LINK_RE, trim: true, apply: applyWbsLink };

/** Commands before the first multiline command. @see WBSDiagramFactory.java:9-11 */
const COMMANDS_BEFORE_MULTILINE_NEW: readonly SingleLineCommand[] = [ITEM_NEW_1, ITEM_NEW_0];
/** Commands between the two multiline commands. @see WBSDiagramFactory.java:12-14 */
const COMMANDS_BETWEEN_MULTILINES: readonly SingleLineCommand[] = [ITEM_OLD_1, ITEM_OLD_0];

function trySingle(
  diagram: WBSDiagram,
  commands: readonly SingleLineCommand[],
  raw: string,
  i: number,
): DispatchOutcome | null {
  for (const command of commands) {
    const match = command.re.exec(command.trim ? raw.trim() : raw);
    if (match !== null) return { result: command.apply(diagram, match), nextIndex: i + 1 };
  }
  return null;
}

/**
 * A multiline command: the start pattern runs on the TRIMMED first line;
 * a block with no terminator is no match, so the dispatcher moves on.
 * @see CommandMultilines2.java:79-111
 */
function tryMultiline(
  diagram: WBSDiagram,
  start: RegExp,
  apply: typeof applyWbsItemMultilineNew,
  lines: readonly string[],
  i: number,
): DispatchOutcome | null {
  if (!start.test(lines[i]!.trim())) return null;
  const block = collectWbsMultilineBlock(lines, i);
  if (block === undefined) return null;
  return { result: apply(diagram, block), nextIndex: block.endIndex + 1 };
}

/**
 * The wbs commands in `initCommandsList` order, first match wins.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WBSDiagramFactory.java:9-15
 */
function dispatchWbsLine(diagram: WBSDiagram, lines: readonly string[], i: number): DispatchOutcome | null {
  const raw = lines[i]!;
  return (
    trySingle(diagram, COMMANDS_BEFORE_MULTILINE_NEW, raw, i) ??
    tryMultiline(diagram, WBS_MULTILINE_NEW_START_RE, applyWbsItemMultilineNew, lines, i) ??
    trySingle(diagram, COMMANDS_BETWEEN_MULTILINES, raw, i) ??
    tryMultiline(diagram, WBS_MULTILINE_OLD_START_RE, applyWbsItemMultilineOld, lines, i) ??
    trySingle(diagram, [LINK], raw, i)
  );
}

/**
 * `CommonCommands.addCommonCommands1`, registered BEFORE the wbs commands
 * (WBSDiagramFactory.java:8). `skinparam`, `<style>`, `skin` and `!pragma`
 * never reach here: the preprocessor collected them. Returns the lines
 * consumed, or `null` when none of them matches line `i`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommonCommands.java:56-61
 */
function dispatchCommonCommand(diagram: WBSDiagram, lines: readonly string[], i: number): number | null {
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
 * The `skinparam`/`<style>` commands the preprocessor pulled out of the
 * source, still to be dispatched: upstream executes each where it occurs,
 * muting the diagram's style builder (SkinParam.java:164-167) — so every
 * node captures the builder current at its own line.
 */
interface StyleDispatch {
  readonly style: StyleSkinParam;
  readonly skinparam: ReadonlyMap<string, string>;
  /** Source order; the head is the next to execute. */
  readonly pending: PositionedDeclaration[];
}

function createStyleDispatch(source: UmlSource): StyleDispatch {
  const styleSource = source.styleSource ?? EMPTY_STYLE_SOURCE;
  return {
    style: createMindmapSkinParam(styleSource),
    skinparam: styleSource.skinparam,
    pending: positionedDeclarationsOf(styleSource, source.stylePositions ?? []),
  };
}

/**
 * Executes every pending declaration placed before document line
 * `position`. A rejected `<style>` block is `CommandStyleMultilinesCSS`'s
 * command error (java:92-93), reported at line 0 (the preprocessor keeps no
 * line for it).
 */
function executeDeclarationsBefore(dispatch: StyleDispatch, position: number): ParseRefusal | null {
  while (dispatch.pending.length > 0 && dispatch.pending[0]!.position < position) {
    const declaration = dispatch.pending.shift()!;
    try {
      executeDeclaration(dispatch.style, declaration, dispatch.skinparam);
    } catch (e) {
      if (!(e instanceof StyleParsingException)) throw e;
      return refuse('execution', 0, 0, `Error in style definition: ${e.message}`);
    }
  }
  return null;
}

/** Line `i`'s document position; a hand-built source reads as every declaration before its first line. */
function positionOf(source: UmlSource, i: number): number {
  if (source.linePositions === undefined) return Number.POSITIVE_INFINITY;
  return source.linePositions[i] ?? -1;
}

/** The DOCUMENT-relative line a refusal at interior index `i` names (see `MindMapDiagramFactory.ts#refusalLineOf`). */
function refusalLineOf(source: UmlSource, i: number): number {
  return source.linePositions?.[i] ?? i;
}

/**
 * `CommandSkinParam#executeArg`'s deprecation warnings, one per collected
 * `skinparam`, in source order.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParam.java:88-99
 */
function addSkinParamWarnings(diagram: WBSDiagram, skinparam: ReadonlyMap<string, string>): void {
  for (const name of skinparam.keys()) {
    const message = SKINPARAM_WARNINGS.get(name.toLowerCase());
    if (message !== undefined) diagram.addWarning(new Warning(message));
  }
}

/** `PSystemCommandFactory#createSystem`'s loop over the source lines. */
function executeCommands(diagram: WBSDiagram, source: UmlSource, dispatch: StyleDispatch): ParseRefusal | null {
  const lines = source.lines;
  let i = 0;

  while (i < lines.length) {
    const styleRefusal = executeDeclarationsBefore(dispatch, positionOf(source, i));
    if (styleRefusal !== null) return styleRefusal;
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

    const outcome = dispatchWbsLine(diagram, lines, i);
    if (outcome === null) return refuse('syntax', refusalLineOf(source, i), i, SYNTAX_ERROR);
    if (outcome.result.isOk() === false) {
      return refuse('execution', refusalLineOf(source, i), i, outcome.result.getError(), outcome.result.getScore());
    }
    i = outcome.nextIndex;
  }
  return null;
}

/**
 * `WBSDiagramFactory` — the top-level parse entry point for one `@startwbs`
 * block. `createEmptyDiagram` (`new WBSDiagram(source, preprocessing)`) with
 * the skin param built here (D4), then `PSystemCommandFactory#createSystem`'s
 * per-line dispatch: the common commands, then the wbs commands.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/wbs/WBSDiagramFactory.java:6-25
 */
export function parseWbs(source: UmlSource, preprocessing: PreprocessingArtifact): WBSDiagram | ParseRefusal {
  const dispatch = createStyleDispatch(source);
  const skinParam = new SkinParam({
    style: dispatch.style,
    skinparam: dispatch.skinparam,
    sprites: createSpriteRegistry(),
    pragma: Pragma.createEmpty(),
  });
  const diagram = new WBSDiagram(source, preprocessing, skinParam);
  addSkinParamWarnings(diagram, dispatch.skinparam);
  const refusal = executeCommands(diagram, source, dispatch);
  if (refusal !== null) return refusal;
  // Declarations after the last command still mute the builder the render reads.
  return executeDeclarationsBefore(dispatch, Number.POSITIVE_INFINITY) ?? diagram;
}
