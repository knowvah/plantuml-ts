/**
 * gtc-T3b (xenusu): the edge label is `TextBlockUtils.withMargin(block, marginLabel, marginLabel)`
 * (`SvekEdge.java:372-373`, margin 1; 6 for a self-loop), a `TextBlockMarged` whose `drawU` first draws
 * `UEmpty.create(dim)` over text + 2 x margin (`TextBlockMarged.java:81-87`). `LimitFinder#drawEmpty`
 * (`LimitFinder.java:130-133`) folds it, so the label's ink right edge is `labelX + textW + margin`, not
 * `textX + textW`, and a vertical link whose label is wider than its nodes makes the document 1 px wider.
 * Expected widths come from the pinned jar (`scripts/oracle-render.sh`, probes under
 * `/private/tmp/claude-501/gtc-T3b/o`): vertical 199, multi-line 242, self-loop 354, short label 68, horizontal 303.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockMarged.java:81-87
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../../src/index.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';

function width(body: string): number {
  const svg = renderSync(`@startuml\n${body}\n@enduml`, { measurer: new DeterministicMeasurer() });
  return Number(/<svg [^>]*\swidth="(\d+)px"/.exec(svg)![1]);
}

const LABEL = 'mmmmmmmmmmmmmm';

describe('edge label UEmpty in the document extent', () => {
  it('widens a vertical link whose label is wider than its nodes', () => {
    expect(width(`[a]\n[b]\na --> b : "${LABEL}"`)).toBe(199);
  });

  it('counts the widest line of a multi-line label', () => {
    expect(width('[a]\n[b]\na --> b : "mmmmmmmmmmmmmmmmmm\\nxx"')).toBe(242);
  });

  it('counts the 6 px self-loop margin', () => {
    expect(width('[a]\na --> a : "mmmmmmmmmmmmmmmmmmmmmm"')).toBe(354);
  });

  it('leaves a label that fits inside its nodes unchanged', () => {
    expect(width('[a]\n[b]\na --> b : "xx"')).toBe(68);
  });

  it('leaves a horizontal link unchanged', () => {
    expect(width(`[a]\n[b]\na -> b : "${LABEL}"`)).toBe(303);
  });
});
