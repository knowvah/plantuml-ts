/**
 * `PSystemSkinparameterList` (PSystemSkinparameterList.java:55-110), pinned
 * against the jar probe `tests/fixtures/utility/skinparameters.svg`.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { stringBounderFor } from '../../../src/core/UgDiagram.js';
import { SKINPARAMETER_NAMES } from '../../../src/diagrams/donors/skinparameter-names.js';
import { getCols, PSystemSkinparameterList } from '../../../src/diagrams/donors/PSystemSkinparameterList.js';
import { skinparameterListPlugin } from '../../../src/diagrams/donors/PSystemSkinparameterListFactory.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import { fixture, renderWith } from '../../helpers/utility-single-line.js';

const sb = stringBounderFor(new DeterministicMeasurer());

describe('PSystemSkinparameterList.getCols (java:89-97)', () => {
  it('478 names in 5 columns: maxLine = (478 + 4) / 5 = 96, so 5 columns', () => {
    expect(SKINPARAMETER_NAMES).toHaveLength(478);
    expect(getCols(SKINPARAMETER_NAMES, 5)).toHaveLength(5);
  });

  it('no lines gives no columns (maxLine 0, loop never runs)', () => {
    expect(getCols([], 5)).toEqual([]);
  });

  it('7 lines in 5 columns: maxLine = 11 / 5 = 2, so 4 columns', () => {
    expect(getCols(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 5)).toHaveLength(4);
  });

  it('the first column is the 96 first names, taller than the 94-name last one', () => {
    const cols = getCols(SKINPARAMETER_NAMES, 5);
    expect(cols[0]!.calculateDimension(sb).getHeight()).toBeGreaterThan(cols[4]!.calculateDimension(sb).getHeight());
  });
});

describe('PSystemSkinparameterList render', () => {
  const source = fixture('skinparameters.puml');

  it('describes itself as (Parameters)', () => {
    const d = PSystemSkinparameterList.create({ lines: [], type: 'sequence' }, new PreprocessingArtifact());
    expect(d.getDescription()).toBe('(Parameters)');
  });

  it('matches the jar oracle (skinparameters probe) with zero diffs', () => {
    const { pass, diffs } = compareSvg(
      renderWith(skinparameterListPlugin, source),
      fixture('skinparameters.svg'),
      'deterministic',
    );
    expect(diffs).toEqual([]);
    expect(pass).toBe(true);
  });

  it('is deterministic across three renders', () => {
    const first = renderWith(skinparameterListPlugin, source);
    expect(renderWith(skinparameterListPlugin, source)).toBe(first);
    expect(renderWith(skinparameterListPlugin, source)).toBe(first);
  });
});
