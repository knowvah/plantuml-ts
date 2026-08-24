/**
 * S1L-b T2 — a `<keyword> <code> [ … ]` element body (upstream
 * `CommandCreateElementMultilines` TYPE1) is the element's display/label,
 * not discarded. Previously `tryElementBlock` emitted the node with
 * `display = code` and dropped every body line (a shortcut from when node
 * sizes were tolerant); now that S1L asserts node sizes, the body must
 * reach `node.display`. See `src/diagrams/description/parser.ts`.
 */

import { describe, it, expect } from 'vitest';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { DescriptionDiagramAST, DescriptiveNode } from '../../../src/diagrams/description/ast.js';
import { descriptionAst } from './parse-description-ast.js';

function parse(source: string): DescriptionDiagramAST {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'description' };
  return descriptionAst(parseDescription(block));
}

function nodeById(ast: DescriptionDiagramAST, id: string): DescriptiveNode | undefined {
  return ast.nodes.find((n) => n.id === id);
}

describe('description parser — [ … ] element body as display (S1L-b T2)', () => {
  it('multi-line body (incl. a creole HR line) becomes the node display', () => {
    const ast = parse('node n [\nfoo1\n====\nfoo2\n]');
    const n = nodeById(ast, 'n');
    expect(n?.display).toBe('foo1\n====\nfoo2');
  });

  it('one-line form `component c [ desc ]` sets id and display', () => {
    const ast = parse('component c [ desc ]');
    const c = nodeById(ast, 'c');
    expect(c?.id).toBe('c');
    expect(c?.display).toBe('desc');
  });

  it('a `\\n` escape stays LITERAL in a body — only the single-line path splits', () => {
    // This previously asserted the opposite, on the assumption that a body row
    // is "finalized like a single-line display". It is not. Upstream builds a
    // TYPE1 display with `lines.toDisplay()`
    // (`CommandCreateElementMultilines.java:193`) -> `Display.createFoo` ->
    // `create(lines)`, which takes the strings AS-IS;
    // `Display.getWithNewlines` — the thing that splits `\n`/`\r`/`\l` — is
    // reached only from the single-line path
    // (`CommandCreateElementFull.java:321,324`).
    //
    // Jar-verified on `component/nujito-06-neca370`, whose body rows the jar
    // draws as the literal `aaa \\n bbb \\n`; sizing that fixture went from a
    // 2.18in node-size delta to exact.
    const ast = parse('node n [\nfirst\\nsecond\n]');
    const n = nodeById(ast, 'n');
    expect(n?.display).toBe('first\\nsecond');
  });

  it('a `\\t` escape in a body still becomes a tab (per-atom, not via getWithNewlines)', () => {
    // The counterpart to the rule above, and the reason removing the body's
    // getWithNewlines alone regressed `component/fariba-82-xolu802`: `\t` is
    // converted per ATOM by `AtomText.manageSpecialChars` (java:140-145), a
    // different mechanism that is unaffected by the display-construction path.
    // Held at the atom layer, so the parser keeps the raw token.
    const ast = parse('node n [\nfirst\\tsecond\n]');
    const n = nodeById(ast, 'n');
    expect(n?.display).toBe('first\\tsecond');
  });

  // Corrected in S1L-e: this previously asserted the code stayed as the
  // display ("no empty-string label"), which was an assumption, not jar
  // behaviour. Jar-verified — `component c [ ]` draws NO text at all and
  // boxes at 40x30 (pure margin + icon), while a plain `component d` is
  // 47.787x44. Upstream sets the display from the block unconditionally;
  // there is no fall-back-to-the-code branch.
  it('an empty body REPLACES the display, leaving no label', () => {
    const ast = parse('component c [\n]');
    const c = nodeById(ast, 'c');
    expect(c?.display).toBe('');
  });
});
