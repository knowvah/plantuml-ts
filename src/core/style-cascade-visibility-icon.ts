/**
 * cdd2-T8 (S-7): `<style> visibilityIcon { <kind> { LineColor/
 * BackgroundColor } } }` -- split out of `style-cascade-class.ts` (500-line
 * cap), a pure addition mirroring `style-cascade-class-font.ts`'s own
 * split-for-size precedent.
 *
 * Upstream (`VisibilityModifier.java:336-350`) resolves a per-visibility-
 * char `StyleSignatureBasic.of(SName.root, SName.element,
 * SName.visibilityIcon, SName.<kind>)`, one signature per member-row icon
 * (`public_`/`private_`/`protected_`/`package_`/`IEMandatory`), via
 * `getMergedStyle` (`MethodsOrFieldsArea.java:360-364`) -- the SAME Style
 * system every other `<style>` cascade in this port resolves through, just
 * with NO prior port implementing this particular StyleSignature at all
 * (confirmed by exhaustive grep, `plans/class-divergence-drive-2/diagnosis
 * /S.md` S-7). `resolveStyleCascade`'s existing subset-match algorithm
 * (`style-map-element.ts`) already generalizes correctly here: a bare
 * `visibilityIcon { LineColor X } }` block (no nested kind) would cascade
 * to every kind (every selector's tokens are a subset of the 2-token
 * query), matching upstream's own ancestor-signature semantics, though no
 * corpus fixture currently exercises that bare form.
 */
import type { StyleMap } from './skinparam.js';
import type { GraphCascadeOverride } from './style-cascade-class.js';
import { cascadeHex } from './style-cascade-class.js';

/** The five `VisibilityModifier.java:336-350` SName tokens, cleaned to the
 *  lowercase, underscore-stripped selector text a `<style>` author writes
 *  (`protected_` -> `protected`, `IEMandatory` -> `iemandatory`) -- the
 *  SAME cleaning `normaliseKey`/`cleanStereotypeToken` apply elsewhere in
 *  this port, applied here as a fixed literal list since these five kinds
 *  are a closed set (not a user-supplied stereotype label). */
const VISIBILITY_ICON_KINDS: readonly string[] = ['public', 'private', 'protected', 'package', 'iemandatory'];

/**
 * `visibilityIcon { <kind> {...} } }`'s two colour cascades
 * ({@link GraphCascadeOverride.visibilityIconLineCascade}/
 * `visibilityIconBackgroundCascade`) -- one lookup per kind, per property.
 * `cascadeHex(styleMap, ['visibilityicon', kind], property)` matches ONLY
 * a selector whose tokens are ALL in `{visibilityicon, kind}` -- so
 * `visibilityicon.protected` matches the `protected` query but
 * `visibilityicon.public` does not, giving each kind its own independent
 * result (`resolveStyleCascade`'s existing subset-match algorithm, no new
 * matching logic needed).
 */
export function applyVisibilityIconCascadeOverrides(styleMap: StyleMap, override: Partial<GraphCascadeOverride>): void {
  const line: Record<string, string> = {};
  const background: Record<string, string> = {};
  for (const kind of VISIBILITY_ICON_KINDS) {
    const snames = ['visibilityicon', kind];
    const lineHex = cascadeHex(styleMap, snames, 'linecolor');
    if (lineHex !== undefined) line[kind] = lineHex;
    const backgroundHex = cascadeHex(styleMap, snames, 'backgroundcolor');
    if (backgroundHex !== undefined) background[kind] = backgroundHex;
  }
  if (Object.keys(line).length > 0) override.visibilityIconLineCascade = line;
  if (Object.keys(background).length > 0) override.visibilityIconBackgroundCascade = background;
}
