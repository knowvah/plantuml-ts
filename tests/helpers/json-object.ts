/**
 * Bridges between plain JS literals and the json family's ordered
 * `JsonObject` (`src/diagrams/json/JsonObject.ts`) for tests.
 */
import { JsonObject } from '../../src/diagrams/json/JsonObject.js';

/**
 * A parsed json-family value as a plain literal, for `toEqual`. A repeated
 * key collapses (last wins) -- assert duplicates on the `JsonObject` itself.
 */
export function plainOf(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(plainOf);
  if (!(value instanceof JsonObject)) return value;
  return Object.fromEntries(value.members().map(([k, v]) => [k, plainOf(v)]));
}

/** A plain literal as the `JsonObject` tree a parser would build. */
export function jsonObjectOf(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(jsonObjectOf);
  if (value === null || typeof value !== 'object') return value;
  const result = new JsonObject();
  for (const [k, v] of Object.entries(value)) result.add(k, jsonObjectOf(v));
  return result;
}
