/**
 * T6 proof obligation (`plans/namespace-cluster-box/decisions.md#3`): an
 * empty `package`/`namespace` must never reach the CLUSTER box-drawing path
 * (`renderNamespace` / `renderNamespaceFolder` / `renderNamespaceRect`,
 * fed by `buildNamespaceGeos`'s `NamespaceGeo[]`). It must instead be
 * collapsed by `collapseEmptyNamespacesFinal` (`class-namespace.ts`) into a
 * `kind: 'descriptive'`, `usymbol: undefined` leaf classifier
 * (`isCollapsedGroup`, `class-magma.ts`) that draws through the SEPARATE
 * `renderEmptyPackageLeaf` -> `renderEmptyPackageIcon` path
 * (`renderer.ts`/`class-namespace-shape.ts`), with its own
 * `measureEmptyPackageLeafDim` footprint — never `NAMESPACE_SIDE_PADDING`/
 * `NAMESPACE_TOP_EXTRA` (retired this task as dead code: nothing read them
 * for geometry after T5's `buildNamespaceGeos` rewrite).
 *
 * This is provable mechanically: `nonEmptyNamespaceIds`
 * (`class-dot-graph.ts`) keeps exactly the namespaces that are non-empty OR
 * an ancestor of one — the SAME criterion `collapseEmptyNamespace`'s own
 * "no direct classifiers AND no live child namespace" test collapses on
 * (`class-namespace.ts`'s own doc comment). So every namespace surviving
 * `collapseEmptyNamespacesFinal` is guaranteed a `clusterIdByNs` entry, and
 * every namespace that does NOT survive was already turned into a leaf
 * classifier before `buildNamespaceGeos` ever runs. The two outcomes are
 * exhaustive and disjoint.
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { layoutClass, classifierLeaves } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { renderFixture } from '../../helpers/render.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

// Multi-line `package Empty { }` -- deliberately NOT the same-line `X {}`
// form, so the emptiness survives parsing and is only resolved by
// `layoutClass`'s internal `collapseEmptyNamespacesFinal` call (the
// reopen-safe collapse this proof targets), matching `collapseEmptyNamespace`'s
// own doc comment on why the two collapse sites exist.
const SOURCE = `
  package Full {
  class A
  }
  package Empty {
  }
  class B
  A --> B
`;

describe('T6: an empty package never draws a cluster box with no cluster', () => {
  const measurer = new FormulaMeasurer();

  it('collapseEmptyNamespacesFinal removes Empty from ast.namespaces, keeps Full', () => {
    const geo = layoutClass(parse(SOURCE), defaultTheme, measurer);
    expect(geo.namespaces.map((n) => n.id)).toEqual(['Full']);
  });

  it('Empty becomes an isCollapsedGroup leaf classifier with a folderTab footprint', () => {
    const geo = layoutClass(parse(SOURCE), defaultTheme, measurer);
    const emptyLeaf = classifierLeaves(geo.leaves).find((c) => c.id === 'Empty');
    expect(emptyLeaf).toBeDefined();
    expect(emptyLeaf!.folderTab).toBeDefined();
    // Never appears as a NamespaceGeo -- that would mean it reached the
    // cluster box-drawing path (`buildNamespaceGeos`/`renderNamespace`).
    expect(geo.namespaces.some((n) => n.id === 'Empty')).toBe(false);
  });

  it('Full gets a NamespaceGeo box, is not also a leaf classifier', () => {
    const geo = layoutClass(parse(SOURCE), defaultTheme, measurer);
    expect(geo.namespaces.some((n) => n.id === 'Full')).toBe(true);
    expect(classifierLeaves(geo.leaves).some((c) => c.id === 'Full')).toBe(false);
  });
});

describe('T6: byte-level render proof -- Empty draws the small leaf icon, not a cluster', () => {
  const svg = renderFixture(`@startuml\n${SOURCE}\n@enduml`);

  it('draws exactly one <g class="cluster"> element (Full only)', () => {
    expect(svg.match(/<g class="cluster"/g)).toHaveLength(1);
    expect(svg).toContain('data-qualified-name="Full"');
  });

  it('draws Empty as a standalone leaf-icon <path>, fill/stroke from renderEmptyPackageIcon '
    + '(theme.colors.graph.classBackground / theme.colors.border, stroke-width 0.5) -- '
    + 'NOT renderNamespaceFolder\'s cluster styling (fill="none", stroke-width 1.5)', () => {
    expect(svg).toContain(
      'd="M99.5,37 L140.5,37 A3.75,3.75 0 0 1 143,39.5 L150,59 L154.5,59 A2.5,2.5 0 0 1 157,61.5 '
        + 'L157,86.5 A2.5,2.5 0 0 1 154.5,89 L99.5,89 A2.5,2.5 0 0 1 97,86.5 L97,39.5 A2.5,2.5 0 0 1 99.5,37" '
        + 'fill="#F1F1F1" stroke="#181818" stroke-width="0.5"',
    );
    expect(svg).toContain('<text x="101" y="49.444" font-size="14" font-weight="700" fill="#000" textLength="40">Empty</text>');
  });

  it('the Empty leaf path is NOT nested inside a <g class="cluster"> wrapper', () => {
    const clusterOpen = svg.indexOf('<g class="cluster"');
    const clusterClose = svg.indexOf('</g>', clusterOpen);
    const emptyPathIdx = svg.indexOf('154.5,89 L99.5,89');
    expect(emptyPathIdx).toBeGreaterThan(clusterClose);
  });
});
