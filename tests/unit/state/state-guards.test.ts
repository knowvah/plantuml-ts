/**
 * G24 concurrent-region + dotted-phantom guards — mission
 * state-declared-size-fix/T5, decisions.md#D2.
 *
 * Ports two upstream refusal gates into `state-parse-resolve.ts`:
 *  - `StateDiagram#checkConcurrentStateOk`/`checkConcurrentStateOkInternal`
 *    (`StateDiagram.java:70-90`), called from both
 *    `CommandLinkStateCommon#getEntity` (`CommandLinkStateCommon.java:
 *    166-174,271`, transition endpoints — `ensureState`'s tail) and
 *    `CommandCreateState#executeArg` (`CommandCreateState.java:189-191`,
 *    plain declarations — `declareState`'s flat branch): reusing an entity
 *    whose real parent is a DIFFERENT `--`/`||` concurrent region than the
 *    one currently open refuses the diagram.
 *  - `CommandLinkStateCommon.java:277-278`'s `quark.getParent().getData()
 *    == null` gate: a dotted transition-endpoint reference whose walk
 *    manufactures its final segment's DIRECT parent brand-new (a phantom,
 *    per `Quark#child`'s per-segment walk never assigning Entity data to a
 *    freshly-created intermediate) refuses rather than drawing the phantom.
 *
 * Both throw `DiagramRefusal` (decisions.md#D2: our error names STATE at
 * the real line footprint this parser tracks — none — so `line` is
 * `undefined` and the banner lands on the source's last line; the jar's
 * own `PSystemErrorUtils#mergeV2` banner text may differ, e.g. zecivu-62's
 * jar output says "Assumed diagram type: sequence").
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { parseState } from '../../../src/diagrams/state/parser.js';
import { DiagramRefusal } from '../../../src/core/error/error-diagrams.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function block(source: string): UmlSource {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return { lines, type: 'state' };
}

/** Same de-NBSP convention as allowmixing-gate.test.ts: the port's error
 *  text renders `fontFamily: 'monospace'`, which the SVG emitter turns
 *  every space into U+00A0 (SvgGraphics.java:727-728). */
const deNbsp = (svg: string): string => svg.split(' ').join(' ');

describe('G24 concurrent-region guard — checkConcurrentStateOk (StateDiagram.java:70-90)', () => {
  it('cagego-53-vemo516: a transition inside a LATER concurrent region referencing a state whose real parent is a sibling composite refuses ("The state c cannot be used here.")', () => {
    const src = `
      state S {
        state a
        --
        state b {
          state c
        }
        c -> d
      }
    `;
    let thrown: unknown;
    try {
      parseState(block(src));
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(DiagramRefusal);
    expect((thrown as DiagramRefusal).message).toBe('The state c cannot be used here.');
    expect((thrown as DiagramRefusal).assumedDiagramType).toBe('state');
  });

  it('xacona-99-peze211 shape: a transition in one concurrent region referencing a state declared inside a DIFFERENT region\'s nested composite refuses ("The state pUndetected cannot be used here.")', () => {
    const src = `
      state Drive {
        state Ping {
          pUndetected --> pDetected
        }
        --
        state conditionsForward <<join>>
        pUndetected --> conditionsForward
      }
    `;
    let thrown: unknown;
    try {
      parseState(block(src));
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(DiagramRefusal);
    expect((thrown as DiagramRefusal).message).toBe('The state pUndetected cannot be used here.');
  });

  it('zecivu-62-pagu681: a root-level transition referencing an id later re-declared inside a concurrent region refuses ("The state XA13 cannot be used here.")', () => {
    const src = `
      XA13 --> Y1
      state XA6 {
        XA6 --> XA1
        --
        state XA13
      }
    `;
    let thrown: unknown;
    try {
      parseState(block(src));
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(DiagramRefusal);
    expect((thrown as DiagramRefusal).message).toBe('The state XA13 cannot be used here.');
  });

  it('a transition BETWEEN two states declared in the SAME concurrent region stays legitimate (no false positive)', () => {
    const ast = parseState(
      block(`
        state S {
          state a
          --
          state b
          state c
          b -> c
        }
      `),
    );
    expect(ast.states).toHaveLength(1);
  });

  it('a transition FROM a region-0 (non-concurrent) sibling written INSIDE a later concurrent region is ALSO refused -- upstream draws no distinction between "new reference" and "re-declare" shapes, both cross the SAME boundary (cagego/xacona/zecivu\'s general case, not a special one)', () => {
    const src = `
      state S {
        state a
        --
        state b
        a -> b
      }
    `;
    let thrown: unknown;
    try {
      parseState(block(src));
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(DiagramRefusal);
    expect((thrown as DiagramRefusal).message).toBe('The state a cannot be used here.');
  });

  it('a transition crossing a NON-concurrent scope boundary (no "--" involved) stays legitimate (no false positive)', () => {
    const ast = parseState(
      block(`
        state Outer {
          state Inner
        }
        Outer -> Inner
      `),
    );
    expect(ast.transitions).toEqual([expect.objectContaining({ from: 'Outer', to: 'Inner' })]);
  });
});

describe('G24 dotted-phantom guard — CommandLinkStateCommon.java:277-278 (quark.getParent().getData() == null)', () => {
  it('fugedo-34-fice721: a dotted transition endpoint whose walk manufactures a brand-new intermediate ancestor (sibling reach-across) refuses ("The state ChildMode1.A cannot be used here."), drawing no phantom', () => {
    const src = `
      state ParentMode {
        state ChildMode1 {
          A :
        }
        state ChildMode2 {
          C --> ChildMode1.A
          D --> ChildMode1
        }
      }
    `;
    let thrown: unknown;
    try {
      parseState(block(src));
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(DiagramRefusal);
    expect((thrown as DiagramRefusal).message).toBe('The state ChildMode1.A cannot be used here.');
  });

  it('a dotted DECLARATION (not a transition endpoint) manufacturing a fresh ancestor is legitimate -- the gate is neutral-mode (ensureState) only', () => {
    const ast = parseState(block('state B.A.X'));
    const b = ast.states.find((s) => s.id === 'B');
    expect(b?.children.map((c) => c.id)).toEqual(['A']);
  });

  it('a dotted transition endpoint reaching an ALREADY-DECLARED nested composite (no fresh ancestor) is legitimate (bujuta-44-rovo666 shape)', () => {
    const ast = parseState(
      block(`
        state Somp {
          state entry1
          state exitA
        }
        Somp.entry1 --> Somp.exitA
      `),
    );
    expect(ast.transitions).toEqual([expect.objectContaining({ from: 'entry1', to: 'exitA' })]);
  });
});

describe('G24 guards, full pipeline — renderSync produces the jar-shaped error diagram, not a phantom render', () => {
  const ERROR_BANNER = 'plantuml-ts version';

  it('cagego-53-vemo516 shape renders the error diagram (banner + message), never a phantom "d" node', () => {
    const svg = renderSync(
      '@startuml\nstate S {\nstate a\n--\nstate b {\nstate c\n}\nc -> d\n}\n@enduml',
    );
    const text = deNbsp(svg);
    expect(text).toContain(ERROR_BANNER);
    expect(text).toContain('The state c cannot be used here.');
    expect(svg).not.toContain('>d<');
  });

  it('fugedo-34-fice721 shape renders the error diagram (source echoed as text), never a REAL "ChildMode1" graph node -- the refusal fires at parse time, before layout ever runs', () => {
    const svg = renderSync(
      '@startuml\nstate ParentMode {\nstate ChildMode1 {\nA :\n}\nstate ChildMode2 {\nC --> ChildMode1.A\nD --> ChildMode1\n}\n}\n@enduml',
    );
    const text = deNbsp(svg);
    expect(text).toContain(ERROR_BANNER);
    expect(text).toContain('The state ChildMode1.A cannot be used here.');
    // The echoed source listing legitimately contains the word "ChildMode1"
    // as plain text -- what must be ABSENT is a rendered entity node for it
    // (the error page's OWN background/banner rects are expected).
    expect(svg).not.toContain('data-qualified-name="ChildMode1"');
    expect(svg).not.toContain('class="entity"');
  });
});
