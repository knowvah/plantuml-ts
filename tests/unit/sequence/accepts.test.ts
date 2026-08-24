/**
 * `sequencePlugin.accepts()` narrowing — the arrow pattern must require
 * "arrow position", not merely the presence of arrow characters anywhere on
 * a line.
 *
 * The bug: `SEQUENCE_PATTERNS[0]` (`/->>?|-->>?/`) is context-free. It
 * matches `->`/`-->` inside a quoted string, so `object/zuvila-56-nuda425`
 * — a CLASS diagram per the jar, containing `$arrow("-->")` as a
 * `!procedure` argument in a legend — was claimed by sequence.
 *
 * Upstream's own arrow grammar (`CommandArrow.java:88-133`) never has this
 * problem: `RegexConcat.build(..., RegexLeaf.start(), ..., PART1, ...,
 * ARROW_BODYA/B, ..., PART2, ..., RegexLeaf.end())` matches the WHOLE line,
 * and a quoted PART1/PART2
 * (`CommandArrow.java:94`, `[%g]([^%g]+)[%g]`) consumes its entire quoted
 * span as ONE atomic token before the arrow leaf is ever tried — so
 * characters inside a quote are never candidates for the arrow itself.
 * `stripQuotedSpans` mirrors that: it removes `"..."` runs before testing
 * for the arrow, so a `-->` trapped inside a string literal can never
 * satisfy the pattern.
 */
import { describe, expect, it } from 'vitest';

import { sequencePlugin } from '../../../src/diagrams/sequence/index.js';
import { ARROW_STYLE_MAP } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';

describe('sequencePlugin.accepts — arrow must be in arrow position', () => {
  it('AC1: an arrow token trapped inside a quoted string is not accepted', () => {
    // Reduced from object/zuvila-56-nuda425's legend procedure argument.
    // No arrow appears outside the quotes, and no other sequence signal
    // (participant/actor/... keyword) is present on any line.
    const lines = [
      '@startuml',
      'legend',
      '!procedure $arrow($text)',
      '$arrow("-->")',
      '$arrow("-[dashed]->")',
      'endlegend',
      '@enduml',
    ];
    expect(sequencePlugin.accepts(lines)).toBe(false);
  });

  it('a line shaped identically but with the arrow OUTSIDE quotes is accepted', () => {
    // Differential control: proves AC1's false is caused by the quoting,
    // not by an unrelated guard (e.g. the descriptive-signal check)
    // suppressing every line in the fixture.
    const lines = ['@startuml', 'A -> B : "-->" is drawn like this', '@enduml'];
    expect(sequencePlugin.accepts(lines)).toBe(true);
  });

  it('AC2: A -> B : msg is accepted', () => {
    const lines = ['@startuml', 'A -> B : msg', '@enduml'];
    expect(sequencePlugin.accepts(lines)).toBe(true);
  });

  it.each(Object.keys(ARROW_STYLE_MAP))(
    'AC2: every ARROW_STYLE_MAP token (%s) is accepted in arrow position',
    (token) => {
      const lines = ['@startuml', `A ${token} B : msg`, '@enduml'];
      expect(sequencePlugin.accepts(lines)).toBe(true);
    },
  );

  it('a quoted participant name either side of a real arrow is still accepted', () => {
    const lines = ['@startuml', '"Alice" -> "Bob" : hi', '@enduml'];
    expect(sequencePlugin.accepts(lines)).toBe(true);
  });
});
