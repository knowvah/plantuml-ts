/**
 * `PSystemVersion` (version/PSystemVersion.java): the `about`/`authors` and
 * bare `stdlib` pages, `PlainStringsDiagram`s with the logo bottom-right.
 *
 * Jar pins (`scripts/oracle-render.sh`, 1.2026.8beta1):
 * - `@startuml\nabout\n@enduml` (authored probe; `authors` renders the same
 *   page, metadata PI aside). This port prints its own version string where
 *   the jar prints `$version$` (ruling "keep own version string"), so exactly
 *   the version text, its textLength, the next run's x, the logo's x and the
 *   root width differ — the width being the widest line plus the logo.
 * - `govuca-53-mili511` (`stdlib`): the cached corpus oracle, zero diffs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { PLANTUML_LOGO } from '../../../src/core/error/plantuml-logo.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { VERSION } from '../../../src/core/version.js';
import {
  addInfoVersion,
  getAuthorsStrings,
  getPlantumlImage,
  PSystemVersion,
} from '../../../src/diagrams/version/PSystemVersion.js';
import { STDLIB_CATALOG } from '../../../src/diagrams/version/stdlib-catalog.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const measurer = new DeterministicMeasurer();
const SOURCE: UmlSource = { lines: ['about'], type: 'sequence' };
const GOVUCA = join(import.meta.dirname, '..', '..', '..', 'test-results/dot-cache/unknown/govuca-53-mili511/in.svg');

/** The jar `about` page, `xlink:href` replaced by `HREF`, metadata PI removed. */
const JAR_ABOUT =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" style="width:403px;height:239px;background:#FFFFFF;" width="403px" height="239px" viewBox="0 0 403 239" zoomAndPan="magnify" preserveAspectRatio="none" contentStyleType="text/css">' +
  '<?plantuml $version$?><defs/><g font-family="sans-serif" lengthAdjust="spacing">' +
  '<text x="5" y="14.333" fill="#000" font-size="12" textLength="150.075" font-weight="700">PlantUML version $version$</text>' +
  '<text x="158.375" y="14.333" fill="#000" font-size="12" textLength="128.7">(Unknown compile time)</text>' +
  '<text x="5" y="26.333" fill="#000" font-size="12" textLength="132.6">(GPL source distribution)</text>' +
  '<text x="5" y="38.333" fill="#000" font-size="12">\u00a0</text>' +
  '<text x="5" y="50.333" fill="#000" font-size="12" textLength="67.425" text-decoration="underline">Original idea</text>' +
  '<text x="72.425" y="50.333" fill="#000" font-size="12" textLength="90">: Arnaud Roques</text>' +
  '<text x="5" y="62.333" fill="#000" font-size="12" textLength="65.25" text-decoration="underline">Word Macro</text>' +
  '<text x="70.25" y="62.333" fill="#000" font-size="12" textLength="189.9">: Alain Bertucat &amp; Matthieu Sabatier</text>' +
  '<text x="5" y="74.333" fill="#000" font-size="12" textLength="66.675" text-decoration="underline">Word Add-in</text>' +
  '<text x="71.675" y="74.333" fill="#000" font-size="12" textLength="129.3">: Adriaan van den Brand</text>' +
  '<text x="5" y="86.333" fill="#000" font-size="12" textLength="128.025" text-decoration="underline">J2V8 &amp; viz.js integration</text>' +
  '<text x="133.025" y="86.333" fill="#000" font-size="12" textLength="89.925">: Andreas Studer</text>' +
  '<text x="5" y="98.333" fill="#000" font-size="12" textLength="115.5" text-decoration="underline">Official Eclipse Plugin</text>' +
  '<text x="120.5" y="98.333" fill="#000" font-size="12" textLength="113.25">: Hallvard Tr\u00e6tteberg</text>' +
  '<text x="5" y="110.333" fill="#000" font-size="12" textLength="120.225" text-decoration="underline">Original Eclipse Plugin</text>' +
  '<text x="125.225" y="110.333" fill="#000" font-size="12" textLength="152.1">: Claude Durif &amp; Anne Pecoil</text>' +
  '<text x="5" y="122.333" fill="#000" font-size="12" textLength="82.725" text-decoration="underline">Servlet &amp; XWiki</text>' +
  '<text x="87.725" y="122.333" fill="#000" font-size="12" textLength="91.35">: Maxime Sinclair</text>' +
  '<text x="5" y="134.333" fill="#000" font-size="12" textLength="38.025" text-decoration="underline">Docker</text>' +
  '<text x="43.025" y="134.333" fill="#000" font-size="12" textLength="81.375">: David Ducatel</text>' +
  '<text x="5" y="146.333" fill="#000" font-size="12" textLength="42.75" text-decoration="underline">AWS lib</text>' +
  '<text x="47.75" y="146.333" fill="#000" font-size="12" textLength="94.05">: Chris Passarello</text>' +
  '<text x="5" y="158.333" fill="#000" font-size="12" textLength="62.025" text-decoration="underline">Stdlib Icons</text>' +
  '<text x="67.025" y="158.333" fill="#000" font-size="12" textLength="47.25">: tupadr3</text>' +
  '<text x="5" y="170.333" fill="#000" font-size="12" textLength="59.4" text-decoration="underline">Site design</text>' +
  '<text x="64.4" y="170.333" fill="#000" font-size="12" textLength="101.4">: Raphael Cotisson</text>' +
  '<text x="5" y="182.333" fill="#000" font-size="12" textLength="26.7" text-decoration="underline">Logo</text>' +
  '<text x="31.7" y="182.333" fill="#000" font-size="12" textLength="98.025">: Benjamin Croizet</text>' +
  '<text x="5" y="194.333" fill="#000" font-size="12" textLength="80.025" text-decoration="underline">Web Assembly</text>' +
  '<text x="85.025" y="194.333" fill="#000" font-size="12" textLength="70.65">: Sakir Temel</text>' +
  '<text x="5" y="206.333" fill="#000" font-size="12">\u00a0</text>' +
  '<text x="5" y="218.333" fill="#000" font-size="12" textLength="107.175">https://plantuml.com</text>' +
  '<text x="5" y="230.333" fill="#000" font-size="12">\u00a0</text>' +
  '<image width="80" height="71" x="317.075" y="162" xlink:href="HREF"/></g></svg>';

/** What the version string moves: [path, ours, jar]. */
const VERSION_DIFFS = [
  ['svg/@viewBox[2]', '393', '403'],
  ['svg/@width', '393', '403'],
  ['svg/g[1]/text[1]/@textLength', '124.65', '150.075'],
  ['svg/g[1]/text[1]/text()[1]', `PlantUML version ${VERSION}`, 'PlantUML version $version$'],
  ['svg/g[1]/text[2]/@x', '132.95', '158.375'],
  ['svg/g[1]/image[1]/@x', '307.325', '317.075'],
];

function about(): PSystemVersion {
  return PSystemVersion.createShowAuthors(SOURCE, new PreprocessingArtifact());
}

describe('PSystemVersion.createShowAuthors — the jar about page', () => {
  const svg = about().exportDiagram(0, measurer);

  it('differs from the jar only where the version string moves the page', () => {
    const { diffs } = compareSvg(svg, JAR_ABOUT, 'deterministic');
    expect(diffs.map((d) => [d.path, d.actual, d.expected])).toEqual(VERSION_DIFFS);
  });

  it('embeds the PlantUML logo at its 80x71 size', () => {
    expect(svg).toContain(`<image width="80" height="71" x="307.325" y="162" xlink:href="${PLANTUML_LOGO.href}"/>`);
  });

  it('renders the same document three times', () => {
    const page = about();
    expect(new Set([0, 1, 2].map(() => page.exportDiagram(0, measurer))).size).toBe(1);
  });
});

describe('PSystemVersion.createStdLib — govuca-53-mili511', () => {
  const svg = PSystemVersion.createStdLib(SOURCE, new PreprocessingArtifact()).exportDiagram(0, measurer);

  it('has zero compareSvg diffs against the cached jar oracle', () => {
    expect(compareSvg(svg, readFileSync(GOVUCA, 'utf8'), 'deterministic').diffs).toEqual([]);
  });

  it('is 34 four-line folder blocks and the closing blank line (java:205-210)', () => {
    const lines = PSystemVersion.createStdLib(SOURCE, new PreprocessingArtifact()).getLines();
    expect(lines).toHaveLength(34 * 4 + 1);
    expect(lines.slice(0, 4)).toEqual([
      '<b>adaml',
      'Version 0.1.2',
      'Delivered by https://github.com/rocher/AdaML',
      ' ',
    ]);
    expect(lines.at(-1)).toBe(' ');
  });

  it('renders the same document three times', () => {
    const page = PSystemVersion.createStdLib(SOURCE, new PreprocessingArtifact());
    expect(new Set([0, 1, 2].map(() => page.exportDiagram(0, measurer))).size).toBe(1);
  });
});

describe('getAuthorsStrings (java:219-245)', () => {
  it('opens with this port version, the compile-time placeholder and the GPL edition', () => {
    expect(getAuthorsStrings(true).slice(0, 4)).toEqual([
      `<b>PlantUML version ${VERSION}</b> (Unknown compile time)`,
      '(GPL source distribution)',
      ' ',
      '<u>Original idea</u>: Arnaud Roques',
    ]);
  });

  it('is 19 lines closing on the site link between blanks', () => {
    const lines = getAuthorsStrings(true);
    expect(lines).toHaveLength(19);
    expect(lines.slice(-3)).toEqual([' ', 'https://plantuml.com', ' ']);
  });

  it('strips <tag> and </tag> without the tags (java:248-249)', () => {
    const lines = getAuthorsStrings(false);
    expect(lines[0]).toBe(`PlantUML version ${VERSION} (Unknown compile time)`);
    expect(lines[4]).toBe('Word Macro: Alain Bertucat & Matthieu Sabatier');
    expect(lines[7]).toBe('Official Eclipse Plugin: Hallvard Trætteberg');
  });
});

describe('addInfoVersion (Stdlib.java:320-332)', () => {
  it('without details, one "* name (Version v)" line per folder', () => {
    const strings: string[] = [];
    addInfoVersion(strings, false);
    expect(strings).toHaveLength(STDLIB_CATALOG.length);
    expect(strings[0]).toBe('* adaml (Version 0.1.2)');
  });
});

describe('PSystemVersion — members', () => {
  it('describes itself as (Version) (java:293-295)', () => {
    expect(about().getDescription()).toBe('(Version)');
  });

  it('getPlantumlImage is the bundled 80x71 logo (java:92-94)', () => {
    expect(getPlantumlImage()).toBe(PLANTUML_LOGO);
  });

  it('draws no image when built without one (java:74)', () => {
    const svg = new PSystemVersion(SOURCE, false, ['one'], new PreprocessingArtifact()).exportDiagram(0, measurer);
    expect(svg).not.toContain('<image');
    expect(svg).toContain('>one</text>');
  });

  it('getLines is a copy of the strings', () => {
    const page = new PSystemVersion(SOURCE, false, ['a', 'b'], new PreprocessingArtifact());
    expect(page.getLines()).toEqual(['a', 'b']);
    expect(page.getLines()).not.toBe(page.getLines());
  });
});
