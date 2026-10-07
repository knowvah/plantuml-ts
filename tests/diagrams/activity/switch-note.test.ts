/**
 * add4-T1f (SWITCH-NOTE): `InstructionSwitch#addNote` (`InstructionSwitch
 * .java:185-193`) keeps a note as the SWITCH's own while `current == null
 * || current.isEmpty()`, else forwards it into the current case; a note
 * after `endswitch` reaches it through `InstructionList#addNote`'s
 * `getLast().addNote(...)` (`InstructionList.java:190-196`). The switch's
 * own notes wrap the whole switch TOP-aligned (`InstructionSwitch.java:125`).
 * Each `<case>/in.svg` is the jar's own render (`scripts/oracle-render.sh`).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { ActivityNode, ActivitySwitch } from '../../../src/diagrams/activity/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { extractLeadingCaseNotes } from '../../../src/diagrams/activity/switch-dispatch.js';
import { parseAst } from '../../helpers/parse-ast.js';
import { renderActivityFixture, svgAttr, textOccurrences } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T1f');

function parse(lines: readonly string[]): ActivityNode[] {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block).nodes;
}

function switchOf(nodes: readonly ActivityNode[]): ActivitySwitch {
  const sw = nodes.find((n) => n.kind === 'switch');
  if (sw?.kind !== 'switch') throw new Error('no switch');
  return sw;
}

const noteTexts = (nodes: readonly ActivityNode[] | undefined): string[] =>
  (nodes ?? []).flatMap((n) => (n.kind === 'note' ? [n.text] : []));

describe('switch notes -- parse', () => {
  it('notes before the first case (single + multi-line) belong to the switch, in order', () => {
    const sw = switchOf(
      parse(['switch (t)', 'note left: one', 'note right', 'two', 'end note', 'case (a)', ':a;', 'endswitch']),
    );
    expect(noteTexts(sw.notes)).toEqual(['one', 'two']);
    expect(sw.notes?.map((n) => n.position)).toEqual(['left', 'right']);
    expect(sw.cases[0]!.body.map((n) => n.kind)).toEqual(['action']);
  });

  it('a note while the case is still empty belongs to the switch; after an instruction, to the case', () => {
    const sw = switchOf(
      parse([
        'switch (t)',
        'case (a)',
        'note left: s1',
        ':a;',
        'note right: on a',
        'case (b)',
        'note: s2',
        ':b;',
        'endswitch',
      ]),
    );
    expect(noteTexts(sw.notes)).toEqual(['s1', 's2']);
    expect(noteTexts(sw.cases[0]!.body)).toEqual(['on a']);
    expect(sw.cases[1]!.body.map((n) => n.kind)).toEqual(['action']);
  });

  it('a note after endswitch goes to the last case (non-empty), recursing into a nested switch', () => {
    const nodes = parse([
      'switch (o)',
      'case (a)',
      ':a;',
      'case (b)',
      'switch (i)',
      'case (x)',
      ':x;',
      'case (y)',
      ':y;',
      'endswitch',
      'endswitch',
      'note left: tail',
      ':after;',
    ]);
    const outer = switchOf(nodes);
    expect(outer.notes).toBeUndefined();
    const inner = switchOf(outer.cases[1]!.body);
    expect(inner.notes).toBeUndefined();
    expect(inner.cases[1]!.body.map((n) => (n.kind === 'note' ? n.text : n.kind))).toEqual(['action', 'tail']);
    expect(nodes.map((n) => n.kind)).toEqual(['switch', 'action']);
  });

  it('a note after endswitch with an empty last case belongs to the switch', () => {
    const sw = switchOf(parse(['switch (t)', 'case (a)', ':a;', 'case (b)', 'endswitch', 'note left: own']));
    expect(noteTexts(sw.notes)).toEqual(['own']);
  });

  it('extractLeadingCaseNotes: an arrow label does not end the empty run and stays in the body', () => {
    const body: ActivityNode[] = [
      { kind: 'arrow-label', label: 'l' },
      { kind: 'note', text: 'n1', position: 'left' },
      { kind: 'action', label: 'a' },
      { kind: 'note', text: 'n2', position: 'left' },
    ];
    const { body: rest, notes } = extractLeadingCaseNotes(body);
    expect(noteTexts(notes)).toEqual(['n1']);
    expect(rest.map((n) => n.kind)).toEqual(['arrow-label', 'action', 'note']);
  });
});

/** Every `<path d>` (the notes' Opale outlines), document order. */
function pathDs(svg: string): string[] {
  return [...svg.matchAll(/<path\b[^>]*?\sd="([^"]*)"/g)].map((m) => m[1]!);
}

/** `<text>` content -> `x,y`, document order (jar and ours both emit x then y). */
function texts(svg: string): string[] {
  return [...svg.matchAll(/<text\b[^>]*?\sx="([^"]*)" y="([^"]*)"[^>]*>([^<]*)<\/text>/g)].map(
    (m) => `${m[3]}@${m[1]},${m[2]}`,
  );
}

/** `compareSvg`'s own `deterministic` tolerance (0.01): both sides print
 *  3 decimals, so a half-way value may round either way. */
function expectPathsClose(ours: readonly string[], jar: readonly string[]): void {
  const nums = (d: string): number[] => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const shape = (d: string): string => d.replace(/-?\d+(\.\d+)?/g, '#');
  expect(ours.map(shape)).toEqual(jar.map(shape));
  ours.forEach((d, i) => nums(d).forEach((v, j) => expect(v).toBeCloseTo(nums(jar[i]!)[j]!, 2)));
}

describe('switch notes -- rendered = jar', () => {
  const cases: readonly [string, readonly string[]][] = [
    ['pre-case-one', ['switch note']],
    ['pre-case-two', ['left one', 'right one', 'two lines', 'left two']],
    ['empty-case', ['own by switch', 'own by a', 'also switch']],
    ['after-endswitch', ['goes on b']],
    ['after-endswitch-empty', ['goes on switch']],
    ['floating-one', ['floating on switch']],
  ];
  for (const [name, notes] of cases) {
    it(`${name}: every note drawn, note outlines equal the jar`, () => {
      const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
      for (const n of notes) expect(textOccurrences(ours, n), n).toBe(textOccurrences(golden, n));
      expectPathsClose(pathDs(ours), pathDs(golden));
    });
  }

  it('pre-case-two (FtileWithNotes TOP): canvas and every note text position = jar', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'pre-case-two');
    expect(svgAttr(ours, 'width')).toBe(svgAttr(golden, 'width'));
    expect(svgAttr(ours, 'height')).toBe(svgAttr(golden, 'height'));
    const noteTexts2 = (svg: string): string[] => texts(svg).filter((t) => /^(left|right|two)/.test(t));
    expect(noteTexts2(ours)).toEqual(noteTexts2(golden));
  });
});
