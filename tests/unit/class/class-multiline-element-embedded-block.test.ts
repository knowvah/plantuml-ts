/**
 * T7b (unknown-bucket-routing-repair, T3.md M6, follow-on to T7's
 * `class-multiline-element.ts` port): a nested `{{ … }}` embedded diagram
 * inside a TYPE1 element body (`rectangle A [ … ]`) must be swallowed
 * WHOLE by `PSystemCommandFactory#addOneSingleLineManageEmbedded2`
 * (`PSystemCommandFactory.java:267-303`), nesting-aware via
 * `EmbeddedDiagram#getEmbeddedType`/`EMBEDDED_END`
 * (`EmbeddedDiagram.java:78,257`) — none of the embedded region's lines,
 * including a NESTED `rectangle … [ … ]`'s own closing `]`, may ever be
 * tested against the outer element block's own END regex
 * (`ELEMENT_MULTILINE_END1_RE`). Reproduces rozugu-82-pera583's shape
 * (T3.md, T8's identical description-engine fix precedent).
 *
 * @see src/diagrams/class/class-multiline-element.ts
 * @see src/diagrams/class/class-embedded-block.ts
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';

/** Parse RAW source lines — deliberately NOT per-line trimmed, so the
 *  embedded block's own indentation (none, in this fixture) is preserved
 *  exactly as `parseClass`'s main loop receives it. */
function parseRaw(source: string): ClassDiagramAST {
  const block: UmlSource = { lines: source.split('\n'), type: 'class' };
  return parseClass(block);
}

function classifier(ast: ClassDiagramAST, id: string) {
  return ast.classifiers.find((c) => c.id === id);
}

describe('a nested `{{ … }}` embedded region inside a class TYPE1 element body (T3.md M6)', () => {
  it("does not close the outer block on the embedded region's own interior `]` (rozugu-82-pera583 shape)", () => {
    const ast = parseRaw(
      [
        'rectangle A [',
        '{{',
        'rectangle FailCase [',
        'inner text',
        ']',
        '}}',
        ']',
        'rectangle OkCase [ outer text ]',
      ].join('\n'),
    );
    expect(classifier(ast, 'A')?.display).toBe('{{\nrectangle FailCase [\ninner text\n]\n}}');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['A', 'OkCase']);
    expect(classifier(ast, 'FailCase')).toBeUndefined();
  });

  it('does not refuse the exact rozugu-82-pera583 fixture body', () => {
    const ast = parseRaw(
      [
        'rectangle A [',
        '{{',
        'skinparam BackgroundColor #Transparent',
        'rectangle FailCase [',
        '**Fail Case**',
        '----',
        'åäöÅÄÖ',
        'test 1 %newline()This is a newline :-)',
        'test 2',
        ']',
        '}}',
        ']',
        'rectangle OkCase [',
        '**OK Case**',
        '----',
        'åäöÅÄÖ',
        ']',
      ].join('\n'),
    );
    expect(ast.classifiers.map((c) => c.id)).toEqual(['A', 'OkCase']);
  });
});
