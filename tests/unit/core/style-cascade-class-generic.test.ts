/**
 * T11 (cdd3, Q-4): `applyGenericCascadeOverrides` -- the generic
 * type-parameter tag's own `{root,element,classDiagram,class_,generic}`
 * cascade (`EntityImageClassHeader.java:138-149`). Every expected value
 * is jar-verified against `camuna-58-veca254`/`nafiki-56-jixu680`'s own
 * `<style>` block (`class { generic { BackgroundColor purple } } }`,
 * oracle `svg/g[1]/g[1]/rect[2]/@fill = #800080`) or cdd2-T13's four
 * authored jar probes (Q-4).
 */
import { describe, it, expect } from 'vitest';
import { applyGenericCascadeOverrides } from '../../../src/core/style-cascade-class-generic.js';
import type { GraphCascadeOverride } from '../../../src/core/style-cascade-class.js';
import type { StyleMap } from '../../../src/core/skinparam.js';

function styleMap(spec: Record<string, Record<string, string>>): StyleMap {
  const m: StyleMap = new Map();
  for (const [sel, decls] of Object.entries(spec)) {
    m.set(sel, new Map(Object.entries(decls)));
  }
  return m;
}

describe('applyGenericCascadeOverrides (T11, Q-4)', () => {
  it('an empty StyleMap contributes nothing', () => {
    const override: Partial<GraphCascadeOverride> = {};
    applyGenericCascadeOverrides(styleMap({}), override);
    expect(override).toEqual({});
  });

  it('camuna-58-veca254: class { generic { BackgroundColor purple } } } resolves to #800080 -- oracle rect[2]/@fill', () => {
    const override: Partial<GraphCascadeOverride> = {};
    applyGenericCascadeOverrides(
      styleMap({ class: { backgroundcolor: 'yellow' }, 'class.generic': { backgroundcolor: 'purple' } }),
      override,
    );
    expect(override.genericCascadeBackground).toBe('#800080');
  });

  it('cdd2-T13 Q-4 probe a: a bare class { BackgroundColor } (no nested generic block) still matches -- GENERIC_SNAMES is a superset of CLASS_SNAMES', () => {
    const override: Partial<GraphCascadeOverride> = {};
    applyGenericCascadeOverrides(styleMap({ class: { backgroundcolor: 'yellow', linecolor: 'blue' } }), override);
    expect(override.genericCascadeBackground).toBe('#FFFF00');
    expect(override.genericCascadeBorder).toBe('#0000FF');
  });

  it('cdd2-T13 Q-4 probe b: classDiagram { generic { LineColor red } } } resolves the border half', () => {
    const override: Partial<GraphCascadeOverride> = {};
    applyGenericCascadeOverrides(styleMap({ 'classdiagram.generic': { linecolor: 'red' } }), override);
    expect(override.genericCascadeBorder).toBe('#FF0000');
    expect(override.genericCascadeBackground).toBeUndefined();
  });

  it('a class {} declaration never leaks in from an unrelated selector (note) -- not an arrow/generic ancestor', () => {
    const override: Partial<GraphCascadeOverride> = {};
    applyGenericCascadeOverrides(styleMap({ note: { backgroundcolor: 'red' } }), override);
    expect(override).toEqual({});
  });
});
