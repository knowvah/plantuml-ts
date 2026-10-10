/**
 * Note placement against the jar: `NoteTile` + `ComponentRoseNote*`
 * (`sequence-note-tile.ts`). Every fixture under `tests/fixtures/isw-T2b-seq/`
 * is a `.puml` and the jar's own SVG for it, rendered one JVM each with
 * `scripts/oracle-render.sh` (oracle seam #4).
 *
 * What is compared is geometry: the canvas width/height, the participant head
 * x, each note's bounding box, and every text's x/y. The note OUTLINE is
 * compared by bounding box rather than by `d` because this port emits the
 * folded-corner path with its vertices in a different order (and an `rnote`/
 * `hnote` as a `<rect>` where the jar draws a `<polygon>`): those are shape
 * differences owned elsewhere, not placement.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/isw-T2b-seq');
const NOTE_FILL = '#FEFFDD';
const PRECISION = 3;

type Box = readonly [number, number, number, number];

function numbers(text: string): number[] {
  return [...text.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
}

/** `[minX, minY, maxX, maxY]` of one drawn note-coloured element. */
function boxOf(tag: string): Box {
  const attr = (name: string): string => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1] ?? '';
  if (tag.startsWith('<rect')) {
    const [x, y, w, h] = ['x', 'y', 'width', 'height'].map((n) => Number(attr(n)));
    return [x!, y!, x! + w!, y! + h!];
  }
  const coords = numbers(tag.startsWith('<path') ? attr('d') : attr('points'));
  const xs = coords.filter((_, i) => i % 2 === 0);
  const ys = coords.filter((_, i) => i % 2 === 1);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function noteBoxes(svg: string): Box[] {
  const tags = svg.match(/<(?:path|rect|polygon)\b[^>]*>/g) ?? [];
  return tags.filter((t) => t.includes(`fill="${NOTE_FILL}"`)).map(boxOf);
}

function textPositions(svg: string): Array<[number, number]> {
  return [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

function headXs(svg: string): number[] {
  return [...svg.matchAll(/<rect x="([\d.]+)" y="10" width="[\d.]+" height="28" fill="#E2E2F0"/g)].map((m) =>
    Number(m[1]),
  );
}

function canvas(svg: string): [string, string] {
  return [/ width="(\d+)px"/.exec(svg)?.[1] ?? '', / height="(\d+)px"/.exec(svg)?.[1] ?? ''];
}

const round = (n: number): number => Number(n.toFixed(PRECISION));
const roundAll = (xs: readonly number[]): number[] => xs.map(round);

function ours(name: string): string {
  return renderFixtureSequence(readFileSync(join(DIR, `${name}.puml`), 'utf8'), new DeterministicMeasurer());
}

/** Fixtures whose notes AND every other element match the jar's placement. */
const FULL = [
  'note-note',
  'note-rnote',
  'note-hnote',
  'note-wide',
  'note-align',
  'note-span-short',
  'note-span-wide',
  'note-span-later',
  'note-stale-span',
];

describe.each(FULL)('note geometry vs the jar: %s', (name) => {
  const jar = readFileSync(join(DIR, `${name}.svg`), 'utf8');
  const svg = ours(name);

  it('draws each note over the same box', () => {
    expect(noteBoxes(svg).map((b) => roundAll(b))).toEqual(noteBoxes(jar).map((b) => roundAll(b)));
  });

  it('lands every text, head and the canvas where the jar does', () => {
    expect(textPositions(svg).map((p) => roundAll(p))).toEqual(textPositions(jar).map((p) => roundAll(p)));
    expect(roundAll(headXs(svg))).toEqual(roundAll(headXs(jar)));
    expect(canvas(svg)).toEqual(canvas(jar));
  });
});

describe('note under live activations (note-level)', () => {
  // `NoteTile#getX` `right`: `posC + level * LIVE_DELTA_SIZE`
  // (`NoteTile.java:160-163`), so the same participant's notes step right by 5
  // per open activation. The self message and the bars themselves are drawn
  // elsewhere and are not compared.
  it('offsets right notes by the live level and keeps left notes on posC', () => {
    const jar = readFileSync(join(DIR, 'note-level.svg'), 'utf8');
    expect(noteBoxes(ours('note-level')).map((b) => roundAll(b))).toEqual(noteBoxes(jar).map((b) => roundAll(b)));
  });
});
