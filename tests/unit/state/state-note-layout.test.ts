/**
 * Unit tests for `state-note-layout.ts`'s pure grouping/rotation logic
 * (mission A4 Phase L iter 9) — the two branches
 * `state-note-attached-dot.test.ts`'s fixture-driven tests don't exercise
 * (no fixture in this corpus's note set uses `left to right direction` or
 * genuine same-side/same-host merging):
 *   - `Position.withRankdir` LR rotation (utils/Position.java:49-66).
 *   - same-scope/same-host/same-side EXPLICIT-target notes merge into ONE
 *     DOT node (mirrors class engine's `NoteGroup` — see note-layout.ts's
 *     doc for the class precedent, zepeki-75-pifo352).
 */
import { describe, it, expect } from 'vitest';
import type { StateNote } from '../../../src/diagrams/state/ast.js';
import {
  buildNoteGraphPartsByScope,
  sweepOrphanNoteEdges,
  measureNote,
} from '../../../src/diagrams/state/state-note-layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { parseState } from '../../../src/diagrams/state/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const measurer = new WidthTableMeasurer();

function parse(source: string): ReturnType<typeof parseState> {
  const block: UmlSource = { lines: source.trim().split('\n'), type: 'state' };
  return parseState(block);
}

function note(overrides: Partial<StateNote> & Pick<StateNote, 'id' | 'text' | 'scopeId'>): StateNote {
  return overrides;
}

describe('buildNoteGraphPartsByScope — LR rotation', () => {
  it('rotates right->bottom under left to right direction (minlen stays 1, not 0)', () => {
    const notes: StateNote[] = [
      note({ id: '__note_0', target: 'X', position: 'right', text: 'hi', scopeId: '' }),
    ];
    const parts = buildNoteGraphPartsByScope(notes, defaultTheme, measurer, 'LR').get('')!;
    expect(parts.candidates).toHaveLength(1);
    // right -> bottom under LR: fromNote=false, minLen=1 (bottom's row, not right's).
    expect(parts.candidates[0]).toMatchObject({ fromNote: false, minLen: 1 });
  });

  it('rotates left->top under left to right direction (fromNote stays true, minlen becomes 1)', () => {
    const notes: StateNote[] = [
      note({ id: '__note_0', target: 'X', position: 'left', text: 'hi', scopeId: '' }),
    ];
    const parts = buildNoteGraphPartsByScope(notes, defaultTheme, measurer, 'LR').get('')!;
    expect(parts.candidates[0]).toMatchObject({ fromNote: true, minLen: 1 });
  });

  it('TB (default) leaves right/left minlen at 0 — no rotation', () => {
    const notes: StateNote[] = [
      note({ id: '__note_0', target: 'X', position: 'right', text: 'hi', scopeId: '' }),
    ];
    const parts = buildNoteGraphPartsByScope(notes, defaultTheme, measurer, 'TB').get('')!;
    expect(parts.candidates[0]).toMatchObject({ fromNote: false, minLen: 0 });
  });
});

describe('buildNoteGraphPartsByScope — same-scope/same-host/same-side merging', () => {
  it('two explicit-target notes on the same side of the same host merge into ONE node', () => {
    const notes: StateNote[] = [
      note({ id: '__note_0', target: 'X', position: 'right', text: 'first', scopeId: '' }),
      note({ id: '__note_1', target: 'X', position: 'right', text: 'second', scopeId: '' }),
    ];
    const parts = buildNoteGraphPartsByScope(notes, defaultTheme, measurer, 'TB').get('')!;
    expect(parts.nodes).toHaveLength(1);
    expect(parts.candidates).toHaveLength(1);
    expect(parts.nodes[0]!.id).toBe('__note_0');
  });

  it('an implicit-target note never merges, even onto the same (host, side)', () => {
    const notes: StateNote[] = [
      note({ id: '__note_0', target: 'X', position: 'right', text: 'explicit', scopeId: '' }),
      note({
        id: '__note_1',
        target: 'X',
        position: 'right',
        implicitTarget: true,
        text: 'implicit',
        scopeId: '',
      }),
    ];
    const parts = buildNoteGraphPartsByScope(notes, defaultTheme, measurer, 'TB').get('')!;
    expect(parts.nodes).toHaveLength(2);
    expect(parts.candidates).toHaveLength(2);
  });

  it('notes on the same host but different sides never merge', () => {
    const notes: StateNote[] = [
      note({ id: '__note_0', target: 'X', position: 'right', text: 'r', scopeId: '' }),
      note({ id: '__note_1', target: 'X', position: 'left', text: 'l', scopeId: '' }),
    ];
    const parts = buildNoteGraphPartsByScope(notes, defaultTheme, measurer, 'TB').get('')!;
    expect(parts.nodes).toHaveLength(2);
  });

  it('notes in different declaring scopes never merge, even matching host+side', () => {
    const notes: StateNote[] = [
      note({ id: '__note_0', target: 'X', position: 'right', text: 'outer', scopeId: '' }),
      note({ id: '__note_1', target: 'X', position: 'right', text: 'inner', scopeId: 'Composite' }),
    ];
    const byScope = buildNoteGraphPartsByScope(notes, defaultTheme, measurer, 'TB');
    expect(byScope.get('')!.nodes).toHaveLength(1);
    expect(byScope.get('Composite')!.nodes).toHaveLength(1);
  });
});

describe('sweepOrphanNoteEdges — opportunistic per-pass attach', () => {
  it('drops a candidate whose host resolves to a node absent from EVERY pass', () => {
    const notes: StateNote[] = [
      note({ id: '__note_0', target: 'GhostHost', position: 'right', text: 'x', scopeId: '' }),
    ];
    const parts = buildNoteGraphPartsByScope(notes, defaultTheme, measurer, 'TB').get('')!;
    const acc = { nodes: [{ id: '__note_0' }], edges: [] as { id: string; from: string; to: string }[] };
    const consumed = new Set<(typeof parts.candidates)[number]>();
    sweepOrphanNoteEdges(acc, parts.candidates, consumed, (id) => id);
    expect(acc.edges).toHaveLength(0);
    expect(consumed.size).toBe(0);
  });

  it('a candidate already consumed at an earlier pass is skipped on a later sweep', () => {
    const notes: StateNote[] = [
      note({ id: '__note_0', target: 'X', position: 'right', text: 'x', scopeId: '' }),
    ];
    const parts = buildNoteGraphPartsByScope(notes, defaultTheme, measurer, 'TB').get('')!;
    const acc = { nodes: [{ id: '__note_0' }, { id: 'X' }], edges: [] as { id: string; from: string; to: string }[] };
    const consumed = new Set<(typeof parts.candidates)[number]>();
    sweepOrphanNoteEdges(acc, parts.candidates, consumed, (id) => id);
    expect(acc.edges).toHaveLength(1);
    // Second sweep (mirrors a later pass sharing the same ctx.consumedNotes)
    // must not add a duplicate edge — the candidate is already consumed.
    sweepOrphanNoteEdges(acc, parts.candidates, consumed, (id) => id);
    expect(acc.edges).toHaveLength(1);
  });
});

/**
 * T7 (SI28 `findings/note.md`, `state-declared-size-fix`): `measureNote`
 * routed through the real creole/table pipeline (`buildNoteBody`), replacing
 * a raw `text.split('\n')` model that measured `|=…|` table syntax and
 * `<color:…>` tags as literal text. Real `in.puml` bodies (not hand-typed
 * approximations), pinned against the jar's own DOT-declared node size
 * (`oracle/goldens/state/<slug>/svek-1.dot`), matching this test file's own
 * `parseState`-direct convention (`state-decl-grammar.test.ts` precedent).
 */
describe('measureNote — creole/table body sizing (T7, SI28 findings/note.md)', () => {
  it('fatupo-62-bemu777: table body sizes via AtomTable\'s column/row-max grid, not raw pipe syntax', () => {
    const ast = parse(`
state X
note right of X #FFF
|= header 1 |= header 2 |= header 3 |
| //A// | abc | def |
| //B// | qwe | |
end note
`);
    const note = ast.notes![0]!;
    const m = measureNote(note.text, defaultTheme, measurer);
    // oracle/goldens/state/fatupo-62-bemu777/svek-1.dot sh0007: width=2.278906in, height=0.736111in (*72 = px).
    expect(m.width).toBeCloseTo(2.278906 * 72, 3);
    expect(m.height).toBeCloseTo(0.736111 * 72, 3);
    // Render side: no raw pipe/header markup leaks into the drawn lines (was
    // "|= header 1 |= header 2 |= header 3 |" verbatim before this task).
    for (const line of m.lines) expect(line.text).not.toMatch(/[|=]/);
    expect(m.lines[0]!.text).toContain('header 1');
    expect(m.lines[1]!.text).toContain('abc');
  });

  it('xeziki-47-zomo866#a: <color:...> tags strip to visible text for both sizing and drawing', () => {
    const ast = parse(`
note as n
  <color:#FF000020>12⬤</color>
  <color:#FF000080>13⬤</color>
  <color:#FF0000FF>14⬤</color>
end note
`);
    const note = ast.notes!.find((n) => n.id === 'n')!;
    const m = measureNote(note.text, defaultTheme, measurer);
    // oracle/goldens/state/xeziki-47-zomo866/svek-1.dot sh0006: width=0.641493in, height=0.680556in (*72 = px).
    expect(m.width).toBeCloseTo(0.641493 * 72, 3);
    expect(m.height).toBeCloseTo(0.680556 * 72, 3);
    // Render side: literal "<color:#FF000020>12⬤</color>" no longer leaks —
    // only the visible glyphs remain.
    expect(m.lines.map((l) => l.text)).toEqual(['12⬤', '13⬤', '14⬤']);
  });

  it('a markup-free note is unaffected by the pipeline swap (NO-OP for plain text)', () => {
    const ast = parse(`
note as n2
plain line one
plain line two
end note
`);
    const note = ast.notes!.find((n) => n.id === 'n2')!;
    const m = measureNote(note.text, defaultTheme, measurer);
    const rawWidth = Math.max(
      measurer.measure('plain line one', { family: defaultTheme.fontFamily, size: 13 }).width,
      measurer.measure('plain line two', { family: defaultTheme.fontFamily, size: 13 }).width,
    );
    expect(m.width).toBeCloseTo(rawWidth + 6 + 15, 3);
    expect(m.height).toBeCloseTo(2 * 13 + 2 * 5, 3);
    expect(m.lines.map((l) => l.text)).toEqual(['plain line one', 'plain line two']);
  });
});

