/**
 * cdd6 T3g: `skinparam noteTextAlignment` -> `PName.HorizontalAlignment` on
 * `SName.note` (`FromSkinparamToStyle.java:178`), read by
 * `EntityImageNote.java:112` and applied per stripe by `SheetBlock1#initMap`
 * (`SheetBlock1.java:155-170`): each line shifts right by
 * `(maxWidth - lineWidth) / coef`, coef 2 for CENTER, 1 for RIGHT, none for
 * LEFT (`:181-193`).
 *
 * Line widths are the jar's own (`unknown/fukegu-14-zona532`: 49.075 /
 * 60.775 / 21.694 / 68.006; `unknown/logavi-03-mita108`: 38.269 / 60.775 /
 * 21.694 / 59.394), and the expected shifts are the jar's drawn x minus the
 * LEFT anchor (`.agent-notes/T2d-note-text-alignment-blocked.md`); both are
 * 3-decimal SVG roundings, hence the 2-decimal comparison.
 */
import { describe, it, expect } from 'vitest';
import { renderNote } from '../../../src/diagrams/class/renderer-note.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import type { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { preprocess } from '../../../src/core/preprocessor.js';

/** `Opale.java` marginX1 -- the LEFT anchor from `note.x = 0`. */
const LEFT_X = 6;

function note(lineWidths: number[]): NoteGeo {
  return {
    id: '__note_0',
    kind: 'note',
    x: 0,
    y: 0,
    width: 80,
    height: 70,
    lines: lineWidths.map((_, i) => `l${String(i)}`),
    lineWidths,
    connector: [],
  };
}

function themed(horizontalAlignment: HorizontalAlignment | undefined): ReturnType<typeof scaleClassTheme> {
  const noteBucket = horizontalAlignment === undefined ? {} : { horizontalAlignment };
  const base: Theme = { ...defaultTheme, colors: { ...defaultTheme.colors, elements: { note: noteBucket } } };
  return scaleClassTheme(base, 1);
}

function textXs(svg: string): number[] {
  return [...svg.matchAll(/<text x="([\d.]+)"/g)].map((m) => Number(m[1]));
}

describe('renderNote — note HorizontalAlignment (cdd6 T3g)', () => {
  it('CENTER shifts each line by (max - w) / 2 (fukegu-14-zona532)', () => {
    const xs = textXs(renderNote(note([49.075, 60.775, 21.694, 68.006]), themed('CENTER')));
    [9.466, 3.616, 23.156, 0].forEach((dx, i) => expect(xs[i]!).toBeCloseTo(LEFT_X + dx, 2));
  });

  it('RIGHT shifts each line by max - w (logavi-03-mita108)', () => {
    const xs = textXs(renderNote(note([38.269, 60.775, 21.694, 59.394]), themed('RIGHT')));
    [22.506, 0, 39.081, 1.381].forEach((dx, i) => expect(xs[i]!).toBeCloseTo(LEFT_X + dx, 2));
  });

  it('LEFT and absent both keep every line on the anchor', () => {
    expect(textXs(renderNote(note([10, 30]), themed('LEFT')))).toEqual([LEFT_X, LEFT_X]);
    expect(textXs(renderNote(note([10, 30]), themed(undefined)))).toEqual([LEFT_X, LEFT_X]);
  });
});

describe('skinparam noteTextAlignment (FromSkinparamToStyle.java:178)', () => {
  function resolve(value: string) {
    return resolveSkinparam(
      preprocess(`@startuml\nskinparam noteTextAlignment ${value}\n@enduml`).skinparam,
      defaultTheme,
    );
  }

  it('lands on the note bucket, not in unknown', () => {
    const r = resolve('center');
    expect(r.unknown).toEqual([]);
    expect(r.theme.colors?.elements?.['note']?.horizontalAlignment).toBe('CENTER');
  });

  it('parses case-insensitively (HorizontalAlignment.fromString)', () => {
    expect(resolve('Right').theme.colors?.elements?.['note']?.horizontalAlignment).toBe('RIGHT');
  });

  it('an unrecognized value sets nothing', () => {
    expect(resolve('middle').theme.colors?.elements?.['note']?.horizontalAlignment).toBeUndefined();
  });
});
