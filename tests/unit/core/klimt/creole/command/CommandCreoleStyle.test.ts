/**
 * CommandCreoleStyle.test.ts — A2s/B6: the extended-color activation arm
 * (`<u:#FF0000>` / `<w:green>` / `<s:#00FFFF>`) and the BACKCOLOR command
 * (`<back:red>` / `<back:red-green>`), exercised through `buildStripeAtoms`'s
 * full registration/dispatch path (`CommandCreoleBuilder.ts`'s command map),
 * matching this project's `StripeSimple.test.ts` convention of testing
 * through the public API rather than each `Command` object directly.
 *
 * Grammar oracle: the ubrex activation patterns (`FontStyle.java`
 * `getUbrexActivationPattern`, :113-139) — the form `CommandCreoleStyle.java`
 * actually compiles at runtime — NOT `getRegexActivationPattern` (:88-111,
 * used only by `Splitter.java`). The two disagree on BACKCOLOR: the regex
 * form allows `#?\w+` halves, the ubrex form allows `#hex6|\w+` first and
 * `hex6|\w+` (no `#`) second. Jar probe 2026-08-04 (mission A2s F-F,
 * scratchpad FF/probe): `<back:red-green>` consumed; `<back:#FF0000-#00FF00>`,
 * `<back:#red>`, `<b:#FF0000>` all left as raw text — ubrex wins.
 */
import { describe, expect, test } from 'vitest';
import { FontStyle, type FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { buildStripeAtoms } from '../../../../../../src/core/klimt/creole/legacy/StripeSimple.js';

const PLAIN: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };

function textAtoms(atoms: ReturnType<typeof buildStripeAtoms>): { text: string; styles: FontStyle[] }[] {
  return atoms.map((a) => {
    if (a.kind !== 'text') throw new Error('expected a text atom');
    return { text: a.text, styles: [...a.font.styles] };
  });
}

describe('extended-color activation arm — UNDERLINE / WAVE / STRIKE', () => {
  test('"<u:#FF0000>toto</u>" consumes the tag and styles the inner run UNDERLINE', () => {
    expect(textAtoms(buildStripeAtoms('<u:#FF0000>toto</u>', PLAIN))).toEqual([
      { text: 'toto', styles: [FontStyle.UNDERLINE] },
    ]);
  });

  test('"<w:green>green</w>" consumes the tag and styles the inner run WAVE', () => {
    expect(textAtoms(buildStripeAtoms('<w:green>green</w>', PLAIN))).toEqual([
      { text: 'green', styles: [FontStyle.WAVE] },
    ]);
  });

  test('"<s:#00FFFF>strike</s>" consumes the tag and styles the inner run STRIKE', () => {
    expect(textAtoms(buildStripeAtoms('<s:#00FFFF>strike</s>', PLAIN))).toEqual([
      { text: 'strike', styles: [FontStyle.STRIKE] },
    ]);
  });

  test('the xicipi-57 note line measures with all three tags consumed', () => {
    const atoms = buildStripeAtoms(
      'hello <u:#FF0000>toto</u> and <w:green>green</w> and <s:#00FFFF>strike</s> ok.',
      PLAIN,
    );
    expect(textAtoms(atoms)).toEqual([
      { text: 'hello ', styles: [] },
      { text: 'toto', styles: [FontStyle.UNDERLINE] },
      { text: ' and ', styles: [] },
      { text: 'green', styles: [FontStyle.WAVE] },
      { text: ' and ', styles: [] },
      { text: 'strike', styles: [FontStyle.STRIKE] },
      { text: ' ok.', styles: [] },
    ]);
  });

  test('EOL form with a color ("<u:red>rest of line") styles to end of line', () => {
    expect(textAtoms(buildStripeAtoms('a <u:red>rest of line', PLAIN))).toEqual([
      { text: 'a ', styles: [] },
      { text: 'rest of line', styles: [FontStyle.UNDERLINE] },
    ]);
  });

  test('"<strike:red>x</strike>" long-form STRIKE alias also takes a color', () => {
    expect(textAtoms(buildStripeAtoms('<strike:red>x</strike>', PLAIN))).toEqual([
      { text: 'x', styles: [FontStyle.STRIKE] },
    ]);
  });

  test('BOLD has no color arm — "<b:#FF0000>boldcolor</b>" stays raw text (jar probe a4)', () => {
    expect(textAtoms(buildStripeAtoms('<b:#FF0000>boldcolor</b>', PLAIN))).toEqual([
      { text: '<b:#FF0000>boldcolor</b>', styles: [] },
    ]);
  });

  test('a non-hex6, non-word color arg ("<u:#FF00>x</u>") does not match — raw text', () => {
    expect(textAtoms(buildStripeAtoms('<u:#FF00>x</u>', PLAIN))).toEqual([
      { text: '<u:#FF00>x</u>', styles: [] },
    ]);
  });
});

describe('BACKCOLOR — "<back:color>...</back>"', () => {
  test('"<back:red>ok</back>" consumes the tag and styles the inner run BACKCOLOR', () => {
    expect(textAtoms(buildStripeAtoms('<back:red>ok</back>', PLAIN))).toEqual([
      { text: 'ok', styles: [FontStyle.BACKCOLOR] },
    ]);
  });

  test('"<back:#FF0000>x</back>" hex6 color is accepted', () => {
    expect(textAtoms(buildStripeAtoms('<back:#FF0000>x</back>', PLAIN))).toEqual([
      { text: 'x', styles: [FontStyle.BACKCOLOR] },
    ]);
  });

  test('colorless "<back>x</back>" is accepted (optional arm)', () => {
    expect(textAtoms(buildStripeAtoms('<back>x</back>', PLAIN))).toEqual([
      { text: 'x', styles: [FontStyle.BACKCOLOR] },
    ]);
  });

  test('EOL form ("<back:red>rest of line") styles to end of line', () => {
    expect(textAtoms(buildStripeAtoms('a <back:red>rest of line', PLAIN))).toEqual([
      { text: 'a ', styles: [] },
      { text: 'rest of line', styles: [FontStyle.BACKCOLOR] },
    ]);
  });

  test('a latex atom inside "<back:gray>...</back>" still dispatches (gevozu-46 shape; recursion runs the full unified scan)', () => {
    const atoms = buildStripeAtoms('<back:gray><latex>x+y</latex></back>', PLAIN);
    expect(atoms).toHaveLength(1);
    expect(atoms[0]!.kind).toBe('latex');
  });

  test('named-named gradient "<back:red-green>gradA</back>" is consumed (jar probe a1)', () => {
    expect(textAtoms(buildStripeAtoms('<back:red-green>gradA</back>', PLAIN))).toEqual([
      { text: 'gradA', styles: [FontStyle.BACKCOLOR] },
    ]);
  });

  test('gradient with "#" second half "<back:#FF0000-#00FF00>" stays raw (jar probe a2, ubrex grammar)', () => {
    expect(textAtoms(buildStripeAtoms('<back:#FF0000-#00FF00>gradB</back>', PLAIN))).toEqual([
      { text: '<back:#FF0000-#00FF00>gradB</back>', styles: [] },
    ]);
  });

  test('"<back:#red>hashname</back>" stays raw (jar probe a3, ubrex grammar rejects #\\w+)', () => {
    expect(textAtoms(buildStripeAtoms('<back:#red>hashname</back>', PLAIN))).toEqual([
      { text: '<back:#red>hashname</back>', styles: [] },
    ]);
  });

  test('the ziripa-77 note line measures with all four tags consumed', () => {
    const atoms = buildStripeAtoms(
      'hello <u:#FF0000>toto</u> and <w:green>green</w> and <s:#00FFFF>strike</s> <back:red>ok</back>.',
      PLAIN,
    );
    expect(textAtoms(atoms)).toEqual([
      { text: 'hello ', styles: [] },
      { text: 'toto', styles: [FontStyle.UNDERLINE] },
      { text: ' and ', styles: [] },
      { text: 'green', styles: [FontStyle.WAVE] },
      { text: ' and ', styles: [] },
      { text: 'strike', styles: [FontStyle.STRIKE] },
      { text: ' ', styles: [] },
      { text: 'ok', styles: [FontStyle.BACKCOLOR] },
      { text: '.', styles: [] },
    ]);
  });
});

describe('bare-tag regressions (must stay green)', () => {
  test('"<u>x</u>" bare underline still works', () => {
    expect(textAtoms(buildStripeAtoms('<u>x</u>', PLAIN))).toEqual([{ text: 'x', styles: [FontStyle.UNDERLINE] }]);
  });

  test('"<w>x</w>" bare wave still works', () => {
    expect(textAtoms(buildStripeAtoms('<w>x</w>', PLAIN))).toEqual([{ text: 'x', styles: [FontStyle.WAVE] }]);
  });

  test('"<s>x</s>" bare strike still works', () => {
    expect(textAtoms(buildStripeAtoms('<s>x</s>', PLAIN))).toEqual([{ text: 'x', styles: [FontStyle.STRIKE] }]);
  });

  test('"<b>x</b>" bold still works (shares the "<b" starter with BACKCOLOR)', () => {
    expect(textAtoms(buildStripeAtoms('<b>x</b>', PLAIN))).toEqual([{ text: 'x', styles: [FontStyle.BOLD] }]);
  });
});
