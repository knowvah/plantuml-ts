/**
 * cdd-T28 — chrome text (title/legend/header/footer/caption) drawn through
 * the shared klimt creole pipeline, as `Style#createTextBlockBordered`
 * (`style/Style.java:353-369`) does upstream for every one of the five
 * elements (`activitydiagram3/ftile/EntityImageLegend.java:47-55`,
 * `core/DiagramChromeFactory.java:340-413`).
 *
 * Every expected value below is read off a cached oracle artifact
 * (`test-results/dot-cache/<engine>/<slug>/in.svg`), never fitted. The
 * non-class cases exist to catch an unintended mover in another engine
 * before CI does (this seam is shared by all ten engines).
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../src/index.js';
import { DeterministicMeasurer } from '../../src/core/measurer-deterministic.js';

function markup(engine: string, slug: string): string {
  return readFileSync(`test-results/dot-cache/${engine}/${slug}/in.puml`, 'utf8');
}

function golden(engine: string, slug: string): string {
  return readFileSync(`test-results/dot-cache/${engine}/${slug}/in.svg`, 'utf8');
}

function render(engine: string, slug: string): string {
  return renderSync(markup(engine, slug), { measurer: new DeterministicMeasurer() });
}

/** The markup of one `<g class="…">` chrome group, open/close tags
 *  included. Chrome groups never nest in either producer (jar bakes
 *  absolute coordinates, `chrome.ts` shifts them — neither wraps a group in
 *  a group), so the first `</g>` after the open tag is this group's own. */
function chromeGroup(svg: string, className: string): string {
  const open = svg.indexOf(`<g class="${className}"`);
  if (open === -1) return '';
  return svg.slice(open, svg.indexOf('</g>', open) + '</g>'.length);
}

/** Every direct child element of a chrome group, as tag names — the shape
 *  `compare.ts`'s `[childCount]` short-circuit counts. */
function childTags(group: string): string[] {
  const inner = group.slice(group.indexOf('>') + 1);
  return [...inner.matchAll(/<([a-z]+)[\s/>]/g)].map((m) => m[1]!);
}

function textContents(group: string): string[] {
  return [...group.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]!);
}

function textLengths(group: string): (string | undefined)[] {
  return [...group.matchAll(/<text([^>]*)>/g)].map((m) => /textLength="([\d.]+)"/.exec(m[1]!)?.[1]);
}

describe('chrome creole — kacico-91-bati232 (legend: creole table + creole tree)', () => {
  const ours = chromeGroup(render('class', 'kacico-91-bati232'), 'legend');
  const jar = chromeGroup(golden('class', 'kacico-91-bati232'), 'legend');

  it("draws the jar's 34 legend children (1 rect + 12 text + 12 line + 5 rect + 4 line)", () => {
    expect(childTags(jar).length).toBe(34);
    expect(childTags(ours).length).toBe(34);
  });

  it('splits the `|= col1 |= col2 |` header row into one bold <text> per CELL', () => {
    // jar: two 25.725-wide bold runs, not one 78.925-wide literal run.
    expect(textContents(ours).slice(0, 4)).toEqual(['col1', 'col2', 'a', 'b']);
    expect(textLengths(ours).slice(0, 2)).toEqual(['25.725', '25.725']);
    expect(textContents(jar).slice(0, 4)).toEqual(['col1', 'col2', 'a', 'b']);
  });

  it('draws the table rules (6 <line>) and the tree skeleton (5 <rect> + 4 <line>)', () => {
    const tags = childTags(ours);
    expect(tags.filter((t) => t === 'line').length).toBe(childTags(jar).filter((t) => t === 'line').length);
    expect(tags.filter((t) => t === 'rect').length).toBe(childTags(jar).filter((t) => t === 'rect').length);
  });

  it('draws the `|_` tree rows as their own text, markup stripped', () => {
    expect(textContents(ours)).toContain('prop2');
    expect(textContents(ours)).not.toContain('|_ prop2');
  });
});

describe('chrome creole — manube-50-xora983 (legend table with <back:> swatch cells)', () => {
  const ours = chromeGroup(render('class', 'manube-50-xora983'), 'legend');
  const jar = chromeGroup(golden('class', 'manube-50-xora983'), 'legend');

  it('parses creole INSIDE each table cell — one <text> per cell, not one per row', () => {
    expect(textContents(ours)).toEqual(textContents(jar));
    // NBSP, not a plain space: `DriverTextSvg.java:125` substitutes U+00A0
    // for every character of a whitespace-only run before drawing it.
    const nbsp = '\u00a0';
    expect(textContents(ours)).toEqual([
      nbsp,
      'Type',
      nbsp.repeat(3),
      'Type A class',
      nbsp.repeat(3),
      'Type B class',
      nbsp.repeat(3),
      'Type C class',
    ]);
  });

  it("measures the swatch cell at the jar's own 11.55 (three spaces), not the raw `<back:#FF0000>   </back>`", () => {
    expect(textLengths(ours)).toEqual(textLengths(jar));
  });

  // `<back:color>` itself is a FontStyle.BACKCOLOR the port captures but
  // never applies: `FontConfiguration` (`klimt/shape/UText.ts`) carries no
  // `extendedColor` field, so `DriverTextSvg` mints no `feFlood` filter
  // (`CommandCreoleStyle.ts`'s own doc comment: "deliberately deferred").
  // Not this task's write-set — see `.agent-notes/cdd-T28.md`.
  it.todo('paints each swatch cell with its own <defs> feFlood filter');
});

describe('chrome creole — galili-87-zivo129 (<back:red> in footer and legend)', () => {
  const ours = render('class', 'galili-87-zivo129');
  const jar = golden('class', 'galili-87-zivo129');

  it("draws the legend text at the jar's own run width", () => {
    expect(textContents(chromeGroup(ours, 'legend'))).toEqual(['The legend']);
    expect(textLengths(chromeGroup(ours, 'legend'))).toEqual(textLengths(chromeGroup(jar, 'legend')));
  });

  it('keeps the four other chrome slots byte-identical in content to the jar', () => {
    for (const cls of ['header', 'title', 'caption', 'footer']) {
      expect(textContents(chromeGroup(ours, cls))).toEqual(textContents(chromeGroup(jar, cls)));
    }
  });

  it.todo('emits the <back:red> feFlood filter and its <defs> entry');
});

describe('chrome creole — rusuzi-21-kile910 (<font size=18> in a title)', () => {
  it('honours the creole font-size tag instead of drawing the literal markup', () => {
    const ours = chromeGroup(render('class', 'rusuzi-21-kile910'), 'title');
    const jar = chromeGroup(golden('class', 'rusuzi-21-kile910'), 'title');
    expect(textContents(ours)).toEqual(['Pragma Multi Test']);
    expect(/font-size="(\d+)"/.exec(ours)?.[1]).toBe('18');
    expect(textContents(ours)).toEqual(textContents(jar));
    expect(textLengths(ours)).toEqual(textLengths(jar));
  });
});

// ---------------------------------------------------------------------------
// Non-class engines — this seam is shared, so each engine gets one chrome
// fixture pinned against the jar's own chrome group (T28 step 1).
// ---------------------------------------------------------------------------

describe('chrome creole — the shared seam leaves the other engines jar-faithful', () => {
  it('sequence/bedaja-09-gezu912: title + header text and metrics match the jar', () => {
    const ours = render('sequence', 'bedaja-09-gezu912');
    const jar = golden('sequence', 'bedaja-09-gezu912');
    expect(textContents(chromeGroup(ours, 'title'))).toEqual(['toto']);
    expect(textLengths(chromeGroup(ours, 'title'))).toEqual(textLengths(chromeGroup(jar, 'title')));
    expect(textContents(chromeGroup(ours, 'header'))).toEqual(['titi']);
    expect(textLengths(chromeGroup(ours, 'header'))).toEqual(textLengths(chromeGroup(jar, 'header')));
  });

  it('state/dajipi-09-doki542: title text and metrics match the jar', () => {
    const ours = chromeGroup(render('state', 'dajipi-09-doki542'), 'title');
    const jar = chromeGroup(golden('state', 'dajipi-09-doki542'), 'title');
    expect(textContents(ours)).toEqual(['foo']);
    expect(textLengths(ours)).toEqual(textLengths(jar));
  });

  it('activity/bigide-91-bise382: title text and metrics match the jar', () => {
    const ours = chromeGroup(render('activity', 'bigide-91-bise382'), 'title');
    const jar = chromeGroup(golden('activity', 'bigide-91-bise382'), 'title');
    expect(textContents(ours)).toEqual(['Test_separate_action']);
    expect(textLengths(ours)).toEqual(textLengths(jar));
  });

  it('usecase/pivudu-29-pele178: the legend `----` rule is drawn, in the border colour', () => {
    // `CreoleHorizontalLine` paints with the graphic's foreground, which
    // `TextBlockBordered#drawU` sets to the border colour (java:126-141) --
    // the legend's own `#000`, matching the jar's `stroke:#000`.
    const ours = chromeGroup(render('usecase', 'pivudu-29-pele178'), 'legend');
    const jar = chromeGroup(golden('usecase', 'pivudu-29-pele178'), 'legend');
    expect(childTags(ours)).toEqual(childTags(jar));
    expect(childTags(ours)).toEqual(['rect', 'text', 'line', 'text']);
    expect(/<line[^>]*style="([^"]*)"/.exec(ours)?.[1]).toBe('stroke:#000;stroke-width:1;');
  });
});

// ---------------------------------------------------------------------------
// CDD B7FU-R2: `{{ }}` embedded diagrams inside chrome text (title/legend/
// header/footer/caption) now render through the SAME nested-diagram
// renderer T27 built for class bodies, via the CORE-owned registration slot
// (`core/nested-diagram-registry.ts`, populated by `class-nested-diagram-
// renderer.ts#registerNestedDiagramRenderers`, wired in `src/index.ts
// #prepareBlock`) instead of unconditionally throwing.
// ---------------------------------------------------------------------------

describe('chrome creole — {{ }} embedded diagrams (CDD B7FU-R2)', () => {
  it('a legend embedding a supported diagram type ({{ file f }}) draws a real <image>, not the (42,42) fallback', () => {
    const src = '@startuml\nclass foo\nlegend\n{{\nfile f\n}}\nendlegend\n@enduml';
    const svg = renderSync(src, { measurer: new DeterministicMeasurer() });
    const legend = chromeGroup(svg, 'legend');
    const image = /<image[^>]*>/.exec(legend)?.[0];
    expect(image).toBeDefined();
    expect(/width="(\d+)"/.exec(image!)?.[1]).not.toBe('42');
    expect(/height="(\d+)"/.exec(image!)?.[1]).not.toBe('42');
    const decoded = Buffer.from(
      /xlink:href="data:image\/svg\+xml;base64,([^"]+)"/.exec(image!)![1]!,
      'base64',
    ).toString('utf-8');
    expect(decoded).toContain('data-diagram-type="DESCRIPTION"');
    expect(decoded).toContain('>f<');
  });

  it('a legend embedding an unsupported diagram type (no salt engine) degrades to the (42,42) fallback, not a crash', () => {
    // Mirrors bixogo-47-xulu385/roxosu-00-pini153's own shape: a user-macro
    // `SALT(...)` expands to `{{salt ... }}`; this port has no salt engine
    // (`EmbeddedDiagram.ts`'s own catch degrades to (42,42) -- see that
    // file's `calculateDimensionSlow`/`drawU` doc comments), so the render
    // call itself throws "unknown diagram type" and is caught upstream --
    // the legend still renders (no crash), with a fixed-size placeholder
    // rect only, no `<image>`.
    const src = '@startuml\nclass foo\nlegend\n{{salt\n{+\n<b>x\n}\n}}\nendlegend\n@enduml';
    const svg = renderSync(src, { measurer: new DeterministicMeasurer() });
    const legend = chromeGroup(svg, 'legend');
    expect(legend).not.toContain('<image');
    // The legend's own rect is the (42,42) fallback plus its fixed 5px
    // padding on each side (bixogo-47-xulu385/roxosu-00-pini153's own
    // shape, `test-results/dot-cache/class/bixogo-47-xulu385/in.puml`).
    expect(/<rect[^>]*width="52"[^>]*height="52"/.test(legend)).toBe(true);
  });
});
