/**
 * cdd5-T3e (sprite-badge-headerlayout-offset, `diagnosis/S4-style.md`):
 * `class Foo <<($sprite[,color])>>`'s sprite badge was pinned at a FIXED
 * `(geo.x + 4, geo.y + 5)` offset -- `HeaderLayout#drawU`'s own asymmetric
 * `h1`/`yCircle` slack terms (`HeaderLayout.java:93-100`) were never
 * applied to it, only to the char-badge ellipse
 * (`renderer-classifier-badge-tag.ts#renderBadge`). The fixed offset was
 * the `h1 === 0` special case only -- wrong whenever the box is wider than
 * its header content (a wide member row/body widens the box past the
 * badge+name header alone).
 */
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

const measurer = new DeterministicMeasurer();

function imageAttrs(svg: string): Array<{ x: string; y: string; width: string; height: string }> {
  return [...svg.matchAll(/<image width="([^"]*)" height="([^"]*)" x="([^"]*)" y="([^"]*)"/g)].map((m) => ({
    width: m[1]!,
    height: m[2]!,
    x: m[3]!,
    y: m[4]!,
  }));
}

/** Each `<g class="entity">`'s own `(boxX, boxY)` paired with its FIRST
 *  `<image>` (the badge -- always drawn immediately after the box `<rect>`,
 *  before any member-row content), returned as the badge's offset RELATIVE
 *  to its own box -- position-independent of where dot-engine/graphviz
 *  placed the box itself (an accepted, out-of-scope divergence from the
 *  jar's own layout, per this project's dot-engine ruling). */
function entityBadgeOffsets(svg: string): Array<{ dx: number; dy: number }> {
  const entities = [
    ...svg.matchAll(/<g class="entity"[^>]*><rect x="([^"]*)" y="([^"]*)"[^>]*\/><image[^>]*x="([^"]*)" y="([^"]*)"/g),
  ];
  return entities.map((m) => ({ dx: Number(m[3]) - Number(m[1]), dy: Number(m[4]) - Number(m[2]) }));
}

// tivezu-91-bevu722's own source, self-contained (no external assets).
const TIVEZU_SOURCE = [
  '@startuml',
  'sprite $foo1 {',
  '  FFFFFFFFFFF0000000000000000F',
  '  FFF0000000F000F000000000000F',
  '  FFF0000F00F0000F00000000000F',
  '  FFFFFFFFFFF00000F0000000000F',
  '  FFFFFFFFFFF000000F000000000F',
  '  FFFFFFFFFFF0000000F0000000FF',
  '  FFFFFFFFFFF00000000F00000F0F',
  '  FFFFFFFFFFF000000000F000F00F',
  '  FFFFFFFFFFF0000000000F0F000F',
  '  FFFFFFFFFFF00000000000F0000F',
  '}',
  '',
  'sprite $bar1 {',
  'FF',
  'EE',
  'DD',
  'CC',
  'BB',
  'AA',
  '99',
  '88',
  '77',
  '66',
  '55',
  '44',
  '33',
  '22',
  '11',
  '00',
  'FF',
  '}',
  '',
  'class Foo <<($foo1,red)>> {',
  '  I am <$foo1>',
  '  Y<$bar1>ou are',
  '}',
  '',
  'class Foo2 <<(F,red)>>',
  '@enduml',
].join('\n');

describe('tivezu-91-bevu722 — sprite badge offset (h1 > 0, arithmetic-exact)', () => {
  it("Foo's own $foo1 badge sits at the oracle's h1-shifted (15.94, 14), not the fixed (11, 12)", () => {
    const svg = renderFixtureClass(TIVEZU_SOURCE, measurer);
    const images = imageAttrs(svg);
    const badge = images[0]!;
    // jar-scraped (tivezu-91-bevu722/in.svg, re-captured under oracle seam #4
    // v2; was x=12.475 while a space was 0 wide): `<image width="28"
    // height="10" x="15.94" y="14" .../>`. yCircle = 2 -- see this file's
    // own header doc comment / `renderer-classifier-badge-tag.ts
    // #renderBadgeSpriteImage`'s derivation.
    expect(badge.width).toBe('28');
    expect(badge.height).toBe('10');
    expect(badge.x).toBe('15.94');
    expect(badge.y).toBe('14');
  });
});

// jajebe-95-jomo899's own source (title + 4 disk sprites + $bug), reduced to
// the ONE fact this test needs (Foo's own $disk16 badge position) --
// dropping the $disk8/$disk4/$disk2 member lines and the title, neither of
// which this port's own diagnosis (`S4-style.md`) attributes ANY of the
// h1 offset to (h1 comes from `Foo`'s member-row width alone, already
// present via `<$disk16>` occurring in a member line below).
const JAJEBE_REDUCED_SOURCE = [
  '@startuml',
  'sprite $disk16 {',
  '1144444556667788111',
  '1143600000000999111',
  '1143600000000ACA111',
  '1153700000001A7A111',
  '1153700000012B8A111',
  '1153800000123B8A111',
  '1163800001233C9A111',
  '11634999AABBC99B111',
  '11744566778899AB111',
  '117456AAAAA99AAB111',
  '118566AFC228AABB111',
  '118567AC8118BBBB111',
  '11867BD4433BBBBB111',
  '1139AAAAABBBBBBC111',
  '}',
  '',
  'class Foo <<($disk16,red)>> {',
  '  I have <$disk16> (disk16)',
  '}',
  '',
  'class Foo2 <<($disk16,red)>>',
  '@enduml',
].join('\n');

describe('jajebe-95-jomo899 (reduced) — sprite badge offset, relative to own box', () => {
  it("Foo's WIDE member row gives h1 -> badge sits at box + (38.556, 5), matching the oracle's own relative offset exactly", () => {
    const svg = renderFixtureClass(JAJEBE_REDUCED_SOURCE, measurer);
    const [foo] = entityBadgeOffsets(svg);
    // jar-scraped (jajebe-95-jomo899/in.svg, re-captured under oracle seam #4
    // v2): box `(7, 44.154)`, badge `(45.556, 49.154)` -> offset `(38.556, 5)`
    // (was (32.781, 5) while a space was 0 wide). This reduced fixture's OWN
    // box lands at a different absolute position (no title chrome above
    // it), but the badge's OFFSET from its own box is the SAME upstream
    // formula and reproduces byte-exact.
    expect(foo).toEqual({ dx: 38.556, dy: 5 });
  });

  it('Foo2 (no member content -- h1 === 0) keeps the pre-fix (+4, +5) offset, unchanged (regression guard)', () => {
    const svg = renderFixtureClass(JAJEBE_REDUCED_SOURCE, measurer);
    const [, foo2] = entityBadgeOffsets(svg);
    expect(foo2).toEqual({ dx: 4, dy: 5 });
  });
});
