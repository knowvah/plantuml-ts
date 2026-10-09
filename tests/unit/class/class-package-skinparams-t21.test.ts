/**
 * cdd3-T21 -- package skinparams (E3-1, E3-2, E3-4, E3-5) and the
 * empty-package leaf as a `ClusterDecoration` port (E3-6).
 *
 * Every expected value is the pinned jar's own output for the fixture named
 * in the test (`test-results/dot-cache/class/<slug>/in.svg`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:127-129,274-283,292-302,396-408
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:316-324
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageEmptyPackage.java:97-171
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { preprocess } from '../../../src/core/preprocessor.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';

function render(src: string): string {
  return renderSync(src, { measurer: new DeterministicMeasurer() });
}

function unknownKeys(src: string): string[] {
  return resolveSkinparam(preprocess(src).skinparam, defaultTheme).unknown;
}

/** The `<g class="cluster">` body for the namespace `name`. */
function cluster(svg: string, name: string): string {
  const open = `data-qualified-name="${name}"`;
  const start = svg.indexOf(open);
  expect(start).toBeGreaterThan(-1);
  return svg.slice(start, svg.indexOf('</g>', start));
}

const GIRACA = `@startuml
skinparam packageBorderThickness<<stereo>> 1.5
skinparam packageBorderThickness 0.5
package p1 {
class C
}
package p2 <<stereo>> {
class D
}
@enduml`;

const DOJANU = `@startuml
skinparam shadowing false
skinparam package {
  fontColor blue
  stereotypeFontColor red
}
skinparam package<<Layout>> {
  borderColor Transparent
  backgroundColor Transparent
  fontColor Transparent
  stereotypeFontColor Transparent
}
package p1 <<Dummy>> {
class Foo1 <<Other>>
}
package p2 <<Layout>> {
class Foo2
}
package p3 <<Dummy>> {
}
@enduml`;

const NIJELI_LIKE = `@startuml
skinparam packageStyle rect
skinparam packageFontName "Arial Black"
skinparam packageFontColor red
skinparam packageBorderColor #666666
skinparam packageFontStyle normal
skinparam packageBackgroundColor #bdd0e5
package "Data Network" {
class A
}
package "DCN WAN" {
}
"Data Network" -- "DCN WAN"
@enduml`;

describe('E3-1: per-stereotype package skinparams (FromSkinparamToStyle.java:292-302,396-408)', () => {
  it('giraca-14: packageBorderThickness<<stereo>> 1.5 reaches the stereotyped cluster only', () => {
    expect(unknownKeys(GIRACA)).toEqual([]);
    const svg = render(GIRACA);
    expect(cluster(svg, 'p1')).toContain('stroke-width="0.5"');
    const p2 = cluster(svg, 'p2');
    expect(p2).toContain('stroke-width="1.5"');
    expect(p2).not.toContain('stroke-width="0.5"');
  });

  it('dojanu-92: <<Layout>> transparent border/font/stereo font (DriverPathSvg / DriverTextSvg.java:92-94)', () => {
    expect(unknownKeys(DOJANU)).toEqual([]);
    const p2 = cluster(render(DOJANU), 'p2');
    // Jar: `<path d=... fill="none"/>` (border == back: no stroke at all),
    // `<line ... style="stroke:none;"/>`, and no <text> (transparent font).
    expect(p2).toMatch(/<path d="[^"]+" fill="none"\/>/);
    expect(p2).toMatch(/<line [^>]*stroke="none"\/>/);
    expect(p2).not.toContain('<text');
  });
});

describe('E3-2: packageStereotypeFontColor (FromSkinparamToStyle.java:283)', () => {
  it('dojanu-92: the p1 cluster «Dummy» draws #F00, the title keeps packageFontColor #00F', () => {
    const p1 = cluster(render(DOJANU), 'p1');
    expect(p1).toMatch(/<text [^>]*fill="#F00"[^>]*>«Dummy»<\/text>/);
    expect(p1).toMatch(/<text [^>]*fill="#00F"[^>]*>p1<\/text>/);
  });
});

describe('E3-6: empty-package leaf draws ClusterDecoration with its stereo block (EntityImageEmptyPackage.java:126-171)', () => {
  it('dojanu-92: p3 draws «Dummy» at (21, 87.889), #F00 italic, 14pt', () => {
    // textLength 63.787: dojanu-92 in.svg, re-captured (float32-rounded 63.7875).
    const svg = render(DOJANU);
    expect(svg).toMatch(
      /<text x="21" y="87.889" font-size="14" font-style="italic" fill="#F00" textLength="63.787">«Dummy»<\/text>/,
    );
  });

  it('nijeli-04: packageStyle rect draws the empty leaf as a rounded rect, title centred', () => {
    const svg = render(NIJELI_LIKE);
    const leafAt = svg.indexOf('>DCN WAN</text>');
    const before = svg.slice(0, leafAt);
    const rectTag = before.slice(before.lastIndexOf('<rect '));
    expect(rectTag).toMatch(/stroke="#666" stroke-width="0.5" rx="2.5" ry="2.5"/);
    const x = Number(/<rect x="([\d.]+)"/.exec(rectTag)![1]);
    const titleTag = svg.slice(svg.lastIndexOf('<text', leafAt), leafAt);
    // `USymbolRectangle#asBig`: posTitle = (width - dimTitle.w) / 2 = 10.
    expect(Number(/ x="([\d.]+)"/.exec(titleTag)![1])).toBeCloseTo(x + 10, 3);
    expect(before).not.toMatch(/<path [^>]*>\s*$/);
  });
});

describe('E3-4: cluster rect keeps the style RoundCorner (Cluster.java:321-324)', () => {
  it('nijeli-04: non-strict packageStyle rect cluster draws rx=ry=2.5', () => {
    const c = cluster(render(NIJELI_LIKE), 'Data Network');
    expect(c).toMatch(/<rect [^>]*rx="2.5" ry="2.5"/);
  });
});

describe('E3-5: packageFontName / packageFontStyle (FromSkinparamToStyle.java:278 addConFont)', () => {
  it('nijeli-04: titles draw in Arial Black, not bold', () => {
    expect(unknownKeys(NIJELI_LIKE)).toEqual([]);
    const svg = render(NIJELI_LIKE);
    const title = /<text [^>]*>Data Network<\/text>/.exec(cluster(svg, 'Data Network'))![0];
    expect(title).toContain(`font-family="'Arial Black'"`);
    expect(title).not.toContain('font-weight');
    const leaf = /<text [^>]*>DCN WAN<\/text>/.exec(svg)![0];
    expect(leaf).toContain(`font-family="'Arial Black'"`);
    expect(leaf).not.toContain('font-weight');
  });
});

describe('USymbol groups take no package_ tier (Cluster.java:285-296, ClusterHeader.java:150-153)', () => {
  it('gigoru-88: a rectangle group keeps #000 title and stereo under packageFontColor/StereotypeFontColor', () => {
    const src = `@startuml
allowmixing
skinparam packageFontColor green
skinparam packageStereotypeFontColor blue
package P2 <<something2>> {
  class a
}
rectangle R4 <<something4>> {
  class b
}
@enduml`;
    const svg = render(src);
    const r4 = cluster(svg, 'R4');
    expect(r4).toMatch(/fill="#000"[^>]*>«something4»<\/text>/);
    expect(r4).toMatch(/fill="#000"[^>]*>R4<\/text>/);
    // jar gigoru-88: the package cluster's stereo is packageStereotypeFontColor.
    expect(cluster(svg, 'P2')).toMatch(/fill="#00F"[^>]*>«something2»<\/text>/);
  });
});

describe('empty-package leaf stereo block geometry', () => {
  it('ziruri-42: folder leaf p4 <<Foo>> draws «Foo» at (91.92, 85.889), black italic', () => {
    const svg = render(`@startuml
package p1 {
  class in1
}
package p2 <<Foo>> {
  class in2
}
package p3 {
}
package p4 <<Foo>> {
}
@enduml`);
    const leaf = [
      ...svg.matchAll(
        /<text x="([\d.]+)" y="([\d.]+)" font-size="14" font-style="italic" fill="#000" textLength="39.725">«Foo»<\/text>/g,
      ),
    ];
    // Two «Foo»s: p2's cluster header, then p4's leaf (jar x=91.92 is the
    // 2-decimal rounding of 91.925).
    expect(leaf).toHaveLength(2);
    expect(Number(leaf[1]![1])).toBeCloseTo(91.92, 1);
    expect(Number(leaf[1]![2])).toBeCloseTo(85.889, 3);
  });

  it('USymbolRectangle#asBig: stereo at y+2 above the title, title shifted by the stereo height', () => {
    const svg = render(`@startuml
skinparam packageStyle rect
package p4 <<Foo>> {
}
class A
@enduml`);
    const rectTag = /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"[^>]*rx="2.5"/.exec(svg)!;
    const [x, y, w] = [Number(rectTag[1]), Number(rectTag[2]), Number(rectTag[3])];
    const stereo = /<text x="([\d.]+)" y="([\d.]+)"[^>]*textLength="([\d.]+)">«Foo»<\/text>/.exec(svg)!;
    // posStereoX = (width - (w + 2)) / 2, +1 margin; baseline = 2 + 14 - descent.
    expect(Number(stereo[1])).toBeCloseTo(x + (w - Number(stereo[3]) - 2) / 2 + 1, 2);
    const title = /<text x="([\d.]+)" y="([\d.]+)"[^>]*>p4<\/text>/.exec(svg)!;
    expect(Number(title[2]) - Number(stereo[2])).toBeCloseTo(14, 3);
    expect(Number(stereo[2]) - y).toBeCloseTo(2 + 14 - 3.111, 2);
  });

  it('scale 2 doubles the leaf stereo run (textLength, x offset)', () => {
    const one = render('@startuml\npackage p4 <<Foo>> {\n}\n@enduml');
    const two = render('@startuml\nscale 2\npackage p4 <<Foo>> {\n}\n@enduml');
    const len = (s: string) => Number(/textLength="([\d.]+)">«Foo»/.exec(s)![1]);
    expect(len(two)).toBeCloseTo(len(one) * 2, 2);
  });
});

describe('E3-5: packageFontStyle italic', () => {
  it('draws the cluster title italic and not bold', () => {
    const svg = render('@startuml\nskinparam packageFontStyle italic\npackage p {\nclass A\n}\n@enduml');
    const title = /<text [^>]*>p<\/text>/.exec(cluster(svg, 'p'))![0];
    expect(title).toContain('font-style="italic"');
    expect(title).not.toContain('font-weight');
  });
});
