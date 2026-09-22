/**
 * CDD T18 — `extractDecorations`'s named colour parts (`line`/`text`/
 * `lineStyle`), split out of the raw space-joined `COLOR [LINECOLOR]`
 * token it already kept in `color`.
 *
 * Upstream parser: `klimt/color/Colors.java:95-124` (lowercase, strip every
 * `#`, tokenise on `;`, key each `name:value` by `ColorType.getType(name)`
 * — which truncates at the first `.`, `ColorType.java:41-48` — then set
 * `lineStyle` from a whole-string `line.dashed`/`line.dotted`/`line.bold`
 * scan in that priority). The `##[style]colour` half is a DISJOINT capture
 * group (`CommandCreateClassMultilines.java:115-118`) applied last
 * (java:272-279), so it overwrites the `line:` half.
 *
 * Corpus shape: `mexaka-52-gati860`.
 */
import { describe, it, expect } from 'vitest';
import {
  extractDecorations,
  parseDeclarationColors,
} from '../../../src/diagrams/class/class-declaration-extractors.js';

describe('T18 parseDeclarationColors: the compound COLOR half (Colors.java:95-124)', () => {
  it('reads `text:`, `line:` and `back:` independently (`mexaka` bar)', () => {
    expect(parseDeclarationColors('#text:yellow;line:green;back:lightblue')).toEqual({
      text: 'yellow',
      line: 'green',
    });
  });

  it('ignores the bare mainType token in a `#lightblue;text:red;line:green` spec', () => {
    // java:101-103 -- a token with no `:` goes to `mainType` (BACK), which
    // `color-override.ts#resolveBareOrBackColor` owns, not this function.
    expect(parseDeclarationColors('#lightblue;text:red;line:green')).toEqual({ text: 'red', line: 'green' });
  });

  it('lowercases and `#`-strips the value, as java:96 does', () => {
    expect(parseDeclarationColors('#back:red;line:00FFFF')).toEqual({ line: '00ffff' });
  });

  it('returns {} for a spec with neither a `line:` nor a `text:` part', () => {
    expect(parseDeclarationColors('#back:red')).toEqual({});
    expect(parseDeclarationColors(undefined)).toEqual({});
  });
});

describe('T18 parseDeclarationColors: lineStyle (Colors.java:117-122)', () => {
  it('reads `line.dashed:blue` as BOTH a dashed style and a LINE colour', () => {
    // `ColorType.getType("line.dashed")` truncates at the `.` -> LINE.
    expect(parseDeclarationColors('#line.dashed:blue')).toEqual({ line: 'blue', lineStyle: 'dashed' });
  });

  it('reads `line.dotted:blue`', () => {
    expect(parseDeclarationColors('#line.dotted:blue')).toEqual({ line: 'blue', lineStyle: 'dotted' });
  });

  it('reads a value-less `line.bold`', () => {
    expect(parseDeclarationColors('#line.bold')).toEqual({ lineStyle: 'bold' });
  });

  it('applies java:117-122 priority — dashed beats dotted beats bold', () => {
    expect(parseDeclarationColors('#line.bold;line.dotted;line.dashed').lineStyle).toBe('dashed');
    expect(parseDeclarationColors('#line.bold;line.dotted').lineStyle).toBe('dotted');
  });
});

describe('T18 parseDeclarationColors: the `##[style]colour` LINECOLOR half', () => {
  it('reads `##[dashed]green` as both parts', () => {
    expect(parseDeclarationColors('##[dashed]green')).toEqual({ line: 'green', lineStyle: 'dashed' });
  });

  it('reads a bare `##red` as a LINE colour with no style', () => {
    expect(parseDeclarationColors('##red')).toEqual({ line: 'red' });
  });

  it('reads a colour-less `##[bold]` as a style alone', () => {
    expect(parseDeclarationColors('##[bold]')).toEqual({ lineStyle: 'bold' });
  });

  it('lets the LINECOLOR half OVERWRITE the COLOR half (java:272-279 order)', () => {
    expect(parseDeclarationColors('#line.dotted:blue ##[bold]green')).toEqual({
      line: 'green',
      lineStyle: 'bold',
    });
  });

  it('keeps the COLOR half`s parts when LINECOLOR supplies neither', () => {
    expect(parseDeclarationColors('#text:yellow;line:green ##')).toEqual({ text: 'yellow', line: 'green' });
  });
});

describe('T18 extractDecorations: the new fields reach the declaration result', () => {
  it('surfaces `line`/`text`/`lineStyle` alongside the untouched raw `color`', () => {
    expect(extractDecorations('bar #text:yellow;line:green;back:lightblue')).toMatchObject({
      rest: 'bar',
      color: '#text:yellow;line:green;back:lightblue',
      text: 'yellow',
      line: 'green',
    });
  });

  it('surfaces the LINECOLOR half of a space-joined `COLOR ##[style]colour`', () => {
    expect(extractDecorations('Foo #back:red ##[dashed]blue')).toMatchObject({
      rest: 'Foo',
      line: 'blue',
      lineStyle: 'dashed',
    });
  });

  it('leaves every new field undefined for a declaration with no colour spec', () => {
    const out = extractDecorations('Foo');
    expect(out.color).toBeUndefined();
    expect(out.line).toBeUndefined();
    expect(out.text).toBeUndefined();
    expect(out.lineStyle).toBeUndefined();
  });

  it('leaves every new field undefined for a plain bare `#colour`', () => {
    const out = extractDecorations('Foo #lightblue');
    expect(out.color).toBe('#lightblue');
    expect(out.line).toBeUndefined();
    expect(out.lineStyle).toBeUndefined();
  });
});
