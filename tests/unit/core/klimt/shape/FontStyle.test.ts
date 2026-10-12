/**
 * `FontStyle#getRegexActivationPattern` / `getRegexDeactivationPattern`
 * (klimt/font/FontStyle.java:88-111, 166-189), ported beside the `FontStyle`
 * constants in `klimt/shape/UText.ts`. Expected strings are the Java string
 * literals' runtime values (`String.raw`: each Java `\\` is one `\`).
 */
import { describe, expect, it } from 'vitest';
import {
  FontStyle,
  getRegexActivationPattern,
  getRegexDeactivationPattern,
} from '../../../../../src/core/klimt/shape/UText.js';

describe('FontStyle#getRegexActivationPattern (FontStyle.java:88-111)', () => {
  it.each([
    [FontStyle.PLAIN, String.raw`\<[pP][lL][aA][iI][nN]\>`],
    [FontStyle.ITALIC, String.raw`\<[iI]\>`],
    [FontStyle.BOLD, String.raw`\<[bB]\>`],
    [FontStyle.UNDERLINE, String.raw`\<[uU](?::(#[0-9a-fA-F]{6}|\w+))?\>`],
    [FontStyle.WAVE, String.raw`\<[wW](?::(#[0-9a-fA-F]{6}|\w+))?\>`],
    [FontStyle.BACKCOLOR, String.raw`\<[bB][aA][cC][kK](?::(#?\w+(?:[-\\|/]#?\w+)?))?\>`],
    // java:102 returns the UBREX spelling verbatim (same literal as getUbrexActivationPattern, :131).
    [FontStyle.STRIKE, '<【strike┇STRIKE┇s┇S┇del┇DEL】〇?〘:〶$XC=【#〇{6}「0〜9a〜fA〜F」┇〇+〴w】〙>'],
  ])('%s', (style, expected) => {
    expect(getRegexActivationPattern(style)).toBe(expected);
  });
});

describe('FontStyle#getRegexDeactivationPattern (FontStyle.java:166-189)', () => {
  it.each([
    [FontStyle.PLAIN, String.raw`\</[pP][lL][aA][iI][nN]\>`],
    [FontStyle.ITALIC, String.raw`\</[iI]\>`],
    [FontStyle.BOLD, String.raw`\</[bB]\>`],
    [FontStyle.UNDERLINE, String.raw`\</[uU]\>`],
    [FontStyle.WAVE, String.raw`\</[wW]\>`],
    [FontStyle.BACKCOLOR, String.raw`\</[bB][aA][cC][kK]\>`],
    [FontStyle.STRIKE, String.raw`\</(?:s|S|strike|STRIKE|del|DEL)\>`],
  ])('%s', (style, expected) => {
    expect(getRegexDeactivationPattern(style)).toBe(expected);
  });
});
