/**
 * T9: the grouping `&` PARALLEL marker (`CommandGrouping.java:66`, the
 * `(&[%s]*)?` group ahead of TYPE), stored on `FrameEvent.parallel`. The jar
 * is always teoz (`SequenceDiagram.java:311-312`), whose `GroupingTile` starts
 * a parallel group at the previous tile's gauge MIN (`teoz/GroupingTile.java
 * :145-154`) -- sdd2 T3c retired T9's D4 ("drawn as without the `&`"), which
 * rested on the dead classic renderer.
 *
 * @see ~/git/plantuml/.../sequencediagram/command/CommandGrouping.java:55-90
 */
import { describe, expect, it } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { renderSync } from '../../../src/index.js';
import type { FrameEvent, FrameGeo, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(sequenceSource(lines));
  if ('refused' in result) {
    throw new Error(`parseSequence refused (${result.kind}) at line ${String(result.line)}: ${result.message}`);
  }
  return result;
}

function firstFrame(lines: string[]): FrameEvent {
  const ast = parse(lines);
  const ev = ast.events.find((e): e is FrameEvent => e.kind === 'frame');
  if (!ev) throw new Error('Expected frame event');
  return ev;
}

describe('grouping PARALLEL (`&`)', () => {
  it('parses `& opt` and carries `parallel: true`', () => {
    const frame = firstFrame(['Alice -> Bob: hi', '& opt message received', 'end']);
    expect(frame.frameType).toBe('opt');
    expect(frame.parallel).toBe(true);
  });

  it('parses `&opt` with no space between the marker and the TYPE keyword', () => {
    // `(&[%s]*)?` allows zero spaces (`CommandGrouping.java:66`).
    const frame = firstFrame(['Alice -> Bob: hi', '&opt test', 'end']);
    expect(frame.frameType).toBe('opt');
    expect(frame.parallel).toBe(true);
  });

  it('parses `& alt` and `& loop` the same way', () => {
    expect(firstFrame(['Alice -> Bob: hi', '& alt condition', 'end']).parallel).toBe(true);
    expect(firstFrame(['Alice -> Bob: hi', '& loop forever', 'end']).parallel).toBe(true);
  });

  it('leaves `parallel` unset when there is no `&` prefix', () => {
    const frame = firstFrame(['Alice -> Bob: hi', 'opt message received', 'end']);
    expect(frame.frameType).toBe('opt');
    expect(frame.parallel).toBeUndefined();
  });

  it('still captures the frame label after a `&` prefix', () => {
    const frame = firstFrame(['Alice -> Bob: hi', '& alt this is the condition', 'end']);
    expect(frame.label).toBe('this is the condition');
    expect(frame.branchLabels).toEqual(['this is the condition']);
  });

  it("starts a `&`-prefixed group at the previous tile's min, beside it (GroupingTile.java:145-154)", () => {
    // `firstY = parallel ? currentY.getMin() : previousMax`: beside the message,
    // the frame starts where the message's own tile does -- where it would as
    // the diagram's first tile.
    const frameY = (lines: string[]): number =>
      layoutSequence(
        parse(['participant Alice', 'participant Bob', ...lines]),
        defaultTheme,
        new FixedMeasurer(7, 14),
      ).events.find((e): e is FrameGeo => e.kind === 'frame')!.y;
    const beside = frameY(['Alice -> Bob: hello', '& opt message received', 'Bob -> Alice: ok', 'end']);
    const first = frameY(['opt message received', 'Bob -> Alice: ok', 'end']);
    const below = frameY(['Alice -> Bob: hello', 'opt message received', 'Bob -> Alice: ok', 'end']);
    expect(beside).toBe(first);
    expect(below).toBeGreaterThan(beside);
    // `renderSync` still draws it: the `&` changes placement, not content.
    expect(
      renderSync(['@startuml', 'Alice -> Bob: hello', '& opt m', 'Bob -> Alice: ok', 'end', '@enduml'].join('\n')),
    ).toContain('opt');
  });
});

// T2: `groupingCommand`'s `COLORS` capture (`CommandGrouping.java:64-73`,
// `executeArg:134-135`) -- index 0 (no space, attaches directly to TYPE) is
// `backColorElement`, index 1 (space-separated) is `backColorGeneral`.
describe('grouping COLORS', () => {
  it('a space-separated color is backColorGeneral, not backColorElement', () => {
    const frame = firstFrame(['group #ffa G1', 'Alice -> Bob: hi', 'end']);
    expect(frame.backColorGeneral).toBe('#ffa');
    expect(frame.backColorElement).toBeUndefined();
  });

  it('a color directly attached to TYPE (no space) is backColorElement', () => {
    const frame = firstFrame(['group#ffa G1', 'Alice -> Bob: hi', 'end']);
    expect(frame.backColorElement).toBe('#ffa');
    expect(frame.backColorGeneral).toBeUndefined();
  });

  it('both colors together: element then general', () => {
    const frame = firstFrame(['group#eee #ffa G1', 'Alice -> Bob: hi', 'end']);
    expect(frame.backColorElement).toBe('#eee');
    expect(frame.backColorGeneral).toBe('#ffa');
  });

  it('leaves both colors unset when the line carries none', () => {
    const frame = firstFrame(['opt condition', 'Alice -> Bob: hi', 'end']);
    expect(frame.backColorElement).toBeUndefined();
    expect(frame.backColorGeneral).toBeUndefined();
  });
});

// T2/D10: `elseCommand`'s COLORS-index-1 capture, index-aligned with
// `branchLabels` via `FrameEvent.branchColors`.
describe('else COLORS', () => {
  it('a space-separated color on `else` is captured without the label absorbing it', () => {
    const frame = firstFrame(['alt first case', 'Alice -> Bob: a', 'else #eee other case', 'Alice -> Bob: b', 'end']);
    expect(frame.branchLabels).toEqual(['first case', 'other case']);
    expect(frame.branchColors).toEqual([undefined, '#eee']);
  });

  it('`also` carries the same color grammar as `else`', () => {
    const frame = firstFrame(['alt first case', 'Alice -> Bob: a', 'also #0f0 other case', 'Alice -> Bob: b', 'end']);
    expect(frame.branchLabels).toEqual(['first case', 'other case']);
    expect(frame.branchColors).toEqual([undefined, '#0f0']);
  });

  it("index 0 of branchColors is the frame's own COLORS-index-1 value", () => {
    const frame = firstFrame([
      'alt #ffa first case',
      'Alice -> Bob: a',
      'else #eee other case',
      'Alice -> Bob: b',
      'end',
    ]);
    expect(frame.branchColors).toEqual(['#ffa', '#eee']);
  });

  it('an else branch with no color leaves that index undefined', () => {
    const frame = firstFrame(['alt first case', 'Alice -> Bob: a', 'else other case', 'Alice -> Bob: b', 'end']);
    expect(frame.branchColors).toEqual([undefined, undefined]);
  });

  it('reaches branchSeparators[0].backColorGeneral after layout (D10 end-to-end)', () => {
    const ast = parse(['alt first case', 'Alice -> Bob: a', 'else #eee other case', 'Alice -> Bob: b', 'end']);
    const measurer = new FixedMeasurer(8, 16);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const frameGeo = geo.events.find((e): e is FrameGeo => e.kind === 'frame');
    expect(frameGeo?.branchSeparators[0]?.backColorGeneral).toBe('#eee');
  });
});

// T2: `group`'s header-rewrite (`CommandGrouping.java:139-149`).
describe('group header rewrite', () => {
  it('a bare `group` with no comment gets the literal "group" label', () => {
    const frame = firstFrame(['group', 'Alice -> Bob: hi', 'end']);
    expect(frame.label).toBe('group');
  });

  it('a plain comment (no brackets) is left unchanged', () => {
    const frame = firstFrame(['group G1', 'Alice -> Bob: hi', 'end']);
    expect(frame.label).toBe('G1');
  });

  it('`group Alpha [beta]` rewrites the title to "Alpha " and the comment to "beta"', () => {
    const frame = firstFrame(['group Alpha [beta]', 'Alice -> Bob: hi', 'end']);
    // `type = m.group(1)`, `comment = m.group(2)` (`CommandGrouping.java:
    // 143-148`): group 1 keeps the space before the bracket.
    expect(frame.title).toBe('Alpha ');
    expect(frame.label).toBe('beta');
    expect(frame.branchLabels[0]).toBe('beta');
  });

  it('`group [beta]` rewrites the title to the empty string', () => {
    const frame = firstFrame(['group [beta]', 'Alice -> Bob: hi', 'end']);
    expect(frame.title).toBe('');
    expect(frame.label).toBe('beta');
  });

  it('keeps no title for a group the pattern does not rewrite', () => {
    expect(firstFrame(['group G1', 'Alice -> Bob: hi', 'end']).title).toBeUndefined();
    expect(firstFrame(['alt Alpha [beta]', 'Alice -> Bob: hi', 'end']).title).toBeUndefined();
  });

  it('frameType stays the ORIGINAL "group" token, never the rewritten header', () => {
    const frame = firstFrame(['group Alpha [beta]', 'Alice -> Bob: hi', 'end']);
    expect(frame.frameType).toBe('group');
  });

  it('bracket rewriting does not apply to non-group frame types', () => {
    const frame = firstFrame(['alt Alpha [beta]', 'Alice -> Bob: hi', 'end']);
    expect(frame.label).toBe('Alpha [beta]');
  });
});
