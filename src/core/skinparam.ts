/**
 * Skinparam resolution pipeline for plantuml-ts.
 *
 * Provides two public entry points:
 *   - resolveSkinparam: maps a raw skinparam map onto a Theme
 *   - parseStyleBlock: converts the content of a <style> block into a
 *     StyleMap with hierarchical selector paths
 *
 * Key normalisation follows SkinParam.cleanForKeySlow in upstream
 * SkinParam.java, which is NOT a simple toLowerCase(). The exact sequence
 * is preserved here so that keys like "classArrowColor",
 * "sequenceArrowColor", and "arrowColor" all normalise to "arrowcolor".
 *
 * Module map (split out to keep every file under the project's 500-line
 * cap — every symbol below is re-exported from here so existing import
 * sites (`from '.../core/skinparam.js'`) do not need to change):
 *   - skinparam-types.ts            — SkinparamResult, StyleMap
 *   - skinparam-key-normalize.ts    — resolveColor, normaliseKey
 *   - skinparam-element-buckets.ts  — ELEMENT_BUCKET_SNAMES + per-element
 *                                     key matchers (color/font-size/shadowing)
 *   - skinparam-accumulator.ts      — mutable SkinparamAccumulator threaded
 *                                     through key processing
 *   - skinparam-stereo-keys.ts      — `<<stereotype>>`-qualified key handling
 *   - skinparam-key-handlers.ts     — table-driven dispatch for the rest of
 *                                     the (non stereotype-qualified) keys
 *   - skinparam-theme-builder.ts    — builds the final Partial<Theme> from
 *                                     the accumulator
 *   - skinparam-style-block.ts      — parseStyleBlock and its helpers
 */

import { deepMergeTheme } from './theme.js';
import type { Theme } from './theme.js';
import { createSkinparamAccumulator } from './skinparam-accumulator.js';
import { applyStereoOverride } from './skinparam-stereo-keys.js';
import { applyNormalKey } from './skinparam-key-handlers.js';
import { buildThemePartial } from './skinparam-theme-builder.js';
import { normaliseKey } from './skinparam-key-normalize.js';
import type { SkinparamResult } from './skinparam-types.js';

export type { SkinparamResult, StyleMap } from './skinparam-types.js';
export { resolveColor } from './skinparam-key-normalize.js';
export { ELEMENT_BUCKET_SNAMES } from './skinparam-element-buckets.js';
export { parseStyleBlock } from './skinparam-style-block.js';

/**
 * Map a raw skinparam key→value map onto a Theme, returning both the merged
 * Theme and a list of any keys that could not be mapped.
 *
 * The caller supplies a `base` Theme; matched keys are merged on top via
 * deepMergeTheme. Unmatched keys and stereotype-qualified keys (containing
 * "<<") are collected in `unknown[]` — they do not cause errors.
 *
 * Key normalisation follows SkinParam.cleanForKeySlow (see normaliseKey).
 */
export function resolveSkinparam(
  skinparams: ReadonlyMap<string, string>,
  base: Theme,
): SkinparamResult {
  const acc = createSkinparamAccumulator();

  for (const [rawKey, value] of skinparams) {
    const key = normaliseKey(rawKey);
    // Stereotype-qualified keys are unsupported for MOST properties -- Theme
    // has no general stereotype concept -- EXCEPT the handful modeled by
    // applyStereoOverride (see skinparam-stereo-keys.ts's own doc comment).
    if (key.includes('<<')) {
      applyStereoOverride(acc, key, value);
      continue;
    }
    applyNormalKey(acc, key, value);
  }

  const partial = buildThemePartial(acc);
  const theme = deepMergeTheme(base, partial);
  return { theme, unknown: acc.unknown };
}
