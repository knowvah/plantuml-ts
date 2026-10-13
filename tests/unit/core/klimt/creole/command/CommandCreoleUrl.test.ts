/**
 * CommandCreoleUrl — the `[[...]]` command resolves its url / tooltip / label
 * through `UrlBuilder#getUrl` (`CommandCreoleUrl.java#executeAndAdvance`:
 * `new UrlBuilder(topurl, UrlMode.STRICT).getUrl(m.group(1))`), and matches
 * with `Pattern2.cmpile("^(" + UrlBuilder.getRegexp() + ")")`.
 *
 * Expected values come from the jar oracles cached at
 * `test-results/dot-cache/wbs/<slug>/in.svg`.
 */
import { describe, expect, test } from 'vitest';
import { FontStyle, type FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { buildStripeAtoms } from '../../../../../../src/core/klimt/creole/legacy/StripeSimple.js';
import { createUrlCommand } from '../../../../../../src/core/klimt/creole/command/CommandCreoleUrl.js';
import type { CreoleAtom } from '../../../../../../src/core/klimt/creole/atom/Atom.js';

const PLAIN: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

/** The `Example:` url / tooltip of `wbs/link-URL-tooltip-1` and `wbs/xasinu-75-sabe690`. */
const EXAMPLE = 'Example:\\n\\nconst char* msg1 = <U+0022>\\<U+200B>nHello,world!<U+0022>;';

function linked(atoms: readonly CreoleAtom[]): { text: string; url: string; tooltip: string }[] {
  return atoms.flatMap((a) =>
    a.kind === 'text' && a.url !== undefined ? [{ text: a.text, url: a.url.url, tooltip: a.url.tooltip }] : [],
  );
}

describe('CommandCreoleUrl -> UrlBuilder.getUrl (UrlBuilder.java:104-128)', () => {
  test('QUOTED arm: the quoted part is the url, the trailing word the label, tooltip defaults to the url', () => {
    // wbs/link-URL-tooltip-1, wbs/zeneno-39-bize297: jar href = EXAMPLE, text = `TP`.
    const atoms = buildStripeAtoms(`[["${EXAMPLE}" TP]]`, PLAIN);
    expect(linked(atoms)).toEqual([{ text: 'TP', url: EXAMPLE, tooltip: EXAMPLE }]);
  });

  test('ONLY_TOOLTIP_AND_LABEL arm: url is "" and the braces are the tooltip', () => {
    // wbs/xasinu-75-sabe690, wbs/link-URL-tooltip-2: jar href="", text `TP`.
    const atoms = buildStripeAtoms(`[[{${EXAMPLE}} TP]]`, PLAIN);
    expect(linked(atoms)).toEqual([{ text: 'TP', url: '', tooltip: EXAMPLE }]);
  });

  test('LINK_TOOLTIP_NOLABEL arm: link + {tooltip}, label defaults to the link', () => {
    const atoms = buildStripeAtoms('[[http://a.com {tip with spaces}]]', PLAIN);
    expect(linked(atoms)).toEqual([{ text: 'http://a.com', url: 'http://a.com', tooltip: 'tip with spaces' }]);
  });

  test('LINK arm with tooltip and label', () => {
    const atoms = buildStripeAtoms('[[http://a.com{tip} the label]]', PLAIN);
    expect(linked(atoms)).toEqual([{ text: 'the label', url: 'http://a.com', tooltip: 'tip' }]);
  });

  test('a label is never re-split on whitespace (the regex label group is one capture)', () => {
    const atoms = buildStripeAtoms('[[https://dawkins.com Dawkins and co]]', PLAIN);
    expect(linked(atoms)).toEqual([
      { text: 'Dawkins and co', url: 'https://dawkins.com', tooltip: 'https://dawkins.com' },
    ]);
  });

  test('the label group keeps its trailing whitespace (greedy `[^\\[\\]]*` before END_PART)', () => {
    // Jar probe plans/wbs-engine-port/measurements/T5a/probes/url-arms.svg: the
    // following `x` sits one space-width past the label's textLength.
    const atoms = buildStripeAtoms('[[http://a.com{tip} the label ]]x', PLAIN);
    expect(linked(atoms)).toEqual([{ text: 'the label ', url: 'http://a.com', tooltip: 'tip' }]);
  });

  test('two spaces between link and label match none of the five arms -> no url atom', () => {
    // The optional label `(?:[%s]([^%s{}\[\]]...))?` takes exactly ONE leading
    // whitespace; END_PART then needs `]]` (UrlBuilder.java:76-80).
    // Jar probe url-arms.svg draws `a [[http://a.com  two]]` as literal text.
    const atoms = buildStripeAtoms('[[http://a.com  two]]', PLAIN);
    expect(linked(atoms)).toEqual([]);
  });

  test('the drawn label keeps the hyperlink font (blue + underline by default)', () => {
    const atoms = buildStripeAtoms('[[http://a.com x]]', PLAIN);
    const first = atoms[0];
    expect(first?.kind === 'text' ? [first.font.color, [...first.font.styles]] : undefined).toEqual([
      '#0000FF',
      [FontStyle.UNDERLINE],
    ]);
  });

  test('a null hyperlinkUnderlineStroke draws no underline (FontConfiguration.java:335-340)', () => {
    const atoms = buildStripeAtoms('[[http://a.com x]]', { ...PLAIN, hyperlinkUnderlineStroke: null });
    const first = atoms[0];
    expect(first?.kind === 'text' ? [...first.font.styles] : undefined).toEqual([]);
  });

  test('matchingSize is the whole `[[...]]` group-1 length, 0 when no arm matches', () => {
    const cmd = createUrlCommand();
    expect(cmd.matchingSize('ab[[http://a.com x]]cd', 2)).toBe(18);
    expect(cmd.matchingSize('[[a,b],[c,d]]', 0)).toBe(0);
  });

  test('the pattern is case-insensitive and token-transformed like Pattern2.cmpile', () => {
    // `%g` admits the typographic quotes U+201C/U+201D (Pattern2.java:58).
    const atoms = buildStripeAtoms('[[“http://q.com” lbl]]', PLAIN);
    expect(linked(atoms)).toEqual([{ text: 'lbl', url: 'http://q.com', tooltip: 'http://q.com' }]);
  });

  test('executeAndAdvance throws IllegalStateException when the pattern does not match', () => {
    const cmd = createUrlCommand();
    expect(() => cmd.executeAndAdvance('no url here', 0, undefined as never)).toThrow('IllegalStateException');
  });
});
