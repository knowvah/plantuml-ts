/**
 * sdd3-T8h: `withPrevious`, the port's `SkinParam#copyAllFrom(Previous)`.
 *
 * `TitledDiagram.java:106-109` builds the nested diagram's `SkinParam` from its
 * own source, THEN `copyAllFrom(previous)` (`SkinParam.java:217-219`:
 * `params.putAll(previous.values())`); the nested diagram's own commands run
 * after the constructor, so their `setParam` (`SkinParam.java:242`,
 * `params.put`) overwrites an inherited key. `EmbeddedDiagram.java:88-89`
 * builds that `Previous` from `skinParam.values()` -- the skinparams only,
 * never a `<style>` block.
 */
import { describe, it, expect } from 'vitest';
import { inheritingRenderFn, takePendingPrevious, withPrevious } from '../../../src/core/nested-previous.js';
import { preprocess } from '../../../src/core/preprocessor.js';

const resultOf = (body: string) => preprocess(`@startuml\n${body}\n@enduml`);

describe('withPrevious (SkinParam.java:217-219)', () => {
  it('returns the very same result when nothing is inherited', () => {
    const own = resultOf('skinparam handwritten true');
    expect(withPrevious(own, undefined)).toBe(own);
    expect(withPrevious(own, new Map())).toBe(own);
  });

  it('adds every inherited skinparam the nested diagram lacks', () => {
    const merged = withPrevious(
      resultOf('a -> b'),
      new Map([
        ['handwritten', 'true'],
        ['monochrome', 'true'],
      ]),
    );
    expect([...merged.skinparam]).toEqual([
      ['handwritten', 'true'],
      ['monochrome', 'true'],
    ]);
  });

  it("keeps the nested diagram's own value for a key both set (setParam runs after copyAllFrom)", () => {
    const merged = withPrevious(resultOf('skinparam handwritten false'), new Map([['handwritten', 'true']]));
    expect(merged.skinparam.get('handwritten')).toBe('false');
  });

  it("orders inherited keys before the nested diagram's own on the declaration counter", () => {
    const merged = withPrevious(resultOf('skinparam shadowing false'), new Map([['handwritten', 'true']]));
    const order = merged.declarationOrder?.skinparam;
    expect(order?.get('handwritten')).toBeUndefined();
    expect(order?.get('shadowing')).toBeGreaterThanOrEqual(0);
  });

  it('leaves out a key whose only reader is a Style (backgroundColor: TitledDiagram.java:280-289)', () => {
    const own = resultOf('a -> b');
    const merged = withPrevious(
      own,
      new Map([
        ['Background_Color', '#f1f1f1'],
        ['defaultTextAlignment', 'center'],
      ]),
    );
    expect([...merged.skinparam]).toEqual([['defaultTextAlignment', 'center']]);
    expect(withPrevious(own, new Map([['backgroundColor', 'red']]))).toBe(own);
  });

  it("does not touch the nested diagram's <style> blocks (Previous holds skinparams only)", () => {
    const own = resultOf('<style>\nroot {\nLineColor red\n}\n</style>');
    const merged = withPrevious(own, new Map([['handwritten', 'true']]));
    expect(merged.styles).toBe(own.styles);
  });
});

describe('inheritingRenderFn (the one registration production and the harnesses share)', () => {
  const enclosing = new Map([['handwritten', 'true']]);

  it('hands the enclosing skinparams to the nested render, once', () => {
    let seen: ReadonlyMap<string, string> | undefined;
    const render = inheritingRenderFn(enclosing, (source) => {
      seen = takePendingPrevious();
      return `svg:${source}`;
    });
    expect(render('@startuml\n@enduml')).toBe('svg:@startuml\n@enduml');
    expect(seen).toBe(enclosing);
    expect(takePendingPrevious()).toBeUndefined();
  });

  it('clears the carrier when the nested render never takes it, or throws', () => {
    inheritingRenderFn(enclosing, () => 'unread')('x');
    expect(takePendingPrevious()).toBeUndefined();
    expect(() =>
      inheritingRenderFn(enclosing, () => {
        throw new Error('nested render failed');
      })('x'),
    ).toThrow('nested render failed');
    expect(takePendingPrevious()).toBeUndefined();
  });

  it('a top-level render has nothing pending', () => {
    expect(takePendingPrevious()).toBeUndefined();
  });
});
