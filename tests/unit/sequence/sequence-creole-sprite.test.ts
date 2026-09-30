/**
 * A creole `<$sprite>` atom in a SEQUENCE label is DRAWN as the image
 * `AtomSprite#drawU` paints, and the head grows to hold it — cdd7 T1f
 * (josebu-55-seje426, whose nested sequence image was 107x87 against the
 * jar's 92x162 because every head dropped its sprite to literal text).
 *
 * Upstream: every sequence label is `display.create0(..., CreoleMode.FULL,
 * ...)` (`AbstractTextualComponent.java:80-92`), and `StripeSimple#addSprite`
 * (`StripeSimple.java:228-235`) pushes an `AtomSprite` whose
 * `calculateDimensionSlow` is the sprite's own `width * scale` box
 * (`AtomSprite.java:64-67`, `SpriteMonochrome.java:223-225`) and whose
 * `getStartingAltitude` is 0 (`AtomSprite.java:69-71`), so `Sea#doAlign`
 * bottom-aligns it with the text boxes beside it (`Sea.java:72-80`).
 *
 * Every number below is read off the jar (1.2026.8beta1, deterministic text)
 * for {@link SPRITE_PUML}, rendered with `scripts/oracle-render.sh`: a 24x24
 * sprite at font 14 is `24 * 14 / 13 = 25.846` (`CommandCreoleSprite.java:82`)
 * and is EMITTED `Math.round`ed to 26 (`driver-image-svg.ts`'s jar-verified
 * rule).
 */
import { describe, it, expect } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { FontSpec } from '../../../src/core/measurer.js';
import { sequenceCreoleFont, sequenceCreoleRuns } from '../../../src/diagrams/sequence/sequence-creole.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { SequenceDiagramAST, TextRun } from '../../../src/diagrams/sequence/ast.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const measurer = new DeterministicMeasurer();
const PARTICIPANT_FONT: FontSpec = { family: 'sans-serif', size: 14 };
const ORIGIN = { leftX: 100, baselineY: 40 };

/** A 24x24, 16-level checkerboard sprite (4-pixel squares). */
function spriteRows(): string[] {
  const rows: string[] = [];
  for (let y = 0; y < 24; y++) {
    let row = '';
    for (let x = 0; x < 24; x++) row += (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0 ? 'F' : '0';
    rows.push(row);
  }
  return rows;
}

const SPRITE_DEF = ['sprite $chk [24x24/16] {', ...spriteRows(), '}'];

const SPRITE_PUML = [
  '@startuml',
  ...SPRITE_DEF,
  'queue "<$chk>" as q',
  'participant "Ab <$chk> cd" as p',
  'participant "<$chk>\\nName" as n',
  'database "<$chk>" as d',
  'q -> p',
  '@enduml',
].join('\n');

/** `24 * 14 / 13` — the sprite's measured box at the participant font. */
const SPRITE_BOX = (24 * 14) / 13;

function astOf(body: readonly string[]): SequenceDiagramAST {
  const ast = parseSequence(body);
  if (!('participants' in ast)) throw new Error('refused');
  return ast;
}

function runsOf(line: string): readonly TextRun[] {
  const ast = astOf([...SPRITE_DEF, 'participant A']);
  return sequenceCreoleRuns(line, sequenceCreoleFont(PARTICIPANT_FONT), ORIGIN, measurer, {
    sprites: ast.sprites!,
    fontColor: '#000000',
  });
}

function num(s: string | undefined): number {
  return Number(s);
}

describe('sequenceCreoleRuns — a raster sprite is an image run', () => {
  it('turns a sprite-only line into ONE image run, no literal text', () => {
    const runs = runsOf('<$chk>');
    expect(runs).toHaveLength(1);
    expect(runs[0]!.text).toBe('');
    expect(runs[0]!.textWidth).toBeCloseTo(SPRITE_BOX, 10);
    expect(runs[0]!.textLineHeight).toBeCloseTo(SPRITE_BOX, 10);
    // Emitted width/height are the jar's rounded raster (26), the advance
    // stays the raw 25.846.
    expect(runs[0]!.image!.width).toBe(26);
    expect(runs[0]!.image!.height).toBe(26);
    expect(runs[0]!.image!.href.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('bottom-aligns the image with the text box: top = baseline + descent - box', () => {
    const runs = runsOf('Ab <$chk> cd');
    expect(runs.map((r) => r.text)).toEqual(['Ab ', '', ' cd']);
    const descent = measurer.getDescent(PARTICIPANT_FONT, 'M');
    expect(runs[1]!.image!.y).toBeCloseTo(ORIGIN.baselineY + descent - SPRITE_BOX, 10);
    // The box top to the baseline: what `labelRows` stacks the row by.
    expect(runs[1]!.textAscent).toBeCloseTo(SPRITE_BOX - descent, 10);
    expect(runs[2]!.x).toBeCloseTo(runs[1]!.x + SPRITE_BOX, 10);
  });

  it('drops an unknown sprite name, as StripeSimple#addSprite adds no atom', () => {
    const runs = runsOf('a<$nope>b');
    expect(runs.map((r) => r.text)).toEqual(['a', 'b']);
  });

  it('keeps the whole-line literal when no sprite context is given', () => {
    const runs = sequenceCreoleRuns('<$chk>', sequenceCreoleFont(PARTICIPANT_FONT), ORIGIN, measurer);
    expect(runs.map((r) => r.text)).toEqual(['<$chk>']);
  });

  it('keeps an OpenIconic line wholly literal (no drawable geometry here)', () => {
    const runs = runsOf('x<&heart>y');
    expect(runs.map((r) => r.text)).toEqual(['x<&heart>y']);
  });
});

describe('participant heads grow to the sprite (jar-pinned)', () => {
  const svg = renderFixtureSequence(SPRITE_PUML, measurer);

  it('sizes the queue head to 10 + 25.846 tall, with the sprite at its top margin', () => {
    // Jar: `M15,46 ... 81.846` — the queue path spans y 46 -> 81.846.
    const path = svg.match(/<path d="M(\d+(?:\.\d+)?),(\d+(?:\.\d+)?) L[\d.]+,[\d.]+ C[^"]*?L\1,(\d+(?:\.\d+)?) C/);
    expect(path).not.toBeNull();
    const top = num(path![2]);
    const bottom = num(path![3]);
    expect(bottom - top).toBeCloseTo(10 + SPRITE_BOX, 3);
    // y only: the jar's x is the glyph's own left margin (`USymbolQueue`
    // `Margin(5,15,5,5)`), which this port's queue label centring misses by
    // 5px for TEXT labels too -- a separate, pre-existing mechanism.
    const img = svg.match(/<image width="26" height="26" x="[\d.]+" y="([\d.]+)"/);
    expect(img).not.toBeNull();
    expect(num(img![1])).toBeCloseTo(top + 5, 3);
  });

  it('sizes a text+sprite participant box to 25.846 + 14 with the text on the shared bottom', () => {
    const rects = [
      ...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#E2E2F0"/g),
    ];
    const heights = rects.map((m) => num(m[4]));
    // Jar: 39.846 ("Ab <$chk> cd") and 53.846 ("<$chk>\nName"), head and tail.
    expect(heights.filter((h) => Math.abs(h - 39.846) < 1e-3)).toHaveLength(2);
    expect(heights.filter((h) => Math.abs(h - 53.846) < 1e-3)).toHaveLength(2);
    const abRect = rects.find((m) => Math.abs(num(m[4]) - 39.846) < 1e-3)!;
    const rowTop = num(abRect[2]) + 7;
    // Jar: `Ab` baseline 70.735 with the rect at 41 -> 22.735 below the row top.
    const ab = svg.match(/<text x="[\d.]+" y="([\d.]+)"[^>]*>Ab<\/text>/);
    expect(num(ab![1]) - rowTop).toBeCloseTo(22.735, 3);
  });

  it('draws no label as literal sprite markup, and one image per sprite', () => {
    // `<text>` only: the lifeline `<title>` is `Display#toTooltipText`
    // (`ComponentRoseLine.java:82`), which the jar renders `..chk.` -- a
    // separate seam (`renderer-lifeline.ts`) this change does not touch.
    const texts = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
    expect(texts.filter((t) => t!.includes('$chk'))).toEqual([]);
    expect(svg.match(/<image /g)).toHaveLength(8);
  });
});
