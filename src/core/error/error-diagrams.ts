/**
 * Error diagrams — upstream's `BlockUml#getDiagram`. Extracted from
 * `src/index.ts` (mission A5 / T4), which sits at the repo's 500-line hook cap.
 *
 * PlantUML never throws at its caller: a malformed document still produces an
 * SVG. What used to sit here (a homegrown 400x80 red box reading "PlantUML
 * error: <toString of whatever was thrown>") is replaced by the faithful
 * render — the Welcome block for a short source, the version banner, `[From
 * string (line N) ]`, the source listing with the offending line waved in red,
 * and the message.
 *
 * None of these are exported from `src/index.ts`; they are internal to the
 * render pipeline, so the move changes no public surface.
 */
import type { PreprocessorFailure } from '../preprocessor.js';
import type { BlockUmlOk } from '../BlockUmlBuilder.js';
import type { DiagramType } from '../block-extractor.js';
import type { StringMeasurer } from '../measurer.js';
import type { StringLocated } from '../tim/StringLocated.js';
import { readLines } from '../tim/ReadLineReader.js';
import { getDefaultMeasurer } from '../render-options.js';
import type { RenderOptions } from '../render-options.js';
import { ErrorUml } from './ErrorUml.js';
import { PSystemErrorEmpty } from './PSystemErrorEmpty.js';
import { PSystemErrorPreprocessor } from './PSystemErrorPreprocessor.js';
import { PSystemErrorV2 } from './PSystemErrorV2.js';
import { PSystemWelcome } from './PSystemWelcome.js';
import { umlSourceOf } from './UmlSource.js';
import { renderPSystemError, renderPSystemWelcome } from './error-renderer.js';

/** The measurer the error diagram lays its text out with. */
function errorMeasurer(options?: RenderOptions): StringMeasurer {
  return options?.measurer ?? getDefaultMeasurer();
}

/**
 * A preprocessor (TIM) failure: an orphan `!endif`, an unknown function, an
 * unresolvable include. The trace is the lines the interpreter really executed
 * — through includes, loops and macro bodies — with the message already marked
 * on its last line.
 * @see ~/git/plantuml/.../BlockUml.java#getDiagram
 */
export function preprocessorErrorSvg(
  failure: PreprocessorFailure,
  options?: RenderOptions,
): string {
  const system = new PSystemErrorPreprocessor(umlSourceOf(failure.input), failure.trace);
  return renderPSystemError(system, errorMeasurer(options));
}

/**
 * A failure AFTER preprocessing (parse, layout or render). This port has no
 * per-line parser trace to hand over — upstream's parsers report the line they
 * choked on — so the listing is the diagram's own source and the message is
 * attributed to its last line.
 */
export function errorSvg(source: string, err: unknown, options?: RenderOptions): string {
  // The last-resort handler: it runs on input already known to be broken -- up
  // to and including a caller who passed something that is not a string at all
  // (`renderAll(null)`, pinned by tests/integration/index.test.ts). A throw
  // from HERE escapes render(), which is the one thing this path exists to
  // prevent, so it does not trust its own argument.
  const input: readonly StringLocated[] = readLines(typeof source === 'string' ? source : '');
  const trace = umlSourceOf(input);
  const error = new ErrorUml('EXECUTION_ERROR', errorMessage(err), 0, trace[trace.length - 1]);
  const system =
    trace.length === 0
      ? new PSystemErrorEmpty(trace, trace, error)
      : new PSystemErrorV2(trace, trace, error, err);
  return renderPSystemError(system, errorMeasurer(options));
}

/**
 * Nothing to draw: the document has no `@start…@end` block at all. The jar
 * renders the Welcome screen here (live-oracle verified), not an error.
 * @see ~/git/plantuml/.../eggs/PSystemWelcome.java
 */
export function welcomeSvg(options?: RenderOptions): string {
  return renderPSystemWelcome(new PSystemWelcome(), errorMeasurer(options));
}

/**
 * The block parsed, ran, and said nothing -- upstream's *Empty description*,
 * raised by `PSystemCommandFactory#createSystem` before any command runs. The
 * assumed type is the FIRST factory the `@start` line selects: for `@startuml`
 * that is `SequenceDiagramFactory` (every legacy factory raises the same empty
 * error, and `PSystemErrorUtils#merge` keeps the first of the equal-scoring
 * ones) -- jar-verified, `Empty description (Assumed diagram type: sequence)`.
 * For a typed block (`@startjson`, ...) it is that block's own type.
 * The listing is the `@start` line alone, waved, which is what the jar draws.
 * @see ~/git/plantuml/.../command/PSystemAbstractFactory.java#buildEmptyError
 */
export function emptySvg(block: BlockUmlOk, options?: RenderOptions): string {
  const startLine = block.rawSource[0]!;
  const assumed: DiagramType = block.suffix === 'uml' ? UML_EMPTY_ASSUMED_TYPE : block.source.type;
  const error = new ErrorUml('SYNTAX_ERROR', EMPTY_DESCRIPTION, 0, startLine, assumed);
  const system = new PSystemErrorEmpty(block.rawSource, [startLine], error);
  return renderPSystemError(system, errorMeasurer(options));
}

/** @see ~/git/plantuml/.../command/PSystemAbstractFactory.java#EMPTY_DESCRIPTION */
const EMPTY_DESCRIPTION = 'Empty description';

/** The first factory `@startuml` selects -- see {@link emptySvg}. */
const UML_EMPTY_ASSUMED_TYPE: DiagramType = 'sequence';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
