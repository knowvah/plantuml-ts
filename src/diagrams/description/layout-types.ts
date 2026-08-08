/**
 * The layout engine's shared context/result TYPES, split out of `layout.ts`
 * (this project's established "500-line splits" workaround — mechanical move
 * only, no behavior and no upstream divergence). `layout.ts` re-exports
 * `ClassifyCtx`/`EdgeDotBuildResult`, so every existing import path is
 * unchanged; `layout-dot-tree.ts` is their principal consumer.
 */
import type { DescriptiveNode } from './ast.js';
import type { DotInputEdge } from '../../core/graph-layout.js';
import type { USymbol } from '../../core/descriptive-keywords.js';
import type { EdgeContainerEndpoints } from './layout-helpers.js';
import type { ComponentStyle } from './leaf-sizing.js';
import type { ActorStyle } from '../../core/skin/ActorStyle.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';
import type { GuillemetPair } from '../../core/text/Guillemet.js';
import type { EmojiArtworkResolver } from '../../core/internal-emoji-store.js';

export interface ContainerDesc {
  // "cluster0" etc — matches comparator's /^cluster\d+$/ (we re-prefix `cluster_` anyway).
  clusterId: string;
  astId: string;
  symbol: USymbol;
  display: string;
  /** G1 I5b: ALL stereotype tags, in source order. */
  stereotype?: readonly string[];
  directLeafAstIds: string[];
  parentAstId?: string;
}

export interface ClassifyCtx {
  leafIdSet: Set<string>;
  containers: ContainerDesc[];
  containerById: Map<string, ContainerDesc>;
  astNodeById: Map<string, DescriptiveNode>;
  counter: { n: number };
  /** `skinparam componentStyle` — gates the UML2 component corner icon. */
  componentStyle: ComponentStyle | undefined;
  /** `skinparam actorStyle` / `Theme.actorStyle` (T7, description-leaf-
   *  sizing-audit) — threaded into `BoxSizingOpts.actorStyle` so the SIZER
   *  reads the SAME value the RENDERER does (`renderer-entity.ts
   *  #buildEntityParams`); see that field's own doc comment. */
  actorStyle: ActorStyle | undefined;
  /** Per-element leaf-box content-width floor resolver: cascades a scoped
   *  `<style> <sname> { MinimumWidth N }` over the global `skinparam
   *  minClassWidth` (S1L-b T5 / S1L-g). Keyed by the node's USymbol so a
   *  `<style> package { MinimumWidth 300 }` floors packages but not a sibling
   *  `card` (ADR-3). `undefined` result ⇒ 0 (no floor). */
  minimumWidthFor: (sname: string) => number | undefined;
  /** Per-element `FontSize` override for one USymbol — the same
   *  `resolveElementFontSize(theme, sname, 'title')` the RENDERER already
   *  calls, threaded so the sizer measures the same font (S1L-h). */
  fontSizeFor: (sname: string) => number | undefined;
  /** S1L-tail G4/G5 — full rationale on the two `BoxSizingOpts` fields these feed. */
  stereotypeFontSizeFor: (sname: string, stereo: readonly string[] | undefined) => number | undefined;
  lineThicknessFor: (sname: string) => number | undefined;
  /** `skinparam wrapWidth` (`theme.wrapWidth`) — the entity DESC word-wrap
   *  width the leaf RENDERER already applies via `Fission.ts#getSplitted`
   *  (`EntityImageDescriptionSupport.ts#buildWrappedLines`). Threaded here so
   *  the SIZER wraps at the same points; 0 = no wrapping (S1L-d). */
  wrapWidth: number;
  /** `skinparam guillemet` pair for DISPLAY text (`manageGuillemet`), S1L-f. */
  guillemet: GuillemetPair;
  /** Container-scoped identity (mission I1b) — bare ids that are TRUE
   *  cross-scope collisions across the WHOLE diagram
   *  (namespace-groups.ts#findCollidingIds), read by `dotKeyFor` to decide
   *  whether a node needs disambiguation. */
  collidingIds: ReadonlySet<string>;
  /** SI5b+E2r T7 seam (c): bridges `ast.sprites` (T4's `SpriteRegistry`) to
   *  T6's `SpriteDimsLookup` (seam (b), `sprite-commands.ts
   *  #spriteDimsLookupFor`) — consulted by `measureLeafNode` (D9) so a
   *  `<$sprite>` atom in a leaf's display text actually widens/heightens
   *  its DOT node size, per the batch-2 decision-journal's flagged gap. */
  sprites: SpriteDimsLookup | undefined;
  /** Wave 3: Twemoji artwork by codepoint (`core/internal-emoji-store.ts`),
   *  carried SEPARATELY from `sprites` above because `spriteDimsLookupFor`
   *  reduces the registry to sprite DIMS and drops the emoji store (upstream
   *  keeps `Emoji` and `SpriteImage` apart too — see that store's doc).
   *  Threaded into `BoxSizingOpts.emojiArtwork` by `layout-dot-tree.ts
   *  #buildDotNodes` so the SIZER's use-case ellipse is fitted to the REAL
   *  artwork's points, not the platform-glyph fallback's: `Footprint`
   *  collects what is actually DRAWN, so a renderer-only wiring measures one
   *  glyph and draws another (`planning/sizer-renderer-parity.md`).
   *  `undefined` = no emoji asset store wired, the default. */
  emojiArtwork: EmojiArtworkResolver | undefined;
  /** Every node's ALWAYS-fully-qualified path (ancestor chain + own id,
   *  regardless of collision) mapped to whatever canonical key
   *  `classifyAst` actually assigned it — lets `resolveEndpoint`
   *  (layout-helpers.ts) translate a namespace-qualified link reference
   *  (`command-table.ts#resolveEndpointNamespace`) back to the right DOT
   *  node id even when that node's bare id turned out not to need
   *  disambiguation. See namespace-groups.ts's `dotKeyFor` doc + the
   *  description-dot-100 decision journal (I1b). */
  qualifiedPathToDotKey: Map<string, string>;
}

export interface EdgeDotBuildResult {
  dotEdges: DotInputEdge[];
  dotEdgeToLinkIdx: Map<string, number>;
  edgeContainerEndpoints: Map<string, EdgeContainerEndpoints>;
  /** Cluster ids referenced directly by an edge (isThereALinkFromOrToGroup);
   *  each needs a shared group-anchor point node + cluster membership. */
  groupAnchorClusterIds: Set<string>;
}
