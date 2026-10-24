/**
 * sdd3 T1d: a group header's LAYOUT height carries the `[comment]` block's
 * supplement, its drawn corner does not.
 *
 * `ComponentRoseGroupingHeader#getPreferredHeight` is `getTextHeight +
 * 2 * getPaddingY + getSuppHeightForComment` (`ComponentRoseGroupingHeader
 * .java:121-122`) and `getSuppHeightForComment` is `commentHeight - 15` when
 * the block is taller than 15, else 0 (`:95-105`). `GroupingTile` advances by
 * that height (`GroupingTile.java:157,349-352`); the corner is drawn at
 * `getTextHeight` alone (`ComponentRoseGroupingHeader.java:138-142`).
 *
 * Jar numbers: `zedepi-36-come743`'s `in.svg`, a 3-line comment on `opt`.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { FrameGeo, MessageGeo } from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

/** Fixture `zedepi-36-come743`: the comment is three lines at 11 px. */
const ZEDEPI_JAR_FRAME_HEIGHT = 70;
const ZEDEPI_JAR_NO_SUPP_HEIGHT = 52;
const ZEDEPI_JAR_SUPP = ZEDEPI_JAR_FRAME_HEIGHT - ZEDEPI_JAR_NO_SUPP_HEIGHT;
/** `ComponentRoseGroupingHeader.java:95-105`. */
const FREE_HEIGHT = 15;

function frameOf(optLine: string): { frame: FrameGeo; after: MessageGeo } {
  const lines = ['Alice -> Bob: one', optLine, 'Bob -> Alice: two', 'end', 'Alice -> Bob: after'];
  const parsed = parseSequence(sequenceSource(lines));
  if ('refused' in parsed) throw new Error(parsed.message);
  const geo = layoutSequence(parsed, defaultTheme, new DeterministicMeasurer());
  const frame = geo.events.find((e): e is FrameGeo => e.kind === 'frame')!;
  const messages = geo.events.filter((e): e is MessageGeo => e.kind === 'message');
  return { frame, after: messages[messages.length - 1]! };
}

describe('group header comment supplement', () => {
  const bare = frameOf('opt');
  const one = frameOf('opt [x]');
  const three = frameOf(String.raw`opt this a very long line \n that I would like to break\ninto several lines`);

  it('adds commentHeight - 15 to the frame height and the next tile (jar 70 vs 52)', () => {
    // `getSuppHeightForComment:95-105` -> `getPreferredHeight:121-122`.
    expect(three.frame.height - bare.frame.height).toBe(ZEDEPI_JAR_SUPP);
    expect(three.frame.height).toBe(bare.frame.height + 3 * 11 - FREE_HEIGHT);
    expect(three.after.y - bare.after.y).toBe(ZEDEPI_JAR_SUPP);
  });

  it('leaves the drawn corner at getTextHeight (:138-142)', () => {
    expect(three.frame.tabHeight).toBe(bare.frame.tabHeight);
    expect(three.frame.tabHeight).toBe(one.frame.tabHeight);
  });

  it('moves nothing for a one-line comment (height <= 15, :100-102)', () => {
    expect(one.frame.height).toBe(bare.frame.height);
    expect(one.after.y).toBe(bare.after.y);
  });
});
