/**
 * Object member separator spacing round-trip.
 *
 * Upstream never reconstructs a member's display text: `Member`'s constructor
 * stores the raw line verbatim (only `StringUtils.trin`-trimmed at the ends
 * and guillemet-managed) and `getDisplay(false)` hands that same string back,
 * so `a=1` renders as `a=1` and `a  =  1` keeps both runs of spaces
 * (`cucadiagram/Member.java`, constructor + `getDisplayWithoutVisibilityChar`).
 *
 * This port structures `name = value` into `name`/`type` instead, so it has to
 * carry the source separator to reconstruct faithfully — exactly the mechanism
 * `Member.typeSeparator` already provides on the class path (G2 N31), with the
 * object path's own canonical form (`' = '`) collapsing to "absent".
 *
 * Found by SI20's T0 while resolving ADR-2 and filed as a backlog item there:
 * it is invisible to every DOT gate, because `DeterministicMeasurer` measures
 * a space as width 0, so only the SVG `<text>` content differs.
 *
 * **These tests are the ONLY guard on this behavior, and that is not a gap
 * anyone should try to close with an oracle fixture.** The code review
 * proposed adding one so the DOT-parity ratchet would cover the path; it was
 * authored (`oracle/goldens/object/si20-member-separator-spacing`) and the
 * experiment run: with the fix reverted, that fixture still PASSES. The
 * ratchet compares structure and geometry, and a zero-width space changes
 * neither, so the emitted DOT is byte-identical with the bug present. The
 * fixture was kept for what it does guard -- election and port ids on members
 * carrying non-canonical separators -- but it cannot observe the spacing
 * itself. Delete these unit tests and the behavior becomes unguarded.
 *
 * Goes through `parseClass` rather than importing `parseObjectField` directly:
 * loading `class-object-commands.js` first trips the command-registry import
 * cycle (`OBJECT_COMMANDS is not iterable`).
 *
 * @see ~/git/plantuml/.../cucadiagram/Member.java (constructor)
 * @see .agent-notes/si20-object-body-is-bodyenhanced1.md
 */

import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { formatObjectMemberText } from '../../../src/diagrams/class/class-object-fields.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { Member } from '../../../src/diagrams/class/ast.js';

/** The members of a one-object diagram whose body is `fieldLines`. */
function membersOf(...fieldLines: string[]): Member[] {
  const lines = ['object AA {', ...fieldLines, '}'];
  const block: UmlSource = { lines, type: 'class' };
  const ast = parseClass(block);
  const aa = ast.classifiers.find((c) => c.id === 'AA');
  if (aa === undefined) throw new Error('Expected classifier "AA"');
  return aa.members;
}

/** What upstream's `getDisplay(false)` would return for a single body line. */
function displayOf(line: string): string {
  const members = membersOf(line);
  if (members.length !== 1) throw new Error(`Expected 1 member for "${line}", got ${members.length}`);
  return formatObjectMemberText(members[0]!);
}

describe('object member separator spacing round-trips (getDisplay(false))', () => {
  it('preserves a tight `=` rather than canonicalizing it to " = "', () => {
    expect(displayOf('a=1')).toBe('a=1');
  });

  it('preserves asymmetric spacing on either side of the `=`', () => {
    expect(displayOf('a= 1')).toBe('a= 1');
    expect(displayOf('a =1')).toBe('a =1');
  });

  it('preserves a widened separator verbatim — trin trims only the ends', () => {
    expect(displayOf('a  =  1')).toBe('a  =  1');
  });

  it('leaves the canonical " = " spelling untouched', () => {
    expect(displayOf('a = 1')).toBe('a = 1');
  });

  it('still strips the visibility character, per Member.java:129-136', () => {
    expect(displayOf('-alpha=1')).toBe('alpha=1');
  });

  it('keeps the parsed name/type split intact regardless of spacing', () => {
    const [member] = membersOf('a=1');
    expect(member!.name).toBe('a');
    expect(member!.type).toBe('1');
  });

  it('leaves a bare name — which has no separator — alone', () => {
    expect(displayOf('alpha')).toBe('alpha');
  });
});
