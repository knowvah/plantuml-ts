/**
 * Shared assertions of the complex-factory tests: a factory's `ready()`
 * column over every `ready` scenario, and `create` scenarios against the
 * jar's structural dump, terminator and preferred dimension.
 */
import { expect, it } from 'vitest';
import { create, type FactoryName, jar, lines, readyAnswer, scenarioNames } from './complex-factory-support.js';

/**
 * Batch-2 ports that word a Java crash differently from the JDK
 * (`Positionner2.ts:78`, `ElementPyramid.ts` `at()`): the jar's message →
 * the port's.
 */
const PORT_MESSAGE: Readonly<Record<string, string>> = {
  'NullPointerException: Cannot invoke "net.sourceforge.plantuml.salt.Cell.mergeLeft()" because "this.last" is null':
    'NullPointerException: Positionner2.last is null',
  'ArrayIndexOutOfBoundsException: Index 2 out of bounds for length 2': 'Index 2 out of bounds for length 2',
};

/** `ready()` of `name` answers as the jar's on every `ready` scenario. */
export function readyColumnMatchesJar(name: FactoryName): void {
  it.each(scenarioNames('ready'))(`${name}.ready() on %s answers as the jar`, (scenario) => {
    expect(readyAnswer(name, lines('ready', scenario))).toBe(jar(scenario)[name]);
  });
}

/** Every listed `create` scenario builds the jar's element tree (or throws the jar's crash). */
export function createRowsMatchJar(scenarios: readonly string[]): void {
  it.each(scenarios)('create %s matches the jar', (scenario) => {
    const expected = jar(scenario);
    const actual = create(lines('create', scenario));
    if (typeof expected.error === 'string') {
      expect(actual).toEqual({ error: PORT_MESSAGE[expected.error] ?? expected.error });
      return;
    }
    expect(actual).toEqual(expected);
  });
}
