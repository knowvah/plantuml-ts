import { describe, it, expect } from 'vitest';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { ActivityDiagramAST } from '../../../src/diagrams/activity/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { parseAst } from '../../helpers/parse-ast.js';

/**
 * add4-T3b ACT-SCALE: `scale ...` (`CommandScale*`, `CommonCommands
 * #addCommonScaleCommands`) calls `diagram.setScale(...)` -- a later
 * directive replaces an earlier one -- and the exporter resolves it at
 * export time (`TextBlockExporter.java:184-188`). The parsed spec now
 * reaches `ast.scale` instead of being consumed and dropped.
 */
function parse(lines: readonly string[]): ActivityDiagramAST {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block);
}

describe('parseActivity — scale directive', () => {
  it('`scale 500 width` sets ast.scale to the unresolved width spec', () => {
    const ast = parse(['scale 500 width', 'start', 'stop']);
    expect(ast.scale).toEqual({ kind: 'width', target: 500 });
    expect(ast.nodes.map((n) => n.kind)).toEqual(['start', 'stop']);
  });

  it('the last scale directive wins (setScale replaces)', () => {
    const ast = parse(['scale 2', 'start', 'scale 3/2', 'stop']);
    expect(ast.scale).toEqual({ kind: 'simple', factor: 1.5 });
  });

  it('no scale directive: ast.scale is absent', () => {
    const ast = parse(['start', 'stop']);
    expect('scale' in ast).toBe(false);
  });
});
