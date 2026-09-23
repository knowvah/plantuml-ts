/**
 * CDD T6FU (T20 follow-up) — a generic clause spanning multiple lines.
 *
 * `EntityImageClassHeader.java:146-148` builds the `<...>` tag block
 * through `Display.getWithNewlines(getSkinParam().getPragma(), generic)`
 * with `HorizontalAlignment.CENTER`, so a clause carrying `\n` escapes
 * becomes one `<text>` per line, each CENTRED on the widest line — not one
 * joined `<text>`. The block's own dimension was already multi-line-aware
 * (`measureGenericTagDim`'s R2c split); only the emission was not.
 * Jar-verified `zubevi-64-fume582`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClassHeader.java:144-152
 */
import { describe, it, expect } from 'vitest';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const ZUBEVI = [
  '@startuml',
  'class MyClass<S extends SomeClass,\\nA extends AnotherClass,\\nY YetAnotherClass> {',
  '}',
  '@enduml',
].join('\n');

function texts(svg: string): Array<{ x: number; y: number; length: number; body: string }> {
  return [...svg.matchAll(/<text ([^>]*)>([^<]*)<\/text>/g)].map((m) => ({
    x: Number(/(?:^|\s)x="([^"]*)"/.exec(m[1] ?? '')?.[1]),
    y: Number(/(?:^|\s)y="([^"]*)"/.exec(m[1] ?? '')?.[1]),
    length: Number(/textLength="([^"]*)"/.exec(m[1] ?? '')?.[1]),
    body: m[2] ?? '',
  }));
}

describe('T6FU: multi-line generic clause', () => {
  const svg = renderFixtureClass(ZUBEVI, new DeterministicMeasurer());
  const generic = texts(svg).filter((t) => t.body.includes('Class,') || t.body.includes('YetAnotherClass'));

  it('emits one <text> per `\\n`-separated line, in source order', () => {
    expect(generic.map((t) => t.body)).toEqual([
      'S extends SomeClass,',
      'A extends AnotherClass,',
      'Y YetAnotherClass',
    ]);
  });

  it('measures each line on its own (no joined textLength)', () => {
    // Jar: 114.75 / 125.4 / 98.1 at 12pt italic.
    expect(generic.map((t) => t.length)).toEqual([114.75, 125.4, 98.1]);
  });

  it('centres every line on the widest one (HorizontalAlignment.CENTER)', () => {
    const widest = Math.max(...generic.map((t) => t.length));
    const left = Math.min(...generic.map((t) => t.x));
    for (const t of generic) {
      expect(t.x).toBeCloseTo(left + (widest - t.length) / 2, 6);
    }
  });

  it('advances one `atomTextLineHeight` per line (12pt -> 12px)', () => {
    expect(generic[1]!.y - generic[0]!.y).toBeCloseTo(12, 6);
    expect(generic[2]!.y - generic[1]!.y).toBeCloseTo(12, 6);
  });

  it('leaves a single-line generic clause byte-identical (one <text>)', () => {
    const single = renderFixtureClass(['@startuml', 'class Box<T>', '@enduml'].join('\n'), new DeterministicMeasurer());
    expect(texts(single).filter((t) => t.body === 'T')).toHaveLength(1);
  });
});
