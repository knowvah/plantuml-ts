/**
 * cdd6 T2a (D2): the class renderers consume T1a's `ElementColors` fields --
 * `lineStyle`, `lineStyleByStereo`, `titleFont`, `backgroundGradient`,
 * `fontByStereo`, `borderByStereo`, `lineThicknessByStereo`,
 * `stereotypeFontByStereo`, and the `elements.group` bucket.
 *
 * Expected values are the pinned jar's own output: the corpus rows named in
 * each `it` (`test-results/dot-cache/unknown/<slug>/in.svg`) and the probes
 * rendered through `scripts/oracle-render.sh` (rect-leaf dash, leaf
 * by-stereo paint, leaf title/stereo colours, `group { LineStyle }`,
 * `rectangleBorderThickness[<<t>>]` on a cluster).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function render(body: string): string {
  return renderSync(`@startuml\n${body}\n@enduml`, { measurer: new DeterministicMeasurer() });
}

/** The children of the `<g>` whose `data-qualified-name` is `name`. */
function group(svg: string, name: string): string {
  const m = new RegExp(`data-qualified-name="${name}"[^>]*>(.*?)</g>`, 's').exec(svg);
  if (m === null) throw new Error(`no group ${name}`);
  return m[1]!;
}

function firstStyle(fragment: string): string | undefined {
  return /style="([^"]*)"/.exec(fragment)?.[1];
}

function textFills(fragment: string): string[] {
  return [...fragment.matchAll(/<text [^>]*fill="([^"]*)"[^>]*>([^<]*)</g)].map((m) => `${m[2]}=${m[1]}`);
}

const NESTED_R = 'rectangle "R1" as r1 <<boundary>> {\n  rectangle "R2" as r2 <<boundary>> {\n  }\n}';
const NESTED_PLAIN = 'rectangle "R1" as r1 {\n  rectangle "R2" as r2 {\n  }\n}';

describe('USymbol cluster + leaf stroke: LineStyle (Cluster.java:402-407, Style.java:299-320)', () => {
  it('palida-11: `<style> rectangle { LineColor red; LineStyle 7-7 }` dashes cluster and leaf', () => {
    const svg = render(`<style>\nrectangle {\n  LineColor red\n  LineStyle 7-7\n}\n</style>\n${NESTED_PLAIN}`);
    expect(firstStyle(group(svg, 'r1'))).toBe('stroke:#F00;stroke-width:1;stroke-dasharray:7,7;');
    expect(firstStyle(group(svg, 'r1.r2'))).toBe('stroke:#F00;stroke-width:0.5;stroke-dasharray:7,7;');
  });

  it('zivilu-35: `skinparam rectangle { BorderStyle dashed }` is LineStyle 7', () => {
    const svg = render(`skinparam rectangle {\n    BorderStyle dashed\n}\n${NESTED_PLAIN}`);
    expect(firstStyle(group(svg, 'r1'))).toBe('stroke:#181818;stroke-width:1;stroke-dasharray:7,7;');
    expect(firstStyle(group(svg, 'r1.r2'))).toBe('stroke:#181818;stroke-width:0.5;stroke-dasharray:7,7;');
  });

  it('probe: `group { LineStyle 3 }` reaches a rectangle cluster (Cluster.java:291 signature)', () => {
    const svg = render('<style>\ngroup {\n  LineStyle 3\n}\n</style>\nrectangle R1 {\n  class A\n}');
    expect(firstStyle(group(svg, 'R1'))).toBe('stroke:#181818;stroke-width:1;stroke-dasharray:3,3;');
  });

  it('probe: rectangleBorderThickness<<t>> and the plain key thicken the cluster', () => {
    const body =
      'skinparam rectangleBorderThickness<<t>> 3\nskinparam rectangleBorderThickness 2\n' +
      'rectangle R1 <<t>> {\n  class A\n}\nrectangle R2 {\n  class B\n}';
    const svg = render(body);
    expect(firstStyle(group(svg, 'R1'))).toBe('stroke:#181818;stroke-width:3;');
    expect(firstStyle(group(svg, 'R2'))).toBe('stroke:#181818;stroke-width:2;');
  });
});

describe('USymbol cluster + leaf by-stereo paint (FromSkinparamToStyle.java:292-302,396-408)', () => {
  it('fepiko-26: rectangle<<boundary>> BorderColor/BorderStyle/FontColor', () => {
    const body =
      'skinparam rectangle<<boundary>> {\n    FontColor blue\n    BorderColor green\n    BorderStyle dashed\n}\n' +
      NESTED_R;
    const svg = render(body);
    expect(firstStyle(group(svg, 'r1'))).toBe('stroke:#008000;stroke-width:1;stroke-dasharray:7,7;');
    expect(textFills(group(svg, 'r1'))).toEqual(['«boundary»=#00F', 'R1=#00F']);
    expect(firstStyle(group(svg, 'r1.r2'))).toBe('stroke:#008000;stroke-width:0.5;stroke-dasharray:7,7;');
    expect(textFills(group(svg, 'r1.r2')).at(-1)).toBe('R2=#00F');
  });

  it('catana-32: `rectangle { .boundary { FontColor red } }` colours stereo and title', () => {
    const style = '<style>\nrectangle {\n .boundary {\n  FontColor red\n }\n}\n</style>';
    const svg = render(`${style}\n${NESTED_R}`);
    expect(textFills(group(svg, 'r1'))).toEqual(['«boundary»=#F00', 'R1=#F00']);
    expect(textFills(group(svg, 'r1.r2')).at(-1)).toBe('R2=#F00');
  });

  it('probe: a leaf reads BackgroundColor/BorderColor/FontColor/StereotypeFontColor<<person>>', () => {
    const body =
      'allowmixing\nskinparam rectangle<<person>> {\n    BackgroundColor #08427B\n    BorderColor #073B6F\n' +
      '    FontColor #FFFFFF\n    StereotypeFontColor red\n}\nrectangle Foo <<person>>\nclass A';
    const foo = group(render(body), 'Foo');
    expect(/<rect [^>]*fill="([^"]*)"/.exec(foo)?.[1]).toBe('#08427B');
    expect(firstStyle(foo)).toBe('stroke:#073B6F;stroke-width:0.5;');
    expect(textFills(foo).at(-1)).toBe('Foo=#FFF');
  });
});

describe('`package` leaf skinparam tier (FromSkinparamToStyle.java:127-129 addMagic)', () => {
  it('probe / gigoru-88: packageBorderColor + packageBackgroundColor reach an allowmixing package leaf', () => {
    const svg = render(
      'allowmixing\nskinparam packageBorderColor red\nskinparam packageBackgroundColor yellow\npackage EmptyPackage1\nclass A',
    );
    const leaf = group(svg, 'EmptyPackage1');
    expect(firstStyle(leaf)).toBe('stroke:#F00;stroke-width:0.5;');
    expect(/<path [^>]*fill="([^"]*)"/.exec(leaf)?.[1]).toBe('#FF0');
  });
});

describe('cluster title / stereotype colours (ClusterHeader.java:152-165,209-215)', () => {
  it('noxebo-98: `rectangle { Stereotype { FontColor red } }` colours the cluster stereo only', () => {
    const svg = render(
      '<style>\nrectangle {\n  Stereotype {\n    FontColor red\n  }\n}\n</style>\n' +
        'rectangle "R1" as r1 <<foo1>> {\n  class A\n}',
    );
    expect(textFills(group(svg, 'r1'))).toEqual(['«foo1»=#F00', 'R1=#000']);
  });

  it('juzica-68: per-sname title/stereotype colours on rectangle and package clusters', () => {
    const style =
      '<style>\nrectangle {\n    fontColor orange\n    title {\n        fontColor red\n    }\n' +
      '    stereotype {\n        fontColor purple\n    }\n}\npackage {\n    title {\n        fontColor blue\n    }\n' +
      '    stereotype {\n        fontColor green\n    }\n}\n</style>';
    const body =
      'allowmixing\npackage P2 <<s2>> {\n    class a\n}\nrectangle E3 <<s3>>\nrectangle R4 <<s4>> {\n    class b\n}';
    const svg = render(`${style}\n${body}`);
    expect(textFills(group(svg, 'R4'))).toEqual(['«s4»=#800080', 'R4=#F00']);
    expect(textFills(group(svg, 'P2'))).toEqual(['P2=#00F', '«s2»=#008000']);
    expect(textFills(group(svg, 'E3')).at(-1)).toBe('E3=#F00');
  });

  it('cevoti-40: `package, rectangle { stereotype { FontColor blue } }` reaches the rectangle cluster', () => {
    const style =
      '<style>\npackage, rectangle {\n  FontColor green\n  stereotype {\n    FontColor blue\n  }\n}\n</style>';
    const svg = render(`${style}\nrectangle R4 <<s4>> {\n    class b\n}`);
    expect(textFills(group(svg, 'R4'))).toEqual(['«s4»=#00F', 'R4=#008000']);
  });

  it('probe: a leaf title uses `title { FontColor }` only when display == code (EntityImageDescription.java:185-189)', () => {
    const style =
      '<style>\nrectangle {\n  LineStyle 5-3\n  LineThickness 2\n  FontColor orange\n' +
      '  title {\n    FontColor red\n  }\n  stereotype {\n    FontColor purple\n  }\n}\n</style>';
    const svg = render(`allowmixing\n${style}\nrectangle Foo <<x>>\nrectangle "Some Bar" as Bar <<x>>\nclass A`);
    expect(firstStyle(group(svg, 'Foo'))).toBe('stroke:#181818;stroke-width:2;stroke-dasharray:5,3;');
    expect(textFills(group(svg, 'Foo')).at(-1)).toBe('Foo=#F00');
    expect(textFills(group(svg, 'Bar')).at(-1)).toBe('Some Bar=#FFA500');
  });
});

describe('empty-package leaf (EntityImageEmptyPackage.java:104-114)', () => {
  it('kacecu-90: `skinparam package { BackgroundColor red-green }` fills the leaf with the gradient', () => {
    const svg = render('skinparam package{\n    BackgroundColor red-green\n}\nnamespace N1 {\n}');
    const fill = /<path d="M[^"]*"[^>]*fill="url\(#([^)]*)\)"/.exec(svg)?.[1];
    expect(fill).toBeDefined();
    const def = new RegExp(`<linearGradient [^>]*id="${fill!}"[^>]*>(.*?)</linearGradient>`, 's').exec(svg)?.[1];
    expect([...(def ?? '').matchAll(/stop-color="([^"]*)"/g)].map((m) => m[1])).toEqual(['#F00', '#008000']);
  });

  it('probe: `packageStyle rect` + `package { BorderStyle dashed }` dashes the rect leaf', () => {
    const svg = render('skinparam packageStyle rect\nskinparam package {\n    BorderStyle dashed\n}\npackage P {\n}');
    // The plain-string `rect()` writes presentation attributes; compareSvg
    // reads them as the jar's `style` declarations.
    expect(/<rect [^>]*stroke-width="([^"]*)" stroke-dasharray="([^"]*)"/.exec(svg)?.slice(1)).toEqual(['0.5', '7,7']);
  });
});
