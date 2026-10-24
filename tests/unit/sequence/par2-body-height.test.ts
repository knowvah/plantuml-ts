/**
 * sdd3 T1a2: a group's body height is `GroupingTile#computeBodyHeight`'s
 * cluster pass, so a `par2` `else`/`also` leaf -- parallel, because
 * `GroupingLeaf#isParallel` is `start.isPar2GroupStart()`
 * (`GroupingLeaf.java:100-104`) -- shares its extent with the tiles before it
 * instead of adding a row.
 *
 * `computeBodyHeight`/`flushPending` (`GroupingTile.java:1093-1149`): a
 * parallel tile joins the pending run, a `LifeEventTile` is held in it
 * without separating, any other tile flushes it; a run that held a parallel
 * tile counts `max(getContactPointRelative) + max(getZZZ)`, any other run the
 * sum of `getPreferredHeight`. `ElseTile#getContactPointRelative` is 0
 * (`ElseTile.java:70-72`); `getZZZ = getPreferredHeight - contact`
 * (`AbstractTile.java:62-66`).
 *
 * Jar numbers: `refiju-27-nupe082`'s `in.svg` -- a `par2` of three messages,
 * an empty `else` and one message: frame `<rect height="133">`, the `else`
 * rule at y=158 (tile top 157), the frame top at y=51.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { FrameGeo } from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { computeBodyHeight, type TileRecord } from '../../../src/diagrams/sequence/sequence-layout-frame.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const REFIJU_JAR_FRAME_HEIGHT = 133;
/** The rule is drawn one padding below the tile's top (`ComponentRoseGroupingElse.java:65-67`). */
const REFIJU_JAR_ELSE_TILE_Y = 157;
/** An empty `else`'s tile: `2 * 1 + 4` (`ComponentRoseGroupingElse.java:65-67,115-121`). */
const EMPTY_ELSE_HEIGHT = 6;

const message = (contactRelative: number, height: number, parallel = false): TileRecord => ({
  parallel,
  lifeEvent: false,
  contactRelative,
  height,
});
const elseTile = (parallel: boolean): TileRecord => ({
  parallel,
  lifeEvent: false,
  contactRelative: 0,
  height: EMPTY_ELSE_HEIGHT,
});
const lifeEvent = (height: number): TileRecord => ({ parallel: false, lifeEvent: true, contactRelative: 0, height });

describe('computeBodyHeight (GroupingTile.java:1093-1149)', () => {
  it('sums the preferred heights of a run with no parallel tile', () => {
    expect(computeBodyHeight([message(14, 30), elseTile(false), message(14, 30)])).toBe(30 + EMPTY_ELSE_HEIGHT + 30);
  });

  it('counts a parallel else once with the tile before it: contact + tallest after', () => {
    // contact = max(14, 0); after = max(30 - 14, 6 - 0) = 16.
    expect(computeBodyHeight([message(14, 30), elseTile(true)])).toBe(14 + 16);
  });

  it('lets a tall parallel tile dominate the after-contact extent', () => {
    expect(computeBodyHeight([message(14, 20), { ...elseTile(true), height: 40 }])).toBe(14 + 40);
  });

  it('holds a life event in the run it trails without separating it', () => {
    expect(computeBodyHeight([message(14, 30), lifeEvent(0), elseTile(true)])).toBe(14 + 16);
  });

  it('flushes the cluster at the next separator and starts a fresh run', () => {
    const tiles = [message(14, 30), elseTile(true), message(10, 25), elseTile(true), message(14, 30)];
    expect(computeBodyHeight(tiles)).toBe(14 + 16 + (10 + 15) + 30);
  });

  it('clusters a leading parallel tile on its own', () => {
    expect(computeBodyHeight([elseTile(true), message(14, 30)])).toBe(EMPTY_ELSE_HEIGHT + 30);
  });

  it('is zero for no tiles', () => {
    expect(computeBodyHeight([])).toBe(0);
  });
});

function layoutFrame(lines: readonly string[]): { frame: FrameGeo; elseY: number } {
  const parsed = parseSequence(sequenceSource(lines));
  if ('refused' in parsed) throw new Error(parsed.message);
  const geo = layoutSequence(parsed, defaultTheme, new DeterministicMeasurer());
  const frame = geo.events.find((e): e is FrameGeo => e.kind === 'frame')!;
  return { frame, elseY: frame.branchSeparators[0]!.y };
}

describe('par2 frame height', () => {
  const refiju = [
    'par2',
    'Axxx -> Axxx2 : message1 which is long',
    'Axxx -> Axxx2 : message1 which is long',
    'Axxx -> Axxx2 : message1 which is long',
    'else',
    'Bxxx -> Cxxx : message2',
    'end',
    'Cxxx -> Dxxx : message4',
  ];

  it('matches refiju-27-nupe082 in.svg: frame 133 high, else rule at 158', () => {
    const { frame, elseY } = layoutFrame(refiju);
    expect(frame.height).toBe(REFIJU_JAR_FRAME_HEIGHT);
    expect(elseY).toBe(REFIJU_JAR_ELSE_TILE_Y);
  });

  it('is one else-tile shorter than the same group as a plain `par`', () => {
    const plain = layoutFrame(refiju.map((l) => (l === 'par2' ? 'par' : l)));
    const par2 = layoutFrame(refiju);
    expect(plain.frame.height - par2.frame.height).toBe(EMPTY_ELSE_HEIGHT);
    expect(par2.elseY).toBe(plain.elseY);
  });
});

describe('a parallel first tile after an else chains on the else tile', () => {
  // `ElseTile.java:80`: `YGauge.create(currentY.getMax(), h)`; the next tile
  // sees `currentY = tile.getYGauge()` (`GroupingTile.java:178-182`), and a
  // parallel group starts at `currentY.getMin()` (`:154`) -- the else's top,
  // then `EXTERNAL_MARGINY` (4, `:89`) to its drawn border. `daduxi-21-duse542`
  // in.svg: the second `par2` frame at y=293, six (the else height) above
  // where a max-chained start would put it.
  it('starts a `par2` group at the else tile top, not its bottom', () => {
    const parsed = parseSequence(sequenceSource(['par', 'A -> B : one', 'also', 'par2', 'C -> D : two', 'end', 'end']));
    if ('refused' in parsed) throw new Error(parsed.message);
    const geo = layoutSequence(parsed, defaultTheme, new DeterministicMeasurer());
    const [outer, inner] = geo.events.filter((e): e is FrameGeo => e.kind === 'frame');
    const frameExternalMarginY = 4;
    expect(inner!.y).toBe(outer!.branchSeparators[0]!.y + frameExternalMarginY);
  });
});
