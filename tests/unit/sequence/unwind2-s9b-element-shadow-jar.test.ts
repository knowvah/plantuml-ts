/**
 * unwind2-S9b: every sequence element's drop shadow, pinned against jar
 * renders -- participant heads and tails of all eight kinds, notes, activation
 * boxes and dividers.
 *
 * Upstream shadows: `ComponentRoseParticipant` (`:104-109`, reserving the
 * delta in `getPreferredWidth/Height`, `:129-138`), the actor glyph (whose
 * dimension grows by it, `ActorStickMan.java:121`), the database/control/
 * entity/boundary/queue glyphs (no geometry), `ComponentRoseNote` (reserving,
 * `:83-91,119`), `ComponentRoseNoteBox`/`Hexagonal` (`:101`, `:109`),
 * `ComponentRoseActiveLine` (a fixed delta of 1, `:82-83`) and
 * `ComponentRoseDivider` (`:100,115`).
 *
 * Each `tests/fixtures/unwind2-S9b/*.puml` sits beside its jar render
 * (`scripts/oracle-render.sh`); the three corpus fixtures that shadow live in
 * `test-results/dot-cache/sequence/`. The engine is not yet
 * `compareSvg`-conformant, so this pins what shadowing owns: the shadowed
 * elements in document order, the `<defs>` filter (seeded id and scaled
 * values included), and -- for each shadowed/unshadowed PAIR -- that turning
 * shadowing on moves exactly what it moves in the jar.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '../../fixtures/unwind2-S9b');
const CORPUS = join(HERE, '../../../test-results/dot-cache/sequence');

const RE_SHADOWED = /<(\w+)\b[^>]*filter="url\(#f[0-9a-z]+\)"/g;
const RE_DEFS = /<defs>.*?<\/defs>|<defs\/>/;
const RE_ELEMENT = /<(rect|line|path|polygon|ellipse|text|svg)\b([^>]*)>/g;
const GEOMETRY_ATTRS = ['x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy'];

function jarOf(name: string): string {
  return readFileSync(join(FIXTURES, `${name}.svg`), 'utf-8');
}

function oursOf(name: string, dir = FIXTURES): string {
  return renderSync(readFileSync(join(dir, `${name}.puml`), 'utf-8'), { measurer: new DeterministicMeasurer() });
}

/** The shadowed elements' tags, in document order. */
function shadowed(svg: string): string[] {
  return [...svg.replace(RE_DEFS, '').matchAll(RE_SHADOWED)].map((m) => m[1]!);
}

/** One element's geometry numbers, plus the first point of a path/polygon. */
function geometryOf(tag: string, attrs: string): number[] {
  const nums = GEOMETRY_ATTRS.map((k) => new RegExp(`\\b${k}="(-?[\\d.]+)`).exec(attrs)?.[1]).map(Number);
  const pts =
    /\b(?:d|points)="([^"]*)"/
      .exec(attrs)?.[1]
      ?.match(/-?[\d.]+/g)
      ?.slice(0, 2) ?? [];
  return tag === 'path' || tag === 'polygon' ? [...nums, ...pts.map(Number)] : nums;
}

/** Per element, in order: its tag and how far shadowing moved it. */
function movement(plain: string, shadow: string): string[] {
  const a = [...plain.replace(RE_DEFS, '').matchAll(RE_ELEMENT)];
  const b = [...shadow.replace(RE_DEFS, '').matchAll(RE_ELEMENT)];
  expect(b).toHaveLength(a.length);
  return a.map((m, i) => {
    const before = geometryOf(m[1]!, m[2]!);
    const after = geometryOf(b[i]![1]!, b[i]![2]!);
    const moved = before.map((v, j) => (Number.isNaN(v) ? 0 : Math.round((after[j]! - v) * 1000) / 1000));
    return `${m[1]!}:${moved.join(',')}`;
  });
}

describe('unwind2-S9b element shadows (jar fixtures)', () => {
  it.each(['p-plain', 'p-style', 'p-teoz', 'p-stereo', 'a-sh', 'ap-sh', 'apt-sh', 'd-sh', 'n0', 'p-plain-noshadow'])(
    '%s shadows the same elements as the jar, in order',
    (name) => {
      expect(shadowed(oursOf(name))).toEqual(shadowed(jarOf(name)));
    },
  );

  it.each(['p-kinds', 'n3', 'p-plain', 'p-teoz', 'p-stereo', 'a-sh', 'd-sh'])(
    "%s emits the jar's own <defs> filter (SvgGraphics.java:1070-1090)",
    (name) => {
      expect(RE_DEFS.exec(oursOf(name))?.[0]).toBe(RE_DEFS.exec(jarOf(name))?.[0]);
    },
  );

  it.each([
    ['p-plain-noshadow', 'p-plain'],
    ['a-no', 'a-sh'],
    ['ap-no', 'ap-sh'],
    ['apt-no', 'apt-sh'],
    ['d-no', 'd-sh'],
  ])('%s -> %s moves every element exactly as the jar does', (plain, shadow) => {
    expect(movement(oursOf(plain), oursOf(shadow))).toEqual(movement(jarOf(plain), jarOf(shadow)));
  });

  it('shadows every head kind and note once each, as the jar (p-kinds)', () => {
    // The jar draws `hnote` as a hexagon `<polygon>` where this port draws a
    // `<rect>` (`NoteEvent.shape`); the count and order are what shadowing owns.
    const shape = (tag: string): string => (tag === 'polygon' ? 'rect' : tag);
    expect(shadowed(oursOf('p-kinds')).map(shape)).toEqual(shadowed(jarOf('p-kinds')).map(shape));
  });

  it.each(['gepuce-64-pivu656', 'matoka-21-jisu767', 'zupora-06-pazi006'])(
    'corpus %s shadows as many elements as the jar, with its filter',
    (slug) => {
      const ours = oursOf('in', join(CORPUS, slug));
      const jar = readFileSync(join(CORPUS, slug, 'in.svg'), 'utf-8');
      // gepuce is `handwritten`: the jar's boxes are `<polygon>` scribbles.
      expect(shadowed(ours)).toHaveLength(shadowed(jar).length);
      expect(RE_DEFS.exec(ours)?.[0]).toBe(RE_DEFS.exec(jar)?.[0]);
    },
  );
  it("keeps a glyph's gradient fill, lifted into the one <defs> (vasibu-26-lece790, !theme aws-orange)", () => {
    // A glyph's own document mints its gradient (`SvgGraphics.java:363-405`);
    // re-pointing its shadow must not drop it. The jar's whole page holds one.
    const svg = oursOf('in', join(CORPUS, 'vasibu-26-lece790'));
    const ids = [...svg.matchAll(/<linearGradient id="([^"]+)"/g)].map((m) => m[1]);
    const refs = new Set([...svg.matchAll(/url\(#(g[0-9a-z]+)\)/g)].map((m) => m[1]));
    expect(ids).toHaveLength(1);
    expect([...refs]).toEqual(ids);
  });
});
