/**
 * S1L-b T1 — creole horizontal rules in a leaf `[ … ]` body render via the
 * stencil interceptor, never crashing `LimitFinder`.
 *
 * Root cause this locks down: `USymbolCloud.asSmall` had dropped upstream's
 * `ug = UGraphicStencil.create(ug, dim)` wrap (every other symbol keeps it,
 * directly or via a `MyUGraphic*` subclass). Without it, a cloud body
 * carrying a creole HR (`----`/`====`) draws a raw `UHorizontalLine` — an
 * infinite, stencil-clipped shape — that reaches the ink-extent
 * `LimitFinder` pass (run for any 2+ element diagram) and throws
 * `unsupported shape UHorizontalLine`, producing an error diagram. See
 * `src/core/decoration/symbol/USymbolCloud.ts` and mission ADR-1.
 */

import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { expectNoErrorDiagram } from '../../helpers/error-diagram.js';

describe('description — creole HR in a leaf body (S1L-b T1)', () => {
  it('cloud with an HR body + a second element renders (was the LimitFinder crash)', () => {
    // Minimal repro of codabo-50: cloud HR body only crashed once a 2+ element
    // layout ran the ink-extent LimitFinder pass over the cloud's label.
    const svg = renderSync('@startuml\nactor actor\ncloud c [\nSome text\n----\nOther text\n]\n@enduml');
    expectNoErrorDiagram(svg, 'cloud HR body');
  });

  it('every rectangle-family symbol renders an HR body without an error diagram', () => {
    const body = 'Some text\n----\nOther text';
    for (const kw of ['node', 'component', 'artifact', 'folder', 'frame', 'database', 'storage', 'cloud', 'usecase']) {
      const svg = renderSync(`@startuml\nactor a\n${kw} x [\n${body}\n]\n@enduml`);
      expectNoErrorDiagram(svg, `${kw} HR body`);
    }
  });

  it('a mixed plain/titled HR body (codabo-50 shape) renders without an error diagram', () => {
    const body = 'no1\n----\nno2\n====\nno3\n--title1--\nno4\n==title2==\nno5';
    const svg = renderSync(`@startuml\nnode node2 [\n${body}\n]\ndatabase left [\n${body}\n]\ncloud cl [\n${body}\n]\n@enduml`);
    expectNoErrorDiagram(svg, 'mixed HR bodies');
  });

  it('an HR-free cloud is unaffected (stencil wrap is a pass-through)', () => {
    const svg = renderSync('@startuml\nactor a\ncloud c [\njust text\nmore text\n]\n@enduml');
    expectNoErrorDiagram(svg, 'HR-free cloud');
    expect(svg).toContain('just text');
  });
});
