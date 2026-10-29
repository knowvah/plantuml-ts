/**
 * StyleSignatureBasic#withTOBECHANGED as the json family calls it
 * (`TextBlockJson.java:141-146`): the highlight signature fanned out over the
 * `#highlight … <<class>>` stereotype (`StyleSignatureBasic.java:118-132`).
 */
import { describe, expect, it } from 'vitest';
import { Stereotype } from '../../../../src/core/stereo/Stereotype.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { StyleSignatures } from '../../../../src/core/style/StyleSignatures.js';

const HIGHLIGHT = StyleSignatureBasic.of('root', 'element', 'jsonDiagram', 'node', 'highlight');

describe('withTOBECHANGED on the json highlight signature', () => {
  it('no stereotype: the signature itself (java:119-120)', () => {
    expect(HIGHLIGHT.withTOBECHANGED(undefined)).toBe(HIGHLIGHT);
  });

  it('one label: a one-member StyleSignatures carrying the cleaned label (java:125-129)', () => {
    const r = HIGHLIGHT.withTOBECHANGED(Stereotype.build('<<warn>>'));
    expect(r).toBeInstanceOf(StyleSignatures);
    expect(r.toString()).toBe('[[element, highlight, jsonDiagram, node, root]  [warn]]');
  });

  it('two labels: a two-signature StyleSignatures (java:125-129)', () => {
    const r = HIGHLIGHT.withTOBECHANGED(Stereotype.build('<<a>><<B_b>>'));
    expect(r).toBeInstanceOf(StyleSignatures);
    expect(r.toString()).toBe(
      '[[element, highlight, jsonDiagram, node, root]  [a], [element, highlight, jsonDiagram, node, root]  [bb]]',
    );
  });
});
