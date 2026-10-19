/**
 * gtc-T6i -- a port cluster is widened to its title (`Cluster.java:427-428`
 * `ensureMinWidth(getTitleAndAttributeWidth() + 10)`), and `getTitleAndAttributeWidth` is the width of the
 * group's title BLOCK (`ClusterHeader.java:79-92`: the wrapped `\n` lines, in the group's own font), the same
 * number the cluster's DOT label table prints. The port path measured the raw display as one plain line (a literal
 * `\n` included), so a two-line title widened the cluster by 23.75 px at deroxu's scale. Expected values: jar
 * oracle of this source (scripts/oracle-render.sh): canvas 256x257, cluster rect x=19.11 width=223.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const TWO_LINES = [
  '@startuml',
  'component Ext',
  'component "Site Service\\n(formerly Deployment Service)" as S {',
  '  port P1',
  '  component In',
  '}',
  'Ext --> P1',
  '@enduml',
].join('\n');

const render = (src: string): string => renderSync(src, { measurer: new DeterministicMeasurer() });

describe('port cluster title width', () => {
  const svg = render(TWO_LINES);

  it('sizes the cluster from the wrapped title lines', () => {
    expect(svg).toContain('<rect x="19.11" y="117" width="223" height="126"');
    expect(svg).toContain('<rect x="222.11" y="122" width="15" height="10"');
  });

  it('keeps the canvas of the jar', () => {
    expect(/ width="(\d+)px" height="(\d+)px"/.exec(svg)?.slice(1, 3)).toEqual(['256', '257']);
  });

  it('sizes a stereotyped two-line title (jar: x=19.11 width=163, canvas 196x258)', () => {
    const stereo = render(
      [
        '@startuml',
        'component Ext',
        'component "Site\\nSvc" as S <<package>> {',
        '  port P1',
        '  component In',
        '}',
        'Ext --> P1',
        '@enduml',
      ].join('\n'),
    );
    expect(stereo).toContain('<rect x="19.11" y="117" width="163" height="127"');
    expect(/ width="(\d+)px" height="(\d+)px"/.exec(stereo)?.slice(1, 3)).toEqual(['196', '258']);
  });
});
