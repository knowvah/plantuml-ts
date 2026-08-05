/**
 * A2s R2i — creole atom pipeline wiring for the class side:
 *  1. header creole routing (CreoleMode.FULL_BUT_UNDERSCORE),
 *  2. quoted-alias lazy display capture (curupe-50-kibu120),
 *  3. `<:emoji:>` atom (CommandCreoleEmoji/AtomEmoji, lecelo-92-loma110),
 *  4. per-row heights (MemberRowBuild.height, lozego-15-coci435),
 *  5. `<<($sprite,color)>>` badge decoration (rotisi-30-loge424).
 * Every numeric expectation below is traced to an upstream expression or a
 * jar golden — see each test's own comment.
 */
import { describe, expect, test } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import { buildLineAtoms, buildStripeAtoms } from '../../../src/core/klimt/creole/legacy/StripeSimple.js';
import { CreoleMode } from '../../../src/core/klimt/creole/CreoleMode.js';
import { retrieveEmoji, emojiCharacter } from '../../../src/core/klimt/creole/Emoji.js';
import { emojiFactor, emojiBoxDim } from '../../../src/core/klimt/creole/atom/AtomEmoji.js';
import {
  buildMemberAtoms,
  resolveMemberAtoms,
  buildMemberRow,
} from '../../../src/diagrams/class/class-member-creole.js';
import { sectionHeight, buildSectionRows } from '../../../src/diagrams/class/class-member-rows.js';
import {
  parseCircledSpriteDecoration,
  splitStereotypeLabels,
} from '../../../src/diagrams/class/class-stereotype.js';
import { parseIdDisplay } from '../../../src/diagrams/class/class-declaration-extractors.js';
import { createSpriteRegistry, addSprite } from '../../../src/core/sprite-commands.js';
import { SpriteMonochrome } from '../../../src/core/klimt/sprite/SpriteMonochrome.js';

const measurer = new WidthTableMeasurer();
const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: null, styles: new Set() };
const FONT_SPEC = { family: 'sans-serif', size: 14 };

function registryWith(name: string, w: number, h: number): ReturnType<typeof createSpriteRegistry> {
  const registry = createSpriteRegistry();
  const sprite = new SpriteMonochrome(w, h, 16);
  addSprite(registry, name, sprite);
  return registry;
}

describe('Emoji registry (oracle jar emoji.txt)', () => {
  test('shortcut and unicode both retrieve (Emoji.retrieve, lowercased)', () => {
    expect(retrieveEmoji('wrench')).toMatchObject({ unicode: '1f527', shortcut: 'wrench' });
    expect(retrieveEmoji('1f527')).toMatchObject({ unicode: '1f527' });
    expect(retrieveEmoji('WRENCH')).toMatchObject({ unicode: '1f527' });
    expect(retrieveEmoji('hammer_and_wrench')).toMatchObject({ unicode: '1f6e0' });
    expect(retrieveEmoji('label')).toMatchObject({ unicode: '1f3f7' });
    expect(retrieveEmoji('no_such_emoji_name')).toBeUndefined();
  });

  test('emojiCharacter decodes the hex codepoint', () => {
    expect(emojiCharacter('1f527')).toBe('\u{1F527}');
  });
});

describe('CommandCreoleEmoji (Splitter.emojiPattern) -> emoji atom', () => {
  test('<:wrench:> becomes one emoji atom, factor = fontSize/24 (AtomEmoji ctor)', () => {
    const atoms = buildStripeAtoms('<:wrench:>', FONT);
    expect(atoms).toHaveLength(1);
    expect(atoms[0]).toMatchObject({ kind: 'emoji', name: 'wrench', unicode: '1f527', color: null });
    expect((atoms[0] as { factor: number }).factor).toBeCloseTo(14 / 24, 10);
  });

  test('scale suffix multiplies the factor (Parser.getScale)', () => {
    const atoms = buildStripeAtoms('<:wrench:{scale=2}>', FONT);
    expect((atoms[0] as { factor: number }).factor).toBeCloseTo(emojiFactor(2, 14), 10);
    const star = buildStripeAtoms('<:wrench:*3>', FONT);
    expect((star[0] as { factor: number }).factor).toBeCloseTo(emojiFactor(3, 14), 10);
  });

  test('<#color:name:> prefix forces the tint; #black maps to the ambient font color', () => {
    const red = buildStripeAtoms('<#FF0000:wrench:>', FONT);
    expect((red[0] as { color: string | null }).color).toBe('#FF0000');
    const fontWithColor: FontConfiguration = { ...FONT, color: '#123456' };
    const black = buildStripeAtoms('<#black:wrench:>', fontWithColor);
    expect((black[0] as { color: string | null }).color).toBe('#123456');
  });

  test('unknown emoji name falls back to the ¿name? RED text run (addEmoji java:246-250)', () => {
    const atoms = buildStripeAtoms('<:zzznope:>', FONT);
    expect(atoms).toHaveLength(1);
    expect(atoms[0]).toMatchObject({ kind: 'text', text: '¿zzznope?' });
    expect((atoms[0] as { font: FontConfiguration }).font.color).toBe('#FF0000');
  });

  test('registered in BOTH maps: SIMPLE_LINE (member rows) and FULL_BUT_UNDERSCORE (headers) parse it', () => {
    for (const mode of [CreoleMode.SIMPLE_LINE, CreoleMode.FULL_BUT_UNDERSCORE, CreoleMode.FULL]) {
      const built = buildLineAtoms('<:wrench:> x', FONT, mode);
      expect(built.atoms[0]).toMatchObject({ kind: 'emoji', name: 'wrench' });
    }
  });
});

describe('resolveMemberAtoms — emoji sizing (AtomEmoji 36f box / 39f line)', () => {
  test('lecelo-92 line shape: emoji box 36*(14/24)=21 wide, line height 39*(14/24)=22.75', () => {
    const atoms = buildMemberAtoms('<:wrench:> wrench', FONT);
    const build = resolveMemberAtoms(atoms, FONT, measurer);
    const textW = measurer.measure(' wrench', FONT_SPEC).width;
    expect(build.width).toBeCloseTo(21 + textW, 6);
    expect(build.height).toBeCloseTo(22.75, 10); // 3 such lines + 10 = lecelo's 78.25px header
    // Renders as the platform glyph text run at the box width.
    expect(build.atoms[0]).toMatchObject({ kind: 'text', text: '\u{1F527}', width: 21 });
  });

  test('emojiBoxDim matches the ported constants', () => {
    expect(emojiBoxDim(14 / 24)).toEqual({ width: 21, height: 22.75 });
  });
});

describe('MemberRowBuild.height (lozego-15-coci435 per-row heights)', () => {
  test('plain row height = atomTextLineHeight(fontSize) (fontSize, floored 10)', () => {
    expect(buildMemberRow('+name: String', {}, FONT_SPEC, measurer).height).toBe(14);
    expect(buildMemberRow('x', {}, { family: 'sans-serif', size: 6 }, measurer).height).toBe(10);
  });

  test('sprite row height = spriteHeight * fontSize/13 (CommandCreoleSprite java:82)', () => {
    const registry = registryWith('test', 50, 100);
    const build = buildMemberRow('<$test>', {}, FONT_SPEC, measurer, registry);
    // lozego golden: 100 * 14/13 = 107.6923 -> node 2.162393in exact.
    expect(build.height).toBeCloseTo((100 * 14) / 13, 6);
    expect(build.width).toBeCloseTo((50 * 14) / 13, 6);
  });

  test('sectionHeight sums per-row heights over the 8px margin envelope', () => {
    const registry = registryWith('test', 50, 100);
    const sprite = buildMemberRow('<$test>', {}, FONT_SPEC, measurer, registry);
    const plain = buildMemberRow('+a', {}, FONT_SPEC, measurer);
    expect(sectionHeight([])).toBe(8);
    expect(sectionHeight([plain, plain])).toBe(8 + 28); // == old count * rowHeight
    expect(sectionHeight([sprite, plain])).toBeCloseTo(8 + (100 * 14) / 13 + 14, 6);
  });

  test('buildSectionRows advances y by each PRIOR row\'s own height', () => {
    const registry = registryWith('test', 50, 100);
    const sprite = buildMemberRow('<$test>', {}, FONT_SPEC, measurer, registry);
    const plain = buildMemberRow('+a', {}, FONT_SPEC, measurer);
    const member = { visibility: '+', hidden: false } as never;
    const rows = buildSectionRows(
      [member, member], ['<$test>', '+a'], [sprite, plain], 0, false,
      { baselineOffset: 11, iconZoneWidth: 14 },
    );
    expect(rows[1]!.y - rows[0]!.y).toBeCloseTo((100 * 14) / 13, 6);
  });
});

describe('parseCircledSpriteDecoration (rotisi-30 <<($bug16,red)>> badge)', () => {
  test('captures name + color; scale defaults to 1 (buildComplex java:190-201)', () => {
    expect(parseCircledSpriteDecoration('($bug16,red)')).toEqual({ name: 'bug16', scale: 1, color: 'red' });
    expect(parseCircledSpriteDecoration('($bug16)')).toEqual({ name: 'bug16', scale: 1 });
    expect(parseCircledSpriteDecoration('$bug16')).toEqual({ name: 'bug16', scale: 1 }); // paren optional
    expect(parseCircledSpriteDecoration('($s{scale=2})')).toEqual({ name: 's', scale: 2 });
    expect(parseCircledSpriteDecoration(undefined)).toBeUndefined();
    expect(parseCircledSpriteDecoration('Singleton')).toBeUndefined();
  });

  test('single char form still routes to the char parser, not the sprite parser', () => {
    expect(parseCircledSpriteDecoration('(F,orange)')).toBeUndefined();
  });

  test('sprite decoration is stripped from the visible stereo labels', () => {
    expect(splitStereotypeLabels('($bug16,red)')).toEqual([]);
    // Residual label after the closing paren stays visible (LABEL group).
    expect(splitStereotypeLabels('($bug16) Stereo')).toEqual(['Stereo']);
  });
});

describe('parseIdDisplay — lazy quoted display capture (curupe-50-kibu120)', () => {
  test('""Test"" as foo4 -> display "Test" (inner quotes kept, NameAndCodeParser lazy .+?)', () => {
    expect(parseIdDisplay('""Test"" as foo4')).toMatchObject({ display: '"Test"', id: 'foo4' });
  });

  test('"""Test""" as foo5 -> display ""Test"" (creole monospace markup preserved)', () => {
    expect(parseIdDisplay('"""Test""" as foo5')).toMatchObject({ display: '""Test""', id: 'foo5' });
  });

  test('multi-line display with inner-quoted line (foo6): capture spans to the LAST quote', () => {
    const rest = String.raw`"REST resource\n""http://example.com/resource/001/""" as foo6`;
    expect(parseIdDisplay(rest)).toMatchObject({
      display: String.raw`REST resource\n""http://example.com/resource/001/""`,
      id: 'foo6',
    });
  });

  test('CODE as "DISPLAY" is untouched (CODE char class excludes quotes)', () => {
    expect(parseIdDisplay('a as "b"')).toMatchObject({ display: 'b', id: 'a' });
  });

  test('plain quoted display + alias unchanged', () => {
    expect(parseIdDisplay('"My Class" as mc')).toMatchObject({ display: 'My Class', id: 'mc' });
  });
});

describe('header creole routing — measurement identity for plain names', () => {
  test('a plain name builds ONE text atom measuring byte-identical to the raw measure', () => {
    for (const name of ['__Test__', 'Order', 'Instruction$Visitor', 'a.b.C']) {
      const built = buildLineAtoms(name, FONT, CreoleMode.FULL_BUT_UNDERSCORE);
      expect(built.atoms).toHaveLength(1);
      expect(built.atoms[0]).toMatchObject({ kind: 'text', text: name });
      const resolved = resolveMemberAtoms(built.atoms, FONT, measurer);
      expect(resolved.width).toBe(measurer.measure(name, FONT_SPEC).width);
      expect(resolved.height).toBe(14);
    }
  });

  test('""Test"" in a header consumes the mono delimiters (curupe foo5 mechanism)', () => {
    const built = buildLineAtoms('""Test""', FONT, CreoleMode.FULL_BUT_UNDERSCORE);
    expect(built.atoms).toHaveLength(1);
    expect(built.atoms[0]).toMatchObject({ kind: 'text', text: 'Test' });
    expect((built.atoms[0] as { font: FontConfiguration }).font.family).toBe('monospaced');
  });
});
