/**
 * CommandCreoleSpace.test.ts — pins the port of
 * `klimt/creole/command/CommandCreoleSpace.java` (pattern
 * `^(\<space:(\d+)/?\>)`, starter `<s`, `stripe.addSpace(size)`) and
 * `klimt/creole/atom/AtomSpace.java` (dimension `(width, 1)`, altitude 0,
 * empty draw). Jar evidence: salt/neguge-98-cilu043 (`<space:20>` cells).
 */
import { describe, expect, test } from 'vitest';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { buildStripeAtoms } from '../../../../../../src/core/klimt/creole/legacy/StripeSimple.js';
import {
  CREOLE_COMMANDS,
  CREOLE_COMMANDS_OTHER,
} from '../../../../../../src/core/klimt/creole/legacy/CommandCreoleBuilder.js';
import { createSpaceCommand } from '../../../../../../src/core/klimt/creole/command/CommandCreoleSpace.js';
import {
  SPACE_ATOM_HEIGHT,
  SPACE_ATOM_STARTING_ALTITUDE,
  spaceAtomDim,
} from '../../../../../../src/core/klimt/creole/atom/AtomSpace.js';
import { atomDim, drawAtom } from '../../../../../../src/core/annotations/blocks-creole-atoms.js';
import { chromeAtomOps } from '../../../../../../src/core/annotations/blocks-creole.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';

const PLAIN: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };
const BOUNDER = {} as StringBounder; // a space atom never measures text

describe('CommandCreoleSpace pattern', () => {
  const cmd = createSpaceCommand();
  test('starter is <s', () => {
    expect(cmd.starters).toEqual(['<s']);
  });
  test('matches <space:20> and <space:20/> with the full tag length', () => {
    expect(cmd.matchingSize('<space:20>', 0)).toBe(10);
    expect(cmd.matchingSize('<space:20/>', 0)).toBe(11);
    expect(cmd.matchingSize('ab<space:7>', 2)).toBe(9);
  });
  test('bare <space>, non-numeric and unterminated forms do not match', () => {
    expect(cmd.matchingSize('<space>', 0)).toBe(0);
    expect(cmd.matchingSize('<space:x>', 0)).toBe(0);
    expect(cmd.matchingSize('<space:20', 0)).toBe(0);
  });
  test('executeAndAdvance throws IllegalStateException when no match', () => {
    const stripe = { addSpace: () => undefined } as never;
    expect(() => cmd.executeAndAdvance('nope', 0, stripe)).toThrow('IllegalStateException');
  });
});

describe('space atom through the stripe', () => {
  test('<space:20> becomes one space atom of width 20, no literal text', () => {
    expect(buildStripeAtoms('a<space:20>b', PLAIN).map((a) => (a.kind === 'text' ? a.text : a))).toEqual([
      'a',
      { kind: 'space', width: 20 },
      'b',
    ]);
  });
  test('bare <space> stays literal text', () => {
    const atoms = buildStripeAtoms('<space>', PLAIN);
    expect(atoms.every((a) => a.kind === 'text')).toBe(true);
  });
});

describe('AtomSpace contract', () => {
  test('dimension is (width, 1); altitude 0', () => {
    const d = spaceAtomDim(20);
    expect([d.getWidth(), d.getHeight()]).toEqual([20, 1]);
    expect(SPACE_ATOM_HEIGHT).toBe(1);
    expect(SPACE_ATOM_STARTING_ALTITUDE).toBe(0);
  });
  test('chrome ops: dimension (20, 1), altitude 0, draw emits nothing', () => {
    const ops = chromeAtomOps(undefined, PLAIN);
    const atom = { kind: 'space', width: 20 } as const;
    const d = ops.calculateDimension(atom, BOUNDER);
    expect([d.getWidth(), d.getHeight()]).toEqual([20, 1]);
    expect(atomDim(atom, BOUNDER, undefined).getWidth()).toBe(20);
    expect(ops.getStartingAltitude(atom, BOUNDER)).toBe(0);
    const drawn: unknown[] = [];
    const ug = { draw: (x: unknown) => drawn.push(x), apply: () => ug } as unknown as UGraphic;
    drawAtom(atom, ug, undefined);
    expect(drawn).toEqual([]);
  });
});

describe('CommandCreoleBuilder registration (java:115)', () => {
  test('registered under <s in both maps, after the sup/sub commands', () => {
    for (const map of [CREOLE_COMMANDS, CREOLE_COMMANDS_OTHER]) {
      const list = map.get('<s') ?? [];
      const idx = list.findIndex((c) => c.matchingSize('<space:3>', 0) > 0);
      expect(idx).toBe(list.length - 1);
      expect(list.findIndex((c) => c.matchingSize('<sup>x', 0) > 0)).toBeLessThan(idx);
    }
  });
});
