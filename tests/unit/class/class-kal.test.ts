/**
 * cdd-T15 — the qualified-association box (`svek/Kal.java`).
 *
 * Every expected value below is read off a cached oracle artifact, never
 * fitted:
 *   - `baneru-00-kuro607`'s `in.svg` link group carries
 *     `<rect x="14.925" y="54.82" width="56.15" height="16" …
 *     stroke-width:0.5>` + `<text x="16.925" y="66.709" …>Qualifier</text>`
 *     — i.e. `textDim.delta(4,2)` (`Kal.java:104`), the box drawn at
 *     `getTextDelta().compose(translate)` (`:146-149,159-173`) and the text
 *     at `UTranslate(2,1)` (`:143`).
 *   - `camuna-58-veca254`'s `svek-1.dot` carries the two `ensureMargins`
 *     shapes (`Kal.java:106-121`): `Shop` (`sh0008`, a length-3 `--->`
 *     link, so `Direction.DOWN`) has bottom margin `HEIGHT="16.0"` and main
 *     cell `WIDTH="134.53375…"` = `103.488 * 1.3`
 *     (`EntityImageClass.java:113`'s `getKalWidth() * 1.3`); `HashMap`
 *     (`sh0007`, a `-r->` link, so length 1 and `Direction.RIGHT`) has right
 *     margin `WIDTH="14.9375"` = the box width, and its main cell is NOT
 *     widened (`getKalWidth` sums UP/DOWN kals only, `:117-127`).
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { layoutFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import type { ClassGeometry } from '../../../src/diagrams/class/layout.js';
import {
  computeKals,
  kalMarginsByEntity,
  kalWidthByEntity,
  kalTextDelta,
  kalTranslateForDecoration,
  KAL_STROKE_THICKNESS,
  KAL_TEXT_DX,
  KAL_TEXT_DY,
} from '../../../src/diagrams/class/class-kal.js';
import { parseRelationshipLine } from '../../../src/diagrams/class/class-relationship-parser.js';
import { defaultTheme } from '../../../src/core/theme.js';

const measurer = new WidthTableMeasurer();

function markupOf(slug: string): string {
  return readFileSync(`test-results/dot-cache/class/${slug}/in.puml`, 'utf8');
}

function fixture(slug: string): ClassGeometry {
  return layoutFixtureClass(markupOf(slug), measurer).geo;
}

const CLASS_FONT = { family: defaultTheme.fontFamily, size: defaultTheme.fontSize };

/** The relationship lines of a fixture, parsed through the production
 *  relationship parser — `computeKals` reads nothing else off the AST. */
function kalsOfLines(...lines: string[]) {
  const rels = lines.map((l) => parseRelationshipLine(l)!);
  return computeKals(rels, CLASS_FONT, measurer);
}

describe('Kal — measure (Kal.java:104, textDim.delta(4,2))', () => {
  const kals = kalsOfLines('class1 [Qualifier] <-- class2');

  it('builds exactly one box, on class1 (entity1), pointing DOWN', () => {
    expect(kals.length).toBe(1);
    expect(kals[0]!.entityId).toBe('class1');
    expect(kals[0]!.text).toBe('Qualifier');
    // `class1 [Qualifier] <-- class2` has no direction word, so the queue
    // length is 2 (`<--`) and `link.getLength() == 1` is false — the
    // entity1 branch at `Kal.java:114-116`.
    expect(kals[0]!.position).toBe('DOWN');
  });

  it('measures the jar box: 56.15 x 16 for "Qualifier" at font size 14', () => {
    expect(kals[0]!.width).toBeCloseTo(56.15, 3);
    expect(kals[0]!.height).toBeCloseTo(16, 6);
    expect(kals[0]!.textWidth).toBeCloseTo(52.15, 3);
  });

  it('places a DOWN box at dx = -width/2, dy = 0 (Kal.java:165-166)', () => {
    expect(kalTextDelta(kals[0]!)).toEqual({ dx: -56.15 / 2, dy: 0 });
  });

  it('pushes the DOWN extremity out by the box height (Kal.java:72-85)', () => {
    expect(kalTranslateForDecoration(kals[0]!)).toEqual({ dx: 0, dy: 16 });
  });

  it('draws the rect at stroke-width 0.5 and the text at (2,1)', () => {
    expect(KAL_STROKE_THICKNESS).toBe(0.5);
    expect(KAL_TEXT_DX).toBe(2);
    expect(KAL_TEXT_DY).toBe(1);
  });
});

describe('Kal — margins and the node-width floor (camuna-58-veca254)', () => {
  const kals = kalsOfLines(
    'Shop [customerId: long] ---> "customer\\n1" Customer : foo1',
    'HashMap [id] -r-> "value" Customer : foo2',
  );

  it('gives Shop a DOWN margin of the box height and HashMap a RIGHT margin of its width', () => {
    const margins = kalMarginsByEntity(kals);
    expect(margins.get('Shop')).toEqual({ x1: 0, x2: 0, y1: 0, y2: 16 });
    const hashMap = margins.get('HashMap')!;
    expect(hashMap.x1).toBe(0);
    expect(hashMap.x2).toBeCloseTo(14.9375, 3);
    expect(hashMap.y1).toBe(0);
    expect(hashMap.y2).toBe(0);
  });

  it('counts only UP/DOWN boxes toward getKalWidth (EntityImageClass.java:117-127)', () => {
    const widths = kalWidthByEntity(kals);
    expect(widths.get('Shop')).toBeCloseTo(103.488, 3);
    // `HashMap`'s only box is a RIGHT one, so it contributes no width.
    expect(widths.get('HashMap') ?? 0).toBe(0);
  });
});

describe('Kal — rendered geometry (baneru-00-kuro607)', () => {
  const geo = fixture('baneru-00-kuro607');
  const edge = geo.edges[0]!;

  it('anchors the box on the pre-trim spline end, centred on the line', () => {
    const box = edge.kalBox?.start ?? edge.kalBox?.end;
    expect(box).toBeDefined();
    expect(box!.width).toBeCloseTo(56.15, 3);
    expect(box!.height).toBeCloseTo(16, 6);
    // jar: x=14.925, y=54.82 (its own class1 sits at x=7, ours at x=7).
    expect(box!.x).toBeCloseTo(14.925, 0);
    expect(box!.y).toBeCloseTo(54.82, 0);
    expect(box!.textX).toBeCloseTo(box!.x + KAL_TEXT_DX, 6);
  });
});
