import { describe, expect, it, vi } from 'vitest';
import { taskOf, day } from './draw/helpers/draw-fixture.js';
import { GanttLayout } from '../../../src/diagrams/gantt/GanttLayout.js';
import { partsOf, sb, sceneOf } from './helpers/gantt-scene.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttLayout.java:58-127.
// The scene is 2024-03-04 .. 2024-03-10 (7 days) under a daily header whose cell is 16 px
// (timeline day FontSize 10 * 1.6, TimelineStyleData.java:108-111).

const DAY_CELL = 16;
const DAYS = 7;
const LONG_LABEL = 'a task label far wider than the one-day bar it is drawn on';

describe('GanttLayout', () => {
  it('builds every task draw (java:62-63)', () => {
    const a = taskOf('A', day(4));
    const scene = sceneOf([a]);
    expect(scene.registry.getTaskDraw(a)?.getTask()).toBe(a);
  });

  it('titles width is the constant 0 (java:66, :83)', () => {
    expect(sceneOf([taskOf('A', day(4))]).layout.getTitlesWidth()).toBe(0);
  });

  it('timeline width is the bars column width: 7 day cells (java:85, TimeBoundsData.java:120-124)', () => {
    const { layout, header, timeBounds } = sceneOf([taskOf('A', day(4))]);
    expect(layout.getTimelineWidth()).toBe(DAYS * DAY_CELL);
    expect(layout.getTimelineWidth()).toBe(timeBounds.getBarsColumnWidth(header));
  });

  it('bars width equals the timeline width when no label overflows (java:98)', () => {
    const { layout } = sceneOf([taskOf('A', day(4))]);
    expect(layout.getBarsWidth()).toBe(DAYS * DAY_CELL);
  });

  it('bars width adds the largest label overflow (java:88-98)', () => {
    const wide = taskOf(LONG_LABEL, day(10));
    const { layout, registry } = sceneOf([taskOf('A', day(4)), wide]);
    const overflow = registry.getTaskDraw(wide)!.getLabelOverflow!(sb, DAYS * DAY_CELL);
    expect(overflow).toBeGreaterThan(0);
    expect(layout.getBarsWidth()).toBe(DAYS * DAY_CELL + overflow);
  });

  it('a hidden task does not contribute its overflow (java:89-90)', () => {
    // March 1 is before the minimum day, and a printStart makes TimeBoundsData.isHidden answer true (java:107-114)
    const hidden = taskOf(LONG_LABEL.repeat(8), day(1));
    const { layout, registry, timeBounds } = sceneOf([hidden], { printStart: day(4).toDay() });
    expect(timeBounds.isHidden(hidden)).toBe(true);
    expect(registry.getTaskDraw(hidden)!.getLabelOverflow!(sb, DAYS * DAY_CELL)).toBeGreaterThan(0);
    expect(layout.getBarsWidth()).toBe(DAYS * DAY_CELL);
  });

  it('header height is the time header height (java:99)', () => {
    const { layout, header } = sceneOf([taskOf('A', day(4))]);
    expect(layout.getHeaderHeight()).toBe(header.getTimeHeaderHeight(sb));
    expect(layout.getHeaderHeight()).toBeGreaterThan(0);
  });

  it('footer height is the time footer height when the footbox is shown (java:100)', () => {
    const { layout, header } = sceneOf([taskOf('A', day(4))], { showFootbox: true });
    expect(layout.getFooterHeight()).toBe(header.getTimeFooterHeight(sb));
    expect(layout.getFooterHeight()).toBeGreaterThan(0);
  });

  it('footer height is 0 when the footbox is hidden (java:100)', () => {
    expect(sceneOf([taskOf('A', day(4))], { showFootbox: false }).layout.getFooterHeight()).toBe(0);
  });

  it('total height is the registry height without footer plus the footer (java:101)', () => {
    const shown = sceneOf([taskOf('A', day(4)), taskOf('B', day(5))], { showFootbox: true });
    expect(shown.layout.getTotalHeight()).toBe(
      shown.registry.getTotalHeightWithoutFooter() + shown.layout.getFooterHeight(),
    );
    const hidden = sceneOf([taskOf('A', day(4)), taskOf('B', day(5))], { showFootbox: false });
    expect(hidden.layout.getTotalHeight()).toBe(hidden.registry.getTotalHeightWithoutFooter());
    expect(shown.layout.getTotalHeight()).toBeGreaterThan(hidden.layout.getTotalHeight());
  });

  it('a visible task whose draw is missing from the registry adds no overflow (java:90-92)', () => {
    const wide = taskOf(LONG_LABEL, day(10));
    const parts = partsOf([wide]);
    vi.spyOn(parts.registry, 'getTaskDraw').mockReturnValue(undefined);
    const layout = new GanttLayout(
      parts.modelData,
      parts.displayConfig,
      parts.timeBounds,
      parts.timelineStyle,
      parts.registry,
      sb,
      parts.header,
    );
    expect(layout.getBarsWidth()).toBe(DAYS * DAY_CELL);
  });
});
