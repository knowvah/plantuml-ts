/**
 * cdd4-T6b: a wide-label PORT's corner is its `PORT="P"` cell polygon's min XY
 * (`DotStringFactory.java:389-395`: `extractList(POINTS_EQUALS)` after the
 * node's `<title>`, `getMinXY`, `moveDelta`). Graphviz does not keep that cell
 * at its FIXEDSIZE 12: the COLSPAN=3 spacer rows (`WIDTH=fullWidth`,
 * `SvekNode.java:189-204`) widen all three spanned columns by the same amount
 * (`htmltable.c set_cell_widths`, step 3), and the widened column width is
 * applied back to the cell. Measured under real `dot -Tsvg` on the bare table:
 * fullWidth 41 -> cell 21.66 wide, 59 -> 27.66, 120 -> 48, 12 -> 12.
 */
import { describe, it, expect } from 'vitest';

import { cornerSize } from '../../../src/core/graph-layout-node-corner.js';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { DotInputNode } from '../../../src/core/graph-layout.types.js';

const port = (portPad: number): DotInputNode => ({
  id: 'p',
  width: 12,
  height: 12,
  shape: 'plaintext',
  isPort: true,
  portPad,
});

describe('cornerSize -- wide-label port cell (htmltable.c set_cell_widths)', () => {
  it.each([
    [41, 12 + 29 / 3],
    [59, 12 + 47 / 3],
    [120, 48],
  ])('fullWidth %d widens the 12px cell to %f', (pad, w) => {
    const [cw, ch] = cornerSize(port(pad), 12, 12);
    expect(cw).toBeCloseTo(w, 10);
    expect(ch).toBe(12);
  });

  it('a spacer no wider than the cell leaves it at its own width', () => {
    expect(cornerSize(port(10), 12, 12)).toEqual([12, 12]);
  });

  it('a plain-rect port (no table) keeps its declared box', () => {
    const rect: DotInputNode = { id: 'p', width: 12, height: 12, shape: 'rect', isPort: true };
    expect(cornerSize(rect, 12, 12)).toEqual([12, 12]);
  });
});

describe('sokevu-87-toce485 -- port rects sit on the cell polygon, as the jar draws them', () => {
  it('draws firstportname at 93.17 and name-with-dash at 191.17 (jar in.svg)', () => {
    const svg = renderSync(
      [
        '@startuml',
        'interface i',
        'node n {',
        '  port p',
        '  port firstportname',
        '  port "name-with-dash" as nwd',
        '}',
        '',
        'i --> p',
        'i --> firstportname',
        'i --> nwd',
        'nwd --> firstportname',
        '@enduml',
      ].join('\n'),
      { measurer: new DeterministicMeasurer() },
    );
    expect(svg).toMatch(/>firstportname<\/text><rect x="93\.17" y="113" width="12" height="12"/);
    expect(svg).toMatch(/>name-with-dash<\/text><rect x="191\.17" y="113" width="12" height="12"/);
    // `p` is a plain `shape=rect` port (label <= 40px): no table, no shift.
    expect(svg).toMatch(/>p<\/text><rect x="28" y="113" width="12" height="12"/);
  });
});
