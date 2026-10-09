/**
 * add4-T1b (D3): `skinparam swimlaneWidth` A/B, against the jar.
 *
 * Expected divider x values were read from oracle renders of
 * `tests/fixtures/activity/add4-T1b/swimw-*.puml` via
 * `scripts/oracle-render.sh` (1.2026.8beta1, deterministic text). In the
 * jar 100, 400, 9000, `same` and the block form `swimlane { width same }`
 * are byte-identical: `Swimlanes.java:399-409` does floor every lane, but
 * the floor's padding all lands to the RIGHT of each `LaneDivider`'s
 * `UEmpty` (`:331,345-346`) and `CompressionXorYBuilder`'s `smaller(5)`
 * (`klimt/compress/CompressionXorYBuilder.java:66`) collapses every such
 * gap to 10.
 *
 * Padded fixtures' absolute offset (jar 33, not 20) is the title band's
 * `UTranslate.dx(5)` anchor (`Swimlanes.java:358-367`), threaded into
 * `computeSwimlaneChrome`'s two callers by add4-T1g
 * (`swimlane-chrome.test.ts` covers the band itself).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../../oracle/svg-conformance/render-fixture-activity.js';

const DIR = join(import.meta.dirname, '../../../fixtures/activity/add4-T1b');

/** x1 of every full-height divider (the ones starting at the band top). */
function dividerXs(name: string, y2 = '258.5'): number[] {
  const svg = renderFixtureActivity(readFileSync(join(DIR, name), 'utf8'), new DeterministicMeasurer());
  const lines = svg.match(new RegExp(`<line [^>]*y1="17.5"[^>]*y2="${y2}"[^>]*>`, 'g')) ?? [];
  return lines.map((l) => Number(/x1="([^"]*)"/.exec(l)![1]));
}

// isw-T2-act: re-read from one-JVM `scripts/oracle-render.sh` renders of
// each fixture under seam #4 (spaces non-zero), 2026-10-09: the lane
// titles' `" "` and the special lane's `""` title (one space) move the
// later dividers.
const JAR_UNPADDED = [20, 58.338, 255.662, 293.662];
const JAR_PADDED = [33, 80.675, 289, 336];

describe('swimlaneWidth A/B fixtures — divider x vs the jar', () => {
  it.each(['swimw-absent.puml', 'swimw-0.puml'])('%s: no floor, dividers exact', (name) => {
    expect(dividerXs(name)).toEqual(JAR_UNPADDED);
  });

  it('wide titles: divider half-margins widen, dividers exact', () => {
    expect(dividerXs('swimw-wide-titles.puml')).toEqual([20, 330.938, 367.613, 595.637]);
  });

  it.each(['swimw-100.puml', 'swimw-400.puml', 'swimw-9000.puml', 'swimw-same.puml', 'swimw-block-same.puml'])(
    '%s: any floor compresses to the same dividers as the jar',
    (name) => {
      expect(dividerXs(name)).toEqual(JAR_PADDED);
    },
  );
});

/**
 * add4-T1b (LANE-INK): an `elseif` chain's `ConnectionHline`
 * (`FtileIfLongHorizontal.java:476-547`, `super(null, null)`) is measured
 * into EVERY lane the tile touches (`UGraphicInterceptorAllSwimlanes
 * .java:88-101`), so a lane whose only content sits left of the merge bar
 * still widens to the bar's `getMinmaxSimple` extent. Jar values from
 * `scripts/oracle-render.sh` on the `laneink-*.puml` fixtures; `d` is the
 * nojije-35-teta491 shape, `g`/`h` the zeporo-46-zicu301 shape.
 */
describe('elseif ConnectionHline lane ink — divider x vs the jar', () => {
  it('laneink-d: elseif branch with a point out', () => {
    expect(dividerXs('laneink-d.puml', '320.556')).toEqual([20, 94.3, 318.816]);
  });

  it('laneink-g: nested if (else) under an elseif', () => {
    expect(dividerXs('laneink-g.puml', '452.056')).toEqual([20, 157.6, 404.5]);
  });

  it('laneink-h: nested if (no else) under an elseif', () => {
    expect(dividerXs('laneink-h.puml', '452.056')).toEqual([20, 157.6, 403.381]);
  });

  it('laneink-e: no branch has a point out, so no bar and no widening', () => {
    expect(dividerXs('laneink-e.puml', '[0-9.]+')).toEqual([20, 146.6, 353.116]);
  });
});

/**
 * add4-T1b: `ConnectionLastElseOut`/`ConnectionVerticalOut` are
 * `super(tile, null)` (`FtileIfLongHorizontal.java:359,444`): drawn in the
 * tile's own out lane and skipped by `Swimlanes$Cross` (`:189-193`), so an
 * `else` branch in another lane drops straight onto the merge bar instead
 * of being cross-lane-routed back to the diamonds' lane. Jar lines from
 * `scripts/oracle-render.sh` on `lastelse-out-xlane.puml` (the
 * jucidi-98-zato093 markup).
 */
describe('cross-lane else branch exit', () => {
  it('drops straight down from the else tile to the bar, like the jar', () => {
    const svg = renderFixtureActivity(
      readFileSync(join(DIR, 'lastelse-out-xlane.puml'), 'utf8'),
      new DeterministicMeasurer(),
    );
    // isw-T2-act: x 303.1 from a seam-#4 one-JVM render of the fixture.
    const at = (x: string): string[] => svg.match(new RegExp(`<line x1="${x}"[^>]*>`, 'g')) ?? [];
    const ys = at('303.1').map((l) => /y1="([^"]*)" x2="([^"]*)" y2="([^"]*)"/.exec(l)!.slice(1));
    expect(ys).toContainEqual(['211.5', '303.1', '231.5']);
    expect(ys).not.toContainEqual(['211.5', '303.1', '216.5']);
  });
});
