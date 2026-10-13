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
 * - `@startuml\nversion\n@enduml` (authored probe, 2026-10-13): the jar's
 *   page prints its host's Graphviz/JVM/environment; the port prints its own
 *   values (decisions.md D14), so lines are compared one by one.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type * as DotEngine from '@knowvah/dot-engine';
import { describe, expect, it, vi } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { PLANTUML_LOGO } from '../../../src/core/error/plantuml-logo.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { COMMIT, VERSION } from '../../../src/core/version.js';
import { License } from '../../../src/diagrams/version/License.js';
import {
  addInfoVersion,
  getAuthorsStrings,
  getPlantumlImage,
  PSystemVersion,
} from '../../../src/diagrams/version/PSystemVersion.js';
import { STDLIB_CATALOG } from '../../../src/diagrams/version/stdlib-catalog.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

/** Replaces `renderSvg` for one test; `undefined` passes through to the engine. */
const engine = vi.hoisted(() => ({
  calls: [] as [string, string][],
  renderSvg: undefined as ((dot: string, name: string) => string) | undefined,
}));

vi.mock('@knowvah/dot-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof DotEngine>();
  return {
    ...actual,
    renderSvg: (dot: string, name: string): string => {
      engine.calls.push([dot, name]);
      return (engine.renderSvg ?? actual.renderSvg)(dot, name);
    },
  };
});

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
  ['svg/g[1]/text[1]/@textLength', '130.575', '150.075'],
  ['svg/g[1]/text[1]/text()[1]', `plantuml-ts version ${VERSION}`, 'PlantUML version $version$'],
  ['svg/g[1]/text[2]/@x', '138.875', '158.375'],
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
      `<b>plantuml-ts version ${VERSION}</b> (Unknown compile time)`,
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
    expect(lines[0]).toBe(`plantuml-ts version ${VERSION} (Unknown compile time)`);
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

/**
 * The jar `version` page (1.2026.8beta1, `scripts/oracle-render.sh`), text
 * elements only, in document order. Lines 6 and 9-15 are the oracle host's.
 */
const JAR_VERSION_TEXTS = [
  '<text x="5" y="14.333" fill="#000" font-size="12" textLength="52.725" font-weight="700">PlantUML</text>',
  '<text x="57.725" y="14.333" fill="#000" font-size="12">\u00a0</text>',
  '<text x="61.025" y="14.333" fill="#000" font-size="12" textLength="52.05" font-family="monospace">$version$</text>',
  '<text x="5" y="26.333" fill="#000" font-size="12" textLength="59.925" font-weight="700">Git Commit</text>',
  '<text x="64.925" y="26.333" fill="#000" font-size="12">\u00a0</text>',
  '<text x="68.225" y="26.333" fill="#000" font-size="12" textLength="80.625" font-family="monospace">$git.commit.id$</text>',
  '<text x="5" y="38.333" fill="#000" font-size="12" textLength="56.775" font-weight="700">Build Time</text>',
  '<text x="61.775" y="38.333" fill="#000" font-size="12">\u00a0</text>',
  '<text x="65.075" y="38.333" fill="#000" font-size="12" textLength="120.75" font-family="monospace">Unknown\u00a0compile\u00a0time</text>',
  '<text x="5" y="50.333" fill="#000" font-size="12" textLength="41.4" font-weight="700">License</text>',
  '<text x="46.4" y="50.333" fill="#000" font-size="12">\u00a0</text>',
  '<text x="49.7" y="50.333" fill="#000" font-size="12" textLength="24" font-family="monospace">GPL</text>',
  '<text x="5" y="62.333" fill="#000" font-size="12">\u00a0</text>',
  '<text x="5" y="74.333" fill="#000" font-size="12" textLength="50.025" font-weight="700">GraphViz</text>',
  '<text x="55.025" y="74.333" fill="#000" font-size="12">\u00a0</text>',
  '<text x="58.325" y="74.333" fill="#000" font-size="12" textLength="245.85" font-family="monospace">dot\u00a0-\u00a0graphviz\u00a0version\u00a016.1.0\u00a0(20260904.0139)</text>',
  '<text x="5" y="86.333" fill="#000" font-size="12" textLength="223.275" font-weight="700">Installation seems OK. File generation OK</text>',
  '<text x="5" y="98.333" fill="#000" font-size="12">\u00a0</text>',
  '<text x="5" y="110.333" fill="#000" font-size="12" textLength="250.65">Java Runtime: OpenJDK Runtime Environment</text>',
  '<text x="5" y="122.333" fill="#000" font-size="12" textLength="177.225">JVM: OpenJDK 64-Bit Server VM</text>',
  '<text x="5" y="134.333" fill="#000" font-size="12" textLength="132.075">Default Encoding: UTF-8</text>',
  '<text x="5" y="146.333" fill="#000" font-size="12" textLength="73.35">Language: en</text>',
  '<text x="5" y="158.333" fill="#000" font-size="12" textLength="65.325">Country: US</text>',
  '<text x="5" y="170.333" fill="#000" font-size="12">\u00a0</text>',
  '<text x="5" y="182.333" fill="#000" font-size="12" textLength="168.075">PLANTUML_LIMIT_SIZE: 4096</text>',
] as const;

/** The jar page is 420 x 191 with the logo at y=114: height - 71 - 6, as `about` (239 -> 162). */
const JAR_VERSION_HEIGHT = 191;
const JAR_LOGO_Y = 114;
const JAR_LINE_STEP = 12;
const JAR_LINES = 15;
/** The ` ` run's advance between a label and its `""` value (61.025 - 57.725). */
const JAR_SPACE_ADVANCE = 3.3;

interface TextRun {
  readonly attrs: Readonly<Record<string, string>>;
  readonly text: string;
}

function textsOf(svg: string): string[] {
  return svg.match(/<text [^>]*>[^<]*<\/text>/g) ?? [];
}

function runOf(element: string): TextRun {
  const attrs: Record<string, string> = {};
  for (const [, name = '', value = ''] of element.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[name] = value;
  return { attrs, text: element.replace(/^<text [^>]*>/, '').replace(/<\/text>$/, '') };
}

/** Every attribute but the measured `textLength`. */
function placementOf(element: string): Readonly<Record<string, string>> {
  const { textLength: _measured, ...rest } = runOf(element).attrs;
  return rest;
}

function versionPage(): PSystemVersion {
  return PSystemVersion.createShowVersion(SOURCE, new PreprocessingArtifact());
}

describe('PSystemVersion.createShowVersion — lines (java:172-202, D14)', () => {
  it("prints this port's values and its layout engine's file-generation test", () => {
    expect(versionPage().getLines()).toEqual([
      `<b>plantuml-ts</b> ""${VERSION}""`,
      `<b>Git Commit</b> ""${COMMIT}""`,
      '<b>Build Time</b> ""Unknown compile time""',
      `<b>License</b> ""${License.getCurrent().toString()}""`,
      ' ',
      '@knowvah/dot-engine library is used!',
      '<b>Installation seems OK. File generation OK',
      ' ',
    ]);
  });

  it("lays out getTestCreateSimpleFile's graph with the dot engine (GraphvizUtils.java:161-162)", () => {
    engine.calls.length = 0;
    versionPage();
    expect(engine.calls).toEqual([['digraph foo { test; }', 'dot']]);
  });

  it.each([
    ['an empty file', '', 'Error: dot generates empty file. Check you dot installation.'],
    ['no <svg', '<?xml?>', 'Error: dot generates unreadable SVG file. Check you dot installation.'],
  ])('reports %s in red (GraphvizUtils.java:170-175, :100)', (_name, output, message) => {
    engine.renderSvg = () => output;
    try {
      expect(versionPage().getLines()[6]).toBe(`<b><color:red>${message}`);
    } finally {
      engine.renderSvg = undefined;
    }
  });

  it("reports a thrown engine error in red as Java's toString (GraphvizUtils.java:102-103)", () => {
    engine.renderSvg = () => {
      throw new TypeError('no layout');
    };
    try {
      expect(versionPage().getLines().slice(5, 8)).toEqual([
        '@knowvah/dot-engine library is used!',
        '<b><color:red>TypeError: no layout',
        ' ',
      ]);
    } finally {
      engine.renderSvg = undefined;
    }
  });
});

describe('PSystemVersion.createShowVersion — geometry against the jar probe', () => {
  const svg = versionPage().exportDiagram(0, measurer);
  const texts = textsOf(svg);

  it('draws eight lines: four label/value lines of three runs, then four single runs', () => {
    expect(texts).toHaveLength(16);
  });

  it('kept label lines (Git Commit, Build Time, License): label and space runs equal the jar, value run placed as the jar', () => {
    for (const first of [3, 6, 9]) {
      expect(texts.slice(first, first + 2)).toEqual(JAR_VERSION_TEXTS.slice(first, first + 2));
      expect(placementOf(texts[first + 2] ?? '')).toEqual(placementOf(JAR_VERSION_TEXTS[first + 2] ?? ''));
    }
    expect(runOf(texts[5] ?? '').text).toBe(COMMIT);
    expect(texts[8]).toBe(JAR_VERSION_TEXTS[8]);
  });

  it("line 1 (`plantuml-ts`): the jar's bold label at x=5, a space run after it, then the monospace value", () => {
    const [label, space, value] = texts.slice(0, 3).map(runOf);
    expect(label?.text).toBe('plantuml-ts');
    expect({ ...label?.attrs, textLength: undefined }).toEqual({
      ...runOf(JAR_VERSION_TEXTS[0]).attrs,
      textLength: undefined,
    });
    const spaceX = 5 + Number(label?.attrs['textLength']);
    expect(Number(space?.attrs['x'])).toBeCloseTo(spaceX, 3);
    expect(Number(value?.attrs['x'])).toBeCloseTo(spaceX + JAR_SPACE_ADVANCE, 3);
    expect(value?.attrs['font-family']).toBe('monospace');
    expect(value?.text).toBe(VERSION);
  });

  it("blank, file-generation and closing blank lines equal the jar's (lines 5, 7, 8)", () => {
    expect(texts[12]).toBe(JAR_VERSION_TEXTS[12]);
    expect(texts.slice(14)).toEqual(JAR_VERSION_TEXTS.slice(16, 18));
  });

  it("line 6 (the engine) sits where the jar's GraphViz line does, plain as the VizJs arm (GraphvizUtils.java:94)", () => {
    const { attrs, text } = runOf(texts[13] ?? '');
    expect(text).toBe('@knowvah/dot-engine library is used!');
    expect({ x: attrs['x'], y: attrs['y'], weight: attrs['font-weight'] }).toEqual({
      x: '5',
      y: runOf(JAR_VERSION_TEXTS[13]).attrs['y'],
      weight: undefined,
    });
  });

  it("is seven lines shorter than the jar's 15 (JVM/environment lines omitted), logo at height - 77", () => {
    const height = JAR_VERSION_HEIGHT - (JAR_LINES - 8) * JAR_LINE_STEP;
    expect(svg).toContain(`height="${height}px"`);
    expect(svg).toMatch(
      new RegExp(`<image width="80" height="71" x="[\\d.]+" y="${height - (JAR_VERSION_HEIGHT - JAR_LOGO_Y)}"`),
    );
  });

  it('renders the same document three times', () => {
    const page = versionPage();
    expect(new Set([0, 1, 2].map(() => page.exportDiagram(0, measurer))).size).toBe(1);
  });
});
