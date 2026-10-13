/**
 * `PSystemLicense` (version/PSystemLicense.java): `License#getText1` +
 * `#getText2` as one black-on-white `GraphicStrings` (java:87-92), or the two
 * halves around a distributor logo (java:94-116).
 *
 * Jar pin (`scripts/oracle-render.sh`, 1.2026.8beta1, `@startuml\nlicense\n@enduml`):
 * a 518 x 842 page of 61 `<text>` rows and three 99x99 qrcode `<image>`s for
 * line 16 (`License.java:145-146`). Residual: the `<qrcode:...>` creole atom
 * (`CommandCreoleQrcode` -> `StripeSimple#addQrcode` -> `AtomImg.createQrcode`
 * -> `FlashCodeUtilsZxing`) is unported core creole, so this port draws line
 * 16 as five text runs and the page is 680 x 755; every other row keeps the
 * jar's x and textLength, 87px higher after line 16 (the jar's 99px qrcode
 * row less this port's one 12px text row).
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

/** This port's line 16: the qrcode line drawn as creole text (the residual). */
const PORT_QRCODE_ROWS = [
  '31.4 194.333 76.275',
  '107.675 194.333 122.325',
  '266.075 194.333 76.275',
  '342.35 194.333 91.05',
  '474.35 194.333 199.95',
];

/** The jar's qrcode row (99) less this port's text row (12). */
const QRCODE_SHIFT = 87;

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

function shifted(row: string): string {
  const [x, y, textLength] = row.split(' ');
  return `${x ?? ''} ${String(Number((Number(y) - QRCODE_SHIFT).toFixed(3)))} ${textLength ?? ''}`;
}

describe('PSystemLicense — the jar license page', () => {
  const svg = PSystemLicense.create(SOURCE, new PreprocessingArtifact()).exportDiagram(0, measurer);
  const ours = rows(svg);

  it('draws lines 1-15 at the jar x / y / textLength', () => {
    expect(ours.slice(0, 15)).toEqual(JAR_LICENSE_ROWS.slice(0, 15));
  });

  it('draws the 46 lines after the qrcode line at the jar x / textLength, 87px higher', () => {
    expect(ours.slice(20)).toEqual(JAR_LICENSE_ROWS.slice(18).map(shifted));
  });

  it('residual: draws the qrcode line as text (no <qrcode:> atom), so the page is 680 x 755, not 518 x 842', () => {
    expect(ours.slice(15, 20)).toEqual(PORT_QRCODE_ROWS);
    expect(svg).not.toContain('<image');
    expect([rootAttr(svg, 'width'), rootAttr(svg, 'height')]).toEqual(['680px', '755px']);
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
