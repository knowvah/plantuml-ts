/**
 * Annotation-command wiring for the DOT diagram parser (mission G0b/T6, T8).
 * `title` now routes through the shared annotation matcher along with
 * caption/legend/header/footer/mainframe (T8 migrated it off the bespoke
 * `ast.title` field onto `ast.annotations.title`).
 *
 * Each case asserts BOTH halves: the directive was lifted into `annotations`,
 * AND the DOT body came through untouched. The second assertion used to read
 * the projected `ast.nodes`; the passthrough rewrite removed that model, so it
 * now reads `ast.dotContent` — the same claim about the same behaviour.
 *
 * Every input here is one the jar REJECTS ("Syntax Error? (Assumed diagram
 * type: dot)"), so this whole file covers a deliberate divergence rather than
 * a conformance path. See DIVERGENCES.md and `DotDiagramAST.annotations`.
 */

import { describe, it, expect } from 'vitest';
import { parseDot } from '../../../src/diagrams/dot/parser.js';
import { isEmpty } from '../../../src/core/annotations/index.js';

function wrap(inner: string): string {
  return `@startdot\n${inner}\n@enddot`;
}

describe('parseDot — annotation commands (mission G0b/T6, T8)', () => {
  it('single-line `title X` populates annotations.title (T8), not a DOT statement', () => {
    const ast = parseDot(wrap('title My Graph\ndigraph { a -> b; }'));
    expect(ast.annotations?.title.display).toEqual(['My Graph']);
    expect(ast.dotContent.trim()).toBe('digraph { a -> b; }');
  });

  it('multi-line `title ... end title` populates annotations.title (bonus over the old bespoke single-line-only regex)', () => {
    const ast = parseDot(wrap('title\nLine One\nLine Two\nend title\ndigraph { a -> b; }'));
    expect(ast.annotations?.title.display).toEqual(['Line One', 'Line Two']);
    expect(ast.dotContent.trim()).toBe('digraph { a -> b; }');
  });

  it('single-line caption populates annotations.caption, not a DOT statement', () => {
    const ast = parseDot(wrap('caption a caption\ndigraph { a -> b; }'));
    expect(ast.annotations?.caption.display).toEqual(['a caption']);
    expect(ast.dotContent.trim()).toBe('digraph { a -> b; }');
  });

  it('multi-line `legend ... end legend` populates annotations.legend, not a DOT statement', () => {
    const ast = parseDot(wrap('legend\na legend line\nend legend\ndigraph { a -> b; }'));
    expect(ast.annotations?.legend.display).toEqual(['a legend line']);
    expect(ast.dotContent.trim()).toBe('digraph { a -> b; }');
  });

  it('annotation-free fixture parses identically (no chrome, empty annotations)', () => {
    const ast = parseDot(wrap('digraph { a -> b; }'));
    expect(isEmpty(ast.annotations)).toBe(true);
    expect(ast.dotContent.trim()).toBe('digraph { a -> b; }');
  });
});
