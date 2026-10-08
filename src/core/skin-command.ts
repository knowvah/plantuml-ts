/**
 * The `skin <name>` command's failure path — unwind2-S8.
 *
 * Upstream's `CommandSkin` is one of the common commands every
 * `PSystemCommandFactory` dispatches (`CommonCommands.java:71`), and it calls
 * `TitledDiagram#loadSkin`, which loads `<name>.skin` immediately so that "a
 * missing or invalid style is reported on this very line"
 * (`TitledDiagram.java:159-182`). Its errors are ordinary command errors: the
 * factory stops at the `skin` line and the jar draws its `PSystemError` page.
 *
 * This port hoists `skin` lines out of the diagram body in the preprocessor
 * collector, so no engine ever sees one. {@link skinCutOf} restores the
 * command's place in the dispatch: it names the first `skin` line whose load
 * fails, how many body lines precede it, and the refusal every engine that
 * reaches it would return — `DiagramRegistry#resolve` then lets each engine
 * parse only the lines before it, exactly as upstream's per-line loop would.
 */
import type { UmlSource } from './block-extractor.js';
import type { PreprocessorResult, SkinDirective } from './preprocessor.js';
import { refuse, type ParseRefusal } from './parse-refusal.js';
import { getMissingRootProperties, loadSkin, NoStyleAvailableException } from './style/StyleLoader.js';
import { StyleParsingException } from './style/parser/StyleParser.js';
import type { StyleBuilder } from './style/StyleBuilder.js';

/** `TitledDiagram.loadSkin`'s `newSkin + ".skin"`. @see TitledDiagram.java:161 */
const SKIN_EXTENSION = '.skin';

/**
 * The command error `TitledDiagram#loadSkin` returns for `newSkin`, or
 * `undefined` when the skin loads and is complete.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:159-182
 */
export function skinCommandError(newSkin: string): string | undefined {
  let styleBuilder: StyleBuilder;
  try {
    styleBuilder = loadSkin(newSkin + SKIN_EXTENSION);
  } catch (e) {
    if (e instanceof NoStyleAvailableException) return `Cannot find style ${newSkin}`;
    if (e instanceof StyleParsingException) return `Cannot parse style ${newSkin}: ${e.message}`;
    throw e;
  }
  const missing = getMissingRootProperties(styleBuilder);
  // `List#toString`: `[a, b, c]`.
  if (missing.length > 0) return `Incomplete style ${newSkin}: root does not define [${missing.join(', ')}]`;
  return undefined;
}

/** Where the dispatch stops on a failing `skin` line, and what it says. */
export interface SkinCut {
  /** Body lines (`UmlSource.lines`) the engines parse before the `skin` line. */
  readonly index: number;
  /** The refusal at the `skin` line itself. */
  readonly refusal: ParseRefusal;
}

/** Body lines whose document position precedes `position`. */
function linesBefore(source: UmlSource, position: number): number {
  const positions = source.linePositions;
  if (positions === undefined) return 0;
  let count = 0;
  while (count < positions.length && (positions[count] ?? Infinity) < position) count++;
  return count;
}

function firstFailing(
  directives: readonly SkinDirective[],
): { readonly directive: SkinDirective; readonly message: string } | undefined {
  for (const directive of directives) {
    const message = skinCommandError(directive.name);
    if (message !== undefined) return { directive, message };
  }
  return undefined;
}

/**
 * The cut for the first `skin` line upstream would refuse, if any. Its
 * refusal is an execution error (`PSystemCommandFactory`'s
 * `CommandExecutionResult.error`, score 0) at the line's document position,
 * having consumed the body lines before it.
 */
export function skinCutOf(
  preprocessed: Pick<PreprocessorResult, 'skinDirectives'>,
  source: UmlSource,
): SkinCut | undefined {
  const failing = firstFailing(preprocessed.skinDirectives ?? []);
  if (failing === undefined) return undefined;
  const position = failing.directive.position ?? 0;
  const index = linesBefore(source, position);
  return { index, refusal: refuse('execution', position, index, failing.message) };
}
