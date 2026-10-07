/**
 * add4-T1c: `note #color` -- `CommandNote3`/`CommandNoteLong3`'s
 * `ColorParser.simpleColor(ColorType.BACK)` group, applied as the Opale's
 * `BackGroundColor` via `Style#eventuallyOverride(note.getColors())`
 * (`FtileWithNoteOpale.java:137-139`, `FtileWithNotes.java:109-111`). A
 * note with NO previous ftile becomes `FtileNoteAlone`, whose style is
 * never overridden (`FtileNoteAlone.java:104-106`): the colour is parsed
 * but not drawn there.
 *
 * Each fixture's `in.svg` was rendered through `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { ActivityDiagramAST, ActivityNote } from '../../../src/diagrams/activity/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { parseAst } from '../../helpers/parse-ast.js';
import { renderActivityFixture } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T1c');

function parse(lines: readonly string[]): ActivityDiagramAST {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block);
}

function firstNote(lines: readonly string[]): ActivityNote {
  const note = parse(lines).nodes.find((n) => n.kind === 'note');
  if (note === undefined) throw new Error('expected a note node');
  return note;
}

/** Every `<path ... fill="...">` value, document order (the note body and
 *  its fold are the only `<path>`s these fixtures draw). */
function pathFills(svg: string): string[] {
  return [...svg.matchAll(/<path\b[^>]*?\sfill="([^"]*)"/g)].map((m) => m[1]!);
}

describe('note colour -- parse (CommandNote3/CommandNoteLong3 COLOR group)', () => {
  it('single-line `note right #lightblue: text` carries color "#lightblue" and the text', () => {
    const note = firstNote(['note right #lightblue: coloured']);
    expect(note.color).toBe('#lightblue');
    expect(note.text).toBe('coloured');
    expect(note.position).toBe('right');
  });

  it('multi-line `note left #FF8800` carries color "#FF8800"', () => {
    const note = firstNote(['note left #FF8800', 'a', 'end note']);
    expect(note.color).toBe('#FF8800');
    expect(note.text).toBe('a');
  });

  it('a gradient `#red-blue` is kept whole (COLOR_REGEXP includes the separator)', () => {
    expect(firstNote(['note right #red-blue: g']).color).toBe('#red-blue');
  });

  it('a note with no colour omits the field', () => {
    expect('color' in firstNote(['note right: plain'])).toBe(false);
  });
});

describe('note colour -- rendered fill matches the jar', () => {
  it.each(['note-opale-color', 'note-multi-color', 'note-group-color', 'note-gradient-color'])(
    '%s: every note path fill equals the jar',
    (name) => {
      const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
      const jar = pathFills(golden).filter((f) => f !== 'none');
      const mine = pathFills(ours).filter((f) => f !== 'none');
      expect(mine.map((f) => f.replace(/url\(#g\w+\)/, 'url(#g)'))).toEqual(
        jar.map((f) => f.replace(/url\(#g\w+\)/, 'url(#g)')),
      );
    },
  );

  it('note-gradient-color: the gradient stops equal the jar', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'note-gradient-color');
    const stops = (svg: string): string[] => [...svg.matchAll(/stop-color="([^"]*)"/g)].map((m) => m[1]!);
    expect(stops(ours)).toEqual(stops(golden));
    expect(stops(golden)).toEqual(['#F00', '#00F']);
  });

  it('note-alone-color: FtileNoteAlone ignores the colour (default note fill, as the jar)', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'note-alone-color');
    expect(pathFills(ours)).toEqual(pathFills(golden));
    expect(pathFills(golden)).toEqual(['#FEFFDD', '#FEFFDD']);
  });
});
