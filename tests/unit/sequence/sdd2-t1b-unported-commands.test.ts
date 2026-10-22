/**
 * sdd2 T1b: `CommandActivate2`, `CommandUrl` and the GENDER arm of
 * `CommandHideShowByGender`, each asserted through `parseSequence`.
 */
import { describe, expect, it } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { ActivationEvent, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { hideStereotypeCommand } from '../../../src/diagrams/sequence/command-common.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(sequenceSource(lines));
  if ('refused' in result) throw new Error(`refused (${result.kind}) at ${String(result.line)}: ${result.message}`);
  return result;
}

const lifeEvents = (ast: SequenceDiagramAST): ActivationEvent[] =>
  ast.events.filter((e): e is ActivationEvent => e.kind === 'activate' || e.kind === 'deactivate');

describe('CommandActivate2 (CommandActivate2.java:58-66,91-100)', () => {
  it('`IT++` activates the participant, `IT1--` deactivates it', () => {
    const ast = parse(['A -> IT : go', 'IT++', 'IT --', 'IT++ #red']);
    expect(lifeEvents(ast).map((e) => [e.kind, e.participantId, e.color])).toEqual([
      ['activate', 'IT', undefined],
      ['deactivate', 'IT', undefined],
      ['activate', 'IT', '#red'],
    ]);
  });

  it('declares the participant when absent (getOrCreateParticipant, :93)', () => {
    const ast = parse(['IT1++']);
    expect(ast.participants.map((p) => p.id)).toEqual(['IT1']);
  });
});

describe('CommandUrl (CommandUrl.java:60-70,88-100)', () => {
  it('sets the participant url from `url of X is [[...]]`', () => {
    const ast = parse(['participant APP', 'url of APP is [[http://x.org/]]']);
    expect(ast.participants[0]!.url).toEqual({ url: 'http://x.org/', tooltip: 'http://x.org/' });
  });

  it('declares an absent participant and accepts the `for`/no-`is` forms', () => {
    const ast = parse(['url for Repo [[http://y.org]]']);
    expect(ast.participants.map((p) => p.id)).toEqual(['Repo']);
    expect(ast.participants[0]!.url?.url).toBe('http://y.org');
  });
});

describe('CommandHideShowByGender, sequence arm (:163-166)', () => {
  it('`hide << new >> stereotype` hides stereotypes, ignoring the gender', () => {
    const ast = parse(['hide << new >> stereotype', 'participant A <<new>>']);
    expect(ast.options.hideStereotype).toBe(true);
  });

  it('`show stereotype` clears it; non-stereotype portions are inert', () => {
    expect(parse(['participant A', 'hide stereotype', 'show stereotype']).options.hideStereotype).toBe(false);
    expect(parse(['participant A', 'hide class members']).options.hideStereotype).toBeUndefined();
    expect(hideStereotypeCommand.pattern.test('hide members')).toBe(true);
  });
});
