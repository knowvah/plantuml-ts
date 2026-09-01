/**
 * The MULTI-PAGE PUBLIC API: `renderSync` returns page 1, `renderPagesSync`
 * returns every page.
 *
 * Batch 4 of `plans/sequence-newpage-pagination`, and the precedent: no other
 * engine in this port paginates, because `newpage` is the only command in the
 * corpus that makes one source produce more than one image (upstream's
 * `getNbPages()` is `countNewpage + 1` on `SequenceDiagram` alone).
 *
 * The jar writes those images as `f.svg`, `f_001.svg`, `f_002.svg`, …; this
 * port's `renderSync` returns ONE string, so it returns the first and
 * `renderPagesSync` reaches the rest rather than silently dropping content
 * the user wrote (decisions.md D5).
 */
import { describe, it, expect } from 'vitest';
import { renderSync, renderPagesSync, renderPages, renderAll } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const options = { measurer: new DeterministicMeasurer() };

const THREE_PAGES = `@startuml
title Overall
Alice -> Bob : one
newpage Second Page
Alice -> Bob : two
newpage
Alice -> Bob : three
@enduml`;

const ONE_PAGE = `@startuml
Alice -> Bob : one
@enduml`;

const titles = (svg: string): string[] =>
  [...svg.matchAll(/<g class="title"[^>]*>(.*?)<\/g>/g)].map((m) =>
    (/>([^<]*)<\/text>/.exec(m[1]!) ?? [])[1] ?? '',
  );

describe('renderPagesSync', () => {
  it('returns one SVG per page', () => {
    const pages = renderPagesSync(THREE_PAGES, options);
    expect(pages).toHaveLength(3);
    for (const p of pages) expect(p.startsWith('<svg')).toBe(true);
  });

  it('returns a single-element array for a document with no newpage', () => {
    expect(renderPagesSync(ONE_PAGE, options)).toHaveLength(1);
  });

  it('agrees with renderSync on page 1', () => {
    expect(renderPagesSync(THREE_PAGES, options)[0]).toBe(renderSync(THREE_PAGES, options));
    expect(renderPagesSync(ONE_PAGE, options)[0]).toBe(renderSync(ONE_PAGE, options));
  });

  it('gives each page its own content', () => {
    const [p1, p2, p3] = renderPagesSync(THREE_PAGES, options);
    expect(p1).not.toBe(p2);
    expect(p2).not.toBe(p3);
  });

  /** `TitledDiagram#addChrome(index, …)`: page 0 keeps the diagram's title,
   *  page k takes the k-th `newpage`'s LABEL, and a `newpage` with no label
   *  is `Display.NULL` — no title at all. */
  it('gives page k the k-th newpage`s own title', () => {
    const [p1, p2, p3] = renderPagesSync(THREE_PAGES, options);
    expect(titles(p1!)).toEqual(['Overall']);
    expect(titles(p2!)).toEqual(['Second Page']);
    expect(titles(p3!)).toEqual([]);
  });

  it('returns one element on an error path rather than throwing', () => {
    const pages = renderPagesSync('@startuml\n???\n@enduml', options);
    expect(pages).toHaveLength(1);
  });

  /** `renderAll` is per BLOCK, `renderPagesSync` is per PAGE of one block —
   *  distinct axes, and easy to confuse. */
  it('is not renderAll: renderAll splits blocks, this splits pages', () => {
    const twoBlocks = `${ONE_PAGE}\n${ONE_PAGE}`;
    expect(renderPagesSync(twoBlocks, options)).toHaveLength(1);
    return expect(renderAll(twoBlocks, options)).resolves.toHaveLength(2);
  });
});

describe('renderPages (async)', () => {
  it('matches its sync sibling', async () => {
    await expect(renderPages(THREE_PAGES, options)).resolves.toEqual(
      renderPagesSync(THREE_PAGES, options),
    );
  });
});
