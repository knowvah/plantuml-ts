import { expect, it } from 'vitest';
import { Verbs } from '../../../../src/diagrams/gantt/lang/Verbs.js';
import { Words } from '../../../../src/diagrams/gantt/lang/Words.js';
import { VerbPhraseMatcher } from '../../../../src/diagrams/gantt/ulang/VerbPhraseMatcher.js';

it('holds the verb and complement matchers (VerbPhraseMatcher.java:45-61)', () => {
  const verb = Verbs.starts.toUnicodeBracketedExpression().match('starts');
  const comp = Words.usingle('x').match('x');
  const v = new VerbPhraseMatcher(verb, comp);
  expect(v.getVerbMatch()).toBe(verb);
  expect(v.getComplementMatcher()).toBe(comp);
});

it('toString joins the two matchers (VerbPhraseMatcher.java:51-53)', () => {
  const m = (s: string) => ({ toString: () => s }) as never;
  expect(new VerbPhraseMatcher(m('V'), m('C')).toString()).toBe('- V    +    C');
});
