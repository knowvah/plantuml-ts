import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { resolveTheme } from '../../../src/core/theme.js';
import {
  ACTIVITY_DOCUMENT_MARGIN,
  activityDocumentMargin,
  documentMarginTheme,
} from '../../../src/diagrams/activity/activity-layout-constants.js';
import { renderSync } from '../../../src/index.js';

const FIVE = { top: 5, right: 5, bottom: 5, left: 5 };
const MARGIN_5_STYLE = '<style>\nroot {\n  Margin 5\n}\n</style>';

function canvas(svg: string): { width: number; height: number; cx: number; cy: number } {
  const root = /viewBox="0 0 (\d+) (\d+)"/.exec(svg)!;
  const ellipse = /<ellipse cx="([^"]*)" cy="([^"]*)"/.exec(svg)!;
  return { width: Number(root[1]), height: Number(root[2]), cx: Number(ellipse[1]), cy: Number(ellipse[2]) };
}

function render(lines: readonly string[]): string {
  return renderSync(['@startuml', ...lines, '@enduml'].join('\n'), { measurer: new DeterministicMeasurer() });
}

describe('activityDocumentMargin (TextBlockExporter.java:510-516)', () => {
  it('defaults to getDefaultMargins() = same(10)', () => {
    const m = activityDocumentMargin(resolveTheme('default'));
    expect(m).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
    expect(m.left).toBe(ACTIVITY_DOCUMENT_MARGIN);
  });

  it("takes the theme's root/document Margin when set", () => {
    expect(activityDocumentMargin({ ...resolveTheme('default'), diagramMargin: FIVE })).toEqual(FIVE);
  });
});

describe('documentMarginTheme', () => {
  const themed = { ...resolveTheme('default'), diagramMargin: FIVE };

  it('keeps the theme margin without chrome', () => {
    expect(documentMarginTheme(themed, false)).toBe(themed);
  });

  it('drops it with chrome, so applyActivityChrome stays an exact inverse', () => {
    expect(documentMarginTheme(themed, true).diagramMargin).toBeUndefined();
  });
});

describe('activity document margin end to end', () => {
  it('a root Margin 5 shrinks the canvas by 10 and moves the body by -5', () => {
    const plain = canvas(render(['start']));
    const five = canvas(render([MARGIN_5_STYLE, 'start']));
    expect(five).toEqual({ width: plain.width - 10, height: plain.height - 10, cx: plain.cx - 5, cy: plain.cy - 5 });
  });

  // add4-T3b: `applyActivityChrome` re-applies the THEME margin around the
  // chrome-composed block (`TextBlockExporter.java:172-173,199-202,510-516`).
  it('with a title the theme margin still wraps the chromed document', () => {
    const plain = canvas(render(['title T', 'start']));
    const five = canvas(render([MARGIN_5_STYLE, 'title T', 'start']));
    expect(five).toEqual({ width: plain.width - 10, height: plain.height - 10, cx: plain.cx - 5, cy: plain.cy - 5 });
  });
});
