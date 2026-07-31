/**
 * Scan a diagram source for the `<$name>` sprite references it contains.
 *
 * Mission si11b-bootstrap-sprite-splitting, ADR-4: sprites are registered at
 * PARSE time by `matchSpriteCommand` (`sprite-commands.ts`), and lookup
 * (`getSprite`) is a synchronous `Map.get` -- `renderSync` must stay
 * synchronous, so there is no `await` at lookup and per-sprite loading
 * cannot be demand-driven. It must instead be driven by scanning the source
 * BEFORE parse, during the async prefetch walk (where `!include` is already
 * resolved), and fetching only the fragments the scan finds.
 *
 * This module is built in isolation -- nothing routes through it yet (a
 * later task wires it into the prefetch walk). It reuses
 * `creole-atoms.ts#SPRITE_PATTERN_SOURCE` (the SAME pattern
 * `scanLineForAtoms` uses to recognize `<$sprite>` markup, itself a port of
 * `Splitter.spritePattern`, Splitter.java:74) rather than deriving a second
 * regex: two answers to "what is a sprite reference?" is how this port
 * drifts from the jar.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/Splitter.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteUtils.java
 */

import { SPRITE_PATTERN_SOURCE } from './creole-atoms.js';

/**
 * Distinct sprite names `source` references via `<$name>` markup (including
 * the forced-color `<#RRGGBB$name>` and scale/color-block forms), without
 * the leading `$`, lowercased and deduplicated -- names are matched
 * case-insensitively against the stdlib split manifest, which is entirely
 * lowercase (ADR-3).
 *
 * Never throws. A source with no sprite references yields an empty set. The
 * regex has no unbounded backtracking construct (no nested quantifiers over
 * the same character class), so pathological input degrades linearly, not
 * catastrophically.
 *
 * @see creole-atoms.ts#SPRITE_PATTERN_SOURCE -- the single source of truth
 * for what a sprite reference atom looks like.
 */
export function scanSpriteNames(source: string): ReadonlySet<string> {
  const names = new Set<string>();
  const pattern = new RegExp(SPRITE_PATTERN_SOURCE, 'gu');
  let match = pattern.exec(source);
  while (match !== null) {
    const name = match[2];
    if (name !== undefined) names.add(name.toLowerCase());
    if (match[0].length === 0) pattern.lastIndex += 1;
    match = pattern.exec(source);
  }
  return names;
}
