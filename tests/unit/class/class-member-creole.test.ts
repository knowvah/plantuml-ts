/**
 * class-member-creole.test.ts — G2 N22: unit tests for the class member-row
 * creole-atom seam (`src/diagrams/class/class-member-creole.ts`).
 *
 * Coverage: measurement-identity for plain (no-markup) text (this mission's
 * own HARD BOUNDARY), inline style commands (bold/italic/underline/strike/
 * color), member-level `{abstract}`/`{static}` font seeding, and inline
 * img/sprite atom resolution (SI5b sprite reuse).
 */
import { describe, expect, test } from 'vitest';
import {
  memberBaseFont,
  buildMemberAtoms,
  resolveMemberAtoms,
  buildMemberRow,
  buildWrappedMemberRows,
  atomsToPlainText,
  splitMemberDisplayLines,
} from '../../../src/diagrams/class/class-member-creole.js';
import { FontStyle, getFont } from '../../../src/core/klimt/shape/UText.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import type { MemberRenderAtom } from '../../../src/diagrams/class/class-member-creole.js';
import { FormulaMeasurer, WidthTableMeasurer } from '../../../src/core/measurer.js';
import { renderLatexAsImage } from '../../../src/core/latex.js';
import { createSpriteRegistry, addSprite } from '../../../src/core/sprite-commands.js';
import { SpriteMonochrome } from '../../../src/core/klimt/sprite/SpriteMonochrome.js';
import { encodePng, toBase64DataUri } from '../../../src/core/klimt/sprite/png-encoder.js';

const measurer = new FormulaMeasurer();
const FONT_SPEC = { family: 'sans-serif', size: 14 };
const BASE_FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: null, styles: new Set() };

function buildSpriteRegistryWithFoo(): ReturnType<typeof createSpriteRegistry> {
  const registry = createSpriteRegistry();
  const sprite = new SpriteMonochrome(4, 4, 16);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) sprite.setGray(x, y, (x + y) % 16);
  }
  addSprite(registry, 'foo', sprite);
  return registry;
}

const TINY_PNG_URI = toBase64DataUri(encodePng(new Uint8Array(2 * 2 * 4).fill(0xff), 2, 2));

describe('memberBaseFont', () => {
  test('plain member: no styles, color null', () => {
    const font = memberBaseFont(FONT_SPEC, {});
    expect(font.styles.size).toBe(0);
    expect(font.color).toBeNull();
    expect(font.family).toBe('sans-serif');
    expect(font.size).toBe(14);
  });

  test('{abstract} member -> ITALIC', () => {
    const font = memberBaseFont(FONT_SPEC, { isAbstract: true });
    expect(font.styles.has(FontStyle.ITALIC)).toBe(true);
    expect(font.styles.has(FontStyle.UNDERLINE)).toBe(false);
  });

  test('{static} member -> UNDERLINE', () => {
    const font = memberBaseFont(FONT_SPEC, { isStatic: true });
    expect(font.styles.has(FontStyle.UNDERLINE)).toBe(true);
    expect(font.styles.has(FontStyle.ITALIC)).toBe(false);
  });

  test('{static abstract} member -> both', () => {
    const font = memberBaseFont(FONT_SPEC, { isAbstract: true, isStatic: true });
    expect(font.styles.has(FontStyle.ITALIC)).toBe(true);
    expect(font.styles.has(FontStyle.UNDERLINE)).toBe(true);
  });
});

describe('buildMemberAtoms — measurement identity (mission HARD BOUNDARY)', () => {
  test('plain text with no creole markup: exactly one atom, untouched text', () => {
    const atoms = buildMemberAtoms('+getName(): String', BASE_FONT);
    expect(atoms).toHaveLength(1);
    expect(atoms[0]).toEqual({ kind: 'text', text: '+getName(): String', font: BASE_FONT });
  });

  test('generic type angle brackets (List<String>) never trip a creole command', () => {
    const atoms = buildMemberAtoms('+items: List<String>', BASE_FONT);
    expect(atoms).toHaveLength(1);
    expect(atoms[0]).toMatchObject({ kind: 'text', text: '+items: List<String>' });
  });

  test('plain text measures identically through resolveMemberAtoms as a direct measurer call', () => {
    const text = '+getName(): String';
    const atoms = buildMemberAtoms(text, BASE_FONT);
    const build = resolveMemberAtoms(atoms, BASE_FONT, measurer);
    const direct = measurer.measure(text, FONT_SPEC).width;
    expect(build.width).toBe(direct);
  });

  test('HORIZONTAL_LINE-shaped member text (pathological) falls back to one plain atom', () => {
    const atoms = buildMemberAtoms('----', BASE_FONT);
    expect(atoms).toEqual([{ kind: 'text', text: '----', font: BASE_FONT }]);
  });
});

describe('buildMemberAtoms — inline creole style commands', () => {
  test('<b>bold</b> tail splits into a bold run + a plain run', () => {
    const atoms = buildMemberAtoms('<b>bold</b> tail', BASE_FONT);
    expect(atoms).toHaveLength(2);
    expect(atoms[0]).toMatchObject({ kind: 'text', text: 'bold' });
    expect((atoms[0] as { font: FontConfiguration }).font.styles.has(FontStyle.BOLD)).toBe(true);
    expect(atoms[1]).toMatchObject({ kind: 'text', text: ' tail' });
    expect((atoms[1] as { font: FontConfiguration }).font.styles.has(FontStyle.BOLD)).toBe(false);
  });

  test('<color:red>text</color> resolves to a hex color on the atom font', () => {
    const atoms = buildMemberAtoms('<color:red>warn</color>', BASE_FONT);
    expect(atoms).toHaveLength(1);
    expect((atoms[0] as { font: FontConfiguration }).font.color).toBe('#FF0000');
  });

  test('--strike--able text (deprecated method marker, sojave-47-pura962) strikes through', () => {
    // A member line shaped EXACTLY `--word--` with nothing else (no
    // suffix/prefix) is a whole-line-anchored SECTION_HEADER match in
    // `classifyStripeLine` -- the SAME "embedded-label separator" case
    // `CreoleStripeSimpleParser.ts`'s own doc comment reports as an
    // unported LITERAL fallback, not STRIKE (matches real upstream, which
    // treats `--word--` as a section header at ANY CreoleMode). The real
    // corpus fixture's shape has a trailing `(): void` suffix, so the
    // anchored pattern does NOT match -- the string falls through to
    // NORMAL, where the (unanchored) `--...--` STRIKE creole command DOES
    // fire as a substring match.
    const atoms = buildMemberAtoms('--deprecatedMethod--(): void', BASE_FONT);
    expect(atoms).toHaveLength(2);
    expect(atoms[0]).toMatchObject({ kind: 'text', text: 'deprecatedMethod' });
    expect((atoms[0] as { font: FontConfiguration }).font.styles.has(FontStyle.STRIKE)).toBe(true);
    expect(atoms[1]).toMatchObject({ kind: 'text', text: '(): void' });
    expect((atoms[1] as { font: FontConfiguration }).font.styles.has(FontStyle.STRIKE)).toBe(false);
  });

  test('a whole-line `--word--` member (anchored, no suffix) is the SAME LITERAL fallback classifyStripeLine documents for description separators -- NOT struck (matches real upstream SECTION_HEADER precedence)', () => {
    const atoms = buildMemberAtoms('--deprecatedMethod--', BASE_FONT);
    expect(atoms).toHaveLength(1);
    expect(atoms[0]).toEqual({ kind: 'text', text: '--deprecatedMethod--', font: BASE_FONT });
  });

  test('summed atom width equals the sum of each run measured independently', () => {
    const atoms = buildMemberAtoms('<b>bold</b> tail', BASE_FONT);
    const build = resolveMemberAtoms(atoms, BASE_FONT, measurer);
    const boldWidth = measurer.measure('bold', { ...FONT_SPEC, weight: 'bold' }).width;
    const tailWidth = measurer.measure(' tail', FONT_SPEC).width;
    expect(build.width).toBeCloseTo(boldWidth + tailWidth, 6);
  });
});

describe('resolveMemberAtoms — inline img/sprite atoms', () => {
  test('unresolved sprite name (no registry) contributes nothing', () => {
    const atoms = buildMemberAtoms('<$foo> label', BASE_FONT);
    const build = resolveMemberAtoms(atoms, BASE_FONT, measurer);
    // Only the ' label' text atom survives -- the sprite atom is dropped.
    expect(build.atoms).toHaveLength(1);
    expect(build.atoms[0]).toMatchObject({ kind: 'text', text: ' label' });
  });

  test('unresolved sprite name (registry present, name absent) contributes nothing', () => {
    const registry = createSpriteRegistry();
    const atoms = buildMemberAtoms('<$bar> label', BASE_FONT);
    const build = resolveMemberAtoms(atoms, BASE_FONT, measurer, registry);
    expect(build.atoms).toHaveLength(1);
    expect(build.atoms[0]).toMatchObject({ kind: 'text', text: ' label' });
  });

  test('resolved sprite name resolves to an image atom with positive dims', () => {
    const registry = buildSpriteRegistryWithFoo();
    const atoms = buildMemberAtoms('<$foo> label', BASE_FONT);
    const build = resolveMemberAtoms(atoms, BASE_FONT, measurer, registry);
    expect(build.atoms).toHaveLength(2);
    expect(build.atoms[0]).toMatchObject({ kind: 'image' });
    const img = build.atoms[0] as { kind: 'image'; href: string; width: number; height: number };
    expect(img.width).toBeGreaterThan(0);
    expect(img.height).toBeGreaterThan(0);
    expect(img.href.startsWith('data:image/png;base64,')).toBe(true);
    expect(build.width).toBeGreaterThan(0);
  });

  test('<img:data-uri> resolves to an image atom without any registry', () => {
    const atoms = buildMemberAtoms(`<img:${TINY_PNG_URI}> icon`, BASE_FONT);
    const build = resolveMemberAtoms(atoms, BASE_FONT, measurer);
    expect(build.atoms[0]).toMatchObject({ kind: 'image', width: 2, height: 2 });
  });
});

describe('buildMemberRow — one-stop build', () => {
  test('plain field: single text atom, width matches direct measurement', () => {
    const build = buildMemberRow('+name: String', {}, FONT_SPEC, measurer);
    expect(build.atoms).toHaveLength(1);
    expect(build.width).toBe(measurer.measure('+name: String', FONT_SPEC).width);
  });

  test('{abstract} method: the single atom carries ITALIC', () => {
    const build = buildMemberRow('+draw()', { isAbstract: true }, FONT_SPEC, measurer);
    expect(build.atoms).toHaveLength(1);
    const atom = build.atoms[0] as { kind: 'text'; font: FontConfiguration };
    expect(atom.font.styles.has(FontStyle.ITALIC)).toBe(true);
  });
});

describe('resolveMemberAtoms — inline OpenIconic <&glyph> atoms (G2 N41)', () => {
  test('a bare <&x> atom resolves to a vector atom with positive dims and the row base font color', () => {
    const font: FontConfiguration = { family: 'sans-serif', size: 14, color: '#123456', styles: new Set() };
    const atoms = buildMemberAtoms('<&x> field', font);
    const build = resolveMemberAtoms(atoms, font, measurer);
    expect(build.atoms).toHaveLength(2);
    expect(build.atoms[0]).toMatchObject({ kind: 'vector', name: 'x' });
    const vec = build.atoms[0] as { kind: 'vector'; factor: number; fill: string; width: number; height: number };
    expect(vec.factor).toBeCloseTo(14 / 12, 10);
    expect(vec.fill).toBe('#123456');
    expect(vec.width).toBeGreaterThan(0);
    expect(vec.height).toBeGreaterThan(0);
    expect(build.atoms[1]).toMatchObject({ kind: 'text', text: ' field' });
  });

  test('<color:red><&x></color> resolves fill from the AMBIENT color at the markup position, not the row base font', () => {
    const atoms = buildMemberAtoms('<color:red><&x></color> field', BASE_FONT);
    const build = resolveMemberAtoms(atoms, BASE_FONT, measurer);
    const vec = build.atoms[0] as { kind: 'vector'; fill: string };
    expect(vec.fill).toBe('#FF0000');
  });

  test('<&x{scale=2.25,color=#FF0000}> a forced color wins over the ambient font color', () => {
    const font: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };
    const atoms = buildMemberAtoms('<&x{scale=2.25,color=#00FF00}>', font);
    const build = resolveMemberAtoms(atoms, font, measurer);
    const vec = build.atoms[0] as { kind: 'vector'; fill: string; factor: number };
    expect(vec.fill).toBe('#00FF00');
    expect(vec.factor).toBeCloseTo((2.25 * 14) / 12, 10);
  });

  test('an unrecognized glyph name contributes nothing (matches the unresolved-sprite-name precedent)', () => {
    // F1-c (S1L tail-fix G11) extended the OpenIconic glyph table to
    // upstream's full ~223-icon set, so 'pencil' -- this test's original
    // placeholder -- is now itself a real, resolvable glyph; a genuinely
    // fake name is required to keep this "unrecognized name" case honest.
    const atoms = buildMemberAtoms('<&not-a-real-icon> field', BASE_FONT);
    const build = resolveMemberAtoms(atoms, BASE_FONT, measurer);
    expect(build.atoms).toHaveLength(1);
    expect(build.atoms[0]).toMatchObject({ kind: 'text', text: ' field' });
  });
});

describe('resolveMemberAtoms — a latex atom draws its image', () => {
  // Superseded expectation: this suite used to pin the atom as DROPPED, on
  // the premise that `buildMemberAtoms` could never emit one. Registering
  // `CommandCreoleMath` (`CommandCreoleBuilder.java:111`) falsified that --
  // `<math>expr</math>` in a member row or a note body now builds a `latex`
  // atom -- and a dropped atom is a formula that VANISHES from the page,
  // where the unregistered markup used to at least render as its own
  // literal text. `AtomMath` measures and draws one image
  // (`AtomMath.java:64-97`); see `class-creole-latex.test.ts` for the
  // full-render pin. Dimensions are never asserted against the jar
  // (KaTeX-not-JLaTeXMath, `DIVERGENCES.md`).
  test('a latex CreoleAtom resolves to an image atom, between its text siblings', () => {
    const atoms = [
      { kind: 'text' as const, text: 'before ', font: BASE_FONT },
      { kind: 'latex' as const, expr: 'x^2', color: '#000000' },
      { kind: 'text' as const, text: 'after', font: BASE_FONT },
    ];
    const drawn = renderLatexAsImage('x^2', '#000000');
    const build = resolveMemberAtoms(atoms, BASE_FONT, measurer);
    expect(build.atoms).toHaveLength(3);
    expect(build.atoms[0]).toMatchObject({ kind: 'text', text: 'before ' });
    expect(build.atoms[1]).toMatchObject({ kind: 'image', href: drawn.href });
    expect(build.atoms[2]).toMatchObject({ kind: 'text', text: 'after' });
    // The row's width now reserves the image's own box too --
    // `AtomMath#calculateDimensionSlow` IS that box (`AtomMath.java:64-71`),
    // so the term comes from the one renderer, never from a jar golden.
    const expectedWidth =
      measurer.measure('before ', FONT_SPEC).width +
      drawn.width +
      measurer.measure('after', FONT_SPEC).width;
    expect(build.width).toBeCloseTo(expectedWidth, 6);
  });
});

// G2 N57, item 38: a creole run whose text is ENTIRELY whitespace draws as
// NBSP (U+00A0), matching `DriverTextSvg.java`'s `text.matches("^\\s*$")`
// branch -- jar-verified against `vicuro-37-tese143`'s real golden SVG
// (`textLength="3.575"` for a bare 13pt space run split off by a
// `<size:18>`/`<u>` boundary). The width-TABLE entry for the space
// character itself (`SANS_SERIF_BLOCKS[0][32] === 0`) is confirmed correct
// -- a byte-exact match of upstream's own `UnicodeFontWidthSansSerif.java`
// (full 255-block comparison, not just this one entry) -- so `width` (the
// LAYOUT/x-advance value) must stay 0; only the RENDER-time text/textLength
// differ, via the new `renderText`/`renderWidth` fields.
describe('resolveMemberAtoms — whitespace-only run renders as NBSP (G2 N57, item 38)', () => {
  test('a lone-space atom: layout width stays 0, renderText is NBSP, renderWidth is the NBSP width', () => {
    const wtMeasurer = new WidthTableMeasurer();
    const font: FontConfiguration = { family: 'sans-serif', size: 13, color: null, styles: new Set() };
    const atoms = [{ kind: 'text' as const, text: ' ', font }];
    const build = resolveMemberAtoms(atoms, font, wtMeasurer);
    expect(build.atoms).toHaveLength(1);
    const atom = build.atoms[0]!;
    expect(atom).toMatchObject({ kind: 'text', text: ' ', width: 0 });
    expect((atom as { renderText?: string }).renderText).toBe('\u00A0');
    expect((atom as { renderWidth?: number }).renderWidth).toBeCloseTo(3.575, 6);
    // Layout total (line-width sum) stays 0 for a lone space -- unchanged by
    // this fix, matches jar's own `AtomText#drawU`/`calculateDimensionSlow`
    // x-advance path (RAW width, no substitution).
    expect(build.width).toBe(0);
  });

  test('a multi-space run ("   ") also substitutes every space to NBSP', () => {
    const wtMeasurer = new WidthTableMeasurer();
    const font: FontConfiguration = { family: 'sans-serif', size: 13, color: null, styles: new Set() };
    const atoms = [{ kind: 'text' as const, text: '   ', font }];
    const build = resolveMemberAtoms(atoms, font, wtMeasurer);
    const atom = build.atoms[0]! as { renderText?: string; renderWidth?: number };
    expect(atom.renderText).toBe('\u00A0\u00A0\u00A0');
    expect(atom.renderWidth).toBeCloseTo(3 * 3.575, 6);
  });

  test('a non-whitespace atom carries no renderText/renderWidth override', () => {
    const build = resolveMemberAtoms([{ kind: 'text' as const, text: 'class', font: BASE_FONT }], BASE_FONT, measurer);
    const atom = build.atoms[0]! as { renderText?: string; renderWidth?: number };
    expect(atom.renderText).toBeUndefined();
    expect(atom.renderWidth).toBeUndefined();
  });

  test('a mixed run starting with a space ("  class") is NOT substituted (upstream gates on ENTIRELY whitespace only)', () => {
    const build = resolveMemberAtoms(
      [{ kind: 'text' as const, text: '  class', font: BASE_FONT }],
      BASE_FONT,
      measurer,
    );
    const atom = build.atoms[0]! as { renderText?: string; renderWidth?: number };
    expect(atom.renderText).toBeUndefined();
    expect(atom.renderWidth).toBeUndefined();
  });
});


describe('buildWrappedMemberRows (G2 N65 item 35 -- MaximumWidth word-wrap)', () => {
  test('maxWidth<=0 returns exactly the same single row buildMemberRow would', () => {
    const wrapped = buildWrappedMemberRows('+name: String', {}, FONT_SPEC, measurer, 0);
    const single = buildMemberRow('+name: String', {}, FONT_SPEC, measurer);
    expect(wrapped).toHaveLength(1);
    expect(wrapped[0]).toEqual(single);
  });

  test('a row narrower than maxWidth stays a single row, unchanged', () => {
    const wrapped = buildWrappedMemberRows('short', {}, FONT_SPEC, measurer, 10_000);
    expect(wrapped).toHaveLength(1);
    expect(wrapped[0]!.atoms).toHaveLength(1);
  });

  // Jar-verified reach: `nucite-98-kuga991`'s `C2` method row ("Long Long
  // Long Long Long Long Long Long Long **Method()**") wraps into 3 rows at
  // `MaximumWidth 150` (`Long Long Long` x3 lines + a trailing bold
  // `Method()` line) -- see `plans/g2-class-svg/ledger.md` N65.
  test('a long row wraps into multiple rows, each within maxWidth, no row exceeding it', () => {
    const text = 'Long Long Long Long Long Long Long Long Long Method';
    const wrapped = buildWrappedMemberRows(text, {}, FONT_SPEC, measurer, 150);
    expect(wrapped.length).toBeGreaterThan(1);
    for (const row of wrapped) expect(row.width).toBeLessThanOrEqual(150);
  });

  test('every produced row concatenates back to the original words (nothing lost)', () => {
    const text = 'alpha beta gamma delta epsilon zeta eta theta';
    const wrapped = buildWrappedMemberRows(text, {}, FONT_SPEC, measurer, 60);
    const rejoined = wrapped.map((r) => atomsToPlainText(r.atoms)).join(' ').replace(/\s+/g, ' ');
    expect(rejoined).toBe(text);
  });

  test('a bold run (**word**) stays a DISTINCT styled atom across the wrap, not flattened to plain text', () => {
    const text = 'Long Long Long Long Long Long Long Long Long **Method**';
    const wrapped = buildWrappedMemberRows(text, {}, FONT_SPEC, measurer, 150);
    const lastRow = wrapped[wrapped.length - 1]!;
    const boldAtom = lastRow.atoms.find(
      (a): a is Extract<typeof a, { kind: 'text' }> => a.kind === 'text' && a.text === 'Method',
    );
    expect(boldAtom).toBeDefined();
    expect(boldAtom!.font.styles.has(FontStyle.BOLD)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// A2s F-B B5-member: literal `\n` (and `\r`/`\l`) escapes inside a member
// row split it into MULTIPLE physical rows — upstream routes every member
// row through `Display.getWithNewlines` (MethodsOrFieldsArea.java:255,264;
// Display.java:262-345, legacyReplaceBackslashNByNewline hardcoded true,
// Pragma.java:95-97). Jar evidence: julixi-10-jide878's
// `#LazyCopyPtr\n<MapOrderContent\n<two_dims_td> > map` member measures
// 3.277778x1.416667in (3 rows), not one 7.69in-wide line.
// ---------------------------------------------------------------------------

describe('splitMemberDisplayLines (B5 — Display.getWithNewlines escape handling)', () => {
  test('plain text with no escapes: one untouched line', () => {
    expect(splitMemberDisplayLines('+name: String')).toEqual(['+name: String']);
  });

  test('literal \\n splits into two lines', () => {
    expect(splitMemberDisplayLines('first\\nsecond')).toEqual(['first', 'second']);
  });

  test('\\r and \\l also break the line (alignment escapes, Display.java:292-303)', () => {
    expect(splitMemberDisplayLines('a\\rb')).toEqual(['a', 'b']);
    expect(splitMemberDisplayLines('a\\lb')).toEqual(['a', 'b']);
  });

  test('julixi-10 member shape: two \\n escapes yield three lines', () => {
    expect(splitMemberDisplayLines('#LazyCopyPtr\\n<MapOrderContent\\n<two_dims_td> > map')).toEqual([
      '#LazyCopyPtr',
      '<MapOrderContent',
      '<two_dims_td> > map',
    ]);
  });

  test('\\t becomes a real tab character (Display.java:305-306)', () => {
    expect(splitMemberDisplayLines('a\\tb')).toEqual(['a\tb']);
  });

  test('\\\\ becomes one literal backslash (Display.java:308-309)', () => {
    expect(splitMemberDisplayLines('a\\\\b')).toEqual(['a\\b']);
  });

  test('an unknown escape is kept verbatim, both chars (Display.java:310-312)', () => {
    expect(splitMemberDisplayLines('a\\xb')).toEqual(['a\\xb']);
  });

  test('a trailing lone backslash is kept (i == length-1 guard, Display.java:288-289)', () => {
    expect(splitMemberDisplayLines('a\\')).toEqual(['a\\']);
  });

  test('no split inside a [[url]] raw span (Display.java:273-276 rawMode)', () => {
    expect(splitMemberDisplayLines('go [[http://x\\ny]] end')).toEqual(['go [[http://x\\ny]] end']);
  });

  test('no split inside a <latex> raw span', () => {
    expect(splitMemberDisplayLines('<latex>a\\nb</latex>')).toEqual(['<latex>a\\nb</latex>']);
  });

  test('a \\n AFTER a closed raw span splits again', () => {
    expect(splitMemberDisplayLines('[[http://x]]\\ntail')).toEqual(['[[http://x]]', 'tail']);
  });
});

describe('buildWrappedMemberRows — B5 literal \\n member rows', () => {
  test('maxWidth<=0: a \\n member yields one MemberRowBuild per physical line', () => {
    const rows = buildWrappedMemberRows('aaaa\\nbb', {}, FONT_SPEC, measurer, 0);
    expect(rows).toHaveLength(2);
    expect(atomsToPlainText(rows[0]!.atoms)).toBe('aaaa');
    expect(atomsToPlainText(rows[1]!.atoms)).toBe('bb');
  });

  test('each split row measures exactly as that line built standalone', () => {
    const rows = buildWrappedMemberRows('aaaa\\nbb', {}, FONT_SPEC, measurer, 0);
    expect(rows[0]!.width).toBe(buildMemberRow('aaaa', {}, FONT_SPEC, measurer).width);
    expect(rows[1]!.width).toBe(buildMemberRow('bb', {}, FONT_SPEC, measurer).width);
  });

  test('the julixi-10 member splits into 3 rows, widest row far narrower than the joined line', () => {
    const text = '#LazyCopyPtr\\n<MapOrderContent\\n<two_dims_td> > map';
    const rows = buildWrappedMemberRows(text, {}, FONT_SPEC, measurer, 0);
    expect(rows).toHaveLength(3);
    const widest = Math.max(...rows.map((r) => r.width));
    const joined = buildMemberRow(text.split('\\n').join(''), {}, FONT_SPEC, measurer).width;
    expect(widest).toBeLessThan(joined);
  });

  test('with maxWidth in effect, each physical line wraps independently', () => {
    const text = 'alpha beta gamma delta\\nshort';
    const rows = buildWrappedMemberRows(text, {}, FONT_SPEC, measurer, 60);
    // first physical line wraps into 2+ rows; second stays one row
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(atomsToPlainText(rows[rows.length - 1]!.atoms)).toBe('short');
    for (const row of rows) expect(row.width).toBeLessThanOrEqual(60);
  });

  test('no \\n: byte-identical single row to buildMemberRow (zero behavior change)', () => {
    const wrapped = buildWrappedMemberRows('+name: String', {}, FONT_SPEC, measurer, 0);
    expect(wrapped).toHaveLength(1);
    expect(wrapped[0]).toEqual(buildMemberRow('+name: String', {}, FONT_SPEC, measurer));
  });
});

describe('atomsToPlainText (G2 N65 item 35)', () => {
  test('joins every text atom\'s own text, dropping non-text atoms', () => {
    const atoms = buildMemberAtoms('+name: String', BASE_FONT);
    const build = resolveMemberAtoms(atoms, BASE_FONT, measurer);
    expect(atomsToPlainText(build.atoms)).toBe('+name: String');
  });

  test('an empty atom list yields an empty string', () => {
    expect(atomsToPlainText([])).toBe('');
  });
});

// SI30 T4: member `<sup>`/`<sub>` runs measure at the EFFECTIVE (muted)
// size and carry the Sea `dy` correction (`decisions.md#D1/D2/D3`) -- paired
// with `renderer-classifier-rows.test.ts`'s render-side assertion that the
// SAME numbers reach the drawn `<text>`.
describe('resolveMemberAtoms — <sup>/<sub> mute + Sea dy (SI30 T4)', () => {
  const FONT12: FontConfiguration = { family: 'sans-serif', size: 12, color: null, styles: new Set() };

  test('x<sup>2</sup> at font 12: the sup run measures at muted size 9, not the declared 12', () => {
    const atoms = buildMemberAtoms('x<sup>2</sup>', FONT12);
    const build = resolveMemberAtoms(atoms, FONT12, measurer);
    expect(build.atoms).toHaveLength(2);
    const sup = build.atoms[1] as Extract<MemberRenderAtom, { kind: 'text' }>;
    expect(sup.text).toBe('2');
    // D1: `font.size` stays the DECLARED (unmuted) 12 -- mute at read time.
    expect(sup.font.size).toBe(12);
    expect(getFont(sup.font).size).toBe(9);
    expect(sup.width).toBe(measurer.measure('2', { family: 'sans-serif', size: 9 }).width);
    // SI30 T4 (jar-verified against `exposant-01-class`'s own golden): a
    // member row's `dy` corrects against the ROW's base-font reference
    // (`baseFont.size - baseFont.size / 4.5`), NOT the line's own Sea
    // height -- `class-member-creole-sea.ts#textAtomDy`'s own doc comment
    // has the full derivation and why notes differ. "x" (NORMAL) is NOT 0
    // here: the `<sup>` widens the line's Sea span enough (16 vs the
    // NORMAL-only 12) to shift "x" off the row baseline too.
    const x = build.atoms[0] as Extract<MemberRenderAtom, { kind: 'text' }>;
    const reference = 12 - 12 / 4.5;
    expect(x.dy).toBeCloseTo(4, 6);
    expect(sup.dy).toBeCloseTo(7 - reference, 6); // top(0)+drawHeight(9)-descent(2) - reference
    expect(sup.dy).toBeLessThan(0);
  });

  test('H<sub>2</sub>O at font 12: the sub run measures at muted size 9, floored line height 10', () => {
    const atoms = buildMemberAtoms('H<sub>2</sub>O', FONT12);
    const build = resolveMemberAtoms(atoms, FONT12, measurer);
    const sub = build.atoms[1] as Extract<MemberRenderAtom, { kind: 'text' }>;
    expect(sub.text).toBe('2');
    expect(sub.font.size).toBe(12);
    expect(getFont(sub.font).size).toBe(9);
    expect(sub.width).toBe(measurer.measure('2', { family: 'sans-serif', size: 9 }).width);
    // The line's own height grows to accommodate the `<sub>`'s +3 altitude
    // (AtomText.java:321-323) -- taller than a plain all-NORMAL 12pt line.
    expect(build.height).toBeGreaterThan(12);
  });

  test('an all-NORMAL line keeps every dy at 0 (identity property)', () => {
    const atoms = buildMemberAtoms('plain text', FONT12);
    const build = resolveMemberAtoms(atoms, FONT12, measurer);
    for (const atom of build.atoms) {
      if (atom.kind === 'text') expect(atom.dy).toBe(0);
    }
  });
});
