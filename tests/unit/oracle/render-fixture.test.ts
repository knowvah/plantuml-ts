import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixture, renderFixtureSurveyStyle } from '../../oracle/svg-conformance/render-fixture.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const PINNED = join(REPO, 'oracle/goldens/svg-description/component/bekeno-37-luna380');

describe('renderFixture (survey-style renderSync)', () => {
  it('returns the pinned SVG the ratchet expects, with no error page', () => {
    const markup = readFileSync(join(PINNED, 'in.puml'), 'utf8');
    const { svg, errorPage } = renderFixtureSurveyStyle(markup, new DeterministicMeasurer());
    expect(errorPage).toBe(false);
    expect(svg.startsWith('<?plantuml') || svg.startsWith('<svg')).toBe(true);
    expect(renderFixture(markup, new DeterministicMeasurer())).toBe(svg);
  });

  it('flags an error page and renderFixture throws on it', () => {
    const markup = readFileSync(join(REPO, 'test-results/dot-cache/component/dirofi-81-cuga514/in.puml'), 'utf8');
    expect(renderFixtureSurveyStyle(markup, new DeterministicMeasurer()).errorPage).toBe(true);
    expect(() => renderFixture(markup, new DeterministicMeasurer())).toThrow('renderSync drew an error page');
  });
});
