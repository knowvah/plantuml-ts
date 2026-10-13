/**
 * `PSystemEgg` (eggs/PSystemEgg.java): the decoded sentence split on `|`
 * (`StringTokenizer`, empty tokens dropped) as `PlainStringsDiagram` lines.
 * The jar's own sentences are secret (D10); the sentence here is authored.
 */
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { PSystemEgg } from '../../../src/diagrams/eggs/PSystemEgg.js';

function textsOf(svg: string): string[] {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]!);
}

describe('PSystemEgg', () => {
  it('draws one line per |-separated token, skipping empty tokens (java:47-51)', () => {
    const egg = new PSystemEgg({ lines: [], type: 'sequence' }, '||Hi||there|', new PreprocessingArtifact());
    expect(textsOf(egg.exportDiagram(0, new DeterministicMeasurer()))).toEqual(['Hi', 'there']);
  });

  it('describes itself as (Easter Eggs) (java:54-56)', () => {
    const egg = new PSystemEgg({ lines: [], type: 'sequence' }, 'x', new PreprocessingArtifact());
    expect(egg.getDescription()).toBe('(Easter Eggs)');
  });
});
