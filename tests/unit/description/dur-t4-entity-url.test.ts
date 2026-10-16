/**
 * dur T4. `EntityImageDescription.java:139,304-305,327-328` wraps an entity's
 * shapes and text in one `<a>` (`getUrl99`); `EntityImagePort` has no url.
 * Expected values are the jar SVGs (`test-results/dot-cache/<tree>/<slug>/in.svg`)
 * and a jar probe for `skinparam topurl`.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { layoutDescription } from '../../../src/diagrams/description/layout.js';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { descriptionAst } from './parse-description-ast.js';

const measurer = new DeterministicMeasurer();

function render(puml: string): string {
  return renderSync(puml, { measurer });
}

/** The first `<a …>…</a>` anchor's opening tag and inner markup. */
function anchor(svg: string, index = 0): { open: string; inner: string } {
  const all = [...svg.matchAll(/<a ([^>]*)>(.*?)<\/a>/g)];
  const m = all[index];
  if (m === undefined) throw new Error('no <a> in svg');
  return { open: m[1]!, inner: m[2]! };
}

function attr(open: string, name: string): string | undefined {
  return new RegExp(`(?:^| )${name}="([^"]*)"`).exec(open)?.[1];
}

describe('description entity url wrapper (EntityImageDescription.java:139,304-305)', () => {
  it('wraps a component in <a> with href/title (gacida-77-joku810)', () => {
    const svg = render('@startuml\ncomponent foo1 as "My comp" [[My_component_1]]\n@enduml');
    const a = anchor(svg);
    expect(attr(a.open, 'href')).toBe('My_component_1');
    expect(attr(a.open, 'title')).toBe('My_component_1');
    expect(attr(a.open, 'target')).toBe('_top');
    expect(a.inner.startsWith('<rect')).toBe(true);
    expect(a.inner).toContain('>My comp</text>');
    expect(svg.indexOf('<a ')).toBeGreaterThan(svg.indexOf('class="entity"'));
  });

  it('wraps an actor and uses the file: href (lizutu-99-mapa855)', () => {
    const a = anchor(render('@startuml\nactor User [[file://c:/toto.txt]]\n@enduml'));
    expect(attr(a.open, 'href')).toBe('file://c:/toto.txt');
    expect(a.inner).toContain('>User</text>');
  });

  it('takes the {tooltip} as title (sadeja-25-tina867)', () => {
    const svg = render(
      '@startuml\nactor Mamal [[http://www.google.com]]\nusecase Dog [[http://www.yahoo.com{This is Dog}]]\n@enduml',
    );
    const dog = anchor(svg, 1);
    expect(attr(dog.open, 'href')).toBe('http://www.yahoo.com');
    expect(attr(dog.open, 'title')).toBe('This is Dog');
    expect(dog.inner).toContain('<ellipse');
  });

  it('wraps a rectangle with a spaced url + tooltip (kolibo-58-rata251)', () => {
    const a = anchor(render('@startuml\nrectangle "Test" as CN1391 [[https://www.google.com/1391 {Text}]]\n@enduml'));
    expect(attr(a.open, 'href')).toBe('https://www.google.com/1391');
    expect(attr(a.open, 'title')).toBe('Text');
  });

  it('prefixes skinparam topurl onto a relative url (jar probe)', () => {
    const a = anchor(render('@startuml\nskinparam topurl http://base/\ncomponent a [[page]]\n@enduml'));
    expect(attr(a.open, 'href')).toBe('http://base/page');
    expect(attr(a.open, 'title')).toBe('http://base/page');
  });

  it('draws no <a> for a port with a url (EntityImagePort has no url)', () => {
    const svg = render('@startuml\ncomponent c {\nport p1 [[pp]]\n}\n@enduml');
    expect(svg).not.toContain('<a ');
  });

  it('draws no <a> when the entity has no url', () => {
    expect(render('@startuml\ncomponent a\n@enduml')).not.toContain('<a ');
  });
});

describe('DescriptionNodeGeo.url (layout seam, consumed by T5 for clusters)', () => {
  it('is a plain {url, tooltip} on a leaf and on a container, topurl applied', () => {
    const lines = 'package P [[pk{Tip}]] {\ncomponent a [[page]]\n}\ncomponent b'.split('\n');
    const theme = { ...defaultTheme, topurl: 'http://base/' };
    const geo = layoutDescription(descriptionAst(parseDescription({ lines, type: 'description' })), theme, measurer);
    const pkg = geo.nodes.find((n) => n.id === 'P');
    expect(pkg?.url).toEqual({ url: 'http://base/pk', tooltip: 'Tip' });
    expect(pkg?.children.find((n) => n.id === 'a')?.url).toEqual({
      url: 'http://base/page',
      tooltip: 'http://base/page',
    });
    expect(geo.nodes.find((n) => n.id === 'b')?.url).toBeUndefined();
  });
});
