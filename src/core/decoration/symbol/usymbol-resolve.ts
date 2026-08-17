/**
 * usymbol-resolve.ts — shared symbol/style/font resolution for `USymbol`
 * draw paths (SI27 T2: moved from `diagrams/description/renderer-symbol.ts`
 * — upstream keeps this ONE place, `Entity#getUSymbol`, for every factory;
 * the class engine's `renderer-usymbol-entity.ts` and the description
 * engine's `renderer-entity.ts`/`renderer-cluster.ts`/`leaf-sizing-entity.ts`/
 * `leaf-sizing-text.ts` all resolve their `USymbol` and text paint through
 * these same helpers — upstream's `Entity#getUSymbol` and font-color
 * defaults are shared across every draw path too (a group entity, a leaf
 * entity, and a class-diagram usecase/actor are all `Entity` objects
 * upstream).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/Entity.java#getUSymbol (:408)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/ISkinParam.java#actorStyle (:196)
 */
import type { Theme } from '../../theme.js';
import { resolveElementFontSize } from '../../theme.js';
import { isTransparentColor } from '../../paint.js';
import type { FontConfiguration, FontStyle } from '../../klimt/shape/UText.js';
import { ActorStyle } from '../../skin/ActorStyle.js';
import { ComponentStyle } from './USymbols.js';
import { resolveDescriptionUSymbol } from '../../svek/image/EntityImageDescription.js';
import type { USymbol as UpstreamUSymbol } from './USymbol.js';
import type { USymbol } from '../../descriptive-keywords.js';

/**
 * `SkinParam.actorStyle()` (`SkinParam.java:1209-1218`) — resolves
 * `Theme.actorStyle`/`BoxSizingOpts.actorStyle` (both `ActorStyle |
 * undefined`, populated from `skinparam actorStyle` by
 * `skinparam-key-handlers.ts`) to a concrete `ActorStyle`, defaulting to
 * `STICKMAN` when unset — upstream's own default.
 *
 * T7 (description-leaf-sizing-audit): the ONE shared accessor both the
 * RENDERER (`resolveSymbol` below, `renderer-entity.ts#buildEntityParams`)
 * and the SIZER (`leaf-sizing.ts#buildSizingEntityParams`) call — before
 * this function existed, both independently hardcoded `ActorStyle
 * .STICKMAN`, silently ignoring `skinparam actorStyle awesome|hollow`
 * (the defect this task closes). A second, independently-written resolver
 * at either call site would recreate that exact divergence, so both MUST
 * call this one.
 */
export function resolveActorStyle(actorStyle: ActorStyle | undefined): ActorStyle {
  return actorStyle ?? ActorStyle.STICKMAN;
}

/** Jar default entity/cluster text-fill (`HtmlColorUtils.BLACK`,
 *  `SkinParameter`'s `FontColor` default) — distinct from `theme.colors
 *  .text` (`#181818`, this codebase's generic default used elsewhere for
 *  border/line color roles; see `theme.ts`'s own `resolveElementPaint`
 *  doc comment). Verified against `test-results/dot-cache/component/
 *  sacuso-94-gugi476/in.svg`'s `<text fill="#000000">`. Exported (G1 I2):
 *  `renderer-edge.ts`'s link-label font reuses the SAME jar default rather
 *  than duplicating the literal (`klimt/font/FontParam.java`'s
 *  `FontParamConstant.COLOR = "black"`, the fallback every `FontParam`
 *  entry without its own override color resolves to — `ARROW` included). */
export const JAR_DEFAULT_TEXT_COLOR = '#000000';

/** No style flags — the shared default for `textFont`'s `styles` param
 *  (avoids allocating a fresh empty `Set` on every plain title/body call). */
const EMPTY_STYLES: ReadonlySet<FontStyle> = new Set();

/**
 * `DescriptionNodeGeo.symbol` (this port's own simplified keyword union,
 * `core/descriptive-keywords.ts`) → the upstream keyword string
 * `resolveDescriptionUSymbol` expects. Identity for every symbol except
 * the two business variants, which upstream spells with a trailing slash
 * (`actor/`, `usecase/` — `descdiagram/command/CommandCreateElementFull
 * .java`'s own keyword spelling).
 */
export function upstreamKeyword(symbol: USymbol): string {
  if (symbol === 'actor-business') return 'actor/';
  if (symbol === 'usecase-business') return 'usecase/';
  return symbol;
}

/** `Theme.componentStyle` (lowercase union, this codebase's existing
 *  skinparam-facing shape) → `USymbols.ts`'s `ComponentStyle` as-const
 *  (upstream-named, uppercase). Two distinct types for the same concept
 *  already existed pre-T17 (`leaf-sizing.ts` vs `USymbols.ts`); this is
 *  the adapter between them, not a new divergence. */
export function mapComponentStyle(style: Theme['componentStyle']): ComponentStyle {
  if (style === 'uml1') return ComponentStyle.UML1;
  if (style === 'rectangle') return ComponentStyle.RECTANGLE;
  return ComponentStyle.UML2;
}

/** Resolves the `USymbol` for a description-diagram node/container symbol,
 *  reusing `EntityImageDescription`'s own `resolveDescriptionUSymbol` seam
 *  (T14) — the same function upstream's `Entity#getUSymbol` fallback chain
 *  exercises for both leaf entities and group entities. Returns `null` only
 *  for `port`/`portin`/`portout` (upstream never resolves a `USymbol` for
 *  ports either — `EntityImagePort` draws them, out of this port's scope;
 *  see `renderer-entity.ts`'s fallback path) and `note` (not in upstream's
 *  `ALL_TYPES` keyword table at all — `EntityImageNote` is a separate,
 *  unported draw class; same fallback path). */
export function resolveSymbol(symbol: USymbol, theme: Theme): UpstreamUSymbol | null {
  if (symbol === 'port' || symbol === 'note') return null;
  return resolveDescriptionUSymbol(
    upstreamKeyword(symbol),
    resolveActorStyle(theme.actorStyle),
    mapComponentStyle(theme.componentStyle),
  );
}

/** Title/body text color: an explicit per-element skinparam/style override
 *  (`theme.colors.elements[sname].font`, decision D4) wins ONLY when it is
 *  a plain solid color — `FontConfiguration.color` is `string | null`
 *  (klimt's text driver has no gradient-fill text path), so a `Gradient`
 *  override falls back to the jar default rather than producing an
 *  unrenderable value. Otherwise the jar's true default (`#000000`), NOT
 *  `theme.colors.text` (see this module's `JAR_DEFAULT_TEXT_COLOR` doc
 *  comment — `theme.colors.text` is a pre-existing generic default this
 *  port's other renderers already use for a different role, out of this
 *  task's write-set to change). */
export function textFontColor(theme: Theme, symbol: string): string | null {
  const override = theme.colors.elements?.[symbol]?.font;
  if (typeof override !== 'string') return JAR_DEFAULT_TEXT_COLOR;
  // G1 I5d: `DriverTextSvg#draw` returns before emitting ANY `<text>` when
  // `fontConfiguration.getColor().isTransparent()` (klimt/drawing/svg/
  // DriverTextSvg.java:92-94) -- a `FontColor transparent`/`#00000000`
  // override elides the text entirely, it does not merely paint it
  // invisibly. `FontConfiguration.color` is already `string | null` for
  // exactly this case (see `driver-text-svg.ts`'s own `font.color === null`
  // guard); this was the one caller that never produced `null`.
  return isTransparentColor(override) ? null : override;
}

/**
 * Builds a `FontConfiguration` for entity/cluster body or stereotype text.
 *
 * `sizeDelta` (default 0): every `FontParam` this port's reachable
 * description keywords resolve to (`COMPONENT`/`NODE`/`ACTOR`/`ARTIFACT`/
 * `USECASE`/… — `klimt/font/FontParam.java:60-90`) is size 14, and EVERY
 * matching `*_STEREOTYPE` variant is ALSO size 14 (only the italic face
 * differs) — so callers building stereotype text pass `sizeDelta: 0`
 * (the default) rather than a smaller size (G1 I2 finding: a prior
 * `theme.fontSize - 2` convention here was NOT faithful to the jar, which
 * draws stereotype text at the SAME size as its host entity's title, just
 * italic — see `renderer-entity.ts`/`renderer-cluster.ts`'s stereotype
 * font construction).
 *
 * `styles` (default none): callers pass `FontStyle.ITALIC` for stereotype
 * text (`FontParam.*_STEREOTYPE`'s `UFontFace.italic()`) or
 * `FontStyle.BOLD` for a cluster/group title (`FontParam.PACKAGE`'s
 * `getDefaultFontFace`, `inPackageTitle=true` — see
 * `renderer-cluster.ts#buildHeader`'s own doc comment).
 *
 * `role` (default 'title'): selects which per-element size override
 * `resolveElementFontSize` (`theme.ts`, G1 I4b) consults —
 * `<sname>FontSize`/`<style> <sname> { FontSize N }` for `'title'`,
 * `<sname>StereotypeFontSize`/`<style> <sname> { stereotype { FontSize N }
 * } }` for `'stereotype'` (falling back to the plain `FontSize` override,
 * then to `theme.fontSize + sizeDelta`). Callers building stereotype text
 * pass `role: 'stereotype'` alongside `FontStyle.ITALIC`.
 *
 * > **Open, escalated (S1L-tail G4 tier 2).** `resolveElementFontSize` now
 * > carries a fourth `stereotypes` argument for the per-stereotype-NAME tier
 * > (`skinparam <sname>StereotypeFontSize<<bar>> N` / `<style> <sname> {
 * > stereotype { .bar { FontSize N } } }`), and the SIZER supplies it. This
 * > function cannot: it has no access to the entity's own labels, and it is
 * > already at the project's 5-parameter ceiling, so delivering them means
 * > bundling `role`+`stereotypes` into one options argument and updating all
 * > FIVE call sites — `renderer-entity.ts:189-190`,
 * > `renderer-cluster.ts:92,101`, `class/renderer-usymbol-entity.ts:82-83` —
 * > four of which sit outside F3-fix's declared write-set. Until then the INK
 * > half of `loroto-06-fano471`/`toxine-81-xofo986` stays open (`«bar»` draws
 * > at 20 where the jar draws 10); only the SIZE half closed.
 */
export function textFont(
  theme: Theme,
  symbol: string,
  sizeDelta = 0,
  styles: ReadonlySet<FontStyle> = EMPTY_STYLES,
  role: 'title' | 'stereotype' = 'title',
): FontConfiguration {
  const sizeOverride = resolveElementFontSize(theme, symbol, role);
  return {
    family: theme.fontFamily,
    size: sizeOverride ?? theme.fontSize + sizeDelta,
    color: textFontColor(theme, symbol),
    styles,
  };
}
