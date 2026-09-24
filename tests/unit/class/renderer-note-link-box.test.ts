/**
 * cdd2-T19c: `renderLinkNoteBox` — the `ComponentRoseNote`-shaped
 * note-on-link box render path (`renderer-note-link-box.ts`'s own doc
 * comment has the full jar derivation). Expected fill/stroke/stroke-width
 * values are read off `lipazi-06-care921`/`nuvake-96-gofe203`/
 * `lozego-15-coci435`'s jar oracle SVGs, never fitted.
 */
import { describe, it, expect } from 'vitest';
import { renderLinkNoteBox } from '../../../src/diagrams/class/renderer-note-link-box.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';

const theme = scaleClassTheme(defaultTheme, 1);

const baseNote: NoteGeo = {
  id: '__note_0',
  kind: 'note',
  x: 164.98,
  y: 105,
  width: 65,
  height: 23,
  lines: ['note red'],
  lineWidths: [44.037],
  connector: [],
};

describe('renderLinkNoteBox — colour (A5/M5, cdd2-T19c)', () => {
  it('lipazi-06-care921: #red -> both paths fill #F00, default stroke, stroke-width 0.5', () => {
    const { body, extraDefs } = renderLinkNoteBox(baseNote, { back: 'red' }, theme);
    expect((body.match(/fill="#F00"/g) ?? []).length).toBe(2);
    expect((body.match(/stroke="#181818"/g) ?? []).length).toBe(2);
    expect((body.match(/stroke-width="0.5"/g) ?? []).length).toBe(2);
    expect(extraDefs).toBe('');
  });

  it('nuvake-96-gofe203 note 1: back=red, line=blue -> fill #F00, stroke #00F on BOTH paths (no asymmetric fold)', () => {
    const { body } = renderLinkNoteBox(baseNote, { back: 'red', line: 'blue' }, theme);
    expect((body.match(/fill="#F00"/g) ?? []).length).toBe(2);
    expect((body.match(/stroke="#00F"/g) ?? []).length).toBe(2);
    expect((body.match(/stroke-width="0.5"/g) ?? []).length).toBe(2);
  });

  it('nuvake-96-gofe203 note 2: back=blue, line=yellow -> fill #00F, stroke #FF0', () => {
    const { body } = renderLinkNoteBox(baseNote, { back: 'blue', line: 'yellow' }, theme);
    expect((body.match(/fill="#00F"/g) ?? []).length).toBe(2);
    expect((body.match(/stroke="#FF0"/g) ?? []).length).toBe(2);
  });

  it('no colour spec -> the jar default note fill #FEFFDD and default border', () => {
    const { body } = renderLinkNoteBox(baseNote, {}, theme);
    expect((body.match(/fill="#FEFFDD"/g) ?? []).length).toBe(2);
    expect((body.match(/stroke="#181818"/g) ?? []).length).toBe(2);
  });

  it('lozego-15-coci435: a gradient BACK resolves to url(#id) plus a <linearGradient> def', () => {
    const { body, extraDefs } = renderLinkNoteBox(baseNote, { back: 'aqua/aliceblue' }, theme);
    expect((body.match(/fill="url\(#g[a-z0-9]+\)"/g) ?? []).length).toBe(2);
    expect(extraDefs).toContain('<linearGradient');
    // jar shortens a perfect 3-digit-representable stop to `#0FF`; this
    // port's `paint.ts#paintToSvg` does not yet -- see .agent-notes for the
    // filed follow-on (out of this task's write-set, `core/paint.ts`).
    expect(extraDefs).toContain('stop-color="#00FFFF"');
    expect(extraDefs).toContain('stop-color="#F0F8FF"');
  });

  it('draws the note text between the two shape paths and the returned <path> count', () => {
    const { body } = renderLinkNoteBox(baseNote, { back: 'red' }, theme);
    expect((body.match(/<path/g) ?? []).length).toBe(2);
    expect(body).toContain('note red');
  });
});
