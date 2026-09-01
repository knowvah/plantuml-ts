/**
 * The `newpage` PAGE MODEL: parse -> event -> tile, and the y list the page
 * transform reads back.
 *
 * Batch 1 of `plans/sequence-newpage-pagination`. What is pinned here is the
 * model only -- that a `newpage` becomes an ordinary event, that its tile
 * occupies `NewpageTile#getPreferredHeight` and pushes the tiles after it
 * down by exactly that, and that the tiles come back in layout order
 * including from inside a `group` branch (`PlayingSpace#getNewpageTiles`
 * recurses through `GroupingTile#addNewpageTiles`, `:326-336`). The clip and
 * the separator are Batches 2 and 3.
 */
import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { NEWPAGE_TILE_HEIGHT } from '../../../src/diagrams/sequence/newpage-style.js';
import type {
  NewpageEvent,
  NewpageGeo,
  SequenceDiagramAST,
  SequenceGeometry,
} from '../../../src/diagrams/sequence/ast.js';

const measurer = new FixedMeasurer(8, 16);

function parse(lines: string[]): SequenceDiagramAST {
  const ast = parseSequence(lines);
  if ('refused' in ast) throw new Error(`refused: ${ast.message}`);
  return ast;
}

function layout(lines: string[]): SequenceGeometry {
  return layoutSequence(parse(lines), defaultTheme, measurer);
}

function newpageGeos(geo: SequenceGeometry): NewpageGeo[] {
  return geo.events.filter((e): e is NewpageGeo => e.kind === 'newpage');
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

describe('newpage — parse', () => {
  it('emits a newpage event into the same list a message goes into', () => {
    const ast = parse(['Alice -> Bob : a', 'newpage', 'Alice -> Bob : b']);
    expect(ast.events.map((e) => e.kind)).toEqual(['message', 'newpage', 'message']);
  });

  it('accepts the `@newpage` form', () => {
    const ast = parse(['Alice -> Bob : a', '@newpage']);
    expect(ast.events.map((e) => e.kind)).toEqual(['message', 'newpage']);
  });

  /** `CommandNewpage`'s LABEL group, both separators (`:64-68`). */
  it.each([
    ['newpage Second Page', 'Second Page'],
    ['newpage : Second Page', 'Second Page'],
    ['newpage Test of PlantUML, Part 2', 'Test of PlantUML, Part 2'],
    ['@newpage page 1', 'page 1'],
  ])('captures the label of %s', (line, label) => {
    const ast = parse(['Alice -> Bob : a', line]);
    const ev = ast.events[1] as NewpageEvent;
    expect(ev.kind).toBe('newpage');
    expect(ev.label).toBe(label);
  });

  it('carries no label when none was written', () => {
    const ast = parse(['Alice -> Bob : a', 'newpage']);
    expect((ast.events[1] as NewpageEvent).label).toBeUndefined();
  });

  /** The LABEL group is `(.*[%pLN_.].*)`, so a label with no letter, digit,
   *  underscore or dot cannot match; the `RegexOptional` then declines and
   *  `RegexLeaf.end()` fails on the leftovers, so the whole line is not a
   *  `newpage` at all. */
  it('does not match `newpage :` (an empty label)', () => {
    const refusal = parseSequence(['Alice -> Bob : a', 'newpage :']);
    expect('refused' in refusal).toBe(true);
  });

  /** `SequenceDiagram#newpage` returns before adding anything once
   *  `ignoreNewpage` is set (`:243-245`), and only for LATER commands. */
  it('drops every newpage after `ignorenewpage`, and only those after it', () => {
    const ast = parse([
      'Alice -> Bob : a',
      'newpage',
      'ignorenewpage',
      'newpage',
      'newpage Titled',
      'Alice -> Bob : b',
    ]);
    expect(ast.events.map((e) => e.kind)).toEqual(['message', 'newpage', 'message']);
  });
});

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

describe('newpage — layout', () => {
  it('lays a tile of NewpageTile#getPreferredHeight (21)', () => {
    const geo = layout(['Alice -> Bob : a', 'newpage', 'Alice -> Bob : b']);
    const tiles = newpageGeos(geo);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]!.height).toBe(NEWPAGE_TILE_HEIGHT);
    expect(NEWPAGE_TILE_HEIGHT).toBe(21);
  });

  it('pushes everything after it down by exactly the tile height', () => {
    const without = layout(['Alice -> Bob : a', 'Alice -> Bob : b']);
    const with_ = layout(['Alice -> Bob : a', 'newpage', 'Alice -> Bob : b']);
    const yOf = (g: SequenceGeometry, i: number) =>
      g.events.filter((e) => e.kind === 'message')[i]!.y;
    expect(yOf(with_, 0)).toBe(yOf(without, 0));
    expect(yOf(with_, 1)).toBe(yOf(without, 1) + NEWPAGE_TILE_HEIGHT);
    expect(with_.totalHeight).toBe(without.totalHeight + NEWPAGE_TILE_HEIGHT);
  });

  it('starts the tile at the running cursor, so its y is the split position', () => {
    const geo = layout(['Alice -> Bob : a', 'newpage', 'Alice -> Bob : b']);
    const [tile] = newpageGeos(geo);
    const messages = geo.events.filter((e) => e.kind === 'message');
    expect(tile!.y).toBeGreaterThan(messages[0]!.y);
    expect(tile!.y).toBeLessThan(messages[1]!.y);
  });

  /** `PlayingSpace#getNewpageTiles` recurses into `GroupingTile`
   *  (`:326-336`), so a `newpage` inside a `group` is a page split too. */
  it('collects a newpage nested inside a group, in y order', () => {
    const geo = layout([
      'Alice -> Bob : a',
      'newpage',
      'group inner',
      'Alice -> Bob : b',
      'newpage',
      'Alice -> Bob : c',
      'end',
      'newpage',
      'Alice -> Bob : d',
    ]);
    const ys = newpageGeos(geo).map((t) => t.y);
    expect(ys).toHaveLength(3);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  /** The separator spans `[border1, border2]`, the same band a divider's
   *  does -- `NewpageTile#drawU:83-90` builds its `Area` the same way
   *  `DividerTile#drawU` does. */
  it('back-fills the separator band to the same span a divider gets', () => {
    const geo = layout(['Alice -> Bob : a', 'newpage', '== d ==']);
    const [tile] = newpageGeos(geo);
    const divider = geo.events.find((e) => e.kind === 'divider')!;
    expect(tile!.bandX).toBe(divider.bandX);
    expect(tile!.bandWidth).toBe(divider.bandWidth);
    expect(tile!.bandWidth).toBeGreaterThan(0);
  });

  /** `headHeight` is `LivingSpaces#getHeadHeight`: the participant row's
   *  height, which is where this port's body begins. */
  it('reports headHeight as the participant head row height', () => {
    const geo = layout(['Alice -> Bob : a']);
    expect(geo.headHeight).toBe(Math.max(...geo.participants.map((p) => p.y + p.height)));
    expect(geo.headHeight).toBeGreaterThan(0);
  });
});
