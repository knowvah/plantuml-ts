/**
 * cdd3-T31 — four ink-box terms the class walk was missing
 * (`src/diagrams/class/class-ink-box.ts#buildInkBox`):
 *
 * - E1-2 = E2-8: a namespace title `UText` is walked by `LimitFinder#drawText`
 *   (`klimt/drawing/LimitFinder.java:217-224`, `y -= dim.getHeight() - 1.5`)
 *   at its drawn baseline (`USymbolFolder.java:228` `title.drawU(ug.apply(new
 *   UTranslate(4, 2)))`); at a large `packageFontSize` it pokes above the tab.
 * - E1-5: a USymbol container is walked as drawn — the `<<cloud>>` frontier
 *   `UPath`'s min/max includes every Bézier control point
 *   (`klimt/UPath.java:84-92`, `LimitFinder.java:164-167`).
 * - B-3: the quantifier ink is the drawn `endHeadText` lines
 *   (`svek/SvekEdge.java:336-338,969-973`), not the raw quantifier string.
 * - C-8: `USymbolDatabase#drawDatabase` (`:77`) / `USymbolNode#drawNode`
 *   (`:90`) draw a trailing `UEmpty(10, 10)` that `LimitFinder#drawEmpty`
 *   (`LimitFinder.java:159-162`) counts.
 *
 * Expected canvases are the jar's (`scripts/oracle-render.sh`, deterministic
 * text); the markup is inlined so the test does not depend on the gitignored
 * corpus.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { computeClassRawInkDims } from '../../../src/diagrams/class/layout-ink-extent.js';
import type { ClassifierGeo, EdgeGeo } from '../../../src/diagrams/class/layout.js';

function svgDims(lines: readonly string[]): string {
  const svg = renderSync(['@startuml', ...lines, '@enduml'].join('\n'), { measurer: new DeterministicMeasurer() });
  const root = /<svg[^>]*>/.exec(svg)?.[0] ?? '';
  return `${/\bwidth="([^"]+)"/.exec(root)?.[1]}x${/\bheight="([^"]+)"/.exec(root)?.[1]}`;
}

describe('E1-2/E2-8 — namespace title UText ink (LimitFinder.java:217-224)', () => {
  it('cocube-46-tusu692: jar 318x537 (30pt title rises 3.167 above the tab)', () => {
    expect(
      svgDims([
        'skinparam packageBorderColor blue',
        'skinparam packageFontSize 30',
        'package boo1.boo2 {',
        '}',
        'package foo1.foo2.foo3 {',
        'class A',
        'class B',
        '}',
        'boo1.boo2 +--- foo1.foo2.foo3',
      ]),
    ).toBe('318pxx537px');
  });

  it('pixexi-81-sete111: jar 346x149 (40pt title rises 5.389 above the frame)', () => {
    expect(
      svgDims([
        'skinparam package {',
        '  BackgroundColor blue',
        '  BorderColor red',
        '  BorderThickness 4',
        '  FontColor green',
        '  FontSize 40',
        '}',
        'package "Configuration files" {',
        'class foo',
        '}',
      ]),
    ).toBe('346pxx149px');
  });

  it('packageStyle rect: jar 346x148 (USymbolRectangle#asBig title, centred)', () => {
    expect(
      svgDims([
        'skinparam packageStyle rect',
        'skinparam packageFontSize 40',
        'package "Configuration files" {',
        'class foo',
        '}',
      ]),
    ).toBe('346pxx148px');
  });

  it('empty-package leaf: jar 307x126 (EntityImageEmptyPackage title, same folder asBig)', () => {
    expect(svgDims(['skinparam packageFontSize 40', 'package "Empty one" {', '}', 'class foo'])).toBe('307pxx126px');
  });

  it('multi-line title: jar 179x189 (one UText per physical line)', () => {
    expect(svgDims(['skinparam packageFontSize 40', 'package "Line one\\nsecond" {', 'class foo', '}'])).toBe(
      '179pxx189px',
    );
  });
});

describe('E1-5 — USymbol container walked as drawn (UPath.java:84-92)', () => {
  it('diroxo-41-zezo954: jar 258x122 (cloud control points reach past the rect)', () => {
    expect(
      svgDims([
        'package PetitBeurre <<cloud>> {',
        '  class aClass {',
        '    }',
        '}',
        'Class someClass {',
        '+ okPublic',
        '- okPrivate',
        '# okProtected',
        '}',
      ]),
    ).toBe('258pxx122px');
  });

  it('a lone cloud container: jar 113x119', () => {
    expect(svgDims(['package "Clouded" <<cloud>> {', 'class foo', '}'])).toBe('113pxx119px');
  });
});

describe('B-3 — drawn quantifier lines, not the raw quantifier (SvekEdge.java:969-973)', () => {
  it('focaci-80-suzu938: jar 135x178', () => {
    expect(
      svgDims(['class Transaction ', 'class ActorRole', 'Transaction "1 initiating" --> "~* initiators" ActorRole']),
    ).toBe('135pxx178px');
  });

  it('bounds each QuantifierLineGeo, ignoring the unsplit headLabel anchor', () => {
    const box: ClassifierGeo = {
      id: 'C',
      kind: 'class',
      x: 100,
      y: 100,
      width: 40,
      height: 40,
      dividerYs: [],
      rows: [],
    };
    const edge: EdgeGeo = {
      id: 'e',
      from: 'C',
      to: 'C',
      points: [{ x: 120, y: 140 }],
      // A phantom raw-string anchor far to the left: must contribute nothing.
      headLabel: { text: '~* x', x: 0, y: 0, width: 50 },
      quantifierLines: [[], [{ text: '* x', x: 90, y: 160, width: 20 }]],
    } as unknown as EdgeGeo; // hand-built literal: only the fields the ink walk reads
    const dims = computeClassRawInkDims([box], [], [edge], []);
    // minX = the drawn line's x 90 (the phantom anchor at 0 is ignored);
    // maxX = the class box's 140; minY 99 (box y - 1); maxY 160 + 1.5.
    expect(dims).toEqual({ width: 50 + 15, height: 62.5 + 15 });
  });
});

describe('C-8 — database/node leaf UEmpty(10, 10) (USymbolDatabase.java:77, USymbolNode.java:90)', () => {
  const head = ['allow_mixing', 'class dummy1 {', '  foo1', '}'];
  it('givofi/popesa shape: database leaf, jar 226x84', () => {
    expect(svgDims([...head, 'database dummy2'])).toBe('226pxx84px');
  });

  it('node leaf drawn as USymbolNode: jar 246x85', () => {
    expect(svgDims([...head, 'node dummy2'])).toBe('246pxx85px');
  });

  it('node leaf below a class: jar 134x198 (UEmpty below the node)', () => {
    expect(svgDims([...head, 'node dummy2', 'dummy1 -- dummy2'])).toBe('134pxx198px');
  });
});
