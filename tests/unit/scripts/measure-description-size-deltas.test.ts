/**
 * Unit tests for `scripts/measure-description-size-deltas.ts`'s pure functions
 * (mission S1L). Only `classifyDelta`/`detectCause`/`summarize` are exercised
 * here — the fixture-rendering/comparison plumbing (renderSync,
 * compareStructural) is exercised by the real harness run and the
 * `description-parity.ratchet.test.ts` suite it reuses.
 */
import { describe, it, expect } from 'vitest';
import {
  classifyDelta,
  detectCause,
  summarize,
  DELTA_EPSILON,
  type DeltaResult,
} from '../../../scripts/measure-description-size-deltas.js';

describe('classifyDelta', () => {
  it('classifies a larger delta than allowed as widened', () => {
    expect(classifyDelta(0.1, 0.05, true)).toBe('widened');
  });

  it('classifies a backlog delta below allowed as improved', () => {
    expect(classifyDelta(0.02, 0.05, true)).toBe('improved');
  });

  it('does NOT report improved for a non-backlog fixture below the ceiling', () => {
    // A conformant non-backlog fixture (0.005 < 0.01 ceiling) is unchanged.
    expect(classifyDelta(0.005, 0.01, false)).toBe('unchanged');
  });

  it('still widens a non-backlog fixture that exceeds the ceiling', () => {
    expect(classifyDelta(0.05, 0.01, false)).toBe('widened');
  });

  it('treats a delta within ±epsilon of allowed as unchanged', () => {
    expect(classifyDelta(0.05 + DELTA_EPSILON / 2, 0.05, true)).toBe('unchanged');
    expect(classifyDelta(0.05 - DELTA_EPSILON / 2, 0.05, true)).toBe('unchanged');
  });

  it('classifies just past ±epsilon as widened / improved', () => {
    expect(classifyDelta(0.05 + DELTA_EPSILON * 2, 0.05, true)).toBe('widened');
    expect(classifyDelta(0.05 - DELTA_EPSILON * 2, 0.05, true)).toBe('improved');
  });
});

describe('detectCause', () => {
  it('detects each root-cause family, most-specific first', () => {
    expect(detectCause('a <latex>e=mc^2</latex> b')).toBe('latex');
    expect(detectCause('skinparam wrapWidth 200')).toBe('wrapWidth');
    expect(detectCause('skinparam minClassWidth 200')).toBe('min-width');
    expect(detectCause('label <U+1F600> here')).toBe('emoji-unicode');
    expect(detectCause('component X <$awsIcon>')).toBe('sprite');
    expect(detectCause('!include <awslib/AWSCommon>')).toBe('sprite');
    expect(detectCause('node <&heart> n')).toBe('icon');
    expect(detectCause('package "P"')).toBe('package-folder-tab');
    expect(detectCause('interface I')).toBe('interface-shield');
    expect(detectCause('component A [a very long bracketed description body here]')).toBe(
      'bracket-body',
    );
    expect(detectCause('component $myVar')).toBe('variable-display');
  });

  it('routes a container (keyword + { block) to cluster, not leaf tab', () => {
    expect(detectCause('package P {\n  class A\n}')).toBe('container-cluster');
    // a bracket body INSIDE a container block is cluster sizing, not display
    expect(detectCause('rectangle R {\n  a [Line 1\\nLine 2]\n}')).toBe('container-cluster');
  });

  it('falls back to other when nothing matches', () => {
    expect(detectCause('component A')).toBe('other');
  });

  it('prefers latex over a co-occurring lower-priority signal', () => {
    expect(detectCause('interface I with <latex>x</latex>')).toBe('latex');
  });

  it('detects a sprite bundle path (turasu-73-zoni468 misattribution)', () => {
    // Without '/' in the character class this fell through to the
    // \binterface\b catch and was mis-bucketed as interface-shield.
    expect(detectCause('<$archimate/interface>')).toBe('sprite');
  });

  it('detects a <style> selector FontSize as element-font, not container-cluster', () => {
    // component is a container keyword, so `component {` alone reads as a
    // cluster opener to that regex -- element-font must win first.
    const src = '@startuml\n<style>\ncomponent {\n  FontSize 19\n}\n</style>\n@enduml';
    expect(detectCause(src)).toBe('element-font');
  });

  it('detects a block-form skinparam per-element font (toxine-81-xofo986)', () => {
    const src = 'skinparam node {\n  StereotypeFontSize 20\n}';
    expect(detectCause(src)).toBe('element-font');
  });

  it('prefers element-font over a co-occurring container block, ordering documented', () => {
    // loroto-06-fano471: a real container keyword AND a per-element font
    // declaration in the same source -- the more specific cause (font) wins
    // because element-font is tested before container-cluster.
    const src =
      '@startuml\n<style>\nnode {\n  stereotype {\n    FontSize 20\n    .bar {\n' +
      '      FontSize 10\n    }\n  }\n}\n</style>\nnode nodefoo <<foo>>\n@enduml';
    expect(detectCause(src)).toBe('element-font');
  });
});

describe('summarize', () => {
  function r(over: Partial<DeltaResult>): DeltaResult {
    return { slug: 's', delta: 0, allowed: 0, status: 'unchanged', conformant: true, ...over };
  }

  it('counts an empty result set as all zeros', () => {
    expect(summarize([])).toEqual({
      total: 0, conformant: 0, conformantPct: 0,
      widened: 0, improved: 0, unchanged: 0, causes: {},
    });
  });

  it('tallies status, conformant %, and per-cause buckets', () => {
    const results = [
      r({ slug: 'a', conformant: true, status: 'unchanged' }),
      r({ slug: 'b', conformant: true, status: 'unchanged' }),
      r({ slug: 'c', conformant: false, status: 'widened', cause: 'sprite' }),
      r({ slug: 'd', conformant: false, status: 'unchanged', cause: 'sprite' }),
      r({ slug: 'e', conformant: false, status: 'improved', cause: 'latex' }),
    ];
    const s = summarize(results);
    expect(s.total).toBe(5);
    expect(s.conformant).toBe(2);
    expect(s.conformantPct).toBe(40);
    expect(s.widened).toBe(1);
    expect(s.improved).toBe(1);
    expect(s.unchanged).toBe(3);
    expect(s.causes).toEqual({ sprite: 2, latex: 1 });
  });
});
