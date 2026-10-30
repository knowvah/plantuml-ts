/**
 * jfp T4b (M3, declared-size half): the engine is handed
 * `TextBlockJson#calculateDimension`, not the drawn box.
 *
 * - `calculateDimensionSlow` (`TextBlockJson.java:225-231`): width =
 *   `getWidthColA + getWidthColB` (0 for an empty `[]`/`{}`, no lines),
 *   height = `getTotalHeight` (`:322-330`, `MIN_HEIGHT` = 15 when no lines).
 * - `MIN_WIDTH` (30) exists only at draw time (`drawU`, `:278-279`).
 * - `SmetanaForJson#createNode` (`:243-244`) swaps them: the engine's width is
 *   the block's height, the engine's height the block's width.
 *
 * The label half (`:253-254`, no `label` when the node has no lines) is NOT
 * ported: it needs a `src/core/` change, and dot-engine sizes the default
 * `\N` label as the node name + XPAD/YPAD where Smetana sizes it (0,16).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.types.js';
import { layoutJson, type JsonGeometry } from '../../../src/diagrams/json/layout.js';
import { parseJson } from '../../../src/diagrams/json/parser.js';

/** `TextBlockJson.java:74-75`. */
const MIN_WIDTH = 30;
const MIN_HEIGHT = 15;
/** FixedMeasurer(8, 14): one char = 8 wide, + 2*5 cell margin (`:340-349`); a row = 14 + 2*2. */
const CELL_WIDTH = 18;
const ROW_HEIGHT = 18;

const measurer = new FixedMeasurer(8, 14);
let captured: DotInputGraph | undefined;

function run(body: string): { graph: DotInputGraph; geo: JsonGeometry } {
  captured = undefined;
  setLayoutInputObserver((event) => {
    captured ??= event.graph;
  });
  const geo = layoutJson(parseJson({ type: 'json', lines: body.split('\n') }), defaultTheme, measurer);
  expect(captured, 'layoutJson should reach the layout seam').toBeDefined();
  return { graph: captured!, geo };
}

afterEach(() => setLayoutInputObserver(undefined));

describe('layoutJson: engine size of an empty container (TextBlockJson.java:225-231)', () => {
  it('declares engine height 0 (colA + colB) and width MIN_HEIGHT for `[]`', () => {
    const { graph } = run('{"a": []}');
    const empty = graph.nodes[1]!;
    expect(empty.width).toBe(MIN_HEIGHT);
    expect(empty.height).toBe(0);
  });

  it('declares the same for `{}`', () => {
    const { graph } = run('{"a": {}}');
    const empty = graph.nodes[1]!;
    expect(empty.width).toBe(MIN_HEIGHT);
    expect(empty.height).toBe(0);
  });

  it('still DRAWS the box at MIN_WIDTH x MIN_HEIGHT (drawU, :278-279)', () => {
    const { geo } = run('{"a": []}');
    const empty = geo.nodes[1]!;
    expect(empty.width).toBe(MIN_WIDTH);
    expect(empty.height).toBe(MIN_HEIGHT);
  });

  it('sends an explicit empty label (the label half is not ported)', () => {
    const { graph } = run('{"a": []}');
    expect(graph.nodes[1]!.recordLabel).toBe('');
  });
});

describe('layoutJson: a non-empty node keeps its engine size', () => {
  it('engine width = block height, engine height = colA + colB = block width', () => {
    const { graph, geo } = run('{"a": "b"}');
    const root = graph.nodes[0]!;
    expect(root.width).toBe(ROW_HEIGHT);
    expect(root.height).toBe(2 * CELL_WIDTH);
    expect(geo.nodes[0]!.width).toBe(2 * CELL_WIDTH);
    expect(geo.nodes[0]!.height).toBe(ROW_HEIGHT);
  });
});
