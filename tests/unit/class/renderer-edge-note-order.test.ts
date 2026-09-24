/**
 * cdd2-T19c (mechanism 4): `renderEdge`'s note-on-link vs. label draw
 * ORDER. `SvekEdge.java:318-325`'s `mergeLR`/`mergeTB` operand order draws
 * the note FIRST for `Position.LEFT`/`TOP` (`mergeLR(noteOnly, labelOnly)`/
 * `mergeTB(noteOnly, labelOnly)`) and the label first otherwise. Verified
 * against the actual child ORDER `renderEdge` emits (not just presence),
 * since a note/label position swap is invisible to a "contains" assertion.
 */
import { describe, it, expect } from 'vitest';
import { renderEdge } from '../../../src/diagrams/class/renderer-edge.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';

const theme = scaleClassTheme(defaultTheme, 1);
const ctx = { ids: new Set<string>(), syntheticNames: new Map<string, string>() };

function makeEdgeGeo(overrides?: Partial<EdgeGeo>): EdgeGeo {
  return {
    id: 'edge-0',
    points: [
      { x: 70, y: 70 },
      { x: 70, y: 140 },
    ],
    targetDecor: 'none',
    sourceDecor: 'none',
    dashed: false,
    from: 'A',
    to: 'B',
    label: { text: 'foo', x: 50, y: 96, width: 18 },
    noteBox: {
      x: 10,
      y: 90,
      width: 100,
      height: 30,
      inkBox: { x: 15, y: 95, width: 90, height: 20 },
      noteLines: [{ text: 'hi', width: 12 }],
      position: 'bottom',
    },
    ...overrides,
  };
}

/** The order two markers first appear in `body` -- `-1` if either is absent. */
function orderOf(body: string, a: string, b: string): 'a-first' | 'b-first' {
  return body.indexOf(a) < body.indexOf(b) ? 'a-first' : 'b-first';
}

describe('renderEdge — note-on-link draw order follows Position (cdd2-T19c)', () => {
  it('LEFT: the note body draws BEFORE the label text', () => {
    const geo = makeEdgeGeo({ noteBox: { ...makeEdgeGeo().noteBox!, position: 'left' } });
    const { body } = renderEdge(geo, theme, ctx);
    expect(orderOf(body, '>hi<', '>foo<')).toBe('a-first');
  });

  it('TOP: the note body draws BEFORE the label text', () => {
    const geo = makeEdgeGeo({ noteBox: { ...makeEdgeGeo().noteBox!, position: 'top' } });
    const { body } = renderEdge(geo, theme, ctx);
    expect(orderOf(body, '>hi<', '>foo<')).toBe('a-first');
  });

  it('RIGHT: the label text draws BEFORE the note body', () => {
    const geo = makeEdgeGeo({ noteBox: { ...makeEdgeGeo().noteBox!, position: 'right' } });
    const { body } = renderEdge(geo, theme, ctx);
    expect(orderOf(body, '>foo<', '>hi<')).toBe('a-first');
  });

  it('BOTTOM (default): the label text draws BEFORE the note body — lipazi-06-care921\'s first note', () => {
    const geo = makeEdgeGeo({ noteBox: { ...makeEdgeGeo().noteBox!, position: 'bottom' } });
    const { body } = renderEdge(geo, theme, ctx);
    expect(orderOf(body, '>foo<', '>hi<')).toBe('a-first');
  });

  it('no note at all: draws the label with no note markup and no ordering crash', () => {
    const geo = makeEdgeGeo({ noteBox: undefined });
    const { body } = renderEdge(geo, theme, ctx);
    expect(body).toContain('>foo<');
    expect(body).not.toContain('>hi<');
  });
});
