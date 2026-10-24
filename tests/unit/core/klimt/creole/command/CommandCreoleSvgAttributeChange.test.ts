/**
 * CommandCreoleSvgAttributeChange.test.ts — `<text class=foo>…</text>`
 * (`CommandCreoleSvgAttributeChange.java:46-97`, registered at
 * `CommandCreoleBuilder.java:119-122`, pattern `Splitter.java:60`).
 */
import { describe, expect, it } from 'vitest';
import { buildStripeAtoms } from '../../../../../../src/core/klimt/creole/legacy/StripeSimple.js';
import { CREOLE_COMMANDS } from '../../../../../../src/core/klimt/creole/legacy/CommandCreoleBuilder.js';
import {
  createSvgAttributeChangeCommand,
  createSvgAttributeChangeEolCommand,
} from '../../../../../../src/core/klimt/creole/command/CommandCreoleSvgAttributeChange.js';
import { SvgAttributes } from '../../../../../../src/core/klimt/SvgAttributes.js';
import { changeAttributes, FontStyle, type FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';

const PLAIN: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

function summary(markup: string): readonly unknown[] {
  return buildStripeAtoms(markup, PLAIN).map((a) =>
    a.kind === 'text' ? [a.text, [...(a.font.svgAttributes?.attributes() ?? [])]] : a.kind,
  );
}

describe('CommandCreoleSvgAttributeChange', () => {
  it('draws the inner text only and hands its font the attributes in TreeMap order (java:84-97)', () => {
    expect(summary('<text class=foo id=dummy>message</text>')).toEqual([
      [
        'message',
        [
          ['class', 'foo'],
          ['id', 'dummy'],
        ],
      ],
    ]);
  });

  it('sorts keys whatever their source order (SvgAttributes.java:46)', () => {
    expect(summary('<text id=dummy class=foo>m</text>')).toEqual([
      [
        'm',
        [
          ['class', 'foo'],
          ['id', 'dummy'],
        ],
      ],
    ]);
  });

  it('restores the font after the tag (java:95), so trailing text carries none', () => {
    expect(summary('a<text k=v>b</text>c')).toEqual([
      ['a', []],
      ['b', [['k', 'v']]],
      ['c', []],
    ]);
  });

  it('recurses into group 3 as creole (java:94 analyzeAndAdd)', () => {
    const atoms = buildStripeAtoms('<text k=v>x **y** z</text>', PLAIN);
    expect(
      atoms.map((a) =>
        a.kind === 'text'
          ? [a.text, a.font.styles.has(FontStyle.BOLD), a.font.svgAttributes?.attributes().get('k')]
          : a.kind,
      ),
    ).toEqual([
      ['x ', false, 'v'],
      ['y', true, 'v'],
      [' z', false, 'v'],
    ]);
  });

  it('ends at the FIRST </text> (lazy `(.*?)`, java:50), so same-tag nesting is not a thing', () => {
    expect(summary('<text a=1 b=2><text b=3>x</text></text>')).toEqual([
      [
        '<text b=3>x',
        [
          ['a', '1'],
          ['b', '2'],
        ],
      ],
      ['</text>', []],
    ]);
  });

  it('changeAttributes puts the new pair over the old one (FontConfiguration.java:248-251)', () => {
    const outer = changeAttributes(PLAIN, SvgAttributes.build('a=1 b=2'));
    const inner = changeAttributes(outer, SvgAttributes.build('b=3'));
    expect([...inner.svgAttributes!.attributes()]).toEqual([
      ['a', '1'],
      ['b', '3'],
    ]);
    expect([...outer.svgAttributes!.attributes()]).toEqual([
      ['a', '1'],
      ['b', '2'],
    ]);
  });

  it('registers create() alone, so an unclosed tag is drawn literally (CommandCreoleBuilder.java:122)', () => {
    expect(summary('<text k=v>to the end')).toEqual([['<text k=v>to the end', []]]);
  });

  it('createEol() takes the rest of the line (patternEol, java:51,64-66)', () => {
    const eol = createSvgAttributeChangeEolCommand();
    const line = 'ab<text k=v>to the end';
    expect(eol.matchingSize(line, 2)).toBe(line.length - 2);
    expect(eol.matchingSize('<text>x', 0)).toBe(0);
  });

  it('starts at `<t` and is the only claimant of that starter (CommandCreoleBuilder.java:122)', () => {
    const registered = CREOLE_COMMANDS.get('<t');
    expect(registered).toHaveLength(1);
    expect(registered![0]!.starters).toEqual(['<t']);
  });

  it('does not match a bare <text> (pattern needs `[\\s:]+([^>]+)`, Splitter.java:60)', () => {
    expect(bracketed0('<text>x</text>')).toBe(0);
    expect(bracketed0('<text k=v>x</text>')).toBe('<text k=v>x</text>'.length);
    expect(bracketed0('<TEXT k=v>x</TEXT>')).toBe('<TEXT k=v>x</TEXT>'.length);
  });
});

/** `matchingSize` of the bracketed form at position 0. */
function bracketed0(line: string): number {
  return createSvgAttributeChangeCommand().matchingSize(line, 0);
}
