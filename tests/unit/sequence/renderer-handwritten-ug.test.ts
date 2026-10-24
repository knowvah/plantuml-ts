/**
 * sdd3-T8f: a `skinparam handwritten true` sequence page is drawn through
 * `UGraphicHandwritten`, wrapped where `TextBlockExporter.java:172-175` wraps
 * it. Every expected value is quoted from the jar's `in.svg` of the named
 * fixture (`test-results/dot-cache/sequence/<slug>/in.svg`).
 *
 * `UGraphicHandwritten.java:54` gives each INSTANCE a fresh `Random(424242L)`
 * and `:114-116` makes `apply` return a NEW instance, so a shape's jiggle is
 * decided by the draws made on the instance its last `apply` produced. The
 * golden coordinates below therefore only come out when (1) every shape is
 * drawn on a fresh `apply` result and (2) a note's polygon and fold corner share
 * one (`ComponentRoseNote.java:121-124`): the corner's `L229.19,72` is the
 * SECOND point-stream of that instance, not a fresh one.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { defaultTheme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { UGraphicHandwritten } from '../../../src/core/klimt/drawing/hand/UGraphicHandwritten.js';
import { UGraphicSvg } from '../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { Fore } from '../../../src/core/klimt/Fore.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { ULine } from '../../../src/core/klimt/shape/ULine.js';
import { renderSync } from '../../../src/index.js';
import { openSequenceGraphic, pageThemeOf } from '../../../src/diagrams/sequence/renderer-ug.js';

const measurer = new DeterministicMeasurer();
const fixtureSource = (slug: string): string => readFileSync(`test-results/dot-cache/sequence/${slug}/in.puml`, 'utf8');
const renderFixture = (slug: string): string => renderSync(fixtureSource(slug), { measurer });

const handwrittenTheme = pageThemeOf({ ...defaultTheme, handwritten: true }, measurer);
const plainTheme = pageThemeOf(defaultTheme, measurer);

describe('openSequenceGraphic wraps only a handwritten page (TextBlockExporter.java:174-175)', () => {
  it('wraps the page graphic in a UGraphicHandwritten when theme.handwritten', () => {
    const { ug } = openSequenceGraphic(handwrittenTheme, { width: 0, height: 0 });
    expect(ug).toBeInstanceOf(UGraphicHandwritten);
  });

  it('builds no decorator for a non-handwritten theme, or handwritten false', () => {
    const off = pageThemeOf({ ...defaultTheme, handwritten: false }, measurer);
    for (const theme of [plainTheme, off]) {
      const { ug } = openSequenceGraphic(theme, { width: 0, height: 0 });
      expect(ug).toBeInstanceOf(UGraphicSvg);
      expect(ug).not.toBeInstanceOf(UGraphicHandwritten);
    }
  });

  it('jiggles the lifeline exactly as the golden: pafene-01-tedi758 `path d` (a vline on its own apply)', () => {
    // golden: <path d="M34.106,59 L34.386,59 L33.554,68.4 L34.364,77.8 L34.639,87.2 L33.155,96.6 L34.106,106"
    const graphic = openSequenceGraphic(handwrittenTheme, { width: 0, height: 0 });
    graphic.ug.apply(new Fore('#181818')).apply(new UTranslate(34.106, 59)).draw(ULine.vline(47));
    expect(graphic.finish().body).toContain(
      'M34.106,59 L34.386,59 L33.554,68.4 L34.364,77.8 L34.639,87.2 L33.155,96.6 L34.106,106',
    );
  });

  it('two draws on ONE instance continue the stream; on a re-applied one they restart (:54,:114-116)', () => {
    const line = (): ULine => ULine.vline(47);
    const shared = openSequenceGraphic(handwrittenTheme, { width: 0, height: 0 });
    const onOne = shared.ug.apply(new Fore('#181818'));
    onOne.draw(line());
    onOne.draw(line());
    const fresh = openSequenceGraphic(handwrittenTheme, { width: 0, height: 0 });
    fresh.ug.apply(new Fore('#181818')).draw(line());
    fresh.ug.apply(new Fore('#181818')).draw(line());
    const paths = (body: string): string[] => [...body.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]!);
    const [a, b] = paths(shared.finish().body);
    const [c, d] = paths(fresh.finish().body);
    expect(a).toBe(c);
    expect(c).toBe(d);
    expect(b).not.toBe(a);
  });
});

describe('the four handwritten targets through the page graphic', () => {
  it('pafene-01-tedi758: the banner is wrapped (golden `rect[1]` is a jiggled polygon) and the lifeline path matches', () => {
    const svg = renderFixture('pafene-01-tedi758');
    // golden: the first element after <g font-family=...> is the banner polygon
    expect(svg).toContain('<polygon points="10.5,8,10.5,8.21,20.373,7.586,30.245,8.193,40.118,8.4,');
    expect(svg).toContain('fill="#FFC"');
    expect(svg).toContain('M34.106,59 L34.386,59 L33.554,68.4 L34.364,77.8 L34.639,87.2 L33.155,96.6 L34.106,106');
  });

  it('jefoke-95-jara779: an arrow head polygon is jiggled from its tip', () => {
    // golden polygon[1]: points="141.394,96,141.42,96.065,143.342,96.672,145.418,97.66,..."
    expect(renderFixture('jefoke-95-jara779')).toContain(
      'points="141.394,96,141.42,96.065,143.342,96.672,145.418,97.66,',
    );
  });

  it('gepuce-64-pivu656: an arrow head polygon is jiggled (a scale 0.50 page)', () => {
    // golden polygon[2]: points="82.562,59.5,82.576,59.533,83.537,59.836,84.574,60.33,..."
    expect(renderFixture('gepuce-64-pivu656')).toContain(
      'points="82.562,59.5,82.576,59.533,83.537,59.836,84.574,60.33,',
    );
  });

  it('menoke-22-luxo044: the note body and its fold corner share one decorator (ComponentRoseNote.java:121-124)', () => {
    const svg = renderFixture('menoke-22-luxo044');
    // golden path[1] (body) and path[2] (corner): the corner continues the body's stream
    expect(svg).toContain('d="M57.681,72 L58.242,72 L56.576,82.105 L58.197,92.211 L58.747,102.316 L55.779,112.');
    expect(svg).toContain('d="M229.681,72 L229.19,72 L230.23,74 L230.112,76 L229.899,78 L229.723,80 L229.681,8');
  });

  it('a non-handwritten document keeps its plain shapes (no decorator)', () => {
    const svg = renderSync('@startuml\nAlice -> Bob: hi\nnote right: n\n@enduml', { measurer });
    expect(svg).toContain('<line x1="32.225" y1="66" x2="77.919" y2="66" ');
    expect(svg).toContain('d="M88.919,52 L88.919,75 L116.919,75 L116.919,62 L106.919,52 L88.919,52"');
    expect(svg).toContain('<polygon points="71.919,62,81.919,66,71.919,70,75.919,66"');
  });
});
