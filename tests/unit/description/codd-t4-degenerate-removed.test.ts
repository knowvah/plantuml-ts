/**
 * codd-T4: `GraphvizImageBuilder.buildImage:211-222` takes the degenerate
 * `EntityImageDegenerated` path from `DotData#isDegeneratedWithFewEntities`
 * (`dot/DotData.java:69-71`: `groups().size() == 0 && getLinks().size() == 0
 * && getLeafs().size() == 1`), which counts entities, groups and links that
 * `remove` hides. A diagram whose only SURVIVING leaf sits beside removed
 * ones therefore takes the `SvekResult` path (`SvekResult.java:130-135`,
 * ink + 15), one pixel larger in each dimension than the degenerate path.
 * Expected canvases are the pinned jar's (`test-results/dot-cache/component`
 * cenoja-47-rodu998, gogosu-37-mipe918, sobobi-72-miri289, sodoza-93-nanu557;
 * the control is a jar render of `component foo2`).
 */
import { describe, expect, it } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function canvas(src: string): { width: number; height: number } {
  const svg = renderSync(src, { measurer: new DeterministicMeasurer() });
  const m = /<svg[^>]* width="(\d+)px" height="(\d+)px"/.exec(svg);
  return { width: Number(m?.[1]), height: Number(m?.[2]) };
}

const CASES: ReadonlyArray<readonly [string, string, number, number]> = [
  ['a lone component (control: degenerate path)', '@startuml\ncomponent foo2\n@enduml', 87, 64],
  [
    'cenoja: removed sibling leaves',
    '@startuml\ncomponent foo1 $tag1\ncomponent foo2\ncomponent foo3 $tag1\nremove $tag1\n@enduml',
    88,
    65,
  ],
  [
    'gogosu: removed groups',
    '@startuml\ncomponent a {\n component a_sub\n}\ncomponent b {\n component b_sub\n}\nremove a\nremove b_sub\n@enduml',
    68,
    65,
  ],
  [
    'sobobi: removed leaf inside a frame',
    '@startuml\nframe f1 {\n component A\n}\ncomponent B\nremove A\nremove B\n@enduml',
    72,
    65,
  ],
  [
    'sodoza: removed leaves and a removed link',
    '@startuml\ncomponent C1 $tag1 {\n node n\n}\ncomponent C2 $tag2 {\n}\nC1 -- C2\nremove *\nrestore $tag1\n@enduml',
    78,
    65,
  ],
];

describe('codd-T4 degenerate predicate counts removed entities', () => {
  it.each(CASES)('%s', (_name, src, width, height) => {
    expect(canvas(src)).toEqual({ width, height });
  });
});
