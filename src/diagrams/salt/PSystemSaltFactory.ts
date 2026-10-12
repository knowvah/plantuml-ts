import { matchAnnotationCommand } from '../../core/annotations/index.js';
import { isAssumeTransparent } from '../../core/assume-transparent.js';
import type { UmlSource } from '../../core/block-extractor.js';
import { refuse, type ParseRefusal } from '../../core/parse-refusal.js';
import { matchScaleCommand } from '../../core/scale-command.js';
import { matchSpriteCommand } from '../../core/sprite-commands.js';
import { buildMindmapStyleBuilder } from '../../core/style/mindmap-style-builder.js';
import { StyleParsingException, trin } from '../../core/style/parser/StyleParser.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { PreprocessingArtifact } from '../../core/tim/PreprocessingArtifact.js';
import { Warning } from '../../core/warning/Warning.js';
import { COMMAND_ANYTHING_PATTERN, executeArg } from './CommandAnything.js';
import { PSystemSalt } from './PSystemSalt.js';

/** `CommandNope`: `^[%s]*$` over the trimmed line (`%s` = `\s `, Java `\s`
 *  being ASCII). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandNope.java:54-58 */
const NOPE = /^[ \t\n\x0B\f\r ]*$/;
/** `CommandRotate`: `executeArg` returns `ok()`. @see command/CommandRotate.java:54-71 */
const ROTATE = /^rotate$/i;
/** `CommandMinwidth`: `setMinwidth` is commented out. @see command/CommandMinwidth.java:54-77 */
const MINWIDTH = /^minwidth[ \t\n\x0B\f\r ]+(\d+)$/i;
/** `CommandPage`: `page NxM`, read only by the PNG splitter. @see command/CommandPage.java:54-95 */
const PAGE = /^page[ \t\n\x0B\f\r ]+(\d+)[ \t\n\x0B\f\r ]*x[ \t\n\x0B\f\r ]*(\d+)$/i;
/**
 * `CommandNamespaceSeparator` (registered by `addTitleCommands`):
 * `set (separator|namespaceseparator) SEPARATOR`, SEPARATOR being
 * `none`/`null`, `[\\]{2}|::`, or one char outside `[%pLN%s_$#\\{}<>%g]`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandNamespaceSeparator.java:60-80
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandLinkClass.java:92
 */
const NAMESPACE_SEPARATOR =
  /^set[ \t\n\x0B\f\r ]+(?:separator|namespaceseparator)[ \t\n\x0B\f\r ]+((?:none|null)|[\\]{2}|::|[^\p{L}\p{N} \t\n\x0B\f\r _$#\\{}<>"“”])$/iu;

/** `new Warning(…)` texts `CommandSkinParam#executeArg` adds, keyed by the
 *  lower-cased skin parameter name.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandSkinParam.java:88-99 */
const SKINPARAM_WARNINGS: ReadonlyMap<string, string> = new Map([
  ['handwritten', "Please use '!option handwritten true' to enable handwritten "],
  ['participantpadding', 'Please use CSS style instead of skinparam ParticipantPadding'],
  ['padding', 'Please use CSS style instead of skinparam padding'],
]);

/** A hand-built source's style sources: no skin, no skinparam, no style. */
const EMPTY_STYLE_SOURCE: NonNullable<UmlSource['styleSource']> = { skinparam: new Map(), styles: [] };

/**
 * The commands of `addCommonCommands2` whose `executeArg` leaves a salt
 * diagram untouched: blank lines, `!assume transparent`, `minwidth`,
 * `page`, `rotate`. `!pragma`, `skinparam`, `skin` and `<style>` never
 * reach here (the preprocessor collected them).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommonCommands.java:62-95
 */
function isNoOpCommand(trimmed: string, raw: string): boolean {
  return (
    NOPE.test(trimmed) ||
    isAssumeTransparent(raw) ||
    MINWIDTH.test(trimmed) ||
    PAGE.test(trimmed) ||
    ROTATE.test(trimmed) ||
    NAMESPACE_SEPARATOR.test(trimmed)
  );
}

/**
 * `initCommandsList` (java:56-61) minus `CommandAnything`: the common
 * commands, in registration order where two could claim one line. Returns
 * the lines consumed, or `null` when none matches line `i`.
 */
function dispatchCommonCommand(diagram: PSystemSalt, lines: readonly string[], i: number): number | null {
  const raw = lines[i]!;
  const trimmed = trin(raw);
  if (isNoOpCommand(trimmed, raw)) return 1;

  const sprite = matchSpriteCommand(lines, i, diagram.getSpriteRegistry());
  if (sprite !== null) return sprite.consumed;

  const scale = matchScaleCommand(trimmed);
  if (scale !== undefined) {
    diagram.scale = scale;
    return 1;
  }

  return matchAnnotationCommand(lines, i, diagram.annotations)?.consumed ?? null;
}

/** The document line a refusal at interior index `i` names (see
 *  `MindMapDiagramFactory.ts#refusalLineOf`). */
function refusalLineOf(source: UmlSource, i: number): number {
  return source.linePositions?.[i] ?? i;
}

/** `PSystemCommandFactory#createSystem`'s loop over the source lines. */
function executeCommands(diagram: PSystemSalt, source: UmlSource): ParseRefusal | null {
  const lines = source.lines;
  let i = 0;
  while (i < lines.length) {
    const common = dispatchCommonCommand(diagram, lines, i);
    if (common !== null) {
      i += common;
      continue;
    }
    const match = COMMAND_ANYTHING_PATTERN.exec(lines[i]!);
    const result = executeArg(diagram, match![1]!);
    if (!result.isOk()) return refuse('execution', refusalLineOf(source, i), i, result.getError());
    i++;
  }
  return null;
}

/** `CommandSkinParam#executeArg`'s deprecation warnings, one per collected
 *  skinparam, in source order (`MindMapDiagramFactory.ts#addSkinParamWarnings`). */
function addSkinParamWarnings(diagram: PSystemSalt, skinparam: ReadonlyMap<string, string>): void {
  for (const name of skinparam.keys()) {
    const message = SKINPARAM_WARNINGS.get(name.toLowerCase());
    if (message !== undefined) diagram.addWarning(new Warning(message));
  }
}

/**
 * The style builder `TitledDiagram#calculateBackColor` reads: the skin,
 * then every `skinparam`/`<style>` the preprocessor collected. A block the
 * style parser rejects is `CommandStyleMultilinesCSS`'s command error.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/CommandStyleMultilinesCSS.java:85-93
 */
function buildStyle(styleSource: NonNullable<UmlSource['styleSource']>): StyleBuilder | ParseRefusal {
  try {
    return buildMindmapStyleBuilder(styleSource);
  } catch (e) {
    if (!(e instanceof StyleParsingException)) throw e;
    return refuse('execution', 0, 0, `Error in style definition: ${e.message}`);
  }
}

/**
 * PSystemSaltFactory — the `@startsalt` parse: `createEmptyDiagram`, then
 * `PSystemCommandFactory#createSystem` dispatching each line over
 * `addCommonCommands2`, `addCommonScaleCommands`, `addTitleCommands` and
 * `CommandAnything`, which takes every line the others do not.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/PSystemSaltFactory.java:49-69
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemCommandFactory.java:104-198
 */
export function createSaltDiagram(source: UmlSource): PSystemSalt | ParseRefusal {
  const styleSource = source.styleSource ?? EMPTY_STYLE_SOURCE;
  const styleBuilder = buildStyle(styleSource);
  if ('refused' in styleBuilder) return styleBuilder;
  const diagram = new PSystemSalt(source, new PreprocessingArtifact(), {
    styleBuilder,
    skinparam: styleSource.skinparam,
  });
  addSkinParamWarnings(diagram, styleSource.skinparam);
  return executeCommands(diagram, source) ?? diagram;
}
