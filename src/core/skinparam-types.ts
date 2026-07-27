/**
 * Shared public types for the skinparam resolution pipeline.
 *
 * Split out of skinparam.ts (which re-exports both) purely to keep that file
 * under the project's 500-line file-size cap — see skinparam.ts's own doc
 * comment for the full module map.
 */

import type { Theme } from './theme.js';

export interface SkinparamResult {
  theme: Theme;
  unknown: string[];
}

/**
 * Hierarchical style map produced by parseStyleBlock.
 *
 * Outer key: dot-separated lowercase selector path (e.g. "actor",
 *   "actor.business", "" for top-level bare declarations).
 * Inner key: lowercased property name.
 * Inner value: trimmed value string (trailing ";" stripped).
 */
export type StyleMap = Map<string, Map<string, string>>;
