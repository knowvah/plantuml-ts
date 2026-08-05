/**
 * CommandCreoleMonospaced.test.ts — A2s round 2 (R2a, curupe-50-kibu120):
 * the creole `""text""` monospace command, exercised through
 * `buildStripeAtoms`'s full registration/dispatch path
 * (`CommandCreoleBuilder.ts`'s command map), matching this directory's
 * `CommandCreoleL2.test.ts` convention of testing through the public API.
 *
 * Jar-probe evidence (scratchpad/R2a/probe1, 2026-08-05): the deterministic
 * jar renders `""Test""`-shaped display text as a `font-family="monospace"`
 * run containing ONLY the inner text (`Test`, textLength 27.2125 at 14pt —
 * the SAME width the sans table gives, since the deterministic bounder
 * ignores family), the `""` delimiters consumed. Width conformance therefore
 * needs no measurer change — only the delimiter consumption + family swap.
 */
import { describe, expect, test } from 'vitest';
import { FontStyle, type FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { buildStripeAtoms } from '../../../../../../src/core/klimt/creole/legacy/StripeSimple.js';
import type { CreoleAtom } from '../../../../../../src/core/klimt/creole/atom/Atom.js';
import { MONOSPACED } from '../../../../../../src/core/klimt/creole/Parser.js';

const PLAIN: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

function textOf(atom: CreoleAtom): { text: string; family: string; size: number; styles: FontStyle[] } {
  if (atom.kind !== 'text') throw new Error('expected a text atom');
  return { text: atom.text, family: atom.font.family, size: atom.font.size, styles: [...atom.font.styles] };
}

describe('CommandCreoleMonospaced', () => {
  test('""text"" swaps the family to monospaced for the inner text only', () => {
    const atoms = buildStripeAtoms('""mono""rest', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: 'mono', family: MONOSPACED, size: 14, styles: [] },
      { text: 'rest', family: 'sans-serif', size: 14, styles: [] },
    ]);
  });

  test('the curupe-50 shape: ""Test"" alone becomes exactly one monospaced run', () => {
    const atoms = buildStripeAtoms('""Test""', PLAIN);
    expect(atoms.map(textOf)).toEqual([{ text: 'Test', family: MONOSPACED, size: 14, styles: [] }]);
  });

  test('an unclosed "" pair stays literal text (pattern needs the closing "")', () => {
    const atoms = buildStripeAtoms('""not closed', PLAIN);
    expect(atoms.map(textOf)).toEqual([{ text: '""not closed', family: 'sans-serif', size: 14, styles: [] }]);
  });

  test('lazy inner capture: """Test""" consumes `"""Test""` and leaves the last quote plain', () => {
    // Upstream `^(""(.*?)"")` semantics: group(2) = `"Test` (lazy), the
    // trailing lone `"` falls through as plain text — jar-identical.
    const atoms = buildStripeAtoms('"""Test"""', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: '"Test', family: MONOSPACED, size: 14, styles: [] },
      { text: '"', family: 'sans-serif', size: 14, styles: [] },
    ]);
  });

  test('nests inside an active bold run (outer styles preserved)', () => {
    const atoms = buildStripeAtoms('**""mono bold""**', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: 'mono bold', family: MONOSPACED, size: 14, styles: [FontStyle.BOLD] },
    ]);
  });

  test('font state is restored after the run (style command still applies later)', () => {
    const atoms = buildStripeAtoms('a""m""**b**', PLAIN);
    expect(atoms.map(textOf)).toEqual([
      { text: 'a', family: 'sans-serif', size: 14, styles: [] },
      { text: 'm', family: MONOSPACED, size: 14, styles: [] },
      { text: 'b', family: 'sans-serif', size: 14, styles: [FontStyle.BOLD] },
    ]);
  });

  test('empty inner capture ("""" -> zero-length inner) contributes no atom', () => {
    const atoms = buildStripeAtoms('""""x', PLAIN);
    expect(atoms.map(textOf)).toEqual([{ text: 'x', family: 'sans-serif', size: 14, styles: [] }]);
  });
});
