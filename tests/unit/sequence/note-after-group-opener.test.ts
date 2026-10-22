/**
 * sdd2 T7k -- a note written straight after a group opener belongs to the
 * `EventWithNote` before the frame (`GroupingStart.java:48`,
 * `SequenceDiagram.java:154-158`). Expected canvases are the jar's, rendered
 * with `scripts/oracle-render.sh` (2026-10-21).
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const render = (body: string): string =>
  renderFixtureSequence(`@startuml\nparticipant A\nparticipant B\n${body}\n@enduml`, new DeterministicMeasurer());

describe('note right after `alt x`', () => {
  it('draws beside the previous message, outside the frame: jar 134x200', () => {
    expect(render('A -> B : hi\nalt x\nnote right : n\nA -> B : in\nend')).toContain('width="134px" height="200px"');
  });

  it('climbs out of two openers to an owner in the outer branch: jar 178x270', () => {
    const svg = render('A -> B : hi\nalt a\nA -> B : in\nalt b\nnote right : n\nA -> B : in2\nend\nend');
    expect(svg).toContain('width="178px" height="270px"');
  });

  it('is dropped when no event precedes the frame: jar 134x167', () => {
    expect(render('alt a\nnote right : n\nA -> B : in\nend')).toContain('width="134px" height="167px"');
  });

  it('skips a delay between the owner and the frame: jar 139x239', () => {
    const svg = render('A -> B : hi\n... delay ...\nopt o\nnote right : n\nA -> B : in\nend');
    expect(svg).toContain('width="139px" height="239px"');
  });
});
