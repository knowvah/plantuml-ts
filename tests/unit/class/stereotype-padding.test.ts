/**
 * isw-T2b-obj: Guillemet.manageGuillemetStrict (Guillemet.java:87-100) drops
 * ONE padding space per side of a `<<...>>` label, no more, and
 * StereotypePattern.java:68 captures the label untrimmed -- so
 * `class A <<  spaced  >>` draws `« spaced »` (jar render
 * tests/fixtures/isw-T2b-obj/stereotype-spaces.svg).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { splitStereotypeLabels, splitStereotypeStyleTags } from '../../../src/core/stereotype-decoration.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

describe('stereotype label padding', () => {
  it('keeps one inner space per side beyond the consumed one', () => {
    expect(splitStereotypeLabels('  spaced  ')).toEqual([' spaced ']);
  });

  it('consumes exactly one padding space per side', () => {
    expect(splitStereotypeLabels(' one ')).toEqual(['one']);
    expect(splitStereotypeLabels('tight')).toEqual(['tight']);
  });

  it('keeps the padding of a decorated label after the closing parenthesis', () => {
    expect(splitStereotypeLabels('(C,#FF0000)  lbl  ')).toEqual([' lbl ']);
    expect(splitStereotypeLabels('(C) lbl')).toEqual(['lbl']);
  });

  it('drops a decoration-only label and keeps stacked labels apart', () => {
    expect(splitStereotypeLabels('(C,#FF0000)')).toEqual([]);
    // StringUtils.isEmpty treats a whitespace-only LABEL as empty (jar: `<< (R,#FF7700)  >>` draws no text).
    expect(splitStereotypeLabels(' (R,#FF7700)  ')).toEqual([]);
    expect(splitStereotypeLabels('Singleton >>  << Startup ')).toEqual(['Singleton', 'Startup']);
  });

  it('style tags carry the same padded tokens (getStyleNames)', () => {
    expect(splitStereotypeStyleTags('  spaced  ')).toEqual([' spaced ']);
  });

  it('draws exactly the jar svg for class, package and object stereotypes', () => {
    const dir = new URL('../../fixtures/isw-T2b-obj/', import.meta.url);
    const puml = readFileSync(new URL('stereotype-spaces.puml', dir), 'utf8');
    const jar = readFileSync(new URL('stereotype-spaces.svg', dir), 'utf8');
    const ours = renderSync(puml, { measurer: new DeterministicMeasurer() });
    expect(compareSvg(ours, jar, 'deterministic').diffs).toEqual([]);
  });
});
