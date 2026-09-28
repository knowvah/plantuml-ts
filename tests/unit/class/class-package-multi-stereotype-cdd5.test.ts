/**
 * cdd5-T4b (package-header-multi-stereotype-truncated): `package foo2
 * <<A>><<B>> {`. Upstream's lazy `(\<\<.+?\>\>)` STEREOTYPE group
 * (`stereo/StereotypePattern.java:66-67`) is followed in `CommandPackage`
 * (`command/CommandPackage.java:88-96`) only by TAGS2, URL, COLOR and `{` --
 * none of which can absorb `<<B>>`, so the lazy group widens to
 * `<<A>><<B>>` and both labels are drawn (jar: `mupavi-50-fijo192`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { parseClass } from './parse-helper.js';

function parse(...lines: string[]): ReturnType<typeof parseClass> {
  return parseClass({ lines, type: 'class' });
}

describe('package header: every stereotype label survives the parse', () => {
  it('`<<A>><<B>>` keeps both labels', () => {
    const ast = parse('package foo2 <<A>><<B>> {', 'class Class2', '}');
    expect(ast.namespaces.find((n) => n.id === 'foo2')?.stereotype).toBe('A>><<B');
  });

  it('`<<Foo>><<Node>><<Bar>>` keeps all three (not a USymbol name)', () => {
    const ast = parse('package foo3 <<Foo>><<Node>><<Bar>> {', 'class Class3', '}');
    const ns = ast.namespaces.find((n) => n.id === 'foo3');
    expect(ns?.stereotype).toBe('Foo>><<Node>><<Bar');
    expect(ns?.usymbol).toBeUndefined();
  });

  it('a trailing colour still parses after a multi-label stereotype', () => {
    const ast = parse('package foo2 <<A>><<B>> #pink {', 'class Class2', '}');
    const ns = ast.namespaces.find((n) => n.id === 'foo2');
    expect(ns?.stereotype).toBe('A>><<B');
    expect(ns?.color).toBe('#pink');
  });
});

describe('package header: rendered labels (mupavi-50-fijo192 golden)', () => {
  it('draws «A» and «B» for foo2 and «Foo» «Node» «Bar» for foo3', () => {
    const svg = renderSync(
      [
        '@startuml',
        'package foo2 <<A>><<B>> {',
        'class Class2',
        '}',
        'package foo3 <<Foo>><<Node>><<Bar>> {',
        'class Class3',
        '}',
        '@enduml',
      ].join('\n'),
      { measurer: new WidthTableMeasurer() },
    );
    const labels = [...svg.matchAll(/font-style="italic"[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
    expect(labels).toEqual(['«A»', '«B»', '«Foo»', '«Node»', '«Bar»']);
  });
});
