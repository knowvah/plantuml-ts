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
import { renderLifeline } from '../../../src/diagrams/sequence/renderer-lifeline.js';
import type { ParticipantGeo } from '../../../src/diagrams/sequence/ast.js';
import type { ScaledTheme } from '../../../src/diagrams/sequence/scale-geo.js';
import { defaultTheme } from '../../../src/core/theme.js';

const theme: ScaledTheme = { ...defaultTheme, scaleK: 1 };

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
    const svg = renderLifeline(participant(), 178, theme);

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
    const svg = renderLifeline(participant(), 178, theme);

    expect(svg).toContain('<rect x="18.5" y="38" width="8" height="140"');
    expect(svg).toContain('<line x1="22" y1="38" x2="22" y2="178"');
  });

  it('marks the hover rect as a transparent hit target, not ink', () => {
    // `UStroke.withThickness(0)` + `HColors.transparent()` leave NO stroke,
    // and `HColors.transparent(WITH_FILL_OPACITY).bg()` serialises as
    // `fill="#000" fill-opacity="0"` -- not `fill="none"`.
    const rect = /<rect [^>]*>/.exec(renderLifeline(participant(), 178, theme))?.[0] ?? '';

    expect(rect).toContain('fill="#000"');
    expect(rect).toContain('fill-opacity="0"');
    expect(rect).not.toContain('stroke');
  });

  it('keeps the group and title but drops the rect at zero height', () => {
    // `drawTitleHoverTargetRect` guards its whole body on `height > 0`
    // (`:100`), and that guard sits INSIDE the already-opened group -- unlike
    // `ComponentRoseActiveLine`, whose guard precedes `startGroup`.
    const svg = renderLifeline(participant({ y: 10, height: 28 }), 38, theme);

    expect(svg).toContain('<g><title>A</title>');
    expect(svg).not.toContain('<rect');
    expect(svg).toContain('<line');
  });

  it('titles the group with the display first line only', () => {
    // `Display#toTooltipText` (`Display.java:601-605`) returns `get(0)`, not
    // the joined lines.
    const svg = renderLifeline(participant({ display: 'first\nsecond' }), 178, theme);

    expect(svg).toContain('<title>first</title>');
    expect(svg).not.toContain('second');
  });

  it('emits an empty title element for an empty display', () => {
    const svg = renderLifeline(participant({ display: '' }), 178, theme);

    expect(svg).toContain('<title></title>');
  });

  it('escapes XML metacharacters in the title', () => {
    const svg = renderLifeline(participant({ display: 'a<b&c' }), 178, theme);

    expect(svg).toContain('<title>a&lt;b&amp;c</title>');
  });
});
