/**
 * Narrows `parseDescription`'s `AST | ParseRefusal` return (T7,
 * dispatch-by-parse-attempt/D1) down to the AST arm, for tests that call
 * the parser function directly rather than through `descriptionPlugin
 * .parse()` (where `tests/helpers/parse-ast.ts` already does this).
 *
 * Every existing description fixture in this test suite is expected to
 * keep parsing all the way through — a refusal here is this parser
 * REGRESSING on a line it used to accept, not an expected outcome. Throwing
 * (rather than silently asserting the type away) surfaces that at the
 * offending line, in the failing test, instead of as a downstream "cannot
 * read property 'nodes' of undefined" three assertions later.
 */
import { parseRefusalOf } from '../../../src/core/dispatcher.js';
import type { ParseRefusal } from '../../../src/core/parse-refusal.js';
import type { DescriptionDiagramAST } from '../../../src/diagrams/description/ast.js';

export function descriptionAst(
  result: DescriptionDiagramAST | ParseRefusal,
): DescriptionDiagramAST {
  const refusal = parseRefusalOf(result);
  if (refusal !== undefined) {
    throw new Error(
      `description parser refused line ${String(refusal.line)} ` +
        `(${refusal.kind}): ${refusal.message}`,
    );
  }
  // `parseRefusalOf` takes `unknown` (see its own doc comment) and so
  // cannot carry the narrowing back out through this generic-free wrapper
  // -- same cast `tests/helpers/parse-ast.ts#parseAst` uses for the
  // identical reason.
  return result as DescriptionDiagramAST;
}
