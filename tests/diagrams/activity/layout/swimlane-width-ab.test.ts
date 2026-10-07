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
 * Padded fixtures assert lane SPACING only: their absolute offset (jar 33
 * vs ours 20) is the title band's `UTranslate.dx(5)` anchor
 * (`Swimlanes.java:358-367`), which needs the block origin threaded into
 * `computeSwimlaneChrome`'s two callers -- outside this task's write-set,
 * see `.agent-notes/add4-T1b.md`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../../oracle/svg-conformance/render-fixture-activity.js';

const DIR = join(import.meta.dirname, '../../../fixtures/activity/add4-T1b');

/** x1 of every full-height divider (the ones starting at the band top). */
function dividerXs(name: string): number[] {
  const svg = renderFixtureActivity(readFileSync(join(DIR, name), 'utf8'), new DeterministicMeasurer());
  const lines = svg.match(/<line [^>]*y1="17.5"[^>]*y2="258.5"[^>]*>/g) ?? [];
  return lines.map((l) => Number(/x1="([^"]*)"/.exec(l)![1]));
}

function spacing(xs: readonly number[]): number[] {
  return xs.slice(1).map((x, i) => Number((x - xs[i]!).toFixed(3)));
}

const JAR_UNPADDED = [20, 58.338, 239.163, 277.163];
const JAR_PADDED = [33, 80.675, 272.5, 319.5];

describe('swimlaneWidth A/B fixtures — divider x vs the jar', () => {
  it.each(['swimw-absent.puml', 'swimw-0.puml'])('%s: no floor, dividers exact', (name) => {
    expect(dividerXs(name)).toEqual(JAR_UNPADDED);
  });

  it('wide titles: divider half-margins widen, dividers exact', () => {
    expect(dividerXs('swimw-wide-titles.puml')).toEqual([20, 296.288, 332.963, 541.188]);
  });

  it.each(['swimw-100.puml', 'swimw-400.puml', 'swimw-9000.puml', 'swimw-same.puml', 'swimw-block-same.puml'])(
    '%s: any floor compresses to the same lane spacing as the jar',
    (name) => {
      expect(spacing(dividerXs(name))).toEqual(spacing(JAR_PADDED));
    },
  );
});
