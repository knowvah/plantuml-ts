/**
 * Construction-time seams for {@link TContext}. Both are plantuml-ts additions
 * with no upstream counterpart (upstream's `TContext` constructor takes a
 * `PathSystem` / `Defines` / `Charset` / `DefinitionsContainer` instead, none
 * of which a browser-safe, synchronous port can use).
 */

import type { IncludeStore } from './IncludeStore.js';
import type { StringLocated } from './StringLocated.js';
import type { TimEnvironment } from './builtin/TimEnvironment.js';

/**
 * Upstream emits a flat line list and lets the COMMAND layer parse `<style>`
 * blocks and `skinparam` lines out of it -- both are `Command`s dispatched
 * over the SAME fully-substituted line stream as ordinary diagram-body lines
 * (`CommandStyleMultilinesCSS` / `CommandSkinParam` extend `Command`, run
 * after `TimLoader`; `TContext#addPlain` substitutes unconditionally, with
 * no verbatim carve-out -- verified live-jar: `!$ACCENT = "1a66c2"` +
 * `<style>document{BackgroundColor $ACCENT}</style>` renders `#1A66C2`).
 * plantuml-ts's `PreprocessorResult` instead carries `styles` / `skinparam`
 * as separate fields extracted by the preprocessor itself, at
 * `TContext#addPlain`'s pre-substitution interception point -- so the
 * collector must request substitution explicitly for anything it wants
 * resolved. `substitute` runs `TContext#applyFunctionsAndVariables` against
 * `memory` for the given text (falling back to the input unchanged if the
 * call consumed the rest of a line, e.g. a PROCEDURE call -- not expected
 * mid-value). The `skinparam`-value collector uses it (skin-file-loading
 * Batch 5); the `<style>`-block content collector deliberately does NOT
 * (kept raw/verbatim per `tests/unit/preprocessor.test.ts` and the
 * skin-reddress-variants mission boundary -- this is a KNOWN divergence
 * from the verified jar behavior above, not yet corrected; see
 * `plans/skin-file-loading/decision-journal.md`).
 * `TContext#addPlain` is the only point in the interpreter where a surviving
 * content line is seen raw: post-comment, post-conditional, pre-substitution.
 * Returning `true` consumes the line -- nothing is emitted for it.
 */
export type PlainLineFilter = (rawLine: StringLocated, substitute: (text: string) => string) => boolean;

export interface TContextOptions {
  /** Injected clock / RNG / file+stdlib lookups for the seam-backed builtins. */
  readonly env?: TimEnvironment;
  /** See {@link PlainLineFilter}. */
  readonly plainLineFilter?: PlainLineFilter;
  /**
   * Where `!include` / `!includesub` / `!includedef` / `!import` read their
   * content, in place of upstream's `PathSystem` + filesystem. Omitted -> the
   * empty store: every include is an unresolved-path error (see
   * `IncludeStore.ts` -- the seam is deliberately loud, never a silent skip).
   */
  readonly includeStore?: IncludeStore | undefined;
}
