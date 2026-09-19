import { describe, it, expect } from 'vitest';
import { extractGradientDefs } from '../../../src/core/svg.js';

const def = (id: string, body = '<stop offset="0"/>'): string => `<linearGradient id="${id}">${body}</linearGradient>`;

describe('extractGradientDefs', () => {
  it('lifts a single def out of the body', () => {
    const out = extractGradientDefs(`<rect/>${def('g0')}<line/>`);
    expect(out.body).toBe('<rect/><line/>');
    expect(out.defs).toBe(def('g0'));
  });

  it('keeps ONE copy of a def repeated by id', () => {
    const out = extractGradientDefs(`${def('g0')}<rect/>${def('g0')}<rect/>`);
    expect(out.body).toBe('<rect/><rect/>');
    expect(out.defs).toBe(def('g0'));
  });

  it('keeps distinct ids, in first-seen order', () => {
    const out = extractGradientDefs(`${def('g1')}<a/>${def('g0')}<b/>${def('g1')}`);
    expect(out.body).toBe('<a/><b/>');
    expect(out.defs).toBe(def('g1') + def('g0'));
  });

  it('tolerates newlines inside a def', () => {
    const multi = def('g0', '\n  <stop offset="0"/>\n  <stop offset="1"/>\n');
    const out = extractGradientDefs(`<rect/>${multi}`);
    expect(out.body).toBe('<rect/>');
    expect(out.defs).toBe(multi);
  });

  it('is non-greedy: adjacent defs do not merge', () => {
    const out = extractGradientDefs(def('g0') + def('g1'));
    expect(out.defs).toBe(def('g0') + def('g1'));
    expect(out.body).toBe('');
  });

  it('ignores an id outside the `g[0-9a-z]+` hash alphabet', () => {
    const foreign = def('x0');
    const out = extractGradientDefs(`<rect/>${foreign}`);
    expect(out.body).toBe(`<rect/>${foreign}`);
    expect(out.defs).toBe('');
  });

  it('leaves an unclosed open tag untouched', () => {
    const body = '<rect/><linearGradient id="g0"><stop/>';
    const out = extractGradientDefs(body);
    expect(out.body).toBe(body);
    expect(out.defs).toBe('');
  });

  it('handles many unclosed open tags without lifting any', () => {
    // The js/polynomial-redos shape CodeQL flagged on GRADIENT_DEF_RE.
    const body = '<linearGradient id="g0"'.repeat(5000);
    const out = extractGradientDefs(body);
    expect(out.body).toBe(body);
    expect(out.defs).toBe('');
  });
});
