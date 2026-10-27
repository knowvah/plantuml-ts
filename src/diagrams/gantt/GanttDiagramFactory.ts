import { createAnnotations, matchAnnotationCommand } from '../../core/annotations/index.js';
import type { DiagramAnnotations } from '../../core/annotations/index.js';
import { isAssumeTransparent } from '../../core/assume-transparent.js';
import type { UmlSource } from '../../core/block-extractor.js';
import { DEFAULT_CLOCK, type Clock } from '../../core/clock.js';
import { CommandControl } from '../../core/command/CommandControl.js';
import type { CommandExecutionResult } from '../../core/command/CommandExecutionResult.js';
import { ParserPass } from '../../core/command/ParserPass.js';
import { refuse } from '../../core/parse-refusal.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import { matchScaleCommand, type ScaleSpec } from '../../core/scale-command.js';
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
import { StyleParsingException, trin } from '../../core/style/parser/StyleParser.js';
import { StringLocated } from '../../core/tim/StringLocated.js';
import type { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { Warning } from '../../core/warning/Warning.js';
import { CommandColorTask } from './command/CommandColorTask.js';
import { CommandFootboxGantt } from './command/CommandFootboxGantt.js';
import { CommandGanttArrow } from './command/CommandGanttArrow.js';
import { CommandGanttArrow2 } from './command/CommandGanttArrow2.js';
import { CommandGroupEnd } from './command/CommandGroupEnd.js';
import { CommandGroupStart } from './command/CommandGroupStart.js';
import { CommandHideClosed } from './command/CommandHideClosed.js';
import { CommandHideResourceFootbox } from './command/CommandHideResourceFootbox.js';
import { CommandHideResourceName } from './command/CommandHideResourceName.js';
import { CommandHideShowColumns } from './command/CommandHideShowColumns.js';
import { CommandLabelOnColumn } from './command/CommandLabelOnColumn.js';
import { CommandLanguage } from './command/CommandLanguage.js';
import { CommandNoteBottom } from './command/CommandNoteBottom.js';
import { CommandPrintBetween } from './command/CommandPrintBetween.js';
import { CommandPrintScale } from './command/CommandPrintScale.js';
import { CommandSeparator } from './command/CommandSeparator.js';
import { CommandTaskCompleteDefault } from './command/CommandTaskCompleteDefault.js';
import { CommandWeekNumberStrategy } from './command/CommandWeekNumberStrategy.js';
import { NaturalGanttCommand } from './command/NaturalGanttCommand.js';
import { GanttDiagram } from './GanttDiagram.js';
import { SkinParam } from './gantt-skin-param.js';
import { SubjectDayAsDate } from './lang/SubjectDayAsDate.js';
import { SubjectDayOfWeek } from './lang/SubjectDayOfWeek.js';
import { SubjectDaysAsDates } from './lang/SubjectDaysAsDates.js';
import { SubjectGantt } from './lang/SubjectGantt.js';
import { SubjectResource } from './lang/SubjectResource.js';
import { SubjectSeparator } from './lang/SubjectSeparator.js';
import { SubjectTask } from './lang/SubjectTask.js';
import { SubjectToday } from './lang/SubjectToday.js';
import { SubjectWorkingHours } from './lang/SubjectWorkingHours.js';

/** `@startgantt`/`@endgantt` -- tolerated defensively in a hand-built source (the wbs factory's `START_END_RE`). */
const START_END_RE = /^@(start|end)gantt\s*$/i;

/** The standard error text of a line no command matches.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemCommandFactory.java:169-175 */
const SYNTAX_ERROR = 'Syntax Error?';

/** `CommandNope`: `^[%s]*$` over the trimmed line (`%s` = `\s `, Java `\s` being ASCII).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandNope.java:54-58 */
const NOPE = /^[ \t\n\x0B\f\r ]*$/;
/** `CommandRotate`: `executeArg` returns `ok()`. @see command/CommandRotate.java:54-71 */
const ROTATE = /^rotate$/i;
/** `CommandMinwidth`: `setMinwidth` is commented out. @see command/CommandMinwidth.java:54-77 */
const MINWIDTH = /^minwidth[ \t\n\x0B\f\r ]+(\d+)$/i;
/** `CommandPage`: `page NxM`, read only by the PNG splitter. @see command/CommandPage.java:54-95 */
const PAGE = /^page[ \t\n\x0B\f\r ]+(\d+)[ \t\n\x0B\f\r ]*x[ \t\n\x0B\f\r ]*(\d+)$/i;
/**
 * `CommandNamespaceSeparator` (registered by `addTitleCommands`, absent from `core/annotations`): `set
 * (separator|namespaceseparator) SEPARATOR` (the salt factory's copy, `PSystemSaltFactory.ts`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandNamespaceSeparator.java:60-80
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandLinkClass.java:92
 */
const NAMESPACE_SEPARATOR =
  /^set[ \t\n\x0B\f\r ]+(?:separator|namespaceseparator)[ \t\n\x0B\f\r ]+((?:none|null)|[\\]{2}|::|[^\p{L}\p{N} \t\n\x0B\f\r _$#\\{}<>"“”])$/iu;

/** The `new Warning(...)` texts `CommandSkinParam#executeArg` adds, keyed by the lower-cased skin parameter name.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParam.java:88-99 */
const SKINPARAM_WARNINGS: ReadonlyMap<string, string> = new Map([
  ['handwritten', "Please use '!option handwritten true' to enable handwritten "],
  ['participantpadding', 'Please use CSS style instead of skinparam ParticipantPadding'],
  ['padding', 'Please use CSS style instead of skinparam padding'],
]);

/**
 * What `parseGantt` hands the plugin: the diagram plus the two `TitledDiagram`/`UmlDiagram` members the common
 * commands fill (title/caption/legend/header/footer/mainframe, and `scale`) that `GanttDiagram` does not carry in
 * this port. `annotations` is the field `src/index.ts#annotationsOf` reads off an AST.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/UmlDiagram.java
 */
export interface ParsedGantt {
  readonly diagram: GanttDiagram;
  readonly annotations: DiagramAnnotations;
  scale: ScaleSpec | undefined;
}

interface DispatchOutcome {
  readonly result: CommandExecutionResult;
  readonly nextIndex: number;
}

/** One gantt command: `undefined` when it does not claim line `i`, else its outcome. */
type GanttCommandTry = (diagram: GanttDiagram, lines: readonly string[], i: number) => DispatchOutcome | undefined;

/** A `SingleLineCommand2` over a `{ regex, apply }` const; the regex runs on the trimmed line (`doTrim` true). */
function regexCommand(command: {
  readonly regex: RegExp;
  readonly apply: (diagram: GanttDiagram, match: RegExpExecArray) => CommandExecutionResult;
}): GanttCommandTry {
  return (diagram, lines, i) => {
    const match = command.regex.exec(trin(lines[i]!));
    if (match === null) return undefined;
    return { result: command.apply(diagram, match), nextIndex: i + 1 };
  };
}

/** A `NaturalGanttCommand`: `isValid` answers `OK`, then `execute` runs it. */
function naturalCommand(command: NaturalGanttCommand): GanttCommandTry {
  return (diagram, lines, i) => {
    const line = new StringLocated(lines[i]!, undefined);
    if (command.isValid(line) !== CommandControl.OK) return undefined;
    return { result: command.execute(diagram, line, ParserPass.ONE), nextIndex: i + 1 };
  };
}

/** A `UBrexSingleLineCommand2` subclass instance. */
function ubrexCommand(command: CommandHideShowColumns | CommandPrintBetween): GanttCommandTry {
  return (diagram, lines, i) => {
    const line = new StringLocated(lines[i]!, undefined);
    if (command.isValid(line) !== CommandControl.OK) return undefined;
    return { result: command.execute(diagram, line, ParserPass.ONE), nextIndex: i + 1 };
  };
}

/**
 * `CommandNoteBottom`, a `CommandMultilines2`: a block with no `end note` is no match, so the dispatcher moves on
 * (the wbs factory's `tryMultiline`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandMultilines2.java:79-111
 */
const noteBottomCommand: GanttCommandTry = (diagram, lines, i) => {
  const block = CommandNoteBottom.collect(lines, i);
  if (block === undefined) return undefined;
  return { result: CommandNoteBottom.apply(diagram, block), nextIndex: block.endIndex + 1 };
};

/**
 * `addLanguageCommands`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramFactory.java:110-120
 */
function languageCommands(): GanttCommandTry[] {
  return [
    SubjectGantt.ME,
    SubjectToday.ME,
    SubjectTask.ME,
    SubjectResource.ME,
    SubjectDaysAsDates.ME,
    SubjectDayOfWeek.ME,
    SubjectDayAsDate.ME,
    SubjectSeparator.ME,
    SubjectWorkingHours.ME,
  ].map((subject) => naturalCommand(new NaturalGanttCommand(subject)));
}

/**
 * The gantt commands of `initCommandsList`, in registration order, first match wins (the common commands
 * `addTitleCommands`/`addCommonCommands2`/`addCommonScaleCommands` are dispatched before, see
 * {@link dispatchCommonCommand}).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramFactory.java:84-108
 */
function ganttCommands(): readonly GanttCommandTry[] {
  return [
    ...languageCommands(),
    regexCommand(CommandGanttArrow),
    regexCommand(CommandGanttArrow2),
    regexCommand(CommandColorTask),
    regexCommand(CommandSeparator),
    regexCommand(CommandWeekNumberStrategy),
    regexCommand(CommandGroupStart),
    regexCommand(CommandGroupEnd),
    regexCommand(CommandLanguage),
    regexCommand(CommandPrintScale),
    ubrexCommand(new CommandPrintBetween()),
    noteBottomCommand,
    regexCommand(CommandFootboxGantt),
    regexCommand(CommandLabelOnColumn),
    regexCommand(CommandHideResourceName),
    regexCommand(CommandHideResourceFootbox),
    ubrexCommand(new CommandHideShowColumns()),
    regexCommand(CommandHideClosed),
    regexCommand(CommandTaskCompleteDefault),
  ];
}

/** Built once: the commands hold no per-diagram state. */
let commandList: readonly GanttCommandTry[] | undefined;

function dispatchGanttLine(diagram: GanttDiagram, lines: readonly string[], i: number): DispatchOutcome | undefined {
  commandList ??= ganttCommands();
  for (const command of commandList) {
    const outcome = command(diagram, lines, i);
    if (outcome !== undefined) return outcome;
  }
  return undefined;
}

/** The commands of `addCommonCommands2` whose `executeArg` leaves a gantt diagram untouched. */
function isNoOpCommand(trimmed: string, raw: string): boolean {
  return (
    NAMESPACE_SEPARATOR.test(trimmed) ||
    NOPE.test(trimmed) ||
    isAssumeTransparent(raw) ||
    MINWIDTH.test(trimmed) ||
    PAGE.test(trimmed) ||
    ROTATE.test(trimmed)
  );
}

/**
 * `addTitleCommands`, `addCommonCommands2` and `addCommonScaleCommands`, registered BEFORE the gantt commands
 * (GanttDiagramFactory.java:87-89). `skinparam`, `<style>`, `skin` and `!pragma` never reach here: the preprocessor
 * collected them. Returns the lines consumed, or `null` when none of them matches line `i`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommonCommands.java:62-128
 */
function dispatchCommonCommand(parsed: ParsedGantt, lines: readonly string[], i: number): number | null {
  const raw = lines[i]!;
  const annotation = matchAnnotationCommand(lines, i, parsed.annotations);
  if (annotation !== null) return annotation.consumed;
  if (isNoOpCommand(trin(raw), raw)) return 1;

  const sprite = matchSpriteCommand(lines, i, parsed.diagram.getSkinParam().getSprites());
  if (sprite !== null) return sprite.consumed;

  const scale = matchScaleCommand(trin(raw));
  if (scale === undefined) return null;
  parsed.scale = scale;
  return 1;
}

/** A hand-built source's style sources: no skin, no skinparam, no style. */
const EMPTY_STYLE_SOURCE: NonNullable<UmlSource['styleSource']> = {
  skinparam: new Map<string, string>(),
  styles: [],
};

/**
 * The `skinparam`/`<style>` commands the preprocessor pulled out of the source, still to be dispatched: upstream
 * executes each where it occurs, muting the diagram's style builder (SkinParam.java:164-167).
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
 * Executes every pending declaration placed before document line `position`. A rejected `<style>` block is
 * `CommandStyleMultilinesCSS`'s command error (java:92-93), reported at line 0.
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

/** The DOCUMENT-relative line a refusal at interior index `i` names (`WBSDiagramFactory.ts#refusalLineOf`). */
function refusalLineOf(source: UmlSource, i: number): number {
  return source.linePositions?.[i] ?? i;
}

/**
 * `CommandSkinParam#executeArg`'s deprecation warnings, one per collected `skinparam`, in source order.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParam.java:88-99
 */
function addSkinParamWarnings(diagram: GanttDiagram, skinparam: ReadonlyMap<string, string>): void {
  for (const name of skinparam.keys()) {
    const message = SKINPARAM_WARNINGS.get(name.toLowerCase());
    if (message !== undefined) diagram.addWarning(new Warning(message));
  }
}

/** `PSystemCommandFactory#createSystem`'s loop over the source lines (one pass: `ParserPass.ONE`). */
function executeCommands(parsed: ParsedGantt, source: UmlSource, dispatch: StyleDispatch): ParseRefusal | null {
  const lines = source.lines;
  let i = 0;
  while (i < lines.length) {
    const styleRefusal = executeDeclarationsBefore(dispatch, positionOf(source, i));
    if (styleRefusal !== null) return styleRefusal;
    const trimmed = trin(lines[i]!);
    if (trimmed === '' || START_END_RE.test(trimmed)) {
      i++;
      continue;
    }

    const common = dispatchCommonCommand(parsed, lines, i);
    if (common !== null) {
      i += common;
      continue;
    }

    const outcome = dispatchGanttLine(parsed.diagram, lines, i);
    if (outcome === undefined) return refuse('syntax', refusalLineOf(source, i), i, SYNTAX_ERROR);
    if (outcome.result.isOk() === false) {
      return refuse('execution', refusalLineOf(source, i), i, outcome.result.getError(), outcome.result.getScore());
    }
    i = outcome.nextIndex;
  }
  return null;
}

/**
 * `PSystemCommandFactory#finalizeDiagram`'s `checkFinalError` step: a message becomes an execution error located at
 * the FIRST body line. The pass loop breaks on the end directive after resetting the iterator to the line after
 * the start (`it = source.iterator2(); it.next();`), so `finalizeDiagram`'s `it.next()` reads body line 0 and the
 * trace is the start line plus that line (jar-verified: a 3-line gantt over 20 years errors at `line 2`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemCommandFactory.java:122-125,150-153
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemAbstractFactory.java:67-72
 */
function finalRefusal(diagram: GanttDiagram, source: UmlSource): ParseRefusal | null {
  const message = diagram.checkFinalError();
  if (message === undefined) return null;
  return refuse('final', refusalLineOf(source, 0), 0, message);
}

/**
 * `GanttDiagramFactory` -- the top-level parse entry point for one `@startgantt` block. `createEmptyDiagram`
 * (`new GanttDiagram(source, preprocessing)`, java:123-128; `pathSystem`/`previous` are unused there and dropped)
 * with the skin param built here, then `PSystemCommandFactory#createSystem`'s per-line dispatch: the common
 * commands, then the gantt commands in `initCommandsList` order, then `checkFinalError`. A command that throws
 * propagates (the crash path).
 * @param clock the instant `today` reads (`TimePoint.todayAtMidnight()`, decision D3).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramFactory.java:73-130
 */
export function parseGantt(
  source: UmlSource,
  preprocessing: PreprocessingArtifact,
  clock: Clock = DEFAULT_CLOCK,
): ParsedGantt | ParseRefusal {
  const dispatch = createStyleDispatch(source);
  const skinParam = new SkinParam({
    style: dispatch.style,
    skinparam: dispatch.skinparam,
    sprites: createSpriteRegistry(),
    pragma: Pragma.createEmpty(),
  });
  const diagram = new GanttDiagram(source, preprocessing, skinParam, clock);
  addSkinParamWarnings(diagram, dispatch.skinparam);
  const parsed: ParsedGantt = { diagram, annotations: createAnnotations(), scale: undefined };
  const refusal = executeCommands(parsed, source, dispatch);
  if (refusal !== null) return refusal;
  // Declarations after the last command still mute the builder the render reads.
  const trailing = executeDeclarationsBefore(dispatch, Number.POSITIVE_INFINITY);
  return trailing ?? finalRefusal(diagram, source) ?? parsed;
}
