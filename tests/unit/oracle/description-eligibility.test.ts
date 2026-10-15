import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  dotEligibility,
  ELIGIBLE_TYPES,
  type SurveyRow,
} from '../../oracle/svg-conformance/description-eligibility.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const survey = (type: string): SurveyRow[] =>
  (
    JSON.parse(readFileSync(join(REPO, `tests/oracle/svg-conformance/parity-${type}.json`), 'utf8')) as {
      fixtures: SurveyRow[];
    }
  ).fixtures;
const row = (type: string, slug: string): SurveyRow | undefined => survey(type).find((r) => r.slug === slug);

describe('dotEligibility', () => {
  it('admits component, usecase, unknown and c4', () => {
    expect([...ELIGIBLE_TYPES]).toEqual(['component', 'usecase', 'unknown', 'c4']);
  });

  it('a conformant row with dotEqual=false is not eligible (real row)', () => {
    const r = row('component', 'dirofi-81-cuga514');
    expect(r).toMatchObject({ verdict: 'conformant', dotEqual: false });
    expect(dotEligibility('component', r, undefined)).toEqual({
      ok: false,
      reason: 'dotEqual=false in parity-component.json',
    });
  });

  it('a dotEqual component row is eligible without consulting routing', () => {
    expect(dotEligibility('component', { slug: 's', dotEqual: true }, undefined)).toEqual({
      ok: true,
      reason: 'dotEqual=true',
    });
  });

  it('an unknown row is eligible only when routed DESCRIPTION', () => {
    const r = { slug: 's', dotEqual: true };
    expect(dotEligibility('unknown', r, 'DESCRIPTION')).toEqual({
      ok: true,
      reason: 'dotEqual=true, routed DESCRIPTION',
    });
    expect(dotEligibility('unknown', r, 'CLASS').reason).toBe('routing-baseline ourType=CLASS, not DESCRIPTION');
    expect(dotEligibility('unknown', r, undefined).ok).toBe(false);
  });

  it('the real conformant c4 rows route to NONE/CLASS, so neither is eligible', () => {
    const xetego = row('c4', 'xetego-25-dinu652');
    expect(dotEligibility('c4', xetego, 'CLASS').ok).toBe(false);
    expect(dotEligibility('c4', row('c4', 'kipive-74-lele070'), 'NONE').ok).toBe(false);
  });

  it('rejects a missing row and a foreign type', () => {
    expect(dotEligibility('component', undefined, undefined).reason).toBe('no parity-component.json row');
    expect(dotEligibility('class', { slug: 's', dotEqual: true }, 'DESCRIPTION').reason).toBe(
      'type class is not a description ratchet type',
    );
  });
});
