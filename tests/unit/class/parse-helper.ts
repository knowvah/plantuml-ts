/**
 * `parseClass()`'s AST arm, for the many class-engine unit tests that call
 * the raw parser function directly (rather than through `classPlugin`) and
 * expect a `ClassDiagramAST` back.
 *
 * T5 (dispatch-by-parse-attempt, D1) widened `parseClass`'s return type to
 * `ClassDiagramAST | ParseRefusal` -- the refusal-detection loop lives
 * inside `parseClass` itself, so the union has to originate there, not at
 * the `classPlugin.parse()` boundary. Mirrors `tests/helpers/parse-ast.ts`'s
 * plugin-level seam: this throws on an unexpected refusal instead of
 * silently returning `undefined` three frames before a real assertion
 * failure would name the actual cause.
 *
 * Same exported name as the wrapped function so every existing call site
 * only needs its import path changed, not its call sites.
 */
import { parseClass as parseClassRaw } from '../../../src/diagrams/class/parser.js';
import { parseRefusalOf } from '../../../src/core/dispatcher.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';

export function parseClass(block: UmlSource): ClassDiagramAST {
  const parsed = parseClassRaw(block);
  const refusal = parseRefusalOf(parsed);
  if (refusal !== undefined) {
    throw new Error(
      `class parser refused this source at line ${String(refusal.line)} ` +
        `(${refusal.kind}): ${refusal.message}`,
    );
  }
  // `parsed` is `ClassDiagramAST | ParseRefusal` and the refusal arm is
  // excluded above; `parseRefusalOf`'s generic-erased signature can't carry
  // that narrowing back out for a concrete AST type.
  return parsed as ClassDiagramAST;
}
