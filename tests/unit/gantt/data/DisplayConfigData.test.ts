import { describe, expect, it } from 'vitest';
import { DisplayConfigData } from '../../../../src/diagrams/gantt/data/DisplayConfigData.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DisplayConfigData.java:33-82
describe('DisplayConfigData', () => {
  it('defaults: footbox shown, resource name and footbox not hidden (java:36-38)', () => {
    const d = new DisplayConfigData();
    expect(d.isShowFootbox()).toBe(true);
    expect(d.isHideResourceName()).toBe(false);
    expect(d.isHideResourceFootbox()).toBe(false);
  });

  it('setters flip each flag independently (java:62-72)', () => {
    const d = new DisplayConfigData();
    d.setShowFootbox(false);
    expect([d.isShowFootbox(), d.isHideResourceName(), d.isHideResourceFootbox()]).toEqual([false, false, false]);
    d.setHideResourceName(true);
    expect([d.isShowFootbox(), d.isHideResourceName(), d.isHideResourceFootbox()]).toEqual([false, true, false]);
    d.setHideResourceFootbox(true);
    expect([d.isShowFootbox(), d.isHideResourceName(), d.isHideResourceFootbox()]).toEqual([false, true, true]);
  });
});
