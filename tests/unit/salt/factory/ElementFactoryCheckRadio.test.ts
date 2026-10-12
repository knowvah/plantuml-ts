/**
 * ElementFactoryCheckboxOn/Off and ElementFactoryRadioOn/Off against the
 * 1.2026.8beta1 jar. `ready()` is the Java's `startsWith` on the next token
 * (CheckboxOn.java:78 `[X]`, CheckboxOff.java:79 `[]`/`[ ]`, RadioOn.java:78
 * `(X)`, RadioOff.java:77 `()`/`( )`); `create()` consumes one token and
 * keeps its terminator, and builds the `ElementRadioCheckbox` whose drawing
 * equals the jar's `widget-*` oracle (tests/unit/salt/element/fixtures).
 */
import { describe, expect, it } from 'vitest';
import type { ISkinSimple } from '../../../../src/core/style/ISkinSimple.js';
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import { ElementFactoryCheckboxOff } from '../../../../src/diagrams/salt/factory/ElementFactoryCheckboxOff.js';
import { ElementFactoryCheckboxOn } from '../../../../src/diagrams/salt/factory/ElementFactoryCheckboxOn.js';
import { ElementFactoryRadioOff } from '../../../../src/diagrams/salt/factory/ElementFactoryRadioOff.js';
import { ElementFactoryRadioOn } from '../../../../src/diagrams/salt/factory/ElementFactoryRadioOn.js';
import type { ElementFactory } from '../../../../src/diagrams/salt/factory/ElementFactory.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { Terminator } from '../../../../src/diagrams/salt/Terminator.js';
import { drawAt, jarElements } from '../element/widget-test-support.js';

type Make = (source: DataSourceImpl, sprites: ISkinSimple) => ElementFactory;

interface Case {
  readonly name: string;
  readonly make: Make;
  readonly fixture: string;
  readonly line: string;
  readonly yes: readonly string[];
  readonly no: readonly string[];
}

const CASES: readonly Case[] = [
  {
    name: 'ElementFactoryCheckboxOn',
    make: (s, p) => new ElementFactoryCheckboxOn(s, p),
    fixture: 'widget-checkbox-on',
    line: '[X] Checked box',
    yes: ['[X] a'],
    no: ['[] a', '[ ] a', '(X) a', '[x] a', 'plain'],
  },
  {
    name: 'ElementFactoryCheckboxOff',
    make: (s, p) => new ElementFactoryCheckboxOff(s, p),
    fixture: 'widget-checkbox-off',
    line: '[] Unchecked box',
    yes: ['[] a', '[ ] a'],
    no: ['[X] a', '() a', '( ) a', 'plain'],
  },
  {
    name: 'ElementFactoryRadioOn',
    make: (s, p) => new ElementFactoryRadioOn(s, p),
    fixture: 'widget-radio-on',
    line: '(X) Checked radio',
    yes: ['(X) a'],
    no: ['() a', '( ) a', '[X] a', '(x) a', 'plain'],
  },
  {
    name: 'ElementFactoryRadioOff',
    make: (s, p) => new ElementFactoryRadioOff(s, p),
    fixture: 'widget-radio-off',
    line: '() Unchecked radio',
    yes: ['() a', '( ) a'],
    no: ['(X) a', '[] a', '[ ] a', 'plain'],
  },
];

describe.each(CASES)('$name', ({ make, fixture, line, yes, no }) => {
  const sprites = new SaltDictionary();

  it.each(yes)('ready() is true for %j', (text) => {
    expect(make(new DataSourceImpl([text]), sprites).ready()).toBe(true);
  });

  it.each(no)('ready() is false for %j and create() throws', (text) => {
    const factory = make(new DataSourceImpl([text]), sprites);
    expect(factory.ready()).toBe(false);
    expect(() => factory.create()).toThrow('IllegalStateException');
  });

  it('create() draws the jar shapes and consumes one token with its terminator', () => {
    const source = new DataSourceImpl([line, 'tail']);
    const created = make(source, sprites).create();
    expect(drawAt(created.getElement(), 0)).toEqual(jarElements(fixture));
    expect(created.getTerminator()).toBe(Terminator.NEWLINE);
    expect(source.peek(0).getElement()).toBe('tail');
  });
});

describe('create() keeps the token terminator', () => {
  it('a | separated checkbox ends on NEWCOL', () => {
    const created = new ElementFactoryCheckboxOn(new DataSourceImpl(['[X] a | b']), new SaltDictionary()).create();
    expect(created.getTerminator()).toBe(Terminator.NEWCOL);
  });
});
