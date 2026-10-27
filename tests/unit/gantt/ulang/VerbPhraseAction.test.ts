import { describe, expect, it } from 'vitest';
import { CommandExecutionResult } from '../../../../src/core/command/CommandExecutionResult.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';
import { UBrexLeaf } from '../../../../src/core/ubrex/builder/UBrexLeaf.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { ComplementDeleted } from '../../../../src/diagrams/gantt/lang/ComplementDeleted.js';
import { Verbs } from '../../../../src/diagrams/gantt/lang/Verbs.js';
import { VerbPhraseAction } from '../../../../src/diagrams/gantt/ulang/VerbPhraseAction.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ulang/VerbPhraseAction.java (:57-161).
class Act extends VerbPhraseAction {
  readonly calls: unknown[][] = [];
  execute(_gantt: GanttDiagram, subject: unknown, complement: unknown): CommandExecutionResult {
    this.calls.push([subject, complement]);
    return CommandExecutionResult.ok();
  }
}

const tn = (s: string): TextNavigator => TextNavigator.build(s);

describe('VerbPhraseAction', () => {
  const plain = new Act(Verbs.is, new ComplementDeleted());
  const withIgnored = new Act(Verbs.is, new UBrexLeaf('just'), new ComplementDeleted());

  it('toString is verb + " " + complement class name (java:62-64, journal row 56)', () => {
    expect(plain.toString().endsWith(' ComplementDeleted')).toBe(true);
  });

  it('parse consumes spaces, verb, spaces and complement, leaving the rest (java:100-124)', () => {
    const nav = tn('  is   deleted tail');
    const m = plain.parse(nav);
    expect(m.getVerbMatch().getAcceptedMatch()).toBe('is');
    expect(m.getComplementMatcher().getAcceptedMatch()).toBe('deleted');
    expect(nav.toString()).toBe(' tail');
  });

  it('parse skips the ignored fragment between verb and complement (java:111-114)', () => {
    const nav = tn('is  just  deleted');
    const m = withIgnored.parse(nav);
    expect(m.getComplementMatcher().getAcceptedMatch()).toBe('deleted');
    expect(nav.length()).toBe(0);
  });

  it('parse throws IllegalStateException when the verb or the complement does not match (java:104-105, 119-120)', () => {
    expect(() => plain.parse(tn('was deleted'))).toThrow('IllegalStateException');
    expect(() => plain.parse(tn('is gone'))).toThrow('IllegalStateException');
  });

  it('check accepts a verb phrase without moving the caller navigator (java:126-156)', () => {
    const nav = tn('is deleted');
    expect(plain.check(nav)).toBe(true);
    expect(nav.toString()).toBe('is deleted');
    expect(withIgnored.check(tn('is just deleted'))).toBe(true);
  });

  it('check accepts an absent ignored fragment: its match is empty and jumps 0 (java:143-146)', () => {
    expect(withIgnored.check(tn('is deleted'))).toBe(true);
  });

  it('check rejects a missing verb or complement (java:134-135, 150-151)', () => {
    expect(plain.check(tn('was deleted'))).toBe(false);
    expect(plain.check(tn('is gone'))).toBe(false);
  });

  it('getComplement resolves the complement through the complement matcher (java:74-76)', () => {
    const m = plain.parse(tn('is deleted'));
    const r = plain.getComplement(newGantt(), m);
    expect(r.isFail()).toBe(false);
    expect(r.get()).toEqual({});
  });

  it('execute is the subclass hook (java:72)', () => {
    const d = newGantt();
    expect(plain.execute(d, 's', 'c').isOk()).toBe(true);
    expect(plain.calls).toEqual([['s', 'c']]);
  });

  it('skipSpaces jumps over leading spaces only; 〴s is CharClassRaw.SPACE, a blank (java:51, 158-161)', () => {
    const nav = tn('   x');
    VerbPhraseAction.skipSpaces(nav);
    expect(nav.toString()).toBe('x');
    VerbPhraseAction.skipSpaces(nav);
    expect(nav.toString()).toBe('x');
    const tab = tn('\tx');
    VerbPhraseAction.skipSpaces(tab);
    expect(tab.toString()).toBe('\tx');
  });
});
