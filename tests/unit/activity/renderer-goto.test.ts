/**
 * add4-T3d (GOTO-LINES): `UGraphicDispatchFtile` records each `FtileLabel`'s
 * translate as it is drawn and, on drawing an `FtileGoto`, draws
 * `ULine.hline(dx)` then `ULine.vline(dy)` from the goto's point-in to the
 * recorded label position (`UGraphicDispatchFtile.java:78-85,101-119`).
 * Expected values come from the jar's own SVG for `gunuki-27-nixu177`
 * (label at 37.663,53; goto at 37.663,172) and `nuvumi-83-tose343` (label at
 * 81.938,53; goto at 37.663,206).
 */
import { describe, expect, it } from 'vitest';
import { renderNodesDispatchingGotos } from '../../../src/diagrams/activity/activity-renderer-terminals.js';
import type { ActivityNodeGeo } from '../../../src/diagrams/activity/activity-geometry.types.js';
import { deepMergeTheme, resolveTheme } from '../../../src/core/theme.js';

const theme = resolveTheme('default');
const LINE_STYLE = 'stroke="#181818" stroke-width="1"';

function zeroNode(kind: 'label' | 'goto', name: string, x: number, y: number): ActivityNodeGeo {
  return { id: `${kind}-${name}-${y}`, kind, label: name, x, y, width: 0, height: 0 };
}

describe('renderNodesDispatchingGotos', () => {
  it('draws a zero hline then the vline up to a label drawn earlier (gunuki)', () => {
    const out = renderNodesDispatchingGotos(
      [zeroNode('label', 'lab1', 37.663, 53), zeroNode('goto', 'lab1', 37.663, 172)],
      theme,
    );
    expect(out).toEqual([
      '',
      `<line x1="37.663" y1="172" x2="37.663" y2="172" ${LINE_STYLE}/>` +
        `<line x1="37.663" y1="53" x2="37.663" y2="172" ${LINE_STYLE}/>`,
    ]);
  });

  it('runs the hline across to the label column before climbing (nuvumi)', () => {
    const out = renderNodesDispatchingGotos(
      [zeroNode('label', 'lab1', 81.938, 53), zeroNode('goto', 'lab1', 37.663, 206)],
      theme,
    );
    expect(out[1]).toBe(
      `<line x1="37.663" y1="206" x2="81.938" y2="206" ${LINE_STYLE}/>` +
        `<line x1="81.938" y1="53" x2="81.938" y2="206" ${LINE_STYLE}/>`,
    );
  });

  it('draws nothing for a goto whose label has not been drawn yet (dest == null)', () => {
    const out = renderNodesDispatchingGotos(
      [zeroNode('goto', 'later', 10, 100), zeroNode('label', 'later', 10, 20)],
      theme,
    );
    expect(out).toEqual(['', '']);
  });

  it('jumps to the most recently drawn label of that name (HashMap.put overwrite)', () => {
    const out = renderNodesDispatchingGotos(
      [zeroNode('label', 'x', 10, 20), zeroNode('label', 'x', 10, 40), zeroNode('goto', 'x', 10, 90)],
      theme,
    );
    expect(out[2]).toBe(
      `<line x1="10" y1="90" x2="10" y2="90" ${LINE_STYLE}/><line x1="10" y1="40" x2="10" y2="90" ${LINE_STYLE}/>`,
    );
  });

  it('strokes in the root LineColor (goto style has no rule of its own)', () => {
    const red = deepMergeTheme(theme, { colors: { ...theme.colors, border: '#FF0000' } });
    const out = renderNodesDispatchingGotos([zeroNode('label', 'a', 5, 5), zeroNode('goto', 'a', 5, 50)], red);
    expect(out[1]).toBe(
      '<line x1="5" y1="50" x2="5" y2="50" stroke="#F00" stroke-width="1"/>' +
        '<line x1="5" y1="5" x2="5" y2="50" stroke="#F00" stroke-width="1"/>',
    );
  });

  it('neither records nor draws a node its parent drew directly (dispatched: false)', () => {
    const label = { ...zeroNode('label', 'a', 5, 5), dispatched: false as const };
    const goto = { ...zeroNode('goto', 'a', 5, 50), dispatched: false as const };
    expect(renderNodesDispatchingGotos([zeroNode('label', 'a', 5, 5), goto], theme)).toEqual(['', '']);
    expect(renderNodesDispatchingGotos([label, zeroNode('goto', 'a', 5, 50)], theme)).toEqual(['', '']);
  });

  it('renders every other node exactly as renderNode does', () => {
    const start: ActivityNodeGeo = { id: 's', kind: 'start', x: 0, y: 0, width: 20, height: 20 };
    const [svg] = renderNodesDispatchingGotos([start], theme);
    expect(svg).toBe('<ellipse cx="10" cy="10" rx="10" ry="10" fill="#222" stroke="#222" stroke-width="1"/>');
  });
});
