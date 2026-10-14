/**
 * dsw-T1d: a state composite's `ClusterHeader` title TABLE (and its
 * `p0`/`p1` wrappers) at ANY font size, and a bullet attribute's width. Values are the jar's own
 * `svek-1.dot` (test-results/dot-cache/state/niveno-60-tiro789): `ClusterDotString.java:107-125,299-314`,
 * `ClusterHeader.java:76-91`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputCluster, DotInputGraph } from '../../../src/core/graph-layout.js';

const NIVENO = `@startuml
skin debug
title title

state waiting {
	state first : first 
	state second : second 
}
waiting : waiting label

[*] --> first : export
@enduml`;

/** jar `svek-1.dot` cluster6 TABLE WIDTH x HEIGHT. */
const NIVENO_TABLE = { width: 104, height: 38 } as const;
const GOPUDO = `@startuml
state A {
  A : * a list
  state B
  B --> A
}

state C {
  C : * a list
  state D
  D --> A
}

@enduml`;

/** jar gopudo svek-1.dot cluster6/cluster11: (int)(Bullet 12 + 28.7875) = 40. */
const GOPUDO_TABLE = { width: 40, height: 28 } as const;

/** `innerMarginLevels` 1 = p0 + p1 wrappers (no zaent anchor). */
const WRAPPED_LEVELS = 1;

let captured: DotInputGraph[] = [];
afterEach(() => setLayoutInputObserver(undefined));

function clustersOf(puml: string): readonly DotInputCluster[] {
  captured = [];
  setLayoutInputObserver(({ graph }) => captured.push(graph));
  renderSync(puml, { measurer: new DeterministicMeasurer() });
  return captured[0]!.clusters ?? [];
}

describe('state composite title table', () => {
  it('niveno (font size != 14) carries the jar title table and p0/p1 wrapper', () => {
    const c = clustersOf(NIVENO)[0]!;
    expect(Math.floor(c.titleTableWidth!)).toBe(NIVENO_TABLE.width);
    expect(c.titleTableHeight).toBe(NIVENO_TABLE.height);
    expect(c.innerMarginLevels).toBe(WRAPPED_LEVELS);
  });

  it('gopudo: a creole bullet attribute adds the 12-wide Bullet header', () => {
    const cs = clustersOf(GOPUDO);
    expect(cs).toHaveLength(2);
    for (const c of cs) {
      expect(Math.floor(c.titleTableWidth!)).toBe(GOPUDO_TABLE.width);
      expect(c.titleTableHeight).toBe(GOPUDO_TABLE.height);
    }
  });
});
