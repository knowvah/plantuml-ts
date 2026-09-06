/**
 * CreoleParser.test.ts — T9a/T10g: unit coverage for
 * `klimt/creole/legacy/CreoleParser.java`'s ported surface: the
 * constructor guard, `isTableLine`/`doesStartByColor`, `createSheet`'s
 * value-keyed memoization, `createSheetSlow`'s per-line dispatch
 * (plain text, guillemet substitution, `Stereotype` expansion,
 * `showStereotype` gating, embedded-diagram detection), and (T10g) the
 * real table/tree/code/latex/horizontal-line/embedded-diagram dispatch —
 * every `blockedOnSibling` seam T9a left is gone; each branch now
 * constructs a real sibling and is asserted on concrete produced stripes.
 */
import { describe, expect, it } from 'vitest';
import {
  CreoleParser,
  type CreoleTextStyle,
  type CreoleParserAdapters,
} from '../../../../../../src/core/klimt/creole/legacy/CreoleParser.js';
import { CreoleMode } from '../../../../../../src/core/klimt/creole/CreoleMode.js';
import { HorizontalAlignment } from '../../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { ISkinSimple } from '../../../../../../src/core/style/ISkinSimple.js';
import { GUILLEMET_DEFAULT, type GuillemetPair } from '../../../../../../src/core/text/Guillemet.js';
import type { DisplayLike, DisplayLine } from '../../../../../../src/core/klimt/creole/SheetBuilder.js';
import type { CreoleAtom } from '../../../../../../src/core/klimt/creole/atom/Atom.js';
import type { Stripe, StripeAtom } from '../../../../../../src/core/klimt/creole/Stripe.js';
import { ClockwiseTopRightBottomLeft } from '../../../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { FontConfiguration } from '../../../../../../src/core/klimt/shape/UText.js';
import { Pragma } from '../../../../../../src/core/skin/Pragma.js';
import type { AtomOps } from '../../../../../../src/core/klimt/creole/Sea.js';
import type { NestedDiagramRenderer } from '../../../../../../src/core/EmbeddedDiagram.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import type { TextBlock } from '../../../../../../src/core/klimt/shape/TextBlock.js';

const FONT: FontConfiguration = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set() };
const STEREO_FONT: FontConfiguration = { family: 'sans-serif', size: 10, color: '#000000', styles: new Set() };

class FakeStringBounder implements StringBounder {
  calculateDimension(_font: { readonly family: string; readonly size: number }, text: string): XDimension2D {
    return new XDimension2D(text.length, 10);
  }
}
const sb: StringBounder = new FakeStringBounder();

/** Per-file `AtomOps` test double (this project's established
 *  `StripeTable.test.ts`/`SheetBlock1.test.ts` convention): 1 unit per
 *  character for a `'text'` atom, 0-width for anything else. */
function fakeAtomOps(): AtomOps {
  return {
    calculateDimension: (atom): XDimension2D =>
      atom.kind === 'text' ? new XDimension2D(atom.text.length, 10) : new XDimension2D(0, 10),
    getStartingAltitude: (): number => 0,
    drawU: (): void => undefined,
  };
}

const EMPTY_TEXT_BLOCK: TextBlock = {
  calculateDimension: (): XDimension2D => new XDimension2D(1, 1),
  drawU: (): void => undefined,
};

/** Per-file `NestedDiagramRenderer` test double — records every `render`
 *  call's arguments so the embedded-diagram tests can assert on exactly
 *  what `EmbeddedDiagram.createAndSkip` collected. */
function fakeRenderer(
  calls: { source: readonly string[]; skinParam: ISkinSimple | null }[] = [],
): NestedDiagramRenderer {
  return {
    render: (source, skinParam): TextBlock => {
      calls.push({ source, skinParam });
      return EMPTY_TEXT_BLOCK;
    },
  };
}

function fakeSkin(guillemet: GuillemetPair = GUILLEMET_DEFAULT): ISkinSimple {
  return {
    getSprite: () => null,
    guillemet: () => guillemet,
    getFromMd5: () => null,
    transformStringForSizeHack: (s) => s,
    getValue: () => null,
    values: () => new Map(),
    getPadding: () => ClockwiseTopRightBottomLeft.same(0),
    getMonospacedFamily: () => 'monospaced',
    getTabSize: () => 8,
    getDpi: () => 96,
    copyAllFrom: () => undefined,
    getPragma: () => Pragma.createEmpty(),
    sheet: () => {
      throw new Error('not exercised in this test');
    },
  };
}

function display(
  lines: readonly DisplayLine[],
  opts: { isNull?: boolean; showStereotype?: boolean } = {},
): DisplayLike {
  const key = opts.isNull === true ? ' NULL' : lines.map(String).join(' ');
  return {
    isNull: opts.isNull ?? false,
    showStereotype: opts.showStereotype ?? true,
    cacheKey: () => key,
    [Symbol.iterator]: () => lines[Symbol.iterator](),
  };
}

/** Duck-types a `StripeAtom` as a `CreoleAtom` (has a `kind` discriminant)
 *  vs. an opaque composite `Atom` (does not) — every atom this test file
 *  builds via plain-text/stereotype dispatch is the former; every
 *  table/tree/code/latex/horizontal-line/embedded stripe's sole atom is
 *  the latter (see `blockAtomOf` below). */
function isCreoleAtom(atom: StripeAtom): atom is CreoleAtom {
  return typeof atom === 'object' && atom !== null && 'kind' in atom;
}

function textOf(atoms: readonly StripeAtom[]): string {
  return atoms.map((a) => (isCreoleAtom(a) ? (a.kind === 'text' ? a.text : `[${a.kind}]`) : '[atom]')).join('');
}

/** The sole opaque `Atom` a table/tree/code/latex/horizontal-line/embedded
 *  stripe's `getAtoms()` carries (matching upstream's real, `Atom`-typed
 *  `Stripe` contract — see `Stripe.ts`'s own doc comment). */
function blockAtomOf(stripe: Stripe<StripeAtom>): unknown {
  return stripe.getAtoms()[0];
}

function parser(
  skin: ISkinSimple = fakeSkin(),
  adapters: CreoleParserAdapters = { atomOps: fakeAtomOps(), renderer: fakeRenderer() },
): CreoleParser {
  const textStyle: CreoleTextStyle = { creoleMode: CreoleMode.FULL, stereotype: STEREO_FONT };
  return new CreoleParser(FONT, HorizontalAlignment.LEFT, skin, textStyle, adapters);
}

describe('CreoleParser constructor', () => {
  it('throws when skinParam is null or undefined (java:75 Objects.requireNonNull)', () => {
    const textStyle: CreoleTextStyle = { creoleMode: CreoleMode.FULL, stereotype: FONT };
    const adapters: CreoleParserAdapters = { atomOps: fakeAtomOps(), renderer: fakeRenderer() };
    expect(
      () => new CreoleParser(FONT, HorizontalAlignment.LEFT, null as unknown as ISkinSimple, textStyle, adapters),
    ).toThrow();
    expect(
      () => new CreoleParser(FONT, HorizontalAlignment.LEFT, undefined as unknown as ISkinSimple, textStyle, adapters),
    ).toThrow();
  });
});

describe('CreoleParser.isTableLine', () => {
  it('matches a plain table row', () => {
    expect(CreoleParser.isTableLine('|a|b|')).toBe(true);
  });

  it('matches a header row with "|="', () => {
    expect(CreoleParser.isTableLine('|=Header|')).toBe(true);
  });

  it('matches a "<#color>"-prefixed row', () => {
    expect(CreoleParser.isTableLine('<#red>|a|b|')).toBe(true);
    expect(CreoleParser.isTableLine('<#red,#blue>|a|b|')).toBe(true);
  });

  it('rejects a non-table line', () => {
    expect(CreoleParser.isTableLine('plain text')).toBe(false);
    expect(CreoleParser.isTableLine('|unterminated')).toBe(false);
  });
});

describe('CreoleParser.doesStartByColor', () => {
  it('matches a leading "<#color>" tag, optionally "="-prefixed', () => {
    expect(CreoleParser.doesStartByColor('<#red>rest')).toBe(true);
    expect(CreoleParser.doesStartByColor('=<#red>rest')).toBe(true);
    expect(CreoleParser.doesStartByColor('  <#red>rest')).toBe(true);
  });

  it('rejects a line without a leading color tag', () => {
    expect(CreoleParser.doesStartByColor('plain')).toBe(false);
  });
});

describe('CreoleParser.createSheet — null display', () => {
  it('a null display produces an empty Sheet with the constructor alignment', () => {
    const sheet = parser().createSheet(display([], { isNull: true }));
    expect([...sheet]).toEqual([]);
    expect(sheet.getHorizontalAlignment()).toBe(HorizontalAlignment.LEFT);
  });
});

describe('CreoleParser.createSheet — plain text lines', () => {
  it('produces one Stripe per plain-text line, atoms built via buildLineAtoms', () => {
    const sheet = parser().createSheet(display(['hello', 'world']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(2);
    expect(textOf(stripes[0]!.getAtoms())).toBe('hello');
    expect(textOf(stripes[1]!.getAtoms())).toBe('world');
    expect(stripes[0]!.getLHeader()).toBeNull();
  });

  it('an empty line falls back to a single-space atom (buildLineAtoms fallback)', () => {
    const sheet = parser().createSheet(display(['']));
    expect(textOf([...sheet][0]!.getAtoms())).toBe(' ');
  });

  it('a "==Title" (no trailing "==") line classifies as HEADING and bigger/bold the font', () => {
    // CreoleStripeSimpleParser.ts's EQUALS_HEADING_PATTERN branch, order 1
    // ("Title" bigger(2).bold() per fontConfigurationForHeading) -- a FULLY
    // paired "==Title==" instead classifies as LITERAL (jar-verified, see
    // that file's own doc comment), not HEADING.
    const sheet = parser().createSheet(display(['==Title']));
    const atoms = [...sheet][0]!.getAtoms();
    expect(textOf(atoms)).toBe('Title');
    const atom = atoms[0] as CreoleAtom | undefined;
    expect(atom?.kind).toBe('text');
    if (atom?.kind === 'text') {
      expect(atom.font.size).toBeGreaterThan(FONT.size);
    }
  });

  it('applies guillemet substitution before classification (java:175)', () => {
    const sheet = parser().createSheet(display(['<<actor>>']));
    expect(textOf([...sheet][0]!.getAtoms())).toBe('«actor»');
  });
});

describe('CreoleParser.createSheet — Stereotype elements', () => {
  function stereotype(labels: readonly string[]): DisplayLine {
    return {
      getLabels: (g: GuillemetPair) => labels.map((l) => `${g.start}${l}${g.end}`),
      toString: () => labels.join(' '),
    };
  }

  it('expands each label into its own Stripe, under the stereotype font, when showStereotype is true', () => {
    const sheet = parser().createSheet(display([stereotype(['entity', 'foo'])], { showStereotype: true }));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(2);
    expect(textOf(stripes[0]!.getAtoms())).toBe('«entity»');
    expect(textOf(stripes[1]!.getAtoms())).toBe('«foo»');
    const atom0 = stripes[0]!.getAtoms()[0] as CreoleAtom | undefined;
    expect(atom0?.kind).toBe('text');
    if (atom0?.kind === 'text') expect(atom0.font).toBe(STEREO_FONT);
  });

  it('produces no stripes for the Stereotype element when showStereotype is false', () => {
    const sheet = parser().createSheet(display([stereotype(['entity'])], { showStereotype: false }));
    expect([...sheet]).toEqual([]);
  });

  it('a Stereotype line does not get guillemet-substituted a second time (getLabels already applies it)', () => {
    const sheet = parser().createSheet(display([stereotype(['x'])]));
    expect(textOf([...sheet][0]!.getAtoms())).toBe('«x»');
  });
});

describe('CreoleParser.createSheet — memoization', () => {
  it('two calls with equal cacheKey()s return the SAME Sheet instance (java Map<Display,Sheet> value-equality)', () => {
    const p = parser();
    const first = p.createSheet(display(['same']));
    const second = p.createSheet(display(['same']));
    expect(second).toBe(first);
  });

  it('differing content produces a different Sheet', () => {
    const p = parser();
    const first = p.createSheet(display(['a']));
    const second = p.createSheet(display(['b']));
    expect(second).not.toBe(first);
  });
});

describe('CreoleParser — table dispatch (java:91-92,101, T10g)', () => {
  it('a table line produces one Stripe wrapping a StripeTable atom', () => {
    const sheet = parser().createSheet(display(['|A|B|']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(1);
    const atom = blockAtomOf(stripes[0]!) as { calculateDimension: (sb: StringBounder) => XDimension2D };
    // Two 1-char cells, unit-width AtomOps: width = 1 + 1 = 2.
    expect(atom.calculateDimension(sb).getWidth()).toBe(2);
  });

  it('a second table line continues the SAME StripeTable (java:91-94) rather than starting a new one', () => {
    const sheet = parser().createSheet(display(['|A|B|', '|CC|D|']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(1); // continuation returns null -- no second Stripe
    const atom = blockAtomOf(stripes[0]!) as { calculateDimension: (sb: StringBounder) => XDimension2D };
    // Column 0 widens to max(1,2)=2, column 1 stays max(1,1)=1: total 3.
    expect(atom.calculateDimension(sb).getWidth()).toBe(3);
  });

  it('a non-table line after a table ends the continuation (new plain Stripe)', () => {
    const sheet = parser().createSheet(display(['|A|B|', 'plain']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(2);
    expect(textOf(stripes[1]!.getAtoms())).toBe('plain');
  });
});

describe('CreoleParser — tree dispatch (java:95-96,102, T10g)', () => {
  it('a tree line produces one Stripe wrapping a StripeTree atom', () => {
    const sheet = parser().createSheet(display(['|_root']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(1);
    const atom = blockAtomOf(stripes[0]!) as { calculateDimension: (sb: StringBounder) => XDimension2D };
    // one cell, unit height 10, +2+2 from StripeTree's own AtomWithMargin.
    expect(atom.calculateDimension(sb).getHeight()).toBe(10 + 2 + 2);
  });

  it('an indented tree line continues the SAME StripeTree (java:95-96), adding a second cell', () => {
    const sheet = parser().createSheet(display(['|_root', '  |_child']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(1); // continuation returns null -- no second Stripe
    const atom = blockAtomOf(stripes[0]!) as { calculateDimension: (sb: StringBounder) => XDimension2D };
    // two cells summed (10+10), +2+2 margin (added once, not per cell).
    expect(atom.calculateDimension(sb).getHeight()).toBe(2 * 10 + 2 + 2);
  });

  it('a continuation line with trailing whitespace still continues (java:88 trims BEFORE testing isTreeStart)', () => {
    // `trim2` strips both leading AND trailing whitespace before the
    // continuation's own isTreeStart check -- this line's trailing spaces
    // exercise trim2's trailing-trim branch specifically.
    const sheet = parser().createSheet(display(['|_root', '  |_child  ']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(1);
    const atom = blockAtomOf(stripes[0]!) as { calculateDimension: (sb: StringBounder) => XDimension2D };
    expect(atom.calculateDimension(sb).getHeight()).toBe(2 * 10 + 2 + 2);
  });

  it('a non-tree line after a tree block ends the continuation (new plain Stripe)', () => {
    const sheet = parser().createSheet(display(['|_root', 'plain']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(2);
    expect(textOf(stripes[1]!.getAtoms())).toBe('plain');
  });
});

describe('CreoleParser — code dispatch (java:97-98, T10g)', () => {
  it('a "<code>" block produces one Stripe, absorbs lines until "</code>", and resumes plain text after', () => {
    const sheet = parser().createSheet(display(['<code>', 'const x = 1;', '</code>', 'next']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(2);
    const code = blockAtomOf(stripes[0]!) as { calculateDimension: (sb: StringBounder) => XDimension2D };
    // Only the one pre-terminator raw line contributes -- width = 'const x = 1;'.length.
    expect(code.calculateDimension(sb).getWidth()).toBe('const x = 1;'.length);
    expect(textOf(stripes[1]!.getAtoms())).toBe('next');
  });

  it('the "<code>" block\'s font family is switched to MONOSPACED (java:103-104)', () => {
    const sheet = parser().createSheet(display(['<code>']));
    const code = blockAtomOf([...sheet][0]!) as { getAtoms?: () => unknown };
    expect(code).toBeDefined();
    // Family switch is exercised via StripeCode.test.ts directly; here we
    // assert only that the dispatch actually reached StripeCode (a code
    // block wraps a StripeCode instance, not any other atom kind), by
    // checking the constructor name.
    expect((code as { constructor: { name: string } }).constructor.name).toBe('StripeCode');
  });
});

describe('CreoleParser — latex dispatch (java:99-100, T10g)', () => {
  it('a "<latex>" block produces one Stripe wrapping a StripeLatex atom', () => {
    const sheet = parser().createSheet(display(['<latex>', 'x^2', '</latex>']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(1);
    const atom = blockAtomOf(stripes[0]!);
    expect((atom as { constructor: { name: string } }).constructor.name).toBe('StripeLatex');
  });
});

describe('CreoleParser — horizontal-line dispatch (java:113-114, T10g)', () => {
  it('a bare "====" line produces one Stripe wrapping a CreoleHorizontalLine atom', () => {
    const sheet = parser().createSheet(display(['====']));
    const stripes = [...sheet];
    expect(stripes).toHaveLength(1);
    const atom = blockAtomOf(stripes[0]!) as { calculateDimension: (sb: StringBounder) => XDimension2D };
    expect(atom.calculateDimension(sb)).toEqual(new XDimension2D(10, 10)); // empty-line fast path
  });

  it('a labelled "--Header--" line classifies as LITERAL, not HORIZONTAL_LINE (jar-verified divergence, unaffected by T10g)', () => {
    const sheet = parser().createSheet(display(['--Header--']));
    expect(textOf([...sheet][0]!.getAtoms())).toBe('--Header--');
  });
});

describe('CreoleParser — embedded-diagram dispatch (java:153-163, T10g)', () => {
  it('collects lines until the matching "}}" via the injected NestedDiagramRenderer, then resumes the outer iterator', () => {
    const calls: { source: readonly string[]; skinParam: ISkinSimple | null }[] = [];
    const skin = fakeSkin();
    const sheet = parser(skin, { atomOps: fakeAtomOps(), renderer: fakeRenderer(calls) }).createSheet(
      display(['{{salt', 'contentline', '}}', 'after']),
    );
    const stripes = [...sheet];
    expect(stripes).toHaveLength(2); // the embedded block, then "after"
    const atom = blockAtomOf(stripes[0]!) as {
      calculateDimension: (sb: StringBounder) => XDimension2D;
      constructor: { name: string };
    };
    expect(atom.constructor.name).toBe('EmbeddedDiagram');
    expect(textOf(stripes[1]!.getAtoms())).toBe('after');
    // `EmbeddedDiagram.getInternalTextBlock` is LAZY (java:154-163's own
    // memoization) -- the renderer is invoked only once something asks
    // for the embedded atom's dimension, not at collection time.
    expect(calls).toHaveLength(0);
    atom.calculateDimension(sb);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.source).toEqual(['@startsalt', 'contentline', '@endsalt']);
    expect(calls[0]!.skinParam).toBe(skin);
  });

  it('a bare "{{" line is detected as the "uml" embedded type', () => {
    const calls: { source: readonly string[]; skinParam: ISkinSimple | null }[] = [];
    const sheet = parser(fakeSkin(), { atomOps: fakeAtomOps(), renderer: fakeRenderer(calls) }).createSheet(
      display(['{{', '}}']),
    );
    const atom = blockAtomOf([...sheet][0]!) as { calculateDimension: (sb: StringBounder) => XDimension2D };
    atom.calculateDimension(sb);
    expect(calls[0]!.source).toEqual(['@startuml', '@enduml']);
  });

  it('an unrecognized "{{...}}" keyword with a listed first letter falls through to plain text', () => {
    const sheet = parser().createSheet(display(['{{notarealtype}}']));
    expect(textOf([...sheet][0]!.getAtoms())).toBe('{{notarealtype}}');
  });

  it('a "{{...}}" keyword whose first letter has no candidates at all falls through to plain text', () => {
    // 'a' is not a first letter of ANY EmbeddedDiagram keyword (java:284-354's
    // switch has no `case 'a':`) -- exercises getEmbeddedType's
    // `candidates === undefined` branch (matchEmbeddedKeyword).
    const sheet = parser().createSheet(display(['{{another}}']));
    expect(textOf([...sheet][0]!.getAtoms())).toBe('{{another}}');
  });

  it('leading/trailing whitespace around "{{...}}" is skipped, matching java:263-276', () => {
    const calls: { source: readonly string[]; skinParam: ISkinSimple | null }[] = [];
    const sheet = parser(fakeSkin(), { atomOps: fakeAtomOps(), renderer: fakeRenderer(calls) }).createSheet(
      display(['   {{uml', '}}']),
    );
    const atom = blockAtomOf([...sheet][0]!) as { calculateDimension: (sb: StringBounder) => XDimension2D };
    atom.calculateDimension(sb);
    expect(calls[0]!.source).toEqual(['@startuml', '@enduml']);
  });

  it('a leading NON-BREAKING space (U+00A0) is NOT skipped as whitespace, matching Character.isWhitespace', () => {
    // Character.isWhitespace(U+00A0) is false in Java, unlike a plain
    // ASCII space -- so "{{" never reaches position 0 and this is NOT
    // detected as an embedded diagram.
    const sheet = parser().createSheet(display([' {{uml']));
    expect(textOf([...sheet][0]!.getAtoms())).toBe(' {{uml');
  });

  it('an unclosed embedded block (no matching "}}" before the display ends) collects everything remaining', () => {
    const calls: { source: readonly string[]; skinParam: ISkinSimple | null }[] = [];
    const sheet = parser(fakeSkin(), { atomOps: fakeAtomOps(), renderer: fakeRenderer(calls) }).createSheet(
      display(['{{salt', 'unclosed']),
    );
    const stripes = [...sheet];
    expect(stripes).toHaveLength(1); // the iterator is exhausted mid-block -- no trailing stripe
    const atom = blockAtomOf(stripes[0]!) as { calculateDimension: (sb: StringBounder) => XDimension2D };
    atom.calculateDimension(sb);
    expect(calls[0]!.source).toEqual(['@startsalt', 'unclosed', '@endsalt']);
  });
});
