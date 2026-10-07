/**
 * add4-T1f: `FtileWithNoteOpale#getTranslateForOpale` (`FtileWithNoteOpale
 * .java:177-193`) puts the note at `yForNote = 0` when TOP, else centred;
 * `getTranslate`'s `yForFtile` (`:155-167`) centres the tile whatever the
 * alignment. TOP is the switch's own note (`InstructionSwitch.java:125`).
 */
import { describe, expect, it } from 'vitest';

import { GtileNote, GtileNoteOpale } from '../../../../src/diagrams/activity/tiles/gtile-note.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { NOTE_OPALE_GAP } from '../../../../src/diagrams/activity/activity-layout-constants.js';

const bounder: StringBounder = { getDimension: (text: string) => ({ width: text.length * 7, height: 14 }) };
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

function stubTile(width: number, height: number): Tile {
  return {
    kind: 'stub',
    width,
    height,
    getCoord: (hook) =>
      hook === NORTH_HOOK || hook === SOUTH_HOOK
        ? { x: width / 2, y: hook === NORTH_HOOK ? 0 : height }
        : { x: 0, y: 0 },
    hasPointOut: () => true,
  };
}

const note = (position: 'left' | 'right'): GtileNote =>
  new GtileNote({ kind: 'note', text: 'n', position }, bounder, theme);

describe('GtileNoteOpale — vertical alignment', () => {
  it('TOP: note at y 0, spike at the note mid-height, tall tile at y 0', () => {
    const n = note('left');
    const t = new GtileNoteOpale(stubTile(100, 200), n, true, 'top');
    expect(t.noteOffsetY).toBe(0);
    expect(t.spikeOffsetY).toBe(n.height / 2);
    expect(t.tileOffsetY).toBe(0);
    expect(t.tileOffsetX).toBe(n.width + NOTE_OPALE_GAP);
  });

  it('TOP: a short tile under a taller note is still centred (yForFtile)', () => {
    const n = note('right');
    const t = new GtileNoteOpale(stubTile(100, 4), n, true, 'top');
    expect(t.noteOffsetY).toBe(0);
    expect(t.tileOffsetY).toBe((n.height - 4) / 2);
    expect(t.noteOffsetX).toBe(t.width - n.width);
  });

  it('CENTER (default): the note is centred beside a tall tile', () => {
    const n = note('left');
    const t = new GtileNoteOpale(stubTile(100, 200), n);
    expect(t.noteOffsetY).toBe((200 - n.height) / 2);
  });
});
