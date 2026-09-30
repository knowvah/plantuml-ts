/**
 * Creole atoms inside mindmap node labels (T6e), end to end through
 * `FingerImpl#getPhalanx` → `FtileBoxOld` → `SkinParam#sheet` →
 * `SheetBlock1`, against values read from the jar's cached goldens
 * (`test-results/dot-cache/mindmap/<slug>/in.svg`, 1.2026.8beta1):
 *
 * - `<&flag>` — `StripeSimple#addOpenIcon` (StripeSimple.java:239-243) adds an
 *   `AtomOpenIconic` (AtomOpenIconic.java:55-86): width `8 * factor + 2`, a
 *   filled `UPath` 1px in from the atom's left (rinamu-56-tabi421).
 * - `[[url]]` under `MaximumWidth` — `Fission#getSplitted` re-splits every
 *   atom into neutrons through `AtomText#withText` (AtomText.java:169-171),
 *   which keeps the atom's `url`, so the `<a>` wrapper survives the wrap
 *   (kelome-99-naso291).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { MeasurerStringBounder } from '../../../src/core/measurer-bounder.js';
import { renderSync } from '../../../src/index.js';
import type { CreoleAtom } from '../../../src/core/klimt/creole/atom/Atom.js';
import type { FontConfiguration } from '../../../src/core/klimt/shape/UText.js';
import { getSplitted } from '../../../src/core/klimt/creole/Fission.js';
import { asAtomOpenIconic } from '../../../src/core/klimt/creole/atom/AtomOpenIconic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const measurer = new WidthTableMeasurer();
const FIXTURES = 'tests/unit/mindmap/fixtures';

function render(body: string): string {
  return renderSync(`@startmindmap\n${body}\n@endmindmap`, { measurer });
}

function diffPaths(slug: string): string[] {
  const dir = `test-results/dot-cache/mindmap/${slug}`;
  const svg = renderSync(readFileSync(`${dir}/in.puml`, 'utf8'), { measurer });
  return compareSvg(svg, readFileSync(`${dir}/in.svg`, 'utf8'), 'deterministic').diffs.map((d) => d.path);
}

describe('mindmap label: <&openiconic> atom (AtomOpenIconic)', () => {
  // Jar golden rinamu-56-tabi421/in.svg: the root box of `* <&flag>Debian`.
  const JAR_FLAG_D =
    'M21,119.167 L21,128.5 L22.167,128.5 L22.167,119.167 L21,119.167 M23.333,119.167 L23.333,123.833 ' +
    'L25.667,123.833 L25.667,125 L30.333,125 L28,122.702 L30.333,120.333 L26.833,120.333 L26.833,119.167 ' +
    'L23.333,119.167';

  it('widens the box by 8 * (14/12) + 2 = 11.333 and draws the glyph filled, before the text', () => {
    const svg = render('* <&flag>Debian\n** <&globe>Ubuntu\n***:Linux Mint\nOpen Source;\n*** a\n*** b\n*** c');
    expect(/<rect x="10" y="108" width="([\d.]+)"/.exec(svg)?.[1]).toBe('75.783');
    expect(svg).toContain('<text x="31.333"');
    const path = /<path d="(M21,[^"]*)" fill="#000"\/>/.exec(svg);
    expect(path?.[1]).toBe(JAR_FLAG_D);
  });

  it('rinamu-56-tabi421 equals the jar golden', () => {
    expect(diffPaths('rinamu-56-tabi421')).toEqual([]);
  });

  // Authored `fixtures/openiconic-atoms.puml`, jar output via
  // `scripts/oracle-render.sh` (1.2026.8beta1): `{scale=2,color=#FF0000}`
  // (CommandCreoleOpenIcon.java:81-89), `<color:blue>` ambient colour
  // (AtomOpenIconic.java:60), an unknown name (StripeSimple.java:241 — no
  // atom), and `euro` (the one glyph whose `translate(-1)` is unmatched).
  it('scale, forced colour, ambient colour, unknown glyph and euro equal the authored jar oracle', () => {
    const svg = renderSync(readFileSync(`${FIXTURES}/openiconic-atoms.puml`, 'utf8'), { measurer });
    const jar = readFileSync(`${FIXTURES}/openiconic-atoms.jar.svg`, 'utf8');
    expect(compareSvg(svg, jar, 'deterministic').diffs).toEqual([]);
    expect(svg).toContain('<rect x="10" y="68.167" width="50.029" height="45.667"');
    expect(svg).toMatch(/<path d="M24.29,78.167 [^"]*" fill="#F00"\/>/);
    expect(svg).toMatch(/<path d="M121.029,31.167 [^"]*" fill="#00F"\/>/);
    expect(svg).toContain('<rect x="110.029" y="74" width="30.15"');
  });
});

describe('asAtomOpenIconic (StripeSimple.java:239-243 → AtomOpenIconic.java:55-74)', () => {
  const FONT_14: FontConfiguration = { family: 'SansSerif', size: 14, color: null, styles: new Set() };
  const sb = new MeasurerStringBounder(measurer);

  it('maps an openiconic token to factor 14/12: width 8f + 2, height 8f, altitude -3f', () => {
    const atom = asAtomOpenIconic({ kind: 'inline', atom: { kind: 'openiconic', name: 'flag', scale: 1 } }, FONT_14);
    expect(atom?.calculateDimension(sb).getWidth()).toBeCloseTo((8 * 14) / 12 + 2, 10);
    expect(atom?.calculateDimension(sb).getHeight()).toBeCloseTo((8 * 14) / 12, 10);
    expect(atom?.getStartingAltitude(sb)).toBeCloseTo((-3 * 14) / 12, 10);
  });

  it('yields no atom for an unknown glyph (OpenIconic.retrieve == null) or a non-openiconic atom', () => {
    expect(asAtomOpenIconic({ kind: 'inline', atom: { kind: 'openiconic', name: 'nosuch', scale: 1 } }, FONT_14)).toBe(
      undefined,
    );
    expect(asAtomOpenIconic({ kind: 'text', text: 'a', font: FONT_14 }, FONT_14)).toBe(undefined);
  });
});

describe('mindmap label: [[url]] under MaximumWidth (Fission keeps the url)', () => {
  const FONT: FontConfiguration = { family: 'SansSerif', size: 14, color: '#0000FF', styles: new Set() };
  const URL = { url: 'http://x.com/a b', tooltip: 'http://x.com/a b' };

  it('every neutron sub-atom of a url-bearing text atom keeps the url (AtomText.java:169-171)', () => {
    const atoms: CreoleAtom[] = [{ kind: 'text', text: 'ab cd', font: FONT, url: URL }];
    const lines = getSplitted(atoms, 300, (a) => (a.kind === 'text' ? a.text.length : 0));
    const texts = lines.flat().map((a) => (a.kind === 'text' ? [a.text, a.url?.url] : [a.kind]));
    expect(texts).toEqual([
      ['ab', 'http://x.com/a b'],
      [' ', 'http://x.com/a b'],
      ['cd', 'http://x.com/a b'],
    ]);
  });

  it('a [[url]] node under `MaximumWidth 300` keeps its <a> wrapper', () => {
    const svg = render('<style>\nnode {\nMaximumWidth 300\n}\n</style>\n* a\n** [[http://x.com]]');
    expect(svg).toMatch(/<a target="_top" href="http:\/\/x.com"[^>]*><text [^>]*>http:\/\/x.com<\/text><\/a>/);
  });

  it('kelome-99-naso291 equals the jar golden', () => {
    expect(diffPaths('kelome-99-naso291')).toEqual([]);
  });
});

// Authored `fixtures/trailing-space.puml`, jar output via
// `scripts/oracle-render.sh` (1.2026.8beta1). `CommandMindMapOrgmode.java:55`
// is `super(false, …)` (doTrim=false, SingleLineCommand2.java:74-79), so the
// label is `**1** ` and the jar draws bold `1` then a separate ` ` atom of
// width 0 (no textLength) — kijaru-67-buco967.
describe('doTrim=false keeps the trailing space (T6i)', () => {
  it('draws bold 1 plus a width-0 space text, equal to the authored jar oracle', () => {
    const svg = renderSync(readFileSync(`${FIXTURES}/trailing-space.puml`, 'utf8'), { measurer });
    const jar = readFileSync(`${FIXTURES}/trailing-space.jar.svg`, 'utf8');
    // The jar writes the space as U+00A0 (no textLength: width 0).
    expect(svg).toContain('<text x="27.788" y="40.889" fill="#000" font-size="14">\u00a0</text>');
    expect(compareSvg(svg, jar, 'deterministic').diffs).toEqual([]);
  });

  // Authored `fixtures/trailing-space-root.puml`, same jar. `CommandMindMapRoot`
  // is `super(getRegexConcat())` (doTrim=true, CommandMindMapRoot.java:52): the
  // jar trims `0 **r** ` and draws no space atom; `CommandMindMapPlus` is
  // `super(false, …)` (CommandMindMapPlus.java:55) and keeps it for `+`/`-`.
  it('trims the doTrim=true root form, keeps the doTrim=false plus form (authored jar oracle)', () => {
    const svg = renderSync(readFileSync(`${FIXTURES}/trailing-space-root.puml`, 'utf8'), { measurer });
    const jar = readFileSync(`${FIXTURES}/trailing-space-root.jar.svg`, 'utf8');
    expect(svg.match(/>\u00a0<\/text>/g)).toHaveLength(2);
    expect(compareSvg(svg, jar, 'deterministic').diffs).toEqual([]);
  });

  it('kijaru-67-buco967 equals the jar golden', () => {
    expect(diffPaths('kijaru-67-buco967')).toEqual([]);
  });
});
