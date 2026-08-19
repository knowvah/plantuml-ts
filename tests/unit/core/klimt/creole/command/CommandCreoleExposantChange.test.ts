/**
 * CommandCreoleExposantChange.test.ts — SI30 T1: `<sup>`/`<sub>` exercised
 * through `buildStripeAtoms`/`buildLineAtoms`'s full registration/dispatch
 * path (`CommandCreoleBuilder.ts`'s command map), matching this directory's
 * existing convention of testing through the public API rather than each
 * `Command` object directly.
 *
 * Upstream:
 * `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleExposantChange.java`
 * and `.../klimt/creole/legacy/CommandCreoleBuilder.java:104-105`.
 */
import { describe, expect, test } from 'vitest';
import { FontStyle, getFont, type FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { FontPosition } from '../../../../../../src/core/klimt/font/FontPosition.js';
import {
  buildStripeAtoms,
  buildLineAtoms,
} from '../../../../../../src/core/klimt/creole/legacy/StripeSimple.js';
import type { CreoleAtom } from '../../../../../../src/core/klimt/creole/atom/Atom.js';

const PLAIN: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

interface TextShape {
  readonly text: string;
  readonly size: number;
  readonly fontPosition: FontPosition | undefined;
  readonly styles: FontStyle[];
}

function textOf(atom: CreoleAtom): TextShape {
  if (atom.kind !== 'text') throw new Error('expected a text atom');
  return {
    text: atom.text,
    size: atom.font.size,
    fontPosition: atom.font.fontPosition,
    styles: [...atom.font.styles],
  };
}

describe('CommandCreoleExposantChange — bracketed form (java:65-70)', () => {
  test('<sup>x</sup> yields one EXPOSANT text atom', () => {
    const { atoms } = buildLineAtoms('<sup>x</sup>', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: 'x', size: 14, fontPosition: FontPosition.EXPOSANT, styles: [] },
    ]);
  });

  test('<sub>x</sub> yields one INDICE text atom', () => {
    const { atoms } = buildLineAtoms('<sub>x</sub>', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: 'x', size: 14, fontPosition: FontPosition.INDICE, styles: [] },
    ]);
  });

  test('the position is restored after the closing tag (java:95)', () => {
    const atoms = buildStripeAtoms('a<sup>b</sup>c', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: 'a', size: 14, fontPosition: undefined, styles: [] },
      { text: 'b', size: 14, fontPosition: FontPosition.EXPOSANT, styles: [] },
      { text: 'c', size: 14, fontPosition: undefined, styles: [] },
    ]);
  });

  test('outer styles survive the position change (fc is copied, java:91)', () => {
    const atoms = buildStripeAtoms('//<sup>x</sup>//', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: 'x', size: 14, fontPosition: FontPosition.EXPOSANT, styles: [FontStyle.ITALIC] },
    ]);
  });

  test('the capture is LAZY — first closing tag wins (ChallengeUpTo.java:46-56)', () => {
    const atoms = buildStripeAtoms('<sup>a</sup>b</sup>', PLAIN);
    // The capture stops at the FIRST `</sup>`; the trailing one is never a
    // closing tag for anything and stays literal in the following run.
    expect(atoms.map(textOf)).toEqual([
      { text: 'a', size: 14, fontPosition: FontPosition.EXPOSANT, styles: [] },
      { text: 'b</sup>', size: 14, fontPosition: undefined, styles: [] },
    ]);
  });
});

describe('CommandCreoleExposantChange — no match cases', () => {
  test('an unclosed <sup> stays literal text (no createEol form upstream)', () => {
    const atoms = buildStripeAtoms('<sup>x', PLAIN);
    expect(atoms.map((a) => textOf(a).text).join('')).toBe('<sup>x');
    expect(atoms.every((a) => textOf(a).fontPosition === undefined)).toBe(true);
  });

  test('an EMPTY capture is matchingSize 0 -> literal (java:75-77)', () => {
    const atoms = buildStripeAtoms('<sup></sup>', PLAIN);
    expect(atoms.map((a) => textOf(a).text).join('')).toBe('<sup></sup>');
    expect(atoms.every((a) => textOf(a).fontPosition === undefined)).toBe(true);
  });

  test('the pattern is case-sensitive, and "<S" is not even a starter (java:56-58)', () => {
    const atoms = buildStripeAtoms('<SUP>x</SUP>', PLAIN);
    expect(atoms.every((a) => textOf(a).fontPosition === undefined)).toBe(true);
  });

  test('the shared "<s" starter still reaches CommandCreoleSizeChange first', () => {
    const atoms = buildStripeAtoms('<size:20>big</size>', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: 'big', size: 20, fontPosition: undefined, styles: [] },
    ]);
  });

  test('the shared "<s" starter still reaches the legacy STRIKE form', () => {
    const atoms = buildStripeAtoms('<s>gone</s>', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: 'gone', size: 14, fontPosition: undefined, styles: [FontStyle.STRIKE] },
    ]);
  });
});

describe('lazy mute on nesting (decisions.md#D1, FontConfiguration.java:98-104)', () => {
  test('<sup><size:20>x</size></sup> stores 20 and reads 17', () => {
    const atoms = buildStripeAtoms('<sup><size:20>x</size></sup>', PLAIN);
    expect(atoms).toHaveLength(1);
    const atom = atoms[0]!;
    if (atom.kind !== 'text') throw new Error('expected a text atom');
    expect(atom.font.size).toBe(20);
    expect(atom.font.fontPosition).toBe(FontPosition.EXPOSANT);
    expect(getFont(atom.font).size).toBe(17);
  });

  test('<size:20><sup>x</sup></size> reads 17 too (order does not matter)', () => {
    const atoms = buildStripeAtoms('<size:20><sup>x</sup></size>', PLAIN);
    expect(atoms).toHaveLength(1);
    const atom = atoms[0]!;
    if (atom.kind !== 'text') throw new Error('expected a text atom');
    expect(getFont(atom.font).size).toBe(17);
  });

  test('nested <sub> inside <sup> keeps only the innermost position', () => {
    const atoms = buildStripeAtoms('<sup><sub>x</sub></sup>', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: 'x', size: 14, fontPosition: FontPosition.INDICE, styles: [] },
    ]);
  });
});
