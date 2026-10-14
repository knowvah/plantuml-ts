/**
 * `PSystemLicense` (version/PSystemLicense.java): `License#getText1` +
 * `#getText2` as one black-on-white `GraphicStrings` (java:87-92), or the two
 * halves around a distributor logo (java:94-116).
 *
 * Jar pin (`scripts/oracle-render.sh`, 1.2026.8beta1, `@startuml\nlicense\n@enduml`):
 * a 518 x 842 page of 61 `<text>` rows and three 99x99 qrcode `<image>`s for
 * line 16 (`License.java:145-146`). The jar is the GPL edition; the port is the
 * MIT one (D13), which moves the page in exactly two ways:
 * - the qrcode line: `FlashCodeUtilsNone` exports nothing, so each
 *   `<qrcode:...>` is `AtomImg.createQrcode`'s blank 10x10 image at the default
 *   scale 3 — 30x30, not the GPL edition's 33-module QR code at 99x99 — and the
 *   row is 30 high, not 99 (69px less);
 * - `addMit`'s 22 lines replace the GPL paragraph's 13 (`License.java:155-172`,
 *   108px more), and `toString` prints `MIT` in two lines. Its widest line
 *   (570.9) widens the page to 581.
 * Controlled experiment (ufp-T3b): with the GPL `License` restored and the
 * blank image sized 33x33 the port's page has zero `compareSvg` diffs against
 * the jar; every diff below is one of these two.
 */
import { describe, expect, it } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { RasterImage } from '../../../src/core/error/raster-image.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { exportTo, stringBounderFor } from '../../../src/core/UgDiagram.js';
import { ColorMapper } from '../../../src/core/klimt/color/ColorMapper.js';
import { HColors } from '../../../src/core/klimt/color/HColors.js';
import { ClockwiseTopRightBottomLeft } from '../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { getTextBlock, PSystemLicense } from '../../../src/diagrams/version/PSystemLicense.js';
import { LicenseInfo } from '../../../src/diagrams/version/LicenseInfo.js';
import { createQrcode } from '../../../src/core/klimt/creole/atom/AtomImg.js';

const measurer = new DeterministicMeasurer();
const SOURCE: UmlSource = { lines: ['license'], type: 'sequence' };

/** `x y textLength` of each jar row in document order (`image x y WxH` for images). */
const JAR_LICENSE_ROWS = [
  '5 14.333 507.6',
  '5 26.333 -',
  '5 38.333 246.075',
  '5 50.333 -',
  '5 62.333 507.6',
  '5 74.333 -',
  '5 86.333 222',
  '5 98.333 -',
  '5 110.333 177.675',
  '5 122.333 -',
  '5 134.333 349.5',
  '5 146.333 -',
  '5 158.333 261.6',
  '5 170.333 269.7',
  '5 182.333 145.875',
  'image 31.4 185 99x99',
  'image 183.2 185 99x99',
  'image 335 185 99x99',
  '5 293.333 342.975',
  '5 305.333 360.525',
  '5 317.333 342.375',
  '5 329.333 175.125',
  '5 341.333 -',
  '5 353.333 301.875',
  '5 365.333 470.25',
  '5 377.333 406.275',
  '5 389.333 130.575',
  '5 401.333 -',
  '5 413.333 366.675',
  '5 425.333 351.075',
  '5 437.333 -',
  '5 449.333 417.45',
  '5 461.333 398.475',
  '5 473.333 107.325',
  '5 485.333 346.95',
  '5 497.333 -',
  '5 509.333 444.15',
  '5 521.333 392.25',
  '5 533.333 406.575',
  '5 545.333 90',
  '5 557.333 -',
  '5 569.333 437.7',
  '5 581.333 436.95',
  '5 593.333 295.95',
  '5 605.333 -',
  '5 617.333 455.25',
  '5 629.333 337.95',
  '5 641.333 135.225',
  '5 653.333 -',
  '5 665.333 407.925',
  '8.3 677.333 219.825',
  '5 689.333 210.375',
  '5 701.333 -',
  '5 713.333 313.05',
  '5 725.333 359.025',
  '5 737.333 410.625',
  '5 749.333 391.05',
  '5 761.333 338.85',
  '5 773.333 364.5',
  '5 785.333 458.7',
  '5 797.333 322.35',
  '5 809.333 378.9',
  '5 821.333 274.95',
  '5 833.333 -',
];

/** The MIT qrcode row: three 30x30 images, two tabs (52.8px) apart, at the jar's first tab stop and row top. */
const PORT_QRCODE_ROWS = ['image 31.4 185 30x30', 'image 114.2 185 30x30', 'image 197 185 30x30'];

/** `addMit` (License.java:241-263) + the blank of :189, as this port draws them. */
const PORT_MIT_ROWS = [
  '5 224.333 342.975',
  '5 236.333 189',
  '5 248.333 -',
  '5 260.333 208.5',
  '5 272.333 -',
  '5 284.333 367.05',
  '5 296.333 400.2',
  '5 308.333 361.95',
  '5 320.333 366.3',
  '5 332.333 368.25',
  '5 344.333 346.5',
  '5 356.333 -',
  '5 368.333 378.75',
  '5 380.333 270.525',
  '5 392.333 -',
  '5 404.333 496.95',
  '5 416.333 518.85',
  '5 428.333 534.6',
  '5 440.333 570.9',
  '5 452.333 539.325',
  '5 464.333 553.65',
  '5 476.333 -',
];

/** The jar rows after the GPL paragraph (13 rows from index 18). */
const JAR_AFTER_EDITION_TEXT = 31;

/** The MIT page's rows after `addMit`: 22 rows for the GPL's 13 (+108), a 30px qrcode row for 99 (-69). */
const EDITION_SHIFT = 39;

/** `this MIT license.` / `...without any reference to the MIT license.` (License.java:201, :203), row index after `addMit`. */
const MIT_NAME_ROWS: Readonly<Record<number, string>> = { 8: '86.625', 10: '434.325' };

function rows(svg: string): string[] {
  return [...svg.matchAll(/<(text|image)([^>]*)>/g)].map((m) => {
    const attr = (name: string): string | undefined => new RegExp(` ${name}="([^"]*)"`).exec(m[2] ?? '')?.[1];
    if (m[1] === 'image')
      return `image ${attr('x') ?? ''} ${attr('y') ?? ''} ${attr('width') ?? ''}x${attr('height') ?? ''}`;
    return `${attr('x') ?? ''} ${attr('y') ?? ''} ${attr('textLength') ?? '-'}`;
  });
}

function rootAttr(svg: string, name: string): string | undefined {
  return new RegExp(` ${name}="([^"]*)"`).exec(/^<svg[^>]*>/.exec(svg)?.[0] ?? '')?.[1];
}

function shifted(row: string, index: number): string {
  const [x, y, textLength] = row.split(' ');
  const length = MIT_NAME_ROWS[index] ?? textLength ?? '';
  return `${x ?? ''} ${String(Number((Number(y) + EDITION_SHIFT).toFixed(3)))} ${length}`;
}

describe('PSystemLicense — the jar license page', () => {
  const svg = PSystemLicense.create(SOURCE, new PreprocessingArtifact()).exportDiagram(0, measurer);
  const ours = rows(svg);

  it('draws lines 1-15 at the jar x / y / textLength', () => {
    expect(ours.slice(0, 15)).toEqual(JAR_LICENSE_ROWS.slice(0, 15));
  });

  it('draws the MIT qrcode row: three 30x30 blank images where the GPL jar draws 99x99 QR codes (D13)', () => {
    expect(ours.slice(15, 18)).toEqual(PORT_QRCODE_ROWS);
    expect(JAR_LICENSE_ROWS.slice(15, 18)).toEqual([
      'image 31.4 185 99x99',
      'image 183.2 185 99x99',
      'image 335 185 99x99',
    ]);
  });

  it('draws addMit where the jar draws the GPL paragraph (D13)', () => {
    expect(ours.slice(18, 40)).toEqual(PORT_MIT_ROWS);
  });

  it('draws the 31 lines after the edition text at the jar x / textLength, 39px lower, MIT in two of them', () => {
    expect(ours.slice(40)).toEqual(JAR_LICENSE_ROWS.slice(JAR_AFTER_EDITION_TEXT).map(shifted));
  });

  it('is 581 x 881 (the jar GPL page is 518 x 842) and embeds the blank qrcode PNG', () => {
    expect([rootAttr(svg, 'width'), rootAttr(svg, 'height')]).toEqual(['581px', '881px']);
    expect(svg.match(/<image /g)).toHaveLength(3);
    expect(svg).toContain(`xlink:href="${createQrcode('https://plantuml.com/patreon', 3).dataUri}"`);
  });

  it('renders the same document three times', () => {
    const page = PSystemLicense.create(SOURCE, new PreprocessingArtifact());
    expect(new Set([0, 1, 2].map(() => page.exportDiagram(0, measurer))).size).toBe(1);
  });

  it('describes itself as (License) (java:70-72)', () => {
    expect(PSystemLicense.create(SOURCE, new PreprocessingArtifact()).getDescription()).toBe('(License)');
  });

  it('is its own text block, sized like the NONE licence block', () => {
    const page = PSystemLicense.create(SOURCE, new PreprocessingArtifact());
    const sb = stringBounderFor(measurer);
    expect(page.getTextBlock(0, sb)).toBe(page);
    expect(page.calculateDimension(sb)).toEqual(getTextBlock(LicenseInfo.NONE, undefined).calculateDimension(sb));
  });
});

describe('getTextBlock with a distributor logo (java:94-116)', () => {
  const sb = stringBounderFor(measurer);
  const LOGO: RasterImage = { width: 700, height: 30, href: 'data:image/png;base64,AAAA' };

  it('stacks text1, a 4px gap, the logo indented 20px, then text2', () => {
    const block = getTextBlock(LicenseInfo.NONE, LOGO);
    const svg = exportTo(
      {
        textBlock: block,
        backcolor: HColors.WHITE,
        margin: ClockwiseTopRightBottomLeft.same(0),
        scale: undefined,
        colorMapper: ColorMapper.IDENTITY,
        isHandwritten: false,
      },
      sb,
      measurer,
    );
    const r = rows(svg);
    // text1 is 5 lines in a 5px-margin GraphicStrings: 5 * 12 + 10 = 70 high.
    expect(r[5]).toBe('image 20 74 700x30');
    // text2's first row: 70 + 4 + 30 = 104, plus the 5px margin and the 9.333 baseline.
    expect(r[6]).toBe('5 118.333 -');
  });

  it('is as wide as the widest of the halves and 20 + the logo, as high as all four parts', () => {
    const dim = getTextBlock(LicenseInfo.NONE, LOGO).calculateDimension(sb);
    const plain = getTextBlock(LicenseInfo.NONE, undefined).calculateDimension(sb);
    expect(dim.getWidth()).toBe(720);
    // the two GraphicStrings each carry a 10px margin; the single one carries one.
    expect(dim.getHeight()).toBe(plain.getHeight() + 10 + 4 + 30);
  });
});
