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
import { extractBackward } from '../../../../src/diagrams/activity/layout/tile-layout-backward.js';
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

  it('produces no extra action node beyond start/read-data/repeat-start/condition (T3k: repeat-cond + if-own-label)', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual(['start', 'action', 'repeat-start', 'repeat-cond', 'if-own-label']);
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
    expect(geo.nodes.map((n) => n.kind)).toEqual([
      'start',
      'action',
      'repeat-start',
      'repeat-cond',
      'if-own-label',
      'action',
    ]);
    expect(geo.nodes[5]!.label).toBe('go back');
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
  // T3k: the condition's polygon node (`'repeat-cond'`, now polygon only
  // -- the own label draws through a sibling `'if-own-label'` node).
  // `cond.label` is still set on the polygon node (shape-selection
  // carries it), same text.
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

  it('produces no extra action node beyond while-header/step (T3k: while-header + if-own-label)', () => {
    // WORD (mission add2-T3b): the body's own node lands BEFORE the header.
    expect(geo.nodes.map((n) => n.kind)).toEqual(['action', 'while-header', 'if-own-label']);
  });
});

describe('tile-layout — while backward: set (FtileWhile.java:85,154-161,561-562)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [{ kind: 'while', condition: 'more?', body: whileBody('go back') }],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('the backward node is pulled OUT of the body and pushed as its own action node, LAST', () => {
    // WORD (mission add2-T3b): the body's own node lands BEFORE the header.
    expect(geo.nodes.map((n) => n.kind)).toEqual(['action', 'while-header', 'if-own-label', 'action']);
    expect(geo.nodes[3]!.label).toBe('go back');
  });

  // T1b: `ConnectionOut`'s two snakes fuse (merge-case C, `Snake.java:
  // 303-327`) -- 4 edges now.
  it('pushes ConnectionBackBackward1/2 in place of ConnectionBackSimple (4 edges: In, Backward1, Backward2, merged Out)', () => {
    expect(geo.edges).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// BACKNOTE (mission `activity-divergence-drive-3` T2a):
// `InstructionRepeat.java:177-185,218-226` -- a note parsed after
// `backward:` is `backward`'s OWN note (`backwardNotes`), drawn beside it
// via the same `FtileWithNoteOpale` wrap `tileNote` already builds for a
// simple leaf -- never a flow sibling.
// ---------------------------------------------------------------------------

describe('extractBackward — BACKNOTE: a note after backward: becomes backward.notes', () => {
  it('a note BEFORE backward: stays in rest (regular flow), backward.notes is unset', () => {
    const body: ActivityRepeat['body'] = [
      { kind: 'note', text: 'early', position: 'left' },
      { kind: 'action', label: 'a' },
      { kind: 'backward', label: 'go back' },
    ];
    const { rest, backward } = extractBackward(body);
    expect(rest).toEqual([{ kind: 'note', text: 'early', position: 'left' }, { kind: 'action', label: 'a' }]);
    expect(backward?.notes).toBeUndefined();
  });

  it('a note AFTER backward: is lifted into backward.notes and removed from rest', () => {
    const body: ActivityRepeat['body'] = [
      { kind: 'action', label: 'a' },
      { kind: 'backward', label: 'go back' },
      { kind: 'note', text: 'Note3', position: 'left' },
    ];
    const { rest, backward } = extractBackward(body);
    expect(rest).toEqual([{ kind: 'action', label: 'a' }]);
    expect(backward?.label).toBe('go back');
    expect(backward?.notes).toEqual([{ kind: 'note', text: 'Note3', position: 'left' }]);
  });
});

describe('tile-layout — repeat backward: with a trailing note renders a note node, not a floating sibling', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      { kind: 'start' },
      {
        kind: 'repeat',
        body: [
          { kind: 'action', label: 'read data' },
          { kind: 'backward', label: 'go back' },
          { kind: 'note', text: 'Warning note', position: 'left' },
        ],
        condition: 'done?',
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('renders exactly one note node, wrapped beside the backward action', () => {
    const notes = geo.nodes.filter((n) => n.kind === 'note');
    expect(notes).toHaveLength(1);
    expect(notes[0]!.label).toBe('Warning note');
  });

  it('the backward action still renders as its own node', () => {
    expect(geo.nodes.some((n) => n.kind === 'action' && n.label === 'go back')).toBe(true);
  });
});
