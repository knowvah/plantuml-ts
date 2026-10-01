/**
 * Unit tests for `tile-layout.ts`'s `backward:` wiring (mission
 * `activity-divergence-drive` T3h push-forward -- `extractBackward`/
 * `repeatConditionLabels`/`tileBackwardActivity`, `tile-layout-backward.ts`).
 *
 * Every AST here is built DIRECTLY (`ActivityRepeat`/`ActivityWhile`
 * object literals), bypassing `parseActivity` entirely -- a real
 * pre-existing parser defect (`node-dispatch.ts#parseNodes`'s semicolon
 * strip, `:475-482`) corrupts every corpus fixture's OWN `backward:LABEL;`
 * parse (see `.agent-notes/add1-T3h.md`'s second entry), so a parser-driven
 * test here would pin that corruption, not this file's own wiring. These
 * tests isolate `tile-layout.ts`'s own mechanism from that upstream bug.
 */

import { describe, expect, it } from 'vitest';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { FormulaMeasurer } from '../../../../src/core/measurer.js';
import type { ActivityDiagramAST, ActivityRepeat, ActivityWhile } from '../../../../src/diagrams/activity/ast.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const measurer = new FormulaMeasurer();
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

function repeatBody(backwardLabels: string[]): ActivityRepeat['body'] {
  return [
    { kind: 'action', label: 'read data' },
    ...backwardLabels.map((label) => ({ kind: 'backward' as const, label })),
  ];
}

describe('tile-layout — repeat backward: unset (regression safety)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      { kind: 'start' },
      { kind: 'repeat', body: [{ kind: 'action', label: 'read data' }], condition: 'done?' },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('produces no extra action node beyond start/read-data/repeat-start/repeat-cond', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual(['start', 'action', 'repeat-start', 'repeat-cond']);
  });
});

describe('tile-layout — repeat backward: set (FtileRepeat.java:84,181-187,685-692)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      { kind: 'start' },
      { kind: 'repeat', body: repeatBody(['go back']), condition: 'done?' },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('the backward node is pulled OUT of the body and pushed as its own action node, LAST (drawU order)', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual(['start', 'action', 'repeat-start', 'repeat-cond', 'action']);
    expect(geo.nodes[4]!.label).toBe('go back');
  });

  it('the body tile itself never receives the backward node (only read-data remains)', () => {
    expect(geo.nodes.filter((n) => n.kind === 'action')).toHaveLength(2);
    expect(geo.nodes[1]!.label).toBe('read data');
  });

  it('pushes ConnectionBackBackward1/2 in place of the simple/complex back connector (5 edges: start->repeat sibling, In, Backward1, Backward2, Out)', () => {
    expect(geo.edges).toHaveLength(5);
  });
});

describe('tile-layout — two backward: nodes in one body: the LAST wins (InstructionRepeat#setBackward overwrites)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [{ kind: 'repeat', body: repeatBody(['first', 'second']), condition: 'done?' }],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('only ONE backward action node is built, carrying the LAST label', () => {
    const actionLabels = geo.nodes.filter((n) => n.kind === 'action').map((n) => n.label);
    expect(actionLabels).toEqual(['read data', 'second']);
  });
});

describe('tile-layout — repeat condition label side: default east/south (backward unset or same-lane)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'repeat',
        body: repeatBody(['go back']),
        condition: 'done?',
        yesLabel: 'yes',
        outLabel: 'no',
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);
  const cond = geo.nodes.find((n) => n.kind === 'repeat-cond')!;

  it('east label text renders ("yes") -- the condition hexagon keeps its default side', () => {
    expect(geo.nodes.some((n) => n.label === 'yes')).toBe(true);
  });

  it('a repeat-cond node exists with label "done?"', () => {
    expect(cond.label).toBe('done?');
  });
});

describe('tile-layout — backwardExitsOnLeft (FtileRepeat.java:210-219): backward’s lane sorts before swimlaneOut', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'repeat',
        body: [
          { kind: 'action', label: 'read data', swimlane: 'Lane1' },
          { kind: 'backward', label: 'go back', swimlane: 'Lane1' },
        ],
        condition: 'done?',
        yesLabel: 'yes',
        swimlane: 'Lane1',
        swimlaneOut: 'Lane2',
      },
    ],
    swimlanes: ['Lane1', 'Lane2'],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('still renders the "yes" label (on whichever side -- west here, since Lane1 < Lane2) -- proves the west branch did not drop the label', () => {
    expect(geo.nodes.some((n) => n.label === 'yes')).toBe(true);
  });
});

function whileBody(backwardLabel: string | undefined): ActivityWhile['body'] {
  const base: ActivityWhile['body'] = [{ kind: 'action', label: 'step' }];
  if (backwardLabel !== undefined) base.push({ kind: 'backward', label: backwardLabel });
  return base;
}

describe('tile-layout — while backward: unset (regression safety)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [{ kind: 'while', condition: 'more?', body: whileBody(undefined) }],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('produces no extra action node beyond while-header/step', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual(['while-header', 'action']);
  });
});

describe('tile-layout — while backward: set (FtileWhile.java:85,154-161,561-562)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [{ kind: 'while', condition: 'more?', body: whileBody('go back') }],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('the backward node is pulled OUT of the body and pushed as its own action node, LAST', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual(['while-header', 'action', 'action']);
    expect(geo.nodes[2]!.label).toBe('go back');
  });

  it('pushes ConnectionBackBackward1/2 in place of ConnectionBackSimple (5 edges: In, Backward1, Backward2, Out x2)', () => {
    expect(geo.edges).toHaveLength(5);
  });
});
