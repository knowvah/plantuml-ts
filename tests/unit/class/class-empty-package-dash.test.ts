/**
 * cdd6-T3d (fokudi-24-limo685): the empty-package leaf's folder tab draws
 * with `style.getStroke(colors)` (`EntityImageEmptyPackage.java:108`), which
 * carries the LineStyle dash (`skinparam package { BorderStyle dashed }`,
 * `FromSkinparamToStyle.java:277`) onto BOTH the outline and the tab hline;
 * (`7,7` = the dashed LineStyle's 7/7 visible/space pair).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';

const SOURCE = [
  '@startuml',
  'skinparam package {',
  '  BorderStyle dashed',
  '}',
  'package "package 2" as p2 {',
  '}',
  '@enduml',
].join('\n');

describe('empty-package leaf BorderStyle dash', () => {
  it('dashes the folder outline and the tab line', () => {
    const svg = renderSync(SOURCE, { measurer: new FormulaMeasurer() });
    const tags = svg.match(/<(path|line) [^>]*>/g) ?? [];
    expect(tags).toHaveLength(2);
    for (const tag of tags) expect(tag).toContain('stroke-width="0.5" stroke-dasharray="7,7"');
  });
});
