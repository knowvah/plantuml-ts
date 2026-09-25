/**
 * cdd3-T9 S-12 — an empty `package "X" #COLOR {}` keeps its `#COLOR` when it
 * becomes an `EntityImageEmptyPackage` leaf: the constructor reads
 * `entity.getColors().getColor(ColorType.BACK)` and uses it ahead of the
 * style's `BackGroundColor` (`svek/image/EntityImageEmptyPackage.java:
 * 97-112`). Jar-verified on rojoxi-79-vimu822 (`fill="#DDD"`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { parseClass } from './parse-helper.js';
import { collapseEmptyNamespacesFinal } from '../../../src/diagrams/class/class-namespace.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const ROJOXI = [
  'package "Classic Collections" #DDDDDD {}',
  'package "Classic Collections2" #DDDDDD {',
  '  Object <|-- ArrayList',
  '}',
].join('\n');

describe('empty package leaf back colour (EntityImageEmptyPackage.java:97-112)', () => {
  it('collapseEmptyNamespace carries Namespace.color onto the leaf', () => {
    const block: UmlSource = { lines: ['package P #DDDDDD {', '}'], type: 'class' };
    const ast = collapseEmptyNamespacesFinal(parseClass(block));
    expect(ast.classifiers.map((c) => [c.id, c.color])).toEqual([['P', '#DDDDDD']]);
  });

  it('rojoxi-79-vimu822: the empty-package icon and the cluster are both filled #DDD', () => {
    const svg = renderSync(`@startuml\n${ROJOXI}\n@enduml`, { measurer: new WidthTableMeasurer() });
    const fills = [...svg.matchAll(/<path d="[^"]*" fill="([^"]*)"/g)].map((m) => m[1]);
    // Cluster outline, then the empty-package leaf (edges' own paths follow).
    expect(fills.slice(0, 2)).toEqual(['#DDD', '#DDD']);
  });

  it('keeps the theme fill when no colour was written', () => {
    const svg = renderSync('@startuml\npackage P {}\n@enduml', { measurer: new WidthTableMeasurer() });
    expect(svg).toContain('fill="#F1F1F1"');
  });
});
