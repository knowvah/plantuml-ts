/**
 * `src/diagrams/sequence/renderer-lifeline.ts` — the lifeline and activation
 * components (`skin/rose/ComponentRoseLine.java`,
 * `skin/rose/ComponentRoseActiveLine.java`).
 *
 * These assert the emitted CHILD SEQUENCE, not merely that a `<g>` appears.
 * The whole point of the wrapper is index alignment against the jar's own
 * children (`tests/oracle/svg-conformance/compare.ts` walks children by
 * index), so a test that only checked for the presence of a group would pass
 * on output the comparator still cannot descend into.
 */
import { describe, it, expect } from 'vitest';
import {
  renderLifeline,
  renderActivation,
  renderLifelinePass,
} from '../../../src/diagrams/sequence/renderer-lifeline.js';
import type { ParticipantGeo, ActivationGeo } from '../../../src/diagrams/sequence/ast.js';
import type { ScaledTheme } from '../../../src/diagrams/sequence/scale-geo.js';
import { defaultTheme } from '../../../src/core/theme.js';

const theme: ScaledTheme = { ...defaultTheme, scaleK: 1 };

/**
 * The head ROW's bottom for these fixtures: a plain participant at `y=10`
 * with a 28-tall box reserves 29 (`ComponentRoseParticipant
 * #getPreferredHeight:129-132` adds 1 to the painted height), so the row ends
 * at 39 and every lifeline starts there — one pixel below the box.
 */
const HEAD_HEIGHT = 39;

function participant(over: Partial<ParticipantGeo> = {}): ParticipantGeo {
  const base: ParticipantGeo = {
    id: 'A',
    display: 'A',
    type: 'participant',
    x: 10,
    y: 10,
    width: 24,
    height: 28,
    centerX: 22,
    background: '#FFF',
    border: '#181818',
  };
  return { ...base, ...over };
}

describe('renderLifeline', () => {
  it('emits title, hover rect and line as the group children, in that order', () => {
    const svg = renderLifeline(participant(), HEAD_HEIGHT, 178, theme);

    // The exact child sequence the jar emits:
    // `<g><title>A</title><rect .../><line .../></g>`.
    expect(svg.startsWith('<g><title>A</title><rect ')).toBe(true);
    expect(svg.endsWith('</g>')).toBe(true);
    expect(svg.match(/<(title|rect|line)/g)).toEqual(['<title', '<rect', '<line']);
  });

  it('places the hover rect 3.5px left of centre at width 8', () => {
    // `hoverTargetWidth` is 8 (`ComponentRoseLine.java:101`) and the offset is
    // `(componentWidth - 8) / 2` with `componentWidth` = 1
    // (`getPreferredWidth`, `:96-98`) -> centre - 3.5. Participant centre is
    // 22 here, so x = 18.5; the lifeline itself stays at 22.
    const svg = renderLifeline(participant(), HEAD_HEIGHT, 178, theme);

    expect(svg).toContain('<rect x="18.5" y="39" width="8" height="139"');
    expect(svg).toContain('<line x1="22" y1="39" x2="22" y2="178"');
  });

  it('marks the hover rect as a transparent hit target, not ink', () => {
    // `UStroke.withThickness(0)` + `HColors.transparent()` leave NO stroke,
    // and `HColors.transparent(WITH_FILL_OPACITY).bg()` serialises as
    // `fill="#000" fill-opacity="0"` -- not `fill="none"`.
    const rect = /<rect [^>]*>/.exec(renderLifeline(participant(), HEAD_HEIGHT, 178, theme))?.[0] ?? '';

    expect(rect).toContain('fill="#000"');
    expect(rect).toContain('fill-opacity="0"');
    expect(rect).not.toContain('stroke');
  });

  it('keeps the group and title but drops the rect at zero height', () => {
    // `drawTitleHoverTargetRect` guards its whole body on `height > 0`
    // (`:100`), and that guard sits INSIDE the already-opened group -- unlike
    // `ComponentRoseActiveLine`, whose guard precedes `startGroup`.
    const svg = renderLifeline(participant({ y: 10, height: 28 }), HEAD_HEIGHT, HEAD_HEIGHT, theme);

    expect(svg).toContain('<g><title>A</title>');
    expect(svg).not.toContain('<rect');
    expect(svg).toContain('<line');
  });

  it('titles the group with the display first line only', () => {
    // `Display#toTooltipText` (`Display.java:601-605`) returns `get(0)`, not
    // the joined lines.
    const svg = renderLifeline(participant({ display: 'first\nsecond' }), HEAD_HEIGHT, 178, theme);

    expect(svg).toContain('<title>first</title>');
    expect(svg).not.toContain('second');
  });

  it('emits an empty title element for an empty display', () => {
    const svg = renderLifeline(participant({ display: '' }), HEAD_HEIGHT, 178, theme);

    expect(svg).toContain('<title></title>');
  });

  it('escapes XML metacharacters in the title', () => {
    const svg = renderLifeline(participant({ display: 'a<b&c' }), HEAD_HEIGHT, 178, theme);

    expect(svg).toContain('<title>a&lt;b&amp;c</title>');
  });
});

describe('renderActivation', () => {
  const activation = (over: Partial<ActivationGeo> = {}): ActivationGeo => ({
    kind: 'activation',
    participantId: 'A',
    lifelineX: 22,
    y: 50,
    height: 34,
    level: 1,
    ...over,
  });

  it('wraps the bar in a group with an EMPTY title element', () => {
    const svg = renderActivation(activation(), theme);

    expect(svg.startsWith('<g><title></title><rect ')).toBe(true);
    expect(svg.endsWith('</g>')).toBe(true);
  });

  it('centres a 10-wide bar on the lifeline', () => {
    // `getPreferredWidth` is 10 (`ComponentRoseActiveLine.java:114-116`).
    expect(renderActivation(activation(), theme)).toContain(
      '<rect x="17" y="50" width="10" height="34"',
    );
  });

  /**
   * `LiveBoxes#drawOneLevel` draws every bar of one level from a `ug` moved
   * right by `(levelToDraw - 1) * drawer.getWidth() / 2` (`:365-368`). The
   * offset is HALF THE BOX'S OWN WIDTH per level, not a standalone constant:
   * `CommunicationTile.LIVE_DELTA_SIZE` happens to be 5 too, and the two
   * coincide only because `ComponentRoseActiveLine#getPreferredWidth` is 10.
   *
   * Jar-verified on `kejoke-76-curu931`, whose `Particpant_A -> Particpant_B++`
   * nests four deep on a lifeline at cx=57.075: its golden's four bars run
   * x=52.075, 57.075, 62.075, 67.075, all still `width="10"`.
   */
  it.each([
    [1, 17],
    [2, 22],
    [3, 27],
    [4, 32],
  ])('steps level %i right by half a box, to x=%i', (level, x) => {
    // lifelineX 22, half-width 5: level 1 is CENTRED on the lifeline.
    expect(renderActivation(activation({ level }), theme)).toContain(
      `<rect x="${String(x)}" y="50" width="10" height="34"`,
    );
  });

  it('scales the per-level step with the box', () => {
    const scaled = { ...theme, scaleK: 2, fontSize: theme.fontSize * 2 };
    // half = 10, so level 3 sits at lifelineX - 10 + 2 * 10 = 32.
    expect(renderActivation(activation({ level: 3 }), scaled)).toContain('<rect x="32"');
  });

  it('emits NOTHING for a zero-height bar, not an empty group', () => {
    // Upstream returns BEFORE `startGroup` at zero height
    // (`ComponentRoseActiveLine.java:76-79`), so the jar emits nothing at
    // all -- not even the wrapping `<g>`. That is the one behavioural
    // difference from `renderLifeline`, whose own guard sits INSIDE its
    // already-opened group.
    //
    // This assertion is the INVERSION the previous version of this test
    // asked for by name. It was pinned the other way while this port's
    // LAYOUT still produced `height === 0` on 32 activation-bearing fixtures
    // the jar gives height to, because the faithful guard would then have
    // deleted boxes the golden carries. The activation STACK and its
    // `Math.max(0, level - 1)` clamp fixed that input, and the census now
    // reports zero zero-height bars across all 157 activation-bearing
    // fixtures.
    expect(renderActivation(activation({ height: 0 }), theme)).toBe('');
  });
});

describe('renderLifelinePass', () => {
  const p = (id: string, centerX: number): ParticipantGeo =>
    participant({ id, display: id, centerX, x: centerX - 12 });
  const act = (participantId: string, lifelineX: number, y: number): ActivationGeo => ({
    kind: 'activation',
    level: 1,
    participantId,
    lifelineX,
    y,
    height: 20,
  });

  it('interleaves per participant: each line, then that participant only', () => {
    // `LivingSpace#drawLineAndLiveboxes` (`teoz/LivingSpace.java:150-167`)
    // draws one participant's line and then ITS boxes before moving on --
    // not every line followed by every box. Confirmed against the jar on
    // `kejoke-76-curu931`.
    const svg = renderLifelinePass(
      [p('A', 22), p('B', 122)],
      [act('B', 122, 50), act('A', 22, 60)],
      HEAD_HEIGHT,
      178,
      theme,
    );

    const titles = [...svg.matchAll(/<title>(.*?)<\/title>/g)].map((m) => m[1]);
    expect(titles).toEqual(['A', '', 'B', '']);
  });

  it('keeps multiple boxes on one participant in source order', () => {
    const svg = renderLifelinePass([p('A', 22)], [act('A', 22, 60), act('A', 22, 10)], HEAD_HEIGHT, 178, theme);

    expect([...svg.matchAll(/<rect [^>]*?y="(\d+)"/g)].map((m) => m[1])).toEqual([
      '39', // the hover target, which spans the whole lifeline
      '60',
      '10',
    ]);
  });

  it('emits a bare lifeline for a participant with no activations', () => {
    const svg = renderLifelinePass([p('A', 22)], [act('B', 122, 50)], HEAD_HEIGHT, 178, theme);

    expect([...svg.matchAll(/<title>(.*?)<\/title>/g)].map((m) => m[1])).toEqual(['A']);
  });
});
