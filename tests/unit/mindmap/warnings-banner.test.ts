/**
 * T6h: the mindmap export path's warnings banner, handwritten wiring and
 * klimt-scaled body, against the jar's cached goldens
 * (`test-results/dot-cache/mindmap/<slug>/in.svg`).
 *
 * - Producer: `CommandSkinParam#executeArg` adds a `Warning` for the
 *   `handwritten`, `ParticipantPadding` and `padding` skin parameters
 *   (CommandSkinParam.java:92-99); `TitledDiagram#getWarnings` joins the
 *   preprocessing warnings with the pragma's (TitledDiagram.java:325-335).
 * - Banner: `DiagramChromeFactory#addWarnings` draws `WarningBannerBlock`
 *   ABOVE the raw text block (DiagramChromeFactory.java:128,176-266),
 *   inside the export's `UGraphicHandwritten` (TextBlockExporter.java:173-175).
 * - Scaled body: the whole chromed document is drawn through ONE `UGraphic`
 *   carrying `option.scale` (TextBlockExporter.java:159-176), so every body
 *   `textLength` is rounded once, after the scale.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { preprocess } from '../../../src/core/preprocessor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import { createMindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagramFactory.js';
import type { MindMapDiagram } from '../../../src/diagrams/mindmap/MindMapDiagram.js';

const measurer = new DeterministicMeasurer();

function fixture(slug: string): { markup: string; golden: string } {
  const dir = `test-results/dot-cache/mindmap/${slug}`;
  return { markup: readFileSync(`${dir}/in.puml`, 'utf8'), golden: readFileSync(`${dir}/in.svg`, 'utf8') };
}

function parse(source: string): MindMapDiagram {
  const pre = preprocess(source);
  const result = createMindMapDiagram({ lines: [...pre.lines], type: 'mindmap', styleSource: pre });
  if ('refused' in result) throw new Error(`expected a parse, got a refusal: ${result.message}`);
  return result;
}

function warningLines(source: string): string[] {
  return parse(source)
    .getWarnings()
    .flatMap((w) => [...w.getMessage()]);
}

/** Every `<path d>` / `<polygon points>` value, in document order. */
function shapes(svg: string): string[] {
  return [...svg.matchAll(/<(?:path d|polygon points)="([^"]*)"/g)].map((m) => m[1]!);
}

/** Every `<text ...>` opening tag, in document order. */
function textTags(svg: string): string[] {
  return [...svg.matchAll(/<text [^>]*>/g)].map((m) => m[0]);
}

/** The root `style` size and `viewBox` — the scaled, truncated canvas
 *  (`maxXscaled`/`maxYscaled`, SvgGraphics.java:801-813). The root
 *  `width`/`height` attributes (`format(maxX)`, java:810-811) are not
 *  compared: the port's assembly writes the truncated value there too
 *  (zirabo `465px` vs the jar's `465.625px`), which `compareSvg` does not
 *  see — a pre-existing assembly residue, not this export path. */
function rootSize(svg: string): string {
  const style = /<svg [^>]*?style="width:([^;]*);height:([^;]*);/.exec(svg)!.slice(1);
  const viewBox = /<svg [^>]*?viewBox="([^"]*)"/.exec(svg)![1]!;
  return [...style, viewBox].join(' | ');
}

describe('CommandSkinParam warnings (CommandSkinParam.java:92-99)', () => {
  const body = '* root\n** first\n@endmindmap\n';

  it('skinparam handwritten adds the deprecation warning, whatever its value', () => {
    const expected = ["Please use '!option handwritten true' to enable handwritten "];
    expect(warningLines(`@startmindmap\nskinparam handwritten true\n${body}`)).toEqual(expected);
    expect(warningLines(`@startmindmap\nskinparam HANDWRITTEN false\n${body}`)).toEqual(expected);
  });

  it('skinparam ParticipantPadding and padding add their CSS warnings, in source order', () => {
    const source = `@startmindmap\nskinparam padding 3\nskinparam ParticipantPadding 4\n${body}`;
    expect(warningLines(source)).toEqual([
      'Please use CSS style instead of skinparam padding',
      'Please use CSS style instead of skinparam ParticipantPadding',
    ]);
  });

  it('no deprecated skin parameter, no warning', () => {
    expect(warningLines(`@startmindmap\nskinparam backgroundColor #EEEBDC\n${body}`)).toEqual([]);
  });
});

describe('handwritten export with the warnings banner (zature-18-vidu755)', () => {
  const { markup, golden } = fixture('zature-18-vidu755');
  const ours = renderSync(markup, { measurer });

  it('grows the canvas by the banner (+90 x +20 at dpi 96)', () => {
    expect(rootSize(ours)).toBe(rootSize(golden));
    expect(rootSize(ours)).toBe('280px | 149px | 0 0 280 149');
  });

  it('draws the banner and every node/link as the golden hand shapes', () => {
    expect(shapes(ours)).toEqual(shapes(golden));
    expect(/<polygon [^>]*>/.exec(ours)?.[0]).toContain('fill="#FFC" style="stroke:#FD8;stroke-width:3;');
  });

  it('draws the banner line in monospace 10 at (20, 22)', () => {
    expect(textTags(ours)).toEqual(textTags(golden));
    expect(textTags(ours)[0]).toBe(
      '<text x="20" y="22" fill="#000" font-size="10" textLength="239.562" font-family="monospace">',
    );
  });
});

describe('handwritten export at dpi 300, monochrome (zirabo-51-lera821)', () => {
  const { markup, golden } = fixture('zirabo-51-lera821');
  const ours = renderSync(markup, { measurer });

  it('grows the canvas by the banner (+282 x +62.5 at dpi 300)', () => {
    expect(rootSize(ours)).toBe(rootSize(golden));
  });

  it('maps the banner colours through ColorMapper.MONOCHROME (#F9F9F9 / #DDD)', () => {
    expect(/<polygon [^>]*>/.exec(ours)?.[0]).toContain('fill="#F9F9F9" style="stroke:#DDD;stroke-width:9.375;');
  });

  it('draws the golden hand shapes and texts', () => {
    expect(shapes(ours)).toEqual(shapes(golden));
    expect(textTags(ours)).toEqual(textTags(golden));
  });
});

describe('titled + scaled export draws the body through klimt at the scale (zebuzi-73-koxu022)', () => {
  const { markup, golden } = fixture('zebuzi-73-koxu022');
  const ours = renderSync(markup, { measurer });

  it('every text textLength matches the golden (rounded once, after the scale)', () => {
    const lengths = (svg: string): string[] => [...svg.matchAll(/textLength="([^"]*)"/g)].map((m) => m[1]!);
    expect(lengths(ours)).toEqual(lengths(golden));
  });
});
