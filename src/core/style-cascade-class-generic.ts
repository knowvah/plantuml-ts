/**
 * T11 (cdd3, Q-4): the generic type-parameter tag's own ancestor cascade --
 * split out of `style-cascade-class.ts` (500-line cap), mirrors
 * `style-cascade-visibility-icon.ts`'s own split-for-size precedent (a pure
 * addition, same import shape: `cascadeHex`/`GraphCascadeOverride` back
 * from the parent module, safe because neither is referenced at the
 * other's module-init time -- only inside a function body called later).
 *
 * `class Foo<T>`'s generic tag fill/border --
 * `EntityImageClassHeader.java:138-149`: `styleGeneric.value(BackGroundColor)`
 * / `.value(LineColor)`, resolved from `StyleSignatureBasic.of(root,
 * element, classDiagram, class_, generic)` -- see `style-cascade-class-
 * snames.ts#GENERIC_SNAMES`'s own doc comment for why a bare `class {
 * BackgroundColor }` (no nested `generic` block) already matches this
 * query too. jar-verified cdd2-T13 Q-4 probes a (`class { BackgroundColor
 * yellow; LineColor blue }`), b (`classDiagram { generic { LineColor red
 * } }`), d (`class { generic { BackgroundColor purple } } }`,
 * `camuna-58-veca254`/`nafiki-56-jixu680`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageClassHeader.java:138-149
 */
import type { StyleMap } from './skinparam.js';
import { cascadeHex } from './style-cascade-class.js';
import type { GraphCascadeOverride } from './style-cascade-class.js';
import { GENERIC_SNAMES } from './style-cascade-class-snames.js';

export function applyGenericCascadeOverrides(styleMap: StyleMap, override: Partial<GraphCascadeOverride>): void {
  const background = cascadeHex(styleMap, GENERIC_SNAMES, 'backgroundcolor');
  if (background !== undefined) override.genericCascadeBackground = background;
  const border = cascadeHex(styleMap, GENERIC_SNAMES, 'linecolor');
  if (border !== undefined) override.genericCascadeBorder = border;
}
