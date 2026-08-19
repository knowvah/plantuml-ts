/**
 * Feature family: concurrent region separators (`--`/`||`, one-or-more
 * repeats), the `state X begin ... end state` block form, and the `frame`
 * composite keyword — T2 gaps against CommandConcurrentState /
 * CommandCreatePackageState / CommandCreatePackage2 / CommandEndState.
 */
import { describe, it, expect } from 'vitest';
import { parseState } from '../../../src/diagrams/state/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { StateDiagramAST, State } from '../../../src/diagrams/state/ast.js';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver, type DotInputGraph } from '../../../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { dotInputToStructural } from '../../oracle/svek-dot.js';

function parse(source: string): StateDiagramAST {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'state' };
  return parseState(block);
}

function findState(ast: StateDiagramAST, id: string): State | undefined {
  return ast.states.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// Concurrent separator generalization: `--`, `---`, `||`, `||||`
// ---------------------------------------------------------------------------

describe('concurrent region separator — pipe form', () => {
  // Region 0 (before the FIRST separator) is `owner.children`, not a
  // `concurrentRegions` entry — see state-parse-state.ts's popScope doc.
  it('|| starts a new concurrent region, same as --', () => {
    const ast = parse(`
      state S {
        [*] --> A
        ||
        [*] --> B
      }
    `);
    const s = findState(ast, 'S');
    expect(s?.concurrentRegions).toHaveLength(1);
    expect(s?.children.some((st) => st.id === 'A')).toBe(true);
    expect(s?.concurrentRegions[0]?.some((st) => st.id === 'B')).toBe(true);
  });

  it('a longer run of dashes (---) also separates regions', () => {
    const ast = parse(`
      state S {
        [*] --> A
        ---
        [*] --> B
      }
    `);
    const s = findState(ast, 'S');
    expect(s?.concurrentRegions).toHaveLength(1);
  });

  it('a longer run of pipes (||||) also separates regions', () => {
    const ast = parse(`
      state S {
        [*] --> A
        ||||
        [*] --> B
      }
    `);
    const s = findState(ast, 'S');
    expect(s?.concurrentRegions).toHaveLength(1);
  });

  // G11 (SI28 concurrent-region/fimivu-15-vogi904): jar's `Separator.fromChar`
  // (`svek/ConcurrentStates.java:63-89`) reads '-' -> HORIZONTAL, '|' ->
  // VERTICAL from the FIRST character of the matched run.
  it('-- records a HORIZONTAL separator on the owner', () => {
    const ast = parse(`
      state S {
        [*] --> A
        --
        [*] --> B
      }
    `);
    expect(findState(ast, 'S')?.concurrentSeparator).toBe('HORIZONTAL');
  });

  it('|| records a VERTICAL separator on the owner', () => {
    const ast = parse(`
      state S {
        [*] --> A
        ||
        [*] --> B
      }
    `);
    expect(findState(ast, 'S')?.concurrentSeparator).toBe('VERTICAL');
  });

  it('three regions via two || separators', () => {
    const ast = parse(`
      state S {
        [*] --> A
        ||
        [*] --> B
        ||
        [*] --> C
      }
    `);
    const s = findState(ast, 'S');
    expect(s?.concurrentRegions).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// `state X begin ... end state` block form
// ---------------------------------------------------------------------------

describe('composite state — begin/end state block form', () => {
  it('state X begin ... end state parses as a composite', () => {
    const ast = parse(`
      state Composite begin
        A --> B
      end state
    `);
    const s = findState(ast, 'Composite');
    expect(s).toBeDefined();
    expect(s?.children.map((c) => c.id)).toEqual(['A', 'B']);
  });

  it('end state (case-insensitive, "END STATE") closes the block', () => {
    const ast = parse(`
      state Composite begin
        A --> B
      END STATE
    `);
    const s = findState(ast, 'Composite');
    expect(s?.children).toHaveLength(2);
  });

  it('} still closes a begin-opened block (mixed closer)', () => {
    const ast = parse(`
      state Composite begin
        A --> B
      }
    `);
    const s = findState(ast, 'Composite');
    expect(s?.children).toHaveLength(2);
  });

  it('quoted display name with begin/end state', () => {
    const ast = parse(`
      state 'My Composite' as MC begin
        A --> B
      end state
    `);
    const s = findState(ast, 'MC');
    expect(s?.display).toBe('My Composite');
  });
});

// ---------------------------------------------------------------------------
// `frame` composite keyword
// ---------------------------------------------------------------------------

describe('frame composite container', () => {
  it('frame X { ... } creates a State with container="frame"', () => {
    const ast = parse(`
      frame F {
        A --> B
      }
    `);
    const s = findState(ast, 'F');
    expect(s).toBeDefined();
    expect(s?.container).toBe('frame');
    expect(s?.children.map((c) => c.id)).toEqual(['A', 'B']);
  });

  it('frame X begin ... end state also works', () => {
    const ast = parse(`
      frame F begin
        A --> B
      end state
    `);
    const s = findState(ast, 'F');
    expect(s?.container).toBe('frame');
  });

  it('a plain state composite has container=undefined (not "frame")', () => {
    const ast = parse(`
      state S {
        A --> B
      }
    `);
    const s = findState(ast, 'S');
    expect(s?.container).toBeUndefined();
  });

  it('frame with quoted display name and color', () => {
    const ast = parse(`
      frame "My Frame" as MF #yellow {
        A --> B
      }
    `);
    const s = findState(ast, 'MF');
    expect(s?.display).toBe('My Frame');
    expect(s?.color).toBe('#yellow');
    expect(s?.container).toBe('frame');
  });
});

// ---------------------------------------------------------------------------
// Composite state opener with a stereotype (rare, but a valid grammar slot
// per CommandCreatePackageState's Stereogroup capture)
// ---------------------------------------------------------------------------

describe('composite state opener with stereotype', () => {
  it('state S <<fork>> { ... } resolves kind from the stereotype', () => {
    const ast = parse(`
      state S <<fork>> {
        A --> B
      }
    `);
    const s = findState(ast, 'S');
    expect(s?.kind).toBe('fork');
    expect(s?.stereotype).toBe('fork');
  });
});

// ---------------------------------------------------------------------------
// Re-declaration merges container in-place (declareState's update branch)
// ---------------------------------------------------------------------------

describe('re-declaring an auto-created state as a frame', () => {
  it('a state auto-created by a transition, then opened as a frame, merges container in-place', () => {
    const ast = parse(`
      A --> F
      frame F {
        X --> Y
      }
    `);
    const copies = ast.states.filter((s) => s.id === 'F');
    expect(copies).toHaveLength(1);
    expect(copies[0]?.container).toBe('frame');
  });
});

// ---------------------------------------------------------------------------
// Stray closer at top level — popScope's "never pop the root scope" guard
// ---------------------------------------------------------------------------

describe('stray closer with no open composite', () => {
  it('a bare `}` with nothing open does not crash and leaves the diagram intact', () => {
    const ast = parse(`
      A --> B
      }
      C --> D
    `);
    expect(ast.transitions).toHaveLength(2);
  });

  it('a bare `end state` with nothing open does not crash', () => {
    const ast = parse(`
      end state
      A --> B
    `);
    expect(ast.transitions).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// G11 (SI28 concurrent-region/fimivu-15-vogi904, mission
// state-declared-size-fix T10): `--` stacks regions top-to-bottom
// (width=max, height=sum); `||` stacks regions side-by-side (width=sum,
// height=max) -- the exact axis swap `ConcurrentStates.java:63-89`'s
// `Separator.add` performs. Pre-fix, this port applied the `--` formula
// unconditionally, so `A` (`--`) and `D` (`||`) below came out identically
// sized (both 86x164px); jar gives them swapped shapes.
// ---------------------------------------------------------------------------

describe('|| stacks regions horizontally, unlike -- (G11, fimivu-15-vogi904)', () => {
  // test-results/dot-cache/state/fimivu-15-vogi904/in.puml, verbatim.
  const FIMIVU = `@startuml
state A {
  state B
  --
  state C
}

state D {
  state E
  ||
  state F
}
@enduml`;

  const PX_PER_INCH = 72;
  // jar svek-5.dot:6-7 (both scope-5 nodes). A (--) is unaffected by this
  // fix and stays 86x164px; D (||) becomes 152x99px (width=sum of regions,
  // height=max of regions) instead of the pre-fix 86x164px this port used
  // to declare via the -- formula applied unconditionally.
  const JAR_A = { width: 1.194444, height: 2.277778 };
  const JAR_D = { width: 2.111111, height: 1.375 };

  function declaredScopes(markup: string): DotInputGraph[] {
    const inputs: DotInputGraph[] = [];
    setLayoutInputObserver((g) => inputs.push(g));
    try {
      renderSync(markup, { measurer: new WidthTableMeasurer() });
    } finally {
      setLayoutInputObserver(undefined);
    }
    return inputs;
  }

  it("declares A (--) and D (||) at jar's swapped-axis sizes, not identically", () => {
    const scopes = declaredScopes(FIMIVU);
    const outer = dotInputToStructural(scopes[scopes.length - 1]!);
    expect(outer.nodes).toHaveLength(2);
    const a = outer.nodes.find((n) => Math.abs(n.width - JAR_A.width) < 1e-5);
    const d = outer.nodes.find((n) => Math.abs(n.width - JAR_D.width) < 1e-5);
    expect(a, 'no node at A (--) width').toBeDefined();
    expect(d, 'no node at D (||) width').toBeDefined();
    expect(Math.abs(a!.width - JAR_A.width) * PX_PER_INCH).toBeLessThan(0.001);
    expect(Math.abs(a!.height - JAR_A.height) * PX_PER_INCH).toBeLessThan(0.001);
    expect(Math.abs(d!.width - JAR_D.width) * PX_PER_INCH).toBeLessThan(0.001);
    expect(Math.abs(d!.height - JAR_D.height) * PX_PER_INCH).toBeLessThan(0.001);
  });
});
