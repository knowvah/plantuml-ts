/**
 * The files plugin end to end through `renderSync`, with the Twemoji artwork
 * store (`FEntry.java:124-129` draws `<:1f4c2:>` / `<:1f4c4:>` as emoji).
 * Expected values are the jar's own, from the pdiff oracles
 * `test-results/dot-cache/files/dobido-76-nugu008` (tree) and
 * `xeseve-00-tipa730` / `nixaro-94-pefo622` (note, style).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { withJarCompatibleStyleInput } from '../../../src/core/internal-render-options.js';
import { buildEmojiAssetsStore } from '../../helpers/emoji-assets-store.js';

const OPTIONS = { measurer: new DeterministicMeasurer(), assetStore: buildEmojiAssetsStore() };
const JAR = withJarCompatibleStyleInput(OPTIONS);

const block = (body: string): string => `@startfiles\n${body}\n@endfiles`;
const render = (body: string): string => renderSync(block(body), OPTIONS);
const jar = (body: string): string => renderSync(block(body), JAR);

interface Row {
  readonly x: number;
  readonly y: number;
  readonly textLength: number;
  readonly text: string;
}

/** The `<text>` rows of the 14 px entries (the note text is 13 px). */
function rowsOf(svg: string): Row[] {
  return [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*font-size="14" textLength="([\d.]+)">([^<]*)</g)].map(
    (m) => ({ x: Number(m[1]), y: Number(m[2]), textLength: Number(m[3]), text: m[4]! }),
  );
}

const rootOf = (svg: string): string => svg.slice(svg.indexOf('<svg'), svg.indexOf('>') + 1);

describe('rows (FEntry.java:131-138)', () => {
  const svg = render('/.github/\n/src/example.py\n/README.md');

  it('a folder row draws the 1f4c2 artwork (#269 body, #55ACEE flap) then its name', () => {
    expect(svg.indexOf('fill="#269"')).toBeGreaterThan(-1);
    expect(svg.indexOf('fill="#55ACEE"')).toBeGreaterThan(svg.indexOf('fill="#269"'));
    expect(rowsOf(svg)[0]).toEqual({ x: 31, y: 29.639, textLength: 42, text: '.github' });
  });

  it('a file row draws the 1f4c4 artwork (#E1E8ED, #CCD6DD, #99AAB5)', () => {
    for (const fill of ['#E1E8ED', '#CCD6DD', '#99AAB5']) expect(svg).toContain(`fill="${fill}"`);
  });

  it('each row is height + 2 = 24.75 below the previous', () => {
    expect(rowsOf(svg).map((r) => r.y)).toEqual([29.639, 54.389, 79.139, 103.889]);
  });

  it('a child row is 21 further right than its folder', () => {
    const [github, src, example, readme] = rowsOf(svg);
    expect([github!.x, src!.x, example!.x, readme!.x]).toEqual([31, 31, 52, 31]);
    expect(example!.text).toBe('example.py');
  });

  it('draws no text glyph for the emoticon', () => {
    expect(svg).not.toContain('📂');
    expect(svg).not.toContain('<:1f4c2:>');
  });
});

describe('document shell', () => {
  const svg = render('/a.txt');

  it('is a FILES document drawn by klimt: no dominant-baseline, text at the emoticon width', () => {
    expect(rootOf(svg)).toContain('data-diagram-type="FILES"');
    expect(svg).not.toContain('dominant-baseline');
    expect(rowsOf(svg)[0]!.x).toBe(31);
  });

  it('has no minimum width: the canvas is the listing plus the margins', () => {
    const width = Number(/width="(\d+)px"/.exec(rootOf(svg))![1]);
    expect(width).toBeLessThan(100);
  });

  it('a diagram with no entry is the empty 21x21 canvas (oracle empty-diagram: dim 0 + margins 20, +1)', () => {
    expect(rootOf(renderSync('@startfiles\nfoo\n@endfiles', OPTIONS))).toContain('width="21px" height="21px"');
  });
});

describe('notes (FEntry.java:165-183)', () => {
  const svg = render('/doc/dummy.doc\n<note>\nthis is a note\non two lines\n</note>\n/LICENSE');

  it('is an Opale outline: folded-corner path in the note colours, stroke 0.5', () => {
    expect(svg).toMatch(/<path d="M[\d.]+,[\d.]+ L[^"]*" style="stroke:#181818;stroke-width:0.5;" fill="#FEFFDD"\/>/);
  });

  it('draws the note lines as 13 px creole text, one per line', () => {
    const lines = [...svg.matchAll(/font-size="13" textLength="([\d.]+)">([^<]*)</g)].map((m) => [m[2], m[1]]);
    expect(lines).toEqual([
      ['this is a note', '72.881'],
      ['on two lines', '68.656'],
    ]);
  });
});

describe('chrome and styling', () => {
  it('draws no title/header (FilesDiagram.java:80-88 reads only `/` and `<note>`)', () => {
    const svg = render('title My Title\nheader My Header\n/a.txt');
    expect(svg).not.toContain('My Title');
    expect(svg).not.toContain('My Header');
  });

  it('a <style> root background paints the document (oracle nixaro-94-pefo622)', () => {
    const svg = render('<style>\nroot {\n BackgroundColor red\n FontColor blue\n}\n</style>\n/a.txt');
    expect(rootOf(svg)).toContain('background:#FF0000;');
    expect(svg).toContain('<rect x="0" y="0"');
    expect(svg).toContain('fill="#00F"');
  });

  it('a <style> filesDiagram FontColor colours the rows (FilesDiagram.java:71-76)', () => {
    expect(render('<style>\nfilesDiagram {\n FontColor red\n}\n</style>\n/a.txt')).toContain('fill="#F00"');
  });

  it('a note takes the filesDiagram.note style (FEntry.java:167-175)', () => {
    const style = '<style>\nfilesDiagram {\n note {\n BackGroundColor lightblue\n }\n}\n</style>';
    expect(render(`${style}\n<note>\nx\n</note>`)).toContain('fill="#ADD8E6"');
  });
});

describe('document style', () => {
  it('a <style> document Margin replaces the default margin of 10 (TextBlockExporter.java:510-516)', () => {
    const svg = render('<style>\ndocument {\n Margin 3\n}\n</style>\n/a.txt');
    expect(rowsOf(svg)[0]).toMatchObject({ x: 24, y: 22.639 });
  });

  it('a gradient document background leaves the root without a `background:` and defines the gradient', () => {
    const svg = render('<style>\ndocument {\n BackgroundColor red/blue\n}\n</style>\n/a.txt');
    expect(rootOf(svg)).not.toContain('background:');
    expect(svg).toContain('<linearGradient');
  });
});

describe('extensions (DIVERGENCES.md "Extensions", lad D9)', () => {
  it('skinparam lengthAdjust is honoured in extended mode, ignored in jar-compatible mode', () => {
    const body = 'skinparam lengthAdjust none\n/a.txt';
    expect(render(body)).toContain('<g font-family="sans-serif">');
    expect(jar(body)).toContain('<g font-family="sans-serif" lengthAdjust="spacing">');
  });

  it('skinparam backgroundColor is honoured in extended mode, ignored in jar-compatible mode', () => {
    const body = 'skinparam backgroundColor #FFEEEE\n/a.txt';
    expect(rootOf(render(body))).toContain('background:#FFEEEE;');
    expect(rootOf(jar(body))).toContain('background:#FFFFFF;');
  });

  it('skinparam shadowing never reaches the note (FEntry.java:170 reads the style)', () => {
    const body = 'skinparam shadowing true\n<note>\nx\n</note>';
    expect(render(body)).toBe(jar(body));
    expect(render(body)).not.toContain('filter=');
  });
});
