/**
 * Test helpers for the ubrex tests.
 */
import type { Challenge } from '../../../../src/core/ubrex/Challenge.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';

/** Java `List#toString()` format (`[a, b]`) for a `List<String>`. */
export function javaList(values: readonly string[]): string {
  return '[' + values.join(', ') + ']';
}

/** `getFullCaptureLength()` of `challenge` run on `text` at `position`. */
export function lengthOf(challenge: Challenge, text: string, position = 0): number {
  return challenge.runChallenge(TextNavigator.build(text), position).getFullCaptureLength();
}
