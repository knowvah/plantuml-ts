/**
 * add4-T3f: `resolveActivityCircleStyle` replays the faithful style engine
 * for `root, element, activityDiagram, circle, start|stop`
 * (`VCompactFactory.java:99-121`). Fixture-level jar equality lives in
 * `tests/diagrams/activity/circle-style-priority.test.ts`; these pin the
 * seams that file cannot reach (dark mode, a rejected block, the theme
 * fold).
 */
import { describe, expect, it } from 'vitest';

import {
  resolveActivityCircleStyle,
  withActivityCircleStyle,
  type ActivityCircleStyleSource,
} from '../../../src/core/activity-circle-style.js';
import { defaultTheme } from '../../../src/core/theme.js';

function source(
  styles: readonly string[],
  skinparam: ReadonlyArray<readonly [string, string]> = [],
  skin?: string,
): ActivityCircleStyleSource {
  const base = { styles, skinparam: new Map(skinparam) };
  return skin === undefined ? base : { ...base, skin };
}

describe('resolveActivityCircleStyle', () => {
  it('reads plantuml.skin #2 for both properties with no document style (plantuml.skin:376-381)', () => {
    expect(resolveActivityCircleStyle(source([]))).toEqual({
      start: { back: '#222222', line: '#222222' },
      stop: { back: '#222222', line: '#222222' },
    });
  });

  it('takes the @media dark half under skinparam mode dark (ColorMapper.java:68-72)', () => {
    const style = resolveActivityCircleStyle(source([], [['mode', ' Dark ']]));
    expect(style?.start).toEqual({ back: '#DDDDDD', line: '#DDDDDD' });
  });

  it('lets a later root beat an earlier circle rule (DarkString.java:54-57)', () => {
    const style = resolveActivityCircleStyle(
      source(['circle {\n BackgroundColor #FF0000\n}\nroot {\n BackgroundColor #00FF00\n}']),
    );
    expect(style?.stop.back).toBe('#00FF00');
  });

  it('lets skin rose replace plantuml.skin (TitledDiagram.java:159-182)', () => {
    expect(resolveActivityCircleStyle(source([], [], 'rose'))?.start).toEqual({ back: '#000000', line: '#000000' });
  });

  it('leaves a dark-only value unresolved (ValueImpl.java:92-108 would throw)', () => {
    const dark = '@media (prefers-color-scheme:dark) {\nroot {\n BackgroundColor #123456\n}\n}';
    expect(resolveActivityCircleStyle(source([dark]))?.start.back).toBeUndefined();
  });

  it('gives up on a block upstream rejects (CommandStyleMultilinesCSS.java:92-93)', () => {
    expect(resolveActivityCircleStyle(source(['root {\n  FontColor\n}']))).toBeUndefined();
  });
});

describe('withActivityCircleStyle', () => {
  it('folds the result into graph.activity, keeping its other fields', () => {
    const base = {
      ...defaultTheme,
      colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, activity: { startColor: 'red' } } },
    };
    const activity = withActivityCircleStyle(base, source([])).colors.graph.activity;
    expect(activity?.startColor).toBe('red');
    expect(activity?.circleStyle?.stop.line).toBe('#222222');
  });

  it('returns the theme itself when nothing resolves', () => {
    expect(withActivityCircleStyle(defaultTheme, source(['root {\n  FontColor\n}']))).toBe(defaultTheme);
  });
});
