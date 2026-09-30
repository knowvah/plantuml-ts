/**
 * cdd6 T3f (dezobu-62-vuzu421): CommandCreateElementMultilines TYPE1
 * (`<kw> <code> [stereo] [#color] [`) parses COLOR exactly like TYPE0
 * (`ColorParser.exp1()` in both concats, `CommandCreateElementMultilines
 * .java:98-122`; `result.setColors(...)`, :233-234), and its display is
 * `lines.toDisplay()` (:192-199 -> `Display.createFoo` -> `create`), which
 * keeps every body line verbatim -- no quote/bracket unwrap (jar probe:
 * `rectangle A [ "q" (p) :c: ]` draws `"q"`, `(p)`, `:c:`).
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

describe('TYPE1 multi-line element decorations (dezobu-62-vuzu421)', () => {
  it('takes the #color before the opening bracket', () => {
    const ast = parseRaw(['rectangle A <<s>> #Motivation [', 'x', ']'].join('\n'));
    expect(classifier(ast, 'A')?.color).toBe('#Motivation');
    expect(classifier(ast, 'A')?.stereotype).toBe('s');
  });

  it('keeps quote/paren/colon-wrapped body lines verbatim', () => {
    const ast = parseRaw(['rectangle A [', '"q"', '(p)', ':c:', ']'].join('\n'));
    expect(classifier(ast, 'A')?.display).toBe('"q"\n(p)\n:c:');
  });
});
