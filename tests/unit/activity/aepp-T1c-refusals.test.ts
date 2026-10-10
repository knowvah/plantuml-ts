/**
 * aepp-T1c (D2): the jar refuses where we used to draw or crash.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:80-95
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/InstructionSwitch.java:97-101
 */
import { describe, it, expect } from 'vitest';
import { parseActivity } from '../../../src/diagrams/activity/parser.js';
import type { ParseRefusal } from '../../../src/core/parse-refusal.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const SWIMLANE_MESSAGE = 'This swimlane must be defined at the start of the diagram.';
const SWITCH_MESSAGE = "No 'case' in this switch";

function block(lines: string[]): UmlSource {
  return { lines, type: 'activity' };
}

function refusalOf(lines: string[]): ParseRefusal {
  const r = parseActivity(block(lines));
  if (!('refused' in r)) throw new Error('expected a refusal');
  return r;
}

describe('swimlane after the first instruction', () => {
  it('velodu: refuses at the first swimlane line (0-based 1)', () => {
    const r = refusalOf([':f1;', '|swinlane1|', ':f2;', '|swinlane2|', ':f3;']);
    expect(r).toMatchObject({ kind: 'execution', line: 1, consumed: 1, message: SWIMLANE_MESSAGE });
  });

  it('nakavu: an `if` opener forbids lanes declared inside it', () => {
    const r = refusalOf([':preAct;', 'if (Test) then (S1!)', ':ActPre;', '|S1|', ':Act;', 'endif']);
    expect(r).toMatchObject({ kind: 'execution', line: 3, message: SWIMLANE_MESSAGE });
  });

  it('the opener alone forbids: `if` before any lane, lane in its body', () => {
    const r = refusalOf(['if (x) then (y)', '|A|', ':a;', 'endif']);
    expect(r).toMatchObject({ kind: 'execution', line: 1 });
  });

  it('lanes declared before the first instruction do not refuse', () => {
    const r = parseActivity(block(['|A|', '|B|', ':x;', '|A|', ':y;']));
    expect('refused' in r).toBe(false);
  });

  it('non-instruction lines (kill, notes-free titles) do not forbid a later lane', () => {
    const r = parseActivity(block(['title T', '|A|', ':x;']));
    expect('refused' in r).toBe(false);
  });
});

describe('instruction before the first case of a switch', () => {
  it('kedozi: refuses at the action line (0-based 2) instead of throwing', () => {
    const r = refusalOf([':any;', 'switch (any2)', '        :Charged;']);
    expect(r).toMatchObject({ kind: 'execution', line: 2, message: SWITCH_MESSAGE });
  });

  it('a case first is fine', () => {
    const r = parseActivity(block(['switch (a)', 'case (1)', ':x;', 'endswitch']));
    expect('refused' in r).toBe(false);
  });
});

describe('blank lines between switch and the first case', () => {
  it('do not refuse (demibe/pateca/rekuxa/duvole shape)', () => {
    const r = parseActivity(block(['start', 'switch (s)', '', 'case ( a )', ':c1;', 'endswitch']));
    expect('refused' in r).toBe(false);
  });
});
