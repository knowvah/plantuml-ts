/**
 * Unit tests for state-shadow.ts — mission skin-file-loading Batch 2.
 * Verifies the filter def markup matches jar's exact shape (byte-verified
 * against nimana-36-veco708's canonical SVG per svg-graphics-shadow.ts's own
 * doc comment) and that the id used in the def matches the id used in the
 * `url(#...)` reference (D5's "id-normalized" self-consistency bar).
 */
import { describe, it, expect } from 'vitest';
import { STATE_SHADOW_FILTER_ID, buildStateShadowFilterDef, stateShadowFilterUrl } from '../../../src/diagrams/state/state-shadow.js';

describe('state-shadow.ts', () => {
  it('builds a <filter> def with jar-verified x/y/width/height and the fixed dx=dy=4/stdDeviation=2 shape', () => {
    const def = buildStateShadowFilterDef();
    expect(def).toContain(`<filter id="${STATE_SHADOW_FILTER_ID}" x="-1" y="-1" width="300%" height="300%">`);
    expect(def).toContain('<feGaussianBlur result="blurOut" stdDeviation="2"/>');
    expect(def).toContain(
      '<feColorMatrix type="matrix" in="blurOut" result="blurOut2" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .4 0"/>',
    );
    expect(def).toContain('<feOffset result="blurOut3" in="blurOut2" dx="4" dy="4"/>');
    expect(def).toContain('<feBlend in="SourceGraphic" in2="blurOut3" mode="normal"/>');
    expect(def).toContain('</filter>');
  });

  it('the url() reference targets the SAME id as the def (self-consistent, id-normalized)', () => {
    const def = buildStateShadowFilterDef();
    const url = stateShadowFilterUrl();
    expect(url).toBe(`url(#${STATE_SHADOW_FILTER_ID})`);
    expect(def).toContain(`id="${STATE_SHADOW_FILTER_ID}"`);
  });
});
