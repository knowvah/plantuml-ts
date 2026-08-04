/**
 * G2 N33 — collapsed-empty `package`/`namespace` leaf (`class-magma.ts
 * #isCollapsedGroup`) draws its OWN small `EntityImageEmptyPackage`
 * folder-tab icon instead of the generic classifier box. Jar-verified
 * against `gatula-10-bifu561` (`package foo {}` / `namespace bar {}` /
 * `class qux {}`): geometry (39.425x48 for "foo"), color (classifier-box
 * defaults, NOT the package-cluster's own `packageBorderColor`), and
 * unwrapped draw structure (`<path>`/`<line>`/`<text>` siblings, no
 * `<g class="entity">`).
 */
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import {
  measureEmptyPackageLeafDim,
  renderEmptyPackageIcon,
} from '../../../src/diagrams/class/class-namespace-shape.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

const measurer = new WidthTableMeasurer();
const detMeasurer = new DeterministicMeasurer();

describe('measureEmptyPackageLeafDim', () => {
  it('is rawTextWidth+20 x 2*rawTextHeight+20 for "foo" at 14pt (jar: 39.425x48)', () => {
    const dim = measureEmptyPackageLeafDim(measurer, defaultTheme, 'foo');
    expect(dim.width).toBeCloseTo(39.425, 3);
    expect(dim.height).toBe(48);
  });

  it('shares the SAME wtitle/htitle formula as a non-empty package cluster', () => {
    const dim = measureEmptyPackageLeafDim(measurer, defaultTheme, 'foo');
    expect(dim.wtitle).toBeCloseTo(25.425, 3);
    expect(dim.htitle).toBe(20);
  });

  // A2s F-D mechanism A8 -- EntityImageEmptyPackage.java:126-145: the
  // stereotype block (PACKAGE_STEREOTYPE 14pt, withMargin(_, 1, 0)) merges
  // into the dim: width = max(descW, stereoW+2)+20, height = max(descH +
  // stereoH, 2*descH)+20. Jar: dojanu-92-vizo468 p3 `package p3 <<Dummy>>`
  // emits 1.191493x0.666667in = 85.7875x48px.
  it('merges the <<stereotype>> block (dojanu-92-vizo468 p3: 85.7875x48)', () => {
    const dim = measureEmptyPackageLeafDim(measurer, defaultTheme, 'p3', ['Dummy']);
    expect(dim.width).toBeCloseTo(85.7875, 3);
    expect(dim.height).toBe(48);
  });

  it('stereo height only exceeds the atLeast(2*descH) clamp with 2+ labels', () => {
    // One 14pt label: descH + stereoH == 2*descH -> height unchanged (48).
    // Two labels: 14*3 + 20 = 62.
    const two = measureEmptyPackageLeafDim(measurer, defaultTheme, 'p3', ['A', 'B']);
    expect(two.height).toBe(62);
  });

  it('is byte-identical to the pre-A8 formula when there is no stereotype', () => {
    const bare = measureEmptyPackageLeafDim(measurer, defaultTheme, 'foo');
    const explicit = measureEmptyPackageLeafDim(measurer, defaultTheme, 'foo', []);
    expect(explicit).toEqual(bare);
  });
});

describe('renderEmptyPackageIcon', () => {
  it('draws classifier-box default colors (#181818/0.5/classBackground), not package-cluster colors', () => {
    const dim = measureEmptyPackageLeafDim(measurer, defaultTheme, 'foo');
    const svg = renderEmptyPackageIcon(
      { id: 'foo', x: 6, y: 7, label: 'foo', ...dim },
      defaultTheme,
    );
    expect(svg).toContain(`stroke="${defaultTheme.colors.border}"`);
    expect(svg).toContain('stroke-width="0.5"');
    expect(svg).toContain(`fill="${defaultTheme.colors.graph.classBackground}"`);
  });

  it('draws NO <g> wrapper (plain path+line+text siblings)', () => {
    const dim = measureEmptyPackageLeafDim(measurer, defaultTheme, 'foo');
    const svg = renderEmptyPackageIcon(
      { id: 'foo', x: 6, y: 7, label: 'foo', ...dim },
      defaultTheme,
    );
    expect(svg).not.toContain('<g');
    expect(svg).toContain('<path');
    expect(svg).toContain('<line');
    expect(svg).toContain('<text');
  });
});

describe('renderFixtureClass — gatula-10-bifu561 end-to-end', () => {
  it('an empty package/namespace draws unwrapped; a real classifier still wraps', () => {
    const svg = renderFixtureClass(
      `@startuml
package foo {
}

namespace bar {
}

class qux {}
@enduml`,
      detMeasurer,
    );
    // qux (real classifier) still gets the normal <g class="entity"> wrap.
    expect(svg).toContain('<!--class qux--><g class="entity"');
    // foo/bar (collapsed-empty) do not -- no comment, no wrapper, matching
    // jar's own bare-sibling structure (module doc comment above).
    expect(svg).not.toContain('<!--class foo-->');
    expect(svg).not.toContain('<!--class bar-->');
  });
});
