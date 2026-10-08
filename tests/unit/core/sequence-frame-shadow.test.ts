/**
 * unwind2-S9: `resolveSequenceFrameShadowing` replays the faithful style
 * engine for `root, element, sequenceDiagram, group|reference`
 * (`Grouping.java:62`, `Reference.java:67`). Jar-level equality lives in
 * `tests/unit/sequence/unwind2-s9-frame-shadow-jar.test.ts`; these pin the
 * seams that file cannot reach (the no-shadow gate, a rejected block, the
 * theme fold).
 */
import { describe, expect, it } from 'vitest';

import {
  resolveSequenceFrameShadowing,
  withSequenceFrameShadowing,
  type SequenceFrameShadowSource,
} from '../../../src/core/sequence-frame-shadow.js';
import { defaultTheme } from '../../../src/core/theme.js';

function source(
  styles: readonly string[],
  skinparam: ReadonlyArray<readonly [string, string]> = [],
  skin?: string,
): SequenceFrameShadowSource {
  const base = { styles, skinparam: new Map(skinparam) };
  return skin === undefined ? base : { ...base, skin };
}

describe('resolveSequenceFrameShadowing', () => {
  it('is nothing under plantuml.skin, whose root and element say Shadowing 0.0 (plantuml.skin:18,92)', () => {
    expect(resolveSequenceFrameShadowing(source([], [['sequenceGroupBorderColor', 'red']]))).toBeUndefined();
  });

  it('turns skinparam shadowing true into root Shadowing 3 (FromSkinparamToStyle.java:306-310,331-332)', () => {
    expect(resolveSequenceFrameShadowing(source([], [['shadowing', 'true']]))).toEqual({ group: 3, reference: 3 });
  });

  it('scopes a reference selector to the ref frame only (Reference.java:67)', () => {
    expect(resolveSequenceFrameShadowing(source(['sequenceDiagram {\n reference { Shadowing 2 }\n}']))).toEqual({
      group: 0,
      reference: 2,
    });
  });

  it('lets skin rose shadow every element at 4 (rose.skin:71)', () => {
    expect(resolveSequenceFrameShadowing(source([], [], 'rose'))).toEqual({ group: 4, reference: 4 });
  });

  it('is nothing when a later group rule zeroes the only shadow on a frame', () => {
    expect(resolveSequenceFrameShadowing(source(['group { Shadowing 0 }']))).toBeUndefined();
  });

  it('gives up on a block upstream rejects (CommandStyleMultilinesCSS.java:92-93)', () => {
    expect(resolveSequenceFrameShadowing(source(['root {\n  Shadowing\n}']))).toBeUndefined();
  });
});

describe('withSequenceFrameShadowing', () => {
  it('folds the result into graph.sequenceFrameShadowing', () => {
    const theme = withSequenceFrameShadowing(defaultTheme, source(['group { Shadowing 3 }']));
    expect(theme.colors.graph.sequenceFrameShadowing).toEqual({ group: 3, reference: 0 });
  });

  it('returns the theme itself when nothing resolves', () => {
    expect(withSequenceFrameShadowing(defaultTheme, source([]))).toBe(defaultTheme);
  });
});
