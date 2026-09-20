/**
 * Default participant-head fill, pinned against the jar.
 *
 * Every sequence participant kind resolves its background through the style
 * signature `root, element, sequenceDiagram, <kind>`
 * (`sequencediagram/ParticipantType.java:55-80`), and `plantuml.skin:197-201`
 * sets `BackgroundColor: var(--grey-blue)` for all eight kinds, with
 * `--grey-blue: #e2e2f0` at `plantuml.skin:4`. `skin/rose/Rose.java:138-150`
 * builds `ComponentRoseParticipant` from those styles and the component takes
 * `biColor.getBackColor()` (`ComponentRoseParticipant.java:82`).
 *
 * The port used to fall back to the CANVAS colour (`theme.colors.background`,
 * `#FFFFFF`) when no per-kind bucket was set, which is both the white-by-
 * default defect and the `skinparam backgroundColor` cascade defect — one
 * fallback, two symptoms. Jar-measured 2026-09-19 on all eight kinds: 18
 * fills of `#E2E2F0` against this port's 18 of `#FFF`, same shapes.
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';

const JAR_PARTICIPANT_FILL = '#E2E2F0';
const HEAD_RECT = /<rect [^>]*stroke="#[0-9A-Fa-f]+"[^>]*>/g;

function headFills(source: string): string[] {
  const svg = renderSync(source);
  return [...svg.matchAll(HEAD_RECT)].map((m) => /fill="([^"]*)"/.exec(m[0])?.[1] ?? '');
}

describe('sequence participant background', () => {
  it('fills every head with the skin grey-blue by default', () => {
    const fills = headFills('@startuml\nAlice -> Bob : hello\n@enduml');
    expect(fills).toEqual(Array(4).fill(JAR_PARTICIPANT_FILL));
  });

  it('fills all eight participant kinds the same way', () => {
    const src =
      '@startuml\nparticipant P\nactor A\nboundary B\ncontrol C\nentity E\nqueue Q\ndatabase D\ncollections L\nP -> A : hi\n@enduml';
    const svg = renderSync(src);
    const fills = [...svg.matchAll(/fill="(#[0-9A-Fa-f]{3,6})"/g)].map((m) => m[1]);
    expect(fills.filter((f) => f === JAR_PARTICIPANT_FILL)).toHaveLength(18);
    expect(fills).not.toContain('#FFF');
  });

  it('does not follow skinparam backgroundColor (canvas and heads are separate)', () => {
    const src = '@startuml\nskinparam backgroundColor red\nAlice -> Bob : hello\n@enduml';
    expect(headFills(src)).toEqual(Array(4).fill(JAR_PARTICIPANT_FILL));
  });

  it('still yields to skinparam ParticipantBackgroundColor', () => {
    const src = '@startuml\nskinparam ParticipantBackgroundColor #DDE5FF\nAlice -> Bob : hello\n@enduml';
    expect(headFills(src)).toEqual(Array(4).fill('#DDE5FF'));
  });

  it('still yields to an inline participant colour', () => {
    const src = '@startuml\nparticipant Bob #LightBlue\nAlice -> Bob : hello\n@enduml';
    const fills = headFills(src);
    expect(fills).toHaveLength(4);
    expect(fills.filter((f) => f === JAR_PARTICIPANT_FILL)).toHaveLength(2);
    expect(fills.filter((f) => f === '#ADD8E6')).toHaveLength(2);
  });

  it('yields to a later root BackgroundColor, as !theme plain declares one', () => {
    // `puml-theme-plain.puml:35-37` declares `<style> root { BackgroundColor
    // $BGCOLOR }` AFTER `plantuml.skin`'s participant rule, and
    // `StyleStorage#computeMergedStyle:102-114` merges in declaration order
    // with OVERWRITE_EXISTING_VALUE, so the root rule wins. Jar-verified on
    // `xiceso-64-pelu456` (10 heads #FFF) and `birefi-44-bata482` (6 #FFF).
    expect(headFills('@startuml\n!theme plain\nAlice -> Bob : hello\n@enduml')).toEqual(Array(4).fill('#FFF'));
    const styled = '@startuml\n<style>\nroot {\n  BackgroundColor #ABCDEF\n}\n</style>\nAlice -> Bob : hello\n@enduml';
    expect(headFills(styled)).toEqual(Array(4).fill('#ABCDEF'));
  });

  it('yields to a stereotype-scoped participant BackgroundColor', () => {
    // `FromSkinparamToStyle.java:272,290-296`: `participantBackgroundColor
    // <<X>>` converts to the participant sname carrying stereotype X.
    // Jar-verified on `peciku-06-zuvo123`: the <<APIGateway>> participant
    // draws #FFF while `actor User` keeps #E2E2F0 (jar fills: 4 #FFF, 2 #E2E2F0).
    const block =
      '@startuml\nskinparam participant<<APIGateway>> {\n  BackgroundColor #FFFFFF\n}\nactor User as user\nparticipant OnlyLabel as p1 << APIGateway >>\nuser -> p1 : x\n@enduml';
    // `actor` draws a stickman, no rect: only p1's two heads are rects.
    expect(headFills(block)).toEqual(['#FFF', '#FFF']);
    const flat =
      '@startuml\nskinparam participantBackgroundColor<<Gw>> #123456\nparticipant A << Gw >>\nparticipant B\nA -> B : x\n@enduml';
    expect(headFills(flat)).toEqual(['#123456', '#E2E2F0', '#123456', '#E2E2F0']);
  });
});
