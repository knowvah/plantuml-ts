/**
 * sdd1 T3c — the participant row is spaced by each message's ARROW-style
 * label width.
 *
 * `CommunicationTile#addConstraints` (`teoz/CommunicationTile.java:404-429`)
 * demands `comp.getPreferredDimension().getWidth()` between the two
 * lifelines, and the component is `skin.createComponentArrow(message
 * .getUsedStyles(), …)` (`:153-166`), whose text block is built in
 * `getFontConfiguration()` = the arrow style's font
 * (`skin/AbstractTextualComponent.java:80-92`). So a non-default arrow
 * `FontSize` widens the row, whether it arrives through `<style>` or through
 * `skinparam arrowFontSize` (`FromSkinparamToStyle.java`). Every expected
 * value was read off the oracle jar (`scripts/oracle-render.sh`, 2026-10-20)
 * on the same source.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const MESSAGE = 'Alice -> Bob : hello world, a long label';

/** The `x` of every participant head `<rect>` (the ones with a fill). */
function headXs(source: string): string[] {
  const svg = renderFixtureSequence(`@startuml\n${source}\n@enduml`, new DeterministicMeasurer());
  return [...svg.matchAll(/<rect x="([^"]+)" y="10"[^>]*fill="#E2E2F0"/g)].map((m) => m[1]!);
}

describe('participant spacing — message label font', () => {
  it('spaces the default skin at arrow FontSize 13 (plantuml.skin:317)', () => {
    expect(headXs(MESSAGE)).toEqual(['10', '172.687']);
  });

  it('spaces at the <style> arrow FontSize', () => {
    expect(headXs(`<style>\narrow {\n  FontSize 20\n}\n</style>\n${MESSAGE}`)).toEqual(['10', '245.881']);
  });

  it('spaces at skinparam arrowFontSize, which reaches the arrow style', () => {
    expect(headXs(`skinparam arrowFontSize 20\n${MESSAGE}`)).toEqual(['10', '245.881']);
  });
});
