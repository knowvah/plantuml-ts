/**
 * Feature family: concurrent region separators (`--`/`||`, one-or-more
 * repeats), the `state X begin ... end state` block form, and the `frame`
 * composite keyword — T2 gaps against CommandConcurrentState /
 * CommandCreatePackageState / CommandCreatePackage2 / CommandEndState.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseState } from '../../../src/diagrams/state/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { StateDiagramAST, State } from '../../../src/diagrams/state/ast.js';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver, type DotInputGraph } from '../../../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { dotInputToStructural, parseSvekDot, type StructuralGraph } from '../../oracle/svek-dot.js';
import { buildTopLevelPass } from '../../../src/diagrams/state/state-composite-pass.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { resolveArrowLabelFont } from '../../../src/core/arrow-label-font.js';

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

// ---------------------------------------------------------------------------
// SI31 T2 (G17, plans/state-declared-size-fix/findings/G17-note-only-region.md):
// a `--`-delimited region with NO materialized `State` members (a note-only
// trailing region — `regionInkGeometry`'s `ink` stays the degenerate {0,0}
// sentinel) must size from the region's own raw declared node boxes +
// SvekResult's real `.delta(15, 15)` margin (`SvekResult.java:135`), not
// dot-engine's raw graph canvas (`graph-layout.ts#canvasSize`'s flat
// `CANVAS_MARGIN=12`). Pins directly against the cached jar oracle
// `svek-N.dot` dumps -- same scope/axis/index pairing
// `scripts/measure-composite-declared-size.ts` uses -- so this test is
// self-verifying against the real oracle file, not a transcribed number.
// ---------------------------------------------------------------------------

describe('note-only concurrent region sizes from SvekResult margin, not raw canvas (G17, joleju-94-maru748)', () => {
  const SLUG = 'joleju-94-maru748';
  const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/state', SLUG);

  // scripts/measure-composite-declared-size.ts's own tolerance: both sides
  // emit 6 decimal places, so anything under this is formatting noise.
  const EXACT_EPSILON = 5e-7;

  function jarScope(scope: number): StructuralGraph {
    return parseSvekDot(readFileSync(join(CACHE, `svek-${scope}.dot`), 'utf8'));
  }

  function captureAll(): DotInputGraph[] {
    const captured: DotInputGraph[] = [];
    setLayoutInputObserver((g) => captured.push(g));
    try {
      renderSync(readFileSync(join(CACHE, 'in.puml'), 'utf8'), { measurer: new WidthTableMeasurer() });
    } finally {
      setLayoutInputObserver(undefined);
    }
    return captured;
  }

  const captured = captureAll();
  const ourScope = (scope: number): StructuralGraph => dotInputToStructural(captured[scope - 1]!);
  const sortedAxis = (g: StructuralGraph, axis: 'width' | 'height'): number[] =>
    g.nodes.map((n) => n[axis]).sort((a, b) => a - b);

  // scope9=OS1.IS2's own note-only trailing region, scope11=OS1.IS1's,
  // scope12=OS1's -- the three composites in this fixture that each own a
  // `--`-delimited region containing ONLY a `note` (finding's own
  // `mechanism` paragraph). idx picks out the composite's own declared
  // node within that scope's sorted width/height array (widest for the
  // width rows since the note dominates; scope12 has a single node so idx0
  // covers both axes).
  const TARGET_ROWS: { scope: number; axis: 'width' | 'height'; idx: number }[] = [
    { scope: 9, axis: 'width', idx: 2 },
    { scope: 9, axis: 'height', idx: 2 },
    { scope: 11, axis: 'width', idx: 2 },
    { scope: 11, axis: 'height', idx: 2 },
    { scope: 12, axis: 'width', idx: 0 },
    { scope: 12, axis: 'height', idx: 0 },
  ];

  it.each(TARGET_ROWS)(
    'scope$scope $axis idx$idx: our declared size matches jar exactly',
    ({ scope, axis, idx }) => {
      const jar = sortedAxis(jarScope(scope), axis)[idx]!;
      const ours = sortedAxis(ourScope(scope), axis)[idx]!;
      expect(Math.abs(ours - jar)).toBeLessThan(EXACT_EPSILON);
    },
  );

  // Regression guard for the non-degenerate path (D3/acceptance: "byte-
  // identical to before this change"). Every OTHER scope in this fixture
  // already matched jar exactly before this fix (finding's own `ruledOut`
  // paragraph: "scopes 1-8,10 all EXACT on re-measurement") -- these are
  // regions WITH materialized states, so `regionInkGeometry`'s degenerate
  // branch never fires for them. If the fix's `states.length === 0` gate
  // were ever widened to also touch a non-degenerate region, one of these
  // would stop matching jar.
  const NON_DEGENERATE_SCOPES = [1, 2, 3, 4, 5, 6, 7, 8, 10];

  it.each(NON_DEGENERATE_SCOPES)('scope%i (materialized states) stays within jar tolerance', (scope) => {
    const jar = jarScope(scope);
    const ours = ourScope(scope);
    for (const axis of ['width', 'height'] as const) {
      const jarAxis = sortedAxis(jar, axis);
      const ourAxis = sortedAxis(ours, axis);
      expect(ourAxis).toHaveLength(jarAxis.length);
      for (let i = 0; i < jarAxis.length; i++) {
        expect(Math.abs(ourAxis[i]! - jarAxis[i]!)).toBeLessThan(EXACT_EPSILON);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// SI31 T3 (G21, plans/state-declared-size-fix/findings/G21-dot-identical-
// geometry.md): `buildConcurrentBranchAcc` (state-composite-concurrent.ts)
// called `newAccumulator()` with NO arguments, so a `--`-delimited region's
// own `PassAccumulator` carried neither `labelFont` nor `measurer` -- the
// SAME two arguments its sibling call sites (state-composite-pass.ts:281,
// state-composite-autonom.ts:195) both pass. Without them,
// `attachInlineTransitionLabel`'s `measured !== undefined` gate
// (state-transition-label.ts:377-386) always fails for a region-local
// labeled transition, discarding graphviz's real `labelX`/`labelY` and
// folding only a fallback anchor POINT (never the label's real box) into
// the region's ink extent (`layout-ink-extent.ts#addTransitionInk`).
// ---------------------------------------------------------------------------

describe('concurrent-region PassAccumulator carries labelFont/measurer (G21, zacajo-09-tamu628)', () => {
  const MARKUP = `
    state S {
      A -> B : guard1
      --
      C -> D : guard2
    }
  `;

  it('every resolved region pass\'s accumulator carries both labelFont and measurer', () => {
    const ast = parse(MARKUP);
    const measurer = new WidthTableMeasurer();
    const { ctx } = buildTopLevelPass(ast, defaultTheme, measurer);
    expect(ctx.resolvedRegions.size).toBeGreaterThan(0);
    for (const [key, region] of ctx.resolvedRegions) {
      expect(region.acc.labelFont, `region "${key}" missing labelFont`).toBeDefined();
      expect(region.acc.measurer, `region "${key}" missing measurer`).toBe(measurer);
    }
  });

  it('the region accumulator\'s labelFont matches resolveArrowLabelFont(theme), like both sibling call sites', () => {
    const ast = parse(MARKUP);
    const measurer = new WidthTableMeasurer();
    const { ctx } = buildTopLevelPass(ast, defaultTheme, measurer);
    const expectedFont = resolveArrowLabelFont(defaultTheme);
    for (const region of ctx.resolvedRegions.values()) {
      expect(region.acc.labelFont).toEqual(expectedFont);
    }
  });
});
