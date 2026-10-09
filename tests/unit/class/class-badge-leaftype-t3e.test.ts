/**
 * cdd5-T3e (badge-leaftype-spot-unported, `diagnosis/S1-text.md`):
 * dataclass/struct/exception/metaclass/stereotype/record each have their
 * OWN `getCircledChar`/`spotStyleSignature` arm upstream
 * (`EntityImageClassHeader.java:209-260`), but the port's badge mapped
 * every one of them to the class letter ('C') and fill (`#ADD1B2`,
 * `spotClass`) until this task. `protocol` was already wired for its own
 * letter ('P') but not its own (root-fallback) fill.
 *
 * The captured glyph OUTLINES for D/M/S/X (this family's letters) were
 * already jar-verified byte-exact in `class-badge-t21.test.ts`/
 * `class-badge-letters-n33.test.ts` -- these tests exercise the KIND ->
 * letter/fill/bucket DISPATCH this task adds, not the glyph table itself.
 */
import { describe, it, expect } from 'vitest';
import { badgeLetter, badgeFill, spotSnameForKind, badgeGlyphPath } from '../../../src/diagrams/class/class-badge.js';
import { shortenColor } from '../../../src/core/svg-format.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

const measurer = new DeterministicMeasurer();

function renderSingle(decl: string): string {
  return renderFixtureClass(`@startuml\nhide empty members\n${decl}\n@enduml`, measurer);
}

/** The badge `<ellipse fill>` + sibling `<path d>` for the FIRST classifier
 *  drawn -- mirrors `class-badge-t21.test.ts`'s own single-classifier (22,23)
 *  convention. Both the port and the jar apply the SAME `#RRGGBB` -> `#RGB`
 *  shortening (`svg-format.ts#shortenColor`), so `fill` is compared through
 *  that same helper rather than the raw `badgeFill` string. */
function badgeSnippet(svg: string): { cx: string; cy: string; fill: string; d: string } | undefined {
  const m = /<ellipse cx="([^"]*)" cy="([^"]*)"[^>]*fill="([^"]*)"[^>]*\/><path d="([^"]*)"/.exec(svg);
  return m ? { cx: m[1]!, cy: m[2]!, fill: m[3]!, d: m[4]! } : undefined;
}

describe('badgeLetter — LeafType kinds (cdd5-T3e)', () => {
  it("struct -> 'S' (EntityImageClassHeader.java:213-214,245-246)", () => {
    expect(badgeLetter('struct')).toBe('S');
  });
  it("exception -> 'X' (EntityImageClassHeader.java:215-216,247-248)", () => {
    expect(badgeLetter('exception')).toBe('X');
  });
  it("metaclass -> 'M' (EntityImageClassHeader.java:217-218,249-250)", () => {
    expect(badgeLetter('metaclass')).toBe('M');
  });
  it("stereotype -> 'S' (EntityImageClassHeader.java:219-220,251-252, SAME letter as struct)", () => {
    expect(badgeLetter('stereotype')).toBe('S');
    expect(badgeLetter('stereotype')).toBe(badgeLetter('struct'));
  });
  it("dataclass -> 'D' (EntityImageClassHeader.java:221-222,253-254)", () => {
    expect(badgeLetter('dataclass')).toBe('D');
  });
  it("record -> 'R' (EntityImageClassHeader.java's RECORD arm)", () => {
    expect(badgeLetter('record')).toBe('R');
  });
});

describe('badgeFill — LeafType kinds (cdd5-T3e)', () => {
  it('dataclass -> #7E57C2 (spotDataClass, plantuml.skin:267-269)', () => {
    expect(badgeFill('dataclass')).toBe('#7E57C2');
  });
  it('metaclass -> #CCCCCC (spotMetaClass, plantuml.skin:261-263)', () => {
    expect(badgeFill('metaclass')).toBe('#CCCCCC');
  });
  it('stereotype -> #FF77FF (spotStereotype, plantuml.skin:264-266)', () => {
    expect(badgeFill('stereotype')).toBe('#FF77FF');
  });
  it('exception -> #D94321 (spotException, plantuml.skin:257-260)', () => {
    expect(badgeFill('exception')).toBe('#D94321');
  });
  it('record -> #FF8F00 (spotRecord, plantuml.skin:270-272)', () => {
    expect(badgeFill('record')).toBe('#FF8F00');
  });
  it('protocol -> #F1F1F1 (root BackGroundColor fallback -- no spotProtocol skin entry)', () => {
    expect(badgeFill('protocol')).toBe('#F1F1F1');
  });
  it('struct -> #F1F1F1 (root BackGroundColor fallback -- no spotStruct skin entry)', () => {
    expect(badgeFill('struct')).toBe('#F1F1F1');
  });
});

describe('spotSnameForKind — LeafType kinds (cdd5-T3e)', () => {
  it.each([
    ['dataclass', 'spotdataclass'],
    ['struct', 'spotstruct'],
    ['exception', 'spotexception'],
    ['metaclass', 'spotmetaclass'],
    ['stereotype', 'spotstereotype'],
    ['record', 'spotrecord'],
    ['protocol', 'spotprotocol'],
  ] as const)('%s -> %s', (kind, sname) => {
    expect(spotSnameForKind(kind)).toBe(sname);
  });
});

describe('renderFixtureClass — LeafType badge reaches the rendered path (cdd5-T3e rows)', () => {
  it.each([
    ['exception', 'jodasa-29-zara935'],
    ['protocol', 'xusuxi-66-zaci221'],
    ['struct', 'zelura-55-pasa982'],
    ['dataclass', 'doboco-09-doba683'],
    ['metaclass', 'girapu-90-pise235'],
    ['stereotype', 'girapu-90-pise235'],
  ] as const)('%s: single-classifier fixture draws the kind spot fill + glyph (reach: %s)', (kind, _slug) => {
    const svg = renderSingle(`${kind} Foo`);
    const snippet = badgeSnippet(svg);
    expect(snippet).toBeDefined();
    expect(snippet!.fill).toBe(shortenColor(badgeFill(kind)));
    expect(snippet!.d).toBe(badgeGlyphPath(kind, 22, 23));
  });
});

// ---------------------------------------------------------------------------
// jar-scraped byte-exact rows (no dot-engine geometry involved -- single or
// disconnected classifiers only, so the port's PRE-EXISTING position match
// is undisturbed; only fill+glyph were wrong).
// ---------------------------------------------------------------------------

/** All badge `<ellipse cx cy fill>` occurrences, in draw order -- used for
 *  the multi-classifier oracle-scrape comparisons below (jar-verified
 *  `cx`/`cy`/`fill` values, independent of this port's `stroke`/`style`
 *  attribute SERIALIZATION, which already differs from the jar's own
 *  `style="stroke:...;"` form for unrelated reasons). */
function badgeEllipses(svg: string): Array<{ cx: string; cy: string; fill: string }> {
  return [...svg.matchAll(/<ellipse cx="([^"]*)" cy="([^"]*)"[^>]*fill="([^"]*)"/g)].map((m) => ({
    cx: m[1]!,
    cy: m[2]!,
    fill: m[3]!,
  }));
}

describe('doboco-09-doba683 — dataclass badge exact scrape', () => {
  it('AngleData <<lombok>> draws the D badge at the oracle position/fill/glyph', () => {
    const svg = renderFixtureClass(
      [
        '@startuml',
        'dataclass AngleData <<lombok>> {',
        '  - aimingPitch : double',
        '  - aimingYaw : double',
        '  - aimingFinished : boolean',
        '  - lastAimed : long',
        '  - timestampAimingMode : long',
        '}',
        '@enduml',
      ].join('\n'),
      measurer,
    );
    const snippet = badgeSnippet(svg);
    expect(snippet).toBeDefined();
    // jar-scraped (unknown/doboco-09-doba683 in.svg, re-captured under oracle
    // seam #4 v2; was 69.388 while a space measured 0):
    // `<ellipse cx="73.238" cy="25" ... fill="#7E57C2"/>`.
    expect(snippet).toMatchObject({ cx: '73.238', cy: '25', fill: '#7E57C2' });
    expect(snippet!.d).toBe(badgeGlyphPath('dataclass', 73.238, 25));
  });
});

describe('girapu-90-pise235 — metaclass + stereotype badges exact scrape', () => {
  it('meta1 draws the M badge, ste1 draws the S badge, at the oracle position/fill', () => {
    const svg = renderFixtureClass(
      ['@startuml', 'metaclass meta1 {', '}', '', 'stereotype ste1 {', '}', '', '@enduml'].join('\n'),
      measurer,
    );
    const [meta1, ste1] = badgeEllipses(svg);
    // jar-scraped: `<ellipse cx="22" cy="23" ... fill="#CCC"/>` /
    // `<ellipse cx="128.21" cy="23" ... fill="#F7F"/>`.
    expect(meta1).toMatchObject({ cx: '22', cy: '23', fill: '#CCC' });
    expect(ste1).toMatchObject({ cx: '128.21', cy: '23', fill: '#F7F' });
  });
});
