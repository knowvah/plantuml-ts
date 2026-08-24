/**
 * `parseChart`'s AST arm, for this engine's own unit tests.
 *
 * mission dispatch-by-parse-attempt/T10 widened `parseChart` to
 * `ChartDiagramAST | ParseRefusal` (D1, decisions.md). Every fixture in
 * this suite is written to exercise a successfully-recognised source, so
 * narrowing here and throwing on the refusal arm turns an unexpected
 * refusal into a readable failure (naming the line and message) instead of
 * a `TS2339` at each of this directory's call sites, or a confusing
 * "cannot read property of undefined" three frames later.
 *
 * Chart-local counterpart to `tests/helpers/parse-ast.ts`, which narrows a
 * `plugin.parse()` result; these three files call `parseChart` directly, not
 * through `chartPlugin`, so that helper's `SyncPlugin`/`AsyncPlugin`
 * signature does not fit.
 */
import { parseChart } from '../../../src/diagrams/chart/parser.js';
import type { ChartDiagramAST } from '../../../src/diagrams/chart/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

export function parseChartAst(source: UmlSource): ChartDiagramAST {
  const parsed = parseChart(source);
  if ('refused' in parsed) {
    throw new Error(
      `chart refused this source at line ${String(parsed.line)} ` +
        `(${parsed.kind}): ${parsed.message}`,
    );
  }
  return parsed;
}
