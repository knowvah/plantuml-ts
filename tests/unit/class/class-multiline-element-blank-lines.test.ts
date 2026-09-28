/**
 * T4c (class-divergence-drive-5, `multiline-element-blank-line-dropped`):
 * a blank interior body line of a TYPE0 (`as "…`) or TYPE1 (`[ … ]`)
 * multi-line descriptive-leaf element must survive into `Classifier.display`
 * — upstream keeps EVERY line `BlocLines#subExtract(1, 1)` leaves between the
 * opener and the closer, blank ones included, and turns them into `display`
 * verbatim (`Display lines.toDisplay()`); it never filters on `String#trim()`.
 *
 * @see ~/git/plantuml/.../descdiagram/command/CommandCreateElementMultilines.java:192-193
 * @see src/diagrams/class/class-multiline-element.ts
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';

function parseRaw(source: string): ClassDiagramAST {
  const block: UmlSource = { lines: source.split('\n'), type: 'class' };
  return parseClass(block);
}

function classifier(ast: ClassDiagramAST, id: string) {
  return ast.classifiers.find((c) => c.id === id);
}

describe('multiline-element-blank-line-dropped (T4c)', () => {
  it('TYPE0 (`as "…`) keeps a blank interior body line (boguko-42-zuda981 shape)', () => {
    const ast = parseRaw(['rectangle A as "', 'line one', '', 'line two"'].join('\n'));
    expect(classifier(ast, 'A')?.display).toBe('line one\n\nline two');
  });

  it('TYPE1 (`[ … ]`) keeps a blank interior body line (fidaru-93-zumu093 shape)', () => {
    const ast = parseRaw(['rectangle B [', 'line one', '', 'line two', ']'].join('\n'));
    expect(classifier(ast, 'B')?.display).toBe('line one\n\nline two');
  });

  it('TYPE0 keeps two consecutive blank interior lines (fidaru-shaped multi-gap body)', () => {
    const ast = parseRaw(['rectangle C as "', '', 'mid', '', 'end"'].join('\n'));
    expect(classifier(ast, 'C')?.display).toBe('\nmid\n\nend');
  });
});
