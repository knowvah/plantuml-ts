/**
 * renderer-cluster.ts — T17: assembles `Cluster` (T12) for one container
 * `DescriptionNodeGeo` (`children.length > 0`). Unlike a leaf entity,
 * `Cluster#drawU` reads its own absolute position off `ClusterGeometry
 * .position` (a `UTranslate`) internally — the caller passes the
 * un-translated `ug` (see `Cluster.ts`'s `ClusterDecoration#drawU`).
 */
import { bareEntityName } from './namespace-groups.js';
import type { Theme } from '../../core/theme.js';
import { resolveElementShadowing } from '../../core/theme.js';
import { resolveClusterTitleAlignment, resolveElementRoundCorner } from '../../core/theme-element-resolve.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { buildTextBlock } from '../../core/svek/image/EntityImageDescriptionSupport.js';
import { buildClusterTitle } from '../../core/svek/image/EntityImageDescriptionClusterTitle.js';
import {
  Cluster,
  type ClusterGroupInfo,
  type ClusterHeaderInfo,
  type ClusterStyleDefaults,
  type ClusterSymbolInfo,
} from '../../core/svek/Cluster.js';
import { makeAtomImageResolverFor } from '../../core/creole-atoms-image-resolver.js';
import { spriteDimsLookupFor, type SpriteRegistry } from '../../core/sprite-commands.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { buildStereo, resolveStereotypeSprite } from '../../core/svek/image/EntityImageDescriptionDelegates.js';
import type { USymbol } from '../../core/descriptive-keywords.js';
import { rawStereotypeLabels } from './parse-helpers.js';
import type { DescriptionNodeGeo } from './layout-helpers.js';
import {
  resolvePackageStyle,
  resolveSymbol,
  stereotypeTextFont,
  textFont,
} from '../../core/decoration/symbol/usymbol-resolve.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { parseColorOverride, lineStyleStroke } from './renderer-color-override.js';
import { drawKermorGroupNote } from './renderer-cluster-note.js';

/** Jar-observed default cluster border width for `package`/`folder`
 *  (folder-tab-decorated) containers only (`test-results/dot-cache/
 *  component/sacuso-94-gugi476/in.svg`: `stroke-width:1.5`; re-verified
 *  unstyled in `dujodu-23-viba393`). */
const CLUSTER_STROKE_WIDTH = 1.5;
/** Jar-observed unstyled `package`/`folder` cluster border color
 *  (`component/dujodu-23-viba393`: `stroke:#000000`, no skinparam/style
 *  override present) — deliberately NOT `theme.colors.graph.packageBorder`
 *  (`#999999`): that shared theme field is also read by the class-diagram
 *  renderer (`src/diagrams/class/renderer.ts`, out of G1 scope) and its
 *  value is grep-verified to appear in ZERO description-corpus goldens
 *  (`grep -l 'stroke:#999999'` over every cached `in.svg` — no match), so
 *  this description-local constant avoids touching a value another,
 *  out-of-scope diagram type also depends on. */
const FOLDER_BORDER_DEFAULT = '#000000';
/** Jar-observed default cluster border color/width/corner-rounding for
 *  every OTHER container USymbol (`component`, `frame`, `node`, `cloud`,
 *  `card`, …) — matches the LEAF-entity default exactly, not the
 *  folder/package one. `buildStyleDefaults` (pre-fix) applied
 *  `CLUSTER_STROKE_WIDTH`/`theme.colors.graph.packageBorder` (folder-style)
 *  to EVERY container regardless of USymbol, which upstream never does:
 *  `Cluster.java#manageEntryExitPoint`'s style lookup
 *  (`getDefaultStyleDefinition(diagramType, uSymbol, groupType)`) is keyed
 *  per-USymbol, and only `USymbolFolder`'s own style differs from the
 *  generic element default. Jar-verified (unstyled, no color override) on
 *  4 distinct symbol types: `component/catari-10-xiza828` (nested
 *  `component`), `component/saxosu-09-nodi002` (`frame`),
 *  `component/bijoko-90-riro507` (`node`), `component/detona-13-ziko113`
 *  (`cloud`), `component/temufu-00-rira888` (`card`) — all `stroke:
 *  #181818;stroke-width:1` with `rx="2.5" ry="2.5"` where the shape draws
 *  a plain rounded rect (G1 I5c/I5d, "component-container-cluster default
 *  border/stroke gap", ledgered NOT FIXED until this iteration). */
const NON_FOLDER_BORDER_DEFAULT = '#181818';
const NON_FOLDER_STROKE_WIDTH = 1;
/** `URectangle.ts#build` halves `roundCorner` into the emitted `rx`/`ry`
 *  (`roundCorner / 2`) — 5.0 here reproduces the jar-verified `rx="2.5"`
 *  above, matching leaf entities' own `ENTITY_ROUND_CORNER` constant
 *  (`renderer-entity.ts`). */
const NON_FOLDER_ROUND_CORNER = 5.0;
/** Stereotype text style flags — same convention as `renderer-entity.ts`'s
 *  `STEREOTYPE_STYLES` (italic, same size as the title — see
 *  `renderer-symbol.ts#textFont`'s doc comment). */
const STEREOTYPE_STYLES: ReadonlySet<FontStyle> = new Set([FontStyle.ITALIC]);
/** A group/container title is always BOLD — `abel/Entity.java
 *  #getFontConfigurationForTitle` resolves EVERY group title's font via
 *  `FontParam.PACKAGE` (`getTitleFontParam`: only `GroupType.STATE` uses a
 *  different param, unreachable for description diagrams) with
 *  `inPackageTitle=true`; `FontParam#getDefaultFontFace` (`klimt/font/
 *  FontParam.java:167-172`) returns `UFontFace.bold()` whenever
 *  `inPackageTitle` is true, regardless of the container's own keyword
 *  (`frame`/`node`/`package`/… all bold their title the same way — G1 I2
 *  finding, jar-verified against `component/balomu-94-kegi822`,
 *  `bijoko-90-riro507`, `bisedo-29-kone620`). Leaf-entity titles never get
 *  this (`renderer-entity.ts`'s `fontTitle` carries no style flags). */
const TITLE_STYLES: ReadonlySet<FontStyle> = new Set([FontStyle.BOLD]);

/** `USymbolFolder`'s style is the only container USymbol whose jar default
 *  diverges from the generic element default — see `NON_FOLDER_*`/
 *  `FOLDER_BORDER_DEFAULT`'s doc comments. */
function isFolderStyled(symbol: USymbol): boolean {
  return symbol === 'package' || symbol === 'folder';
}

/** What {@link buildHeader} reads beyond the node: the diagram's sprites (both paths: `<$sprite>` in the
 *  title and a sprite stereotype) and, on the ELK path only, the title block's own alignment. */
export interface HeaderOptions {
  readonly sprites: SpriteRegistry | undefined;
  readonly alignment?: HorizontalAlignment;
}

/** `ClusterHeader.java:197-207`: one centered guillemet line per visible tag, or an empty block. */
function labelBlock(node: DescriptionNodeGeo, theme: Theme): TextBlock {
  if (node.stereotype === undefined || node.stereotype.length === 0) return TextBlockUtils.empty(0, 0);
  // `Display.create(visibleStereotypes)` takes the RAW `<<...>>` runs (`CucaDiagram.java:596-602`, DOUBLE_COMPARATOR)
  // and the creole parser's `Guillemet#manageGuillemet` (`CreoleParser.java:175`) turns each into `«x»` -- except a
  // run holding a creole tag (`<< <U+00B5>Service >>`), which its `[^<>]` class rejects and stays literal.
  const raw = rawStereotypeLabels(node.stereotype);
  const lines = node.stereotype.map((label, i) => (raw?.[i] === undefined ? `<<${label}>>` : raw[i]));
  return buildTextBlock(
    lines.join('\n'),
    stereotypeTextFont(theme, node.symbol, node.stereotype, STEREOTYPE_STYLES),
    HorizontalAlignment.CENTER,
  );
}

export function buildHeader(node: DescriptionNodeGeo, theme: Theme, options?: HeaderOptions): ClusterHeaderInfo {
  // `ClusterHeader.java:111`: the title font is built with `g.getColors()`, so an inline `text:` colour wins.
  const text = node.color === undefined ? undefined : parseColorOverride(node.color).text;
  const baseFont = textFont(theme, node.symbol, 0, TITLE_STYLES);
  const titleFont = text === undefined ? baseFont : { ...baseFont, color: text };
  // `ClusterHeader.java:117-119` builds the title with the full `Display#create`, so a `<$sprite>` in a
  // group's label measures and draws; the ELK path (cdd8 T3b) also passes `style.getHorizontalAlignment()`.
  const alignment = options?.alignment ?? resolveClusterTitleAlignment(theme, node.symbol);
  const title = buildClusterTitle(node.display, titleFont, alignment, {
    resolveAtomImage: options === undefined ? undefined : makeAtomImageResolverFor(options.sprites)(titleFont),
  });
  // G1 I5b: one guillemet line per stereotype tag, same convention as
  // `EntityImageDescriptionSupport.ts#buildStereo` -- ClusterHeader.java
  // :197-207 (`Display.create(visibleStereotypes)`) stacks ALL tags, not
  // just the first.
  // `ClusterHeader.java:187-188`: `stereotype.getSprite(skinParam)` is tested FIRST; a hit replaces the
  // label block (same `buildStereo` the leaf path calls, `EntityImageDescription.java:192-201`).
  const sprite = resolveStereotypeSprite(
    node.stereotypeSprite,
    options?.sprites === undefined ? undefined : spriteDimsLookupFor(options.sprites),
  );
  const stereo = sprite === undefined ? labelBlock(node, theme) : buildStereo([], titleFont, undefined, sprite);
  return { title, stereo, titleHorizontalAlignment: resolveClusterTitleAlignment(theme, node.symbol) };
}

export function buildStyleDefaults(theme: Theme, symbol: USymbol): ClusterStyleDefaults {
  const folder = isFolderStyled(symbol);
  return {
    // mission skin-file-loading (deferred D3 item): was hardcoded 0 --
    // `Cluster.ts:319`'s `decoration.drawU(..., style.shadowing, ...)`
    // already draws the shadow given a nonzero value; this was the ONE
    // call site suppressing it. `resolveElementShadowing` cascades this
    // container's OWN USymbol bucket (`skin <name>`/`skinparam <sname> {
    // Shadowing N }`) over the diagram-wide `theme.shadowing` (`skin
    // rose`/`<style> element { Shadowing N } }`), matching jar's
    // `Cluster.java` shared `getStyle().getShadowing()` read.
    shadowing: resolveElementShadowing(theme, symbol),
    // G1 I10: folder-style clusters use the SAME roundCorner as every
    // other container (5 -- jar-verified `A2.5,2.5`/`A3.75,3.75` arcs on
    // component/fetefi-28-figu176, sacuso-94-gugi476, texacu-57-daci050,
    // vovuru-39-sula650's outer cluster path), NOT 0. I7's own fix
    // (folder ? 0 : NON_FOLDER_ROUND_CORNER) only jar-verified folder's
    // border COLOR/stroke-width, not its shape -- `USymbolFolder#drawFolder`
    // draws a FLAT `UPolygon` only when roundCorner===0; the jar's real
    // unstyled folder default is rounded (a `UPath` with `arcTo` corners),
    // same as every non-folder container.
    roundCorner: resolveElementRoundCorner(theme, symbol) ?? NON_FOLDER_ROUND_CORNER,
    strictUmlStyle: false,
    diagonalCorner: 0,
    lineColorDefault: folder ? FOLDER_BORDER_DEFAULT : NON_FOLDER_BORDER_DEFAULT,
    // CDD T18b: `theme.colors.graph.packageBackground` is optional now
    // (theme.ts no longer bakes the cluster's own unstyled default in --
    // see that field's doc comment) -- this call site supplies its own
    // `'none'` (`Cluster.java:285-296`'s unstyled `BackGroundColor`,
    // `plantuml.skin:102-114`) explicitly, matching the pre-T18b value.
    backGroundColorDefault: theme.colors.graph.packageBackground ?? 'none',
    strokeDefault: UStroke.withThickness(folder ? CLUSTER_STROKE_WIDTH : NON_FOLDER_STROKE_WIDTH),
  };
}

/**
 * `Cluster#drawU`'s `!pragma kermor on` branch (`Cluster.java:302-307`): the TOP then the BOTTOM group note draw
 * before the cluster's own comment and symbol. `group.isHidden()` returns first (`:298-300`); the caller
 * (`renderer-draw-sequence.ts#drawClusters`) already skips hidden containers.
 */
class NotedCluster extends Cluster {
  constructor(
    args: ConstructorParameters<typeof Cluster>,
    private readonly notes: NonNullable<DescriptionNodeGeo['kermorNotes']>,
    private readonly theme: Theme,
    private readonly sprites: SpriteRegistry | undefined,
  ) {
    super(...args);
  }

  override drawU(ug: UGraphic): void {
    if (this.notes.top !== undefined) drawKermorGroupNote(ug, this.notes.top, this.theme, this.sprites);
    if (this.notes.bottom !== undefined) drawKermorGroupNote(ug, this.notes.bottom, this.theme, this.sprites);
    super.drawU(ug);
  }
}

/** Builds the `Cluster` for one container node, ready to `drawU(ug)`
 *  (absolute position resolved internally — see module doc comment). */
export function buildCluster(node: DescriptionNodeGeo, theme: Theme, uid: string, sprites?: SpriteRegistry): Cluster {
  // `Cluster.java:312-319,683-692`: the group's inline `#back;line:x` colours (`Colors`) outrank its style.
  const override = node.color === undefined ? {} : parseColorOverride(node.color);
  const group: ClusterGroupInfo = {
    hidden: false,
    name: bareEntityName(node.id),
    uid,
    qualifiedName: node.id,
    location: null,
    isRoot: false,
    lineColorOverride: override.line ?? null,
    backColorOverride: override.back ?? null,
    specificLineStroke: lineStyleStroke(override.lineStyle) ?? null,
  };
  const symbolInfo: ClusterSymbolInfo = {
    symbol: resolveSymbol(node.symbol, theme),
    packageStyle: null,
    // `skinParam.packageStyle()` (`Cluster.java:357-359`): a group with no symbol of its own (null `toUSymbol()`)
    // falls through `ClusterDecoration#guess` to it, and draws nothing when that is null as well.
    defaultPackageStyle: resolvePackageStyle(theme),
    stereoAlignment: HorizontalAlignment.CENTER,
  };
  const args: ConstructorParameters<typeof Cluster> = [
    group,
    buildHeader(node, theme, { sprites }),
    { position: new UTranslate(node.x, node.y), width: node.width, height: node.height },
    buildStyleDefaults(theme, node.symbol),
    symbolInfo,
  ];
  return node.kermorNotes === undefined
    ? new Cluster(...args)
    : new NotedCluster(args, node.kermorNotes, theme, sprites);
}
