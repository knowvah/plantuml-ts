/**
 * T9: the grouping `&` PARALLEL marker (`CommandGrouping.java:66`, the
 * `(&[%s]*)?` group ahead of TYPE). Per D4 it is parsed and stored on
 * `FrameEvent.parallel` but never drawn -- every consumer of
 * `GroupingStart.isParallel()` lives under `sequencediagram/teoz/`
 * (`teoz/GroupingTile.java:145,864`), and upstream's classic renderer
 * ignores it too, so a `&`-prefixed group must render IDENTICALLY to the
 * same group without the `&`.
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

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
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

  it('draws a `&`-prefixed group EXACTLY as it would without the `&` (D4)', () => {
    const withParallel = [
      '@startuml',
      'Alice -> Bob: hello',
      '& opt message received',
      'Bob -> Alice: ok',
      'end',
      '@enduml',
    ].join('\n');
    const without = withParallel.replace('& opt message received', 'opt message received');
    expect(renderSync(withParallel)).toBe(renderSync(without));
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
    const frame = firstFrame([
      'alt first case',
      'Alice -> Bob: a',
      'else #eee other case',
      'Alice -> Bob: b',
      'end',
    ]);
    expect(frame.branchLabels).toEqual(['first case', 'other case']);
    expect(frame.branchColors).toEqual([undefined, '#eee']);
  });

  it('`also` carries the same color grammar as `else`', () => {
    const frame = firstFrame([
      'alt first case',
      'Alice -> Bob: a',
      'also #0f0 other case',
      'Alice -> Bob: b',
      'end',
    ]);
    expect(frame.branchLabels).toEqual(['first case', 'other case']);
    expect(frame.branchColors).toEqual([undefined, '#0f0']);
  });

  it('index 0 of branchColors is the frame\'s own COLORS-index-1 value', () => {
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
    const frame = firstFrame([
      'alt first case',
      'Alice -> Bob: a',
      'else other case',
      'Alice -> Bob: b',
      'end',
    ]);
    expect(frame.branchColors).toEqual([undefined, undefined]);
  });

  it('reaches branchSeparators[0].backColorGeneral after layout (D10 end-to-end)', () => {
    const ast = parse([
      'alt first case',
      'Alice -> Bob: a',
      'else #eee other case',
      'Alice -> Bob: b',
      'end',
    ]);
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

  it('`group Alpha [beta]` rewrites the header to "Alpha"', () => {
    const frame = firstFrame(['group Alpha [beta]', 'Alice -> Bob: hi', 'end']);
    // The bracket body ("beta") is not separately retrievable from
    // FrameEvent -- see the GAP comment on `resolveGroupLabel` in
    // command-grouping.ts. Only the header rewrite is asserted here.
    expect(frame.label).toBe('Alpha');
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
