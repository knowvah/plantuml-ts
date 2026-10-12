/**
 * `ElementBorder` (ElementBorder.java:45-106) against the 1.2026.8beta1 jar
 * (`fixtures/`, rendered by `scripts/oracle-render.sh`; dimensions from
 * `PreferredDimensionProbe.java`):
 *
 * - `border-text` — all five regions, each a `{#` text pyramid (the corpus
 *   `jukefo-44-teja465` layout with its south buttons replaced by text).
 * - `border-partial` — north and center only: the unset west, east and
 *   south are 1 x 1 `ElementEmpty`, so the center starts at x = 1.
 */
import { describe, expect, it } from 'vitest';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import type { Element } from '../../../../src/diagrams/salt/element/Element.js';
import { ElementBorder } from '../../../../src/diagrams/salt/element/ElementBorder.js';
import { ElementPyramid } from '../../../../src/diagrams/salt/element/ElementPyramid.js';
import { TableStrategy } from '../../../../src/diagrams/salt/element/TableStrategy.js';
import { stringBounder } from '../salt-test-support.js';
import {
  JAR_DIMENSIONS,
  dictionary,
  drawRoot,
  drawnElements,
  jarDrawnElements,
  positionner,
  textRows,
} from './container-test-support.js';
import { RecordingUGraphic } from './recording-ugraphic.js';

function table(strategy: TableStrategy, ...rows: string[][]): ElementPyramid {
  return new ElementPyramid(positionner(textRows(rows)), strategy, null, dictionary);
}

const FIXTURE_ROOTS: Record<string, () => ElementBorder> = {
  'border-text': () => {
    const b = new ElementBorder();
    b.setNorth(table(TableStrategy.DRAW_ALL, ['North title']));
    b.setSouth(table(TableStrategy.DRAW_ALL, ['South']));
    b.setWest(table(TableStrategy.DRAW_ALL, ['West']));
    b.setEast(table(TableStrategy.DRAW_ALL, ['East']));
    b.setCenter(table(TableStrategy.DRAW_ALL, ['A0', 'B0'], ['A1', 'B1']));
    return b;
  },
  'border-partial': () => {
    const b = new ElementBorder();
    b.setNorth(table(TableStrategy.DRAW_NONE, ['North']));
    b.setCenter(table(TableStrategy.DRAW_NONE, ['Center']));
    return b;
  },
};

describe('ElementBorder#getPreferredDimension — jar probe (java:93-104)', () => {
  for (const [name, build] of Object.entries(FIXTURE_ROOTS)) {
    it(`${name}: ${JAR_DIMENSIONS[name]?.width} x ${JAR_DIMENSIONS[name]?.height}`, () => {
      const jar = JAR_DIMENSIONS[name];
      const dim = build().getPreferredDimension(stringBounder, 0, 0);
      expect(jar?.root).toBe('ElementBorder');
      expect(dim.getWidth()).toBe(jar?.width);
      expect(dim.getHeight()).toBe(jar?.height);
    });
  }
});

describe('ElementBorder#drawU — every drawn element equals the jar`s (java:73-91)', () => {
  for (const [name, build] of Object.entries(FIXTURE_ROOTS)) {
    it(name, () => {
      expect(drawnElements(drawRoot(build()))).toEqual(jarDrawnElements(name));
    });
  }
});

/** A fixed-size region that records where, at which z-index and into what it was drawn. */
class RegionStub implements Element {
  readonly draws: { x: number; y: number; zIndex: number; w: number; h: number }[] = [];
  readonly measuredAt: [number, number][] = [];
  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {}
  getPreferredDimension(_sb: StringBounder, x: number, y: number): XDimension2D {
    this.measuredAt.push([x, y]);
    return new XDimension2D(this.width, this.height);
  }
  drawU(ug: UGraphic, zIndex: number, dimToUse: XDimension2D): void {
    const { x, y } = ug.getTranslate().getPosition();
    this.draws.push({ x, y, zIndex, w: dimToUse.getWidth(), h: dimToUse.getHeight() });
  }
}

describe('ElementBorder — region placement', () => {
  function border() {
    const regions = {
      north: new RegionStub(30, 4),
      south: new RegionStub(20, 6),
      west: new RegionStub(7, 9),
      east: new RegionStub(5, 11),
      center: new RegionStub(10, 3),
    };
    const b = new ElementBorder();
    b.setNorth(regions.north);
    b.setSouth(regions.south);
    b.setWest(regions.west);
    b.setEast(regions.east);
    b.setCenter(regions.center);
    return { b, regions };
  }

  it('is max(north, south, west + center + east) wide and north + max(west, center, east) + south tall', () => {
    const { b, regions } = border();
    expect(b.getPreferredDimension(stringBounder, 3, 8)).toEqual(new XDimension2D(30, 4 + 11 + 6));
    expect(regions.center.measuredAt).toEqual([[3, 8]]);
    const wide = border();
    wide.b.setCenter(new RegionStub(40, 3));
    expect(wide.b.getPreferredDimension(stringBounder, 0, 0).getWidth()).toBe(7 + 40 + 5);
  });

  it('draws north at the origin, south at the bottom, west/east/center below north, all into dimToUse', () => {
    const { b, regions } = border();
    b.drawU(new RecordingUGraphic(), 1, new XDimension2D(50, 40));
    const at = (x: number, y: number) => [{ x, y, zIndex: 1, w: 50, h: 40 }];
    expect(regions.north.draws).toEqual(at(0, 0));
    expect(regions.south.draws).toEqual(at(0, 34));
    expect(regions.west.draws).toEqual(at(0, 4));
    expect(regions.east.draws).toEqual(at(45, 4));
    expect(regions.center.draws).toEqual(at(7, 4));
  });

  it('an empty border is 1 + 1 + 1 wide and 1 + 1 + 1 tall (five 1 x 1 ElementEmpty)', () => {
    expect(new ElementBorder().getPreferredDimension(stringBounder, 0, 0)).toEqual(new XDimension2D(3, 3));
    const ug = new RecordingUGraphic();
    new ElementBorder().drawU(ug, 0, new XDimension2D(3, 3));
    expect(ug.events).toEqual([]);
  });
});
