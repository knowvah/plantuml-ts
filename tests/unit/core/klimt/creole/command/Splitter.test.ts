/**
 * `Splitter.htmlTag` / `purgeAllTag` (klimt/creole/command/Splitter.java:
 * 49-122, 140-142). The expected `htmlTag` below is transcribed from the Java
 * source with `String.raw` (each Java `\\` becomes one `\`), independently of
 * the port's own transcription.
 *
 * Jar cross-checks (1.2026.8beta1, `scripts/oracle-render.sh`): each
 * `tests/unit/salt/element/fixtures/field-length-*.puml` text field reserves
 * `getCharNumber(text) * 8` px (AbstractElementText.java:68-72, 90), i.e. the
 * length of `purgeAllTag(text)`; the cases marked "jar" below are those.
 */
import { describe, expect, it } from 'vitest';
import { Splitter } from '../../../../../../src/core/klimt/creole/command/Splitter.js';

/** `FontStyle#getRegexActivationPattern|getRegexDeactivationPattern`, in
 *  `EnumSet.allOf` (ordinal) order: PLAIN, ITALIC, BOLD, UNDERLINE, STRIKE,
 *  WAVE, BACKCOLOR (FontStyle.java:41, 88-111, 166-189). */
const FONT_STYLE_ARMS = [
  String.raw`\<[pP][lL][aA][iI][nN]\>`,
  String.raw`\</[pP][lL][aA][iI][nN]\>`,
  String.raw`\<[iI]\>`,
  String.raw`\</[iI]\>`,
  String.raw`\<[bB]\>`,
  String.raw`\</[bB]\>`,
  String.raw`\<[uU](?::(#[0-9a-fA-F]{6}|\w+))?\>`,
  String.raw`\</[uU]\>`,
  '<【strike┇STRIKE┇s┇S┇del┇DEL】〇?〘:〶$XC=【#〇{6}「0〜9a〜fA〜F」┇〇+〴w】〙>',
  String.raw`\</(?:s|S|strike|STRIKE|del|DEL)\>`,
  String.raw`\<[wW](?::(#[0-9a-fA-F]{6}|\w+))?\>`,
  String.raw`\</[wW]\>`,
  String.raw`\<[bB][aA][cC][kK](?::(#?\w+(?:[-\\|/]#?\w+)?))?\>`,
  String.raw`\</[bB][aA][cC][kK]\>`,
];

/** Splitter.java:94-120, in append order (`spritePattern` commented out, :115-116). */
const OTHER_ARMS = [
  String.raw`\<font(\s+size[%s]*=[%s]*[%g]?\d+[%g]?|[%s]+color[%s]*=\s*[%g]?(#[0-9a-fA-F]{1,6}|\w+)[%g]?)+[%s]*\>`,
  String.raw`\<color[\s:]+(#[0-9a-fA-F]{1,6}|#?\w+)[%s]*\>`,
  String.raw`\<size[\s:]+(\d+)[%s]*\>`,
  String.raw`\<sup\>`,
  String.raw`\<sub\>`,
  String.raw`\</font\>|\</color\>|\</size\>|\</text\>`,
  String.raw`\</sup\>|\</sub\>`,
  String.raw`\<qrcode[\s:]+([^>{}]+)(\{scale=(?:[0-9.]+)\})?\>`,
  String.raw`\<img\s+(src[%s]*=[%s]*[%q%g]?[^\s%g>]+[%q%g]?[%s]*|vspace\s*=\s*[%q%g]?\d+[%q%g]?\s*|valign[%s]*=[%s]*[%q%g]?(top|middle|bottom)[%q%g]?[%s]*)+\>`,
  String.raw`\<img[\s:]+([^>{}]+)(\{scale=(?:[0-9.]+)\})?\>`,
  String.raw`\<font[\s:]+([^>]+)/?\>`,
  String.raw`\[\[([^\[\]]+)\]\]`,
  String.raw`\<text[\s:]+([^>]+)/?\>`,
];

describe('Splitter.htmlTag (Splitter.java:84-122)', () => {
  it('is every FontStyle arm, then the thirteen tag patterns, joined by |', () => {
    expect(Splitter.htmlTag).toBe([...FONT_STYLE_ARMS, ...OTHER_ARMS].join('|'));
  });

  it('never appends "null": every FontStyle constant has both patterns (StringBuilder.append(null))', () => {
    expect(Splitter.htmlTag).not.toContain('null');
  });

  it('leaves spritePattern out (commented out, Splitter.java:115-116)', () => {
    expect(Splitter.htmlTag).not.toContain('\\$(');
  });
});

describe('Splitter.purgeAllTag (Splitter.java:140-142)', () => {
  it.each([
    ['<b>x', 'x'],
    ['x</i>', 'x'],
    ['<u:red>x', 'x'],
    ['<color:#FF0000>x', 'x'],
    ['<size:12>x', 'x'],
    ['<sup>x', 'x'],
    ['x</font>', 'x'],
    ['<img:x>y', 'y'],
    ['<font:Arial>x', 'x'],
    ['[[link]]x', 'x'],
    ['<text:fill=red>x', 'x'],
    ['<plain>a</plain>', 'a'],
    ['<w:red>a</w>', 'a'],
    ['<back:#red-blue>a</back>', 'a'],
    ['<sub>a</sub>', 'a'],
    ['<qrcode:hello{scale=2}>a', 'a'],
    ['<img src=x.png>a', 'a'],
    ['<img vspace=3 valign=top>a', 'a'],
    ['<font size=12>a', 'a'],
    ['a</text>', 'a'],
  ])('strips %s', (input, expected) => {
    expect(Splitter.purgeAllTag(input)).toBe(expected);
  });

  it.each(['**a**', '//a//', '--a--', '__a__', '~~a~~', '<&icon>', '<$sprite>', '<math>x</math>'])(
    'leaves %s alone',
    (input) => {
      expect(Splitter.purgeAllTag(input)).toBe(input);
    },
  );

  it('strips every tag in a string, not only the first (replaceAll)', () => {
    expect(Splitter.purgeAllTag('**Bold** <color:red>red</color> //it//')).toBe('**Bold** red //it//');
  });

  it('keeps <s>/<strike>/<del>: the STRIKE activation arm is UBREX text no java.util.regex string matches (jar)', () => {
    // FontStyle.java:102 returns the UBREX syntax from the regex getter; as a
    // Pattern it is literal 【…】 text around a mid-pattern `$` anchor.
    expect(Splitter.purgeAllTag('<s>ab</s>')).toBe('<s>ab');
    expect(Splitter.purgeAllTag('<strike>ab</strike>')).toBe('<strike>ab');
    expect(Splitter.purgeAllTag('<del>ab</DEL>')).toBe('<del>ab');
  });

  it('is case-sensitive: String.replaceAll is Pattern.compile, not Pattern2.cmpile (jar)', () => {
    expect(Splitter.purgeAllTag('<COLOR:red>ab</COLOR>')).toBe('<COLOR:red>ab</COLOR>');
    expect(Splitter.purgeAllTag('<B>ab</B>')).toBe('ab');
  });

  it('reads [%s] as the class {%, s}: no Pattern2.transform on this path (jar)', () => {
    expect(Splitter.purgeAllTag('<color:red >ab</color>')).toBe('<color:red >ab');
    expect(Splitter.purgeAllTag('<size:12%s>ab')).toBe('ab');
  });

  it("reads \\s as Java's [ \\t\\n\\x0B\\f\\r], not ECMAScript's (jar: NBSP is not stripped)", () => {
    expect(Splitter.purgeAllTag('<size:\u00A012>ab')).toBe('<size:\u00A012>ab');
    expect(Splitter.purgeAllTag('<size:\t12>ab')).toBe('ab');
  });
});
