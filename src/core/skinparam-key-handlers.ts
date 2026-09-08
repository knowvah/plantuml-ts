/**
 * Table-driven dispatch for normalized (non stereotype-qualified) skinparam
 * keys — the body of upstream SkinParam.java's key switch.
 *
 * Split out of skinparam.ts to keep that file under the project's 500-line
 * file-size cap — see skinparam.ts's own doc comment for the full module
 * map. Every entry below is a 1:1, behavior-preserving port of the
 * corresponding `case` arm from the original inline switch; a switch on
 * string equality has no order-dependence between distinct case labels, so
 * collecting them into a `Map` is safe regardless of table order.
 *
 * The 73-entry key->handler table itself (plus the `KeyHandler` type and
 * its shared parse helpers) is further split across three sibling modules
 * to stay under this project's 500-line cap — the table alone formats to
 * 527 lines:
 *   - `skinparam-key-handlers-shared.ts` — the `KeyHandler` type + parse
 *     helpers, shared by both table halves.
 *   - `skinparam-key-handlers-table-a.ts` / `-table-b.ts` — the table
 *     itself, split at an entry boundary (never inside an entry). SOURCE
 *     ORDER IS LOAD-BEARING (see below), so `KEY_HANDLERS` below
 *     concatenates the two halves in their ORIGINAL order,
 *     `[...KEY_HANDLERS_A, ...KEY_HANDLERS_B]` — never reordered, sorted,
 *     or deduped.
 * This file keeps the map assembly, the element-scoped colour/font-size/
 * shadowing bucket fallback, and `applyNormalKey` — the sole export,
 * imported only by `skinparam.ts`.
 */

import { parseColor } from './paint.js';
import type { SkinparamAccumulator } from './skinparam-accumulator.js';
import {
  matchElementColorKey,
  matchElementFontSizeKey,
  matchElementShadowingKey,
  matchStereotypeSpotColorKey,
  parseShadowingValue,
} from './skinparam-element-buckets.js';
import { resolveColor } from './skinparam-key-normalize.js';
import type { KeyHandler } from './skinparam-key-handlers-shared.js';
import { KEY_HANDLERS_A } from './skinparam-key-handlers-table-a.js';
import { KEY_HANDLERS_B } from './skinparam-key-handlers-table-b.js';

// ---------------------------------------------------------------------------
// Key → handler table
// ---------------------------------------------------------------------------

// SI26 D4 (source-order load-bearing, see this file's own doc comment):
// concatenated in ORIGINAL order, half A then half B — never reordered.
const KEY_HANDLERS: ReadonlyArray<readonly [keys: readonly string[], handler: KeyHandler]> = [
  ...KEY_HANDLERS_A,
  ...KEY_HANDLERS_B,
];

const KEY_HANDLER_MAP: ReadonlyMap<string, KeyHandler> = new Map(
  KEY_HANDLERS.flatMap(([keys, handler]) => keys.map((k) => [k, handler] as const)),
);

/**
 * Element-scoped color (e.g. `databaseBackgroundColor`) → per-element
 * bucket via parseColor (gradients become a Gradient Paint). D1/D4.
 * Returns whether `key` matched (and was applied).
 */
function tryElementColorBucket(acc: SkinparamAccumulator, key: string, value: string): boolean {
  const elem = matchElementColorKey(key) ?? matchStereotypeSpotColorKey(key);
  if (elem === undefined) return false;
  const bucket = (acc.elements[elem.sname] ??= {});
  bucket[elem.role] = parseColor(value);
  return true;
}

/**
 * Element-scoped font size (`<sname>FontSize` / `<sname>StereotypeFontSize`)
 * → per-element bucket, numeric. G1 I4b. Returns whether `key` matched AND
 * carried a finite numeric value (a match with an invalid value is treated
 * as unhandled, matching the original switch's fallthrough).
 */
function tryElementFontSizeBucket(acc: SkinparamAccumulator, key: string, value: string): boolean {
  const fontElem = matchElementFontSizeKey(key);
  if (fontElem === undefined) return false;
  const size = Number(value);
  if (!Number.isFinite(size)) return false;
  const bucket = (acc.elements[fontElem.sname] ??= {});
  bucket[fontElem.role] = size;
  return true;
}

/**
 * `<sname>Shadowing` → per-element bucket. Jar-verified malado-53-noso561.
 * Returns whether `key` matched AND carried a parseable shadowing value.
 */
function tryElementShadowingBucket(acc: SkinparamAccumulator, key: string, value: string): boolean {
  const shadowElem = matchElementShadowingKey(key);
  if (shadowElem === undefined) return false;
  const parsedShadow = parseShadowingValue(value);
  if (parsedShadow === undefined) return false;
  const bucket = (acc.elements[shadowElem.sname] ??= {});
  bucket.shadowing = parsedShadow;
  return true;
}

/**
 * Fallback for a normalized key that matched no {@link KEY_HANDLER_MAP}
 * entry: tries each generic per-element bucket matcher in turn. Mirrors the
 * original switch `default` arm's exact fallthrough shape — a font-size
 * match that fails its own numeric guard falls through to the shadowing
 * matcher rather than short-circuiting to `unknown` immediately.
 */
function applyElementBucketFallback(acc: SkinparamAccumulator, key: string, value: string): void {
  if (tryElementColorBucket(acc, key, value)) return;
  if (tryElementFontSizeBucket(acc, key, value)) return;
  if (tryElementShadowingBucket(acc, key, value)) return;
  acc.unknown.push(key);
}

/**
 * Applies a single normalized, non stereotype-qualified skinparam key/value
 * pair to `acc`. Table lookup first; on a miss, delegates to the generic
 * per-element bucket fallback (see {@link applyElementBucketFallback}).
 */
export function applyNormalKey(acc: SkinparamAccumulator, key: string, value: string): void {
  const handler = KEY_HANDLER_MAP.get(key);
  if (handler !== undefined) {
    handler(acc, value, resolveColor(value));
    return;
  }
  applyElementBucketFallback(acc, key, value);
}
