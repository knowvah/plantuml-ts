/**
 * unwind2-S7: a monochrome sprite tints from the BACK colour of the element
 * it is drawn on -- `SpriteMonochrome#asTextBlock.drawU` passes
 * `ug.getParam().getBackcolor()` as the gradient start
 * (`SpriteMonochrome.java:215-217`). Each fixture under
 * `tests/fixtures/unwind2-S7/` (and the unwind-U4 sprite set) is rendered by
 * `scripts/oracle-render.sh`; equal pixels give equal PNG bytes
 * (`png-encoder.ts`, unwind2-S6), so the hrefs are compared verbatim.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { spriteToPngDataUri, type SpriteLike } from '../../../src/core/klimt/sprite/sprite-raster.js';
import { pngPayloads } from '../../helpers/png-decode.js';

const S7 = 'tests/fixtures/unwind2-S7';
const U4 = 'tests/fixtures/unwind-U4/sprite';
const S11 = 'tests/fixtures/unwind2-S11';
const PARTICIPANT_BACK = '#E2E2F0'; // plantuml.skin:4
/** `CommandCreoleSprite`'s font-relative factor at the 14pt head font. */
const HEAD_FONT_FACTOR = 14 / 13;
/** `theme.colors.text`, the sequence head font colour this port draws. */
const PORT_SEQUENCE_TEXT = '#181818';

/** Every fixture's `sprite $foo [10x12/16]` grid, as authored. */
const SPRITE: SpriteLike = {
  width: 10,
  height: 12,
  grayLevels: 16,
  pixelAt: (x, y) => ((x + y) % 5 !== 0 ? (x * 3 + y * 5) % 16 : 0),
};

function hrefs(svg: string): string[] {
  return pngPayloads(svg).map((p) => Buffer.from(p).toString('base64'));
}

function jar(dir: string, name: string): string[] {
  return hrefs(readFileSync(join(dir, `${name}.svg`), 'utf8'));
}

function ours(dir: string, name: string): string[] {
  const src = readFileSync(join(dir, `${name}.puml`), 'utf8');
  return hrefs(renderSync(src, { measurer: new DeterministicMeasurer() }));
}

/** Fixture -> the element whose `Back` the sprite is drawn on. */
const EXACT: readonly (readonly [string, string])[] = [
  [S7, 'c-note'], // EntityImageNote.java:283,288 -- #FEFFDD
  [U4, 'scale1'],
  [U4, 'scale07'],
  [U4, 'scale033'],
  [U4, 'scale15'],
  [U4, 'scale2'],
  [U4, 'color'],
  [U4, 's1-class-member'], // EntityImageClass.java:213 -- body fill
  [U4, 'ctx-class-member'],
  [S7, 'c-member-color'], // inline #pink
  [S7, 'c-member-gradient'], // #red-green: HColorGradient.java:50-51 -> red
  [S7, 'c-member-transparent'], // alpha 0 -> white, SpriteMonochrome.java:181-182
  [U4, 's1-class-name'], // EntityImageClass.java:216,238 -- ugHeader
  [S7, 'c-badge'], // EntityImageClass.java:238 -- the header back
  [S7, 'c-package-stereo'], // USymbolFolder.java:224,228-229 -- cluster fill
  [S7, 'c-package-stereo-color'],
  [U4, 's1-component'], // USymbol*#asSmall: symbolContext.apply(ug)
  [U4, 'ctx-component'],
  [S7, 'd-component-color'],
  [S7, 'd-node'], // USymbolNode.java:141
  [S7, 'd-usecase'],
  [S7, 'd-actor'], // the actor body fill, #F1F1F1
  [S7, 'd-note'], // EntityImageNote.java:283,288
  [S7, 's-badge'], // the participant box
  [S7, 'a-title'],
  [S7, 'a-legend'],
  [S7, 'a-caption'],
  [S7, 'a-header'],
  // unwind2-S11: the activity text blocks now resolve `<$sprite>` through
  // the diagram's own map (`StripeSimple.java:229`).
  [S7, 'ac-activity'], // FtileBox.java:215-218 -- the box fill
  [S11, 'ac-color'], // skinparam ActivityBackgroundColor pink, 13pt (scale 1)
  [S11, 'ac-multiline'],
  [S11, 'ac-note'], // Opale.java:107 -- #FEFFDD
  [S11, 'ac-arrow'], // an arrow label: no back (white)
  [S11, 'ac-if'], // FtileDiamondInside.java:85 -- test label + south slot
  // unwind2-S11: state text through `creole-text-lines.ts`'s sprite runs.
  [S7, 'st-state'], // EntityImageStateCommon.java:131-140 -- the state fill
  [S11, 'st-color'], // inline #pink
  [S11, 'st-desc'], // the fields block, same `ug`
  [S11, 'st-empty'],
  [S11, 'st-hide-empty'], // EntityImageStateEmptyDescription#drawU applyColor
  [S11, 'st-composite'], // the composite title
  [S11, 'st-note'], // Opale.java:107 -- #FEFFDD
];

describe('unwind2-S7: sprite tint starts from the drawing back colour', () => {
  it.each(EXACT)('%s/%s: every sprite href equals the jar', (dir, name) => {
    const expected = jar(dir, name);
    expect(expected.length).toBeGreaterThan(0);
    expect(ours(dir, name)).toEqual(expected);
  });

  // A sequence head draws its label on the box `Back` for participant /
  // collections / queue (`ComponentRoseParticipant.java:96-97,118`) and on
  // no back for a stickman (`ComponentRoseActor.java:75,78`). The back now
  // matches; the remaining delta is the tint END: the jar's head font is
  // black (`plantuml.skin:9`), this port's sequence text is `#181818`.
  it.each([
    ['s1-seq-participant', U4, PARTICIPANT_BACK],
    ['s-participant-color', S7, '#FFC0CB'],
    ['s-actor', S7, undefined],
  ] as const)('%s: back colour matches; only the head font colour differs', (name, dir, back) => {
    const tinted = (color: string | undefined) =>
      spriteToPngDataUri(SPRITE, color, back, HEAD_FONT_FACTOR).dataUri.split(',')[1];
    expect(jar(dir, name)).toEqual([tinted(undefined), tinted(undefined)]);
    expect(ours(dir, name)).toEqual([tinted(PORT_SEQUENCE_TEXT), tinted(PORT_SEQUENCE_TEXT)]);
  });

  // The jar draws one sprite in each; the port draws none (no sprite atom
  // reaches these text paths). Flip to EXACT once each is ported.
  it.each(['c-edge', 'c-package-title', 's-group', 's-message', 's-note'])('%s: not yet drawn by the port', (name) => {
    expect(jar(S7, name).length).toBe(1);
    expect(ours(S7, name)).toEqual([]);
  });
});
