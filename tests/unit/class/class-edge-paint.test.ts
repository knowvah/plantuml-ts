/**
 * cdd7-T1a: class edge paint -- `skinparam ArrowLollipopColor` on the `(0`
 * middle decor (`SvekEdge.java:266-268` -> `MiddleCircleCircled.java:76,88`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';

const LOLLIPOP_BODY = 'something -right(0- anything : description';

function render(lines: readonly string[]): string {
  return renderSync(`@startuml\n${lines.join('\n')}\n@enduml`);
}

/** The inner `MiddleCircleCircled` circle: the only 6x6 ellipse drawn. */
function innerEllipseFill(svg: string): string | undefined {
  return /<ellipse[^>]*rx="6"[^>]*ry="6"[^>]*fill="([^"]+)"/.exec(svg)?.[1];
}

describe('ArrowLollipopColor (SvekEdge.java:266-268)', () => {
  it('lands on theme.colors.arrowLollipopColor', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['arrowLollipopColor', '#red']]), defaultTheme);
    expect(theme.colors.arrowLollipopColor).toBe('#red');
    expect(unknown).toEqual([]);
  });

  it('fills the (0 inner circle with the lollipop colour', () => {
    const svg = render(['skinparam arrowLollipopColor #red', LOLLIPOP_BODY]);
    expect(innerEllipseFill(svg)).toBe('#F00');
  });

  it('falls back to the diagram background without the skinparam', () => {
    expect(innerEllipseFill(render([LOLLIPOP_BODY]))).toBe('#FFF');
    expect(innerEllipseFill(render(['skinparam backgroundColor #EEEEEE', LOLLIPOP_BODY]))).toBe('#EEE');
  });
});
