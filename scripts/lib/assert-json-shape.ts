/**
 * Minimal shape assertions for a `JSON.parse(...) as T` baseline load at a
 * CI-gate / re-pin script's boundary (code-review-tasks.md item 5).
 *
 * These are NOT schema validators — they only confirm the parsed JSON has
 * the TOP-LEVEL shape the cast assumes (object-vs-array, and the given
 * required keys for an object). That is enough to turn a malformed,
 * renamed, or truncated baseline file into a clear error naming the file at
 * the parse site, instead of an `undefined`-property crash surfacing three
 * functions later with no indication of which file was at fault.
 */

function describeJsonValue(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `an array (length ${value.length})`;
  return typeof value;
}

/**
 * Asserts `value` is a non-null, non-array object carrying every key in
 * `requiredKeys`. Throws an `Error` naming `filePath` otherwise.
 *
 * Deliberately does NOT narrow `value`'s type (no `asserts value is T`): the
 * caller's own baseline interfaces have concretely-typed fields that a
 * generic `Record<string, unknown>` predicate cannot structurally satisfy,
 * which would force an intermediate `Record<string, unknown>` cast at every
 * call site instead of the existing single `as T`. Call this, then cast the
 * still-`unknown` value as usual.
 */
export function assertJsonObjectShape(value: unknown, filePath: string, requiredKeys: readonly string[]): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${filePath}: expected a JSON object, got ${describeJsonValue(value)}`);
  }
  const missing = requiredKeys.filter((key) => !(key in value));
  if (missing.length > 0) {
    throw new Error(`${filePath}: JSON object is missing required key(s): ${missing.join(', ')}`);
  }
}

/** Asserts `value` is a JSON array. Throws an `Error` naming `filePath` otherwise. */
export function assertJsonArrayShape(value: unknown, filePath: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${filePath}: expected a JSON array, got ${describeJsonValue(value)}`);
  }
}
