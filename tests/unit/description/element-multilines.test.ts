/**
 * S1L tail F1-b — `CommandCreateElementMultilines` grammar, all three
 * mechanisms the fix task pins:
 *
 * - **G1** TYPE0 (`<keyword> <code> [#color] as "text` … closed by a line
 *   ENDING in a quote character) had no port at all; a TYPE0 opener fell
 *   through to the single-line `KEYWORD_RE` rule, which swallowed the
 *   unterminated remainder as both id and display while the continuation
 *   lines were silently dropped (pecupa-75-zote612, tajadu-40-juro990,
 *   nixura-77-bina738).
 * - **G8** `processLine`'s blanket `.trim()` destroyed a `[ … ]` body's
 *   relative indentation before `StripeTree#computeLevel` could count it,
 *   so every `|_` tree row collapsed to level 1 (vixeni-34-nici683).
 * - **G9-E1** `ELEMENT_MULTILINE_OPEN_RE` consumed a `<<stereo>>` run in a
 *   NON-capturing group, so `node.stereotype` was never set on the
 *   multi-line open form (fariba-82-xolu802, partial — E2 is a separate
 *   tab-stop gap).
 *
 * @see src/diagrams/description/parser.ts
 * @see ~/git/plantuml/.../descdiagram/command/CommandCreateElementMultilines.java
 */

import { describe, it, expect } from 'vitest';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { DescriptionDiagramAST, DescriptiveNode } from '../../../src/diagrams/description/ast.js';
import { descriptionAst } from './parse-description-ast.js';

/** Parse RAW source lines — deliberately NOT per-line trimmed (the sibling
 *  `element-body.test.ts` helper trims, which cannot exercise G8 at all). */
function parseRaw(source: string): DescriptionDiagramAST {
  const block: UmlSource = { lines: source.split('\n'), type: 'description' };
  return descriptionAst(parseDescription(block));
}

function nodeById(ast: DescriptionDiagramAST, id: string): DescriptiveNode | undefined {
  return ast.nodes.find((n) => n.id === id);
}

describe('CommandCreateElementMultilines TYPE0 — open-quote form (G1)', () => {
  it('joins the opener DESC, the body lines and the closer prefix (pecupa-75)', () => {
    const ast = parseRaw(
      'usecase UC5 #red as "My usecase5\nis on several lines\nand finished"',
    );
    const uc5 = nodeById(ast, 'UC5');
    expect(uc5?.display).toBe('My usecase5\nis on several lines\nand finished');
    expect(uc5?.symbol).toBe('usecase');
  });

  it('reads the color from its pre-`as` slot (ColorParser.exp1)', () => {
    const ast = parseRaw('usecase UC5 #red as "My usecase5\nand finished"');
    expect(nodeById(ast, 'UC5')?.color).toBe('#red');
  });

  it('keeps a `----` body line as its own display row (tajadu-40)', () => {
    const ast = parseRaw(
      'artifact foo2 as "This artifact\nis defined\n----\non several lines"',
    );
    expect(nodeById(ast, 'foo2')?.display).toBe(
      'This artifact\nis defined\n----\non several lines',
    );
  });

  it('a closer line that is bare `"` contributes no display row (nixura-77)', () => {
    const ast = parseRaw('usecase UC1 as "This usecase\n..\nother text\n"');
    expect(nodeById(ast, 'UC1')?.display).toBe('This usecase\n..\nother text');
  });

  it('does NOT expand a literal `\\n` in the body (expandsNewline(false))', () => {
    const ast = parseRaw('artifact foo2 as "aaaa\\nbbbb\ncccc"');
    expect(nodeById(ast, 'foo2')?.display).toBe('aaaa\\nbbbb\ncccc');
  });

  it('captures a stereotype run ahead of the color', () => {
    const ast = parseRaw('usecase UC1 <<primary>> #red as "one\ntwo"');
    const uc1 = nodeById(ast, 'UC1');
    expect(uc1?.stereotype).toEqual(['primary']);
    expect(uc1?.color).toBe('#red');
  });

  it('abandons the command when no closing quote line follows (EOF)', () => {
    // Upstream `isMultilineCommandOk` returns null at EOF and the factory
    // `continue`s to the next command — the single-line rule then takes it.
    //
    // T7: the second line is now a clean, independently-valid declaration
    // rather than free-text prose. The original fixture's second line
    // ("is on several lines") was itself unrecognised by every command in
    // this factory — no keyword, no leading quote/paren/colon/bracket, no
    // decoration — so a real jar would ALSO refuse the whole document on
    // that line (`PSystemCommandFactory.java:169-175`), not silently drop
    // it and keep going. That made it the wrong fixture to isolate the
    // TYPE0-abandonment mechanism this test targets; swapping in a valid
    // second line keeps that mechanism under test without also tripping an
    // unrelated, correct T7 refusal.
    const ast = parseRaw('usecase UC5 as "My usecase5\ncomponent c2');
    expect(nodeById(ast, 'UC5')).toBeUndefined();
    expect(nodeById(ast, 'c2')).toBeDefined();
  });

  it('never steals an already-closed single-line `as "…"` declaration', () => {
    const ast = parseRaw('usecase UC4 as "My usecase4"\nusecase UC6 as "x\ny"');
    expect(nodeById(ast, 'UC4')?.display).toBe('My usecase4');
    expect(nodeById(ast, 'UC6')?.display).toBe('x\ny');
  });
});

describe('element block body keeps relative indentation (G8)', () => {
  it('strips only the first body line indent, keeping the `|_` nesting', () => {
    const ast = parseRaw(
      ['component B [', '    Level 1', '    |_ Level 2a', '      |_ Level 3a', '        |_ Level 4a', '    ]'].join(
        '\n',
      ),
    );
    expect(nodeById(ast, 'B')?.display).toBe('Level 1\n|_ Level 2a\n  |_ Level 3a\n    |_ Level 4a');
  });

  it('a line indented less than the reference keeps what it has', () => {
    // `BlocLines#removeStartingSpaces` strips AT MOST `nb` characters.
    const ast = parseRaw(['component B [', '    aaa', '  bbb', ']'].join('\n'));
    expect(nodeById(ast, 'B')?.display).toBe('aaa\nbbb');
  });

  it('a TYPE0 body keeps its relative indentation too', () => {
    // The CLOSING line is exempt: upstream reads its pre-quote prefix off
    // `lines.getLast().getTrimmed()`, so a terminator line's own indentation
    // never reaches the display. Hence the bare `"` closer here.
    const ast = parseRaw(['usecase U as "top', '  |_ two', '    |_ three', '"'].join('\n'));
    expect(nodeById(ast, 'U')?.display).toBe('top\n|_ two\n  |_ three');
  });
});

describe('multi-line open form captures its stereotype (G9-E1)', () => {
  it('`file policy <<policy>> [` sets node.stereotype', () => {
    const ast = parseRaw('file policy <<policy>> [\nAAAA\nBBBB\n]');
    const policy = nodeById(ast, 'policy');
    expect(policy?.stereotype).toEqual(['policy']);
    expect(policy?.display).toBe('AAAA\nBBBB');
  });

  it('leaves stereotype unset when the open form carries none', () => {
    const ast = parseRaw('file policy [\nAAAA\n]');
    expect(nodeById(ast, 'policy')?.stereotype).toBeUndefined();
  });

  it('captures every tag of a consecutive `<<a>> <<b>>` run', () => {
    const ast = parseRaw('component c <<a>> <<b>> [\nAAAA\n]');
    expect(nodeById(ast, 'c')?.stereotype).toEqual(['a', 'b']);
  });
});
