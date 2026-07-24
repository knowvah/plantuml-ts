/**
 * Shared state-box color/stroke constants and per-node `#color` override
 * resolution (mission G4 S2, mechanism 5) — used by both renderer-box.ts
 * (normal/json leaf box) and renderer-pseudostate.ts (choice/history/
 * deepHistory, which jar-verified share the SAME `state` StyleSignature
 * default: cekolo-21-gini183 draws history/choice with fill="#F1F1F1"
 * stroke="#181818" stroke-width="0.5", byte-identical to a plain leaf
 * state's own box — not a coincidence, `EntityImagePseudoState`/
 * `EntityImageBranch` share `EntityImageStateCommon.STYLE`'s
 * `StyleSignatureBasic.of(root, element, stateDiagram, state)` with the
 * plain leaf box, unlike initial/final/fork/join which have their OWN,
 * visually distinct default colors — see renderer-pseudostate.ts).
 * @see ~/git/plantuml/.../svek/image/EntityImageStateCommon.java
 */
import type { StateNodeGeo } from './state-geo-types.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { resolveBareOrBackColor } from '../class/class-color-override.js';
import type { Theme } from '../../core/theme.js';

/** Default box fill (`skinparam stateBackgroundColor`'s own terminal
 *  default) — jar-verified jocela-05-niba392 / votoki-67-gufa610 /
 *  gefefe-91-xoge233 / cekolo-21-gini183 (history + choice). */
export const STATE_DEFAULT_BACKGROUND = '#F1F1F1';

/** Box/divider/history/choice border stroke-width — jar-verified for state
 *  directly (not assumed from class's own identical `0.5` default). */
export const STATE_BORDER_STROKE_WIDTH = 0.5;

/**
 * `Colors#getColor(BackGroundColor)` — a per-node `#color`/`#back:color`
 * inline override (`State.color`, the SAME raw grammar `Classifier.color`
 * uses upstream, per `state-commands-declarations.ts`'s own doc comment)
 * wins over `fallback`. Jar-verified jocela-05-niba392 (`state state1
 * #red` → `fill="#FF0000"`).
 */
export function resolveStateFill(node: Pick<StateNodeGeo, 'color'>, fallback: string): string {
  const override = resolveBareOrBackColor(node.color);
  return override !== undefined ? resolveColorToSvgHex(override) : fallback;
}

/** mission G4 S10: `theme.colors.elements['state'].background` -- the SAME
 *  generic `ELEMENT_BUCKET_SNAMES` bucket `object`/`map`/`json`/`note`
 *  already reuse for FREE (`core/skinparam.ts`'s own `'state'` entry doc
 *  comment) for the PLAIN `skinparam stateBackgroundColor` form -- a plain
 *  color NAME still needs HColorSet resolution (mirrors `renderer-classifier-
 *  box.ts#resolveElementBackground`'s identical string-only branch; a
 *  Gradient `Paint` bucket value is unsupported here for the SAME reason
 *  that sibling function documents -- no fixture in this corpus's own
 *  `state`-bucket family exercises one, out of scope). */
function resolveStateBucketBackground(theme: Theme): string | undefined {
  const bucket = theme.colors.elements?.['state']?.background;
  return typeof bucket === 'string' ? resolveColorToSvgHex(bucket) : undefined;
}

/** mission skin-file-loading Batch 1 (D3): `theme.colors.graph.
 *  rootElementBackground` -- the GLOBAL `skin <name>`/`<style> root {}`/
 *  `<style> element {}` universal BackgroundColor cascade (`style-map-
 *  element.ts#resolveGlobalBackground`'s own doc comment for the full
 *  mechanism and why it is a DEDICATED field, not `theme.colors.
 *  background`). Sits BELOW the `state`-element bucket tier ({@link
 *  resolveStateBucketBackground}) and ABOVE each shape's own hardcoded
 *  default -- a bare `state { BackgroundColor }` selector is strictly
 *  more specific than the universal `root`/`element` fallback, matching
 *  every other tiered resolver in this module. Jar-verified
 *  `nimana-36-veco708` (`skin rose`, no `state {}` override -> box
 *  `fill="#FEFECE"`, rose's `root { BackGroundColor #FEFECE }` value). */
function resolveStateRootElementBackground(theme: Theme): string | undefined {
  const raw = theme.colors.graph.rootElementBackground;
  return raw !== undefined ? resolveColorToSvgHex(raw) : undefined;
}

/** mission G6 T4: `theme.colors.elements['state'].border` -- the SAME
 *  generic bucket {@link resolveStateBucketBackground} reads, applied to a
 *  state box/composite-cluster outline's own stroke. Populated by a bare
 *  `<style> state { LineColor ... } }` selector directly, OR (mission G6
 *  T4) by `core/skinparam.ts#parseStyleBlock`'s own bare `stateDiagram {
 *  LineColor ... } }` cascade alias (`decede-10-buvu414`, jar-verified --
 *  see `resolveStateBorder`'s own doc comment for the full precedence
 *  tier). A Gradient `Paint` bucket value is unsupported here for the SAME
 *  reason {@link resolveStateBucketBackground} documents. */
function resolveStateBucketBorder(theme: Theme): string | undefined {
  const bucket = theme.colors.elements?.['state']?.border;
  return typeof bucket === 'string' ? resolveColorToSvgHex(bucket) : undefined;
}

/** mission G6 T4: `theme.colors.elements['state'].font` -- the SAME generic
 *  bucket {@link resolveStateBucketBackground} reads, applied to a state
 *  box's own label text color. See {@link resolveStateBucketBorder}'s own
 *  doc comment for the identical population mechanism (bare `state {
 *  FontColor ... } }` OR the `stateDiagram { FontColor ... } }` cascade
 *  alias). */
function resolveStateBucketFontColor(theme: Theme): string | undefined {
  const bucket = theme.colors.elements?.['state']?.font;
  return typeof bucket === 'string' ? resolveColorToSvgHex(bucket) : undefined;
}

/** mission G4 S15: `skinparam stateBackgroundColor<<stereo>> #X` --
 *  `theme.colors.graph.stateBackgroundColorByStereo`'s own doc comment
 *  (theme.ts) for the precedence tier this sits at (below the `#color`
 *  inline override, above the bare `state`-element bucket). Keyed by the
 *  node's OWN lowercased stereotype, mirroring `resolveStateBorder`'s
 *  identical lookup shape. */
function resolveStateBackgroundByStereo(
  node: Pick<StateNodeGeo, 'stereotype'>,
  theme: Theme,
): string | undefined {
  if (node.stereotype === undefined) return undefined;
  const override = theme.colors.graph.stateBackgroundColorByStereo?.[node.stereotype.toLowerCase()];
  return override !== undefined ? resolveColorToSvgHex(override) : undefined;
}

/**
 * `resolveStateFill` PLUS the `state`-element bucket tier, for the call
 * sites that share jar's `EntityImageStateCommon` StyleSignature (plain
 * leaf box, composite box, choice/history/deepHistory pseudostates) -- NOT
 * initial/final/fork/join/syncBar, which keep their OWN distinct default
 * colors and stay on the plain {@link resolveStateFill} (module doc
 * comment's own scoping note; `core/skinparam.ts`'s `'state'` bucket entry
 * doc comment). Precedence: `#color`/`#back:color` inline override (highest)
 * -> `skinparam stateBackgroundColor<<stereo>>` (mission G4 S15) ->
 * `skinparam stateBackgroundColor` bucket -> the `skin <name>`/`<style>
 * root {}`/`element {}` universal cascade (mission skin-file-loading
 * Batch 1, D3 -- {@link resolveStateRootElementBackground}) -> `fallback`
 * (the per-kind hardcoded default, e.g. {@link STATE_DEFAULT_BACKGROUND}).
 */
export function resolveStateFillBucketed(
  node: Pick<StateNodeGeo, 'color' | 'stereotype'>,
  theme: Theme,
  fallback: string,
): string {
  const override = resolveBareOrBackColor(node.color);
  if (override !== undefined) return resolveColorToSvgHex(override);
  return (
    resolveStateBackgroundByStereo(node, theme) ??
    resolveStateBucketBackground(theme) ??
    resolveStateRootElementBackground(theme) ??
    fallback
  );
}

/**
 * `skinparam StateBorderColor<<X>> #color` -- `SkinParam#getColor(ColorParam,
 * Stereotype)`, a direct stereotype-qualified VALUE lookup (mission G4 S9,
 * mirrors the class engine's `classBorderThicknessByStereo` mechanism, G2
 * N51). Wins over the `state`-element bucket tier (mission G6 T4,
 * {@link resolveStateBucketBorder}) when `node`'s OWN stereotype (lowercased,
 * matching `core/skinparam.ts`'s own lowercased-key storage) has a matching
 * entry in `theme.colors.graph.stateBorderColorByStereo`. Jar-verified
 * `semala-31-joji042` (`skinparam StateBorderColor<<meblue>> blue`, `state
 * a<<meblue>>` -> box/divider `stroke="#0000FF"`; its plain, non-stereotyped
 * children keep the `#181818` default). The bucket tier itself falls back to
 * the plain `theme.colors.border` default, matching {@link
 * resolveStateFillBucketed}'s own precedence shape.
 */
export function resolveStateBorder(
  node: Pick<StateNodeGeo, 'stereotype'>,
  theme: Theme,
): string {
  if (node.stereotype !== undefined) {
    const override = theme.colors.graph.stateBorderColorByStereo?.[node.stereotype.toLowerCase()];
    if (override !== undefined) return resolveColorToSvgHex(override);
  }
  return resolveStateBucketBorder(theme) ?? theme.colors.border;
}

/**
 * `skinparam StateFontColor<<X>> #color` -- mission G4 S15, the SAME
 * direct-value-lookup mechanism as {@link resolveStateBorder}, applied to
 * a state box's own label text color. Wins over the `state`-element bucket
 * tier (mission G6 T4, {@link resolveStateBucketFontColor}) when `node`'s
 * OWN stereotype (lowercased) has a matching entry in
 * `theme.colors.graph.stateFontColorByStereo`; the bucket tier itself wins
 * over `fallback` (the box's pre-existing hardcoded `#000000` text default),
 * matching {@link resolveStateFillBucketed}'s own precedence shape.
 */
export function resolveStateFontColor(
  node: Pick<StateNodeGeo, 'stereotype'>,
  theme: Theme,
  fallback: string,
): string {
  if (node.stereotype !== undefined) {
    const override = theme.colors.graph.stateFontColorByStereo?.[node.stereotype.toLowerCase()];
    if (override !== undefined) return resolveColorToSvgHex(override);
  }
  return resolveStateBucketFontColor(theme) ?? fallback;
}

/**
 * `skinparam StateFontSize<<X>> N` -- mission G4 S16, the SAME direct-value-
 * lookup mechanism as {@link resolveStateBorder}/{@link resolveStateFontColor},
 * applied to a state box's own label TEXT SIZE. Wins over `fallback` (the
 * caller's own default -- `theme.fontSize` at every current call site) when
 * `node`'s OWN stereotype (lowercased) has a matching entry in
 * `theme.colors.graph.stateFontSizeByStereo`. Unlike its two color siblings,
 * this is read from BOTH `state-sizing.ts` (layout-time measurement, which
 * feeds the box's own DOT node width/height) and `renderer-box.ts`
 * (render-time `<text font-size>` + line-step formula) -- see
 * `theme.ts#stateFontSizeByStereo`'s own doc comment for the full mechanism.
 */
export function resolveStateFontSize(
  node: Pick<StateNodeGeo, 'stereotype'>,
  theme: Pick<Theme, 'colors'>,
  fallback: number,
): number {
  if (node.stereotype !== undefined) {
    const override = theme.colors.graph.stateFontSizeByStereo?.[node.stereotype.toLowerCase()];
    if (override !== undefined) return override;
  }
  return fallback;
}

/**
 * `<style> stateDiagram { arrow { LineColor ... } } }` -- mission G4 S16.
 * Wins over `fallback` (`theme.colors.arrow` at the ONE current call
 * site) when `theme.colors.graph.stateArrowLineColor` is set. See
 * `theme.ts#stateArrowLineColor`'s own doc comment for the full
 * derivation and the `style-map-theme.ts#applyStyleMap` injection point.
 */
export function resolveStateArrowLineColor(theme: Pick<Theme, 'colors'>, fallback: string): string {
  const override = theme.colors.graph.stateArrowLineColor;
  return override !== undefined ? resolveColorToSvgHex(override) : fallback;
}

/**
 * `<style> stateDiagram { arrow { HeadColor ... } } }` -- mission G4 S16,
 * the SAME cascade as {@link resolveStateArrowLineColor}, applied to the
 * arrowhead `<polygon>`'s OWN fill AND stroke (both, jar-verified
 * `nanozi-96-foda024` -- see `theme.ts#stateArrowHeadColor`'s own doc
 * comment). Mission G6 T4: when NO explicit HeadColor cascade is set, jar's
 * own default for the arrowhead is the transition's OWN `LineColor`
 * (`stateArrowLineColor`), not `fallback` directly -- jar-verified against
 * `decede-10-buvu414` (a lone `stateDiagram { LineColor green }`, no nested
 * `arrow { HeadColor ... } }`, tints the arrowhead polygon green too) and a
 * targeted probe (`stateDiagram { arrow { LineColor blue } } }` alone ->
 * polygon `fill="#0000FF" stroke="#0000FF"`). `fallback` is reached only
 * when NEITHER HeadColor nor LineColor cascade is set.
 */
export function resolveStateArrowHeadColor(theme: Pick<Theme, 'colors'>, fallback: string): string {
  const override = theme.colors.graph.stateArrowHeadColor;
  if (override !== undefined) return resolveColorToSvgHex(override);
  const lineOverride = theme.colors.graph.stateArrowLineColor;
  if (lineOverride !== undefined) return resolveColorToSvgHex(lineOverride);
  return fallback;
}

/**
 * `<style> stateDiagram { RoundCorner N } }` -- mission G6 T4 residual
 * closure. jar's `URectangle` halving convention: `rx`/`ry` = RoundCorner/2
 * (verified directly against the jar oracle: `RoundCorner 2` -> `rx="1"`,
 * `RoundCorner 10` -> `rx="5"`, no override -> `rx="12.5"` i.e. jar's own
 * default `RoundCorner 25` -- mirrors `theme.ts#classCascadeRoundCorner`'s
 * identical halving formula for the class engine). Applies uniformly to
 * EVERY state-diagram box shape (leaf box, composite/cluster outline, AND
 * the composite header's own half-rounded arc) since jar's bare
 * `stateDiagram { RoundCorner }` selector reaches all of them (mission G6
 * T4 diagnosis, `decede-10-buvu414`). `fallback` is the pre-existing
 * hardcoded `STATE_BOX_RX` (12.5) -- every call site passes it unchanged,
 * so the DEFAULT (no `<style>` RoundCorner) render stays byte-identical.
 */
export function resolveStateBoxRadius(theme: Pick<Theme, 'colors'>, fallback: number): number {
  const raw = theme.colors.graph.stateCascadeRoundCorner;
  return raw !== undefined ? raw / 2 : fallback;
}

/**
 * `<style> activityBar { .fork { BackGroundColor ... } } }` -- mission G4
 * S16. Returns `undefined` (not a fallback) when unset, so callers can
 * distinguish "no cascade override" from "resolved to a color" and fall
 * through to their OWN hardcoded default (`renderer-pseudostate.ts
 * #renderForkJoin`'s `SYNCHRO_BAR_COLOR`) -- mirrors `theme.ts
 * #activityBarForkColor`'s own doc comment for the full derivation.
 */
export function resolveActivityBarForkColor(theme: Pick<Theme, 'colors'>): string | undefined {
  const override = theme.colors.graph.activityBarForkColor;
  return override !== undefined ? resolveColorToSvgHex(override) : undefined;
}

/** Same mechanism as {@link resolveActivityBarForkColor}, the `.join`
 *  selector's own BackGroundColor. */
export function resolveActivityBarJoinColor(theme: Pick<Theme, 'colors'>): string | undefined {
  const override = theme.colors.graph.activityBarJoinColor;
  return override !== undefined ? resolveColorToSvgHex(override) : undefined;
}

/**
 * `fontSize - fontSize/4.5` — the SAME content-independent ascent-from-
 * line-top formula the class engine uses (`class-layout-helpers.ts`'s
 * `fontSpec.size - measurer.getDescent(fontSpec, '')`), reproduced
 * arithmetically here since the renderer has no `StringMeasurer` of its own
 * — every measurer in this codebase returns a content-independent descent
 * (`core/measurer.ts`'s own `getDescent` implementations all ignore their
 * `text` parameter), so this is exact, not an approximation.
 */
export function textAscent(fontSize: number): number {
  return fontSize - fontSize / 4.5;
}

/** `fontSize/4.5` — see {@link textAscent}'s own doc comment. */
export function textDescent(fontSize: number): number {
  return fontSize / 4.5;
}
