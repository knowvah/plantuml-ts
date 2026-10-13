/**
 * `PlainStringsDiagram` (PlainStringsDiagram.java): `strings` (+ `image` at
 * `imagePosition`) through `GraphicStrings.createBlackOnWhite(strings, image,
 * position)` (java:59-62), exported by `UgDiagram` with `same(0)` margins.
 *
 * Jar pins (`scripts/oracle-render.sh`, 1.2026.8beta1, authored probes):
 *
 * - `@startuml\n@enduml` — the Welcome page, a `createBlackOnWhite(strings,
 *   logo, BACKGROUND_CORNER_BOTTOM_RIGHT)` (PSystemWelcome.java:80-85). Fed the
 *   same strings and logo, a `PlainStringsDiagram` reproduces the jar SVG
 *   byte for byte (the `<?plantuml-src?>` metadata PI aside: the port's klimt
 *   export never writes it).
 * - `@startuml\nlicense\n@enduml` — `License#getText1` + `#getText2`
 *   (License.java:99-236) as one `GraphicStrings` (PSystemLicense.java:83-91).
 *   The jar's line 16 is `\t<qrcode:...>` x3 (License.java:145-146), a creole
 *   atom this port does not have; the pin feeds every OTHER line. The jar
 *   canvas is 518 x 834; without the qrcode line it is 518 x 743
 *   (61 lines x 12 + 2 x 5, `+1` truncated), and every one of the 61 `<text>`
 *   elements keeps the jar's x, textLength and y — the y of each line after
 *   the qrcode line less the 99px the jar draws that line in.
 */
import { describe, expect, it } from 'vitest';
import { PLANTUML_LOGO } from '../../../src/core/error/plantuml-logo.js';
import { PSystemWelcome } from '../../../src/core/error/PSystemWelcome.js';
import type { RasterImage } from '../../../src/core/error/raster-image.js';
import { GraphicPosition } from '../../../src/core/klimt/geom/GraphicPosition.js';
import { GraphicStrings } from '../../../src/core/klimt/shape/GraphicStrings.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PlainStringsDiagram } from '../../../src/core/PlainStringsDiagram.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { stringBounderFor } from '../../../src/core/UgDiagram.js';

const measurer = new DeterministicMeasurer();

/** A subclass filling the protected fields in its constructor, as upstream's do. */
class Page extends PlainStringsDiagram {
  constructor(strings: readonly string[], image?: RasterImage, imagePosition?: GraphicPosition) {
    super({ lines: [], type: 'sequence' }, new PreprocessingArtifact());
    this.strings.push(...strings);
    this.image = image;
    this.imagePosition = imagePosition;
  }
}

/** The jar's Welcome page, `xlink:href` replaced by `HREF`, metadata PI removed. */
const JAR_WELCOME =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" style="width:532px;height:227px;background:#FFFFFF;" width="532px" height="227px" viewBox="0 0 532 227" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css"><?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing"><text x="5" y="14.333" fill="#000" font-size="12" textLength="122.625" font-weight="700">Welcome to PlantUML!</text><text x="5" y="26.333" fill="#000" font-size="12">\u00a0</text><text x="5" y="38.333" fill="#000" font-size="12" textLength="245.25">You can start with a simple UML Diagram like:</text><text x="5" y="50.333" fill="#000" font-size="12">\u00a0</text><text x="5" y="62.333" fill="#000" font-size="12" textLength="92.55" font-family="monospace">Bob->Alice:\u00a0Hello</text><text x="5" y="74.333" fill="#000" font-size="12">\u00a0</text><text x="5" y="86.333" fill="#000" font-size="12" textLength="13.275">Or</text><text x="5" y="98.333" fill="#000" font-size="12">\u00a0</text><text x="5" y="110.333" fill="#000" font-size="12" textLength="77.4" font-family="monospace">class\u00a0Example</text><text x="5" y="122.333" fill="#000" font-size="12">\u00a0</text><text x="5" y="134.333" fill="#000" font-size="12" textLength="301.275">You will find more information about PlantUML syntax on</text><text x="309.575" y="134.333" fill="#000" font-size="12" textLength="107.175" text-decoration="underline">https://plantuml.com</text><text x="5" y="146.333" fill="#000" font-size="12">\u00a0</text><text x="5" y="158.333" fill="#000" font-size="12" textLength="92.025">(Details by typing</text><text x="100.325" y="158.333" fill="#000" font-size="12" textLength="37.425" font-family="monospace">license</text><text x="141.05" y="158.333" fill="#000" font-size="12" textLength="48.675">keyword)</text><text x="5" y="170.333" fill="#000" font-size="12">\u00a0</text><text x="5" y="182.333" fill="#000" font-size="12">\u00a0</text><text x="5" y="194.333" fill="#000" font-size="12">\u00a0</text><text x="5" y="206.333" fill="#000" font-size="12">\u00a0</text><text x="5" y="218.333" fill="#000" font-size="12">\u00a0</text><image width="80" height="71" x="446.75" y="150" xlink:href="HREF"/></g></svg>';

/** License.java:115-235 for the default (unlicensed, Windows-archive) build,
 *  the qrcode line (java:145-146) left out. */
const LICENSE_LINES = [
  '+=======================================================================',
  '| ',
  '|      PlantUML : a free UML diagram generator',
  '| ',
  '+=======================================================================',
  ' ',
  '(C) Copyright 2009-2024, Arnaud Roques',
  ' ',
  'Project Info:  https://plantuml.com',
  ' ',
  'If you like this project or if you find it useful, you can support us at:',
  ' ',
  'https://plantuml.com/patreon (only 1$ per month!)',
  'https://plantuml.com/liberapay (only 1\u20ac per month!)',
  'https://plantuml.com/paypal',
  'PlantUML is free software; you can redistribute it and/or modify it',
  'under the terms of the GNU General Public License as published by',
  'the Free Software Foundation, either version 3 of the License, or',
  '(at your option) any later version.',
  ' ',
  'PlantUML distributed in the hope that it will be useful, but',
  'WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY',
  'or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public',
  'License for more details.',
  ' ',
  'You should have received a copy of the GNU General Public License',
  'along with this library.  If not, see <https://www.gnu.org/licenses/>.',
  ' ',
  'PlantUML can occasionally display sponsored or advertising messages. Those',
  'messages are usually generated on welcome or error images and never on',
  'functional diagrams.',
  'See https://plantuml.com/professional if you want to remove them',
  ' ',
  'Images (whatever their format : PNG, SVG, EPS...) generated by running PlantUML',
  'are owned by the author of their corresponding sources code (that is, their',
  'textual description in PlantUML language). Those images are not covered by',
  'this GPL license.',
  ' ',
  'The generated images can then be used without any reference to the GPL license.',
  'It is not even necessary to stipulate that they have been generated with PlantUML,',
  'although this will be appreciated by the PlantUML team.',
  ' ',
  'There is an exception : if the textual description in PlantUML language is also covered',
  'by any license, then the generated images are logically covered',
  'by the very same license.',
  ' ',
  'This distribution bundles a minimal set of GraphViz files and may install them',
  ' if needed in the local temporary directory.',
  '(see https://plantuml.com/graphviz-dot )',
  ' ',
  'Icons provided by OpenIconic :  https://useiconic.com/open',
  'Archimate sprites provided by Archi :  http://www.archimatetool.com',
  'Stdlib AWS provided by https://github.com/milo-minderbinder/AWS-PlantUML',
  'Stdlib Icons provided https://github.com/tupadr3/plantuml-icon-font-sprites',
  'ASCIIMathML (c) Peter Jipsen http://www.chapman.edu/~jipsen',
  'ASCIIMathML (c) David Lippman http://www.pierce.ctc.edu/dlippman',
  'CafeUndZopfli ported by Eugene Klyuchnikov https://github.com/eustas/CafeUndZopfli',
  'Brotli (c) by the Brotli Authors https://github.com/google/brotli',
  'Themes (c) by Brett Schwarz https://github.com/bschwarz/puml-themes',
  'Twemoji (c) by Twitter at https://twemoji.twitter.com/',
  ' ',
];

/** `x y textLength` of each jar `<text>` (`-`: none printed). */
const JAR_LICENSE_TEXT = [
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

/** The px the jar's qrcode line occupies between lines 15 and 16. */
const QRCODE_LINE_HEIGHT = 99;
const QRCODE_LINE_INDEX = 15;

function rootAttr(svg: string, name: string): string | undefined {
  const root = /^<svg[^>]*>/.exec(svg)?.[0] ?? '';
  return new RegExp(` ${name}="([^"]*)"`).exec(root)?.[1];
}

/** `x y textLength` of each `<text>`, the jar row shape. */
function textRows(svg: string): string[] {
  return [...svg.matchAll(/<text([^>]*)>/g)].map((m) => {
    const attr = (name: string): string | undefined => new RegExp(` ${name}="([^"]*)"`).exec(m[1] ?? '')?.[1];
    return `${attr('x') ?? ''} ${attr('y') ?? ''} ${attr('textLength') ?? '-'}`;
  });
}

/** A jar row with the qrcode line's height taken back out of its y. */
function withoutQrcode(row: string, index: number): string {
  if (index < QRCODE_LINE_INDEX) return row;
  const [x, y, textLength] = row.split(' ');
  return `${x ?? ''} ${String(Number((Number(y) - QRCODE_LINE_HEIGHT).toFixed(3)))} ${textLength ?? ''}`;
}

describe('PlainStringsDiagram — the jar Welcome page', () => {
  const welcome = new PSystemWelcome('BACKGROUND_CORNER_BOTTOM_RIGHT');
  const svg = new Page(
    welcome.getStrings(),
    PLANTUML_LOGO,
    GraphicPosition.BACKGROUND_CORNER_BOTTOM_RIGHT,
  ).exportDiagram(0, measurer);

  it('is byte-identical to the jar, href aside', () => {
    expect(svg.replace(/xlink:href="[^"]*"/, 'xlink:href="HREF"')).toBe(JAR_WELCOME);
  });

  it('embeds the PlantUML logo', () => {
    expect(svg).toContain(`xlink:href="${PLANTUML_LOGO.href}"`);
  });
});

describe('PlainStringsDiagram — the jar license page, qrcode line aside', () => {
  const svg = new Page(LICENSE_LINES).exportDiagram(0, measurer);

  it('is 518 wide like the jar; 743 high, the jar 834 less the qrcode line', () => {
    expect(rootAttr(svg, 'width')).toBe('518px');
    expect(rootAttr(svg, 'height')).toBe('743px');
    expect(rootAttr(svg, 'style')).toBe('width:518px;height:743px;background:#FFFFFF;');
  });

  it('places every text at the jar x / y / textLength (text at x=5, the indented line at 8.3)', () => {
    expect(textRows(svg)).toEqual(JAR_LICENSE_TEXT.map(withoutQrcode));
  });

  it('renders the same document three times', () => {
    const page = new Page(LICENSE_LINES);
    expect(new Set([0, 1, 2].map(() => page.exportDiagram(0, measurer))).size).toBe(1);
  });
});

describe('PlainStringsDiagram#getTextBlock (java:59-62)', () => {
  const sb = stringBounderFor(measurer);

  it('always takes the image overload: creole FULL_BUT_UNDERSCORE even without an image', () => {
    const svg = new Page(['__a__']).exportDiagram(0, measurer);
    expect(svg).toContain('>__a__</text>');
  });

  it('is a fresh GraphicStrings per call, sized like the factory output', () => {
    const page = new Page(['one', 'two']);
    const block = page.getTextBlock(0, sb);
    expect(block).toBeInstanceOf(GraphicStrings);
    expect(block).not.toBe(page.getTextBlock(0, sb));
    const expected = GraphicStrings.createBlackOnWhite(['one', 'two'], undefined, undefined).calculateDimension(sb);
    expect(block.calculateDimension(sb)).toEqual(expected);
  });
});
