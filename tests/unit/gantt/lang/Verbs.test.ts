import { describe, expect, it } from 'vitest';
import { Verbs } from '../../../../src/diagrams/gantt/lang/Verbs.js';

const accepts = (v: Verbs, s: string): boolean => v.toUnicodeBracketedExpression().match(s).exactMatch();

describe('Verbs', () => {
  it.each([
    [Verbs.are, 'are', 'is'],
    [Verbs.areColored, 'are colored', 'are  colour'],
    [Verbs.areColored, 'are coloured', 'are'],
    [Verbs.displayOnSameRowAs, 'display on same row as', 'displays on same row'],
    [Verbs.displayOnSameRowAs, 'displays  on  same  row  as', 'display on a row as'],
    [Verbs.ends, 'ends', 'end'],
    [Verbs.happens, 'happens', 'happen'],
    [Verbs.is, 'is', 'are'],
    [Verbs.isColored, 'is colored', 'is  coloured red'],
    [Verbs.isDeleted, 'is deleted', 'is delete'],
    [Verbs.isDisplayedAs, 'is displayed as', 'is displayed'],
    [Verbs.isOff, 'is off', 'is on'],
    [Verbs.isOn, 'is on', 'is off'],
    [Verbs.isOrAre, 'are', 'was'],
    [Verbs.isOrAreNamed, 'is named', 'named'],
    [Verbs.just, 'just', 'justly'],
    [Verbs.linksTo, 'links to', 'link to'],
    [Verbs.occurs, 'occurs', 'occur'],
    [Verbs.pauses, 'pauses', 'pause'],
    [Verbs.requires, 'lasts', 'last'],
    [Verbs.starts, 'starts', 'start'],
    [Verbs.worksOn, 'works on', 'work on'],
  ])('%#: accepts the corpus sample and rejects the near-miss', (verb, ok, ko) => {
    expect(accepts(verb, ok)).toBe(true);
    expect(accepts(verb, ko)).toBe(false);
  });

  it('isOrAre / requires alternatives (Verbs.java:62,67)', () => {
    expect(accepts(Verbs.isOrAre, 'is')).toBe(true);
    expect(accepts(Verbs.isOrAreNamed, 'are named')).toBe(true);
    expect(accepts(Verbs.requires, 'requires')).toBe(true);
  });

  it('toUnicodeBracketedExpression returns the constructor leaf (Verbs.java:45-51)', () => {
    expect(Verbs.is.toUnicodeBracketedExpression()).toBe(Verbs.is.toUnicodeBracketedExpression());
    expect(Verbs.is.toUnicodeBracketedExpression()).not.toBe(Verbs.are.toUnicodeBracketedExpression());
  });
});
