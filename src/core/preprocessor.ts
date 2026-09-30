/**
 * Preprocessor -- a thin wrapper over the TIM interpreter (`src/core/tim/`).
 *
 * Batch SI5a-4 CUTOVER (locked decision #1 of `plans/si5a-tim/README.md`): the
 * flat line-loop that used to live here is replaced by `TContext` + the
 * `CodeIterator` decorator chain, which is how upstream expresses nested
 * `!if` / `!foreach` / `!while` / `!procedure`. The old loop structurally could
 * not: it tracked a single conditional stack and had no execution-context
 * stack at all. The public surface is unchanged -- same `preprocess(source,
 * defines?)` signature, same `PreprocessorResult` shape -- so no caller moves.
 *
 * What stays here (and NOT in `TContext`, because none of it is a TIM concept
 * upstream): the `<style>` block collector, the `skinparam` line/block
 * collector, and the `%n()` / BLOCK_E1 newline line-splitting. Upstream leaves
 * all three to layers this port does not have (the command layer and the
 * Jaws/Creole display layer). See `resultOf` below.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TContext.java
 */

import { EaterException } from './tim/EaterException.js';
import type { IncludeStore } from './tim/IncludeStore.js';
import { readLines } from './tim/ReadLineReader.js';
import { StringLocated } from './tim/StringLocated.js';
import type { LineLocation } from './tim/LineLocation.js';
import { TContext } from './tim/TContext.js';
import { TMemoryGlobal } from './tim/TMemoryGlobal.js';
import { TValue } from './tim/expression/TValue.js';
import { TVariableScope } from './tim/TVariableScope.js';
import { StyleAndSkinparamCollector } from './preprocessor-collector.js';
import { BLOCK_E1_BREAKLINE } from './tim/builtin/jaws-constants.js';
import { mutateExpandsBreakline } from './uml-source-lines.js';

export interface PreprocessorResult {
  readonly lines: readonly string[];
  readonly theme: string | null;
  /**
   * mission skin-file-loading Batch 1: the `skin <name>` directive's
   * captured argument (`skin rose` -> `"rose"`), lowercased. Upstream
   * grammar: `CommandSkin`/`SkinLoader` (`net/sourceforge/plantuml/
   * sequencediagram/command/CommandSkin.java`) -- `^skin\\s+([\\w.]+)$`,
   * a bare directive line like `skinparam`/`theme`, NOT a TIM `!` command.
   * `undefined` when the document has no `skin` line. `skin-loader.ts`
   * resolves the name against the embedded `<style>`-grammar registry
   * (`skins-builtin.ts`); an unrecognized or preprocessor-grammar name
   * (`reddress`/`sonyxperiadev`, D1) is a no-op there, not here -- this
   * field only captures what the directive line SAID, unvalidated.
   */
  readonly skin?: string | undefined;
  readonly styles: readonly string[];
  readonly skinparam: ReadonlyMap<string, string>;
  /**
   * G2 N9: 0-indexed source-file line position (`StringLocated#getLocation
   * ()#getPosition()`) for each entry in {@link lines}, parallel array --
   * jar's `<path codeLine="...">` attribute (`Link#getCodeLine()`) needs
   * the ORIGINAL line number, which the flat `string[]` above discards.
   * `undefined` for a line the reader never located (defensive; every
   * `StringLocated` this port constructs carries a location today).
   * Minimal "command-dispatch level" tracking, per `plans/g2-class-svg/
   * ledger.md` N8's own diagnosis note: NOT a full re-architecture of the
   * line representation (still no per-line objects deeper in the
   * pipeline) -- just enough to recover the number at the point a
   * diagram's per-line parse loop reads `lines[i]`.
   */
  readonly linePositions: readonly (number | undefined)[];
  /**
   * G2 N39: 0-indexed source-file line position of each `<style>` block's
   * OPENING `<style>` tag, parallel to {@link styles} (`styles[i]` opened
   * at `stylePositions[i]`). Upstream's `<style>` block is a real COMMAND
   * (`CommandStyleMultilinesCSS#executeNow`) that MUTATES the diagram's
   * live `StyleBuilder` in place at the point it is dispatched
   * (`ISkinParam#muteStyle`) -- a classifier/entity created via
   * `CucaDiagram#createLeaf` CAPTURES a snapshot of that builder AT ITS
   * OWN CREATION TIME (`Entity#currentStyleBuilder`, `net/atmp/
   * CucaDiagram.java:808-819`), so two `<style>` blocks overriding the
   * SAME selector are POSITION-SCOPED, not last-writer-wins across the
   * whole document (jar-verified `fexuta-62-piko653`: a `.a{BackGroundColor
   * pink}` block then `class red <<a>>` then a SECOND `.a{BackGroundColor
   * palegreen}` block then `class green <<a>>` -- `red` renders pink,
   * `green` renders palegreen, even though the SAME selector `.a` is
   * redefined). This field is the minimal data needed to reconstruct that
   * ordering: a diagram parser compares a classifier's own dispatch-time
   * `linePositions[i]` against this array to count how many style blocks
   * had already executed (see `class/parser.ts#ensureClassifier`'s
   * `styleGeneration` stamp). `undefined` for a block the reader never
   * located (same defensive fallback as {@link linePositions}).
   */
  readonly stylePositions: readonly (number | undefined)[];
  /**
   * cdd3-T27: upstream's `BlockUml#data` before `Jaws.mutateExpands1` -- the
   * TIM result list with the lines the collector consumed kept in place,
   * substituted, un-trimmed. Only `UmlSource#seed()` reads it
   * (`uml-source-lines.ts`). Absent on a hand-built result.
   */
  readonly dataLines?: readonly string[];
  /**
   * cdd4-T7b: where each `skinparam` key's last assignment and each `<style>`
   * block ({@link styles}, parallel) fell on ONE declaration counter -- see
   * `StyleAndSkinparamCollector#skinparamOrder`. Absent on a hand-built
   * result, which `style-skinparam-segments.ts` reads as every skinparam
   * before every `<style>` block.
   */
  readonly declarationOrder?: DeclarationOrder;
}

/** See {@link PreprocessorResult.declarationOrder}. */
export interface DeclarationOrder {
  readonly skinparam: ReadonlyMap<string, number>;
  readonly styles: readonly number[];
}

export interface PreprocessOptions {
  /**
   * Where `!include` / `!includesub` / `!includedef` / `!import` read their
   * content. Omitted -> the empty store, and any include is an unresolved-path
   * error. See `tim/IncludeStore.ts`.
   */
  readonly includeStore?: IncludeStore | undefined;
}

/**
 * `%n()` / `%newline()` written in any case OTHER than all-lowercase. The
 * lowercase spellings are real TIM builtins (`NewlineShort` / `Newline`) and
 * are already expanded to {@link BLOCK_E1_NEWLINE} by the interpreter; the trie
 * that finds call sites is case-sensitive, exactly as upstream's is (the jar
 * renders `%N()` literally -- live-oracle-verified). plantuml-ts's pre-TIM
 * preprocessor matched them case-INSENSITIVELY, and
 * `tests/unit/preprocessor.test.ts` ("`%n()` is case-insensitive") pins that,
 * so the case-folded alias is preserved here as a deliberate divergence rather
 * than silently dropped in the cutover.
 */
const RE_NEWLINE_CALL_ANY_CASE = /%n\(\)|%newline\(\)/gi;

/**
 * Interpreter result lines -> `PreprocessorResult.lines`.
 *
 * Two decodings, and the difference between them is load-bearing:
 *
 *  - `Jaws.BLOCK_E1_NEWLINE` survives here only from
 *    `TContext#extractFromResultList` (`%retrieve_procedure`'s multi-line
 *    capture), where upstream uses it as an IN-LINE separator, NOT a line
 *    break. It is left in place: splitting on it would turn a captured class
 *    body inside a `note` into loose top-level source lines, and the jar does
 *    not (roputo-88-fuxo199 -- the jar emits one note node; splitting invents
 *    junk nodes, and even an embedded real newline breaks the block/line
 *    parsers downstream). FOLLOW-UP: decoding the sentinel into a label line
 *    break is the Jaws/Creole display layer's job, which this port does not
 *    have yet -- until then such a label renders on one line.
 *  - `%n()` / `%newline()` DO split the line into separate source lines. The
 *    lowercase spellings already produced a real newline in the interpreter
 *    (see `jaws-constants.ts#USE_BLOCK_E1_IN_NEWLINE_FUNCTION`) and were split
 *    by `TContext#applyFunctionsAndVariablesInternal`; only the case-folded
 *    alias (pinned by `tests/unit/preprocessor.test.ts`) reaches this far, and
 *    it is split here.
 *
 * Trailing whitespace is KEPT (T6i): upstream's preprocessor never trims a
 * line (`ReadLineReader.java:89-115` reads it verbatim, `TimLoader` hands the
 * result list on); each command decides. `SingleLineCommand2#myTrim2`
 * (`SingleLineCommand2.java:74-79`) trims only when `doTrim`, and the
 * `super(false, …)` commands (`CommandMindMapOrgmode.java:55`,
 * `CommandMindMapPlus`, `CommandWBSItemNew/Old`, `CommandBoardPlus`, …) see
 * the trailing space: `* **1** ` draws bold `1` plus a ` ` atom
 * (kijaru-67-buco967). Only the segments of the port-only case-folded `%N()`
 * split above are right-trimmed, as before -- that split has no upstream
 * counterpart.
 *
 * Blank lines are KEPT (A2s): upstream emits
 * blank lines and the command layer decides per-construct — a blank in a
 * `note`/class body is CONTENT (`CommandFactoryNoteOnEntity.java:236-238`;
 * `BodierLikeClassOrObject.java:114-172`). Dropping them here silently
 * deleted note/body lines before any parser ran (vivifa-42-mire839).
 */
function flatten(resultList: readonly StringLocated[]): { lines: string[]; positions: (number | undefined)[] } {
  const lines: string[] = [];
  const positions: (number | undefined)[] = [];
  for (const located of resultList) {
    const position = located.getLocation()?.getPosition();
    const segments = located.getString().split(RE_NEWLINE_CALL_ANY_CASE);
    for (const segment of segments) {
      lines.push(segments.length === 1 ? segment : segment.trimEnd());
      positions.push(position);
    }
  }
  return { lines, positions };
}

/**
 * Process raw PlantUML source.
 *
 * @param source  - Raw multi-line string (the full document, not pre-split).
 * @param defines - Optional pre-seeded defines (for testing and include chaining).
 *                  Seeded as global TIM variables, which is what a `!define
 *                  NAME value` line produces (`EaterAffectationDefine`).
 * @param options - Optional interpreter seams; today just the include store
 *                  (`render()` prefetches one; `renderSync` takes one from the
 *                  caller).
 * @throws EaterException on a malformed TIM directive.
 * @throws IncludeNotFoundError / StdlibNotBundledError on an include the store
 *         cannot serve.
 */
export function preprocess(
  source: string,
  defines?: ReadonlyMap<string, string>,
  options?: PreprocessOptions,
): PreprocessorResult {
  const outcome = preprocessOrError(source, defines, options);
  if (!outcome.ok) throw outcome.failure.cause;

  return outcome.result;
}

/**
 * What the interpreter left behind when it failed -- everything the error
 * diagram needs, and nothing it does not.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TimLoader.java#load
 */
export interface PreprocessorFailure {
  /** The document's own lines -- upstream's `BlockUml#data`, the `UmlSource`. */
  readonly input: readonly StringLocated[];
  /**
   * The lines the interpreter actually executed (upstream's `TContext#debug`),
   * the last of which carries the message via `withErrorPreprocessor` -- which
   * is exactly where `PSystemErrorPreprocessor` reads it back from.
   */
  readonly trace: readonly StringLocated[];
  /** The original thrown error, so `preprocess()` can rethrow it unchanged. */
  readonly cause: unknown;
}

export type PreprocessOutcome =
  | { readonly ok: true; readonly result: PreprocessorResult }
  | { readonly ok: false; readonly failure: PreprocessorFailure };

/**
 * Preprocess, CAPTURING a failure instead of throwing it -- upstream's
 * `TimLoader#load`, which catches the `EaterException`, marks the last line of
 * the debug trace with its message, and raises a `preprocessorError` flag that
 * `BlockUml#getDiagram` turns into a `PSystemErrorPreprocessor`. PlantUML never
 * throws at a caller: a malformed document still renders (as an error diagram).
 *
 * `render()` / `renderSync()` call this; `preprocess()` above is the throwing
 * facade over it, kept for every other caller (and because a thrown, typed
 * `IncludeNotFoundError` is this port's documented include-seam contract).
 *
 * Upstream catches `EaterException` only. This port also captures the typed
 * include errors and any other throw, because the alternative is not "upstream
 * behavior" but a stack trace escaping a render call -- and the trace is just
 * as accurate for them (it is the same debug list, marked with the same
 * mechanism).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TimLoader.java#load
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/BlockUml.java#getDiagram
 */
export function preprocessOrError(
  source: string,
  defines?: ReadonlyMap<string, string>,
  options?: PreprocessOptions,
): PreprocessOutcome {
  if (source === '')
    return {
      ok: true,
      result: { lines: [], linePositions: [], theme: null, styles: [], stylePositions: [], skinparam: new Map() },
    };

  return preprocessLinesOrError(readLines(source), defines, options);
}

/**
 * The same, over lines that are ALREADY read and located -- upstream's
 * `TimLoader#load(List<StringLocated>)`, which is how `BlockUml` runs the
 * interpreter: over ONE `@start...@end` block, never over the document.
 * `BlockUmlBuilder.ts` is that caller; `preprocessOrError` above is the
 * whole-document facade over it (`readLines` + this), kept for every test and
 * script that preprocesses a bare string.
 *
 * The locations are the ones the reader already assigned, so a failure inside a
 * block still reports its DOCUMENT line number.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/tim/TimLoader.java#load
 */
export function preprocessLinesOrError(
  input: readonly StringLocated[],
  defines?: ReadonlyMap<string, string>,
  options?: PreprocessOptions,
): PreprocessOutcome {
  const context = new TContext({ includeStore: options?.includeStore });
  const memory = new TMemoryGlobal();

  if (defines !== undefined)
    for (const [name, value] of defines)
      memory.putVariable(name, TValue.fromString(value), TVariableScope.GLOBAL, new StringLocated(name, undefined));

  try {
    context.executeLines(memory, input, undefined, false);
  } catch (e) {
    return {
      ok: false,
      failure: { input, trace: markLastLine(context.getDebug(), messageOf(e)), cause: e },
    };
  }

  return { ok: true, result: resultOf(context) };
}

/**
 * The interpreter's output, read off a context that ran to completion.
 *
 * The `<style>` / `skinparam` / `skin` lines are hoisted out of the FINISHED
 * result list -- the same fully-substituted stream upstream's
 * `CommandSkinParam` / `CommandStyleMultilinesCSS` / `CommandSkin` dispatch
 * over, after `TimLoader` (cdd4-T7b). Collecting any earlier (the former
 * `PlainLineFilter` at `TContext#addPlain`, pre-substitution) saw a
 * procedure-call line before it ran: `skinparam class { $primary_scheme() }`
 * (`puml-theme-aws-orange.puml:158-166`) never emitted its entries, and a
 * mid-line call's `pendingAdd` prefix (`:645`) leaked into the diagram body.
 */
function resultOf(context: TContext): PreprocessorResult {
  const collector = new StyleAndSkinparamCollector();
  const data = mutateExpands1(context.getResultList());
  const positions = documentPositions(data);
  const kept = data.filter((line, i) => !collector.accept(line, positions[i]));
  const flattened = flatten(kept);
  return {
    lines: flattened.lines,
    linePositions: flattened.positions,
    dataLines: context.getResultList().map((line) => line.getString()),
    theme: context.getThemeName() ?? null,
    skin: collector.skin,
    styles: collector.styles,
    stylePositions: collector.stylePositions,
    skinparam: collector.skinparam,
    declarationOrder: { skinparam: collector.skinparamOrder, styles: collector.styleOrder },
  };
}

/**
 * `BlockUml`'s constructor runs `Jaws.mutateExpands1(tmp)` on the TIM result
 * list (`BlockUml.java:153`) before any command sees it: every
 * `BLOCK_E1_BREAKLINE` (`%breakline()`, C4's `$bl()`) outside a `{{...}}`
 * embed splits the line, each piece keeping the line's location and
 * preprocessor error (`jaws/Jaws.java:65-120`). Collecting before this split
 * read C4's `$defineSkinparams` output -- several `skinparam X { }` blocks on
 * one line -- as ONE single-line skinparam whose value was the whole blob
 * (cdd6 verify.md, "C4 `>>` head + `$bl()` split"). The per-line split is
 * {@link mutateExpandsBreakline}'s; this re-wraps its pieces as located lines.
 * `mergeTripleMarkBlocks` is not run: `JawsFlags.PARSE_NEW_MULTILINE_TRIPLE_MARKS`
 * is `false` (`JawsFlags.java:41`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jaws/Jaws.java:59-63
 */
function mutateExpands1(lines: readonly StringLocated[]): StringLocated[] {
  return lines.flatMap((sl) => {
    const s = sl.getString();
    if (!s.includes(BLOCK_E1_BREAKLINE)) return [sl];
    return mutateExpandsBreakline([s]).map(
      (piece) => new StringLocated(piece, sl.getLocation(), undefined, sl.getPreprocessorError()),
    );
  });
}

/** The root of a line's location chain: an included line's `!include` line. */
function rootLocation(line: StringLocated): LineLocation | undefined {
  let location = line.getLocation();
  while (location?.getParent() !== undefined) location = location.getParent();
  return location;
}

/**
 * Each result line's place in the DOCUMENT (the block's own lines, which the
 * first line -- `@start...` -- belongs to): its own position; an included
 * line's `!include` position (the root of its chain); and for a `!theme`'s
 * lines, which have no document root (`ThemeUtils` reads a theme parentless,
 * `ThemeUtils.java:140-174`), the last document position before them -- the
 * `!theme` line's place in execution order, which is what a `<style>`
 * block's `stylePositions` entry is compared against (G2 N39).
 */
function documentPositions(lines: readonly StringLocated[]): (number | undefined)[] {
  const document = lines[0] === undefined ? undefined : rootLocation(lines[0])?.getDescription();
  let last: number | undefined;
  return lines.map((line) => {
    const root = rootLocation(line);
    if (root !== undefined && root.getDescription() === document) last = root.getPosition();
    return last;
  });
}

/** @see ~/git/plantuml/.../tim/TimLoader.java#changeLastLine */
function markLastLine(debug: readonly StringLocated[], message: string): readonly StringLocated[] {
  const num = debug.length - 1;
  if (num < 0) return debug;

  const result = [...debug];
  result[num] = debug[num]!.withErrorPreprocessor(message);
  return result;
}

/**
 * An `EaterException`'s message is the error text upstream prints verbatim. Any
 * other throw has no upstream counterpart here, so it is reported as it reads.
 */
function messageOf(e: unknown): string {
  if (e instanceof EaterException) return e.getMessage();

  return e instanceof Error ? e.message : String(e);
}
