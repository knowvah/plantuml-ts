/**
 * The skinparams that used to feed the deleted `Theme` sequence fields
 * (`colors.lifeline`, `colors.frame`, `colors.graph.sequenceShadowing`) still
 * land through the per-event `Style` path (`plantuml.skin` via
 * `FromSkinparamToStyle`). `participantBackgroundColor` is already pinned by
 * `participant-background.test.ts` and `participant-style-paint.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { tagsOf } from '../../helpers/svg-tags.js';

/** The jar's short form of `Red` (`HColorSet`). */
const RED = '#F00';
const BODY = 'Alice -> Bob : hi\nactivate Bob\nBob --> Alice\ndeactivate Bob';
const GROUP_BODY = 'Alice -> Bob : hi\nalt cond\nBob --> Alice : back\nend';

function render(skinparams: string, body: string): string {
  return renderSync(`@startuml\n${skinparams}\n${body}\n@enduml`);
}

describe('skinparams formerly fed to deleted Theme sequence fields', () => {
  it('sequenceLifeLineBorderColor paints the lifeline stroke', () => {
    const plain = render('', BODY);
    const red = render('skinparam sequenceLifeLineBorderColor Red', BODY);
    const strokes = (svg: string): (string | undefined)[] => tagsOf(svg, 'line').map((l) => l['stroke']);
    expect(strokes(plain)).not.toContain(RED);
    expect(strokes(red)).toContain(RED);
  });

  it('sequenceGroupBorderColor paints the group frame stroke', () => {
    const plain = render('', GROUP_BODY);
    const red = render('skinparam sequenceGroupBorderColor Red', GROUP_BODY);
    const strokes = (svg: string): (string | undefined)[] => tagsOf(svg, 'rect').map((r) => r['stroke']);
    expect(strokes(plain)).not.toContain(RED);
    expect(strokes(red)).toContain(RED);
  });

  it('shadowing true adds the drop-shadow filter to the participants', () => {
    const plain = render('', BODY);
    const shadowed = render('skinparam shadowing true', BODY);
    expect(plain).not.toContain('<filter');
    expect(shadowed).toContain('<filter');
  });
});
