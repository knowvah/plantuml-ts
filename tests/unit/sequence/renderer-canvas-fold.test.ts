/**
 * sdd3-T8g -- the sequence canvas is the page graphic's own `ensureVisible`
 * fold, not the layout box alone.
 *
 * The jar's canvas is a running maximum over every drawn primitive's
 * `ensureVisible`, seeded with the document dimension
 * (`SvgGraphics.java:129-135,142-143`); an arc counts its END point plus its
 * radius (`:854`, `coord[5] + coord[0]`, `coord[6] + coord[1]`), not its ink.
 * The page is ONE `UGraphicSvg` (`renderer-ug.ts#openSequenceGraphic`), so the
 * fold is that graphic's `maxX`/`maxY`, and `renderPaginated` reports it.
 */
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { UPath } from '../../../src/core/klimt/shape/UPath.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { URectangle } from '../../../src/core/klimt/shape/URectangle.js';
import { Back } from '../../../src/core/klimt/Back.js';
import { UStroke } from '../../../src/core/klimt/UStroke.js';
import { Fore } from '../../../src/core/klimt/Fore.js';
import { openSequenceGraphic } from '../../../src/diagrams/sequence/renderer-ug.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { pageTheme } from './draw-markup.js';

const MEASURER = new DeterministicMeasurer();

/** The `<path>` a rounded frame band / a sprite ellipse draws: M, then ARCTO. */
function arcPath(from: readonly [number, number], arcs: readonly (readonly number[])[]): UPath {
  const path = UPath.none();
  path.moveTo(from[0], from[1]);
  for (const [rx, ry, , , , x, y] of arcs) path.arcTo(rx!, ry!, 0, 0, 1, x!, y!);
  return path;
}

const GEBEKI_PUML = `@startuml
scale 2
hide footbox
<style>
sequenceDiagram {
    RoundCorner 40
}
</style>

alt #0f0 successful case
    Bob -> Alice: Authentication Accepted
else #00f Another type of failure
   Bob -> Alice: Please repeat
end
@enduml
`;

const KALUNA_PUML = `@startuml
sprite logo <svg viewBox="0 0 230 230">0
<circle cx="115" cy="102" r="20.5" fill="#61dafb"/>
<ellipse rx="110" ry="42"  cx="115" cy="102" stroke="#61dafb" stroke-width="10" fill="none"/>
<g transform="rotate(60 115 102)">
<ellipse rx="110" ry="42"  cx="115" cy="102" stroke="#61dafb" stroke-width="10" fill="none"/>
</g>
<g transform="rotate(-60 115 102)">
<ellipse rx="110" ry="42"  cx="115" cy="102" stroke="#61dafb" stroke-width="10" fill="none"/>
</g>
</svg>

a->b: <$logo>
@enduml
`;

function viewBoxOf(svg: string): [number, number] {
  const m = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  if (m === null) throw new Error('no viewBox');
  return [Number(m[1]), Number(m[2])];
}

describe('the page graphic folds every drawn primitive (SvgGraphics.java:129-135)', () => {
  it('gebeki: the frame corner arc A20,20 ... 209.625,71 reaches trunc(209.625 + 20 + 1) = 230 (:854)', () => {
    // exportedDimension 228.625 x 181 (journal row 34): the seed alone is trunc(228.625 + 1) = 229.
    const graphic = openSequenceGraphic(pageTheme(), { width: 228.625, height: 181 });
    graphic.ug
      .apply(new Fore('#181818'))
      .apply(new Back('#00FF00'))
      .apply(UStroke.simple())
      .draw(arcPath([189.625, 51], [[20, 20, 0, 0, 1, 209.625, 71]]));
    const { maxX, maxY } = graphic.finish();
    expect([maxX, maxY]).toEqual([230, 182]);
  });

  it('kaluna: the sprite ellipse arc A110,42 ... 252.894,153 reaches trunc(252.894 + 110 + 1) = 363 (:854)', () => {
    // exportedDimension 295.7875 x 340: the seed alone is trunc(295.7875 + 1) = 296.
    const graphic = openSequenceGraphic(pageTheme(), { width: 295.7875, height: 340 });
    graphic.ug
      .apply(new Fore('#61dafb'))
      .apply(new Back('#FFFFFF'))
      .apply(UStroke.simple())
      .draw(
        arcPath(
          [32.894, 153],
          [
            [110, 42, 0, 0, 1, 142.894, 111],
            [110, 42, 0, 0, 1, 252.894, 153],
          ],
        ),
      );
    const { maxX, maxY } = graphic.finish();
    expect([maxX, maxY]).toEqual([363, 341]);
  });

  it('ink inside the seed leaves the fold at trunc(dim + 1) (:129-135, `x > maxX` only)', () => {
    const graphic = openSequenceGraphic(pageTheme(), { width: 228.625, height: 181 });
    graphic.ug.draw(URectangle.build(100, 50));
    const { maxX, maxY } = graphic.finish();
    expect([maxX, maxY]).toEqual([229, 182]);
  });

  it('the exporter margin translate is applied BEFORE the fold sees a coordinate', () => {
    // A 100 x 50 rect at the origin, drawn under (7, 3): its far corner is (107, 53).
    const graphic = openSequenceGraphic(pageTheme(), { width: 0, height: 0 }, new UTranslate(7, 3));
    graphic.ug.draw(URectangle.build(100, 50));
    const { body, maxX, maxY } = graphic.finish();
    expect([maxX, maxY]).toEqual([108, 54]);
    expect(body).toContain('x="7"');
    expect(body).toContain('y="3"');
  });
});

describe('renderPaginated reports the fold (gebeki-18-muci858, kaluna-08-rubu301)', () => {
  it('gebeki: the document is 230 x 2 = 460 wide, the jar canvas (SvgGraphics.java:800-813,854)', () => {
    const [width, height] = viewBoxOf(renderFixtureSequence(GEBEKI_PUML, MEASURER));
    expect([width, height]).toEqual([460, 364]);
  });

  it('kaluna: the document is 363 wide, the jar canvas (SvgGraphics.java:854)', () => {
    const [width, height] = viewBoxOf(renderFixtureSequence(KALUNA_PUML, MEASURER));
    expect([width, height]).toEqual([363, 341]);
  });

  it('kaluna under a title: chrome shifts the page, and the shifted fold still sets the width', () => {
    // The title is narrower than the 285.79 block, so `decorateEntityImage` places the page at x = 0
    // (`xImage = (dimTotal.width - original.width) / 2`) and moves it down by the title height only.
    const plain = viewBoxOf(renderFixtureSequence(KALUNA_PUML, MEASURER));
    const titled = viewBoxOf(renderFixtureSequence(KALUNA_PUML.replace('a->b', 'title T\na->b'), MEASURER));
    expect(titled[0]).toBe(363);
    expect(titled[1]).toBeGreaterThan(plain[1]);
  });

  it('kaluna inside a mainframe: the fold moves right with the page, 363 + the body shift', () => {
    // `BigFrame` places the page at `(originalX + delta.dx + margin.left, ...)`; the fold carries the same offset
    // `shiftFragmentBody` moves the body by, read here off the first participant head (x 10 -> x 20).
    const headX = (svg: string): number => Number(/<rect x="([\d.]+)" y="[\d.]+"[^>]*fill="#E2E2F0"/.exec(svg)![1]);
    const plain = renderFixtureSequence(KALUNA_PUML, MEASURER);
    const framed = renderFixtureSequence(KALUNA_PUML.replace('a->b', 'mainframe M\na->b'), MEASURER);
    const shift = headX(framed) - headX(plain);
    expect(shift).toBe(10);
    expect(viewBoxOf(framed)[0]).toBe(363 + shift);
  });

  it('a chrome row whose ink stays inside its box keeps the seed (hello under a title)', () => {
    const hello = '@startuml\ntitle T\nBob -> Alice : hello\n@enduml\n';
    const bare = '@startuml\nBob -> Alice : hello\n@enduml\n';
    const [bareWidth] = viewBoxOf(renderFixtureSequence(bare, MEASURER));
    expect(viewBoxOf(renderFixtureSequence(hello, MEASURER))[0]).toBe(bareWidth);
  });
});
