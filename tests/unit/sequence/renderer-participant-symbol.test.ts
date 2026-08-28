/**
 * T1 conformance for the sequence participant-glyph seam.
 *
 * The database expectations below are the jar's OWN geometry, lifted from
 * `test-results/dot-cache/sequence/junaxa-14-biko373/in.svg` — the fixture
 * this mission exists to close. That golden draws the `database "Supporting
 * Actor"` head as exactly two `<path>`s and nothing else:
 *
 *   body:    M142.031,69 C142.031,59 160.031,59 160.031,59
 *            C160.031,59 178.031,59 178.031,69 L178.031,95
 *            C178.031,105 160.031,105 160.031,105
 *            C160.031,105 142.031,105 142.031,95 L142.031,69
 *   closing: M142.031,69 C142.031,79 160.031,79 160.031,79
 *            C160.031,79 178.031,79 178.031,69
 *
 * Reading `USymbolDatabase#drawDatabase`'s own `moveTo(0,10) / cubicTo(0,0,
 * w/2,0, w/2,0) / …` against those numbers fixes `w = 36`, `h = 46` and the
 * glyph origin at `(142.031, 59)` — which is what
 * `Margin(10,10,24,5).addDimension(empty(16,17))` independently produces
 * (`ComponentRoseDatabase.java:70`, `USymbolDatabase.java:117`).
 *
 * The tests place the glyph at a round origin instead of the golden's own, so
 * every expected coordinate is exact rather than a re-rounding of the jar's
 * printed 3 decimals: the golden's `106.363` box width is itself a rounded
 * `textLength`, and reconstructing `dx` from it lands 0.0005 off.
 */
import { describe, it, expect } from 'vitest';
import {
  renderParticipantSymbol,
  measureParticipantSymbol,
  type SymbolParticipantType,
  type ParticipantSymbolGeo,
} from '../../../src/diagrams/sequence/renderer-participant-symbol.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { scaleSequenceTheme } from '../../../src/diagrams/sequence/scale-geo.js';

const THEME = scaleSequenceTheme(defaultTheme, 1);

/** Box wide enough that `dx = (136 - 36) / 2 = 50` and tall enough that the
 *  tail flip's `dy = 66 - 46 = 20` are both integers. */
const GEO: ParticipantSymbolGeo = {
  x: 100,
  y: 59,
  width: 136,
  height: 66,
  background: '#E2E2F0',
  border: '#181818',
};

const ALL_TYPES: readonly SymbolParticipantType[] = [
  'database',
  'collections',
  'queue',
  'entity',
  'boundary',
  'control',
];

function dAttrs(svg: string): string[] {
  return [...svg.matchAll(/\sd="([^"]*)"/g)].map((m) => m[1] ?? '');
}

function draw(type: SymbolParticipantType, head: boolean, geo = GEO, theme = THEME): string {
  return renderParticipantSymbol(type, geo, { head, display: 'Supporting Actor', theme });
}

describe('renderParticipantSymbol — database', () => {
  it('emits the two USymbolDatabase paths and no rect, line or ellipse', () => {
    const svg = draw('database', true);
    expect(dAttrs(svg)).toEqual([
      'M150,69 C150,59 168,59 168,59 C168,59 186,59 186,69 L186,95' +
        ' C186,105 168,105 168,105 C168,105 150,105 150,95 L150,69',
      'M150,69 C150,79 168,79 168,79 C168,79 186,79 186,69',
    ]);
    expect(svg).not.toMatch(/<rect|<line|<ellipse/);
    expect(svg.match(/<path/g)).toHaveLength(2);
  });

  it('paints the body with the participant fill and leaves the closing path open', () => {
    const svg = draw('database', true);
    expect(svg).toContain('fill="#E2E2F0"');
    expect(svg).toContain('fill="none"');
    // `element { LineThickness 0.5 }`, skin/plantuml.skin:91-93.
    expect(svg).toContain('stroke-width:0.5;');
    expect(svg).toContain('stroke:#181818;');
  });

  it('swaps the glyph/text order between head and tail', () => {
    // head: glyph at the top of the box (y = 59), text below it.
    expect(dAttrs(draw('database', true))[0]).toContain('M150,69 ');
    // tail: text first, glyph pushed down by getTextHeight = 66 - 46 = 20.
    expect(dAttrs(draw('database', false))[0]).toContain('M150,89 ');
  });

  it('multiplies every coordinate by the render scale', () => {
    const scaled = scaleSequenceTheme(defaultTheme, 2);
    const svg = draw('database', true, { ...GEO, x: 200, y: 118, width: 272, height: 132 }, scaled);
    expect(dAttrs(svg)[0]).toBe(
      'M300,138 C300,118 336,118 336,118 C336,118 372,118 372,138 L372,190' +
        ' C372,210 336,210 336,210 C336,210 300,210 300,190 L300,138',
    );
  });
});

describe('renderParticipantSymbol — the other five kinds', () => {
  it('draws a glyph for every type without throwing, at head and at tail', () => {
    for (const type of ALL_TYPES) {
      for (const head of [true, false]) {
        const svg = draw(type, head);
        expect(svg.length, `${type} head=${String(head)}`).toBeGreaterThan(0);
        expect(svg, `${type} head=${String(head)}`).toMatch(/^<(path|rect|ellipse|polygon|line)/);
      }
    }
  });

  it('offsets the collections back-rectangle by getDeltaCollection()', () => {
    // ComponentRoseParticipant.java:93-96 — dx 4, and 4 smaller in both axes.
    const svg = draw('collections', true);
    expect(svg).toContain('x="104"');
    expect(svg).toContain('y="59"');
    expect(svg).toContain('width="132"');
    expect(svg).toContain('height="62"');
  });

  it('sizes the queue cylinder to the whole participant box', () => {
    // ComponentRoseQueue#getPreferredWidth/Height return the glyph's own
    // dimension, so the glyph fills the box the layout already sized.
    const d = dAttrs(draw('queue', true))[0] ?? '';
    expect(d.startsWith('M105,59 L231,59')).toBe(true);
  });

  it('draws boundary as a bar plus a circle', () => {
    const svg = draw('boundary', true);
    expect(svg).toMatch(/<path/);
    expect(svg).toMatch(/<ellipse/);
  });

  it('draws entity as a circle plus its underline', () => {
    const svg = draw('entity', true);
    expect(svg).toMatch(/<ellipse/);
    expect(svg).toMatch(/<line/);
  });

  it('draws control as a circle plus its arrow wing', () => {
    const svg = draw('control', true);
    expect(svg).toMatch(/<ellipse/);
    expect(svg).toMatch(/<polygon/);
  });
});

describe('measureParticipantSymbol', () => {
  it('returns asSmall(null, empty(16,17), empty(0,0)) for database', () => {
    // Margin(10,10,24,5) + (16,17) = (36,46) — the dimension the junaxa
    // golden's own path arithmetic independently fixes.
    expect(measureParticipantSymbol('database', THEME)).toEqual({ width: 36, height: 46 });
  });

  it('returns the svek drawing dimensions for boundary, control and entity', () => {
    // Boundary.java:97-98 — radius*2 + left + 2*margin, radius*2 + 2*margin.
    expect(measureParticipantSymbol('boundary', THEME)).toEqual({ width: 49, height: 32 });
    // Control.java:87-88 and EntityDomain.java:74-75 — radius*2 + 2*margin.
    expect(measureParticipantSymbol('control', THEME)).toEqual({ width: 32, height: 32 });
    expect(measureParticipantSymbol('entity', THEME)).toEqual({ width: 32, height: 32 });
  });

  it('returns USymbolQueue#getMargin for queue', () => {
    // Margin(5,15,5,5) — the extent the label is composed INTO, not a glyph.
    expect(measureParticipantSymbol('queue', THEME)).toEqual({ width: 20, height: 10 });
  });

  it('returns getDeltaCollection() for collections', () => {
    expect(measureParticipantSymbol('collections', THEME)).toEqual({ width: 4, height: 4 });
  });

  it('is independent of the theme', () => {
    for (const type of ALL_TYPES) {
      expect(measureParticipantSymbol(type, scaleSequenceTheme(defaultTheme, 3))).toEqual(
        measureParticipantSymbol(type, THEME),
      );
    }
  });
});

describe('renderParticipantSymbol — paint and stroke resolution', () => {
  it('honours a per-element LineThickness override', () => {
    const theme = scaleSequenceTheme(
      { ...defaultTheme, colors: { ...defaultTheme.colors, elements: { database: { lineThickness: 3 } } } },
      1,
    );
    expect(draw('database', true, GEO, theme)).toContain('stroke-width:3;');
  });

  it('falls back to no fill when the geo carries no colours', () => {
    const bare: ParticipantSymbolGeo = { x: 100, y: 59, width: 136, height: 66 };
    expect(draw('database', true, bare)).toContain('<path');
  });
});
