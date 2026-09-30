/**
 * cdd6-T3d (bijufi-98-xafa015): a package holding only a legend collapses
 * to an empty-package leaf, and `EntityImageEmptyPackage` uses that legend
 * as the leaf's stereo block (`EntityImageEmptyPackage.java:121-124`,
 * `EntityImageLegend.create(legend.getDisplay(), skinParam)`) -- sized by
 * `mergeTB(desc, stereoBlock)` (:140-145) and drawn where the stereotype
 * would be.
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { renderSync } from '../../../src/index.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { measureEmptyPackageLeafDim } from '../../../src/diagrams/class/class-empty-package.js';
import { collapseEmptyNamespacesFinal } from '../../../src/diagrams/class/class-namespace.js';

const measurer = new FormulaMeasurer();
const SOURCE = ['package P {', 'legend', 'P legend', 'end legend', '}'];

describe('empty-package leaf legend', () => {
  it('carries the group legend onto the collapsed leaf', () => {
    const ast = collapseEmptyNamespacesFinal(parseClass({ lines: SOURCE, type: 'class' }));
    const leaf = ast.classifiers.find((c) => c.id === 'P');
    expect(leaf?.collapsedGroup).toBe(true);
    expect(leaf?.legend?.display).toEqual(['P legend']);
  });

  it('sizes the leaf with the legend block as its stereo block', () => {
    const ast = collapseEmptyNamespacesFinal(parseClass({ lines: SOURCE, type: 'class' }));
    const leaf = ast.classifiers.find((c) => c.id === 'P')!;
    const plain = measureEmptyPackageLeafDim(measurer, defaultTheme, 'P');
    const dim = measureEmptyPackageLeafDim(measurer, defaultTheme, 'P', [], leaf.legend);
    expect(dim.stereo?.body).toContain('P legend');
    const sw = dim.stereo!.width;
    const sh = dim.stereo!.height;
    expect(dim.width).toBeCloseTo(Math.max(plain.width - 20, sw) + 20, 6);
    const descH = (plain.height - 20) / 2;
    expect(dim.height).toBeCloseTo(Math.max(descH + sh, 2 * descH) + 20, 6);
  });

  it('draws the legend inside the leaf', () => {
    const svg = renderSync(['@startuml', ...SOURCE, '@enduml'].join('\n'), { measurer });
    expect(svg).toMatch(/>P legend<\/text>/);
  });
});
