import { describe, expect, it } from 'vitest';
import { walkWithNotes } from '../../../../src/diagrams/activity/layout/walk-with-notes.js';
import type { Out } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import { GtileWithNotes } from '../../../../src/diagrams/activity/tiles/gtile-with-notes.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

// T3j (row jogami-42-jaji869, GROUPNOTE riser): `walkWithNotes` must emit a
// compression reservation for each stacked note's OUTER (margin-inclusive)
// box, mirroring `TextBlockMarged#drawU`'s own `ug.draw(UEmpty.create(dim))`
// (`klimt/shape/TextBlockMarged.java:74-81`) -- see `walk-with-notes.ts
// #marginBoxReservation`'s own doc for the full mechanism. Bounder/theme
// convention matches `gtile-with-notes.test.ts` (7px/char, 14px line height).
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

function makeOut(): Out {
  let n = 0;
  return {
    nodes: [],
    edges: [],
    edgeMeta: [],
    reservations: [],
    theme: resolveTheme('default'),
    nextId: (p: string) => `${p}${n++}`,
  };
}

describe('walkWithNotes — one LEFT note: margin-box reservation + note position', () => {
  // Outer (marged) box: 1 char * 7 + 21 (Opale margins) + 20 (NOTE_STACK_
  // MARGIN) = 48 wide; 14 + 10 + 20 = 44 tall (same fixture as
  // `gtile-with-notes.test.ts`'s own "one note, LEFT only" describe block).
  const tile = stubTile(100, 50);
  const t = new GtileWithNotes(tile, [{ text: 'n', position: 'left' }], bounder, theme);
  const out = makeOut();
  walkWithNotes(t, 0, 0, undefined, out);

  it('emits exactly one reservation, spanning the note stack outer box', () => {
    expect(out.reservations.length).toBe(1);
    expect(out.reservations[0]).toEqual({ x: 0, y: t.leftOffsetY, width: 48, height: 44 });
  });

  it('the reservation carries no ignoreX/ignoreY flag (a plain UEmpty, never ignorable)', () => {
    expect(out.reservations[0]!.ignoreX).toBeUndefined();
    expect(out.reservations[0]!.ignoreY).toBeUndefined();
  });

  it("the note node's own box sits inset by NOTE_STACK_MARGIN (10) from the reservation's origin", () => {
    const note = out.nodes.find((node) => node.kind === 'note')!;
    expect(note.x).toBe(10);
    expect(note.y).toBe(t.leftOffsetY + 10);
  });
});

describe('walkWithNotes — two stacked RIGHT notes: one reservation per entry', () => {
  // 'ab'(2 chars): opale 14+21=35, outer 35+20=55 x 44. 'c'(1 char): opale
  // 7+21=28, outer 28+20=48 x 44. Stack width = max(55,48) = 55; stacked
  // flush top-to-bottom (gtile-with-notes.ts#buildStack), so the second
  // entry's own y = first entry's outerHeight.
  const tile = stubTile(100, 30);
  const t = new GtileWithNotes(
    tile,
    [
      { text: 'ab', position: 'right' },
      { text: 'c', position: 'right' },
    ],
    bounder,
    theme,
  );
  const out = makeOut();
  walkWithNotes(t, 5, 0, undefined, out);

  it('emits one reservation per stacked note, each centred within the stack width', () => {
    expect(out.reservations.length).toBe(2);
    // First entry (outer 55 wide) is already the stack's own max width --
    // no centring offset.
    expect(out.reservations[0]).toEqual({ x: 5 + t.rightOffsetX, y: t.rightOffsetY, width: 55, height: 44 });
    // Second entry (outer 48 wide) is centred within the 55-wide stack:
    // (55-48)/2 = 3.5 offset; flush below the first (y += 44).
    expect(out.reservations[1]).toEqual({
      x: 5 + t.rightOffsetX + 3.5,
      y: t.rightOffsetY + 44,
      width: 48,
      height: 44,
    });
  });

  it('each note node sits inset by NOTE_STACK_MARGIN from its own reservation', () => {
    const notes = out.nodes.filter((node) => node.kind === 'note');
    expect(notes.length).toBe(2);
    expect(notes[0]!.x).toBe(out.reservations[0]!.x + 10);
    expect(notes[1]!.x).toBe(out.reservations[1]!.x + 10);
  });
});

// add4-T1c: `FtileWithNotes.java:106-111` -- each stacked note's own
// `#color` overrides its Opale's `BackGroundColor`; an uncoloured sibling
// keeps the theme default (no `color` on its node).
describe('walkWithNotes — per-note colour reaches each stacked note node', () => {
  const tile = stubTile(40, 20);
  const t = new GtileWithNotes(
    tile,
    [
      { text: 'a', position: 'left', color: '#red' },
      { text: 'b', position: 'left' },
    ],
    bounder,
    theme,
  );
  const out = makeOut();
  walkWithNotes(t, 0, 0, undefined, out);

  it('first note carries "#red", second carries no colour', () => {
    const notes = out.nodes.filter((node) => node.kind === 'note');
    expect(notes.map((n) => n.label)).toEqual(['a', 'b']);
    expect(notes[0]!.color).toBe('#red');
    expect('color' in notes[1]!).toBe(false);
    expect(t.left!.notes.map((n) => n.color)).toEqual(['#red', undefined]);
  });
});
