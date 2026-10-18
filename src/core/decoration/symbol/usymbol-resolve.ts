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
import type { Theme, PackageStyleSetting } from '../../theme.js';
import { resolveElementFontSize } from '../../theme.js';
import { isTransparentColor } from '../../paint.js';
import { FontStyle, type FontConfiguration } from '../../klimt/shape/UText.js';
import { ActorStyle } from '../../skin/ActorStyle.js';
import { ComponentStyle, PackageStyle, packageStyleToUSymbol } from './USymbols.js';
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

const PACKAGE_STYLE_BY_SETTING: Readonly<Record<PackageStyleSetting, PackageStyle>> = {
  folder: PackageStyle.FOLDER,
  rect: PackageStyle.RECTANGLE,
  node: PackageStyle.NODE,
  frame: PackageStyle.FRAME,
  cloud: PackageStyle.CLOUD,
  database: PackageStyle.DATABASE,
  agent: PackageStyle.AGENT,
  storage: PackageStyle.STORAGE,
  component1: PackageStyle.COMPONENT1,
  component2: PackageStyle.COMPONENT2,
  artifact: PackageStyle.ARTIFACT,
  card: PackageStyle.CARD,
};

/** `Theme.packageStyle` (lowercase setting) -> `USymbols.ts`'s `PackageStyle` as-const -- `SkinParam#packageStyle`
 *  (`SkinParam.java:820-826`): FOLDER when the skinparam is absent or unknown. */
export function resolvePackageStyle(theme: Theme): PackageStyle {
  return PACKAGE_STYLE_BY_SETTING[theme.packageStyle ?? 'folder'];
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
  // `USymbols.fromString("package", ..., packageStyle)` (`USymbols.java:103-104`, from
  // `CommandPackageWithUSymbol.java:194`): the keyword's symbol IS the skin's package style, and is null for the
  // styles `PackageStyle#toUSymbol` has no symbol for.
  if (symbol === 'package') return packageStyleToUSymbol(resolvePackageStyle(theme));
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
 * > The per-stereotype-NAME size tier is delivered by {@link stereotypeTextFont} (codd T6-D), which takes the
> entity's labels; `textFont`'s `'stereotype'` role resolves the un-labelled tiers only.
 */
export function textFont(
  theme: Theme,
  symbol: string,
  sizeDelta = 0,
  styles: ReadonlySet<FontStyle> = EMPTY_STYLES,
  role: 'title' | 'stereotype' = 'title',
): FontConfiguration {
  return fontConfigurationFor(
    theme,
    symbol,
    styles,
    resolveElementFontSize(theme, symbol, role) ?? theme.fontSize + sizeDelta,
  );
}

/**
 * The stereotype font of one entity/group, WITH its labels: the per-stereotype-NAME FontSize tier
 * (`skinparam <sname>StereotypeFontSize<<bar>> N` / `<style> <sname> { stereotype { .bar { FontSize N } } }`,
 * `resolveElementFontSize`'s `stereotypes` argument) that {@link textFont} cannot reach, since it has no access to
 * the labels. `EntityImageDescription.java:155-157` / `ClusterHeader.java:208-213` build the stereotype style
 * `forStereotypeItself(stereotype)`, so the draw side must size it the way the sizer already does
 * (`leaf-sizing-entity.ts`); otherwise the DOT box and the drawn `«x»` disagree (`loroto-06-fano471`,
 * `toxine-81-xofo986`, `unknown/golamo-46-lume529`).
 */
export function stereotypeTextFont(
  theme: Theme,
  symbol: string,
  labels: readonly string[],
  styles: ReadonlySet<FontStyle>,
): FontConfiguration {
  return fontConfigurationFor(
    theme,
    symbol,
    styles,
    resolveElementFontSize(theme, symbol, 'stereotype', labels) ?? theme.fontSize,
  );
}

/**
 * gtc T2b: the bucket's own `FontStyle` (`<style> <sname> { FontStyle italic }`) REPLACES the caller's default face --
 * `Style.java:241-253 getUFont` builds the face from the merged `PName.FontStyle`, and a user declaration overwrites
 * the skin's (`StyleStorage.java:102-116`). `undefined` when the bucket declares none.
 */
function styleOverride(theme: Theme, symbol: string): ReadonlySet<FontStyle> | undefined {
  const flags = theme.colors.elements?.[symbol]?.fontStyle;
  if (flags === undefined) return undefined;
  const out = new Set<FontStyle>();
  if (flags.bold) out.add(FontStyle.BOLD);
  if (flags.italic) out.add(FontStyle.ITALIC);
  return out;
}

function fontConfigurationFor(
  theme: Theme,
  symbol: string,
  styles: ReadonlySet<FontStyle>,
  size: number,
): FontConfiguration {
  // cdd6 T3g (D3): `FontConfiguration.create(skinParam, style, colors)`
  // reads `style.value(PName.HyperLinkColor)` (`FontConfiguration.java
  // :213-219`) -- the element's own `<style> <sname> { HyperLinkColor }`
  // bucket; absent leaves `CommandCreoleUrl.ts`'s `#0000FF` fallback.
  const hyperlinkColor = theme.colors.elements?.[symbol]?.hyperlinkColor;
  return {
    family: theme.fontFamily,
    size,
    color: textFontColor(theme, symbol),
    styles: styleOverride(theme, symbol) ?? styles,
    ...(hyperlinkColor === undefined ? {} : { hyperlinkColor }),
  };
}

/** cdd3-T28 (E3-14): `EntityImageDescription`'s `styleTitle` FontStyle
 *  (`fcTitle`, `EntityImageDescription.java:172`) -- bold for a `package`
 *  leaf only: `plantuml.skin:72-76` `package { title { FontStyle bold } }`
 *  and `:94-99` `element { composite,package { title { FontStyle bold } } }`;
 *  every other description symbol inherits `root { FontStyle plain }`
 *  (`:11`). */
const PACKAGE_TITLE_STYLES: ReadonlySet<FontStyle> = new Set([FontStyle.BOLD]);

/** The `styles` argument for {@link textFont}'s TITLE font of a leaf drawn
 *  by `EntityImageDescription` -- see {@link PACKAGE_TITLE_STYLES}. */
export function entityTitleStyles(symbol: string): ReadonlySet<FontStyle> {
  return symbol === 'package' ? PACKAGE_TITLE_STYLES : EMPTY_STYLES;
}
