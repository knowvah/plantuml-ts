/**
 * codd-T2 M6 -- `!pragma kermor on` with a port child still runs the entry/exit-point frontier
 * (`Cluster.drawU` calls `manageEntryExitPoint` whenever `entityPositionsExceptNormal().size() > 0`,
 * `Cluster.java:344-345`, kermor or not). Expected size is the jar's drawn cluster rect in
 * `component/fojamu-08-veku866` `in.svg`: `<rect x="10" y="67" width="186" height="146">`; the engine's
 * own cluster is 186 x 172, the frontier shrinks it by 26.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:344-345,410-430
 */
import { describe, it, expect } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { layoutDescription } from '../../../src/diagrams/description/layout.js';

const FOJAMU = `!pragma kermor on
component "Temperature Sensor" as tempSensor <<block>> {
    note as tempSensor_TVs
        1some tagged value table
        would be here
        usually.
    end note
    portout "temp_dK_raw" as tempSensor_temp_dK_raw
}
note top of tempSensor
    2Measure the temperature and outputs it as
    raw, unfiltered value in Kelvin.
end note`;

describe('kermor + port child (M6)', () => {
  it('draws the group at the frontier-shrunk jar size 186x146, not the engine cluster 186x172', () => {
    const block: UmlSource = { lines: FOJAMU.split('\n'), type: 'description' };
    const geo = layoutDescription(
      astOrThrow(parseDescription(block), 'description'),
      defaultTheme,
      new DeterministicMeasurer(),
    );
    const group = geo.nodes.find((n) => n.id === 'tempSensor');
    expect(group?.width).toBeCloseTo(186, 3);
    expect(group?.height).toBeCloseTo(146, 3);
  });
});
