/**
 * D1/T1b: `FtileGroup`/`partition` opens its own nested `UGraphicForSnake`
 * (`decisions.md#D1`) -- `walkTile`'s `'gtile-group'`/`'gtile-partition'`
 * case pushes a fresh `groupScope` id before walking the group's own
 * body and pops it after (`tile-coordinates.ts#walkTileGroup`), and
 * `pushEdge` tags every edge's `EdgeMeta.scope` with whatever is on top
 * of that stack. T1a's own census (`connection-census.md` §3 case F)
 * tried to confirm this with a coordinate-coincidence fixture and found
 * it confounded by unrelated merges elsewhere in the same SVG -- this
 * test isolates the WIRING directly instead: it asserts the scope TAG
 * itself differs inside vs. outside a group, which is the actual
 * mechanism `layout/snake-merge.ts#addToPending`'s scope-equality gate
 * reads (that gate's own blocking behavior is unit-tested directly in
 * `snake-merge.test.ts`'s "FtileGroup/partition scope isolation" block).
 */
import { describe, expect, it } from 'vitest';
import { assignCoordinatesFull } from '../../../../src/diagrams/activity/layout/assign-coordinates-full.js';
import { GtileAction } from '../../../../src/diagrams/activity/tiles/gtile-action.js';
import { GtileTopDown } from '../../../../src/diagrams/activity/tiles/gtile-top-down.js';
import { GtileGroup } from '../../../../src/diagrams/activity/tiles/gtile-group.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { ActivityDiagramAST } from '../../../../src/diagrams/activity/ast.js';

const bounder: StringBounder = { getDimension: (_text: string, _size: number) => ({ width: 60, height: 16 }) };
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };
const emptyAst: ActivityDiagramAST = { nodes: [], swimlanes: [] };

describe('walkTile groupScope wiring — edges inside a group carry a scope the outer edges do not', () => {
  it('tags the outer sibling edge undefined and the inner sibling edge with a scope id', () => {
    const outerAction = new GtileAction({ kind: 'action' as const, label: 'outer' }, bounder, theme);
    const innerB = new GtileAction({ kind: 'action' as const, label: 'b' }, bounder, theme);
    const innerC = new GtileAction({ kind: 'action' as const, label: 'c' }, bounder, theme);
    const innerBody = new GtileTopDown([innerB, innerC], bounder, theme);
    const group = new GtileGroup('title', innerBody, bounder, theme);
    const root = new GtileTopDown([outerAction, group], bounder, theme);

    const full = assignCoordinatesFull({ root, ast: emptyAst, baseX: 0, baseY: 0, bounder, theme });

    // outer->group (the OUTER sibling edge, pushed before any
    // `groupScope` is active) and b->c (the INNER sibling edge, pushed
    // while the group's own scope is on the stack) are the only two
    // edges in this fixture (no in/out connectors on a plain action).
    expect(full.edgeMeta).toHaveLength(2);
    const outerToGroup = full.edgeMeta.find((m) => m.scope === undefined);
    const innerBToC = full.edgeMeta.find((m) => m.scope !== undefined);
    expect(outerToGroup).toBeDefined();
    expect(innerBToC).toBeDefined();
    expect(innerBToC!.scope).not.toBe(outerToGroup?.scope);
  });

  it('a group nested inside another group gets its OWN distinct scope id', () => {
    const innerInnerAction1 = new GtileAction({ kind: 'action' as const, label: 'x' }, bounder, theme);
    const innerInnerAction2 = new GtileAction({ kind: 'action' as const, label: 'y' }, bounder, theme);
    const innerInnerBody = new GtileTopDown([innerInnerAction1, innerInnerAction2], bounder, theme);
    const innerGroup = new GtileGroup('inner', innerInnerBody, bounder, theme);

    const midAction = new GtileAction({ kind: 'action' as const, label: 'mid' }, bounder, theme);
    const outerBody = new GtileTopDown([midAction, innerGroup], bounder, theme);
    const outerGroup = new GtileGroup('outer', outerBody, bounder, theme);

    const full = assignCoordinatesFull({ root: outerGroup, ast: emptyAst, baseX: 0, baseY: 0, bounder, theme });

    // mid->innerGroup (scoped to the OUTER group only) and x->y (scoped
    // to BOTH, i.e. the innermost/nested id) must carry DIFFERENT scope
    // strings -- the stack is pushed again on entering the nested group,
    // never reused from the outer frame.
    const scopes = full.edgeMeta.map((m) => m.scope);
    expect(new Set(scopes).size).toBe(2);
    expect(scopes.every((s) => s !== undefined)).toBe(true);
  });
});
