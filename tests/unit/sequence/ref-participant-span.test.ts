/**
 * sdd1 T3c — a `ref over` spanning two participants pushes them apart by its
 * component's preferred width, in the REFERENCE style's fonts.
 *
 * `ReferenceTile#init` (`teoz/ReferenceTile.java:93-115`):
 * `last.ensureBiggerThan(first.addFixed(dim.getWidth()))`, with `dim` the
 * preferred dimension of the same `ComponentRoseReference` the tile draws,
 * built from `reference.getUsedStyles()` (`Reference.java:99-102`). Its
 * width is `max(text width, header width) + 2 * xMargin + deltaShadow`
 * (`ComponentRoseReference.java:155-159`). Every expected value was read off
 * the oracle jar (`scripts/oracle-render.sh`, 2026-10-20) on the same source.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const BODY = 'participant Alice\nparticipant Bob\nref over Alice, Bob : a fairly long reference body text';

/** The `x` of every participant head `<rect>` (the ones with a fill). */
function headXs(source: string): string[] {
  const svg = renderFixtureSequence(`@startuml\n${source}\n@enduml`, new DeterministicMeasurer());
  return [...svg.matchAll(/<rect x="([^"]+)" y="10"[^>]*fill="#E2E2F0"/g)].map((m) => m[1]!);
}

describe('ref over — participant span', () => {
  it('spans the default skin at reference FontSize 12 (plantuml.skin:156)', () => {
    expect(headXs(BODY)).toEqual(['10', '150.238']);
  });

  it('spans at the <style> reference FontSize', () => {
    expect(headXs(`<style>\nreference {\n  FontSize 20\n}\n</style>\n${BODY}`)).toEqual(['10', '261.688']);
  });

  it('spans a skinparam shadowing true ref as the jar does', () => {
    expect(headXs(`skinparam shadowing true\n${BODY}`)).toEqual(['10', '150.238']);
  });
});
