/**
 * unwind2-S9: `resolveSequenceShadowing` replays the faithful style
 * engine for `root, element, sequenceDiagram, group|reference`
 * (`Grouping.java:62`, `Reference.java:67`). Jar-level equality lives in
 * `tests/unit/sequence/unwind2-s9-frame-shadow-jar.test.ts`; these pin the
 * seams that file cannot reach (the no-shadow gate, a rejected block, the
 * theme fold).
 */
import { describe, expect, it } from 'vitest';

import {
  resolveSequenceShadowing,
  withSequenceShadowing,
  type SequenceShadowing,
  type SequenceShadowSource,
} from '../../../src/core/sequence-shadowing.js';
import { defaultTheme } from '../../../src/core/theme.js';

function source(
  styles: readonly string[],
  skinparam: ReadonlyArray<readonly [string, string]> = [],
  skin?: string,
): SequenceShadowSource {
  const base = { styles, skinparam: new Map(skinparam) };
  return skin === undefined ? base : { ...base, skin };
}

/** The scalar half of a resolution plus a default-kind participant and note. */
function summary(s: SequenceShadowing | undefined): Record<string, number> | undefined {
  if (s === undefined) return undefined;
  const { group, reference, activation, divider } = s;
  return { group, reference, activation, divider, participant: s.participant('participant'), note: s.note('note') };
}

const ALL_THREE = { group: 3, reference: 3, activation: 3, divider: 3, participant: 3, note: 3 };

describe('resolveSequenceShadowing', () => {
  it('is nothing under plantuml.skin, whose root and element say Shadowing 0.0 (plantuml.skin:18,92)', () => {
    expect(resolveSequenceShadowing(source([], [['sequenceGroupBorderColor', 'red']]))).toBeUndefined();
  });

  it('turns skinparam shadowing true into root Shadowing 3 (FromSkinparamToStyle.java:306-310,331-332)', () => {
    expect(summary(resolveSequenceShadowing(source([], [['shadowing', 'true']])))).toEqual(ALL_THREE);
  });

  it('scopes a reference selector to the ref frame only (Reference.java:67)', () => {
    const s = resolveSequenceShadowing(source(['sequenceDiagram {\n reference { Shadowing 2 }\n}']));
    expect(summary(s)).toEqual({ group: 0, reference: 2, activation: 0, divider: 0, participant: 0, note: 0 });
  });

  it('lets skin rose shadow every element at 4 (rose.skin:71)', () => {
    expect(resolveSequenceShadowing(source([], [], 'rose'))?.group).toBe(4);
  });

  it('reads a participant kind and its stereotype (Participant.java:86-96)', () => {
    const s = resolveSequenceShadowing(source(['participant { .heavy { Shadowing 2 } }\n.lit { Shadowing 4 }']));
    expect([
      s?.participant('participant', '<<heavy>>'),
      s?.participant('participant'),
      s?.participant('actor', '<<lit>>'),
    ]).toEqual([2, 0, 4]);
  });

  it("merges a note stereotype's own styles, and keeps hnote/rnote apart (Note.java:75-82)", () => {
    const s = resolveSequenceShadowing(source(['note { Shadowing 0\n .with { Shadowing 3 } }\nrnote { Shadowing 5 }']));
    expect([s?.note('note', '<<with>>'), s?.note('note'), s?.note('rnote'), s?.note('hnote', ' ')]).toEqual([
      3, 0, 5, 0,
    ]);
  });

  it('memoizes a repeated lookup', () => {
    const s = resolveSequenceShadowing(source([], [['shadowing', 'true']]));
    expect([s?.note('hnote', '<<x>>'), s?.note('hnote', '<<x>>')]).toEqual([3, 3]);
  });

  it('gives up on a block upstream rejects (CommandStyleMultilinesCSS.java:92-93)', () => {
    expect(resolveSequenceShadowing(source(['root {\n  Shadowing\n}']))).toBeUndefined();
  });
});

describe('withSequenceShadowing', () => {
  it('folds the result into graph.sequenceShadowing', () => {
    const theme = withSequenceShadowing(defaultTheme, source(['group { Shadowing 3 }']));
    expect(theme.colors.graph.sequenceShadowing?.group).toBe(3);
  });

  it('returns the theme itself when nothing resolves', () => {
    expect(withSequenceShadowing(defaultTheme, source([]))).toBe(defaultTheme);
  });
});
