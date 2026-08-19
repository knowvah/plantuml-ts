/**
 * SI31 T6 (G20a, plans/state-declared-size-fix/findings/G20-linetype-routing
 * .md): every composite pass must DECLARE its local nodes to graphviz in the
 * jar's real Entity creation order, not "members first, `[*]` circles last".
 *
 * Upstream creates a scope's `[*]` entity lazily, on FIRST REFERENCE --
 * `~/git/plantuml/src/main/java/net/sourceforge/plantuml/statediagram/
 * StateDiagram.java:92-107` (`getStart`: `if (quark.getData() == null)
 * reallyCreateLeaf(...)`) -- and `svek/SvekResult.java#drawU` then walks
 * `Bibliotekon`'s registration-ordered `LinkedHashMap`, so a composite whose
 * FIRST transition line is `[*] --> X` declares the circle ahead of `X`,
 * while one that references a member first declares that member ahead of the
 * circle. Jar-verified for the `[*]`-first case by `test-results/dot-cache/
 * state/kejabo-83-vinu490/svek-1.dot:5-7` (`sh0006`=circle, `sh0007`=Idle,
 * `sh0008`=Configuring).
 *
 * Both directions are asserted deliberately: a bare two-line swap of the
 * `resolveMember`/`addLocalPseudoNodes` calls would pass the first case and
 * fail the second, which is why the port orders by the parse-time creation
 * index instead.
 */
import { describe, it, expect, afterEach } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

/** Every `DotInputGraph` one render fed to the layout engine, in pass order —
 *  nested (autonom/region) passes fire before their containing pass. */
function capturePasses(src: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(src);
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

const nodeIds = (g: DotInputGraph): string[] => g.nodes.map((n) => n.id);

/** The FIRST pass fired by a render — a nested (autonom/region) pass always
 *  fires before its containing one, so this is the inner scope under test. */
function innerPassNodeIds(src: string): string[] {
  const passes = capturePasses(src);
  expect(passes.length).toBeGreaterThan(0);
  return nodeIds(passes[0] as DotInputGraph);
}

describe('composite pass node declaration order', () => {
  afterEach(() => setLayoutInputObserver(undefined));

  it('declares an autonom composite\'s [*] circle first when [*] is referenced first', () => {
    // kejabo-83-vinu490's own shape, verbatim.
    const inner = innerPassNodeIds(`@startuml
skinparam linetype polyline
[*] --> NotShooting

state NotShooting begin
  [*] --> Idle
  Idle --> Configuring : EvConfig
  Configuring --> Idle : EvConfig
end state

NotShooting --> Shooting : EvShutterReleased
Shooting --> NotShooting : EvShutterHalf
@enduml`);

    expect(inner).toEqual(['__init_NotShooting', 'Idle', 'Configuring']);
  });

  it('declares an autonom composite\'s members first when a member is referenced first', () => {
    const inner = innerPassNodeIds(`@startuml
[*] --> NotShooting

state NotShooting begin
  Idle --> Configuring : EvConfig
  Configuring --> [*]
end state

NotShooting --> Shooting
@enduml`);

    expect(inner).toEqual(['Idle', 'Configuring', '__final_NotShooting']);
  });

  it('declares a concurrent region\'s [*] circle in creation order too', () => {
    const passes = capturePasses(`@startuml
[*] --> Active

state Active begin
  [*] --> NumLockOff
  NumLockOff --> NumLockOn : EvNumLockPressed
  --
  ScrollLockOff --> ScrollLockOn : EvScrollPressed
  ScrollLockOn --> [*]
end state
@enduml`);

    // Region 1 opens with `[*] --> NumLockOff`, so its circle leads.
    const initPass = passes.map(nodeIds).find((ids) => ids.some((id) => id.startsWith('__init_')));
    expect(initPass?.[0]).toMatch(/^__init_/);

    // Region 2 opens with `ScrollLockOff --> ScrollLockOn`, so its members
    // lead and the `[*]` it reaches on its LAST line sorts after them --
    // the case a bare hoist of the pseudo push would get wrong.
    const finalPass = passes.map(nodeIds).find((ids) => ids.some((id) => id.startsWith('__final_')));
    expect(finalPass?.slice(0, 2)).toEqual(['ScrollLockOff', 'ScrollLockOn']);
    expect(finalPass?.at(-1)).toMatch(/^__final_/);
  });
});
