/**
 * cdd-B7FU-R1 — `svg-defs.ts`: the `feFlood` text-background filter
 * (`SvgGraphics.java:772-787`), the inline-def lift, the cross-fragment
 * collapse that restores the jar's one-filter-per-colour-per-document
 * invariant, and the def-span guard `annotations/coord-shift.ts` uses.
 *
 * The expected filter markup is the jar's own, byte for byte, from
 * `test-results/dot-cache/class/galili-87-zivo129/in.svg` (modulo the
 * seed-derived id — decision-journal row 62).
 */
import { describe, expect, test } from 'vitest';
import {
  backColorFilterDef,
  backColorFilterId,
  collapseDuplicateFilterDefs,
  collectDocumentDefs,
  extractFilterDefs,
  mapOutsideInlineDefs,
} from '../../../src/core/svg-defs.js';

const JAR_RED_FILTER_TAIL =
  ' x="0" y="0" width="1" height="1">' +
  '<feFlood flood-color="#FF0000" result="flood"/>' +
  '<feComposite in="SourceGraphic" in2="flood" operator="over"/>' +
  '</filter>';

describe('backColorFilterDef — SvgGraphics.java:777-786', () => {
  test("emits the jar's element, with the colour resolved to full #RRGGBB", () => {
    const { id, def } = backColorFilterDef('red');
    expect(def).toBe(`<filter id="${id}"${JAR_RED_FILTER_TAIL}`);
  });

  test('flood-color is NOT shortened (toRGB, not toSvg) even when shortenable', () => {
    expect(backColorFilterDef('#FF0000').def).toContain('flood-color="#FF0000"');
  });

  test('two spellings of one colour share one id — upstream keys its cache on the colour', () => {
    expect(backColorFilterId('#FF0000')).toBe(backColorFilterId('#FF0000'));
    expect(backColorFilterDef('red').id).toBe(backColorFilterDef('#FF0000').id);
  });

  test('different colours get different ids', () => {
    expect(backColorFilterDef('red').id).not.toBe(backColorFilterDef('blue').id);
  });
});

describe('extractFilterDefs', () => {
  test('lifts an inline filter out of the body and dedups repeats by id', () => {
    const { def, id } = backColorFilterDef('red');
    const body = `<g>${def}<text filter="url(#${id})">a</text>${def}<text>b</text></g>`;
    const lifted = extractFilterDefs(body);
    expect(lifted.defs).toBe(def);
    expect(lifted.body).toBe(`<g><text filter="url(#${id})">a</text><text>b</text></g>`);
  });

  test('leaves a filter whose id is not one of ours (a klimt shadow def) in place', () => {
    const body = '<filter id="f0" x="-1"><feBlend/></filter>';
    expect(extractFilterDefs(body)).toEqual({ body, defs: '' });
  });
});

describe('collapseDuplicateFilterDefs', () => {
  test('two identical-modulo-id filters collapse, and the body is re-pointed', () => {
    const defs = `<filter id="bA"${JAR_RED_FILTER_TAIL}<filter id="bB"${JAR_RED_FILTER_TAIL}`;
    const body = '<text filter="url(#bA)">a</text><text filter="url(#bB)">b</text>';
    const out = collapseDuplicateFilterDefs(defs, body);
    expect(out.defs).toBe(`<filter id="bA"${JAR_RED_FILTER_TAIL}`);
    expect(out.body).toBe('<text filter="url(#bA)">a</text><text filter="url(#bA)">b</text>');
  });

  test('filters that differ in content are both kept, body untouched', () => {
    const blue = JAR_RED_FILTER_TAIL.replace('#FF0000', '#0000FF');
    const defs = `<filter id="bA"${JAR_RED_FILTER_TAIL}<filter id="bB"${blue}`;
    const body = '<text filter="url(#bA)">a</text><text filter="url(#bB)">b</text>';
    expect(collapseDuplicateFilterDefs(defs, body)).toEqual({ defs, body });
  });

  test('a defs payload with no filters is returned unchanged', () => {
    const defs = '<marker id="m"><path d="M0,0"/></marker>';
    expect(collapseDuplicateFilterDefs(defs, '<g/>')).toEqual({ defs, body: '<g/>' });
  });
});

describe('collectDocumentDefs', () => {
  test('prefix defs come first, then lifted gradients, then lifted filters', () => {
    const { def, id } = backColorFilterDef('red');
    const gradient = '<linearGradient id="gab" x1="0%"><stop offset="0%"/></linearGradient>';
    const body = `${gradient}<rect fill="url(#gab)"/>${def}<text filter="url(#${id})">a</text>`;
    const out = collectDocumentDefs(body, '<marker id="m"/>');
    expect(out.defs).toBe(`<marker id="m"/>${gradient}${def}`);
    expect(out.body).toBe(`<rect fill="url(#gab)"/><text filter="url(#${id})">a</text>`);
  });
});

describe('mapOutsideInlineDefs — the coord-shift guard', () => {
  test('a def body is never handed to the transform', () => {
    const gradient = '<linearGradient id="gab" x1="0%" y1="50%"></linearGradient>';
    const seen: string[] = [];
    const out = mapOutsideInlineDefs(`<g x="1"/>${gradient}<rect x="2"/>`, (segment) => {
      seen.push(segment);
      return segment.replace(/x="(\d+)"/g, 'x="9"');
    });
    expect(out).toBe(`<g x="9"/>${gradient}<rect x="9"/>`);
    expect(seen.join('')).not.toContain('linearGradient');
  });

  test('a body with no defs is transformed end to end', () => {
    expect(mapOutsideInlineDefs('<rect x="1"/>', (s) => s.toUpperCase())).toBe('<RECT X="1"/>');
  });
});
