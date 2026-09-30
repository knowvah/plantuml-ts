/**
 * StyleStorage — `style/StyleStorage.java` (146 lines): stereotype-free
 * styles keyed by `StyleKey` (`plain`), stereotyped ones by the whole
 * signature (`legacy`); `getStyles` iterates legacy THEN plain, each in
 * insertion order (`LinkedHashMap`).
 */
import { describe, expect, it } from 'vitest';
import { StyleStorage } from '../../../../src/core/style/StyleStorage.js';
import { Style } from '../../../../src/core/style/Style.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { ValueImpl } from '../../../../src/core/style/ValueImpl.js';
import type { PName } from '../../../../src/core/style/PName.js';
import type { Value } from '../../../../src/core/style/Value.js';
import { dumpStyle, ideaScenarioDump, skinStorageDump, styleFromDump } from './helpers/style-fixture.js';

function style(sig: StyleSignatureBasic, values: Record<string, [string, number]>): Style {
  const map = new Map<PName, Value>();
  for (const [k, [v, p]] of Object.entries(values)) map.set(k as PName, ValueImpl.regular(v, p));
  return new Style(sig, map);
}

const ROOT = StyleSignatureBasic.of('root');
const NODE = StyleSignatureBasic.of('mindmapDiagram', 'node');
const FOO = StyleSignatureBasic.of('mindmapDiagram').addStereotype('foo');

describe('StyleStorage', () => {
  it('get returns undefined (Java null) for an unknown signature', () => {
    expect(new StyleStorage().get(ROOT)).toBeUndefined();
    expect(new StyleStorage().get(FOO)).toBeUndefined();
  });

  it('put/get: plain by key (sname order irrelevant), legacy by full signature', () => {
    const st = new StyleStorage();
    const node = style(NODE, { Padding: ['10', 1] });
    const foo = style(FOO, { BackGroundColor: ['red', 1001] });
    st.put(node);
    st.put(foo);
    expect(st.get(StyleSignatureBasic.of('node', 'mindmapDiagram'))).toBe(node);
    expect(st.get(StyleSignatureBasic.of('mindmapDiagram').addStereotype('foo'))).toBe(foo);
    expect(st.get(StyleSignatureBasic.of('mindmapDiagram').addStereotype('bar'))).toBeUndefined();
  });

  it('getStyles: legacy first, then plain; a re-put keeps its position', () => {
    const st = new StyleStorage();
    const root = style(ROOT, { FontSize: ['14', 1] });
    const node = style(NODE, { Padding: ['10', 2] });
    const foo = style(FOO, { BackGroundColor: ['red', 1003] });
    st.put(root);
    st.put(node);
    st.put(foo);
    const root2 = style(ROOT, { FontSize: ['12', 4] });
    st.put(root2);
    expect(st.getStyles()).toEqual([foo, root2, node]);
  });

  it('putAll copies both maps', () => {
    const a = new StyleStorage();
    const foo = style(FOO, {});
    const root = style(ROOT, {});
    a.put(foo);
    a.put(root);
    const b = new StyleStorage();
    b.putAll(a);
    expect(b.getStyles()).toEqual([foo, root]);
    a.put(style(NODE, {}));
    expect(b.getStyles()).toHaveLength(2);
  });

  it('round-trips the jar storage dumps (plantuml.skin; the stereo snippet with legacy entries)', () => {
    for (const dump of [skinStorageDump(), ideaScenarioDump('stereo').storage]) {
      const st = new StyleStorage();
      for (const d of dump) st.put(styleFromDump(d));
      expect(st.getStyles().map((s) => dumpStyle(s))).toEqual(dump);
    }
  });

  it('computeMergedStyle: undefined when nothing matches; else every match merged OVERWRITE', () => {
    const st = new StyleStorage();
    expect(st.computeMergedStyle(ROOT)).toBeUndefined();
    st.put(style(ROOT, { FontSize: ['14', 5], FontColor: ['black', 4] }));
    st.put(style(StyleSignatureBasic.of('element'), { FontSize: ['12', 7] }));
    st.put(style(NODE, { FontColor: ['red', 9] }));
    const sig = StyleSignatureBasic.of('root', 'element').addLevel(0);
    const merged = st.computeMergedStyle(sig);
    expect(merged?.value('FontSize').asString()).toBe('12');
    expect(merged?.value('FontColor').asString()).toBe('black');
    expect(merged?.getSignature().toString()).toBe('[element, root]  []');
  });
});
