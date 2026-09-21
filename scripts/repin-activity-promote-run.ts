/**
 * The error-to-baseline promotion PASS of `repin-activity-baselines.ts`
 * (mission `unknown-bucket-routing-repair`): one live measurer per activity
 * baseline file, each built on the SAME seams the gates use, fed to
 * `repin-activity-promote.ts`'s pure loop. Lives in its own module for the
 * tool's 500-line cap; the tool passes its fixture-loading/rendering seams
 * in so nothing here re-derives them (and there is no import cycle).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from '../tests/oracle/svg-conformance/compare.js';
import {
  censusOf as swimlaneCensusOf,
  layoutFixtureActivity,
} from '../tests/oracle/svg-conformance/swimlane-census.js';
import { censusOf as textCensusOf } from '../tests/oracle/svg-conformance/text-census.js';
import { styleCensusOf } from './repin-activity-style-census.js';
import { promoteErrorRows, measureOrUndefined } from './repin-activity-promote.js';
import type { PromoteRow, PromotedFields } from './repin-activity-promote.js';

export interface PromotionSeams {
  readonly goldensDir: string;
  readonly readFixture: (slug: string) => { markup: string; golden: string };
  readonly renderOurs: (markup: string) => string;
}

export interface PromotionContext {
  readonly write: boolean;
  readonly today: string;
  readonly commit: string;
}

function promotionMeasurers(seams: PromotionSeams): ReadonlyArray<{
  file: string;
  perFixture: boolean;
  measure: (slug: string) => PromotedFields;
}> {
  const both = (slug: string) => {
    const { markup, golden } = seams.readFixture(slug);
    return { ours: seams.renderOurs(markup), golden, markup };
  };
  return [
    {
      file: 'diff-baseline.json',
      perFixture: true,
      measure: (slug) => {
        const { ours, golden } = both(slug);
        const { diffs } = compareSvg(ours, golden, 'deterministic');
        return { weightedScore: weightedScore(diffs), diffCount: diffs.length };
      },
    },
    {
      file: 'style-baseline.json',
      perFixture: true,
      measure: (slug) => {
        const { ours, golden } = both(slug);
        return { ours: styleCensusOf(ours), jar: styleCensusOf(golden) };
      },
    },
    {
      file: 'text-baseline.json',
      perFixture: true,
      measure: (slug) => {
        const { ours, golden } = both(slug);
        return { ours: textCensusOf(ours), jar: textCensusOf(golden) };
      },
    },
    {
      file: 'swimlane-baseline.json',
      perFixture: false,
      measure: (slug) => {
        const { ours, golden, markup } = both(slug);
        const geometry = layoutFixtureActivity(markup, new DeterministicMeasurer(), {
          includeStore: fixtureIncludeStore(),
        });
        return {
          ours: swimlaneCensusOf(ours, geometry.lanes),
          jar: swimlaneCensusOf(golden),
          laneCount: geometry.laneCount,
        };
      },
    },
  ];
}

export function processPromotions(ctx: PromotionContext, seams: PromotionSeams): number {
  let n = 0;
  for (const m of promotionMeasurers(seams)) {
    const path = join(seams.goldensDir, m.file);
    const data = JSON.parse(readFileSync(path, 'utf8')) as { fixtures: PromoteRow[] };
    const dates = { today: ctx.today, commit: ctx.commit, perFixture: m.perFixture };
    const promoted = promoteErrorRows(data.fixtures, (slug) => measureOrUndefined(() => m.measure(slug)), dates, {
      label: m.file.replace('.json', ''),
      write: ctx.write,
    });
    n += promoted.length;
    if (ctx.write && promoted.length > 0) writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  }
  return n;
}
