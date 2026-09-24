/**
 * Unit tests for `class-scale-geo-edge.ts` (cdd-T29, D4) — `EdgeGeo`
 * scaling, covering every optional label/box variant `class-scale-geo.
 * test.ts`'s fixture-adjacent tests don't reach (kept to this project's
 * 90/90/90 coverage floor).
 */
import { describe, it, expect } from 'vitest';
import { scaleEdgeGeo } from '../../../src/diagrams/class/class-scale-geo-edge.js';
import type { EdgeGeo } from '../../../src/diagrams/class/class-geo-types.js';

function makeEdge(overrides?: Partial<EdgeGeo>): EdgeGeo {
  return {
    id: 'e1',
    points: [{ x: 0, y: 0 }],
    targetDecor: 'triangle',
    sourceDecor: 'none',
    dashed: false,
    from: 'a',
    to: 'b',
    ...overrides,
  };
}

describe('scaleEdgeGeo — label variants', () => {
  it('scales labelLines including a magic-arrow glyph', () => {
    const edge = makeEdge({
      labelLines: [
        {
          text: 'l1',
          x: 1,
          y: 2,
          width: 10,
          glyph: {
            points: [
              { x: 1, y: 1 },
              { x: 2, y: 2 },
            ],
          },
        },
      ],
    });
    const scaled = scaleEdgeGeo(edge, 2);
    expect(scaled.labelLines).toEqual([
      {
        text: 'l1',
        x: 2,
        y: 4,
        width: 20,
        glyph: {
          points: [
            { x: 2, y: 2 },
            { x: 4, y: 4 },
          ],
        },
      },
    ]);
  });

  it('scales a labelLines entry with no glyph', () => {
    const edge = makeEdge({ labelLines: [{ text: 'l1', x: 1, y: 2, width: 10 }] });
    const scaled = scaleEdgeGeo(edge, 2);
    expect(scaled.labelLines).toEqual([{ text: 'l1', x: 2, y: 4, width: 20 }]);
  });

  it('scales a standalone arrowGlyph', () => {
    const edge = makeEdge({ arrowGlyph: { points: [{ x: 1, y: 1 }] } });
    const scaled = scaleEdgeGeo(edge, 3);
    expect(scaled.arrowGlyph).toEqual({ points: [{ x: 3, y: 3 }] });
  });

  it('scales tailLabel and headLabel', () => {
    const edge = makeEdge({
      tailLabel: { text: '1', x: 1, y: 2, width: 3 },
      headLabel: { text: '*', x: 4, y: 5, width: 6 },
    });
    const scaled = scaleEdgeGeo(edge, 2);
    expect(scaled.tailLabel).toEqual({ text: '1', x: 2, y: 4, width: 6 });
    expect(scaled.headLabel).toEqual({ text: '*', x: 8, y: 10, width: 12 });
  });

  it('scales quantifierLines (both tail and head arrays)', () => {
    const edge = makeEdge({
      quantifierLines: [[{ text: '1', x: 1, y: 2, width: 3 }], [{ text: '*', x: 4, y: 5, width: 6 }]],
    });
    const scaled = scaleEdgeGeo(edge, 2);
    expect(scaled.quantifierLines).toEqual([
      [{ text: '1', x: 2, y: 4, width: 6 }],
      [{ text: '*', x: 8, y: 10, width: 12 }],
    ]);
  });

  it('scales roleLines (both tail and head arrays)', () => {
    const edge = makeEdge({
      roleLines: [[{ text: 'owner', x: 1, y: 2, width: 3 }], []],
    });
    const scaled = scaleEdgeGeo(edge, 2);
    expect(scaled.roleLines).toEqual([[{ text: 'owner', x: 2, y: 4, width: 6 }], []]);
  });

  it('scales visibilityIcon x/y', () => {
    const edge = makeEdge({ visibilityIcon: { x: 1, y: 2, modifier: '+' } });
    const scaled = scaleEdgeGeo(edge, 2);
    expect(scaled.visibilityIcon).toEqual({ x: 2, y: 4, modifier: '+' });
  });
});

describe('scaleEdgeGeo — box/decoration variants', () => {
  it('scales a noteBox including its inkBox and noteLines', () => {
    const edge = makeEdge({
      noteBox: {
        x: 1,
        y: 2,
        width: 10,
        height: 5,
        inkBox: { x: 2, y: 3, width: 8, height: 3 },
        noteLines: [{ text: 'hi', width: 6 }],
      },
    });
    const scaled = scaleEdgeGeo(edge, 2);
    expect(scaled.noteBox).toEqual({
      x: 2,
      y: 4,
      width: 20,
      height: 10,
      inkBox: { x: 4, y: 6, width: 16, height: 6 },
      noteLines: [{ text: 'hi', width: 12 }],
    });
  });

  it('scales a constraint line', () => {
    const edge = makeEdge({ constraint: { line: { x1: 1, y1: 2, x2: 3, y2: 4 }, text: 'req' } });
    const scaled = scaleEdgeGeo(edge, 2);
    expect(scaled.constraint).toEqual({ line: { x1: 2, y1: 4, x2: 6, y2: 8 }, text: 'req' });
  });

  it('scales a kalBox with only an end box', () => {
    const edge = makeEdge({
      kalBox: { end: { x: 1, y: 2, width: 10, height: 8, text: '*', textX: 3, textY: 9, textWidth: 6 } },
    });
    const scaled = scaleEdgeGeo(edge, 2);
    expect(scaled.kalBox).toEqual({
      end: { x: 2, y: 4, width: 20, height: 16, text: '*', textX: 6, textY: 18, textWidth: 12 },
    });
  });

  it('scales sametail and leafContacts', () => {
    const edge = makeEdge({
      sametail: { parentId: 'p1', contact: { x: 1, y: 2 } },
      leafContacts: [{ parentId: 'p1', contact: { x: 3, y: 4 } }],
    });
    const scaled = scaleEdgeGeo(edge, 2);
    expect(scaled.sametail).toEqual({ parentId: 'p1', contact: { x: 2, y: 4 } });
    expect(scaled.leafContacts).toEqual([{ parentId: 'p1', contact: { x: 6, y: 8 } }]);
  });
});
