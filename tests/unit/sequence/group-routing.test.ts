/**
 * A sequence diagram containing a grouping construct must be rendered BY THE
 * SEQUENCE ENGINE, with its content intact.
 *
 * The bug this pins: `alt`/`else`, `opt`, `loop`, `par` and `group` all close
 * with a bare `end`, and `end` was in `ACTIVITY_ACCEPTS_PATTERNS`
 * (`src/diagrams/activity/index.ts`). Since `activityPlugin` is registered
 * BEFORE `sequencePlugin` (`src/index.ts`), the activity engine claimed every
 * such diagram, discarded everything it did not recognise, and emitted a lone
 * crossed-circle `end` node -- a 52x52 SVG with ZERO text, no error card and
 * no throw.
 *
 * That silence is why the assertions below are on CONTENT, not on the absence
 * of an exception. A `renderSync(...)` that merely does not throw passes
 * happily against the broken build; only counting what was actually drawn
 * catches it. Same failure shape as si11b's sprites-render-as-nothing
 * regression, which stayed green through the whole suite.
 *
 * Second defect pinned here: `else <condition>` captured its label and threw
 * it away (`sequence-commands.ts`'s handler took `(state)` and ignored
 * `match`), so `[other case]` could never be drawn. The jar renders
 * `alt | [first case] | yes | [other case] | no`.
 */
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import { sequencePlugin } from '../../../src/diagrams/sequence/index.js';

function textRuns(svg: string): string[] {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
    .map((m) => (m[1] as string).trim())
    .filter((t) => t !== '');
}

const GROUPED = {
  alt: '@startuml\nparticipant A\nparticipant B\nA -> B : ask\nalt first case\n  B --> A : yes\nelse other case\n  B --> A : no\nend\n@enduml',
  loop: '@startuml\nparticipant A\nparticipant B\nloop each item\n  A -> B : tick\nend\n@enduml',
  opt: '@startuml\nparticipant A\nparticipant B\nopt maybe\n  A -> B : tick\nend\n@enduml',
  group: '@startuml\nparticipant A\nparticipant B\ngroup a label\n  A -> B : tick\nend\n@enduml',
} as const;

describe('sequence grouping constructs are not stolen by the activity engine', () => {
  const EXPECTED_MESSAGES: Record<keyof typeof GROUPED, string[]> = {
    alt: ['ask', 'yes', 'no'],
    loop: ['tick'],
    opt: ['tick'],
    group: ['tick'],
  };

  it.each(Object.keys(GROUPED) as (keyof typeof GROUPED)[])(
    '%s renders sequence content, not an empty diagram',
    (name) => {
      const runs = textRuns(renderSync(GROUPED[name]));
      // Both participants are drawn twice (head and foot boxes).
      expect(runs.filter((t) => t === 'A')).toHaveLength(2);
      expect(runs.filter((t) => t === 'B')).toHaveLength(2);
      for (const msg of EXPECTED_MESSAGES[name]) {
        expect(runs).toContain(msg);
      }
      // The broken build produced a 52x52 SVG with zero text runs.
      expect(runs.length).toBeGreaterThanOrEqual(5);
    },
  );

  it.each(['alt', 'loop', 'opt', 'group'] as const)(
    'the activity plugin declines a sequence diagram using %s',
    (name) => {
      const lines = GROUPED[name].split('\n').filter((l) => !l.startsWith('@'));
      expect(activityPlugin.accepts(lines)).toBe(false);
      expect(sequencePlugin.accepts(lines)).toBe(true);
    },
  );

  it('a real activity diagram is still accepted, and `end` still draws its node', () => {
    const lines = ['start', ':do a thing;', 'end'];
    expect(activityPlugin.accepts(lines)).toBe(true);
    expect(textRuns(renderSync('@startuml\nstart\n:do a thing;\nend\n@enduml'))).toContain('do a thing');
  });
});

describe('alt/else branch conditions survive to the SVG', () => {
  it('the else condition is kept by the parser, not discarded', () => {
    const ast = parseSequence(GROUPED.alt.split('\n'));
    const frame = ast.events.find((e) => e.kind === 'frame');
    expect(frame).toBeDefined();
    expect(frame?.kind === 'frame' ? frame.branchLabels : undefined).toEqual([
      'first case',
      'other case',
    ]);
  });

  it('renders the frame type and BOTH bracketed conditions, matching the jar', () => {
    const runs = textRuns(renderSync(GROUPED.alt));
    // The jar emits: alt | [first case] | yes | [other case] | no
    expect(runs).toContain('alt');
    expect(runs).toContain('[first case]');
    expect(runs).toContain('[other case]');
    expect(runs).toContain('yes');
    expect(runs).toContain('no');
    // The pre-fix renderer combined type and condition into one run.
    expect(runs).not.toContain('alt first case');
  });

  it('a single-branch frame draws its condition once and no separator', () => {
    const runs = textRuns(renderSync(GROUPED.loop));
    expect(runs).toContain('loop');
    expect(runs).toContain('[each item]');
    expect(runs.filter((t) => t.startsWith('['))).toHaveLength(1);
  });
});
