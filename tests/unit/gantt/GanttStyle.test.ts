import { describe, expect, it } from 'vitest';
import { skinGanttStyle } from './helpers/gantt-style.js';

// ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttStyle.java:35-41 is an interface; the one-name and two-name
// overloads are one TS method. Expected values are the built-in skin's
// ganttDiagram block (plantuml.skin: timeline { FontSize 10 month { FontSize 12 } }).
describe('GanttStyle', () => {
  it('one-name lookup resolves root/element/ganttDiagram/<name>', () => {
    expect(skinGanttStyle().getStyle('timeline').value('FontSize').asDouble()).toBe(10);
  });

  it('two-name lookup resolves the nested style', () => {
    expect(skinGanttStyle().getStyle('timeline', 'month').value('FontSize').asDouble()).toBe(12);
  });
});
