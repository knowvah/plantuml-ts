/**
 * Construction-time seams for {@link TContext}. Both are plantuml-ts additions
 * with no upstream counterpart (upstream's `TContext` constructor takes a
 * `PathSystem` / `Defines` / `Charset` / `DefinitionsContainer` instead, none
 * of which a browser-safe, synchronous port can use).
 */

import type { IncludeStore } from './IncludeStore.js';
import type { TimEnvironment } from './builtin/TimEnvironment.js';

export interface TContextOptions {
  /** Injected clock / RNG / file+stdlib lookups for the seam-backed builtins. */
  readonly env?: TimEnvironment;
  /**
   * Where `!include` / `!includesub` / `!includedef` / `!import` read their
   * content, in place of upstream's `PathSystem` + filesystem. Omitted -> the
   * empty store: every include is an unresolved-path error (see
   * `IncludeStore.ts` -- the seam is deliberately loud, never a silent skip).
   */
  readonly includeStore?: IncludeStore | undefined;
}
