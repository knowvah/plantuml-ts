import { describe, it, expect } from 'vitest';
import {
  renderNoteConnectorPath,
  noteIsConnectorSource,
  noteGmnName,
  resolveNoteConnectorEndpoints,
  renderNoteConnectorLink,
} from '../../../src/diagrams/class/renderer-note-connector.js';
import type { NoteConnector } from '../../../src/diagrams/class/renderer-note-dispatch.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout.js';
import type { ClassUidPlan } from '../../../src/diagrams/class/renderer-uid.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';

const theme = scaleClassTheme(defaultTheme, 1);

// `fogexa-30-zupo141`: `skinparam style strictuml` + `note top of dummy`.
// Note ABOVE its host, connector routed from the note's own bottom edge
// down to the host's top edge -- jar-verified note-first (TOP) order.
const fogexaNote: NoteGeo = {
  id: '__note_0',
  kind: 'note',
  x: 6,
  y: 6,
  width: 132.913,
  height: 54,
  lines: ['line'],
  lineWidths: [10],
  connector: [
    { x: 72.46, y: 60.5 },
    { x: 72.46, y: 119.8 },
  ],
  target: 'dummy',
  creationIndex: 3,
  phantomSlot: true,
};

function fakeUidPlan(): ClassUidPlan {
  const classifierUid = new Map([['dummy', 'ent0001']]);
  return {
    classifierUid,
    namespaceUid: new Map(),
    noteUid: new Map([['__note_0', 'ent0003']]),
    edgeUid: [],
    noteConnectorUid: new Map([['__note_0', 'lnk4']]),
    resolveEntityUid: (id) => classifierUid.get(id) ?? id,
  };
}

describe('renderNoteConnectorPath (cdd-T9b, point 1)', () => {
  it('draws an ordinary dashed-edge style -- strokeWidth 1, "7,7", never the note box style', () => {
    const svg = renderNoteConnectorPath(fogexaNote, theme, 'GMN2-dummy');
    expect(svg).toContain('stroke-width="1"');
    expect(svg).toContain('stroke-dasharray="7,7"');
    expect(svg).toContain('id="GMN2-dummy"');
    expect(svg).not.toContain('stroke-width="0.5"');
    expect(svg).not.toContain('4 4');
  });

  it('returns undefined for a note with no connector geometry', () => {
    const noConnector: NoteGeo = { ...fogexaNote, connector: [] };
    expect(renderNoteConnectorPath(noConnector, theme, 'x-y')).toBeUndefined();
  });
});

describe('noteIsConnectorSource (cdd-T9b, point 3)', () => {
  it('note-first (TOP/LEFT): connector[0] touches the note box -> true', () => {
    expect(noteIsConnectorSource(fogexaNote)).toBe(true);
  });

  it('host-first (RIGHT/BOTTOM): connector[-1] touches the note box -> false', () => {
    const rightNote: NoteGeo = { ...fogexaNote, connector: [...fogexaNote.connector].reverse() };
    expect(noteIsConnectorSource(rightNote)).toBe(false);
  });
});

describe('noteGmnName (cdd-T9b, point 2)', () => {
  it('GMN value is creationIndex - 1 (the phantom GMN slot burned one tick before the note ctor)', () => {
    expect(noteGmnName(fogexaNote)).toBe('GMN2');
  });

  it('falls back to the note id when creationIndex is absent (hand-built test literal)', () => {
    const { creationIndex: _unused, ...rest } = fogexaNote;
    const noIndex: NoteGeo = rest;
    expect(noteGmnName(noIndex)).toBe('__note_0');
  });
});

describe('resolveNoteConnectorEndpoints (cdd-T9b, points 2/3)', () => {
  it('note-first order: entity1 is the note (GMN name), entity2 the bare host id', () => {
    const endpoints = resolveNoteConnectorEndpoints(fogexaNote);
    expect(endpoints).toEqual({ entity1Name: 'GMN2', entity2Name: 'dummy', noteIsEntity1: true });
  });

  it('host-first order: entity1 is the bare host id, entity2 the note (GMN name)', () => {
    const rightNote: NoteGeo = { ...fogexaNote, connector: [...fogexaNote.connector].reverse() };
    const endpoints = resolveNoteConnectorEndpoints(rightNote);
    expect(endpoints).toEqual({ entity1Name: 'dummy', entity2Name: 'GMN2', noteIsEntity1: false });
  });

  it('a namespace/package target uses its own bare id, never a zaent-* DOT anchor', () => {
    const packageNote: NoteGeo = { ...fogexaNote, target: 'oft_openflow_types', creationIndex: 4 };
    expect(resolveNoteConnectorEndpoints(packageNote).entity2Name).toBe('oft_openflow_types');
  });
});

describe('renderNoteConnectorLink (cdd-T9b, fogexa-30-zupo141 exact group shape)', () => {
  it('produces the jar-exact group: id lnk4, data-entity-1/2, path id GMN2-dummy, stroke-width:1, dasharray:7,7', () => {
    const connector: NoteConnector = { note: fogexaNote };
    const link = renderNoteConnectorLink(connector, theme, fakeUidPlan(), new Set<string>());
    expect(link).toContain('<g class="link"');
    expect(link).toContain('id="lnk4"');
    expect(link).toContain('data-entity-1="ent0003"');
    expect(link).toContain('data-entity-2="ent0001"');
    expect(link).toContain('id="GMN2-dummy"');
    expect(link).toContain('stroke-width="1"');
    expect(link).toContain('stroke-dasharray="7,7"');
    expect(link).toContain('<!--link GMN2 to dummy-->');
  });

  it('dedups the path id against the shared diagram-wide id collision set', () => {
    const connector: NoteConnector = { note: fogexaNote };
    const ids = new Set<string>(['GMN2-dummy']);
    const link = renderNoteConnectorLink(connector, theme, fakeUidPlan(), ids);
    expect(link).toContain('id="GMN2-dummy-1"');
  });
});
