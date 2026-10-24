/**
 * sdd3-T8c: a participant head, footer and created head are drawn through the
 * page's `UGraphic`. A recording graphic logs, per draw, the chain of `apply`s
 * on the instance that drew (`tests/helpers/recording-ugraphic.ts`), pinning
 * each `draw<X>` against the Java lines it mirrors.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  drawCreatedHead,
  drawFooterBox,
  drawParticipantBox,
} from '../../../src/diagrams/sequence/renderer-participant-shapes.js';
import { drawParticipantSymbol } from '../../../src/diagrams/sequence/renderer-participant-symbol.js';
import { drawMarkup } from './draw-markup.js';
import { pageThemeOf } from '../../../src/diagrams/sequence/renderer-ug.js';
import { paintOfGeo } from '../../../src/diagrams/sequence/sequence-participant-paints.js';
import type { ParticipantGeo, ParticipantType } from '../../../src/diagrams/sequence/ast.js';
import type { TextRun } from '../../../src/diagrams/sequence/text-block-geo.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { record, type RecordedEvent } from '../../helpers/recording-ugraphic.js';
import { attrsOf, tagsOf } from '../../helpers/svg-tags.js';

const MEASURER = new DeterministicMeasurer();
const THEME = pageThemeOf(defaultTheme, MEASURER);

/** The default skin's participant ink (`plantuml.skin`): `LineColor`,
 *  `BackGroundColor`, `LineThickness 0.5`. */
const BOX_CHAIN = ['fore(#181818)', 'back(#E2E2F0)', 'stroke(0,0,0.5)'];
const URL = { url: 'http://example.com/a', tooltip: '' };

const label = (text: string, x: number, y: number): TextRun => ({
  text,
  x,
  y,
  textWidth: 20,
  textAscent: 11,
  textLineHeight: 16,
});

function geo(type: ParticipantType, over: Partial<ParticipantGeo> = {}): ParticipantGeo {
  return {
    id: 'A',
    display: 'Al',
    type,
    x: 10,
    y: 10,
    width: 60,
    height: 40,
    centerX: 40,
    background: '#FFF',
    border: '#181818',
    labelRuns: [label('Al', 25, 35)],
    ...over,
  };
}

const drawnKinds = (log: readonly RecordedEvent[]): string[] =>
  log.map((e) => ('draw' in e ? e.draw : 'startUrl' in e ? `url(${e.startUrl})` : 'closeUrl'));

describe('drawParticipantBox (LivingSpace.java:190-215, ComponentRoseParticipant.java:86-119)', () => {
  it('draws a participant as its rectangle (margin translate, fore, back, stroke) and THEN its text', () => {
    // :99-112: `ug.apply(UTranslate(margin))`, `apply(foregroundColor)`, `apply(back.bg())`,
    // `apply(stroke)`, `ug.draw(rect)`, then the text block.
    expect(record(MEASURER, (ug) => drawParticipantBox(ug, geo('participant'), THEME))).toEqual([
      { draw: 'URectangle(60,40)', chain: ['translate(10,10)', 'translate(0,0)', ...BOX_CHAIN] },
      { draw: 'UText(Al)', chain: ['translate(25,35)'] },
    ]);
  });

  it('draws a collections head as two rectangles, the first dx(4), the second on its dy(4) child', () => {
    // :105-109: `ug.apply(UTranslate.dx(delta)).draw(rect); ug = ug.apply(UTranslate.dy(delta)); ug.draw(rect)`.
    const base = ['translate(10,10)', 'translate(0,0)', ...BOX_CHAIN];
    expect(record(MEASURER, (ug) => drawParticipantBox(ug, geo('collections'), THEME))).toEqual([
      { draw: 'URectangle(56,36)', chain: [...base, 'translate(4,0)'] },
      { draw: 'URectangle(56,36)', chain: [...base, 'translate(0,4)'] },
      { draw: 'UText(Al)', chain: ['translate(25,35)'] },
    ]);
  });

  it('draws the label BEFORE the glyph for a database, the glyph on the shared graphic at dx(delta)', () => {
    // ComponentRoseDatabase.java:81-88: `textBlock.drawU(...)` in both arms of `head`, then
    // `stickman.drawU(ug.apply(UTranslate.dx(delta)))`; delta = (60 - 36) / 2.
    const log = record(MEASURER, (ug) => drawParticipantBox(ug, geo('database'), THEME));
    expect(drawnKinds(log)).toEqual(['UText(Al)', 'UPath', 'UPath', 'UEmpty']);
    expect(log[1]).toEqual({ draw: 'UPath', chain: ['translate(10,10)', 'translate(12,0)', ...BOX_CHAIN] });
  });

  it('draws the glyph BEFORE the label for a queue (ComponentRoseQueue.java:75-80: glyph only)', () => {
    expect(drawnKinds(record(MEASURER, (ug) => drawParticipantBox(ug, geo('queue'), THEME)))).toEqual([
      'UPath',
      'UPath',
      'UText(Al)',
    ]);
  });

  it.each(['actor', 'boundary', 'control', 'entity', 'database', 'queue', 'collections', 'participant'] as const)(
    'draws a %s head on the shared graphic: its label and at least one shape',
    (type) => {
      const log = record(MEASURER, (ug) => drawParticipantBox(ug, geo(type), THEME));
      expect(drawnKinds(log)).toContain('UText(Al)');
      expect(log.filter((e) => 'draw' in e && e.draw !== 'UText(Al)').length).toBeGreaterThan(0);
      // every shape of the glyph is under the head's translate, on a chain of its own
      expect(log.every((e) => !('draw' in e) || e.chain.length > 0)).toBe(true);
    },
  );

  it('draws the label of a glyph kind at the layout x, shifted by the head/foot dy only', () => {
    // The footer's translate: the same run at `footerShapeY`; a glyph kind's label sits ABOVE
    // the glyph at the tail (`:84-86`), a participant's keeps its offset in the box.
    const footer = record(MEASURER, (ug) => drawFooterBox(ug, geo('participant'), 200, THEME));
    expect(footer).toEqual([
      { draw: 'URectangle(60,40)', chain: ['translate(10,200)', 'translate(0,0)', ...BOX_CHAIN] },
      { draw: 'UText(Al)', chain: ['translate(25,225)'] },
    ]);
    const tail = record(MEASURER, (ug) => drawFooterBox(ug, geo('database'), 200, THEME));
    expect(tail[1]).toEqual({ draw: 'UPath', chain: ['translate(10,200)', 'translate(12,-6)', ...BOX_CHAIN] });
  });
});

describe('the circled-character spot and the sprite badge (CircledCharacter.java:65-74)', () => {
  const spot = {
    kind: 'char' as const,
    color: '#ADD1B2',
    width: 22,
    height: 22,
    character: 'C',
    fontSize: 17,
  };

  it('draws the ellipse, then the UCenteredCharacter at translate(r, r) in the font colour', () => {
    // :66-71: `ug.apply(spotBorder)`, `apply(spotBackColor.bg())`, `draw(UEllipse(2r, 2r))`,
    // `ug.apply(fontColor)`, `apply(UTranslate(r, r))`, `draw(UCenteredCharacter)`; the head
    // component reset to `UStroke.simple()` before its text (ComponentRoseParticipant.java:112).
    const log = record(MEASURER, (ug) => drawParticipantBox(ug, geo('participant', { badge: spot }), THEME));
    const origin = ['translate(17,24)', 'stroke(0,0,1)', 'fore(#181818)', 'back(#ADD1B2)'];
    expect(log.slice(1)).toEqual([
      { draw: 'UEllipse(22,22)', chain: origin },
      { draw: 'UCenteredCharacter(C,17)', chain: [...origin, 'fore(#000000)', 'translate(11,11)'] },
      { draw: 'UText(Al)', chain: ['translate(25,35)'] },
    ]);
  });

  it('draws a sprite badge as a UImage at the text block origin, before the label', () => {
    const badge = { kind: 'sprite' as const, dataUri: 'data:image/png;base64,AA==', width: 12, height: 10 };
    const log = record(MEASURER, (ug) => drawParticipantBox(ug, geo('participant', { badge }), THEME));
    expect(log.slice(1)).toEqual([
      { draw: 'UImage(12,10)', chain: ['translate(17,24)'] },
      { draw: 'UText(Al)', chain: ['translate(25,35)'] },
    ]);
  });
});

describe('the badge origin (TextBlockSprited.java:65-77)', () => {
  const sprite = { kind: 'sprite' as const, dataUri: 'data:image/png;base64,AA==', width: 12, height: 10 };
  const originOf = (log: readonly RecordedEvent[]): string[] | undefined => {
    const image = log.find((e) => 'draw' in e && e.draw === 'UImage(12,10)');
    return image !== undefined && 'chain' in image ? [...image.chain] : undefined;
  };

  it('puts a glyph-kind badge BADGE_GAP left of its leftmost label run', () => {
    // database head: the label rides below the 46-high glyph; the badge is left of the rows.
    const log = record(MEASURER, (ug) => drawParticipantBox(ug, geo('database', { badge: sprite }), THEME));
    expect(originOf(log)).toEqual(['translate(7,24)']);
  });

  it('centres a badge with no label beside it in the box, at the padding-based x', () => {
    const log = record(MEASURER, (ug) =>
      drawParticipantBox(ug, geo('participant', { badge: sprite, labelRuns: [] }), THEME),
    );
    // x = box x 10 + the style's Padding left 7; y = 10 + (40 - 10) / 2.
    expect(originOf(log)).toEqual(['translate(17,25)']);
  });
});

describe('the head url (LivingSpace.java:205-212)', () => {
  it('wraps the WHOLE component -- shapes and label -- in startUrl/closeUrl, head and foot each', () => {
    const p = geo('participant', { url: URL });
    expect(drawnKinds(record(MEASURER, (ug) => drawParticipantBox(ug, p, THEME)))).toEqual([
      `url(${URL.url})`,
      'URectangle(60,40)',
      'UText(Al)',
      'closeUrl',
    ]);
    expect(drawnKinds(record(MEASURER, (ug) => drawFooterBox(ug, p, 200, THEME)))).toEqual([
      `url(${URL.url})`,
      'URectangle(60,40)',
      'UText(Al)',
      'closeUrl',
    ]);
  });

  it('draws a created head at its tile top inside its url', () => {
    const head = { participant: geo('participant', { url: URL }), y: 100 };
    const log = record(MEASURER, (ug) => drawCreatedHead(ug, head, THEME));
    expect(log[1]).toEqual({
      draw: 'URectangle(60,40)',
      chain: ['translate(10,100)', 'translate(0,0)', ...BOX_CHAIN],
    });
    expect(drawnKinds(log)[0]).toBe(`url(${URL.url})`);
    expect(drawnKinds(log).at(-1)).toBe('closeUrl');
  });

  it('opens no link for a participant without a url', () => {
    expect(drawnKinds(record(MEASURER, (ug) => drawParticipantBox(ug, geo('participant'), THEME)))).toEqual([
      'URectangle(60,40)',
      'UText(Al)',
    ]);
  });
});

describe('no private document in the glyph module (renderer-participant-symbol.ts)', () => {
  it('draws on whatever graphic it is given, not a private UGraphicSvg', () => {
    const log = record(MEASURER, (ug) =>
      drawParticipantSymbol(
        ug,
        'database',
        { x: 100, y: 59, width: 136, height: 66, paint: paintOfGeo({ type: 'database' }) },
        { head: true, display: '', theme: THEME },
      ),
    );
    expect(log).toEqual([
      { draw: 'UPath', chain: ['translate(100,59)', 'translate(50,0)', ...BOX_CHAIN] },
      { draw: 'UPath', chain: ['translate(100,59)', 'translate(50,0)', ...BOX_CHAIN, 'back(none)'] },
      { draw: 'UEmpty', chain: ['translate(100,59)', 'translate(50,0)', ...BOX_CHAIN, 'translate(36,46)'] },
    ]);
  });

  it('keeps no UGraphicSvg, document or id-normalising copy of its own', () => {
    const source = readFileSync('src/diagrams/sequence/renderer-participant-symbol.ts', 'utf8');
    expect(source).not.toMatch(/UGraphicSvg|getSvgString|glyphContent|extractFlatContent/);
  });
});

describe('the markup a head leaves on the page graphic', () => {
  it('writes the box, the label and the link as the jar does', () => {
    const svg = drawMarkup((ug) => drawParticipantBox(ug, geo('participant', { url: URL }), THEME), THEME);
    expect(svg.startsWith('<a ')).toBe(true);
    expect(attrsOf(/<a [^>]*>/.exec(svg)![0])).toMatchObject({ target: '_top', href: URL.url });
    expect(tagsOf(svg, 'rect')[0]).toMatchObject({ x: '10', y: '10', width: '60', height: '40', fill: '#E2E2F0' });
    expect(tagsOf(svg, 'text')[0]).toMatchObject({ x: '25', y: '35', fill: '#000', 'font-size': '14' });
    expect(svg.endsWith('</a>')).toBe(true);
  });
});
