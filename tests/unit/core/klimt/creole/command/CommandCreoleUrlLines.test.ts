/**
 * CommandCreoleUrlLines.test.ts — `[[url label]]` with a multi-line label
 * (`AtomTextUtils.java:79-92`: `Display.getWithNewlines(pragma, label)` with
 * more than one line -> one url text per line, stacked in
 * `AtomVerticalTexts`; one line -> the single atom, unchanged).
 */
import { describe, expect, it } from 'vitest';
import { buildStripeAtoms } from '../../../../../../src/core/klimt/creole/legacy/StripeSimple.js';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';

const PLAIN: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };
const URL = 'http://www.address.com';
const LINK = { url: URL, tooltip: URL };

describe('CommandCreoleUrl label lines (AtomTextUtils.java:79-92)', () => {
  it('stacks one url-tagged text per escaped-newline line', () => {
    const atoms = buildStripeAtoms(`[[${URL} Line 3\\nLine 4]]`, PLAIN);
    expect(atoms).toHaveLength(1);
    const stack = atoms[0];
    expect(stack?.kind).toBe('vertical');
    if (stack?.kind !== 'vertical') return;
    expect(stack.lines.map((line) => line.map((a) => (a.kind === 'text' ? [a.text, a.url] : a.kind)))).toEqual([
      [['Line 3', LINK]],
      [['Line 4', LINK]],
    ]);
  });

  it('leaves a one-line label as the plain url text atom', () => {
    const atoms = buildStripeAtoms(`[[${URL} Line 1 Line 2]]`, PLAIN);
    expect(atoms.map((a) => (a.kind === 'text' ? [a.text, a.url] : a.kind))).toEqual([['Line 1 Line 2', LINK]]);
  });
});
