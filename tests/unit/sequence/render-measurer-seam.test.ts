/**
 * The plugin render seam hands the render's measurer to sequence's draw side
 * (`DiagramPlugin.render`'s optional third argument, `src/index.ts`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { sequencePlugin } from '../../../src/diagrams/sequence/index.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import type { SequenceGeometry } from '../../../src/diagrams/sequence/ast.js';

const SOURCE = '@startuml\ndatabase DB\nDB -> DB : x\n@enduml';

describe('sequence render measurer seam', () => {
  it('renders through renderSync with the pipeline measurer', () => {
    expect(renderSync(SOURCE)).toContain('<svg');
  });

  it('throws when a caller omits the measurer', () => {
    const measurer = new DeterministicMeasurer();
    const geo: SequenceGeometry = layoutSequence(
      parseSequence(['database DB', 'DB -> DB : x']) as never,
      defaultTheme,
      measurer,
    );
    expect(() => sequencePlugin.render(geo, defaultTheme)).toThrow('sequence render requires the render measurer');
    expect(sequencePlugin.render(geo, defaultTheme, measurer)).toHaveProperty('body');
  });
});
