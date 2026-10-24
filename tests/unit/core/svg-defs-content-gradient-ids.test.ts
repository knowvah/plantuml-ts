/**
 * `svg-defs.ts#withContentGradientIds`: a host that draws each primitive
 * through its own one-shape klimt document (`sequence-text.ts#shapeSvg`)
 * gets `g<seed>0` from EVERY document's private counter
 * (`SvgGraphics.java:393,431`); upstream numbers them 0,1,2 in ONE document
 * and shares equal ones through its `gradients` map (java:367-371,411-415).
 */
import { describe, expect, it } from 'vitest';
import { collectDocumentDefs, withContentGradientIds } from '../../../src/core/svg-defs.js';

const RED_BLUE =
  '<linearGradient x1="0%" y1="50%" x2="100%" y2="50%" id="g00">' +
  '<stop offset="0%" stop-color="#F00"/><stop offset="50%" stop-color="#0F0" stop-opacity="0.5"/>' +
  '<stop offset="100%" stop-color="#00F"/></linearGradient>';
const GREEN_BLACK =
  '<linearGradient x1="0%" y1="0%" x2="100%" y2="0%" id="g00">' +
  '<stop offset="0%" stop-color="#0F0"/><stop offset="100%" stop-color="#000"/></linearGradient>';
const path = (id: string): string => `<path d="M0,0" style="stroke:url(#${id});stroke-width:1;" fill="url(#${id})"/>`;

function idOf(defs: string): string {
  const id = /id="([^"]*)"/.exec(defs)?.[1];
  if (id === undefined) throw new Error('no id in ' + defs);
  return id;
}

describe('withContentGradientIds', () => {
  it('moves id to the front under a content-derived name and rewrites every url(#old) in the body', () => {
    const out = withContentGradientIds(RED_BLUE, path('g00'));
    const id = idOf(out.defs);
    expect(id).not.toBe('g00');
    expect(out.defs).toBe(RED_BLUE.replace(' id="g00"', '').replace('<linearGradient', `<linearGradient id="${id}"`));
    expect(out.body).toBe(path(id));
  });

  it("gives two shapes' different gradients (both minted g00) different ids, equal ones the same id", () => {
    const a = withContentGradientIds(RED_BLUE, path('g00'));
    const b = withContentGradientIds(GREEN_BLACK, path('g00'));
    const c = withContentGradientIds(RED_BLUE, path('g00'));
    expect(idOf(a.defs)).not.toBe(idOf(b.defs));
    expect(idOf(a.defs)).toBe(idOf(c.defs));
  });

  it('renames several gradients of one document in a single pass', () => {
    const second = GREEN_BLACK.replace('id="g00"', 'id="g01"');
    const out = withContentGradientIds(RED_BLUE + second, path('g00') + path('g01'));
    const ids = [...out.defs.matchAll(/<linearGradient id="([^"]*)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(out.body).toBe(path(ids[0] ?? '') + path(ids[1] ?? ''));
  });

  it('leaves defs of other kinds in place and returns defs and body unchanged when there is no gradient', () => {
    const filter = '<filter id="f00"><feGaussianBlur stdDeviation="2"/></filter>';
    expect(withContentGradientIds(filter, path('f00'))).toEqual({ defs: filter, body: path('f00') });
    expect(withContentGradientIds('', 'x')).toEqual({ defs: '', body: 'x' });
  });

  it('feeds collectDocumentDefs: the lifted, deduped defs are the jar shape (one def per distinct gradient)', () => {
    const a = withContentGradientIds(RED_BLUE, path('g00'));
    const b = withContentGradientIds(GREEN_BLACK, path('g00'));
    const c = withContentGradientIds(RED_BLUE, path('g00'));
    const doc = collectDocumentDefs(a.defs + a.body + b.defs + b.body + c.defs + c.body, '');
    expect([...doc.defs.matchAll(/<linearGradient /g)]).toHaveLength(2);
    expect(doc.body).not.toContain('<linearGradient');
    expect(doc.body.match(new RegExp(`fill="url\\(#${idOf(a.defs)}\\)"`, 'g'))).toHaveLength(2);
  });
});
