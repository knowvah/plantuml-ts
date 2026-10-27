import { describe, expect, it } from 'vitest';
import { Verbs } from '../../../../src/diagrams/gantt/lang/Verbs.js';
import { Words } from '../../../../src/diagrams/gantt/lang/Words.js';
import { ParsedSentence } from '../../../../src/diagrams/gantt/ulang/ParsedSentence.js';
import { VerbPhraseMatcher } from '../../../../src/diagrams/gantt/ulang/VerbPhraseMatcher.js';

const named = (s: string) => ({ toString: () => s }) as never;

// Corpus sentences "[Task] starts ..." / "is colored ..." split subject / verb / complement.
const SENTENCES: [string, Verbs, string, string][] = [
  ['starts', Verbs.starts, 'starts', 's'],
  ['is colored', Verbs.isColored, 'is colored', 'c'],
  ['links to', Verbs.linksTo, 'links to', 'l'],
  ['works on', Verbs.worksOn, 'works on', 'w'],
  ['happens', Verbs.happens, 'happens', 'h'],
];

describe('ParsedSentence', () => {
  it.each(SENTENCES)('%s: exposes first phrase parts (ParsedSentence.java:67-73)', (_t, verb, text, comp) => {
    const vm = verb.toUnicodeBracketedExpression().match(text);
    const cm = Words.usingle(comp).match(comp);
    const subject = Words.usingle('T').match('T');
    const s = new ParsedSentence(subject, [new VerbPhraseMatcher(vm, cm)]);
    expect(s.getMatcherSubject()).toBe(subject);
    expect(s.getVerbMatch()).toBe(vm);
    expect(s.getComplementMatcher()).toBe(cm);
    expect(s.getVerbMatch().exactMatch()).toBe(true);
  });

  it('copies the list defensively and exposes it read-only (:49-52)', () => {
    const phrases = [new VerbPhraseMatcher(named('a'), named('b'))];
    const s = new ParsedSentence(named('S'), phrases);
    phrases.push(new VerbPhraseMatcher(named('c'), named('d')));
    expect(s.getVerbPhrases()).toHaveLength(1);
    expect(Object.isFrozen(s.getVerbPhrases())).toBe(true);
  });

  it('toString follows Java List formatting (:54-57)', () => {
    const p = (a: string, b: string) => new VerbPhraseMatcher(named(a), named(b));
    expect(new ParsedSentence(named('S'), [p('a', 'b'), p('c', 'd')]).toString()).toBe(
      '\n {S} /\n       [- a    +    b, - c    +    d]',
    );
    expect(new ParsedSentence(named('S'), []).toString()).toBe('\n {S} /\n       []');
  });

  it('getVerbMatch on an empty list throws like List.get(0) (:67-73)', () => {
    const s = new ParsedSentence(named('S'), []);
    expect(() => s.getVerbMatch()).toThrow('IndexOutOfBoundsException');
    expect(() => s.getComplementMatcher()).toThrow('IndexOutOfBoundsException');
  });
});
