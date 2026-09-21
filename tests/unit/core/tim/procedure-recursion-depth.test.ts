// @vitest-environment node
/**
 * Unbounded `!procedure` / `!function` recursion. Upstream has NO depth limit
 * (`TFunctionImpl.java`, `TContext.java`; the only guard in `tim/` is
 * `CodeIteratorImpl`'s 999-jump "Infinite loop?", a loop guard): the jar dies
 * with an uncaught `StackOverflowError` and draws nothing. The port bounds the
 * nesting instead -- see `TFunctionImpl.ts#MAX_CALL_DEPTH` and DIVERGENCES.md.
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../../src/index.js';
import { MAX_CALL_DEPTH } from '../../../../src/core/tim/TFunctionImpl.js';
import { expectErrorDiagram, expectNoErrorDiagram } from '../../../helpers/error-diagram.js';

const MESSAGE = `Too many nested calls (limit ${MAX_CALL_DEPTH}). Infinite recursion?`;

const SELF_PROCEDURE = ['@startuml', '!procedure $p()', '$p()', '!endprocedure', '$p()', 'A -> B', '@enduml'].join(
  '\n',
);
const SELF_FUNCTION = ['@startuml', '!function $f()', '!return $f()', '!endfunction', 'A -> B : $f()', '@enduml'].join(
  '\n',
);

function countdown(depth: number): string {
  return [
    '@startuml',
    '!procedure $p($x)',
    '!if $x > 0',
    '$p($x - 1)',
    '!endif',
    '!endprocedure',
    `$p(${depth})`,
    'A -> B',
    '@enduml',
  ].join('\n');
}

describe('recursive user-function depth guard', () => {
  it('pins the limit', () => {
    expect(MAX_CALL_DEPTH).toBe(256);
  });

  it('a self-recursive procedure renders the error diagram naming the recursing line', () => {
    const svg = renderSync(SELF_PROCEDURE);
    expectErrorDiagram(svg, MESSAGE);
    expect(svg).toContain('[From string (line 3) ]');
  });

  it('a self-recursive function renders the error diagram naming the recursing line', () => {
    const svg = renderSync(SELF_FUNCTION);
    expectErrorDiagram(svg, MESSAGE);
    expect(svg).toContain('[From string (line 3) ]');
  });

  it('recursion that stops at the limit still renders', () => {
    expectNoErrorDiagram(renderSync(countdown(MAX_CALL_DEPTH - 1)));
  });

  it('recursion one level past the limit is refused', () => {
    expectErrorDiagram(renderSync(countdown(MAX_CALL_DEPTH)), MESSAGE);
  });

  it('the counter unwinds: two sequential deep calls both succeed', () => {
    const src = countdown(MAX_CALL_DEPTH - 1).replace('A -> B', `$p(${MAX_CALL_DEPTH - 1})\nA -> B`);
    expectNoErrorDiagram(renderSync(src));
  });
});
