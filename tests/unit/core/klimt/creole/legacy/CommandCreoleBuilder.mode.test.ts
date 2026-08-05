/**
 * CommandCreoleBuilder.mode.test.ts — A2s R2a: the FULL vs OTHER command
 * maps (upstream: `CommandCreoleBuilder.FULL`/`.OTHER`, java:69-70; the
 * ONLY difference is the creole-pure `__underline__` command, gated
 * `if (modeSimpleLine == CreoleMode.FULL)` at java:85-86) selected by
 * `StripeSimple`'s mode parameter (StripeSimple.java:112-115 — every
 * non-FULL mode, including `FULL_BUT_UNDERSCORE` and `SIMPLE_LINE`, gets
 * the OTHER map).
 *
 * Jar evidence for the class-name reach (curupe-50-kibu120 golden +
 * scratchpad/R2a/probe1): `__Test__` as a class NAME measures RAW (8
 * chars — `EntityImageClassHeader.java:107-108` passes
 * `CreoleMode.FULL_BUT_UNDERSCORE`), while `""Test""` still monospaces —
 * so the OTHER map must keep every other command, dropping only `__`.
 */
import { describe, expect, test } from 'vitest';
import { FontStyle, type FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { buildStripeAtoms, buildLineAtoms } from '../../../../../../src/core/klimt/creole/legacy/StripeSimple.js';
import { CreoleMode } from '../../../../../../src/core/klimt/creole/CreoleMode.js';
import type { CreoleAtom } from '../../../../../../src/core/klimt/creole/atom/Atom.js';
import { MONOSPACED } from '../../../../../../src/core/klimt/creole/Parser.js';

const PLAIN: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

function textOf(atom: CreoleAtom): { text: string; family: string; styles: FontStyle[] } {
  if (atom.kind !== 'text') throw new Error('expected a text atom');
  return { text: atom.text, family: atom.font.family, styles: [...atom.font.styles] };
}

describe('CommandCreoleBuilder FULL vs OTHER maps', () => {
  test('FULL (default) consumes creole __underline__', () => {
    const atoms = buildStripeAtoms('__Test__', PLAIN);
    expect(atoms.map(textOf)).toEqual([{ text: 'Test', family: 'sans-serif', styles: [FontStyle.UNDERLINE] }]);
  });

  test('FULL_BUT_UNDERSCORE leaves __Test__ raw (the class-name header mode)', () => {
    const atoms = buildStripeAtoms('__Test__', PLAIN, CreoleMode.FULL_BUT_UNDERSCORE);
    expect(atoms.map(textOf)).toEqual([{ text: '__Test__', family: 'sans-serif', styles: [] }]);
  });

  test('OTHER map keeps the legacy <u>underline</u> form (only the creole __ form is FULL-gated)', () => {
    const atoms = buildStripeAtoms('<u>Test</u>', PLAIN, CreoleMode.FULL_BUT_UNDERSCORE);
    expect(atoms.map(textOf)).toEqual([{ text: 'Test', family: 'sans-serif', styles: [FontStyle.UNDERLINE] }]);
  });

  test('OTHER map keeps every other command (""mono"" still consumed in FULL_BUT_UNDERSCORE)', () => {
    const atoms = buildStripeAtoms('""Test""', PLAIN, CreoleMode.FULL_BUT_UNDERSCORE);
    expect(atoms.map(textOf)).toEqual([{ text: 'Test', family: MONOSPACED, styles: [] }]);
  });

  test('SIMPLE_LINE also selects the OTHER map (StripeSimple.java:112-115 non-FULL branch)', () => {
    const atoms = buildStripeAtoms('__Test__ and **bold**', PLAIN, CreoleMode.SIMPLE_LINE);
    expect(atoms.map(textOf)).toEqual([
      { text: '__Test__ and ', family: 'sans-serif', styles: [] },
      { text: 'bold', family: 'sans-serif', styles: [FontStyle.BOLD] },
    ]);
  });

  test('buildLineAtoms threads the mode through to the stripe build', () => {
    const build = buildLineAtoms('__Test__', PLAIN, CreoleMode.FULL_BUT_UNDERSCORE);
    expect(build.atoms.map(textOf)).toEqual([{ text: '__Test__', family: 'sans-serif', styles: [] }]);
  });
});
