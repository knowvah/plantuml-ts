/**
 * Unit tests for `class-scale-geo.ts` (cdd-T29, D4) — the class engine's
 * `scale ...` layout->render pre-scaling. Mirrors the fixture-derived
 * before/after readings recorded in `.agent-notes/cdd-T29.md`.
 */
import { describe, it, expect } from 'vitest';
import { scaleClassGeometry } from '../../../src/diagrams/class/class-scale-geo.js';
import type { ClassGeometry, ClassifierGeo, EdgeGeo, NamespaceGeo } from '../../../src/diagrams/class/layout.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout.js';

const THEME_FONT_SIZE = 14;

function makeClassifier(overrides?: Partial<ClassifierGeo>): ClassifierGeo {
  return {
    id: 'c1',
    kind: 'class',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    dividerYs: [30],
    rows: [{ text: 'foo', y: 26.889, indent: 8 }],
    ...overrides,
  };
}

function makeEdge(overrides?: Partial<EdgeGeo>): EdgeGeo {
  return {
    id: 'e1',
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
    targetDecor: 'triangle',
    sourceDecor: 'none',
    dashed: false,
    from: 'a',
    to: 'b',
    ...overrides,
  };
}

function makeNamespace(overrides?: Partial<NamespaceGeo>): NamespaceGeo {
  return {
    id: 'ns1',
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    label: 'pkg',
    wtitle: 20,
    htitle: 10,
    baselineOffset: 8,
    ...overrides,
  };
}

function makeGeo(overrides?: Partial<ClassGeometry>): ClassGeometry {
  return {
    totalWidth: 200,
    totalHeight: 100,
    leaves: [makeClassifier()],
    edges: [makeEdge()],
    namespaces: [makeNamespace()],
    ...overrides,
  };
}

describe('scaleClassGeometry — identity at k=1', () => {
  it('returns the SAME object reference, not a rebuild', () => {
    const geo = makeGeo();
    expect(scaleClassGeometry(geo, 1, THEME_FONT_SIZE)).toBe(geo);
  });
});

describe('scaleClassGeometry — document dimensions', () => {
  it('multiplies totalWidth/totalHeight by k', () => {
    const geo = makeGeo();
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    expect(scaled.totalWidth).toBe(100);
    expect(scaled.totalHeight).toBe(50);
  });

  it('multiplies rawWidth/rawHeight by k when present', () => {
    const geo = makeGeo({ rawWidth: 180, rawHeight: 90 });
    const scaled = scaleClassGeometry(geo, 2, THEME_FONT_SIZE);
    expect(scaled.rawWidth).toBe(360);
    expect(scaled.rawHeight).toBe(180);
  });

  it('leaves rawWidth/rawHeight absent when the input carries none', () => {
    const geo = makeGeo();
    const scaled = scaleClassGeometry(geo, 2, THEME_FONT_SIZE);
    expect(scaled.rawWidth).toBeUndefined();
    expect(scaled.rawHeight).toBeUndefined();
  });
});

describe('scaleClassGeometry — classifier leaves', () => {
  it('multiplies x/y/width/height/dividerYs by k', () => {
    const geo = makeGeo();
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    const c = scaled.leaves[0] as ClassifierGeo;
    expect(c.x).toBe(5);
    expect(c.y).toBe(10);
    expect(c.width).toBe(50);
    expect(c.height).toBe(25);
    expect(c.dividerYs).toEqual([15]);
  });

  it('multiplies row.y/row.indent by k and materializes row.fontSize from the theme fallback', () => {
    const geo = makeGeo();
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    const c = scaled.leaves[0] as ClassifierGeo;
    expect(c.rows[0]!.y).toBeCloseTo(13.4445);
    expect(c.rows[0]!.indent).toBe(4);
    // THEME_FONT_SIZE (14) * 0.5 -- the row carried no explicit fontSize,
    // so the theme fallback is scaled and materialized (see class-scale-
    // geo-row.ts's header: the renderer's own `row.fontSize ?? theme.
    // fontSize` must never see the UNSCALED theme value).
    expect(c.rows[0]!.fontSize).toBe(7);
  });

  it('scales an existing row.fontSize override rather than the theme default', () => {
    const geo = makeGeo({
      leaves: [makeClassifier({ rows: [{ text: 'x', y: 0, indent: 0, fontSize: 12 }] })],
    });
    const scaled = scaleClassGeometry(geo, 2, THEME_FONT_SIZE);
    const c = scaled.leaves[0] as ClassifierGeo;
    expect(c.rows[0]!.fontSize).toBe(24);
  });

  it('multiplies row.width/badgeIndent/visibilityBlockHeight when present', () => {
    const geo = makeGeo({
      leaves: [
        makeClassifier({
          rows: [{ text: 'x', y: 0, indent: 0, width: 30, badgeIndent: 12, visibilityBlockHeight: 28 }],
        }),
      ],
    });
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    const c = scaled.leaves[0] as ClassifierGeo;
    expect(c.rows[0]!.width).toBe(15);
    expect(c.rows[0]!.badgeIndent).toBe(6);
    expect(c.rows[0]!.visibilityBlockHeight).toBe(14);
  });

  it('multiplies bodyInkWidth and symbolInk when present', () => {
    const geo = makeGeo({
      leaves: [makeClassifier({ bodyInkWidth: 40, symbolInk: { minX: 1, minY: 2, maxX: 10, maxY: 20 } })],
    });
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    const c = scaled.leaves[0] as ClassifierGeo;
    expect(c.bodyInkWidth).toBe(20);
    expect(c.symbolInk).toEqual({ minX: 0.5, minY: 1, maxX: 5, maxY: 10 });
  });

  it('multiplies row.atoms via scaleAtom when present', () => {
    const geo = makeGeo({
      leaves: [
        makeClassifier({
          rows: [
            {
              text: 'field1',
              y: 10,
              indent: 8,
              atoms: [
                {
                  kind: 'text',
                  text: 'field1',
                  font: { family: 'sans-serif', size: 14, color: null, styles: new Set() },
                  width: 30,
                },
              ],
            },
          ],
        }),
      ],
    });
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    const c = scaled.leaves[0] as ClassifierGeo;
    expect(c.rows[0]!.atoms![0]).toEqual({
      kind: 'text',
      text: 'field1',
      font: { family: 'sans-serif', size: 7, color: null, styles: new Set() },
      width: 15,
    });
  });

  it('multiplies badgeSpriteImage/genericTag/folderTab when present', () => {
    const geo = makeGeo({
      leaves: [
        makeClassifier({
          badgeSpriteImage: { href: 's.png', width: 10, height: 10 },
          genericTag: {
            text: 'T',
            lines: [{ text: 'T', x: 1, y: 2, width: 3 }],
            rectX: 4,
            rectY: 5,
            rectWidth: 6,
            rectHeight: 7,
            textX: 8,
            textY: 9,
            textWidth: 10,
            fontFamily: 'sans-serif',
            fontSize: 12,
            italic: true,
          },
          folderTab: { width: 10, height: 8, wtitle: 6, htitle: 4, baselineOffset: 3 },
        }),
      ],
    });
    const scaled = scaleClassGeometry(geo, 2, THEME_FONT_SIZE);
    const c = scaled.leaves[0] as ClassifierGeo;
    expect(c.badgeSpriteImage).toEqual({ href: 's.png', width: 20, height: 20 });
    expect(c.genericTag!.rectX).toBe(8);
    expect(c.genericTag!.fontSize).toBe(24);
    expect(c.folderTab).toEqual({ width: 20, height: 16, wtitle: 12, htitle: 8, baselineOffset: 6 });
  });

  it('multiplies enhancedBody/jsonBody when present', () => {
    const geo = makeGeo({
      leaves: [
        makeClassifier({
          enhancedBody: { parts: [{ kind: 'divider', y: 4, strokeWidth: 1 }], width: 40, height: 20, portMembers: [] },
          jsonBody: [{ kind: 'hline', x: 2, y: 4, width: 30 }],
        }),
      ],
    });
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    const c = scaled.leaves[0] as ClassifierGeo;
    expect(c.enhancedBody).toEqual({
      parts: [{ kind: 'divider', y: 2, strokeWidth: 0.5 }],
      width: 20,
      height: 10,
      portMembers: [],
    });
    expect(c.jsonBody).toEqual([{ kind: 'hline', x: 1, y: 2, width: 15 }]);
  });
});

describe('scaleClassGeometry — note leaves', () => {
  it('multiplies x/y/width/height/lineWidths/connector by k, dispatched via isNoteGeo', () => {
    const note: NoteGeo = {
      id: 'n1',
      kind: 'note',
      x: 4,
      y: 8,
      width: 60,
      height: 30,
      lines: ['hi'],
      lineWidths: [20],
      connector: [{ x: 1, y: 2 }],
    };
    const geo = makeGeo({ leaves: [note] });
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    const n = scaled.leaves[0] as NoteGeo;
    expect(n.x).toBe(2);
    expect(n.y).toBe(4);
    expect(n.width).toBe(30);
    expect(n.height).toBe(15);
    expect(n.lineWidths).toEqual([10]);
    expect(n.connector).toEqual([{ x: 0.5, y: 1 }]);
  });
});

describe('scaleClassGeometry — edges', () => {
  it('multiplies every point by k', () => {
    const geo = makeGeo();
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    expect(scaled.edges[0]!.points).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
  });

  it('multiplies label x/y/width/fontSize when present', () => {
    const geo = makeGeo({
      edges: [makeEdge({ label: { text: '1', x: 10, y: 20, width: 8, fontSize: 12 } })],
    });
    const scaled = scaleClassGeometry(geo, 2, THEME_FONT_SIZE);
    expect(scaled.edges[0]!.label).toEqual({ text: '1', x: 20, y: 40, width: 16, fontSize: 24 });
  });

  it('multiplies strokeWidth and strokeDasharray when present', () => {
    const geo = makeGeo({ edges: [makeEdge({ strokeWidth: 1, strokeDasharray: [4, 2] })] });
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    expect(scaled.edges[0]!.strokeWidth).toBe(0.5);
    expect(scaled.edges[0]!.strokeDasharray).toEqual([2, 1]);
  });

  it('multiplies kalBox start/end fields when present', () => {
    const geo = makeGeo({
      edges: [
        makeEdge({
          kalBox: {
            start: { x: 1, y: 2, width: 10, height: 8, text: '1', textX: 3, textY: 9, textWidth: 6, position: 'DOWN' },
          },
        }),
      ],
    });
    const scaled = scaleClassGeometry(geo, 2, THEME_FONT_SIZE);
    expect(scaled.edges[0]!.kalBox).toEqual({
      start: { x: 2, y: 4, width: 20, height: 16, text: '1', textX: 6, textY: 18, textWidth: 12, position: 'DOWN' },
    });
  });
});

describe('scaleClassGeometry — namespaces', () => {
  it('multiplies x/y/width/height/wtitle/htitle/baselineOffset by k', () => {
    const geo = makeGeo();
    const scaled = scaleClassGeometry(geo, 0.5, THEME_FONT_SIZE);
    const ns = scaled.namespaces[0]!;
    expect(ns.x).toBe(0);
    expect(ns.width).toBe(20);
    expect(ns.height).toBe(20);
    expect(ns.wtitle).toBe(10);
    expect(ns.htitle).toBe(5);
    expect(ns.baselineOffset).toBe(4);
  });
});
