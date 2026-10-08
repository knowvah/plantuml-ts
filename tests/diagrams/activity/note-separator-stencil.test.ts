/**
 * add4 merge-T1c regression: a note whose body holds a creole `----`
 * separator, once its box is sized by the creole Sheet (add4-T1c), is
 * drawn by `renderNoteLabel` through the Sheet. Upstream wraps that Sheet in
 * `SheetBlock2(sheet1, Stencil, UStroke.simple())`
 * (`FtileWithNotes.java:122-130`), so `SheetBlock2#drawU` installs
 * `UGraphicStencil` and the separator's `UHorizontalLine` becomes a `ULine`
 * spanning the stencil (`UGraphicStencil.java:83`). Without the stencil the
 * SVG UGraphic throws "No driver registered for shape UHorizontalLine"
 * (it was `dot-cache/unknown/tuvigo-52-redo102`'s routing regression).
 */
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SOURCE = [
  '@startuml',
  'partition P {',
  'note left',
  ' A1',
  ' ----',
  ' A2',
  'end note',
  ':Ready;',
  '}',
  '@enduml',
].join('\n');

describe('activity note `----` separator (FtileWithNotes.java:122-130 stencil)', () => {
  const svg = renderSync(SOURCE, { measurer: new DeterministicMeasurer() });

  it('renders an ACTIVITY diagram, not the error page', () => {
    expect(/data-diagram-type="([A-Z]+)"/.exec(svg)?.[1]).toBe('ACTIVITY');
  });

  it('draws the separator as the jar does: a ULine across the stencil, in the border colour', () => {
    // Jar render of SOURCE via scripts/oracle-render.sh (deterministic text):
    // <line x1="36" y1="76" x2="72.925" y2="76" style="stroke:#181818;stroke-width:1;"/>
    // -- x from the stencil's -6 / getEndingX + 15 (FtileWithNotes.java:125,129)
    // around the note text at marginX1 6, colour from Opale.java:107.
    expect(svg).toContain('<line x1="36" y1="76" x2="72.925" y2="76" style="stroke:#181818;stroke-width:1;"/>');
  });
});
