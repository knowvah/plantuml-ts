/**
 * Directive lines in `@starthcl`, as upstream handles them (unwind-U1).
 *
 * HCL has no command table: `StyleExtractor.java:63-103` consumes a leading
 * `title ` line and `HclDiagramFactory.java:86-92` never sets it (the block is
 * commented out), so no chrome is drawn. `caption`/`legend`/`header`/`footer`
 * are not directives at all -- they are HCL payload, folded into the module
 * name by `HclParser#getModuleOrSomething` (`HclParser.java:77-89`).
 * Jar renders: `tests/fixtures/unwind-U1/hcl-{title,caption,legend,...}.svg`.
 */

import { describe, it, expect } from 'vitest';
import { parseHcl } from '../../../src/diagrams/hcl/parser.js';
import { isEmpty } from '../../../src/core/annotations/index.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function makeSource(lines: string[]): UmlSource {
  return { lines, type: 'hcl' };
}

const BLOCK = ['resource "x" {', '  key = "value"', '}'];

describe('parseHcl — directive lines (unwind-U1)', () => {
  it('a leading `title X` is consumed and never set', () => {
    const ast = parseHcl(makeSource(['title My HCL', ...BLOCK]));
    expect(isEmpty(ast.annotations!)).toBe(true);
    expect(ast.root).toEqual({ key: 'value' });
  });

  it('`caption X` is payload: it joins the module name, dropped with one module', () => {
    const two = parseHcl(makeSource(['caption c', ...BLOCK, 'other {', 'a = "1"', '}']));
    expect(isEmpty(two.annotations!)).toBe(true);
    expect(Object.keys(two.root as object)).toEqual(['caption c resource "x"', 'other']);
    expect(parseHcl(makeSource(['caption c', ...BLOCK])).root).toEqual({ key: 'value' });
  });

  it('a title AFTER the payload is payload, and fails to parse (HclParser.java:88)', () => {
    const ast = parseHcl(makeSource([...BLOCK, 'title Late']));
    expect(ast.parseError).toBe(true);
  });
});
