/**
 * DUR T2: an inline atom (`<$sprite>`, `<img>`, `<&icon>`) recognized inside a
 * `[[url ...]]` label carries that url, so each atom gets its own
 * `startUrl`/`closeUrl` pair like `AtomSprite.java:73-80`,
 * `AtomImg.java:246-254`, `AtomOpenIconic.java:76-82`. An atom outside the
 * brackets carries none.
 */
import { describe, expect, test } from 'vitest';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { buildStripeAtoms } from '../../../../../../src/core/klimt/creole/legacy/StripeSimple.js';
import type { CreoleAtom } from '../../../../../../src/core/klimt/creole/atom/Atom.js';

const PLAIN: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };
const URL = 'http://plantuml.com';

function summary(atoms: readonly CreoleAtom[]): string[] {
  return atoms.map((a) => {
    if (a.kind === 'text') return `text:${a.text}@${a.url?.url ?? '-'}`;
    if (a.kind === 'inline') return `${a.atom.kind}@${a.url?.url ?? '-'}`;
    return a.kind;
  });
}

describe('StripeSimple stamps the active url on inline atoms', () => {
  test('openiconic inside [[url ...]] carries the url, text around it too', () => {
    const atoms = buildStripeAtoms(`pre [[${URL} before <&cloud> after]] post`, PLAIN);
    expect(summary(atoms)).toEqual([
      'text:pre @-',
      `text:before @${URL}`,
      `openiconic@${URL}`,
      `text: after@${URL}`,
      'text: post@-',
    ]);
  });

  test('openiconic outside any url carries no url', () => {
    const atoms = buildStripeAtoms('a <&cloud> b', PLAIN);
    expect(summary(atoms)).toEqual(['text:a @-', 'openiconic@-', 'text: b@-']);
    const inline = atoms.find((a) => a.kind === 'inline');
    expect(inline !== undefined && 'url' in inline).toBe(false);
  });

  test('the tooltip travels with the url', () => {
    const atoms = buildStripeAtoms(`[[${URL}{tip} <&cloud>]]`, PLAIN);
    const inline = atoms.find((a) => a.kind === 'inline');
    expect(inline?.kind === 'inline' ? inline.url : undefined).toEqual({ url: URL, tooltip: 'tip' });
  });
});
