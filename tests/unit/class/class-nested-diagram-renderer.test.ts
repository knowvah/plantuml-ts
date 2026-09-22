/**
 * class-nested-diagram-renderer.test.ts — CDD T27: coverage for
 * `src/diagrams/class/class-nested-diagram-renderer.ts`, the class engine's
 * real `NestedDiagramRenderer` (`core/EmbeddedDiagram.ts`'s injected seam).
 *
 * Uses the REAL `renderSync` (`src/index.js`) as the injected `renderFn` —
 * not a mock — so these tests prove the renderer produces genuinely correct
 * dimensions/payload against this port's own render pipeline, and wires a
 * real `EmbeddedDiagram` (`core/EmbeddedDiagram.ts`, the exact seam
 * `MethodsOrFieldsArea.ts` consumes) on top of it to prove the full
 * "collect lines -> render -> TextBlock -> calculateDimension/drawU"
 * contract holds for a real renderer, not just the mocks
 * `MethodsOrFieldsArea.test.ts` already exercises.
 *
 * Fixture-level conformance (moxobo/zikabo/gadufu, the recursion guard
 * through a real `renderSync`) is covered separately in `class-body-
 * embedded-diagram-conformance.test.ts`, which is wired into production as
 * of CDD T27FU — see that file's own doc comment for what remains blocked
 * and why.
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import {
  createNestedDiagramRenderer,
  EmbeddedDiagramDepthError,
  MAX_NESTED_DIAGRAM_DEPTH,
  type RenderNestedDiagramFn,
} from '../../../src/diagrams/class/class-nested-diagram-renderer.js';
import { EmbeddedDiagram } from '../../../src/core/EmbeddedDiagram.js';
import { UGraphicSvg } from '../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder as DriverStringBounder } from '../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';

const measurer = new DeterministicMeasurer();
const driverBounder: DriverStringBounder = {
  calculateDimension(font, text) {
    return { width: measurer.measure(text, font).width };
  },
};

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driverBounder, measurer);
}

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
const sb: StringBounder = new FakeStringBounder();

/** Real `viewBox="0 0 W H"` extraction, independent of the module under
 *  test's own (private) copy — an oracle derived directly from `renderSync`'s
 *  own output, not a re-assertion of the implementation. */
function viewBoxDims(svg: string): { width: number; height: number } {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (m === null) throw new Error('test fixture SVG has no viewBox');
  return { width: Number(m[1]), height: Number(m[2]) };
}

const NESTED_SOURCE = ['@startuml', 'class X', '@enduml'];

/** Builds a self-embedding `RenderNestedDiagramFn` that calls back into the
 *  renderer it will be wrapped by — the shape a self-embedding class body
 *  would take once wired into production (see this module's own file doc
 *  comment for why that wiring does not exist yet). `ref` is a mutable
 *  holder (not a reassigned `let`) so the closure can see the renderer
 *  before `createNestedDiagramRenderer` returns it. */
function selfEmbeddingFn(ref: { current?: ReturnType<typeof createNestedDiagramRenderer> }): {
  fn: RenderNestedDiagramFn;
  calls: () => number;
} {
  let calls = 0;
  const fn: RenderNestedDiagramFn = () => {
    calls++;
    ref.current!.render(['@startuml', '{{', '@enduml'], null);
    return '<svg viewBox="0 0 1 1"></svg>';
  };
  return { fn, calls: () => calls };
}

describe('createNestedDiagramRenderer — real renderSync integration', () => {
  it("calculateDimension matches the nested render's own viewBox, read straight from renderSync", () => {
    const renderer = createNestedDiagramRenderer((src) => renderSync(src));
    const tb = renderer.render(NESTED_SOURCE, null);

    const standalone = renderSync(NESTED_SOURCE.join('\n'));
    const expected = viewBoxDims(standalone);

    const dim = tb.calculateDimension(sb);
    expect(dim.getWidth()).toBe(expected.width);
    expect(dim.getHeight()).toBe(expected.height);
  });

  it('drawU emits exactly one <image> whose width/height/href round-trip the PI-stripped nested SVG', () => {
    const renderer = createNestedDiagramRenderer((src) => renderSync(src));
    const tb = renderer.render(NESTED_SOURCE, null);

    const ug = newGraphic();
    tb.drawU(ug);
    const svg = ug.getSvgString();

    const imageMatches = svg.match(/<image[^>]*>/g) ?? [];
    expect(imageMatches).toHaveLength(1);

    const hrefMatch = /xlink:href="data:image\/svg\+xml;base64,([^"]+)"/.exec(imageMatches[0]!);
    expect(hrefMatch).not.toBeNull();
    const decoded = Buffer.from(hrefMatch![1]!, 'base64').toString('utf-8');

    // java:199 (`getImageSvg`): the embedded payload never carries a
    // `<?plantuml ...?>` processing instruction.
    expect(decoded).not.toContain('<?plantuml');
    const standaloneStripped = renderSync(NESTED_SOURCE.join('\n')).replace(/<\?plantuml.+?\?>/g, '');
    expect(decoded).toBe(standaloneStripped);

    const expected = viewBoxDims(standaloneStripped);
    expect(imageMatches[0]).toContain(`width="${expected.width}"`);
    expect(imageMatches[0]).toContain(`height="${expected.height}"`);
  });

  it('wired through a REAL EmbeddedDiagram (the exact seam MethodsOrFieldsArea.ts consumes), sizes correctly with no mock', () => {
    const renderer = createNestedDiagramRenderer((src) => renderSync(src));
    const diagram = EmbeddedDiagram.from(null, NESTED_SOURCE, renderer);

    const standalone = renderSync(NESTED_SOURCE.join('\n'));
    const expected = viewBoxDims(standalone);

    const dim = diagram.calculateDimension(sb);
    expect(dim.getWidth()).toBe(expected.width);
    expect(dim.getHeight()).toBe(expected.height);
  });
});

// ---------------------------------------------------------------------------
// Recursion guard (task item 3): EmbeddedDiagramDepthError
// ---------------------------------------------------------------------------

describe('createNestedDiagramRenderer — EmbeddedDiagramDepthError (recursion guard)', () => {
  it('throws once depth reaches maxDepth, rather than recursing unboundedly', () => {
    const ref: { current?: ReturnType<typeof createNestedDiagramRenderer> } = {};
    const { fn, calls } = selfEmbeddingFn(ref);
    ref.current = createNestedDiagramRenderer(fn, 5);

    expect(() => ref.current!.render(['@startuml', '{{', '@enduml'], null)).toThrow(EmbeddedDiagramDepthError);
    expect(calls()).toBe(5); // depth 0..4 call renderFn; the 5th render() call (depth===5) throws before calling it
  });

  it('the thrown error names itself EmbeddedDiagramDepthError and reports the configured bound', () => {
    const ref: { current?: ReturnType<typeof createNestedDiagramRenderer> } = {};
    const { fn } = selfEmbeddingFn(ref);
    ref.current = createNestedDiagramRenderer(fn, 3);

    let caught: unknown;
    try {
      ref.current.render(['@startuml', '@enduml'], null);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(EmbeddedDiagramDepthError);
    expect((caught as Error).name).toBe('EmbeddedDiagramDepthError');
    expect((caught as Error).message).toContain('3');
  });

  it('depth resets after a caught error (finally) — a later call on the SAME instance gets the full budget again', () => {
    const ref: { current?: ReturnType<typeof createNestedDiagramRenderer> } = {};
    const { fn, calls } = selfEmbeddingFn(ref);
    ref.current = createNestedDiagramRenderer(fn, 3);

    expect(() => ref.current!.render(['@startuml', '@enduml'], null)).toThrow(EmbeddedDiagramDepthError);
    const firstRunCalls = calls();
    expect(firstRunCalls).toBe(3);

    // A second, independent top-level call gets the SAME budget (3), not
    // fewer -- proving `depth--` ran in `finally` all the way back to 0
    // after the first call's error, rather than leaking depth across calls.
    expect(() => ref.current!.render(['@startuml', '@enduml'], null)).toThrow(EmbeddedDiagramDepthError);
    expect(calls() - firstRunCalls).toBe(3);
  });

  it('the default bound is MAX_NESTED_DIAGRAM_DEPTH when none is supplied', () => {
    const ref: { current?: ReturnType<typeof createNestedDiagramRenderer> } = {};
    const { fn, calls } = selfEmbeddingFn(ref);
    ref.current = createNestedDiagramRenderer(fn);
    expect(() => ref.current!.render(['@startuml', '@enduml'], null)).toThrow(EmbeddedDiagramDepthError);
    expect(calls()).toBe(MAX_NESTED_DIAGRAM_DEPTH);
  });

  it('a source below the depth bound with no real recursion never throws', () => {
    const renderer = createNestedDiagramRenderer((src) => renderSync(src), 2);
    expect(() => renderer.render(NESTED_SOURCE, null)).not.toThrow();
  });
});

// CDD T27FU: the renderer is now wired end-to-end (gadufu is real; moxobo/
// zikabo call the mechanism directly, blocked only on isEnhancedBody) — see
// class-body-embedded-diagram-conformance.test.ts for the fixture-level
// tests and its own trailing `it.todo` block for the remaining, more
// precisely diagnosed blockers.
