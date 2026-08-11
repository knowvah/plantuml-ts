/**
 * `skinparam <sname>FontSize<<label>>` — the ELEMENT's OWN font size when it
 * carries a stereotype, as distinct from the stereotype TEXT's size that
 * `<sname>StereotypeFontSize<<label>>` already sets.
 *
 * Upstream reaches it through `EntityImageObject#getStyleHeader()`
 * (`svek/image/EntityImageObject.java:130-134`), whose signature
 * `{root, element, objectDiagram, object, header}` is merged
 * `.withTOBECHANGED(getEntity().getStereotype())` — a stereotype-qualified
 * merge of the SAME `SName.object` style that `objectFontSize` writes via
 * `addConFont("object", SName.object)` (`FromSkinparamToStyle.java:200`).
 *
 * Both spellings arrive as ONE key: `SkinLoader#getFullParam`
 * (`command/SkinLoader.java:69-75,95-101`) concatenates the block context, so
 * `skinparam object { <<Foo1>> { FontSize 8 } }` becomes
 * `object<<Foo1>>FontSize`; `SkinParam#cleanForKeySlow`
 * (`skin/SkinParam.java:283-300`) then lowercases it and moves the `<<x>>` to
 * the END — `objectfontsize<<foo1>>`, exactly what the flat key spells.
 *
 * Fixture: `object/tenalu-53-meri239` — `object { FontSize 16, <<Foo1>> {
 * FontSize 8 } }` with a stereotyped `A` and a plain `B`. Oracle dims from
 * `oracle/goldens/object/tenalu-53-meri239/svek-1.dot` (inches × 72 = px).
 */
import { describe, it, expect } from 'vitest';

import { preprocess } from '../../../src/core/preprocessor.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { measureObjectClassifier } from '../../../src/diagrams/class/class-object-map-sizing.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

/**
 * svek DOT carries node sizes in INCHES; every dimension asserted below is an
 * oracle inch value times this. (`scripts/dot-sync-report.ts` compares in the
 * same unit.)
 */
const DOT_PX_PER_INCH = 72;

/**
 * `toBeCloseTo` digits for a px dimension derived from an oracle inch value.
 * The goldens store 6 decimal places of inches, so the transcription itself
 * carries up to ±0.00005in = ±0.0036px of rounding; 2 digits (±0.005px) is the
 * tightest tolerance that does not measure the golden's own rounding.
 */
const PX_DIGITS = 2;

/**
 * Pinned node dimensions, in oracle inches, transcribed from the jar's own
 * `svek-1.dot` dumps. Each entry names the file and the `shNNNN` node it came
 * from — these are measurements, not tuned values, and nothing below may be
 * adjusted to make an assertion pass.
 */
const ORACLE_IN = {
  /** oracle/goldens/object/tenalu-53-meri239/svek-1.dot — sh0006, object `A`. */
  tenaluA: { width: 0.704514, height: 0.583333 },
  /** oracle/goldens/object/tenalu-53-meri239/svek-1.dot — sh0007, object `B`. */
  tenaluB: { width: 0.343056, height: 0.5 },
  /**
   * oracle/goldens/class/tabaxa-70-pomu341/svek-1.dot — sh0006 AND sh0007
   * carry this SAME pair: the jar draws stereotyped `A` and plain `B`
   * identically.
   */
  tabaxaNode: { width: 0.997917, height: 0.861111 },
} as const;

/** `tenalu-53-meri239`'s own skinparam block, verbatim. */
const TENALU_SKINPARAM = `skinparam object {
  BackgroundColor LightCoral
  FontSize 16

  <<Foo1>> {
  \tFontSize 8
     BackgroundColor LightBlue
  }

}`;

function objectClassifier(id: string, stereotype?: string): Classifier {
  return {
    id,
    display: id,
    kind: 'object',
    typeParams: [],
    members: [],
    ...(stereotype === undefined ? {} : { stereotype }),
  };
}

describe('preprocessor — nested `<<label>> {` scope inside a selector block', () => {
  it('normalizes tenalu-53-meri239’s block the way cleanForKeySlow does', () => {
    const { skinparam } = preprocess(`@startuml\n${TENALU_SKINPARAM}\n@enduml`);
    // Inner entries carry the scope label at the END of the key...
    expect(skinparam.get('objectfontsize<<foo1>>')).toBe('8');
    expect(skinparam.get('objectbackgroundcolor<<foo1>>')).toBe('LightBlue');
    // ...and the OUTER entries are untouched by it. Before the scope existed
    // both flattened onto one key and the inner value overwrote the outer.
    expect(skinparam.get('objectfontsize')).toBe('16');
    expect(skinparam.get('objectbackgroundcolor')).toBe('LightCoral');
  });

  it('closes only the stereotype scope on the inner `}` — entries after it stay outer', () => {
    const { skinparam } = preprocess(
      'skinparam object {\n  <<foo>> {\n    FontSize 8\n  }\n  FontSize 16\n}',
    );
    expect(skinparam.get('objectfontsize<<foo>>')).toBe('8');
    expect(skinparam.get('objectfontsize')).toBe('16');
  });
});

describe('skinparam front-end — <sname>FontSize<<label>>', () => {
  it('routes the flat key to the element bucket’s fontSizeByStereo', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([['objectfontsize<<x>>', '20']]),
      defaultTheme,
    );
    expect(theme.colors.elements?.['object']).toEqual({ fontSizeByStereo: { x: 20 } });
    expect(unknown).toEqual([]);
  });

  it('keeps the ELEMENT size and the STEREOTYPE-TEXT size on separate fields', () => {
    // The one thing the new regex can break: `objectstereotypefontsize<<x>>`
    // also ends in `fontsize<<...>>`, so the specific matcher must claim it.
    const { theme, unknown } = resolveSkinparam(
      new Map([
        ['objectstereotypefontsize<<x>>', '9'],
        ['objectfontsize<<x>>', '20'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.elements?.['object']).toEqual({
      stereotypeFontSizeByStereo: { x: 9 },
      fontSizeByStereo: { x: 20 },
    });
    expect(unknown).toEqual([]);
  });

  it('does NOT swallow statefontsize<<X>>, which has its own graph-level slot', () => {
    // `^(\w+)fontsize<<(.+)>>$` matches `statefontsize<<foo>>` with
    // `sname=state`, and `state` IS in ELEMENT_BUCKET_SNAMES — so this matcher
    // has to run after the whole STEREO_KEY_MATCHERS table, not before it.
    const { theme, unknown } = resolveSkinparam(
      new Map([['statefontsize<<foo>>', '30']]),
      defaultTheme,
    );
    expect(theme.colors.graph.stateFontSizeByStereo).toEqual({ foo: 30 });
    expect(theme.colors.elements?.['state']).toBeUndefined();
    expect(unknown).toEqual([]);
  });

  it('accumulates two labels rather than overwriting, and leaves the plain key alone', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['objectfontsize<<one>>', '8'],
        ['objectfontsize<<two>>', '9'],
        ['objectfontsize', '16'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.elements?.['object']).toEqual({
      fontSize: 16,
      fontSizeByStereo: { one: 8, two: 9 },
    });
  });

  it('routes classFontSize<<label>> to its own graph-level slot (tabaxa-70-pomu341)', () => {
    // `class` is NOT in ELEMENT_BUCKET_SNAMES — it keeps explicit handlers —
    // so this key needs its own matcher rather than the generic element one.
    const { theme, unknown } = resolveSkinparam(
      new Map([
        ['classfontsize', '16'],
        ['classfontsize<<foo1>>', '8'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.graph.classFontSize).toBe(16);
    expect(theme.colors.graph.classFontSizeByStereo).toEqual({ foo1: 8 });
    expect(theme.colors.elements?.['class']).toBeUndefined();
    expect(unknown).toEqual([]);
  });

  it('records a non-bucket SName and a non-numeric value as unknown, not silently dropped', () => {
    const { theme, unknown } = resolveSkinparam(
      new Map([
        ['widgetfontsize<<bar>>', '10'],
        ['objectfontsize<<baz>>', 'huge'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.elements?.['object']).toBeUndefined();
    expect(unknown).toEqual(['widgetfontsize<<bar>>', 'objectfontsize<<baz>>']);
  });
});

describe('measureObjectClassifier — the stereotype-scoped size reaches the NAME row', () => {
  const measurer = new WidthTableMeasurer();

  function tenaluTheme() {
    const { skinparam } = preprocess(`@startuml\n${TENALU_SKINPARAM}\n@enduml`);
    return resolveSkinparam(skinparam, defaultTheme).theme;
  }

  it('sizes the stereotyped A at 8 and the plain B at 16 (jar dims)', () => {
    const theme = tenaluTheme();
    const a = measureObjectClassifier(objectClassifier('A', 'Foo1'), theme, measurer, false);
    const b = measureObjectClassifier(objectClassifier('B'), theme, measurer, false);
    expect(a.width).toBeCloseTo(ORACLE_IN.tenaluA.width * DOT_PX_PER_INCH, PX_DIGITS);
    expect(b.width).toBeCloseTo(ORACLE_IN.tenaluB.width * DOT_PX_PER_INCH, PX_DIGITS);
    expect(b.height).toBeCloseTo(ORACLE_IN.tenaluB.height * DOT_PX_PER_INCH, PX_DIGITS);
    // A's HEIGHT is deliberately not asserted here: it is still 2px short of
    // `ORACLE_IN.tenaluA.height`. That residue is a header-height term — upstream stacks
    // `name.calculateDimension() + stereo.calculateDimension()`
    // (`EntityImageObject.java:240-247`) where the stereo row's own size comes
    // from the SEPARATE `FontParam.OBJECT_STEREOTYPE` lookup
    // (`SkinParam.java:432-449`), not from this mechanism. Owned by
    // object-close batch-2 (`tenalu-53-meri239` is in its queue); pinning 40
    // here would pin the defect.
  });

  it('gives tabaxa-70-pomu341’s A and B the jar’s IDENTICAL dims', () => {
    // The two nodes share `ORACLE_IN.tabaxaNode` because A's header shrinks to
    // 8 by exactly the height its stereotype row adds — which only holds if
    // the 8 actually reaches A and NOT B.
    const src = `@startuml
skinparam class {
  BackgroundColor LightCoral
  FontSize 16

  <<Foo1>> {
  \tFontSize 8
     BackgroundColor LightBlue
  }

}

class A <<Foo1>> {
 +dummy
}

class B {
  + dummy
}

A <|-- B
@enduml`;
    const graphs: DotInputGraph[] = [];
    setLayoutInputObserver((g) => graphs.push(g));
    try {
      renderSync(src, { measurer });
    } finally {
      setLayoutInputObserver(undefined);
    }
    const nodes = graphs.flatMap((g) => g.nodes);
    expect(nodes.map((n) => n.id)).toEqual(['A', 'B']);
    for (const n of nodes) {
      expect(n.width).toBeCloseTo(ORACLE_IN.tabaxaNode.width * DOT_PX_PER_INCH, PX_DIGITS);
      expect(n.height).toBeCloseTo(ORACLE_IN.tabaxaNode.height * DOT_PX_PER_INCH, PX_DIGITS);
    }
  });

  it('a label matching no scoped key leaves the size where it was', () => {
    // Only the scoped key is set, so an object whose label misses it must
    // measure exactly as it does with no skinparam at all.
    const { theme } = resolveSkinparam(new Map([['objectfontsize<<foo1>>', '8']]), defaultTheme);
    const scoped = measureObjectClassifier(objectClassifier('A', 'Foo1'), theme, measurer, false);
    const missed = measureObjectClassifier(objectClassifier('A', 'Other'), theme, measurer, false);
    const bare = measureObjectClassifier(objectClassifier('A', 'Other'), defaultTheme, measurer, false);
    expect(missed).toEqual(bare);
    expect(scoped.width).toBeLessThan(missed.width);
  });
});
