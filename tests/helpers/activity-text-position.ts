/**
 * Shared SVG-inspection helpers for authored activity-fixture tests
 * (mission `activity-divergence-drive-3`, T1d). Extracted so this
 * task's new fixture test doesn't re-declare the SAME small functions
 * `tests/diagrams/activity/layout/snake-text-position-fixtures.test.ts`
 * (T1b) already carries locally -- per `testing.md`'s DRY rule, new
 * test code should not duplicate what a shared helper can hold. T1b's
 * own copies are left as-is (out of this task's write-set).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DeterministicMeasurer } from '../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from './fixture-include-store.js';
import { renderFixtureActivity } from '../oracle/svg-conformance/render-fixture-activity.js';

/** Renders both sides of one `<fixtureRoot>/<name>/{in.puml,in.svg}` pair
 *  -- `in.svg` is the jar's own oracle render (`scripts/oracle-render.sh`),
 *  `ours` is this port's ident render through the SAME deterministic seam
 *  the conformance harness uses. */
export function renderActivityFixture(fixtureRoot: string, name: string): { ours: string; golden: string } {
  const puml = readFileSync(join(fixtureRoot, name, 'in.puml'), 'utf8');
  const golden = readFileSync(join(fixtureRoot, name, 'in.svg'), 'utf8');
  const ours = renderFixtureActivity(puml, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  return { ours, golden };
}

/** The `x`/`y` of the FIRST `<text>` whose content is exactly `label`. */
export function textPosition(svg: string, label: string): { x: number; y: number } {
  const re = new RegExp(`<text x="([^"]*)" y="([^"]*)"[^>]*>${label}</text>`);
  const m = svg.match(re);
  if (m === null) throw new Error(`<text>${label}</text> not found`);
  return { x: Number(m[1]), y: Number(m[2]) };
}

/** The first value of a top-level SVG attribute (e.g. `width`/`height`). */
export function svgAttr(svg: string, name: string): string {
  const m = svg.match(new RegExp(`${name}="([^"]*)"`));
  if (m === null) throw new Error(`${name} not found`);
  return m[1]!;
}

/** Count of `<text>` elements whose content is exactly `label`. */
export function textOccurrences(svg: string, label: string): number {
  const re = new RegExp(`<text[^>]*>${label}</text>`, 'g');
  return (svg.match(re) ?? []).length;
}
