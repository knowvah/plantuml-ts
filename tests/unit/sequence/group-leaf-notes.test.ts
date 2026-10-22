/**
 * sdd2 T7h -- notes owned by a group's `GroupingLeaf` (`GroupingLeaf.java:
 * 122-128`): an `else` leaf stores its notes and nothing draws them
 * (`GroupingTile.java:1023-1041` reads the `end` leaf only); a `top`/`bottom`
 * note on any leaf adds the warning "This position is ignored: <POSITION>".
 * Expected canvases are the jar's, rendered with `scripts/oracle-render.sh`
 * (2026-10-21).
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const render = (src: string): string => renderFixtureSequence(src, new DeterministicMeasurer());
const NBSP = ' ';

describe('note after else', () => {
  it('draws nothing: the canvas is the jar 134x185, same as without the note', () => {
    const svg = render('@startuml\nalt a\nA -> B\nelse b\nnote right : n\nB -> A\nend\n@enduml');
    expect(svg).toContain('width="134px" height="185px"');
    expect(svg).not.toContain('#FEFFDD');
  });

  it('warns for top and bottom on the else and the end leaf: jar 181x225', () => {
    const svg = render('@startuml\nalt a\nA -> B\nelse b\nnote top : n\nB -> A\nend\nnote bottom : m\n@enduml');
    expect(svg).toContain('width="181px" height="225px"');
    expect(svg).toContain(`This${NBSP}position${NBSP}is${NBSP}ignored:${NBSP}TOP`);
    expect(svg).toContain(`This${NBSP}position${NBSP}is${NBSP}ignored:${NBSP}BOTTOM`);
  });
});

describe('group note widths (jar canvases, scripts/oracle-render.sh 2026-10-21)', () => {
  it('a right note after `end` widens the document by getNotesWidth(RIGHT) past the 9 margin (GroupingTile.java:984-990,1015-1021): 288, not 279', () => {
    const svg = render('@startuml\nA -> B : x\nopt o\nA -> B : y\nend\nnote right : a long note text here\n@enduml');
    expect(svg).toContain('width="288px" height="194px"');
  });

  it('a self message right note folds into a frame at the loop drawn max + note width (CommunicationTileSelfNoteRight.java:154-178): 252, not 260', () => {
    const svg = render('@startuml\nA -> B : x\nloop l\nB -> B : hi\nnote right : a long note text\nend\n@enduml');
    expect(svg).toContain('width="252px" height="207px"');
  });
});
