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
import { renderSync } from '../../../src/index.js';
import type { FrameEvent, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';

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
