/**
 * Mission ubrr-T10 — new activity3 Command ports (T2 diagnosis mechanisms
 * M1/M2/M3/M4/M5): bullet-list activities, switch/case/endswitch,
 * `backward:LABEL;`, the if-opener gaps (trailing stereogroup / `is (v)
 * then` / legacy `then when`), and the `end while`/`while end` endwhile
 * spellings. Each `describe` below uses the exact refusing line from
 * `plans/unknown-bucket-routing-repair/diagnosis/T2.md`'s per-mechanism
 * section.
 */
import { describe, it, expect } from 'vitest';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import { parseRefusalOf } from '../../../src/core/dispatcher.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type {
  ActivityDiagramAST,
  ActivityAction,
  ActivityBackward,
  ActivityGroup,
  ActivityIf,
  ActivityRepeat,
  ActivityWhile,
  ActivityNode,
  ActivitySwitch,
} from '../../../src/diagrams/activity/ast.js';
import { parseAst } from '../../helpers/parse-ast.js';

function parse(lines: readonly string[]): ActivityDiagramAST {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block);
}

function firstNode(ast: ActivityDiagramAST): ActivityNode {
  const node = ast.nodes[0];
  if (node === undefined) throw new Error('Expected at least one node');
  return node;
}

// ---------------------------------------------------------------------------
// M1 — CommandActivityList: `* A` / `- A` bullet activities
// ---------------------------------------------------------------------------
describe('M1 — CommandActivityList (* / - bullet activities)', () => {
  it('"*A" / "*B" (bokupo-95-rede308) parses as two action nodes', () => {
    const ast = parse(['*A', '*B']);
    expect(ast.nodes).toHaveLength(2);
    expect((ast.nodes[0] as ActivityAction).kind).toBe('action');
    expect((ast.nodes[0] as ActivityAction).label).toBe('A');
    expect((ast.nodes[1] as ActivityAction).label).toBe('B');
  });

  it('"- A" / "- B" (dash form) parses with trimmed labels', () => {
    const ast = parse(['- A', '- B']);
    expect((ast.nodes[0] as ActivityAction).label).toBe('A');
    expect((ast.nodes[1] as ActivityAction).label).toBe('B');
  });

  it('nested "** B" keeps the second star as literal label text (cemilu-33-voma521)', () => {
    const ast = parse(['* A', '** B', '*** C']);
    expect(ast.nodes).toHaveLength(3);
    expect((ast.nodes[0] as ActivityAction).label).toBe('A');
    expect((ast.nodes[1] as ActivityAction).label).toBe('* B');
    expect((ast.nodes[2] as ActivityAction).label).toBe('** C');
  });
});

// ---------------------------------------------------------------------------
// M3 — CommandBackward3: `backward:LABEL;`
// ---------------------------------------------------------------------------
describe('M3 — CommandBackward3 (backward:LABEL;)', () => {
  it('gucipa-88-xoti966 shape: repeat body captures action + backward nodes', () => {
    const ast = parse([
      'repeat',
      '  :Generate diagrams1; <<color>>',
      'backward:Log context2; <<color>>',
      'repeat while (more data?) is (yes)',
    ]);
    const node = firstNode(ast);
    expect(node.kind).toBe('repeat');
    // No inline `repeat :label;` here, so entry is undefined; the body
    // carries both the action AND the backward node (the latter is not
    // rendered as a tile -- see tile-layout.ts's `case 'backward'` -- but
    // it IS present in the AST body list, same as `arrow-label`).
    const repeat = node as ActivityRepeat;
    expect(repeat.entry).toBeUndefined();
    expect(repeat.body.map((n) => n.kind)).toEqual(['action', 'backward']);
    expect((repeat.body[1] as ActivityBackward).label).toBe('Log context2');
  });

  it('a standalone single-line backward: produces a backward node', () => {
    const ast = parse(['backward:Log context;']);
    const node = firstNode(ast) as ActivityBackward;
    expect(node.kind).toBe('backward');
    expect(node.label).toBe('Log context');
  });

  it('multi-line backward (xevumo-18-luvo279) joins label lines with \\n', () => {
    const ast = parse(['backward:Log', 'context; <<save>>']);
    const node = firstNode(ast) as ActivityBackward;
    expect(node.kind).toBe('backward');
    expect(node.label).toBe('Log\ncontext');
  });

  it('multiple trailing stereogroups do not break the match (xebuce-87-poba093)', () => {
    const ast = parse(['backward:Log context2; <<save>> <<color>>']);
    const node = firstNode(ast) as ActivityBackward;
    expect(node.label).toBe('Log context2');
  });

  it('an action line with two stereogroups still parses (xebuce action line)', () => {
    const ast = parse([':Generate diagrams1; <<save>> <<color>>']);
    const node = firstNode(ast) as ActivityAction;
    expect(node.kind).toBe('action');
    expect(node.label).toBe('Generate diagrams1');
    expect(node.stereotype).toBe('save');
  });
});

// ---------------------------------------------------------------------------
// M2 — CommandSwitch/CommandCase/CommandEndSwitch
// ---------------------------------------------------------------------------
describe('M2 — CommandSwitch/CommandCase/CommandEndSwitch (doveka-76-fiza931)', () => {
  it('one case: condition, one labelled case, one-node body', () => {
    const ast = parse(['switch (test?)', 'case (condition A)', '  :Text 1;', 'endswitch']);
    const node = firstNode(ast) as ActivitySwitch;
    expect(node.kind).toBe('switch');
    expect(node.condition).toBe('test?');
    expect(node.cases).toHaveLength(1);
    expect(node.cases[0]?.label).toBe('condition A');
    expect((node.cases[0]?.body[0] as ActivityAction).label).toBe('Text 1');
  });

  it('multiple cases in source order, "end" inside a case body is an End node (lipiki-79-fapu237)', () => {
    const ast = parse([
      'switch (test?)',
      'case (cond A)',
      '  :Text A;',
      'case (cond B)',
      '  :text B;',
      'case (cond C)',
      '  end',
      'endswitch',
    ]);
    const node = firstNode(ast) as ActivitySwitch;
    expect(node.cases.map((c) => c.label)).toEqual(['cond A', 'cond B', 'cond C']);
    expect(node.cases[2]?.body[0]?.kind).toBe('end');
  });

  it('spaced parens "case ( 503 )" trim to the bare value (xaxene-93-doka767)', () => {
    const ast = parse([
      'switch (Q2)',
      'case ( 503 )',
      '  :A;',
      '  stop',
      'case ( 500 )',
      '  :B;',
      '  stop',
      'endswitch',
    ]);
    const node = firstNode(ast) as ActivitySwitch;
    expect(node.cases.map((c) => c.label)).toEqual(['503', '500']);
  });
});

// ---------------------------------------------------------------------------
// M4a — CommandIf2/CommandElseIf2: trailing stereogroup, no `then`
// ---------------------------------------------------------------------------
describe('M4a — CommandIf2 trailing stereogroup (cubixe-14-gaze754)', () => {
  it('"if(foo) <<#green>>" with no then parses, condition "foo"', () => {
    const ast = parse(['if(foo) <<#green>>', ':...;', 'else', ':..;', 'endif <<#blue>>']);
    const node = firstNode(ast) as ActivityIf;
    expect(node.kind).toBe('if');
    expect(node.condition).toBe('foo');
    expect(node.thenLabel).toBeUndefined();
  });

  it('"endif <<#blue>>" is recognised as the closer, not swallowed (mazuxi/cubixe regression)', () => {
    // Two back-to-back diagrams in one source, the second with a bare
    // `endif` — if `endif <<#blue>>` were NOT recognised as a closer, the
    // second diagram's `start`/`stop` would be swallowed into the first
    // if's clause scan (see if-dispatch.ts `classifyClauseLine`'s doc).
    const ast = parse([
      'start',
      'if(foo) <<#green>>',
      ':...;',
      'else',
      ':..;',
      'endif <<#blue>>',
      'stop',
      'start',
      'stop',
    ]);
    expect(ast.nodes.map((n) => n.kind)).toEqual(['start', 'if', 'stop', 'start', 'stop']);
  });

  it('elseif with a trailing stereogroup (mazuxi-71-xipu561)', () => {
    const ast = parse(['if(foo)', ':...;', 'elseif(bar) <<#red>>', ':...;', 'else', ':..;', 'endif']);
    const node = firstNode(ast) as ActivityIf;
    expect(node.elseIfBranches).toHaveLength(1);
    expect(node.elseIfBranches[0]?.condition).toBe('bar');
  });
});

// ---------------------------------------------------------------------------
// M4b — CommandIf4: `if (test) is (value) then`
// ---------------------------------------------------------------------------
describe('M4b — CommandIf4 (xucero-03-kixi746)', () => {
  it('"if (toto) is (10) then" captures condition and thenLabel', () => {
    const ast = parse(['start', 'if (toto) is (10) then', ' :BAD;', 'else (20)', 'endif', 'stop']);
    const node = ast.nodes[1] as ActivityIf;
    expect(node.kind).toBe('if');
    expect(node.condition).toBe('toto');
    expect(node.thenLabel).toBe('10');
    expect(node.elseLabel).toBe('20');
  });
});

// ---------------------------------------------------------------------------
// M4c — CommandIfLegacy1 / CommandElseLegacy1: `then when` / `else when`
// ---------------------------------------------------------------------------
describe('M4c — CommandIfLegacy1/CommandElseLegacy1 (barada-07-veca157)', () => {
  it('"if (B is C) then when yes" captures thenLabel "yes"', () => {
    const ast = parse([
      'if (B is C) then when yes',
      '- Report that A is C',
      'else when no',
      '- Report that A is not C',
      'endif',
    ]);
    const node = firstNode(ast) as ActivityIf;
    expect(node.condition).toBe('B is C');
    expect(node.thenLabel).toBe('yes');
    expect(node.elseLabel).toBe('no');
  });

  it('the legacy else branch body is captured (bullet list inside)', () => {
    const ast = parse([
      'if (B is C) then when yes',
      '- Report that A is C',
      'else when no',
      '- Report that A is not C',
      'endif',
    ]);
    const node = firstNode(ast) as ActivityIf;
    expect((node.thenBranch[0] as ActivityAction).label).toBe('Report that A is C');
    expect((node.elseBranch[0] as ActivityAction).label).toBe('Report that A is not C');
  });

  it('full barada-07-veca157 nested shape parses end to end', () => {
    const ast = parse([
      'start',
      'if (A is B) then',
      '  if (B is C) then when yes',
      '    - Report that A is C',
      '  else when no',
      '    - Report that A is not C',
      '  endif',
      'else when no',
      '  - Report that A is not B',
      'endif',
      'end',
    ]);
    expect(ast.nodes.map((n) => n.kind)).toEqual(['start', 'if', 'end']);
  });
});

// ---------------------------------------------------------------------------
// M5 — CommandWhileEnd3: `end while` / `while end` spellings
// ---------------------------------------------------------------------------
describe('M5 — CommandWhileEnd3 two-word spellings', () => {
  it('"end while" closes the loop (rucuga-83-tosu408 shape)', () => {
    const ast = parse(['while(more?)', '  :finalize;', 'end while', 'stop']);
    const node = firstNode(ast) as ActivityWhile;
    expect(node.kind).toBe('while');
    expect(node.body).toHaveLength(1);
    expect(ast.nodes[1]?.kind).toBe('stop');
  });

  it('"while end" (reversed order) also closes the loop', () => {
    const ast = parse(['while(more?)', '  :finalize;', 'while end', 'stop']);
    const node = firstNode(ast) as ActivityWhile;
    expect(node.kind).toBe('while');
    expect(ast.nodes[1]?.kind).toBe('stop');
  });

  it('one-word "endwhile" still works (no regression)', () => {
    const ast = parse(['while(more?)', '  :finalize;', 'endwhile', 'stop']);
    expect((firstNode(ast) as ActivityWhile).kind).toBe('while');
  });
});

// ---------------------------------------------------------------------------
// M6 — CommandPartition3/CommandCloseGroup3/CommandCloseGroupLegacy3
// ---------------------------------------------------------------------------
describe('M6 — CommandPartition3 (tuvigo-52-redo102 shape)', () => {
  it('quoted, bracketed partition captures type/title/hasBracket, closed by }', () => {
    const ast = parse(['partition "**process** HelloWorld" {', '  :Ready;', '}']);
    const node = firstNode(ast) as ActivityGroup;
    expect(node.kind).toBe('group');
    expect(node.groupType).toBe('partition');
    expect(node.title).toBe('**process** HelloWorld');
    expect(node.hasBracket).toBe(true);
    expect((node.body[0] as ActivityAction).label).toBe('Ready');
  });

  it('two sibling bracketed partitions both parse (tuvigo shape)', () => {
    const ast = parse(['partition "P1" {', '  :A;', '}', 'partition "P2" {', '  :B;', '}']);
    expect(ast.nodes.map((n) => n.kind)).toEqual(['group', 'group']);
    expect((ast.nodes[0] as ActivityGroup).title).toBe('P1');
    expect((ast.nodes[1] as ActivityGroup).title).toBe('P2');
  });

  it('bracket-less legacy "Group NAME" / "End group" (vezozu-78-pici074)', () => {
    const ast = parse([
      'Group External Communication Thread',
      'repeat',
      '  :Handle Rx;',
      'repeat while (loop)',
      'End group',
    ]);
    const node = firstNode(ast) as ActivityGroup;
    expect(node.groupType).toBe('group');
    expect(node.title).toBe('External Communication Thread');
    expect(node.hasBracket).toBe(false);
    expect(node.body[0]?.kind).toBe('repeat');
  });

  it('bracket-less "rectangle <$sprite{...}>" form (bezogu-47-vevu307 shape)', () => {
    const ast = parse(['rectangle <$react{scale=1}>']);
    const node = firstNode(ast) as ActivityGroup;
    expect(node.groupType).toBe('rectangle');
    expect(node.title).toBe('<$react{scale=1}>');
    expect(node.hasBracket).toBe(false);
    expect(node.body).toHaveLength(0);
  });

  it('the bracketless legacy closer also accepts one-word "endgroup"/"groupend"', () => {
    const ast = parse(['group Zone', '  :A;', 'endgroup']);
    const node = firstNode(ast) as ActivityGroup;
    expect(node.title).toBe('Zone');
    expect(node.body).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Refusal regression: the pre-fix shapes used to refuse. Confirms the
// refusal PATH itself (parseRefusalOf) still works for a genuinely
// unrecognised line, so these fixes did not widen dispatch beyond scope.
// ---------------------------------------------------------------------------
describe('unrecognised lines still refuse (D9 — narrow, never widen)', () => {
  it('a bare "if" with garbage after the stereogroup still refuses', () => {
    const block: UmlSource = { lines: ['if(foo) <<#green>> garbage', 'endif'], type: 'activity' };
    const parsed = activityPlugin.parse(block);
    const refusal = parseRefusalOf(parsed);
    expect(refusal).toBeDefined();
  });
});
